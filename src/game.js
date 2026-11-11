export const MAP_SIZE = 100;
export const VIEW_SIZE = 8;
export const MOVE_RANGE = 3;
export const MAX_TROOPS = 300;
export const MAX_MERGED_UNITS = 5;
export const KINGDOMS = {
  england: { name: "Alderwyn", color: "#cfaa67", capital: "Crownstead" },
  france: { name: "Valoria", color: "#78a4bb", capital: "Lunebelle" },
  castile: { name: "Karthaine", color: "#c97d66", capital: "Solmere" },
  norway: { name: "Eirengard", color: "#a995c0", capital: "Frostharbor" },
  barbarian: { name: "Barbarians", color: "#9e4f43" },
};
export const TROOP_TYPES = {
  spearman: {
    name: "Spearmen",
    description: "Defensive infantry with strong protection in battle.",
    cost: { gold: 60, food: 40, population: 60 },
    attack: 100,
    defense: 150,
  },
  swordsman: {
    name: "Swordsmen",
    description: "Hard-hitting infantry with a strong attack.",
    cost: { gold: 75, food: 40, population: 60 },
    attack: 150,
    defense: 100,
  },
  archer: {
    name: "Archers",
    description: "Fire a pre-battle volley and weaken city defenses during sieges.",
    cost: { gold: 70, food: 45, population: 60 },
    attack: 80,
    defense: 80,
  },
  knight: {
    name: "Knights",
    description: "Powerful attackers with moderate defense and resistance to arrows.",
    cost: { gold: 110, food: 60, population: 60 },
    attack: 180,
    defense: 110,
  },
};
const KINGDOM_OWNERS = ["england", "france", "castile", "norway"];

function troopTypeOf(army) {
  return army.troopType && TROOP_TYPES[army.troopType] ? army.troopType : "spearman";
}

