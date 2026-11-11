import { WORLD_EVENTS } from "./worldEvents.js";
import { BUILDINGS, MOVE_RANGE } from "./gameConfig.js";
import { clamp, key } from "./coordinates.js";
import { addLog, cityLabel } from "./chronicle.js";
import { copyState, randomInt, updateGameOver } from "./gameState.js";
import { generalBonuses } from "./generals.js";
import { revealPlayer } from "./map.js";
import { changePopulation, cityDevelopment } from "./settlements.js";
import { moveUnit } from "./armyActions.js";
import {
  barbarianTurn, chooseAutoStep, enemyTurn,
  isGarrison, recruitAutomatically, spawnBarbarians, spawnRaiderBand,
} from "./ai.js";

export {
  BUILDINGS, KINGDOMS, KINGDOM_OWNERS, MAP_SIZE, MAP_SIZES, MAX_MERGED_UNITS,
  MAX_TROOPS, MOVE_RANGE, TROOP_TYPES, VIEW_SIZE,
} from "./gameConfig.js";
export { canMerge, canMoveUnit, moveUnit, recruit } from "./armyActions.js";
export { chronicleEntries } from "./chronicle.js";
export { generalBonuses } from "./generals.js";
export { cameraFor, isDiscovered, moveCamera, regionAt, terrainAt } from "./map.js";
export { createGame } from "./mapGeneration.js";
export { cityDevelopment, kingdomPopulation, kingdomStandings } from "./settlements.js";

export function buildBuilding(state, cityId, buildingId) {
  if (state.gameOver) return state;
  const city = state.cities.find(
    (place) => place.id === cityId && place.owner === "england",
  );
  const building = BUILDINGS.find((item) => item.id === buildingId);
  const resources = state.resources.england;
  if (
    !city ||
    !building ||
    cityDevelopment(city).level < building.level ||
    (city.constructedBuildings || []).includes(building.id) ||
    resources.gold < building.cost.gold ||
    resources.food < building.cost.food
  )
    return state;

  const next = copyState(state);
  const target = next.cities.find((place) => place.id === cityId);
  const oldDefense = cityDevelopment(target).defense;
  target.constructedBuildings = [
    ...(target.constructedBuildings || []),
    building.id,
  ];
  next.resources.england.gold -= building.cost.gold;
  next.resources.england.food -= building.cost.food;
  const development = cityDevelopment(target);
  target.defense = clamp(
    target.defense + development.defense - oldDefense,
    0,
    development.defense,
  );
  addLog(
    next,
    `${building.name} constructed in ${target.name} for ${building.cost.gold} gold and ${building.cost.food} food.`,
  );
  return next;
}

function worldEventOutcome(state, owner, choice) {
  const city = state.cities.reduce(
    (largest, place) => place.owner === owner && (!largest || place.population > largest.population)
      ? place : largest,
    null,
  );
  const army = state.armies.reduce(
    (largest, unit) =>
      unit.owner === owner && unit.kind === "army" &&
      (!largest || unit.troops > largest.troops) ? unit : largest,
    null,
  );
  const effects = choice.effects;
  const treasury = state.resources[owner];
  const funding = Math.min(
    1,
    effects.gold < 0 ? treasury.gold / -effects.gold : 1,
    effects.food < 0 ? treasury.food / -effects.food : 1,
  );
  const gain = (amount = 0) => amount > 0 ? Math.floor(amount * funding) : amount;
  return {
    city,
    army,
    gold: Math.max(-treasury.gold, gain(effects.gold)),
    food: Math.max(-treasury.food, gain(effects.food)),
    population: city ? Math.max(-city.population, gain(effects.population)) : 0,
    troops: army
      ? clamp(gain(effects.troops), 1 - army.troops, Math.max(0, army.maxTroops - army.troops))
      : 0,
    raiders: city ? (funding < 1 && effects.underfundedRaiders) || effects.raiders || 0 : 0,
  };
}

