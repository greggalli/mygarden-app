import { getAll, put, remove } from "../db/indexedDb";
import { STORE_NAMES } from "../db/stores";

export function getAllPlantations() {
  return getAll(STORE_NAMES.plantations);
}

export function savePlantation(plantation) {
  return put(STORE_NAMES.plantations, plantation);
}

export function deletePlantationById(plantationId) {
  return remove(STORE_NAMES.plantations, plantationId);
}
