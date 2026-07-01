#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = process.cwd()
const required = [
  'supabase/migrations/20260630_ac360_phase2i_hr_staff_scheduling_leave_staffing.sql',
  'lib/ac360/school-hr.ts',
  'app/api/ac360/school-hr/dashboard/route.ts',
  'app/api/ac360/school-hr/departments/upsert/route.ts',
  'app/api/ac360/school-hr/contracts/upsert/route.ts',
  'app/api/ac360/school-hr/shift-profiles/upsert/route.ts',
  'app/api/ac360/school-hr/schedule-cycles/open/route.ts',
  'app/api/ac360/school-hr/shifts/assign/route.ts',
  'app/api/ac360/school-hr/leave-requests/create/route.ts',
  'app/api/ac360/school-hr/staffing-requests/open/route.ts',
  'app/api/ac360/school-hr/compliance/reconcile/route.ts',
]
for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) throw new Error(`Missing required Phase 2I file: ${rel}`)
}

const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20260630_ac360_phase2i_hr_staff_scheduling_leave_staffing.sql'), 'utf8')
const expectedSql = [
  'ac360_school_hr_departments',
  'ac360_school_staff_contracts',
  'ac360_school_shift_profiles',
  'ac360_school_staff_schedule_cycles',
  'ac360_school_staff_shift_assignments',
  'ac360_school_leave_policies',
  'ac360_school_leave_requests',
  'ac360_school_staffing_requests',
  'ac360_school_staff_evaluations',
  'ac360_school_hr_events',
  'ac360_school_hr_snapshots',
  'ac360_school_hr_alerts',
  'ac360_school_hr_dashboard',
  'ac360_school_reconcile_hr',
  'school.hr.shift.assign',
  'school.hr.leave_request.create',
  'school.hr.staffing_request.open',
  'phase_2i_hr_staff_scheduling_leave_staffing',
  'uiBuildAllowed',
]
for (const token of expectedSql) {
  if (!sql.includes(token)) throw new Error(`Phase 2I SQL missing token: ${token}`)
}

const lib = fs.readFileSync(path.join(root, 'lib/ac360/school-hr.ts'), 'utf8')
for (const token of ['runAc360WiredAction', 'phase_2i_hr_staff_scheduling_leave_staffing', 'getAc360SchoolHrDashboard', 'reconcileAc360Hr']) {
  if (!lib.includes(token)) throw new Error(`Phase 2I lib missing token: ${token}`)
}

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })
}
const forbiddenUi = walk(path.join(root, 'app')).filter((file) => /school-hr|school\/hr|hr-staff/i.test(file) && file.endsWith('page.tsx'))
if (forbiddenUi.length) throw new Error(`UI build violation: ${forbiddenUi.join(', ')}`)

console.log('✅ AC360 Phase 2I HR, staff scheduling, leave & staffing runtime verification passed.')
console.log('✅ UI build remains locked: no HR/front-end page.tsx created.')
