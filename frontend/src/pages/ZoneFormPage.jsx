import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useGardenData } from "../data/GardenDataContext";

function formatCoordinatesInput(coordinates) {
  return JSON.stringify(Array.isArray(coordinates) ? coordinates : [], null, 2);
}

export default function ZoneFormPage() {
  const { zoneId } = useParams();
  const navigate = useNavigate();
  const { data, addZone, updateZone } = useGardenData();
  const isCreateMode = !zoneId;

  const zone = isCreateMode ? null : data.zones.find((item) => item.id === Number(zoneId));

  const [form, setForm] = useState({
    name: zone?.name || "",
    description: zone?.description || "",
    coordinates: formatCoordinatesInput(zone?.coordinates || zone?.shape)
  });

  if (!isCreateMode && !zone) {
    return (
      <div className="species-detail-page">
        <p>Zone introuvable.</p>
        <Link to="/zones" className="back-link">← Retour aux zones</Link>
      </div>
    );
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    if (!name) {
      alert("Le nom de la zone est obligatoire.");
      return;
    }

    let coordinates;
    try {
      coordinates = JSON.parse(form.coordinates || "[]");
      if (!Array.isArray(coordinates)) {
        throw new Error("Coordinates must be an array");
      }
    } catch (_error) {
      alert("Le champ coordonnées doit être un tableau JSON valide.");
      return;
    }

    const payload = {
      name,
      description: form.description.trim(),
      coordinates
    };

    try {
      if (isCreateMode) {
        const created = await addZone(payload);
        navigate(`/zones/${created.id}`);
      } else {
        await updateZone(zone.id, payload);
        navigate(`/zones/${zone.id}`);
      }
    } catch (error) {
      alert(error.message || "Enregistrement impossible.");
    }
  };

  return (
    <div className="species-detail-page">
      <div className="species-detail-header">
        <Link to="/zones" className="back-link">← Retour aux zones</Link>
      </div>
      <h2>{isCreateMode ? "Créer une zone" : `Modifier la zone : ${zone.name}`}</h2>

      <form onSubmit={handleSubmit} className="species-form">
        <label>
          Nom *
          <input type="text" name="name" value={form.name} onChange={handleChange} required maxLength={80} />
        </label>

        <label>
          Description
          <textarea name="description" value={form.description} onChange={handleChange} rows={3} maxLength={255} />
        </label>

        <label>
          Coordonnées (JSON Array)
          <textarea name="coordinates" value={form.coordinates} onChange={handleChange} rows={8} />
        </label>

        <button type="submit" className="btn-secondary">
          {isCreateMode ? "Créer la zone" : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
