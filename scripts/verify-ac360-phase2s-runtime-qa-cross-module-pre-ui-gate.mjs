import { existsSync, readFileSync } from 'node:fs'

const requiredFiles = [
  'supabase/migrations/20260630_ac360_phase2s_runtime_qa_cross_module_pre_ui_gate.sql',
  'lib/ac360/phase2-runtime-qa.ts',
  'app/api/ac360/phase2-runtime-qa/dashboard/route.ts',
  'app/api/ac360/phase2-runtime-qa/run/route.ts',
  'app/api/ac360/phase2-runtime-qa/coverage/refresh/route.ts',
  'app/api/ac360/phase2-runtime-qa/integrity/run/route.ts',
  'app/api/ac360/phase2-runtime-qa/pre-ui-gate/evaluate/route.ts',
  'app/api/ac360/phase2-runtime-qa/pre-ui-gate/decision/route.ts',
  'app/api/ac360/phase2-runtime-qa/hardening/events/route.ts',
  'app/api/ac360/phase2-runtime-qa/alerts/resolve/route.ts',
]

for (const file of requiredFiles) {
  if (!existsSync(file)) throw new Error(`Missing Phase 2S file: ${file}`)
}

const sql = readFileSync('supabase/migrations/20260630_ac360_phase2s_runtime_qa_cross_module_pre_ui_gate.sql', 'utf8')
const wiring = readFileSync('lib/ac360/action-wiring.ts', 'utf8')
const lib = readFileSync('lib/ac360/phase2-runtime-qa.ts', 'utf8')

const requiredSql = [
  'ac360_phase2_runtime_qa_runs',
  'ac360_phase2_runtime_qa_results',
  'ac360_phase2_module_coverage_matrix',
  'ac360_phase2_action_contracts',
  'ac360_phase2_pre_ui_gates',
  'ac360_run_phase2_runtime_qa',
  'ac360_evaluate_phase2_pre_ui_gate',
  'phase2_runtime_qa_pre_ui_gate',
  'uiBuildAllowed',
]

for (const needle of requiredSql) {
  if (!sql.includes(needle)) throw new Error(`Phase 2S SQL missing: ${needle}`)
}

const requiredKeys = [
  'ac360.phase2s.runtime_qa.run',
  'ac360.phase2s.coverage.refresh',
  'ac360.phase2s.integrity.run',
  'ac360.phase2s.pre_ui_gate.evaluate',
  'ac360.phase2s.pre_ui_gate.decide',
  'ac360.phase2s.hardening_event.record',
  'ac360.phase2s.alert.resolve',
]

for (const key of requiredKeys) {
  if (!wiring.includes(key)) throw new Error(`Phase 2S action wiring missing: ${key}`)
  if (!lib.includes(key)) throw new Error(`Phase 2S library missing: ${key}`)
}

const requiredModules = [
  'core_school_ops_skeleton',
  'student_parent_class_lifecycle',
  'attendance_presence_daily_ops',
  'finance_invoicing_receivables',
  'communication_messaging_notifications',
  'documents_reports_storage_exports',
  'tasks_approvals_workflows_operations',
  'admissions_crm_conversion',
  'hr_staffing_scheduling_leave',
  'health_safety_incidents_pickup',
  'transport_routes_vehicles_drivers',
  'parenttrust_surveys_complaints_reputation',
  'academy_training_assessments_certificates',
  'ai_automation_smart_alerts_jobs',
  'public_forms_intake',
  'branding_domains_integrations_api',
  'migration_onboarding_client_success',
  'internal_admin_nationwide_success',
  'phase2_runtime_qa_pre_ui_gate',
]

for (const moduleKey of requiredModules) {
  if (!sql.includes(moduleKey)) throw new Error(`Phase 2S coverage matrix missing module: ${moduleKey}`)
}

const forbiddenUi = [
  'app/(protected)/angelcare-360/phase2-runtime-qa/page.tsx',
  'app/(protected)/angelcare-360/school-dashboard/page.tsx',
  'app/(protected)/angelcare-360/pre-ui-gate/page.tsx',
]
for (const file of forbiddenUi) {
  if (existsSync(file)) throw new Error(`UI build lock violated by ${file}`)
}

if (!sql.includes('ui_build_allowed=false') && !sql.includes('ui_build_allowed = false')) {
  throw new Error('Phase 2S migration must keep ui_build_allowed=false')
}

console.log('✅ AC360 Phase 2S runtime QA, cross-module coverage, hardening & pre-UI gate verification passed.')
console.log('✅ UI build remains locked: Phase 2S creates no AC360 front-end pages.')
console.log('✅ Pre-UI gate is backend-only and will require user visual/UX instructions before UI build.')
