// src/App.jsx
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate
} from "react-router-dom";

import ZonesPage from "./pages/ZonesPage";
import ZoneDetailPage from "./pages/ZoneDetailPage";
import PlantsListPage from "./pages/PlantsListPage";
import PlantDetailPage from "./pages/PlantDetailPage";
import PlantEditPage from "./pages/PlantEditPage";
import SpeciesListPage from "./pages/SpeciesListPage";
import SpeciesDetailPage from "./pages/SpeciesDetailPage";
import SpeciesEditPage from "./pages/SpeciesEditPage";
import AddPlantPage from "./pages/AddPlantPage";
import SchedulePage from "./pages/SchedulePage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <header className="header">
          <h1 className="app-title">🌿 MyGarden App</h1>
          <nav>
            <NavLink to="/zones" className="nav-item">
              Carte
            </NavLink>
            <NavLink to="/species" className="nav-item">
              Espèces
            </NavLink>
            <NavLink to="/plants" className="nav-item">
              Plantations
            </NavLink>
            <NavLink to="/add-plant" className="nav-item">
              Ajouter
            </NavLink>
            <NavLink to="/admin" className="nav-item">
              Admin
            </NavLink>
          </nav>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/zones" replace />} />

            {/* navigation par carte */}
            <Route path="/zones" element={<ZonesPage />} />
            <Route path="/zones/:zoneId" element={<ZoneDetailPage />} />

            {/* Espèces */}
            <Route path="/species" element={<SpeciesListPage />} />
            <Route path="/species/:speciesId" element={<SpeciesDetailPage />} />
            <Route path="/species/:speciesId/edit" element={<SpeciesEditPage />} />

            {/* Plantations */}
            <Route path="/plants" element={<PlantsListPage />} />
            <Route path="/plants/:plantId" element={<PlantDetailPage />} />
            <Route path="/plants/:plantId/edit" element={<PlantEditPage />} />

            {/* planning */}
            <Route path="/schedule" element={<SchedulePage />} />

            {/* ajout */}
            <Route path="/add-plant" element={<AddPlantPage />} />

            {/* admin (placeholder pour l'instant) */}
            <Route path="/admin" element={<div>Admin (à venir)</div>} />

            <Route path="*" element={<div>Page inconnue</div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
