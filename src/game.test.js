import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraFor, createGame, endTurn, isDiscovered, MAP_SIZE, moveCamera, moveUnit, recruit, VIEW_SIZE } from './game.js';

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
  assert.equal(enemy.troops, 120);
  assert.deepEqual(game.resources.france, { gold: 185, food: 155, population: 1260 });
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
