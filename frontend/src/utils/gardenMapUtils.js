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

export function toSvgPoint(point, gardenHeight) {
  const [x, y] = point;
  return [x, gardenHeight - y];
}

export function polygonToSvgPoints(polygon, gardenHeight) {
  if (polygon?.type !== "Polygon" || !Array.isArray(polygon.coordinates?.[0])) return "";
  return polygon.coordinates[0].map((point) => {
    const [sx, sy] = toSvgPoint(point, gardenHeight);
    return `${sx},${sy}`;
  }).join(" ");
}

export function getZoneViewBox(zoneGeometry, gardenHeight, paddingRatio = 0.15) {
  const bbox = getPolygonBBox(zoneGeometry);
  if (!bbox) return null;
  const svgMinY = gardenHeight - bbox.maxY;
  const pad = Math.max(bbox.width, bbox.height) * paddingRatio || 1;
  return {
    bbox,
    svgMinX: bbox.minX,
    svgMinY,
    viewBox: [bbox.minX - pad, svgMinY - pad, bbox.width + pad * 2, bbox.height + pad * 2].join(" ")
  };
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
