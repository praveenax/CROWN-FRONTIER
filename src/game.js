export const MAP_SIZE = 100;
export const VIEW_SIZE = 8;
export const MOVE_RANGE = 3;
export const KINGDOMS = {
  england: { name: 'England', color: '#cfaa67', capital: 'London' },
  france: { name: 'France', color: '#78a4bb', capital: 'Paris' },
  castile: { name: 'Castile', color: '#c97d66', capital: 'Toledo' },
  norway: { name: 'Norway', color: '#a995c0', capital: 'Bergen' },
};

const cityNames = ['Ashford', 'Westhaven', 'Oakheart', 'Rivermouth', 'Stonebridge', 'Highmere', 'Dunwich', 'Eldham', 'Northwatch', 'Rosehaven', 'Whitmoor', 'Greenford', 'Fairhaven', 'Thornfield', 'Bracken', 'Redwater', 'Kingswell', 'Alderwick', 'Greyford', 'Eastmere', 'Millhaven', 'Foxhollow', 'Westerly', 'Pinehurst', 'Blackmere', 'Hawkridge', 'Larkspur', 'Goldcrest', 'Havenwood', 'Briarfield', 'Longford', 'Winterfell'];
const key = (x, y) => `${x},${y}`;
const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export function terrainAt(x, y) {
  const n = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
  const band = Math.sin(x * 0.19) + Math.cos(y * 0.16) + Math.sin((x + y) * 0.12);
  if (band > 2.25 && n > 0.27) return 'highland';
  if (band < -1.35 && n > 0.33) return 'forest';
  if (n > 0.72) return 'field';
  return 'grass';
}

function reveal(discovered, x, y, radius) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (Math.abs(dx) + Math.abs(dy) <= radius && x + dx >= 0 && y + dy >= 0 && x + dx < MAP_SIZE && y + dy < MAP_SIZE) {
        discovered[key(x + dx, y + dy)] = true;
      }
    }
  }
}

function revealPlayer(state) {
  for (const city of state.cities) if (city.owner === 'england') reveal(state.discovered, city.x, city.y, 3);
  for (const army of state.armies) if (army.owner === 'england') reveal(state.discovered, army.x, army.y, army.kind === 'scout' ? 3 : 2);
}

export function createGame() {
  const cities = [
    { id: 'london', name: 'London', x: 49, y: 49, owner: 'england', capital: true },
    { id: 'paris', name: 'Paris', x: 20, y: 22, owner: 'france', capital: true },
    { id: 'toledo', name: 'Toledo', x: 78, y: 24, owner: 'castile', capital: true },
    { id: 'bergen', name: 'Bergen', x: 75, y: 77, owner: 'norway', capital: true },
    { id: 'ashford', name: 'Ashford', x: 52, y: 47, owner: null },
    { id: 'westhaven', name: 'Westhaven', x: 45, y: 52, owner: null },
  ];
  let i = 0;
  for (let y = 8; y < 100; y += 14) {
    for (let x = 8; x < 100; x += 14) {
      const cx = x + ((y * 3 + x) % 5) - 2;
      const cy = y + ((x * 7 + y) % 5) - 2;
      if (cities.some(city => distance(city, { x: cx, y: cy }) < 7)) continue;
      const name = cityNames[(i + 2) % cityNames.length];
      cities.push({ id: `town-${i}`, name, x: cx, y: cy, owner: null });
      i++;
    }
  }
  const armies = [
    { id: 'army-1', name: 'Royal Guard', owner: 'england', kind: 'army', x: 49, y: 49, troops: 120, moves: MOVE_RANGE },
    ...['france', 'castile', 'norway'].map((owner, index) => {
      const city = cities.find(c => c.owner === owner);
      return { id: `enemy-${index}`, name: `${KINGDOMS[owner].name} host`, owner, kind: 'army', x: city.x, y: city.y, troops: 100, moves: MOVE_RANGE };
    }),
  ];
  const state = {
    turn: 1,
    cities,
    armies,
    resources: Object.fromEntries(Object.keys(KINGDOMS).map(owner => [owner, { gold: 180, food: 150, population: 1200 }])),
    discovered: {},
    nextId: 2,
    log: ['A new chapter begins. Your kingdom awaits.'],
  };
  revealPlayer(state);
  return state;
}

export function isDiscovered(state, x, y) {
  return Boolean(state.discovered[key(x, y)]);
}

function copyState(state) {
  return {
    ...state,
    cities: state.cities.map(city => ({ ...city })),
    armies: state.armies.map(army => ({ ...army })),
    resources: Object.fromEntries(Object.entries(state.resources).map(([owner, resources]) => [owner, { ...resources }])),
    discovered: { ...state.discovered },
    log: [...state.log],
  };
}

function addLog(state, message) {
  state.log.unshift(message);
  state.log = state.log.slice(0, 8);
}