function combatStat(army, stat) {
  return army.kind === "army" ? TROOP_TYPES[troopTypeOf(army)][stat] : 100;
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

const cityNames = [
  "Ashford",
  "Westhaven",
  "Oakheart",
  "Rivermouth",
  "Stonebridge",
  "Highmere",
  "Dunwich",
  "Eldham",
  "Northwatch",
  "Rosehaven",
  "Whitmoor",
  "Greenford",
  "Fairhaven",
  "Thornfield",
  "Bracken",
  "Redwater",
  "Kingswell",
  "Alderwick",
  "Greyford",
  "Eastmere",
  "Millhaven",
  "Foxhollow",
  "Westerly",
  "Pinehurst",
  "Blackmere",
  "Hawkridge",
  "Larkspur",
  "Goldcrest",
  "Havenwood",
  "Briarfield",
  "Longford",
  "Winterfell",
];
const firstNames = [
  "Alden",
  "Beatrice",
  "Cedric",
  "Diana",
  "Edmund",
  "Freya",
  "Gareth",
  "Helena",
  "Isabel",
  "Jonas",
  "Leona",
  "Rowan",
  "Matilda",
  "Oswald",
  "Elise",
  "Victor",
  "Adrian",
  "Aelira",
  "Alaric",
  "Amara",
  "Ansel",
  "Aria",
  "Bastian",
  "Brenna",
  "Calista",
  "Corin",
  "Darian",
  "Elara",
  "Emrys",
  "Evelyn",
  "Fenric",
  "Gwendolyn",
  "Hadrian",
  "Ilyana",
  "Jasper",
  "Kaelen",
  "Liora",
  "Lucian",
  "Mira",
  "Nolan",
  "Odessa",
  "Orin",
  "Rhiannon",
  "Selene",
  "Seraphina",
  "Tavian",
  "Thea",
  "Tristan",
  "Valeria",
  "Wystan",
];
const lastNames = [
  "Ashford",
  "Blackwood",
  "Caldwell",
  "Drake",
  "Fairfax",
  "Hawthorne",
  "Langley",
  "Mercer",
  "Northwood",
  "Ravenscroft",
  "Sterling",
  "Thorne",
  "Valen",
  "Westbrook",
  "Wilder",
  "York",
  "Aldercrest",
  "Amberfall",
  "Arden",
  "Briarwood",
  "Brightmoor",
  "Cindervale",
  "Corven",
  "Dawnridge",
  "Duskwood",
  "Everwinter",
  "Falken",
  "Frostmere",
  "Goldwyn",
  "Greycastle",
  "Harrow",
  "Ironwood",
  "Kingsley",
  "Larkspur",
  "Mooncrest",
  "Morrow",
  "Oakenshield",
  "Ravenwood",
  "Redwyne",
  "Rookwood",
  "Silvermere",
  "Skyhaven",
  "Stormwind",
  "Sundale",
  "Thornvale",
  "Vallen",
  "Waverly",
  "Whitehall",
  "Windermere",
  "Winterbourne",
];
const lakes = [
  [12, 12],
  [39, 13],
  [60, 12],
  [88, 10],
  [9, 30],
  [43, 28],
  [62, 29],
  [90, 37],
  [11, 63],
  [27, 59],
  [59, 57],
  [91, 56],
  [17, 82],
  [39, 76],
  [58, 84],
  [90, 87],
];
const generalSkills = ["fighting", "captain", "charisma"];
const cityLevels = [
  {
    population: 0,
    buildings: ["Farm", "Market", "Palisade"],
    gold: 12,
    food: 20,
    growth: 80,
    defense: 20,
  },
  {
    population: 500,
    buildings: ["Farm", "Market", "Palisade", "Guildhall"],
    gold: 18,
    food: 30,
    growth: 100,
    defense: 30,
  },
  {
    population: 1000,
    buildings: ["Farm", "Market", "Palisade", "Guildhall", "Bank"],
    gold: 25,
    food: 45,
    growth: 120,
    defense: 40,
  },
  {
    population: 2000,
    buildings: [
      "Farm",
      "Market",
      "Palisade",
      "Guildhall",
      "Bank",
      "Stone walls",
    ],
    gold: 35,
    food: 60,
    growth: 150,
    defense: 50,
  },
];
export const BUILDINGS = [
  {
    id: "granary",
    name: "Granary",
    level: 1,
    cost: { gold: 45, food: 20 },
    bonus: { food: 15, growth: 30 },
    effect: "+15 food and +30 growth per turn",
  },
  {
    id: "watchtower",
    name: "Watchtower",
    level: 1,
    cost: { gold: 60, food: 15 },
    bonus: { defense: 10 },
    effect: "+10 maximum city defense",
  },
  {
    id: "trading-post",
    name: "Trading Post",
    level: 2,
    cost: { gold: 50, food: 25 },
    bonus: { gold: 10 },
    effect: "+10 gold per turn",
  },
  {
    id: "academy",
    name: "Academy",
    level: 3,
    cost: { gold: 90, food: 40 },
    bonus: { growth: 100 },
    effect: "+100 growth per turn",
  },
];
const key = (x, y) => `${x},${y}`;
const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

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

export function regionAt(cities, x, y) {
  return cities.reduce(
    (closest, city) =>
      !closest ||
      Math.abs(city.x - x) + Math.abs(city.y - y) <
        Math.abs(closest.x - x) + Math.abs(closest.y - y)
        ? city
        : closest,
    null,
  );
}

export function kingdomStandings(state) {
  const land = Object.fromEntries(KINGDOM_OWNERS.map((owner) => [owner, 0]));
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const owner = regionAt(state.cities, x, y)?.owner;
      if (owner && owner in land) land[owner]++;
    }
  }
  return KINGDOM_OWNERS.map((owner) => {
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

export function terrainAt(x, y) {
  const n = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
  const band =
    Math.sin(x * 0.19) + Math.cos(y * 0.16) + Math.sin((x + y) * 0.12);
  const river = x === 32 + Math.round(2 * Math.sin(y / 7)) && y % 12 > 2;
  const lake =
    [
      [46, 49],
      [18, 44],
      [65, 36],
      [82, 61],
    ].some(([cx, cy]) => (x - cx) ** 2 + (y - cy) ** 2 <= 2) ||
    lakes.some(([cx, cy]) => (x - cx) ** 2 + (y - cy) ** 2 <= 8);
  if (river || lake) return "water";
  if ((x === 48 && y === 48) || (band > 1.65 && n > 0.27)) return "mountain";
  if (band < -1.35 && n > 0.33) return "forest";
  if (n > 0.72) return "field";
  return "grass";
}

function reveal(discovered, x, y, radius) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (
        Math.abs(dx) + Math.abs(dy) <= radius &&
        x + dx >= 0 &&
        y + dy >= 0 &&
        x + dx < MAP_SIZE &&
        y + dy < MAP_SIZE
      ) {
        discovered[key(x + dx, y + dy)] = true;
      }
    }
  }
}

