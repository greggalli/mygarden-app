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
  - `plantations` (avec index `by_speciesId` et `by_zoneId`)
  - `tasks`
- Le `GardenDataContext` ne manipule plus directement le stockage navigateur : les opérations CRUD passent par les repositories et services.

## 🔁 Backup / Restore JSON

- Depuis la page **Admin** (`/admin`) :
  - **Export JSON** : exporte toutes les données (zones, species, instances, tasks) dans un fichier `mygarden-backup-YYYY-MM-DD.json`.
  - **Import JSON** : lit un fichier de backup, valide sa structure (`zones`, `species`, `instances`, `tasks`), puis remplace les données locales.
- Flux d'import sécurisé :
  1. sélection du fichier
  2. confirmation utilisateur
  3. parsing + validation
  4. remplacement complet des stores IndexedDB

## ⚠️ Limites / compatibilité

- IndexedDB dépend du navigateur (effacement possible si l'utilisateur purge les données de site).
- Le backup est volontairement simple et mono-utilisateur (pas de fusion de datasets).
- Le format JSON est versionné (`version: 1`) pour préparer de futures évolutions.

---

## 🌱 Objectif

> Fournir une interface simple et visuelle pour gérer un jardin personnel :
> suivre les plantes, leurs zones, leurs besoins et les tâches d’entretien, 
> dans une application 100% locale et portable.

---

## 🧭 Licence

MIT © 2025 – MyGarden App
