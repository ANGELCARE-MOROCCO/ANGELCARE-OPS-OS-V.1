import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const app = path.resolve(here, '..')
const requireFromApp = createRequire(path.join(app, 'package.json'))
let ts
try {
  ts = requireFromApp('typescript')
} catch (error) {
  throw new Error(`Project-local TypeScript is required: ${error instanceof Error ? error.message : String(error)}`)
}

const checks = []
const failures = []
function pass(label) { checks.push(label); console.log(`PASS  ${label}`) }
function fail(label) { failures.push(label); console.error(`FAIL  ${label}`) }
function assert(condition, label) { condition ? pass(label) : fail(label) }
function read(rel) { return fs.readFileSync(path.join(app, rel), 'utf8') }
function exists(rel) { return fs.existsSync(path.join(app, rel)) }

const requiredFiles = [
  'data/angelcare360/product-reality.ts',
  'types/angelcare360/product-reality.ts',
  'lib/angelcare360/server/product-reality.ts',
  'lib/angelcare360/server/entitlements.ts',
  'lib/angelcare360/operator/product-kernel.ts',
  'lib/angelcare360/documents/report-card.ts',
  'components/angelcare360/operator/product-reality/ProductRealityControlCenter.tsx',
  'components/angelcare360/operator/product-reality/ProductRealityControlCenter.module.css',
  'components/angelcare360/layout/Angelcare360EntitlementGate.tsx',
  'app/api/angelcare360/product-reality/route.ts',
  'app/api/angelcare360/product-reality/worker/route.ts',
  'app/api/angelcare360/product-reality/report-cards/[id]/pdf/route.ts',
  'app/(protected)/angelcare-360-operator/tenants-product/reality/page.tsx',
  'supabase/migrations/20260803_angelcare360_product_reality_enforcement_finalization.sql',
]
for (const rel of requiredFiles) assert(exists(rel), `required file ${rel}`)

const baselineMarkers = [
  ['components/angelcare360/customer-experience/CustomerExperienceProvider.tsx', 'Mega ZIP 1 Customer Experience Kernel'],
  ['data/angelcare360/product-constitution.ts', 'Mega ZIP 1 Product Constitution'],
  ['components/angelcare360/customer-foundation/DirectionExecutiveCommand.tsx', 'Mega ZIP 2 Direction Command'],
  ['components/angelcare360/customer-foundation/PeopleSovereignRegistry.tsx', 'Mega ZIP 2 People Registry'],
  ['components/angelcare360/customer-foundation/AdmissionsEnrollmentCommand.tsx', 'Mega ZIP 2 Admissions Command'],
  ['components/angelcare360/customer-academic-authority/PresenceDailyControl.tsx', 'Mega ZIP 3 Presence Authority'],
  ['components/angelcare360/customer-academic-authority/TimetableSchedulingAuthority.tsx', 'Mega ZIP 3 Timetable Authority'],
  ['components/angelcare360/customer-academic-authority/AcademicLearningAuthority.tsx', 'Mega ZIP 3 Academic Authority'],
]
for (const [rel, label] of baselineMarkers) assert(exists(rel), label)

const registry = read('data/angelcare360/module-registry.ts')
assert(registry.includes('export function getAngelcare360ModuleById'), 'module-registry compatibility export preserved')
assert((registry.match(/export function getAngelcare360ModuleById/g) || []).length === 1, 'module-registry compatibility export unique')

const operationSource = read('data/angelcare360/product-reality.ts')
const serverSource = read('lib/angelcare360/server/product-reality.ts')
const sql = read('supabase/migrations/20260803_angelcare360_product_reality_enforcement_finalization.sql')
const operations = [...operationSource.matchAll(/operationKey:\s*'([^']+)'/g)].map((match) => match[1])
const uniqueOperations = new Set(operations)
assert(operations.length === 42, '42 canonical product-reality operations declared')
assert(uniqueOperations.size === operations.length, 'operation keys unique')
for (const operation of operations) {
  assert(serverSource.includes(`case '${operation}':`), `dispatch implementation ${operation}`)
  assert(sql.includes(`('${operation}'`), `SQL operation catalogue ${operation}`)
}

const highValueMarkers = [
  'queueProductRealityApproval',
  'executeApprovalDecision',
  "case 'product.approval.decide'",
  'collectParentCandidates',
  'collectStudentCandidates',
  'angelcare360_admission_conversion_runs',
  ".upsert(proposals, { onConflict: 'rollover_run_id,student_id' })",
  'executeAttendanceCorrectionApproval',
  'executeAttendanceClosure',
  'executeTimetablePublication',
  'executeTimetableSubstitute',
  'executeCurriculumUnit',
  'executeGradeCorrectionApproval',
  'recomputeAverages',
  'executeReportCardTemplateAssign',
  'storeReportCardPdf',
  'loadReportCardPdf',
  'executeCapacityTopup',
  'compileTenantEntitlements',
]
for (const marker of highValueMarkers) assert(serverSource.includes(marker), `runtime authority marker ${marker}`)

