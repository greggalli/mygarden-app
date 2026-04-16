export const DB_NAME = "mygarden-db";
export const DB_VERSION = 1;

export const STORE_NAMES = {
  species: "species",
  zones: "zones",
  plantations: "plantations",
  tasks: "tasks",
  settings: "settings"
};

export const REQUIRED_STORE_KEYS = [
  STORE_NAMES.species,
  STORE_NAMES.zones,
  STORE_NAMES.plantations,
  STORE_NAMES.tasks
];
