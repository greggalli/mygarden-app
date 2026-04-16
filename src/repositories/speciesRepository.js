import { getAll, put, remove } from "../db/indexedDb";
import { STORE_NAMES } from "../db/stores";

export function getAllSpecies() {
  return getAll(STORE_NAMES.species);
}

export function saveSpecies(species) {
  return put(STORE_NAMES.species, species);
}

export function deleteSpeciesById(speciesId) {
  return remove(STORE_NAMES.species, speciesId);
}
