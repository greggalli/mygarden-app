// src/pages/SpeciesEditPage.jsx
import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useGardenData } from "../data/GardenDataContext";

const buildInitialForm = (species) => ({
  common_name: species?.common_name || "",
  scientific_name: species?.scientific_name || "",
  family: species?.family || "",
  pruning_period: species?.pruning_period || "",
  flowering_period: species?.flowering_period || "",
  care_tips: species?.care_tips || "",
  notes: species?.notes || "",
  photos: Array.isArray(species?.photos) ? species.photos : [],
  external_links: Array.isArray(species?.external_links)
    ? species.external_links
    : []
});

export default function SpeciesEditPage() {
  const { speciesId } = useParams();
  const navigate = useNavigate();
  const { data, addSpecies, updateSpecies, deleteSpecies } = useGardenData();
  const { species, instances } = data;
  const isCreateMode = !speciesId;
  const nextSpeciesId = species.length > 0 ? Math.max(...species.map((s) => s.id)) + 1 : 1;

  const sp = isCreateMode
    ? null
    : species.find((s) => s.id === Number(speciesId));

  const [form, setForm] = useState(buildInitialForm(sp));

  if (!isCreateMode && !sp) {
    return (
      <div className="species-detail-page">
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

  const handlePhotoChange = (index, value) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.map((photo, i) => (i === index ? value : photo))
    }));
  };

  const addPhoto = () => {
    setForm((prev) => ({ ...prev, photos: [...prev.photos, ""] }));
  };

  const removePhoto = (index) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleExternalLinkChange = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      external_links: prev.external_links.map((link, i) =>
        i === index ? { ...link, [key]: value } : link
      )
    }));
  };

  const addExternalLink = () => {
    setForm((prev) => ({
      ...prev,
      external_links: [...prev.external_links, { label: "", url: "" }]
    }));
  };

  const removeExternalLink = (index) => {
    setForm((prev) => ({
      ...prev,
      external_links: prev.external_links.filter((_, i) => i !== index)
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();

    const cleanedExternalLinks = [];
    for (const link of form.external_links) {
      const label = (link?.label || "").trim();
      const url = (link?.url || "").trim();
      if (!label && !url) continue;
      if (!label || !url) {
        alert("Chaque référence externe doit contenir un libellé et une URL.");
        return;
      }
      cleanedExternalLinks.push({ label, url });
    }

    const payload = {
      common_name: form.common_name.trim(),
      scientific_name: form.scientific_name.trim(),
      family: form.family.trim(),
      pruning_period: form.pruning_period.trim(),
      flowering_period: form.flowering_period.trim(),
      care_tips: form.care_tips.trim(),
      notes: form.notes.trim(),
      photos: form.photos.map((photo) => photo.trim()).filter(Boolean),
      external_links: cleanedExternalLinks
    };

    if (!payload.common_name) {
      alert("Le nom commun est obligatoire.");
      return;
    }

    if (isCreateMode) {
      const createdSpecies = {
        id: nextSpeciesId,
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
    <div className="species-detail-page">
      <div className="species-detail-header">
        <Link to="/species" className="back-link">
          ← Retour à la liste des espèces
        </Link>
      </div>

      <h2>
        {isCreateMode ? "Ajouter une espèce" : `Modifier l'espèce : ${sp.common_name}`}
      </h2>

      <form onSubmit={handleSave} className="species-form">
        <section className="species-detail-section">
          <div className="species-detail-card">
            <div className="section-header">
              <h3>Identification</h3>
            </div>

            <label>
              ID interne (généré)
              <input type="text" value={isCreateMode ? nextSpeciesId : sp.id} readOnly />
            </label>

            <label>
              Nom commun *
              <input
                type="text"
                name="common_name"
                value={form.common_name}
                onChange={handleChange}
                required
                maxLength={80}
              />
            </label>

            <label>
              Nom scientifique
              <input
                type="text"
                name="scientific_name"
                value={form.scientific_name}
                onChange={handleChange}
                maxLength={80}
              />
            </label>

            <label>
              Famille
              <input
                type="text"
                name="family"
                value={form.family}
                onChange={handleChange}
                maxLength={80}
              />
            </label>
          </div>
        </section>

        <section className="species-detail-section">
          <div className="species-detail-card">
            <div className="section-header">
              <h3>Entretien</h3>
            </div>

            <label>
              Période de taille
              <input
                type="text"
                name="pruning_period"
                value={form.pruning_period}
                onChange={handleChange}
                maxLength={80}
              />
            </label>

            <label>
              Période de floraison
              <input
                type="text"
                name="flowering_period"
                value={form.flowering_period}
                onChange={handleChange}
                maxLength={80}
              />
            </label>

            <label>
              Conseils d'entretien
              <textarea
                name="care_tips"
                value={form.care_tips}
                onChange={handleChange}
                rows={3}
                maxLength={255}
              />
            </label>

            <label>
              Notes
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                maxLength={255}
              />
            </label>
          </div>
        </section>

        <section className="species-detail-section">
          <div className="species-detail-card">
            <div className="section-header">
              <h3>Photos (liens texte)</h3>
            </div>
            <p className="muted">
              Renseigner des chemins comme <code>/images/species/{isCreateMode ? nextSpeciesId : sp.id}/photo.jpg</code>.
              La sélection depuis le stockage sera ajoutée plus tard.
            </p>
            <div className="species-edit-list">
              {form.photos.map((photo, index) => (
                <div key={`photo-${index}`} className="species-edit-row">
                  <input
                    type="text"
                    value={photo}
                    onChange={(e) => handlePhotoChange(index, e.target.value)}
                    placeholder="/images/species/<id>/photo.jpg"
                  />
                  <button
                    type="button"
                    className="btn-icon-danger"
                    onClick={() => removePhoto(index)}
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="btn-secondary" onClick={addPhoto}>
              Ajouter une photo
            </button>
          </div>
        </section>

        <section className="species-detail-section">
          <div className="species-detail-card">
            <div className="section-header">
              <h3>Références externes</h3>
            </div>
            <div className="species-edit-list">
              {form.external_links.map((link, index) => (
                <div key={`link-${index}`} className="species-edit-link-grid">
                  <input
                    type="text"
                    value={link.label || ""}
                    onChange={(e) =>
                      handleExternalLinkChange(index, "label", e.target.value)
                    }
                    maxLength={80}
                    placeholder="Libellé"
                  />
                  <input
                    type="url"
                    value={link.url || ""}
                    onChange={(e) =>
                      handleExternalLinkChange(index, "url", e.target.value)
                    }
                    placeholder="https://..."
                  />
                  <button
                    type="button"
                    className="btn-icon-danger"
                    onClick={() => removeExternalLink(index)}
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={addExternalLink}
            >
              Ajouter une référence
            </button>
          </div>
        </section>

        <div className="species-form-actions">
          <button type="submit">
            {isCreateMode ? "Ajouter l'espèce" : "Enregistrer"}
          </button>
          {!isCreateMode && (
            <button
              type="button"
              className="species-delete-btn"
              onClick={handleDelete}
            >
              Supprimer l'espèce
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
