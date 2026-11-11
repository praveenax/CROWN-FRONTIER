import test from 'node:test';
import assert from 'node:assert/strict';
import { autoplayStep, cameraFor, cityDevelopment, createGame, endTurn, isDiscovered, kingdomPopulation, kingdomStandings, MAP_SIZE, moveCamera, moveUnit, recruit, terrainAt, VIEW_SIZE } from './game.js';

test('creates the world with four kingdoms, fog, and a bounded viewport', () => {
  const game = createGame();
  assert.equal(MAP_SIZE, 100);
  assert.equal(VIEW_SIZE, 8);
  assert.equal(game.armies.length, 4);
  assert.equal(game.cities.filter(city => city.capital).length, 4);
  assert.equal(isDiscovered(game, 49, 49), true);
  assert.equal(isDiscovered(game, 0, 0), false);
  assert.deepEqual(cameraFor(99, 99), { x: 92, y: 92 });
  assert.deepEqual(moveCamera({ x: 0, y: 0 }, -1, -1), { x: 0, y: 0 });
});

test('movement is adjacent, limited per turn, reveals land and claims towns', () => {
  let game = createGame();
  assert.equal(moveUnit(game, 'army-1', 51, 49), game);
  game = moveUnit(game, 'army-1', 50, 49);
  game = moveUnit(game, 'army-1', 51, 49);
  game = moveUnit(game, 'army-1', 52, 49);
  assert.equal(game.armies[0].moves, 0);
  assert.equal(isDiscovered(game, 54, 49), true);
  assert.equal(moveUnit(game, 'army-1', 52, 48), game);
  game = endTurn(game);
  game = moveUnit(game, 'army-1', 52, 48);
  game = moveUnit(game, 'army-1', 52, 47);
  assert.equal(game.cities.find(city => city.id === 'ashford').owner, 'england');
});

test('recruitment costs resources, needs an empty city, and units activate next turn', () => {
  let game = createGame();
  assert.equal(recruit(game, 'london'), game);
  game = moveUnit(game, 'army-1', 50, 49);
  game = recruit(game, 'london', 'scout');
  assert.deepEqual(game.resources.england, { gold: 150, food: 135 });
  assert.equal(kingdomPopulation(game, 'england'), 1180);
  assert.equal(game.armies.find(unit => unit.id === 'army-2').moves, 0);
  assert.equal(recruit(game, 'london', 'army'), game);
  game = endTurn(game);
  assert.equal(game.armies.find(unit => unit.id === 'army-2').moves, 3);
  assert.deepEqual(game.resources.england, { gold: 200, food: 180 });
  assert.equal(kingdomPopulation(game, 'england'), 1300);
});

test('combat favors the defender in ties and scouts do not claim settlements', () => {
  let game = createGame();
  const enemy = game.armies.find(unit => unit.owner === 'france');
  Object.assign(enemy, { x: 50, y: 49, troops: 120 });
  game = moveUnit(game, 'army-1', 50, 49);
  assert.equal(game.armies.some(unit => unit.id === 'army-1'), false);
  assert.equal(game.armies.find(unit => unit.owner === 'france').troops, 1);
  game = createGame();
  Object.assign(game.armies[0], { kind: 'scout', x: 52, y: 48 });
  game = moveUnit(game, 'army-1', 52, 47);
  assert.equal(game.cities.find(city => city.id === 'ashford').owner, null);
});

test('opponents collect and spend resources while keeping a garrison', () => {
  const before = createGame();
  const game = endTurn(before);
  const enemy = game.armies.find(unit => unit.owner === 'france');
  assert.deepEqual([enemy.x, enemy.y], [20, 22]);
  assert.equal(enemy.troops, 100);
  const levy = game.armies.find(unit => unit.owner === 'france' && unit.id !== enemy.id);
  assert.equal(levy.troops, 60);
  assert.equal(levy.moves, 0);
  assert.equal(Math.abs(levy.x - 20) + Math.abs(levy.y - 22), 1);
  assert.deepEqual(game.resources.france, { gold: 170, food: 155 });
  assert.equal(kingdomPopulation(game, 'france'), 1260);
  assert.equal(before.turn, 1);
});

