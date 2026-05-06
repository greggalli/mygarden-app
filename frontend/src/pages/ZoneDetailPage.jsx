import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useGardenData } from "../data/GardenDataContext";
import ZoneMiniMap from "../components/ZoneMiniMap";

export default function ZoneDetailPage() {
  const { zoneId } = useParams();
  const navigate = useNavigate();
  const { data, isDataReady } = useGardenData();
  const { zones, instances, species } = data;
  const [isRotated, setIsRotated] = useState(false);

  const numericZoneId = Number(zoneId);

  if (!Number.isFinite(numericZoneId)) {
    return (
      <div className="plant-detail-page">
        <p>Zone introuvable.</p>
        <Link to="/zones" className="back-link">← Retour aux zones</Link>
      </div>
    );
  }

  if (!isDataReady) {
    return (
      <div className="plant-detail-page">
        <p>Chargement de la zone...</p>
        <Link to="/zones" className="back-link">← Retour aux zones</Link>
      </div>
    );
  }

  const zone = zones.find((z) => z.id === numericZoneId);
  const plantsInZone = instances.filter((inst) => inst.zone_id === numericZoneId);

  if (!zone) {
    return (
      <div className="plant-detail-page">
        <p>Zone introuvable.</p>
        <Link to="/zones" className="back-link">← Retour aux zones</Link>
      </div>
    );
  }

  return (
    <div className="zone-page-2col">
      <div className="zone-left-col">
        <div className="plants-title-row">
          <h2 className="section-title">{zone.name}</h2>
          <div className="zone-title-actions">
            <button
              type="button"
              className="icon-btn"
              title="Tourner la carte de 90° vers la droite"
              aria-label="Tourner la carte de 90° vers la droite"
              onClick={() => setIsRotated((value) => !value)}
            >
              ↻90°
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate(`/zones/${zone.id}/edit`)}>
              Modifier
            </button>
          </div>
        </div>

        <div className="zone-infos-card">
          <div className="zone-infos-row">
            <div className="zone-infos-label">Description</div>
            <div className="zone-infos-value">{zone.description || "—"}</div>
          </div>

          <div className="zone-infos-row">
            <div className="zone-infos-label">Nombre de plantations</div>
            <div className="zone-infos-value">{plantsInZone.length}</div>
          </div>
        </div>

        <h2 className="section-title">Plantations dans la zone ({plantsInZone.length})</h2>
        {plantsInZone.length === 0 ? (
          <div className="zone-detail-empty">Aucune plantation dans cette zone.</div>
        ) : (
          <div className="plants-grid">
            {plantsInZone.map((inst) => {
              const sp = species.find((s) => s.id === inst.species_id);
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
                  <div className="plant-info">
                    <h4>{inst.nickname}</h4>
                    <p>
                      {sp?.common_name || "Espèce inconnue"}
                      {inst.planting_date ? ` • ${inst.planting_date}` : ""}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <Link to="/zones" className="back-link">← Retour aux zones</Link>
      </div>

      <div className="zone-right-col">
        <ZoneMiniMap zoneId={zone.id} rotated={isRotated} />
      </div>
    </div>
  );
}
