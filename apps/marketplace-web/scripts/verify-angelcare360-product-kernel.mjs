import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

async function loadTypeScript() {
  const candidates = [
    path.join(process.cwd(), 'node_modules/typescript/lib/typescript.js'),
    path.resolve(path.dirname(process.execPath), '../lib/node_modules/typescript/lib/typescript.js'),
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const loaded = await import(pathToFileURL(candidate).href)
      return loaded.default || loaded
    }
  }
  return null
}
const ts = await loadTypeScript()

const root = process.cwd()
const failures = []
let passed = 0

function read(rel) {
  const file = path.join(root, rel)
  if (!fs.existsSync(file)) return ''
  return fs.readFileSync(file, 'utf8')
}
function check(condition, label) {
  if (condition) { passed += 1; console.log(`PASS  ${label}`) }
  else { failures.push(label); console.error(`FAIL  ${label}`) }
}
function includes(rel, needle, label = `${rel} contains ${needle}`) { check(read(rel).includes(needle), label) }
function matches(rel, pattern, label) { check(pattern.test(read(rel)), label) }

const requiredFiles = [
  'supabase/migrations/20260730_angelcare360_operator_product_monetization_kernel.sql',
  'types/angelcare360/operator/product-kernel.ts',
  'types/angelcare360/entitlements.ts',
  'lib/angelcare360/operator/product-kernel.ts',
  'lib/angelcare360/operator/access.ts',
  'lib/angelcare360/entitlements.ts',
  'lib/angelcare360/server/entitlements.ts',
  'app/api/angelcare360/operator/product-kernel/route.ts',
  'app/(protected)/angelcare-360-operator/tenants-product/page.tsx',
  'components/angelcare360/operator/product-kernel/ProductKernelStudio.tsx',
  'components/angelcare360/operator/product-kernel/ProductKernelStudio.module.css',
  'components/angelcare360/operator/product-kernel/CustomerProductControlPanel.tsx',
  'components/angelcare360/operator/product-kernel/CustomerProductControlPanel.module.css',
  'components/angelcare360/layout/Angelcare360EntitlementGate.tsx',
  'tsconfig.angelcare360-product-kernel.json',
]
for (const file of requiredFiles) check(fs.existsSync(path.join(root, file)), `required file exists: ${file}`)

