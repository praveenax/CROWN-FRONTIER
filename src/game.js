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
  barbarian: { name: 'Barbarians', color: '#9e4f43' },
};
const KINGDOM_OWNERS = ['england', 'france', 'castile', 'norway'];

const cityNames = ['Ashford', 'Westhaven', 'Oakheart', 'Rivermouth', 'Stonebridge', 'Highmere', 'Dunwich', 'Eldham', 'Northwatch', 'Rosehaven', 'Whitmoor', 'Greenford', 'Fairhaven', 'Thornfield', 'Bracken', 'Redwater', 'Kingswell', 'Alderwick', 'Greyford', 'Eastmere', 'Millhaven', 'Foxhollow', 'Westerly', 'Pinehurst', 'Blackmere', 'Hawkridge', 'Larkspur', 'Goldcrest', 'Havenwood', 'Briarfield', 'Longford', 'Winterfell'];
const firstNames = ['Alden', 'Beatrice', 'Cedric', 'Diana', 'Edmund', 'Freya', 'Gareth', 'Helena', 'Isabel', 'Jonas', 'Leona', 'Rowan', 'Matilda', 'Oswald', 'Elise', 'Victor'];
const lastNames = ['Ashford', 'Blackwood', 'Caldwell', 'Drake', 'Fairfax', 'Hawthorne', 'Langley', 'Mercer', 'Northwood', 'Ravenscroft', 'Sterling', 'Thorne', 'Valen', 'Westbrook', 'Wilder', 'York'];
const generalSkills = ['fighting', 'captain', 'charisma'];
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

function randomInt(state, max) {
  state.randomSeed = (Math.imul(state.randomSeed, 1664525) + 1013904223) >>> 0;
  return Math.floor(state.randomSeed / 4294967296 * max);
}

function createGeneral(state) {
  const usedNames = new Set(state.armies.filter(army => army.general).map(army => army.general.name));
  const combinations = firstNames.length * lastNames.length;
  const start = randomInt(state, combinations);
  let name;
  for (let offset = 0; offset < combinations; offset++) {
    const index = (start + offset) % combinations;
    name = `${firstNames[Math.floor(index / lastNames.length)]} ${lastNames[index % lastNames.length]}`;
    if (!usedNames.has(name)) break;
  }
  return { id: `general-${state.nextGeneralId++}`, name, level: 1, skills: { fighting: 1, captain: 1, charisma: 1 } };
}

export function createGame(seed = Math.floor(Math.random() * 4294967296)) {
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
    resources: Object.fromEntries(KINGDOM_OWNERS.map(owner => [owner, { gold: 180, food: 150, population: 1200 }])),
    discovered: {},
    nextId: 2,
    nextGeneralId: 1,
    randomSeed: seed >>> 0,
    log: [],
  };
  state.armies[0].general = createGeneral(state);
  addLog(state, 'A new chapter begins. Your kingdom awaits.');
  for (const city of cities.filter(place => place.capital)) {
    addLog(state, `${KINGDOMS[city.owner].name} established its capital at ${city.name} (${city.x + 1}, ${city.y + 1}).`);
  }
  addLog(state, `${state.armies[0].general.name} leads the Royal Guard in London.`);
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
    armies: state.armies.map(army => ({ ...army, ...(army.general ? { general: { ...army.general, skills: { ...army.general.skills } } } : {}) })),
    resources: Object.fromEntries(Object.entries(state.resources).map(([owner, resources]) => [owner, { ...resources }])),
    discovered: { ...state.discovered },
    log: [...state.log],
  };
}

function addLog(state, message) {
  state.log.unshift(`Turn ${state.turn}: ${message}`);
}

