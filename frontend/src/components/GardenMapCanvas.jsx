import React, { useMemo, useRef, useState } from "react";
import {
  findZoneContainingPoint,
  getFittedViewBoxForZone,
  markerUnitsFromPixels,
  parseGeometry,
  pointToSvgCircle,
  polygonToSvgPoints,
  resolveGardenDimensions,
  svgPointerEventToLocalPoint,
  toSvgPoint
} from "../utils/gardenMapUtils";

function PlantMarker({ x, y, label, radius, iconSize, isHovered, onEnter, onLeave, onClick }) {
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
      {isHovered ? <circle r={radius + 2} className="garden-map-plant-hover-ring" vectorEffect="non-scaling-stroke" /> : null}
    </g>
  );
}

export default function GardenMapCanvas({
  gardenMap,
  zones = [],
  plantations = [],
  selectedZoneId,
  mode = "garden",
  fitToZoneId,
  showGardenBoundary = true,
  showZoneLabels = true,
  showPlantations = true,
  onZoneClick,
  onZoneHover,
  onPlantationClick,
  onPlantationHover,
  onMapClick,
  onMapHover
}) {
  const svgRef = useRef(null);
  const [hoveredZoneId, setHoveredZoneId] = useState(null);
  const [hoveredPlantId, setHoveredPlantId] = useState(null);

  const gardenGeometry = parseGeometry(gardenMap?.geometry);
  const { resolvedWidth, resolvedHeight } = resolveGardenDimensions(gardenMap, gardenGeometry);
  const activeZoneId = fitToZoneId || selectedZoneId;
  const fitZone = zones.find((z) => String(z.id) === String(activeZoneId));
  const fitViewBox = fitZone ? getFittedViewBoxForZone(parseGeometry(fitZone.geometry), resolvedHeight, 0.15) : null;
  const viewBox = fitViewBox || `0 0 ${resolvedWidth} ${resolvedHeight}`;

  const markerRadius = markerUnitsFromPixels(svgRef.current, fitViewBox ? { width: Number(viewBox.split(" ")[2]) } : { width: resolvedWidth }, 10);
  const markerIconSize = markerUnitsFromPixels(svgRef.current, fitViewBox ? { width: Number(viewBox.split(" ")[2]) } : { width: resolvedWidth }, 13);

  const zoneLayers = useMemo(() => zones.map((zone, idx) => ({ zone, idx, geometry: parseGeometry(zone.geometry) })), [zones]);

  return (
    <div className="garden-map-canvas-shell">
      <svg
        ref={svgRef}
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full min-h-[320px]"
        onPointerMove={(event) => onMapHover?.(svgPointerEventToLocalPoint(event, svgRef.current, resolvedHeight))}
        onPointerLeave={() => onMapHover?.(null)}
        onClick={(event) => {
          const point = svgPointerEventToLocalPoint(event, svgRef.current, resolvedHeight);
          if (!point) return;
          const zone = findZoneContainingPoint(point, zones);
          onMapClick?.(point, zone || undefined);
        }}
      >
        <rect x="0" y="0" width={resolvedWidth} height={resolvedHeight} fill="#f8faf8" pointerEvents="none" />
        {showGardenBoundary && gardenGeometry ? <polygon points={polygonToSvgPoints(gardenGeometry, resolvedHeight)} fill="rgba(34,197,94,0.08)" stroke="#4b7f56" strokeWidth="1.25" vectorEffect="non-scaling-stroke" pointerEvents="none" /> : null}

        {zoneLayers.map(({ zone, idx, geometry }) => {
          if (!geometry) return null;
          const isHovered = hoveredZoneId === zone.id;
          const isSelected = String(selectedZoneId) === String(zone.id);
          const ringStart = geometry.coordinates?.[0]?.[0];
          const labelPoint = ringStart ? toSvgPoint(ringStart, resolvedHeight) : [0, 0];
          return (
            <g
              key={zone.id}
              className="garden-map-zone"
              onPointerEnter={() => { setHoveredZoneId(zone.id); onZoneHover?.(zone); }}
              onPointerLeave={() => { setHoveredZoneId(null); onZoneHover?.(null); }}
              onClick={(event) => {
                event.stopPropagation();
                const point = svgPointerEventToLocalPoint(event, svgRef.current, resolvedHeight);
                onZoneClick?.(zone, point);
              }}
            >
              <polygon points={polygonToSvgPoints(geometry, resolvedHeight)} fill={isSelected ? "rgba(56, 189, 248, 0.28)" : isHovered ? `hsl(${(idx * 61) % 360} 70% 75% / 0.45)` : `hsl(${(idx * 61) % 360} 55% 74% / 0.25)`} stroke={isSelected ? "#0f766e" : "#43635a"} strokeWidth={1.25} vectorEffect="non-scaling-stroke" />
              {showZoneLabels ? <text x={labelPoint[0]} y={labelPoint[1]} className="garden-map-zone-label" pointerEvents="none">{zone.name}</text> : null}
            </g>
          );
        })}

        {showPlantations ? plantations.map((p) => {
          if (p.position?.type !== "Point") return null;
          const { cx, cy } = pointToSvgCircle(p.position.coordinates, resolvedHeight);
          const isHovered = hoveredPlantId === p.id;
          return <PlantMarker key={p.id} x={cx} y={cy} radius={markerRadius} iconSize={markerIconSize} label={p.nickname || p.name || "Plante"} isHovered={isHovered} onEnter={(event) => { event.stopPropagation(); setHoveredPlantId(p.id); onPlantationHover?.(p, event); }} onLeave={(event) => { event.stopPropagation(); setHoveredPlantId(null); onPlantationHover?.(null); }} onClick={(event) => { event.stopPropagation(); onPlantationClick?.(p); }} />;
        }) : null}
      </svg>
      {mode === "garden" && hoveredZoneId ? <div className="zone-hover-tooltip">{zones.find((z) => z.id === hoveredZoneId)?.name}</div> : null}
    </div>
  );
}
