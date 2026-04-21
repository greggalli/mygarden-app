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
import ZoneFormPage from "./pages/ZoneFormPage";
import MapPage from "./pages/MapPage";
import PlantsListPage from "./pages/PlantsListPage";
import PlantDetailPage from "./pages/PlantDetailPage";
import PlantEditPage from "./pages/PlantEditPage";
import SpeciesListPage from "./pages/SpeciesListPage";
import SpeciesDetailPage from "./pages/SpeciesDetailPage";
import SpeciesEditPage from "./pages/SpeciesEditPage";
import AddPlantPage from "./pages/AddPlantPage";
import SchedulePage from "./pages/SchedulePage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <header className="header">
          <h1 className="app-title">🌿 MyGarden App</h1>
          <nav>
            <NavLink to="/map" className="nav-item">
              Carte
            </NavLink>
            <NavLink to="/zones" className="nav-item">
              Zones
            </NavLink>
            <NavLink to="/species" className="nav-item">
              Espèces
            </NavLink>
            <NavLink to="/plants" className="nav-item">
              Plantations
            </NavLink>
            <NavLink to="/admin" className="nav-item">
              Admin
            </NavLink>
          </nav>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/map" replace />} />

            {/* navigation par carte */}
            <Route path="/map" element={<MapPage />} />
            <Route path="/zones" element={<ZonesPage />} />
            <Route path="/zones/new" element={<ZoneFormPage />} />
            <Route path="/zones/:zoneId" element={<ZoneDetailPage />} />
            <Route path="/zones/:zoneId/edit" element={<ZoneFormPage />} />

            {/* Espèces */}
            <Route path="/species" element={<SpeciesListPage />} />
            <Route path="/species/new" element={<SpeciesEditPage />} />
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

            {/* admin */}
            <Route path="/admin" element={<AdminPage />} />

            <Route path="*" element={<div>Page inconnue</div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
