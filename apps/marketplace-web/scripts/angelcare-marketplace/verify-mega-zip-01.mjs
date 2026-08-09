import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []
const passes = []

function check(condition, label, detail = '') {
  if (condition) passes.push(label)
  else failures.push(`${label}${detail ? ` — ${detail}` : ''}`)
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath))
}

const required = [
  'angelcare-marketplace/domain/types.ts',
  'angelcare-marketplace/domain/constants.ts',
  'angelcare-marketplace/config/runtime.ts',
  'angelcare-marketplace/auth/context.ts',
  'angelcare-marketplace/permissions/permission-catalog.ts',
  'angelcare-marketplace/audit/write-audit.ts',
  'angelcare-marketplace/server/errors.ts',
  'angelcare-marketplace/server/request.ts',
  'angelcare-marketplace/server/repository.ts',
  'angelcare-marketplace/api/handlers.ts',
  'angelcare-marketplace/design-system/marketplace.module.css',
  'angelcare-marketplace/design-system/ui.tsx',
  'angelcare-marketplace/shells/PublicShell.tsx',
  'angelcare-marketplace/shells/WorkspaceShell.tsx',
  'angelcare-marketplace/shells/AdminShell.tsx',
  'app/angelcare-marketplace/page.tsx',
  'app/angelcare-marketplace/layout.tsx',
  'app/angelcare-marketplace/loading.tsx',
  'app/angelcare-marketplace/error.tsx',
  'app/angelcare-marketplace/access-denied/page.tsx',
  'app/angelcare-marketplace/unavailable/page.tsx',
  'app/angelcare-marketplace/(protected)/workspace/page.tsx',
  'app/angelcare-marketplace/(protected)/account/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/modules/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/modules/[moduleKey]/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/feature-flags/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/security-audit/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/configuration/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/readiness/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/foundation-ui/page.tsx',
  'app/api/angelcare-marketplace/foundation/context/route.ts',
  'app/api/angelcare-marketplace/foundation/health/route.ts',
  'app/api/angelcare-marketplace/foundation/modules/route.ts',
  'app/api/angelcare-marketplace/foundation/modules/[moduleKey]/route.ts',
  'app/api/angelcare-marketplace/foundation/modules/[moduleKey]/transition/route.ts',
  'app/api/angelcare-marketplace/foundation/feature-flags/route.ts',
  'app/api/angelcare-marketplace/foundation/feature-flags/[flagKey]/route.ts',
  'app/api/angelcare-marketplace/foundation/audit/route.ts',
  'app/api/angelcare-marketplace/foundation/audit/export/route.ts',
  'app/api/angelcare-marketplace/foundation/configuration/route.ts',
  'app/api/angelcare-marketplace/foundation/configuration/[key]/route.ts',
  'app/api/angelcare-marketplace/foundation/readiness/route.ts',
  'app/api/angelcare-marketplace/foundation/readiness/[checkKey]/route.ts',
  'app/api/angelcare-marketplace/foundation/readiness/sign-off/route.ts',
  'supabase/migrations/20260731_angelcare_marketplace_mega_zip_01_foundation.sql',
  'tsconfig.angelcare-marketplace-mega-zip-01.json',
]

for (const file of required) check(exists(file), `required file: ${file}`)

const codeFiles = [
  ...walk(path.join(root, 'angelcare-marketplace')),
  ...walk(path.join(root, 'app/angelcare-marketplace')),
  ...walk(path.join(root, 'app/api/angelcare-marketplace')),
].filter((file) => /\.(ts|tsx|css)$/.test(file))

function walk(directory) {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })
}

const joinedCode = codeFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n')
for (const forbidden of [
  ['lorem ipsum', /lorem ipsum/i],
  ['hidden TODO', /\bTODO\b/],
  ['service-role secret reference in client/domain code', /SUPABASE_SERVICE_ROLE_KEY/],
  ['unsafe any assertion', /\bas any\b/],
  ['localStorage persistence masquerading as records', /\blocalStorage\b/],
  ['hard-coded fake price', /\b(?:MAD|Dh)\s*\d{2,}/],
]) {
  check(!forbidden[1].test(joinedCode), `forbidden scan: ${forbidden[0]}`)
}

const css = read('angelcare-marketplace/design-system/marketplace.module.css')
check(css.includes('--acm-navy-950'), 'design tokens include navy authority')
check(css.includes('--acm-red-600'), 'design tokens include disciplined ANGELCARE red')
check(css.includes('.rtlPreview'), 'Arabic RTL visual primitive exists')
check(css.includes('@media (max-width: 820px)'), 'responsive tablet/mobile rules exist')
check(css.includes('@media (prefers-reduced-motion: reduce)'), 'reduced-motion accessibility exists')
check(!css.includes(':global('), 'CSS remains scoped and does not introduce global selectors')

const context = read('angelcare-marketplace/auth/context.ts')
check(context.includes("getCurrentUser"), 'existing OPS identity is reused')
check(context.includes("requireMarketplaceApiContext"), 'server API authorization guard exists')
check(context.includes("marketplace_viewer"), 'deny-safe fallback role exists')
check(!context.includes("createUser("), 'no competing user system is created')

