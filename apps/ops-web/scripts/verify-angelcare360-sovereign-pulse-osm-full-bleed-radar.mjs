import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const app = process.argv[2] || process.cwd()
const requireFromApp = createRequire(path.join(app, 'package.json'))
const ts = requireFromApp('typescript')

const files = {
  mapTsx: 'components/angelcare360/operator/sovereign-pulse/SovereignPulseCustomerMap.tsx',
  mapCss: 'components/angelcare360/operator/sovereign-pulse/SovereignPulseCustomerMap.module.css',
  dashboardCss: 'components/angelcare360/operator/sovereign-pulse/SovereignPulseDashboard.module.css',
  server: 'lib/angelcare360/operator/sovereign-pulse.ts',
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
const dashboardCss = read(files.dashboardCss)
const server = read(files.server)

const runtimeMarkers = [
  'setSelectedId(nodes[0].id)',
  'filteredNodes.length === 1',
  "mode === 'wall' ? 8.6 : 9.4",
  'ac-sp-map-beacon--sole',
  'ac-sp-map-radar-ring--one',
  'ac-sp-map-radar-ring--two',
  'ac-sp-map-radar-sweep',
  'ac-sp-map-georadar--sole',
  'radius: radius * 0.52',
  'data-single={nodes.length === 1}',
  'window.setTimeout(() => map.invalidateSize({ animate: false }), 360)',
]
for (const marker of runtimeMarkers) {
  if (!mapTsx.includes(marker)) fail(`map runtime marker absent: ${marker}`)
  pass(`map runtime marker: ${marker}`)
}

const mapCssMarkers = [
  'position: absolute;',
  'inset: 0;',
  'height: 100%;',
  '.ac-sp-map-beacon',
  '.ac-sp-map-radar-ring--one',
  '.ac-sp-map-radar-ring--two',
  '.ac-sp-map-radar-sweep',
  '.ac-sp-map-georadar',
  '@keyframes mapRadarPulse',
  '@keyframes mapGeoRadar',
  'top: 104px;',
]
for (const marker of mapCssMarkers) {
  if (!mapCss.includes(marker)) fail(`map CSS marker absent: ${marker}`)
  pass(`map CSS marker: ${marker}`)
}

const dashboardMarkers = [
  '/* OSM full-bleed customer command hotfix */',
  '.customerScene {',
  'display: block;',
  'padding: 0;',
  '.customerSceneHead {',
  'position: absolute;',
  'z-index: 720;',
  '.customerPulseRail { display: none; }',
]
for (const marker of dashboardMarkers) {
  if (!dashboardCss.includes(marker)) fail(`dashboard full-bleed marker absent: ${marker}`)
  pass(`dashboard full-bleed marker: ${marker}`)
}

const geoMarkers = [
  'MOROCCO_CITY_ALIASES',
  "casa: 'casablanca'",
  'MOROCCO_CITY_LABELS',
  'function cityKeyFromText',
  'function customerCity',
  "['client_code', 'code']",
  "['legal_name', 'trade_name', 'name', 'organization_name']",
  'const city = customerCity(row)',
]
for (const marker of geoMarkers) {
  if (!server.includes(marker)) fail(`geographic resolver marker absent: ${marker}`)
  pass(`geographic resolver marker: ${marker}`)
}

for (const forbidden of [
  'nominatim.openstreetmap.org',
  'dangerouslySetInnerHTML',
  'TODO_ACTION',
  'href="javascript:',
  'onClick={() => {}}',
]) {
  if (mapTsx.includes(forbidden) || server.includes(forbidden)) fail(`forbidden marker present: ${forbidden}`)
  pass(`forbidden marker absent: ${forbidden}`)
}

function syntaxCheck(relative) {
  const source = read(relative)
  const output = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
    fileName: relative,
    reportDiagnostics: true,
  })
  const errors = (output.diagnostics || []).filter((item) => item.category === ts.DiagnosticCategory.Error)
  if (errors.length) fail(`${relative} syntax: ${errors.map((item) => ts.flattenDiagnosticMessageText(item.messageText, '\n')).join('; ')}`)
  pass(`TypeScript syntax: ${relative}`)
}
syntaxCheck(files.mapTsx)
syntaxCheck(files.server)

function cssClasses(relativeTsx, relativeCss) {
  const tsx = read(relativeTsx)
  const css = read(relativeCss)
  const used = new Set([...tsx.matchAll(/styles\.([A-Za-z_][\w]*)/g)].map((match) => match[1]))
  const defined = new Set([...css.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((match) => match[1]))
  for (const className of used) {
    if (!defined.has(className)) fail(`CSS class unresolved: ${relativeTsx} -> ${className}`)
  }
  pass(`CSS module resolves: ${relativeTsx} (${used.size} classes)`)
}
cssClasses(files.mapTsx, files.mapCss)

for (const [label, source] of [['map CSS', mapCss], ['dashboard CSS', dashboardCss]]) {
  const opens = (source.match(/\{/g) || []).length
  const closes = (source.match(/\}/g) || []).length
  if (opens !== closes) fail(`${label} braces are unbalanced: ${opens}/${closes}`)
  pass(`${label} braces balanced`)
}

console.log(`\n${checks} checks passed. Sovereign Pulse full-bleed OpenStreetMap radar hotfix is statically accepted.`)
