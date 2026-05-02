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

function parseCoordinatesFromGeometry(geometry) {
  if (Array.isArray(geometry?.shape)) {
    return geometry.shape;
  }
  if (Array.isArray(geometry?.coordinates)) {
    return geometry.coordinates;
  }
  return [];
}

function serializeZone(zoneRow, geometryRow, plantingCount = 0) {
  const geometry = parseJson(geometryRow?.geometry_json, {});
  const coordinates = parseCoordinatesFromGeometry(geometry);
  return {
    id: zoneRow.id,
    name: zoneRow.name,
    description: zoneRow.description,
    coordinates,
    planting_count: plantingCount,
    color: geometry.color || null,
    zone_type: geometry.zone_type || null,
    bbox: geometry.bbox || null,
    shape: coordinates,
    created_at: zoneRow.created_at,
    updated_at: zoneRow.updated_at
  };
}

function parseZoneCoordinates(rawValue) {
  if (Array.isArray(rawValue)) {
    return rawValue;
  }
  if (typeof rawValue === "string") {
    if (!rawValue.trim()) return [];
    const parsed = parseJson(rawValue, null);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    throw new Error("Coordinates must be a valid JSON array");
  }
  if (rawValue == null) {
    return [];
  }
  throw new Error("Coordinates must be an array or JSON array string");
}

function parseOptionalInteger(rawValue, fieldName) {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return null;
  }
  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed)) {
    throw new Error(`Invalid integer for ${fieldName}: ${JSON.stringify(rawValue)}`);
  }
  return parsed;
}

