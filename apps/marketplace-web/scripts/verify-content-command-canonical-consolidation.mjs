#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const appRoot = path.resolve(process.argv[2] || process.cwd())
const failures = []
let checks = 0

function pass(condition, message) {
  checks += 1
  if (!condition) failures.push(message)
}
function file(rel) { return path.join(appRoot, rel) }
function exists(rel) { return fs.existsSync(file(rel)) }
function read(rel) { return fs.readFileSync(file(rel), 'utf8') }
function walk(rel) {
  const root = file(rel)
  if (!fs.existsSync(root)) return []
  const out = []
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name)
      if (entry.isDirectory()) visit(target)
      else out.push(target)
    }
  }
  visit(root)
  return out
}
function relative(abs) { return path.relative(appRoot, abs).replaceAll('\\', '/') }

const required = [
  'lib/market-os/content-command-headquarters/canonical-compatibility-types.ts',
  'lib/market-os/content-command-headquarters/canonical-compatibility-service.ts',
  'lib/market-os/content-command-headquarters/canonical-legacy-api-service.ts',
  'app/api/market-os/content-command-center/data/route.ts',
  'app/api/market-os/content-command-center/actions/route.ts',
  'app/api/market-os/content-command-center/task-runtime/route.ts',
  'scripts/migrate-content-command-legacy-to-canonical.mjs',
  'supabase/migrations/20260730_1900_content_command_canonical_consolidation.sql',
]
for (const rel of required) pass(exists(rel), `Missing required canonical consolidation file: ${rel}`)

const activeRoots = [
  'app/(protected)/market-os/content-command-center',
  'app/api/market-os/content-command-center',
  'components/market-os/content-command',
  'lib/market-os/content-command-headquarters',
  'lib/market-os/marketing-ai',
  'lib/content-command/tasks',
]
const activeFiles = activeRoots.flatMap(walk).filter((item) => /\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(item))
const activeText = activeFiles.map((item) => ({ rel: relative(item), text: fs.readFileSync(item, 'utf8') }))

