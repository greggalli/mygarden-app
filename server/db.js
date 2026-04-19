const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const { DB_PATH } = require("./config");

function ensureParentDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

ensureParentDirectory(DB_PATH);

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS species (
      id INTEGER PRIMARY KEY,
      common_name TEXT NOT NULL,
      scientific_name TEXT,
      family TEXT,
      pruning_period TEXT,
      flowering_period TEXT,
      care_tips TEXT,
      notes TEXT,
      external_links_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS zones (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS zone_geometries (
      id INTEGER PRIMARY KEY,
      zone_id INTEGER NOT NULL,
      geometry_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(zone_id) REFERENCES zones(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS plantations (
      id INTEGER PRIMARY KEY,
      species_id INTEGER NOT NULL,
      zone_id INTEGER,
      planted_at TEXT,
      quantity INTEGER,
      notes TEXT,
      nickname TEXT,
      position_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(species_id) REFERENCES species(id) ON DELETE RESTRICT,
      FOREIGN KEY(zone_id) REFERENCES zones(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY,
      plant_instance_id INTEGER,
      zone_id INTEGER,
      due_date TEXT,
      action TEXT,
      status TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS species_photos (
      id INTEGER PRIMARY KEY,
      species_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_filename TEXT,
      mime_type TEXT NOT NULL,
      relative_path TEXT NOT NULL,
      size_bytes INTEGER,
      created_at TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(species_id) REFERENCES species(id) ON DELETE CASCADE
    );
  `);
}

module.exports = { db, initializeSchema };