function describeWorldEventOutcome(outcome) {
  const signed = (value) => value > 0 ? `+${value}` : String(value);
  return [
    outcome.gold && `${signed(outcome.gold)} gold`,
    outcome.food && `${signed(outcome.food)} food`,
    outcome.population && `${signed(outcome.population)} population in ${outcome.city.name}`,
    outcome.troops && `${signed(outcome.troops)} soldiers in ${outcome.army.name}`,
  ].filter(Boolean);
}

export function worldEventChoices(state, owner = "england") {
  const event = WORLD_EVENTS.find((entry) => entry.id === state.pendingWorldEvent);
  if (!event) return null;
  return {
    ...event,
    choices: event.choices.map((choice) => {
      const outcome = worldEventOutcome(state, owner, choice);
      const details = describeWorldEventOutcome(outcome);
      if (outcome.raiders)
        details.push(`Risk a band of ${outcome.raiders} raiders near ${outcome.city.name}`);
      return { ...choice, summary: details.join(" · ") || "No immediate change" };
    }),
  };
}

function chooseWorldEventResponse(state, owner, event) {
  const resources = state.resources[owner];
  const goldWeight = 0.25 + 200 / (resources.gold + 200);
  const foodWeight = 0.25 + 200 / (resources.food + 200);
  let bestChoice = 0;
  let bestScore = -Infinity;
  for (const [index, choice] of event.choices.entries()) {
    const result = worldEventOutcome(state, owner, choice);
    const score = result.gold * goldWeight + result.food * foodWeight +
      result.population * 0.15 + result.troops * 2 - result.raiders * 1.5;
    if (score > bestScore) {
      bestScore = score;
      bestChoice = index;
    }
  }
  return bestChoice;
}

export function resolveWorldEvent(state, playerChoice) {
  const event = WORLD_EVENTS.find((entry) => entry.id === state.pendingWorldEvent);
  if (!event || state.gameOver ||
    (playerChoice !== undefined &&
      (!Number.isInteger(playerChoice) || !event.choices[playerChoice]))) return state;
  const next = copyState(state);
  next.pendingWorldEvent = null;
  for (const owner of state.kingdomOwners) {
    if (!next.cities.some((city) => city.owner === owner) &&
      !next.armies.some((unit) => unit.owner === owner)) continue;
    const index = owner === "england" && playerChoice !== undefined
      ? playerChoice : chooseWorldEventResponse(next, owner, event);
    const choice = event.choices[index];
    const outcome = worldEventOutcome(next, owner, choice);
    next.resources[owner].gold += outcome.gold;
    next.resources[owner].food += outcome.food;
    if (outcome.population)
      changePopulation(next, outcome.city, outcome.city.population + outcome.population);
    if (outcome.troops) outcome.army.troops += outcome.troops;
    const details = describeWorldEventOutcome(outcome);
    if (outcome.raiders) {
      const band = spawnRaiderBand(next, outcome.city, outcome.raiders);
      details.push(band ? `${band.troops} raiders appeared near ${outcome.city.name}`
        : `no horde appeared near ${outcome.city.name}`);
    }
    addLog(next, `World event · ${event.title}: ${state.kingdoms[owner].name} chose “${choice.label}”. ${details.join("; ") || "No immediate change"}.`);
  }
  return next;
}

function scheduleWorldEvent(state) {
  if (state.gameOver || state.turn < state.nextWorldEventTurn) return;
  const deck = state.worldEventDeck.length
    ? state.worldEventDeck
    : WORLD_EVENTS.map((event) => event.id);
  const available = deck.filter((id) => id !== state.lastWorldEvent);
  const pool = available.length ? available : deck;
  const id = pool[randomInt(state, pool.length)];
  state.worldEventDeck = deck.filter((entry) => entry !== id);
  state.lastWorldEvent = id;
  state.pendingWorldEvent = id;
  state.nextWorldEventTurn = state.turn + 20 + randomInt(state, 11);
  const event = WORLD_EVENTS.find((entry) => entry.id === id);
  addLog(state, `World event · ${event.title}: ${event.description}`);
}

