import { MOVE_RANGE } from "./gameConfig.js";
import { distance, key } from "./coordinates.js";
import { randomInt } from "./gameState.js";
import { isDiscovered, terrainAt } from "./map.js";
import { addLog, cityLabel } from "./chronicle.js";
import { canMerge, canMoveUnit, moveForOwner, recruitForOwner } from "./armyActions.js";
import { troopTypeOf } from "./troops.js";

export function recruitAutomatically(state, city, owner) {
  const garrisoned = state.armies.some(
    (unit) =>
      unit.owner === owner && unit.kind === "army" &&
      unit.x === city.x && unit.y === city.y,
  );
  if (!garrisoned) return recruitForOwner(state, city.id, owner, "spearman", true);

  const counts = { spearman: 0, archer: 0, knight: 0, swordsman: 0 };
  for (const unit of state.armies) {
    if (unit.owner === owner && unit.kind === "army") counts[troopTypeOf(unit)]++;
  }
  const preference = ["archer", "knight", "swordsman", "spearman"];
  preference.sort((left, right) => counts[left] - counts[right]);
  for (const type of preference) {
    const next = recruitForOwner(state, city.id, owner, type, true);
    if (next !== state) return next;
  }
  return state;
}

export function enemyTurn(state, owner) {
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
      const recruited = recruitAutomatically(next, city, owner);
      if (recruited !== next) {
        next = recruited;
        break;
      }
    }
  }
  return next;
}

export function spawnBarbarians(state) {
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
    spawnRaiderBand(state, city);
  }
}

export function spawnRaiderBand(state, city, strength) {
  if (state.armies.filter((unit) => unit.owner === "barbarian").length >= 20)
    return null;
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
        x >= state.mapSize ||
        y >= state.mapSize ||
        terrainAt(x, y) === "water" ||
        state.cities.some((place) => place.x === x && place.y === y) ||
        state.armies.some((unit) => unit.x === x && unit.y === y)
      )
        continue;
      candidates.push({ x, y });
    }
  }
  if (!candidates.length) return null;
  const position = candidates[randomInt(state, candidates.length)];
  const band = {
    id: `barbarian-${state.nextId++}`,
    name: strength ? "Barbarian horde" : "Barbarian raiders",
    owner: "barbarian",
    kind: "barbarian",
    ...position,
    troops: strength ?? 20 + randomInt(state, 21),
    ...(strength ? { raidTargetId: city.id } : {}),
    units: 1,
    moves: 0,
  };
  state.armies.push(band);
  addLog(
    state,
    `${strength ? "A barbarian horde of" : "A band of"} ${band.troops}${strength ? " raiders" : " barbarian raiders"} appeared near ${city.name} (${position.x + 1}, ${position.y + 1}).`,
  );
  if (isDiscovered(state, position.x, position.y))
    addLog(
      state,
      `Barbarian raiders sighted near ${position.x + 1}, ${position.y + 1}.`,
    );
  return band;
}

export function barbarianTurn(state) {
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
      const intendedTarget = next.cities.find(
        (city) => city.id === current.raidTargetId && city.owner,
      );
      const targets = intendedTarget ? [intendedTarget] : next.cities.filter(
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
        x >= state.mapSize ||
        y >= state.mapSize ||
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

export function isGarrison(state, unit) {
  return (
    unit.kind === "army" &&
    state.cities.some(
      (city) =>
        city.owner === unit.owner && city.x === unit.x && city.y === unit.y,
    )
  );
}

export function chooseAutoStep(state, unit, player) {
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
