// src/pages/SpeciesEditPage.jsx
import React, { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useGardenData } from "../data/GardenDataContext";
import { isSupportedImageFile } from "../utils/imageSerialization";

const buildInitialForm = (species, speciesPhotos) => ({
  common_name: species?.common_name || "",
  scientific_name: species?.scientific_name || "",
  family: species?.family || "",
  pruning_period: species?.pruning_period || "",
  flowering_period: species?.flowering_period || "",
  care_tips: species?.care_tips || "",
  notes: species?.notes || "",
  photos: buildInitialPhotos(species, speciesPhotos),
  external_links: Array.isArray(species?.external_links)
    ? species.external_links
    : []
});

function buildInitialPhotos(species, speciesPhotos) {
  if (!species) {
    return [];
  }

  const linkedEntities = (speciesPhotos || [])
    .filter((photo) => photo.speciesId === species.id)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((photo) => ({
      id: photo.id,
      speciesId: photo.speciesId,
      filename: photo.filename,
      mimeType: photo.mimeType,
      size: photo.size,
      imageUrl: photo.imageUrl,
      createdAt: photo.createdAt,
      kind: "entity"
    }));

  const entityUrls = new Set(linkedEntities.map((photo) => photo.imageUrl));
  const legacyPhotos = (species.photos || [])
    .filter((photoUrl) => photoUrl && !entityUrls.has(photoUrl))
    .map((photoUrl, index) => ({
      id: `legacy-${species.id}-${index}`,
      filename: `photo-${index + 1}`,
      mimeType: "",
      size: null,
      imageUrl: photoUrl,
      kind: "legacy"
    }));

  return [...linkedEntities, ...legacyPhotos];
}

export default function SpeciesEditPage() {
  const { speciesId } = useParams();
  const navigate = useNavigate();
  const {
    data,
    addSpecies,
    updateSpecies,
    addSpeciesPhotoFiles,
    removeSpeciesPhoto,
    deleteSpecies
  } = useGardenData();
  const { species, speciesPhotos, instances } = data;
  const isCreateMode = !speciesId;

  const sp = isCreateMode
    ? null
    : species.find((s) => s.id === Number(speciesId));

  const [form, setForm] = useState(buildInitialForm(sp, speciesPhotos));
  const [photoFeedback, setPhotoFeedback] = useState("");

  const initialEntityPhotoIds = useMemo(
    () => new Set((speciesPhotos || []).filter((photo) => photo.speciesId === sp?.id).map((photo) => photo.id)),
    [speciesPhotos, sp]
  );

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

  const removePhoto = (index) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handlePhotoImport = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const imported = [];
    const rejected = [];

    for (const file of files) {
      if (!isSupportedImageFile(file)) {
        rejected.push(`${file.name || "Fichier sans nom"} (format non supporté)`);
        continue;
      }

      imported.push({
        id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        filename: file.name || "photo",
        size: file.size || null,
        file,
        imageUrl: URL.createObjectURL(file),
        kind: "new"
      });
    }

    if (imported.length > 0) {
      setForm((prev) => ({ ...prev, photos: [...prev.photos, ...imported] }));
    }

    if (rejected.length > 0) {
      setPhotoFeedback(
        `Certains fichiers n'ont pas été importés: ${rejected.join(", ")}.`
      );
    } else {
      setPhotoFeedback(`${imported.length} photo(s) importée(s).`);
    }

    e.target.value = "";
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

  const handleSave = async (e) => {
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
      photos: form.photos
        .filter((photo) => photo.kind === "legacy")
        .map((photo) => (photo.imageUrl || "").trim())
        .filter(Boolean),
      external_links: cleanedExternalLinks
    };

    if (!payload.common_name) {
      alert("Le nom commun est obligatoire.");
      return;
    }

    const newFiles = form.photos
      .filter((photo) => photo.kind === "new" && photo.file)
      .map((photo) => photo.file);

    const keptEntityIds = new Set(
      form.photos
        .filter((photo) => photo.kind === "entity")
        .map((photo) => photo.id)
    );

    const removedEntityIds = [...initialEntityPhotoIds].filter(
      (photoId) => !keptEntityIds.has(photoId)
    );

    if (isCreateMode) {
      const createdSpecies = await addSpecies(payload);
      if (newFiles.length > 0) {
        await addSpeciesPhotoFiles(createdSpecies.id, newFiles);
      }
      alert("Espèce ajoutée.");
      navigate(`/species/${createdSpecies.id}`);
      return;
    }

    await updateSpecies(sp.id, payload);

    for (const photoId of removedEntityIds) {
      await removeSpeciesPhoto(sp.id, photoId);
    }

    if (newFiles.length > 0) {
      await addSpeciesPhotoFiles(sp.id, newFiles);
    }

    alert("Espèce mise à jour.");
    navigate(`/species/${sp.id}`);
  };

  const handleDelete = async () => {
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
    await deleteSpecies(sp.id);
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
              <input type="text" value={isCreateMode ? "Auto" : sp.id} readOnly />
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
              <h3>Photos</h3>
            </div>
            <p className="muted">
              Importez une ou plusieurs images (jpg, jpeg, png, webp) depuis votre appareil.
            </p>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              multiple
              onChange={handlePhotoImport}
            />
            {photoFeedback && <p className="muted">{photoFeedback}</p>}
            <div className="species-edit-list">
              {form.photos.map((photo, index) => (
                <div key={`photo-${index}`} className="species-edit-row">
                  <img
                    src={photo.imageUrl}
                    alt={photo.filename || `Photo ${index + 1}`}
                    style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8 }}
                  />
                  <span>{photo.filename || `Photo ${index + 1}`}</span>
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
            {form.photos.length === 0 && (
              <p className="muted">Aucune photo liée à cette espèce.</p>
            )}
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
