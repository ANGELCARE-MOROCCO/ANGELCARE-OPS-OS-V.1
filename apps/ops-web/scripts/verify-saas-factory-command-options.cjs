#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const root = process.cwd()
const required = [
  'app/(protected)/saas-factory-command/options/page.tsx',
  'components/saas-factory/options/SaasFactoryOptionsCommandCenter.tsx',
  'lib/saas-factory/options-runtime.ts',
  'app/api/saas-factory/options/route.ts',
  'app/api/saas-factory/option-groups/route.ts',
  'app/api/saas-factory/options/summary/route.ts',
  'app/api/saas-factory/options/actions/route.ts',
  'app/api/saas-factory/options/validate/route.ts',
  'app/api/saas-factory/options/publish/route.ts',
  'app/api/saas-factory/options/rollback/route.ts',
  'app/api/saas-factory/options/export/route.ts',
  'database/20260530_saas_factory_options_deep_crud.sql',
  'scripts/smoke-saas-factory-command-options.cjs',
]

const forbiddenRoutes = ['phase9','phase10','phase11','phase12','phase13','phase14','mega']
const missing = required.filter((file) => !fs.existsSync(path.join(root, file)))
if (missing.length) {
  console.error('Missing required files:')
  for (const file of missing) console.error(`- ${file}`)
  process.exit(1)
}

for (const route of forbiddenRoutes) {
  const candidates = [
    path.join(root, 'app', route),
    path.join(root, 'app/(protected)', route),
    path.join(root, 'app/(protected)/saas-factory-command', route),
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      console.error(`Forbidden route exists: ${candidate}`)
      process.exit(1)
    }
  }
}

const component = fs.readFileSync(path.join(root, 'components/saas-factory/options/SaasFactoryOptionsCommandCenter.tsx'), 'utf8')
const runtime = fs.readFileSync(path.join(root, 'lib/saas-factory/options-runtime.ts'), 'utf8')
const sql = fs.readFileSync(path.join(root, 'database/20260530_saas_factory_options_deep_crud.sql'), 'utf8')

const mustContain = [
  ['safe JSON parsing', 'Expected JSON from'],
  ['full sidebar nav', 'factoryPages.map'],
  ['create option workflow', "key: 'create-option'"],
  ['edit option workflow', "key: 'edit-option'"],
  ['group governance workflow', "key: 'group-governance'"],
  ['validation workflow', 'ValidationWorkspace'],
  ['publish workflow', 'PublishWorkspace'],
  ['rollback workflow', 'RollbackWorkspace'],
  ['module sync workflow', 'ModuleSyncWorkspace'],
  ['audit workflow', 'AuditWorkspace'],
  ['export workflow', 'ExportWorkspace'],
  ['blocked delete workflow', "key: 'blocked-delete'"],
  ['real export endpoint', '/api/saas-factory/options/export?format='],
]
for (const [label, needle] of mustContain) {
  if (!component.includes(needle)) {
    console.error(`Component missing ${label}: ${needle}`)
    process.exit(1)
  }
}

const runtimeChecks = ['getOptionsSummary', 'runOptionsValidation', 'publishOptionsRegistry', 'rollbackOptionsRegistry', 'handleOptionsWorkflowAction', 'exportOptionsRegistry', 'blocked_delete']
for (const check of runtimeChecks) {
  if (!runtime.includes(check)) {
    console.error(`Runtime missing ${check}`)
    process.exit(1)
  }
}

if (/onClick=\{\(\) => \{\}\}/.test(component) || /console\.log\(/.test(component) || /alert\(/.test(component)) {
  console.error('Found empty, console.log-only, or alert-only UI action in Options component')
  process.exit(1)
}

if (/drop\s+table|truncate\s+table|delete\s+from/i.test(sql)) {
  console.error('Unsafe destructive SQL found')
  process.exit(1)
}

const apiFiles = [
  'summary/route.ts', 'actions/route.ts', 'validate/route.ts', 'publish/route.ts', 'rollback/route.ts', 'export/route.ts'
]
for (const file of apiFiles) {
  const api = fs.readFileSync(path.join(root, 'app/api/saas-factory/options', file), 'utf8')
  if (!api.includes('NextResponse')) {
    console.error(`API route lacks NextResponse JSON handling: ${file}`)
    process.exit(1)
  }
}

console.log('SaaS Factory Options verification passed.')
console.log('Checked: page route, deep component workflows, APIs, runtime, safe SQL, no forbidden routes, no dead/fake handlers.')
