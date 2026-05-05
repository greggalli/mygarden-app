const test = require('node:test');
const assert = require('node:assert/strict');

const utilsPromise = import('../../../frontend/src/utils/gardenMapUtils.js');

const validPolygon = { type: 'Polygon', coordinates: [[[0,0],[30,0],[30,20],[0,20],[0,0]]] };

test('parseGeometry parses stringified geometry', async () => {
  const { parseGeometry } = await utilsPromise;
  assert.deepEqual(parseGeometry(JSON.stringify(validPolygon)), validPolygon);
});

test('resolveGardenDimensions derives width/height from geometry', async () => {
  const { resolveGardenDimensions } = await utilsPromise;
  const result = resolveGardenDimensions({}, validPolygon);
  assert.equal(result.resolvedWidth, 30);
  assert.equal(result.resolvedHeight, 20);
});

test('resolveGardenDimensions prefers explicit width/height', async () => {
  const { resolveGardenDimensions } = await utilsPromise;
  const result = resolveGardenDimensions({ width: 50, height: 10 }, validPolygon);
  assert.equal(result.resolvedWidth, 50);
  assert.equal(result.resolvedHeight, 10);
});


test('parseGeometry returns null for invalid JSON string', async () => {
  const { parseGeometry } = await utilsPromise;
  assert.equal(parseGeometry('{invalid'), null);
});

test('resolveGardenDimensions returns zero when geometry invalid and no explicit dimensions', async () => {
  const { resolveGardenDimensions } = await utilsPromise;
  const result = resolveGardenDimensions({}, null);
  assert.equal(result.resolvedWidth, 0);
  assert.equal(result.resolvedHeight, 0);
});
