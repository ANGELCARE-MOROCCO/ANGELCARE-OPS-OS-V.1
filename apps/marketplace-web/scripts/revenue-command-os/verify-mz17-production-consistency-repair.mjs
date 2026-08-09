#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const opsRoot = path.resolve(__dirname, '../..')
const repoRoot = path.resolve(opsRoot, '../..')
const failures = []
const checks = []

function read(relative) {
  return fs.readFileSync(path.join(repoRoot, relative), 'utf8')
}

function assert(condition, label, detail = '') {
  checks.push({ label, passed: Boolean(condition), detail })
  if (!condition) failures.push(`${label}${detail ? `: ${detail}` : ''}`)
}

function walk(root, extensions = new Set(['.ts', '.tsx'])) {
  const files = []
  if (!fs.existsSync(root)) return files
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (['node_modules', '.next', '_archive', 'backups'].includes(entry.name)) continue
    const full = path.join(root, entry.name)
    if (entry.isDirectory()) files.push(...walk(full, extensions))
    else if (extensions.has(path.extname(entry.name))) files.push(full)
  }
  return files
}

const permissionSource = read('apps/ops-web/lib/revenue-command-os/permissions.ts')
const permissionKeys = new Set([...permissionSource.matchAll(/'revenue_os\.[a-z0-9_.]+'/g)].map((match) => match[0].slice(1, -1)))
const enforcementFiles = [
  ...walk(path.join(opsRoot, 'lib/revenue-command-os')),
  ...walk(path.join(opsRoot, 'app/api/revenue-command-os')),
  ...walk(path.join(opsRoot, 'app/(protected)/revenue-command-os')),
]
const enforced = new Set()
const guardNames = ['resolveRevenueOsActor', 'requireRevenueOsPermission', 'hasRevenueOsPermission', 'requireAccess']
for (const file of enforcementFiles) {
  const source = fs.readFileSync(file, 'utf8')
  for (const guardName of guardNames) {
    let cursor = 0
    while ((cursor = source.indexOf(guardName, cursor)) >= 0) {
      const window = source.slice(cursor, cursor + 1400)
      const end = window.indexOf(')')
      const call = end >= 0 ? window.slice(0, end + 1) : window
      for (const match of call.matchAll(/['"](revenue_os\.[a-z0-9_.]+)['"]/g)) enforced.add(match[1])
      cursor += guardName.length
    }
  }
  for (const match of source.matchAll(/(?:permissions|userPermissions|p)\.(?:includes|has)\(\s*['"](revenue_os\.[a-z0-9_.]+)['"]\s*\)/g)) enforced.add(match[1])
}
const missingPermissions = [...enforced].filter((key) => !permissionKeys.has(key)).sort()
assert(missingPermissions.length === 0, 'Canonical permission catalogue covers every enforced key', missingPermissions.join(', '))

const migration = read('apps/ops-web/supabase/migrations/20260722_revenue_command_os_mz17_production_consistency_repair.sql')
const missingMigrationPermissions = [...enforced].filter((key) => !migration.includes(`'${key}'`)).sort()
assert(missingMigrationPermissions.length === 0, 'MZ17 migration registers every enforced permission', missingMigrationPermissions.join(', '))
assert(migration.includes("short_label='Commandes 3000'"), 'MZ17 migration updates workspace label to Commandes 3000')
assert(migration.includes('revenue_os_command_validation_snapshots'), 'MZ17 migration creates validation snapshots')
assert(migration.includes('app_users'), 'MZ17 migration assigns canonical permissions to app_users')
assert(migration.includes('external_actions_enabled=false'), 'MZ17 migration keeps external actions disabled')

const revenueSources = [
  ...walk(path.join(opsRoot, 'lib/revenue-command-os')),
  ...walk(path.join(opsRoot, 'app/api/revenue-command-os')),
  ...walk(path.join(opsRoot, 'workers/revenue-command-os')),
]
const authGetUser = revenueSources.filter((file) => fs.readFileSync(file, 'utf8').includes('.auth.getUser('))
assert(authGetUser.length === 0, 'No human Revenue OS route uses Supabase Auth metadata', authGetUser.map((file) => path.relative(repoRoot, file)).join(', '))
const implicitClient = revenueSources.filter((file) => fs.readFileSync(file, 'utf8').includes("import { createClient } from '@/lib/supabase/server'"))
assert(implicitClient.length === 0, 'Revenue OS uses explicit user/service Supabase clients', implicitClient.map((file) => path.relative(repoRoot, file)).join(', '))

const accessSource = read('apps/ops-web/lib/revenue-command-os/access.ts')
assert(accessSource.includes('REVENUE_OS_TENANT_MISMATCH'), 'Canonical actor rejects conflicting client tenant')
assert(accessSource.includes('getCurrentUser'), 'Canonical actor uses APP_SESSION_COOKIE app session resolver')

const strategyRoute = read('apps/ops-web/app/api/revenue-command-os/strategy-engine/route.ts')
assert(strategyRoute.includes('resolveRevenueOsActor'), 'Strategy Engine is authenticated')
assert(strategyRoute.includes('revenue_os.strategy.manage'), 'Strategy Engine enforces strategy permissions')
assert(strategyRoute.includes('shadow_contract_only') && strategyRoute.includes('executionEnabled: false'), 'Strategy Engine identifies contract-only Shadow posture')

const dispatchRoute = read('apps/ops-web/app/api/revenue-command-os/execution/dispatch/route.ts')
assert(!dispatchRoute.includes("||'angelcare'") && !dispatchRoute.includes("|| 'angelcare'"), 'Machine dispatch has no default tenant')
assert(dispatchRoute.includes('timingSafeEqual') && dispatchRoute.includes('idempotencyKey'), 'Machine dispatch verifies signed scoped payload')

const megaRepository = read('apps/ops-web/lib/revenue-command-os/mega-production/repository.ts')
assert(megaRepository.includes('sourceHealth'), 'MZ16 repository reports per-source health')
assert(!/catch\s*\{\s*return\s*\[\]/.test(megaRepository), 'MZ16 repository does not swallow storage failures into empty arrays')
const megaConsole = read('apps/ops-web/app/(protected)/revenue-command-os/mega-production/_components/MegaProductionConsole.tsx')
assert(megaConsole.includes("'/api/revenue-command-os/production/emergency-stop'"), 'Emergency Stop UI is wired')
assert(megaConsole.includes("'/api/revenue-command-os/production/activate'"), 'Production activation UI is wired')
assert(megaConsole.includes('switch (active)'), 'MZ16 tabs render purpose-specific content')
assert(megaConsole.includes("dataMode === 'live'"), 'High-risk MZ16 actions require live source mode')
const executionWorkspace = read('apps/ops-web/app/(protected)/revenue-command-os/execution-autopilot/_components/ExecutionAutopilotWorkspace.tsx')
assert(!executionWorkspace.includes('>Préparer</button>'), 'MZ14 removes inert package preparation action')
assert(executionWorkspace.includes('tabDescriptions') && executionWorkspace.includes("'Rollback & compensation'"), 'MZ14 tabs expose purpose-specific operational scopes')

for (const [relative, permission] of [
  ['apps/ops-web/app/(protected)/revenue-command-os/mission-compiler/page.tsx', 'revenue_os.mission_compiler.view'],
  ['apps/ops-web/app/(protected)/revenue-command-os/execution-autopilot/page.tsx', 'revenue_os.execution.view'],
  ['apps/ops-web/app/(protected)/revenue-command-os/mega-production/page.tsx', 'revenue_os.mega_production.view'],
  ['apps/ops-web/app/(protected)/revenue-command-os/strategy-studio/page.tsx', 'revenue_os.strategy_studio.view'],
  ['apps/ops-web/app/(protected)/revenue-command-os/cockpit/page.tsx', 'revenue_os.cockpit.view'],
]) {
  const source = read(relative)
  assert(source.includes('requireAccess') && source.includes(permission), `Workspace guard matches API permission: ${permission}`)
}

const signalRoute = read('apps/ops-web/app/api/revenue-command-os/signals/route.ts')
assert(signalRoute.includes('revenueOsErrorResponse') && signalRoute.includes('resolveRevenueOsActor'), 'Signal API uses canonical actor and error envelope')
const signalLayout = read('apps/ops-web/app/(protected)/revenue-command-os/signals/layout.tsx')
assert(signalLayout.includes('initialWarnings={warnings}'), 'Signal warnings reach the UI')

const workspaceConstants = read('apps/ops-web/lib/revenue-command-os/constants.ts')
assert(workspaceConstants.includes("shortLabel: 'Commandes 3000'"), 'Static workspace fallback uses Commandes 3000')

const commandFile = path.join(opsRoot, 'lib/revenue-command-os/command-kernel/commands-3000/commands-3000.commands.json')
const commands = JSON.parse(fs.readFileSync(commandFile, 'utf8'))
const commandCodes = new Set(commands.map((item) => item.commandCode))
assert(commands.length === 3000, 'Canonical command asset contains exactly 3000 commands', String(commands.length))
assert(commandCodes.size === 3000, 'Canonical command codes are unique', String(commandCodes.size))
const commandRepository = read('apps/ops-web/lib/revenue-command-os/command-kernel/repository.ts')
assert(commandRepository.includes('overlayCanonicalCommands'), 'Command repository overlays persisted runtime state over canonical 3000')
assert(!commandRepository.includes('commands=operational'), 'Partial database rows never replace canonical library')
assert(commandRepository.includes('revenue_os_command_validation_snapshots'), 'Command validation is persisted')
const repairScript = read('tools/revenue-os/repair-command-library-3000.mjs')
assert(repairScript.includes('COMMAND_LIBRARY_3000_REPAIR_OK'), 'Guarded Commands 3000 repair utility is present')
assert(repairScript.includes("process.argv.includes('--apply')"), 'Database repair requires explicit --apply')

const diagnosticsRoute = read('apps/ops-web/app/api/revenue-command-os/diagnostics/route.ts')
assert(diagnosticsRoute.includes('revenue_os.audit.view'), 'Runtime diagnostics are permission-gated')
assert(diagnosticsRoute.includes('command-library-3000'), 'Runtime diagnostics verify command count')

const serverClient = read('apps/ops-web/lib/supabase/server.ts')
assert(serverClient.includes('createUserClient') && serverClient.includes('createServiceClient'), 'Supabase user/service clients are explicitly split')

console.log(JSON.stringify({
  verification: failures.length ? 'failed' : 'passed',
  checks: checks.length,
  failed: failures,
}, null, 2))

if (failures.length) process.exit(1)
console.log('REVENUE_OS_MZ17_PRODUCTION_CONSISTENCY_REPAIR_VERIFIED')
