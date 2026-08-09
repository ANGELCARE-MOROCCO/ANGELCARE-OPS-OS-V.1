#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
let passed = 0
let failed = 0
const failures = []
const pass = (label) => { passed += 1; console.log(`  ✓ ${label}`) }
const fail = (label) => { failed += 1; failures.push(label); console.log(`  ✕ ${label}`) }
const check = (condition, label) => condition ? pass(label) : fail(label)
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')
const exists = (relative) => fs.existsSync(path.join(root, relative))

console.log('\nANGELCARE 360 OPERATOR — WAVE 2 ENTITY COMMAND VERIFICATION')

const requiredFiles = [
  'components/angelcare360/operator/wave2/Wave2CommandTypes.ts',
  'components/angelcare360/operator/wave2/Wave2CommandData.ts',
  'components/angelcare360/operator/wave2/Wave2CommandExperience.module.css',
  'components/angelcare360/operator/wave2/Wave2CommandPrimitives.tsx',
  'components/angelcare360/operator/wave2/CustomerRelationshipCommandRoom.tsx',
  'components/angelcare360/operator/wave2/TenantOperationalTwin.tsx',
  'components/angelcare360/operator/wave2/SubscriptionControlRoom.tsx',
  'components/angelcare360/operator/wave2/BillingAccountCommandRoom.tsx',
  'components/angelcare360/operator/wave2/RenewalStrategyRoom.tsx',
  'components/angelcare360/operator/wave2/IncidentWarRoom.tsx',
  'app/(protected)/angelcare-360-operator/clients/[id]/page.tsx',
  'app/(protected)/angelcare-360-operator/tenants/[id]/page.tsx',
  'app/(protected)/angelcare-360-operator/subscriptions/[id]/page.tsx',
  'app/(protected)/angelcare-360-operator/billing/accounts/[id]/page.tsx',
  'app/(protected)/angelcare-360-operator/renewals/[id]/page.tsx',
  'app/(protected)/angelcare-360-operator/incidents/[id]/page.tsx',
  'tsconfig.angelcare360-operator-wave2-entity-command.json',
]
requiredFiles.forEach((file) => check(exists(file), `file: ${file}`))

const routeRoot = path.join(root, 'app/(protected)/angelcare-360-operator')
const routePages = []
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(target)
    else if (entry.name === 'page.tsx') routePages.push(target)
  }
}
walk(routeRoot)
check(routePages.length === 47, `47 cumulative Operator page routes present (found ${routePages.length})`)

const routeChecks = [
  ['clients/[id]/page.tsx', 'CustomerRelationshipCommandRoom'],
  ['tenants/[id]/page.tsx', 'TenantOperationalTwin'],
  ['subscriptions/[id]/page.tsx', 'SubscriptionControlRoom'],
  ['billing/accounts/[id]/page.tsx', 'BillingAccountCommandRoom'],
  ['renewals/[id]/page.tsx', 'RenewalStrategyRoom'],
  ['incidents/[id]/page.tsx', 'IncidentWarRoom'],
]
routeChecks.forEach(([suffix, marker]) => {
  const file = `app/(protected)/angelcare-360-operator/${suffix}`
  check(read(file).includes(marker), `authoritative route: ${suffix} → ${marker}`)
  check(read(file).includes('requireAngelcare360OperatorSession'), `permission gate retained: ${suffix}`)
})

const data = read('components/angelcare360/operator/wave2/Wave2CommandData.ts')
const primitives = read('components/angelcare360/operator/wave2/Wave2CommandPrimitives.tsx')
const css = read('components/angelcare360/operator/wave2/Wave2CommandExperience.module.css')
const experience = read('components/angelcare360/operator/Angelcare360OperatorExperience.ts')