test('opponents expand and scout vision reaches farther than army vision', () => {
  let game = createGame();
  for (let turn = 0; turn < 10; turn++) game = endTurn(game);
  assert.ok(game.cities.filter(city => city.owner === 'france').length > 1);

  game = createGame();
  game = moveUnit(game, 'army-1', 50, 49);
  game = recruit(game, 'london', 'scout');
  game = endTurn(game);
  game = moveUnit(game, 'army-2', 49, 48);
  assert.equal(isDiscovered(game, 49, 45), true);
});

test('autoplay explores, conquers, recruits and advances the turn using normal rules', () => {
  let game = createGame(12);
  let recruited = false;
  for (let step = 0; step < 60 && game.cities.find(city => city.id === 'ashford').owner !== 'england'; step++) {
    const result = autoplayStep(game);
    assert.equal(result.stopped, undefined);
    game = result.state;
    recruited ||= game.armies.some(unit => unit.id === 'army-2');
  }
  assert.equal(game.cities.find(city => city.id === 'ashford').owner, 'england');
  assert.ok(game.turn > 1);
  assert.ok(recruited);
});

test('autoplay attacks nearby discovered enemies and avoids friendly units', () => {
  let game = createGame();
  game.cities.find(city => city.id === 'london').owner = null;
  const enemy = game.armies.find(unit => unit.owner === 'france');
  Object.assign(enemy, { x: 50, y: 49, troops: 50 });
  game = autoplayStep(game).state;
  assert.equal(game.armies.some(unit => unit.owner === 'france'), false);
  assert.equal(game.armies.find(unit => unit.id === 'army-1').troops, 70);

  game = createGame();
  game.cities.find(city => city.id === 'london').owner = null;
  game.armies.push({ id: 'ally', owner: 'england', kind: 'army', x: 50, y: 49, troops: 60, units: 5, moves: 0 });
  const result = autoplayStep(game);
  assert.notDeepEqual(result.position, { x: 50, y: 49 });
  assert.equal(result.state.armies.filter(unit => unit.owner === 'england').length, 2);
});

test('autoplay stops on defeat or complete conquest', () => {
  const game = createGame();
  game.cities.forEach(city => { if (city.owner === 'england') city.owner = 'france'; });
  game.armies = game.armies.filter(unit => unit.owner !== 'england');
  assert.match(autoplayStep(game).stopped, /no settlements or units/);
  game.cities.forEach(city => { city.owner = 'england'; });
  game.armies = [];
  assert.match(autoplayStep(game).stopped, /all settlements/);
});

test('autoplay waits for resources to rebuild after losing its army', () => {
  let game = createGame();
  game.armies = game.armies.filter(unit => unit.owner !== 'england');
  game.resources.england = { gold: 0, food: 0 };
  for (let step = 0; step < 5; step++) game = autoplayStep(game).state;
  assert.ok(game.armies.some(unit => unit.owner === 'england'));
});

test('friendly armies merge with both limits and the lower remaining movement', () => {
  let game = createGame();
  game.armies.push({ id: 'ally', name: 'Ally', owner: 'england', kind: 'army', x: 50, y: 49, troops: 180, units: 4, moves: 1 });
  game = moveUnit(game, 'army-1', 50, 49);
  const merged = game.armies.find(unit => unit.id === 'ally');
  assert.deepEqual([merged.troops, merged.units, merged.moves], [300, 5, 1]);
  assert.equal(game.armies.some(unit => unit.id === 'army-1'), false);

  game = createGame();
  const ally = { id: 'ally', name: 'Ally', owner: 'england', kind: 'army', x: 50, y: 49, troops: 181, units: 1, moves: 3 };
  game.armies.push(ally);
  assert.equal(moveUnit(game, 'army-1', 50, 49), game);
  ally.troops = 60;
  ally.units = 5;
  assert.equal(moveUnit(game, 'army-1', 50, 49), game);
  ally.units = 1;
  ally.kind = 'scout';
  assert.equal(moveUnit(game, 'army-1', 50, 49), game);
});

test('water blocks movement and mountains require two movement points', () => {
  let game = createGame();
  const army = game.armies[0];
  army.x = 48;
  army.y = 49;
  assert.equal(terrainAt(47, 49), 'water');
  assert.equal(moveUnit(game, army.id, 47, 49), game);
  assert.equal(terrainAt(48, 48), 'mountain');
  army.moves = 1;
  assert.equal(moveUnit(game, army.id, 48, 48), game);
  army.moves = 2;
  game = moveUnit(game, army.id, 48, 48);
  assert.equal(game.armies[0].moves, 0);
});

