import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const app = process.argv[2] || process.cwd()
const requireFromApp = createRequire(path.join(app, 'package.json'))
const ts = requireFromApp('typescript')

const requiredFiles = [
  'components/angelcare360/operator/sovereign-pulse/SovereignPulseDashboard.tsx',
  'components/angelcare360/operator/sovereign-pulse/SovereignPulseDashboard.module.css',
  'components/angelcare360/operator/sovereign-pulse/SovereignPulseCustomerMap.tsx',
  'components/angelcare360/operator/sovereign-pulse/SovereignPulseCustomerMap.module.css',
  'types/angelcare360/operator/sovereign-pulse.ts',
  'types/angelcare360/operator/sovereign-pulse-map.d.ts',
  'lib/angelcare360/operator/sovereign-pulse.ts',
  'tsconfig.angelcare360-sovereign-pulse.json',
]

let checks = 0
const fail = (message) => { throw new Error(`FAIL: ${message}`) }
const pass = (message) => { checks += 1; console.log(`PASS  ${message}`) }
const read = (relative) => fs.readFileSync(path.join(app, relative), 'utf8')

for (const relative of requiredFiles) {
  if (!fs.existsSync(path.join(app, relative))) fail(`missing ${relative}`)
  pass(`file exists: ${relative}`)
}

const packageJson = JSON.parse(read('package.json'))
if (!packageJson.dependencies?.leaflet) fail('leaflet dependency missing from package.json')
pass('Leaflet runtime dependency is present')

const dashboard = read(requiredFiles[0])
const dashboardCss = read(requiredFiles[1])
const mapComponent = read(requiredFiles[2])
const mapCss = read(requiredFiles[3])
const types = read(requiredFiles[4])
const mapTypes = read(requiredFiles[5])
const server = read(requiredFiles[6])
const tsconfig = JSON.parse(read(requiredFiles[7]))

const dashboardMarkers = [
  "import('./SovereignPulseCustomerMap')",
  'OpenStreetMap Customer Network',
  'Implantations clients & horizon renouvellement',
  '<SovereignPulseCustomerMap',
  'nodes={snapshot.customerNodes}',
  'onInspect={inspectCustomer}',
]
for (const marker of dashboardMarkers) {
  if (!dashboard.includes(marker)) fail(`dashboard marker absent: ${marker}`)
  pass(`dashboard marker: ${marker}`)
}

for (const forbidden of ['function CustomerNode(', 'className={styles.constellation}', '<div className={styles.constellationCore}>']) {
  if (dashboard.includes(forbidden)) fail(`legacy constellation runtime remains: ${forbidden}`)
  pass(`legacy constellation runtime absent: ${forbidden}`)
}

const mapMarkers = [
  "await import('leaflet')",
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  'OpenStreetMap contributors',
  'NEXT_PUBLIC_OSM_TILE_URL',
  'L.tileLayer(',
  'L.marker(',
  'L.polyline(',
  'L.circle(',
  'filterPills',
  'renewalDeck',
  'selectedDeck',
  'mapScan',
  'networkVisible',
  'locationPrecision',
]
for (const marker of mapMarkers) {
  if (!mapComponent.includes(marker)) fail(`map runtime marker absent: ${marker}`)
  pass(`map runtime marker: ${marker}`)
}

for (const forbidden of ['nominatim.openstreetmap.org', 'dangerouslySetInnerHTML', 'TODO_ACTION', 'href="javascript:', 'onClick={() => {}}']) {
  if (mapComponent.includes(forbidden) || dashboard.includes(forbidden)) fail(`forbidden marker present: ${forbidden}`)
  pass(`forbidden marker absent: ${forbidden}`)
}

const typeMarkers = [
  'latitude: number',
  'longitude: number',
  "locationPrecision: 'exact' | 'city' | 'regional' | 'fallback'",
  'addressLabel: string',
]
for (const marker of typeMarkers) {
  if (!types.includes(marker)) fail(`type marker absent: ${marker}`)
  pass(`type marker: ${marker}`)
}

const serverMarkers = [
  'MOROCCO_CITY_COORDINATES',
  'customerLocation(',
  'renewalDaysForCustomer(',
  "['latitude', 'lat', 'location_latitude'",
  "locationPrecision: 'exact' as const",
  'deterministicOffset(',
  'addressLabel:',
]
for (const marker of serverMarkers) {
  if (!server.includes(marker)) fail(`server marker absent: ${marker}`)
  pass(`server marker: ${marker}`)
}

if (!mapTypes.includes("declare module 'leaflet'")) fail('Leaflet ambient declaration absent')
pass('Leaflet ambient declaration present')

if (!(tsconfig.include || []).includes('types/angelcare360/operator/sovereign-pulse-map.d.ts')) {
  fail('targeted tsconfig does not include sovereign-pulse-map.d.ts')
}
pass('targeted tsconfig includes map declaration')

if (!mapCss.includes("@import 'leaflet/dist/leaflet.css';")) fail('Leaflet CSS import absent')
pass('Leaflet stylesheet is bundled')

for (const marker of ['ac-sp-map-marker', '@keyframes mapSignal', '@keyframes mapScan', '.filterDeck', '.renewalDeck', '.selectedDeck']) {
  if (!mapCss.includes(marker)) fail(`map CSS marker absent: ${marker}`)
  pass(`map CSS marker: ${marker}`)
}

if (!dashboardCss.includes('.customerMapLoading')) fail('map loading surface absent')
pass('premium map loading surface present')

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
  if (errors.length) {
    fail(`${relative} syntax: ${errors.map((item) => ts.flattenDiagnosticMessageText(item.messageText, '\n')).join('; ')}`)
  }
  pass(`TypeScript syntax: ${relative}`)
}

for (const relative of [requiredFiles[0], requiredFiles[2], requiredFiles[4], requiredFiles[6]]) syntaxCheck(relative)

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

cssClasses(requiredFiles[0], requiredFiles[1])
cssClasses(requiredFiles[2], requiredFiles[3])

console.log(`\n${checks} checks passed. Sovereign Pulse OpenStreetMap Customer Network is statically accepted.`)
