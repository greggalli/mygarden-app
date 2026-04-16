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
  instances: instancesJson,
  tasks: tasksJson
};

export function GardenDataProvider({ children }) {
  const [data, setData] = useState(initialData);
  const [isDataReady, setIsDataReady] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function boot() {
      try {
        const dataset = await initializePersistence();
        if (isActive) {
          setData(dataset);
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
    setData(latest);
    return latest;
  };

  // === Mutations espèces ===
  const addSpecies = async (newSpecies) => {
    await saveSpecies(newSpecies);
    setData((current) => ({
      ...current,
      species: [...current.species, newSpecies]
    }));
  };

  const updateSpecies = async (id, partial) => {
    const currentSpecies = data.species.find((sp) => sp.id === id);
    if (!currentSpecies) {
      return;
    }

    const updatedSpecies = { ...currentSpecies, ...partial };
    await saveSpecies(updatedSpecies);

    setData((current) => ({
      ...current,
      species: current.species.map((sp) => (sp.id === id ? updatedSpecies : sp))
    }));
  };

  const deleteSpecies = async (id) => {
    await deleteSpeciesById(id);
    setData((current) => ({
      ...current,
      species: current.species.filter((sp) => sp.id !== id)
      // ⚠️ On ne touche pas aux instances ici.
      // La logique métier (empêcher suppression si instances) est dans l'UI.
    }));
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
