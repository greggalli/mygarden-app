import React from "react";
import GardenOverviewMap from "../components/GardenOverviewMap";
import ZoneCard from "../components/ZoneCard";
import { useGardenData } from "../data/GardenDataContext";

export default function ZonesPage() {
  const { data } = useGardenData();
  const { zones, instances } = data;

  const countPlantsInZone = (zoneId) =>
    instances.filter((inst) => inst.zone_id === zoneId).length;

  return (
    <div className="zones-page-2col">
      <div className="zones-left-col">
        <h2 className="section-title">Plan général du jardin</h2>
        <GardenOverviewMap />
      </div>

      <div className="zones-right-col">
        <h2 className="section-title">Zones du jardin</h2>
        <div className="zones-list">
          {zones.map((z) => (
            <ZoneCard
              key={z.id}
              zone={z}
              plantCount={countPlantsInZone(z.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
