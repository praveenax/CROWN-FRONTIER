import test from 'node:test';
import assert from 'node:assert/strict';
import { autoplayStep, buildBuilding, cameraFor, chronicleEntries, cityDevelopment, createGame, endTurn, isDiscovered, kingdomPopulation, kingdomStandings, KINGDOMS, MAP_SIZE, MAP_SIZES, MAX_MERGED_UNITS, MAX_TROOPS, moveCamera, moveUnit, recruit, terrainAt, TROOP_TYPES, resolveWorldEvent, worldEventChoices, VIEW_SIZE } from './game.js';
import { WORLD_EVENTS } from './worldEvents.js';

test('creates the world with four kingdoms, fog, and a bounded viewport', () => {
  const game = createGame();
  assert.equal(MAP_SIZE, 100);
  assert.equal(VIEW_SIZE, 8);
  assert.equal(game.armies.length, 4);
  assert.equal(game.cities.filter(city => city.capital).length, 4);
  for (const owner of ['england', 'france', 'castile', 'norway']) {
    assert.equal(game.cities.find(city => city.owner === owner && city.capital).name, KINGDOMS[owner].capital);
  }
  assert.equal(isDiscovered(game, 49, 49), true);
  assert.equal(isDiscovered(game, 0, 0), false);
  assert.deepEqual(cameraFor(99, 99), { x: 92, y: 92 });
  assert.deepEqual(moveCamera({ x: 0, y: 0 }, -1, -1), { x: 0, y: 0 });
});

test('each kingdom receives a distinct, seeded ruler that persists through turns', () => {
  const firstNames = new Set();
  const lastNames = new Set();
  for (let i = 0; i < 100; i++) {
    const seed = Math.imul(i, 2654435761) >>> 0;
    const game = createGame(seed);
    const rulers = Object.values(game.rulers);
    assert.equal(rulers.length, 4);
    assert.equal(new Set([...rulers, game.armies[0].general.name]).size, 5);
    assert.deepEqual(createGame(seed).rulers, game.rulers);
    for (const ruler of rulers) {
      assert.match(ruler, /^\w+ \w+$/);
      const [first, last] = ruler.split(' ');
      firstNames.add(first);
      lastNames.add(last);
    }
  }
  assert.ok(firstNames.size > 16);
  assert.ok(lastNames.size > 16);
  const game = createGame(12);
  assert.deepEqual(endTurn(game).rulers, game.rulers);
});

test('city gold generation and Trading Post income are reduced', () => {
  assert.deepEqual(
    [0, 500, 1000, 2000].map(population => cityDevelopment({ population }).gold),
    [12, 18, 25, 35],
  );
  const tradingPost = cityDevelopment({ population: 1000, constructedBuildings: ['trading-post'] });
  assert.equal(tradingPost.gold, 35);
  assert.equal(tradingPost.food, 45);
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
  assert.deepEqual(game.resources.england, { gold: 175, food: 180 });
  assert.equal(kingdomPopulation(game, 'england'), 1300);
});

test('cities recruit each single-type troop squad at its listed cost', () => {
  for (const [type, troop] of Object.entries(TROOP_TYPES)) {
    let game = createGame(12);
    game = moveUnit(game, 'army-1', 50, 49);
    game.resources.england = { gold: 500, food: 500 };
    const recruited = recruit(game, 'london', type);
    const squad = recruited.armies.find(unit => unit.id === 'army-2');
    assert.equal(squad.troopType, type);
    assert.equal(squad.troops, 60);
    assert.deepEqual(recruited.resources.england, {
      gold: 500 - troop.cost.gold,
      food: 500 - troop.cost.food,
    });
  }

  let game = createGame(12);
  game = moveUnit(game, 'army-1', 50, 49);
  assert.equal(recruit(game, 'london').armies.find(unit => unit.id === 'army-2').troopType, 'spearman');
  assert.equal(recruit(game, 'london', 'army').armies.find(unit => unit.id === 'army-2').troopType, 'spearman');
});