test('all generated settlements are reachable on land', () => {
  const game = createGame();
  const seen = new Set(['49,49']);
  const queue = [[49, 49]];
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, key = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= MAP_SIZE || ny >= MAP_SIZE || seen.has(key) || terrainAt(nx, ny) === 'water') continue;
      seen.add(key);
      queue.push([nx, ny]);
    }
  }
  for (const city of game.cities) assert.ok(seen.has(`${city.x},${city.y}`), city.name);
});

test('autoplay routes around water to conquer a known settlement', () => {
  let game = createGame();
  game.armies = game.armies.filter(unit => unit.id === 'army-1');
  game.armies[0].x = 48;
  game.armies[0].y = 49;
  game.cities = [{ id: 'target', name: 'Target', x: 44, y: 49, owner: null, population: 300, defense: 20 }];
  game.discovered['44,49'] = true;
  for (let step = 0; step < 30 && game.cities[0].owner !== 'england'; step++) {
    const result = autoplayStep(game);
    game = result.state;
    for (const unit of game.armies) assert.notEqual(terrainAt(unit.x, unit.y), 'water');
  }
  assert.equal(game.cities[0].owner, 'england');
});

test('opponents can rebuild when their army is defeated', () => {
  const game = createGame();
  game.armies = game.armies.filter(unit => unit.owner !== 'france');
  const next = endTurn(game);
  assert.ok(next.armies.some(unit => unit.owner === 'france' && unit.troops === 60));
});

test('autoplay merges a levy into a nearby friendly army', () => {
  const game = createGame();
  game.cities.find(city => city.id === 'london').owner = null;
  game.armies[0].moves = 0;
  game.armies.push({ id: 'levy', name: 'Levy', owner: 'england', kind: 'army', x: 50, y: 49, troops: 60, units: 1, moves: 3 });
  const next = autoplayStep(game).state;
  assert.equal(next.armies.some(unit => unit.id === 'levy'), false);
  assert.deepEqual([next.armies[0].troops, next.armies[0].units, next.armies[0].moves], [180, 2, 0]);
});

test('rival armies navigate around water and stay within movement budgets', () => {
  const game = createGame();
  const enemy = game.armies.find(unit => unit.owner === 'france');
  Object.assign(enemy, { x: 48, y: 49 });
  game.armies = [enemy];
  game.cities = [
    { id: 'paris', name: 'Paris', x: 60, y: 60, owner: 'france', population: 300, defense: 20 },
    { id: 'target', name: 'Target', x: 44, y: 49, owner: null, population: 300, defense: 20 },
  ];
  const next = endTurn(game);
  const moved = next.armies.find(unit => unit.id === enemy.id);
  assert.notEqual(terrainAt(moved.x, moved.y), 'water');
  assert.ok(Math.abs(moved.x - enemy.x) + Math.abs(moved.y - enemy.y) <= 3);
  assert.notDeepEqual([moved.x, moved.y], [enemy.x, enemy.y]);
});

test('new armies can receive a level-one general, but scouts do not', () => {
  let game = createGame(1);
  const startingGeneral = game.armies[0].general;
  assert.match(startingGeneral.name, /^\w+ \w+$/);
  assert.equal(startingGeneral.level, 1);
  assert.deepEqual(startingGeneral.skills, { fighting: 1, captain: 1, charisma: 1 });
  game = moveUnit(game, 'army-1', 50, 49);
  game.randomSeed = 0;
  const withGeneral = recruit(game, 'london');
  const general = withGeneral.armies.find(unit => unit.id === 'army-2').general;
  assert.ok(general);
  assert.notEqual(general.id, startingGeneral.id);
  assert.notEqual(general.name, startingGeneral.name);
  game.randomSeed = 1000;
  assert.equal(recruit(game, 'london').armies.find(unit => unit.id === 'army-2').general, undefined);
  game.randomSeed = 0;
  assert.equal(recruit(game, 'london', 'scout').armies.find(unit => unit.id === 'army-2').general, undefined);

  game = createGame(1);
  game.randomSeed = 0;
  const rival = endTurn(game).armies.find(unit => unit.owner === 'france' && unit.id !== 'enemy-0');
  assert.ok(rival.general);
});

