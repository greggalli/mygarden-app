import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import gardenPlan from "../assets/garden-plan.png";
import { useGardenData } from "../data/GardenDataContext";

export default function GardenOverviewMap() {
  const navigate = useNavigate();
  const { data } = useGardenData();
  const { zones, instances, species } = data;

  const [hoverZoneId, setHoverZoneId] = useState(null);

  const countPlantsInZone = (zoneId) =>
    instances.filter((inst) => inst.zone_id === zoneId).length;

  const hoveredZone = hoverZoneId
    ? zones.find((z) => z.id === hoverZoneId)
    : null;

  return (
    <div className="garden-overview-card">
      <div className="garden-map-stage">
        <img
          src={gardenPlan}
          alt="Plan général du jardin"
          className="garden-map-image"
        />

        {zones.filter((zone) => zone?.bbox).map((zone) => (
          <div
            key={zone.id}
            className={
              "zone-overlay-abs " +
              (hoverZoneId === zone.id ? "zone-overlay-abs-hover" : "")
            }
            style={{
              left: `${zone.bbox.x_pct}%`,
              top: `${zone.bbox.y_pct}%`,
              width: `${zone.bbox.w_pct}%`,
              height: `${zone.bbox.h_pct}%`,
              borderColor: zone.color,
              backgroundColor: hexToRgba(zone.color, 0.4)
            }}
            onMouseEnter={() => setHoverZoneId(zone.id)}
            onMouseLeave={() => setHoverZoneId(null)}
            onClick={() => navigate(`/zones/${zone.id}`)}
          >
            <div className="zone-overlay-label">
              <div className="zone-overlay-name">{zone.name}</div>
              <div className="zone-overlay-count">
                {countPlantsInZone(zone.id)} plante
                {countPlantsInZone(zone.id) > 1 ? "s" : ""}
              </div>
            </div>
          </div>
        ))}

        {instances.map((plantInstance) => {
          const sp = species.find((s) => s.id === plantInstance.species_id);
          return (
            <button
              key={plantInstance.id}
              className="garden-plant-pin"
              style={{
                left: `${plantInstance.position.x_pct}%`,
                top: `${plantInstance.position.y_pct}%`
              }}
              title={
                sp
                  ? `${plantInstance.nickname} (${sp.common_name})`
                  : plantInstance.nickname
              }
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/plants/${plantInstance.id}`);
              }}
            >
              🌱
            </button>
          );
        })}

        {hoveredZone?.bbox && (
          <div
            className="zone-hover-tooltip"
            style={{
              left: `calc(${hoveredZone.bbox.x_pct}% + ${
                hoveredZone.bbox.w_pct / 2
              }%)`,
              top: `${hoveredZone.bbox.y_pct}%`
            }}
          >
            <div className="tooltip-name">{hoveredZone.name}</div>
            <div className="tooltip-coords">
              {formatCoords(hoveredZone.shape)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function hexToRgba(hex, alpha) {
  if (!hex || typeof hex !== "string" || hex[0] !== "#" || hex.length < 7) {
    return `rgba(100,100,100,${alpha})`;
  }
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, alpha)`.replace("alpha", alpha);
}

function formatCoords(shapeArray) {
  if (!shapeArray || !shapeArray.length) return "coords: n/a";
  return shapeArray
    .map((pt) => `(${pt.x_pct}%, ${pt.y_pct}%)`)
    .join(" • ");
}
