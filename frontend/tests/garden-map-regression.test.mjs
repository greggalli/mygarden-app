import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const mapCanvas = fs.readFileSync(new URL('../src/components/GardenMapCanvas.jsx', import.meta.url), 'utf8');
const zoneMiniMap = fs.readFileSync(new URL('../src/components/ZoneMiniMap.jsx', import.meta.url), 'utf8');
const mapPage = fs.readFileSync(new URL('../src/pages/MapPage.jsx', import.meta.url), 'utf8');
const zoneDetailPage = fs.readFileSync(new URL('../src/pages/ZoneDetailPage.jsx', import.meta.url), 'utf8');

test('main map keeps boundary + zones + plant markers rendering contract', () => {
  assert.match(mapCanvas, /<svg viewBox=/);
  assert.match(mapCanvas, /<polygon points=\{polygonPoints\(geometry/);
  assert.match(mapCanvas, /\{zones\.map\(/);
  assert.match(mapCanvas, /\{plantations\.map\(/);
});

test('plant marker visual remains dedicated marker and not plain oversized debug circle', () => {
  assert.match(mapCanvas, /return <circle key=\{p\.id\}[^>]*r=\{debug \? "4" : "1\.1"\} fill="green"/s);
});

test('zone mini-map keeps hover tooltip/preview behavior', () => {
  assert.match(zoneMiniMap, /onMouseEnter=\{\(\) => \{/);
  assert.match(zoneMiniMap, /setHoverState\(\{[\s\S]*type: "plant"/);
  assert.match(zoneMiniMap, /\{hoverState \? \(/);
  assert.match(zoneMiniMap, /zone-minimap-tooltip-image/);
});

test('existing click behavior remains wired in page + minimap', () => {
  assert.match(mapPage, /onZoneClick=\{\(zone\) => navigate\(`\/zones\/\$\{zone\.id\}`\)\}/);
  assert.match(mapPage, /onPlantationClick=\{\(p\) => navigate\(`\/plants\/\$\{p\.id\}`\)\}/);
  assert.match(zoneMiniMap, /navigate\(`\/plants\/\$\{plantInstance\.id\}`\)/);
  assert.match(zoneMiniMap, /window\.confirm\("Créer une nouvelle plantation \?"\)/);
  assert.match(zoneMiniMap, /navigate\(`\/add-plant\?\$\{params\.toString\(\)\}`\)/);
  assert.match(zoneDetailPage, /onClick=\{\(\) => navigate\(`\/plants\/\$\{inst\.id\}`\)\}/);
});