test('merges preserve either general and reject two generals', () => {
  let game = createGame(1);
  const general = game.armies[0].general;
  const ally = { id: 'ally', name: 'Ally', owner: 'england', kind: 'army', x: 50, y: 49, troops: 60, units: 1, moves: 3 };
  game.armies.push(ally);
  let merged = moveUnit(game, 'army-1', 50, 49);
  assert.deepEqual(merged.armies.find(unit => unit.id === 'ally').general, general);
  assert.equal(game.armies[0].general.id, general.id);

  ally.general = { id: 'other', name: 'Other General', level: 1, skills: { fighting: 1, captain: 1, charisma: 1 } };
  assert.equal(moveUnit(game, 'army-1', 50, 49), game);
  delete game.armies[0].general;
  merged = moveUnit(game, 'army-1', 50, 49);
  assert.equal(merged.armies.find(unit => unit.id === 'ally').general.id, 'other');
});

test('winning generals level and gain exactly one skill point without mutating previous state', () => {
  const game = createGame(1);
  const general = game.armies[0].general;
  Object.assign(game.armies.find(unit => unit.owner === 'france'), { x: 50, y: 49, troops: 50 });
  const next = moveUnit(game, 'army-1', 50, 49);
  const winner = next.armies.find(unit => unit.id === 'army-1').general;
  assert.equal(winner.level, 2);
  assert.equal(Object.values(winner.skills).reduce((sum, value) => sum + value, 0), 4);
  assert.deepEqual(general.skills, { fighting: 1, captain: 1, charisma: 1 });
  assert.equal(general.level, 1);
  assert.ok(next.log.some(entry => entry.includes('reached level 2')));
  Object.assign(next.armies.find(unit => unit.owner === 'castile'), { x: 51, y: 49, troops: 10 });
  const secondWin = moveUnit(next, 'army-1', 51, 49);
  const veteran = secondWin.armies.find(unit => unit.id === 'army-1').general;
  assert.equal(veteran.level, 3);
  assert.equal(Object.values(veteran.skills).reduce((sum, value) => sum + value, 0), 5);
  assert.equal(winner.level, 2);
});

test('a victorious defender levels up and the defeated general is removed', () => {
  const game = createGame(1);
  const enemy = game.armies.find(unit => unit.owner === 'france');
  Object.assign(enemy, { x: 50, y: 49, troops: 120, general: { id: 'defender', name: 'Rival General', level: 1, skills: { fighting: 1, captain: 1, charisma: 1 } } });
  const next = moveUnit(game, 'army-1', 50, 49);
  assert.equal(next.armies.some(unit => unit.id === 'army-1'), false);
  const general = next.armies.find(unit => unit.id === enemy.id).general;
  assert.equal(general.level, 2);
  assert.equal(Object.values(general.skills).reduce((sum, value) => sum + value, 0), 4);
});

test('barbarians spawn periodically on empty land near kingdoms with limited strength', () => {
  let game = createGame(12);
  for (let turn = 0; turn < 3; turn++) game = endTurn(game);
  const bands = game.armies.filter(unit => unit.owner === 'barbarian');
  assert.equal(bands.length, 2);
  assert.ok(bands.some(unit => Math.abs(unit.x - 49) + Math.abs(unit.y - 49) >= 4 && Math.abs(unit.x - 49) + Math.abs(unit.y - 49) <= 6));
  for (const band of bands) {
    assert.ok(band.troops >= 20 && band.troops <= 40);
    assert.notEqual(terrainAt(band.x, band.y), 'water');
    assert.equal(game.armies.filter(unit => unit.x === band.x && unit.y === band.y).length, 1);
    assert.equal(game.cities.some(city => city.x === band.x && city.y === band.y), false);
  }
});

test('an unguarded city is raided without changing ownership or making resources negative', () => {
  const game = createGame(12);
  game.armies = game.armies.filter(unit => unit.owner !== 'england');
  game.resources.england = { gold: 0, food: 0 };
  game.cities.find(city => city.id === 'london').population = 0;
  game.armies.push({ id: 'raiders', name: 'Barbarian raiders', owner: 'barbarian', kind: 'barbarian', x: 50, y: 49, troops: 30, units: 1, moves: 0 });
  const next = endTurn(game);
  assert.equal(next.cities.find(city => city.id === 'london').owner, 'england');
  assert.deepEqual(next.resources.england, { gold: 0, food: 0 });
  assert.equal(kingdomPopulation(next, 'england'), 30);
  assert.equal(next.armies.some(unit => unit.id === 'raiders'), false);
  assert.ok(next.log.some(entry => entry.includes('raided London')));
  assert.deepEqual(game.resources.england, { gold: 0, food: 0 });
  assert.equal(kingdomPopulation(game, 'england'), 0);
});

