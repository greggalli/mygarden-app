const http = require("http");
const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const { randomUUID } = require("crypto");

const { db, initializeSchema } = require("./db");
const { seedIfEmpty } = require("./seed");
const { config } = require("./config");

const { imageDir: IMAGES_ROOT, port: PORT, corsOrigin } = config;
const SPECIES_IMAGES_DIR = path.join(IMAGES_ROOT, "species");

initializeSchema();
seedIfEmpty(db);
fs.mkdirSync(SPECIES_IMAGES_DIR, { recursive: true });

function corsHeaders(extra = {}) {
  return {
    "Access-Control-Allow-Origin": corsOrigin,
    ...extra
  };
}

function json(res, status, payload) {
  res.writeHead(status, corsHeaders({
    "Content-Type": "application/json"
  }));
  res.end(JSON.stringify(payload));
}

function noContent(res) {
  res.writeHead(204, corsHeaders());
  res.end();
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function parseJson(text, fallback) {
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function toSpeciesRow(row) {
  return {
    id: row.id,
    common_name: row.common_name,
    scientific_name: row.scientific_name,
    family: row.family,
    pruning_period: row.pruning_period,
    flowering_period: row.flowering_period,
    care_tips: row.care_tips,
    notes: row.notes,
    external_links: parseJson(row.external_links_json, []),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function toPlantationRow(row) {
  return {
    id: row.id,
    species_id: row.species_id,
    zone_id: row.zone_id,
    planting_date: row.planted_at,
    planted_at: row.planted_at,
    quantity: row.quantity,
    notes: row.notes,
    nickname: row.nickname,
    position: parseJson(row.position_json, null),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function toPhotoRow(row) {
  return {
    id: row.id,
    speciesId: row.species_id,
    filename: row.filename,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    relativePath: row.relative_path,
    size: row.size_bytes,
    createdAt: row.created_at,
    sortOrder: row.sort_order,
    imageUrl: `/images/${row.relative_path}`
  };
}

function loadBootstrapData() {
  const zoneGeometries = db.prepare("SELECT * FROM zone_geometries ORDER BY id").all();
  const geometryByZoneId = new Map(zoneGeometries.map((z) => [z.zone_id, parseJson(z.geometry_json, {})]));

  const zones = db.prepare("SELECT * FROM zones ORDER BY name COLLATE NOCASE").all().map((zone) => {
    const g = geometryByZoneId.get(zone.id) || {};
    return {
      id: zone.id,
      name: zone.name,
      description: zone.description,
      color: g.color || null,
      zone_type: g.zone_type || null,
      bbox: g.bbox || null,
      shape: g.shape || [],
      created_at: zone.created_at,
      updated_at: zone.updated_at
    };
  });

  return {
    species: db.prepare("SELECT * FROM species ORDER BY common_name COLLATE NOCASE").all().map(toSpeciesRow),
    zones,
    zoneGeometries,
    plantations: db.prepare("SELECT * FROM plantations ORDER BY id").all().map(toPlantationRow),
    tasks: db.prepare("SELECT * FROM tasks ORDER BY id").all(),
    speciesPhotos: db.prepare("SELECT * FROM species_photos ORDER BY species_id, sort_order, id").all().map(toPhotoRow)
  };
}

function inferExt(mimeType = "") {
  if (mimeType.includes("png")) return ".png";
  if (mimeType.includes("webp")) return ".webp";
  if (mimeType.includes("gif")) return ".gif";
  return ".jpg";
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const method = req.method || "GET";

  if (method === "OPTIONS") {
    res.writeHead(204, corsHeaders({
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }));
    res.end();
    return;
  }

  if (url.pathname.startsWith("/images/")) {
    const relPath = url.pathname.replace("/images/", "");
    const abs = path.resolve(IMAGES_ROOT, relPath);
    const imagesRootWithSep = `${IMAGES_ROOT}${path.sep}`;
    if (abs !== IMAGES_ROOT && !abs.startsWith(imagesRootWithSep)) {
      json(res, 400, { error: "Invalid image path" });
      return;
    }
    try {
      const data = await fsp.readFile(abs);
      res.writeHead(200, corsHeaders({ "Content-Type": "application/octet-stream" }));
      res.end(data);
    } catch {
      json(res, 404, { error: "Image not found" });
    }
    return;
  }

  if (method === "GET" && url.pathname === "/api/bootstrap") {
    json(res, 200, loadBootstrapData());
    return;
  }

  if (method === "POST" && url.pathname === "/api/species") {
    const payload = parseJson((await readBody(req)).toString("utf8"), {});
    const now = new Date().toISOString();
    const maxId = db.prepare("SELECT COALESCE(MAX(id), 0) AS id FROM species").get().id;
    const id = Number.isInteger(payload.id) ? payload.id : maxId + 1;

    db.prepare("INSERT INTO species (id, common_name, scientific_name, family, pruning_period, flowering_period, care_tips, notes, external_links_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(id, (payload.common_name || "").trim(), payload.scientific_name || null, payload.family || null, payload.pruning_period || null, payload.flowering_period || null, payload.care_tips || null, payload.notes || null, JSON.stringify(payload.external_links || []), now, now);

    json(res, 201, toSpeciesRow(db.prepare("SELECT * FROM species WHERE id = ?").get(id)));
    return;
  }

  const speciesMatch = url.pathname.match(/^\/api\/species\/(\d+)$/);
  if (speciesMatch && method === "PUT") {
    const id = Number(speciesMatch[1]);
    const existing = db.prepare("SELECT * FROM species WHERE id = ?").get(id);
    if (!existing) return json(res, 404, { error: "Species not found" });
    const payload = parseJson((await readBody(req)).toString("utf8"), {});
    const merged = { ...toSpeciesRow(existing), ...payload };

    db.prepare("UPDATE species SET common_name=?, scientific_name=?, family=?, pruning_period=?, flowering_period=?, care_tips=?, notes=?, external_links_json=?, updated_at=? WHERE id=?")
      .run((merged.common_name || "").trim(), merged.scientific_name || null, merged.family || null, merged.pruning_period || null, merged.flowering_period || null, merged.care_tips || null, merged.notes || null, JSON.stringify(merged.external_links || []), new Date().toISOString(), id);

    json(res, 200, toSpeciesRow(db.prepare("SELECT * FROM species WHERE id = ?").get(id)));
    return;
  }

  if (speciesMatch && method === "DELETE") {
    const id = Number(speciesMatch[1]);
    const linked = db.prepare("SELECT COUNT(*) AS count FROM plantations WHERE species_id = ?").get(id).count;
    if (linked > 0) return json(res, 409, { error: "Species has linked plantations" });

    const photos = db.prepare("SELECT relative_path FROM species_photos WHERE species_id = ?").all(id);
    db.exec("BEGIN");
    try {
      db.prepare("DELETE FROM species_photos WHERE species_id = ?").run(id);
      db.prepare("DELETE FROM species WHERE id = ?").run(id);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    photos.forEach((p) => fs.rmSync(path.join(IMAGES_ROOT, p.relative_path), { force: true }));
    noContent(res);
    return;
  }

  const photosPost = url.pathname.match(/^\/api\/species\/(\d+)\/photos$/);
  if (photosPost && method === "POST") {
    const speciesId = Number(photosPost[1]);
    const species = db.prepare("SELECT id FROM species WHERE id = ?").get(speciesId);
    if (!species) return json(res, 404, { error: "Species not found" });

    const mimeType = req.headers["content-type"] || "application/octet-stream";
    if (!String(mimeType).startsWith("image/")) {
      return json(res, 400, { error: "Only image uploads are allowed" });
    }

    const originalFilename = (url.searchParams.get("filename") || "photo").replace(/[^a-zA-Z0-9._-]/g, "_");
    const ext = path.extname(originalFilename) || inferExt(String(mimeType));
    const stored = `${Date.now()}-${randomUUID()}${ext}`;
    const relativePath = path.posix.join("species", stored);
    const absolutePath = path.join(IMAGES_ROOT, relativePath);
    const fileBuffer = await readBody(req);
    await fsp.writeFile(absolutePath, fileBuffer);

    const count = db.prepare("SELECT COUNT(*) AS count FROM species_photos WHERE species_id = ?").get(speciesId).count;
    db.prepare("INSERT INTO species_photos (species_id, filename, original_filename, mime_type, relative_path, size_bytes, created_at, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(speciesId, stored, originalFilename, String(mimeType), relativePath, fileBuffer.length, new Date().toISOString(), count);

    const created = db.prepare("SELECT * FROM species_photos WHERE id = last_insert_rowid()").get();
    json(res, 201, { photo: toPhotoRow(created) });
    return;
  }

  const photoDelete = url.pathname.match(/^\/api\/species\/(\d+)\/photos\/(\d+)$/);
  if (photoDelete && method === "DELETE") {
    const speciesId = Number(photoDelete[1]);
    const photoId = Number(photoDelete[2]);
    const row = db.prepare("SELECT * FROM species_photos WHERE id = ? AND species_id = ?").get(photoId, speciesId);
    if (!row) return json(res, 404, { error: "Photo not found" });

    db.prepare("DELETE FROM species_photos WHERE id = ?").run(photoId);
    fs.rmSync(path.join(IMAGES_ROOT, row.relative_path), { force: true });
    noContent(res);
    return;
  }

  if (method === "POST" && url.pathname === "/api/plantations") {
    const payload = parseJson((await readBody(req)).toString("utf8"), {});
    const maxId = db.prepare("SELECT COALESCE(MAX(id), 0) AS id FROM plantations").get().id;
    const id = Number.isInteger(payload.id) ? payload.id : maxId + 1;
    const now = new Date().toISOString();
    db.prepare("INSERT INTO plantations (id, species_id, zone_id, planted_at, quantity, notes, nickname, position_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(id, payload.species_id, payload.zone_id || null, payload.planted_at || payload.planting_date || null, payload.quantity || 1, payload.notes || null, payload.nickname || null, JSON.stringify(payload.position || null), now, now);
    json(res, 201, toPlantationRow(db.prepare("SELECT * FROM plantations WHERE id = ?").get(id)));
    return;
  }

  const plantMatch = url.pathname.match(/^\/api\/plantations\/(\d+)$/);
  if (plantMatch && method === "PUT") {
    const id = Number(plantMatch[1]);
    const existing = db.prepare("SELECT * FROM plantations WHERE id = ?").get(id);
    if (!existing) return json(res, 404, { error: "Plantation not found" });
    const payload = parseJson((await readBody(req)).toString("utf8"), {});
    const merged = { ...toPlantationRow(existing), ...payload };

    db.prepare("UPDATE plantations SET species_id=?, zone_id=?, planted_at=?, quantity=?, notes=?, nickname=?, position_json=?, updated_at=? WHERE id=?")
      .run(merged.species_id, merged.zone_id || null, merged.planted_at || merged.planting_date || null, merged.quantity || 1, merged.notes || null, merged.nickname || null, JSON.stringify(merged.position || null), new Date().toISOString(), id);
    json(res, 200, toPlantationRow(db.prepare("SELECT * FROM plantations WHERE id = ?").get(id)));
    return;
  }

  if (plantMatch && method === "DELETE") {
    db.prepare("DELETE FROM plantations WHERE id = ?").run(Number(plantMatch[1]));
    noContent(res);
    return;
  }

  if (method === "GET" && url.pathname === "/api/admin/export") {
    const data = loadBootstrapData();
    const speciesPhotos = [];
    for (const photo of data.speciesPhotos) {
      const file = await fsp.readFile(path.join(IMAGES_ROOT, photo.relativePath));
      speciesPhotos.push({
        id: photo.id,
        speciesId: photo.speciesId,
        filename: photo.filename,
        mimeType: photo.mimeType,
        relativePath: photo.relativePath,
        dataUrl: `data:${photo.mimeType};base64,${file.toString("base64")}`
      });
    }

    json(res, 200, {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        species: data.species,
        zones: data.zones,
        zoneGeometries: data.zoneGeometries.map((g) => ({ id: g.id, zoneId: g.zone_id, geometryJson: parseJson(g.geometry_json, {}) })),
        plantations: data.plantations,
        speciesPhotos,
        tasks: data.tasks
      }
    });
    return;
  }

  if (method === "POST" && url.pathname === "/api/admin/import") {
    const payload = parseJson((await readBody(req)).toString("utf8"), {});
    const data = payload.data || {};
    const now = new Date().toISOString();

    db.exec("BEGIN");
    try {
      db.exec("DELETE FROM species_photos; DELETE FROM plantations; DELETE FROM zone_geometries; DELETE FROM zones; DELETE FROM species; DELETE FROM tasks;");

      const insSpecies = db.prepare("INSERT INTO species (id, common_name, scientific_name, family, pruning_period, flowering_period, care_tips, notes, external_links_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
      (data.species || []).forEach((sp) => insSpecies.run(sp.id, sp.common_name || "", sp.scientific_name || null, sp.family || null, sp.pruning_period || null, sp.flowering_period || null, sp.care_tips || null, sp.notes || null, JSON.stringify(sp.external_links || []), sp.created_at || now, sp.updated_at || now));

      const insZone = db.prepare("INSERT INTO zones (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)");
      (data.zones || []).forEach((zone) => insZone.run(zone.id, zone.name || "", zone.description || null, zone.created_at || now, zone.updated_at || now));

      const insGeom = db.prepare("INSERT INTO zone_geometries (id, zone_id, geometry_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)");
      (data.zoneGeometries || []).forEach((g, idx) => insGeom.run(g.id || idx + 1, g.zoneId || g.zone_id, JSON.stringify(g.geometryJson || g.geometry_json || {}), now, now));

      const insPlant = db.prepare("INSERT INTO plantations (id, species_id, zone_id, planted_at, quantity, notes, nickname, position_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
      (data.plantations || []).forEach((p) => insPlant.run(p.id, p.species_id, p.zone_id || null, p.planted_at || p.planting_date || null, p.quantity || 1, p.notes || null, p.nickname || null, JSON.stringify(p.position || null), p.created_at || now, p.updated_at || now));

      const insTask = db.prepare("INSERT INTO tasks (id, plant_instance_id, zone_id, due_date, action, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
      (data.tasks || []).forEach((t) => insTask.run(t.id, t.plant_instance_id || null, t.zone_id || null, t.due_date || null, t.action || null, t.status || null, t.notes || null, t.created_at || now, t.updated_at || now));

      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    fs.rmSync(SPECIES_IMAGES_DIR, { recursive: true, force: true });
    fs.mkdirSync(SPECIES_IMAGES_DIR, { recursive: true });

    const insPhoto = db.prepare("INSERT INTO species_photos (id, species_id, filename, original_filename, mime_type, relative_path, size_bytes, created_at, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    for (let i = 0; i < (data.speciesPhotos || []).length; i += 1) {
      const photo = data.speciesPhotos[i];
      const match = String(photo.dataUrl || "").match(/^data:(.+);base64,(.*)$/);
      if (!match) continue;
      const mimeType = photo.mimeType || match[1];
      const raw = Buffer.from(match[2], "base64");
      const stored = `${Date.now()}-${randomUUID()}${path.extname(photo.filename || "") || inferExt(mimeType)}`;
      const relativePath = path.posix.join("species", stored);
      await fsp.writeFile(path.join(IMAGES_ROOT, relativePath), raw);
      insPhoto.run(photo.id || i + 1, photo.speciesId, stored, photo.filename || stored, mimeType, relativePath, raw.length, now, i);
    }

    noContent(res);
    return;
  }

  json(res, 404, { error: "Not found" });
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    json(res, 500, { error: error.message || "Server error" });
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`MyGarden API running on http://localhost:${PORT}`);
});
