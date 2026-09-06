#!/usr/bin/env node

// Static source certification only. This script never connects to Supabase.
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')
const fail = (message) => { throw new Error(`SANILA_MASTER_DEMO_STATIC_CERTIFICATION_FAILED: ${message}`) }
const assert = (condition, message) => { if (!condition) fail(message) }

const identity = {
  school: '8bc47614-f16c-41c0-8d37-22fe78b08cad',
  tenant: '85a655be-a92b-4b82-8e60-130f4e7c8e2f',
  config: '5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a',
  admin: '25d16e25-2dd7-4c19-afb9-800609b3ba8a',
}

const forecast = {
  angelcare360_school_settings: 1,
  angelcare360_academic_years: 1,
  angelcare360_terms: 3,
  angelcare360_governance_sites: 1,
  angelcare360_classes: 36,
  angelcare360_sections: 36,
  angelcare360_school_day_rules: 5,
  angelcare360_school_calendar_events: 8,
  angelcare360_timetable_slots: 180,
  angelcare360_subjects: 12,
  angelcare360_staff: 72,
  angelcare360_staff_contracts: 72,
  angelcare360_parents: 450,
  angelcare360_students: 600,
  angelcare360_student_parent_links: 600,
  angelcare360_class_enrollments: 600,
  angelcare360_emergency_contacts: 60,
  angelcare360_area11_families: 450,
  angelcare360_area11_family_memberships: 600,
  angelcare360_admission_applications: 60,
  angelcare360_class_subjects: 144,
  angelcare360_teacher_assignments: 144,
  angelcare360_lessons: 36,
  angelcare360_assignments: 36,
  angelcare360_assignment_submissions: 600,
  angelcare360_exams: 36,
  angelcare360_exam_sessions: 36,
  angelcare360_marks: 600,
  angelcare360_teacher_comments: 600,
  angelcare360_report_cards: 600,
  angelcare360_report_card_lines: 600,
  angelcare360_attendance_sessions: 360,
  angelcare360_attendance_records: 6000,
  angelcare360_attendance_justifications: 20,
  angelcare360_fee_structures: 3,
  angelcare360_fee_items: 4,
  angelcare360_student_fee_assignments: 600,
  angelcare360_invoices: 600,
  angelcare360_invoice_lines: 600,
  angelcare360_payments: 480,
  angelcare360_receipts: 480,
  angelcare360_discounts: 60,
  angelcare360_payment_reminders: 60,
  angelcare360_expenses: 24,
  angelcare360_payroll_periods: 1,
  angelcare360_payroll_records: 72,
  angelcare360_payroll_items: 144,
  angelcare360_transport_vehicles: 8,
  angelcare360_transport_routes: 8,
  angelcare360_transport_stops: 40,
  angelcare360_transport_assignments: 300,
  angelcare360_library_books: 120,
  angelcare360_library_copies: 120,
  angelcare360_library_loans: 45,
  angelcare360_inventory_categories: 4,
  angelcare360_inventory_items: 40,
  angelcare360_inventory_movements: 40,
  angelcare360_messages: 12,
  angelcare360_message_recipients: 40,
  angelcare360_message_templates: 8,
  angelcare360_announcements: 12,
  angelcare360_conversations: 12,
  angelcare360_conversation_participants: 24,
  angelcare360_notifications: 20,
  angelcare360_reclamations: 8,
  angelcare360_reports: 4,
  angelcare360_report_templates: 4,
  angelcare360_report_requests: 8,
  angelcare360_report_exports: 4,
  angelcare360_export_files: 4,
  angelcare360_documents: 24,
  angelcare360_document_templates: 6,
  angelcare360_audit_logs: 12,
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })
}

const routeRoot = path.join(root, 'app', '(protected)', 'angelcare-360-command-center')
const routeFiles = walk(routeRoot).filter((file) => file.endsWith(`${path.sep}page.tsx`)).sort()
assert(routeFiles.length === 195, `route inventory is ${routeFiles.length}, expected 195`)

const routeForFile = (file) => '/' + path.relative(path.join(root, 'app', '(protected)'), file)
  .replaceAll(path.sep, '/')
  .replace(/\/page\.tsx$/, '')
  .replace(/\/(\([^/]+\))/g, '')
  .replace(/\[id\]/g, '{id}')

