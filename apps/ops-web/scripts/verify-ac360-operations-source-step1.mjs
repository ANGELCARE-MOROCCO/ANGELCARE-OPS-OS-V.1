import { readFileSync, existsSync } from 'node:fs'

const requiredFiles = [
  'database/ac360_operations_source_of_truth_step1.sql',
  'lib/ac360/customer-operations-source.ts',
  'app/api/ac360/customer/operations/route.ts',
  'app/api/ac360/customer/operations/day/open/route.ts',
  'app/api/ac360/customer/operations/day/close/route.ts',
  'app/api/ac360/customer/operations/sites/route.ts',
  'app/api/ac360/customer/operations/classes/route.ts',
  'app/api/ac360/customer/operations/capacity-snapshots/route.ts',
  'app/api/ac360/customer/operations/routine-templates/route.ts',
  'app/api/ac360/customer/operations/routine-events/route.ts',
  'app/api/ac360/customer/operations/routines/[id]/complete/route.ts',
  'app/api/ac360/customer/operations/incidents/route.ts',
  'app/api/ac360/customer/operations/incidents/[id]/route.ts',
  'app/api/ac360/customer/operations/tasks/route.ts',
  'app/api/ac360/customer/operations/tasks/[id]/route.ts',
  'app/api/ac360/customer/operations/staff-coverage/route.ts',
  'app/api/ac360/customer/operations/transport-events/route.ts',
  'app/api/ac360/customer/operations/quality-checks/route.ts',
  'app/api/ac360/customer/operations/reports/route.ts',
  'AC360_OPERATIONS_SOURCE_OF_TRUTH_STEP1_README.md',
]

const missing = requiredFiles.filter((file) => !existsSync(file))
if (missing.length) {
  console.error('❌ Missing required files:')
  for (const file of missing) console.error(` - ${file}`)
  process.exit(1)
}

const sql = readFileSync('database/ac360_operations_source_of_truth_step1.sql', 'utf8')
const lib = readFileSync('lib/ac360/customer-operations-source.ts', 'utf8')
const direction = readFileSync('lib/ac360/customer-direction-cockpit-production.ts', 'utf8')

const requiredTables = [
  'ac360_ops_days',
  'ac360_ops_sites',
  'ac360_ops_classes',
  'ac360_ops_class_capacity_snapshots',
  'ac360_ops_routine_templates',
  'ac360_ops_routine_events',
  'ac360_ops_incidents',
  'ac360_ops_tasks',
  'ac360_ops_staff_coverage',
  'ac360_ops_transport_events',
  'ac360_ops_quality_checks',
  'ac360_ops_day_closures',
  'ac360_ops_audit_events',
]

const missingTables = requiredTables.filter((table) => !sql.includes(`public.${table}`) || !lib.includes(table))
if (missingTables.length) {
  console.error('❌ Missing table references in SQL or runtime lib:')
  for (const table of missingTables) console.error(` - ${table}`)
  process.exit(1)
}

const requiredOps = [
  'day.open',
  'day.close',
  'site.upsert',
  'class.upsert',
  'capacity.snapshot',
  'routine.template.create',
  'routine.event.create',
  'routine.complete',
  'incident.create',
  'incident.status',
  'task.create',
  'task.status',
  'staff.coverage.record',
  'transport.event.create',
  'quality.check.create',
  'report.queue',
]

const missingOps = requiredOps.filter((operation) => !lib.includes(operation))
if (missingOps.length) {
  console.error('❌ Missing operation handlers:')
  for (const operation of missingOps) console.error(` - ${operation}`)
  process.exit(1)
}

const bannedClientWords = ['Supabase', 'SQL requis', 'Phase 3']
const readme = readFileSync('AC360_OPERATIONS_SOURCE_OF_TRUTH_STEP1_README.md', 'utf8')
const bannedHits = bannedClientWords.filter((word) => readme.includes(word))
if (bannedHits.length) {
  console.error('❌ README contains client-facing banned wording:', bannedHits.join(', '))
  process.exit(1)
}

if (!sql.includes('ac360_ops_runtime_summary')) {
  console.error('❌ Runtime summary function missing.')
  process.exit(1)
}

if (!direction.includes('loadOperationsSourceSummary') || !direction.includes('operationsSource')) {
  console.error('❌ Direction Cockpit is not synced to Operations source summary.')
  process.exit(1)
}

if (!sql.includes('enable row level security')) {
  console.error('❌ RLS enablement missing.')
  process.exit(1)
}

console.log('✅ AC360 Operations Source-of-Truth Step 1 verification passed.')
console.log('✅ Database backbone, runtime summary, APIs, governed source workflow operations and audit/proof events are present.')
