import React, { useRef, useState } from "react";
import { useGardenData } from "../data/GardenDataContext";

export default function AdminPage() {
  const { exportDataBackup, importDataBackup } = useGardenData();
  const [status, setStatus] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const fileInputRef = useRef(null);

  const handleExport = async () => {
    setIsBusy(true);
    setStatus("");

    try {
      const result = await exportDataBackup();
      const warnings = result?.warnings || [];

      if (warnings.length > 0) {
        setStatus(`Sauvegarde exportée avec ${warnings.length} image(s) ignorée(s).`);
      } else {
        setStatus("Sauvegarde exportée avec succès.");
      }
    } catch (error) {
      setStatus(`Échec de l'export: ${error.message}`);
    } finally {
      setIsBusy(false);
    }
  };

  const handleSelectImportFile = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const confirmed = window.confirm(
      "L'import va remplacer toutes les données locales actuelles. Continuer ?"
    );

    if (!confirmed) {
      return;
    }

    setIsBusy(true);
    setStatus("");

    try {
      await importDataBackup(file);
      setStatus("Sauvegarde importée avec succès.");
    } catch (error) {
      setStatus(`Échec de l'import: ${error.message}`);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="species-page">
      <h2 className="section-title">Administration</h2>
      <p>Exportez une copie JSON complète ou restaurez une sauvegarde locale.</p>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button type="button" onClick={handleExport} disabled={isBusy}>
          Export JSON
        </button>

        <button type="button" onClick={handleSelectImportFile} disabled={isBusy}>
          Import JSON
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        onChange={handleImport}
        style={{ display: "none" }}
      />

      {status ? <p style={{ marginTop: "1rem" }}>{status}</p> : null}
    </div>
  );
}
