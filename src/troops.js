import { TROOP_TYPES } from "./gameConfig.js";

export function troopTypeOf(army) {
  return army.troopType && TROOP_TYPES[army.troopType]
    ? army.troopType
    : "spearman";
}
