# Data Model

## Persistent storage (server-side)

The application now persists data on the backend using PostgreSQL and file storage for images.

### PostgreSQL tables

#### species
- id (PK)
- common_name
- scientific_name
- family
- pruning_period
- flowering_period
- care_tips
- notes
- external_links_json
- created_at
- updated_at

#### zones
- id (PK)
- name
- description
- created_at
- updated_at

#### zone_geometries
- id (PK)
- zone_id (FK -> zones.id)
- geometry_json
- created_at
- updated_at

#### plantations
- id (PK)
- species_id (FK -> species.id)
- zone_id (FK -> zones.id)
- planted_at
- quantity
- notes
- nickname
- position_json
- created_at
- updated_at

#### species_photos
- id (PK)
- species_id (FK -> species.id)
- filename
- original_filename
- mime_type
- relative_path
- size_bytes
- created_at
- sort_order

#### tasks (legacy compatibility)
- id (PK)
- plant_instance_id
- zone_id
- due_date
- action
- status
- notes
- created_at
- updated_at

## Image storage

- Photos are stored as files under `IMAGES_ROOT/species/`.
- Database rows only keep metadata and relative path (`relative_path`).
- Export embeds images as Base64 data URLs in JSON backups.
