import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { createRequire } from 'node:module'

const root = process.cwd()
const require = createRequire(import.meta.url)
const ts = require('typescript')
let checks = 0
const pass = (message) => { console.log(`PASS ${message}`); checks += 1 }
const fail = (message) => { throw new Error(message) }
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')

const required = [
  'data/angelcare360/product-constitution.ts',
  'types/angelcare360/product-constitution.ts',
  'types/angelcare360/customer-experience.ts',
  'components/angelcare360/customer-experience/CustomerCommandPalette.tsx',
  'components/angelcare360/customer-experience/CustomerCommandPalette.module.css',
  'components/angelcare360/customer-experience/CustomerExperienceProvider.tsx',
  'components/angelcare360/customer-experience/CustomerExperience.module.css',
  'components/angelcare360/customer-experience/CustomerOverlayPortal.tsx',
  'components/angelcare360/customer-experience/CustomerPlaneNavigation.tsx',
  'components/angelcare360/customer-experience/CustomerPlaneNavigation.module.css',
  'components/angelcare360/customer-experience/CustomerFooter.tsx',
  'components/angelcare360/customer-experience/CustomerFooter.module.css',
  'components/angelcare360/customer-experience/CustomerTenantIdentity.tsx',
  'components/angelcare360/customer-experience/CustomerTenantIdentity.module.css',
  'components/angelcare360/layout/Angelcare360Shell.tsx',
  'components/angelcare360/layout/Angelcare360CustomerShell.module.css',
  'components/angelcare360/layout/Angelcare360Header.tsx',
  'components/angelcare360/layout/Angelcare360Header.module.css',
  'components/angelcare360/layout/Angelcare360Sidebar.tsx',
  'components/angelcare360/layout/Angelcare360Sidebar.module.css',
  'components/angelcare360/layout/Angelcare360EntitlementGate.tsx',
  'components/angelcare360/layout/Angelcare360EntitlementGate.module.css',
  'lib/angelcare360/entitlements.ts',
  'lib/angelcare360/operator/product-constitution.ts',
  'app/api/angelcare360/operator/product-constitution/route.ts',
  'app/(protected)/angelcare-360-operator/tenants-product/constitution/page.tsx',
  'components/angelcare360/operator/product-constitution/ProductConstitutionStudio.tsx',
  'components/angelcare360/operator/product-constitution/ProductConstitutionStudio.module.css',
  'supabase/migrations/20260802_angelcare360_customer_mz1_product_constitution_experience_kernel.sql',
]

for (const relative of required) {
  if (!fs.existsSync(path.join(root, relative))) fail(`Missing required file: ${relative}`)
  pass(`file exists: ${relative}`)
}

