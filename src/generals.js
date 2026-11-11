import gameData from "./data.json" with { type: "json" };
import { clamp } from "./coordinates.js";
import { randomInt } from "./gameState.js";
import { addLog, rememberGeneral } from "./chronicle.js";

const firstNames = gameData.names.first;
const lastNames = gameData.names.last;
const generalSkills = gameData.generalSkills;

export function generalBonuses(general) {
  const points = (skill) => clamp((general?.skills?.[skill] ?? 1) - 1, 0, 10);
  return {
    attack: points("fighting") * 4,
    recovery: points("captain") * 2,
    growth: points("charisma") * 5,
  };
}

// Keep strength in hundredths so bonus percentages cannot disturb exact ties.

export function createPersonName(state, usedNames) {
  const combinations = firstNames.length * lastNames.length;
  const start = randomInt(state, combinations);
  let name;
  for (let offset = 0; offset < combinations; offset++) {
    const index = (start + offset) % combinations;
    name = `${firstNames[Math.floor(index / lastNames.length)]} ${lastNames[index % lastNames.length]}`;
    if (!usedNames.has(name)) break;
  }
  return name;
}

export function createGeneral(state) {
  const usedNames = new Set([
    ...state.armies
      .filter((army) => army.general)
      .map((army) => army.general.name),
    ...Object.values(state.rulers),
  ]);
  const name = createPersonName(state, usedNames);
  return {
    id: `general-${state.nextGeneralId++}`,
    name,
    level: 1,
    skills: { fighting: 1, captain: 1, charisma: 1 },
  };
}

export function promoteGeneral(state, army, operationId) {
  if (!army.general) return;
  const skill = generalSkills[randomInt(state, generalSkills.length)];
  army.general.level++;
  army.general.skills[skill]++;
  const event = `promoted to level ${army.general.level} (+1 ${skill}) in ${operationId}`;
  rememberGeneral(state, army.general, event);
  addLog(
    state,
    `${army.general.name} reached level ${army.general.level} (+1 ${skill}). General ID: ${army.general.id}; operation: ${operationId}.`,
  );
}
