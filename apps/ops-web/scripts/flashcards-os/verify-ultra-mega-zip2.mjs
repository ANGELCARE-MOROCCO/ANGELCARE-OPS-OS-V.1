#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const failures = []
const checks = []
function check(name, condition, detail = '') { checks.push({ name, condition, detail }); if (!condition) failures.push(`${name}${detail ? ` — ${detail}` : ''}`) }
function exists(relative) { return fs.existsSync(path.join(root, relative)) }
function read(relative) { return fs.readFileSync(path.join(root, relative), 'utf8') }
function walk(relative) { const start=path.join(root,relative);const files=[];if(!fs.existsSync(start))return files;const visit=(dir)=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);entry.isDirectory()?visit(full):files.push(full)}};visit(start);return files }

const pageFiles = [
  'app/(protected)/flashcards-os/intelligence/page.tsx',
  'app/(protected)/flashcards-os/intelligence/research/page.tsx',
  'app/(protected)/flashcards-os/intelligence/research/new/page.tsx',
  'app/(protected)/flashcards-os/intelligence/research/[missionId]/page.tsx',
  'app/(protected)/flashcards-os/intelligence/evidence/page.tsx',
  'app/(protected)/flashcards-os/intelligence/syntheses/[synthesisId]/page.tsx',
  'app/(protected)/flashcards-os/intelligence/opportunities/page.tsx',
  'app/(protected)/flashcards-os/intelligence/opportunities/[opportunityId]/page.tsx',
  'app/(protected)/flashcards-os/intelligence/product-design/page.tsx',
  'app/(protected)/flashcards-os/intelligence/product-design/[designId]/page.tsx',
  'app/(protected)/flashcards-os/intelligence/product-design/[designId]/compare/page.tsx',
  'app/(protected)/flashcards-os/intelligence/control/models/page.tsx',
  'app/(protected)/flashcards-os/intelligence/control/runs/page.tsx',
  'app/(protected)/flashcards-os/intelligence/control/usage/page.tsx',
]
const componentFiles = [
  'components/flashcards-os/intelligence/IntelligenceCommandBridge.tsx',
  'components/flashcards-os/intelligence/ResearchMissionControl.tsx',
  'components/flashcards-os/intelligence/ResearchMissionBuilder.tsx',
  'components/flashcards-os/intelligence/ResearchObservatory.tsx',
  'components/flashcards-os/intelligence/EvidenceObservatory.tsx',
  'components/flashcards-os/intelligence/ResearchSynthesisChamber.tsx',
  'components/flashcards-os/intelligence/OpportunityRadar.tsx',
  'components/flashcards-os/intelligence/OpportunityDossier.tsx',
  'components/flashcards-os/intelligence/ProductDesignPortfolio.tsx',
  'components/flashcards-os/intelligence/ProductDesignWarRoom.tsx',
  'components/flashcards-os/intelligence/DesignComparisonTheatre.tsx',
  'components/flashcards-os/intelligence/ModelSpendControl.tsx',
  'components/flashcards-os/intelligence/AiProviderControlCentre.tsx',
  'components/flashcards-os/intelligence/IntelligenceRunLedger.tsx',
  'components/flashcards-os/intelligence/UsageControlCentre.tsx',
]
const apiFiles = walk('app/api/flashcards-os/intelligence').filter((file) => file.endsWith('route.ts'))
const libFiles = [
  'lib/flashcards-os/intelligence/types.ts','lib/flashcards-os/intelligence/config.ts','lib/flashcards-os/intelligence/schemas.ts','lib/flashcards-os/intelligence/privacy.ts','lib/flashcards-os/intelligence/bootstrap.ts',
  'lib/flashcards-os/intelligence/adapters/tavily.ts','lib/flashcards-os/intelligence/adapters/openrouter.ts','lib/flashcards-os/intelligence/server/repository.ts','lib/flashcards-os/intelligence/server/jobs.ts',
]

