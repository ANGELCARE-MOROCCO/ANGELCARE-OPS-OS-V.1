import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const failures = []
const passes = []

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function check(condition, label, detail = '') {
  if (condition) passes.push({ label, detail })
  else failures.push({ label, detail })
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath))
}

const requiredFiles = [
  'app/(protected)/revenue-command-os/layout.tsx',
  'app/(protected)/revenue-command-os/page.tsx',
  'app/(protected)/revenue-command-os/[workspace]/page.tsx',
  'app/(protected)/revenue-command-os/error.tsx',
  'app/(protected)/revenue-command-os/loading.tsx',
  'app/(protected)/revenue-command-os/not-found.tsx',
  'app/(protected)/revenue-command-os/_components/RevenueOsShell.tsx',
  'app/(protected)/revenue-command-os/_components/RevenueOsDashboard.tsx',
  'app/(protected)/revenue-command-os/_components/RevenueOsWorkspacePage.tsx',
  'app/(protected)/revenue-command-os/_components/ObjectiveComposer.tsx',
  'app/api/revenue-command-os/foundation/route.ts',
  'app/api/revenue-command-os/search/route.ts',
  'lib/revenue-command-os/types.ts',
  'lib/revenue-command-os/constants.ts',
  'lib/revenue-command-os/repository.ts',
  'lib/revenue-command-os/event-contracts.ts',
  'lib/revenue-command-os/errors.ts',
  'lib/revenue-command-os/search.ts',
  'supabase/migrations/20260720_revenue_command_os_phase1_foundation.sql',
  'docs/revenue-command-os/phase-01/CANONICAL_BUILD_CONTRACT_LOCK.md',
  'docs/revenue-command-os/phase-01/ACCEPTANCE.md',
  'docs/revenue-command-os/phase-01/ROLLBACK.sql',
  'tsconfig.revenue-os-phase1.json',
  'tsconfig.revenue-os-integration.json',
]

for (const file of requiredFiles) check(exists(file), `Required file: ${file}`)

const constants = read('lib/revenue-command-os/constants.ts')
const types = read('lib/revenue-command-os/types.ts')
const migration = read('supabase/migrations/20260720_revenue_command_os_phase1_foundation.sql')
const layout = read('app/(protected)/revenue-command-os/layout.tsx')
const shell = read('app/(protected)/revenue-command-os/_components/RevenueOsShell.tsx')
const dashboard = read('app/(protected)/revenue-command-os/_components/RevenueOsDashboard.tsx')
const api = read('app/api/revenue-command-os/foundation/route.ts')
const permissionRegistry = read('lib/auth/permissions.ts')
const accessControl = read('lib/access-control.ts')
const appShell = read('app/components/erp/AppShell.tsx')
const workspaceRegistry = read('lib/workspace/workspace-modules.ts')

check(constants.includes("AC-REVENUE-OS-CANONICAL-2026.07"), 'Canonical contract version locked')
check(constants.includes("AC-REVENUE-OS-MZ01-FOUNDATION"), 'Phase 1 release code locked')
check((constants.match(/key: '/g) || []).length >= 18, 'Workspace and feature flag registry populated')
check((constants.match(/href: '\/revenue-command-os/g) || []).length >= 12, 'Original twelve Revenue OS workspace routes remain registered')
check(types.includes("export type RevenueOsExecutionMode = 'shadow'"), 'Execution mode contract begins in Shadow')
check(constants.includes("external_actions"), 'External action feature flag exists')
check(constants.includes("enabled: false") && constants.includes("riskClass: 'restricted'"), 'Restricted features are disabled')
check(layout.includes("requireAccess(['revenue_os.view', 'revenue.view'])"), 'Protected layout enforces Revenue OS access')
check(shell.includes("Cmd/Ctrl") || shell.includes("metaKey") && shell.includes("ctrlKey"), 'Global command search keyboard handling exists')
check(shell.includes('ObjectiveComposer'), 'Objective composer is mounted in shell')
check(dashboard.includes('Le système stratégique') && dashboard.includes('De l’objectif à la propagation'), 'Main cockpit is strategy-to-execution oriented')
check(!dashboard.includes('MAD') && !dashboard.includes('Dh'), 'Main Phase 1 cockpit does not degrade into a money dashboard')
check(api.includes("body?.action !== 'create_objective'"), 'API action is allow-listed')
check(api.includes("const modes: RevenueOsExecutionMode[] = ['shadow', 'recommend']"), 'API blocks autonomous modes in Phase 1')
check(permissionRegistry.includes('revenue_os.objectives.manage'), 'Scoped Revenue OS permissions registered')
check(accessControl.includes("'/revenue-command-os'"), 'Route access-control registry updated')
check(appShell.includes("Revenue Command OS") && appShell.includes("/revenue-command-os"), 'Global app navigation entry added')
check(workspaceRegistry.includes("id: 'revenue-command-os'"), 'Workspace module registry updated')

const requiredTables = [
  'revenue_os_installations',
  'revenue_os_permission_registry',
  'revenue_os_workspaces',
  'revenue_os_feature_flags',
  'revenue_os_status_dictionary',
  'revenue_os_system_checks',
  'revenue_os_objectives',
  'revenue_os_business_events',
  'revenue_os_event_outbox',
  'revenue_os_audit_events',
]
for (const table of requiredTables) check(migration.includes(`create table if not exists public.${table}`), `Migration table: ${table}`)
check(migration.includes('revenue_os_audit_events_append_only'), 'Append-only audit trigger included')
check(migration.includes('enable row level security'), 'RLS enabled across Revenue OS tables')
check(migration.includes('revoke all on table') && migration.includes('from anon, authenticated'), 'Direct client access revoked')
check(migration.includes("'shadow'"), 'Database execution posture includes Shadow')
check(migration.includes('external_actions_enabled') && migration.includes('false'), 'External actions remain disabled at installation')
check(migration.includes('on conflict'), 'Migration seed operations are idempotent')

const fixture = JSON.parse(read('tests/revenue-command-os/fixtures/phase1-bootstrap.json'))
check(fixture.expectedWorkspaceCount === 12, 'Fixture expects twelve workspaces')
check(fixture.executionMode === 'shadow', 'Fixture locks Shadow mode')
check(Array.isArray(fixture.requiredPermissions) && fixture.requiredPermissions.length === 8, 'Fixture covers eight scoped permissions')

const cases = JSON.parse(read('tests/revenue-command-os/fixtures/objective-validation-cases.json'))
check(cases.some((item) => item.valid === true), 'Objective tests include valid case')
check(cases.some((item) => item.input?.executionMode === 'limited-autonomy' && item.valid === false), 'Objective tests include prohibited autonomy case')

const legacyRoute = 'app/(protected)/revenue-command-center/page.tsx'
check(exists(legacyRoute), 'Legacy Revenue Command Center remains present')

console.log(`\nANGELCARE Revenue Command OS Phase 1 Verification`)
console.log(`Passes: ${passes.length}`)
console.log(`Failures: ${failures.length}\n`)

for (const item of passes) console.log(`  ✓ ${item.label}`)
for (const item of failures) console.error(`  ✗ ${item.label}${item.detail ? ` — ${item.detail}` : ''}`)

if (failures.length) process.exit(1)
console.log('\nPHASE 1 STATIC ACCEPTANCE: PASS\n')
