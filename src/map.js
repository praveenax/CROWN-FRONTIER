import gameData from "./data.json" with { type: "json" };
import { MAP_SIZE, VIEW_SIZE } from "./gameConfig.js";
import { clamp, key } from "./coordinates.js";

const lakes = gameData.terrain.lakes;
const landmarkLakes = gameData.terrain.landmarkLakes;

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

export function terrainAt(x, y) {
  const n = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
  const band =
    Math.sin(x * 0.19) + Math.cos(y * 0.16) + Math.sin((x + y) * 0.12);
  const river = x === 32 + Math.round(2 * Math.sin(y / 7)) && y % 12 > 2;
  const lake =
    landmarkLakes.some(([cx, cy]) => (x - cx) ** 2 + (y - cy) ** 2 <= 2) ||
    lakes.some(([cx, cy]) => (x - cx) ** 2 + (y - cy) ** 2 <= 8);
  if (river || lake) return "water";
  if ((x === 48 && y === 48) || (band > 1.65 && n > 0.27)) return "mountain";
  if (band < -1.35 && n > 0.33) return "forest";
  if (n > 0.72) return "field";
  return "grass";
}

function reveal(discovered, x, y, radius, mapSize) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (
        Math.abs(dx) + Math.abs(dy) <= radius &&
        x + dx >= 0 &&
        y + dy >= 0 &&
        x + dx < mapSize &&
        y + dy < mapSize
      ) {
        discovered[key(x + dx, y + dy)] = true;
      }
    }
  }
}

export function revealPlayer(state) {
  for (const city of state.cities)
    if (city.owner === "england") reveal(state.discovered, city.x, city.y, 3, state.mapSize);
  for (const army of state.armies)
    if (army.owner === "england")
      reveal(state.discovered, army.x, army.y, army.kind === "scout" ? 3 : 2, state.mapSize);
}

export function isDiscovered(state, x, y) {
  return Boolean(state.discovered[key(x, y)]);
}

export function cameraFor(x, y, mapSize = MAP_SIZE) {
  return {
    x: clamp(x - Math.floor(VIEW_SIZE / 2), 0, mapSize - VIEW_SIZE),
    y: clamp(y - Math.floor(VIEW_SIZE / 2), 0, mapSize - VIEW_SIZE),
  };
}

export function moveCamera(camera, dx, dy, mapSize = MAP_SIZE) {
  return {
    x: clamp(camera.x + dx, 0, mapSize - VIEW_SIZE),
    y: clamp(camera.y + dy, 0, mapSize - VIEW_SIZE),
  };
}
