export function parseGeometry(value) {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

export function getPolygonBBox(polygon) {
  const ring = polygon?.coordinates?.[0] ?? [];
  const xs = ring.map(([x]) => x).filter(Number.isFinite);
  const ys = ring.map(([, y]) => y).filter(Number.isFinite);
  if (!xs.length || !ys.length) return null;
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
}

export function resolveGardenDimensions(gardenMap, geometry) {
  const bbox = getPolygonBBox(geometry);
  const width = Number(gardenMap?.width);
  const height = Number(gardenMap?.height);
  const resolvedWidth = Number.isFinite(width) && width > 0 ? width : (bbox?.width || 0);
  const resolvedHeight = Number.isFinite(height) && height > 0 ? height : (bbox?.height || 0);
  return { width, height, resolvedWidth, resolvedHeight, bbox };
}
