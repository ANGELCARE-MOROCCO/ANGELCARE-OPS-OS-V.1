#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const files = {
  types: 'lib/hr-employee-360/types.ts',
  permissions: 'lib/hr-employee-360/permissions.ts',
  validation: 'lib/hr-employee-360/validation.ts',
  repository: 'lib/hr-employee-360/repository.ts',
  service: 'lib/hr-employee-360/service.ts',
  employeesApi: 'app/api/hr/employees/route.ts',
  aggregateApi: 'app/api/hr/employees/[id]/360/route.ts',
  actionApi: 'app/api/hr/employees/[id]/360/actions/route.ts',
  uploadApi: 'app/api/hr/employees/[id]/360/documents/upload/route.ts',
  downloadApi: 'app/api/hr/employees/[id]/360/documents/[documentId]/download/route.ts',
  modal: 'app/(protected)/hr/employees/_components/Employee360DossierModal.tsx',
  css: 'app/(protected)/hr/employees/_components/Employee360Sovereign.module.css',
  fullPage: 'components/hr-production/Staff360ProductionView.tsx',
  employeePage: 'app/(protected)/hr/employees/[id]/page.tsx',
  migration: 'supabase/migrations/20260804_hr_employee_360_sovereign_command.sql',
  tsconfig: 'tsconfig.hr-employee-360-sovereign-command.json',
}

const contents = {}
const checks = []
function check(name, condition, detail = '') { checks.push({ name, condition: Boolean(condition), detail }) }
function has(key, needle) { return contents[key]?.includes(needle) }
function lacks(key, needle) { return !has(key, needle) }
function count(key, needle) { return (contents[key]?.split(needle).length || 1) - 1 }

for (const [key, relative] of Object.entries(files)) {
  const absolute = path.join(root, relative)
  check(`required file ${relative}`, fs.existsSync(absolute))
  if (fs.existsSync(absolute)) contents[key] = fs.readFileSync(absolute, 'utf8')
}

// P0 — canonical authority, access, lifecycle, integrity.
check('canonical staff table repository', has('repository', ".from('hr_staff_profiles')"))
check('canonical staff table API', has('employeesApi', ".from('hr_staff_profiles')"))
check('no dynamic staff table attempts', lacks('employeesApi', 'STAFF_TABLE_ATTEMPTS'))
check('no generic profiles fallback', lacks('employeesApi', "'profiles'"))
check('explicit read permission', has('permissions', "requireEmployee360Actor("))
check('employee read permission catalog', has('permissions', "'hr.employees.read'"))
check('employee update permission catalog', has('permissions', "'hr.employees.update'"))
check('archive permission catalog', has('permissions', "'hr.employees.archive'"))
check('restore permission catalog', has('permissions', "'hr.employees.restore'"))
check('compensation view permission', has('permissions', "'hr.compensation.view'"))
check('compensation manage permission', has('permissions', "'hr.compensation.manage'"))
check('inactive actors blocked', has('permissions', "actor.status !== 'active'"))
check('tenant actor scope', has('permissions', 'tenantId:'))
check('organization actor scope', has('permissions', 'organizationId:'))
check('profile tenant scope validated', has('repository', "code: 'SCOPE_MISMATCH'"))
check('domain tenant scope validated', has('service', 'DOMAIN_SCOPE_MISMATCH'))
check('employee version check', has('service', ".eq('version', request.expectedVersion)"))
check('domain record version check', has('service', 'expectedRecordVersion'))
check('domain conflict code', has('service', 'DOMAIN_VERSION_CONFLICT'))
check('idempotency authority read', has('service', "from('hr_employee_360_idempotency')"))
check('idempotency conflict key', has('service', "onConflict: 'employee_id,idempotency_key'"))
check('audit insert required service', has('service', "from('hr_employee_360_audit_events').insert"))
check('audit insert required API', has('employeesApi', "from('hr_employee_360_audit_events').insert"))
check('audit failure is thrown', has('employeesApi', 'Échec audit Employee 360'))
check('lifecycle evidence table', has('service', "from('hr_employee_lifecycle_events')"))
check('lifecycle transition matrix', has('validation', 'const TRANSITIONS:'))
check('archive is controlled', has('service', "case 'employee.archive'"))
check('restore is controlled', has('service', "case 'employee.restore'"))
check('hard delete disabled API', has('employeesApi', 'HARD_DELETE_DISABLED'))
check('employee DELETE handler archives instead of deleting', has('employeesApi', "export async function DELETE") && has('employeesApi', "employment_status: 'archived'"))
check('no permanent delete UI', has('modal', 'La suppression définitive n’est pas disponible'))
check('no browser permanent parameter', lacks('modal', 'permanent=true'))
check('profile compensation fields permission-gated', has('employeesApi', 'allowCompensation'))
check('profile update rollback compensation', has('employeesApi', 'rollback'))
check('no silent audit catch service', lacks('service', 'catch {}'))
check('no silent audit catch employee API', lacks('employeesApi', 'catch {}'))

