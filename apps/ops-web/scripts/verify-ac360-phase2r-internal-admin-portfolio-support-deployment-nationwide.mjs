import { existsSync, readFileSync } from 'node:fs'

const requiredFiles = [
  'supabase/migrations/20260630_ac360_phase2r_internal_admin_portfolio_support_deployment_nationwide.sql',
  'lib/ac360/internal-admin.ts',
  'app/api/ac360/internal-admin/dashboard/route.ts',
  'app/api/ac360/internal-admin/portfolio/accounts/upsert/route.ts',
  'app/api/ac360/internal-admin/support/tickets/open/route.ts',
  'app/api/ac360/internal-admin/deployments/releases/create/route.ts',
  'app/api/ac360/internal-admin/nationwide/city-markets/upsert/route.ts',
  'app/api/ac360/internal-admin/reconcile/route.ts',
]

for (const file of requiredFiles) {
  if (!existsSync(file)) throw new Error(`Missing Phase 2R file: ${file}`)
}

const sql = readFileSync('supabase/migrations/20260630_ac360_phase2r_internal_admin_portfolio_support_deployment_nationwide.sql', 'utf8')
const actionWiring = readFileSync('lib/ac360/action-wiring.ts', 'utf8')
const lib = readFileSync('lib/ac360/internal-admin.ts', 'utf8')

const requiredSql = [
  'ac360_internal_portfolio_accounts',
  'ac360_internal_support_tickets',
  'ac360_internal_deployment_releases',
  'ac360_internal_city_markets',
  'ac360_internal_admin_dashboard',
  'ac360_internal_admin_reconcile',
  'internal_admin_portfolio',
]

for (const needle of requiredSql) {
  if (!sql.includes(needle)) throw new Error(`Phase 2R SQL missing: ${needle}`)
}

const requiredKeys = [
  'ac360.internal_admin.portfolio_account.upsert',
  'ac360.internal_admin.support_ticket.open',
  'ac360.internal_admin.deployment_release.create',
  'ac360.internal_admin.city_market.upsert',
  'ac360.internal_admin.reconcile',
  'ac360.internal_admin.alert.resolve',
]

for (const key of requiredKeys) {
  if (!actionWiring.includes(key)) throw new Error(`Phase 2R action wiring missing: ${key}`)
  if (!lib.includes(key)) throw new Error(`Phase 2R library missing: ${key}`)
}

const forbiddenUi = [
  'app/(protected)/angelcare-360/internal-admin/page.tsx',
  'app/(protected)/angelcare-360/portfolio/page.tsx',
  'app/(protected)/angelcare-360/support/page.tsx',
]
for (const file of forbiddenUi) {
  if (existsSync(file)) throw new Error(`UI build lock violated by ${file}`)
}

console.log('✅ AC360 Phase 2R internal admin, portfolio, support, deployment & nationwide success runtime verification passed.')
console.log('✅ UI build remains locked: no internal-admin/front-end page.tsx created.')
