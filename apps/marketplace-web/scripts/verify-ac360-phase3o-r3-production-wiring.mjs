import { readFileSync, existsSync } from 'node:fs'

const required = [
  'database/ac360_phase3o_r3_direction_cockpit_production.sql',
  'lib/ac360/customer-direction-cockpit-production.ts',
  'app/api/ac360/customer/cockpit-direction/route.ts',
  'components/ac360/customer/direction/Ac360DirectionCockpitPage.tsx',
  'next.config.ts',
  'package.json',
  '.nvmrc',
]

for (const file of required) {
  if (!existsSync(file)) throw new Error(`Missing required Phase 3O-R3 file: ${file}`)
}

const sql = readFileSync('database/ac360_phase3o_r3_direction_cockpit_production.sql', 'utf8')
const lib = readFileSync('lib/ac360/customer-direction-cockpit-production.ts', 'utf8')
const route = readFileSync('app/api/ac360/customer/cockpit-direction/route.ts', 'utf8')
const page = readFileSync('components/ac360/customer/direction/Ac360DirectionCockpitPage.tsx', 'utf8')
const nextConfig = readFileSync('next.config.ts', 'utf8')
const pkg = readFileSync('package.json', 'utf8')
const nvmrc = readFileSync('.nvmrc', 'utf8')

const sqlMust = [
  'ac360_direction_actions',
  'ac360_direction_decisions',
  'ac360_direction_risks',
  'ac360_direction_reports',
  'ac360_direction_exports',
  'ac360_direction_audit_events',
  'enable row level security',
  'ac360_member_read_',
  'proof_reference',
]
for (const needle of sqlMust) {
  if (!sql.includes(needle)) throw new Error(`SQL migration missing ${needle}`)
}

const libMust = [
  'getAc360DirectionCockpitProductionDashboard',
  'executeAc360DirectionCockpitCommand',
  'runAc360WiredAction',
  'direction_action.create',
  'decision.request',
  'decision.decide',
  'risk.create',
  'report.queue',
  'export.queue',
  'proofReference',
  'fallback_until_sql_applied',
]
for (const needle of libMust) {
  if (!lib.includes(needle)) throw new Error(`Production library missing ${needle}`)
}

const routeMust = ['export async function GET', 'export async function POST', 'export async function PATCH', 'Cache-Control']
for (const needle of routeMust) {
  if (!route.includes(needle)) throw new Error(`API route missing ${needle}`)
}

const pageMust = [
  'RuntimeRealityStrip',
  '/api/ac360/customer/cockpit-direction',
  'Confirmer exécution réelle',
  'Action exécutée, persistée et auditée',
  'Migration SQL Phase 3O-R3 requise',
  'Runtime réel AC360',
]
for (const needle of pageMust) {
  if (!page.includes(needle)) throw new Error(`Direction cockpit UI missing ${needle}`)
}

const forbiddenDark = ['bg-slate-950 text-white', 'bg-black', 'from-slate-950', 'dark:']
for (const token of forbiddenDark) {
  if (page.includes(token)) throw new Error(`Forbidden dark theme token found in cockpit page: ${token}`)
}

if (!nextConfig.includes('webpackBuildWorker: false')) throw new Error('Vercel build lock missing webpackBuildWorker: false')
if (!nextConfig.includes('config.cache = false')) throw new Error('Vercel build lock missing config.cache = false')
if (!pkg.includes('max-old-space-size=16384')) throw new Error('package build memory lock missing')
if (!pkg.includes('"node": "20.x"')) throw new Error('Node 20 engine lock missing')
if (nvmrc.trim() !== '20') throw new Error('.nvmrc must be 20')

console.log('✅ AC360 Phase 3O-R3 production wiring verification passed.')
console.log('✅ Cockpit de Direction now has SQL-backed CRUD tables, API dashboard/action route, guarded server execution, proof references, UI runtime strip, and preserved visual contract/build lock.')
