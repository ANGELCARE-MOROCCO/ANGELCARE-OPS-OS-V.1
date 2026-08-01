import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const app = process.argv[2] || process.cwd()
const requireFromApp = createRequire(path.join(app, 'package.json'))
const ts = requireFromApp('typescript')

const files = {
  mapTsx: 'components/angelcare360/operator/sovereign-pulse/SovereignPulseCustomerMap.tsx',
  mapCss: 'components/angelcare360/operator/sovereign-pulse/SovereignPulseCustomerMap.module.css',
}

let checks = 0
const fail = (message) => { throw new Error(`FAIL: ${message}`) }
const pass = (message) => { checks += 1; console.log(`PASS  ${message}`) }
const read = (relative) => fs.readFileSync(path.join(app, relative), 'utf8')

for (const relative of Object.values(files)) {
  if (!fs.existsSync(path.join(app, relative))) fail(`missing ${relative}`)
  pass(`file exists: ${relative}`)
}

const mapTsx = read(files.mapTsx)
const mapCss = read(files.mapCss)

for (const marker of [
  'const [capturedNodes, setCapturedNodes]',
  'OSM SNAPSHOT',
  'refreshMapCapture',
  "fetch('/api/angelcare360/operator/sovereign-pulse'",
  "cache: 'no-store'",
  'setCapturedNodes(nextNodes)',
  'setCapturedAt(new Date(snapshot.generatedAt || Date.now()))',
  'fadeAnimation: false',
  'zoomAnimation: false',
  'markerZoomAnimation: false',
  'updateWhenZooming: false',
  'keepBuffer: 1',
  'map.setView(',
  'map.fitBounds(',
  'sameMapProps',
  'export default memo(SovereignPulseCustomerMap, sameMapProps)',
  'previous.onInspect === next.onInspect',
  "[tileUrl]",
  'SIGNAL',
  'Rafraîchir',
]) {
  if (!mapTsx.includes(marker)) fail(`single-capture runtime marker absent: ${marker}`)
  pass(`single-capture runtime marker: ${marker}`)
}

for (const forbidden of [
  'map.flyTo(',
  'map.flyToBounds(',
  'fadeAnimation: true',
  'zoomAnimation: true',
  'markerZoomAnimation: true',
  'ResizeObserver',
  'setInterval(',
  'OSM LIVE',
]) {
  if (mapTsx.includes(forbidden)) fail(`continuous-refresh marker remains: ${forbidden}`)
  pass(`continuous-refresh marker absent: ${forbidden}`)
}

for (const marker of [
  '.leaflet-tile) { transition: none !important; }',
  'grid-template-columns: repeat(3,1fr);',
  'animation: mapRadarPulse 2.7s ease-out 3;',
  'animation: mapOrbit 11s linear 1;',
  'animation: mapOrbit 4.8s linear 2;',
  'animation: mapGeoRadar 3.2s ease-in-out 3;',
  'animation: atmosphereDrift 16s ease-in-out 1 alternate;',
  'animation: mapScan 7s ease-in-out 1;',
  '.spin { animation: mapButtonSpin .8s linear infinite; }',
]) {
  if (!mapCss.includes(marker)) fail(`stable-map CSS marker absent: ${marker}`)
  pass(`stable-map CSS marker: ${marker}`)
}

const infiniteAnimations = [...mapCss.matchAll(/animation:[^;]*\binfinite\b/g)].map((match) => match[0])
if (infiniteAnimations.length !== 1 || !infiniteAnimations[0].includes('mapButtonSpin')) {
  fail(`unexpected permanent animations remain: ${infiniteAnimations.join(' | ') || 'none'}`)
}
pass('only the user-triggered refresh spinner may animate indefinitely')

for (const forbidden of [
  'nominatim.openstreetmap.org',
  'dangerouslySetInnerHTML',
  'TODO_ACTION',
  'href="javascript:',
  'onClick={() => {}}',
]) {
  if (mapTsx.includes(forbidden)) fail(`forbidden marker present: ${forbidden}`)
  pass(`forbidden marker absent: ${forbidden}`)
}

const output = ts.transpileModule(mapTsx, {
  compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
  fileName: files.mapTsx,
  reportDiagnostics: true,
})
const errors = (output.diagnostics || []).filter((item) => item.category === ts.DiagnosticCategory.Error)
if (errors.length) fail(`TypeScript syntax: ${errors.map((item) => ts.flattenDiagnosticMessageText(item.messageText, '\n')).join('; ')}`)
pass(`TypeScript syntax: ${files.mapTsx}`)

const used = new Set([...mapTsx.matchAll(/styles\.([A-Za-z_][\w]*)/g)].map((match) => match[1]))
const defined = new Set([...mapCss.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((match) => match[1]))
for (const className of used) {
  if (!defined.has(className)) fail(`CSS class unresolved: ${className}`)
}
pass(`CSS Module resolves (${used.size} classes)`)

const opens = (mapCss.match(/\{/g) || []).length
const closes = (mapCss.match(/\}/g) || []).length
if (opens !== closes) fail(`CSS braces unbalanced: ${opens}/${closes}`)
pass('CSS braces balanced')

console.log(`\n${checks} checks passed. Sovereign Pulse OpenStreetMap single-capture stability hotfix is statically accepted.`)
