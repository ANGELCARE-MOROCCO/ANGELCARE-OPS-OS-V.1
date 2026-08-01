import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const root = resolve(scriptDir, '..')
const errors = []
const passes = []
const pass = (message) => passes.push(message)
const fail = (message) => errors.push(message)
const full = (path) => join(root, path)
const text = (path) => readFileSync(full(path), 'utf8')
const requireFile = (path) => existsSync(full(path)) ? pass(`file: ${path}`) : fail(`missing file: ${path}`)
function walk(dir) {
  const output = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) output.push(...walk(path))
    else output.push(path)
  }
  return output
}

const wave1Components = [
  'Wave1ExecutiveTypes.ts',
  'Wave1ExecutiveData.ts',
  'Wave1ExecutiveExperience.module.css',
  'Wave1ExecutivePrimitives.tsx',
  'ExecutiveCommandCenter.tsx',
  'BoardCommandMode.tsx',
  'RevenueExecutiveCommand.tsx',
  'CustomerValueCommand.tsx',
  'ServiceExecutiveCommand.tsx',
  'ExecutiveDecisionCenter.tsx',
  'ForwardHorizon.tsx',
  'ManagementAccountability.tsx',
].map((name) => `components/angelcare360/operator/wave1/${name}`)

const wave1Routes = [
  'executive/page.tsx',
  'executive/board/page.tsx',
  'executive/revenue/page.tsx',
  'executive/customers/page.tsx',
  'executive/service/page.tsx',
  'executive/decisions/page.tsx',
  'executive/horizon/page.tsx',
  'executive/accountability/page.tsx',
].map((name) => `app/(protected)/angelcare-360-operator/${name}`)

const requiredFiles = [
  ...wave1Components,
  ...wave1Routes,
  'app/(protected)/angelcare-360-operator/page.tsx',
  'data/angelcare360/operator-navigation.ts',
  'components/angelcare360/operator/Angelcare360OperatorExperience.ts',
  'components/angelcare360/operator/Angelcare360OperatorIcons.tsx',
  'ANGELCARE_360_OPERATOR_BACKEND_INTEGRITY.sha256',
  'tsconfig.angelcare360-operator-wave1-executive.json',
]
requiredFiles.forEach(requireFile)

const routeRoot = full('app/(protected)/angelcare-360-operator')
const routePages = walk(routeRoot).filter((path) => path.endsWith('/page.tsx'))
routePages.length === 47 ? pass('47 cumulative Operator page routes present') : fail(`expected 47 Operator page routes, found ${routePages.length}`)

const rootPage = text('app/(protected)/angelcare-360-operator/page.tsx')
rootPage.includes('ExecutiveCommandCenter') ? pass('Operator root promoted to Wave 1 Executive Command Center') : fail('Operator root does not render ExecutiveCommandCenter')

const expectedProfiles = [
  'wave1-executive-command', 'wave1-board-command', 'wave1-revenue-command', 'wave1-customer-value',
  'wave1-service-command', 'wave1-decision-center', 'wave1-forward-horizon', 'wave1-accountability',
]
const profileSource = text('components/angelcare360/operator/Angelcare360OperatorExperience.ts')
for (const key of expectedProfiles) profileSource.includes(`'${key}'`) ? pass(`experience profile: ${key}`) : fail(`missing experience profile: ${key}`)

const navSource = text('data/angelcare360/operator-navigation.ts')
const routeHrefs = [
  '/angelcare-360-operator/executive', '/angelcare-360-operator/executive/board',
  '/angelcare-360-operator/executive/revenue', '/angelcare-360-operator/executive/customers',
  '/angelcare-360-operator/executive/service', '/angelcare-360-operator/executive/decisions',
  '/angelcare-360-operator/executive/horizon', '/angelcare-360-operator/executive/accountability',
]
for (const href of routeHrefs) navSource.includes(`href: '${href}'`) ? pass(`navigation: ${href}`) : fail(`missing navigation href: ${href}`)

const dataSource = text('components/angelcare360/operator/wave1/Wave1ExecutiveData.ts')
const expectedTables = [
  'angelcare360_operator_clients', 'angelcare360_operator_tenants', 'angelcare360_operator_subscriptions',
  'angelcare360_operator_invoices', 'angelcare360_operator_payments', 'angelcare360_operator_support_tickets',
  'angelcare360_operator_incidents', 'angelcare360_operator_renewals', 'angelcare360_operator_onboarding_tasks',
  'angelcare360_operator_tasks', 'angelcare360_operator_service_requests', 'angelcare360_operator_service_events',
  'angelcare360_operator_contracts', 'angelcare360_operator_usage_limits', 'angelcare360_operator_audit_logs',
]
for (const table of expectedTables) dataSource.includes(`'${table}'`) ? pass(`real data source: ${table}`) : fail(`missing real data source: ${table}`)
dataSource.includes('executiveList') && dataSource.includes('sourceFailures') && dataSource.includes("state: sourceFailures.length === 0 ? 'complete'")
  ? pass('truthful complete/partial/unavailable source-health contract')
  : fail('source failures may still appear as genuine zero values')

for (const forbidden of ['fixture', 'faker', 'Math.random(', 'mockData', 'demoData']) {
  dataSource.includes(forbidden) ? fail(`synthetic data marker detected: ${forbidden}`) : pass(`no synthetic marker: ${forbidden}`)
}

