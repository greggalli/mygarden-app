// src/components/ZoneMiniMap.jsx
import React, { useMemo, useState } from "react";
import { useGardenData } from "../data/GardenDataContext";

export default function ZoneMiniMap({ zoneId, rotated = false }) {
  const { data } = useGardenData();
  const { zones, instances, species } = data;
  const zoneKey = String(zoneId);
  const zone = zones.find((z) => String(z.id) === zoneKey);
  const plantsInZone = instances.filter((inst) => String(inst.zone_id) === zoneKey);
  const [hoverState, setHoverState] = useState(null);

  const zoneBounds = useMemo(() => {
    if (!zone?.bbox) return null;
    const { x_pct, y_pct, w_pct, h_pct } = zone.bbox;
    return {
      minX: x_pct,
      maxX: x_pct + w_pct,
      minY: y_pct,
      maxY: y_pct + h_pct,
      w_pct,
      h_pct
    };
  }, [zone]);

  if (!zone || !zoneBounds) {
    return (
      <div className="zone-minimap-card">
        <div className="zone-minimap-inner zone-minimap-error">Zone introuvable</div>
      </div>
    );
  }

  function toRelativePosition(plantPos) {
    const relX = ((plantPos.x_pct - zoneBounds.minX) / zoneBounds.w_pct) * 100;
    const relY = ((plantPos.y_pct - zoneBounds.minY) / zoneBounds.h_pct) * 100;
    return { x_pct: relX, y_pct: relY };
  }

  function toDisplayPoint(relX, relY) {
    if (!rotated) return { x: relX, y: relY };
    return { x: 100 - relY, y: relX };
  }

  function toGlobalCoordinates(relX, relY) {
    return {
      x_pct: zoneBounds.minX + (relX / 100) * zoneBounds.w_pct,
      y_pct: zoneBounds.minY + (relY / 100) * zoneBounds.h_pct
    };
  }

  function displayToRelative(displayX, displayY) {
    if (!rotated) return { x: displayX, y: displayY };
    return { x: displayY, y: 100 - displayX };
  }

  function formatCoords(coords) {
    return `(${coords.x_pct.toFixed(1)}%, ${coords.y_pct.toFixed(1)}%)`;
  }

  function handleMapHover(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const displayX = ((event.clientX - rect.left) / rect.width) * 100;
    const displayY = ((event.clientY - rect.top) / rect.height) * 100;
    const relative = displayToRelative(displayX, displayY);
    const globalCoords = toGlobalCoordinates(relative.x, relative.y);

    setHoverState({
      type: "coords",
      left: displayX,
      top: displayY,
      label: formatCoords(globalCoords)
    });
  }

  return (
    <div className="zone-minimap-card">
      <div
        className="zone-minimap-area zone-minimap-area-only"
        onMouseMove={handleMapHover}
        onMouseLeave={() => setHoverState(null)}
      >
        {plantsInZone.map((plantInstance) => {
          const sp = species.find((s) => s.id === plantInstance.species_id);
          const rel = toRelativePosition(plantInstance.position);
          const display = toDisplayPoint(rel.x_pct, rel.y_pct);

          return (
            <button
              key={plantInstance.id}
              type="button"
              className="zone-minimap-pin"
              style={{
                left: `${display.x}%`,
                top: `${display.y}%`
              }}
              onMouseEnter={() => {
                setHoverState({
                  type: "plant",
                  left: display.x,
                  top: display.y,
                  label: `${plantInstance.nickname || sp?.common_name || "Plante"} ${formatCoords(plantInstance.position)}`
                });
              }}
              onMouseLeave={() => setHoverState(null)}
            >
              🌱
            </button>
          );
        })}

        {hoverState ? (
          <div
            className={`zone-minimap-tooltip ${hoverState.type === "coords" ? "zone-minimap-tooltip-small" : ""}`}
            style={{ left: `${hoverState.left}%`, top: `${hoverState.top}%` }}
          >
            {hoverState.label}
          </div>
        ) : null}
      </div>
    </div>
  );
}
