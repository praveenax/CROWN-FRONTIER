import gameData from "./data.json" with { type: "json" };

export const MAP_SIZE = gameData.map.size;
export const VIEW_SIZE = gameData.map.viewSize;
export const MOVE_RANGE = gameData.map.moveRange;
export const MAX_TROOPS = gameData.map.maxTroops;
export const MAX_MERGED_UNITS = gameData.map.maxMergedUnits;
export const KINGDOMS = gameData.kingdoms;
export const TROOP_TYPES = gameData.troopTypes;
export const KINGDOM_OWNERS = gameData.kingdomOwners;
export const MAP_SIZES = [64, MAP_SIZE, 144];

export const BUILDINGS = gameData.buildings;
