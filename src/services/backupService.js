import { readAllData, replaceAllData } from "./persistenceService";

function isArray(value) {
  return Array.isArray(value);
}

export function validateBackupPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Le fichier de sauvegarde est invalide (objet attendu).");
  }

  if (!isArray(payload.zones)) {
    throw new Error("Le fichier de sauvegarde est invalide: zones doit être un tableau.");
  }

  if (!isArray(payload.species)) {
    throw new Error("Le fichier de sauvegarde est invalide: species doit être un tableau.");
  }

  if (!isArray(payload.instances)) {
    throw new Error("Le fichier de sauvegarde est invalide: instances doit être un tableau.");
  }

  if (!isArray(payload.tasks)) {
    throw new Error("Le fichier de sauvegarde est invalide: tasks doit être un tableau.");
  }
}

export async function buildBackupPayload() {
  const dataset = await readAllData();

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    zones: dataset.zones,
    species: dataset.species,
    instances: dataset.instances,
    tasks: dataset.tasks
  };
}

export async function exportBackupFile() {
  const payload = await buildBackupPayload();
  const json = JSON.stringify(payload, null, 2);

  const blob = new Blob([json], { type: "application/json" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mygarden-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function parseBackupFile(file) {
  const content = await file.text();
  const parsed = JSON.parse(content);
  validateBackupPayload(parsed);

  return {
    zones: parsed.zones,
    species: parsed.species,
    instances: parsed.instances,
    tasks: parsed.tasks
  };
}

export async function importBackupFile(file) {
  const parsed = await parseBackupFile(file);
  await replaceAllData(parsed);
  return parsed;
}