function revealPlayer(state) {
  for (const city of state.cities)
    if (city.owner === "england") reveal(state.discovered, city.x, city.y, 3);
  for (const army of state.armies)
    if (army.owner === "england")
      reveal(state.discovered, army.x, army.y, army.kind === "scout" ? 3 : 2);
}

function randomInt(state, max) {
  state.randomSeed = (Math.imul(state.randomSeed, 1664525) + 1013904223) >>> 0;
  return Math.floor((state.randomSeed / 4294967296) * max);
}

function createPersonName(state, usedNames) {
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

function createGeneral(state) {
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

export function createGame(seed = Math.floor(Math.random() * 4294967296)) {
  const cities = [
    {
      id: "london",
      name: KINGDOMS.england.capital,
      x: 49,
      y: 49,
      owner: "england",
      capital: true,
    },
    {
      id: "paris",
      name: KINGDOMS.france.capital,
      x: 20,
      y: 22,
      owner: "france",
      capital: true,
    },
    {
      id: "toledo",
      name: KINGDOMS.castile.capital,
      x: 78,
      y: 24,
      owner: "castile",
      capital: true,
    },
    {
      id: "bergen",
      name: KINGDOMS.norway.capital,
      x: 75,
      y: 77,
      owner: "norway",
      capital: true,
    },
    { id: "ashford", name: "Ashford", x: 52, y: 47, owner: null },
    { id: "westhaven", name: "Westhaven", x: 45, y: 52, owner: null },
  ];
  let i = 0;
  for (let y = 8; y < 100; y += 14) {
    for (let x = 8; x < 100; x += 14) {
      const cx = x + ((y * 3 + x) % 5) - 2;
      const cy = y + ((x * 7 + y) % 5) - 2;
      if (
        terrainAt(cx, cy) === "water" ||
        cities.some((city) => distance(city, { x: cx, y: cy }) < 7)
      )
        continue;
      const name = cityNames[(i + 2) % cityNames.length];
      cities.push({ id: `town-${i}`, name, x: cx, y: cy, owner: null });
      i++;
    }
    for (const city of cities) {
      city.population = city.capital ? 1200 : 300;
      city.defense = cityDevelopment(city).defense;
    }
  }
  for (const city of cities)
    city.ownershipHistory = [{ owner: city.owner, sinceTurn: 1 }];
  const armies = [
    {
      id: "army-1",
      name: "Royal Guard",
      owner: "england",
      kind: "army",
      troopType: "spearman",
      x: 49,
      y: 49,
      troops: 120,
      maxTroops: 120,
      units: 1,
      moves: MOVE_RANGE,
    },
    ...["france", "castile", "norway"].map((owner, index) => {
      const city = cities.find((c) => c.owner === owner);
      return {
        id: `enemy-${index}`,
        name: `${KINGDOMS[owner].name} host`,
        owner,
        kind: "army",
        troopType: "spearman",
        x: city.x,
        y: city.y,
        troops: 100,
        maxTroops: 100,
        units: 1,
        moves: MOVE_RANGE,
      };
    }),
  ];
  const state = {
    turn: 1,
    cities,
    armies,
    resources: Object.fromEntries(
      KINGDOM_OWNERS.map((owner) => [owner, { gold: 180, food: 150 }]),
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
  };
  state.armies[0].general = createGeneral(state);
  rememberGeneral(state, state.armies[0].general);
  const rulerRandom = { randomSeed: (seed ^ 0x9e3779b9) >>> 0 };
  const usedNames = new Set([state.armies[0].general.name]);
  for (const owner of KINGDOM_OWNERS) {
    const name = createPersonName(rulerRandom, usedNames);
    state.rulers[owner] = name;
    usedNames.add(name);
  }
  addLog(state, "A new chapter begins. Your kingdom awaits.");
  for (const city of cities.filter((place) => place.capital)) {
    addLog(
      state,
      `${KINGDOMS[city.owner].name} established its capital at ${city.name} (${city.x + 1}, ${city.y + 1}), ruled by ${state.rulers[city.owner]}.`,
    );
  }
  addLog(
    state,
    `${state.armies[0].general.name} [${state.armies[0].general.id}] leads the Royal Guard in ${cityLabel(cities.find((city) => city.id === "london"))}.`,
  );
  revealPlayer(state);
  return state;
}

export function isDiscovered(state, x, y) {
  return Boolean(state.discovered[key(x, y)]);
}

function copyState(state) {
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

function addLog(state, message, category = "major") {
  const text = `Turn ${state.turn}: ${message}`;
  state.log.unshift(text);
  state.logEvents.unshift({ turn: state.turn, category, text });
}

export function chronicleEntries(events, condensed = true) {
  const result = [];
  let groups = new Map();
  for (const event of [...events].reverse()) {
    if (condensed && event.category !== "major") {
      const key = `${event.turn}:${event.category}`;
      const group = groups.get(key);
      if (group) {
        group.count++;
        group.text = `Turn ${event.turn}: ${group.count} ${event.category} events.`;
      } else {
        const entry = { ...event, count: 1 };
        groups.set(key, entry);
        result.push(entry);
      }
    } else {
      result.push({ ...event, count: 1 });
      groups = new Map();
    }
  }
  return result.map((entry) => entry.text);
}

function rememberGeneral(state, general, event) {
  if (!general) return;
  const previous = state.generalHistory[general.id];
  state.generalHistory[general.id] = {
    id: general.id,
    name: general.name,
    events: event
      ? [...(previous?.events || []), `Turn ${state.turn}: ${event}`]
      : previous?.events || [],
  };
}

function generalLabel(general) {
  return general ? `${general.name} [${general.id}]` : "No general";
}

function generalPast(state, general) {
  const events = general && state.generalHistory[general.id]?.events;
  return events?.length
    ? events.slice(-3).join(" | ")
    : "No previous recorded actions";
}

function cityLabel(city) {
  return `${city.name} [${city.id}]`;
}

function updateGameOver(state) {
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

function changePopulation(state, city, population) {
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

function promoteGeneral(state, army, operationId) {
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

function resolveArrival(state, army, objective) {
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
    const attackerVolley = archerVolley(army, enemy);
    const defenderVolley = archerVolley(enemy, army);
    army.troops -= defenderVolley;
    enemy.troops -= attackerVolley;
    const attackerStrength = army.troops;
    const defenderStrength = enemy.troops;
    const attackerPower = attackerStrength * combatStat(army, "attack");
    const defenderPower = defenderStrength * combatStat(enemy, "defense");
    const describe = (unit) =>
      `${unit.name} [${KINGDOMS[unit.owner].name}]${unit.general ? ` (General ${unit.general.name})` : ""}`;
    if (!attackerStrength && !defenderStrength) {
      state.armies = state.armies.filter(
        (unit) => unit.id !== army.id && unit.id !== enemy.id,
      );
      addLog(
        state,
        `${describe(army)} and ${describe(enemy)} were destroyed by archer volleys at ${location}. [${operationId}]`,
        category,
      );
      rememberGeneral(state, army.general, `lost at ${location} in ${operationId}`);
      rememberGeneral(state, enemy.general, `lost at ${location} in ${operationId}`);
      return;
    }
    const attackerWins =
      attackerStrength > 0 &&
      (defenderStrength === 0 || attackerPower > defenderPower);
    const winner = attackerWins ? army : enemy;
    const loser = attackerWins ? enemy : army;
    if (loser.troops > 0) {
      const winnerStat = combatStat(winner, attackerWins ? "attack" : "defense");
      winner.troops = Math.max(
        1,
        Math.min(winner.troops, Math.ceil(Math.abs(attackerPower - defenderPower) / winnerStat)),
      );
    }
    state.armies = state.armies.filter((unit) => unit.id !== loser.id);
    const volleyReport =
      attackerVolley || defenderVolley
        ? ` Archer volleys caused ${defenderVolley} attacker and ${attackerVolley} defender casualties.`
        : "";
    addLog(
      state,
      `${describe(army)} attacked ${describe(enemy)} at ${city ? `${city.name} ` : ""}(${army.x + 1}, ${army.y + 1}): ${attackerStrength} vs ${defenderStrength} troops (${attackerPower} attack vs ${defenderPower} defense).${volleyReport} ${describe(winner)} defeated ${describe(loser)} with ${winner.troops} remaining; ${loser.general ? `General ${loser.general.name} was lost.` : "the defeated force was destroyed."} [${operationId}] Attacker survivors: ${attackerWins ? army.troops : 0}; defender survivors: ${attackerWins ? 0 : enemy.troops}.${city ? ` Settlement: ${cityLabel(city)}.` : ""}`,
      category,
    );
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
    const strength = Math.floor(
      (army.troops * combatStat(army, "attack")) / 100,
    );
    const defense = city.defense;
    if (strength <= defense) {
      city.defense = Math.max(1, defense - strength);
      state.armies = state.armies.filter((unit) => unit.id !== army.id);
      addLog(
        state,
        `${army.name} [${KINGDOMS[army.owner].name}] attacked ${city.name}'s defenses (${city.x + 1}, ${city.y + 1}): ${strength} vs ${defense}. The city held with ${city.defense} defense remaining${army.general ? `; General ${army.general.name} was lost` : ""}. [${operationId}] Attacker survivors: 0; settlement: ${cityLabel(city)}.`,
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
    army.troops -= Math.ceil(
      (defense * 100) / combatStat(army, "attack"),
    );
    city.defense = 0;
    addLog(
      state,
      `${army.name} [${KINGDOMS[army.owner].name}] breached ${city.name}'s defenses (${city.x + 1}, ${city.y + 1}): ${strength} vs ${defense}, with ${army.troops} troops remaining. [${operationId}] Settlement: ${cityLabel(city)}.`,
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
      `Barbarians raided ${city.name} (${city.x + 1}, ${city.y + 1}), owned by ${KINGDOMS[city.owner].name}, costing ${lost.gold} gold, ${lost.food} food and ${lost.population} population. [${operationId}] ${cityLabel(city)} remains under ${KINGDOMS[city.owner].name}.`,
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
      .map((entry) => (entry.owner ? KINGDOMS[entry.owner].name : "Neutral"))
      .join(" → ");
    const duration =
      previousOccupation.sinceTurn === null
        ? "duration unknown"
        : `${state.turn - previousOccupation.sinceTurn} completed turns`;
    addLog(
      state,
      `${KINGDOMS[army.owner].name} claimed ${city.name} (${city.x + 1}, ${city.y + 1})${previousOwner ? ` from ${KINGDOMS[previousOwner].name}` : ""}. [${operationId}] ${cityLabel(city)}${city.capital ? " is a capital" : " is a town"}; now controlled by ${KINGDOMS[army.owner].name}.${firstConquest ? ` This is ${KINGDOMS[army.owner].name}'s first conquest.` : ""} Previous occupation: ${duration}; ownership changes: ${city.ownershipHistory.length - 1}; history: ${owners}. ${city.population} population and buildings remain; defense: ${city.defense}. Future production belongs to the new owner; treasury and rulers are unchanged. Survivors: ${army.troops}; commander: ${generalLabel(army.general)}.`,
    );
    rememberGeneral(
      state,
      army.general,
      `captured ${cityLabel(city)} in ${operationId}, ${army.troops} survivors`,
    );
  }
}

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
    x >= MAP_SIZE ||
    y >= MAP_SIZE ||
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

function moveForOwner(
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
    `${moving.name} [${moving.id}; ${KINGDOMS[owner].name}] moved from (${unit.x + 1}, ${unit.y + 1}) to (${x + 1}, ${y + 1}) with ${moving.troops} troops. ${objective}.`,
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
      `${KINGDOMS[owner].name}'s ${moving.name} merged into ${ally.name} (${ally.troops} soldiers).`,
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

function recruitForOwner(
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
  const cost = isScout
    ? { gold: 30, food: 15, population: 20 }
    : troop?.cost;
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
          tile.x < MAP_SIZE &&
          tile.y < MAP_SIZE &&
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
    name:
      isScout
        ? "Rangers"
        : owner === "england"
          ? `${troop.name} Company`
          : `${KINGDOMS[owner].name} ${troop.name.toLowerCase()}`,
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
    `${KINGDOMS[owner].name}: ${isScout ? "Scouts recruited" : `${troop.name} recruited`} in ${city.name}${army.general ? ` under General ${army.general.name} [${army.general.id}]` : ""}. Ready next turn. City: ${cityLabel(city)}; unit: ${army.id}; cost: ${cost.gold} gold, ${cost.food} food, ${cost.population} population.`,
    "recruitment",
  );
  revealPlayer(next);
  return next;
}

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

function enemyTurn(state, owner) {
  let next = state;
  const ids = next.armies
    .filter((unit) => unit.owner === owner)
    .map((unit) => unit.id);
  for (const id of ids) {
    const unit = next.armies.find((army) => army.id === id);
    if (unit) unit.moves = MOVE_RANGE;
  }
  for (const id of ids) {
    while (true) {
      const unit = next.armies.find((army) => army.id === id);
      if (!unit || unit.moves < 1 || isGarrison(next, unit)) break;
      const step = chooseAutoStep(next, unit, false);
      if (!step) break;
      const moved = moveForOwner(
        next,
        id,
        step.x,
        step.y,
        owner,
        step.objective,
      );
      if (moved === next) break;
      next = moved;
    }
  }
  if (
    next.armies.filter((unit) => unit.owner === owner && unit.kind === "army")
      .length <
    next.cities.filter((city) => city.owner === owner).length + 4
  ) {
    for (const city of next.cities.filter((place) => place.owner === owner)) {
      const recruited = recruitForOwner(next, city.id, owner, "army", true);
      if (recruited !== next) {
        next = recruited;
        break;
      }
    }
  }
  return next;
}

function spawnBarbarians(state) {
  if (state.turn < 4 || state.turn % 2 !== 0) return;
  const cities = state.cities.filter((city) => city.owner);
  const playerCities = cities.filter((city) => city.owner === "england");
  for (
    let count = 0;
    count < 2 &&
    state.armies.filter((unit) => unit.owner === "barbarian").length < 20;
    count++
  ) {
    const targets = count === 0 && playerCities.length ? playerCities : cities;
    if (!targets.length) return;
    const city = targets[randomInt(state, targets.length)];
    const candidates = [];
    for (let dy = -6; dy <= 6; dy++) {
      for (let dx = -6; dx <= 6; dx++) {
        const x = city.x + dx,
          y = city.y + dy;
        const dist = Math.abs(dx) + Math.abs(dy);
        if (
          dist < 4 ||
          dist > 6 ||
          x < 0 ||
          y < 0 ||
          x >= MAP_SIZE ||
          y >= MAP_SIZE ||
          terrainAt(x, y) === "water" ||
          state.cities.some((place) => place.x === x && place.y === y) ||
          state.armies.some((unit) => unit.x === x && unit.y === y)
        )
          continue;
        candidates.push({ x, y });
      }
    }
    if (!candidates.length) continue;
    const position = candidates[randomInt(state, candidates.length)];
    const band = {
      id: `barbarian-${state.nextId++}`,
      name: "Barbarian raiders",
      owner: "barbarian",
      kind: "barbarian",
      ...position,
      troops: 20 + randomInt(state, 21),
      units: 1,
      moves: 0,
    };
    state.armies.push(band);
    addLog(
      state,
      `A band of ${band.troops} barbarian raiders appeared near ${city.name} (${position.x + 1}, ${position.y + 1}).`,
    );
    if (isDiscovered(state, position.x, position.y))
      addLog(
        state,
        `Barbarian raiders sighted near ${position.x + 1}, ${position.y + 1}.`,
      );
  }
}

function barbarianTurn(state) {
  let next = state;
  const ids = next.armies
    .filter((unit) => unit.owner === "barbarian")
    .map((unit) => unit.id);
  for (const id of ids) {
    const unit = next.armies.find((army) => army.id === id);
    unit.moves = 2;
    while (true) {
      const current = next.armies.find((army) => army.id === id);
      if (!current || current.moves < 1) break;
      const targets = next.cities.filter(
        (city) => city.owner && distance(current, city) <= 12,
      );
      const targetPositions = new Set(
        targets.map((city) => key(city.x, city.y)),
      );
      let step =
        targets.length &&
        findAutoStep(next, current, (x, y) => targetPositions.has(key(x, y)));
      if (!step && !targets.length) {
        const options = [
          [1, 0],
          [0, -1],
          [-1, 0],
          [0, 1],
        ]
          .map(([dx, dy]) => ({ x: current.x + dx, y: current.y + dy }))
          .filter((tile) => canMoveUnit(next, current, tile.x, tile.y));
        if (options.length) step = options[randomInt(next, options.length)];
      }
      if (!step) break;
      const target =
        step.target &&
        targets.find(
          (city) => city.x === step.target.x && city.y === step.target.y,
        );
      const objective = target
        ? `AI objective: Raid ${cityLabel(target)}`
        : "AI objective: Wander; no settlement within range";
      next = moveForOwner(next, id, step.x, step.y, "barbarian", objective);
    }
  }
  return next;
}

export function endTurn(state) {
  if (state.gameOver) return state;
  let next = copyState(state);
  next.turn++;
  addLog(
    next,
    `Turn ${next.turn} begins. Your cities have produced resources.`,
  );
  for (const city of next.cities) {
    if (city.owner) {
      const development = cityDevelopment(city);
      next.resources[city.owner].gold += development.gold;
      next.resources[city.owner].food += development.food;
      addLog(
        next,
        `${cityLabel(city)} [${KINGDOMS[city.owner].name}] produced ${development.gold} gold and ${development.food} food and grew by ${development.growth} population.`,
        "production",
      );
      changePopulation(next, city, city.population + development.growth);
    }
    city.defense = cityDevelopment(city).defense;
  }
  for (const army of next.armies) {
    if (!isGarrison(next, army) || army.troops >= army.maxTroops) continue;
    const recovered = Math.min(
      Math.ceil(army.maxTroops * 0.1),
      army.maxTroops - army.troops,
    );
    army.troops += recovered;
    const city = next.cities.find(
      (place) =>
        place.owner === army.owner && place.x === army.x && place.y === army.y,
    );
    addLog(
      next,
      `${army.name} [${KINGDOMS[army.owner].name}] recovered ${recovered} soldiers in ${city.name} (${army.troops}/${army.maxTroops}). Unit: ${army.id}; settlement: ${cityLabel(city)}.`,
      "recovery",
    );
  }
  for (const owner of ["france", "castile", "norway"])
    next = enemyTurn(next, owner);
  next = barbarianTurn(next);
  spawnBarbarians(next);
  for (const unit of next.armies)
    if (unit.owner === "england") unit.moves = MOVE_RANGE;
  revealPlayer(next);
  updateGameOver(next);
  return next;
}

function findAutoStep(state, unit, isTarget, mergeTargets = new Set()) {
  const blocked = new Set(
    state.armies
      .filter(
        (other) =>
          other.owner === unit.owner &&
          other.id !== unit.id &&
          !mergeTargets.has(other.id),
      )
      .map((other) => key(other.x, other.y)),
  );
  const visited = new Set([key(unit.x, unit.y)]);
  const queue = [{ x: unit.x, y: unit.y, first: null }];
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    if (current.first && isTarget(current.x, current.y))
      return { ...current.first, target: { x: current.x, y: current.y } };
    for (const [dx, dy] of [
      [1, 0],
      [0, -1],
      [-1, 0],
      [0, 1],
    ]) {
      const x = current.x + dx;
      const y = current.y + dy;
      const position = key(x, y);
      if (
        x < 0 ||
        y < 0 ||
        x >= MAP_SIZE ||
        y >= MAP_SIZE ||
        visited.has(position) ||
        blocked.has(position) ||
        terrainAt(x, y) === "water" ||
        (!current.first && !canMoveUnit(state, unit, x, y))
      )
        continue;
      visited.add(position);
      queue.push({ x, y, first: current.first || { x, y } });
    }
  }
  return null;
}

function isGarrison(state, unit) {
  return (
    unit.kind === "army" &&
    state.cities.some(
      (city) =>
        city.owner === unit.owner && city.x === unit.x && city.y === unit.y,
    )
  );
}

function chooseAutoStep(state, unit, player) {
  const visible = (item) => !player || isDiscovered(state, item.x, item.y);
  const enemies = state.armies.filter(
    (other) =>
      other.owner !== unit.owner &&
      visible(other) &&
      distance(unit, other) <= 8,
  );
  const allies = state.armies.filter(
    (other) =>
      other.id !== unit.id &&
      !isGarrison(state, other) &&
      canMerge(unit, other) &&
      distance(unit, other) <= 8 &&
      (other.units > unit.units ||
        (other.units === unit.units && other.troops >= unit.troops)),
  );
  const unguarded =
    unit.kind === "army"
      ? state.cities.filter(
          (city) =>
            city.owner === unit.owner &&
            !state.armies.some(
              (army) =>
                army.owner === unit.owner &&
                army.kind === "army" &&
                army.x === city.x &&
                army.y === city.y,
            ),
        )
      : [];
  const towns =
    unit.kind === "army"
      ? state.cities.filter(
          (city) => city.owner !== unit.owner && visible(city),
        )
      : [];
  const positions = (items) =>
    new Set(items.map((item) => key(item.x, item.y)));
  const enemyPositions = positions(enemies);
  const unguardedPositions = positions(unguarded);
  const allyPositions = positions(allies);
  const townPositions = positions(towns);
  const choices = [
    {
      items: unguarded,
      positions: unguardedPositions,
      describe: (city) => `Defend ${cityLabel(city)}`,
    },
    {
      items: enemies,
      positions: enemyPositions,
      describe: (enemy) => `Engage ${enemy.name} [${enemy.id}]`,
    },
    {
      items: allies,
      positions: allyPositions,
      describe: (ally) => `Merge with ${ally.name} [${ally.id}]`,
      mergeTargets: new Set(allies.map((ally) => ally.id)),
    },
    {
      items: towns,
      positions: townPositions,
      describe: (city) => `Claim ${cityLabel(city)}`,
    },
  ];
  for (const choice of choices) {
    if (!choice.items.length) continue;
    const step = findAutoStep(
      state,
      unit,
      (x, y) => choice.positions.has(key(x, y)),
      choice.mergeTargets,
    );
    if (step) {
      const target = choice.items.find(
        (item) => item.x === step.target.x && item.y === step.target.y,
      );
      return { ...step, objective: `AI objective: ${choice.describe(target)}` };
    }
  }
  if (player) {
    const step = findAutoStep(
      state,
      unit,
      (x, y) => !isDiscovered(state, x, y),
    );
    if (step)
      return {
        ...step,
        objective: `AI objective: Explore (${step.target.x + 1}, ${step.target.y + 1})`,
      };
  }
  return null;
}

export function autoplayStep(state) {
  if (state.gameOver) return { state, stopped: state.gameOver.message };
  const playerUnits = state.armies.filter((unit) => unit.owner === "england");
  const playerCities = state.cities.filter((city) => city.owner === "england");
  if (!playerUnits.length && !playerCities.length) {
    return {
      state,
      stopped: `Autoplay stopped: ${KINGDOMS.england.name} has no settlements or units.`,
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
      const next = recruitForOwner(state, city.id, "england", "army", true);
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
  return { state: endTurn(state) };
}

export function cameraFor(x, y) {
  return {
    x: clamp(x - Math.floor(VIEW_SIZE / 2), 0, MAP_SIZE - VIEW_SIZE),
    y: clamp(y - Math.floor(VIEW_SIZE / 2), 0, MAP_SIZE - VIEW_SIZE),
  };
}

export function moveCamera(camera, dx, dy) {
  return {
    x: clamp(camera.x + dx, 0, MAP_SIZE - VIEW_SIZE),
    y: clamp(camera.y + dy, 0, MAP_SIZE - VIEW_SIZE),
  };
}
