import { getAll } from "../db/indexedDb";
import { STORE_NAMES } from "../db/stores";

export function getAllZones() {
  return getAll(STORE_NAMES.zones);
}
