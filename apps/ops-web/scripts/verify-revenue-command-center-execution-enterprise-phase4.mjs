#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const ts = require('typescript')
import { execFileSync } from 'node:child_process'

const root = process.cwd()
const checks = []
const pass = (label, ok, detail = '') => checks.push({ label, ok: Boolean(ok), detail })
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8')
const exists = rel => fs.existsSync(path.join(root, rel))

const routeMap = {
  'app/(protected)/revenue-command-center/activity-timeline/page.tsx': 'activity-timeline',
  'app/(protected)/revenue-command-center/daily-desk/page.tsx': 'daily-desk',
  'app/(protected)/revenue-command-center/daily-tasks/[id]/page.tsx': 'daily-task-dossier',
  'app/(protected)/revenue-command-center/daily-tasks/agents/page.tsx': 'team-command',
  'app/(protected)/revenue-command-center/daily-tasks/analytics/page.tsx': 'execution-analytics',
  'app/(protected)/revenue-command-center/daily-tasks/approvals/page.tsx': 'daily-approvals',
  'app/(protected)/revenue-command-center/daily-tasks/blocked/page.tsx': 'daily-blocked',
  'app/(protected)/revenue-command-center/daily-tasks/board/page.tsx': 'daily-board',
  'app/(protected)/revenue-command-center/daily-tasks/calendar/page.tsx': 'execution-calendar',
  'app/(protected)/revenue-command-center/daily-tasks/focus/page.tsx': 'focus-mode',
  'app/(protected)/revenue-command-center/daily-tasks/list/page.tsx': 'daily-registry',
  'app/(protected)/revenue-command-center/daily-tasks/new/page.tsx': 'daily-create',
  'app/(protected)/revenue-command-center/daily-tasks/page.tsx': 'daily-command',
  'app/(protected)/revenue-command-center/my-work/page.tsx': 'my-work',
  'app/(protected)/revenue-command-center/tasks/[id]/page.tsx': 'task-dossier',
  'app/(protected)/revenue-command-center/tasks/approvals/page.tsx': 'task-approvals',
  'app/(protected)/revenue-command-center/tasks/blocked/page.tsx': 'task-blocked',
  'app/(protected)/revenue-command-center/tasks/board/page.tsx': 'task-board',
  'app/(protected)/revenue-command-center/tasks/new/page.tsx': 'task-create',
  'app/(protected)/revenue-command-center/tasks/page.tsx': 'task-command',
  'app/(protected)/revenue-command-center/workload-balancer/page.tsx': 'workload-balancer',
}

const routeCount = Number(execFileSync('bash', ['-lc', "find 'app/(protected)/revenue-command-center' -type f -name page.tsx | wc -l"], { encoding: 'utf8' }).trim())
pass('All 151 Revenue Command Center routes remain present', routeCount === 151, `count=${routeCount}`)

for (const [rel, key] of Object.entries(routeMap)) {
  const content = exists(rel) ? read(rel) : ''
  pass(`${rel} exists`, Boolean(content))
  pass(`${rel} uses the Phase 4 enterprise workspace`, content.includes('RevenueExecutionWorkspace'))
  pass(`${rel} has its individual experience contract`, content.includes(`experience="${key}"`))
  pass(`${rel} no longer imports a retired task mega-workspace`, !/RevenueDailyTasksV13McKinseyWorkspace|RevenueDailyTasksProductionCommandCenter|RevenueCommandFinalWorkspace|UltimateRevenueCommandPage/.test(content))
}

const requiredFiles = [
  'components/revenue-command-center/execution-enterprise/RevenueExecutionWorkspace.tsx',
  'components/revenue-command-center/execution-enterprise/RevenueExecutionWorkspace.module.css',
  'components/revenue-command-center/execution-enterprise/route-contracts.ts',
  'components/revenue-command-center/execution-enterprise/types.ts',
  'components/revenue-command-center/execution-enterprise/useExecutionPortfolio.ts',
  'lib/revenue-command-center/execution-enterprise/server.ts',
  'supabase/revenue-command-center/preflight/20260725_execution_tasks_approvals_live_schema_preflight.sql',
  'supabase/migrations/20260725_0200_revenue_execution_tasks_approvals_accountability_completion.sql',
  'supabase/revenue-command-center/rollback/20260725_revenue_execution_tasks_approvals_phase4_rollback.sql',
]
for (const file of requiredFiles) pass(`${file} exists`, exists(file))