const sqlFile = requiredFiles[0]
const sql = read(sqlFile)
const tables = [
  'angelcare360_operator_product_modules',
  'angelcare360_operator_product_features',
  'angelcare360_operator_product_addons',
  'angelcare360_operator_product_meters',
  'angelcare360_operator_product_dependencies',
  'angelcare360_operator_package_versions',
  'angelcare360_operator_package_version_items',
  'angelcare360_operator_price_books',
  'angelcare360_operator_price_book_entries',
  'angelcare360_operator_subscription_addons',
  'angelcare360_operator_capacity_topups',
  'angelcare360_operator_tenant_entitlement_snapshots',
  'angelcare360_operator_tenant_entitlement_items',
  'angelcare360_operator_tenant_overrides',
  'angelcare360_operator_entitlement_change_schedule',
  'angelcare360_operator_product_scanner_runs',
  'angelcare360_operator_product_scanner_findings',
  'angelcare360_operator_product_publications',
]
for (const table of tables) {
  check(sql.includes(`create table if not exists public.${table}`), `SQL creates ${table}`)
  check(sql.includes(`'${table}'`), `SQL secures ${table} in operator-only loop`)
}
check(sql.includes('enable row level security'), 'SQL enables RLS')
check(sql.includes('revoke all on table'), 'SQL revokes anon/authenticated')
check(sql.includes('grant all on table'), 'SQL grants service_role')
check(sql.includes('add column if not exists package_version_id'), 'subscription receives package version reference')
check((sql.match(/\('(?:administration|people|admissions|attendance|academics|finance|payroll|transport|library|inventory|communications|reports)'/g) || []).length >= 12, 'canonical module seed covers twelve domains')
for (const code of ['ESSENTIAL-MA-V1', 'PROFESSIONAL-MA-V1', 'ENTERPRISE-MA-V1']) check(sql.includes(code), `seeded package ${code}`)
for (const key of ['students','users','institutions','storage_gb']) check(sql.includes(`'${key}'`), `seeded capacity ${key}`)
for (const code of ['ADDITIONAL_SITE','EXTRA_100_STUDENTS','PREMIUM_SUPPORT','DATA_MIGRATION','DEDICATED_ONBOARDING']) check(sql.includes(`'${code}'`), `seeded add-on ${code}`)
check((sql.match(/\(/g) || []).length === (sql.match(/\)/g) || []).length, 'SQL parentheses are balanced')
check(/^begin;/mi.test(sql) && /^commit;/mi.test(sql), 'SQL transaction boundary present')

const kernelFile = 'lib/angelcare360/operator/product-kernel.ts'
const kernel = read(kernelFile)
for (const op of [
  'module.create','module.update','feature.create','feature.update','addon.create','addon.update','meter.create','meter.update',
  'package-version.create','package-version.update','package-version.clone','package-version.publish','package-item.upsert','package-item.delete',
  'price-book.create','price-book.update','price-entry.upsert','dependency.upsert','subscription.package.assign',
  'subscription-addon.assign','subscription-addon.remove','topup.assign','topup.remove','override.apply','override.revoke',
  'entitlements.compile','tenant-baseline.restore','scheduled-change.create','scan.run','finding.adopt','finding.reject',
]) check(kernel.includes(`'${op}'`), `operation declared: ${op}`)
check(kernel.includes('updateRecordWithRevision') && kernel.includes('synchronizePackageBilling'), 'published package direct administration is revisioned and synchronized')
check(kernel.includes('validatePackageComposition'), 'package compatibility validation exists')
check(kernel.includes("status !== 'published'"), 'only published package versions can be assigned')
check(kernel.includes('source_signature'), 'entitlement compilation is signed')
check(kernel.includes("status: 'superseded'"), 'previous active snapshots are superseded')
check(kernel.includes("status: 'active'"), 'compiled snapshot is activated')
check(kernel.includes("angelcare360_operator_feature_flags"), 'compiler synchronizes existing feature flags')
check(kernel.includes("angelcare360_operator_usage_limits"), 'compiler synchronizes existing usage limits')
check(kernel.includes('current_value'), 'usage synchronization preserves current consumption')
check(kernel.includes('module_inheritance'), 'module features are inherited deterministically')
check(kernel.includes('payment_gate'), 'commercial suspension propagates to runtime state')
check(kernel.includes("from 'node:fs/promises'"), 'native scanner reads repository directly')
check(kernel.includes("from 'node:crypto'"), 'native scanner creates evidence signature')
check(!/@google\/genai|openai|anthropic|gemini/i.test(kernel), 'product scanner has no external AI provider import')
check(kernel.includes('customer_files') && kernel.includes('api_files') && kernel.includes('migration_files'), 'scanner reports repository evidence coverage')

const studioFile = 'components/angelcare360/operator/product-kernel/ProductKernelStudio.tsx'
const studio = read(studioFile)
for (const scene of ['CatalogueScene','ModuleFactoryScene','FeatureLabScene','AddonScene','MeterScene','PackageScene','PricingScene','CompatibilityScene','DeploymentScene','ScannerScene','VersionScene']) check(studio.includes(scene), `studio scene exists: ${scene}`)
for (const label of ['Catalogue vivant','Module Factory','Feature Lab','Add-ons','Capacités & Top-ups','Package Composer','Tarification','Compatibilité','Déploiements tenants','Scanner & Diagnostic','Versions & Publication']) check(studio.includes(label), `studio purpose present: ${label}`)
check(studio.includes('SovereignPortal'), 'studio uses enterprise viewport portal')
check(studio.includes('PackageItemsPortal'), 'package composer has dedicated mission portal')
check(studio.includes('AssignPackagePortal'), 'package deployment has dedicated portal')
check(studio.includes('FindingPortal'), 'scanner findings are reviewable')
check(studio.includes('<select') && studio.includes('styles.segmented') && studio.includes('package-item.upsert'), 'studio uses controlled selectors and dependency-aware composition controls')

const customerFile = 'components/angelcare360/operator/product-kernel/CustomerProductControlPanel.tsx'
const customer = read(customerFile)
for (const text of ['Contracted state','Effective entitlement','Actual runtime','Drift','Affecter package','Add-on','Top-up','Diagnostiquer']) check(customer.includes(text), `customer control plane includes ${text}`)
for (const op of ['subscription.package.assign','subscription-addon.assign','topup.assign','override.apply','entitlements.compile','tenant-baseline.restore']) check(customer.includes(op), `customer control action wired: ${op}`)
check(customer.includes('selectedSubscriptionId'), 'customer dossier supports multiple subscriptions')
check(customer.includes('context.drift'), 'customer dossier computes runtime drift')
check(customer.includes('SovereignPortal'), 'customer product controls use viewport portal')

const scenes = read('components/angelcare360/operator/customer-dossier/CustomerDossierScenes.tsx')
check(scenes.includes('CustomerProductControlPanel'), 'customer dossier embeds product control panel')
check(scenes.includes('clientId={command.client.id}'), 'customer product panel receives authoritative client context')


const operatorAccess = read('lib/angelcare360/operator/access.ts')
check(operatorAccess.includes("permission.startsWith('operator.')"), 'granular Operator permissions enter the Operator session')
check(operatorAccess.includes("operatorRole !== 'read_only'"), 'recognized internal Operator roles enter the Operator session')

const entitlementServer = read('lib/angelcare360/server/entitlements.ts')
check(entitlementServer.includes('angelcare360_operator_tenant_entitlement_snapshots'), 'customer runtime loads active entitlement snapshot')
check(entitlementServer.includes('angelcare360_operator_tenant_entitlement_items'), 'customer runtime loads entitlement items')
check(entitlementServer.includes("state: suspended ? 'suspended' : 'active'"), 'customer runtime applies suspension state')
const context = read('lib/angelcare360/server/context.ts')
check(context.includes('getAllowedSchoolIds'), 'school resolution uses user membership')
check(context.includes(".eq('app_user_id', userId)"), 'school membership is tied to authenticated app user')
check(!context.includes(".eq('status', 'active')\n    .order('created_at', { ascending: true })\n    .limit(1)\n    .maybeSingle()\n\n  return"), 'unsafe global first-school fallback removed for normal users')
check(context.includes('isAngelcare360ModuleEnabled'), 'server mutation permissions enforce package module entitlement')
const shell = read('components/angelcare360/layout/Angelcare360Shell.tsx')
check(shell.includes('Angelcare360EntitlementGate'), 'customer shell has runtime entitlement gate')
check(shell.includes('getAngelcare360NavigationSections(runtimeEntitlements)'), 'customer navigation is package-aware')
check(read('data/angelcare360/navigation.ts').includes('filterAngelcare360ModulesByEntitlement'), 'customer sidebar filters disabled modules')
check(read('components/angelcare360/layout/Angelcare360EntitlementGate.tsx').includes('Ce module n’est pas actif pour votre tenant'), 'customer receives truthful locked-module experience')

const nav = read('data/angelcare360/operator-sovereign-navigation.ts')
for (const view of ['catalogue','modules','features','addons','meters','packages','pricing','compatibility','deployments','scanner','versions']) check(nav.includes(`view=${view}`), `tower navigation links Product Kernel view ${view}`)

// Parse every changed TS/TSX file with the installed/global TypeScript parser.
check(Boolean(ts), 'TypeScript parser is available')
const changedTs = [
  'app/api/angelcare360/operator/product-kernel/route.ts',
  'app/(protected)/angelcare-360-operator/tenants-product/page.tsx',
  'components/angelcare360/operator/product-kernel/ProductKernelStudio.tsx',
  'components/angelcare360/operator/product-kernel/CustomerProductControlPanel.tsx',
  'components/angelcare360/layout/Angelcare360EntitlementGate.tsx',
  'components/angelcare360/layout/Angelcare360Shell.tsx',
  'components/angelcare360/operator/customer-dossier/CustomerDossierScenes.tsx',
  'app/(protected)/angelcare-360-command-center/layout.tsx',
  'data/angelcare360/navigation.ts',
  'data/angelcare360/operator-sovereign-navigation.ts',
  'lib/angelcare360/operator/product-kernel.ts',
  'lib/angelcare360/operator/access.ts',
  'lib/angelcare360/entitlements.ts',
  'lib/angelcare360/server/entitlements.ts',
  'lib/angelcare360/server/context.ts',
  'types/angelcare360/entitlements.ts',
  'types/angelcare360/operator/product-kernel.ts',
  'types/angelcare360/operator/index.ts',
]
for (const file of changedTs) {
  if (!ts) { check(false, `TypeScript syntax: ${file}`); continue }
  const result = ts.transpileModule(read(file), {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
  })
  const errors = (result.diagnostics || []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
  check(errors.length === 0, `TypeScript syntax: ${file}`)
}

function cssReferences(tsxRel, cssRel) {
  const refs = new Set([...read(tsxRel).matchAll(/styles\.([A-Za-z0-9_]+)/g)].map((match) => match[1]))
  const css = read(cssRel)
  for (const ref of refs) check(new RegExp(`\\.${ref}(?:\\b|[\\s,{:\\[])`).test(css), `CSS module resolves ${tsxRel}: ${ref}`)
}
cssReferences(studioFile, 'components/angelcare360/operator/product-kernel/ProductKernelStudio.module.css')
cssReferences(customerFile, 'components/angelcare360/operator/product-kernel/CustomerProductControlPanel.module.css')

if (failures.length) {
  console.error(`\n${failures.length} verification failure(s); ${passed} checks passed.`)
  process.exit(1)
}
console.log(`\n${passed} checks passed. Product, Monetization & Tenant Entitlement Kernel is statically accepted.`)
