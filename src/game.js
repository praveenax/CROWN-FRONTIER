export const MAP_SIZE = 100;
export const VIEW_SIZE = 8;
export const MOVE_RANGE = 3;
export const MAX_TROOPS = 300;
export const MAX_MERGED_UNITS = 5;
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
  const river = x === 32 + Math.round(2 * Math.sin(y / 7)) && y % 12 > 2;
  const lake = [[46, 49], [18, 44], [65, 36], [82, 61]].some(([cx, cy]) => (x - cx) ** 2 + (y - cy) ** 2 <= 2);
  if (river || lake) return 'water';
  if ((x === 48 && y === 48) || (band > 2.25 && n > 0.27)) return 'mountain';
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
      if (terrainAt(cx, cy) === 'water' || cities.some(city => distance(city, { x: cx, y: cy }) < 7)) continue;
      const name = cityNames[(i + 2) % cityNames.length];
      cities.push({ id: `town-${i}`, name, x: cx, y: cy, owner: null });
      i++;
    }
  }
  const armies = [
    { id: 'army-1', name: 'Royal Guard', owner: 'england', kind: 'army', x: 49, y: 49, troops: 120, units: 1, moves: MOVE_RANGE },
    ...['france', 'castile', 'norway'].map((owner, index) => {
      const city = cities.find(c => c.owner === owner);
      return { id: `enemy-${index}`, name: `${KINGDOMS[owner].name} host`, owner, kind: 'army', x: city.x, y: city.y, troops: 100, units: 1, moves: MOVE_RANGE };
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

export function canMerge(unit, other) {
  return unit.owner === other.owner && unit.kind === 'army' && other.kind === 'army'
    && unit.troops + other.troops <= MAX_TROOPS && unit.units + other.units <= MAX_MERGED_UNITS;
}

export function canMoveUnit(state, unit, x, y) {
  if (!unit || !Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE || distance(unit, { x, y }) !== 1) return false;
  const terrain = terrainAt(x, y);
  if (terrain === 'water' || unit.moves < (terrain === 'mountain' ? 2 : 1)) return false;
  const other = state.armies.find(army => army.id !== unit.id && army.x === x && army.y === y);
  return !other || other.owner !== unit.owner || canMerge(unit, other);
}

function moveForOwner(state, id, x, y, owner) {
  const unit = state.armies.find(army => army.id === id && army.owner === owner);
  if (!canMoveUnit(state, unit, x, y)) return state;
  const next = copyState(state);
  const moving = next.armies.find(army => army.id === id);
  moving.x = x;
  moving.y = y;
  moving.moves -= terrainAt(x, y) === 'mountain' ? 2 : 1;
  const ally = next.armies.find(other => other.id !== id && other.owner === owner && other.x === x && other.y === y);
  if (ally) {
    ally.troops += moving.troops;
    ally.units += moving.units;
    ally.moves = Math.min(ally.moves, moving.moves);
    next.armies = next.armies.filter(other => other.id !== id);
    if (owner === 'england' || isDiscovered(next, x, y)) addLog(next, `${moving.name} merged into ${ally.name} (${ally.troops} soldiers).`);
    revealPlayer(next);
    return next;
  }
  resolveArrival(next, moving);
  revealPlayer(next);
  return next;
}

export function moveUnit(state, id, x, y) {
  return moveForOwner(state, id, x, y, 'england');
}

export function recruit(state, cityId, kind = 'army') {
  return recruitForOwner(state, cityId, 'england', kind);
}

function recruitForOwner(state, cityId, owner, kind = 'army') {
  const city = state.cities.find(place => place.id === cityId && place.owner === owner);
  const cost = kind === 'scout' ? { gold: 30, food: 15, population: 20 } : { gold: 60, food: 40, population: 60 };
  const resources = state.resources[owner];
  if (!city || !['army', 'scout'].includes(kind) || state.armies.some(army => army.x === city.x && army.y === city.y) || Object.entries(cost).some(([resource, amount]) => resources[resource] < amount)) return state;
  const next = copyState(state);
  for (const [resource, amount] of Object.entries(cost)) next.resources[owner][resource] -= amount;
  next.armies.push({ id: `army-${next.nextId++}`, name: kind === 'scout' ? 'Rangers' : owner === 'england' ? 'New Levy' : `${KINGDOMS[owner].name} levy`, owner, kind, x: city.x, y: city.y, troops: kind === 'scout' ? 20 : 60, units: 1, moves: 0 });
  if (owner === 'england' || isDiscovered(next, city.x, city.y)) addLog(next, `${kind === 'scout' ? 'Scouts recruited' : 'Army raised'} in ${city.name}. Ready next turn.`);
  revealPlayer(next);
  return next;
}

function enemyTurn(state, owner) {
  let next = state;
  const ids = next.armies.filter(unit => unit.owner === owner).map(unit => unit.id);
  for (const id of ids) {
    const unit = next.armies.find(army => army.id === id);
    if (unit) unit.moves = MOVE_RANGE;
  }
  for (const id of ids) {
    while (true) {
      const unit = next.armies.find(army => army.id === id);
      if (!unit || unit.moves < 1) break;
      const step = chooseAutoStep(next, unit, false);
      if (!step) break;
      const moved = moveForOwner(next, id, step.x, step.y, owner);
      if (moved === next) break;
      next = moved;
    }
  }
  if (next.armies.filter(unit => unit.owner === owner && unit.kind === 'army').length < 8) {
    for (const city of next.cities.filter(place => place.owner === owner)) {
      const recruited = recruitForOwner(next, city.id, owner);
      if (recruited !== next) { next = recruited; break; }
    }
  }
  return next;
}

export function endTurn(state) {
  let next = copyState(state);
  next.turn++;
  for (const owner of Object.keys(KINGDOMS)) {
    const cityCount = next.cities.filter(city => city.owner === owner).length;
    next.resources[owner].gold += cityCount * 25;
    next.resources[owner].food += cityCount * 20;
    next.resources[owner].population += cityCount * 80;
  }
  for (const owner of ['france', 'castile', 'norway']) next = enemyTurn(next, owner);
  for (const unit of next.armies) if (unit.owner === 'england') unit.moves = MOVE_RANGE;
  revealPlayer(next);
  addLog(next, `Turn ${next.turn} begins. Your cities have produced resources.`);
  return next;
}

function findAutoStep(state, unit, isTarget, mergeTargets = new Set()) {
  const blocked = new Set(state.armies.filter(other => other.owner === unit.owner && other.id !== unit.id && !mergeTargets.has(other.id)).map(other => key(other.x, other.y)));
  const visited = new Set([key(unit.x, unit.y)]);
  const queue = [{ x: unit.x, y: unit.y, first: null }];
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    if (current.first && isTarget(current.x, current.y)) return current.first;
    for (const [dx, dy] of [[1, 0], [0, -1], [-1, 0], [0, 1]]) {
      const x = current.x + dx;
      const y = current.y + dy;
      const position = key(x, y);
      if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE || visited.has(position) || blocked.has(position) || terrainAt(x, y) === 'water' || (!current.first && !canMoveUnit(state, unit, x, y))) continue;
      visited.add(position);
      queue.push({ x, y, first: current.first || { x, y } });
    }
  }
  return null;
}

function chooseAutoStep(state, unit, player) {
  const visible = item => !player || isDiscovered(state, item.x, item.y);
  const enemies = state.armies.filter(other => other.owner !== unit.owner && visible(other) && distance(unit, other) <= 8);
  const allies = state.armies.filter(other => other.id !== unit.id && canMerge(unit, other) && distance(unit, other) <= 8
    && (other.units > unit.units || (other.units === unit.units && other.troops >= unit.troops)));
  const towns = unit.kind === 'army' ? state.cities.filter(city => city.owner !== unit.owner && visible(city)) : [];
  const positions = items => new Set(items.map(item => key(item.x, item.y)));
  const enemyPositions = positions(enemies);
  const allyPositions = positions(allies);
  const townPositions = positions(towns);
  return (enemies.length && findAutoStep(state, unit, (x, y) => enemyPositions.has(key(x, y))))
    || (allies.length && findAutoStep(state, unit, (x, y) => allyPositions.has(key(x, y)), new Set(allies.map(ally => ally.id))))
    || (towns.length && findAutoStep(state, unit, (x, y) => townPositions.has(key(x, y))))
    || (player && findAutoStep(state, unit, (x, y) => !isDiscovered(state, x, y)));
}

export function autoplayStep(state) {
  const playerUnits = state.armies.filter(unit => unit.owner === 'england');
  const playerCities = state.cities.filter(city => city.owner === 'england');
  if (!playerUnits.length && !playerCities.length) {
    return { state, stopped: 'Autoplay stopped: England has no settlements or units.' };
  }
  if (!state.cities.some(city => city.owner !== 'england') && !state.armies.some(unit => unit.owner !== 'england')) {
    return { state, stopped: 'Autoplay stopped: all settlements are under your control.' };
  }

  for (const unit of playerUnits) {
    if (unit.moves < 1) continue;
    const step = chooseAutoStep(state, unit, true);
    if (step) {
      const next = moveUnit(state, unit.id, step.x, step.y);
      const survivor = next.armies.find(army => army.owner === unit.owner && army.x === step.x && army.y === step.y);
      return { state: next, unitId: survivor?.id, position: step };
    }
  }

  if (playerUnits.filter(unit => unit.kind === 'army').length < 8) {
    for (const city of playerCities) {
      const next = recruit(state, city.id);
      if (next !== state) return { state: next, unitId: `army-${state.nextId}`, position: city };
    }
  }
  return { state: endTurn(state) };
}

export function cameraFor(x, y) {
  return { x: clamp(x - Math.floor(VIEW_SIZE / 2), 0, MAP_SIZE - VIEW_SIZE), y: clamp(y - Math.floor(VIEW_SIZE / 2), 0, MAP_SIZE - VIEW_SIZE) };
}

export function moveCamera(camera, dx, dy) {
  return { x: clamp(camera.x + dx, 0, MAP_SIZE - VIEW_SIZE), y: clamp(camera.y + dy, 0, MAP_SIZE - VIEW_SIZE) };
}
