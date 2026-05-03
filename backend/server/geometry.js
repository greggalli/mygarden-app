function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isPointGeometry(geometry) {
  return geometry?.type === "Point"
    && Array.isArray(geometry.coordinates)
    && geometry.coordinates.length === 2
    && isFiniteNumber(geometry.coordinates[0])
    && isFiniteNumber(geometry.coordinates[1]);
}

function isPolygonGeometry(geometry) {
  if (geometry?.type !== "Polygon" || !Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
    return false;
  }
  const ring = geometry.coordinates[0];
  if (!Array.isArray(ring) || ring.length < 4) return false;
  if (!ring.every((point) => Array.isArray(point) && point.length === 2 && isFiniteNumber(point[0]) && isFiniteNumber(point[1]))) {
    return false;
  }
  const first = ring[0];
  const last = ring[ring.length - 1];
  return first[0] === last[0] && first[1] === last[1];
}

function pointInRing(point, ring) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]; const yi = ring[i][1];
    const xj = ring[j][0]; const yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y))
      && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygon(pointGeometry, polygonGeometry) {
  if (!isPointGeometry(pointGeometry) || !isPolygonGeometry(polygonGeometry)) return false;
  return pointInRing(pointGeometry.coordinates, polygonGeometry.coordinates[0]);
}

function polygonInsidePolygon(inner, outer) {
  if (!isPolygonGeometry(inner) || !isPolygonGeometry(outer)) return false;
  return inner.coordinates[0].every((pt) => pointInRing(pt, outer.coordinates[0]));
}

function toSvgPoint([x, y], width, height, viewBoxHeight) {
  const svgX = (x / width) * 100;
  const svgY = ((viewBoxHeight - y) / height) * 100;
  return [svgX, svgY];
}

module.exports = {
  isPointGeometry,
  isPolygonGeometry,
  pointInPolygon,
  polygonInsidePolygon,
  toSvgPoint
};
