import React from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import GardenMapCanvas from "../components/GardenMapCanvas";
import GardenMapErrorBoundary from "../components/GardenMapErrorBoundary";
import { useGardenData } from "../data/GardenDataContext";
import { getBBoxFromCoords, isGardenDebug, validatePointGeometry, validatePolygonGeometry } from "../utils/gardenDebug";

export default function MapPage() {
  const { data } = useGardenData();
  const navigate = useNavigate();
  const { zones, instances, gardenMap } = data;
  const debug = isGardenDebug();
  const [renderError, setRenderError] = React.useState(null);

  React.useEffect(() => {
    if (!debug) return;
    console.log("[GardenDebug] API response snapshot:", data);
    console.log("[GardenDebug] parsed garden:", gardenMap);
    console.log("[GardenDebug] parsed zones:", zones);
    console.log("[GardenDebug] parsed plantations:", instances);
    console.log("[GardenDebug] counts:", { zones: zones.length, plantations: instances.length });

    const gardenCheck = validatePolygonGeometry(gardenMap?.geometry, "garden");
    if (!gardenCheck.valid) console.error(gardenCheck.error, gardenMap?.geometry);
    else console.log("[GardenDebug] Garden BBox:", gardenCheck.bbox);

    if (!zones.length) console.warn("[GardenDebug] No zones found");
    if (!instances.length) console.warn("[GardenDebug] No plantations found");

    zones.forEach((zone) => {
      const check = validatePolygonGeometry(zone.geometry, `zone:${zone.id}`);
      if (!check.valid) console.error(check.error, zone.geometry);
      else console.log("[GardenDebug] Zone BBox:", { id: zone.id, bbox: check.bbox });
    });

    instances.forEach((plantation) => {
      const check = validatePointGeometry(plantation.position, `plantation:${plantation.id}`);
      if (!check.valid) console.error(check.error, plantation.position);
      else console.log("[GardenDebug] Plantation BBox:", { id: plantation.id, bbox: getBBoxFromCoords([plantation.position.coordinates]) });
    });
  }, [data, debug, gardenMap, instances, zones]);

  return (
    <div className="zones-page-2col">
      <div className="zones-left-col">
        <h2 className="section-title">Plan général du jardin</h2>
        <GardenMapErrorBoundary onError={setRenderError}>
          <GardenMapCanvas
            gardenMap={gardenMap}
            zones={zones}
            plantations={instances}
            onZoneClick={(zone) => navigate(`/zones/${zone.id}`)}
            onPlantationClick={(p) => navigate(`/plants/${p.id}`)}
          />
        </GardenMapErrorBoundary>
        {debug && (
          <div style={{ marginTop: 8, fontSize: 13, padding: 8, border: "1px solid #d00", borderRadius: 6, background: "rgba(255,255,255,0.9)" }}>
            <strong>Garden Debug</strong>
            <div>Zones: {zones.length}</div>
            <div>Plantations: {instances.length}</div>
            <div>Garden size: {Number(gardenMap?.width) || 0} x {Number(gardenMap?.height) || 0}</div>
            <div>Last error: {renderError ? String(renderError.message || renderError) : "none"}</div>
          </div>
        )}
      </div>

      <div className="zones-right-col">
        <div className="plants-title-row">
          <h2 className="section-title">Zones</h2>
          <Link to="/zones" className="btn-secondary">Gérer les zones</Link>
        </div>

        <div className="zones-list">
          {zones.map((zone) => (
            <Link key={zone.id} to={`/zones/${zone.id}`} className="zone-card zone-card-rich">
              <div className="zone-card-header">
                <h3>{zone.name}</h3>
              </div>
              <p className="zone-desc">{zone.description || "—"}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
