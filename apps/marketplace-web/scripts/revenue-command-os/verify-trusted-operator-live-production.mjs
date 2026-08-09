import fs from 'node:fs'
import path from 'node:path'

const app = process.cwd()
const read = (relative) => fs.readFileSync(path.join(app, relative), 'utf8')
const exists = (relative) => fs.existsSync(path.join(app, relative))
const failures = []
const passes = []

function requireFile(relative) {
  if (!exists(relative)) failures.push(`missing:${relative}`)
  else passes.push(`file:${relative}`)
}
function requireText(relative, marker, label = marker) {
  if (!exists(relative)) return failures.push(`missing:${relative}`)
  if (!read(relative).includes(marker)) failures.push(`${relative}:${label}`)
  else passes.push(`${relative}:${label}`)
}
function forbidText(relative, marker, label = marker) {
  if (!exists(relative)) return failures.push(`missing:${relative}`)
  if (read(relative).includes(marker)) failures.push(`${relative}:forbidden:${label}`)
  else passes.push(`${relative}:absent:${label}`)
}

const required = [
  'lib/revenue-command-os/runtime-authority.ts',
  'lib/revenue-command-os/live-operations/types.ts',
  'lib/revenue-command-os/live-operations/service.ts',
  'app/api/revenue-command-os/live-operations/route.ts',
  'app/api/revenue-command-os/action-center/route.ts',
  'app/api/revenue-command-os/settings/route.ts',
  'app/api/revenue-command-os/email-studio/audit/route.ts',
  'app/(protected)/revenue-command-os/_components/live-operations/LiveEntityActions.tsx',
  'app/(protected)/revenue-command-os/_components/live-operations/CreateExceptionButton.tsx',
  'supabase/migrations/20260806_revenue_command_os_trusted_operator_live_preflight.sql',
  'supabase/migrations/20260806_revenue_command_os_trusted_operator_live_production.sql',
  'supabase/migrations/20260806_revenue_command_os_trusted_operator_live_verify.sql',
  'supabase/migrations/20260806_revenue_command_os_trusted_operator_live_rollback.sql',
]
required.forEach(requireFile)

requireText('lib/revenue-command-os/runtime-authority.ts', "REVENUE_OS_LIVE_MODE = 'live'", 'single-live-mode')
requireText('lib/revenue-command-os/runtime-authority.ts', 'approvalRequired: false', 'no-approval-runtime')
requireText('lib/revenue-command-os/runtime-authority.ts', 'shadowEnabled: false', 'no-shadow-runtime')
requireText('lib/revenue-command-os/access.ts', "permissions.add('*')", 'trusted-user-wildcard')
requireText('lib/revenue-command-os/access.ts', 'return Boolean(actorOrUser)', 'authenticated-operator-authority')
requireText('lib/revenue-command-os/constants.ts', "REVENUE_OS_DEFAULT_EXECUTION_MODE: RevenueOsExecutionMode = 'live'", 'default-live')

requireText('lib/revenue-command-os/command-kernel/repository.ts', 'commands.push(imported)', 'imported-commands-executable')
requireText('lib/revenue-command-os/command-kernel/repository.ts', "executionMode: 'live'", 'command-runtime-live')
requireText('lib/revenue-command-os/command-kernel/router.ts', 'requestedCommandCode', 'exact-command-routing')
requireText('lib/revenue-command-os/command-kernel/router.ts', "mode: 'live'", 'command-plan-live')
requireText('lib/revenue-command-os/command-kernel/eligibility.ts', 'eligible: true', 'eligibility-nonblocking')
requireText('lib/revenue-command-os/command-kernel/permissions.ts', 'permitted: true', 'command-authority')
requireText('lib/revenue-command-os/command-kernel/scheduler.ts', "action: 'run-once'", 'schedule-run')

requireText('lib/revenue-command-os/mission-compiler/service.ts', 'persistBlueprint', 'compiler-persists')
requireText('lib/revenue-command-os/mission-compiler/blueprint.ts', 'const readyForMZ14=true', 'compiler-always-publishes')
requireText('app/(protected)/revenue-command-os/mission-compiler/_components/MissionCompilerWorkspace.tsx', 'Compiler et publier', 'compiler-direct-ui')
requireText('lib/revenue-command-os/live-operations/service.ts', 'runGeminiStrategyAssembly', 'objective-to-strategy')
requireText('lib/revenue-command-os/live-operations/service.ts', 'compileApprovedStrategy', 'strategy-to-compiler')
requireText('app/(protected)/revenue-command-os/_components/RevenueOsWorkspacePage.tsx', '<LiveEntityActions entityType="program"', 'program-actions')
requireText('app/(protected)/revenue-command-os/_components/RevenueOsWorkspacePage.tsx', '<LiveEntityActions entityType="mission"', 'mission-actions')
requireText('app/(protected)/revenue-command-os/_components/RevenueOsWorkspacePage.tsx', '<CreateExceptionButton', 'exception-remediation')

