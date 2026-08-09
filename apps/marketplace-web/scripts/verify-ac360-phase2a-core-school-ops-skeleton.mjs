import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const fail = (message) => {
  console.error(`❌ ${message}`)
  process.exitCode = 1
}
const ok = (message) => console.log(`✅ ${message}`)
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))

const requiredFiles = [
  'supabase/migrations/20260630_ac360_phase2a_core_school_ops_skeleton.sql',
  'lib/ac360/school-ops.ts',
  'app/api/ac360/school-ops/summary/route.ts',
  'app/api/ac360/school-ops/bootstrap/route.ts',
  'app/api/ac360/school-ops/[resource]/route.ts',
  'lib/ac360/action-wiring.ts',
]

for (const file of requiredFiles) {
  if (!exists(file)) fail(`Missing required Phase 2A file: ${file}`)
}
if (process.exitCode) process.exit()
ok('Required Phase 2A files present')

const sql = read('supabase/migrations/20260630_ac360_phase2a_core_school_ops_skeleton.sql')
const requiredTables = [
  'ac360_school_ops_modules',
  'ac360_school_students',
  'ac360_school_guardians',
  'ac360_school_student_guardians',
  'ac360_school_staff_profiles',
  'ac360_school_classes',
  'ac360_school_class_enrollments',
  'ac360_school_attendance_sessions',
  'ac360_school_attendance_records',
  'ac360_school_invoice_accounts',
  'ac360_school_tuition_invoices',
  'ac360_school_tuition_invoice_lines',
  'ac360_school_fee_payments',
  'ac360_school_documents',
  'ac360_school_report_jobs',
  'ac360_school_messages',
  'ac360_school_tasks',
  'ac360_school_operation_events',
]
for (const table of requiredTables) {
  if (!sql.includes(`public.${table}`)) fail(`Migration does not include table/reference: ${table}`)
}
ok('Core school operations tables present in SQL')

const requiredActions = [
  'school_ops.bootstrap',
  'school.student.create',
  'school.guardian.create',
  'school.staff.create',
  'school.class.create',
  'school.enrollment.create',
  'school.attendance.record',
  'school.invoice.create',
  'school.document.upload',
  'school.message.send',
  'school.report.generate',
  'school.task.create',
]
for (const action of requiredActions) {
  if (!sql.includes(action)) fail(`Missing Phase 2A action seed: ${action}`)
}
ok('Phase 2A guarded action registry seeds present')

const requiredWiring = [
  'ac360.school_ops.bootstrap',
  'ac360.school_ops.student.create',
  'ac360.school_ops.guardian.create',
  'ac360.school_ops.staff.create',
  'ac360.school_ops.class.create',
  'ac360.school_ops.enrollment.create',
  'ac360.school_ops.attendance.record',
  'ac360.school_ops.invoice.create',
  'ac360.school_ops.document.upload',
  'ac360.school_ops.message.send',
  'ac360.school_ops.report.generate',
  'ac360.school_ops.task.create',
]
const wiringTs = read('lib/ac360/action-wiring.ts')
for (const wiring of requiredWiring) {
  if (!sql.includes(wiring)) fail(`SQL missing app action wiring seed: ${wiring}`)
  if (!wiringTs.includes(`'${wiring}'`)) fail(`TypeScript action wiring missing static key: ${wiring}`)
}
ok('Phase 2A static and SQL action wiring present')

const apiResource = read('app/api/ac360/school-ops/[resource]/route.ts')
if (!apiResource.includes('runAc360WiredAction')) fail('Dynamic school-ops resource API does not call runAc360WiredAction')
if (!apiResource.includes('currentCapacity')) fail('Dynamic school-ops resource API does not pass current capacity into guard')
if (!apiResource.includes('ac360GuardBlockedResponse')) fail('Dynamic school-ops resource API does not use blocked-action response')
ok('Phase 2A APIs enforce AC360 guard doctrine')

if (!sql.includes('uiBuildAllowed') || !sql.includes('ui_build_allowed') || !sql.includes('no_frontend')) {
  fail('Phase 2A does not explicitly lock UI/front-end build until user instructions')
}

const forbiddenUi = [
  'app/(protected)/angelcare-360/school-ops/page.tsx',
  'app/(protected)/angelcare-360/students/page.tsx',
  'app/(protected)/angelcare-360/classes/page.tsx',
]
for (const file of forbiddenUi) {
  if (exists(file)) fail(`Forbidden front-end page was created too early: ${file}`)
}
ok('No front-end/UI school operations page created in Phase 2A')

if (!sql.includes('ac360_school_ops_readiness_dashboard') || !sql.includes('ac360_school_current_capacity') || !sql.includes('ac360_bootstrap_school_ops_skeleton')) {
  fail('Required Phase 2A readiness/capacity/bootstrap RPCs are missing')
}
ok('Phase 2A readiness, capacity and bootstrap RPCs present')

if (!process.exitCode) {
  console.log('\n✅ AC360 Phase 2A core school operations skeleton verification passed.')
}
