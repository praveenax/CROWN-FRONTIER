import { MAX_MERGED_UNITS, MAX_TROOPS, TROOP_TYPES } from "./gameConfig.js";
import { distance } from "./coordinates.js";
import { isDiscovered, revealPlayer, terrainAt } from "./map.js";
import { copyState, randomInt, updateGameOver } from "./gameState.js";
import { addLog, cityLabel, rememberGeneral } from "./chronicle.js";
import { changePopulation } from "./settlements.js";
import { createGeneral } from "./generals.js";
import { resolveArrival } from "./combat.js";
import { troopTypeOf } from "./troops.js";

export function canMerge(unit, other) {
  return (
    unit.owner === other.owner &&
    unit.kind === "army" &&
    other.kind === "army" &&
    troopTypeOf(unit) === troopTypeOf(other) &&
    !(unit.general && other.general) &&
    unit.troops + other.troops <= MAX_TROOPS &&
    unit.units + other.units <= MAX_MERGED_UNITS
  );
}

export function canMoveUnit(state, unit, x, y) {
  if (
    !unit ||
    !Number.isInteger(x) ||
    !Number.isInteger(y) ||
    x < 0 ||
    y < 0 ||
    x >= state.mapSize ||
    y >= state.mapSize ||
    distance(unit, { x, y }) !== 1
  )
    return false;
  const terrain = terrainAt(x, y);
  if (terrain === "water" || unit.moves < (terrain === "mountain" ? 2 : 1))
    return false;
  const other = state.armies.find(
    (army) => army.id !== unit.id && army.x === x && army.y === y,
  );
  return !other || other.owner !== unit.owner || canMerge(unit, other);
}

export function moveForOwner(
  state,
  id,
  x,
  y,
  owner,
  objective = `Manual move to (${x + 1}, ${y + 1})`,
) {
  const unit = state.armies.find(
    (army) => army.id === id && army.owner === owner,
  );
  if (!canMoveUnit(state, unit, x, y)) return state;
  const next = copyState(state);
  const moving = next.armies.find((army) => army.id === id);
  moving.x = x;
  moving.y = y;
  moving.moves -= terrainAt(x, y) === "mountain" ? 2 : 1;
  addLog(
    next,
    `${moving.name} [${moving.id}; ${state.kingdoms[owner].name}] moved from (${unit.x + 1}, ${unit.y + 1}) to (${x + 1}, ${y + 1}) with ${moving.troops} troops. ${objective}.`,
    "movement",
  );
  const ally = next.armies.find(
    (other) =>
      other.id !== id &&
      other.owner === owner &&
      other.x === x &&
      other.y === y,
  );
  if (ally) {
    ally.troops += moving.troops;
    ally.maxTroops = Math.min(MAX_TROOPS, ally.maxTroops + moving.maxTroops);
    ally.units += moving.units;
    ally.moves = Math.min(ally.moves, moving.moves);
    if (moving.general) ally.general = moving.general;
    next.armies = next.armies.filter((other) => other.id !== id);
    addLog(
      next,
      `${state.kingdoms[owner].name}'s ${moving.name} merged into ${ally.name} (${ally.troops} soldiers).`,
    );
    revealPlayer(next);
    return next;
  }
  resolveArrival(next, moving, objective);
  if (
    owner === "barbarian" &&
    next.armies.some((army) => army.id === id) &&
    !isDiscovered(state, unit.x, unit.y) &&
    isDiscovered(next, x, y)
  ) {
    addLog(next, `Barbarian raiders sighted near ${x + 1}, ${y + 1}.`);
  }
  revealPlayer(next);
  return next;
}

export function moveUnit(state, id, x, y, objective) {
  if (state.gameOver) return state;
  const next = moveForOwner(state, id, x, y, "england", objective);
  if (next !== state) updateGameOver(next);
  return next;
}

export function recruit(state, cityId, kind = "spearman") {
  if (state.gameOver) return state;
  return recruitForOwner(state, cityId, "england", kind);
}

export function recruitForOwner(
  state,
  cityId,
  owner,
  kind = "spearman",
  allowAdjacent = false,
) {
  if (state.gameOver) return state;
  const troopType = kind === "army" ? "spearman" : kind;
  const isScout = troopType === "scout";
  const troop = TROOP_TYPES[troopType];
  const city = state.cities.find(
    (place) => place.id === cityId && place.owner === owner,
  );
  const cost = isScout ? { gold: 30, food: 15, population: 20 } : troop?.cost;
  const resources = state.resources[owner];
  if (
    !city ||
    (!isScout && !troop) ||
    resources.gold < cost.gold ||
    resources.food < cost.food ||
    city.population < cost.population
  )
    return state;
  const occupant = state.armies.find(
    (army) => army.x === city.x && army.y === city.y,
  );
  let position = city;
  if (occupant) {
    if (!allowAdjacent || occupant.owner !== owner || occupant.kind !== "army")
      return state;
    position = [
      [1, 0],
      [0, -1],
      [-1, 0],
      [0, 1],
    ]
      .map(([dx, dy]) => ({ x: city.x + dx, y: city.y + dy }))
      .find(
        (tile) =>
          tile.x >= 0 &&
          tile.y >= 0 &&
          tile.x < state.mapSize &&
          tile.y < state.mapSize &&
          terrainAt(tile.x, tile.y) !== "water" &&
          !state.armies.some(
            (unit) => unit.x === tile.x && unit.y === tile.y,
          ) &&
          !state.cities.some(
            (place) => place.x === tile.x && place.y === tile.y,
          ),
      );
    if (!position) return state;
  }
  const next = copyState(state);
  next.resources[owner].gold -= cost.gold;
  next.resources[owner].food -= cost.food;
  const recruitingCity = next.cities.find((place) => place.id === cityId);
  changePopulation(
    next,
    recruitingCity,
    recruitingCity.population - cost.population,
  );
  const army = {
    id: `army-${next.nextId++}`,
    name: isScout
      ? "Rangers"
      : owner === "england"
        ? `${troop.name} Company`
        : `${state.kingdoms[owner].name} ${troop.name.toLowerCase()}`,
    owner,
    kind: isScout ? "scout" : "army",
    ...(!isScout ? { troopType } : {}),
    x: position.x,
    y: position.y,
    troops: isScout ? 20 : 60,
    ...(!isScout ? { maxTroops: 60 } : {}),
    units: 1,
    moves: 0,
  };
  if (!isScout && randomInt(next, 2) === 0) {
    army.general = createGeneral(next);
    rememberGeneral(next, army.general);
  }
  next.armies.push(army);
  addLog(
    next,
    `${state.kingdoms[owner].name}: ${isScout ? "Scouts recruited" : `${troop.name} recruited`} in ${city.name}${army.general ? ` under General ${army.general.name} [${army.general.id}]` : ""}. Ready next turn. City: ${cityLabel(city)}; unit: ${army.id}; cost: ${cost.gold} gold, ${cost.food} food, ${cost.population} population.`,
    "recruitment",
  );
  revealPlayer(next);
  return next;
}