function resolveArrival(state, army) {
  const enemy = state.armies.find(other => other.id !== army.id && other.owner !== army.owner && other.x === army.x && other.y === army.y);
  if (enemy) {
    const attackerStrength = army.troops;
    const defenderStrength = enemy.troops;
    const attackerWins = army.troops > enemy.troops;
    const winner = attackerWins ? army : enemy;
    const loser = attackerWins ? enemy : army;
    winner.troops = Math.max(1, winner.troops - loser.troops);
    state.armies = state.armies.filter(unit => unit.id !== loser.id);
    const city = state.cities.find(place => place.x === army.x && place.y === army.y);
    const describe = unit => `${unit.name} [${KINGDOMS[unit.owner].name}]${unit.general ? ` (General ${unit.general.name})` : ''}`;
    addLog(state, `${describe(army)} attacked ${describe(enemy)} at ${city ? `${city.name} ` : ''}(${army.x + 1}, ${army.y + 1}): ${attackerStrength} vs ${defenderStrength}. ${describe(winner)} defeated ${describe(loser)} with ${winner.troops} remaining; ${loser.general ? `General ${loser.general.name} was lost.` : 'the defeated force was destroyed.'}`);
    if (winner.general) {
      const skill = generalSkills[randomInt(state, generalSkills.length)];
      winner.general.level++;
      winner.general.skills[skill]++;
      addLog(state, `${winner.general.name} reached level ${winner.general.level} (+1 ${skill}).`);
    }
    if (!attackerWins) return;
  }
  const city = state.cities.find(place => place.x === army.x && place.y === army.y);
  if (city?.owner && army.owner === 'barbarian') {
    const resources = state.resources[city.owner];
    const lost = { gold: Math.min(resources.gold, 30), food: Math.min(resources.food, 20), population: Math.min(resources.population, 50) };
    resources.gold = Math.max(0, resources.gold - 30);
    resources.food = Math.max(0, resources.food - 20);
    resources.population = Math.max(0, resources.population - 50);
    addLog(state, `Barbarians raided ${city.name} (${city.x + 1}, ${city.y + 1}), owned by ${KINGDOMS[city.owner].name}, costing ${lost.gold} gold, ${lost.food} food and ${lost.population} population.`);
    state.armies = state.armies.filter(unit => unit.id !== army.id);
    return;
  }
  if (city && city.owner !== army.owner && army.kind === 'army') {
    const previousOwner = city.owner;
    city.owner = army.owner;
    addLog(state, `${KINGDOMS[army.owner].name} claimed ${city.name} (${city.x + 1}, ${city.y + 1})${previousOwner ? ` from ${KINGDOMS[previousOwner].name}` : ''}.`);
  }
}

export function canMerge(unit, other) {
  return unit.owner === other.owner && unit.kind === 'army' && other.kind === 'army'
    && !(unit.general && other.general)
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
    if (moving.general) ally.general = moving.general;
    next.armies = next.armies.filter(other => other.id !== id);
    addLog(next, `${KINGDOMS[owner].name}'s ${moving.name} merged into ${ally.name} (${ally.troops} soldiers).`);
    revealPlayer(next);
    return next;
  }
  resolveArrival(next, moving);
  if (owner === 'barbarian' && next.armies.some(army => army.id === id)
    && !isDiscovered(state, unit.x, unit.y) && isDiscovered(next, x, y)) {
    addLog(next, `Barbarian raiders sighted near ${x + 1}, ${y + 1}.`);
  }
  revealPlayer(next);
  return next;
}

export function moveUnit(state, id, x, y) {
  return moveForOwner(state, id, x, y, 'england');
}

export function recruit(state, cityId, kind = 'army') {
  return recruitForOwner(state, cityId, 'england', kind);
}

