import { existsSync, readFileSync } from 'node:fs'

const requiredFiles = [
  'supabase/migrations/20260630_ac360_phase2u_final_backend_lock_sql_compat_pre_ui_handoff.sql',
  'lib/ac360/phase2-final-lock.ts',
  'app/api/ac360/phase2-final-lock/dashboard/route.ts',
  'app/api/ac360/phase2-final-lock/sql-compatibility/sweep/route.ts',
  'app/api/ac360/phase2-final-lock/backend-lock/evaluate/route.ts',
  'app/api/ac360/phase2-final-lock/release-manifest/create/route.ts',
  'app/api/ac360/phase2-final-lock/pre-ui-handoff/create/route.ts',
  'app/api/ac360/phase2-final-lock/alerts/resolve/route.ts',
]

for (const file of requiredFiles) {
  if (!existsSync(file)) throw new Error(`Missing Phase 2U file: ${file}`)
}

const sql = readFileSync('supabase/migrations/20260630_ac360_phase2u_final_backend_lock_sql_compat_pre_ui_handoff.sql', 'utf8')
const wiring = readFileSync('lib/ac360/action-wiring.ts', 'utf8')
const lib = readFileSync('lib/ac360/phase2-final-lock.ts', 'utf8')

const requiredSql = [
  'ac360_phase2u_sql_compatibility_sweeps',
  'ac360_phase2u_sql_compatibility_results',
  'ac360_phase2u_final_backend_locks',
  'ac360_phase2u_final_backend_lock_results',
  'ac360_phase2u_release_manifests',
  'ac360_phase2u_pre_ui_handoffs',
  'ac360_phase2u_add_sql_result',
  'ac360_phase2u_add_lock_result',
  'ac360_run_phase2u_sql_compatibility_sweep',
  'ac360_evaluate_phase2u_final_backend_lock',
  'ac360_create_phase2u_release_manifest',
  'ac360_create_phase2u_pre_ui_handoff',
  'ac360_phase2u_final_lock_dashboard',
  'ui_build_allowed boolean not null default false',
  'requiresUserUiInstructions',
  'waiting_for_user_instructions',
]

for (const needle of requiredSql) {
  if (!sql.includes(needle)) throw new Error(`Phase 2U SQL missing: ${needle}`)
}

const requiredKeys = [
  'ac360.phase2u.sql_compatibility_sweep.run',
  'ac360.phase2u.final_backend_lock.evaluate',
  'ac360.phase2u.release_manifest.create',
  'ac360.phase2u.pre_ui_handoff.create',
  'ac360.phase2u.alert.resolve',
]

for (const key of requiredKeys) {
  if (!wiring.includes(key)) throw new Error(`Phase 2U action wiring missing: ${key}`)
  if (!lib.includes(key)) throw new Error(`Phase 2U library missing: ${key}`)
}

const forbiddenUi = [
  'app/(protected)/angelcare-360/phase2-final-lock/page.tsx',
  'app/(protected)/angelcare-360/final-backend-lock/page.tsx',
  'app/(protected)/angelcare-360/pre-ui-handoff/page.tsx',
  'app/(protected)/angelcare-360/school-dashboard/page.tsx',
  'app/(protected)/angelcare-360/ui/page.tsx',
]
for (const file of forbiddenUi) {
  if (existsSync(file)) throw new Error(`UI build lock violated by ${file}`)
}

if (!sql.includes('check (ui_build_allowed = false)')) {
  throw new Error('Phase 2U migration must enforce ui_build_allowed=false')
}

if (sql.includes("'professional_services'")) {
  throw new Error('Phase 2U SQL must not reintroduce unsupported feature billing_family values')
}

console.log('✅ AC360 Phase 2U final backend deployment lock, SQL compatibility sweep & pre-UI handoff verification passed.')
console.log('✅ UI build remains locked: Phase 2U creates no AC360 front-end pages.')
console.log('✅ Phase 2U explicitly requires user visual/UX instructions before any UI/front-end build.')
