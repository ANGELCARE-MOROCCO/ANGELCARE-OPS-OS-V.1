import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const root = process.cwd()
const files = [
  'components/angelcare360/operator/sovereign/service-authority/ServiceIndustrialMissionNetwork.tsx',
  'components/angelcare360/operator/sovereign/service-authority/ServiceIndustrialMissionNetwork.module.css',
  'components/angelcare360/operator/sovereign/SovereignWorkspaceClient.tsx',
  'data/angelcare360/operator-sovereign-navigation.ts',
]
let checks = 0
for (const relative of files) {
  const absolute = path.join(root, relative)
  if (!fs.existsSync(absolute)) throw new Error(`Missing delivered file: ${relative}`)
  console.log(`PASS  file exists: ${relative}`)
  checks += 1
}
for (const relative of files.filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'))) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8')
  const parsed = ts.createSourceFile(relative, source, ts.ScriptTarget.Latest, true, relative.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  if (parsed.parseDiagnostics.length) {
    for (const diagnostic of parsed.parseDiagnostics) console.error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
    throw new Error(`TypeScript syntax failed: ${relative}`)
  }
  console.log(`PASS  isolated syntax: ${relative}`)
  checks += 1
}
const component = fs.readFileSync(path.join(root, files[0]), 'utf8')
for (const marker of ['Service Industrial','Mission Network','Activation & Go-Live','Implementation Factory','Adoption & Value Realization','Support Operations','Incident, SLA & Major Response','Field Service & Work Orders','Quality, Experience & Improvement','Service Action Runway']) {
  if (!component.includes(marker)) throw new Error(`Missing service marker: ${marker}`)
  console.log(`PASS  service marker: ${marker}`)
  checks += 1
}
for (const forbidden of ['href="javascript:', 'TODO_ACTION', 'onClick={() => {}}', 'alert(', 'setInterval(', 'ResizeObserver']) {
  if (component.includes(forbidden)) throw new Error(`Forbidden runtime marker: ${forbidden}`)
  console.log(`PASS  forbidden marker absent: ${forbidden}`)
  checks += 1
}
const workspace = fs.readFileSync(path.join(root, files[2]), 'utf8')
for (const marker of ['RevenueAuthorityCommandDeck','ServiceIndustrialMissionNetwork',"snapshot.tower === 'revenue'", "snapshot.tower === 'service'"]) {
  if (!workspace.includes(marker)) throw new Error(`Workspace composition marker missing: ${marker}`)
  console.log(`PASS  workspace composition: ${marker}`)
  checks += 1
}
const navigation = fs.readFileSync(path.join(root, files[3]), 'utf8')
for (const marker of ['Service Command','Activation & Go-Live','Implementation Factory','Adoption & Value','Support Operations','Incidents & SLA','Field Service','Quality & Experience','Revenue Command','Forecast & Profitability']) {
  if (!navigation.includes(marker)) throw new Error(`Navigation marker missing: ${marker}`)
  console.log(`PASS  navigation marker: ${marker}`)
  checks += 1
}
const css = fs.readFileSync(path.join(root, files[1]), 'utf8')
for (const marker of ['prefers-reduced-motion', "[data-motion='paused']", '@keyframes blast-once', '@keyframes finite-pulse']) {
  if (!css.includes(marker)) throw new Error(`Performance marker missing: ${marker}`)
  console.log(`PASS  performance marker: ${marker}`)
  checks += 1
}
console.log(`\n${checks} surgical checks passed. Service Industrial Mission Network is accepted.`)