test('armies of different troop types cannot merge', () => {
  const game = createGame();
  game.armies[0].troopType = 'swordsman';
  game.armies.push({
    id: 'spearmen',
    name: 'Spearmen',
    owner: 'england',
    kind: 'army',
    troopType: 'spearman',
    x: 50,
    y: 49,
    troops: 60,
    maxTroops: 60,
    units: 1,
    moves: 3,
  });
  assert.equal(moveUnit(game, 'army-1', 50, 49), game);
});

test('archers fire first and knights reduce incoming arrow casualties', () => {
  let game = createGame();
  const enemy = game.armies.find(unit => unit.owner === 'france');
  Object.assign(enemy, { x: 50, y: 49, troopType: 'archer', troops: 60 });
  game.armies[0].troops = 60;
  game = moveUnit(game, 'army-1', 50, 49);
  assert.equal(game.armies.some(unit => unit.id === 'army-1'), false);
  assert.equal(game.armies.find(unit => unit.owner === 'france').troops, 4);
  assert.ok(game.log.some(entry => entry.includes('Archer volleys caused 15 attacker and 0 defender casualties')));

  assert.ok(game.log.some(entry => entry.includes('Archer volleys tipped the battle')));

  game = createGame();
  const knights = game.armies.find(unit => unit.owner === 'france');
  Object.assign(knights, { x: 50, y: 49, troopType: 'knight', troops: 60 });
  Object.assign(game.armies[0], { troopType: 'archer', troops: 60 });
  game = moveUnit(game, 'army-1', 50, 49);
  assert.equal(game.armies.find(unit => unit.owner === 'france').troops, 10);
  assert.ok(game.log.some(entry => entry.includes('0 attacker and 7 defender casualties')));
  assert.ok(!game.log.some(entry => entry.includes('Archer volleys tipped the battle')));
});

test('the Chronicle highlights a close battle without volleys', () => {
  const game = createGame(12);
  const enemy = game.armies.find(unit => unit.owner === 'france');
  Object.assign(enemy, { x: 50, y: 49, troopType: 'spearman', troops: 40 });
  game.armies[0].troops = 60;
  const next = moveUnit(game, 'army-1', 50, 49);
  assert.ok(next.logEvents.some(event =>
    event.category === 'major' && event.text.includes('narrowly won with 1 soldier remaining')));
});

test('archers weaken city defenses with a siege volley', () => {
  const game = createGame(12);
  Object.assign(game.armies[0], { x: 52, y: 48, troopType: 'archer', troops: 60 });
  const next = moveUnit(game, 'army-1', 52, 47);
  assert.equal(next.cities.find(city => city.id === 'ashford').owner, 'england');
  assert.equal(next.armies.find(unit => unit.id === 'army-1').troops, 53);
  assert.ok(next.log.some(entry => entry.includes('reducing its defenses by 15')));
});

test('combat favors the defender in ties and scouts do not claim settlements', () => {
  let game = createGame();
  const enemy = game.armies.find(unit => unit.owner === 'france');
  Object.assign(enemy, { x: 50, y: 49, troops: 120 });
  game = moveUnit(game, 'army-1', 50, 49);
  assert.equal(game.armies.some(unit => unit.id === 'army-1'), false);
  assert.equal(game.armies.find(unit => unit.owner === 'france').troops, 40);
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
  assert.equal(levy.troopType, 'archer');
  assert.equal(Math.abs(levy.x - 20) + Math.abs(levy.y - 22), 1);
  assert.deepEqual(game.resources.france, { gold: 135, food: 150 });
  assert.equal(kingdomPopulation(game, 'france'), 1260);
  assert.equal(before.turn, 1);
});

