import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []
const passes = []
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))
const check = (condition, message) => { (condition ? passes : failures).push(message) }

const files = [
  'packages/browser-extension-contracts/b2b-ultra-reality.v9.json',
  'apps/ops-web/lib/browser-extension/b2b-ultra/contract.ts',
  'apps/ops-web/lib/browser-extension/b2b-ultra/service.ts',
  'apps/ops-web/lib/browser-extension/b2b-ultra/doctrines.ts',
  'apps/ops-web/lib/browser-extension/b2b-ultra/ai-provider.ts',
  'apps/ops-web/app/api/internal/browser-extension/ultra/scheduler/route.ts',
  'apps/ops-web/supabase/migrations/20260721_browser_extension_ultra_reality_completion.sql',
  'apps/ops-web/supabase/migrations/rollback_20260721_browser_extension_ultra_reality_completion.sql',
  'apps/ops-web/supabase/ultra-reality-completion/01_ULTRA_DATA_BRIDGE_DRY_RUN.sql',
  'apps/ops-web/supabase/ultra-reality-completion/02_ULTRA_DATA_BRIDGE_BACKFILL.sql',
  'apps/ops-web/supabase/ultra-reality-completion/03_ULTRA_CONFLICT_REPORT.sql',
  'apps/ops-web/supabase/ultra-reality-completion/04_ULTRA_DATA_BRIDGE_BACKFILL_ROLLBACK.sql',
  'apps/revenue-browser-extension/src/modules/revenue-b2b/ultra-mode.ts',
  'apps/revenue-browser-extension/src/modules/revenue-b2b/workspace-store.ts',
  'apps/revenue-browser-extension/src/modules/revenue-b2b/workspace-types.ts',
]
for (const file of files) check(exists(file), `required file: ${file}`)

const registry = JSON.parse(read(files[0]))
check(registry.version === '0.9.0', 'RC contract version is 0.9.0')
check(registry.baseline === '0.7.1', 'authoritative baseline remains 0.7.1')
check(/live_acceptance_required/.test(registry.releaseStatus), 'release status requires live acceptance')
check(registry.scopes?.length === 16, 'all Ultra scopes A-P are registered')
check(/no Capital Command Center/i.test(registry.mega8Boundary), 'Mega ZIP 8 federation remains excluded')

const contract = read(files[1])
const service = read(files[2])
for (const command of registry.newCommands || []) {
  check(contract.includes(`'${command}'`), `command contract mapped: ${command}`)
  check(service.includes(`case '${command}'`), `command runtime dispatched: ${command}`)
}
check(service.includes("'b2b_contacts'"), 'canonical contact table is used')
check(!service.includes("'browser_extension_b2b_contacts'"), 'non-canonical contact island is not referenced')
check(service.includes('revenue_tasks') && service.includes('revenue_appointments') && service.includes('revenue_activities'), 'unified timeline reads historical Revenue Command activity')
check(service.includes('carelink_dispatch_assignments') && service.includes('serviceos_missions') && service.includes('sales_invoices'), 'partner operations integration surfaces exist')

const ai = read(files[4])
for (const signal of ['BROWSER_REVENUE_AI_ENABLED','BROWSER_REVENUE_AI_KILL_SWITCH','evidenceIds','store: false','rules_fallback']) check(ai.includes(signal), `governed AI control: ${signal}`)
check(!/api[_-]?key\s*[:=]\s*["'][A-Za-z0-9_-]{20,}/i.test(ai), 'no embedded AI secret')

const scheduler = read(files[5])
for (const signal of ['timingSafeEqual','BROWSER_ULTRA_SCHEDULER_SECRET','BROWSER_ULTRA_SCHEDULER_KILL_SWITCH','writeExtensionAudit','b2b.ultra.scheduler.tick']) check(scheduler.includes(signal), `scheduler production control: ${signal}`)

const migration = read(files[6])
const rollback = read(files[7])
const tables = [...migration.matchAll(/create table if not exists public\.([a-z0-9_]+)/gi)].map((match) => match[1])
for (const table of tables) check(new RegExp(`drop table if exists public\\.${table}`, 'i').test(rollback), `schema rollback covers ${table}`)
for (const signal of ['enable row level security','revoke all on public.browser_extension_ultra_jobs','for update skip locked','rate_limit_per_hour','browser_extension_ultra_scheduler_control']) check(migration.includes(signal), `migration governance: ${signal}`)

for (const file of files.slice(6, 12)) {
  const sql = read(file)
  check((sql.match(/\$\$/g) || []).length % 2 === 0, `balanced PL/pgSQL delimiters: ${file}`)
  check(!/returning[\s\S]{0,100}\binto\s+temporary\s+table/i.test(sql), `no invalid RETURNING INTO TEMP TABLE: ${file}`)
  check(!/service_role|SUPABASE_SERVICE_ROLE_KEY|postgres(?:ql)?:\/\/[^\s"']+:[^\s"']+@/i.test(sql), `no database secret in ${file}`)
}
const backfill = read(files[9])
check(backfill.includes('pg_advisory_xact_lock'), 'backfill uses an advisory transaction lock')
check(backfill.includes('parent_branch_parent_unmapped') && backfill.includes("entity_type in ('parent','branch')"), 'parent/branch reconciliation and conflict mechanics are present')
check(backfill.includes('No partner was auto-activated') && /when lower\(status\)='won' then 'active'/.test(backfill), 'won source records are downgraded for verification instead of silently accepted')

const extension = read('apps/revenue-browser-extension/src/modules/revenue-b2b.ts')
check(extension.includes('Capacités assignées'), 'capability language says assigned, not proven active')
check(!extension.includes("label: '45 Capacités'"), 'misleading 45 capability label removed')
check(extension.includes('loadUltraScheduler') && extension.includes('controlUltraScheduler'), 'scheduler has real Browser OS controls')
check(read('apps/revenue-browser-extension/manifest.template.json').includes('live acceptance required'), 'manifest truth boundary is visible')

const forbiddenNewRefs = [files[1], files[2], files[3], files[4], files[5], 'apps/revenue-browser-extension/src/modules/revenue-b2b/ultra-mode.ts']
  .flatMap((file) => [...read(file).matchAll(/RefferQ/gi)].map(() => file))
check(forbiddenNewRefs.length === 0, 'removed RefferQ terminology is absent from Ultra implementation')

if (failures.length) {
  console.error(JSON.stringify({ ok: false, passes: passes.length, failures }, null, 2))
  process.exit(1)
}
console.log(JSON.stringify({ ok: true, passes: passes.length, truthBoundary: 'Structural verification only; deployed browser/API/database acceptance remains separately required.' }, null, 2))
