import { readAllData, replaceAllData } from "./persistenceService";
import {
  blobToDataUrl,
  dataUrlToBlob,
  isDataUrl,
  normalizeMimeType
} from "../utils/imageSerialization";
import { downloadJsonFile } from "../utils/fileDownload";
import { readJsonFile } from "../utils/fileImport";

const BACKUP_VERSION = 1;

function isArray(value) {
  return Array.isArray(value);
}

function normalizePathImageUrl(url) {
  if (typeof url !== "string") {
    return null;
  }

  try {
    return new URL(url, window.location.origin).toString();
  } catch (_error) {
    return null;
  }
}

function isCrossOrigin(url) {
  try {
    return new URL(url).origin !== window.location.origin;
  } catch (_error) {
    return false;
  }
}

async function imageRefToBlob(imageRef) {
  if (isDataUrl(imageRef)) {
    return dataUrlToBlob(imageRef);
  }

  const resolvedUrl = normalizePathImageUrl(imageRef);
  if (!resolvedUrl) {
    throw new Error(`Référence image invalide: ${imageRef}`);
  }

  if (isCrossOrigin(resolvedUrl)) {
    throw new Error(`Image distante non exportable sans CORS: ${imageRef}`);
  }

  const response = await fetch(resolvedUrl);
  if (!response.ok) {
    throw new Error(`Téléchargement image impossible (${response.status}) pour ${imageRef}`);
  }

  return response.blob();
}

function inferFilename(imageRef, fallbackBaseName) {
  if (typeof imageRef === "string") {
    const cleanRef = imageRef.split("?")[0];
    const parts = cleanRef.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && last.includes(".")) {
      return last;
    }
  }

  return `${fallbackBaseName}.jpg`;
}

function normalizeBackupRoot(payload) {
  if (payload && typeof payload === "object" && payload.data) {
    if (!payload.data.speciesPhotos && Array.isArray(payload.data.images)) {
      return {
        ...payload,
        data: {
          ...payload.data,
          speciesPhotos: payload.data.images
            .filter((img) => img?.entityType === "species")
            .map((img) => ({
              id: img.id,
              speciesId: img.entityId,
              filename: img.filename,
              mimeType: img.mimeType,
              dataUrl: img.dataUrl
            }))
        }
      };
    }
    return payload;
  }

  return {
    version: 1,
    exportedAt: null,
    warnings: [],
    data: {
      zones: payload?.zones,
      species: payload?.species,
      plantations: payload?.instances,
      tasks: payload?.tasks,
      speciesPhotos: payload?.speciesPhotos || payload?.images || []
    }
  };
}

export function validateBackupPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Le fichier de sauvegarde est invalide (objet attendu).");
  }

  if (!payload.data || typeof payload.data !== "object") {
    throw new Error("Le fichier de sauvegarde est invalide: data est obligatoire.");
  }

  if (!Number.isInteger(payload.version) || payload.version < 1) {
    throw new Error("Version de sauvegarde invalide.");
  }

  if (!isArray(payload.data.zones)) {
    throw new Error("Le fichier de sauvegarde est invalide: data.zones doit être un tableau.");
  }

  if (!isArray(payload.data.species)) {
    throw new Error("Le fichier de sauvegarde est invalide: data.species doit être un tableau.");
  }

  if (!isArray(payload.data.plantations)) {
    throw new Error("Le fichier de sauvegarde est invalide: data.plantations doit être un tableau.");
  }

  if (!isArray(payload.data.tasks)) {
    throw new Error("Le fichier de sauvegarde est invalide: data.tasks doit être un tableau.");
  }

  if (!isArray(payload.data.speciesPhotos)) {
    throw new Error("Le fichier de sauvegarde est invalide: data.speciesPhotos doit être un tableau.");
  }

  payload.data.speciesPhotos.forEach((photo, index) => {
    if (!photo || typeof photo !== "object") {
      throw new Error(`Photo espèce #${index + 1} invalide (objet attendu).`);
    }

    const requiredFields = ["id", "speciesId", "filename", "mimeType", "dataUrl"];
    requiredFields.forEach((field) => {
      if (photo[field] === undefined || photo[field] === null || photo[field] === "") {
        throw new Error(`Photo espèce #${index + 1} invalide: ${field} manquant.`);
      }
    });

    if (!isDataUrl(photo.dataUrl)) {
      throw new Error(`Photo espèce #${index + 1} invalide: dataUrl n'est pas un base64 data URL.`);
    }
  });
}