test('opponents expand and scout vision reaches farther than army vision', () => {
  let game = createGame(12);
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
  assert.equal(game.armies.find(unit => unit.id === 'army-1').troops, 45);

  game = createGame();
  game.cities.find(city => city.id === 'london').owner = null;
  game.armies.push({ id: 'ally', owner: 'england', kind: 'army', x: 50, y: 49, troops: 60, maxTroops: 60, units: MAX_MERGED_UNITS, moves: 0 });
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
  game.armies.push({ id: 'ally', name: 'Ally', owner: 'england', kind: 'army', x: 50, y: 49, troops: MAX_TROOPS - 120, maxTroops: MAX_TROOPS - 120, units: MAX_MERGED_UNITS - 1, moves: 1 });
  game = moveUnit(game, 'army-1', 50, 49);
  const merged = game.armies.find(unit => unit.id === 'ally');
  assert.deepEqual([merged.troops, merged.units, merged.moves], [MAX_TROOPS, MAX_MERGED_UNITS, 1]);
  assert.equal(merged.maxTroops, MAX_TROOPS);
  assert.equal(game.armies.some(unit => unit.id === 'army-1'), false);

  game = createGame();
  const ally = { id: 'ally', name: 'Ally', owner: 'england', kind: 'army', x: 50, y: 49, troops: MAX_TROOPS - 119, maxTroops: MAX_TROOPS - 119, units: 1, moves: 3 };
  game.armies.push(ally);
  assert.equal(moveUnit(game, 'army-1', 50, 49), game);
  ally.troops = 60;
  ally.units = MAX_MERGED_UNITS;
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
  for (const city of game.cities) {
    assert.notEqual(terrainAt(city.x, city.y), 'water', city.name);
    assert.ok(seen.has(`${city.x},${city.y}`), city.name);
  }
});

test('the world contains more lakes and mountains while retaining passable land', () => {
  const counts = { water: 0, mountain: 0 };
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const terrain = terrainAt(x, y);
      if (terrain in counts) counts[terrain]++;
    }
  }
  assert.ok(counts.water >= 400 && counts.water < 1000);
  assert.ok(counts.mountain >= 500 && counts.mountain < 1500);
});

test('garrisoned armies recover a tenth of full strength for free, up to their capacity', () => {
  let game = createGame(12);
  game = moveUnit(game, 'army-1', 50, 49);
  game = recruit(game, 'london');
  const levy = game.armies.find(unit => unit.id === 'army-2');
  assert.equal(levy.maxTroops, 60);
  levy.troops = 20;
  game.armies = [levy];
  game.cities = [...game.cities.filter(city => city.id === 'london'), { id: 'neutral', x: 0, y: 0, owner: null, population: 0, defense: 20 }];
  const before = game;
  game = endTurn(game);
  assert.equal(game.armies[0].troops, 26);
  assert.equal(before.armies[0].troops, 20);
  assert.deepEqual(game.resources.england, { gold: before.resources.england.gold + 25, food: before.resources.england.food + 45 });
  assert.equal(game.cities[0].population, before.cities[0].population + 120);
  assert.ok(game.log.some(entry => entry.includes(`recovered 6 soldiers in ${KINGDOMS.england.capital}`)));
  game = endTurn(game);
  assert.equal(game.armies[0].troops, 32);
  game.armies[0].troops = 59;
  game = endTurn(game);
  assert.equal(game.armies.find(unit => unit.id === levy.id).troops, 60);
});

test('only armies in friendly cities recover, including rival armies', () => {
  const game = createGame(12);
  const guard = game.armies[0];
  Object.assign(guard, { x: 50, y: 49, troops: 20 });
  game.armies.push({ id: 'scout', name: 'Scout', owner: 'england', kind: 'scout', x: 49, y: 49, troops: 10, units: 1, moves: 0 });
  const rival = game.armies.find(unit => unit.owner === 'france');
  rival.troops = 20;
  const next = endTurn(game);
  assert.equal(next.armies.find(unit => unit.id === guard.id).troops, 20);
  assert.equal(next.armies.find(unit => unit.id === 'scout').troops, 10);
  assert.equal(next.armies.find(unit => unit.id === rival.id).troops, 30);
});

