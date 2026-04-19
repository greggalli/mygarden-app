// src/pages/ZoneDetailPage.jsx
import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useGardenData } from "../data/GardenDataContext";
import ZoneMiniMap from "../components/ZoneMiniMap";

export default function ZoneDetailPage() {
  const { zoneId } = useParams();
  const navigate = useNavigate();
  const { data } = useGardenData();
  const { zones, instances, species } = data;

  const zone = zones.find((z) => z.id === Number(zoneId));
  const plantsInZone = instances.filter(
    (inst) => inst.zone_id === Number(zoneId)
  );

  if (!zone) {
    return (
      <div className="plant-detail-page">
        <p>Zone introuvable.</p>
        <Link to="/zones" className="back-link">
          ← Retour au jardin
        </Link>
      </div>
    );
  }

  return (
    <div className="zone-page-2col">
      {/* Colonne gauche : vue zoomée + infos zone */}
      <div className="zone-left-col">
        <h2 className="section-title">{zone.name}</h2>

        {/* Carte zoomée de la zone avec pins */}
        <ZoneMiniMap zoneId={zoneId} />

        {/* Infos de la zone */}
        <div className="zone-infos-card">
          <div className="zone-infos-row">
            <div className="zone-infos-label">Description</div>
            <div className="zone-infos-value">
              {zone.description || "—"}
            </div>
          </div>

          <div className="zone-infos-row">
            <div className="zone-infos-label">Nombre de plantes</div>
            <div className="zone-infos-value">
              {plantsInZone.length} plante
              {plantsInZone.length > 1 ? "s" : ""}
            </div>
          </div>

          <div className="zone-infos-row">
            <div className="zone-infos-label">Coordonnées (shape)</div>
            <div className="zone-infos-coords">
              {zone.shape && zone.shape.length
                ? zone.shape
                    .map(
                      (pt) => `(${pt.x_pct}%, ${pt.y_pct}%)`
                    )
                    .join(" • ")
                : "n/a"}
            </div>
          </div>
        </div>

        <Link to="/zones" className="back-link">
          ← Retour au jardin
        </Link>
      </div>

      {/* Colonne droite : plantes de la zone */}
      <div className="zone-right-col">
        <h2 className="section-title">Plantes dans cette zone</h2>

        {plantsInZone.length === 0 ? (
          <div className="zone-detail-empty">
            Aucune plante enregistrée dans cette zone pour l’instant.
          </div>
        ) : (
          <div className="plants-grid">
            {plantsInZone.map((inst) => {
              const sp = species.find(
                (s) => s.id === inst.species_id
              );

              return (
                <article
                  key={inst.id}
                  className="plant-card plant-card-clickable"
                  onClick={() => navigate(`/plants/${inst.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/plants/${inst.id}`);
                    }
                  }}
                  tabIndex={0}
                >
                  <div className="plant-photo">
                    {sp?.photo_url ? (
                      <img
                        src={sp.photo_url}
                        alt={sp.common_name}
                      />
                    ) : (
                      <div className="plant-photo-placeholder">
                        🌱
                      </div>
                    )}
                  </div>

                  <div className="plant-info">
                    <h4>{inst.nickname}</h4>
                    <p>
                      {sp && (
                        <>
                          <b>{sp.common_name}</b>
                          {sp.scientific_name && (
                            <> – <i>{sp.scientific_name}</i></>
                          )}
                          <br />
                        </>
                      )}
                      {inst.planting_date && (
                        <>
                          Plantée le {inst.planting_date}
                          <br />
                        </>
                      )}
                      {inst.notes && (
                        <span>{inst.notes}</span>
                      )}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