function recruitForOwner(state, cityId, owner, kind = 'army', allowAdjacent = false) {
  const city = state.cities.find(place => place.id === cityId && place.owner === owner);
  const cost = kind === 'scout' ? { gold: 30, food: 15, population: 20 } : { gold: 60, food: 40, population: 60 };
  const resources = state.resources[owner];
  if (!city || !['army', 'scout'].includes(kind) || Object.entries(cost).some(([resource, amount]) => resources[resource] < amount)) return state;
  const occupant = state.armies.find(army => army.x === city.x && army.y === city.y);
  let position = city;
  if (occupant) {
    if (!allowAdjacent || occupant.owner !== owner || occupant.kind !== 'army') return state;
    position = [[1, 0], [0, -1], [-1, 0], [0, 1]]
      .map(([dx, dy]) => ({ x: city.x + dx, y: city.y + dy }))
      .find(tile => tile.x >= 0 && tile.y >= 0 && tile.x < MAP_SIZE && tile.y < MAP_SIZE && terrainAt(tile.x, tile.y) !== 'water'
        && !state.armies.some(unit => unit.x === tile.x && unit.y === tile.y) && !state.cities.some(place => place.x === tile.x && place.y === tile.y));
    if (!position) return state;
  }
  const next = copyState(state);
  for (const [resource, amount] of Object.entries(cost)) next.resources[owner][resource] -= amount;
  const army = { id: `army-${next.nextId++}`, name: kind === 'scout' ? 'Rangers' : owner === 'england' ? 'New Levy' : `${KINGDOMS[owner].name} levy`, owner, kind, x: position.x, y: position.y, troops: kind === 'scout' ? 20 : 60, units: 1, moves: 0 };
  if (kind === 'army' && randomInt(next, 2) === 0) army.general = createGeneral(next);
  next.armies.push(army);
  addLog(next, `${KINGDOMS[owner].name}: ${kind === 'scout' ? 'Scouts recruited' : 'Army raised'} in ${city.name}${army.general ? ` under General ${army.general.name}` : ''}. Ready next turn.`);
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
      if (!unit || unit.moves < 1 || isGarrison(next, unit)) break;
      const step = chooseAutoStep(next, unit, false);
      if (!step) break;
      const moved = moveForOwner(next, id, step.x, step.y, owner);
      if (moved === next) break;
      next = moved;
    }
  }
  if (next.armies.filter(unit => unit.owner === owner && unit.kind === 'army').length < next.cities.filter(city => city.owner === owner).length + 4) {
    for (const city of next.cities.filter(place => place.owner === owner)) {
      const recruited = recruitForOwner(next, city.id, owner, 'army', true);
      if (recruited !== next) { next = recruited; break; }
    }
  }
  return next;
}

function spawnBarbarians(state) {
  if (state.turn < 4 || state.turn % 2 !== 0) return;
  const cities = state.cities.filter(city => city.owner);
  const playerCities = cities.filter(city => city.owner === 'england');
  for (let count = 0; count < 2 && state.armies.filter(unit => unit.owner === 'barbarian').length < 20; count++) {
    const targets = count === 0 && playerCities.length ? playerCities : cities;
    if (!targets.length) return;
    const city = targets[randomInt(state, targets.length)];
    const candidates = [];
    for (let dy = -6; dy <= 6; dy++) {
      for (let dx = -6; dx <= 6; dx++) {
        const x = city.x + dx, y = city.y + dy;
        const dist = Math.abs(dx) + Math.abs(dy);
        if (dist < 4 || dist > 6 || x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE || terrainAt(x, y) === 'water'
          || state.cities.some(place => place.x === x && place.y === y) || state.armies.some(unit => unit.x === x && unit.y === y)) continue;
        candidates.push({ x, y });
      }
    }
    if (!candidates.length) continue;
    const position = candidates[randomInt(state, candidates.length)];
    const band = { id: `barbarian-${state.nextId++}`, name: 'Barbarian raiders', owner: 'barbarian', kind: 'barbarian', ...position, troops: 20 + randomInt(state, 21), units: 1, moves: 0 };
    state.armies.push(band);
    addLog(state, `A band of ${band.troops} barbarian raiders appeared near ${city.name} (${position.x + 1}, ${position.y + 1}).`);
    if (isDiscovered(state, position.x, position.y)) addLog(state, `Barbarian raiders sighted near ${position.x + 1}, ${position.y + 1}.`);
  }
}

