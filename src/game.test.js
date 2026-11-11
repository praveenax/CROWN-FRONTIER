import test from 'node:test';
import assert from 'node:assert/strict';
import { autoplayStep, cameraFor, createGame, endTurn, isDiscovered, MAP_SIZE, moveCamera, moveUnit, recruit, terrainAt, VIEW_SIZE } from './game.js';

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
  assert.deepEqual(game.resources.england, { gold: 150, food: 135, population: 1180 });
  assert.equal(game.armies.find(unit => unit.id === 'army-2').moves, 0);
  assert.equal(recruit(game, 'london', 'army'), game);
  game = endTurn(game);
  assert.equal(game.armies.find(unit => unit.id === 'army-2').moves, 3);
  assert.deepEqual(game.resources.england, { gold: 175, food: 155, population: 1260 });
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

test('opponents collect and spend resources and move during their turns', () => {
  const before = createGame();
  const game = endTurn(before);
  const enemy = game.armies.find(unit => unit.owner === 'france');
  assert.equal(Math.abs(enemy.x - 20) + Math.abs(enemy.y - 22), 3);
  assert.equal(enemy.troops, 100);
  const levy = game.armies.find(unit => unit.owner === 'france' && unit.id !== enemy.id);
  assert.equal(levy.troops, 60);
  assert.equal(levy.moves, 0);
  assert.deepEqual(game.resources.france, { gold: 145, food: 130, population: 1220 });
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
  let game = createGame();
  for (let step = 0; step < 60 && game.cities.find(city => city.id === 'ashford').owner !== 'england'; step++) {
    const result = autoplayStep(game);
    assert.equal(result.stopped, undefined);
    game = result.state;
  }
  assert.equal(game.cities.find(city => city.id === 'ashford').owner, 'england');
  assert.ok(game.turn > 1);
  assert.ok(game.armies.some(unit => unit.id === 'army-2'));
});

test('autoplay attacks nearby discovered enemies and avoids friendly units', () => {
  let game = createGame();
  const enemy = game.armies.find(unit => unit.owner === 'france');
  Object.assign(enemy, { x: 50, y: 49, troops: 50 });
  game = autoplayStep(game).state;
  assert.equal(game.armies.some(unit => unit.owner === 'france'), false);
  assert.equal(game.armies.find(unit => unit.id === 'army-1').troops, 70);

  game = createGame();
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
  game.resources.england = { gold: 0, food: 0, population: 0 };
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
  game.cities = [{ id: 'target', name: 'Target', x: 44, y: 49, owner: null }];
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
    { id: 'paris', name: 'Paris', x: 60, y: 60, owner: 'france' },
    { id: 'target', name: 'Target', x: 44, y: 49, owner: null },
  ];
  const next = endTurn(game);
  const moved = next.armies.find(unit => unit.id === enemy.id);
  assert.notEqual(terrainAt(moved.x, moved.y), 'water');
  assert.ok(Math.abs(moved.x - enemy.x) + Math.abs(moved.y - enemy.y) <= 3);
  assert.notDeepEqual([moved.x, moved.y], [enemy.x, enemy.y]);
});
