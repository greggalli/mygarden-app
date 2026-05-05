export const isGardenDebug = () =>
  process.env.NEXT_PUBLIC_GARDEN_DEBUG === "true" ||
  (typeof window !== "undefined" && window.localStorage.getItem("garden_debug") === "true");

const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);

export function getBBoxFromCoords(coords = []) {
  const points = [];
  const walk = (node) => {
    if (!Array.isArray(node)) return;
    if (node.length >= 2 && isFiniteNumber(node[0]) && isFiniteNumber(node[1])) {
      points.push([node[0], node[1]]);
      return;
    }
    node.forEach(walk);
  };
  walk(coords);
  if (!points.length) return null;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  points.forEach(([x, y]) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });
  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY, pointCount: points.length };
}

export function validatePolygonGeometry(geometry, label = "geometry") {
  if (!geometry || geometry.type !== "Polygon" || !Array.isArray(geometry.coordinates?.[0])) {
    return { valid: false, error: `[GardenDebug] Invalid ${label} geometry`, bbox: null, points: 0 };
  }
  const ring = geometry.coordinates[0];
  const valid = ring.every((pt) => Array.isArray(pt) && pt.length >= 2 && isFiniteNumber(pt[0]) && isFiniteNumber(pt[1]));
  return {
    valid,
    error: valid ? null : `[GardenDebug] Invalid polygon coordinates for ${label}`,
    bbox: getBBoxFromCoords(geometry.coordinates),
    points: ring.length
  };
}

export function validatePointGeometry(geometry, label = "point") {
  const valid = geometry?.type === "Point"
    && Array.isArray(geometry.coordinates)
    && geometry.coordinates.length >= 2
    && isFiniteNumber(geometry.coordinates[0])
    && isFiniteNumber(geometry.coordinates[1]);
  return {
    valid,
    error: valid ? null : `[GardenDebug] Invalid ${label} geometry`,
    bbox: valid ? getBBoxFromCoords([geometry.coordinates]) : null
  };
}
