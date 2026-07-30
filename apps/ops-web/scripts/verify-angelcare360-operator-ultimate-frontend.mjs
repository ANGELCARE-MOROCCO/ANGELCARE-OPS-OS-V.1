import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const root = resolve(scriptDir, '..')
const errors = []
const passes = []

function pass(message) { passes.push(message) }
function fail(message) { errors.push(message) }
function requireFile(path) { existsSync(join(root, path)) ? pass(`file: ${path}`) : fail(`missing file: ${path}`) }
function text(path) { return readFileSync(join(root, path), 'utf8') }
function walk(dir) {
  const output = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) output.push(...walk(path))
    else output.push(path)
  }
  return output
}

const requiredFiles = [
  'components/angelcare360/operator/Angelcare360OperatorExperience.module.css',
  'components/angelcare360/operator/Angelcare360OperatorExperience.ts',
  'components/angelcare360/operator/Angelcare360OperatorCommandPalette.tsx',
  'components/angelcare360/operator/Angelcare360OperatorIcons.tsx',
  'components/angelcare360/operator/Angelcare360OperatorShell.tsx',
  'components/angelcare360/operator/Angelcare360OperatorPageShell.tsx',
  'components/angelcare360/operator/Angelcare360OperatorDataTable.tsx',
  'components/angelcare360/operator/Angelcare360OperatorDrawer.tsx',
  'ANGELCARE_360_OPERATOR_BACKEND_INTEGRITY.sha256',
  'tsconfig.angelcare360-operator-ultimate-ui.json',
]
requiredFiles.forEach(requireFile)

const routeRoot = join(root, 'app/(protected)/angelcare-360-operator')
const routePages = walk(routeRoot).filter((path) => path.endsWith('/page.tsx'))
if (routePages.length === 34) pass('34 Operator page routes preserved')
else fail(`expected 34 Operator page routes, found ${routePages.length}`)

const profileSource = text('components/angelcare360/operator/Angelcare360OperatorExperience.ts')
const expectedProfiles = [
  'executive-command', 'customer-portfolio', 'customer-dossier', 'tenant-fleet', 'access-observatory',
  'plan-architecture', 'package-composer', 'subscription-field', 'module-topology', 'feature-control',
  'capacity-thresholds', 'financial-command', 'billing-identities', 'invoice-observatory', 'payment-validation',
  'exposure-matrix', 'recovery-command', 'onboarding-runway', 'deployment-war-room', 'support-radar',
  'fulfilment-queue', 'incident-room', 'service-mission-control', 'operator-commitments',
  'confidential-intelligence', 'contract-library', 'retention-horizon', 'health-observatory',
  'forensic-explorer', 'authority-architecture', 'governance-console', 'financial-document',
]
for (const profile of expectedProfiles) {
  profileSource.includes(`'${profile}'`) ? pass(`experience: ${profile}`) : fail(`missing experience profile: ${profile}`)
}

const shellSource = text('components/angelcare360/operator/Angelcare360OperatorShell.tsx')
if (shellSource.includes('Angelcare360OperatorCommandPalette') && shellSource.includes("data-experience={profile.key}")) pass('command shell and route experience wiring')
else fail('command shell experience wiring incomplete')

const tableSource = text('components/angelcare360/operator/Angelcare360OperatorDataTable.tsx')
if (tableSource.includes("useState<'table' | 'cards'>") && tableSource.includes('filteredRows')) pass('searchable table/card data landscapes')
else fail('data landscape controls missing')

const drawerSource = text('components/angelcare360/operator/Angelcare360OperatorDrawer.tsx')
if (drawerSource.includes('data-variant={variant}') && drawerSource.includes("event.key === 'Escape'")) pass('purpose-specific keyboard-safe drawers')
else fail('drawer depth contract missing')

const uiFiles = [
  ...walk(join(root, 'app/(protected)/angelcare-360-operator')),
  ...walk(join(root, 'components/angelcare360/operator')),
].filter((path) => /\.(ts|tsx)$/.test(path))
const forbiddenUiPatterns = ['Montant MAD', 'Prix mensuel MAD', 'Prix annuel MAD', 'tarification MAD', '} MAD`']
for (const pattern of forbiddenUiPatterns) {
  const offenders = uiFiles.filter((path) => readFileSync(path, 'utf8').includes(pattern))
  if (offenders.length) fail(`legacy currency display "${pattern}" in: ${offenders.map((path) => relative(root, path)).join(', ')}`)
  else pass(`currency presentation cleared: ${pattern}`)
}

const manifestLines = text('ANGELCARE_360_OPERATOR_BACKEND_INTEGRITY.sha256').trim().split(/\r?\n/).filter(Boolean)
let integrityOk = true
for (const line of manifestLines) {
  const match = line.match(/^([a-f0-9]{64})\s+(.+)$/)
  if (!match) { integrityOk = false; fail(`invalid integrity line: ${line}`); continue }
  const [, expected, path] = match
  const fullPath = join(root, path)
  if (!existsSync(fullPath)) { integrityOk = false; fail(`integrity target missing: ${path}`); continue }
  const actual = createHash('sha256').update(readFileSync(fullPath)).digest('hex')
  if (actual !== expected) { integrityOk = false; fail(`backend integrity mismatch: ${path}`) }
}
if (integrityOk) pass(`${manifestLines.length} backend/API/SQL/type integrity hashes verified`)

console.log(`\nANGELCARE 360 OPERATOR — ULTIMATE FRONTEND VERIFICATION`)
console.log(`PASS  ${passes.length} checks`)
for (const message of passes) console.log(`  ✓ ${message}`)
if (errors.length) {
  console.error(`\nFAIL  ${errors.length} check(s)`)
  for (const message of errors) console.error(`  ✕ ${message}`)
  process.exit(1)
}
console.log('\nRESULT  Frontend package statically accepted. Run the dedicated TypeScript command in an installed repository for the full semantic gate.')
