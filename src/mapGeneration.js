import gameData from "./data.json" with { type: "json" };
import { KINGDOMS, KINGDOM_OWNERS, MAP_SIZE, MAP_SIZES, MOVE_RANGE } from "./gameConfig.js";
import { distance } from "./coordinates.js";
import { revealPlayer, terrainAt } from "./map.js";
import { cityDevelopment } from "./settlements.js";
import { createGeneral, createPersonName } from "./generals.js";
import { randomInt } from "./gameState.js";
import { addLog, cityLabel, rememberGeneral } from "./chronicle.js";
import { WORLD_EVENTS } from "./worldEvents.js";

const cityNames = gameData.names.cities;

function findStartingTile(x, y, mapSize, cities) {
  for (let radius = 0; radius < mapSize; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      const dx = radius - Math.abs(dy);
      for (const column of dx ? [x - dx, x + dx] : [x]) {
        const row = y + dy;
        if (column >= 0 && column < mapSize && row >= 0 && row < mapSize &&
          terrainAt(column, row) !== "water" &&
          !cities.some((city) => city.x === column && city.y === row)) {
          return { x: column, y: row };
        }
      }
    }
  }
  throw new Error("No land available for a starting settlement");
}

export function createGame(
  seed = Math.floor(Math.random() * 4294967296),
  { mapSize = MAP_SIZE, opponentCount = KINGDOM_OWNERS.length - 1, kingdoms = {} } = {},
) {
  if (!MAP_SIZES.includes(mapSize)) throw new RangeError("Unsupported map size");
  if (!Number.isInteger(opponentCount) || opponentCount < 1 || opponentCount >= KINGDOM_OWNERS.length)
    throw new RangeError("Unsupported opponent count");

  const kingdomOwners = KINGDOM_OWNERS.slice(0, opponentCount + 1);
  const campaignKingdoms = { barbarian: KINGDOMS.barbarian };
  for (const owner of kingdomOwners) {
    const defaults = KINGDOMS[owner];
    const custom = kingdoms[owner];
    campaignKingdoms[owner] = {
      ...defaults,
      name: custom?.name?.trim().slice(0, 40) || defaults.name,
      color: /^#[0-9a-f]{6}$/i.test(custom?.color) ? custom.color : defaults.color,
    };
  }

  const cities = [];
  for (const city of gameData.initialCities) {
    if (city.owner && !kingdomOwners.includes(city.owner)) continue;
    const x = Math.floor(city.x * mapSize / MAP_SIZE);
    const y = Math.floor(city.y * mapSize / MAP_SIZE);
    const position = findStartingTile(x, y, mapSize, cities);
    cities.push({
      ...city,
      ...position,
      name: city.capital ? campaignKingdoms[city.owner].capital : city.name,
    });
  }
  const settlementGeneration = gameData.settlementGeneration;
  let i = 0;
  for (
    let y = settlementGeneration.start;
    y < mapSize;
    y += settlementGeneration.spacing
  ) {
    for (
      let x = settlementGeneration.start;
      x < mapSize;
      x += settlementGeneration.spacing
    ) {
      const cx =
        x +
        ((y * 3 + x) % settlementGeneration.jitterModulo) -
        settlementGeneration.jitterOffset;
      const cy =
        y +
        ((x * 7 + y) % settlementGeneration.jitterModulo) -
        settlementGeneration.jitterOffset;
      if (
        cx < 0 || cy < 0 || cx >= mapSize || cy >= mapSize ||
        terrainAt(cx, cy) === "water" ||
        cities.some(
          (city) =>
            distance(city, { x: cx, y: cy }) <
            settlementGeneration.minimumCityDistance,
        )
      )
        continue;
      const name =
        cityNames[(i + settlementGeneration.cityNameOffset) % cityNames.length];
      cities.push({ id: `town-${i}`, name, x: cx, y: cy, owner: null });
      i++;
    }
    for (const city of cities) {
      city.population = city.capital
        ? gameData.startingPopulation.capital
        : gameData.startingPopulation.settlement;
      city.defense = cityDevelopment(city).defense;
    }
  }
  for (const city of cities)
    city.ownershipHistory = [{ owner: city.owner, sinceTurn: 1 }];
  const playerCapital = cities.find((city) => city.owner === "england");
  const armies = [
    {
      ...gameData.startingArmy,
      owner: "england",
      kind: "army",
      x: playerCapital.x,
      y: playerCapital.y,
      maxTroops: gameData.startingArmy.troops,
      moves: MOVE_RANGE,
    },
    ...kingdomOwners.slice(1).map((owner, index) => {
      const city = cities.find((c) => c.owner === owner);
      return {
        id: `enemy-${index}`,
        name: `${campaignKingdoms[owner].name} host`,
        owner,
        kind: "army",
        troopType: gameData.enemyArmy.troopType,
        x: city.x,
        y: city.y,
        troops: gameData.enemyArmy.troops,
        maxTroops: gameData.enemyArmy.troops,
        units: gameData.enemyArmy.units,
        moves: MOVE_RANGE,
      };
    }),
  ];
  const state = {
    turn: 1,
    mapSize,
    kingdomOwners,
    kingdoms: campaignKingdoms,
    cities,
    armies,
    resources: Object.fromEntries(
      kingdomOwners.map((owner) => [
        owner,
        { ...gameData.startingResources },
      ]),
    ),
    rulers: {},
    discovered: {},
    nextId: 2,
    nextGeneralId: 1,
    nextOperationId: 1,
    randomSeed: seed >>> 0,
    log: [],
    logEvents: [],
    generalHistory: {},
    gameOver: null,
    nextWorldEventTurn: 21 + randomInt({ randomSeed: (seed ^ 0x6d2b79f5) >>> 0 }, 11),
    worldEventDeck: WORLD_EVENTS.map((event) => event.id),
    pendingWorldEvent: null,
  };
  state.armies[0].general = createGeneral(state);
  rememberGeneral(state, state.armies[0].general);
  const rulerRandom = { randomSeed: (seed ^ 0x9e3779b9) >>> 0 };
  const usedNames = new Set([state.armies[0].general.name]);
  for (const owner of state.kingdomOwners) {
    const name = createPersonName(rulerRandom, usedNames);
    state.rulers[owner] = name;
    usedNames.add(name);
  }
  addLog(state, "A new chapter begins. Your kingdom awaits.");
  for (const city of cities.filter((place) => place.capital)) {
    addLog(
      state,
      `${state.kingdoms[city.owner].name} established its capital at ${city.name} (${city.x + 1}, ${city.y + 1}), ruled by ${state.rulers[city.owner]}.`,
    );
  }
  addLog(
    state,
    `${state.armies[0].general.name} [${state.armies[0].general.id}] leads the Royal Guard in ${cityLabel(cities.find((city) => city.id === "london"))}.`,
  );
  revealPlayer(state);
  return state;
}
