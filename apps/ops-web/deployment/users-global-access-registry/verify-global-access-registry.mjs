import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import Module, { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(here, '../..')
const require = createRequire(import.meta.url)
let failures = 0
let checks = 0

function ok(message) { checks += 1; console.log(`OK  ${message}`) }
function fail(message) { checks += 1; failures += 1; console.error(`FAIL ${message}`) }
function assert(condition, message) { condition ? ok(message) : fail(message) }
function read(relative) { return fs.readFileSync(path.join(appRoot, relative), 'utf8') }
function exists(relative) { return fs.existsSync(path.join(appRoot, relative)) }
function contains(relative, snippet, message) { assert(read(relative).includes(snippet), message) }

function findTsc() {
  const candidates = [
    process.env.TSC_BIN,
    path.join(appRoot, 'node_modules/.bin/tsc'),
    path.resolve(appRoot, '../../node_modules/.bin/tsc'),
  ].filter(Boolean)
  for (const candidate of candidates) if (fs.existsSync(candidate)) return candidate
  const result = spawnSync('which', ['tsc'], { encoding: 'utf8' })
  if (result.status === 0 && result.stdout.trim()) return result.stdout.trim()
  throw new Error('TypeScript compiler not found. Install repository dependencies before verification.')
}

function loadTypeScript(tscBin) {
  const real = fs.realpathSync(tscBin)
  const candidate = path.resolve(path.dirname(real), '../lib/typescript.js')
  if (fs.existsSync(candidate)) return require(candidate)
  return require('typescript')
}

const expectedFiles = [
  'lib/generated/app-routes.ts',
  'lib/auth/page-access.ts',
  'lib/users/access-governance/types.ts',
  'lib/users/access-governance/admin-client.ts',
  'lib/users/access-governance/discovery.ts',
  'lib/users/access-governance/registry.ts',
  'lib/users/access-governance/scan.ts',
  'lib/users/access-governance/permission-catalog.ts',
  'lib/users/access-governance/preview.ts',
  'lib/workspace-hub/authorized-resources.ts',
  'components/workspace-hub/AuthorizedResourceFamilyCards.tsx',
  'app/(protected)/users/_components/GlobalAccessRegistryScannerModal.tsx',
  'app/(protected)/users/_components/UserAccessGovernanceCenter.tsx',
  'app/(protected)/users/_components/SmartPermissionsPanel.tsx',
  'app/(protected)/users/page.tsx',
  'app/(protected)/dashboard/page.tsx',
  'app/api/users/access-governance/scan/route.ts',
  'app/api/users/access-governance/scan/[id]/publish/route.ts',
  'app/api/users/access-governance/resources/route.ts',
  'app/api/users/access-governance/versions/route.ts',
  'app/api/users/access-governance/versions/[id]/rollback/route.ts',
  'app/api/users/access-governance/registry/route.ts',
  'app/api/app-routes/allowed/route.ts',
  'app/api/workspace-hub/allowed-modules/route.ts',
  'scripts/scan-app-routes.mjs',
  'supabase/migrations/20260721_users_global_access_registry_route_family_scanner.sql',
  'supabase/migrations/20260721_users_global_access_registry_route_family_scanner.rollback.sql',
]

for (const file of expectedFiles) assert(exists(file), `required file exists: ${file}`)

const tscBin = findTsc()
const ts = loadTypeScript(tscBin)
ok(`TypeScript compiler resolved: ${ts.version}`)

const codeFiles = expectedFiles.filter((file) => /\.(ts|tsx)$/.test(file))
for (const relative of codeFiles) {
  const source = read(relative)
  const result = ts.transpileModule(source, {
    fileName: relative,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      isolatedModules: true,
    },
  })
  const errors = (result.diagnostics || []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
  if (errors.length) {
    fail(`syntax transpile failed: ${relative}: ${errors.map((item) => ts.flattenDiagnosticMessageText(item.messageText, ' ')).join(' | ')}`)
  }
}
if (!failures) ok(`${codeFiles.length} TypeScript/TSX files transpiled without syntax errors`)

execFileSync(process.execPath, [path.join(appRoot, 'scripts/scan-app-routes.mjs'), '--check'], { cwd: appRoot, stdio: 'inherit' })
ok('generated global APP_ROUTES catalogue is synchronized')

execFileSync(tscBin, ['-p', path.join(here, 'tsconfig.backend.verify.json'), '--pretty', 'false'], { cwd: appRoot, stdio: 'inherit' })
ok('strict backend semantic verification passed')
execFileSync(tscBin, ['-p', path.join(here, 'tsconfig.ui.verify.json'), '--pretty', 'false'], { cwd: appRoot, stdio: 'inherit' })
ok('focused scanner modal/dashboard UI semantic verification passed')

const discoverySource = read('lib/users/access-governance/discovery.ts')
const discoveryJs = ts.transpileModule(discoverySource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText
const runtimeFilename = path.join(os.tmpdir(), `angelcare-access-discovery-${process.pid}.cjs`)
const runtimeModule = new Module(runtimeFilename)
runtimeModule.filename = runtimeFilename
runtimeModule.paths = Module._nodeModulePaths(appRoot)
runtimeModule._compile(discoveryJs, runtimeFilename)
const previousCwd = process.cwd()
process.chdir(appRoot)
let discovery
try {
  discovery = runtimeModule.exports.discoverGlobalAccessResources({ includeApi: true })
} finally {
  process.chdir(previousCwd)
}
const resourceKeys = new Set(discovery.resources.map((resource) => resource.resourceKey))
const permissionKeys = new Set()
let duplicatePermissions = 0
for (const resource of discovery.resources) {
  if (permissionKeys.has(resource.permissionKey)) duplicatePermissions += 1
  permissionKeys.add(resource.permissionKey)
}
const brokenParents = discovery.resources.filter((resource) => resource.parentResourceKey && !resourceKeys.has(resource.parentResourceKey))
const typeCounts = discovery.resources.reduce((acc, resource) => {
  acc[resource.resourceType] = (acc[resource.resourceType] || 0) + 1
  return acc
}, {})
assert(discovery.routes.length >= 2000, `global filesystem scanner discovered ${discovery.routes.length} page/API route files`)
assert(discovery.resources.length >= 2000, `global hierarchy classified ${discovery.resources.length} resources`)
assert((typeCounts.module || 0) > 0, 'formal modules classified')
assert((typeCounts.route_family || 0) > 0, 'independent route families classified')
assert((typeCounts.standalone_route || 0) > 0, 'standalone pages classified')
assert((typeCounts.api_route || 0) > 0, 'API routes classified')
assert(duplicatePermissions === 0, 'no duplicate canonical permission keys')
assert(brokenParents.length === 0, 'all resource parent references resolve')
for (const prefix of ['/carelink-ops', '/traininghub', '/market-os', '/users', '/api/users/access-governance/scan']) {
  assert(discovery.routes.some((route) => route.href === prefix || route.href.startsWith(`${prefix}/`)), `global scan covers ${prefix}`)
}

const generated = read('lib/generated/app-routes.ts')
const generatedRouteCount = (generated.match(/"permissionKey": "page:/g) || []).length
assert(generatedRouteCount >= 1000, `generated dashboard/page catalogue contains ${generatedRouteCount} routes`)
contains('scripts/scan-app-routes.mjs', "const appRoot = path.join(root, 'app')", 'generator scans complete application app root')
contains('app/(protected)/users/_components/UserAccessGovernanceCenter.tsx', 'Open Global Registry Scanner', 'Users Management opens scanner in-page')
for (const label of ['Classification Studio', 'Families & Groups', 'Pages & APIs', 'Reconciliation', 'Publication & Recovery']) {
  contains('app/(protected)/users/_components/GlobalAccessRegistryScannerModal.tsx', label, `scanner modal includes ${label}`)
}
contains('lib/users/access-governance/scan.ts', "mode === 'publish' ? true", 'published scans always include API routes')
contains('lib/users/access-governance/scan.ts', "status: 'missing'", 'missing resources are marked, not automatically deleted')
contains('lib/users/access-governance/scan.ts', 'access_registry_versions', 'registry publication is versioned')
contains('lib/auth/page-access.ts', 'resource:family:', 'family grants inherit to child page access')
contains('lib/auth/page-access.ts', 'resource:group:', 'group grants inherit to child page access')
contains('lib/workspace-hub/authorized-resources.ts', "['route_family', 'standalone_route']", 'dashboard resolver includes authorized families and standalone pages')
contains('app/(protected)/dashboard/page.tsx', 'AuthorizedResourceFamilyCards', 'dashboard renders independent authorized resource cards beside modules')
contains('lib/users/access-governance/permission-catalog.ts', 'for (const resource of registryResources', 'permission catalog includes normalized registry resources')
contains('app/api/users/access-governance/scan/route.ts', 'getCurrentAppUser', 'scan endpoint requires authenticated actor')
contains('lib/users/access-governance/scan.ts', 'canManageAccessGovernance(actor)', 'scan and publication enforce management permission')
contains('lib/users/access-governance/admin-client.ts', 'SUPABASE_SERVICE_ROLE_KEY', 'registry mutation requires server-side service role configuration')
contains('supabase/migrations/20260721_users_global_access_registry_route_family_scanner.sql', 'create table if not exists public.access_resource_registry', 'additive canonical resource registry migration included')
contains('supabase/migrations/20260721_users_global_access_registry_route_family_scanner.sql', 'create table if not exists public.access_registry_versions', 'version history migration included')
contains('supabase/migrations/20260721_users_global_access_registry_route_family_scanner.sql', 'create table if not exists public.access_resource_grants', 'normalized resource grants migration included')
contains('supabase/migrations/20260721_users_global_access_registry_route_family_scanner.sql', 'authenticated_read_access_resource_registry', 'registry RLS is read-only for authenticated clients')
contains('supabase/migrations/20260721_users_global_access_registry_route_family_scanner.rollback.sql', 'drop table if exists public.access_resource_registry', 'guarded SQL rollback included')

console.log(`\nGlobal Access Registry verification: ${checks - failures}/${checks} checks passed.`)
console.log(`Discovery summary: ${discovery.routes.length} route files, ${discovery.resources.length} resources, ${typeCounts.module || 0} modules, ${typeCounts.route_family || 0} families, ${typeCounts.standalone_route || 0} standalone pages, ${typeCounts.api_route || 0} APIs.`)
if (failures) process.exit(1)
