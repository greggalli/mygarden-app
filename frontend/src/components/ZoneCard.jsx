// src/components/ZoneCard.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function ZoneCard({ zone, plantCount }) {
  return (
    <Link
      to={`/zones/${zone.id}`}
      className="zone-card zone-card-rich"
      style={{ borderColor: zone.color }}
    >
      <div className="zone-card-header">
        <h3>{zone.name}</h3>
        <span className="zone-chip" style={{ backgroundColor: zone.color }}>
          {plantCount} plante{plantCount > 1 ? "s" : ""}
        </span>
      </div>

      <p className="zone-desc">{zone.description}</p>

      <div className="zone-extra">
        <div className="zone-extra-label">Coordonnées :</div>
        <div className="zone-extra-value">
          {zone.shape && zone.shape.length
            ? zone.shape
                .map((pt) => `(${pt.x_pct}%, ${pt.y_pct}%)`)
                .join(" • ")
            : "n/a"}
        </div>
      </div>
    </Link>
  );
}
