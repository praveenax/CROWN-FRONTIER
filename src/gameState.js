import { addLog } from "./chronicle.js";

export function randomInt(state, max) {
  state.randomSeed = (Math.imul(state.randomSeed, 1664525) + 1013904223) >>> 0;
  return Math.floor((state.randomSeed / 4294967296) * max);
}

export function copyState(state) {
  return {
    ...state,
    cities: state.cities.map((city) => ({
      ...city,
      ...(city.constructedBuildings
        ? { constructedBuildings: [...city.constructedBuildings] }
        : {}),
    })),
    armies: state.armies.map((army) => ({
      ...army,
      ...(army.general
        ? { general: { ...army.general, skills: { ...army.general.skills } } }
        : {}),
    })),
    resources: Object.fromEntries(
      Object.entries(state.resources).map(([owner, resources]) => [
        owner,
        { ...resources },
      ]),
    ),
    discovered: { ...state.discovered },
    log: [...state.log],
    logEvents: [...state.logEvents],
    generalHistory: { ...state.generalHistory },
  };
}

export function updateGameOver(state) {
  if (state.gameOver) return;
  const hasSettlements = state.cities.some((city) => city.owner === "england");
  const hasUnits = state.armies.some((unit) => unit.owner === "england");
  if (!hasSettlements && !hasUnits) {
    state.gameOver = {
      outcome: "defeat",
      title: "The Kingdom Has Fallen",
      message: "Your last settlement and army have been lost.",
    };
  } else if (
    state.cities.length > 0 &&
    state.cities.every((city) => city.owner === "england") &&
    !state.armies.some((unit) => unit.owner !== "england")
  ) {
    state.gameOver = {
      outcome: "victory",
      title: "The Realm Is United",
      message:
        "Every settlement is under your banner, and no rival forces remain.",
    };
  }
  if (state.gameOver)
    addLog(state, state.gameOver.title + ". " + state.gameOver.message);
}