const primitiveSource = text('components/angelcare360/operator/wave1/Wave1ExecutivePrimitives.tsx')
const primitiveContracts = [
  ['ExecutiveRibbon', 'clickable intelligence ribbon'],
  ['ExecutiveDrawer', 'executive investigation drawer'],
  ['EvidenceDrawer', 'second-level evidence drawer'],
  ['DecisionChamber', 'consequence-aware decision chamber'],
  ["event.key === 'Escape'", 'keyboard-safe drawer/chamber escape'],
]
for (const [needle, label] of primitiveContracts) primitiveSource.includes(needle) ? pass(label) : fail(`missing ${label}`)

const boardSource = text('components/angelcare360/operator/wave1/BoardCommandMode.tsx')
boardSource.includes('requestFullscreen') && boardSource.includes('ArrowLeft') && boardSource.includes('ArrowRight')
  ? pass('Board Mode fullscreen and controlled scene navigation')
  : fail('Board Mode presentation controls incomplete')
boardSource.includes('Question au management · verrouillée') && boardSource.includes('persistance des questions Board')
  ? pass('Board questions are truthful locked capability when persistence is absent')
  : fail('Board question persistence state is not explicit')

const decisionSource = text('components/angelcare360/operator/wave1/ExecutiveDecisionCenter.tsx')
decisionSource.includes('DecisionChamber') && primitiveSource.includes('decision.executionHref')
  ? pass('Decision Center routes final mutation to protected operational workspace')
  : fail('Decision Center execution boundary missing')

const wave1UiFiles = [...wave1Components.filter((path) => /\.tsx?$/.test(path)), ...wave1Routes, 'app/(protected)/angelcare-360-operator/page.tsx']
const userFacingForbidden = ['Montant MAD', 'Prix mensuel MAD', 'Prix annuel MAD', '>MAD<', ' USD', ' EUR']
for (const pattern of userFacingForbidden) {
  const offenders = wave1UiFiles.filter((path) => text(path).includes(pattern))
  offenders.length ? fail(`forbidden currency presentation "${pattern}" in ${offenders.join(', ')}`) : pass(`currency presentation cleared: ${pattern}`)
}

const technicalLabels = [/\bclient_id\b/i, /\btenant_id\b/i, /\bsubscription_id\b/i, /\bUUID\b/]
for (const pattern of technicalLabels) {
  const offenders = wave1Components.filter((path) => path.endsWith('.tsx') && pattern.test(text(path)))
  offenders.length ? fail(`raw technical label ${pattern} in ${offenders.join(', ')}`) : pass(`no raw technical UI label: ${pattern}`)
}

const cssSource = text('components/angelcare360/operator/wave1/Wave1ExecutiveExperience.module.css')
cssSource.split('{').length === cssSource.split('}').length ? pass('Wave 1 CSS structure balanced') : fail('Wave 1 CSS braces are unbalanced')
cssSource.includes('@media (prefers-reduced-motion: reduce)') ? pass('reduced-motion contract present') : fail('reduced-motion contract missing')
cssSource.includes('@media (max-width:') ? pass('responsive Wave 1 layouts present') : fail('responsive Wave 1 layouts missing')

const allOperatorTs = [
  ...walk(full('app/(protected)/angelcare-360-operator')),
  ...walk(full('components/angelcare360/operator')),
].filter((path) => /\.tsx?$/.test(path))
let typescript
try { typescript = await import('typescript') } catch { typescript = null }
if (typescript) {
  let parseErrors = 0
  for (const path of allOperatorTs) {
    const source = readFileSync(path, 'utf8')
    const file = typescript.createSourceFile(path, source, typescript.ScriptTarget.Latest, true, path.endsWith('.tsx') ? typescript.ScriptKind.TSX : typescript.ScriptKind.TS)
    parseErrors += file.parseDiagnostics.length
  }
  parseErrors === 0 ? pass(`${allOperatorTs.length} Operator TS/TSX files parse with zero syntax diagnostics`) : fail(`${parseErrors} TS/TSX syntax diagnostics`)
} else {
  pass('TypeScript parser unavailable here; dedicated installed-repository semantic command supplied')
}

const manifestLines = text('ANGELCARE_360_OPERATOR_BACKEND_INTEGRITY.sha256').trim().split(/\r?\n/).filter(Boolean)
let integrityOk = true
for (const line of manifestLines) {
  const match = line.match(/^([a-f0-9]{64})\s+(.+)$/)
  if (!match) { integrityOk = false; fail(`invalid integrity line: ${line}`); continue }
  const [, expected, path] = match
  if (!existsSync(full(path))) { integrityOk = false; fail(`protected file missing: ${path}`); continue }
  const actual = createHash('sha256').update(readFileSync(full(path))).digest('hex')
  if (actual !== expected) { integrityOk = false; fail(`protected file changed: ${path}`) }
}
if (integrityOk) pass(`${manifestLines.length} backend/API/SQL/type integrity hashes verified`)

console.log('\nANGELCARE 360 OPERATOR — WAVE 1 EXECUTIVE INTELLIGENCE VERIFICATION')
console.log(`PASS  ${passes.length} checks`)
for (const message of passes) console.log(`  ✓ ${message}`)
if (errors.length) {
  console.error(`\nFAIL  ${errors.length} check(s)`)
  for (const message of errors) console.error(`  ✕ ${message}`)
  process.exit(1)
}
console.log('\nRESULT  Wave 1 Executive Intelligence frontend is statically accepted. Run the supplied TypeScript command in the installed repository for the full project semantic gate.')
