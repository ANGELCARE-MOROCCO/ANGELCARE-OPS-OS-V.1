
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const requiredFiles = [
  'supabase/migrations/20260630_ac360_phase2k_transport_routes_vehicles_drivers_runtime.sql',
  'lib/ac360/school-transport.ts',
  'app/api/ac360/school-transport/dashboard/route.ts',
  'app/api/ac360/school-transport/vehicles/upsert/route.ts',
  'app/api/ac360/school-transport/drivers/upsert/route.ts',
  'app/api/ac360/school-transport/routes/upsert/route.ts',
  'app/api/ac360/school-transport/route-stops/upsert/route.ts',
  'app/api/ac360/school-transport/students/assign/route.ts',
  'app/api/ac360/school-transport/route-runs/open/route.ts',
  'app/api/ac360/school-transport/route-runs/events/record/route.ts',
  'app/api/ac360/school-transport/route-runs/close/route.ts',
  'app/api/ac360/school-transport/safety-checks/record/route.ts',
  'app/api/ac360/school-transport/billing/reconcile/route.ts',
  'app/api/ac360/school-transport/reconcile/route.ts',
  'app/api/ac360/school-transport/alerts/resolve/route.ts',
]

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)))
if (missing.length) {
  console.error('Missing Phase 2K files:')
  for (const file of missing) console.error(`- ${file}`)
  process.exit(1)
}

const migration = fs.readFileSync(path.join(root, requiredFiles[0]), 'utf8')
const requiredTokens = [
  'ac360_school_transport_vehicles',
  'ac360_school_transport_drivers',
  'ac360_school_transport_routes',
  'ac360_school_transport_route_stops',
  'ac360_school_transport_student_assignments',
  'ac360_school_transport_route_runs',
  'ac360_school_transport_run_events',
  'ac360_school_transport_safety_checks',
  'ac360_school_transport_billing_records',
  'ac360_school_transport_alerts',
  'ac360_school_transport_dashboard',
  'ac360_school_reconcile_transport_runtime',
  'school.transport.vehicle.upsert',
  'school.transport.driver.upsert',
  'school.transport.route.upsert',
  'school.transport.route_stop.upsert',
  'school.transport.student.assign',
  'school.transport.route_run.open',
  'school.transport.route_run.event.record',
  'school.transport.route_run.close',
  'school.transport.safety_check.record',
  'school.transport.billing.reconcile',
  'school.transport.reconcile',
  'school.transport.alert.resolve',
  'uiBuildAllowed":false',
]
for (const token of requiredTokens) {
  if (!migration.includes(token)) {
    console.error(`Missing Phase 2K migration token: ${token}`)
    process.exit(1)
  }
}

const lib = fs.readFileSync(path.join(root, 'lib/ac360/school-transport.ts'), 'utf8')
for (const token of ['runAc360WiredAction', 'resolveAc360SchoolOpsContext', 'phase_2k_transport_routes_vehicles_drivers']) {
  if (!lib.includes(token)) {
    console.error(`Missing Phase 2K lib token: ${token}`)
    process.exit(1)
  }
}

const actionWiring = fs.readFileSync(path.join(root, 'lib/ac360/action-wiring.ts'), 'utf8')
for (const token of ['ac360.school_transport.vehicle.upsert', '/api/ac360/school-transport/routes/upsert', 'school.transport.reconcile']) {
  if (!actionWiring.includes(token)) {
    console.error(`Missing Phase 2K action-wiring token: ${token}`)
    process.exit(1)
  }
}

const forbiddenPages = [
  'app/(protected)/angelcare-360/transport/page.tsx',
  'app/(protected)/angelcare-360/school-transport/page.tsx',
  'app/angelcare-360/transport/page.tsx',
  'app/angelcare-360/school-transport/page.tsx',
]
for (const file of forbiddenPages) {
  if (fs.existsSync(path.join(root, file))) {
    console.error(`UI build violation: ${file} must not exist before UI instructions.`)
    process.exit(1)
  }
}

console.log('✅ AC360 Phase 2K transport, routes, vehicles, drivers & pickup/drop-off runtime verification passed.')
console.log('✅ UI build remains locked: no transport/front-end page.tsx created.')
