#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(scriptDir, '../..')
const require = createRequire(import.meta.url)

function loadTypeScript() {
  const candidates = [
    'typescript',
    '/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js',
    '/usr/local/lib/node_modules/typescript/lib/typescript.js',
  ]
  for (const candidate of candidates) {
    try { return require(candidate) } catch {}
  }
  throw new Error('TypeScript runtime is required for the syntax acceptance gate.')
}

const ts = loadTypeScript()
const failures = []
const passes = []

function check(condition, label, detail = '') {
  if (condition) passes.push(label)
  else failures.push(detail ? `${label}: ${detail}` : label)
}

function read(relative) {
  return fs.readFileSync(path.join(appRoot, relative), 'utf8')
}

function exists(relative) {
  return fs.existsSync(path.join(appRoot, relative))
}

function walk(relative, suffixes = new Set(['.ts', '.tsx', '.mjs', '.sql', '.css', '.json', '.md'])) {
  const root = path.join(appRoot, relative)
  if (!fs.existsSync(root)) return []
  const output = []
  const stack = [root]
  while (stack.length) {
    const current = stack.pop()
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name)
      if (entry.isDirectory()) stack.push(absolute)
      else if (entry.isFile() && suffixes.has(path.extname(entry.name))) output.push(absolute)
    }
  }
  return output.sort()
}

const required = [
  'lib/users/access-governance/universal/types.ts',
  'lib/users/access-governance/universal/security.ts',
  'lib/users/access-governance/universal/source-root.ts',
  'lib/users/access-governance/universal/source-intelligence.ts',
  'lib/users/access-governance/universal/database-intelligence.ts',
  'lib/users/access-governance/universal/repository.ts',
  'lib/users/access-governance/universal/reconciliation.ts',
  'lib/users/access-governance/universal/execution.ts',
  'lib/users/access-governance/universal/service.ts',
  'app/(protected)/users/access-governance/page.tsx',
  'app/(protected)/users/access-governance/GlobalAuthorizationCommandClient.tsx',
  'app/(protected)/users/access-governance/GlobalAuthorizationCommand.module.css',
  'app/api/users/access-governance/command/overview/route.ts',
  'app/api/users/access-governance/command/scans/route.ts',
  'app/api/users/access-governance/command/scans/[id]/route.ts',
  'app/api/users/access-governance/command/topology/route.ts',
  'app/api/users/access-governance/command/evidence/route.ts',
  'app/api/users/access-governance/command/findings/route.ts',
  'app/api/users/access-governance/command/manifests/route.ts',
  'app/api/users/access-governance/command/plans/route.ts',
  'app/api/users/access-governance/command/executions/route.ts',
  'app/api/users/access-governance/command/rollbacks/[id]/execute/route.ts',
  'supabase/migrations/20260804_global_authorization_intelligence_reconciliation_command.sql',
  'tsconfig.access-governance-command.json',
]
for (const file of required) check(exists(file), `required file · ${file}`)

const universalFiles = walk('lib/users/access-governance/universal', new Set(['.ts']))
const universalText = universalFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n')
const forbiddenModuleNames = [
  /revenue[-_ ]command/i,
  /flashcards[-_ ]os/i,
  /market[-_ ]os/i,
  /ambassadors?/i,
  /traininghub/i,
  /carelink/i,
]
check(!forbiddenModuleNames.some((pattern) => pattern.test(universalText)), 'module-agnostic universal core', 'A named business module leaked into universal scanner logic.')
check(!/\bas any\b|\bas unknown\b|@ts-ignore|@ts-expect-error/.test(universalText), 'no unsafe TypeScript bypasses')
check(!/if\s*\([^)]*(?:module|application)[^)]*===\s*['"][^'"]+['"]/.test(universalText), 'no hardcoded module branch')

const sourceRoot = read('lib/users/access-governance/universal/source-root.ts')
const service = read('lib/users/access-governance/universal/service.ts')
check(sourceRoot.includes('turbopackIgnore: true'), 'dynamic filesystem paths isolated from Turbopack tracing')
check(sourceRoot.includes('inventoryUniversalDirectory'), 'chunkable directory inventory')
check(service.includes('claimUniversalInventoryItems') && service.includes('continueUniversalInventory'), 'persisted chunked inventory execution')
check(!service.includes('inventoryUniversalSource('), 'no monolithic request-time estate inventory')

