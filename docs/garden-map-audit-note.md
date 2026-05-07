# Garden map audit (spec-first)

- Previous best visual/interaction behavior came from `GardenOverviewMap` (small pins, hover cards, lightweight overlays) but used absolute `%` overlays and not GeoJSON-true rendering.
- Current GeoJSON-correct shape rendering came from `GardenMapCanvas`/`ZoneMiniMap` using shared `[x,y] -> SVG` inversion.
- Main regressions were duplicated renderers, inconsistent marker sizing between views, and diverging interaction contracts (zone map vs global map).
- Refactor direction: keep one SVG engine (`GardenMapCanvas`) and centralize transforms/hit-testing in `gardenMapUtils.js`.
- Layering and interaction policy:
  1. background
  2. garden polygon
  3. zones
  4. labels
  5. plantations
  6. non-interactive hover overlays
