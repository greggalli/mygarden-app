# MyGarden App

MyGarden is now organized for **local development first** and easy migration to **NAS/container volumes later**.

## Repository structure

```text
project-root/
├─ frontend/            # React + Vite + React Router + CSS
├─ backend/             # lightweight Node API (CRUD + image upload)
├─ data/
│  ├─ db/               # SQLite file location (dev default)
│  └─ images/           # uploaded images location (dev default)
├─ docs/
└─ package.json         # convenience scripts
```

## Current runtime model

### Local development
- Frontend runs with Vite (`http://localhost:5173`)
- Backend runs locally (`http://localhost:3000`)
- SQLite DB file: `data/db/garden.sqlite`
- Uploaded images: `data/images/`

### Later on NAS/container
Change only environment variables:
- `DB_PATH`
- `IMAGE_DIR`
- `PORT` (optional)
- `CORS_ORIGIN` (optional)

No backend storage code rewrite is required.

## Environment variables

### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env` and adjust if needed.

- `PORT` (default: `3000`)
- `DB_PATH` (default: `../data/db/garden.sqlite`)
- `IMAGE_DIR` (default: `../data/images`)
- `CORS_ORIGIN` (default: `*`)

> Relative paths are resolved from the `backend/` directory.

### Frontend (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env` only if needed.

- `VITE_API_BASE_URL` (optional; default empty string to use dev proxy)
- `VITE_BACKEND_PROXY_TARGET` (optional; default `http://localhost:3000`)

## Local development setup

1. Install dependencies:

```bash
npm install --prefix backend
npm install --prefix frontend
```

2. Start frontend + backend together:

```bash
npm run dev
```

Or run separately:

```bash
npm run dev:backend
npm run dev:frontend
```

## Notes on persistence

- Backend creates missing storage directories on startup:
  - DB parent directory
  - image directory
  - species image subdirectory
- SQLite schema is initialized automatically.
- Seed data is inserted only when DB is empty.

## NAS/container migration example

Example backend env values for mounted volumes:

```env
PORT=3000
DB_PATH=/volume1/docker/mygarden/db/garden.sqlite
IMAGE_DIR=/volume1/docker/mygarden/images
CORS_ORIGIN=http://<your-frontend-host>
```

With this setup, container rebuilds do not lose database or uploaded images.
