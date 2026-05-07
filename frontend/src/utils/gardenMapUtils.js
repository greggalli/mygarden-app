import { pointInPolygon } from "./geojson";
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

export function fromSvgPoint(point, gardenHeight) {
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

export function pointToSvgCircle(point, gardenHeight) {
  const [cx, cy] = toSvgPoint(point, gardenHeight);
  return { cx, cy };
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

export function getSvgBBoxForLocalBBox(bbox, gardenHeight) {
  if (!bbox) return null;
  return {
    x: bbox.minX,
    y: gardenHeight - bbox.maxY,
    width: bbox.width,
    height: bbox.height
  };
}

export function getFittedViewBoxForZone(zonePolygon, gardenHeight, paddingRatio = 0.15) {
  const bbox = getPolygonBBox(zonePolygon);
  if (!bbox) return null;
  const pad = Math.max(bbox.width, bbox.height) * paddingRatio || 1;
  const svgBBox = getSvgBBoxForLocalBBox(bbox, gardenHeight);
  return [svgBBox.x - pad, svgBBox.y - pad, svgBBox.width + (pad * 2), svgBBox.height + (pad * 2)].join(" ");
}

export function resolveGardenDimensions(gardenMap, geometry) {
  const bbox = getPolygonBBox(geometry);
  const width = Number(gardenMap?.width);
  const height = Number(gardenMap?.height);
  const resolvedWidth = Number.isFinite(width) && width > 0 ? width : (bbox?.width || 0);
  const resolvedHeight = Number.isFinite(height) && height > 0 ? height : (bbox?.height || 0);
  return { width, height, resolvedWidth, resolvedHeight, bbox };
}

export function svgPointerEventToLocalPoint(event, svg, gardenHeight) {
  if (!svg) return null;
  const pt = svg.createSVGPoint();
  pt.x = event.clientX;
  pt.y = event.clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const svgPoint = pt.matrixTransform(ctm.inverse());
  return fromSvgPoint([svgPoint.x, svgPoint.y], gardenHeight);
}

export function markerUnitsFromPixels(svg, viewBox, px) {
  if (!svg) return px;
  const rect = svg.getBoundingClientRect();
  if (!rect.width || !viewBox?.width) return px;
  return (px / rect.width) * viewBox.width;
}

export function findZoneContainingPoint(point, zones = []) {
  const geoPoint = { type: "Point", coordinates: point };
  const matches = zones.filter((zone) => pointInPolygon(geoPoint, parseGeometry(zone.geometry)));
  return matches[0] ?? null;
}
