const fs = require('fs')
const path = require('path')

const root = process.cwd()
const files = [
  'app/(protected)/saas-factory-command/actions/page.tsx',
  'components/saas-factory/actions/SaasFactoryActionsCommandCenter.tsx',
  'lib/saas-factory/actions-runtime.ts',
  'app/api/saas-factory/actions/summary/route.ts',
  'app/api/saas-factory/actions/execute/route.ts',
  'app/api/saas-factory/actions/export/route.ts',
  'database/20260530_saas_factory_actions_registry.sql',
]

const failures = []
for (const file of files) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing ${file}`)
}

const componentPath = path.join(root, 'components/saas-factory/actions/SaasFactoryActionsCommandCenter.tsx')
if (fs.existsSync(componentPath)) {
  const source = fs.readFileSync(componentPath, 'utf8')
  for (const token of ['Register Governed Action', 'Execute Governed Action', 'Policy Validation', 'Bulk Action Operations', 'Execution History', 'Safety & Emergency', 'Action Evidence Room']) {
    if (!source.includes(token)) failures.push(`Component missing workflow token: ${token}`)
  }
  for (const token of ['alert(', 'console.log(', 'summary.actions.map(', 'summary.executions.length']) {
    if (source.includes(token)) failures.push(`Unsafe/demo token found: ${token}`)
  }
}

const runtimePath = path.join(root, 'lib/saas-factory/actions-runtime.ts')
if (fs.existsSync(runtimePath)) {
  const runtime = fs.readFileSync(runtimePath, 'utf8')
  for (const token of ['getActionsSummary', 'executeFactoryAction', 'exportActions', 'hard_delete_action', 'emergency_freeze', 'register_action', 'validate_action_registry']) {
    if (!runtime.includes(token)) failures.push(`Runtime missing token: ${token}`)
  }
}

for (const forbidden of ['phase9', 'phase10', 'phase11', 'phase12', 'phase13', 'phase14', 'mega']) {
  if (fs.existsSync(path.join(root, 'app', forbidden))) failures.push(`Forbidden route exists: app/${forbidden}`)
}

if (failures.length) {
  console.error('SaaS Factory Actions verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('SaaS Factory Actions verification passed.')
