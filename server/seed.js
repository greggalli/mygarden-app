const fs = require("fs");
const path = require("path");

function loadJson(relativePath) {
  const fullPath = path.join(__dirname, "..", relativePath);
  return JSON.parse(fs.readFileSync(fullPath, "utf-8"));
}

function seedIfEmpty(db) {
  const row = db.prepare("SELECT COUNT(*) AS count FROM species").get();
  if (row.count > 0) return;

  const now = new Date().toISOString();
  const species = loadJson("src/data/species.json");
  const zones = loadJson("src/data/zones.json");
  const plantations = loadJson("src/data/instances.json");
  const tasks = loadJson("src/data/tasks.json");

  const insertSpecies = db.prepare(`INSERT INTO species (id, common_name, scientific_name, family, pruning_period, flowering_period, care_tips, notes, external_links_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertZone = db.prepare(`INSERT INTO zones (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`);
  const insertZoneGeometry = db.prepare(`INSERT INTO zone_geometries (zone_id, geometry_json, created_at, updated_at) VALUES (?, ?, ?, ?)`);
  const insertPlantation = db.prepare(`INSERT INTO plantations (id, species_id, zone_id, planted_at, quantity, notes, nickname, position_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertTask = db.prepare(`INSERT INTO tasks (id, plant_instance_id, zone_id, due_date, action, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  db.exec("BEGIN");
  try {
    species.forEach((sp) => {
      insertSpecies.run(
        sp.id,
        sp.common_name || "",
        sp.scientific_name || null,
        sp.family || null,
        sp.pruning_period || null,
        sp.flowering_period || null,
        sp.care_tips || null,
        sp.notes || null,
        JSON.stringify(sp.external_links || []),
        now,
        now
      );
    });

    zones.forEach((zone) => {
      insertZone.run(zone.id, zone.name || "", zone.description || null, now, now);
      insertZoneGeometry.run(
        zone.id,
        JSON.stringify({ color: zone.color || null, zone_type: zone.zone_type || null, bbox: zone.bbox || null, shape: zone.shape || [] }),
        now,
        now
      );
    });

    plantations.forEach((inst) => {
      insertPlantation.run(
        inst.id,
        inst.species_id,
        inst.zone_id || null,
        inst.planting_date || null,
        inst.quantity || 1,
        inst.notes || null,
        inst.nickname || null,
        JSON.stringify(inst.position || null),
        now,
        now
      );
    });

    tasks.forEach((task) => {
      insertTask.run(
        task.id,
        task.plant_instance_id || null,
        task.zone_id || null,
        task.due_date || null,
        task.action || null,
        task.status || null,
        task.notes || null,
        now,
        now
      );
    });

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

module.exports = { seedIfEmpty };
