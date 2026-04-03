// src/data/GardenDataContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

import zonesJson from "./zones.json";
import speciesJson from "./species.json";
import instancesJson from "./instances.json";
import tasksJson from "./tasks.json";

const STORAGE_KEY = "mygarden-data-v1";
const GardenDataContext = createContext(null);

export function GardenDataProvider({ children }) {
  const [data, setData] = useState({
    zones: zonesJson,
    species: speciesJson,
    instances: instancesJson,
    tasks: tasksJson
  });

  // chargement initial localStorage
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.zones && parsed.species && parsed.instances && parsed.tasks) {
          setData(parsed);
        }
      }
    } catch (e) {
      console.warn("Erreur chargement données localStorage:", e);
    }
  }, []);

  // persistance
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Erreur sauvegarde données localStorage:", e);
    }
  }, [data]);

  // === Mutations espèces ===

  const addSpecies = (newSpecies) => {
    setData((current) => ({
      ...current,
      species: [...current.species, newSpecies]
    }));
  };

  const updateSpecies = (id, partial) => {
    setData((current) => ({
      ...current,
      species: current.species.map((sp) =>
        sp.id === id ? { ...sp, ...partial } : sp
      )
    }));
  };

  const deleteSpecies = (id) => {
    setData((current) => ({
      ...current,
      species: current.species.filter((sp) => sp.id !== id)
      // ⚠️ On ne touche pas aux instances ici.
      // La logique métier (empêcher suppression si instances) est dans l'UI.
    }));
  };

  // === Mutations plantations (instances) ===

  const addPlantInstance = (newInstance) => {
    setData((current) => ({
      ...current,
      instances: [...current.instances, newInstance]
    }));
  };

  const updatePlantInstance = (id, partial) => {
    setData((current) => ({
      ...current,
      instances: current.instances.map((inst) =>
        inst.id === id ? { ...inst, ...partial } : inst
      )
    }));
  };

  const deletePlantInstance = (id) => {
    setData((current) => ({
      ...current,
      instances: current.instances.filter((inst) => inst.id !== id)
    }));
  };

  const value = {
    data,
    setData,
    addSpecies,
    updateSpecies,
    deleteSpecies,
    addPlantInstance,
    updatePlantInstance,
    deletePlantInstance
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
