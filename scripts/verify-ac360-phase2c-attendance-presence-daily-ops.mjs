#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
let ts = null
try { ts = require('typescript') } catch {
  try { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js') } catch { ts = null }
}

const root = process.cwd()
const requiredFiles = [
  'supabase/migrations/20260630_ac360_phase2c_attendance_presence_daily_ops.sql',
  'lib/ac360/school-attendance.ts',
  'lib/ac360/action-wiring.ts',
  'app/api/ac360/school-attendance/dashboard/route.ts',
  'app/api/ac360/school-attendance/sessions/open/route.ts',
  'app/api/ac360/school-attendance/sessions/close/route.ts',
  'app/api/ac360/school-attendance/events/record/route.ts',
  'app/api/ac360/school-attendance/corrections/request/route.ts',
  'app/api/ac360/school-attendance/corrections/decide/route.ts',
  'app/api/ac360/school-attendance/daily/reconcile/route.ts',
  'app/api/ac360/school-attendance/alerts/resolve/route.ts',
]

let ok = true
function fail(message) { console.error(`❌ ${message}`); ok = false }
function pass(message) { console.log(`✅ ${message}`) }
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8') }

for (const rel of requiredFiles) {
  if (!fs.existsSync(path.join(root, rel))) fail(`Missing required file: ${rel}`)
}
if (!ok) process.exit(1)
pass('Required Phase 2C files present')

const sql = read('supabase/migrations/20260630_ac360_phase2c_attendance_presence_daily_ops.sql')
const requiredSql = [
  'ac360_school_attendance_policy_profiles',
  'ac360_school_attendance_daybooks',
  'ac360_school_attendance_events',
  'ac360_school_attendance_corrections',
  'ac360_school_daily_ops_reconcile_runs',
  'ac360_school_daily_ops_alerts',
  'ac360_school_find_or_create_daybook',
  'ac360_school_refresh_daybook_counts',
  'ac360_school_open_attendance_session',
  'ac360_school_record_attendance_event',
  'ac360_school_request_attendance_correction',
  'ac360_school_decide_attendance_correction',
  'ac360_school_close_attendance_session',
  'ac360_school_run_daily_ops_reconcile',
  'ac360_school_resolve_daily_ops_alert',
  'ac360_school_attendance_daily_dashboard',
  'school.attendance.session.open',
  'school.attendance.event.record',
  'school.attendance.correction.request',
  'school.attendance.correction.decide',
  'school.attendance.session.close',
  'school.daily_ops.reconcile',
  'school.daily_ops.alert.resolve',
]
for (const token of requiredSql) {
  if (!sql.includes(token)) fail(`SQL missing token: ${token}`)
}
if (!sql.includes('enable row level security')) fail('SQL must enable RLS for new attendance/daily ops tables')
if (!sql.includes('service_role_all')) fail('SQL must create service-role policies for backend API control')
if (!sql.includes('uiBuildAllowed') && !sql.includes('ui_build_allowed')) fail('SQL must keep UI build locked')
if (ok) pass('SQL attendance tables/RPCs/action wiring/automation seeds verified')

const wiring = read('lib/ac360/action-wiring.ts')
const requiredWiring = [
  'ac360.school_attendance.session.open',
  'ac360.school_attendance.event.record',
  'ac360.school_attendance.correction.request',
  'ac360.school_attendance.correction.decide',
  'ac360.school_attendance.session.close',
  'ac360.school_daily_ops.reconcile',
  'ac360.school_daily_ops.alert.resolve',
]
for (const token of requiredWiring) {
  if (!wiring.includes(token)) fail(`action-wiring.ts missing ${token}`)
}
if (ok) pass('Static action wiring includes all Phase 2C attendance/daily ops guarded actions')

const lib = read('lib/ac360/school-attendance.ts')
const requiredLib = [
  'openAc360AttendanceSession',
  'recordAc360AttendanceEvent',
  'requestAc360AttendanceCorrection',
  'decideAc360AttendanceCorrection',
  'closeAc360AttendanceSession',
  'reconcileAc360DailyOperations',
  'resolveAc360DailyOpsAlert',
  'getAc360SchoolAttendanceDashboard',
  'runAc360WiredAction',
  'phase_2c_attendance_presence_daily_ops',
]
for (const token of requiredLib) {
  if (!lib.includes(token)) fail(`school-attendance.ts missing ${token}`)
}
if (ok) pass('Attendance runtime library exposes guarded backend functions')

const forbiddenUiPaths = [
  'app/angelcare-360/attendance/page.tsx',
  'app/angelcare-360/daily-operations/page.tsx',
  'app/(protected)/angelcare-360/attendance/page.tsx',
  'app/(protected)/angelcare-360/daily-operations/page.tsx',
]
for (const rel of forbiddenUiPaths) {
  if (fs.existsSync(path.join(root, rel))) fail(`Phase 2C must not create front-end UI page yet: ${rel}`)
}
if (ok) pass('No attendance/daily operations front-end UI pages created')

if (ts) {
  const tsFiles = requiredFiles.filter((rel) => rel.endsWith('.ts'))
  for (const rel of tsFiles) {
    const source = read(rel)
    const result = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        strict: false,
        noEmitOnError: false,
      },
      fileName: rel,
      reportDiagnostics: true,
    })
    const diagnostics = result.diagnostics || []
    const blocking = diagnostics.filter((d) => d.category === ts.DiagnosticCategory.Error)
    if (blocking.length) {
      fail(`TypeScript transpile diagnostics in ${rel}: ${blocking.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('; ')}`)
    }
  }
  if (ok) pass('Phase 2C TypeScript/route transpile check passed')
} else {
  console.warn('⚠️ TypeScript package not available; structural verification completed without transpile check.')
}

if (!ok) process.exit(1)
console.log('✅ AC360 Phase 2C attendance, presence & daily operations runtime verification passed.')
