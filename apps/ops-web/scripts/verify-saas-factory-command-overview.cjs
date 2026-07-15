#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const ts = require('typescript')

const root = process.cwd()
const required = [
  'app/(protected)/saas-factory-command/page.tsx',
  'components/saas-factory/SaasFactoryCommandCenter.tsx',
  'components/saas-factory/SaasFactoryCommandCenter.module.css',
  'lib/saas-factory/overview-runtime.ts',
  'app/api/saas-factory/overview/route.ts',
  'app/api/saas-factory/overview/refresh/route.ts',
  'app/api/saas-factory/overview/scan/route.ts',
  'app/api/saas-factory/overview/diagnostics/route.ts',
  'app/api/saas-factory/modules/sync/route.ts',
  'app/api/saas-factory/audit/recent/route.ts',
  'app/api/saas-factory/audit/export/route.ts',
  'app/api/saas-factory/system/actions/route.ts',
  'database/20260528_saas_factory_command_overview_completion.sql',
]

const forbiddenRouteFragments = ['/phase9','/phase10','/phase11','/phase12','/phase13','/phase14','/mega']
const requiredUiPhrases = [
  'Live Executive Snapshot',
  'System Scan',
  'Sync Modules',
  'Run Diagnostics',
  'Queue Summary',
  'Incident Summary',
  'Export Audit CSV',
  'Emergency / Maintenance / Safe Mode',
  'Execution context',
  'Result workspace',
  'Data confidence: fallback-safe mode',
  'No live queue rows returned',
]
const requiredRuntimeExports = [
  'getSaasFactoryCommandOverview',
  'refreshSaasFactoryCommandOverview',
  'scanSaasFactoryCommand',
  'runSaasFactoryDiagnostics',
  'syncSaasFactoryModules',
  'recentSaasFactoryAudit',
  'processSaasFactoryAction',
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}
function read(file) {
  const full = path.join(root, file)
  assert(fs.existsSync(full), `Missing required file: ${file}`)
  return fs.readFileSync(full, 'utf8')
}

console.log('SAAS FACTORY COMMAND OVERVIEW VERIFY')
console.log('====================================')
for (const file of required) {
  read(file)
  console.log(`✓ ${file}`)
}

const component = read('components/saas-factory/SaasFactoryCommandCenter.tsx')
for (const phrase of requiredUiPhrases) {
  assert(component.includes(phrase), `Overview UI missing phrase/action: ${phrase}`)
  console.log(`✓ UI action present: ${phrase}`)
}
for (const bad of forbiddenRouteFragments) {
  assert(!component.includes(bad), `Forbidden route fragment found in component: ${bad}`)
}
console.log('✓ No forbidden phase/mega route fragments in overview component')
assert(component.includes('getActionPlan'), 'Missing in-page operational action planner')
assert(component.includes('executeOverviewModalAction'), 'Missing modal-first command execution handler')
assert(component.includes('renderResultSummary'), 'Missing structured result renderer')
assert(component.includes("category === 'export'"), 'Export actions should open an in-page review/download modal')
console.log('✓ Overview actions use modal-first operational UX')

const css = read('components/saas-factory/SaasFactoryCommandCenter.module.css')
for (const klass of ['operationModal','operationGrid','operationPane','resultGrid','rawDetails']) {
  assert(css.includes(`.${klass}`), `Missing operational UX CSS class: ${klass}`)
}
console.log('✓ Operational modal/drawer CSS present')

const runtime = read('lib/saas-factory/overview-runtime.ts')
for (const name of requiredRuntimeExports) {
  assert(runtime.includes(`export async function ${name}`), `Missing runtime export: ${name}`)
  console.log(`✓ Runtime export: ${name}`)
}

const syntaxFiles = required.filter((file) => file.startsWith('app/api/') || file === 'components/saas-factory/SaasFactoryCommandCenter.tsx' || file === 'lib/saas-factory/overview-runtime.ts')
for (const file of syntaxFiles) {
  const source = read(file)
  const transpiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.Preserve, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
  const diagnostic = transpiled.diagnostics?.find((d) => d.category === ts.DiagnosticCategory.Error)
  assert(!diagnostic, `Syntax diagnostic in ${file}: ${diagnostic && diagnostic.messageText}`)
}
console.log('✓ Changed TypeScript/TSX files transpile without syntax diagnostics')

const sql = read('database/20260528_saas_factory_command_overview_completion.sql').toLowerCase()
assert(!sql.includes('drop table'), 'SQL contains forbidden drop table')
assert(sql.includes('create table if not exists public.saas_factory_audit_events'), 'SQL missing audit events support')
assert(sql.includes('create or replace view public.saas_factory_command_overview_health'), 'SQL missing health view')
console.log('✓ SQL is additive and includes audit/probe/queue health support')

console.log('Ready.')
