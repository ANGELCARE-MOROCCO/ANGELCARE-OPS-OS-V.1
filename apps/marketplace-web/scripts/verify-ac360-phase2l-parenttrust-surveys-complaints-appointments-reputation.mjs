#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const requiredFiles = [
  'supabase/migrations/20260630_ac360_phase2l_parenttrust_surveys_complaints_appointments_reputation.sql',
  'lib/ac360/school-parenttrust.ts',
  'app/api/ac360/school-parenttrust/dashboard/route.ts',
  'app/api/ac360/school-parenttrust/survey-templates/upsert/route.ts',
  'app/api/ac360/school-parenttrust/surveys/launch/route.ts',
  'app/api/ac360/school-parenttrust/surveys/responses/record/route.ts',
  'app/api/ac360/school-parenttrust/complaints/open/route.ts',
  'app/api/ac360/school-parenttrust/complaints/status/route.ts',
  'app/api/ac360/school-parenttrust/appointment-slots/upsert/route.ts',
  'app/api/ac360/school-parenttrust/appointments/book/route.ts',
  'app/api/ac360/school-parenttrust/appointments/status/route.ts',
  'app/api/ac360/school-parenttrust/reputation-requests/create/route.ts',
  'app/api/ac360/school-parenttrust/testimonials/record/route.ts',
  'app/api/ac360/school-parenttrust/reconcile/route.ts',
  'app/api/ac360/school-parenttrust/alerts/resolve/route.ts',
]

let failed = false
for (const rel of requiredFiles) {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error(`❌ Missing required file: ${rel}`)
    failed = true
  }
}

const sqlPath = path.join(root, requiredFiles[0])
const sql = fs.readFileSync(sqlPath, 'utf8')
const requiredSql = [
  'ac360_school_parenttrust_survey_templates',
  'ac360_school_parenttrust_surveys',
  'ac360_school_parenttrust_survey_responses',
  'ac360_school_parenttrust_complaints',
  'ac360_school_parenttrust_complaint_events',
  'ac360_school_parenttrust_appointment_slots',
  'ac360_school_parenttrust_appointments',
  'ac360_school_parenttrust_reputation_requests',
  'ac360_school_parenttrust_testimonials',
  'ac360_school_parenttrust_snapshots',
  'ac360_school_parenttrust_alerts',
  'ac360_school_parenttrust_dashboard',
  'ac360_school_upsert_parenttrust_survey_template',
  'ac360_school_launch_parenttrust_survey',
  'ac360_school_record_parenttrust_survey_response',
  'ac360_school_open_parenttrust_complaint',
  'ac360_school_update_parenttrust_complaint_status',
  'ac360_school_upsert_parenttrust_appointment_slot',
  'ac360_school_book_parenttrust_appointment',
  'ac360_school_update_parenttrust_appointment_status',
  'ac360_school_create_parenttrust_reputation_request',
  'ac360_school_record_parenttrust_testimonial',
  'ac360_school_reconcile_parenttrust_runtime',
  'ac360_school_resolve_parenttrust_alert',
  'parenttrust_module',
  'school.parenttrust.survey_template.upsert',
  'school.parenttrust.survey.launch',
  'school.parenttrust.survey.response.record',
  'school.parenttrust.complaint.open',
  'school.parenttrust.complaint.status.update',
  'school.parenttrust.appointment_slot.upsert',
  'school.parenttrust.appointment.book',
  'school.parenttrust.appointment.status.update',
  'school.parenttrust.reputation_request.create',
  'school.parenttrust.testimonial.record',
  'school.parenttrust.reconcile',
  'school.parenttrust.alert.resolve',
  'uiBuildAllowed',
]
for (const token of requiredSql) {
  if (!sql.includes(token)) {
    console.error(`❌ Migration missing token: ${token}`)
    failed = true
  }
}

const forbiddenUi = [
  'app/(protected)/angelcare-360/parenttrust/page.tsx',
  'app/(protected)/angelcare-360/school-parenttrust/page.tsx',
  'app/(protected)/angelcare-360/reputation/page.tsx',
]
for (const rel of forbiddenUi) {
  if (fs.existsSync(path.join(root, rel))) {
    console.error(`❌ UI build lock violated: ${rel}`)
    failed = true
  }
}

const lib = fs.readFileSync(path.join(root, 'lib/ac360/school-parenttrust.ts'), 'utf8')
for (const token of ['runAc360WiredAction','resolveAc360SchoolOpsContext','uiBuildAllowed: false','guarded.guard.reason']) {
  if (!lib.includes(token)) {
    console.error(`❌ ParentTrust library missing token: ${token}`)
    failed = true
  }
}

if (failed) process.exit(1)
console.log('✅ AC360 Phase 2L ParentTrust, surveys, complaints, appointments & reputation runtime verification passed.')
console.log('✅ UI build remains locked: no ParentTrust/front-end page.tsx created.')