const routes = routeFiles.map(routeForFile)
assert(new Set(routes).size === 195, 'route inventory contains duplicate public paths')

const coverage = read('docs/sanila-master-demo/MASTER_DEMO_ROUTE_COVERAGE.md')
const coveredRoutes = [...coverage.matchAll(/^\| \d+ \| `([^`]+)` \|/gm)].map((match) => match[1])
assert(coveredRoutes.length === 195, `coverage matrix has ${coveredRoutes.length} route rows`)
assert(new Set(coveredRoutes).size === 195, 'coverage matrix contains duplicate route rows')
for (const route of routes) assert(coveredRoutes.includes(route), `coverage matrix missing ${route}`)
for (const route of coveredRoutes) assert(routes.includes(route), `coverage matrix contains stale ${route}`)

const seed = read('supabase/seeds/MASTER_DEMO_SEED.sql')
const reset = read('supabase/seeds/MASTER_DEMO_RESET.sql')
for (const value of Object.values(identity)) {
  assert(seed.includes(value), `seed missing exact identity ${value}`)
  assert(reset.includes(value), `reset missing exact identity ${value}`)
}
assert(seed.includes("tenant_slug='sanila-master-demo'"), 'seed lacks exact tenant_slug guard')
assert(reset.includes("tenant_slug='sanila-master-demo'"), 'reset lacks exact tenant_slug guard')
assert(!/insert\s+into\s+(public\.)?(app_users|angelcare360_schools|angelcare360_operator_tenants|angelcare360_user_roles|angelcare360_roles)\b/i.test(seed), 'seed creates a protected identity')
assert(!/delete\s+from\s+(public\.)?(app_users|angelcare360_schools|angelcare360_operator_tenants|angelcare360_user_roles|angelcare360_roles|sanila_demo_configs)\b/i.test(reset), 'reset deletes a protected identity')
assert(reset.includes('sanila_demo_fixture_registry r'), 'reset deletion is not registry-scoped')
assert(reset.includes('RESET_REFUSED_REGISTRY_COUNT'), 'reset lacks exact pre-delete registry gate')
assert(reset.includes('transactional_delete_rolled_back'), 'reset lacks explicit rollback outcome')

const schema = read('../../infrastructure/database/CURRENT_PRODUCTION_SCHEMA.sql')
const baseline = read('supabase/migrations/20260903_sanila_master_demo_foundation.sql')
for (const table of Object.keys(forecast)) {
  const presentInSchema = schema.includes(`CREATE TABLE public.${table} (`)
  const presentInLaterSource = seed.includes(`'${table}'`) || baseline.includes(`'${table}'`)
  assert(presentInSchema || presentInLaterSource, `table authority not found for ${table}`)
  assert(presentInLaterSource, `fixture source not found for ${table}`)
}

const total = Object.values(forecast).reduce((sum, value) => sum + value, 0)
assert(total === 17714, `forecast sums to ${total}, expected 17714`)
assert(seed.includes("'forecast_total_fixture_rows',17714"), 'seed forecast marker mismatch')
assert(reset.includes('before_count<>17714'), 'reset registry forecast marker mismatch')

const model = read('docs/sanila-master-demo/MASTER_DEMO_DATA_MODEL.md')
const scenario = read('docs/sanila-master-demo/MASTER_DEMO_SCENARIO.md')
const dependency = read('docs/sanila-master-demo/MASTER_DEMO_DEPENDENCY_ORDER.md')
const countDoc = read('docs/sanila-master-demo/MASTER_DEMO_ROW_COUNT_FORECAST.md')
assert(model.includes(identity.school) && model.includes(identity.tenant), 'data model lacks live identity evidence')
assert(scenario.includes('2027-02-01'), 'scenario lacks frozen mid-year clock')
assert(dependency.includes('Unregistered rows') || dependency.includes('unregistered'), 'dependency manifest lacks preservation contract')
assert(countDoc.includes('**17,714**'), 'row-count document total mismatch')

console.log(JSON.stringify({
  status: 'PASS_STATIC_SOURCE_ONLY',
  routes: routeFiles.length,
  fixtureTables: Object.keys(forecast).length,
  forecastRows: total,
  databaseConnected: false,
  sqlExecuted: false,
}, null, 2))