const client = read('app/(protected)/users/access-governance/GlobalAuthorizationCommandClient.tsx')
const workspaceLabels = ['Scan Overview', 'Classification Studio', 'Families & Groups', 'Pages & APIs', 'Reconciliation', 'Publication & Recovery']
for (const label of workspaceLabels) check(client.includes(label), `six-workspace UI · ${label}`)
check(client.includes('Evidence chain'), 'evidence inspector UI')
check(client.includes('Expected versus effective authority'), 'global-versus-native comparison UI')
check(client.includes('Execution & recovery ledger'), 'execution and rollback UI')
check(client.includes('AbortController'), 'abortable browser requests')
check(!/setInterval\([^,]+,\s*[0-9]+\)/.test(client), 'no uncontrolled polling interval')

const migration = read('supabase/migrations/20260804_global_authorization_intelligence_reconciliation_command.sql')
const requiredSqlObjects = [
  'access_scan_inventory_items',
  'access_authorization_evidence',
  'access_topology_nodes',
  'access_topology_edges',
  'access_authority_manifests',
  'access_reconciliation_findings',
  'access_reconciliation_plans',
  'access_execution_runs',
  'access_verification_results',
  'access_rollback_packages',
  'access_governance_claim_inventory_items',
  'access_governance_introspect_authority',
  'access_governance_execute_plan',
  'access_governance_execute_rollback',
]
for (const objectName of requiredSqlObjects) check(migration.includes(objectName), `migration object · ${objectName}`)
check(/^begin;[\s\S]*commit;\s*$/i.test(migration.trim()), 'single additive migration transaction')
check((migration.match(/\$function\$/g) ?? []).length % 2 === 0, 'balanced PostgreSQL function delimiters')
check(migration.includes("validation_status = 'confirmed'") && migration.includes('executable = true'), 'confirmed-manifest execution gate')
check(migration.includes('access_verification_results') && migration.includes("verification_type"), 'post-mutation effective-access verification evidence')
check(migration.includes("then 'available'") && migration.includes('rollback_operations'), 'rollback package lifecycle')
check(!/drop\s+(?:table|schema)\s+(?!if exists public\.access_)/i.test(migration), 'no destructive unrelated schema operation')

const syntaxFiles = [
  ...universalFiles,
  ...walk('app/api/users/access-governance/command', new Set(['.ts', '.tsx'])),
  ...walk('app/(protected)/users/access-governance', new Set(['.ts', '.tsx'])),
  path.join(appRoot, 'app/(protected)/users/_components/GlobalAccessRegistryScannerModal.tsx'),
].filter((file) => fs.existsSync(file))
let syntaxDiagnostics = 0
for (const file of syntaxFiles) {
  const source = fs.readFileSync(file, 'utf8')
  const result = ts.transpileModule(source, {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.Preserve,
      isolatedModules: true,
    },
  })
  for (const diagnostic of result.diagnostics ?? []) {
    if (diagnostic.category !== ts.DiagnosticCategory.Error) continue
    syntaxDiagnostics += 1
    failures.push(`${path.relative(appRoot, file)} · ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`)
  }
}
check(syntaxDiagnostics === 0, `TypeScript syntax gate · ${syntaxFiles.length} files`)

const css = read('app/(protected)/users/access-governance/GlobalAuthorizationCommand.module.css')
check(css.includes('@media') || css.includes('minmax'), 'responsive high-density UI rules')
check(!/neon|glow|bling/i.test(css), 'disciplined corporate visual language')

console.log('========================================================================')
console.log('ANGELCARE — GLOBAL AUTHORIZATION COMMAND STATIC ACCEPTANCE')
console.log('========================================================================')
console.log(`Checks passed: ${passes.length}`)
console.log(`Checks failed: ${failures.length}`)
console.log(`Syntax files:  ${syntaxFiles.length}`)
console.log('Production build: NO')
console.log('Git mutation:     NO')
console.log()
if (failures.length) {
  console.error('FAILED')
  failures.forEach((failure, index) => console.error(`${String(index + 1).padStart(3, '0')}. ${failure}`))
  process.exit(1)
}
console.log('✓ UNIVERSAL AUTHORIZATION INTELLIGENCE & UIX STATIC ACCEPTANCE PASSED')
