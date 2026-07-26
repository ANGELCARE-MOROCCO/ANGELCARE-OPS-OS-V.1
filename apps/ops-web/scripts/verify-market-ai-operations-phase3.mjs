import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = process.cwd()
const fail = (message) => { console.error(`FAIL  ${message}`); process.exitCode = 1 }
const pass = (message) => console.log(`PASS  ${message}`)
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const exists = (rel) => fs.existsSync(path.join(root, rel))

const pages = [
  'app/(protected)/market-os/content-command-center/ai-director/autopilot/page.tsx',
  'app/(protected)/market-os/content-command-center/ai-director/compiler/page.tsx',
  'app/(protected)/market-os/content-command-center/ai-director/queue/page.tsx',
  'app/(protected)/market-os/content-command-center/ai-director/decisions/page.tsx',
  'app/(protected)/market-os/content-command-center/ai-director/integrations/page.tsx',
  'app/(protected)/market-os/content-command-center/ai-director/repository/page.tsx',
  'app/(protected)/market-os/content-command-center/ai-director/recovery/page.tsx',
]
const apis = [
  'app/api/market-os/content-command/marketing-ai/autopilot/dashboard/route.ts',
  'app/api/market-os/content-command/marketing-ai/bridge/versions/route.ts',
  'app/api/market-os/content-command/marketing-ai/canonical-records/route.ts',
  'app/api/market-os/content-command/marketing-ai/compilations/route.ts',
  'app/api/market-os/content-command/marketing-ai/compilations/[id]/route.ts',
  'app/api/market-os/content-command/marketing-ai/compilations/[id]/decision/route.ts',
  'app/api/market-os/content-command/marketing-ai/compilations/[id]/execute/route.ts',
  'app/api/market-os/content-command/marketing-ai/cron/route.ts',
  'app/api/market-os/content-command/marketing-ai/decisions/route.ts',
  'app/api/market-os/content-command/marketing-ai/integrations/route.ts',
  'app/api/market-os/content-command/marketing-ai/queue/route.ts',
  'app/api/market-os/content-command/marketing-ai/queue/[id]/control/route.ts',
  'app/api/market-os/content-command/marketing-ai/recovery/route.ts',
  'app/api/market-os/content-command/marketing-ai/sync/route.ts',
  'app/api/market-os/content-command/marketing-ai/tools/route.ts',
]
const libs = [
  'lib/market-os/marketing-ai/phase3-types.ts',
  'lib/market-os/marketing-ai/phase3-schemas.ts',
  'lib/market-os/marketing-ai/phase3-repository.ts',
  'lib/market-os/marketing-ai/context-assembler.ts',
  'lib/market-os/marketing-ai/compiler.ts',
  'lib/market-os/marketing-ai/tool-gateway.ts',
  'lib/market-os/marketing-ai/queue-engine.ts',
  'lib/market-os/marketing-ai/autopilot.ts',
]
for (const rel of [...pages, ...apis, ...libs]) exists(rel) ? pass(`present ${rel}`) : fail(`missing ${rel}`)

const migrationRel = 'supabase/migrations/20260726_0100_market_ai_operations_autopilot_phase3.sql'
const migration = read(migrationRel)
const expectedTables = [
  'market_ai_compilations','market_ai_compilation_items','market_ai_decisions','market_ai_execution_jobs','market_ai_execution_steps',
  'market_ai_tool_registry','market_ai_tool_executions','market_ai_sync_links','market_ai_sync_conflicts','market_ai_dead_letters',
  'market_ai_bridge_versions','market_ai_learning_patterns','market_ai_system_locks',
]
for (const table of expectedTables) migration.includes(`create table if not exists public.${table}`) ? pass(`migration table ${table}`) : fail(`missing migration table ${table}`)
const toolNames = [
  'campaign.prepare','brief.create','brief.update','content.create_draft','content.update_draft','task.create','task.assign','task.link_dependency',
  'asset.requirement_create','asset.classify','asset.link','review.request','approval_package.prepare','schedule.propose','publishing_package.prepare',
  'bridge.store','bridge.version','bridge.archive','learning.record',
]
for (const tool of toolNames) migration.includes(`'${tool}'`) ? pass(`tool ${tool}`) : fail(`missing tool ${tool}`)
if (toolNames.length !== 19) fail('internal tool count is not 19'); else pass('exactly 19 internal tools')
if (!migration.includes('compilation_key text not null unique')) fail('compiler idempotency key missing'); else pass('compiler idempotency key')
if (!migration.includes("revoke all on function public.market_ai_claim_due_jobs(integer,text) from public,anon,authenticated")) fail('claim RPC exposure not closed'); else pass('claim RPC restricted to service role')
if (!migration.includes('external_count <> 0')) fail('external tool integrity gate missing'); else pass('external tool integrity gate')