async function loadBootstrapData() {
  const zoneGeometries = await db.prepare("SELECT * FROM zone_geometries ORDER BY id").all();
  const geometryByZoneId = new Map(zoneGeometries.map((z) => [z.zone_id, parseJson(z.geometry_json, {})]));
  const plantationCounts = await db.prepare("SELECT zone_id, COUNT(*) AS count FROM plantations WHERE zone_id IS NOT NULL GROUP BY zone_id").all();
  const plantingCountByZoneId = new Map(plantationCounts.map((row) => [row.zone_id, row.count]));

  const zones = (await db.prepare("SELECT * FROM zones ORDER BY LOWER(name)").all()).map((zone) => {
    const g = geometryByZoneId.get(zone.id) || {};
    const coordinates = parseCoordinatesFromGeometry(g);
    return {
      id: zone.id,
      name: zone.name,
      description: zone.description,
      coordinates,
      planting_count: plantingCountByZoneId.get(zone.id) || 0,
      color: g.color || null,
      zone_type: g.zone_type || null,
      bbox: g.bbox || null,
      shape: coordinates,
      created_at: zone.created_at,
      updated_at: zone.updated_at
    };
  });

  return {
    species: (await db.prepare("SELECT * FROM species ORDER BY LOWER(common_name)").all()).map(toSpeciesRow),
    zones,
    zoneGeometries,
    plantations: (await db.prepare("SELECT * FROM plantations ORDER BY id").all()).map(toPlantationRow),
    tasks: await db.prepare("SELECT * FROM tasks ORDER BY id").all(),
    speciesPhotos: (await db.prepare("SELECT * FROM species_photos ORDER BY species_id, sort_order, id").all()).map(toPhotoRow)
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
    json(res, 200, await loadBootstrapData());
    return;
  }

  if (method === "GET" && url.pathname === "/api/zones") {
    const rows = await db.prepare(`
      SELECT z.*, zg.geometry_json, COUNT(p.id) AS planting_count
      FROM zones z
      LEFT JOIN zone_geometries zg ON zg.zone_id = z.id
      LEFT JOIN plantations p ON p.zone_id = z.id
      GROUP BY z.id
      ORDER BY LOWER(z.name)
    `).all();
    json(res, 200, rows.map((row) => serializeZone(row, row, row.planting_count)));
    return;
  }

  const zoneMatch = url.pathname.match(/^\/api\/zones\/(\d+)$/);
  if (zoneMatch && method === "GET") {
    const id = Number(zoneMatch[1]);
    const row = await db.prepare(`
      SELECT z.*, zg.geometry_json, COUNT(p.id) AS planting_count
      FROM zones z
      LEFT JOIN zone_geometries zg ON zg.zone_id = z.id
      LEFT JOIN plantations p ON p.zone_id = z.id
      WHERE z.id = ?
      GROUP BY z.id
    `).get(id);
    if (!row) return json(res, 404, { error: "Zone not found" });
    json(res, 200, serializeZone(row, row, row.planting_count));
    return;
  }

  if (method === "POST" && url.pathname === "/api/zones") {
    const payload = parseJson((await readBody(req)).toString("utf8"), {});
    const name = (payload.name || "").trim();
    if (!name) {
      return json(res, 400, { error: "Zone name is required" });
    }
    let coordinates;
    try {
      coordinates = parseZoneCoordinates(payload.coordinates);
    } catch (error) {
      return json(res, 400, { error: error.message });
    }
    const now = new Date().toISOString();

    const existingGeometry = parseJson(payload.geometry_json, {});
    console.debug("[POST /api/zones] Creating zone", {
      name,
      coordinatesCount: coordinates.length,
      hasGeometryJson: Boolean(payload.geometry_json),
      hasCustomColor: Boolean(payload.color),
      zoneType: payload.zone_type || null
    });
    const nextGeometry = {
      ...existingGeometry,
      shape: coordinates,
      coordinates
    };

    const created = await db.tx(async (tx) => {
      const inserted = await tx.prepare("INSERT INTO zones (name, description, created_at, updated_at) VALUES (?, ?, ?, ?) RETURNING *")
        .get(name, (payload.description || "").trim() || null, now, now);
      await tx.prepare("INSERT INTO zone_geometries (zone_id, geometry_json, created_at, updated_at) VALUES (?, ?, ?, ?)")
        .run(inserted.id, JSON.stringify(nextGeometry), now, now);
      return inserted;
    });

    const geometry = await db.prepare("SELECT * FROM zone_geometries WHERE zone_id = ?").get(created.id);
    json(res, 201, serializeZone(created, geometry, 0));
    return;
  }

  if (method === "POST" && url.pathname === "/api/species") {
    const payload = parseJson((await readBody(req)).toString("utf8"), {});
    const now = new Date().toISOString();
    const created = await db.prepare("INSERT INTO species (common_name, scientific_name, family, pruning_period, flowering_period, care_tips, notes, external_links_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *")
      .get((payload.common_name || "").trim(), payload.scientific_name || null, payload.family || null, payload.pruning_period || null, payload.flowering_period || null, payload.care_tips || null, payload.notes || null, JSON.stringify(payload.external_links || []), now, now);

    json(res, 201, toSpeciesRow(created));
    return;
  }

  if (zoneMatch && method === "PUT") {
    const id = Number(zoneMatch[1]);
    const existing = await db.prepare("SELECT * FROM zones WHERE id = ?").get(id);
    if (!existing) return json(res, 404, { error: "Zone not found" });
    const payload = parseJson((await readBody(req)).toString("utf8"), {});
    const name = (payload.name ?? existing.name ?? "").trim();
    if (!name) return json(res, 400, { error: "Zone name is required" });
    const description = payload.description !== undefined
      ? ((payload.description || "").trim() || null)
      : existing.description;
    let coordinates;
    try {
      coordinates = payload.coordinates !== undefined
        ? parseZoneCoordinates(payload.coordinates)
        : parseCoordinatesFromGeometry(
          parseJson(await db.prepare("SELECT geometry_json FROM zone_geometries WHERE zone_id = ?").get(id)?.geometry_json, {})
        );
    } catch (error) {
      return json(res, 400, { error: error.message });
    }
    const now = new Date().toISOString();

    const existingGeometry = await db.prepare("SELECT * FROM zone_geometries WHERE zone_id = ?").get(id);
    const mergedGeometry = {
      ...parseJson(existingGeometry?.geometry_json, {}),
      shape: coordinates,
      coordinates
    };

    await db.tx(async (tx) => {
      await tx.prepare("UPDATE zones SET name = ?, description = ?, updated_at = ? WHERE id = ?")
        .run(name, description, now, id);
      if (existingGeometry) {
        await tx.prepare("UPDATE zone_geometries SET geometry_json = ?, updated_at = ? WHERE zone_id = ?")
          .run(JSON.stringify(mergedGeometry), now, id);
      } else {
        await tx.prepare("INSERT INTO zone_geometries (zone_id, geometry_json, created_at, updated_at) VALUES (?, ?, ?, ?)")
          .run(id, JSON.stringify(mergedGeometry), now, now);
      }
    });

    const updatedZone = await db.prepare("SELECT * FROM zones WHERE id = ?").get(id);
    const updatedGeometry = await db.prepare("SELECT * FROM zone_geometries WHERE zone_id = ?").get(id);
    const plantingCount = (await db.prepare("SELECT COUNT(*) AS count FROM plantations WHERE zone_id = ?").get(id)).count;
    json(res, 200, serializeZone(updatedZone, updatedGeometry, plantingCount));
    return;
  }

  if (zoneMatch && method === "DELETE") {
    const id = Number(zoneMatch[1]);
    const zone = await db.prepare("SELECT id FROM zones WHERE id = ?").get(id);
    if (!zone) return json(res, 404, { error: "Zone not found" });
    const linked = (await db.prepare("SELECT COUNT(*) AS count FROM plantations WHERE zone_id = ?").get(id)).count;
    if (linked > 0) return json(res, 409, { error: "Zone has linked plantations and cannot be deleted" });
    await db.prepare("DELETE FROM zones WHERE id = ?").run(id);
    noContent(res);
    return;
  }

  const speciesMatch = url.pathname.match(/^\/api\/species\/(\d+)$/);
  if (speciesMatch && method === "PUT") {
    const id = Number(speciesMatch[1]);
    const existing = await db.prepare("SELECT * FROM species WHERE id = ?").get(id);
    if (!existing) return json(res, 404, { error: "Species not found" });
    const payload = parseJson((await readBody(req)).toString("utf8"), {});
    const merged = { ...toSpeciesRow(existing), ...payload };

    db.prepare("UPDATE species SET common_name=?, scientific_name=?, family=?, pruning_period=?, flowering_period=?, care_tips=?, notes=?, external_links_json=?, updated_at=? WHERE id=?")
      .run((merged.common_name || "").trim(), merged.scientific_name || null, merged.family || null, merged.pruning_period || null, merged.flowering_period || null, merged.care_tips || null, merged.notes || null, JSON.stringify(merged.external_links || []), new Date().toISOString(), id);

    json(res, 200, toSpeciesRow(await db.prepare("SELECT * FROM species WHERE id = ?").get(id)));
    return;
  }

  if (speciesMatch && method === "DELETE") {
    const id = Number(speciesMatch[1]);
    const linked = (await db.prepare("SELECT COUNT(*) AS count FROM plantations WHERE species_id = ?").get(id)).count;
    if (linked > 0) return json(res, 409, { error: "Species has linked plantations" });

    const photos = await db.prepare("SELECT relative_path FROM species_photos WHERE species_id = ?").all(id);
    await db.tx(async (tx) => {
      await tx.prepare("DELETE FROM species_photos WHERE species_id = ?").run(id);
      await tx.prepare("DELETE FROM species WHERE id = ?").run(id);
    });

    photos.forEach((p) => fs.rmSync(path.join(IMAGES_ROOT, p.relative_path), { force: true }));
    noContent(res);
    return;
  }

  const photosPost = url.pathname.match(/^\/api\/species\/(\d+)\/photos$/);
  if (photosPost && method === "POST") {
    const speciesId = Number(photosPost[1]);
    const species = await db.prepare("SELECT id FROM species WHERE id = ?").get(speciesId);
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

    const count = (await db.prepare("SELECT COUNT(*) AS count FROM species_photos WHERE species_id = ?").get(speciesId)).count;
    db.prepare("INSERT INTO species_photos (species_id, filename, original_filename, mime_type, relative_path, size_bytes, created_at, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(speciesId, stored, originalFilename, String(mimeType), relativePath, fileBuffer.length, new Date().toISOString(), count);

    const created = (await db.prepare("SELECT * FROM species_photos WHERE species_id = ? ORDER BY id DESC LIMIT 1").get(speciesId));
    json(res, 201, { photo: toPhotoRow(created) });
    return;
  }

  const photoDelete = url.pathname.match(/^\/api\/species\/(\d+)\/photos\/(\d+)$/);
  if (photoDelete && method === "DELETE") {
    const speciesId = Number(photoDelete[1]);
    const photoId = Number(photoDelete[2]);
    const row = await db.prepare("SELECT * FROM species_photos WHERE id = ? AND species_id = ?").get(photoId, speciesId);
    if (!row) return json(res, 404, { error: "Photo not found" });

    await db.prepare("DELETE FROM species_photos WHERE id = ?").run(photoId);
    fs.rmSync(path.join(IMAGES_ROOT, row.relative_path), { force: true });
    noContent(res);
    return;
  }

  if (method === "POST" && url.pathname === "/api/plantations") {
    const payload = parseJson((await readBody(req)).toString("utf8"), {});
    const now = new Date().toISOString();
    const created = await db.prepare("INSERT INTO plantations (species_id, zone_id, planted_at, quantity, notes, nickname, position_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *")
      .get(payload.species_id, payload.zone_id || null, payload.planted_at || payload.planting_date || null, payload.quantity || 1, payload.notes || null, payload.nickname || null, JSON.stringify(payload.position || null), now, now);
    json(res, 201, toPlantationRow(created));
    return;
  }

  const plantMatch = url.pathname.match(/^\/api\/plantations\/(\d+)$/);
  if (plantMatch && method === "PUT") {
    const id = Number(plantMatch[1]);
    const existing = await db.prepare("SELECT * FROM plantations WHERE id = ?").get(id);
    if (!existing) return json(res, 404, { error: "Plantation not found" });
    const payload = parseJson((await readBody(req)).toString("utf8"), {});
    const merged = { ...toPlantationRow(existing), ...payload };

    db.prepare("UPDATE plantations SET species_id=?, zone_id=?, planted_at=?, quantity=?, notes=?, nickname=?, position_json=?, updated_at=? WHERE id=?")
      .run(merged.species_id, merged.zone_id || null, merged.planted_at || merged.planting_date || null, merged.quantity || 1, merged.notes || null, merged.nickname || null, JSON.stringify(merged.position || null), new Date().toISOString(), id);
    json(res, 200, toPlantationRow(await db.prepare("SELECT * FROM plantations WHERE id = ?").get(id)));
    return;
  }

  if (plantMatch && method === "DELETE") {
    await db.prepare("DELETE FROM plantations WHERE id = ?").run(Number(plantMatch[1]));
    noContent(res);
    return;
  }

  if (method === "GET" && url.pathname === "/api/admin/export") {
    const data = await loadBootstrapData();
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

    await db.tx(async (tx) => {
      await tx.exec("DELETE FROM species_photos; DELETE FROM plantations; DELETE FROM zone_geometries; DELETE FROM zones; DELETE FROM species; DELETE FROM tasks;");

      const insSpecies = tx.prepare("INSERT INTO species (id, common_name, scientific_name, family, pruning_period, flowering_period, care_tips, notes, external_links_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
      for (const sp of (data.species || [])) {
        await insSpecies.run(sp.id, sp.common_name || "", sp.scientific_name || null, sp.family || null, sp.pruning_period || null, sp.flowering_period || null, sp.care_tips || null, sp.notes || null, JSON.stringify(sp.external_links || []), sp.created_at || now, sp.updated_at || now);
      }

      const insZone = tx.prepare("INSERT INTO zones (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)");
      for (const zone of (data.zones || [])) {
        await insZone.run(zone.id, zone.name || "", zone.description || null, zone.created_at || now, zone.updated_at || now);
      }

      const insGeom = tx.prepare("INSERT INTO zone_geometries (id, zone_id, geometry_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)");
      for (const [idx, g] of (data.zoneGeometries || []).entries()) {
        await insGeom.run(g.id || idx + 1, g.zoneId || g.zone_id, JSON.stringify(g.geometryJson || g.geometry_json || {}), now, now);
      }

      const insPlant = tx.prepare("INSERT INTO plantations (id, species_id, zone_id, planted_at, quantity, notes, nickname, position_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
      for (const p of (data.plantations || [])) {
        await insPlant.run(p.id, p.species_id, p.zone_id || null, p.planted_at || p.planting_date || null, p.quantity || 1, p.notes || null, p.nickname || null, JSON.stringify(p.position || null), p.created_at || now, p.updated_at || now);
      }

      const insTask = tx.prepare("INSERT INTO tasks (id, plant_instance_id, zone_id, due_date, action, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
      for (const t of (data.tasks || [])) {
        await insTask.run(t.id, t.plant_instance_id || null, t.zone_id || null, t.due_date || null, t.action || null, t.status || null, t.notes || null, t.created_at || now, t.updated_at || now);
      }
    });

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
      await insPhoto.run(photo.id || i + 1, photo.speciesId, stored, photo.filename || stored, mimeType, relativePath, raw.length, now, i);
    }

    noContent(res);
    return;
  }

  json(res, 404, { error: "Not found" });
}

async function start() {
  await initializeSchema();
  await seedIfEmpty(db);
  fs.mkdirSync(SPECIES_IMAGES_DIR, { recursive: true });

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    json(res, 500, { error: error.message || "Server error" });
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`MyGarden API running on http://localhost:${PORT}`);
});
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
