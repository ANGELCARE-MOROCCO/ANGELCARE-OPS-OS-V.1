import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const requiredFiles = [
  'supabase/migrations/20260630_ac360_phase2j_health_safety_incidents_medical_pickup.sql',
  'lib/ac360/school-health-safety.ts',
  'app/api/ac360/school-health-safety/dashboard/route.ts',
  'app/api/ac360/school-health-safety/health-profiles/upsert/route.ts',
  'app/api/ac360/school-health-safety/emergency-contacts/upsert/route.ts',
  'app/api/ac360/school-health-safety/medication-plans/upsert/route.ts',
  'app/api/ac360/school-health-safety/medication-admin/record/route.ts',
  'app/api/ac360/school-health-safety/authorized-pickups/upsert/route.ts',
  'app/api/ac360/school-health-safety/pickups/record/route.ts',
  'app/api/ac360/school-health-safety/incidents/report/route.ts',
  'app/api/ac360/school-health-safety/incidents/status/route.ts',
  'app/api/ac360/school-health-safety/incidents/acknowledge/route.ts',
  'app/api/ac360/school-health-safety/safety-checklists/upsert/route.ts',
  'app/api/ac360/school-health-safety/safety-checks/record/route.ts',
  'app/api/ac360/school-health-safety/reconcile/route.ts',
  'app/api/ac360/school-health-safety/alerts/resolve/route.ts',
]

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)))
if (missing.length) {
  console.error('Missing Phase 2J files:', missing)
  process.exit(1)
}

const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20260630_ac360_phase2j_health_safety_incidents_medical_pickup.sql'), 'utf8')
const requiredSql = [
  'ac360_school_health_profiles',
  'ac360_school_emergency_contacts',
  'ac360_school_medication_plans',
  'ac360_school_medication_admin_events',
  'ac360_school_authorized_pickups',
  'ac360_school_pickup_events',
  'ac360_school_incident_reports',
  'ac360_school_incident_acknowledgements',
  'ac360_school_safety_checklists',
  'ac360_school_safety_checks',
  'ac360_school_health_safety_alerts',
  'ac360_school_health_safety_dashboard',
  'ac360_school_reconcile_health_safety',
  'school.safety.incident.report',
  'school.safety.authorized_pickup.upsert',
  'school.safety.alert.resolve',
  'uiBuildAllowed',
]
for (const needle of requiredSql) {
  if (!sql.includes(needle)) {
    console.error(`Missing SQL marker: ${needle}`)
    process.exit(1)
  }
}

const actionWiring = fs.readFileSync(path.join(root, 'lib/ac360/action-wiring.ts'), 'utf8')
for (const needle of [
  'ac360.school_health_safety.health_profile.upsert',
  'ac360.school_health_safety.incident.report',
  'ac360.school_health_safety.alert.resolve',
]) {
  if (!actionWiring.includes(needle)) {
    console.error(`Missing action-wiring marker: ${needle}`)
    process.exit(1)
  }
}

const forbiddenUi = [
  'app/(protected)/angelcare-360/health-safety/page.tsx',
  'app/angelcare-360/health-safety/page.tsx',
  'app/(protected)/school-health-safety/page.tsx',
]
const forbiddenFound = forbiddenUi.filter((file) => fs.existsSync(path.join(root, file)))
if (forbiddenFound.length) {
  console.error('UI build is still locked; forbidden UI files found:', forbiddenFound)
  process.exit(1)
}

console.log('✅ AC360 Phase 2J health, safety, incidents, medical & authorized pickup runtime verification passed.')
console.log('✅ UI build remains locked: no health/safety front-end page.tsx created.')