test('a garrison recovers before barbarians attack', () => {
  const game = createGame(12);
  const guard = game.armies[0];
  guard.troops = 20;
  game.armies = [guard, { id: 'raiders', name: 'Barbarian raiders', owner: 'barbarian', kind: 'barbarian', x: 50, y: 49, troops: 25, units: 1, moves: 0 }];
  const next = endTurn(game);
  assert.equal(next.armies.find(unit => unit.id === guard.id).troops, 16);
  assert.equal(next.armies.some(unit => unit.id === 'raiders'), false);
  assert.equal(next.cities.find(city => city.id === 'london').defense, 40);
});

test('merged damaged armies recover according to combined full strength', () => {
  let game = createGame(12);
  game.armies[0].troops = 70;
  game.armies.push({ id: 'ally', name: 'Ally', owner: 'england', kind: 'army', x: 50, y: 49, troops: 50, maxTroops: 180, units: 3, moves: 3 });
  game = moveUnit(game, 'army-1', 50, 49);
  const merged = game.armies.find(unit => unit.id === 'ally');
  assert.equal(merged.maxTroops, 300);
  game = moveUnit(game, 'ally', 49, 49);
  game = endTurn(game);
  assert.equal(game.armies.find(unit => unit.id === 'ally').troops, 150);

  game = createGame(12);
  game.armies[0].troops = 70;
  game.armies.push({ id: 'ally', name: 'Ally', owner: 'england', kind: 'army', x: 50, y: 49, troops: 50, maxTroops: MAX_TROOPS - 119, units: 3, moves: 3 });
  game = moveUnit(game, 'army-1', 50, 49);
  assert.equal(game.armies.find(unit => unit.id === 'ally').maxTroops, MAX_TROOPS);
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
  game.armies.push({ id: 'levy', name: 'Levy', owner: 'england', kind: 'army', x: 50, y: 49, troops: 60, maxTroops: 60, units: 1, moves: 3 });
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
  game.rulers.england = general.name;
  assert.notEqual(recruit(game, 'london').armies.find(unit => unit.id === 'army-2').general.name, general.name);
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
  const ally = { id: 'ally', name: 'Ally', owner: 'england', kind: 'army', x: 50, y: 49, troops: 60, maxTroops: 60, units: 1, moves: 3 };
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
  assert.ok(next.log.some(entry => entry.includes(`raided ${KINGDOMS.england.capital}`)));
  assert.deepEqual(game.resources.england, { gold: 0, food: 0 });
  assert.equal(kingdomPopulation(game, 'england'), 0);
});

test('a garrison battles raiders and its general earns experience on victory', () => {
  const game = createGame(12);
  game.armies.push({ id: 'raiders', name: 'Barbarian raiders', owner: 'barbarian', kind: 'barbarian', x: 50, y: 49, troops: 30, units: 1, moves: 0 });
  const next = endTurn(game);
  const guard = next.armies.find(unit => unit.id === 'army-1');
  assert.equal(guard.troops, 100);
  assert.equal(guard.general.level, 2);
  assert.equal(next.armies.some(unit => unit.id === 'raiders'), false);
  assert.deepEqual(next.resources.england, { gold: 205, food: 195 });
  assert.equal(kingdomPopulation(next, 'england'), 1320);
});

test('raiders loot a city after defeating its garrison', () => {
  const game = createGame(12);
  Object.assign(game.armies.find(unit => unit.id === 'army-1'), { troops: 10, maxTroops: 10 });
  game.armies.push({ id: 'raiders', name: 'Barbarian raiders', owner: 'barbarian', kind: 'barbarian', x: 50, y: 49, troops: 60, units: 1, moves: 0 });
  const next = endTurn(game);
  assert.equal(next.armies.some(unit => unit.id === 'army-1' || unit.id === 'raiders'), false);
  assert.equal(next.cities.find(city => city.id === 'london').owner, 'england');
  assert.deepEqual(next.resources.england, { gold: 175, food: 175 });
  assert.equal(kingdomPopulation(next, 'england'), 1270);
  assert.ok(next.log.some(entry => entry.includes(`raided ${KINGDOMS.england.capital}`)));
});

