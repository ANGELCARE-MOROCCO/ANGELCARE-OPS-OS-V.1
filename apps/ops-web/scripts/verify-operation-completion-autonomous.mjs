import { existsSync, readFileSync } from 'fs'

const required = [
  'components/operation-completion/OperationCompletionEngine.tsx',
  'lib/operation-completion/autonomous-core.ts',
  'app/api/operation-completion/scan/route.ts',
  'app/api/operation-completion/autonomous/route.ts',
  'supabase/migrations/20260704_operation_completion_autonomous_core.sql',
]

let ok = true
for (const file of required) {
  if (!existsSync(file)) {
    console.error(`Missing: ${file}`)
    ok = false
  }
}

const component = existsSync(required[0]) ? readFileSync(required[0], 'utf8') : ''
const core = existsSync(required[1]) ? readFileSync(required[1], 'utf8') : ''
const route = existsSync(required[3]) ? readFileSync(required[3], 'utf8') : ''

const checks = [
  ['component exposes V2 manager', component.includes('OPSOS runtime control plane · V2 autonomous core')],
  ['component calls autonomous endpoint', component.includes('/api/operation-completion/autonomous')],
  ['core has module registry', core.includes('OPERATION_MODULES') && core.includes('carelink-ops') && core.includes('ac360')],
  ['core guards source write env', core.includes('OPERATION_COMPLETION_ALLOW_SOURCE_WRITE')],
  ['route persists audit events', route.includes('operation_completion_audit_events')],
]

for (const [label, passed] of checks) {
  if (!passed) {
    console.error(`Failed: ${label}`)
    ok = false
  } else {
    console.log(`OK: ${label}`)
  }
}

if (!ok) process.exit(1)
console.log('Operation Completion Autonomous Core verification passed.')
