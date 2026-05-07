import React, { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useGardenData } from "../data/GardenDataContext";
import GardenMapCanvas from "../components/GardenMapCanvas";
import HoverPreviewImage from "../components/HoverPreviewImage";

export default function ZoneDetailPage() {
  const { zoneId } = useParams();
  const navigate = useNavigate();
  const { data, isDataReady } = useGardenData();
  const { zones, instances, species } = data;
  const [hoveredPlantId, setHoveredPlantId] = useState(null);
  const [hoverPoint, setHoverPoint] = useState(null);
  const [mapMessage, setMapMessage] = useState("");

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


  const plantationsForMap = useMemo(() => plantsInZone.map((inst) => {
    const sp = species.find((item) => item.id === inst.species_id);
    return { ...inst, species_name: sp?.common_name, species_photo: sp?.photos?.[0], zone_name: zone?.name };
  }), [plantsInZone, species, zone?.name]);
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
          <h2 className="section-title">{zone.name}</h2>
          
        </div>

        <p className="zone-header-description">{zone.description || "—"}</p>

        <div className="garden-map-card">
          <GardenMapCanvas
            gardenMap={data.gardenMap}
            zones={[zone]}
            plantations={plantationsForMap}
            mode="zone-detail"
            selectedZoneId={zone.id}
            fitToZoneId={zone.id}
            onMapHover={setHoverPoint}
            onPlantationClick={(p) => navigate(`/plants/${p.id}`)}
            onMapClick={(point, clickedZone) => {
              if (!clickedZone) {
                setMapMessage("Sélectionnez un point à l'intérieur de la zone pour créer une plantation.");
                return;
              }
              const [x, y] = point;
              navigate(`/add-plant?zoneId=${clickedZone.id}&x=${x.toFixed(1)}&y=${y.toFixed(1)}`);
            }}
          />
        </div>
        <div className="garden-map-coords">{hoverPoint ? `Coordonnées : X: ${hoverPoint[0].toFixed(1)}, Y: ${hoverPoint[1].toFixed(1)}` : "Coordonnées : —"}</div>
        {mapMessage ? <div className="garden-map-msg">{mapMessage}</div> : null}
      </div>

      <div className="zone-right-col">
        <h2 className="section-title">Plantations dans la zone ({plantsInZone.length})</h2>
        {plantsInZone.length === 0 ? (
          <div className="zone-detail-empty">Aucune plantation dans cette zone.</div>
        ) : (
          <div className="plants-grid plants-grid-single-col">
            {plantsInZone.map((inst) => {
              const sp = species.find((s) => s.id === inst.species_id);
              return (
                <article
                  key={inst.id}
                  className="plant-card plant-card-clickable"
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
                      className="plant-photo"
                      previewClassName="plant-photo-preview"
                    />
                  ) : (
                    <div className="plant-photo instance-row-thumb-fallback" aria-hidden="true">🌿</div>
                  )}
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
    </div>
  );
}
