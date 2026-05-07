import React, { useMemo, useRef, useState } from "react";
import { pointInPolygon } from "../utils/geojson";
import { isGardenDebug, validatePointGeometry, validatePolygonGeometry } from "../utils/gardenDebug";
import {
  markerUnitsFromPixels,
  parseGeometry,
  polygonToSvgPoints,
  resolveGardenDimensions,
  svgEventToLocalPoint,
  toSvgPoint
} from "../utils/gardenMapUtils";

function isPolygon(geometry) {
  return geometry?.type === "Polygon" && Array.isArray(geometry.coordinates?.[0]);
}

function PlantMarker({ x, y, isHovered, onEnter, onLeave, onClick, label, radius, iconSize }) {
  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="garden-map-plant-marker"
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onClick={onClick}
      role="button"
      aria-label={label}
      tabIndex={0}
    >
      <circle r={radius} className="garden-map-plant-pin-bg" vectorEffect="non-scaling-stroke" />
      <text textAnchor="middle" dominantBaseline="central" className="garden-map-plant-pin-icon" style={{ fontSize: iconSize }} aria-hidden="true">🌱</text>
      {isHovered && <circle r={radius + 2} className="garden-map-plant-hover-ring" vectorEffect="non-scaling-stroke" />}
      <title>{label}</title>
    </g>
  );
}

export default function GardenMapCanvas({ gardenMap, zones = [], plantations = [], onZoneClick, onPlantationClick, onMapHover, onMapClick, onPlantationHover }) {
  const debug = isGardenDebug();
  const svgRef = useRef(null);
  const geometry = parseGeometry(gardenMap?.geometry);
  const gardenValidation = validatePolygonGeometry(geometry, "garden");
  const { width, height, resolvedWidth, resolvedHeight } = resolveGardenDimensions(gardenMap, geometry);
  const [hoveredZoneId, setHoveredZoneId] = useState(null);
  const [hoveredPlantId, setHoveredPlantId] = useState(null);

  const viewBox = useMemo(() => ({ x: 0, y: 0, width: resolvedWidth, height: resolvedHeight }), [resolvedWidth, resolvedHeight]);
  const markerRadius = markerUnitsFromPixels(svgRef.current, viewBox, 7);
  const markerIcon = markerUnitsFromPixels(svgRef.current, viewBox, 12);

  const errors = [];
  if (!gardenValidation.valid) errors.push(gardenValidation.error);
  if (!(Number.isFinite(resolvedWidth) && resolvedWidth > 0)) errors.push("[GardenDebug] Invalid garden width");
  if (!(Number.isFinite(resolvedHeight) && resolvedHeight > 0)) errors.push("[GardenDebug] Invalid garden height");
  const unavailable = errors.length > 0;

  if (unavailable) {
    return <div><div>Carte indisponible.</div>{debug && <pre style={{ marginTop: 8, fontSize: 12 }}>{JSON.stringify({ garden: gardenMap, geometryType: geometry?.type ?? null, width, height, resolvedWidth, resolvedHeight, errors }, null, 2)}</pre>}</div>;
  }

  const hoverZone = hoveredZoneId ? zones.find((zone) => zone.id === hoveredZoneId) : null;

  return (
    <div className="garden-map-card">
      <div className="garden-map-canvas-shell">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${resolvedWidth} ${resolvedHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full min-h-[300px]"
          onPointerMove={(event) => onMapHover?.(svgEventToLocalPoint(event, svgRef.current, resolvedHeight))}
          onPointerLeave={() => onMapHover?.(null)}
          onClick={(event) => {
            const point = svgEventToLocalPoint(event, svgRef.current, resolvedHeight);
            if (!point) return;
            const geoPoint = { type: "Point", coordinates: point };
            const matching = zones.filter((zone) => pointInPolygon(geoPoint, parseGeometry(zone.geometry))).sort((a, b) => {
              const ar = Math.abs((parseGeometry(a.geometry)?.coordinates?.[0] || []).length);
              const br = Math.abs((parseGeometry(b.geometry)?.coordinates?.[0] || []).length);
              return ar - br;
            });
            onMapClick?.(point, matching[0]);
          }}
        >
          <polygon points={polygonToSvgPoints(geometry, resolvedHeight)} fill="rgba(34,197,94,0.08)" stroke="rgb(22,163,74)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          {zones.map((zone, idx) => {
            const zoneGeometry = parseGeometry(zone.geometry);
            if (!isPolygon(zoneGeometry)) return null;
            const ring = zoneGeometry.coordinates[0];
            const [cx, cy] = toSvgPoint(ring[0], resolvedHeight);
            const isHovered = hoveredZoneId === zone.id;
            return <g key={zone.id} onClick={() => onZoneClick?.(zone)} onMouseEnter={() => setHoveredZoneId(zone.id)} onMouseLeave={() => setHoveredZoneId(null)} className="garden-map-zone"><polygon points={polygonToSvgPoints(zoneGeometry, resolvedHeight)} fill={isHovered ? `hsl(${(idx * 77) % 360} 85% 70% / 0.5)` : `hsl(${(idx * 77) % 360} 70% 75% / 0.35)`} stroke={isHovered ? "#1f2937" : "#355"} strokeWidth={isHovered ? "1.7" : "1.2"} vectorEffect="non-scaling-stroke" /><text x={cx} y={cy} fontSize="2.8" fill="#123" pointerEvents="none">{zone.name}</text><title>{zone.name}</title></g>;
          })}
          {plantations.map((p) => {
            const pointCheck = validatePointGeometry(p.position, `plantation:${p.id}`);
            if (debug && !pointCheck.valid) console.error(pointCheck.error, p.position);
            if (p.position?.type !== "Point") return null;
            const [x, y] = toSvgPoint(p.position.coordinates, resolvedHeight);
            const isHovered = hoveredPlantId === p.id;
            const plantLabel = p.nickname || p.name || "Plante";
            return <PlantMarker key={p.id} x={x} y={y} radius={markerRadius} iconSize={markerIcon} isHovered={isHovered} onEnter={(event) => { event.stopPropagation(); setHoveredPlantId(p.id); onPlantationHover?.(p, event); }} onLeave={(event) => { event.stopPropagation(); setHoveredPlantId(null); onPlantationHover?.(null); }} onClick={(event) => { event.stopPropagation(); onPlantationClick?.(p); }} label={plantLabel} />;
          })}
        </svg>
        {hoverZone && <div className="zone-hover-tooltip">{hoverZone.name}</div>}
      </div>
    </div>
  );
}
