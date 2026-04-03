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
- **Stockage local (`localStorage`)**
- **Aucune dépendance serveur**

---

## 🚀 Installation

```bash
git clone <repo-url>
cd mygarden-app
npm install
npm run dev
```

Accéder à l'application : [http://localhost:5173](http://localhost:5173)

---

## 📁 Structure du projet

```
src/
├── App.jsx
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

## 🌱 Objectif

> Fournir une interface simple et visuelle pour gérer un jardin personnel :
> suivre les plantes, leurs zones, leurs besoins et les tâches d’entretien, 
> dans une application 100% locale et portable.

---

## 🧭 Licence

MIT © 2025 – MyGarden App
