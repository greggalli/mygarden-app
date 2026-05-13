// src/components/ZoneMiniMap.jsx
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGardenData } from "../data/GardenDataContext";
import { isGardenDebug } from "../utils/gardenDebug";
import { computeZoneDetailViewBoxFromBBox } from "../utils/gardenMapUtils";

const VIEWBOX_PADDING_RATIO = 0.1;

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
  const [tooltipStyle, setTooltipStyle] = useState(null);
  const mapRef = useRef(null);
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);

  const zoneBounds = useMemo(() => getZoneBounds(zone), [zone]);
  const zoneRing = zone?.geometry?.coordinates?.[0] ?? [];

  const viewBox = useMemo(() => {
    if (!zoneBounds) return null;
    // Root cause note: old code projected polygon points into a 0..100 square and used
    // preserveAspectRatio="none", causing independent X/Y stretching.
    return computeZoneDetailViewBoxFromBBox(zoneBounds, VIEWBOX_PADDING_RATIO);
  }, [zoneBounds]);

  const computedViewBox = viewBox ? `${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}` : null;
  const stageAspectRatio = viewBox?.ratio ?? 1;

  function svgPointerEventToLocalPoint(event) {
    if (!svgRef.current || !zoneBounds) return null;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return null;
    const pt = svgRef.current.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const svgPoint = pt.matrixTransform(ctm.inverse());
    return { x: svgPoint.x, y: -svgPoint.y };
  }

  useLayoutEffect(() => {
    if (!hoverState || !mapRef.current || !tooltipRef.current) {
      setTooltipStyle(null);
      return;
    }
    const container = mapRef.current.getBoundingClientRect();
    const tooltip = tooltipRef.current.getBoundingClientRect();
    const anchorX = (hoverState.left / 100) * container.width;
    const anchorY = (hoverState.top / 100) * container.height;
    const horizontalPadding = 12;
    const verticalPadding = 12;
    const offset = 12;

    let leftPx = anchorX - tooltip.width / 2;
    leftPx = Math.max(horizontalPadding, Math.min(leftPx, container.width - tooltip.width - horizontalPadding));

    let topPx = anchorY - tooltip.height - offset;
    if (topPx < verticalPadding) {
      topPx = Math.min(anchorY + offset, container.height - tooltip.height - verticalPadding);
    }

    setTooltipStyle({ left: `${leftPx}px`, top: `${topPx}px` });
  }, [hoverState]);

  useLayoutEffect(() => {
    if (!isGardenDebug() || !viewBox || !mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const renderedContainerRatio = rect.height > 0 ? rect.width / rect.height : null;
    console.debug("[ZoneMiniMap] viewBox debug", {
      zoneId: zone?.id ?? null,
      localBBox: viewBox.localBBox,
      svgBBox: viewBox.svgBBox,
      computedViewBox,
      viewBoxRatio: viewBox.ratio,
      renderedContainerRatio
    });
  }, [computedViewBox, viewBox, zone?.id]);

  if (!zone || !zoneBounds) {
    return <div className="zone-minimap-inner zone-minimap-error">Zone introuvable</div>;
  }

  function toRelativePosition(plantPos) {
    const [x, y] = Array.isArray(plantPos?.coordinates)
      ? plantPos.coordinates
      : [plantPos?.x_pct, plantPos?.y_pct];
    if (!viewBox) return { x_pct: 0, y_pct: 0 };
    const svgY = -y;
    const relX = ((x - viewBox.minX) / viewBox.width) * 100;
    const relY = ((svgY - viewBox.minY) / viewBox.height) * 100;
    return { x_pct: relX, y_pct: relY };
  }

  function toGlobalCoordinates(relX, relY) {
    if (!viewBox) {
      return { x: zoneBounds.minX, y: zoneBounds.minY };
    }
    const svgX = viewBox.minX + (relX / 100) * viewBox.width;
    const svgY = viewBox.minY + (relY / 100) * viewBox.height;
    return {
      x: svgX,
      y: -svgY
    };
  }

  function displayToRelative(displayX, displayY) {
    if (!rotated) return { x: displayX, y: displayY };
    const centeredX = displayX - 50;
    const centeredY = displayY - 50;
    return { x: centeredY + 50, y: 50 - centeredX };
  }

  function relativeToDisplay(relativeX, relativeY) {
    if (!rotated) return { x: relativeX, y: relativeY };
    const centeredX = relativeX - 50;
    const centeredY = relativeY - 50;
    return { x: 50 - centeredY, y: centeredX + 50 };
  }

  function formatCoords(coords) {
    return `(${coords.x.toFixed(2)}, ${coords.y.toFixed(2)})`;
  }

  function handleMapHover(event) {
    if (event.target.closest(".zone-minimap-pin")) return;
    const localPoint = svgPointerEventToLocalPoint(event);
    if (!localPoint) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const displayX = ((event.clientX - rect.left) / rect.width) * 100;
    const displayY = ((event.clientY - rect.top) / rect.height) * 100;

    setHoverState({
      type: "coords",
      left: displayX,
      top: displayY,
      label: formatCoords(localPoint),
      localPoint
    });
  }

  function handleMapClick(event) {
    if (event.target.closest(".zone-minimap-pin")) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const displayX = ((event.clientX - rect.left) / rect.width) * 100;
    const displayY = ((event.clientY - rect.top) / rect.height) * 100;
    const localPoint = svgPointerEventToLocalPoint(event);
    if (!localPoint) return;
    const shouldCreate = window.confirm("Créer une nouvelle plantation ?");
    if (!shouldCreate) return;
    const params = new URLSearchParams({ zone_id: String(zone.id), x: localPoint.x.toFixed(2), y: localPoint.y.toFixed(2) });
    navigate(`/add-plant?${params.toString()}`);
  }

  return (
      <div
        ref={mapRef}
        className={`zone-minimap-area zone-minimap-area-only ${rotated ? "zone-minimap-area-rotated" : ""}`}
        style={{ aspectRatio: stageAspectRatio }}
        onMouseMove={handleMapHover}
        onMouseLeave={() => setHoverState(null)}
        onClick={handleMapClick}
      >
        {Array.isArray(zoneRing) && zoneRing.length > 0 ? (
          <svg ref={svgRef} className="zone-minimap-shape" viewBox={computedViewBox} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <rect
              x={viewBox.minX}
              y={viewBox.minY}
              width={viewBox.width}
              height={viewBox.height}
              fill="none"
              stroke="#6fa871"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            <polygon
              points={zoneRing
                .map(([x, y]) => `${x},${-y}`)
                .join(" ")}
              fill="#9ccc9b"
              stroke="#2e7d32"
              strokeWidth={1.25}
              vectorEffect="non-scaling-stroke"
            />
            {isGardenDebug() ? (
              <g pointerEvents="none">
                <rect
                  x={viewBox.localBBox.minX}
                  y={viewBox.localBBox.minY}
                  width={viewBox.localBBox.width}
                  height={viewBox.localBBox.height}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                  strokeDasharray="2 2"
                />
                {zoneRing.map(([x, y], idx) => (
                  <g key={`v-${idx}`}>
                    <circle cx={x} cy={-y} r={1.8} fill="#ef4444" vectorEffect="non-scaling-stroke" />
                    <text x={x + 1.6} y={-y - 1.6} fontSize="3" fill="#7f1d1d">[{x}, {y}]</text>
                  </g>
                ))}
              </g>
            ) : null}
          </svg>
        ) : null}
        {plantsInZone.map((plantInstance) => {
          const sp = species.find((s) => s.id === plantInstance.species_id);
          const rel = toRelativePosition(plantInstance.position);
          const displayPos = relativeToDisplay(rel.x_pct, rel.y_pct);

          return (
            <button
              key={plantInstance.id}
              type="button"
              className="zone-minimap-pin"
              style={{
                left: `${displayPos.x}%`,
                top: `${displayPos.y}%`,
                outline: highlightedPlantId === plantInstance.id ? "3px solid #c62828" : "none",
                outlineOffset: highlightedPlantId === plantInstance.id ? "2px" : "0",
                boxShadow: highlightedPlantId === plantInstance.id ? "0 0 0 5px rgba(198,40,40,0.35), 0 8px 18px rgba(0,0,0,0.45)" : "0 6px 16px rgba(0,0,0,0.4)",
                transform: highlightedPlantId === plantInstance.id ? "translate(-50%, -100%) scale(1.2)" : "translate(-50%, -100%)"
              }}
              onMouseEnter={() => {
                const coords = toGlobalCoordinates(rel.x_pct, rel.y_pct);
                setHoverState({
                  type: "plant",
                  left: displayPos.x,
                  top: displayPos.y,
                  label: `${plantInstance.nickname || sp?.common_name || "Plante"} ${formatCoords(coords)}`,
                  image: sp?.photos?.[0] || null
                });
              }}
              onMouseLeave={() => setHoverState(null)}
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/plants/${plantInstance.id}`);
              }}
            >
              <span className={`zone-minimap-pin-icon ${rotated ? "zone-minimap-pin-icon-keep-upright" : ""}`}>🌱</span>
            </button>
          );
        })}

        {isGardenDebug() && viewBox ? (
          <div className="zone-minimap-debug-ratio" style={{ pointerEvents: "none" }}>
            <div>Ratio: {viewBox.ratio.toFixed(2)}</div>
            <div>viewBox: {computedViewBox}</div>
            <div>zoneBBox: [{zoneBounds.minX}, {zoneBounds.minY}] → [{zoneBounds.maxX}, {zoneBounds.maxY}]</div>
            {hoverState?.localPoint ? <div>hover: X {hoverState.localPoint.x.toFixed(2)} / Y {hoverState.localPoint.y.toFixed(2)}</div> : null}
          </div>
        ) : null}

        {hoverState ? (
          <div
            ref={tooltipRef}
            className={`zone-minimap-tooltip ${hoverState.type === "coords" ? "zone-minimap-tooltip-small" : ""}`}
            style={tooltipStyle || { left: `${hoverState.left}%`, top: `${hoverState.top}%` }}
          >
            <div>{hoverState.label}</div>
            {hoverState.image ? <img src={hoverState.image} alt="" className="zone-minimap-tooltip-image" /> : null}
          </div>
        ) : null}
      </div>
  );
}
