import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const ts = require('typescript')

const root = process.cwd()
let passed = 0
let failed = 0
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))
const check = (condition, label) => {
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${label}`)
  condition ? passed++ : failed++
}

const files = {
  studio: 'components/angelcare360/operator/product-kernel/ProductKernelStudio.tsx',
  governance: 'components/angelcare360/operator/product-kernel/ProductKernelGovernancePortal.tsx',
  css: 'components/angelcare360/operator/product-kernel/ProductKernelStudio.module.css',
  rail: 'components/angelcare360/operator/sovereign/SovereignWorkspaceRail.tsx',
  kernel: 'lib/angelcare360/operator/product-kernel.ts',
  types: 'types/angelcare360/operator/product-kernel.ts',
  migration: 'supabase/migrations/20260730_angelcare360_operator_product_kernel_finalization.sql',
  page: 'app/(protected)/angelcare-360-operator/tenants-product/page.tsx',
}

for (const [key, file] of Object.entries(files)) check(exists(file), `required ${key}: ${file}`)
if (failed) process.exit(1)

const studio = read(files.studio)
const governance = read(files.governance)
const css = read(files.css)
const rail = read(files.rail)
const kernel = read(files.kernel)
const types = read(files.types)
const sql = read(files.migration)
const page = read(files.page)

const views = ['catalogue','modules','features','addons','meters','packages','pricing','compatibility','deployments','scanner','versions']
for (const view of views) {
  check(studio.includes(`${view}: [`), `secondary navigation contract: ${view}`)
  check(page.includes(`'${view}'`), `server route accepts view: ${view}`)
}

for (const scene of ['CatalogueScene','ModuleFactoryScene','FeatureLabScene','AddonScene','MeterScene','PackageScene','PricingScene','CompatibilityScene','DeploymentScene','ScannerScene','VersionScene']) {
  check(studio.includes(`function ${scene}`), `purpose-built scene exists: ${scene}`)
}

for (const capability of [
  'SceneContextBar','ProductActionDock','ProductKernelGovernancePortal','governanceCanvas','lifecyclePanel','impactPanel','dangerZone','releaseReadiness',
  'entitlements.bulk-compile','package-version.delete-draft','package-version.validate','price-book.clone','price-book.delete-draft','finding.reopen',
  'module.clone','feature.clone','addon.clone','meter.clone','module.delete-draft','feature.delete-draft','addon.delete-draft','meter.delete-draft',
]) check((studio + governance + kernel).includes(capability), `finalization capability: ${capability}`)

for (const lifecycle of ['deprecated','supersedes_id','published_at','retired_at','last_reviewed_at','version_code']) {
  check(types.includes(lifecycle), `type lifecycle field: ${lifecycle}`)
  check(sql.includes(lifecycle), `migration lifecycle field: ${lifecycle}`)
}

for (const rule of [
  'updateRecordWithRevision',
  'createProductChangeJob',
  'Suppression bloquée',
  'État Product Kernel inconnu',
  'Une justification administrateur est requise',
  'createdPayload.status = \'draft\'',
  'synchronizePackageBilling',
]) check(kernel.includes(rule), `backend governance rule: ${rule}`)

for (const sqlRule of [
  'begin;', 'commit;', 'if not exists', 'supersedes_id',
  'ac360_product_modules_key_version_uidx', 'ac360_product_features_key_version_uidx',
  'ac360_product_addons_code_version_uidx', 'ac360_product_meters_key_version_uidx',
  'ac360_price_books_code_version_uidx',
  "('draft','review','published','suspended','deprecated','retired','archived')",
  "('draft','approved','scheduled','active','expired','retired','archived')",
]) check(sql.toLowerCase().includes(sqlRule.toLowerCase()), `additive SQL governance: ${sqlRule}`)

for (const forbidden of [/\bdrop\s+table\b/i,/\btruncate\b/i,/\bdrop\s+column\b/i,/\bdelete\s+from\b/i]) {
  check(!forbidden.test(sql), `migration excludes destructive pattern ${forbidden}`)
}

check(studio.includes('useEffect(() =>') && studio.includes('setMode(initialMode)'), 'query-driven scene state synchronizes')
check(rail.includes('useSearchParams') && rail.includes("get('view')"), 'sovereign rail is query-aware')
check(studio.includes('filter={sceneTab}'), 'secondary scene filter is wired')
check(studio.includes('onBulkCompile'), 'fleet bulk compilation is wired')
check(studio.includes('selected.includes'), 'fleet multi-selection is wired')
check(governance.includes('Dupliquer'), 'optional product duplication action is visible')
check(governance.includes('RemovalChamber'), 'removal and migration chamber is visible')
check(governance.includes('Contrôle du cycle'), 'lifecycle control plane is visible')
check(governance.includes('Impact avant suppression') || governance.includes('impact'), 'impact preview is visible')
check(governance.includes('Modifier maintenant') && governance.includes('Modifier composition'), 'administrator direct editing is explained')
check(governance.includes('Price Book · Contrôle administrateur'), 'price-book lifecycle is governed')
check(governance.includes('Package · Contrôle administrateur'), 'package lifecycle is governed')

const classRefs = new Set([...studio.matchAll(/styles\.([A-Za-z_][\w]*)/g), ...governance.matchAll(/styles\.([A-Za-z_][\w]*)/g)].map((match) => match[1]))
const cssClasses = new Set([...css.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((match) => match[1]))
for (const className of classRefs) check(cssClasses.has(className), `CSS module resolves: ${className}`)

for (const file of [files.studio, files.governance, files.rail, files.kernel, files.types, files.page]) {
  const source = read(file)
  const result = ts.transpileModule(source, {
    fileName: file,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
    reportDiagnostics: true,
  })
  check(!(result.diagnostics || []).length, `TypeScript syntax: ${file}`)
}

console.log(`\n${passed} checks passed.`)
if (failed) {
  console.error(`${failed} finalization verification failure(s).`)
  process.exit(1)
}
console.log('Tenants & Product Finalization is statically accepted.')
