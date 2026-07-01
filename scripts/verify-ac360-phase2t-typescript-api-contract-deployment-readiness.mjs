import { existsSync, readFileSync } from 'node:fs'

const requiredFiles = [
  'supabase/migrations/20260630_ac360_phase2t_typescript_api_contract_deployment_readiness.sql',
  'lib/ac360/phase2-build-hardening.ts',
  'app/api/ac360/phase2-build-hardening/dashboard/route.ts',
  'app/api/ac360/phase2-build-hardening/typescript/run/route.ts',
  'app/api/ac360/phase2-build-hardening/api-contracts/sweep/route.ts',
  'app/api/ac360/phase2-build-hardening/deployment-readiness/evaluate/route.ts',
  'app/api/ac360/phase2-build-hardening/repairs/record/route.ts',
  'app/api/ac360/phase2-build-hardening/alerts/resolve/route.ts',
]

for (const file of requiredFiles) {
  if (!existsSync(file)) throw new Error(`Missing Phase 2T file: ${file}`)
}

const sql = readFileSync('supabase/migrations/20260630_ac360_phase2t_typescript_api_contract_deployment_readiness.sql', 'utf8')
const wiring = readFileSync('lib/ac360/action-wiring.ts', 'utf8')
const lib = readFileSync('lib/ac360/phase2-build-hardening.ts', 'utf8')

const requiredSql = [
  'ac360_phase2t_build_hardening_runs',
  'ac360_phase2t_build_hardening_results',
  'ac360_phase2t_api_contract_sweeps',
  'ac360_phase2t_api_contract_results',
  'ac360_phase2t_deployment_readiness_runs',
  'ac360_phase2t_deployment_repairs',
  'ac360_run_phase2t_typescript_hardening',
  'ac360_run_phase2t_api_contract_sweep',
  'ac360_evaluate_phase2t_deployment_readiness',
  'ac360_record_phase2t_deployment_repair',
  'ac360_phase2t_build_hardening_dashboard',
  'uiBuildAllowed',
  'backendOnly',
]

for (const needle of requiredSql) {
  if (!sql.includes(needle)) throw new Error(`Phase 2T SQL missing: ${needle}`)
}

const requiredKeys = [
  'ac360.phase2t.typescript_hardening.run',
  'ac360.phase2t.api_contract_sweep.run',
  'ac360.phase2t.deployment_readiness.evaluate',
  'ac360.phase2t.deployment_repair.record',
  'ac360.phase2t.alert.resolve',
]

for (const key of requiredKeys) {
  if (!wiring.includes(key)) throw new Error(`Phase 2T action wiring missing: ${key}`)
  if (!lib.includes(key)) throw new Error(`Phase 2T library missing: ${key}`)
}

const forbiddenUi = [
  'app/(protected)/angelcare-360/phase2-build-hardening/page.tsx',
  'app/(protected)/angelcare-360/build-hardening/page.tsx',
  'app/(protected)/angelcare-360/deployment-readiness/page.tsx',
  'app/(protected)/angelcare-360/school-dashboard/page.tsx',
]
for (const file of forbiddenUi) {
  if (existsSync(file)) throw new Error(`UI build lock violated by ${file}`)
}

if (!sql.includes('ui_build_allowed boolean not null default false')) {
  throw new Error('Phase 2T migration must keep deployment readiness ui_build_allowed=false')
}

if (/\.catch\(\s*\(\)\s*=>\s*null\s+as\s+any\s*\)/.test(lib)) {
  throw new Error('Phase 2T library must not add Supabase-style .catch(() => null as any) compatibility risks')
}

console.log('✅ AC360 Phase 2T TypeScript build hardening, API contract sweep & deployment readiness verification passed.')
console.log('✅ UI build remains locked: Phase 2T creates no AC360 front-end pages.')
console.log('✅ Phase 2T is backend/system-only and prepares the app for deployment-readiness repair before UI instructions.')
