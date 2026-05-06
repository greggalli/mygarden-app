// src/components/ZoneMiniMap.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGardenData } from "../data/GardenDataContext";

function getZoneBounds(zone) {
  const ring = zone?.geometry?.coordinates?.[0];
  if (Array.isArray(ring) && ring.length > 0) {
    const xs = ring.map((pt) => pt?.[0]).filter(Number.isFinite);
    const ys = ring.map((pt) => pt?.[1]).filter(Number.isFinite);
    if (xs.length && ys.length) {
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      return { minX, maxX, minY, maxY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
    }
  }

  if (zone?.bbox) {
    const { x_pct, y_pct, w_pct, h_pct } = zone.bbox;
    return { minX: x_pct, maxX: x_pct + w_pct, minY: y_pct, maxY: y_pct + h_pct, width: w_pct, height: h_pct };
  }

  return null;
}

export default function ZoneMiniMap({ zoneId, rotated = false, highlightedPlantId = null }) {
  const navigate = useNavigate();
  const { data } = useGardenData();
  const { zones, instances, species } = data;
  const zoneKey = String(zoneId);
  const zone = zones.find((z) => String(z.id) === zoneKey);
  const plantsInZone = instances.filter((inst) => String(inst.zone_id) === zoneKey);
  const [hoverState, setHoverState] = useState(null);

  const zoneBounds = useMemo(() => getZoneBounds(zone), [zone]);

  if (!zone || !zoneBounds) {
    return (
      <div className="zone-minimap-card">
        <div className="zone-minimap-inner zone-minimap-error">Zone introuvable</div>
      </div>
    );
  }

  function toRelativePosition(plantPos) {
    const [x, y] = Array.isArray(plantPos?.coordinates)
      ? plantPos.coordinates
      : [plantPos?.x_pct, plantPos?.y_pct];
    const relX = ((x - zoneBounds.minX) / zoneBounds.width) * 100;
    const relY = ((y - zoneBounds.minY) / zoneBounds.height) * 100;
    return { x_pct: relX, y_pct: relY };
  }

  function toGlobalCoordinates(relX, relY) {
    return {
      x: zoneBounds.minX + (relX / 100) * zoneBounds.width,
      y: zoneBounds.minY + (relY / 100) * zoneBounds.height
    };
  }

  function displayToRelative(displayX, displayY) {
    if (!rotated) return { x: displayX, y: displayY };
    const centeredX = displayX - 50;
    const centeredY = displayY - 50;
    return { x: centeredY + 50, y: 50 - centeredX };
  }

  function formatCoords(coords) {
    return `(${coords.x.toFixed(2)}, ${coords.y.toFixed(2)})`;
  }

  function handleMapHover(event) {
    if (event.target.closest(".zone-minimap-pin")) return;
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

  function handleMapClick(event) {
    if (event.target.closest(".zone-minimap-pin")) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const displayX = ((event.clientX - rect.left) / rect.width) * 100;
    const displayY = ((event.clientY - rect.top) / rect.height) * 100;
    const relative = displayToRelative(displayX, displayY);
    const globalCoords = toGlobalCoordinates(relative.x, relative.y);
    const shouldCreate = window.confirm("Créer une nouvelle plantation ?");
    if (!shouldCreate) return;
    const params = new URLSearchParams({ zone_id: String(zone.id), x: globalCoords.x.toFixed(2), y: globalCoords.y.toFixed(2) });
    navigate(`/add-plant?${params.toString()}`);
  }

  return (
    <div className="zone-minimap-card">
      <div
        className={`zone-minimap-area zone-minimap-area-only ${rotated ? "zone-minimap-area-rotated" : ""}`}
        onMouseMove={handleMapHover}
        onMouseLeave={() => setHoverState(null)}
        onClick={handleMapClick}
      >
        {plantsInZone.map((plantInstance) => {
          const sp = species.find((s) => s.id === plantInstance.species_id);
          const rel = toRelativePosition(plantInstance.position);

          return (
            <button
              key={plantInstance.id}
              type="button"
              className="zone-minimap-pin"
              style={{
                left: `${rel.x_pct}%`,
                top: `${rel.y_pct}%`,
                outline: highlightedPlantId === plantInstance.id ? "2px solid #c62828" : "none",
                outlineOffset: highlightedPlantId === plantInstance.id ? "2px" : "0"
              }}
              onMouseEnter={() => {
                const coords = toGlobalCoordinates(rel.x_pct, rel.y_pct);
                setHoverState({
                  type: "plant",
                  left: rel.x_pct,
                  top: rel.y_pct,
                  label: `${plantInstance.nickname || sp?.common_name || "Plante"} ${formatCoords(coords)}`,
                  image: sp?.photo_url || null
                });
              }}
              onMouseLeave={() => setHoverState(null)}
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/plants/${plantInstance.id}`);
              }}
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
            <div>{hoverState.label}</div>
            {hoverState.image ? <img src={hoverState.image} alt="" className="zone-minimap-tooltip-image" /> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