function resolveArrival(state, army) {
  const enemy = state.armies.find(other => other.id !== army.id && other.owner !== army.owner && other.x === army.x && other.y === army.y);
  if (enemy) {
    const attackerWins = army.troops > enemy.troops;
    const winner = attackerWins ? army : enemy;
    const loser = attackerWins ? enemy : army;
    winner.troops = Math.max(1, winner.troops - loser.troops);
    state.armies = state.armies.filter(unit => unit.id !== loser.id);
    if (army.owner === 'england' || enemy.owner === 'england' || isDiscovered(state, army.x, army.y)) {
      addLog(state, `${winner.name} defeated ${loser.name} near ${army.x + 1}, ${army.y + 1}.`);
    }
    if (!attackerWins) return;
  }
  const city = state.cities.find(place => place.x === army.x && place.y === army.y);
  if (city && city.owner !== army.owner && army.kind === 'army') {
    city.owner = army.owner;
    if (army.owner === 'england' || isDiscovered(state, city.x, city.y)) addLog(state, `${KINGDOMS[army.owner].name} claimed ${city.name}.`);
  }
}

export function moveUnit(state, id, x, y) {
  const unit = state.armies.find(army => army.id === id && army.owner === 'england');
  if (!unit || !Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE || distance(unit, { x, y }) !== 1 || unit.moves < 1) return state;
  if (state.armies.some(other => other.id !== id && other.owner === unit.owner && other.x === x && other.y === y)) return state;
  const next = copyState(state);
  const moving = next.armies.find(army => army.id === id);
  moving.x = x;
  moving.y = y;
  moving.moves--;
  resolveArrival(next, moving);
  revealPlayer(next);
  return next;
}

export function recruit(state, cityId, kind = 'army') {
  const city = state.cities.find(place => place.id === cityId && place.owner === 'england');
  const cost = kind === 'scout' ? { gold: 30, food: 15, population: 20 } : { gold: 60, food: 40, population: 60 };
  const resources = state.resources.england;
  if (!city || !['army', 'scout'].includes(kind) || state.armies.some(army => army.x === city.x && army.y === city.y) || Object.entries(cost).some(([resource, amount]) => resources[resource] < amount)) return state;
  const next = copyState(state);
  for (const [resource, amount] of Object.entries(cost)) next.resources.england[resource] -= amount;
  next.armies.push({ id: `army-${next.nextId++}`, name: kind === 'scout' ? 'Rangers' : 'New Levy', owner: 'england', kind, x: city.x, y: city.y, troops: kind === 'scout' ? 20 : 60, moves: 0 });
  addLog(next, `${kind === 'scout' ? 'Scouts recruited' : 'Army raised'} in ${city.name}. Ready next turn.`);
  revealPlayer(next);
  return next;
}

function enemyTurn(state, owner) {
  const army = state.armies.find(unit => unit.owner === owner);
  if (!army) return;
  const resources = state.resources[owner];
  if (state.cities.some(city => city.owner === owner) && resources.gold >= 20 && resources.food >= 15 && resources.population >= 20) {
    resources.gold -= 20;
    resources.food -= 15;
    resources.population -= 20;
    army.troops += 20;
  }
  for (let step = 0; step < MOVE_RANGE; step++) {
    const targets = state.cities.filter(city => city.owner !== owner);
    if (!targets.length || !state.armies.some(unit => unit.id === army.id)) break;
    targets.sort((a, b) => distance(army, a) - distance(army, b));
    const target = targets[0];
    if (army.x !== target.x) army.x += Math.sign(target.x - army.x);
    else if (army.y !== target.y) army.y += Math.sign(target.y - army.y);
    resolveArrival(state, army);
  }
}

export function endTurn(state) {
  const next = copyState(state);
  next.turn++;
  for (const owner of Object.keys(KINGDOMS)) {
    const cityCount = next.cities.filter(city => city.owner === owner).length;
    next.resources[owner].gold += cityCount * 25;
    next.resources[owner].food += cityCount * 20;
    next.resources[owner].population += cityCount * 80;
  }
  for (const owner of ['france', 'castile', 'norway']) enemyTurn(next, owner);
  for (const unit of next.armies) if (unit.owner === 'england') unit.moves = MOVE_RANGE;
  revealPlayer(next);
  addLog(next, `Turn ${next.turn} begins. Your cities have produced resources.`);
  return next;
}

export function cameraFor(x, y) {
  return { x: clamp(x - Math.floor(VIEW_SIZE / 2), 0, MAP_SIZE - VIEW_SIZE), y: clamp(y - Math.floor(VIEW_SIZE / 2), 0, MAP_SIZE - VIEW_SIZE) };
}

export function moveCamera(camera, dx, dy) {
  return { x: clamp(camera.x + dx, 0, MAP_SIZE - VIEW_SIZE), y: clamp(camera.y + dy, 0, MAP_SIZE - VIEW_SIZE) };
}