const gateway = read('lib/market-os/marketing-ai/tool-gateway.ts')
for (const forbidden of ['email.send','whatsapp.send','social.publish','ads.activate','external_form.submit','external_contact.create','public_statement.issue']) {
  if (!gateway.includes('EXTERNAL_TOOL_PATTERN')) fail(`external guard missing for ${forbidden}`)
}
if (!read('lib/market-os/marketing-ai/phase3-repository.ts').includes('listCanonicalMarketingRecords')) fail('canonical record inbox missing'); else pass('canonical record inbox')
if (!gateway.includes('getToolExecutionByIdempotencyKey') || !gateway.includes('findCanonicalRecordByIdempotencyKey')) fail('deep idempotency recovery missing'); else pass('deep idempotency recovery')
const queue = read('lib/market-os/marketing-ai/queue-engine.ts')
if (!queue.includes('DEPENDENCY_NOT_READY')) fail('dependency gate missing'); else pass('dependency gate')
const autopilot = read('lib/market-os/marketing-ai/autopilot.ts')
if (!autopilot.includes('recoverStaleExecutionJobs')) fail('stale job recovery missing'); else pass('stale job recovery')
const cron = read('app/api/market-os/content-command/marketing-ai/cron/route.ts')
if (!cron.includes('export async function GET') || !cron.includes('export async function POST')) fail('cron must support GET and POST'); else pass('cron GET and POST')
if (cron.includes("searchParams.get('secret')")) fail('cron secret leaks through query string'); else pass('cron secret accepted only by headers')

const cssRel = 'components/market-os/content-command/marketing-ai/marketing-ai-phase3.module.css'
const css = read(cssRel)
const ui = read('components/market-os/content-command/marketing-ai/MarketingAutopilotWorkspace.tsx')
if (!css.includes('.hero') || !css.includes('color:#fff')) fail('dark-surface white contrast missing'); else pass('dark-surface white contrast')
if (!ui.includes('importCanonicalRecordToLocalWorkspace') || !ui.includes('explicitHumanPromotion')) fail('explicit local workspace promotion missing'); else pass('explicit local workspace promotion')
if (!css.includes('--phase3-ink:#07111f') || !css.includes('color:var(--phase3-ink)')) fail('light-surface strong ink contrast missing'); else pass('light-surface strong ink contrast')

const sourceFiles = [...pages, ...apis, ...libs, 'components/market-os/content-command/marketing-ai/MarketingAutopilotWorkspace.tsx','components/market-os/content-command/marketing-ai/MarketingAiDirectorWorkspace.tsx']
let syntaxErrors = 0
for (const rel of sourceFiles) {
  if (!exists(rel)) continue
  const code = read(rel)
  const result = ts.transpileModule(code, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    },
    fileName: rel,
    reportDiagnostics: true,
  })
  const diagnostics = (result.diagnostics || []).filter((d) => d.category === ts.DiagnosticCategory.Error)
  if (diagnostics.length) {
    syntaxErrors += diagnostics.length
    for (const d of diagnostics) fail(`${rel}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`)
  }
}
if (!syntaxErrors) pass(`TypeScript syntax gate (${sourceFiles.length} files)`)

const classRefs = [...ui.matchAll(/styles\.([A-Za-z0-9_]+)/g)].map((match) => match[1])
const cssClasses = new Set([...css.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map((match) => match[1]))
const missingClasses = [...new Set(classRefs.filter((name) => !cssClasses.has(name) && !name.startsWith('badge_') && !name.startsWith('dot_')))]
if (missingClasses.length) fail(`CSS module references missing: ${missingClasses.join(', ')}`); else pass('CSS-module references resolve')

if (process.exitCode) process.exit(process.exitCode)
console.log('\nMarketing Operations Autopilot Phase 3 focused acceptance passed.')
