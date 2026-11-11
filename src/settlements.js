import gameData from "./data.json" with { type: "json" };
import { BUILDINGS } from "./gameConfig.js";
import { clamp } from "./coordinates.js";
import { addLog } from "./chronicle.js";
import { regionAt } from "./map.js";

const cityLevels = gameData.cityLevels;

export function cityDevelopment(city) {
  const index = cityLevels.findLastIndex(
    (level) => city.population >= level.population,
  );
  const level = cityLevels[index];
  const built = BUILDINGS.filter((building) =>
    (city.constructedBuildings || []).includes(building.id),
  );
  const bonus = built.reduce(
    (total, building) => ({
      gold: total.gold + (building.bonus.gold || 0),
      food: total.food + (building.bonus.food || 0),
      growth: total.growth + (building.bonus.growth || 0),
      defense: total.defense + (building.bonus.defense || 0),
    }),
    { gold: 0, food: 0, growth: 0, defense: 0 },
  );
  return {
    ...level,
    buildings: [...level.buildings, ...built.map((building) => building.name)],
    gold: level.gold + bonus.gold,
    food: level.food + bonus.food,
    growth: level.growth + bonus.growth,
    defense: level.defense + bonus.defense,
    level: index + 1,
    nextPopulation: cityLevels[index + 1]?.population ?? null,
  };
}

export function kingdomPopulation(state, owner) {
  return state.cities
    .filter((city) => city.owner === owner)
    .reduce((total, city) => total + city.population, 0);
}

export function kingdomStandings(state) {
  const { mapSize } = state;
  const land = Object.fromEntries(state.kingdomOwners.map((owner) => [owner, 0]));
  for (let y = 0; y < mapSize; y++) {
    for (let x = 0; x < mapSize; x++) {
      const owner = regionAt(state.cities, x, y)?.owner;
      if (owner && owner in land) land[owner]++;
    }
  }
  return state.kingdomOwners.map((owner) => {
    const cities = state.cities.filter((city) => city.owner === owner);
    const population = kingdomPopulation(state, owner);
    const production = cities.reduce((total, city) => {
      const development = cityDevelopment(city);
      return total + development.gold + development.food;
    }, 0);
    const economic =
      state.resources[owner].gold +
      state.resources[owner].food +
      population +
      production * 10;
    const military =
      state.armies
        .filter((army) => army.owner === owner)
        .reduce((total, army) => total + army.troops, 0) +
      cities.reduce((total, city) => total + city.defense, 0);
    const landScore = land[owner] * 10;
    return {
      owner,
      economic,
      military,
      land: landScore,
      total: economic + military + landScore,
    };
  }).sort((a, b) => b.total - a.total);
}

export function changePopulation(state, city, population) {
  const old = cityDevelopment(city);
  city.population = Math.max(0, population);
  const current = cityDevelopment(city);
  if (current.level !== old.level) {
    city.defense = clamp(
      city.defense + Math.max(0, current.defense - old.defense),
      0,
      current.defense,
    );
    addLog(
      state,
      `${city.name} ${current.level > old.level ? "reached" : "fell to"} level ${current.level} (${city.population} population). Buildings: ${current.buildings.join(", ")}.`,
    );
  }
}
