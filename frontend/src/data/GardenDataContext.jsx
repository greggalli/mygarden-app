import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createZone,
  createPlantation,
  createSpecies,
  deleteZoneByIdApi,
  deletePlantationByIdApi,
  deleteSpeciesByIdApi,
  deleteSpeciesPhotoByIdApi,
  fetchBootstrapData,
  fetchZoneById,
  fetchZones,
  updateZoneById,
  updatePlantationById,
  updateSpeciesById,
  uploadSpeciesPhotos
} from "../services/apiService";
import { exportBackupFile, importBackupFile } from "../services/backupService";

const GardenDataContext = createContext(null);

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
      .map((photo) => photo.imageUrl)
      .filter(Boolean);

    return {
      ...sp,
      photos: linkedPhotos
    };
  });

  return {
    ...dataset,
    species,
    speciesPhotos,
    instances: dataset.plantations || dataset.instances || [],
    gardenMap: dataset.gardenMap || null
  };
}

export function GardenDataProvider({ children }) {
  const [data, setData] = useState({
    zones: [],
    species: [],
    speciesPhotos: [],
    instances: [],
    plantations: [],
    tasks: []
  });
  const [isDataReady, setIsDataReady] = useState(false);

  const refreshDataFromDb = async () => {
    const latest = await fetchBootstrapData();
    const hydrated = withResolvedSpeciesPhotos(latest);
    setData(hydrated);
    return hydrated;
  };

  useEffect(() => {
    refreshDataFromDb()
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.warn("API bootstrap failed:", error);
      })
      .finally(() => {
        setIsDataReady(true);
      });
  }, []);

  const addSpecies = async (newSpecies) => {
    const created = await createSpecies(newSpecies);
    await refreshDataFromDb();
    return created;
  };

  const updateSpecies = async (id, partial) => {
    await updateSpeciesById(id, partial);
    await refreshDataFromDb();
  };

  const deleteSpecies = async (id) => {
    await deleteSpeciesByIdApi(id);
    await refreshDataFromDb();
  };

  const addPlantInstance = async (newInstance) => {
    await createPlantation(newInstance);
    await refreshDataFromDb();
  };

  const updatePlantInstance = async (id, partial) => {
    await updatePlantationById(id, partial);
    await refreshDataFromDb();
  };

  const deletePlantInstance = async (id) => {
    await deletePlantationByIdApi(id);
    await refreshDataFromDb();
  };

  const listZones = async () => fetchZones();

  const getZoneById = async (id) => fetchZoneById(id);

  const addZone = async (newZone) => {
    const created = await createZone(newZone);
    await refreshDataFromDb();
    return created;
  };

  const updateZone = async (id, partial) => {
    await updateZoneById(id, partial);
    await refreshDataFromDb();
  };

  const deleteZone = async (id) => {
    await deleteZoneByIdApi(id);
    await refreshDataFromDb();
  };

  const addSpeciesPhotoFiles = async (speciesId, files) => {
    if (!files || files.length === 0) {
      return;
    }
    await uploadSpeciesPhotos(speciesId, files);
    await refreshDataFromDb();
  };

  const removeSpeciesPhoto = async (speciesId, photoId) => {
    await deleteSpeciesPhotoByIdApi(speciesId, photoId);
    await refreshDataFromDb();
  };

  const exportDataBackup = async () => exportBackupFile();

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
    listZones,
    getZoneById,
    addZone,
    updateZone,
    deleteZone,
    addSpeciesPhotoFiles,
    removeSpeciesPhoto,
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
