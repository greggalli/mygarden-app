const test = require('node:test');
const assert = require('node:assert/strict');
const { isPolygonGeometry, isPointGeometry, pointInPolygon, toSvgPoint } = require('../geometry');

test('validates polygon and point', () => {
  const polygon = { type: 'Polygon', coordinates: [[[0,0],[10,0],[10,10],[0,10],[0,0]]] };
  const point = { type: 'Point', coordinates: [5,5] };
  assert.equal(isPolygonGeometry(polygon), true);
  assert.equal(isPointGeometry(point), true);
  assert.equal(pointInPolygon(point, polygon), true);
});

test('converts local coords to svg coords with y inversion', () => {
  const [x, y] = toSvgPoint([25, 80], 100, 100, 100);
  assert.equal(x, 25);
  assert.equal(y, 20);
});
