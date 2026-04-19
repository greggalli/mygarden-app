// src/data/GardenDataContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

import zonesJson from "./zones.json";
import speciesJson from "./species.json";
import instancesJson from "./instances.json";
import tasksJson from "./tasks.json";

import {
  deletePlantationById,
  savePlantation
} from "../repositories/plantationsRepository";
import {
  deleteSpeciesById,
  saveSpecies
} from "../repositories/speciesRepository";
import {
  deleteSpeciesPhotoById,
  saveSpeciesPhoto
} from "../repositories/speciesPhotosRepository";
import {
  exportBackupFile,
  importBackupFile
} from "../services/backupService";
import {
  initializePersistence,
  readAllData
} from "../services/persistenceService";

const GardenDataContext = createContext(null);

const initialData = {
  zones: zonesJson,
  species: speciesJson,
  speciesPhotos: [],
  instances: instancesJson,
  tasks: tasksJson
};

function withResolvedSpeciesPhotos(dataset) {
  const speciesPhotos = Array.isArray(dataset.speciesPhotos) ? dataset.speciesPhotos : [];
  const bySpeciesId = new Map();

  speciesPhotos.forEach((photo) => {
    const key = String(photo.speciesId);
    if (!bySpeciesId.has(key)) {
      bySpeciesId.set(key, []);
    }
    bySpeciesId.get(key).push(photo);
  });

  const species = (dataset.species || []).map((sp) => {
    const linkedPhotos = (bySpeciesId.get(String(sp.id)) || [])
      .slice()
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map((photo) => photo.imageData)
      .filter(Boolean);

    const legacyPhotos = Array.isArray(sp.photos) ? sp.photos.filter(Boolean) : [];

    return {
      ...sp,
      photos: [...linkedPhotos, ...legacyPhotos]
    };
  });

  return {
    ...dataset,
    species,
    speciesPhotos
  };
}

export function GardenDataProvider({ children }) {
  const [data, setData] = useState(initialData);
  const [isDataReady, setIsDataReady] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function boot() {
      try {
        const dataset = await initializePersistence();
        if (isActive) {
          setData(withResolvedSpeciesPhotos(dataset));
        }
      } catch (error) {
        console.warn("Erreur d'initialisation IndexedDB:", error);
      } finally {
        if (isActive) {
          setIsDataReady(true);
        }
      }
    }

    boot();

    return () => {
      isActive = false;
    };
  }, []);

  const refreshDataFromDb = async () => {
    const latest = await readAllData();
    const hydrated = withResolvedSpeciesPhotos(latest);
    setData(hydrated);
    return hydrated;
  };

  // === Mutations espèces ===
  const addSpecies = async (newSpecies) => {
    await saveSpecies(newSpecies);
    setData((current) =>
      withResolvedSpeciesPhotos({
        ...current,
        species: [...current.species, newSpecies]
      })
    );
  };

  const updateSpecies = async (id, partial) => {
    const currentSpecies = data.species.find((sp) => sp.id === id);
    if (!currentSpecies) {
      return;
    }

    const updatedSpecies = toStoredSpecies(
      { ...currentSpecies, ...partial },
      data.speciesPhotos
    );
    await saveSpecies(updatedSpecies);

    setData((current) =>
      withResolvedSpeciesPhotos({
        ...current,
        species: current.species.map((sp) => (sp.id === id ? updatedSpecies : sp))
      })
    );
  };

  const deleteSpecies = async (id) => {
    const linkedPhotos = data.speciesPhotos.filter((photo) => photo.speciesId === id);
    await Promise.all(linkedPhotos.map((photo) => deleteSpeciesPhotoById(photo.id)));
    await deleteSpeciesById(id);
    setData((current) =>
      withResolvedSpeciesPhotos({
        ...current,
        species: current.species.filter((sp) => sp.id !== id),
        speciesPhotos: current.speciesPhotos.filter((photo) => photo.speciesId !== id)
        // ⚠️ On ne touche pas aux instances ici.
        // La logique métier (empêcher suppression si instances) est dans l'UI.
      })
    );
  };

  const replaceSpeciesPhotos = async (speciesId, nextPhotos) => {
    const currentPhotos = data.speciesPhotos.filter((photo) => photo.speciesId === speciesId);
    const nextPhotoIds = new Set(nextPhotos.map((photo) => photo.id));

    const removed = currentPhotos.filter((photo) => !nextPhotoIds.has(photo.id));
    await Promise.all(removed.map((photo) => deleteSpeciesPhotoById(photo.id)));
    await Promise.all(nextPhotos.map((photo) => saveSpeciesPhoto(photo)));

    setData((current) =>
      withResolvedSpeciesPhotos({
        ...current,
        speciesPhotos: [
          ...current.speciesPhotos.filter((photo) => photo.speciesId !== speciesId),
          ...nextPhotos
        ]
      })
    );
  };

  // === Mutations plantations (instances) ===
  const addPlantInstance = async (newInstance) => {
    await savePlantation(newInstance);
    setData((current) => ({
      ...current,
      instances: [...current.instances, newInstance]
    }));
  };

  const updatePlantInstance = async (id, partial) => {
    const currentInstance = data.instances.find((inst) => inst.id === id);
    if (!currentInstance) {
      return;
    }

    const updatedInstance = { ...currentInstance, ...partial };
    await savePlantation(updatedInstance);

    setData((current) => ({
      ...current,
      instances: current.instances.map((inst) =>
        inst.id === id ? updatedInstance : inst
      )
    }));
  };

  const deletePlantInstance = async (id) => {
    await deletePlantationById(id);
    setData((current) => ({
      ...current,
      instances: current.instances.filter((inst) => inst.id !== id)
    }));
  };

  const exportDataBackup = async () => {
    return exportBackupFile();
  };

  const importDataBackup = async (file) => {
    await importBackupFile(file);
    await refreshDataFromDb();
  };

  const value = {
    data,
    setData,
    isDataReady,
    addSpecies,
    updateSpecies,
    deleteSpecies,
    addPlantInstance,
    updatePlantInstance,
    deletePlantInstance,
    replaceSpeciesPhotos,
    refreshDataFromDb,
    exportDataBackup,
    importDataBackup
  };

  return (
    <GardenDataContext.Provider value={value}>
      {children}
    </GardenDataContext.Provider>
  );
}

export function useGardenData() {
  const ctx = useContext(GardenDataContext);
  if (!ctx) {
    throw new Error("useGardenData doit être utilisé dans <GardenDataProvider>");
  }
  return ctx;
}