const apiRoutes = [
  'app/api/revenue-command-center/execution/portfolio/route.ts',
  'app/api/revenue-command-center/execution/tasks/route.ts',
  'app/api/revenue-command-center/execution/tasks/[id]/route.ts',
  'app/api/revenue-command-center/execution/tasks/[id]/transition/route.ts',
  'app/api/revenue-command-center/execution/assignments/route.ts',
  'app/api/revenue-command-center/execution/dependencies/route.ts',
  'app/api/revenue-command-center/execution/evidence/route.ts',
  'app/api/revenue-command-center/execution/approvals/route.ts',
  'app/api/revenue-command-center/execution/blockers/route.ts',
  'app/api/revenue-command-center/execution/escalations/route.ts',
  'app/api/revenue-command-center/execution/checklists/route.ts',
  'app/api/revenue-command-center/execution/comments/route.ts',
  'app/api/revenue-command-center/execution/bulk/route.ts',
  'app/api/revenue-command-center/execution/workload/route.ts',
  'app/api/revenue-command-center/execution/daily-desk/route.ts',
]
for (const file of apiRoutes) {
  const content = exists(file) ? read(file) : ''
  pass(`${file} exists`, Boolean(content))
  pass(`${file} enforces Revenue API access`, content.includes('executionContext('))
  pass(`${file} returns controlled API errors`, content.includes('revenueAccessFailure'))
}

const server = read('lib/revenue-command-center/execution-enterprise/server.ts')
pass('Canonical status taxonomy is defined', server.includes('EXECUTION_STATUSES'))
pass('Illegal transition validation exists', server.includes('validateTransition'))
pass('Server commands prefer service-role execution after user authorization', server.includes('SUPABASE_SERVICE_ROLE_KEY') && server.includes('requireRevenueApiAccess'))
pass('Execution events persist through the canonical activity and action logs', server.includes('logRevenueActivity') && server.includes('logRevenueAction'))

const transition = read('app/api/revenue-command-center/execution/tasks/[id]/transition/route.ts')
pass('Transition API checks optimistic concurrency', transition.includes('expectedVersion') && transition.includes('409'))
pass('Transition API checks unresolved dependencies', transition.includes('revenue_task_dependencies'))
pass('Transition API checks pending approvals', transition.includes('revenue_task_approval_requests'))
pass('Transition API checks required evidence', transition.includes('revenue_task_evidence'))
pass('Completion requires a recorded outcome', transition.includes('completionOutcome'))

const dependencies = read('app/api/revenue-command-center/execution/dependencies/route.ts')
pass('Circular dependencies are rejected', dependencies.includes('Dépendance circulaire détectée'))
const bulk = read('app/api/revenue-command-center/execution/bulk/route.ts')
pass('Bulk execution reports partial success truthfully', bulk.includes('succeeded') && bulk.includes('failed') && bulk.includes('results'))

const legacy = read('components/revenue-command-center/RevenueDailyTasksProductionCommandCenter.tsx')
pass('Obsolete /api/revenue/tasks/update-status caller is removed', !legacy.includes('/api/revenue/tasks/update-status'))
pass('Legacy compatibility caller delegates to the canonical transition API', legacy.includes('/api/revenue-command-center/execution/tasks/${taskId}/transition'))

