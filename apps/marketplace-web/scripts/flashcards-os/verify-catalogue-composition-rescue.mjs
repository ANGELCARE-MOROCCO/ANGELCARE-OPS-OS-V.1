import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const root=process.cwd()
const read=(relative)=>fs.readFileSync(path.join(root,relative),'utf8')
const exists=(relative)=>fs.existsSync(path.join(root,relative))
let passed=0;const failures=[]
function check(label,condition,detail=''){if(condition){passed++;console.log(`PASS  ${label}${detail?` — ${detail}`:''}`)}else{failures.push(label);console.log(`FAIL  ${label}${detail?` — ${detail}`:''}`)}}
const source=read('lib/flashcards-os/catalogue-composer/source.ts')
const repo=read('lib/flashcards-os/catalogue-composer/repository.ts')
const adapter=read('lib/flashcards-os/catalogue-composer/adapter.ts')
const nav=read('lib/flashcards-os/navigation.ts')
const sql=read('supabase/migrations/20260802_flashcards_os_catalogue_composition_rescue.sql')
const factory=read('components/flashcards-os/catalogue-composer/FlashcardsProductFactory.tsx')
const packageUi=read('components/flashcards-os/catalogue-composer/CataloguePackageComposer.tsx')
const journeyUi=read('components/flashcards-os/catalogue-composer/CatalogueJourneyComposer.tsx')
const resultUi=read('components/flashcards-os/catalogue-composer/CatalogueResultsTheatre.tsx')

check('local categories are loaded as composition truth',source.includes("table(client, 'categories')"))
check('local collections are loaded as composition truth',source.includes("table(client, 'collections')"))
check('exact collection versions are loaded',source.includes("table(client, 'collection_versions')"))
check('collection prices come from local commercial register',source.includes("catalogue_collection_commercials"))
check('generation refuses a silent seed fallback',repo.includes("sourceMode!=='database'"))
check('Product Vault is not a composition prerequisite',!repo.includes('product_releases')&&!adapter.includes('product_releases'))
check('Tavily is absent from ordinary composition runtime',!repo.toLowerCase().includes('tavily')&&!adapter.toLowerCase().includes('tavily'))
check('OpenRouter uses the central free-only adapter',adapter.includes('openRouterFreeCompletion'))
check('package schema requires exact collection IDs',adapter.includes("required: ['name','positioning','customerPromise','targetCustomer','collectionIds'"))
check('journey activities require exact collection IDs',adapter.includes("'durationMinutes','collectionId','cardReference'"))
check('package proposal count is server bounded to ten',repo.includes('requestedProposalCount:clamp')&&adapter.includes('maxItems: 10'))
check('invented package collections are rejected',repo.includes("filter((id)=>allowed.has(id))"))
check('invented journey collections are rejected',repo.includes('invented or unselected collection'))
check('session minutes are reconciled exactly',repo.includes('activity duration')&&repo.includes('does not equal'))
check('package diversity rejects duplicate collection signatures',repo.includes('no fake diversity was accepted'))
check('prices are calculated deterministically from collection rows',repo.includes('function commercial(')&&repo.includes('item.priceDh*quantity'))
check('AI cannot author the authoritative price',adapter.includes('Do not calculate prices'))
check('packages can publish directly to governed B2C/B2B vitrines',repo.includes('publishCatalogueScenarios')&&repo.includes("'b2c_sellables'"))
check('learning programmes can publish into the same vitrines',repo.includes('journey_scenario_id')&&repo.includes('ready_learning_plans'))
check('multi-selection publication exists',resultUi.includes('scenarioIds:selected'))
check('two dominant factory actions exist',factory.includes('Composer un package vendable')&&factory.includes('Créer un programme'))
check('advanced controls are demoted rather than deleted',nav.includes('/flashcards-os/solutions/advanced')&&exists('app/(protected)/flashcards-os/solutions/advanced/page.tsx'))
check('package composer is catalogue-first',packageUi.includes('PACKAGE COMPOSER · LOCAL CATALOGUE')&&packageUi.includes('requiredCollectionIds'))
check('journey composer enforces five dimensions',journeyUi.includes('Les cinq dimensions obligatoires')&&journeyUi.includes('fiveComplete'))
check('result theatre shows exact collection versions',resultUi.includes('versionLabel'))
check('result theatre shows deterministic price breakdown',resultUi.includes('Détail tarifaire local'))
check('B2C and B2B vitrines now speak collection truth',read('components/flashcards-os/solutions/B2CVitrineCommand.tsx').includes('Collections')&&read('components/flashcards-os/solutions/B2BSolutionPortfolio.tsx').includes('collection versions'))
check('sellable mapper preserves collection lineage separately from release lineage',read('lib/flashcards-os/solutions/server/repository.ts').includes('releaseIds:arr(s.releaseIds||row.release_ids)')&&read('lib/flashcards-os/solutions/server/repository.ts').includes('collectionIds:arr(s.collectionIds||row.collection_ids)'))
check('catalogue collections never masquerade as production releases',repo.includes('releaseIds:[]')&&!repo.includes('releaseIds:scenario.collectionIds'))
check('human package and journey selections are formally recorded',repo.includes('solution_scenario_decisions')&&repo.includes('journey_approvals'))
check('published collection quantities preserve deterministic price-line quantities',repo.includes('priceLine?.quantity||1'))
check('SQL creates local collection commercial truth',sql.includes('create table if not exists flashcards_os.catalogue_collection_commercials'))
check('SQL preserves text collection IDs',sql.includes('collection_id text not null references flashcards_os.collections(id)'))
check('SQL adds exact collection lineage to scenarios and sellables',sql.includes('collection_version_ids uuid[]')&&sql.includes('catalogue_sellable_items'))
check('SQL makes journey publication additive',sql.includes('journey_scenario_id uuid null references flashcards_os.journey_scenarios'))
check('SQL protects published catalogue lineage',sql.includes('new.collection_ids is distinct from old.collection_ids'))
check('SQL preserves ready-plan catalogue snapshots',sql.includes('catalogue_snapshot jsonb')&&sql.includes('new.catalogue_snapshot is distinct from old.catalogue_snapshot'))
check('SQL applies tenant RLS to every new table',sql.includes("'catalogue_collection_commercials','catalogue_solution_items','catalogue_journey_items','catalogue_journey_activity_links','catalogue_sellable_items'"))
check('catalogue mutation views remain server-only',sql.includes('revoke all on public.fc_os_catalogue_collection_commercials')&&sql.includes('from authenticated, anon')&&sql.includes('to service_role'))
check('SQL refreshes established views after additive columns',sql.includes('create or replace view public.fc_os_solution_requests')&&sql.includes('create or replace view public.fc_os_ready_learning_plans')&&sql.includes('create or replace view public.fc_os_b2c_sellables'))
check('SQL contains no destructive table drop',!/drop\s+table/i.test(sql))
check('SQL remains transactional and advisory-locked',sql.trimStart().startsWith('-- ANGELCARE')&&sql.includes('begin;')&&sql.includes('pg_advisory_xact_lock(84747001)')&&sql.trimEnd().endsWith('commit;'))

