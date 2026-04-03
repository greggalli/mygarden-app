// src/pages/AddPlantPage.jsx
import React, { useEffect, useState } from "react";
import { useGardenData } from "../data/GardenDataContext";
import { useSearchParams } from "react-router-dom";

export default function AddPlantPage() {
  const { data, addPlantInstance, addSpecies } = useGardenData();
  const { zones, species, instances } = data;

  const [searchParams] = useSearchParams();
  const preselectedSpeciesId = searchParams.get("speciesId");

  // --- Formulaire espèce ---

  const [speciesForm, setSpeciesForm] = useState({
    common_name: "",
    scientific_name: "",
    sun_exposure: "",
    water_need: "",
    care_notes: "",
    photo_url: ""
  });

  const handleSpeciesChange = (e) => {
    const { name, value } = e.target;
    setSpeciesForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSpeciesSubmit = (e) => {
    e.preventDefault();

    // id = max existant + 1
    const maxId =
      species.length > 0 ? Math.max(...species.map((sp) => sp.id)) : 0;

    const newSpecies = {
      id: maxId + 1,
      common_name: speciesForm.common_name.trim(),
      scientific_name: speciesForm.scientific_name.trim() || "",
      sun_exposure: speciesForm.sun_exposure.trim() || "",
      water_need: speciesForm.water_need.trim() || "",
      care_notes: speciesForm.care_notes.trim() || "",
      photo_url: speciesForm.photo_url.trim() || ""
    };

    if (!newSpecies.common_name) {
      alert("Le nom commun est obligatoire pour une espèce.");
      return;
    }

    addSpecies(newSpecies);

    alert(`Espèce ajoutée : ${newSpecies.common_name}`);

    setSpeciesForm({
      common_name: "",
      scientific_name: "",
      sun_exposure: "",
      water_need: "",
      care_notes: "",
      photo_url: ""
    });
  };

  // --- Formulaire plantation (instance) ---

  const [plantForm, setPlantForm] = useState({
    species_id: preselectedSpeciesId ? String(preselectedSpeciesId) : "",
    zone_id: "",
    nickname: "",
    planting_date: "",
    notes: ""
  });

  useEffect(() => {
    if (preselectedSpeciesId) {
      setPlantForm((prev) => ({
        ...prev,
        species_id: String(preselectedSpeciesId)
      }));
    }
  }, [preselectedSpeciesId]);

  const handlePlantChange = (e) => {
    const { name, value } = e.target;
    setPlantForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlantSubmit = (e) => {
    e.preventDefault();

    const maxId =
      instances.length > 0
        ? Math.max(...instances.map((inst) => inst.id))
        : 0;

    const newPlant = {
      id: maxId + 1,
      species_id: Number(plantForm.species_id),
      zone_id: Number(plantForm.zone_id),
      nickname: plantForm.nickname,
      planting_date: plantForm.planting_date || null,
      notes: plantForm.notes || "",
      // TODO: plus tard -> choix de la position sur une carte
      position: { x_pct: 50, y_pct: 50 }
    };

    if (!newPlant.species_id || !newPlant.zone_id || !newPlant.nickname) {
      alert("Espèce, zone et nom sont obligatoires.");
      return;
    }

    addPlantInstance(newPlant);

    alert(`Plante ajoutée : ${newPlant.nickname}`);

    setPlantForm({
      species_id: preselectedSpeciesId ? String(preselectedSpeciesId) : "",
      zone_id: "",
      nickname: "",
      planting_date: "",
      notes: ""
    });
  };

  return (
    <div className="add-page-layout">
      {/* Colonne gauche : ajout d'espèce */}
      <section className="add-col">
        <div className="add-card">
          <h2>Ajouter une espèce</h2>
          <form onSubmit={handleSpeciesSubmit} className="species-form">
            <label>
              Nom commun *
              <input
                type="text"
                name="common_name"
                value={speciesForm.common_name}
                onChange={handleSpeciesChange}
                required
              />
            </label>

            <label>
              Nom scientifique
              <input
                type="text"
                name="scientific_name"
                value={speciesForm.scientific_name}
                onChange={handleSpeciesChange}
              />
            </label>

            <label>
              Exposition au soleil
              <input
                type="text"
                name="sun_exposure"
                value={speciesForm.sun_exposure}
                onChange={handleSpeciesChange}
                placeholder="ex : plein soleil, mi-ombre..."
              />
            </label>

            <label>
              Besoin en eau
              <input
                type="text"
                name="water_need"
                value={speciesForm.water_need}
                onChange={handleSpeciesChange}
                placeholder="ex : faible, moyen, élevé"
              />
            </label>

            <label>
              Notes d’entretien
              <textarea
                name="care_notes"
                value={speciesForm.care_notes}
                onChange={handleSpeciesChange}
                rows={3}
                placeholder="Conseils globaux pour cette espèce"
              />
            </label>

            <label>
              URL de photo (optionnel)
              <input
                type="url"
                name="photo_url"
                value={speciesForm.photo_url}
                onChange={handleSpeciesChange}
                placeholder="https://..."
              />
            </label>

            <button type="submit">✅ Ajouter l'espèce</button>
          </form>
        </div>
      </section>

      {/* Colonne droite : ajout de plantation */}
      <section className="add-col">
        <div className="add-card">
          <h2>Ajouter une plantation</h2>
          <form onSubmit={handlePlantSubmit} className="plant-form">
            <label>
              Espèce *
              <select
                name="species_id"
                value={plantForm.species_id}
                onChange={handlePlantChange}
                required
              >
                <option value="">Choisir une espèce</option>
                {species.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.common_name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Zone *
              <select
                name="zone_id"
                value={plantForm.zone_id}
                onChange={handlePlantChange}
                required
              >
                <option value="">Choisir une zone</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Nom ou surnom *
              <input
                type="text"
                name="nickname"
                value={plantForm.nickname}
                onChange={handlePlantChange}
                placeholder="ex : Tomate cabanon"
                required
              />
            </label>

            <label>
              Date de plantation
              <input
                type="date"
                name="planting_date"
                value={plantForm.planting_date}
                onChange={handlePlantChange}
              />
            </label>

            <label>
              Notes
              <textarea
                name="notes"
                value={plantForm.notes}
                onChange={handlePlantChange}
                placeholder="Observations, sol, état, etc."
                rows={3}
              />
            </label>

            <button type="submit">✅ Ajouter la plantation</button>
          </form>
        </div>
      </section>
    </div>
  );
}
