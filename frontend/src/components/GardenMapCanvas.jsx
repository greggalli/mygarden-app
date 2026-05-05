import React from "react";
import { getBBoxFromCoords, isGardenDebug, validatePointGeometry, validatePolygonGeometry } from "../utils/gardenDebug";

function isPolygon(geometry) {
  return geometry?.type === "Polygon" && Array.isArray(geometry.coordinates?.[0]);
}

function pointToSvg([x, y], width, height) {
  return [x, height - y];
}

function polygonPoints(geometry, width, height) {
  if (!isPolygon(geometry)) return "";
  return geometry.coordinates[0].map((pt) => pointToSvg(pt, width, height).join(",")).join(" ");
}

export default function GardenMapCanvas({ gardenMap, zones = [], plantations = [], onZoneClick, onPlantationClick }) {
  const debug = isGardenDebug();
  const gardenValidation = validatePolygonGeometry(gardenMap?.geometry, "garden");
  if (debug && !gardenValidation.valid) {
    console.error(gardenValidation.error, gardenMap?.geometry);
  }
  if (!gardenMap?.geometry || !isPolygon(gardenMap.geometry)) return <div>Carte indisponible.</div>;

  const width = Number(gardenMap.width) || 100;
  const height = Number(gardenMap.height) || 100;
  const scaleX = 100 / width;
  const scaleY = 100 / height;

  if (debug) {
    console.log("[GardenDebug] Transform:", { svgWidth: 100, svgHeight: 100, gardenWidth: width, gardenHeight: height, scaleX, scaleY });
    console.log("[GardenDebug] Garden BBox:", gardenValidation.bbox);
    if (!zones.length) console.warn("[GardenDebug] No zones found");
    if (!plantations.length) console.warn("[GardenDebug] No plantations found");
  }

  const [ox, oy] = pointToSvg([0, 0], width, height);
  const [maxX, maxY] = pointToSvg([width, height], width, height);

  return (
    <svg viewBox="0 0 100 100" style={{ width: "100%", height: "auto", border: "1px solid #ddd", borderRadius: 8 }}>
      <polygon points={polygonPoints(gardenMap.geometry, width, height)} fill="#f8faf8" stroke="#2f4f2f" strokeWidth="0.6" />
      {debug && (
        <g>
          <polygon points={polygonPoints(gardenMap.geometry, width, height)} fill="none" stroke="red" strokeWidth="0.8" />
          <line x1={0} y1={oy} x2={100} y2={oy} stroke="#f00" strokeWidth="0.2" strokeDasharray="0.8 0.8" />
          <line x1={ox} y1={0} x2={ox} y2={100} stroke="#f00" strokeWidth="0.2" strokeDasharray="0.8 0.8" />
          <rect x={Math.min(ox, maxX)} y={Math.min(oy, maxY)} width={Math.abs(maxX - ox)} height={Math.abs(maxY - oy)} fill="none" stroke="red" strokeWidth="0.3" />
          <text x={ox + 1} y={oy - 1} fontSize="2.1" fill="red">(0,0)</text>
          {gardenMap.geometry.coordinates[0].map((pt, idx) => {
            const [vx, vy] = pointToSvg(pt, width, height);
            return <circle key={`g-v-${idx}`} cx={vx} cy={vy} r="0.6" fill="red" />;
          })}
        </g>
      )}
      {zones.map((zone, idx) => {
        const zoneCheck = validatePolygonGeometry(zone.geometry, `zone:${zone.id}`);
        if (debug) {
          if (!zoneCheck.valid) console.error(zoneCheck.error, zone.geometry);
          else console.log("[GardenDebug] Zone geometry:", { id: zone.id, name: zone.name, points: zoneCheck.points, bbox: zoneCheck.bbox });
        }
        if (!isPolygon(zone.geometry)) return null;
        const ring = zone.geometry.coordinates[0];
        const [cx, cy] = pointToSvg(ring[0], resolvedWidth, resolvedHeight);
        return (
          <g key={zone.id} onClick={() => onZoneClick?.(zone)} style={{ cursor: "pointer" }}>
            <polygon points={polygonPoints(zone.geometry, width, height)} fill={debug ? "rgba(0,0,255,0.1)" : `hsl(${(idx * 77) % 360} 70% 75% / 0.5)`} stroke={debug ? "blue" : "#355"} strokeWidth="0.4" />
            <text x={cx} y={cy} fontSize="2.8" fill="#123">{zone.name}</text>
            {debug && ring.map((pt, vIdx) => {
              const [vx, vy] = pointToSvg(pt, width, height);
              return <circle key={`z-${zone.id}-${vIdx}`} cx={vx} cy={vy} r="0.45" fill="blue" />;
            })}
          </g>
        );
      })}
      {plantations.map((p) => {
        const pointCheck = validatePointGeometry(p.position, `plantation:${p.id}`);
        if (debug && !pointCheck.valid) console.error(pointCheck.error, p.position);
        if (p.position?.type !== "Point") return null;
        const [x, y] = pointToSvg(p.position.coordinates, width, height);
        if (debug) {
          console.log("[GardenDebug] Plantation transformed:", { id: p.id, source: p.position.coordinates, transformed: [x, y], bbox: getBBoxFromCoords([p.position.coordinates]) });
        }
        return <circle key={p.id} cx={x} cy={y} r={debug ? "4" : "1.1"} fill="green" onClick={() => onPlantationClick?.(p)} style={{ cursor: "pointer" }} />;
      })}
    </svg>
  );
}

export { pointToSvg };