export function endTurn(state, { automatic = false } = {}) {
  if (state.gameOver || state.pendingWorldEvent) return state;
  let next = copyState(state);
  next.turn++;
  addLog(
    next,
    `Turn ${next.turn} begins. Your cities have produced resources.`,
  );
  const garrisons = new Map(next.armies
    .filter((army) => army.kind === "army")
    .map((army) => [key(army.x, army.y), army]));
  for (const city of next.cities) {
    if (city.owner) {
      const development = cityDevelopment(city);
      const garrison = garrisons.get(key(city.x, city.y));
      const charisma = garrison?.owner === city.owner
        ? generalBonuses(garrison.general).growth : 0;
      const extraGrowth = Math.floor(development.growth * charisma / 100);
      const growth = development.growth + extraGrowth;
      const growthReport = extraGrowth ? ` (+${extraGrowth} from Charisma)` : "";
      next.resources[city.owner].gold += development.gold;
      next.resources[city.owner].food += development.food;
      addLog(
        next,
        `${cityLabel(city)} [${state.kingdoms[city.owner].name}] produced ${development.gold} gold and ${development.food} food and grew by ${growth} population${growthReport}.`,
        "production",
      );
      changePopulation(next, city, city.population + growth);
    }
    city.defense = cityDevelopment(city).defense;
  }
  for (const army of next.armies) {
    if (!isGarrison(next, army) || army.troops >= army.maxTroops) continue;
    const recoveryRate = 10 + generalBonuses(army.general).recovery;
    const recovered = Math.min(
      Math.ceil(army.maxTroops * recoveryRate / 100),
      army.maxTroops - army.troops,
    );
    army.troops += recovered;
    const city = next.cities.find(
      (place) =>
        place.owner === army.owner && place.x === army.x && place.y === army.y,
    );
    addLog(
      next,
      `${army.name} [${state.kingdoms[army.owner].name}] recovered ${recovered} soldiers in ${city.name} (${army.troops}/${army.maxTroops}). Recovery rate: ${recoveryRate}%. Unit: ${army.id}; settlement: ${cityLabel(city)}.`,
      "recovery",
    );
  }
  for (const owner of next.kingdomOwners.slice(1))
    next = enemyTurn(next, owner);
  next = barbarianTurn(next);
  spawnBarbarians(next);
  for (const unit of next.armies)
    if (unit.owner === "england") unit.moves = MOVE_RANGE;
  revealPlayer(next);
  updateGameOver(next);
  scheduleWorldEvent(next);
  return automatic && next.pendingWorldEvent ? resolveWorldEvent(next) : next;
}

export function autoplayStep(state) {
  if (state.gameOver) return { state, stopped: state.gameOver.message };
  if (state.pendingWorldEvent) return { state: resolveWorldEvent(state) };
  const playerUnits = state.armies.filter((unit) => unit.owner === "england");
  const playerCities = state.cities.filter((city) => city.owner === "england");
  if (!playerUnits.length && !playerCities.length) {
    return {
      state,
      stopped: `Autoplay stopped: ${state.kingdoms.england.name} has no settlements or units.`,
    };
  }
  if (
    !state.cities.some((city) => city.owner !== "england") &&
    !state.armies.some((unit) => unit.owner !== "england")
  ) {
    return {
      state,
      stopped: "Autoplay stopped: all settlements are under your control.",
    };
  }

  for (const unit of playerUnits) {
    if (unit.moves < 1 || isGarrison(state, unit)) continue;
    const step = chooseAutoStep(state, unit, true);
    if (step) {
      const next = moveUnit(state, unit.id, step.x, step.y, step.objective);
      const survivor = next.armies.find(
        (army) =>
          army.owner === unit.owner && army.x === step.x && army.y === step.y,
      );
      return {
        state: next,
        unitId: survivor?.id,
        position: { x: step.x, y: step.y },
      };
    }
  }

  if (
    playerUnits.filter((unit) => unit.kind === "army").length <
    playerCities.length + 4
  ) {
    for (const city of playerCities) {
      const next = recruitAutomatically(state, city, "england");
      if (next !== state)
        return {
          state: next,
          unitId: `army-${state.nextId}`,
          position: next.armies.find(
            (army) => army.id === `army-${state.nextId}`,
          ),
        };
    }
  }
  return { state: endTurn(state, { automatic: true }) };
}
