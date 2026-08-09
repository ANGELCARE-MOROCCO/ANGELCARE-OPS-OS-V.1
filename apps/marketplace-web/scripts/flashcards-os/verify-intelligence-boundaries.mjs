#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const failures = []
const checks = []
function check(name, condition, detail = '') { checks.push({ name, condition, detail }); if (!condition) failures.push(`${name}${detail ? ` — ${detail}` : ''}`) }
function walk(relative) { const start = path.join(root, relative); const files=[]; if(!fs.existsSync(start))return files; const visit=(dir)=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);entry.isDirectory()?visit(full):files.push(full)}};visit(start);return files }
function read(relative) { return fs.readFileSync(path.join(root, relative), 'utf8') }
const files = [
  ...walk('app/(protected)/flashcards-os/intelligence'),
  ...walk('app/api/flashcards-os/intelligence'),
  ...walk('components/flashcards-os/intelligence'),
  ...walk('lib/flashcards-os/intelligence'),
].filter((file) => /\.(ts|tsx)$/.test(file))
const text = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n')
const tavily = read('lib/flashcards-os/intelligence/adapters/tavily.ts')
const openrouter = read('lib/flashcards-os/intelligence/adapters/openrouter.ts')
const jobs = read('lib/flashcards-os/intelligence/server/jobs.ts')
const privacy = read('lib/flashcards-os/intelligence/privacy.ts')

check('Tavily integration is server-only', tavily.includes("import 'server-only'") && !walk('components/flashcards-os').some((file) => fs.readFileSync(file,'utf8').includes('TAVILY_API_KEY')))
check('OpenRouter integration is server-only', openrouter.includes("import 'server-only'") && !walk('components/flashcards-os').some((file) => fs.readFileSync(file,'utf8').includes('OPENROUTER_API_KEY')))
check('Tavily is used only in mission acquisition', /mission_acquisition/.test(jobs) && !/adapters\/tavily/.test(read('lib/flashcards-os/intelligence/server/repository.ts')))
check('OpenRouter handles source extraction and synthesis', /evidence_claim_extraction/.test(jobs) && /research_synthesis/.test(jobs))
check('OpenRouter handles opportunity and design intelligence', /opportunity_architecture/.test(jobs) && /product_design_architecture/.test(jobs))
check('no creative image generation endpoint exists', !/generate[-_ ]?(image|illustration)|text[-_ ]?to[-_ ]?image|dall-e|stable diffusion/i.test(text))
check('no creative video rendering endpoint exists', !/generate[-_ ]?video|text[-_ ]?to[-_ ]?video|render[-_ ]?mp4|sora/i.test(text))
check('no final production command compiler exists in UMZ2', !/copy approved production command|prompt_command_compiler|production_command\.approved/i.test(text))
check('product design explicitly avoids asset generation', /no assets|never final creative assets|aucune création d.asset|not create final/i.test(text))
check('privacy redaction covers email and phone', /category: 'email'/.test(privacy) && /category: 'phone'/.test(privacy) && /EMAIL_REDACTED/.test(privacy) && /PHONE_REDACTED/.test(privacy))
check('privacy redaction covers secrets', /category: 'secret'/.test(privacy) && /SECRET_BLOCKED/.test(privacy))
check('sensitive learner data is blocked', /learner|guardian|child/i.test(privacy))
check('provider routing keeps local redaction and does not filter free-model availability', /assertSafeForExternalProvider/.test(openrouter) && !/data_collection|zdr|required_parameters/.test(read('lib/flashcards-os/intelligence/adapters/openrouter-free.ts')))
check('structured output uses schema instruction plus local validation', /jsonSchema/.test(read('lib/flashcards-os/intelligence/adapters/openrouter-free.ts')) && /schemaForTask/.test(openrouter) && /validateStructuredOutput/.test(openrouter))
check('OpenRouter stays on one free route and records the actual selected model', /OPENROUTER_FREE_ROUTE/.test(read('lib/flashcards-os/intelligence/adapters/openrouter-free.ts')) && /actualModel/.test(read('lib/flashcards-os/intelligence/adapters/openrouter-free.ts')) && !/models\s*:/.test(read('lib/flashcards-os/intelligence/adapters/openrouter-free.ts')))
check('provider usage and cost are recorded', /usage_ledger/.test(jobs) && /provider_calls/.test(jobs))
check('jobs are database-backed and bounded', /intelligence_jobs/.test(jobs) && /attempts/.test(jobs) && /dead_letter/.test(jobs))
check('Tavily and OpenRouter provider URLs are not exposed to client components', !walk('components/flashcards-os/intelligence').some((file) => /api\.tavily\.com|openrouter\.ai\/api/.test(fs.readFileSync(file,'utf8'))))
check('external provider keys never use NEXT_PUBLIC', !/NEXT_PUBLIC_(TAVILY|OPENROUTER)/.test(text + read('.env.flashcards-os.example')))
check('human authority language is present throughout UX', /Human authority|HUMAN ARBITRATION|AUTHORITY CHAMBER|EXECUTIVE DECISION/i.test(text))

for (const result of checks) console.log(`${result.condition ? 'PASS' : 'FAIL'}  ${result.name}${result.detail ? ` (${result.detail})` : ''}`)
console.log(`\n${checks.length - failures.length}/${checks.length} intelligence-boundary checks passed.`)
if (failures.length) { console.error('\nBoundary failures:'); failures.forEach((failure) => console.error(`- ${failure}`)); process.exit(1) }
