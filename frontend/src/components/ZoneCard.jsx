// src/components/ZoneCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function ZoneCard({ zone, onEdit, onDelete }) {
  const navigate = useNavigate();
  const plantCount = zone.planting_count ?? 0;

  const openDetails = () => {
    navigate(`/zones/${zone.id}`);
  };

  return (
    <article
      className="zone-card zone-list-card species-row species-row-clickable"
      onClick={openDetails}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDetails();
        }
      }}
      tabIndex={0}
    >
      <div className="zone-list-line1 species-row-line1">
        <h3 className="zone-list-title">{zone.name}</h3>
        <span className="zone-list-title-meta">
          ({plantCount} plantation{plantCount > 1 ? "s" : ""})
        </span>
      </div>

      <div className="zone-list-line2 species-row-line2">
        <p className="zone-desc zone-list-description">{zone.description || "—"}</p>
        <div className="zone-list-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(zone.id);
            }}
          >
            Modifier
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(zone);
            }}
          >
            Supprimer
          </button>
        </div>
      </div>
    </article>
  );
}
