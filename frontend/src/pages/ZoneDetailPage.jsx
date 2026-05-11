import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useGardenData } from "../data/GardenDataContext";
import ZoneMiniMap from "../components/ZoneMiniMap";
import HoverPreviewImage from "../components/HoverPreviewImage";

export default function ZoneDetailPage() {
  const { zoneId } = useParams();
  const navigate = useNavigate();
  const { data, isDataReady } = useGardenData();
  const { zones, instances, species } = data;
  const [isRotated, setIsRotated] = useState(false);
  const [hoveredPlantId, setHoveredPlantId] = useState(null);
  const [isPlantsListCollapsed, setIsPlantsListCollapsed] = useState(false);

  const routeZoneId = String(zoneId ?? "").trim();

  if (!routeZoneId) {
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

  const zone = zones.find((z) => String(z.id) === routeZoneId);
  const plantsInZone = instances.filter((inst) => String(inst.zone_id) === routeZoneId);

  if (import.meta.env.DEV) {
    console.debug("[ZoneDetailPage] lookup", {
      routeZoneId,
      availableZoneIds: zones.map((z) => z.id),
      matchedZoneId: zone?.id ?? null,
      isDataReady,
      zonesCount: zones.length,
      instancesCount: instances.length
    });
  }

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
        <div className="plants-title-row zone-header-row">
          <div className="zone-title-line">
            <h2 className="section-title">{zone.name}</h2>
            {zone.description ? <p className="zone-header-description">{zone.description}</p> : null}
          </div>
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

        <ZoneMiniMap zoneId={zone.id} rotated={isRotated} highlightedPlantId={hoveredPlantId} />
      </div>

      <div className={`zone-right-col ${isPlantsListCollapsed ? "zone-right-col-collapsed" : ""}`}>
        <div className="plants-title-row">
          <h2 className="section-title">
            <span className="zone-plants-heading">{isPlantsListCollapsed ? "Plantations" : "Plantations dans la zone"} ({plantsInZone.length})</span>
          </h2>
          <button
            type="button"
            className="icon-btn plants-collapse-toggle"
            aria-label={isPlantsListCollapsed ? "Afficher les détails des plantations" : "Réduire la liste des plantations"}
            title={isPlantsListCollapsed ? "Afficher les détails des plantations" : "Réduire la liste des plantations"}
            onClick={() => setIsPlantsListCollapsed((value) => !value)}
          >
            <span aria-hidden="true">{isPlantsListCollapsed ? "⤢" : "⌃"}</span>
          </button>
        </div>
        {plantsInZone.length === 0 ? (
          <div className="zone-detail-empty">Aucune plantation dans cette zone.</div>
        ) : (
          <div className={`plants-grid plants-grid-single-col ${isPlantsListCollapsed ? "plants-grid-collapsed" : ""}`}>
            {plantsInZone.map((inst) => {
              const sp = species.find((s) => s.id === inst.species_id);
              return (
                <article
                  key={inst.id}
                  className={`plant-card plant-card-clickable ${isPlantsListCollapsed ? "plant-card-collapsed" : ""}`}
                  onMouseEnter={() => setHoveredPlantId(inst.id)}
                  onMouseLeave={() => setHoveredPlantId(null)}
                  onClick={() => navigate(`/plants/${inst.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/plants/${inst.id}`);
                    }
                  }}
                  tabIndex={0}
                >
                  {sp?.photos?.[0] ? (
                    <HoverPreviewImage
                      src={sp.photos[0]}
                      alt={sp?.common_name || inst.nickname}
                      className="instance-row-thumb species-thumb-hover-wrap"
                      previewClassName="thumb-hover-preview"
                    />
                  ) : (
                    <div className="instance-row-thumb instance-row-thumb-fallback" aria-hidden="true">🌿</div>
                  )}
                  {!isPlantsListCollapsed && (
                    <div className="plant-info">
                      <h4>{inst.nickname}</h4>
                      <p>
                        {sp?.common_name || "Espèce inconnue"}
                        {inst.planting_date ? ` • ${inst.planting_date}` : ""}
                      </p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <Link to="/zones" className="back-link">← Retour aux zones</Link>
      </div>
    </div>
  );
}