async function serializeSpeciesPhotos(speciesList, existingSpeciesPhotos) {
  const speciesPhotos = (existingSpeciesPhotos || []).map((photo, index) => ({
    id: photo.id,
    speciesId: photo.speciesId,
    filename: photo.filename,
    mimeType: normalizeMimeType(photo.mimeType, photo.filename || ""),
    dataUrl: photo.imageData,
    size: photo.size || null,
    createdAt: photo.createdAt || null,
    sortOrder: typeof photo.sortOrder === "number" ? photo.sortOrder : index
  }));

  const warnings = [];
  const existingKeys = new Set(speciesPhotos.map((photo) => String(photo.id)));

  async function trySerializeLegacySpeciesPhoto({ imageRef, speciesId, index = 0 }) {
    try {
      const blob = await imageRefToBlob(imageRef);
      const dataUrl = await blobToDataUrl(blob);
      const filename = inferFilename(imageRef, `species-${speciesId}-photo-${index + 1}`);
      const photoId = `legacy-species-${speciesId}-${index}`;

      if (existingKeys.has(photoId)) {
        return;
      }

      speciesPhotos.push({
        id: photoId,
        speciesId,
        filename,
        mimeType: normalizeMimeType(blob.type, filename),
        size: blob.size || null,
        createdAt: null,
        sortOrder: index,
        dataUrl
      });
    } catch (error) {
      warnings.push(`Image ignorée pour l'espèce ${speciesId}: ${error.message}`);
    }
  }

  await Promise.all(
    speciesList.map(async (sp) => {
      const currentPhotos = (isArray(sp.photos) ? sp.photos : []).filter(Boolean);

      for (let index = 0; index < currentPhotos.length; index += 1) {
        await trySerializeLegacySpeciesPhoto({ imageRef: currentPhotos[index], speciesId: sp.id, index });
      }
    })
  );

  return {
    speciesPhotos,
    warnings
  };
}

export async function buildBackupPayload() {
  const dataset = await readAllData();
  const serialized = await serializeSpeciesPhotos(
    dataset.species || [],
    dataset.speciesPhotos || []
  );

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    warnings: serialized.warnings,
    data: {
      zones: dataset.zones,
      species: dataset.species,
      plantations: dataset.instances,
      tasks: dataset.tasks,
      speciesPhotos: serialized.speciesPhotos
    }
  };
}

export async function exportBackupFile() {
  const payload = await buildBackupPayload();
  const json = JSON.stringify(payload, null, 2);

  downloadJsonFile(
    json,
    `mygarden-backup-${new Date().toISOString().slice(0, 10)}.json`
  );

  return { warnings: payload.warnings || [] };
}

export async function parseBackupFile(file) {
  const rawParsed = await readJsonFile(file);
  const parsed = normalizeBackupRoot(rawParsed);
  validateBackupPayload(parsed);
  const speciesPhotos = parsed.data.speciesPhotos.map((photo, index) => ({
    id: photo.id,
    speciesId: Number(photo.speciesId),
    filename: photo.filename,
    mimeType: normalizeMimeType(photo.mimeType, photo.filename || ""),
    imageData: photo.dataUrl,
    size: photo.size || null,
    createdAt: photo.createdAt || null,
    sortOrder: typeof photo.sortOrder === "number" ? photo.sortOrder : index
  }));

  return {
    zones: parsed.data.zones,
    species: parsed.data.species,
    speciesPhotos,
    instances: parsed.data.plantations,
    tasks: parsed.data.tasks
  };
}

export async function importBackupFile(file) {
  const parsed = await parseBackupFile(file);
  await replaceAllData(parsed);
  return parsed;
}
