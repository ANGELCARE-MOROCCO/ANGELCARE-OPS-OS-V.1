import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const requiredFiles = [
  'supabase/migrations/20260630_ac360_phase2h_admissions_crm_leads_visits_conversion.sql',
  'lib/ac360/school-admissions.ts',
  'app/api/ac360/school-admissions/dashboard/route.ts',
  'app/api/ac360/school-admissions/leads/create/route.ts',
  'app/api/ac360/school-admissions/convert/route.ts',
]

const missing = requiredFiles.filter((rel) => !fs.existsSync(path.join(root, rel)))
if (missing.length) {
  console.error('❌ Missing Phase 2H files:', missing.join(', '))
  process.exit(1)
}

const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20260630_ac360_phase2h_admissions_crm_leads_visits_conversion.sql'), 'utf8')
const lib = fs.readFileSync(path.join(root, 'lib/ac360/school-admissions.ts'), 'utf8')

const requiredSqlTokens = [
  'ac360_school_admission_leads',
  'ac360_school_admission_visits',
  'ac360_school_admission_followups',
  'ac360_school_admission_offers',
  'ac360_school_enrollment_applications',
  'ac360_school_admission_import_batches',
  'ac360_school_admission_duplicate_findings',
  'ac360_school_admission_conversion_events',
  'ac360_school_admission_snapshots',
  'ac360_school_admission_alerts',
  'ac360_school_create_admission_lead',
  'ac360_school_convert_admission_to_student',
  'school.admissions.lead.create',
  'school.admissions.convert_to_student',
  'phase_2h_admissions_crm',
  'uiBuildAllowed',
  'archiveNotDelete',
]

const missingTokens = requiredSqlTokens.filter((token) => !sql.includes(token))
if (missingTokens.length) {
  console.error('❌ Phase 2H SQL missing tokens:', missingTokens.join(', '))
  process.exit(1)
}

const requiredLibTokens = [
  'runAc360WiredAction',
  'resolveAc360SchoolOpsContext',
  'createAc360AdmissionLead',
  'convertAc360AdmissionToStudent',
  'getAc360SchoolAdmissionsDashboard',
  'uiBuildAllowed: false',
]
const missingLibTokens = requiredLibTokens.filter((token) => !lib.includes(token))
if (missingLibTokens.length) {
  console.error('❌ Phase 2H lib missing tokens:', missingLibTokens.join(', '))
  process.exit(1)
}

const forbiddenUiFiles = [
  'app/(protected)/angelcare-360/admissions/page.tsx',
  'app/(protected)/angelcare-360/school-admissions/page.tsx',
  'app/angelcare-360/admissions/page.tsx',
]
const createdUi = forbiddenUiFiles.filter((rel) => fs.existsSync(path.join(root, rel)))
if (createdUi.length) {
  console.error('❌ UI build is still locked. Remove forbidden Phase 2H UI files:', createdUi.join(', '))
  process.exit(1)
}

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })
}

const routeCount = walk(path.join(root, 'app/api/ac360/school-admissions')).filter((file) => file.endsWith('route.ts')).length

if (routeCount < 17) {
  console.error(`❌ Expected at least 17 Phase 2H backend routes, found ${routeCount}.`)
  process.exit(1)
}

console.log('✅ AC360 Phase 2H admissions CRM, leads, visits & enrollment conversion runtime verification passed.')
console.log('✅ UI build remains locked: no admissions/front-end page.tsx created.')
console.log('✅ Phase 2H backend route count:', routeCount)
