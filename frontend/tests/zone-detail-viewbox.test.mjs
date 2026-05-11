import test from 'node:test';
import assert from 'node:assert/strict';
import { computeZoneDetailViewBoxFromBBox } from '../src/utils/gardenMapUtils.js';

test('wide bbox keeps wide ratio (~4)', () => {
  const vb = computeZoneDetailViewBoxFromBBox({ minX: 0, maxX: 20, minY: 0, maxY: 5 });
  assert.equal(vb.svgBBox.width / vb.svgBBox.height, 4);
  assert.ok(vb.ratio > 2.6 && vb.ratio < 2.7);
});

test('tall bbox keeps tall ratio (~0.25)', () => {
  const vb = computeZoneDetailViewBoxFromBBox({ minX: 0, maxX: 5, minY: 0, maxY: 20 });
  assert.equal(vb.svgBBox.width / vb.svgBBox.height, 0.25);
  assert.ok(vb.ratio > 0.37 && vb.ratio < 0.38);
});

test('viewBox is not forced square for non-square bbox', () => {
  const vb = computeZoneDetailViewBoxFromBBox({ minX: 1, maxX: 9, minY: 2, maxY: 5 });
  assert.notEqual(Number(vb.width.toFixed(6)), Number(vb.height.toFixed(6)));
});