test('chronicle retains turn-stamped history and starting capitals', () => {
  let game = createGame(12);
  const firstEntries = [...game.log];
  assert.ok(firstEntries.some(entry => entry.includes(`Turn 1: ${KINGDOMS.england.name} established its capital at ${KINGDOMS.england.capital}`) && entry.includes(game.rulers.england)));
  assert.ok(firstEntries.some(entry => entry.includes(`${KINGDOMS.france.name} established its capital at ${KINGDOMS.france.capital}`) && entry.includes(game.rulers.france)));
  for (let turn = 0; turn < 10; turn++) game = endTurn(game);
  assert.ok(game.log.length > 8);
  assert.deepEqual(game.log.slice(-firstEntries.length), firstEntries);
  assert.ok(game.log.every(entry => /^Turn \d+: /.test(entry)));
});

test('chronicle records off-screen battles and raid losses with their turn', () => {
  const game = createGame(12);
  const defender = game.armies.find(unit => unit.owner === 'france');
  Object.assign(defender, { troops: 10, maxTroops: 10 });
  game.armies.push({ id: 'raiders', name: 'Barbarian raiders', owner: 'barbarian', kind: 'barbarian', x: 21, y: 22, troops: 60, units: 1, moves: 0 });
  assert.equal(isDiscovered(game, 20, 22), false);
  const next = endTurn(game);
  const battle = next.log.find(entry => entry.includes(`attacked ${KINGDOMS.france.name} host [${KINGDOMS.france.name}]`));
  assert.ok(battle.includes(`Turn 2: `) && battle.includes(`${KINGDOMS.france.capital} (21, 23): 60 vs 10`) && battle.includes('45 remaining'));
  assert.ok(next.log.some(entry => entry.includes(`owned by ${KINGDOMS.france.name}`) && entry.includes(`Turn 2: Barbarians raided ${KINGDOMS.france.capital}`) && entry.includes('30 gold, 20 food and 50 population')));
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
  assert.equal(levy.troopType, 'archer');
  assert.deepEqual(result.state.resources.england, { gold: 110, food: 105 });
  assert.equal(kingdomPopulation(result.state, 'england'), 1140);
});

test('autoplay falls back to spearmen when specialist units are unaffordable', () => {
  const game = createGame(12);
  game.resources.england.gold = 60;
  const result = autoplayStep(game);
  const recruited = result.state.armies.find(unit => unit.id === result.unitId);
  assert.equal(recruited.troopType, 'spearman');
  assert.equal(result.state.resources.england.gold, 0);
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
  assert.deepEqual(game.resources.england, { gold: 192, food: 170 });
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
  assert.deepEqual(standings[0], { owner: 'england', economic: 1010, military: 80, land: 50000, total: 51090 });
  assert.deepEqual(standings.find(row => row.owner === 'france'), { owner: 'france', economic: 620, military: 20, land: 50000, total: 50640 });
  game.cities[0].owner = 'france';
  const after = kingdomStandings(game);
  assert.equal(after[0].owner, 'france');
  assert.equal(after.find(row => row.owner === 'england').land, 0);
  assert.equal(after[0].land, 100000);
});

