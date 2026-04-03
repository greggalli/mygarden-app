// src/pages/SpeciesListPage.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGardenData } from "../data/GardenDataContext";

export default function SpeciesListPage() {
  const { data, deleteSpecies } = useGardenData();
  const { species, instances, zones } = data;
  const navigate = useNavigate();

  // 🔎 Filtres
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [familyFilter, setFamilyFilter] = useState("all");

  // Index zones par id
  const zonesById = useMemo(() => {
    const m = new Map();
    for (const z of zones) m.set(z.id, z);
    return m;
  }, [zones]);

  // Nombre de plantations + zones par espèce
  const speciesStats = useMemo(() => {
    const countMap = new Map(); // speciesId -> count
    const zoneMap = new Map();  // speciesId -> Set(zoneId)

    for (const inst of instances) {
      const spId = inst.species_id;
      countMap.set(spId, (countMap.get(spId) || 0) + 1);

      const zSet = zoneMap.get(spId) || new Set();
      zSet.add(inst.zone_id);
      zoneMap.set(spId, zSet);
    }

    return { countMap, zoneMap };
  }, [instances]);

  // Liste des familles distinctes
  const families = useMemo(() => {
    const set = new Set();
    for (const sp of species) {
      if (sp.family && sp.family.trim()) {
        set.add(sp.family.trim());
      }
    }
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, "fr", { sensitivity: "base" })
    );
  }, [species]);

  // Enrichir les espèces avec stats
  const enrichedSpecies = useMemo(() => {
    const { countMap, zoneMap } = speciesStats;

    return species.map((sp) => {
      const count = countMap.get(sp.id) || 0;
      const zoneSet = zoneMap.get(sp.id) || new Set();

      const zoneNames = Array.from(zoneSet)
        .map((zId) => zonesById.get(zId)?.name)
        .filter(Boolean)
        .sort((a, b) =>
          a.localeCompare(b, "fr", { sensitivity: "base" })
        );

      return {
        ...sp,
        instanceCount: count,
        zoneNames
      };
    });
  }, [species, speciesStats, zonesById]);

  // Appliquer filtres + recherche
  const filteredSpecies = useMemo(() => {
    let list = [...enrichedSpecies];

    if (zoneFilter !== "all") {
      const zId = Number(zoneFilter);
      list = list.filter((sp) =>
        sp.zoneNames.some(
          (name) => zonesById.get(zId)?.name === name
        )
      );
    }

    if (familyFilter !== "all") {
      list = list.filter(
        (sp) => (sp.family || "").trim() === familyFilter
      );
    }

    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter((sp) => {
        const common = sp.common_name?.toLowerCase() || "";
        const sci = sp.scientific_name?.toLowerCase() || "";
        const family = sp.family?.toLowerCase() || "";
        return (
          common.includes(term) ||
          sci.includes(term) ||
          family.includes(term)
        );
      });
    }

    // Tri par nom commun
    list.sort((a, b) =>
      a.common_name.localeCompare(b.common_name, "fr", {
        sensitivity: "base"
      })
    );

    return list;
  }, [enrichedSpecies, zoneFilter, familyFilter, search, zonesById]);

  const totalSpecies = species.length;
  const totalInstances = instances.length;

  // Suppression rapide
  const handleQuickDelete = (e, sp) => {
    e.stopPropagation(); // ne pas naviguer vers le détail
    if (sp.instanceCount > 0) {
      alert(
        `Impossible de supprimer "${sp.common_name}" : il existe encore ${sp.instanceCount} plantation(s) associée(s).`
      );
      return;
    }
    const ok = window.confirm(
      `Supprimer définitivement l'espèce "${sp.common_name}" ?`
    );
    if (!ok) return;
    deleteSpecies(sp.id);
  };

  return (
    <div className="species-page">
      {/* En-tête + stats */}
      <div className="species-header">
        <div className="species-header-main">
          <h2 className="section-title">Espèces</h2>
          <div className="species-stats">
            <span>
              {totalSpecies} espèce
              {totalSpecies > 1 ? "s" : ""}
            </span>
            <span>•</span>
            <span>
              {totalInstances} plantation
              {totalInstances > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Filtres */}
        <div className="species-filters">
          <input
            type="text"
            className="species-search"
            placeholder="Rechercher (nom, nom scientifique, famille)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="species-filter-select"
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
            className="species-filter-select"
            value={familyFilter}
            onChange={(e) => setFamilyFilter(e.target.value)}
          >
            <option value="all">Toutes les familles</option>
            {families.map((fam) => (
              <option key={fam} value={fam}>
                {fam}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste compacte des espèces */}
      <div className="species-list">
        {filteredSpecies.length === 0 ? (
          <div className="species-empty">
            Aucune espèce ne correspond à ces filtres.
          </div>
        ) : (
          filteredSpecies.map((sp) => (
            <article
              key={sp.id}
              className="species-row species-row-clickable"
              onClick={() => navigate(`/species/${sp.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/species/${sp.id}`);
                }
              }}
              tabIndex={0}
            >
              {/* Ligne 1 : nom + famille + stats */}
              <div className="species-row-line1">
                <span className="species-row-name">
                  <b>{sp.common_name}</b>
                </span>
                {sp.scientific_name && (
                  <span className="species-row-sci">
                    {sp.scientific_name}
                  </span>
                )}
                {sp.family && (
                  <span className="species-row-family">
                    ({sp.family})
                  </span>
                )}

                <span className="species-row-count">
                  {sp.instanceCount} plantation
                  {sp.instanceCount > 1 ? "s" : ""}
                </span>

                {sp.zoneNames.length > 0 && (
                  <span className="species-row-zones">
                    Zones : {sp.zoneNames.join(", ")}
                  </span>
                )}
              </div>

              {/* Ligne 2 : périodes */}
              <div className="species-row-line2">
                <span>
                  🌿 Taille :{" "}
                  {sp.pruning_period ? (
                    sp.pruning_period
                  ) : (
                    <span className="muted">non renseignée</span>
                  )}
                </span>
                <span>
                  🌸 Floraison :{" "}
                  {sp.flowering_period ? (
                    sp.flowering_period
                  ) : (
                    <span className="muted">non renseignée</span>
                  )}
                </span>
              </div>

              {/* Actions (sur une "3e" zone visuelle, à droite) */}
              <div
                className="species-row-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="btn-secondary"
                  onClick={() =>
                    navigate(`/add-plant?speciesId=${sp.id}`)
                  }
                >
                  ➕ Ajouter une plantation
                </button>
                <button
                  className="btn-icon-danger"
                  title="Supprimer l'espèce"
                  onClick={(e) => handleQuickDelete(e, sp)}
                >
                  🗑️
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