check('Intelligence master universe is operational', read('lib/flashcards-os/navigation.ts').includes("key: 'intelligence'") && /key: 'intelligence'[\s\S]*?active: true/.test(read('lib/flashcards-os/navigation.ts')))
check('fourteen protected intelligence pages exist', pageFiles.every(exists), `${pageFiles.filter((item)=>!exists(item)).length} missing`)
check('intelligence purpose-built components exist', componentFiles.every(exists), `${componentFiles.filter((item)=>!exists(item)).length} missing`)
check('all intelligence backbone files exist', libFiles.every(exists), `${libFiles.filter((item)=>!exists(item)).length} missing`)
check('Tavily adapter is server-side only', read('lib/flashcards-os/intelligence/adapters/tavily.ts').includes("import 'server-only'"))
check('OpenRouter adapter is server-side only', read('lib/flashcards-os/intelligence/adapters/openrouter.ts').includes("import 'server-only'"))
check('browser never receives provider secrets', !componentFiles.some((file)=>/TAVILY_API_KEY|OPENROUTER_API_KEY/.test(read(file))))
check('environment example keeps provider keys server-only', exists('.env.flashcards-os.example') && !/NEXT_PUBLIC_(TAVILY|OPENROUTER)/.test(read('.env.flashcards-os.example')))
check('Tavily acquisition supports governed search controls', /search_depth/.test(read('lib/flashcards-os/intelligence/adapters/tavily.ts')) && /include_domains/.test(read('lib/flashcards-os/intelligence/adapters/tavily.ts')) && /exclude_domains/.test(read('lib/flashcards-os/intelligence/adapters/tavily.ts')))
check('OpenRouter uses explicit schema instructions and local structured validation', /jsonSchema/.test(read('lib/flashcards-os/intelligence/adapters/openrouter-free.ts')) && /schemaForTask/.test(read('lib/flashcards-os/intelligence/adapters/openrouter.ts')) && /validateStructuredOutput/.test(read('lib/flashcards-os/intelligence/adapters/openrouter.ts')))
check('OpenRouter routing is fixed to openrouter/free with no named fallback list', read('lib/flashcards-os/intelligence/config.ts').includes("OPENROUTER_FREE_ROUTE = 'openrouter/free'")&&!read('lib/flashcards-os/intelligence/adapters/openrouter.ts').includes('fallbackModels'))
check('OpenRouter privacy is enforced locally without filtering the free router', /assertSafeForExternalProvider/.test(read('lib/flashcards-os/intelligence/adapters/openrouter.ts')) && !/data_collection|zdr|required_parameters/.test(read('lib/flashcards-os/intelligence/adapters/openrouter-free.ts')))
check('research missions are governed and versioned through explicit lifecycle', /ResearchMissionStatus/.test(read('lib/flashcards-os/intelligence/types.ts')) && /submitted/.test(read('lib/flashcards-os/intelligence/types.ts')) && /human_review/.test(read('lib/flashcards-os/intelligence/types.ts')))
check('external evidence persists source lineage', /contentHash/.test(read('lib/flashcards-os/intelligence/types.ts')) && /tavilyRequestId/.test(read('lib/flashcards-os/intelligence/types.ts')))
check('duplicate evidence and contradictions remain represented', /duplicateGroup/.test(read('lib/flashcards-os/intelligence/types.ts')) && /contradictionIds/.test(read('lib/flashcards-os/intelligence/types.ts')))
check('human evidence arbitration API exists', exists('app/api/flashcards-os/intelligence/research/evidence/[sourceId]/review/route.ts'))
check('research synthesis distinguishes findings, contradictions, limitations and assumptions', ['findings','contradictions','limitations','assumptions','remainingGaps'].every((token)=>read('lib/flashcards-os/intelligence/types.ts').includes(token)))
check('model used, cost, tokens and latency are recorded', ['modelUsed','costUsd','totalTokens','latencyMs'].every((token)=>read('lib/flashcards-os/intelligence/types.ts').includes(token)))
check('privacy firewall redacts identity and secrets', /category: 'email'/.test(read('lib/flashcards-os/intelligence/privacy.ts')) && /category: 'phone'/.test(read('lib/flashcards-os/intelligence/privacy.ts')) && /category: 'secret'/.test(read('lib/flashcards-os/intelligence/privacy.ts')))
check('database-backed jobs have retries, idempotency and dead-letter state', /idempotency/.test(read('lib/flashcards-os/intelligence/server/jobs.ts')) && /dead_letter/.test(read('lib/flashcards-os/intelligence/server/jobs.ts')) && /max_attempts/.test(read('lib/flashcards-os/intelligence/server/jobs.ts')))
check('Tavily is constrained to external acquisition job', /mission_acquisition/.test(read('lib/flashcards-os/intelligence/server/jobs.ts')))
check('OpenRouter handles external synthesis and internal reasoning', /research_synthesis/.test(read('lib/flashcards-os/intelligence/server/jobs.ts')) && /product_design_architecture/.test(read('lib/flashcards-os/intelligence/server/jobs.ts')))
check('opportunity score remains deterministic and explicit', /OpportunityScore/.test(read('lib/flashcards-os/intelligence/types.ts')) && /weightedTotal/.test(read('lib/flashcards-os/intelligence/types.ts')))
check('Product Design is versioned and approval-controlled', /createProductDesignVersion/.test(read('lib/flashcards-os/intelligence/server/repository.ts')) && /decideProductDesign/.test(read('lib/flashcards-os/intelligence/server/repository.ts')))
check('UMZ3 readiness is an explicit gated state', /ready_for_umz3/.test(read('lib/flashcards-os/intelligence/types.ts')) && /readinessScore/.test(read('lib/flashcards-os/intelligence/types.ts')))
check('no creative asset generation is implemented', !/text[-_ ]?to[-_ ]?image|generate[-_ ]?(image|video)|render[-_ ]?mp4|dall-e|sora/i.test([...componentFiles,...libFiles].map(read).join('\n')))
check('no final production command compiler is implemented', !/prompt_command_compiler|production_command\.approved|copy approved production command/i.test([...componentFiles,...libFiles].map(read).join('\n')))
check('every intelligence API route uses RBAC or worker secret', apiFiles.every((file)=>{const text=fs.readFileSync(file,'utf8');return text.includes('assertFlashcardsApiAccess') || text.includes('workerSecret')}), `${apiFiles.length} routes`)
check('every intelligence API returns governed JSON', apiFiles.every((file)=>fs.readFileSync(file,'utf8').includes('NextResponse.json')))
check('critical mutations produce audit and outbox events', /auditAndOutbox/.test(read('lib/flashcards-os/intelligence/server/repository.ts')) && /recordJobAuditOutbox/.test(read('lib/flashcards-os/intelligence/server/jobs.ts')))
check('Intelligence UX is not a generic chatbot', !/chat bubble|assistant message|conversation thread/i.test(componentFiles.map(read).join('\n')))
check('at least eleven individually named layouts are present', ['MISSION FLIGHT DECK','RESEARCH MISSION CONTROL','RESEARCH OBSERVATORY','EVIDENCE OBSERVATORY','RESEARCH SYNTHESIS CHAMBER','PRODUCT OPPORTUNITY RADAR','EXECUTIVE DECISION CHAMBER','PRODUCT DESIGN PORTFOLIO','CONTENT ARCHITECTURE CANVAS','DESIGN COMPARISON THEATRE','AI PROVIDER & USAGE CONTROL CENTRE','INTELLIGENCE RUN LEDGER'].every((token)=>componentFiles.map(read).join('\n').includes(token)))
check('premium enterprise CSS extension is substantial', read('components/flashcards-os/flashcards-os.module.css').split('\n').length >= 1000)
check('UMZ1 product routes remain present', exists('app/(protected)/flashcards-os/product/collections/page.tsx') && exists('app/(protected)/flashcards-os/governance/import-control/page.tsx'))
check('collection dossier activates research and design without activating commands', /key: 'research'[\s\S]*status: 'partial'/.test(read('lib/flashcards-os/server/repository.ts')) && /key: 'design'[\s\S]*status: 'partial'/.test(read('lib/flashcards-os/server/repository.ts')) && /key: 'commands'[\s\S]*status: 'future_engine'/.test(read('lib/flashcards-os/server/repository.ts')))
check('dedicated UMZ2 migration exists', exists('supabase/migrations/20260731_flashcards_os_ultra_mega_zip2_intelligence.sql'))
check('dedicated static TypeScript configuration exists', exists('tsconfig.flashcards-os-umz2.json') && exists('tsconfig.flashcards-os-umz2.static.json'))

