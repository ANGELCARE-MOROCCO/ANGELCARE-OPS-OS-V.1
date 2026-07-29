import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const exists = (rel) => fs.existsSync(path.join(root, rel))
const sha = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, rel))).digest('hex')
let passed = 0
const failures = []
function check(name, condition, detail = '') { if (condition) { passed += 1; console.log(`PASS  ${name}`) } else { failures.push(`${name}${detail ? ` — ${detail}` : ''}`); console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`) } }

const required = [
  'lib/market-os/ai-runtime/types.ts',
  'lib/market-os/ai-runtime/runtime-errors.ts',
  'lib/market-os/ai-runtime/provider-route.ts',
  'lib/market-os/ai-runtime/tavily.ts',
  'lib/market-os/ai-runtime/openrouter.ts',
  'lib/market-os/ai-runtime/gateway.ts',
  'lib/market-os/ai-runtime/control-service.ts',
  'lib/ai-provider-control/provider-runtime.ts',
  'app/api/market-os/content-command/ai-runtime/snapshot/route.ts',
  'app/api/market-os/content-command/ai-runtime/action/route.ts',
  'components/market-os/content-command/experience-bulk8/Bulk8AiExecutiveWorkspace.tsx',
  'docs/market-os/content-command-center/bulk10/ANGELCARE_CONTENT_COMMAND_CENTER_MEGA_ZIP_10_CONTRACT.md',
  'BULK10_VISUAL_VALIDATION_MANIFEST.md',
]
check('required-runtime-files', required.every(exists), required.filter((item) => !exists(item)).join(', '))

const gateway = read('lib/market-os/ai-runtime/gateway.ts')
const route = read('lib/market-os/ai-runtime/provider-route.ts')
const tavily = read('lib/market-os/ai-runtime/tavily.ts')
const openrouter = read('lib/market-os/ai-runtime/openrouter.ts')
const control = read('lib/market-os/ai-runtime/control-service.ts')
const provider = read('lib/market-os/marketing-ai/provider.ts')
const orchestrator = read('lib/market-os/marketing-ai/orchestrator.ts')
const supervision = read('lib/market-os/content-command-headquarters/ai-supervision.ts')
const ui = read('components/market-os/content-command/experience-bulk8/Bulk8AiExecutiveWorkspace.tsx')
const auth = read('lib/market-os/marketing-ai/auth.ts')
const providerRepo = read('lib/ai-provider-control/repository.ts')
const providerRuntime = read('lib/ai-provider-control/provider-runtime.ts')
const activeMarketFiles = [
  ...walk('lib/market-os').filter((item) => /\.(ts|tsx)$/.test(item)),
  ...walk('app/api/market-os').filter((item) => /\.(ts|tsx)$/.test(item)),
]
const activeMarketSource = activeMarketFiles.map(read).join('\n')

check('tavily-search-endpoint', tavily.includes('https://api.tavily.com${path}') && tavily.includes("requestTavily('/search'"))
check('tavily-extract-endpoint', tavily.includes('https://api.tavily.com${path}') && tavily.includes("requestTavily('/extract'"))
check('tavily-source-provenance', /observedAt|sourceType|freshness/.test(tavily))
check('openrouter-chat-endpoint', openrouter.includes('https://openrouter.ai/api/v1/chat/completions'))
check('openrouter-image-endpoint', openrouter.includes('https://openrouter.ai/api/v1/images'))
check('openrouter-image-model-discovery', gateway.includes('/api/v1/images/models'))
check('openrouter-json-schema', openrouter.includes("type: 'json_schema'") && openrouter.includes('strict: true'))
check('openrouter-provider-policy', openrouter.includes('allow_fallbacks') && openrouter.includes('require_parameters'))
check('capability-routing', route.includes("? 'tavily' : 'openrouter'"))
check('gemini-retired-by-route', route.includes("RETIRED_TYPES") && route.includes('PROVIDER_RETIRED:GEMINI'))
check('environment-bootstrap-fallback', route.includes('TAVILY_API_KEY') && route.includes('OPENROUTER_API_KEY'))
check('manual-continuity', gateway.includes("status: 'manual_required'") && provider.includes('manualContinuation'))
check('continue-without-research', gateway.includes("mode !== 'without_research'"))
check('provider-only-explicit-mode', gateway.includes("mode === 'provider_only'"))
check('real-internal-task-plan', provider.includes("type: 'create_task_plan'") && provider.includes("continuationMode: 'manual'"))
check('external-handoff-not-dead-end', provider.includes("externalExecutionMode: 'prepare_human_handoff'") && orchestrator.includes('prepare_publishing_package'))
check('full-content-command-role', provider.includes('complete internal content lifecycle') && provider.includes('strategy') && provider.includes('distribution packages'))
check('no-domain-drift', !/child|parent|enfant|parents/i.test(provider + supervision))
check('multimodal-openrouter', supervision.includes('executeMultimodalAnalysis') && !supervision.includes('new GoogleGenAI'))
check('image-openrouter', supervision.includes('executeImageGeneration') && !supervision.includes('GEMINI_API_KEY'))
check('manual-evidence-review', supervision.includes('human_decision_required') || supervision.includes('manual_required'))
check('image-credit-release', supervision.includes('market_content_release_generation_credit'))
check('active-market-no-gemini-sdk', !activeMarketSource.includes("from '@google/genai'") && !activeMarketSource.includes('new GoogleGenAI'))
check('active-market-no-gemini-key', !activeMarketSource.includes('GEMINI_API_KEY'))
check('provider-health-openrouter', providerRuntime.includes('OPENROUTER_HEALTH') && providerRuntime.includes('/chat/completions'))
check('provider-health-tavily', providerRuntime.includes('TAVILY_HEALTH') && providerRuntime.includes('api.tavily.com/search'))
check('legacy-gemini-contained', providerRuntime.includes('legacyCompatibility: true') && providerRepo.includes('invokeProviderHealth'))
check('runtime-snapshot-api', exists('app/api/market-os/content-command/ai-runtime/snapshot/route.ts'))
check('runtime-action-api', exists('app/api/market-os/content-command/ai-runtime/action/route.ts'))
check('assignment-edit-server-action', control.includes('updateRuntimeAssignment'))
check('assignment-override-server-action', control.includes('overrideRuntimeAssignment'))
check('assignment-disable-server-action', control.includes('disableRuntimeAssignment'))
check('assignment-permanent-delete', control.includes('permanentlyDeleteRuntimeAssignment'))
check('assignment-delete-typed-confirmation', control.includes('RUNTIME_DELETE_CONFIRMATION_REQUIRED') && control.includes('DELETE ${id.slice(0, 8).toUpperCase()}'))
check('assignment-delete-active-request-guard', control.includes('RUNTIME_ASSIGNMENT_HAS_ACTIVE_REQUESTS'))
check('provider-dossier-edit', control.includes('updateRuntimeDossier'))
check('provider-dossier-archive', control.includes('archiveRuntimeDossier'))
check('provider-dossier-permanent-delete', control.includes('permanentlyDeleteRuntimeDossier'))
check('provider-dossier-dependency-inspection', control.includes('RUNTIME_DOSSIER_HAS_DEPENDENCIES'))
check('gemini-assignment-retirement', control.includes('retireGeminiMarketAssignments'))
check('gemini-schedule-suspension', control.includes("status: 'suspended'"))
check('real-edit-button', ui.includes('Modifier') && ui.includes("open('edit'"))
check('real-override-button', ui.includes('Override') && ui.includes("open('override'"))
check('real-permanent-delete-button', ui.includes('Supprimer définitivement') && ui.includes("open('delete'"))
check('provider-dossier-delete-button', ui.includes("open('dossier-delete'"))
check('typed-confirmation-ui', ui.includes('Confirmation exacte') && ui.includes('RUNTIME'))
check('manual-continuity-ui', ui.includes('Mode manuel immédiat') && ui.includes('Continuer sans recherche') || ui.includes('Recherche sans génération'))
check('authority-permissions', auth.includes("'override'") && auth.includes("'purge'"))
check('purge-server-authority', read('app/api/market-os/content-command/ai-runtime/action/route.ts').includes("action.startsWith('delete_') ? 'purge'"))
check('premium-additive-css', read('components/market-os/content-command/experience-bulk8/bulk8-ai.module.css').includes('.runtimeAuthority') && read('components/market-os/content-command/experience-bulk8/bulk8-ai.module.css').includes('.runtimeCrown'))
check('no-sql-in-patch', !read('BULK10_PATCH_FILE_LIST.txt').split(/\r?\n/).some((item) => /\.sql$/i.test(item)))

if (exists('BULK10_PRESERVATION_BASELINE.json')) {
  const preservation = JSON.parse(read('BULK10_PRESERVATION_BASELINE.json'))
  const mismatches = Object.entries(preservation).filter(([rel, expected]) => !exists(rel) || sha(rel) !== expected).map(([rel]) => rel)
  check('bulk1-bulk9-preservation', mismatches.length === 0, mismatches.slice(0, 10).join(', '))
}
if (exists('BULK10_APPLIED_HASHES.json')) {
  const applied = JSON.parse(read('BULK10_APPLIED_HASHES.json'))
  const mismatches = Object.entries(applied).filter(([rel, expected]) => !exists(rel) || sha(rel) !== expected).map(([rel]) => rel)
  check('bulk10-applied-file-identity', mismatches.length === 0, mismatches.slice(0, 10).join(', '))
}

console.log(`\n${passed} checks passed.`)
if (failures.length) {
  console.error(`\n${failures.length} checks failed:`)
  failures.forEach((item) => console.error(`- ${item}`))
  process.exit(1)
}
console.log('PASS — Mega ZIP 10 provider-neutral continuity authority is statically accepted.')

function walk(rel) {
  const base = path.join(root, rel)
  if (!fs.existsSync(base)) return []
  const out = []
  for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
    const child = path.join(rel, entry.name)
    if (entry.isDirectory()) out.push(...walk(child))
    else out.push(child)
  }
  return out
}
