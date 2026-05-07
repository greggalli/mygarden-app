import React, { useState } from "react";
import { isGardenDebug, validatePointGeometry, validatePolygonGeometry } from "../utils/gardenDebug";
import { parseGeometry, polygonToSvgPoints, resolveGardenDimensions, toSvgPoint } from "../utils/gardenMapUtils";

function isPolygon(geometry) {
  return geometry?.type === "Polygon" && Array.isArray(geometry.coordinates?.[0]);
}

function PlantMarker({ x, y, isHovered, onEnter, onLeave, onClick, label }) {
  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="garden-map-plant-marker"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
      role="button"
      aria-label={label}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.(event);
        }
      }}
    >
      <circle r="1.25" className="garden-map-plant-pin-bg" vectorEffect="non-scaling-stroke" />
      <text textAnchor="middle" dominantBaseline="central" className="garden-map-plant-pin-icon" aria-hidden="true">🌱</text>
      {isHovered && <circle r="2" className="garden-map-plant-hover-ring" vectorEffect="non-scaling-stroke" />}
      <title>{label}</title>
    </g>
  );
}

export default function GardenMapCanvas({ gardenMap, zones = [], plantations = [], onZoneClick, onPlantationClick }) {
  const debug = isGardenDebug();
  const geometry = parseGeometry(gardenMap?.geometry);
  const gardenValidation = validatePolygonGeometry(geometry, "garden");
  const { width, height, resolvedWidth, resolvedHeight } = resolveGardenDimensions(gardenMap, geometry);
  const [hoveredZoneId, setHoveredZoneId] = useState(null);
  const [hoveredPlantId, setHoveredPlantId] = useState(null);


  const errors = [];
  if (!gardenValidation.valid) errors.push(gardenValidation.error);
  if (!(Number.isFinite(resolvedWidth) && resolvedWidth > 0)) errors.push("[GardenDebug] Invalid garden width");
  if (!(Number.isFinite(resolvedHeight) && resolvedHeight > 0)) errors.push("[GardenDebug] Invalid garden height");
  const unavailable = errors.length > 0;

  if (unavailable) {
    return (
      <div>
        <div>Carte indisponible.</div>
        {debug && <pre style={{ marginTop: 8, fontSize: 12 }}>{JSON.stringify({ garden: gardenMap, geometryType: geometry?.type ?? null, width, height, resolvedWidth, resolvedHeight, errors }, null, 2)}</pre>}
      </div>
    );
  }

  const hoverZone = hoveredZoneId ? zones.find((zone) => zone.id === hoveredZoneId) : null;

  return (
    <div className="garden-map-card">
      <div className="garden-map-canvas-shell">
        <svg viewBox={`0 0 ${resolvedWidth} ${resolvedHeight}`} preserveAspectRatio="xMidYMid meet" className="h-full w-full min-h-[300px]">
          <polygon
            points={polygonToSvgPoints(geometry, resolvedHeight)}
            fill="rgba(34,197,94,0.08)"
            stroke="rgb(22,163,74)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />

          {zones.map((zone, idx) => {
            const zoneGeometry = parseGeometry(zone.geometry);
            if (!isPolygon(zoneGeometry)) return null;
            const ring = zoneGeometry.coordinates[0];
            const [cx, cy] = toSvgPoint(ring[0], resolvedHeight);
            const isHovered = hoveredZoneId === zone.id;
            return (
              <g
                key={zone.id}
                onClick={() => onZoneClick?.(zone)}
                onMouseEnter={() => setHoveredZoneId(zone.id)}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="garden-map-zone"
              >
                <polygon
                  points={polygonToSvgPoints(zoneGeometry, resolvedHeight)}
                  fill={isHovered ? `hsl(${(idx * 77) % 360} 85% 70% / 0.5)` : `hsl(${(idx * 77) % 360} 70% 75% / 0.35)`}
                  stroke={isHovered ? "#1f2937" : "#355"}
                  strokeWidth={isHovered ? "1.7" : "1.2"}
                  vectorEffect="non-scaling-stroke"
                />
                <text x={cx} y={cy} fontSize="2.8" fill="#123" pointerEvents="none">{zone.name}</text>
                <title>{zone.name}</title>
              </g>
            );
          })}

          {plantations.map((p) => {
            const pointCheck = validatePointGeometry(p.position, `plantation:${p.id}`);
            if (debug && !pointCheck.valid) console.error(pointCheck.error, p.position);
            if (p.position?.type !== "Point") return null;
            const [x, y] = toSvgPoint(p.position.coordinates, resolvedHeight);
            const isHovered = hoveredPlantId === p.id;
            const plantLabel = p.nickname || p.name || "Plante";
            return (
              <PlantMarker
                key={p.id}
                x={x}
                y={y}
                isHovered={isHovered}
                onEnter={() => setHoveredPlantId(p.id)}
                onLeave={() => setHoveredPlantId(null)}
                onClick={(event) => {
                  event.stopPropagation();
                  onPlantationClick?.(p);
                }}
                label={plantLabel}
              />
            );
          })}

          {debug && (
            <g pointerEvents="none">
              {geometry.coordinates[0].map((pt, idx) => {
                const [vx, vy] = toSvgPoint(pt, resolvedHeight);
                return <circle key={`g-v-${idx}`} cx={vx} cy={vy} r="0.6" fill="red" />;
              })}
              <rect x="0" y="0" width={resolvedWidth} height={resolvedHeight} fill="none" stroke="red" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </g>
          )}
        </svg>
        {hoverZone && <div className="zone-hover-tooltip">{hoverZone.name}</div>}
      </div>
    </div>
  );
}

export { toSvgPoint };
