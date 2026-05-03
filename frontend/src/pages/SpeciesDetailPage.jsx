// src/pages/SpeciesDetailPage.jsx
import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useGardenData } from "../data/GardenDataContext";

const SpeciesDetailPage = () => {
  const { speciesId } = useParams();
  const navigate = useNavigate();
  const { data } = useGardenData();

  // 🔹 Hooks toujours en haut
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const numericSpeciesId = Number(speciesId);

  const speciesList = data?.species || [];
  const instancesList = data?.instances || [];
  const zonesList = data?.zones || [];

  const species = speciesList.find((s) => s.id === numericSpeciesId) || null;

  // Si l'espèce n'existe pas
  if (!species) {
    return (
      <div className="species-detail-page">
        <div className="species-detail-header">
          <Link to="/species" className="back-link">
            ← Retour à la liste des espèces
          </Link>
        </div>
        <h2 className="detail-title">Espèce introuvable</h2>
        <p className="muted">
          Aucune espèce ne correspond à l’identifiant demandé.
        </p>
      </div>
    );
  }

  // --- Données dérivées ---

  const photos = Array.isArray(species.photos) ? species.photos : [];
  const externalLinks = Array.isArray(species.external_links)
    ? species.external_links
    : [];

  const hasPhotos = photos.length > 0;
  const hasMultiplePhotos = photos.length > 1;
  const safePhotoIndex =
    photos.length > 0 ? Math.min(photoIndex, photos.length - 1) : 0;

  // Plantations de cette espèce
  const instancesForSpecies = instancesList.filter(
    (inst) => inst && inst.species_id === numericSpeciesId
  );
  const totalInstances = instancesForSpecies.length;

  // Map zoneId -> zone (pour afficher la zone des plantations)
  const zoneById = new Map();
  zonesList.forEach((z) => {
    if (z && typeof z.id !== "undefined") {
      zoneById.set(z.id, z);
    }
  });

  const pluralPlantations = totalInstances > 1 ? "plantations" : "plantation";

  // --- Handlers ---

  const handleEditSpecies = () => {
    navigate(`/species/${numericSpeciesId}/edit`);
  };

  const handleAddPlant = () => {
    navigate(`/add-plant?speciesId=${numericSpeciesId}`);
  };

  const handleOpenInstance = (instanceId) => {
    navigate(`/plants/${instanceId}`);
  };

  const goPrevPhoto = () => {
    if (!hasMultiplePhotos) return;
    setPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goNextPhoto = () => {
    if (!hasMultiplePhotos) return;
    setPhotoIndex((prev) =>
      prev === photos.length - 1 ? 0 : prev + 1
    );
  };

  const openLightbox = (index) => {
    setPhotoIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  // --- Rendu ---

  return (
    <div className="species-detail-page">
      {/* Lien retour */}
      <div className="species-detail-header">
        <Link to="/species" className="back-link">
          ← Retour à la liste des espèces
        </Link>
      </div>

      {/* 1. Nom de l'espèce en titre */}
      <h2 className="detail-title">
        {species.common_name || "Espèce sans nom"}
      </h2>

      {/* 2. Ligne suivante : nom scientifique + (famille) */}
      {(species.scientific_name || species.family) && (
        <p className="detail-subtitle species-detail-sci">
          {species.scientific_name && <span>{species.scientific_name}</span>}
          {species.family && (
            <span>
              {" "}
              ({species.family})
            </span>
          )}
        </p>
      )}

      {/* 3. Bloc photo avec carrousel */}
      {hasPhotos && (
        <section className="species-detail-section">
          <div className="species-detail-card species-photo-block">
            <div className="section-header">
              <h3>Photos</h3>
            </div>

            <div className="species-photo-carousel">
              {/* Photo principale */}
              <button
                type="button"
                className="species-photo-main"
                onClick={() => openLightbox(safePhotoIndex)}
              >
                <img
                  src={photos[safePhotoIndex]}
                  loading="lazy"
                  alt={species.common_name || "Photo espèce"}
                />
              </button>

              {/* Contrôles carrousel */}
              {hasMultiplePhotos && (
                <div className="species-photo-controls">
                  <button
                    type="button"
                    className="photo-nav-btn"
                    onClick={goPrevPhoto}
                  >
                    ‹
                  </button>
                  <span className="photo-counter">
                    {safePhotoIndex + 1} / {photos.length}
                  </span>
                  <button
                    type="button"
                    className="photo-nav-btn"
                    onClick={goNextPhoto}
                  >
                    ›
                  </button>
                </div>
              )}

              {/* Vignettes */}
              {hasMultiplePhotos && (
                <div className="species-photo-thumbs">
                  {photos.map((url, index) => (
                    <button
                      key={index}
                      type="button"
                      className={
                        "species-photo-thumb" +
                        (index === safePhotoIndex ? " is-active" : "")
                      }
                      onClick={() => setPhotoIndex(index)}
                    >
                      <img
                        src={url}
                        loading="lazy"
                        alt={
                          species.common_name ||
                          species.scientific_name ||
                          "Miniature"
                        }
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="species-detail-section">
        <div className="species-detail-card">
          <div className="section-header">
            <h3>Information botanique</h3>
          </div>
          <dl className="species-detail-attributes">
            <div className="species-detail-attribute-row"><dt>Famille</dt><dd>{species.family || <span className="muted">—</span>}</dd></div>
            <div className="species-detail-attribute-row"><dt>Genre</dt><dd>{species.gender || <span className="muted">—</span>}</dd></div>
            <div className="species-detail-attribute-row"><dt>Espèce</dt><dd>{species.specie || <span className="muted">—</span>}</dd></div>
          </dl>
        </div>
      </section>

      {/* 4. Liens utiles */}
      <section className="species-detail-section">
        <div className="species-detail-card">
          <div className="section-header">
            <h3>Liens utiles</h3>
          </div>
          {externalLinks.length === 0 && (
            <p className="muted">Aucun lien renseigné pour cette espèce.</p>
          )}
          {externalLinks.length > 0 && (
            <ul className="species-link-list">
              {externalLinks.map((link, index) => (
                <li key={index} className="species-link-item">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label || link.url}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 5. Bloc entretien */}
      <section className="species-detail-section">
        <div className="species-detail-card">
          <div className="section-header">
            <h3>Entretien</h3>
          </div>
          <dl className="species-detail-attributes">
            <div className="species-detail-attribute-row">
              <dt>Période de taille</dt>
              <dd>
                {species.pruning_period ? (
                  species.pruning_period
                ) : (
                  <span className="muted">Non renseignée</span>
                )}
              </dd>
            </div>
            <div className="species-detail-attribute-row">
              <dt>Période de floraison</dt>
              <dd>
                {species.flowering_period ? (
                  species.flowering_period
                ) : (
                  <span className="muted">Non renseignée</span>
                )}
              </dd>
            </div>
          </dl>
          <div className="species-garden-care">
            <h4>Conseils d’entretien</h4>
            {species.care_tips ? (
              <p>{species.care_tips}</p>
            ) : (
              <p className="muted">
                Aucun conseil d’entretien renseigné pour l’instant.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 6. Bloc notes personnelles */}
      <section className="species-detail-section">
        <div className="species-detail-card">
          <div className="section-header">
            <h3>Notes personnelles</h3>
          </div>
          {species.notes ? (
            <p>{species.notes}</p>
          ) : (
            <p className="muted">Aucune note pour l’instant.</p>
          )}
        </div>
      </section>

      {/* 7. Bloc "Dans le jardin" avec la liste des plantations de cette espèce */}
      <section className="species-detail-section species-detail-instances">
        <div className="species-detail-card">
          <div className="section-header section-header-inline">
            <h3>Dans le jardin</h3>
            {totalInstances > 0 && (
              <span className="muted small">
                {totalInstances} {pluralPlantations} listée
                {totalInstances > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {instancesForSpecies.length === 0 ? (
            <p className="muted">Aucune plantation pour l’instant…</p>
          ) : (
            <div className="instance-list">
              {instancesForSpecies.map((inst) => {
                const zone =
                  inst.zone_id != null ? zoneById.get(inst.zone_id) : null;

                return (
                  <button
                    key={inst.id}
                    type="button"
                    className="instance-row"
                    onClick={() => handleOpenInstance(inst.id)}
                  >
                    <div className="instance-row-main">
                      <div className="instance-title">
                        {inst.nickname || "Sans surnom"}
                      </div>
                      <div className="instance-meta">
                        <span className="instance-zone">
                          {zone?.name || "Zone inconnue"}
                        </span>
                        {inst.planting_date && (
                          <span className="instance-date">
                            Plantée le {inst.planting_date}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 8. Bloc actions */}
      <section className="species-detail-section">
        <div className="species-detail-card">
          <div className="section-header">
            <h3>Actions</h3>
          </div>
          <div className="species-detail-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleEditSpecies}
            >
              ✏️ Modifier cette espèce
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleAddPlant}
            >
              ➕ Ajouter une plantation
            </button>
          </div>
        </div>
      </section>

      {/* Pop-up / lightbox pour photo en taille réelle */}
      {isLightboxOpen && hasPhotos && (
        <div className="photo-lightbox-backdrop" onClick={closeLightbox}>
          <div
            className="photo-lightbox"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="photo-lightbox-close"
              onClick={closeLightbox}
            >
              ✕
            </button>
            <img
              src={photos[safePhotoIndex]}
              alt={species.common_name || "Photo espèce agrandie"}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeciesDetailPage;