const handlers = read('angelcare-marketplace/api/handlers.ts')
check(handlers.includes('requestId(request)'), 'API request reference standard is enforced')
check(handlers.includes('apiFailure'), 'API business-readable error envelope exists')
check(handlers.includes('requireMarketplaceApiContext'), 'protected APIs resolve server permissions')
check(handlers.includes('handleAuditExportGet'), 'authorized audit export endpoint exists')

const repository = read('angelcare-marketplace/server/repository.ts')
check(repository.includes('MODULE_TRANSITIONS'), 'module lifecycle transitions are explicit')
check(repository.includes('DEPENDENCY_BLOCKED'), 'module dependencies block invalid activation')
check(repository.includes('writeMarketplaceAudit'), 'sensitive repository actions invoke audit writing')
check(repository.includes('listMarketplaceReadiness'), 'readiness records are durable and queryable')
check(repository.includes('signOffMarketplaceReadiness'), 'real conditional sign-off logic exists')

const sql = read('supabase/migrations/20260731_angelcare_marketplace_mega_zip_01_foundation.sql')
check(!/\bdrop\s+table\b/i.test(sql), 'migration does not drop tables')
check(!/\bdrop\s+column\b/i.test(sql), 'migration does not drop columns')
check(!/\btruncate\b/i.test(sql), 'migration does not truncate data')
check(sql.includes('angelcare_marketplace_modules'), 'module registry table exists')
check(sql.includes('angelcare_marketplace_audit_events'), 'audit evidence table exists')
check(sql.includes('angelcare_marketplace_readiness_checks'), 'readiness table exists')
check(sql.includes('enable row level security'), 'RLS is enabled on foundation tables')
check(sql.includes('revoke all') && sql.includes('service_role'), 'direct anon/auth access is revoked and service access is explicit')
check(sql.includes("'marketplace.foundation'"), 'Mega ZIP 01 module is seeded')
check(sql.includes("'marketplace.final-hardening'"), 'Mega ZIP 20 is registered as a future domain')
check(sql.includes("'not_installed'"), 'future domains are truthfully marked not installed')
check((sql.match(/introduced_by_mega_zip/g) || []).length >= 3, 'module ownership by Mega ZIP is represented')

const adapters = walk(path.join(root, 'app/api/angelcare-marketplace')).filter((file) => file.endsWith('route.ts'))
for (const adapter of adapters) {
  const lines = fs.readFileSync(adapter, 'utf8').trim().split(/\r?\n/).length
  check(lines <= 3, `thin API adapter: ${path.relative(root, adapter)}`, `${lines} lines`)
}

const publicHome = read('angelcare-marketplace/features/public/PublicHome.tsx')
check(publicHome.includes('Pas de promesse artificielle'), 'public experience discloses future-domain boundary')
check(!/prix|acheter maintenant/i.test(publicHome), 'public foundation does not fake marketplace transactions')

const pageStateFiles = [
  'app/angelcare-marketplace/loading.tsx',
  'app/angelcare-marketplace/error.tsx',
  'app/angelcare-marketplace/access-denied/page.tsx',
  'app/angelcare-marketplace/unavailable/page.tsx',
]
for (const file of pageStateFiles) check(exists(file), `route state exists: ${file}`)

const docs = [
  'angelcare-marketplace/documentation/MEGA_ZIP_01_CONTRACT.md',
  'angelcare-marketplace/documentation/MEGA_ZIP_01_IMPLEMENTATION_REPORT.md',
  'angelcare-marketplace/documentation/MEGA_ZIP_01_ROUTE_INVENTORY.md',
  'angelcare-marketplace/documentation/MEGA_ZIP_01_COMPONENT_INVENTORY.md',
  'angelcare-marketplace/documentation/MEGA_ZIP_01_STATE_INVENTORY.md',
  'angelcare-marketplace/documentation/MEGA_ZIP_01_ENTITY_AND_FIELD_REGISTER.md',
  'angelcare-marketplace/documentation/MEGA_ZIP_01_API_REGISTER.md',
  'angelcare-marketplace/documentation/MEGA_ZIP_01_PERMISSION_MATRIX.md',
  'angelcare-marketplace/documentation/MEGA_ZIP_01_AUDIT_EVENT_REGISTER.md',
  'angelcare-marketplace/documentation/MEGA_ZIP_01_CONFIGURATION_REGISTER.md',
  'angelcare-marketplace/documentation/MEGA_ZIP_01_MIGRATION_REGISTER.md',
  'angelcare-marketplace/documentation/MEGA_ZIP_01_QA_EVIDENCE.md',
  'angelcare-marketplace/documentation/MEGA_ZIP_01_KNOWN_DEPENDENCIES.md',
  'angelcare-marketplace/documentation/MEGA_ZIP_01_OPERATOR_GUIDE.md',
  'angelcare-marketplace/documentation/MEGA_ZIP_01_HANDOVER.md',
]
for (const file of docs) check(exists(file), `handover artifact: ${file}`)

console.log(`\nANGELCARE Marketplace Mega ZIP 01 — static contractual verifier`)
console.log(`PASS ${passes.length}`)
for (const pass of passes) console.log(`  ✓ ${pass}`)

if (failures.length) {
  console.error(`\nFAIL ${failures.length}`)
  for (const failure of failures) console.error(`  ✗ ${failure}`)
  process.exit(1)
}

console.log('\nRESULT: STATIC CONTRACTUAL ACCEPTANCE PASSED')
console.log('NO BUILD, GIT, DEPLOYMENT OR DATABASE MIGRATION WAS EXECUTED.')