const syntax=spawnSync(process.execPath,['scripts/flashcards-os/typescript-syntax-gate.mjs'],{cwd:root,encoding:'utf8'})
check('TypeScript syntax and local imports pass',syntax.status===0,syntax.status===0?'passed':(syntax.stdout+syntax.stderr).trim().slice(-500))
const nodeRequire=createRequire(import.meta.url)
const outputText=(value)=>typeof value==='string'?value:Buffer.isBuffer(value)?value.toString('utf8'):''
const resultOutput=(result)=>[
  outputText(result.stdout),
  outputText(result.stderr),
  result.error?`TypeScript runner error: ${result.error.message}`:''
].filter(Boolean).join('\n')

let tscEntry=''
try {
  tscEntry=nodeRequire.resolve('typescript/bin/tsc',{paths:[root]})
} catch {
  // Fall back to npx --no-install. This never downloads TypeScript implicitly.
}

const tscArgs=['-p','tsconfig.flashcards-os-umz6.static.json','--pretty','false']
const tsc=tscEntry
  ? spawnSync(process.execPath,[tscEntry,...tscArgs],{cwd:root,encoding:'utf8'})
  : spawnSync(process.platform==='win32'?'npx.cmd':'npx',['--no-install','tsc',...tscArgs],{cwd:root,encoding:'utf8'})
const tscOutput=resultOutput(tsc)
if(tscOutput) process.stdout.write(`${tscOutput}\n`)
check(
  'strict isolated static TypeScript passes',
  tsc.status===0,
  tsc.status===0?'0 errors':(tscOutput.trim().slice(-900)||`TypeScript exited with status ${String(tsc.status)}`)
)

console.log(`\n${passed}/${passed+failures.length} Catalogue Composition Rescue checks passed.`)
if(failures.length){console.error('\nFailures:\n- '+failures.join('\n- '));process.exit(1)}
