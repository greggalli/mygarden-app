# Garden map regression safety net (stable baseline)

This note documents the current stable behavior and the files that should be treated as regression-sensitive.

## Stable map components

- `src/pages/MapPage.jsx` renders the main garden map page and wires click navigation.
- `src/components/GardenMapCanvas.jsx` renders the SVG garden boundary, zone polygons, and plant markers.
- `src/pages/ZoneDetailPage.jsx` renders the zone detail layout and mounts the zone mini-map.
- `src/components/ZoneMiniMap.jsx` renders zone-level pins, hover tooltip/preview, and create-plant click flow.

## Interaction props and handlers to preserve

### Main map (`GardenMapCanvas`)
- `onZoneClick(zone)` is triggered when clicking a zone group.
- `onPlantationClick(plantation)` is triggered when clicking a plant marker.

### Zone detail mini-map (`ZoneMiniMap`)
- Plant pin hover sets tooltip state (`hoverState`) including label/image preview.
- Plant pin click navigates to `/plants/:id`.
- Map click (outside pin) asks confirmation and navigates to `/add-plant?...` when confirmed.

## Zone detail map status (documented, not fixed here)

- The zone detail view currently renders using a normalized zone bounding box and places pins relative to that box.
- Behavior is now covered by regression tests for existing hover/click/preview flows, but this task intentionally does not alter geometry or rendering logic.

## Files to treat carefully in future map changes

- `src/components/GardenMapCanvas.jsx`
- `src/pages/MapPage.jsx`
- `src/components/ZoneMiniMap.jsx`
- `src/pages/ZoneDetailPage.jsx`
- `src/styles.css` (map and minimap class rules)