test('a garrison battles raiders and its general earns experience on victory', () => {
  const game = createGame(12);
  game.armies.push({ id: 'raiders', name: 'Barbarian raiders', owner: 'barbarian', kind: 'barbarian', x: 50, y: 49, troops: 30, units: 1, moves: 0 });
  const next = endTurn(game);
  const guard = next.armies.find(unit => unit.id === 'army-1');
  assert.equal(guard.troops, 90);
  assert.equal(guard.general.level, 2);
  assert.equal(next.armies.some(unit => unit.id === 'raiders'), false);
  assert.deepEqual(next.resources.england, { gold: 230, food: 195 });
  assert.equal(kingdomPopulation(next, 'england'), 1320);
});

test('raiders loot a city after defeating its garrison', () => {
  const game = createGame(12);
  game.armies.find(unit => unit.id === 'army-1').troops = 10;
  game.armies.push({ id: 'raiders', name: 'Barbarian raiders', owner: 'barbarian', kind: 'barbarian', x: 50, y: 49, troops: 60, units: 1, moves: 0 });
  const next = endTurn(game);
  assert.equal(next.armies.some(unit => unit.id === 'army-1' || unit.id === 'raiders'), false);
  assert.equal(next.cities.find(city => city.id === 'london').owner, 'england');
  assert.deepEqual(next.resources.england, { gold: 200, food: 175 });
  assert.equal(kingdomPopulation(next, 'england'), 1270);
  assert.ok(next.log.some(entry => entry.includes('raided London')));
});

test('chronicle retains turn-stamped history and starting capitals', () => {
  let game = createGame(12);
  const firstEntries = [...game.log];
  assert.ok(firstEntries.some(entry => entry.includes('Turn 1: England established its capital at London')));
  assert.ok(firstEntries.some(entry => entry.includes('France established its capital at Paris')));
  for (let turn = 0; turn < 10; turn++) game = endTurn(game);
  assert.ok(game.log.length > 8);
  assert.deepEqual(game.log.slice(-firstEntries.length), firstEntries);
  assert.ok(game.log.every(entry => /^Turn \d+: /.test(entry)));
});

test('chronicle records off-screen battles and raid losses with their turn', () => {
  const game = createGame(12);
  const defender = game.armies.find(unit => unit.owner === 'france');
  defender.troops = 10;
  game.armies.push({ id: 'raiders', name: 'Barbarian raiders', owner: 'barbarian', kind: 'barbarian', x: 21, y: 22, troops: 60, units: 1, moves: 0 });
  assert.equal(isDiscovered(game, 20, 22), false);
  const next = endTurn(game);
  const battle = next.log.find(entry => entry.includes('attacked France host [France]'));
  assert.match(battle, /Turn 2: .*Paris \(21, 23\): 60 vs 10.*50 remaining/);
  assert.ok(next.log.some(entry => /Turn 2: Barbarians raided Paris.*owned by France.*30 gold, 20 food and 50 population/.test(entry)));
  assert.ok(next.log.indexOf(battle) < next.log.findIndex(entry => entry.includes('Turn 2 begins')));
});

test('autoplay retains garrisons and can recruit mobile armies next to them', () => {
  const game = createGame(12);
  const result = autoplayStep(game);
  const guard = result.state.armies.find(unit => unit.id === 'army-1');
  const levy = result.state.armies.find(unit => unit.id === 'army-2');
  assert.deepEqual([guard.x, guard.y], [49, 49]);
  assert.equal(Math.abs(levy.x - 49) + Math.abs(levy.y - 49), 1);
  assert.equal(levy.moves, 0);
  assert.deepEqual(result.state.resources.england, { gold: 120, food: 110 });
  assert.equal(kingdomPopulation(result.state, 'england'), 1140);
});

test('autoplay sends an available army back to an unguarded city', () => {
  const game = createGame(12);
  game.armies[0].x = 50;
  const next = autoplayStep(game).state;
  const guard = next.armies.find(unit => unit.id === 'army-1');
  assert.deepEqual([guard.x, guard.y], [49, 49]);
});

