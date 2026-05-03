import React from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import GardenMapCanvas from "../components/GardenMapCanvas";
import { useGardenData } from "../data/GardenDataContext";

export default function MapPage() {
  const { data } = useGardenData();
  const navigate = useNavigate();
  const { zones, instances, gardenMap } = data;

  return (
    <div className="zones-page-2col">
      <div className="zones-left-col">
        <h2 className="section-title">Plan général du jardin</h2>
        <GardenMapCanvas
          gardenMap={gardenMap}
          zones={zones}
          plantations={instances}
          onZoneClick={(zone) => navigate(`/zones/${zone.id}`)}
          onPlantationClick={(p) => navigate(`/plants/${p.id}`)}
        />
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
