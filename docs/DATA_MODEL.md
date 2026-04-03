# 🧩 MyGarden App – Modèle de données

## Zones
- id, name, description, bbox, color
## Espèces
- id, common_name, scientific_name, sun_exposure, water_need, care_notes, photo_url
## Instances
- id, species_id, zone_id, nickname, planting_date, notes, position
## Tâches
- id, plant_id, type, date, status, notes

Relations :
- species (1) < instances (n)
- zones (1) < instances (n)
- instances (1) < tasks (n)
