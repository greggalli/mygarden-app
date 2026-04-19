import { fetchBackupPayload, importBackupPayload } from "./apiService";
import { downloadJsonFile } from "../utils/fileDownload";
import { readJsonFile } from "../utils/fileImport";

export async function buildBackupPayload() {
  return fetchBackupPayload();
}

export async function exportBackupFile() {
  const payload = await buildBackupPayload();
  const json = JSON.stringify(payload, null, 2);

  downloadJsonFile(
    json,
    `mygarden-backup-${new Date().toISOString().slice(0, 10)}.json`
  );

  return { warnings: [] };
}

export async function parseBackupFile(file) {
  return readJsonFile(file);
}

export async function importBackupFile(file) {
  const payload = await parseBackupFile(file);
  await importBackupPayload(payload);
}

export function validateBackupPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Le fichier de sauvegarde est invalide (objet attendu).");
  }
}
