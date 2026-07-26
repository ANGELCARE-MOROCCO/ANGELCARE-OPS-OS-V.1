import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const fail = (message) => { console.error(`FAIL  ${message}`); process.exitCode = 1 }
const pass = (message) => console.log(`PASS  ${message}`)
const required = (relative) => {
  const absolute = path.join(app, relative)
  if (!fs.existsSync(absolute)) fail(`missing ${relative}`)
  else pass(`present ${relative}`)
  return absolute
}

const catalogPath = required('lib/market-os/marketing-ai/catalog-data.json')
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'))
if (catalog.skills?.length === 60) pass('60 core skill sets')
else fail(`expected 60 skills, found ${catalog.skills?.length}`)
if (catalog.operations?.length === 50) pass('50 command archetypes')
else fail(`expected 50 operations, found ${catalog.operations?.length}`)
const skillCodes = new Set(catalog.skills.map((item) => item.code))
const operationCodes = new Set(catalog.operations.map((item) => item.code))
if (skillCodes.size === 60) pass('skill codes unique'); else fail('duplicate skill codes')
if (operationCodes.size === 50) pass('operation codes unique'); else fail('duplicate operation codes')
const commands = catalog.skills.flatMap((skill, skillIndex) => catalog.operations.map((operation, operationIndex) => ({
  code: `MKT-AI-${String(skillIndex * catalog.operations.length + operationIndex + 1).padStart(4, '0')}`,
  skill: skill.code,
  operation: operation.code,
})))
if (commands.length === 3000 && new Set(commands.map((item) => item.code)).size === 3000) pass('3000 unique brain commands')
else fail('3000-command catalog integrity')
const monthly = commands.find((item) => item.skill === 'LEARN-06' && item.operation === 'RESEARCH')
if (monthly?.code === 'MKT-AI-2952') pass('monthly Gemini resource command is MKT-AI-2952')
else fail(`monthly resource command mismatch: ${monthly?.code}`)

const pages = ['', 'commands', 'skills', 'schedules', 'missions', 'runs', 'learning', 'doctrine', 'settings']
for (const page of pages) required(`app/(protected)/market-os/content-command-center/ai-director/${page ? `${page}/` : ''}page.tsx`)

const apiRoutes = [
  'dashboard','health','skills','commands','commands/[code]','commands/import','commands/template','commands/export',
  'schedules','schedules/[id]','missions','missions/[id]/run','runs','actions','actions/[id]','learning','resources','doctrine','cron',
  'bridge/health','bridge/upload','bridge/objects',
]
for (const route of apiRoutes) required(`app/api/market-os/content-command/marketing-ai/${route}/route.ts`)

const migrationPath = required('supabase/migrations/20260725_2300_market_ai_director_phase2.sql')
const migration = fs.readFileSync(migrationPath, 'utf8')
const tables = [
  'market_ai_skills','market_ai_commands','market_ai_command_schedules','market_ai_mandates','market_ai_runs',
  'market_ai_action_queue','market_ai_bridge_objects','market_ai_learning_events','market_ai_resource_updates',
  'market_ai_guardrail_events','market_ai_csv_imports','market_ai_doctrine_entries',
]
for (const table of tables) migration.includes(`public.${table}`) ? pass(`migration owns ${table}`) : fail(`migration missing ${table}`)
const skillSeedCount = [...migration.matchAll(/^  \('[A-Z]+-[0-9]+',[0-9]+,/gm)].length
const operationSeedCount = [...migration.matchAll(/^  \([0-9]+,'[A-Z]+',/gm)].length
if (skillSeedCount === 60) pass('migration seeds 60 ordered skills'); else fail(`migration skill seed count ${skillSeedCount}`)
if (operationSeedCount === 50) pass('migration seeds 50 ordered operations'); else fail(`migration operation seed count ${operationSeedCount}`)
if (migration.includes("row_number() over(order by s.catalog_order, o.sort_order)")) pass('SQL command numbering matches catalog order')
else fail('SQL command ordering is not deterministic')
if (migration.includes('alter table public.market_ai_commands enable row level security')) pass('RLS enabled')
else fail('RLS not enabled')

const orchestrator = fs.readFileSync(required('lib/market-os/marketing-ai/orchestrator.ts'), 'utf8')
for (const forbidden of ['email\\.send','whatsapp\\.send','social\\.publish','ads\\.activate','public_statement']) {
  if (orchestrator.includes(forbidden)) pass(`external guardrail includes ${forbidden}`)
  else fail(`missing external guardrail ${forbidden}`)
}
const provider = fs.readFileSync(required('lib/market-os/marketing-ai/provider.ts'), 'utf8')
if (provider.includes("tools: groundingRequested") && provider.includes('responseJsonSchema')) pass('Gemini grounding and structured output configured')
else fail('Gemini provider is incomplete')
if (provider.includes('config.fallbackModel')) pass('Gemini fallback model configured')
else fail('Gemini fallback model missing')

const ui = fs.readFileSync(required('components/market-os/content-command/marketing-ai/MarketingAiDirectorWorkspace.tsx'), 'utf8')
for (const text of ['3 000 commandes', '60 compétences', 'Importer CSV', 'Fréquences', 'Missions', 'Apprentissage', 'Bridge Windows']) {
  ui.includes(text) ? pass(`UI includes ${text}`) : fail(`UI missing ${text}`)
}
const css = fs.readFileSync(required('components/market-os/content-command/marketing-ai/marketing-ai-director.module.css'), 'utf8')
if (/\.hero\{[^}]*color:#fff/.test(css) && /\.canvas\{[^}]*color:#0a1220/.test(css)) pass('contrast doctrine present')
else fail('contrast doctrine missing')

const navigation = fs.readFileSync(required('components/market-os/content-command/content-command-navigation.tsx'), 'utf8')
if (navigation.includes('/market-os/content-command-center/ai-director') && !navigation.includes('Phase 2 — à installer')) pass('AI Director navigation activated')
else fail('AI Director navigation not activated')

if (!process.exitCode) console.log('\nMarketing Director AI Phase 2 focused verification passed.')
