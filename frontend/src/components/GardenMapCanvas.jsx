import React from "react";
import { getBBoxFromCoords, isGardenDebug, validatePointGeometry, validatePolygonGeometry } from "../utils/gardenDebug";
import { parseGeometry, resolveGardenDimensions } from "../utils/gardenMapUtils";

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

export default function GardenMapCanvas({
  gardenMap,
  zones = [],
  plantations = [],
  highlightedZoneId = null,
  onZoneClick,
  onPlantationClick,
  mode = "garden",
  fitToZoneId
}) {
  // Implementation notes after comparing the working zone-detail mini-map (ZoneMiniMap)
  // and the landing-page canvas:
  // - Shared interaction contract: one hover state, zone hover takes precedence over coordinate hover.
  // - Layering contract: interactive geometry stays pointer-enabled; passive overlays remain pointer-events none.
  // - Viewbox contract: landing page (mode="garden") always renders full garden dimensions.
  //   fitToZoneId is intentionally unused here for now and kept to align the component contract with zone-detail usage.
  void mode;
  void fitToZoneId;
  const debug = isGardenDebug();
  const geometry = parseGeometry(gardenMap?.geometry);
  const gardenValidation = validatePolygonGeometry(geometry, "garden");
  const { width, height, resolvedWidth, resolvedHeight } = resolveGardenDimensions(gardenMap, geometry);

  const errors = [];
  if (!gardenValidation.valid) errors.push(gardenValidation.error);
  if (!(Number.isFinite(resolvedWidth) && resolvedWidth > 0)) errors.push("[GardenDebug] Invalid garden width");
  if (!(Number.isFinite(resolvedHeight) && resolvedHeight > 0)) errors.push("[GardenDebug] Invalid garden height");
  const unavailable = errors.length > 0;

  if (debug && unavailable) {
    console.warn("[GardenMap] unavailable", {
      garden: gardenMap,
      geometry,
      geometryType: geometry?.type ?? null,
      width,
      height,
      resolvedWidth,
      resolvedHeight,
      errors
    });
  }

  if (unavailable) {
    return (
      <div>
        <div>Carte indisponible.</div>
        {debug && <pre style={{ marginTop: 8, fontSize: 12 }}>{JSON.stringify({ garden: gardenMap, geometryType: geometry?.type ?? null, width, height, resolvedWidth, resolvedHeight, errors }, null, 2)}</pre>}
      </div>
    );
  }

  if (debug) {
    console.log("[GardenDebug] Transform:", { gardenWidth: resolvedWidth, gardenHeight: resolvedHeight });
    console.log("[GardenDebug] Garden BBox:", gardenValidation.bbox);
    if (!zones.length) console.warn("[GardenDebug] No zones found");
    if (!plantations.length) console.warn("[GardenDebug] No plantations found");
  }

  const [ox, oy] = pointToSvg([0, 0], resolvedWidth, resolvedHeight);
  const [maxX, maxY] = pointToSvg([resolvedWidth, resolvedHeight], resolvedWidth, resolvedHeight);
  const [hoverState, setHoverState] = React.useState(null);

  function getLocalCoords(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratioX = (event.clientX - rect.left) / rect.width;
    const ratioY = (event.clientY - rect.top) / rect.height;
    return { x: ratioX * resolvedWidth, y: (1 - ratioY) * resolvedHeight };
  }

  return (
    <div className="garden-map-canvas-wrap">
      <svg viewBox={`0 0 ${resolvedWidth} ${resolvedHeight}`}
        preserveAspectRatio="xMidYMid meet"
        className="garden-map-canvas"
        onPointerMove={(event) => {
          if (hoverState?.type === "zone") return;
          const coords = getLocalCoords(event);
          setHoverState({ type: "coords", coords, x: event.clientX, y: event.clientY });
        }}
        onPointerLeave={() => {
          setHoverState(null);
        }}
      >
      <polygon points={polygonPoints(geometry, resolvedWidth, resolvedHeight)} fill="rgba(34,197,94,0.08)" stroke="rgb(22,163,74)" strokeWidth="0.6" pointerEvents="none" />
      {debug && (
        <g>
          <polygon points={polygonPoints(geometry, resolvedWidth, resolvedHeight)} fill="none" stroke="red" strokeWidth={Math.max(resolvedWidth, resolvedHeight) * 0.012} />
          <line x1={0} y1={oy} x2={resolvedWidth} y2={oy} stroke="#f00" strokeWidth="0.2" strokeDasharray="0.8 0.8" />
          <line x1={ox} y1={0} x2={ox} y2={resolvedHeight} stroke="#f00" strokeWidth="0.2" strokeDasharray="0.8 0.8" />
          <rect x={Math.min(ox, maxX)} y={Math.min(oy, maxY)} width={Math.abs(maxX - ox)} height={Math.abs(maxY - oy)} fill="none" stroke="red" strokeWidth="0.3" />
          <text x={ox + 1} y={Math.max(1, oy - 1)} fontSize="2.1" fill="red">(0,0)</text>
          {geometry.coordinates[0].map((pt, idx) => {
            const [vx, vy] = pointToSvg(pt, resolvedWidth, resolvedHeight);
            return <circle key={`g-v-${idx}`} cx={vx} cy={vy} r="0.6" fill="red" />;
          })}
        </g>
      )}
      {zones.map((zone, idx) => {
        const zoneGeometry = parseGeometry(zone.geometry);
        const zoneCheck = validatePolygonGeometry(zoneGeometry, `zone:${zone.id}`);
        if (debug) {
          if (!zoneCheck.valid) console.error(zoneCheck.error, zoneGeometry);
          else console.log("[GardenDebug] Zone geometry:", { id: zone.id, name: zone.name, points: zoneCheck.points, bbox: zoneCheck.bbox });
        }
        if (!isPolygon(zoneGeometry)) return null;
        const ring = zoneGeometry.coordinates[0];
        const [cx, cy] = pointToSvg(ring[0], resolvedWidth, resolvedHeight);
        const isHighlighted = String(highlightedZoneId) === String(zone.id);
        return (
          <g key={zone.id} onClick={() => onZoneClick?.(zone)} style={{ cursor: "pointer" }}>
            <polygon
              points={polygonPoints(zoneGeometry, resolvedWidth, resolvedHeight)}
              fill={debug ? "rgba(0,0,255,0.1)" : "rgba(156, 204, 155, 0.72)"}
              stroke={isHighlighted ? "#c62828" : (debug ? "blue" : "#2e7d32")}
              strokeWidth={isHighlighted ? "1.1" : "0.6"}
              onPointerEnter={(event) => setHoverState({ type: "zone", zone, x: event.clientX, y: event.clientY })}
              onPointerMove={(event) => setHoverState((prev) => (prev?.type === "zone" && String(prev?.zone?.id) === String(zone.id)
                ? { ...prev, x: event.clientX, y: event.clientY }
                : prev))}
              onPointerLeave={() => setHoverState(null)}
            />
            <text x={cx} y={cy} fontSize="2.8" fill="#123" pointerEvents="none">{zone.name}</text>
            {debug && ring.map((pt, vIdx) => {
              const [vx, vy] = pointToSvg(pt, resolvedWidth, resolvedHeight);
              return <circle key={`z-${zone.id}-${vIdx}`} cx={vx} cy={vy} r="0.45" fill="blue" />;
            })}
          </g>
        );
      })}
      {plantations.map((p) => {
        const pointCheck = validatePointGeometry(p.position, `plantation:${p.id}`);
        if (debug && !pointCheck.valid) console.error(pointCheck.error, p.position);
        if (p.position?.type !== "Point") return null;
        const [x, y] = pointToSvg(p.position.coordinates, resolvedWidth, resolvedHeight);
        if (debug) {
          console.log("[GardenDebug] Plantation transformed:", { id: p.id, source: p.position.coordinates, transformed: [x, y], bbox: getBBoxFromCoords([p.position.coordinates]) });
        }
        return <circle key={p.id} cx={x} cy={y} r={debug ? "4" : "1.1"} fill="green" onClick={() => onPlantationClick?.(p)} style={{ cursor: "pointer" }} />;
      })}
      </svg>
      {hoverState ? (
        <div className="zone-minimap-tooltip zone-minimap-tooltip-small" style={{ marginTop: "0.4rem", position: "static", pointerEvents: "none" }}>
          {hoverState.type === "zone"
            ? hoverState.zone.name
            : `Coordonnées : X: ${hoverState.coords.x.toFixed(1)}, Y: ${hoverState.coords.y.toFixed(1)}`}
        </div>
      ) : null}
      <div className="garden-map-hover-readout">
        {hoverState?.type === "zone"
          ? hoverState.zone.name
          : hoverState?.type === "coords"
            ? `Coordonnées : X: ${hoverState.coords.x.toFixed(1)}, Y: ${hoverState.coords.y.toFixed(1)}`
            : "Coordonnées : X: 0.0, Y: 0.0"}
      </div>
    </div>
  );
}

export { pointToSvg };
