import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useGardenData } from "../data/GardenDataContext";
import ImageLightbox from "../components/ImageLightbox";

const PlantDetailPage = () => {
  const { plantId } = useParams();
  const navigate = useNavigate();
  const { data } = useGardenData();

  const numericPlantId = Number(plantId);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const instances = data?.instances || [];
  const speciesList = data?.species || [];
  const zonesList = data?.zones || [];

  const instance = instances.find((inst) => inst?.id === numericPlantId) || null;

  if (!instance) {
    return (
      <div className="species-detail-page plant-detail-page">
        <div className="plant-detail-header">
          <Link to="/plants" className="back-link">← Retour à la liste des plantations</Link>
        </div>
        <h2 className="detail-title">Plantation introuvable</h2>
      </div>
    );
  }

  const species = speciesList.find((item) => item.id === instance.species_id) || null;
  const zone = zonesList.find((item) => item.id === instance.zone_id) || null;
  const zoneById = new Map(zonesList.map((item) => [item.id, item]));

  const otherInstancesSameSpecies = instances.filter((item) => (
    item?.id !== instance.id && item?.species_id === instance.species_id
  ));

  const photos = Array.isArray(species?.photos) ? species.photos : [];
  const hasMultiplePhotos = photos.length > 1;
  const safePhotoIndex = photos.length > 0 ? Math.min(photoIndex, photos.length - 1) : 0;

  return (
    <>
      <div className="species-detail-page plant-detail-page">
        <div className="plant-detail-header">
          <Link to="/plants" className="back-link">← Retour à la liste des plantations</Link>
        </div>

        <header className="species-detail-title-block">
          <h2 className="detail-title">{instance.nickname || "Plantation sans surnom"}</h2>
          <p className="detail-subtitle plant-detail-sub">
            {species?.common_name || "Espèce inconnue"}
            {species?.scientific_name ? <span className="plant-detail-sci"> · {species.scientific_name}</span> : null}
          </p>
        </header>

        <section className="species-detail-section">
          <div className="species-detail-card">
            <div className="section-header"><h3>Information sur l'espèce</h3></div>
            {photos.length > 0 ? (
              <div className="species-photo-carousel">
                <button type="button" className="species-photo-main" onClick={() => setIsLightboxOpen(true)}>
                  <img src={photos[safePhotoIndex]} alt={species?.common_name || "Photo espèce"} />
                </button>
                {hasMultiplePhotos && (
                  <div className="species-photo-thumbs">
                    {photos.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={"species-photo-thumb" + (idx === safePhotoIndex ? " is-active" : "")}
                        onClick={() => setPhotoIndex(idx)}
                      >
                        <img src={url} alt="Miniature" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : <p className="muted">Aucune photo pour cette espèce.</p>}

            {species && (
              <div className="species-detail-actions">
                <Link to={`/species/${species.id}`} className="btn-secondary">Voir la fiche de l'espèce</Link>
              </div>
            )}
          </div>
        </section>

        <section className="species-detail-section">
          <div className="species-detail-card">
            <div className="section-header"><h3>Dans le jardin</h3></div>
            <dl className="species-detail-attributes">
              <div className="species-detail-attribute-row">
                <dt>Zone</dt>
                <dd>{zone ? <Link to={`/zones/${zone.id}`}>{zone.name}</Link> : <span className="muted">Inconnue</span>}</dd>
              </div>
              <div className="species-detail-attribute-row">
                <dt>Coordonnées</dt>
                <dd>{instance.position?.coordinates ? `[${instance.position.coordinates[0]}, ${instance.position.coordinates[1]}]` : <span className="muted">Non renseignées</span>}</dd>
              </div>
              <div className="species-detail-attribute-row">
                <dt>Date de plantation</dt>
                <dd>{instance.planting_date || <span className="muted">Non renseignée</span>}</dd>
              </div>
            </dl>

            <h4>Autres plantations de la même espèce</h4>
            {otherInstancesSameSpecies.length === 0 ? (
              <p className="muted">Aucune autre plantation de cette espèce dans le jardin.</p>
            ) : (
              <ul className="species-link-list">
                {otherInstancesSameSpecies.map((item) => (
                  <li key={item.id} className="species-link-item">
                    <Link to={`/plants/${item.id}`}>{item.nickname || `Plantation #${item.id}`}</Link>
                    {zoneById.get(item.zone_id)?.name ? ` — ${zoneById.get(item.zone_id).name}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="species-detail-section">
          <div className="species-detail-card">
            <div className="section-header"><h3>Notes de cette plantation</h3></div>
            <p>{instance.notes || "Aucune note pour cette plantation."}</p>

            <div className="species-detail-actions">
              <button type="button" className="btn-secondary" onClick={() => navigate(`/plants/${numericPlantId}/edit`)}>Modifier</button>
              <Link to="/plants" className="btn-secondary">Retour</Link>
            </div>
          </div>
        </section>
      </div>

      <ImageLightbox
        isOpen={isLightboxOpen && photos.length > 0}
        images={photos}
        activeIndex={safePhotoIndex}
        onClose={() => setIsLightboxOpen(false)}
        onPrevious={() => setPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))}
        onNext={() => setPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))}
        altBase={species?.common_name || "Photo espèce"}
      />
    </>
  );
};

export default PlantDetailPage;
