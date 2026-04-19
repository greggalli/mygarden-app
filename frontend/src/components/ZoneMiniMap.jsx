// src/components/ZoneMiniMap.jsx
import React from "react";
import { useGardenData } from "../data/GardenDataContext";

export default function ZoneMiniMap({ zoneId }) {
  const { data } = useGardenData();
  const { zones, instances, species } = data;
  const zone = zones.find((z) => z.id === Number(zoneId));
  const plantsInZone = instances.filter(
    (inst) => inst.zone_id === Number(zoneId)
  );

  if (!zone) {
    return (
      <div className="zone-minimap-card">
        <div className="zone-minimap-inner zone-minimap-error">
          Zone introuvable
        </div>
      </div>
    );
  }

  // on va utiliser la bbox pour la taille et les coordonnées relatives
  const { bbox, color } = zone;

  // util : convertit coord globale plante -> coord relative dans la zone
  function toRelativePosition(plantPos) {
    const relX =
      ((plantPos.x_pct - bbox.x_pct) / bbox.w_pct) * 100;
    const relY =
      ((plantPos.y_pct - bbox.y_pct) / bbox.h_pct) * 100;
    return { x_pct: relX, y_pct: relY };
  }

  return (
    <div className="zone-minimap-card">
      <div
        className="zone-minimap-area"
        style={{
          // On fixe un ratio visuel constant (ex: 300x200),
          // mais le contenu interne se base sur % relatifs
          backgroundColor: hexToRgba(color, 0.15),
          borderColor: color
        }}
      >
        {/* Etiquette zone */}
        <div className="zone-minimap-header-chip">
          <div className="zone-minimap-name">{zone.name}</div>
          <div className="zone-minimap-count">
            {plantsInZone.length} plante
            {plantsInZone.length > 1 ? "s" : ""}
          </div>
        </div>

        {/* Pins des plantes dans CETTE zone, positionnées en relatif */}
        {plantsInZone.map((plantInstance) => {
          const sp = species.find(
            (s) => s.id === plantInstance.species_id
          );
          const rel = toRelativePosition(plantInstance.position);

          return (
            <div
              key={plantInstance.id}
              className="zone-minimap-pin"
              style={{
                left: `${rel.x_pct}%`,
                top: `${rel.y_pct}%`
              }}
              title={
                sp
                  ? `${plantInstance.nickname} (${sp.common_name})`
                  : plantInstance.nickname
              }
            >
              🌱
            </div>
          );
        })}
      </div>
    </div>
  );
}

// simple util déjà utilisée ailleurs
function hexToRgba(hex, alpha) {
  if (!hex || typeof hex !== "string" || hex[0] !== "#" || hex.length < 7) {
    return `rgba(100,100,100,${alpha})`;
  }
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