assert(!serverSource.includes("angelcare360_academic_year_rollover_items').delete()"), 'rollover preview is non-destructive')
assert(serverSource.includes(".upsert(proposals, { onConflict: 'rollover_run_id,student_id' })"), 'rollover preview is idempotent')
assert(serverSource.includes("status: 'running'"), 'admission conversion starts recoverable execution')
assert(serverSource.includes("recoverable: true"), 'admission conversion records repairability')
assert(serverSource.includes('Conversion bloquée:'), 'admission conversion blocks ambiguous identities')
assert(serverSource.includes(".eq('state', 'approved')"), 'worker processes approved executions only')
assert(serverSource.includes('requested_execution_id'), 'approval engine linked to requested execution')
assert(serverSource.includes("status: 'resolved'"), 'approval engine resolves governance evidence')

const sqlForbidden = [
  /\bdrop\s+table\b/i,
  /\btruncate\b/i,
  /\bdelete\s+from\b/i,
]
for (const expression of sqlForbidden) assert(!expression.test(sql), `SQL forbids ${expression}`)
assert(/^\s*begin\s*;/i.test(sql), 'SQL outer BEGIN')
assert(/commit\s*;\s*$/i.test(sql), 'SQL outer COMMIT')
assert(sql.includes("insert into storage.buckets (id,name,public) values ('angelcare360-report-cards'"), 'private immutable report-card bucket declared')
assert(sql.includes('ac360_reality_approval_idempotency_uq'), 'approval idempotency index')
assert(sql.includes('requested_execution_id uuid'), 'approval execution link column')
assert(sql.includes('storage_bucket text'), 'report-card immutable storage metadata')
assert(sql.includes('ac360_substitute_assignment_dates_idx on public.angelcare360_timetable_substitute_assignments(school_id,timetable_slot_id,effective_from,effective_to,status)'), 'substitute assignment index uses real columns')
assert(!sql.includes('angelcare360_timetable_substitute_assignments(school_id,academic_year_id,starts_on,ends_on,status)'), 'invalid substitute index absent')
assert(sql.includes('enable row level security'), 'SQL enables RLS')
assert(sql.includes('revoke all on public.%I from anon, authenticated'), 'server-authority direct browser access revoked')

const expectedTables = [
  'angelcare360_product_reality_operation_catalog',
  'angelcare360_product_runtime_operation_gates',
  'angelcare360_product_reality_policy_versions',
  'angelcare360_product_reality_executions',
  'angelcare360_product_reality_approvals',
  'angelcare360_product_reality_evidence_bindings',
  'angelcare360_product_reality_exceptions',
  'angelcare360_academic_year_rollover_runs',
  'angelcare360_people_master',
  'angelcare360_guardian_authorities',
  'angelcare360_student_enrollments',
  'angelcare360_planned_absences',
  'angelcare360_timetable_publication_versions',
  'angelcare360_timetable_substitute_assignments',
  'angelcare360_curriculum_versions',
  'angelcare360_grading_policy_versions',
  'angelcare360_grade_revisions',
  'angelcare360_report_card_template_assignments',
  'angelcare360_report_card_document_versions',
  'angelcare360_notification_intents',
]
for (const table of expectedTables) assert(sql.includes(`public.${table}`), `SQL contract ${table}`)

const parseFiles = requiredFiles.filter((rel) => /\.(ts|tsx)$/.test(rel))
for (const rel of parseFiles) {
  const source = read(rel)
  const parsed = ts.createSourceFile(path.join(app, rel), source, ts.ScriptTarget.Latest, true, rel.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  if (parsed.parseDiagnostics.length) {
    fail(`TypeScript syntax ${rel}`)
    for (const diagnostic of parsed.parseDiagnostics) console.error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
  } else pass(`TypeScript syntax ${rel}`)
}

const css = read('components/angelcare360/operator/product-reality/ProductRealityControlCenter.module.css')
const ui = read('components/angelcare360/operator/product-reality/ProductRealityControlCenter.tsx')
const cssClasses = new Set([...css.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map((m) => m[1]))
const styleRefs = new Set([...ui.matchAll(/styles\.([A-Za-z_][A-Za-z0-9_]*)/g)].map((m) => m[1]))
for (const className of styleRefs) assert(cssClasses.has(className), `CSS module class ${className}`)
const impureSelectors = css.split('{').slice(0, -1).map((chunk) => chunk.split('}').pop().trim()).filter((selector) => selector && !selector.startsWith('@') && !selector.split(',').every((part) => /\.[A-Za-z_][A-Za-z0-9_-]*/.test(part) || /:global\(/.test(part)))
assert(impureSelectors.length === 0, 'CSS Module selectors pure')

const generatedScope = requiredFiles.filter((rel) => /\.(ts|tsx|css)$/.test(rel)).map(read).join('\n')
for (const marker of ['href="javascript:', 'TODO_ACTION', 'onClick={() => {}}', 'alert(']) assert(!generatedScope.includes(marker), `dead-control marker absent: ${marker}`)
assert(!generatedScope.includes('OverheadPanel'), 'Operator OverheadPanel leakage absent')

const routes = [
  'app/(protected)/angelcare-360-operator/tenants-product/reality/page.tsx',
  'app/api/angelcare360/product-reality/route.ts',
  'app/api/angelcare360/product-reality/worker/route.ts',
  'app/api/angelcare360/product-reality/report-cards/[id]/pdf/route.ts',
]
for (const route of routes) assert(exists(route), `route installed ${route}`)

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed.`)
  process.exit(1)
}
console.log(`\n${checks.length} checks passed. AngelCare 360 Product Reality Enforcement is structurally accepted.`)