const scriptFiles = required.filter((relative) => /\.tsx?$/.test(relative))
for (const relative of scriptFiles) {
  const source = read(relative)
  const parsed = ts.createSourceFile(relative, source, ts.ScriptTarget.Latest, true, relative.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  if (parsed.parseDiagnostics.length) {
    fail(`Syntax diagnostics in ${relative}: ${parsed.parseDiagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')).join('; ')}`)
  }
  const transpiled = ts.transpileModule(source, {
    fileName: relative,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      isolatedModules: true,
      esModuleInterop: true,
    },
  })
  const errors = (transpiled.diagnostics || []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
  if (errors.length) fail(`Transpile diagnostics in ${relative}: ${errors.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')).join('; ')}`)
  try { new Function('require', 'exports', 'module', transpiled.outputText) } catch (error) { fail(`Emitted JavaScript parse failure in ${relative}: ${error instanceof Error ? error.message : String(error)}`) }
  pass(`isolated TS/TSX syntax and emitted-JS parse: ${relative}`)
}

function loadConstitution() {
  const relative = 'data/angelcare360/product-constitution.ts'
  const output = ts.transpileModule(read(relative), {
    fileName: relative,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText
  const module = { exports: {} }
  const context = vm.createContext({ module, exports: module.exports, require: () => ({}), console, URLSearchParams })
  new vm.Script(output, { filename: relative }).runInContext(context)
  return module.exports
}

const constitution = loadConstitution()
const routes = constitution.ANGELCARE360_ROUTE_BINDINGS
const operations = constitution.ANGELCARE360_OPERATION_BINDINGS
const modules = constitution.ANGELCARE360_PRODUCT_MODULES
const capabilities = constitution.ANGELCARE360_PRODUCT_CAPABILITIES
const meters = constitution.ANGELCARE360_PRODUCT_METERS
const topups = constitution.ANGELCARE360_PRODUCT_TOPUPS

if (!Array.isArray(routes) || routes.length !== 168) fail(`Expected 168 route bindings, found ${routes?.length}`)
if (new Set(routes.map((route) => route.route)).size !== routes.length) fail('Duplicate customer route bindings detected.')
pass('168 unique customer routes classified')

const moduleKeys = new Set(modules.map((item) => item.key))
const capabilityKeys = new Set(capabilities.map((item) => item.key))
for (const route of routes) {
  if (!moduleKeys.has(route.moduleKey)) fail(`Unknown module ${route.moduleKey} for ${route.route}`)
  if (!capabilityKeys.has(route.capabilityKey)) fail(`Unknown capability ${route.capabilityKey} for ${route.route}`)
  const source = path.join(root, route.source)
  if (!fs.existsSync(source)) fail(`Route source does not exist: ${route.source}`)
  if (!route.featureKey || !route.permissionKey || !route.visibilityRule || !route.provisioningBlueprint) fail(`Incomplete route contract: ${route.route}`)
}
pass('all route bindings resolve to modules, capabilities, source pages, permissions, visibility and provisioning')

if (!Array.isArray(operations) || operations.length < routes.length) fail(`Operation registry is incomplete: ${operations?.length}`)
if (new Set(operations.map((operation) => operation.operationKey)).size !== operations.length) fail('Duplicate operation keys detected.')
const routesWithOperations = new Set(operations.map((operation) => operation.route))
for (const route of routes) if (!routesWithOperations.has(route.route)) fail(`Route has no operation binding: ${route.route}`)
pass(`${operations.length} unique operation bindings cover every customer route`)

const meterKeys = new Set(meters.map((meter) => meter.key))
for (const topup of topups) if (!meterKeys.has(topup.meterKey)) fail(`Top-up ${topup.code} references unknown meter ${topup.meterKey}`)
pass('every top-up references one canonical meter')

const detailRoute = routes.find((route) => route.detail && route.route.includes('['))
if (!detailRoute) fail('No dynamic route was classified.')
const concretePath = detailRoute.route.replace(/\[[^/]+\]/g, 'test-record-001')
const resolved = constitution.getAngelcare360RouteBinding(concretePath)
if (!resolved || resolved.route !== detailRoute.route) fail(`Dynamic route resolver failed for ${concretePath}`)
pass('dynamic customer-route resolution works at runtime')

const allCode = scriptFiles.map(read).join('\n')
for (const marker of [
  "'capability'", "'service'", 'CustomerExperienceProvider', 'CustomerCommandPalette', 'CustomerFooter',
  'CustomerPlaneNavigation', 'localStorage', 'durationMs: 3000', 'data-customer-ownership-footer',
  'restrictedFeatures', 'data-entitlement-state', 'router.push', 'router.replace', 'CustomerOverlayPortal',
]) {
  if (!allCode.includes(marker)) fail(`Missing required implementation marker: ${marker}`)
  pass(`implementation marker: ${marker}`)
}

for (const forbidden of ['href="javascript:', 'TODO_ACTION', 'onClick={() => {}}', 'alert(', 'confirm(', 'prompt(']) {
  if (allCode.includes(forbidden)) fail(`Prohibited/dead-control marker present: ${forbidden}`)
  pass(`prohibited marker absent: ${forbidden}`)
}

const customerShell = read('components/angelcare360/layout/Angelcare360Shell.tsx')
for (const forbidden of ['OverheadPanel', 'OperatorOverlayPortal', 'angelcare-360-operator']) {
  if (customerShell.includes(forbidden)) fail(`Operator shell leakage in customer shell: ${forbidden}`)
}
pass('customer shell is independent from Operator shell and OverheadPanel')

const generatedUiFiles = [
  'components/angelcare360/customer-experience/CustomerCommandPalette.tsx',
  'components/angelcare360/customer-experience/CustomerExperienceProvider.tsx',
  'components/angelcare360/customer-experience/CustomerPlaneNavigation.tsx',
  'components/angelcare360/layout/Angelcare360Header.tsx',
  'components/angelcare360/layout/Angelcare360Sidebar.tsx',
  'components/angelcare360/operator/product-constitution/ProductConstitutionStudio.tsx',
]
for (const relative of generatedUiFiles) {
  const source = read(relative)
  const buttons = source.match(/<button\b[\s\S]*?>/g) || []
  for (const button of buttons) {
    if (!/onClick=|type=["']submit["']/.test(button)) fail(`Button without action in ${relative}: ${button.slice(0, 120)}`)
  }
}
pass('generated command surfaces contain no inert buttons')

const cssPairs = [
  ['components/angelcare360/customer-experience/CustomerCommandPalette.tsx','components/angelcare360/customer-experience/CustomerCommandPalette.module.css'],
  ['components/angelcare360/customer-experience/CustomerExperienceProvider.tsx','components/angelcare360/customer-experience/CustomerExperience.module.css'],
  ['components/angelcare360/customer-experience/CustomerPlaneNavigation.tsx','components/angelcare360/customer-experience/CustomerPlaneNavigation.module.css'],
  ['components/angelcare360/customer-experience/CustomerFooter.tsx','components/angelcare360/customer-experience/CustomerFooter.module.css'],
  ['components/angelcare360/customer-experience/CustomerTenantIdentity.tsx','components/angelcare360/customer-experience/CustomerTenantIdentity.module.css'],
  ['components/angelcare360/layout/Angelcare360Shell.tsx','components/angelcare360/layout/Angelcare360CustomerShell.module.css'],
  ['components/angelcare360/layout/Angelcare360Header.tsx','components/angelcare360/layout/Angelcare360Header.module.css'],
  ['components/angelcare360/layout/Angelcare360Sidebar.tsx','components/angelcare360/layout/Angelcare360Sidebar.module.css'],
  ['components/angelcare360/layout/Angelcare360EntitlementGate.tsx','components/angelcare360/layout/Angelcare360EntitlementGate.module.css'],
  ['components/angelcare360/operator/product-constitution/ProductConstitutionStudio.tsx','components/angelcare360/operator/product-constitution/ProductConstitutionStudio.module.css'],
]
for (const [tsxFile, cssFile] of cssPairs) {
  const source = read(tsxFile)
  const css = read(cssFile)
  const references = [...source.matchAll(/styles\.([A-Za-z_][A-Za-z0-9_]*)/g)].map((match) => match[1])
  for (const reference of new Set(references)) {
    if (!new RegExp(`\\.${reference}(?:[^A-Za-z0-9_-]|$)`).test(css)) fail(`Missing CSS module class .${reference} referenced by ${tsxFile}`)
  }
}
pass('all generated CSS module references resolve')

for (const relative of required.filter((item) => item.endsWith('.module.css'))) {
  const source = read(relative)
  for (const match of source.matchAll(/(?:^|})([^@}{]+)\{/g)) {
    const selector = match[1].trim()
    if (!selector || /^(?:from|to|\d+%)/.test(selector)) continue
    for (const part of selector.split(',')) {
      const candidate = part.trim()
      if (candidate && !/[.#]/.test(candidate) && !candidate.startsWith(':global')) fail(`Impure CSS Module selector in ${relative}: ${candidate}`)
    }
  }
}
pass('generated CSS Modules contain only locally anchored selectors')

const sqlRelative = 'supabase/migrations/20260802_angelcare360_customer_mz1_product_constitution_experience_kernel.sql'
const sql = read(sqlRelative)
for (const marker of [
  'begin;', 'commit;', 'enable row level security', 'revoke all',
  'angelcare360_operator_product_capabilities', 'angelcare360_operator_product_route_bindings',
  'angelcare360_operator_product_operations', 'angelcare360_operator_topup_offers',
  'angelcare360_operator_product_billing_profiles', 'angelcare360_operator_product_visibility_rules',
]) {
  if (!sql.includes(marker)) fail(`Missing SQL marker: ${marker}`)
  pass(`SQL marker: ${marker}`)
}
for (const forbidden of ['drop table', 'truncate table', 'values ("', '= "']) {
  if (sql.toLowerCase().includes(forbidden)) fail(`Unsafe or incorrectly quoted SQL marker present: ${forbidden}`)
}
pass('SQL contains no destructive table operation or double-quoted seed literals')

const createdTables = [...sql.matchAll(/create table if not exists public\.([a-z0-9_]+)/g)].map((match) => match[1])
if (!createdTables.length) fail('No additive Product Constitution tables found.')
for (const table of createdTables) {
  if (!sql.includes(`alter table public.${table} enable row level security`)) fail(`RLS missing for ${table}`)
  if (!sql.includes(`revoke all on table public.${table} from anon, authenticated`)) fail(`Direct browser revoke missing for ${table}`)
}
pass(`RLS and browser-write revocation verified for ${createdTables.length} additive tables`)

const types = read('types/angelcare360/product-constitution.ts')
for (const itemType of ['module','capability','feature','addon','meter','service']) if (!types.includes(`'${itemType}'`)) fail(`Product item type missing: ${itemType}`)
pass('canonical Product Constitution item types are complete')

console.log(`\n${checks} surgical checks passed. Mega ZIP 1 Product Constitution & Customer Experience Kernel is structurally accepted.`)
