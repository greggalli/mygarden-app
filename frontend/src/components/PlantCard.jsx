import React from "react";
import { Link } from "react-router-dom";

export default function PlantCard({ instance, species }) {
  return (
    <Link to={`/plants/${instance.id}`} className="plant-card">
      {species?.photo_url ? (
        <img src={species.photo_url} alt={species.common_name} className="plant-photo" />
      ) : (
        <div className="plant-photo-placeholder">🌱</div>
      )}
      <div className="plant-info">
        <h4>{instance.nickname}</h4>
        <p>{species?.common_name}</p>
        {instance.planting_date && (
          <p className="small-note">Plantée le {instance.planting_date}</p>
        )}
      </div>
    </Link>
  );
}
