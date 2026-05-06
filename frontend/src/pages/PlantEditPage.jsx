// src/pages/PlantEditPage.jsx
import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useGardenData } from "../data/GardenDataContext";
import { pointInPolygon } from "../utils/geojson";

export default function PlantEditPage() {
  const { plantId } = useParams();
  const navigate = useNavigate();
  const { data, updatePlantInstance, deletePlantInstance } = useGardenData();
  const { instances, species, zones } = data;

  // On cherche la plante
  const inst = instances.find((p) => p.id === Number(plantId));

  // 🔧 useState toujours défini, même si inst est null
  const [form, setForm] = useState({
    species_id: inst?.species_id || "",
    zone_id: inst?.zone_id || "",
    nickname: inst?.nickname || "",
    planting_date: inst?.planting_date || "",
    notes: inst?.notes || "",
    x: inst?.position?.coordinates?.[0] ?? "",
    y: inst?.position?.coordinates?.[1] ?? ""
  });
  const [formError, setFormError] = useState("");

  // 🔒 Si la plante n’existe pas, on fait le return après tous les hooks
  if (!inst) {
    return (
      <div className="plant-detail-page">
        <p>Plante introuvable.</p>
        <Link to="/plants" className="back-link">
          ← Retour à la liste des plantations
        </Link>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "species_id" || name === "zone_id" ? Number(value) : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.species_id || !form.zone_id || !form.nickname.trim()) {
      alert("Espèce, zone et nom sont obligatoires.");
      return;
    }

    const x = Number(form.x);
    const y = Number(form.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      setFormError("Les coordonnées X et Y sont obligatoires et doivent être numériques.");
      return;
    }
    const selectedZone = zones.find((z) => z.id === Number(form.zone_id));
    if (!selectedZone?.geometry || !pointInPolygon({ type: "Point", coordinates: [x, y] }, selectedZone.geometry)) {
      setFormError(selectedZone?.geometry
        ? "Les coordonnées de la plantation doivent se trouver à l'intérieur de la zone sélectionnée."
        : "La zone sélectionnée n'a pas de géométrie valide.");
      return;
    }

    try {
      await updatePlantInstance(inst.id, {
      species_id: form.species_id,
      zone_id: form.zone_id,
      nickname: form.nickname.trim(),
      planting_date: form.planting_date || null,
      notes: form.notes.trim(),
      position: { type: "Point", coordinates: [x, y] }
    });
    } catch (error) {
      setFormError(error.message);
      return;
    }

    alert("Plantation mise à jour.");
    navigate(`/plants/${inst.id}`);
  };

  const handleDelete = async () => {
    const ok = window.confirm(
      `Supprimer définitivement la plantation "${inst.nickname}" ?`
    );
    if (!ok) return;

    await deletePlantInstance(inst.id);
    navigate("/plants");
  };

  return (
    <div className="plant-detail-page">
      <h2>Modifier la plantation : {inst.nickname}</h2>

      <form onSubmit={handleSave} className="plant-form">
        <label>
          Espèce *
          <select
            name="species_id"
            value={form.species_id}
            onChange={handleChange}
            required
          >
            <option value="">Choisir une espèce</option>
            {species.map((s) => (
              <option key={s.id} value={s.id}>
                {s.common_name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Zone *
          <select
            name="zone_id"
            value={form.zone_id}
            onChange={handleChange}
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
            value={form.nickname}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Coordonnée X *
          <input type="number" name="x" value={form.x} onChange={handleChange} required />
        </label>

        <label>
          Coordonnée Y *
          <input type="number" name="y" value={form.y} onChange={handleChange} required />
        </label>

        <label>
          Date de plantation
          <input
            type="date"
            name="planting_date"
            value={form.planting_date || ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Notes
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
          />
        </label>

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
          <button type="submit">💾 Enregistrer</button>
          <button
            type="button"
            style={{
              background: "#b71c1c",
              color: "#fff",
              borderRadius: "8px",
              padding: "0.4rem 0.8rem",
              border: "none"
            }}
            onClick={handleDelete}
          >
            🗑️ Supprimer la plantation
          </button>
        </div>
        {formError && <p className="muted" style={{ color: "#b71c1c" }}>{formError}</p>}
      </form>

      <Link
        to={`/plants/${inst.id}`}
        className="back-link"
        style={{ marginTop: "0.75rem", display: "inline-block" }}
      >
        ← Retour à la fiche
      </Link>
    </div>
  );
}
