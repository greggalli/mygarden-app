// src/pages/PlantDetailPage.jsx
import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useGardenData } from "../data/GardenDataContext";

const PlantDetailPage = () => {
  const { plantId } = useParams();
  const navigate = useNavigate();
  const { data } = useGardenData();

  const numericPlantId = Number(plantId);

  const instances = data?.instances || [];
  const speciesList = data?.species || [];
  const zonesList = data?.zones || [];

  const instance =
    instances.find((inst) => inst && inst.id === numericPlantId) || null;

  // Early return si introuvable (hooks au-dessus -> OK)
  if (!instance) {
    return (
      <div className="species-detail-page plant-detail-page">
        <div className="plant-detail-header">
          <Link to="/plants" className="back-link">
            ← Retour à la liste des plantations
          </Link>
        </div>
        <h2 className="detail-title">Plantation introuvable</h2>
        <p className="muted">Aucune plantation ne correspond à cet identifiant.</p>
      </div>
    );
  }

  // Maps
  const speciesById = new Map(speciesList.map((s) => [s.id, s]));
  const zoneById = new Map(zonesList.map((z) => [z.id, z]));

  const species = speciesById.get(instance.species_id) || null;
  const zone = zoneById.get(instance.zone_id) || null;

  // Autres plantations de la même espèce (hors courante)
  const otherInstancesSameSpecies = instances.filter(
    (inst) =>
      inst &&
      inst.id !== instance.id &&
      inst.species_id === instance.species_id
  );

  // Données “botaniques” héritées de l’espèce
  const speciesPhotos = Array.isArray(species?.photos) ? species.photos : [];
  const externalLinks = Array.isArray(species?.external_links)
    ? species.external_links
    : [];

  const handleEditPlant = () => navigate(`/plants/${numericPlantId}/edit`);
  const handleOpenSpecies = () => species && navigate(`/species/${species.id}`);
  const handleOpenOtherInstance = (id) => navigate(`/plants/${id}`);

  return (
    <div className="species-detail-page plant-detail-page">
      {/* Header : retour */}
      <div className="plant-detail-header">
        <Link to="/plants" className="back-link">
          ← Retour à la liste des plantations
        </Link>
      </div>

      {/* Titre principal : nickname de la plantation */}
      <header className="species-detail-title-block">
        <h2 className="detail-title">
          {instance.nickname || "Plantation sans surnom"}
        </h2>
        <p className="detail-subtitle plant-detail-sub">
          {species ? species.common_name || "Espèce sans nom" : "Espèce inconnue"}
          {species?.scientific_name && (
            <span className="plant-detail-sci"> · {species.scientific_name}</span>
          )}
        </p>
      </header>

      {/* === PARTIE 1 : BOTANIQUE (tirée de l'espèce liée) === */}
      <section className="species-detail-section species-botanic-section">
        <div className="section-header">
          <h3>Fiche botanique</h3>
        </div>

        <div className="species-botanic-grid species-detail-card">
          {/* Photos de l'espèce */}
          {speciesPhotos.length > 0 && (
            <div className="species-photo-block">
              <div className="species-photo-grid">
                {speciesPhotos.slice(0, 3).map((url, index) => (
                  <div
                    key={index}
                    className={
                      index === 0
                        ? "species-photo-item species-photo-main"
                        : "species-photo-item species-photo-thumb"
                    }
                  >
                    <img
                      src={url}
                      alt={
                        species?.common_name ||
                        species?.scientific_name ||
                        "Photo espèce"
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Infos botanique & liens */}
          <div className="species-botanic-links">
            <h4>Données espèce</h4>
            <dl className="species-detail-attributes">
              <div className="species-detail-attribute-row">
                <dt>Nom scientifique</dt>
                <dd>
                  {species?.scientific_name ? (
                    species.scientific_name
                  ) : (
                    <span className="muted">Non renseigné</span>
                  )}
                </dd>
              </div>
              <div className="species-detail-attribute-row">
                <dt>Famille</dt>
                <dd>
                  {species?.family ? (
                    species.family
                  ) : (
                    <span className="muted">Non renseignée</span>
                  )}
                </dd>
              </div>
            </dl>

            <h4>Liens utiles</h4>
            {externalLinks.length === 0 ? (
              <p className="muted">Aucun lien renseigné pour cette espèce.</p>
            ) : (
              <ul className="species-link-list">
                {externalLinks.map((link, idx) => (
                  <li key={idx} className="species-link-item">
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      {link.label || link.url}
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {species && (
              <div className="species-detail-actions plant-botanic-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleOpenSpecies}
                >
                  🔍 Voir la fiche espèce
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* === PARTIE 2 : DANS LE JARDIN (spécifique à cette plantation) === */}
      <section className="species-detail-section species-garden-section">
        <div className="section-header">
          <h3>Dans le jardin</h3>
        </div>

        <div className="species-detail-layout">
          {/* Colonne gauche : infos de la plantation */}
          <section className="species-detail-main">
            <div className="species-detail-card">
              <div className="section-header">
                <h4>Informations</h4>
              </div>
              <dl className="species-detail-attributes">
                <div className="species-detail-attribute-row">
                  <dt>Zone</dt>
                  <dd>{zone ? zone.name : <span className="muted">Inconnue</span>}</dd>
                </div>
                <div className="species-detail-attribute-row">
                  <dt>Date de plantation</dt>
                  <dd>
                    {instance.planting_date ? (
                      instance.planting_date
                    ) : (
                      <span className="muted">Non renseignée</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="species-detail-card">
              <div className="section-header">
                <h4>Notes de cette plantation</h4>
              </div>
              {instance.notes ? (
                <p>{instance.notes}</p>
              ) : (
                <p className="muted">Aucune note pour l’instant.</p>
              )}
            </div>
          </section>

          {/* Colonne droite : actions & raccourcis */}
          <aside className="species-detail-side">
            <section className="species-detail-section species-detail-card">
              <div className="section-header">
                <h4>Actions</h4>
              </div>
              <div className="species-detail-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleEditPlant}
                >
                  ✏️ Modifier cette plantation
                </button>
                {species && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleOpenSpecies}
                  >
                    🔍 Voir la fiche espèce
                  </button>
                )}
              </div>
            </section>
          </aside>
        </div>
      </section>

      {/* === PARTIE 3 : AUTRES PLANTATIONS DE LA MÊME ESPÈCE === */}
      <section className="species-detail-section plant-detail-other-instances">
        <div className="section-header section-header-inline">
          <h3>Autres plantations de la même espèce</h3>
          {otherInstancesSameSpecies.length > 0 && (
            <span className="muted small">
              {otherInstancesSameSpecies.length} résultat
              {otherInstancesSameSpecies.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {otherInstancesSameSpecies.length === 0 ? (
          <p className="muted">Aucune autre plantation de cette espèce.</p>
        ) : (
          <div className="instance-list">
            {otherInstancesSameSpecies.map((inst) => {
              const instZone =
                inst.zone_id != null ? zoneById.get(inst.zone_id) : null;

              return (
                <button
                  key={inst.id}
                  type="button"
                  className="instance-row"
                  onClick={() => handleOpenOtherInstance(inst.id)}
                >
                  <div className="instance-row-main">
                    <div className="instance-title">
                      {inst.nickname || "Sans surnom"}
                    </div>
                    <div className="instance-meta">
                      <span className="instance-zone">
                        {instZone?.name || "Zone inconnue"}
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
      </section>
    </div>
  );
};

export default PlantDetailPage;
