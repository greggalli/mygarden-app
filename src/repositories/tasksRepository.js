import { getAll } from "../db/indexedDb";
import { STORE_NAMES } from "../db/stores";

export function getAllTasks() {
  return getAll(STORE_NAMES.tasks);
}
