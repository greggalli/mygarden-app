# MyGarden App

## Runtime model
- Frontend: Vite (`http://localhost:5173`)
- Backend: Node (`http://localhost:3000`)
- Database: PostgreSQL (SQLite removed)
- Images: file-based on disk (`data/images/` by default)

## Required backend env vars
Use either:
- `DATABASE_URL` (recommended), e.g. `postgresql://user:password@host:5432/mygarden_app`

Or separate vars:
- `POSTGRES_HOST`
- `POSTGRES_PORT` (default `5432`)
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

Also supported:
- `PORT` (default `3000`)
- `IMAGE_DIR` (default `../data/images`)
- `CORS_ORIGIN` (default `*`)

## Backend `.env` example
```env
PORT=3000
DATABASE_URL=postgresql://mygarden_app_user:change-me@127.0.0.1:5432/mygarden_app
IMAGE_DIR=../data/images
CORS_ORIGIN=http://localhost:5173
```

## Setup
```bash
npm install --prefix backend
npm install --prefix frontend
npm run dev
```

## Schema/init
- Schema is initialized automatically on backend startup.
- Seed data is inserted only when `species` table is empty.

## DB connectivity check
```bash
DATABASE_URL=postgresql://... npm run dev:backend
```
If DB config is missing or incomplete, backend exits with a clear error.

## Notes
- Images are still stored on disk, not in PostgreSQL.
- Existing API/features are preserved while replacing SQLite with PostgreSQL.