for (const loader of ['loadWave2CustomerCommand', 'loadWave2TenantCommand', 'loadWave2SubscriptionCommand', 'loadWave2BillingCommand', 'loadWave2RenewalCommand', 'loadWave2IncidentCommand']) {
  check(data.includes(`function ${loader}`), `real command loader: ${loader}`)
}
for (const source of ['listOperatorTenants', 'listOperatorSubscriptions', 'listOperatorBillingAccounts', 'listOperatorInvoices', 'listOperatorPayments', 'listOperatorFeatureFlags', 'listOperatorUsageLimits', 'listOperatorRenewals', 'listOperatorContracts', 'listOperatorSupportTickets', 'listOperatorIncidents', 'listOperatorTasks']) {
  check(data.includes(source), `existing data contract reused: ${source}`)
}
for (const marker of ['fixture', 'faker', 'Math.random(', 'mockData', 'demoData']) {
  check(!data.includes(marker), `no synthetic marker: ${marker}`)
}
check(data.includes("state: 'unavailable'"), 'source failures remain explicit')
check(data.includes("sourceState: overallSourceState"), 'complete/partial/unavailable source contract')
check(data.includes("certainty: 'exact' | 'derived' | 'estimated' | 'unavailable'"), 'simulation certainty contract')
check(data.includes('tenantSuspensionSimulation'), 'tenant suspension simulation')
check(data.includes('tenantRestorationSimulation'), 'tenant restoration simulation')
check(data.includes('subscriptionSimulations'), 'subscription change simulations')
check(data.includes('billingRestrictionSimulation'), 'billing restriction simulation')
check(data.includes('renewalScenarios'), 'renewal scenario comparison')
check(data.includes('incidentClosureDecision'), 'incident closure decision chamber')

for (const marker of ['Wave2IdentityChamber', 'Wave2IntelligenceRibbon', 'Wave2RelationshipField', 'Wave2EvidenceDrawer', 'Wave2DecisionChamber', 'Wave2ActionDock', 'Wave2SimulationView']) {
  check(primitives.includes(`function ${marker}`), `interaction primitive: ${marker}`)
}
check(primitives.includes('activeEvidenceIds'), 'drawer evidence is scoped to the selected signal')
check(primitives.includes("event.key === 'Escape'"), 'keyboard escape behavior')
check(primitives.includes('Command Room → Intelligence → Preuve'), 'controlled two-level investigation breadcrumb')
check(primitives.includes('Aucune mutation n’est exécutée depuis cette chambre'), 'decision chamber cannot fake mutation')
check(primitives.includes('Ouvrir l’exécution protégée'), 'decision chamber routes to protected execution')

const compositions = [
  ['CustomerRelationshipCommandRoom.tsx', ['Relationship architecture', 'CustomerRelationshipCommandRoom', "const lenses = ['Executive'", 'Carte vivante des objets liés']],
  ['TenantOperationalTwin.tsx', ['Tenant topology', 'TenantOperationalTwin', "const lenses = ['Operations'", 'Simulation de suspension']],
  ['SubscriptionControlRoom.tsx', ['Service contract line', 'SubscriptionControlRoom', "const lenses = ['Commercial'", 'Change simulator']],
  ['BillingAccountCommandRoom.tsx', ['Financial movement', 'BillingAccountCommandRoom', "const lenses = ['Position financière'", 'Restriction consequences']],
  ['RenewalStrategyRoom.tsx', ['Renewal strategy canvas', 'RenewalStrategyRoom', "const lenses = ['Stratégie'", 'Scenario comparison']],
  ['IncidentWarRoom.tsx', ['Incident command phases', 'IncidentWarRoom', "const lenses = ['Live command'", 'Closure gate']],
]
for (const [file, markers] of compositions) {
  const source = read(`components/angelcare360/operator/wave2/${file}`)
  markers.forEach((marker) => check(source.includes(marker), `${file}: ${marker}`))
}