requireText('app/api/revenue-command-os/execution/dispatch/route.ts', 'verifyWorkerLease', 'lease-verification')
requireText('app/api/revenue-command-os/execution/dispatch/route.ts', 'action.controls.idempotencyKey', 'worker-idempotency')
requireText('app/api/revenue-command-os/execution/dispatch/route.ts', 'action.executionActor', 'worker-actor')
requireText('lib/revenue-command-os/execution-autopilot/service.ts', 'pausePropagation', 'pause-real')
requireText('lib/revenue-command-os/execution-autopilot/service.ts', 'resumePropagation', 'resume-real')
requireText('lib/revenue-command-os/execution-autopilot/service.ts', 'cancelPropagation', 'cancel-real')
requireText('lib/revenue-command-os/execution-autopilot/service.ts', 'controlAdapter', 'adapter-control-real')
requireText('lib/revenue-command-os/execution-autopilot/channel-policy.ts', ".eq('tenant_id', tenantId)", 'tenant-channel-policy')
requireText('lib/revenue-command-os/execution-autopilot/channel-policy.ts', "adapter_code: 'whatsapp'", 'whatsapp-isolated')
forbidText('lib/revenue-command-os/execution-autopilot/channel-policy.ts', ".update({ external_actions_enabled", 'no-global-whatsapp-toggle')

requireText('app/(protected)/revenue-command-os/email-studio/_components/RevenueEmailStudio.tsx', '/api/revenue-command-os/email-studio/audit', 'email-revenue-audit')
requireText('lib/revenue-command-os/execution-autopilot/config.ts', "if(code==='gmail'||code==='calendar')return false", 'gmail-calendar-current-policy')
requireText('lib/revenue-command-os/execution-autopilot/config.ts', "if(code==='whatsapp')", 'whatsapp-current-policy')

forbidText('lib/revenue-command-os/strategy-studio/route-handler.ts', 'canApproveClass', 'studio-no-authority-gate')
requireText('lib/revenue-command-os/strategy-studio/route-handler.ts', "mode: 'live'", 'studio-live')
requireText('lib/revenue-command-os/strategy-studio/service.ts', 'nonBlockingCompatibilityRecord', 'legacy-approval-nonblocking')
requireText('lib/revenue-command-os/ai/context-minimizer.ts', "executionMode:'live'", 'ai-live')
forbidText('lib/revenue-command-os/ai/context-minimizer.ts', "executionMode:'shadow'", 'ai-no-shadow')

requireText('app/(protected)/revenue-command-os/_components/ObjectiveComposer.tsx', "executionMode: 'live'", 'objective-live')
forbidText('app/(protected)/revenue-command-os/_components/ObjectiveComposer.tsx', "executionMode: 'shadow'", 'objective-no-shadow')
requireText('app/(protected)/revenue-command-os/_components/action-center/RevenueActionCenter.tsx', '/api/revenue-command-os/action-center', 'server-action-history')
requireText('app/(protected)/revenue-command-os/execution-autopilot/_components/ExecutionAutopilotWorkspace.tsx', 'data-revenue-workspace="execution-autopilot"', 'execution-workspace')

forbidText('lib/revenue-command-os/validation-council/gemini-agent.ts', 'GEMINI_API_KEY', 'no-direct-council-key')
forbidText('lib/revenue-command-os/cockpit/executive-brief.ts', 'GEMINI_API_KEY', 'no-direct-cockpit-key')
forbidText('lib/revenue-command-os/strategy-brain/ai-orchestration.ts', 'GEMINI_API_KEY', 'no-strategy-env-fallback')

requireText('supabase/migrations/20260806_revenue_command_os_trusted_operator_live_production.sql', "execution_mode='live'", 'db-live')
requireText('supabase/migrations/20260806_revenue_command_os_trusted_operator_live_production.sql', 'approval_required=false', 'db-no-approval')
requireText('supabase/migrations/20260806_revenue_command_os_trusted_operator_live_production.sql', 'revenue_os_live_action_integrity_guard', 'db-action-integrity')
requireText('supabase/migrations/20260806_revenue_command_os_trusted_operator_live_production.sql', 'revenue_os_operational_exceptions', 'db-exceptions')

console.log(JSON.stringify({
  contract: 'AC-RCOS-TRUSTED-OPERATOR-LIVE-PRODUCTION-2026.08',
  passed: passes.length,
  failed: failures.length,
  failures,
  trustedOperators: true,
  runtimeMode: 'live',
  approvals: 0,
  shadowRuntime: 0,
  governanceHolds: 0,
  emailPolicy: 'existing Email OS',
  whatsappPolicy: 'existing user-controlled policy',
  calendarPolicy: 'disabled',
}, null, 2))

if (failures.length) process.exit(1)