test('cities can construct affordable improvements once and apply their effects', () => {
  let game = createGame(12);
  const city = game.cities.find(place => place.id === 'london');
  game.resources.england = { gold: 500, food: 500 };
  const original = game;

  game = buildBuilding(game, city.id, 'granary');
  assert.deepEqual(game.resources.england, { gold: 455, food: 480 });
  assert.equal(cityDevelopment(game.cities.find(place => place.id === city.id)).food, 60);
  assert.equal(cityDevelopment(game.cities.find(place => place.id === city.id)).growth, 150);
  assert.ok(cityDevelopment(game.cities.find(place => place.id === city.id)).buildings.includes('Granary'));
  assert.equal(buildBuilding(game, city.id, 'granary'), game);

  game = buildBuilding(game, city.id, 'watchtower');
  const developed = game.cities.find(place => place.id === city.id);
  assert.equal(cityDevelopment(developed).defense, 50);
  assert.equal(developed.defense, 50);
  game = buildBuilding(game, city.id, 'trading-post');
  assert.equal(cityDevelopment(game.cities.find(place => place.id === city.id)).gold, 35);
  game = buildBuilding(game, city.id, 'academy');
  assert.equal(cityDevelopment(game.cities.find(place => place.id === city.id)).growth, 250);
  assert.deepEqual(original.cities.find(place => place.id === city.id).constructedBuildings, undefined);

  const poor = createGame(12);
  poor.resources.england = { gold: 0, food: 0 };
  assert.equal(buildBuilding(poor, 'london', 'granary'), poor);
  const lowLevel = createGame(12);
  lowLevel.cities.find(place => place.id === 'london').population = 300;
  assert.equal(buildBuilding(lowLevel, 'london', 'academy'), lowLevel);
  const rivalCity = createGame(12);
  rivalCity.cities.find(place => place.id === 'london').owner = 'france';
  assert.equal(buildBuilding(rivalCity, 'london', 'granary'), rivalCity);
});

test('victory and defeat end the campaign and block further turns and orders', () => {
  let game = createGame(12);
  game.cities.forEach(city => { city.owner = 'england'; });
  game.armies = game.armies.filter(unit => unit.owner === 'england');
  const victory = moveUnit(game, 'army-1', 50, 49);
  assert.equal(victory.gameOver.outcome, 'victory');
  assert.equal(game.gameOver, null);
  assert.equal(moveUnit(victory, 'army-1', 51, 49), victory);
  assert.equal(endTurn(victory), victory);
  assert.equal(autoplayStep(victory).stopped, victory.gameOver.message);

  game = createGame(12);
  game.cities.forEach(city => { if (city.owner === 'england') city.owner = 'france'; });
  game.armies = game.armies.filter(unit => unit.owner !== 'england');
  const defeat = endTurn(game);
  assert.equal(defeat.gameOver.outcome, 'defeat');
  assert.equal(endTurn(defeat), defeat);
});

test('one operation links the actual order, battle, breach, capture and general history', () => {
  const game = createGame(12);
  const general = game.armies[0].general;
  Object.assign(game.armies[0], { x: 52, y: 48, troops: 120 });
  const city = game.cities.find(place => place.id === 'ashford');
  city.owner = 'france';
  city.defense = 20;
  const enemy = game.armies.find(unit => unit.owner === 'france');
  Object.assign(enemy, { x: 52, y: 47, troops: 60, general: { id: 'enemy-general', name: 'Evelyn Other', level: 1, skills: { fighting: 1, captain: 1, charisma: 1 } } });

  const next = moveUnit(game, 'army-1', 52, 47);
  const related = next.log.filter(entry => entry.includes('[operation-1]'));
  assert.ok(related.some(entry => entry.includes('Manual move to (53, 48)') && entry.includes(`${general.name} [${general.id}]`) && entry.includes('120 troops')));
  assert.ok(related.some(entry => entry.includes('120 vs 60') && entry.includes('Attacker survivors: 30')));
  assert.ok(related.some(entry => entry.includes('30 vs 20') && entry.includes('10 troops remaining')));
  assert.ok(related.some(entry => entry.includes('claimed Ashford') && entry.includes('Survivors: 10') && entry.includes('Future production belongs to the new owner')));
  assert.ok(related.some(entry => entry.includes(`${KINGDOMS.england.name}'s first conquest`)));
  assert.ok(related.some(entry => entry.includes('enemy-general') && entry.includes('was lost')));
  assert.ok(next.generalHistory[general.id].events.some(event => event.includes('won battle')));
  assert.ok(next.generalHistory[general.id].events.some(event => event.includes('promoted')));
  assert.ok(next.generalHistory[general.id].events.some(event => event.includes('captured Ashford [ashford]')));
  assert.ok(next.generalHistory['enemy-general'].events.some(event => event.includes('defeated and lost')));
  assert.deepEqual(game.generalHistory[general.id].events, []);
});

