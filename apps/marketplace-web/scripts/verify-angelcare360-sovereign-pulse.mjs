import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const app = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
const requireFromApp = createRequire(path.join(app, 'package.json'))
let ts
try {
  ts = requireFromApp('typescript')
} catch {
  ts = require('typescript')
}

const rel = (value) => path.join(app, value)
const requiredFiles = [
  'app/(protected)/angelcare-360-operator/page.tsx',
  'app/api/angelcare360/operator/sovereign-pulse/route.ts',
  'components/angelcare360/operator/sovereign-pulse/SovereignPulseDashboard.tsx',
  'components/angelcare360/operator/sovereign-pulse/SovereignPulseDashboard.module.css',
  'lib/angelcare360/operator/sovereign-pulse.ts',
  'types/angelcare360/operator/sovereign-pulse.ts',
  'types/angelcare360/operator/sovereign-pulse-css.d.ts',
  'supabase/migrations/20260801_angelcare360_operator_sovereign_pulse_wallboard.sql',
  'tsconfig.angelcare360-sovereign-pulse.json',
]

let checks = 0
const pass = (message) => { checks += 1; console.log(`PASS  ${message}`) }
const fail = (message) => { console.error(`FAIL  ${message}`); process.exitCode = 1 }

for (const file of requiredFiles) {
  if (!fs.existsSync(rel(file))) fail(`required file missing: ${file}`)
  else pass(`required file: ${file}`)
}
if (process.exitCode) process.exit(process.exitCode)

const dashboardPath = rel('components/angelcare360/operator/sovereign-pulse/SovereignPulseDashboard.tsx')
const cssPath = rel('components/angelcare360/operator/sovereign-pulse/SovereignPulseDashboard.module.css')
const libPath = rel('lib/angelcare360/operator/sovereign-pulse.ts')
const pagePath = rel('app/(protected)/angelcare-360-operator/page.tsx')
const apiPath = rel('app/api/angelcare360/operator/sovereign-pulse/route.ts')
const sqlPath = rel('supabase/migrations/20260801_angelcare360_operator_sovereign_pulse_wallboard.sql')

const dashboard = fs.readFileSync(dashboardPath, 'utf8')
const css = fs.readFileSync(cssPath, 'utf8')
const lib = fs.readFileSync(libPath, 'utf8')
const page = fs.readFileSync(pagePath, 'utf8')
const api = fs.readFileSync(apiPath, 'utf8')
const sql = fs.readFileSync(sqlPath, 'utf8')

const markers = [
  ['single eight-scene rail', "key: 'overview'"],
  ['revenue scene', 'function RevenueScene'],
  ['customer constellation', 'function CustomersScene'],
  ['tenant fleet', 'function TenantsScene'],
  ['recovery radar', 'function ExperienceScene'],
  ['email flight control', 'function CommunicationsScene'],
  ['platform integrity', 'function PlatformScene'],
  ['24-hour runway', 'function MissionsScene'],
  ['wall mode', "mode === 'wall'"],
  ['privacy modes', 'visitor_safe'],
  ['automatic scene rotation', 'setInterval'],
  ['controlled aggregate refresh', '/api/angelcare360/operator/sovereign-pulse'],
  ['critical takeover', 'criticalTakeover'],
  ['body-level inspector portal', 'createPortal'],
  ['reduced motion', 'prefers-reduced-motion'],
  ['fullscreen control', 'requestFullscreen'],
  ['official AngelCare logo', '<AngelCareLogo'],
  ['truth inspector', 'Signal explicable'],
]
for (const [label, marker] of markers) {
  if (!dashboard.includes(marker)) fail(`${label} marker missing: ${marker}`)
  else pass(label)
}

for (const marker of [
  'getSovereignPulseSnapshot',
  'angelcare360_operator_clients',
  'angelcare360_operator_growth_opportunities',
  'angelcare360_operator_tenant_access_accounts',
  'angelcare360_operator_email_messages',
  'angelcare360_operator_brand_profiles',
  'angelcare_storage_events',
  'sourceState',
  'globalHealth',
]) {
  if (!lib.includes(marker)) fail(`aggregation marker missing: ${marker}`)
  else pass(`aggregation marker: ${marker}`)
}

