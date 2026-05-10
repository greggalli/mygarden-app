import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGardenData } from "../data/GardenDataContext";
import ZoneCard from "../components/ZoneCard";

export default function ZonesPage() {
  const navigate = useNavigate();
  const { data, deleteZone } = useGardenData();
  const { zones } = data;

  const totalZones = zones.length;
  const totalPlantations = useMemo(
    () => zones.reduce((sum, zone) => sum + (zone.planting_count ?? 0), 0),
    [zones]
  );

  const handleDelete = async (zone) => {
    const hasPlantings = (zone.planting_count || 0) > 0;
    if (hasPlantings) {
      alert("Suppression impossible : cette zone a des plantations liées.");
      return;
    }

    const ok = window.confirm(`Supprimer définitivement la zone \"${zone.name}\" ?`);
    if (!ok) return;

    try {
      await deleteZone(zone.id);
    } catch (error) {
      alert(error.message || "Suppression impossible.");
    }
  };

  return (
    <div className="species-page">
      <div className="species-header">
        <div className="species-header-main">
          <div className="plants-title-row">
            <h2 className="section-title">Gestion des zones</h2>
            <button
              type="button"
              className="btn-secondary plants-add-button"
              onClick={() => navigate("/zones/new")}
            >
              Ajouter une zone
            </button>
          </div>
          <div className="species-stats">
            <span>
              {totalZones} zone{totalZones > 1 ? "s" : ""}
            </span>
            <span>•</span>
            <span>
              {totalPlantations} plantation{totalPlantations > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="zones-list zones-list-management">
        {zones.length === 0 ? (
          <div className="species-empty">Aucune zone enregistrée.</div>
        ) : (
          zones.map((zone) => (
            <ZoneCard
              key={zone.id}
              zone={zone}
              onEdit={(zoneId) => navigate(`/zones/${zoneId}/edit`)}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
