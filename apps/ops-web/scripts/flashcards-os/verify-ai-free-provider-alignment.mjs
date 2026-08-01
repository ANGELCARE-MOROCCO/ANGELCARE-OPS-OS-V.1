import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const root = process.cwd()
const failures = []
const read = (file) => fs.readFileSync(path.join(root,file),'utf8')
const exists = (file) => fs.existsSync(path.join(root,file))
const check = (label, condition, detail='') => {
  if (condition) console.log(`PASS  ${label}${detail?` — ${detail}`:''}`)
  else { console.log(`FAIL  ${label}${detail?` — ${detail}`:''}`); failures.push(label) }
}

const config = read('lib/flashcards-os/intelligence/config.ts')
const freeAdapter = read('lib/flashcards-os/intelligence/adapters/openrouter-free.ts')
const intelligence = read('lib/flashcards-os/intelligence/adapters/openrouter.ts')
const command = read('lib/flashcards-os/production/adapters/openrouter-command.ts')
const solutions = read('lib/flashcards-os/solutions/adapters/openrouter-solutions.ts')
const commercial = read('lib/flashcards-os/revenue/adapters/openrouter-commercial.ts')
const experience = read('lib/flashcards-os/experience/adapters/openrouter-experience.ts')
const ui = read('components/flashcards-os/intelligence/AiProviderControlCentre.tsx')
const env = read('.env.flashcards-os.example')
const sql = read('supabase/migrations/20260801_flashcards_os_ai_free_provider_alignment.sql')
const runtimeScope = [config,freeAdapter,intelligence,command,solutions,commercial,experience,ui,env].join('\n')
const namedProviderPattern = /(?:openai|google|anthropic)\/[a-z0-9._-]+|\bgemini\b|\bclaude\b|\bgpt-[a-z0-9._-]+/i

check('fixed OpenRouter free route is canonical',config.includes("OPENROUTER_FREE_ROUTE = 'openrouter/free'"))
const tavilyBlock=config.slice(config.indexOf('tavily: {'),config.indexOf('openrouter: {'))
check('Tavily configuration has no model field',!/(?:model|fallbackModels)/i.test(tavilyBlock))
check('runtime contains no named paid model identifiers',!namedProviderPattern.test(runtimeScope))
check('runtime contains no named fallback model list',!runtimeScope.includes('FLASHCARDS_OS_OPENROUTER_FALLBACK_MODELS')&&!runtimeScope.includes('FLASHCARDS_OS_COMMAND_COMPILER_MODEL')&&!runtimeScope.includes('FLASHCARDS_OS_COMMERCIAL_MODEL')&&!runtimeScope.includes('FLASHCARDS_OS_EXPERIENCE_MODEL'))
check('OpenRouter request sends one route rather than models array',freeAdapter.includes('model: OPENROUTER_FREE_ROUTE')&&!freeAdapter.includes('models:'))
check('free route does not apply restrictive provider filters',!freeAdapter.includes('data_collection')&&!freeAdapter.includes('zdr:')&&!freeAdapter.includes('require_parameters'))
check('actual OpenRouter selected model is returned visibly',freeAdapter.includes('actualModel: typeof payload.model')&&ui.includes('Last actual model'))
check('commercial intelligence has no synthetic fallback',!commercial.includes('controlled-fallback')&&!commercial.match(/function\s+fallback\s*\(/))
check('provider failure remains explicit',freeAdapter.includes('No synthetic or hidden fallback was produced')&&ui.includes('No synthetic fallback'))
check('all reasoning adapters use the central free-only adapter',[intelligence,command,solutions,commercial,experience].every((source)=>source.includes('openRouterFreeCompletion')))
check('canonical provider control page exists',exists('app/(protected)/flashcards-os/intelligence/control/providers/page.tsx'))
check('legacy model-control route redirects visibly',read('app/(protected)/flashcards-os/intelligence/control/models/page.tsx').includes('/control/providers'))
check('front end provides explicit Tavily and OpenRouter tests',ui.includes("testProvider('tavily')")&&ui.includes("testProvider('openrouter')")&&exists('app/api/flashcards-os/intelligence/control/providers/test/route.ts'))
check('browser never edits or reveals provider secrets',!ui.includes('TAVILY_API_KEY')&&!ui.includes('OPENROUTER_API_KEY')&&ui.includes('never displayed'))
check('SQL aligns every task profile to openrouter/free',sql.includes("primary_model='openrouter/free'")&&sql.includes("fallback_models='{}'")&&sql.includes('model_profiles_free_only_route_check'))
check('SQL seeds all UMZ2–UMZ6 reasoning profiles',['production_command_compiler','flashcards_solution_composer','flashcards_learning_journey_architect','commercial_intelligence','experience_advisory'].every((key)=>sql.includes(key)))
check('environment example is free-only',env.includes('Tavily Free')&&env.includes('OpenRouter Free')&&!namedProviderPattern.test(env))

const syntax = spawnSync(process.execPath,['scripts/flashcards-os/typescript-syntax-gate.mjs'],{cwd:root,encoding:'utf8'})
process.stdout.write(syntax.stdout||'')
process.stderr.write(syntax.stderr||'')
check('TypeScript syntax and local imports pass',syntax.status===0)

const nodeRequire = createRequire(import.meta.url)
let tscEntry = ''
try {
  tscEntry = nodeRequire.resolve('typescript/bin/tsc', { paths: [root] })
} catch {
  // Fall through to npx --no-install so no package is downloaded implicitly.
}

const tscArgs = ['-p','tsconfig.flashcards-os-umz6.static.json','--pretty','false']
const tsc = tscEntry
  ? spawnSync(process.execPath,[tscEntry,...tscArgs],{cwd:root,encoding:'utf8'})
  : spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx',['--no-install','tsc',...tscArgs],{cwd:root,encoding:'utf8'})

if (tsc.stdout) process.stdout.write(tsc.stdout)
if (tsc.stderr) process.stderr.write(tsc.stderr)
if (tsc.error) process.stderr.write(`TypeScript runner error: ${tsc.error.message}\n`)
check('strict isolated static TypeScript passes',tsc.status===0,tsc.status===0?'0 errors':`exit ${String(tsc.status)}`)

console.log(`\n${19-failures.length}/19 AI free-provider alignment checks passed.`)
if (failures.length) {
  console.error('\nFailures:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
