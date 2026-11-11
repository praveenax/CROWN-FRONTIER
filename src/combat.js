import { TROOP_TYPES } from "./gameConfig.js";
import { troopTypeOf } from "./troops.js";
import { generalBonuses, promoteGeneral } from "./generals.js";
import { changePopulation } from "./settlements.js";
import { addLog, cityLabel, generalLabel, generalPast, rememberGeneral } from "./chronicle.js";

function combatStatInHundredths(army, stat) {
  if (army.kind !== "army") return 10000;
  const base = TROOP_TYPES[troopTypeOf(army)][stat];
  const bonus = stat === "attack" ? generalBonuses(army.general).attack : 0;
  return base * (100 + bonus);
}

function archerVolley(archers, target) {
  if (troopTypeOf(archers) !== "archer") return 0;
  const hits = Math.floor(archers.troops / 4);
  return Math.min(
    target.troops,
    target.kind === "army" && troopTypeOf(target) === "knight"
      ? Math.floor(hits / 2)
      : hits,
  );
}

export function resolveArrival(state, army, objective) {
  const enemy = state.armies.find(
    (other) =>
      other.id !== army.id &&
      other.owner !== army.owner &&
      other.x === army.x &&
      other.y === army.y,
  );
  const city = state.cities.find(
    (place) => place.x === army.x && place.y === army.y,
  );
  const enteringCity =
    city && city.owner !== army.owner && (city.owner || army.kind === "army");
  if (!enemy && !enteringCity) return;
  const operationId = `operation-${state.nextOperationId++}`;
  const location = city ? cityLabel(city) : `(${army.x + 1}, ${army.y + 1})`;
  const category =
    army.owner === "barbarian" && city && !city.capital && !enemy?.general
      ? "raid"
      : "major";
  addLog(
    state,
    `[${operationId}] ${army.name} [${army.id}] begins action at ${location}: ${army.troops} troops; commander: ${generalLabel(army.general)}. ${objective}. Commander history: ${generalPast(state, army.general)}.${enemy?.general ? ` Opposing commander: ${generalLabel(enemy.general)}. History: ${generalPast(state, enemy.general)}.` : ""}`,
    category,
  );
  if (enemy) {
    const attackerStat = combatStatInHundredths(army, "attack");
    const defenderStat = combatStatInHundredths(enemy, "defense");
    const attackerFavoredBeforeVolley =
      army.troops * attackerStat > enemy.troops * defenderStat;
    const attackerVolley = archerVolley(army, enemy);
    const defenderVolley = archerVolley(enemy, army);
    army.troops -= defenderVolley;
    enemy.troops -= attackerVolley;
    const attackerStrength = army.troops;
    const defenderStrength = enemy.troops;
    const attackerPower = attackerStrength * attackerStat;
    const defenderPower = defenderStrength * defenderStat;
    const describe = (unit) =>
      `${unit.name} [${state.kingdoms[unit.owner].name}]${unit.general ? ` (General ${unit.general.name})` : ""}`;
    if (!attackerStrength && !defenderStrength) {
      state.armies = state.armies.filter(
        (unit) => unit.id !== army.id && unit.id !== enemy.id,
      );
      addLog(
        state,
        `${describe(army)} and ${describe(enemy)} were destroyed by archer volleys at ${location}. [${operationId}]`,
        category,
      );
      rememberGeneral(
        state,
        army.general,
        `lost at ${location} in ${operationId}`,
      );
      rememberGeneral(
        state,
        enemy.general,
        `lost at ${location} in ${operationId}`,
      );
      return;
    }
    const attackerWins =
      attackerStrength > 0 &&
      (defenderStrength === 0 || attackerPower > defenderPower);
    const winner = attackerWins ? army : enemy;
    const loser = attackerWins ? enemy : army;
    if (loser.troops > 0) {
      const winnerStat = combatStatInHundredths(
        winner,
        attackerWins ? "attack" : "defense",
      );
      winner.troops = Math.max(
        1,
        Math.min(
          winner.troops,
          Math.ceil(Math.abs(attackerPower - defenderPower) / winnerStat),
        ),
      );
    }
    state.armies = state.armies.filter((unit) => unit.id !== loser.id);
    const decidingVolley =
      (attackerVolley > 0 || defenderVolley > 0) &&
      attackerFavoredBeforeVolley !== attackerWins;
    const closeFight =
      Math.min(attackerPower, defenderPower) >=
      Math.max(attackerPower, defenderPower) * 0.9;
    const fightingBonus = generalBonuses(army.general).attack;
    const fightingReport = fightingBonus ? ` Fighting added +${fightingBonus}% attack.` : "";
    const volleyReport =
      attackerVolley || defenderVolley
        ? ` Archer volleys caused ${defenderVolley} attacker and ${attackerVolley} defender casualties.`
        : "";
    addLog(
      state,
      `${describe(army)} attacked ${describe(enemy)} at ${city ? `${city.name} ` : ""}(${army.x + 1}, ${army.y + 1}): ${attackerStrength} vs ${defenderStrength} troops (${attackerPower / 100} attack vs ${defenderPower / 100} defense).${volleyReport}${fightingReport} ${describe(winner)} defeated ${describe(loser)} with ${winner.troops} remaining; ${loser.general ? `General ${loser.general.name} was lost.` : "the defeated force was destroyed."} [${operationId}] Attacker survivors: ${attackerWins ? army.troops : 0}; defender survivors: ${attackerWins ? 0 : enemy.troops}.${city ? ` Settlement: ${cityLabel(city)}.` : ""}`,
      category,
    );
    if (decidingVolley || closeFight) {
      const outcome = decidingVolley
        ? `Archer volleys tipped the battle in favor of ${describe(winner)}.`
        : `${describe(winner)} narrowly won with ${winner.troops} ${winner.troops === 1 ? "soldier" : "soldiers"} remaining.`;
      addLog(state, `[${operationId}] Battle at ${location}: ${outcome}`);
    }
    rememberGeneral(
      state,
      winner.general,
      `won battle at ${location} in ${operationId}, ${winner.troops} survivors`,
    );
    rememberGeneral(
      state,
      loser.general,
      `defeated and lost at ${location} in ${operationId}`,
    );
    if (loser.general)
      addLog(
        state,
        `[${operationId}] General ${generalLabel(loser.general)} was lost at ${location}. History: ${generalPast(state, loser.general)}.`,
      );
    promoteGeneral(state, winner, operationId);
    if (!attackerWins) return;
  }
  if (
    city &&
    city.owner !== army.owner &&
    army.kind === "army" &&
    city.defense > 0 &&
    troopTypeOf(army) === "archer"
  ) {
    const arrows = Math.min(city.defense, Math.floor(army.troops / 4));
    city.defense -= arrows;
    if (arrows > 0)
      addLog(
        state,
        `${army.name} fired a siege volley at ${city.name}, reducing its defenses by ${arrows}.`,
        category,
      );
  }
  if (
    city &&
    city.owner !== army.owner &&
    (city.owner || army.kind === "army") &&
    city.defense > 0
  ) {
    const attackStat = combatStatInHundredths(army, "attack");
    const strength = Math.floor(army.troops * attackStat / 10000);
    const fighting = generalBonuses(army.general).attack;
    const fightingReport = fighting ? ` Fighting added +${fighting}% attack.` : "";
    const defense = city.defense;
    if (strength <= defense) {
      city.defense = Math.max(1, defense - strength);
      state.armies = state.armies.filter((unit) => unit.id !== army.id);
      addLog(
        state,
        `${army.name} [${state.kingdoms[army.owner].name}] attacked ${city.name}'s defenses (${city.x + 1}, ${city.y + 1}): ${strength} vs ${defense}. The city held with ${city.defense} defense remaining${army.general ? `; General ${army.general.name} was lost` : ""}.${fightingReport} [${operationId}] Attacker survivors: 0; settlement: ${cityLabel(city)}.`,
        category,
      );
      rememberGeneral(
        state,
        army.general,
        `defeated and lost attacking defenses at ${cityLabel(city)} in ${operationId}`,
      );
      if (army.general)
        addLog(
          state,
          `[${operationId}] General ${generalLabel(army.general)} was lost at ${cityLabel(city)}. History: ${generalPast(state, army.general)}.`,
        );
      return;
    }
    army.troops -= Math.ceil(defense * 10000 / attackStat);
    city.defense = 0;
    addLog(
      state,
      `${army.name} [${state.kingdoms[army.owner].name}] breached ${city.name}'s defenses (${city.x + 1}, ${city.y + 1}): ${strength} vs ${defense}, with ${army.troops} troops remaining.${fightingReport} [${operationId}] Settlement: ${cityLabel(city)}.`,
      category,
    );
    rememberGeneral(
      state,
      army.general,
      `breached defenses at ${cityLabel(city)} in ${operationId}, ${army.troops} survivors`,
    );
    promoteGeneral(state, army, operationId);
  }
  if (city?.owner && army.owner === "barbarian") {
    const resources = state.resources[city.owner];
    const lost = {
      gold: Math.min(resources.gold, 30),
      food: Math.min(resources.food, 20),
      population: Math.min(city.population, 50),
    };
    resources.gold = Math.max(0, resources.gold - 30);
    resources.food = Math.max(0, resources.food - 20);
    changePopulation(state, city, city.population - lost.population);
    addLog(
      state,
      `Barbarians raided ${city.name} (${city.x + 1}, ${city.y + 1}), owned by ${state.kingdoms[city.owner].name}, costing ${lost.gold} gold, ${lost.food} food and ${lost.population} population. [${operationId}] ${cityLabel(city)} remains under ${state.kingdoms[city.owner].name}.`,
      category,
    );
    state.armies = state.armies.filter((unit) => unit.id !== army.id);
    return;
  }
  if (city && city.owner !== army.owner && army.kind === "army") {
    const previousOwner = city.owner;
    const history = city.ownershipHistory || [
      { owner: previousOwner, sinceTurn: null },
    ];
    const previousOccupation = history[history.length - 1];
    const firstConquest = !state.cities.some((place) =>
      place.ownershipHistory
        ?.slice(1)
        .some((entry) => entry.owner === army.owner),
    );
    city.owner = army.owner;
    city.ownershipHistory = [
      ...history,
      { owner: army.owner, sinceTurn: state.turn },
    ];
    const owners = city.ownershipHistory
      .map((entry) => (entry.owner ? state.kingdoms[entry.owner].name : "Neutral"))
      .join(" → ");
    const duration =
      previousOccupation.sinceTurn === null
        ? "duration unknown"
        : `${state.turn - previousOccupation.sinceTurn} completed turns`;
    addLog(
      state,
      `${state.kingdoms[army.owner].name} claimed ${city.name} (${city.x + 1}, ${city.y + 1})${previousOwner ? ` from ${state.kingdoms[previousOwner].name}` : ""}. [${operationId}] ${cityLabel(city)}${city.capital ? " is a capital" : " is a town"}; now controlled by ${state.kingdoms[army.owner].name}.${firstConquest ? ` This is ${state.kingdoms[army.owner].name}'s first conquest.` : ""} Previous occupation: ${duration}; ownership changes: ${city.ownershipHistory.length - 1}; history: ${owners}. ${city.population} population and buildings remain; defense: ${city.defense}. Future production belongs to the new owner; treasury and rulers are unchanged. Survivors: ${army.troops}; commander: ${generalLabel(army.general)}.`,
    );
    rememberGeneral(
      state,
      army.general,
      `captured ${cityLabel(city)} in ${operationId}, ${army.troops} survivors`,
    );
  }
}
