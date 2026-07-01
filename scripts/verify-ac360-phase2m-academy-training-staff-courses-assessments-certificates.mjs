#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const root = process.cwd()
const requiredFiles = [
  'supabase/migrations/20260630_ac360_phase2m_academy_training_staff_courses_assessments_certificates.sql',
  'lib/ac360/school-academy.ts',
  'app/api/ac360/school-academy/dashboard/route.ts',
  'app/api/ac360/school-academy/programs/upsert/route.ts',
  'app/api/ac360/school-academy/courses/upsert/route.ts',
  'app/api/ac360/school-academy/sessions/schedule/route.ts',
  'app/api/ac360/school-academy/enrollments/staff/route.ts',
  'app/api/ac360/school-academy/attendance/record/route.ts',
  'app/api/ac360/school-academy/assessments/upsert/route.ts',
  'app/api/ac360/school-academy/assessment-results/record/route.ts',
  'app/api/ac360/school-academy/certificates/issue/route.ts',
  'app/api/ac360/school-academy/assignments/create/route.ts',
  'app/api/ac360/school-academy/reconcile/route.ts',
  'app/api/ac360/school-academy/alerts/resolve/route.ts',
]

const requiredSqlTokens = [
  'ac360_school_academy_programs',
  'ac360_school_academy_courses',
  'ac360_school_academy_sessions',
  'ac360_school_academy_enrollments',
  'ac360_school_academy_attendance',
  'ac360_school_academy_assessments',
  'ac360_school_academy_assessment_results',
  'ac360_school_academy_certificates',
  'ac360_school_academy_training_assignments',
  'ac360_school_academy_dashboard',
  'academy_training_module',
  'school.academy.program.upsert',
  'school.academy.course.upsert',
  'school.academy.session.schedule',
  'school.academy.staff.enroll',
  'school.academy.attendance.record',
  'school.academy.assessment.upsert',
  'school.academy.assessment_result.record',
  'school.academy.certificate.issue',
  'school.academy.assignment.create',
  'school.academy.reconcile',
  'school.academy.alert.resolve',
  'ac360_school_ops_modules',
  'uiBuildAllowed',
]

const missingFiles = requiredFiles.filter(f => !fs.existsSync(path.join(root, f)))
if (missingFiles.length) {
  console.error('❌ Missing Phase 2M files:', missingFiles.join('\n - '))
  process.exit(1)
}

const sqlPath = path.join(root, requiredFiles[0])
const sql = fs.readFileSync(sqlPath, 'utf8')
const missingTokens = requiredSqlTokens.filter(t => !sql.includes(t))
if (missingTokens.length) {
  console.error('❌ Missing Phase 2M SQL tokens:', missingTokens.join('\n - '))
  process.exit(1)
}

const lib = fs.readFileSync(path.join(root, 'lib/ac360/school-academy.ts'), 'utf8')
for (const token of ['runAc360WiredAction', 'resolveAc360SchoolOpsContext', 'phase_2m_academy_training_staff_courses_assessments_certificates']) {
  if (!lib.includes(token)) {
    console.error(`❌ Missing library token: ${token}`)
    process.exit(1)
  }
}

const forbiddenUiPaths = [
  'app/(protected)/angelcare-360/academy/page.tsx',
  'app/(protected)/angelcare-360/school-academy/page.tsx',
  'app/angelcare-360/school-academy/page.tsx',
  'app/ac360/academy/page.tsx',
]
const createdUi = forbiddenUiPaths.filter(f => fs.existsSync(path.join(root, f)))
if (createdUi.length) {
  console.error('❌ UI build drift detected. Phase 2M must remain backend-only:', createdUi.join('\n - '))
  process.exit(1)
}

console.log('✅ AC360 Phase 2M Academy Training, Staff Courses, Assessments & Certificates runtime verification passed.')
console.log('✅ UI build remains locked: no Academy/front-end page.tsx created.')
