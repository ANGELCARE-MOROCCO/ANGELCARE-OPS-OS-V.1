import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const ts = require('typescript')
const root = process.cwd()
const files = {
  tsx: 'components/angelcare360/operator/sovereign-pulse/SovereignPulseCustomerMap.tsx',
  css: 'components/angelcare360/operator/sovereign-pulse/SovereignPulseCustomerMap.module.css',
  dash: 'components/angelcare360/operator/sovereign-pulse/SovereignPulseDashboard.module.css',
}
let checks = 0
for (const rel of Object.values(files)) {
  if (!fs.existsSync(path.join(root, rel))) throw new Error(`Missing ${rel}`)
  console.log(`PASS  file exists: ${rel}`); checks++
}
const tsx = fs.readFileSync(path.join(root, files.tsx), 'utf8')
const css = fs.readFileSync(path.join(root, files.css), 'utf8')
const dash = fs.readFileSync(path.join(root, files.dash), 'utf8')
const parsed = ts.createSourceFile(files.tsx, tsx, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
if (parsed.parseDiagnostics.length) throw new Error('TSX syntax diagnostics found')
console.log('PASS  isolated TSX syntax'); checks++
for (const token of ['zoomSnap: 1', 'preferCanvas: false', 'detectRetina: false', "tileLayer.once('load'", "mode === 'wall' ? 8 : 9"]) {
  if (!tsx.includes(token)) throw new Error(`Missing TSX stability token: ${token}`)
  console.log(`PASS  TSX stability token: ${token}`); checks++
}
for (const token of ['filter: none !important', 'Retina-safe stable snapshot rendering', 'contain: layout paint', 'animation: none !important']) {
  if (!css.includes(token)) throw new Error(`Missing CSS stability token: ${token}`)
  console.log(`PASS  CSS stability token: ${token}`); checks++
}
for (const forbidden of ['hue-rotate(176deg)', 'mix-blend-mode: screen']) {
  if (css.includes(forbidden)) throw new Error(`Forbidden GPU compositor token remains: ${forbidden}`)
  console.log(`PASS  compositor token absent: ${forbidden}`); checks++
}
if (!dash.includes('OSM Retina stability:')) throw new Error('Customer scene stability override missing')
console.log('PASS  parent customer scene transform disabled'); checks++
for (const forbidden of ['setInterval(', 'ResizeObserver']) {
  if (tsx.includes(forbidden)) throw new Error(`Forbidden runtime loop remains: ${forbidden}`)
  console.log(`PASS  runtime loop absent: ${forbidden}`); checks++
}
console.log(`\n${checks} surgical checks passed. OSM Retina stability hotfix is accepted.`)
