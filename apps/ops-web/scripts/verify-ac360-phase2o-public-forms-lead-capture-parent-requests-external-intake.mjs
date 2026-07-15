import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const requiredFiles = [
  'supabase/migrations/20260630_ac360_phase2o_public_forms_lead_capture_parent_requests_external_intake.sql',
  'lib/ac360/school-intake.ts',
  'app/api/ac360/school-intake/dashboard/route.ts',
  'app/api/ac360/school-intake/forms/upsert/route.ts',
  'app/api/ac360/school-intake/forms/publish/route.ts',
  'app/api/ac360/school-intake/submissions/create/route.ts',
  'app/api/ac360/school-intake/submissions/status/route.ts',
  'app/api/ac360/school-intake/lead-capture/process/route.ts',
  'app/api/ac360/school-intake/parent-requests/create/route.ts',
  'app/api/ac360/school-intake/parent-requests/status/route.ts',
  'app/api/ac360/school-intake/external-sources/upsert/route.ts',
  'app/api/ac360/school-intake/mappings/upsert/route.ts',
  'app/api/ac360/school-intake/reconcile/route.ts',
  'app/api/ac360/school-intake/alerts/resolve/route.ts',
]

const requiredSql = [
  'ac360_school_intake_forms',
  'ac360_school_intake_form_fields',
  'ac360_school_external_intake_sources',
  'ac360_school_intake_mappings',
  'ac360_school_intake_submissions',
  'ac360_school_parent_requests',
  'ac360_school_lead_capture_events',
  'ac360_school_intake_snapshots',
  'ac360_school_intake_alerts',
  'ac360_school_upsert_intake_form',
  'ac360_school_publish_intake_form',
  'ac360_school_create_intake_submission',
  'ac360_school_process_lead_capture',
  'ac360_school_reconcile_intake',
  'public_forms_intake',
  'public_forms_lead_capture',
  'school.intake.form.upsert',
  'school.intake.alert.resolve',
]

let failed = false
for (const rel of requiredFiles) {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error(`❌ Missing required file: ${rel}`)
    failed = true
  }
}

const sqlPath = path.join(root, 'supabase/migrations/20260630_ac360_phase2o_public_forms_lead_capture_parent_requests_external_intake.sql')
const sql = fs.existsSync(sqlPath) ? fs.readFileSync(sqlPath, 'utf8') : ''
for (const token of requiredSql) {
  if (!sql.includes(token)) {
    console.error(`❌ Phase 2O SQL missing token: ${token}`)
    failed = true
  }
}

const actionWiring = fs.readFileSync(path.join(root, 'lib/ac360/action-wiring.ts'), 'utf8')
for (const token of ['ac360.school_intake.form.upsert','ac360.school_intake.submission.create','ac360.school_intake.parent_request.create','ac360.school_intake.alert.resolve']) {
  if (!actionWiring.includes(token)) {
    console.error(`❌ Static action wiring missing token: ${token}`)
    failed = true
  }
}

const forbiddenUiRoots = [
  'app/(protected)/angelcare-360/intake/page.tsx',
  'app/(protected)/school-intake/page.tsx',
  'app/school-intake/page.tsx',
  'app/angelcare-360/intake/page.tsx',
]
for (const rel of forbiddenUiRoots) {
  if (fs.existsSync(path.join(root, rel))) {
    console.error(`❌ UI build must remain locked; unexpected page exists: ${rel}`)
    failed = true
  }
}

if (failed) process.exit(1)
console.log('✅ AC360 Phase 2O public forms, lead capture, parent requests & external intake runtime verification passed.')
console.log('✅ UI build remains locked: no public forms/intake front-end page.tsx created.')
