#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'

const root = process.cwd()
let passed = 0
const fail = (message) => { console.error(`FAIL  ${message}`); process.exitCode = 1 }
const pass = (message) => { passed += 1; console.log(`PASS  ${message}`) }
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')
const expect = (source, token, label) => source.includes(token) ? pass(label) : fail(`${label} (missing ${token})`)
const reject = (source, token, label) => !source.includes(token) ? pass(label) : fail(`${label} (forbidden ${token})`)

const studioPath = 'components/angelcare360/operator/product-kernel/ProductKernelStudio.tsx'
const governancePath = 'components/angelcare360/operator/product-kernel/ProductKernelGovernancePortal.tsx'
const cssPath = 'components/angelcare360/operator/product-kernel/ProductKernelStudio.module.css'
const serverPath = 'lib/angelcare360/operator/product-kernel.ts'
const typesPath = 'types/angelcare360/operator/product-kernel.ts'
const migrationPath = 'supabase/migrations/20260731_angelcare360_operator_product_full_admin_control.sql'

for (const relative of [studioPath, governancePath, cssPath, serverPath, typesPath, migrationPath]) {
  if (fs.existsSync(path.join(root, relative))) pass(`file exists: ${relative}`)
  else fail(`file exists: ${relative}`)
}

const studio = read(studioPath)
const governance = read(governancePath)
const css = read(cssPath)
const server = read(serverPath)
const types = read(typesPath)
const migration = read(migrationPath)

for (const view of ['catalogue','modules','features','addons','meters','packages','pricing','compatibility','deployments','scanner','versions']) {
  expect(studio, `'${view}'`, `workspace scene retained: ${view}`)
}

expect(governance, 'Modifier maintenant', 'direct administrator edit action')
expect(governance, 'Modifier prix & métadonnées', 'direct package price editing')
expect(governance, 'Modifier composition', 'direct package composition editing')
expect(governance, 'RemovalChamber', 'removal and migration chamber')
expect(governance, 'replace_and_delete', 'replace-and-delete strategy')
expect(governance, 'detach_and_delete', 'detach-and-delete strategy')
expect(governance, 'schedule_retirement', 'scheduled retirement strategy')
expect(governance, 'Configuration initiale AngelCare', 'seeded record is explicitly fully modifiable')
reject(governance, 'Modifier [disabled]', 'no disabled edit placeholder')

expect(studio, 'Contrôle administrateur direct', 'administrator edit portal')
expect(studio, 'changeScope', 'change scope selection')
expect(studio, 'selectedSubscriptionIds', 'selected subscription scope')
expect(studio, 'all_active_subscriptions', 'all active subscriptions scope')
expect(studio, 'immediate_authorized', 'immediate authorized scope')
expect(studio, 'Afficher la configuration technique avancée', 'minimal free-input advanced disclosure')
expect(studio, 'Générée automatiquement si vide.', 'automatic internal references')
expect(studio, "readOnly={false}", 'package composition is never locked by lifecycle')

expect(server, 'updateRecordWithRevision', 'automatic revision helper')
expect(server, 'createProductChangeJob', 'scoped change job helper')
expect(server, 'synchronizePackageBilling', 'package billing synchronization')
expect(server, 'synchronizeAddonPricing', 'add-on billing synchronization')
expect(server, 'synchronizePriceEntry', 'price entry synchronization')
expect(server, 'angelcare360_operator_replace_product_entity', 'atomic product replacement RPC')
expect(server, 'angelcare360_operator_replace_package_version', 'atomic package replacement RPC')
expect(server, "operation === `${kind}.admin-remove`", 'full entity removal operation')
expect(server, "operation === 'package-version.admin-remove'", 'full package removal operation')
expect(server, "operation === 'price-book.admin-remove'", 'full price-book removal operation')
expect(server, 'stableProductKey', 'automatic stable reference generation')
reject(server, "throw new Error('Une version publiée", 'no published edit lock')
expect(server, 'admin-remove', 'administrator removal path exists alongside legacy safe-draft compatibility')

expect(types, 'ProductAdminChangeScope', 'typed administrator scope')
expect(types, 'ProductRevisionRecord', 'typed revision history')
expect(types, 'ProductChangeJobRecord', 'typed change jobs')
expect(types, 'is_seeded?: boolean', 'typed seeded metadata')

for (const token of ['adminAuthorityBanner','adminEditControl','subscriptionScopeList','advancedConfiguration','dangerZone','impactPanel']) {
  expect(css, `.${token}`, `CSS control surface: ${token}`)
}

for (const token of [
  'angelcare360_operator_product_revisions',
  'angelcare360_operator_product_change_jobs',
  'is_seeded',
  'seed_source',
  'angelcare360_operator_replace_product_entity',
  'angelcare360_operator_replace_package_version',
  'enable row level security',
  'grant execute',
]) expect(migration.toLowerCase(), token.toLowerCase(), `SQL contract: ${token}`)

let ts
try {
  const localRequire = createRequire(path.join(root, 'package.json'))
  ts = localRequire('typescript')
} catch {
  try {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim()
    ts = createRequire(import.meta.url)(path.join(globalRoot, 'typescript/lib/typescript.js'))
  } catch (error) {
    fail(`TypeScript compiler unavailable: ${error instanceof Error ? error.message : String(error)}`)
  }
}

if (ts) {
  for (const relative of [studioPath, governancePath, serverPath, typesPath]) {
    const source = read(relative)
    const result = ts.transpileModule(source, {
      compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
      fileName: relative,
      reportDiagnostics: true,
    })
    const errors = (result.diagnostics || []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
    if (errors.length) {
      for (const diagnostic of errors) fail(`${relative}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`)
    } else pass(`TypeScript syntax: ${relative}`)
  }
}

if (process.exitCode) process.exit(process.exitCode)
console.log(`\n${passed} checks passed. Tenants & Product Full Administrator Control is statically accepted.`)
