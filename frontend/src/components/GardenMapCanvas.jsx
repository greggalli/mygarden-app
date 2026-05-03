import React from "react";

function isPolygon(geometry) {
  return geometry?.type === "Polygon" && Array.isArray(geometry.coordinates?.[0]);
}

function pointToSvg([x, y], width, height) {
  return [(x / width) * 100, ((height - y) / height) * 100];
}

function polygonPoints(geometry, width, height) {
  if (!isPolygon(geometry)) return "";
  return geometry.coordinates[0].map((pt) => pointToSvg(pt, width, height).join(",")).join(" ");
}

export default function GardenMapCanvas({ gardenMap, zones = [], plantations = [], onZoneClick, onPlantationClick }) {
  if (!gardenMap?.geometry || !isPolygon(gardenMap.geometry)) return <div>Carte indisponible.</div>;

  const width = Number(gardenMap.width) || 100;
  const height = Number(gardenMap.height) || 100;

  return (
    <svg viewBox="0 0 100 100" style={{ width: "100%", height: "auto", border: "1px solid #ddd", borderRadius: 8 }}>
      <polygon points={polygonPoints(gardenMap.geometry, width, height)} fill="#f8faf8" stroke="#2f4f2f" strokeWidth="0.6" />
      {zones.map((zone, idx) => {
        if (!isPolygon(zone.geometry)) return null;
        const ring = zone.geometry.coordinates[0];
        const [cx, cy] = pointToSvg(ring[0], width, height);
        return (
          <g key={zone.id} onClick={() => onZoneClick?.(zone)} style={{ cursor: "pointer" }}>
            <polygon points={polygonPoints(zone.geometry, width, height)} fill={`hsl(${(idx * 77) % 360} 70% 75% / 0.5)`} stroke="#355" strokeWidth="0.4" />
            <text x={cx} y={cy} fontSize="2.8" fill="#123">{zone.name}</text>
          </g>
        );
      })}
      {plantations.map((p) => {
        if (p.position?.type !== "Point") return null;
        const [x, y] = pointToSvg(p.position.coordinates, width, height);
        return <circle key={p.id} cx={x} cy={y} r="1.1" fill="#0a7" onClick={() => onPlantationClick?.(p)} style={{ cursor: "pointer" }} />;
      })}
    </svg>
  );
}

export { pointToSvg };
