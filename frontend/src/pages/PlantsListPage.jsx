// src/pages/PlantsListPage.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGardenData } from "../data/GardenDataContext";
import HoverPreviewImage from "../components/HoverPreviewImage";

function formatPlantingDate(dateString) {
  if (!dateString) return "";
  const parsed = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateString;
  return parsed.toLocaleDateString("fr-FR");
}

export default function PlantsListPage() {
  const navigate = useNavigate();
  const { data, deletePlantInstance } = useGardenData();
  const { instances, species, zones } = data;

  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [sortBy, setSortBy] = useState("zone"); // "zone" | "species" | "date-desc"

  const speciesById = useMemo(() => {
    const m = new Map();
    for (const sp of species) m.set(sp.id, sp);
    return m;
  }, [species]);

  const zonesById = useMemo(() => {
    const m = new Map();
    for (const z of zones) m.set(z.id, z);
    return m;
  }, [zones]);

  const distinctSpeciesCount = useMemo(
    () => new Set(instances.map((inst) => inst.species_id)).size,
    [instances]
  );

  const enriched = useMemo(
    () =>
      instances.map((inst) => ({
        ...inst,
        _species: speciesById.get(inst.species_id),
        _zone: zonesById.get(inst.zone_id)
      })),
    [instances, speciesById, zonesById]
  );

  const filteredAndSorted = useMemo(() => {
    let list = [...enriched];

    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter((row) => {
        const nickname = row.nickname?.toLowerCase() || "";
        const common = row._species?.common_name?.toLowerCase() || "";
        const scientific =
          row._species?.scientific_name?.toLowerCase() || "";
        return (
          nickname.includes(term) ||
          common.includes(term) ||
          scientific.includes(term)
        );
      });
    }

    if (zoneFilter !== "all") {
      const zId = Number(zoneFilter);
      list = list.filter((row) => row.zone_id === zId);
    }

    if (speciesFilter !== "all") {
      const spId = Number(speciesFilter);
      list = list.filter((row) => row.species_id === spId);
    }

    if (sortBy === "zone") {
      list.sort((a, b) => {
        const za = a._zone?.name || "";
        const zb = b._zone?.name || "";
        const cmpZone = za.localeCompare(zb, "fr", { sensitivity: "base" });
        if (cmpZone !== 0) return cmpZone;
        return a.nickname.localeCompare(b.nickname, "fr", {
          sensitivity: "base"
        });
      });
    } else if (sortBy === "species") {
      list.sort((a, b) => {
        const sa = a._species?.common_name || "";
        const sb = b._species?.common_name || "";
        const cmpSp = sa.localeCompare(sb, "fr", { sensitivity: "base" });
        if (cmpSp !== 0) return cmpSp;
        return a.nickname.localeCompare(b.nickname, "fr", {
          sensitivity: "base"
        });
      });
    } else if (sortBy === "date-desc") {
      list.sort((a, b) => {
        const da = a.planting_date || "";
        const db = b.planting_date || "";
        if (da === db) {
          return a.nickname.localeCompare(b.nickname, "fr", {
            sensitivity: "base"
          });
        }
        return db.localeCompare(da);
      });
    }

    return list;
  }, [enriched, search, zoneFilter, speciesFilter, sortBy]);

  const handleQuickDelete = async (e, row) => {
    e.stopPropagation(); // ne pas faire naviguer vers la fiche
    const ok = window.confirm(
      `Supprimer définitivement la plantation "${row.nickname}" ?`
    );
    if (!ok) return;
    await deletePlantInstance(row.id);
  };

  return (
    <div className="plants-page">
      <div className="plants-header">
        <div className="plants-header-main">
          <div className="plants-title-row">
            <h2 className="section-title">Plantations</h2>
            <button
              type="button"
              className="btn-secondary plants-add-button"
              onClick={() => navigate("/add-plant")}
            >
              Ajouter une plantation
            </button>
          </div>
          <div className="plants-stats">
            <span>
              {instances.length} plante
              {instances.length > 1 ? "s" : ""}
            </span>
            <span>•</span>
            <span>
              {distinctSpeciesCount} espèce
              {distinctSpeciesCount > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="plants-filters">
          <input
            type="text"
            className="plants-search"
            placeholder="Rechercher par plante ou espèce..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="plants-filter-select"
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
          >
            <option value="all">Toutes les zones</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>

          <select
            className="plants-filter-select"
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value)}
          >
            <option value="all">Toutes les espèces</option>
            {species.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.common_name}
              </option>
            ))}
          </select>

          <select
            className="plants-filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="zone">Trier par zone</option>
            <option value="species">Trier par espèce</option>
            <option value="date-desc">
              Trier par date de plantation (récent → ancien)
            </option>
          </select>
        </div>
      </div>

      <div className="instance-list">
        {filteredAndSorted.length === 0 ? (
          <div className="instance-empty">
            Aucune plantation ne correspond à ces filtres.
          </div>
        ) : (
          filteredAndSorted.map((row) => (
            <article
              key={row.id}
              className="instance-row instance-row-compact instance-row-clickable"
              onClick={() => navigate(`/plants/${row.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/plants/${row.id}`);
                }
              }}
              tabIndex={0}
            >
              <div className="instance-row-thumb-wrap" aria-hidden="true">
                {row._species?.photos?.[0] ? (
                  <HoverPreviewImage
                    src={row._species.photos[0]}
                    alt={row._species?.common_name || "Photo espèce"}
                    className="instance-row-thumb species-thumb-hover-wrap"
                    previewClassName="thumb-hover-preview"
                  />
                ) : (
                  <div className="instance-row-thumb instance-row-thumb-fallback">
                    🌿
                  </div>
                )}
              </div>

              <div className="instance-row-line1">
                <span className="instance-nickname">
                  <b>{row.nickname}</b>
                </span>
                {row._species && (
                  <span className="instance-species">
                    {row._species.common_name}
                  </span>
                )}
              </div>

              <div className="instance-row-line2">
                <div className="instance-row-meta-left">
                  {row._zone && (
                    <span className="instance-zone">
                      📍 {row._zone.name}
                    </span>
                  )}
                  {row.planting_date && (
                    <span className="instance-date">
                      📅 Plantée le {formatPlantingDate(row.planting_date)}
                    </span>
                  )}
                </div>

                <div
                  className="instance-actions instance-row-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => navigate(`/plants/${row.id}/edit`)}
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    type="button"
                    className="btn-icon-danger"
                    title="Supprimer la plantation"
                    onClick={(e) => handleQuickDelete(e, row)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
