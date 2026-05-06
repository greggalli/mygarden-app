import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useGardenData } from "../data/GardenDataContext";
import { pointInPolygon } from "../utils/geojson";

export default function AddPlantPage() {
  const navigate = useNavigate();
  const { data, addPlantInstance } = useGardenData();
  const { zones, species, instances } = data;

  const [searchParams] = useSearchParams();
  const preselectedSpeciesId = searchParams.get("speciesId");

  const [plantForm, setPlantForm] = useState({
    species_id: preselectedSpeciesId ? String(preselectedSpeciesId) : "",
    zone_id: "",
    nickname: "",
    planting_date: "",
    notes: "",
    x: "",
    y: ""
  });
  const [formError, setFormError] = useState("");

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

  const handlePlantSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const maxId =
      instances.length > 0
        ? Math.max(...instances.map((inst) => inst.id))
        : 0;

    const nickname = plantForm.nickname.trim();
    const notes = plantForm.notes.trim();

    const selectedZone = zones.find((z) => z.id === Number(plantForm.zone_id));
    const zoneGeometry = selectedZone?.geometry;
    const x = Number(plantForm.x);
    const y = Number(plantForm.y);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      setFormError("Les coordonnées X et Y sont obligatoires et doivent être numériques.");
      return;
    }
    if (!zoneGeometry || zoneGeometry.type !== "Polygon" || !Array.isArray(zoneGeometry.coordinates)) {
      setFormError("La zone sélectionnée n'a pas de géométrie valide.");
      return;
    }
    const point = { type: "Point", coordinates: [x, y] };
    const inside = pointInPolygon(point, zoneGeometry);
    if (!inside) {
      setFormError("Les coordonnées de la plantation doivent se trouver à l'intérieur de la zone sélectionnée.");
      return;
    }

    const newPlant = {
      id: maxId + 1,
      species_id: Number(plantForm.species_id),
      zone_id: Number(plantForm.zone_id),
      nickname,
      planting_date: plantForm.planting_date || null,
      notes,
      position: point
    };

    if (!newPlant.species_id || !newPlant.zone_id || !newPlant.nickname) {
      alert("Espèce, zone et nom sont obligatoires.");
      return;
    }

    try {
      await addPlantInstance(newPlant);
    } catch (error) {
      setFormError(error.message);
      return;
    }
    navigate("/plants");
  };

  return (
    <div className="add-plant-page">
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
          Nom de la plantation *
          <input
            type="text"
            name="nickname"
            value={plantForm.nickname}
            onChange={handlePlantChange}
            maxLength={80}
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
          Coordonnée X *
          <input type="number" name="x" value={plantForm.x} onChange={handlePlantChange} required />
        </label>

        <label>
          Coordonnée Y *
          <input type="number" name="y" value={plantForm.y} onChange={handlePlantChange} required />
        </label>
        <label>
          Notes
          <textarea
            name="notes"
            value={plantForm.notes}
            onChange={handlePlantChange}
            maxLength={255}
            rows={4}
            placeholder="Observations, sol, état, etc."
          />
        </label>

        <button type="submit">Ajouter la plantation</button>
        {formError && <p className="muted" style={{ color: "#b71c1c" }}>{formError}</p>}
      </form>

      <Link to="/plants" className="back-link">
        ← Retour aux plantations
      </Link>
    </div>
  );
}