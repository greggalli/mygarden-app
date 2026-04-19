import { DB_NAME, DB_VERSION, STORE_NAMES } from "./stores";

let dbPromise;

function createStores(db) {
  if (!db.objectStoreNames.contains(STORE_NAMES.species)) {
    const speciesStore = db.createObjectStore(STORE_NAMES.species, {
      keyPath: "id"
    });
    speciesStore.createIndex("by_family", "family", { unique: false });
  }

  if (!db.objectStoreNames.contains(STORE_NAMES.speciesPhotos)) {
    const speciesPhotosStore = db.createObjectStore(STORE_NAMES.speciesPhotos, {
      keyPath: "id"
    });
    speciesPhotosStore.createIndex("by_speciesId", "speciesId", { unique: false });
  }

  if (!db.objectStoreNames.contains(STORE_NAMES.zones)) {
    db.createObjectStore(STORE_NAMES.zones, { keyPath: "id" });
  }

  if (!db.objectStoreNames.contains(STORE_NAMES.plantations)) {
    const plantationsStore = db.createObjectStore(STORE_NAMES.plantations, {
      keyPath: "id"
    });
    plantationsStore.createIndex("by_speciesId", "species_id", {
      unique: false
    });
    plantationsStore.createIndex("by_zoneId", "zone_id", { unique: false });
  }

  if (!db.objectStoreNames.contains(STORE_NAMES.tasks)) {
    db.createObjectStore(STORE_NAMES.tasks, { keyPath: "id" });
  }

  if (!db.objectStoreNames.contains(STORE_NAMES.settings)) {
    db.createObjectStore(STORE_NAMES.settings, { keyPath: "key" });
  }
}

export function openDatabase() {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      createStores(db);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error("IndexedDB open failed"));
    };
  });

  return dbPromise;
}

function wrapRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed"));
  });
}

function waitForTransaction(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed"));
    tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction aborted"));
  });
}

export async function getAll(storeName) {
  const db = await openDatabase();
  const tx = db.transaction(storeName, "readonly");
  const request = tx.objectStore(storeName).getAll();
  const [result] = await Promise.all([wrapRequest(request), waitForTransaction(tx)]);
  return result;
}

export async function put(storeName, item) {
  const db = await openDatabase();
  const tx = db.transaction(storeName, "readwrite");
  const request = tx.objectStore(storeName).put(item);
  const [result] = await Promise.all([wrapRequest(request), waitForTransaction(tx)]);
  return result;
}

export async function remove(storeName, id) {
  const db = await openDatabase();
  const tx = db.transaction(storeName, "readwrite");
  const request = tx.objectStore(storeName).delete(id);
  await Promise.all([wrapRequest(request), waitForTransaction(tx)]);
}

export async function clearStore(storeName) {
  const db = await openDatabase();
  const tx = db.transaction(storeName, "readwrite");
  const request = tx.objectStore(storeName).clear();
  await Promise.all([wrapRequest(request), waitForTransaction(tx)]);
}

export async function bulkPut(storeName, items) {
  const db = await openDatabase();

  await new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    items.forEach((item) => {
      store.put(item);
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed"));
    tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction aborted"));
  });
}