test('barbarians travel toward settlements around water', () => {
  const game = createGame(12);
  game.armies = game.armies.filter(unit => unit.owner !== 'england');
  game.armies.push({ id: 'raiders', name: 'Barbarian raiders', owner: 'barbarian', kind: 'barbarian', x: 44, y: 49, troops: 25, units: 1, moves: 0 });
  const next = endTurn(game);
  const band = next.armies.find(unit => unit.id === 'raiders');
  assert.ok(band);
  assert.notEqual(terrainAt(band.x, band.y), 'water');
  assert.notDeepEqual([band.x, band.y], [44, 49]);
});

test('city growth unlocks buildings and recruitment uses local population', () => {
  let game = createGame(12);
  const london = game.cities.find(city => city.id === 'london');
  london.population = 420;
  london.defense = 20;
  game = moveUnit(game, 'army-1', 50, 49);
  const before = game;
  game = endTurn(game);
  const grown = game.cities.find(city => city.id === 'london');
  assert.equal(grown.population, 500);
  assert.equal(cityDevelopment(grown).level, 2);
  assert.ok(cityDevelopment(grown).buildings.includes('Guildhall'));
  assert.deepEqual(game.resources.england, { gold: 205, food: 170 });
  assert.equal(grown.defense, 30);
  assert.equal(before.cities.find(city => city.id === 'london').population, 420);
  assert.equal(cityDevelopment({ population: 999 }).level, 2);
  assert.ok(cityDevelopment({ population: 1000 }).buildings.includes('Bank'));
  assert.equal(cityDevelopment({ population: 1999 }).level, 3);
  assert.ok(cityDevelopment({ population: 2000 }).buildings.includes('Stone walls'));
  game = recruit(game, 'london');
  assert.equal(game.cities.find(city => city.id === 'london').population, 440);
  assert.equal(cityDevelopment(game.cities.find(city => city.id === 'london')).level, 1);
  assert.equal(game.cities.find(city => city.id === 'london').defense, 20);
  assert.ok(game.log.some(entry => entry.includes('fell to level 1')));

  const ashford = game.cities.find(city => city.id === 'ashford');
  ashford.owner = 'england';
  ashford.population = 59;
  assert.equal(recruit(game, 'ashford'), game);
});

test('city defenses fight independently, recover, and transfer population when conquered', () => {
  let game = createGame(12);
  const army = game.armies.find(unit => unit.id === 'army-1');
  Object.assign(army, { x: 52, y: 48, troops: 20 });
  let next = moveUnit(game, army.id, 52, 47);
  assert.equal(next.armies.some(unit => unit.id === army.id), false);
  assert.equal(next.cities.find(city => city.id === 'ashford').owner, null);
  assert.equal(next.cities.find(city => city.id === 'ashford').defense, 1);
  assert.ok(next.log.some(entry => entry.includes('The city held with 1 defense remaining')));
  next = endTurn(next);
  assert.equal(next.cities.find(city => city.id === 'ashford').defense, 20);

  game = createGame(12);
  Object.assign(game.armies[0], { x: 52, y: 48, troops: 21 });
  next = moveUnit(game, 'army-1', 52, 47);
  assert.equal(next.cities.find(city => city.id === 'ashford').owner, 'england');
  assert.equal(next.cities.find(city => city.id === 'ashford').defense, 0);
  assert.equal(next.armies.find(unit => unit.id === 'army-1').troops, 1);
  assert.equal(kingdomPopulation(next, 'england'), 1500);
  assert.equal(kingdomPopulation(game, 'england'), 1200);
});

test('standings rank kingdoms from economy, forces, defenses and map territory', () => {
  const game = createGame(12);
  game.cities = [
    { id: 'a', x: 0, y: 0, owner: 'england', population: 500, defense: 30 },
    { id: 'b', x: 99, y: 0, owner: 'france', population: 300, defense: 20 },
  ];
  game.resources.england = { gold: 10, food: 20 };
  game.resources.france = { gold: 0, food: 0 };
  game.armies = [{ owner: 'england', troops: 50 }];
  const standings = kingdomStandings(game);
  assert.deepEqual(standings[0], { owner: 'england', economic: 1180, military: 80, land: 50000, total: 51260 });
  assert.deepEqual(standings.find(row => row.owner === 'france'), { owner: 'france', economic: 750, military: 20, land: 50000, total: 50770 });
  game.cities[0].owner = 'france';
  const after = kingdomStandings(game);
  assert.equal(after[0].owner, 'france');
  assert.equal(after.find(row => row.owner === 'england').land, 0);
  assert.equal(after[0].land, 100000);
});