test('ownership history distinguishes settlements and tracks occupation length across captures', () => {
  let game = createGame(12);
  const city = game.cities.find(place => place.id === 'ashford');
  Object.assign(game.armies[0], { x: 52, y: 48, troops: 120 });
  game = moveUnit(game, 'army-1', 52, 47);
  assert.deepEqual(game.cities.find(place => place.id === city.id).ownershipHistory.map(entry => entry.owner), [null, 'england']);
  const original = game;
  game.turn = 5;
  game.armies = game.armies.filter(unit => unit.owner === 'england');
  game.cities.forEach(place => { if (place.owner === 'france') place.owner = null; });
  game.armies.push({ id: 'rival', name: 'Rival', owner: 'france', kind: 'army', x: 53, y: 47, troops: 300, maxTroops: 300, units: 1, moves: 3 });
  game = endTurn(game);
  const captured = game.cities.find(place => place.id === city.id);
  assert.equal(captured.owner, 'france');
  assert.deepEqual(captured.ownershipHistory.map(entry => entry.owner), [null, 'england', 'france']);
  assert.ok(game.log.some(entry => entry.includes('claimed Ashford') && entry.includes('ownership changes: 2') && entry.includes('Previous occupation: 5 completed turns')));
  assert.equal(original.cities.find(place => place.id === city.id).ownershipHistory.length, 2);
});

test('autoplay logs its chosen objective and condensed chronicle retains major events', () => {
  let game = createGame(12);
  game.cities.find(city => city.id === 'london').owner = null;
  const enemy = game.armies.find(unit => unit.owner === 'france');
  Object.assign(enemy, { x: 50, y: 49, troops: 50 });
  game = autoplayStep(game).state;
  assert.ok(game.log.some(entry => entry.includes(`AI objective: Engage ${enemy.name} [${enemy.id}]`)));
  const events = [
    { turn: 1, category: 'recovery', text: 'Turn 1: recovery two' },
    { turn: 1, category: 'recruitment', text: 'Turn 1: recruited' },
    { turn: 1, category: 'recovery', text: 'Turn 1: recovery one' },
    { turn: 1, category: 'major', text: 'Turn 1: a capital fell' },
  ];
  assert.deepEqual(chronicleEntries(events), ['Turn 1: a capital fell', 'Turn 1: 2 recovery events.', 'Turn 1: recruited']);
  assert.deepEqual(chronicleEntries(events, false), events.map(event => event.text).reverse());
});


test('world events use a seeded deck of 24 distinct events with three choices each', () => {
  assert.equal(WORLD_EVENTS.length, 24);
  assert.equal(new Set(WORLD_EVENTS.map(event => event.id)).size, 24);
  assert.ok(WORLD_EVENTS.every(event => event.choices.length === 3));

  const draw = () => {
    let game = createGame(12);
    const ids = [];
    while (ids.length < WORLD_EVENTS.length) {
      game = endTurn({ ...game, nextWorldEventTurn: game.turn + 1 });
      ids.push(game.pendingWorldEvent);
      assert.ok(game.nextWorldEventTurn - game.turn >= 20);
      assert.ok(game.nextWorldEventTurn - game.turn <= 30);
      game = resolveWorldEvent(game, 0);
    }
    return ids;
  };
  const events = draw();
  assert.equal(new Set(events).size, 24);
  assert.deepEqual(draw(), events);
});