// P1 — real native domains and full CRUD/workflows.
const domains = ['attendance','leave','payroll','planning','documents','contracts','onboarding','training','performance','communications','tasks','approvals','incidents']
for (const domain of domains) check(`domain type ${domain}`, has('types', `'${domain}'`))
const nativeTables = [
  'hr_attendance_records','hr_attendance_corrections','hr_leave_requests','hr_payroll_inputs',
  'hr_roster_assignments','hr_documents','hr_contracts','hr_onboarding_journeys',
  'hr_training_records','hr_performance_reviews','hr_employee_email_send_jobs','hr_tasks',
  'hr_approval_requests','hr_incidents',
]
for (const table of nativeTables) check(`native authority ${table}`, has('repository', table))
check('domain create', has('types', "| 'domain.create'"))
check('domain update', has('types', "| 'domain.update'"))
check('domain archive', has('types', "| 'domain.archive'"))
check('domain restore', has('types', "| 'domain.restore'"))
check('domain validate', has('types', "| 'domain.validate'"))
check('note case create', has('types', "| 'note.create'"))
check('domain target mapping', has('service', 'DOMAIN_TARGETS'))
check('communications protected from generic mutation', has('service', "Exclude<Employee360DomainKey, 'communications'>"))
check('employee case authority', has('service', "from('hr_employee_cases').insert"))
check('focused aggregate loader', has('repository', 'loadEmployee360Aggregate'))
check('readiness calculated', has('repository', 'readiness'))
check('risk calculated', has('repository', 'risk'))
check('evidence coverage calculated', has('repository', 'evidenceCoverage'))
check('health warnings surfaced', has('repository', 'warnings'))
check('aggregate API no-store', has('aggregateApi', "'cache-control': 'no-store'"))
check('actions API no-store', has('actionApi', "'cache-control': 'no-store'"))
check('employees API no-store', has('employeesApi', "'cache-control': 'no-store'"))
check('action API delegates service', has('actionApi', 'executeEmployee360Mutation'))
check('action API revalidates employees', has('actionApi', "'/hr/employees'"))
check('action API revalidates employee page', has('actionApi', '`/hr/employees/${employeeId}`'))
check('real private document bucket', has('uploadApi', "const BUCKET = 'hr-employee-documents'"))
check('document size limit', has('uploadApi', '15 * 1024 * 1024'))
check('document MIME allowlist', has('uploadApi', 'ALLOWED_TYPES'))
check('document SHA256', has('uploadApi', "createHash('sha256')"))
check('document storage upload', has('uploadApi', '.upload(storagePath, bytes'))
check('document failed mutation cleanup', has('uploadApi', '.remove([storagePath])'))
check('document signed download', has('downloadApi', 'createSignedUrl(path, 120)'))
check('download checks employee ownership', has('downloadApi', 'aggregate.domains.documents.find'))
check('no public bucket URL', lacks('downloadApi', 'getPublicUrl'))
check('modal and full page share one surface', has('fullPage', 'Employee360CommandSurface'))
check('deep employee page uses unified surface', has('employeePage', 'Staff360ProductionView'))
check('modal uses fresh aggregate API', has('modal', '/360'))
check('profile update UI', has('modal', "action: 'profile.update'"))
check('lifecycle UI', has('modal', "kind: 'lifecycle'"))
check('archive restore UI', has('modal', "kind: 'archive'"))
check('document upload UI', has('modal', "kind === 'documentUpload'"))
check('document download UI', has('modal', 'downloadDocument'))
check('domain CRUD UI', has('modal', "kind === 'domain'"))
check('domain action UI', has('modal', "kind === 'domainAction'"))
check('note case UI', has('modal', "kind === 'note'"))
check('conflict refresh path', has('modal', "data.code === 'VERSION_CONFLICT'"))
check('no full page reload modal', lacks('modal', 'window.location.reload'))
check('no localStorage modal', lacks('modal', 'localStorage'))
check('no sessionStorage modal', lacks('modal', 'sessionStorage'))
check('no indexedDB modal', lacks('modal', 'indexedDB'))
check('no prompt modal', lacks('modal', 'window.prompt'))
check('no fake seeded cases', lacks('modal', 'Workspace RH initialisé'))
check('no generic workspace runtime', lacks('modal', 'hr_management_workspace'))
check('Date.now used only in idempotency key', count('modal', 'Date.now()') === 1 && has('modal', 'idempotencyKey'))