for (const marker of ['SovereignPulseDashboard', 'getSovereignPulseSnapshot', "one(params.mode) === 'wall'", "export const dynamic = 'force-dynamic'"]) {
  if (!page.includes(marker)) fail(`page marker missing: ${marker}`)
  else pass(`page marker: ${marker}`)
}
for (const marker of ['export async function GET', 'export async function POST', 'preference.save', 'alert.acknowledge', 'snapshot.capture', 'createEmailOSCoreDb']) {
  if (!api.includes(marker)) fail(`API marker missing: ${marker}`)
  else pass(`API marker: ${marker}`)
}

const styleReferences = [...dashboard.matchAll(/styles\.([A-Za-z0-9_]+)/g)].map((match) => match[1])
const uniqueStyles = [...new Set(styleReferences)]
for (const className of uniqueStyles) {
  const pattern = new RegExp(`\\.${className}(?![A-Za-z0-9_-])`)
  if (!pattern.test(css)) fail(`CSS module class missing: ${className}`)
  else pass(`CSS module resolves: ${className}`)
}

const strippedCss = css.replace(/\/\*[\s\S]*?\*\//g, '')
for (const match of strippedCss.matchAll(/([^{}]+)\{/g)) {
  const prelude = match[1].trim()
  if (!prelude || prelude.startsWith('@') || prelude === 'from' || prelude === 'to' || /^\d+(?:\.\d+)?%$/.test(prelude)) continue
  const selectors = prelude.split(',').map((value) => value.trim())
  for (const selector of selectors) {
    if (!selector || selector.startsWith('@') || /^\d+(?:\.\d+)?%$/.test(selector) || selector === 'from' || selector === 'to') continue
    if (!/[.#][A-Za-z_][\w-]*/.test(selector) && !selector.includes(':global(')) {
      fail(`impure CSS module selector: ${selector}`)
    }
  }
}
if (!process.exitCode) pass('CSS module selectors are locally scoped')

for (const marker of ['@keyframes sceneEnter', '@keyframes radarSweep', '@keyframes mailFlight', '@keyframes footerMarquee', '.reduceMotion']) {
  if (!css.includes(marker)) fail(`motion marker missing: ${marker}`)
  else pass(`motion marker: ${marker}`)
}

const tsFiles = [dashboardPath, libPath, pagePath, apiPath, rel('types/angelcare360/operator/sovereign-pulse.ts')]
for (const file of tsFiles) {
  const source = fs.readFileSync(file, 'utf8')
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.Preserve,
      isolatedModules: true,
    },
    fileName: file,
    reportDiagnostics: true,
  })
  const diagnostics = result.diagnostics || []
  if (diagnostics.length) {
    for (const diagnostic of diagnostics) fail(`${path.relative(app, file)}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`)
  } else pass(`TypeScript syntax: ${path.relative(app, file)}`)
}

const sqlLower = sql.toLowerCase()
for (const forbidden of ['drop table', 'truncate table', 'drop column', 'delete from public.angelcare360']) {
  if (sqlLower.includes(forbidden)) fail(`forbidden SQL operation: ${forbidden}`)
  else pass(`SQL forbidden operation absent: ${forbidden}`)
}
for (const table of [
  'angelcare360_operator_pulse_preferences',
  'angelcare360_operator_pulse_wallboard_profiles',
  'angelcare360_operator_pulse_alert_acknowledgements',
  'angelcare360_operator_pulse_snapshots',
  'angelcare360_operator_pulse_critical_rules',
]) {
  if (!sqlLower.includes(`create table if not exists public.${table}`)) fail(`SQL table missing: ${table}`)
  else pass(`SQL table: ${table}`)
  if (!sqlLower.includes(`alter table public.${table} enable row level security`)) fail(`RLS missing: ${table}`)
  else pass(`RLS: ${table}`)
  if (!sqlLower.includes(`revoke all on table public.${table}`)) fail(`revoke missing: ${table}`)
  else pass(`direct browser access revoked: ${table}`)
}
if (!/^\s*begin\s*;/i.test(sql)) fail('SQL outer BEGIN missing')
else pass('SQL outer BEGIN')
if (!/commit\s*;\s*$/i.test(sql)) fail('SQL outer COMMIT missing')
else pass('SQL outer COMMIT')

for (const deadMarker of ['href="javascript:', 'TODO_ACTION', 'onClick={() => {}}', 'alert(']) {
  if (dashboard.includes(deadMarker)) fail(`dead-control marker present: ${deadMarker}`)
  else pass(`dead-control marker absent: ${deadMarker}`)
}

if (process.exitCode) process.exit(process.exitCode)
console.log(`\n${checks} checks passed. AngelCare 360 Sovereign Pulse is statically accepted.`)
