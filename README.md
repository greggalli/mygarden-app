# 🌿 MyGarden App

Application web pour la gestion de jardin personnel : zones, espèces, plantations et entretien.

---

## 📘 Documentation

Tous les fichiers de documentation se trouvent dans le dossier [`/docs`](./docs/).

| Fichier | Description |
|----------|--------------|
| [BACKLOG.md](./docs/BACKLOG.md) | Vision, roadmap et priorités |
| [DATA_MODEL.md](./docs/DATA_MODEL.md) | Modèle de données du projet |
| [UI_GUIDE.md](./docs/UI_GUIDE.md) | Guide d'interface et navigation |
| [DEV_GUIDE.md](./docs/DEV_GUIDE.md) | Guide de développement et conventions |
| [TODO_NEXT.md](./docs/TODO_NEXT.md) | Liste des actions court terme |

---

## 🧩 Stack technique

- **React + Vite**
- **React Router**
- **CSS pur**
- **Persistance locale via IndexedDB**
- **Aucune dépendance serveur**

---

## 🚀 Installation

```bash
git clone <repo-url>
cd mygarden-app
npm install
npm start
```

Accéder à l'application : [http://localhost:3000](http://localhost:3000)

---

## 📁 Structure du projet

```
src/
├── App.jsx
├── db/
│   ├── indexedDb.js
│   └── stores.js
├── repositories/
│   ├── speciesRepository.js
│   ├── zonesRepository.js
│   ├── plantationsRepository.js
│   └── tasksRepository.js
├── services/
│   ├── persistenceService.js
│   └── backupService.js
├── data/
│   ├── GardenDataContext.jsx
│   ├── zones.json
│   ├── species.json
│   ├── instances.json
│   └── tasks.json
├── components/
├── pages/
└── styles.css
```

---

## 💾 Persistance locale (IndexedDB)

- L'application initialise la base IndexedDB `mygarden-db` au démarrage via `initializePersistence()`.
- Au premier lancement, les données JSON de `src/data/*.json` sont injectées dans les object stores.
- Les stores utilisés sont :
  - `zones`
  - `species` (avec index `by_family`)
  - `speciesPhotos` (avec index `by_speciesId`)
  - `plantations` (avec index `by_speciesId` et `by_zoneId`)
  - `tasks`
- Le `GardenDataContext` ne manipule plus directement le stockage navigateur : les opérations CRUD passent par les repositories et services.

## 🔁 Backup / Restore JSON

- Depuis la page **Admin** (`/admin`) :
  - **Export JSON** : exporte toutes les données dans un fichier unique `mygarden-backup-YYYY-MM-DD.json`.
  - **Import JSON** : lit un fichier de backup, valide sa structure puis remplace les données locales après confirmation.
- Format de sauvegarde (`version: 1`) :

```json
{
  "version": 1,
  "exportedAt": "ISO_DATE",
  "data": {
    "zones": [],
    "species": [],
    "plantations": [],
    "tasks": [],
    "speciesPhotos": [
      {
        "id": "species-photo-2-a1b2c3",
        "speciesId": 2,
        "filename": "rose.jpg",
        "mimeType": "image/jpeg",
        "dataUrl": "data:image/jpeg;base64,..."
      }
    ]
  }
}
```

- Gestion des photos d'espèces :
  - création / édition d'espèce : import depuis le sélecteur de fichiers navigateur (`jpg`, `jpeg`, `png`, `webp`, sélection multiple).
  - persistance locale : chaque photo est stockée dans `speciesPhotos` avec métadonnées (`filename`, `mimeType`, `size`, `sortOrder`) et `imageData` (data URL).
  - export : chaque photo est sérialisée dans `data.speciesPhotos` avec `dataUrl` Base64.
  - import : les photos exportées sont restaurées dans le store `speciesPhotos` (compatible avec l'ancien champ `data.images`).
- Flux d'import sécurisé :
  1. sélection du fichier
  2. confirmation utilisateur
  3. parsing JSON
  4. validation de structure + images
  5. transformation des images
  6. remplacement complet des stores IndexedDB

## ⚠️ Limites / compatibilité

- IndexedDB dépend du navigateur (effacement possible si l'utilisateur purge les données de site).
- Le backup est volontairement simple et mono-utilisateur (pas de fusion de datasets).
- Les anciennes photos référencées par URL restent supportées ; si elles ne sont pas accessibles (CORS/404), l'export ajoute un warning.
- Le format JSON est versionné (`version: 1`) pour préparer de futures évolutions.

---

## 🌱 Objectif

> Fournir une interface simple et visuelle pour gérer un jardin personnel :
> suivre les plantes, leurs zones, leurs besoins et les tâches d’entretien, 
> dans une application 100% locale et portable.

---

## 🧭 Licence

MIT © 2025 – MyGarden App
