import React from "react";
import { NavLink } from "react-router-dom";

export default function Header() {
  return (
    <header className="header">
      <h1 className="app-title">🌿 MyGarden</h1>
      <nav>
        <NavLink to="/zones" className="nav-item">Jardin</NavLink>
        <NavLink to="/schedule" className="nav-item">Planning</NavLink>
        <NavLink to="/add-plant" className="nav-item">➕ Nouvelle plante</NavLink>
      </nav>
    </header>
  );
}
