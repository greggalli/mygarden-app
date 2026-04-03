// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./styles-species.css";
import "./styles-plants.css";
import { GardenDataProvider } from "./data/GardenDataContext";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <GardenDataProvider>
      <App />
    </GardenDataProvider>
  </React.StrictMode>
);
