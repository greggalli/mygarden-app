import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGardenData } from "../data/GardenDataContext";
import { isGardenDebug } from "../utils/gardenDebug";
import { getZoneViewBox, parseGeometry, polygonToSvgPoints, resolveGardenDimensions, toSvgPoint } from "../utils/gardenMapUtils";

export default function ZoneMiniMap({ zoneId, rotated = false, highlightedPlantId = null }) {
  const navigate = useNavigate();
  const { data } = useGardenData();
  const { zones, instances, species, gardenMap } = data;
  const zoneKey = String(zoneId);
  const zone = zones.find((z) => String(z.id) === zoneKey);
  const plantsInZone = instances.filter((inst) => String(inst.zone_id) === zoneKey);
  const debug = isGardenDebug();

  const gardenGeometry = parseGeometry(gardenMap?.geometry);
  const { resolvedWidth, resolvedHeight } = resolveGardenDimensions(gardenMap, gardenGeometry);
  const zoneGeometry = parseGeometry(zone?.geometry);

  const viewMeta = useMemo(() => getZoneViewBox(zoneGeometry, resolvedHeight), [zoneGeometry, resolvedHeight]);

  if (!zone || !zoneGeometry || !viewMeta) {
    return (
      <div className="zone-minimap-card">
        <div className="zone-minimap-inner zone-minimap-error">Zone introuvable</div>
      </div>
    );
  }

  const rotationTransform = rotated ? `rotate(90 ${resolvedWidth / 2} ${resolvedHeight / 2})` : undefined;

  return (
    <div className="zone-minimap-card">
      <div className={`zone-minimap-area zone-minimap-area-only ${rotated ? "zone-minimap-area-rotated" : ""}`}>
        <svg
          viewBox={viewMeta.viewBox}
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full"
          onClick={() => navigate(`/zones/${zone.id}/edit`)}
          style={{ cursor: "pointer" }}
        >
          <g transform={rotationTransform}>
            <polygon points={polygonToSvgPoints(gardenGeometry, resolvedHeight)} fill="rgba(34,197,94,0.05)" stroke="rgba(22,163,74,0.35)" strokeWidth="0.6" />
            <polygon points={polygonToSvgPoints(zoneGeometry, resolvedHeight)} fill="rgba(59,130,246,0.25)" stroke="rgb(30,64,175)" strokeWidth="0.8" />
            {plantsInZone.map((plantInstance) => {
              if (plantInstance.position?.type !== "Point") return null;
              const [x, y] = toSvgPoint(plantInstance.position.coordinates, resolvedHeight);
              const sp = species.find((s) => s.id === plantInstance.species_id);
              return (
                <circle
                  key={plantInstance.id}
                  cx={x}
                  cy={y}
                  r={highlightedPlantId === plantInstance.id ? "1.4" : "1"}
                  fill={highlightedPlantId === plantInstance.id ? "#c62828" : "#15803d"}
                  stroke="#ffffff"
                  strokeWidth="0.25"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(`/plants/${plantInstance.id}`);
                  }}
                >
                  <title>{`${plantInstance.nickname || sp?.common_name || "Plante"} (${plantInstance.position.coordinates.join(", ")})`}</title>
                </circle>
              );
            })}

            {debug && zoneGeometry.coordinates[0]?.map((pt, idx) => {
              const [vx, vy] = toSvgPoint(pt, resolvedHeight);
              return <circle key={`zone-v-${idx}`} cx={vx} cy={vy} r="0.7" fill="#1d4ed8" />;
            })}

            {debug && (
              <rect
                x={viewMeta.bbox.minX}
                y={resolvedHeight - viewMeta.bbox.maxY}
                width={viewMeta.bbox.width}
                height={viewMeta.bbox.height}
                fill="none"
                stroke="#f97316"
                strokeWidth="0.4"
                strokeDasharray="1 1"
              />
            )}
          </g>
        </svg>
      </div>

      {debug && (
        <pre style={{ marginTop: 8, fontSize: 12, overflowX: "auto" }}>
          {JSON.stringify({
            zoneCoordinates: zoneGeometry.coordinates?.[0],
            bbox: viewMeta.bbox,
            viewBox: viewMeta.viewBox,
            svgPoints: polygonToSvgPoints(zoneGeometry, resolvedHeight)
          }, null, 2)}
        </pre>
      )}
    </div>
  );
}