const directLegacyTable = /\.from\(\s*['"]content_command_/g
for (const item of activeText) pass(!directLegacyTable.test(item.text), `Active legacy database mutation/read remains: ${item.rel}`)

const businessKeys = [
  'market_os_content_command_items_v2',
  'market_os_content_command_tasks_v2',
  'market_os_content_command_assets_v2',
  'market_os_content_command_briefs_v2',
  'market_os_content_command_brand_rules_v2',
  'market_os_content_command_logs_v2',
]
for (const item of activeText) {
  const writesStorage = /localStorage\.setItem\s*\(/.test(item.text)
  const namesBusinessKey = businessKeys.some((key) => item.text.includes(key))
  pass(!(writesStorage && namesBusinessKey), `Business localStorage write remains: ${item.rel}`)
}

const store = read('components/market-os/content-command/content-command-system.tsx')
pass(store.includes('fetchCanonicalContentStore'), 'Canonical browser-store hydration is missing.')
pass(store.includes('persistCanonicalCommit'), 'Canonical browser-store mutation bridge is missing.')
pass(store.includes('readLegacyStoreForMigration'), 'Controlled local migration reader is missing.')
pass(store.includes('clearLegacyBusinessStore'), 'Controlled migrated-copy cleanup is missing.')
pass(!/export function writeJson[\s\S]{0,500}localStorage\.setItem/.test(store), 'writeJson still persists business records locally.')

const dataRoute = read('app/api/market-os/content-command-center/data/route.ts')
pass(dataRoute.includes('getCanonicalCompatibilityStore'), 'Data route does not read canonical compatibility snapshot.')
pass(dataRoute.includes("requireContentHeadquartersUser('view')") || dataRoute.includes('requireContentHeadquartersUser("view")'), 'Data route lacks view authority.')

const actionsRoute = read('app/api/market-os/content-command-center/actions/route.ts')
pass(actionsRoute.includes('applyCanonicalCompatibilityCommit'), 'Actions route does not persist through canonical compatibility service.')
pass(actionsRoute.includes('status: 409'), 'Unmigrated actions do not fail explicitly.')
pass(actionsRoute.includes('persisted: true'), 'Canonical mutation success does not declare persistence.')

const apiRoutes = walk('app/api/market-os/content-command-center').filter((item) => item.endsWith('route.ts'))
for (const route of apiRoutes) {
  const text = fs.readFileSync(route, 'utf8')
  pass(text.includes('requireContentHeadquartersUser'), `Compatibility API route lacks Headquarters authority: ${relative(route)}`)
}

const retiredRoutes = [
  'app/api/market-os/content-command-center/seed/route.ts',
  'app/api/market-os/content-command-center/templates/reset/route.ts',
]
for (const rel of retiredRoutes) {
  const text = read(rel)
  pass(text.includes('LEGACY_OPERATION_RETIRED'), `Dangerous legacy operation is not retired: ${rel}`)
  pass(text.includes('status:410') || text.includes('status: 410'), `Retired legacy operation does not return HTTP 410: ${rel}`)
}

const legacyPage = read('app/(protected)/market-os/content-command-center/legacy-operations/page.tsx')
pass(legacyPage.includes('redirect('), 'Legacy operations route still mounts a parallel operational workspace.')

const context = read('lib/market-os/marketing-ai/context-assembler.ts')
for (const table of [
  'market_content_signals', 'market_content_strategies', 'market_content_dossiers',
  'market_content_missions', 'market_content_mission_tasks', 'market_content_evidence',
  'market_content_source_objects', 'market_content_publication_packages', 'market_content_human_reviews',
]) pass(context.includes(table), `Marketing AI canonical context is missing table ${table}.`)
pass(!context.includes("content_command_documents") && !context.includes("content_command_tasks") && !context.includes("content_command_assets"), 'Marketing AI still reads legacy Content Command tables.')
pass(context.includes('authority_state,content,version,source,effective_at'), 'Marketing AI doctrine context does not include exact doctrine content.')

const migrationSql = read('supabase/migrations/20260730_1900_content_command_canonical_consolidation.sql')
for (const table of ['market_content_templates', 'market_content_notes', 'market_content_compatibility_links']) pass(migrationSql.includes(table), `Support migration does not create ${table}.`)
pass(!/drop\s+table/i.test(migrationSql), 'Canonical SQL contains a destructive DROP TABLE.')
pass(migrationSql.includes('enable row level security'), 'Canonical support tables do not enable RLS.')
pass(migrationSql.includes('revoke all'), 'Canonical support tables do not revoke direct browser access.')

const migrationScript = read('scripts/migrate-content-command-legacy-to-canonical.mjs')
pass(migrationScript.includes('market_content_compatibility_links'), 'Legacy migration lacks an idempotency ledger.')
pass(!/\.delete\(|\.remove\(|drop\s+table/i.test(migrationScript), 'Legacy migration contains a destructive legacy operation.')
pass(migrationScript.includes('CONTENT_COMMAND_CANONICAL_MIGRATION_REPORT.json'), 'Legacy migration does not write its acceptance report.')

const taskActivity = read('lib/content-command/tasks/task-activity.ts')
pass(!taskActivity.includes('localStorage'), 'Task runtime still persists operational state in localStorage.')
pass(taskActivity.includes('/api/market-os/content-command-center/task-runtime'), 'Task runtime is not wired to the canonical API.')

const phase12 = read('components/market-os/content-command/phase12-local-persistence.ts')
pass(!phase12.includes('localStorage'), 'Phase 12 still persists business snapshots in localStorage.')

const shell = read('components/market-os/content-command/ContentCommand360Shell.tsx')
pass(shell.includes('fetchCanonicalContentStore'), 'Global Content Command search is not built from canonical records.')
pass(!businessKeys.some((key) => shell.includes(key)), 'Global Content Command search still indexes browser-local business records.')

const quickCreate = read('components/market-os/content-command/content-create-page.tsx')
pass(quickCreate.includes('create_dossier'), 'Quick Create is not wired to canonical dossier creation.')
pass(quickCreate.includes('/dossiers/'), 'Quick Create does not navigate to canonical Dossier 360.')

const promotion = read('components/market-os/content-command/headquarters/LegacyPromotionPanel.tsx')
pass(promotion.includes('promote_legacy_content'), 'Local-browser migration panel does not promote records canonically.')
pass(promotion.includes('clearLegacyBusinessStore'), 'Local-browser migration panel cannot clear verified migrated copies.')

const importPattern = /(?:from\s+|import\s*\(\s*|require\s*\(\s*)['"]([^'"]+)['"]|^\s*import\s+['"]([^'"]+)['"]/gm
const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.css']
for (const item of activeText) {
  for (const match of item.text.matchAll(importPattern)) {
    const specifier = match[1] || match[2]
    if (!specifier || (!specifier.startsWith('@/') && !specifier.startsWith('.'))) continue
    const base = specifier.startsWith('@/')
      ? path.join(appRoot, specifier.slice(2))
      : path.resolve(path.dirname(file(item.rel)), specifier)
    const candidates = [
      ...extensions.map((ext) => `${base}${ext}`),
      ...extensions.slice(1).map((ext) => path.join(base, `index${ext}`)),
    ]
    pass(candidates.some((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()), `Unresolved local import ${specifier} in ${item.rel}`)
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL — ${failure}`)
  console.error(`\n${failures.length} of ${checks} canonical consolidation checks failed.`)
  process.exit(1)
}
console.log(`PASS — ${checks} Content Command canonical authority, persistence, AI-context, CRUD-boundary and retirement checks passed.`)