test('a manual event pauses turns until a valid response and logs all kingdoms', () => {
  let game = createGame(12);
  game = endTurn({ ...game, nextWorldEventTurn: 2 });
  assert.equal(endTurn(game), game);
  assert.equal(resolveWorldEvent(game, 3), game);
  const event = worldEventChoices(game);
  assert.equal(event.choices.length, 3);
  const resolved = resolveWorldEvent(game, 1);
  assert.equal(resolved.pendingWorldEvent, null);
  assert.equal(resolved.turn, game.turn);
  assert.equal(resolveWorldEvent(resolved, 1), resolved);
  const decisions = resolved.logEvents.filter(({ text }) =>
    text.includes(event.title) && text.includes(' chose '));
  assert.equal(decisions.length, 4);
  assert.ok(decisions.some(({ text }) => text.includes('Alderwyn chose “' + event.choices[1].label)));
});

test('autoplay resolves world events without waiting for player input', () => {
  const game = createGame(12);
  game.nextWorldEventTurn = 2;
  game.armies[0].moves = 0;
  game.armies.push(...Array.from({ length: 4 }, (_, index) => ({
    ...game.armies[0], id: 'reserve-' + index, general: null,
  })));
  const result = autoplayStep(game).state;
  assert.equal(result.turn, 2);
  assert.equal(result.pendingWorldEvent, null);
  assert.equal(result.logEvents.filter(({ text }) => text.includes('World event') && text.includes(' chose ')).length, 4);
});

test('refusing tribute spawns a horde aimed at the affected town', () => {
  const game = { ...createGame(12), pendingWorldEvent: 'barbarian-horde' };
  const resolved = resolveWorldEvent(game, 2);
  assert.ok(resolved.armies.some(army => army.raidTargetId === 'london' && army.troops === 85));
  assert.ok(resolved.log.some(line => line.includes('85 raiders appeared near Crownstead')));
  assert.equal(resolved.resources.england.gold, game.resources.england.gold + 45);
  assert.equal(game.armies.length, 4);
});


test('campaign setup applies map bounds and the active kingdom roster', () => {
  for (const [index, mapSize] of MAP_SIZES.entries()) {
    const opponentCount = index + 1;
    const game = createGame(12, {
      mapSize,
      opponentCount,
      kingdoms: {
        england: { name: '  Ember Crown  ', color: '#cc4020' },
        france: { name: 'Azure Pact', color: '#2074ba' },
      },
    });
    assert.equal(game.mapSize, mapSize);
    assert.equal(game.armies.length, opponentCount + 1);
    assert.equal(game.cities.filter(city => city.capital).length, opponentCount + 1);
    assert.deepEqual(Object.keys(game.resources), game.kingdomOwners);
    assert.equal(game.kingdoms.england.name, 'Ember Crown');
    assert.equal(game.kingdoms.france.color, '#2074ba');
    assert.match(game.armies[1].name, /Azure Pact/);
    assert.ok(game.log.some(line => line.includes('Ember Crown established its capital')));
    assert.ok(game.cities.every(({ x, y }) =>
      x >= 0 && y >= 0 && x < mapSize && y < mapSize && terrainAt(x, y) !== 'water'));
    const standings = kingdomStandings(game);
    assert.equal(standings.length, opponentCount + 1);
    assert.equal(cameraFor(mapSize, mapSize, mapSize).x, mapSize - VIEW_SIZE);
    assert.equal(moveCamera({ x: mapSize - VIEW_SIZE, y: 0 }, 1, -1, mapSize).x,
      mapSize - VIEW_SIZE);
    const next = endTurn(game);
    assert.ok(next.armies.every(army => game.kingdomOwners.includes(army.owner)));
  }
});

test('world events address only the configured kingdoms and use their names', () => {
  const game = createGame(12, {
    opponentCount: 1,
    kingdoms: { england: { name: 'Ember Crown' }, france: { name: 'Azure Pact' } },
  });
  const pending = endTurn({ ...game, nextWorldEventTurn: 2 });
  const resolved = resolveWorldEvent(pending, 0);
  const decisions = resolved.log.filter(line => line.includes('World event') && line.includes(' chose '));
  assert.equal(decisions.length, 2);
  assert.ok(decisions.some(line => line.includes('Ember Crown chose')));
  assert.ok(decisions.some(line => line.includes('Azure Pact chose')));
});
