const fs = require("fs");
const path = require("path");

function loadJson(relativePath) {
  const fullPath = path.resolve(__dirname, "..", "..", relativePath);
  return JSON.parse(fs.readFileSync(fullPath, "utf-8"));
}

async function seedIfEmpty(db) {
  const row = await db.prepare("SELECT COUNT(*) AS count FROM species").get();
  if (row.count > 0) return;

  const now = new Date().toISOString();
  const species = loadJson("frontend/src/data/species.json");
  const zones = loadJson("frontend/src/data/zones.json");
  const plantations = loadJson("frontend/src/data/instances.json");
  const tasks = loadJson("frontend/src/data/tasks.json");

  const insertSpecies = db.prepare(`INSERT INTO species (id, common_name, scientific_name, family, pruning_period, flowering_period, care_tips, notes, external_links_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertGardenMap = db.prepare(`INSERT INTO garden_maps (name, width, height, geometry, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`);
  const insertZone = db.prepare(`INSERT INTO zones (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`);
  const insertZoneGeometry = db.prepare(`INSERT INTO zone_geometries (zone_id, geometry_json, created_at, updated_at) VALUES (?, ?, ?, ?)`);
  const insertPlantation = db.prepare(`INSERT INTO plantations (id, species_id, zone_id, planted_at, quantity, notes, nickname, position_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertTask = db.prepare(`INSERT INTO tasks (id, plant_instance_id, zone_id, due_date, action, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  await db.exec("BEGIN");
  try {
    for (const sp of species) {
      await insertSpecies.run(
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
    }

    await insertGardenMap.run("Jardin principal", 100, 100, JSON.stringify({ type: "Polygon", coordinates: [[[0,0],[100,0],[100,100],[0,100],[0,0]]] }), now, now);

    for (const zone of zones) {
      await insertZone.run(zone.id, zone.name || "", zone.description || null, now, now);
      await insertZoneGeometry.run(
        zone.id,
        JSON.stringify(zone.geometry || { type: "Polygon", coordinates: [((zone.shape || []).map((pt) => [pt.x_pct || 0, 100 - (pt.y_pct || 0)]).concat((zone.shape || [])[0] ? [[zone.shape[0].x_pct || 0, 100 - (zone.shape[0].y_pct || 0)]] : []))] }),
        now,
        now
      );
    }

    for (const inst of plantations) {
      await insertPlantation.run(
        inst.id,
        inst.species_id,
        inst.zone_id || null,
        inst.planting_date || null,
        inst.quantity || 1,
        inst.notes || null,
        inst.nickname || null,
        JSON.stringify(inst.position?.type ? inst.position : (inst.position ? { type: "Point", coordinates: [inst.position.x_pct || 0, 100 - (inst.position.y_pct || 0)] } : null)),
        now,
        now
      );
    }

    for (const task of tasks) {
      await insertTask.run(
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
    }

    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

module.exports = { seedIfEmpty };
