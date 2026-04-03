// src/pages/SpeciesEditPage.jsx
import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useGardenData } from "../data/GardenDataContext";

export default function SpeciesEditPage() {
  const { speciesId } = useParams();
  const navigate = useNavigate();
  const { data, addSpecies, updateSpecies, deleteSpecies } = useGardenData();
  const { species, instances } = data;
  const isCreateMode = !speciesId;

  const sp = isCreateMode
    ? null
    : species.find((s) => s.id === Number(speciesId));

  // ✅ on initialise le state même si sp est undefined
  const [form, setForm] = useState({
    common_name: sp?.common_name || "",
    scientific_name: sp?.scientific_name || "",
    sun_exposure: sp?.sun_exposure || "",
    water_need: sp?.water_need || "",
    care_notes: sp?.care_notes || "",
    photo_url: sp?.photo_url || ""
  });

  // ✅ tous les hooks sont déjà appelés, on peut maintenant conditionner le rendu
  if (!isCreateMode && !sp) {
    return (
      <div className="plant-detail-page">
        <p>Espèce introuvable.</p>
        <Link to="/species" className="back-link">
          ← Retour à la liste des espèces
        </Link>
      </div>
    );
  }

  const instancesForSpecies = isCreateMode
    ? []
    : instances.filter((inst) => inst.species_id === sp.id);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();

    const payload = {
      common_name: form.common_name.trim(),
      scientific_name: form.scientific_name.trim(),
      sun_exposure: form.sun_exposure.trim(),
      water_need: form.water_need.trim(),
      care_notes: form.care_notes.trim(),
      photo_url: form.photo_url.trim()
    };

    if (isCreateMode) {
      const maxId = species.length > 0 ? Math.max(...species.map((s) => s.id)) : 0;
      const createdSpecies = {
        id: maxId + 1,
        ...payload
      };
      addSpecies(createdSpecies);
      alert("Espèce ajoutée.");
      navigate(`/species/${createdSpecies.id}`);
      return;
    }

    updateSpecies(sp.id, payload);
    alert("Espèce mise à jour.");
    navigate(`/species/${sp.id}`);
  };

  const handleDelete = () => {
    if (instancesForSpecies.length > 0) {
      alert(
        "Impossible de supprimer cette espèce : il existe encore des plantations associées."
      );
      return;
    }
    const ok = window.confirm(
      `Supprimer définitivement l'espèce "${sp.common_name}" ?`
    );
    if (!ok) return;
    deleteSpecies(sp.id);
    navigate("/species");
  };

  return (
    <div className="plant-detail-page">
      <h2>
        {isCreateMode ? "Ajouter une espèce" : `Modifier l'espèce : ${sp.common_name}`}
      </h2>

      <form onSubmit={handleSave} className="species-form">
        <label>
          Nom commun *
          <input
            type="text"
            name="common_name"
            value={form.common_name}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Nom scientifique
          <input
            type="text"
            name="scientific_name"
            value={form.scientific_name}
            onChange={handleChange}
          />
        </label>

        <label>
          Exposition au soleil
          <input
            type="text"
            name="sun_exposure"
            value={form.sun_exposure}
            onChange={handleChange}
          />
        </label>

        <label>
          Besoin en eau
          <input
            type="text"
            name="water_need"
            value={form.water_need}
            onChange={handleChange}
          />
        </label>

        <label>
          Notes d’entretien
          <textarea
            name="care_notes"
            value={form.care_notes}
            onChange={handleChange}
            rows={3}
          />
        </label>

        <label>
          URL photo
          <input
            type="url"
            name="photo_url"
            value={form.photo_url}
            onChange={handleChange}
          />
        </label>

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
          <button type="submit">
            {isCreateMode ? "➕ Ajouter l'espèce" : "💾 Enregistrer"}
          </button>
          {!isCreateMode && (
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
              🗑️ Supprimer l'espèce
            </button>
          )}
        </div>
      </form>

      <Link
        to={isCreateMode ? "/species" : `/species/${sp.id}`}
        className="back-link"
        style={{ marginTop: "0.75rem", display: "inline-block" }}
      >
        {isCreateMode ? "← Retour à la liste des espèces" : "← Retour à la fiche"}
      </Link>
    </div>
  );
}
