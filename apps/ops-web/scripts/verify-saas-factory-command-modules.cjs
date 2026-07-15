#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const root = process.cwd()
const required = [
  'app/(protected)/saas-factory-command/modules/page.tsx',
  'components/saas-factory/SaasFactoryModulesCommandPage.tsx',
  'lib/saas-factory/modules-command-runtime.ts',
  'app/api/saas-factory/modules/command-state/route.ts',
  'app/api/saas-factory/modules/sync/route.ts',
  'app/api/saas-factory/modules/diagnostics/route.ts',
  'app/api/saas-factory/modules/actions/route.ts',
  'app/api/saas-factory/modules/export/route.ts',
  'app/api/saas-factory/modules/[key]/route.ts',
  'database/20260530_saas_factory_modules_command_crud.sql',
]

const fail = (message) => { console.error(`✗ ${message}`); process.exit(1) }
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

for (const file of required) if (!fs.existsSync(path.join(root, file))) fail(`Missing ${file}`)

const forbiddenRoutes = ['phase9','phase10','phase11','phase12','phase13','phase14','mega']
for (const route of forbiddenRoutes) {
  const candidate = path.join(root, 'app/(protected)', route)
  if (fs.existsSync(candidate)) fail(`Forbidden route exists: ${candidate}`)
}

const page = read('app/(protected)/saas-factory-command/modules/page.tsx')
if (!page.includes('SaasFactoryModulesCommandPage')) fail('Modules page is not routed to the deep Modules command component')

const component = read('components/saas-factory/SaasFactoryModulesCommandPage.tsx')
const runtime = read('lib/saas-factory/modules-command-runtime.ts')
const requiredWorkflowTokens = ['Register New Module','Exposure & Access Gate','Maintenance Window','Module Diagnostics','Registry Sync Preview','Safe Retirement','Hard Delete Blocked','Module Audit Evidence','Bulk Module Operations','Export Modules']
for (const token of requiredWorkflowTokens) if (!component.includes(token)) fail(`Missing unique workflow token: ${token}`)

const requiredActions = ['create','update','enable','disable','maintenance','visibility','validate','sync-one','clear-cache','snapshot','delete']
for (const action of requiredActions) if (!runtime.includes(`'${action}'`) && !runtime.includes(`"${action}"`)) fail(`Runtime missing action ${action}`)

if (/console\.log\s*\(/.test(component + runtime)) fail('console.log handler found')
if (/alert\s*\(/.test(component + runtime)) fail('alert-only handler found')
if (/onClick=\{\s*\}/.test(component)) fail('Empty onClick found')
if (!component.includes('/api/saas-factory/modules/actions')) fail('Modules actions API not wired')
if (!component.includes('/api/saas-factory/modules/export')) fail('Modules export API not wired')
if (!runtime.includes('Hard delete/purge is blocked')) fail('Unsafe delete/purge blocking missing')

const sql = read('database/20260530_saas_factory_modules_command_crud.sql')
if (/drop\s+table|truncate\s+table/i.test(sql)) fail('Destructive SQL found')
if (!/create table if not exists/i.test(sql)) fail('SQL is not additive/idempotent')

console.log('SAAS FACTORY MODULES COMMAND VERIFY')
console.log('===================================')
for (const file of required) console.log(`✓ ${file}`)
console.log('✓ Unique module workflows present')
console.log('✓ CRUD/action runtime present')
console.log('✓ unsafe delete/purge blocked')
console.log('✓ no forbidden routes')
console.log('Ready.')