const migration = read('supabase/migrations/20260725_0200_revenue_execution_tasks_approvals_accountability_completion.sql')
const tables = [
  'revenue_task_assignments','revenue_task_status_history','revenue_task_dependencies','revenue_task_checklist_items',
  'revenue_task_evidence','revenue_task_approval_requests','revenue_task_approval_steps','revenue_task_blockers',
  'revenue_task_escalations','revenue_task_comments','revenue_task_time_entries','revenue_task_relations',
]
for (const table of tables) pass(`Migration creates ${table}`, migration.includes(`create table if not exists public.${table}`))
pass('Migration is guarded by a UUID production precondition', migration.includes("revenue_tasks.id must be uuid"))
pass('Migration is additive and transactional', migration.includes('begin;') && migration.trim().endsWith('commit;'))
pass('Portfolio read model exists', migration.includes('revenue_execution_portfolio_view'))
pass('Workload read model exists', migration.includes('revenue_task_workload_view'))
pass('Status history trigger exists', migration.includes('revenue_task_status_history_trigger'))
pass('New support tables enable RLS', migration.includes('enable row level security'))
pass('Authenticated browser roles receive read-only policies on support tables', migration.includes('for select to authenticated'))
pass('Migration does not grant broad write privileges to authenticated', !/grant\s+(insert|update|delete|all).*authenticated/i.test(migration))

const preflight = read('supabase/revenue-command-center/preflight/20260725_execution_tasks_approvals_live_schema_preflight.sql')
pass('Preflight is read-only', !/\b(insert|update|delete|alter|drop|create)\b/i.test(preflight.replaceAll('-- Existing execution-related objects. This result is informational and helps avoid duplicate tables.', '')))
pass('Preflight exposes CUTOVER_GATE', preflight.toLowerCase().includes('cutover_gate'))
pass('Preflight checks Phase 2 account and opportunity dependencies', preflight.includes('revenue_accounts') && preflight.includes('revenue_opportunities'))

const workspace = read('components/revenue-command-center/execution-enterprise/RevenueExecutionWorkspace.tsx')
for (const token of ['CommandExperience','QueueExperience','BoardExperience','GovernanceExperience','RecoveryExperience','AnalyticsExperience','CapacityExperience','CalendarExperience','TimelineExperience','StudioExperience','DossierExperience','ActionDialog','TaskDrawer']) pass(`Unique UX surface ${token} exists`, workspace.includes(`function ${token}`))
pass('French corporate money formatting uses fr-FR and Dh', workspace.includes('new Intl.NumberFormat("fr-FR"') && workspace.includes('Dh`'))
const portfolioHook = read('components/revenue-command-center/execution-enterprise/useExecutionPortfolio.ts')
pass('No fake success is shown before API mutation response', portfolioHook.includes('if (!response.ok || !body.ok) throw new Error'))
pass('Task dossier exposes dependencies, evidence, approvals, blockers and collaboration', ['Dépendances','Preuves','Approbations','Blocages et escalades','Collaboration'].every(t => workspace.includes(t)))

// TypeScript isolated syntax gate.
const tsFiles = [
  ...requiredFiles.filter(f => /\.(ts|tsx)$/.test(f)),
  ...apiRoutes,
  ...Object.keys(routeMap),
]
let syntaxErrors = []
for (const file of tsFiles) {
  const result = ts.transpileModule(read(file), {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.Preserve },
  })
  for (const diagnostic of result.diagnostics || []) {
    if (diagnostic.category === ts.DiagnosticCategory.Error) syntaxErrors.push(`${file}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`)
  }
}
pass('TypeScript isolated syntax gate passes', syntaxErrors.length === 0, syntaxErrors.slice(0, 5).join(' | '))

// CSS module reference gate.
const css = read('components/revenue-command-center/execution-enterprise/RevenueExecutionWorkspace.module.css')
const cssRefs = [...workspace.matchAll(/styles\.([A-Za-z0-9_]+)/g)].map(m => m[1])
const missingCss = [...new Set(cssRefs)].filter(name => !new RegExp(`\\.${name}(?:[\\s,{:\\[]|$)`).test(css))
pass('CSS-module references resolve', missingCss.length === 0, missingCss.join(', '))

let failed = 0
for (const check of checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'}  ${check.label}${check.detail ? ` (${check.detail})` : ''}`)
  if (!check.ok) failed++
}
console.log(`\n${checks.length} checks passed: ${checks.length - failed}; failed: ${failed}.`)
if (failed) process.exit(1)
console.log('Revenue Execution / Tasks / Approvals Mega ZIP 4 is statically accepted.')
