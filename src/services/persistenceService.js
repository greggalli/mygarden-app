import zonesSeed from "../data/zones.json";
import speciesSeed from "../data/species.json";
import plantationsSeed from "../data/instances.json";
import tasksSeed from "../data/tasks.json";

import { bulkPut, clearStore, getAll, openDatabase } from "../db/indexedDb";
import { REQUIRED_STORE_KEYS, STORE_NAMES } from "../db/stores";

const DEFAULT_DATASET = {
  zones: zonesSeed,
  species: speciesSeed,
  instances: plantationsSeed,
  tasks: tasksSeed
};

function hasAnyRecords(dataset) {
  return REQUIRED_STORE_KEYS.some((storeKey) => {
    const values = dataset[storeKey] || [];
    return values.length > 0;
  });
}

async function getDatasetByStoreKey() {
  const [zones, species, plantations, tasks] = await Promise.all([
    getAll(STORE_NAMES.zones),
    getAll(STORE_NAMES.species),
    getAll(STORE_NAMES.plantations),
    getAll(STORE_NAMES.tasks)
  ]);

  return {
    [STORE_NAMES.zones]: zones,
    [STORE_NAMES.species]: species,
    [STORE_NAMES.plantations]: plantations,
    [STORE_NAMES.tasks]: tasks
  };
}

function toContextShape(datasetByStore) {
  return {
    zones: datasetByStore[STORE_NAMES.zones] || [],
    species: datasetByStore[STORE_NAMES.species] || [],
    instances: datasetByStore[STORE_NAMES.plantations] || [],
    tasks: datasetByStore[STORE_NAMES.tasks] || []
  };
}

export async function initializePersistence() {
  await openDatabase();

  const existing = await getDatasetByStoreKey();
  if (hasAnyRecords(existing)) {
    return toContextShape(existing);
  }

  await Promise.all([
    bulkPut(STORE_NAMES.zones, DEFAULT_DATASET.zones),
    bulkPut(STORE_NAMES.species, DEFAULT_DATASET.species),
    bulkPut(STORE_NAMES.plantations, DEFAULT_DATASET.instances),
    bulkPut(STORE_NAMES.tasks, DEFAULT_DATASET.tasks)
  ]);

  return DEFAULT_DATASET;
}

export async function readAllData() {
  const current = await getDatasetByStoreKey();
  return toContextShape(current);
}

export async function replaceAllData(nextData) {
  await Promise.all([
    clearStore(STORE_NAMES.zones),
    clearStore(STORE_NAMES.species),
    clearStore(STORE_NAMES.plantations),
    clearStore(STORE_NAMES.tasks)
  ]);

  await Promise.all([
    bulkPut(STORE_NAMES.zones, nextData.zones),
    bulkPut(STORE_NAMES.species, nextData.species),
    bulkPut(STORE_NAMES.plantations, nextData.instances),
    bulkPut(STORE_NAMES.tasks, nextData.tasks)
  ]);
}