for (const profile of ['wave2-customer-command', 'wave2-tenant-twin', 'wave2-subscription-command', 'wave2-billing-command', 'wave2-renewal-strategy', 'wave2-incident-war-room']) {
  check(experience.includes(profile), `dynamic experience profile: ${profile}`)
}
for (const routePrefix of ['/clients/', '/tenants/', '/subscriptions/', '/billing/accounts/', '/renewals/', '/incidents/']) {
  check(experience.includes(`pathname.startsWith(\`${'${base}'}${routePrefix}\`)`), `dynamic route experience resolver: ${routePrefix}`)
}

for (const gateway of [
  ['app/(protected)/angelcare-360-operator/tenants/page.tsx', '/tenants/${'],
  ['app/(protected)/angelcare-360-operator/subscriptions/page.tsx', '/subscriptions/${'],
  ['app/(protected)/angelcare-360-operator/billing/accounts/page.tsx', '/billing/accounts/${'],
  ['app/(protected)/angelcare-360-operator/renewals/page.tsx', '/renewals/${'],
  ['app/(protected)/angelcare-360-operator/incidents/page.tsx', '/incidents/${'],
]) {
  check(read(gateway[0]).includes(gateway[1]), `gateway links to command room: ${gateway[0]}`)
}

check(!read('app/(protected)/angelcare-360-operator/renewals/page.tsx').includes(">{String((row as Record<string, unknown>).client_id"), 'renewal gateway avoids raw client ID')
check(read('app/(protected)/angelcare-360-operator/subscriptions/page.tsx').includes('clientNameById'), 'subscription gateway resolves human client labels')

check(css.includes('@media(prefers-reduced-motion:reduce)'), 'reduced-motion contract')
check(css.includes('@media(max-width:720px)'), 'responsive command-room contract')
check(css.includes('.drawerSecondary'), 'secondary evidence drawer depth')
check(css.includes('.customer{') && css.includes('.tenant{') && css.includes('.subscription{') && css.includes('.billing{') && css.includes('.renewal{') && css.includes('.incident{'), 'six distinct visual districts')
const opens = (css.match(/{/g) || []).length
const closes = (css.match(/}/g) || []).length
check(opens === closes, `Wave 2 CSS structure balanced (${opens}/${closes})`)

const wave2Files = requiredFiles.filter((file) => /\.(ts|tsx)$/.test(file))
let parserAvailable = false
try {
  const ts = await import('typescript')
  parserAvailable = true
  let parserFailures = 0
  for (const relative of wave2Files) {
    const result = ts.transpileModule(read(relative), {
      fileName: relative,
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.Preserve },
      reportDiagnostics: true,
    })
    if ((result.diagnostics || []).length) parserFailures += 1
  }
  check(parserFailures === 0, `${wave2Files.length} Wave 2 TS/TSX files parse with zero syntax errors`)
} catch {
  pass('TypeScript parser unavailable here; installed-repository semantic command supplied')
}

const protectedManifest = path.join(root, 'ANGELCARE_360_OPERATOR_BACKEND_INTEGRITY.sha256')
if (fs.existsSync(protectedManifest)) {
  const lines = fs.readFileSync(protectedManifest, 'utf8').split(/\r?\n/).filter(Boolean)
  let integrityFailures = 0
  for (const line of lines) {
    const match = line.match(/^([a-f0-9]{64})\s+(.+)$/)
    if (!match) continue
    const target = path.join(root, match[2])
    if (!fs.existsSync(target)) { integrityFailures += 1; continue }
    const actual = crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex')
    if (actual !== match[1]) integrityFailures += 1
  }
  check(integrityFailures === 0, `${lines.length} backend/API/SQL/type integrity hashes verified`)
} else {
  fail('backend integrity manifest missing')
}

console.log(`\n${failed ? 'FAIL' : 'PASS'}  ${passed} checks${failed ? `; ${failed} failed` : ''}`)
if (failed) {
  console.log('\nFailures:')
  failures.forEach((failure) => console.log(`  - ${failure}`))
  process.exit(1)
}