function barbarianTurn(state) {
  let next = state;
  const ids = next.armies.filter(unit => unit.owner === 'barbarian').map(unit => unit.id);
  for (const id of ids) {
    const unit = next.armies.find(army => army.id === id);
    unit.moves = 2;
    while (true) {
      const current = next.armies.find(army => army.id === id);
      if (!current || current.moves < 1) break;
      const targets = next.cities.filter(city => city.owner && distance(current, city) <= 12);
      const targetPositions = new Set(targets.map(city => key(city.x, city.y)));
      let step = targets.length && findAutoStep(next, current, (x, y) => targetPositions.has(key(x, y)));
      if (!step && !targets.length) {
        const options = [[1, 0], [0, -1], [-1, 0], [0, 1]]
          .map(([dx, dy]) => ({ x: current.x + dx, y: current.y + dy }))
          .filter(tile => canMoveUnit(next, current, tile.x, tile.y));
        if (options.length) step = options[randomInt(next, options.length)];
      }
      if (!step) break;
      next = moveForOwner(next, id, step.x, step.y, 'barbarian');
    }
  }
  return next;
}

export function endTurn(state) {
  let next = copyState(state);
  next.turn++;
  addLog(next, `Turn ${next.turn} begins. Your cities have produced resources.`);
  for (const owner of KINGDOM_OWNERS) {
    const cityCount = next.cities.filter(city => city.owner === owner).length;
    next.resources[owner].gold += cityCount * 25;
    next.resources[owner].food += cityCount * 20;
    next.resources[owner].population += cityCount * 80;
  }
  for (const owner of ['france', 'castile', 'norway']) next = enemyTurn(next, owner);
  next = barbarianTurn(next);
  spawnBarbarians(next);
  for (const unit of next.armies) if (unit.owner === 'england') unit.moves = MOVE_RANGE;
  revealPlayer(next);
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

function isGarrison(state, unit) {
  return unit.kind === 'army' && state.cities.some(city => city.owner === unit.owner && city.x === unit.x && city.y === unit.y);
}

function chooseAutoStep(state, unit, player) {
  const visible = item => !player || isDiscovered(state, item.x, item.y);
  const enemies = state.armies.filter(other => other.owner !== unit.owner && visible(other) && distance(unit, other) <= 8);
  const allies = state.armies.filter(other => other.id !== unit.id && !isGarrison(state, other) && canMerge(unit, other) && distance(unit, other) <= 8
    && (other.units > unit.units || (other.units === unit.units && other.troops >= unit.troops)));
  const unguarded = unit.kind === 'army' ? state.cities.filter(city => city.owner === unit.owner && !state.armies.some(army => army.owner === unit.owner && army.kind === 'army' && army.x === city.x && army.y === city.y)) : [];
  const towns = unit.kind === 'army' ? state.cities.filter(city => city.owner !== unit.owner && visible(city)) : [];
  const positions = items => new Set(items.map(item => key(item.x, item.y)));
  const enemyPositions = positions(enemies);
  const unguardedPositions = positions(unguarded);
  const allyPositions = positions(allies);
  const townPositions = positions(towns);
  return (unguarded.length && findAutoStep(state, unit, (x, y) => unguardedPositions.has(key(x, y))))
    || (enemies.length && findAutoStep(state, unit, (x, y) => enemyPositions.has(key(x, y))))
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
    if (unit.moves < 1 || isGarrison(state, unit)) continue;
    const step = chooseAutoStep(state, unit, true);
    if (step) {
      const next = moveUnit(state, unit.id, step.x, step.y);
      const survivor = next.armies.find(army => army.owner === unit.owner && army.x === step.x && army.y === step.y);
      return { state: next, unitId: survivor?.id, position: step };
    }
  }

  if (playerUnits.filter(unit => unit.kind === 'army').length < playerCities.length + 4) {
    for (const city of playerCities) {
      const next = recruitForOwner(state, city.id, 'england', 'army', true);
      if (next !== state) return { state: next, unitId: `army-${state.nextId}`, position: next.armies.find(army => army.id === `army-${state.nextId}`) };
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