// P2 — premium operational UI and continuity.
const tabs = ['overview','identity','employment','attendance','leave','payroll','planning','documents','contracts','onboarding','training','performance','communications','tasks','approvals','incidents','lifecycle','audit']
for (const tab of tabs) check(`navigation tab ${tab}`, has('modal', `{ key: '${tab}'`))
check('premium full-screen continuity', has('modal', 'Plein écran'))
check('modal return continuity', has('modal', 'Retour collaborateurs'))
check('health panel', has('modal', 'État de synchronisation'))
check('readiness KPI', has('modal', 'readiness'))
check('risk KPI', has('modal', 'risk'))
check('evidence KPI', has('modal', 'evidenceCoverage'))
check('operational actions KPI', has('modal', 'openActions'))
check('audit timeline visible', has('modal', 'Timeline Employee 360'))
check('controlled progress state', has('modal', 'mutating'))
check('structured error state', has('modal', 'setError'))
check('structured success state', has('modal', 'setNotice'))
check('safe print allowlist', has('modal', 'const safeRows = ['))
check('no arbitrary employee key print', lacks('modal', 'Object.entries(employee)'))
check('CSS premium shell', has('css', '.modalShell') && has('css', '.fullPageShell'))
check('CSS modal overlay', has('css', '.modalBackdrop'))
check('CSS responsive rule', has('css', '@media'))

// Database migration safety and completeness.
check('migration transaction begins', /^begin;/im.test(contents.migration || ''))
check('migration transaction commits', /commit;\s*$/im.test(contents.migration || ''))
check('migration canonical staff', has('migration', 'public.hr_staff_profiles'))
check('migration lifecycle authority', has('migration', 'public.hr_employee_lifecycle_events'))
check('migration audit authority', has('migration', 'public.hr_employee_360_audit_events'))
check('migration cases authority', has('migration', 'public.hr_employee_cases'))
check('migration idempotency authority', has('migration', 'public.hr_employee_360_idempotency'))
for (const table of nativeTables.filter((table) => table !== 'hr_employee_email_send_jobs')) check(`migration native ${table}`, has('migration', `public.${table}`))
check('migration private storage bucket', has('migration', "'hr-employee-documents'"))
check('migration bucket is private', has('migration', 'public'))
check('migration storage metadata fields', has('migration', 'storage_bucket'))
check('migration content hash field', has('migration', 'content_hash'))
check('migration optimistic version trigger', has('migration', 'hr_employee360_touch_row'))
check('migration indexes', count('migration', 'create index if not exists') >= 15)
check('migration RLS enabled', count('migration', 'enable row level security') >= 4)
check('migration legacy backfill is tagged', has('migration', "'legacy', true"))
check('migration legacy backfill is idempotent', has('migration', 'not exists'))
check('migration no drop table', !/drop\s+table/i.test(contents.migration || ''))
check('migration no truncate', !/\btruncate\b/i.test(contents.migration || ''))
check('migration no destructive reset', !/drop\s+schema|reset\s+database/i.test(contents.migration || ''))

// Engineering hygiene.
const runtimeKeys = ['types','permissions','validation','repository','service','employeesApi','aggregateApi','actionApi','uploadApi','downloadApi','modal','fullPage','employeePage']
for (const key of runtimeKeys) {
  check(`${key} no TypeScript suppression`, !/@ts-ignore|@ts-expect-error|@ts-nocheck/.test(contents[key] || ''))
  check(`${key} no explicit as any`, !/\bas\s+any\b/.test(contents[key] || ''))
  check(`${key} no unsafe double cast`, !/\bas\s+unknown\s+as\b/.test(contents[key] || ''))
}
check('targeted tsconfig includes modal', has('tsconfig', 'Employee360DossierModal.tsx'))
check('targeted tsconfig includes upload API', has('tsconfig', 'documents/upload/route.ts'))
check('targeted tsconfig includes download API', has('tsconfig', 'documents/[documentId]/download/route.ts'))
check('targeted tsconfig excludes .next', has('tsconfig', '".next"'))
check('targeted tsconfig excludes backups', has('tsconfig', '".angelcare_backups"'))

let passed = 0
let failed = 0
for (const item of checks) {
  if (item.condition) { passed += 1; console.log(`PASS  ${item.name}`) }
  else { failed += 1; console.log(`FAIL  ${item.name}${item.detail ? ` — ${item.detail}` : ''}`) }
}
console.log('\n' + '='.repeat(72))
console.log('ANGELCARE — HR EMPLOYEE 360 SOVEREIGN COMMAND STATIC ACCEPTANCE')
console.log('='.repeat(72))
console.log(`Checks passed: ${passed}`)
console.log(`Checks failed: ${failed}`)
console.log('Production build: NO')
console.log('Git mutation:     NO')
if (failed) process.exit(1)
console.log('\n✓ HR EMPLOYEE 360 P0 + P1 + P2 STATIC ACCEPTANCE PASSED')
