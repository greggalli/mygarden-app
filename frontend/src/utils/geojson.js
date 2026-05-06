export function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function isGeoJsonPoint(geometry) {
  return geometry?.type === "Point"
    && Array.isArray(geometry.coordinates)
    && geometry.coordinates.length === 2
    && isFiniteNumber(geometry.coordinates[0])
    && isFiniteNumber(geometry.coordinates[1]);
}

export function isGeoJsonPolygon(geometry) {
  if (geometry?.type !== "Polygon" || !Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) return false;
  const ring = geometry.coordinates[0];
  return Array.isArray(ring) && ring.length >= 4;
}

export function pointInPolygon(point, polygon) {
  if (!isGeoJsonPoint(point) || !isGeoJsonPolygon(polygon)) return false;
  const [x, y] = point.coordinates;
  const ring = polygon.coordinates[0];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}
