export async function readJsonFile(file) {
  if (!file) {
    throw new Error("Aucun fichier sélectionné.");
  }

  const content = await file.text();

  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`JSON invalide: ${error.message}`);
  }
}
