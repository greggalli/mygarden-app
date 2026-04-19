# 🌿 MyGarden App

Application web de gestion de jardin (zones, espèces, plantations, tâches), migrée vers une persistance **serveur** adaptée à un NAS.

## Architecture actuelle

- Frontend: React (react-scripts) + React Router + CSS.
- Backend: API Node légère (`server/index.js`).
- Données structurées: SQLite (fichier persistant).
- Photos d'espèces: fichiers image sur disque (volume persistant).
- Export admin: JSON unique avec photos encodées en **Base64 data URLs**.

## Lancement local

```bash
npm install
npm run server
npm start
```

Frontend: `http://localhost:3000`

API: `http://localhost:4000`

## Variables d'environnement backend

- `PORT` (défaut: `4000`)
- `DATA_ROOT` (défaut: `/data`)
- `DB_PATH` (défaut: `${DATA_ROOT}/db/garden.sqlite`)
- `IMAGES_ROOT` (défaut: `${DATA_ROOT}/images`)

Par défaut:
- SQLite: `/data/db/garden.sqlite`
- Images espèces: `/data/images/species/`

## Endpoints API ajoutés

- `GET /api/bootstrap` — charge tout le dataset (species/zones/plantations/photos/tasks)
- `POST /api/species`
- `PUT /api/species/:id`
- `DELETE /api/species/:id`
- `POST /api/species/:id/photos?filename=...` (body binaire image)
- `DELETE /api/species/:speciesId/photos/:photoId`
- `POST /api/plantations`
- `PUT /api/plantations/:id`
- `DELETE /api/plantations/:id`
- `GET /api/admin/export` — export complet JSON (photos en Base64 data URL)
- `POST /api/admin/import` — restauration depuis JSON exporté

## Schéma de stockage

Tables SQLite:
- `species`
- `zones`
- `zone_geometries`
- `plantations`
- `species_photos`
- `tasks` (conservé pour compatibilité fonctionnelle existante)

`species_photos` ne stocke que des métadonnées et un `relative_path`.
Les fichiers image sont écrits sur disque dans `IMAGES_ROOT/species`.

## Export JSON (admin)

Format principal:

```json
{
  "version": 1,
  "exportedAt": "ISO_DATE",
  "data": {
    "species": [],
    "zones": [],
    "zoneGeometries": [],
    "plantations": [],
    "speciesPhotos": [
      {
        "id": 1,
        "speciesId": 1,
        "filename": "rose.jpg",
        "mimeType": "image/jpeg",
        "relativePath": "species/xxx.jpg",
        "dataUrl": "data:image/jpeg;base64,..."
      }
    ]
  }
}
```

## Déploiement Synology / Docker (principe)

Monter des volumes persistants, par exemple:

- `/volume1/docker/mygarden/db:/data/db`
- `/volume1/docker/mygarden/images:/data/images`

Cela garantit que:
- le fichier SQLite survit aux redéploiements,
- les photos uploadées survivent aux redéploiements.

Exemple compose minimal (API):

```yaml
services:
  mygarden-api:
    image: node:22
    working_dir: /app
    command: sh -c "npm ci && npm run server"
    ports:
      - "4000:4000"
    volumes:
      - ./:/app
      - /volume1/docker/mygarden/db:/data/db
      - /volume1/docker/mygarden/images:/data/images
```

> En production NAS, utilisez idéalement une image buildée dédiée (pas de `npm ci` au runtime).
