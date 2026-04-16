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

async function imageRefToBlob(imageRef) {
  if (isDataUrl(imageRef)) {
    return dataUrlToBlob(imageRef);
  }

  const resolvedUrl = normalizePathImageUrl(imageRef);
  if (!resolvedUrl) {
    throw new Error(`Référence image invalide: ${imageRef}`);
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
    return payload;
  }

  return {
    version: 1,
    exportedAt: null,
    data: {
      zones: payload?.zones,
      species: payload?.species,
      plantations: payload?.instances,
      tasks: payload?.tasks,
      images: payload?.images || []
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

  if (!isArray(payload.data.images)) {
    throw new Error("Le fichier de sauvegarde est invalide: data.images doit être un tableau.");
  }

  payload.data.images.forEach((image, index) => {
    if (!image || typeof image !== "object") {
      throw new Error(`Image #${index + 1} invalide (objet attendu).`);
    }

    const requiredFields = ["id", "entityType", "entityId", "filename", "mimeType", "dataUrl"];
    requiredFields.forEach((field) => {
      if (!image[field]) {
        throw new Error(`Image #${index + 1} invalide: ${field} manquant.`);
      }
    });

    if (!isDataUrl(image.dataUrl)) {
      throw new Error(`Image #${index + 1} invalide: dataUrl n'est pas un base64 data URL.`);
    }
  });
}

async function serializeSpeciesImages(speciesList) {
  const images = [];

  const serializedSpecies = await Promise.all(
    speciesList.map(async (sp) => {
      const currentPhotos = isArray(sp.photos) ? sp.photos : [];

      for (let index = 0; index < currentPhotos.length; index += 1) {
        const photoRef = currentPhotos[index];
        const blob = await imageRefToBlob(photoRef);
        const dataUrl = await blobToDataUrl(blob);
        const filename = inferFilename(photoRef, `species-${sp.id}-photo-${index + 1}`);

        images.push({
          id: `species-${sp.id}-photos-${index}`,
          entityType: "species",
          entityId: sp.id,
          field: "photos",
          index,
          filename,
          mimeType: normalizeMimeType(blob.type, filename),
          dataUrl
        });
      }

      if (sp.photo_url) {
        const blob = await imageRefToBlob(sp.photo_url);
        const dataUrl = await blobToDataUrl(blob);
        const filename = inferFilename(sp.photo_url, `species-${sp.id}-cover`);

        images.push({
          id: `species-${sp.id}-photo_url`,
          entityType: "species",
          entityId: sp.id,
          field: "photo_url",
          index: 0,
          filename,
          mimeType: normalizeMimeType(blob.type, filename),
          dataUrl
        });
      }

      return {
        ...sp,
        photos: currentPhotos
      };
    })
  );

  return {
    species: serializedSpecies,
    images
  };
}

function applyImagesToSpecies(species, images) {
  const bySpecies = new Map();

  images.forEach((img) => {
    if (img.entityType !== "species") {
      return;
    }

    const key = String(img.entityId);
    if (!bySpecies.has(key)) {
      bySpecies.set(key, []);
    }

    bySpecies.get(key).push(img);
  });

  return species.map((sp) => {
    const linkedImages = bySpecies.get(String(sp.id)) || [];

    const photos = linkedImages
      .filter((img) => img.field === "photos")
      .sort((a, b) => (a.index || 0) - (b.index || 0))
      .map((img) => img.restoredDataUrl);

    const photoUrlImage = linkedImages.find((img) => img.field === "photo_url");

    return {
      ...sp,
      photos: photos.length > 0 ? photos : isArray(sp.photos) ? sp.photos : [],
      photo_url: photoUrlImage ? photoUrlImage.restoredDataUrl : sp.photo_url
    };
  });
}

export async function buildBackupPayload() {
  const dataset = await readAllData();
  const serialized = await serializeSpeciesImages(dataset.species || []);

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      zones: dataset.zones,
      species: serialized.species,
      plantations: dataset.instances,
      tasks: dataset.tasks,
      images: serialized.images
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
}

export async function parseBackupFile(file) {
  const rawParsed = await readJsonFile(file);
  const parsed = normalizeBackupRoot(rawParsed);
  validateBackupPayload(parsed);

  const restoredImages = await Promise.all(
    parsed.data.images.map(async (image) => {
      const blob = dataUrlToBlob(image.dataUrl);
      const fileLike = new File([blob], image.filename, {
        type: image.mimeType || blob.type
      });

      return {
        ...image,
        restoredDataUrl: await blobToDataUrl(fileLike)
      };
    })
  );

  return {
    zones: parsed.data.zones,
    species: applyImagesToSpecies(parsed.data.species, restoredImages),
    instances: parsed.data.plantations,
    tasks: parsed.data.tasks
  };
}

export async function importBackupFile(file) {
  const parsed = await parseBackupFile(file);
  await replaceAllData(parsed);
  return parsed;
}
