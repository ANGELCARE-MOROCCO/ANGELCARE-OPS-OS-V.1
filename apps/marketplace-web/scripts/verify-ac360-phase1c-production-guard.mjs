import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const requiredFiles = [
  'supabase/migrations/20260630_ac360_phase1c_production_guard_wiring.sql',
  'lib/ac360/guard.ts',
  'hooks/useAc360Guard.ts',
  'app/api/ac360/guard/check/route.ts',
  'app/api/ac360/guard/execute/route.ts',
  'app/api/ac360/capacity/snapshot/route.ts',
  'app/(protected)/angelcare-360/guardrails/page.tsx',
]

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)))
if (missing.length) {
  console.error('Missing AC360 Phase 1C files:')
  for (const file of missing) console.error(' -', file)
  process.exit(1)
}

const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20260630_ac360_phase1c_production_guard_wiring.sql'), 'utf8')
const requiredSql = [
  'create table if not exists public.ac360_guard_decisions',
  'create or replace function public.ac360_measure_capacity',
  'create or replace function public.ac360_guard_action',
  "'student.create'",
  "'communication.whatsapp_send'",
  "'ai.report_generate'",
  "'phase1c.guard.every_action_audited'",
  "'ac360.guard.execute'",
]
const missingSql = requiredSql.filter((needle) => !sql.includes(needle))
if (missingSql.length) {
  console.error('Missing AC360 Phase 1C SQL markers:')
  for (const marker of missingSql) console.error(' -', marker)
  process.exit(1)
}

const guardTs = fs.readFileSync(path.join(root, 'lib/ac360/guard.ts'), 'utf8')
const requiredTs = [
  'guardAc360Action',
  'executeAc360GuardedAction',
  'measureAc360Capacity',
  'getAc360GuardrailsCenter',
  'runAc360GuardedAction',
  "p_record_usage: Boolean(options?.recordUsage)",
]
const missingTs = requiredTs.filter((needle) => !guardTs.includes(needle))
if (missingTs.length) {
  console.error('Missing AC360 Phase 1C TS markers:')
  for (const marker of missingTs) console.error(' -', marker)
  process.exit(1)
}

const page = fs.readFileSync(path.join(root, 'app/(protected)/angelcare-360/guardrails/page.tsx'), 'utf8')
if (!page.includes('AC360-PH1C-PRODUCTION-GUARD-WIRING') || !page.includes('runAc360GuardedAction')) {
  console.error('Guardrails page does not expose the Phase 1C doctrine and wiring pattern.')
  process.exit(1)
}

const foundationPage = fs.readFileSync(path.join(root, 'app/(protected)/angelcare-360/foundation/page.tsx'), 'utf8')
const billingPage = fs.readFileSync(path.join(root, 'app/(protected)/angelcare-360/billing-center/page.tsx'), 'utf8')
if (!foundationPage.includes('/angelcare-360/guardrails') || !billingPage.includes('/angelcare-360/guardrails')) {
  console.error('Guardrails route is not linked from foundation and billing center pages.')
  process.exit(1)
}

console.log('✅ AC360 Phase 1C production guard wiring verification passed.')
console.log('Files checked:', requiredFiles.length)
console.log('Guard doctrine: organization → subscription → entitlement → capacity/usage/credits → allow/block → execute → record usage → restrictions/recommendations → audit.')