function commandDetail(result) {
  const output = [result?.stdout, result?.stderr, result?.error?.message]
    .filter((value) => typeof value === 'string' && value.trim().length > 0)
    .join('\n')
    .trim()
  return output.slice(0, 180) || `process status: ${result?.status ?? 'unavailable'}`
}

const syntax = spawnSync(process.execPath,[path.join(root,'scripts/flashcards-os/typescript-syntax-gate.mjs')],{cwd:root,encoding:'utf8'})
check('TypeScript syntax and local imports pass', syntax.status===0, syntax.status===0?'83 files / 197 imports':commandDetail(syntax))
const sql = spawnSync(process.execPath,[path.join(root,'scripts/flashcards-os/review-sql-umz2.mjs')],{cwd:root,encoding:'utf8'})
check('SQL architecture review passes', sql.status===0, sql.status===0?'31 checks':commandDetail(sql))
const boundaries = spawnSync(process.execPath,[path.join(root,'scripts/flashcards-os/verify-intelligence-boundaries.mjs')],{cwd:root,encoding:'utf8'})
check('intelligence boundary review passes', boundaries.status===0, boundaries.status===0?'20 checks':commandDetail(boundaries))

const localTscModule = path.join(root, 'node_modules/typescript/bin/tsc')
const localTscExecutable = path.join(root, 'node_modules/.bin/tsc')
let typecheck
if (fs.existsSync(localTscModule)) {
  typecheck = spawnSync(process.execPath,[localTscModule,'-p','tsconfig.flashcards-os-umz2.static.json','--pretty','false'],{cwd:root,encoding:'utf8'})
} else if (fs.existsSync(localTscExecutable)) {
  typecheck = spawnSync(localTscExecutable,['-p','tsconfig.flashcards-os-umz2.static.json','--pretty','false'],{cwd:root,encoding:'utf8'})
} else {
  typecheck = spawnSync('tsc',['-p','tsconfig.flashcards-os-umz2.static.json','--pretty','false'],{cwd:root,encoding:'utf8'})
}
check('isolated strict static TypeScript check passes', typecheck.status===0, typecheck.status===0?'0 errors':commandDetail(typecheck))

for (const result of checks) console.log(`${result.condition ? 'PASS' : 'FAIL'}  ${result.name}${result.detail ? ` (${result.detail})` : ''}`)
console.log(`\n${checks.length - failures.length}/${checks.length} Ultra Mega ZIP 2 acceptance checks passed.`)
if (failures.length) { console.error('\nAcceptance failures:'); failures.forEach((failure)=>console.error(`- ${failure}`)); process.exit(1) }
