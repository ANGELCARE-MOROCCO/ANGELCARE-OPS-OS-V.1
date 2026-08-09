import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const root = process.cwd()
const require = createRequire(path.join(root, 'package.json'))
const ts = require('typescript')

const files = [
  'types/angelcare360/operator/autonomy-kernel.ts',
  'lib/angelcare360/operator/autonomy-kernel.ts',
  'app/api/angelcare360/operator/autonomy-kernel/route.ts',
  'app/api/angelcare360/operator/autonomy-kernel/worker/route.ts',
  'app/(protected)/angelcare-360-operator/platform/autonomy-kernel/page.tsx',
  'components/angelcare360/operator/autonomy-kernel/AutonomyKernelCommandCenter.tsx',
  'components/angelcare360/operator/autonomy-kernel/AutonomyKernelCommandCenter.module.css',
  'supabase/migrations/20260802_angelcare_sanila_os_ten_year_autonomy_kernel.sql',
]

let checks = 0
function pass(label) { console.log(`PASS  ${label}`); checks += 1 }
function assert(condition, label) { if (!condition) throw new Error(`FAIL  ${label}`); pass(label) }

for (const relative of files) assert(fs.existsSync(path.join(root, relative)), `file exists: ${relative}`)

const sourceFiles = files.filter((file) => /\.(ts|tsx)$/.test(file))
for (const relative of sourceFiles) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8')
  const parsed = ts.createSourceFile(relative, source, ts.ScriptTarget.Latest, true, relative.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  if (parsed.parseDiagnostics.length) {
    for (const diagnostic of parsed.parseDiagnostics) console.error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
    throw new Error(`FAIL  isolated syntax: ${relative}`)
  }
  pass(`isolated TypeScript syntax: ${relative}`)
}

const lib = fs.readFileSync(path.join(root, 'lib/angelcare360/operator/autonomy-kernel.ts'), 'utf8')
for (const marker of [
  "import { compileTenantEntitlements } from './product-kernel'",
  'getAutonomyKernelSnapshot',
  'executeAutonomyKernelOperation',
  'processAutonomyKernelProvisioningBatch',
  'createMetadataDefinition',
  'publishMetadataVersion',
  'transitionWorkflowInstance',
  'evaluateCondition',
  'compileEntitlements',
  'idempotency_key',
  'dead_letter',
  'recordMeterSample',
  'refreshCapacitySnapshot',
  'evaluateExtensionCompatibility',
  'recordControlEvidence',
]) assert(lib.includes(marker), `kernel contract marker: ${marker}`)

const ui = fs.readFileSync(path.join(root, 'components/angelcare360/operator/autonomy-kernel/AutonomyKernelCommandCenter.tsx'), 'utf8')
for (const marker of [
  'Autonomy Command', 'Metadata & Schemas', 'Workflow Engine', 'Policy & Rules',
  'Entitlement Compiler', 'Metering & Capacity', 'Extensions & Versions', 'Reliability & Certification',
  'NOT YET PRODUCTION CERTIFIED', 'No green status without traceable proof',
  '/brand/angelcare-official-inverse.webp', 'Product Studio', 'CHANGESET · PROVISIONING · CERTIFICATION RUNWAY',
]) assert(ui.includes(marker), `UI contract marker: ${marker}`)
for (const forbidden of ['href="javascript:', 'TODO_ACTION', 'onClick={() => {}}', 'alert(', 'setInterval(', 'ResizeObserver']) assert(!ui.includes(forbidden), `dead/heavy marker absent: ${forbidden}`)

const css = fs.readFileSync(path.join(root, 'components/angelcare360/operator/autonomy-kernel/AutonomyKernelCommandCenter.module.css'), 'utf8')
assert(css.includes('.kernel{'), 'local root class present')
assert(css.includes('@media (prefers-reduced-motion:reduce){.kernel *'), 'reduced motion anchored to local class')
assert(!/^\s*\[[^\]]+\]/m.test(css), 'no naked attribute selector at rule start')
assert((css.match(/\{/g) || []).length === (css.match(/\}/g) || []).length, 'CSS braces balanced')
assert(css.includes('z-index:2400'), 'overlay clears OverheadPanel')

const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20260802_angelcare_sanila_os_ten_year_autonomy_kernel.sql'), 'utf8')
const tables = [
  'metadata_definitions','metadata_versions','workflow_definitions','workflow_versions','workflow_instances','workflow_events',
  'policy_definitions','policy_versions','policy_evaluations','changesets','changeset_approvals','entitlement_compiler_runs',
  'provisioning_jobs','provisioning_steps','dead_letters','event_outbox','meter_definitions','meter_samples',
  'capacity_snapshots','threshold_events','extension_manifests','extension_versions','release_candidates','release_assignments',
  'runbooks','certification_controls','certification_evidence','recovery_rehearsals',
]
for (const table of tables) assert(sql.includes(`angelcare360_operator_autonomy_${table}`), `SQL table: ${table}`)
for (const marker of [
  'enable row level security',
  'revoke all on table',
  'grant select, insert, update, delete on table',
  'angelcare360_autonomy_reject_mutation',
  'autonomy_append_only',
  "'SEC-TENANT-ISOLATION'",
  "'REL-BACKUP-RESTORE'",
  "'SCALE-MULTITENANT'",
  "'PERF-BROWSER'",
  "'E2E-CRITICAL'",
  'begin;',
  'commit;',
]) assert(sql.includes(marker), `SQL governance marker: ${marker}`)

const route = fs.readFileSync(path.join(root, 'app/api/angelcare360/operator/autonomy-kernel/worker/route.ts'), 'utf8')
assert(route.includes('AUTONOMY_KERNEL_WORKER_SECRET'), 'worker secret contract')
assert(route.includes('authorization'), 'worker bearer authorization')

const navigationPath = path.join(root, 'data/angelcare360/operator-sovereign-navigation.ts')
if (fs.existsSync(navigationPath)) {
  const navigation = fs.readFileSync(navigationPath, 'utf8')
  assert(navigation.includes('/angelcare-360-operator/platform/autonomy-kernel'), 'Platform navigation entry installed')
}

console.log(`\n${checks} surgical checks passed. Ten-Year Autonomy Kernel is structurally accepted.`)
console.log('Repository-wide tsc invoked: NO')
console.log('Production build executed: NO')
console.log('Production certification claimed: NO')
