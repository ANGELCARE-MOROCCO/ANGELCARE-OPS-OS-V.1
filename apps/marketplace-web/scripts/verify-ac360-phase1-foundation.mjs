import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const requiredFiles = [
  'supabase/migrations/20260630_ac360_phase1_foundation.sql',
  'lib/ac360/types.ts',
  'lib/ac360/constants.ts',
  'lib/ac360/foundation.ts',
  'app/api/ac360/foundation/route.ts',
  'app/api/ac360/entitlements/evaluate/route.ts',
  'app/api/ac360/usage/record/route.ts',
  'app/api/ac360/restrictions/route.ts',
  'app/(protected)/angelcare-360/page.tsx',
  'app/(protected)/angelcare-360/foundation/page.tsx',
  'docs/ANGELCARE_360_PHASE1_FOUNDATION.md',
]

const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20260630_ac360_phase1_foundation.sql'), 'utf8')
const constants = fs.readFileSync(path.join(root, 'lib/ac360/constants.ts'), 'utf8')

const requiredTables = [
  'ac360_organizations','ac360_campuses','ac360_legal_profiles','ac360_academic_years',
  'ac360_user_memberships','ac360_permissions','ac360_roles','ac360_role_permissions','ac360_user_role_assignments',
  'ac360_audit_logs','ac360_foundation_engines','ac360_feature_registry','ac360_action_registry',
  'ac360_plans','ac360_plan_versions','ac360_plan_entitlements','ac360_addons','ac360_addon_entitlements',
  'ac360_serenite_bundles','ac360_professional_services_catalog','ac360_subscriptions','ac360_subscription_items',
  'ac360_quotes','ac360_contracts','ac360_invoices','ac360_invoice_lines','ac360_payments',
  'ac360_usage_meters','ac360_usage_events','ac360_usage_summaries','ac360_credit_wallets','ac360_credit_ledger',
  'ac360_capacity_snapshots','ac360_trials','ac360_grace_periods','ac360_restriction_rules','ac360_restrictions',
  'ac360_recommendations','ac360_automation_rules',
]
const requiredSeeds = ['start','pro','command','advanced_admissions','finance_power','workflow_builder','parenttrust','serenite_essential','AC360-ENG-52','ac360_has_feature','ac360_record_usage']

const missingFiles = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)))
const missingTables = requiredTables.filter((table) => !sql.includes(`public.${table}`) && !sql.includes(table))
const missingSeeds = requiredSeeds.filter((seed) => !sql.includes(seed))
const engineCodes = [...sql.matchAll(/AC360-ENG-\d{2}/g)].map((m) => m[0])
const uniqueEngineCodes = new Set(engineCodes)
const constantsHasCounts = constants.includes('AC360_FULL_ENGINE_COUNT = 52') && constants.includes('AC360_PHASE1_ENGINE_COUNT')

const checks = [
  { name: 'Required files present', passed: missingFiles.length === 0, details: missingFiles },
  { name: 'Required tables present in SQL', passed: missingTables.length === 0, details: missingTables },
  { name: 'Seeds present', passed: missingSeeds.length === 0, details: missingSeeds },
  { name: '52 engine map present', passed: uniqueEngineCodes.size >= 52, details: [`found=${uniqueEngineCodes.size}`] },
  { name: 'Constants lock counts', passed: constantsHasCounts, details: [] },
  { name: 'No dark UI route added', passed: !fs.readFileSync(path.join(root, 'app/(protected)/angelcare-360/foundation/page.tsx'), 'utf8').includes('black'), details: [] },
]

const failed = checks.filter((check) => !check.passed)
console.log('AC360 Phase 1 Foundation Verification')
for (const check of checks) {
  console.log(`${check.passed ? '✅' : '❌'} ${check.name}${check.details.length ? ` :: ${check.details.join(', ')}` : ''}`)
}
if (failed.length) process.exit(1)
