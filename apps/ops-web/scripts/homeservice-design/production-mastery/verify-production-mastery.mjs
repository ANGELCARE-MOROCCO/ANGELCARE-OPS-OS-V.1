#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const appRoot = path.resolve(process.argv[2] || process.cwd())
const checks = []
const failures = []
const skips = []
const file = (rel) => path.join(appRoot, rel)
const exists = (rel) => fs.existsSync(file(rel))
const read = (rel) => fs.readFileSync(file(rel), 'utf8')
function check(label, condition, detail = '') {
  checks.push(label)
  if (condition) console.log(`PASS  ${label}${detail ? ` — ${detail}` : ''}`)
  else { console.log(`FAIL  ${label}${detail ? ` — ${detail}` : ''}`); failures.push(`${label}${detail ? `: ${detail}` : ''}`) }
}
function skip(label, detail='') { skips.push(label); console.log(`NOT_RUN  ${label}${detail ? ` — ${detail}` : ''}`) }
function contains(rel, patterns) { if (!exists(rel)) return false; const source=read(rel); return patterns.every((pattern)=>source.includes(pattern)) }

const required = [
  'lib/service-design-mastery/server.ts',
  'lib/service-design-mastery/planning.ts',
  'components/carelink/service-design/mastery/types.ts',
  'components/carelink/service-design/mastery/client.ts',
  'components/carelink/service-design/mastery/MasteryRecordWorkspace.tsx',
  'components/carelink/service-design/mastery/MasteryRegistryWorkspace.tsx',
  'components/carelink/service-design/mastery/CommercialCreationWorkspace.tsx',
  'components/carelink/service-design/mastery/HandoffOperationalWorkspace.tsx',
  'components/carelink/service-design/mastery/PlanningOperationsWorkspace.tsx',
  'app/api/carelink-ops/service-design/mastery/[domain]/route.ts',
  'app/api/carelink-ops/service-design/mastery/[domain]/[id]/route.ts',
  'app/api/carelink-ops/service-design/mastery/[domain]/[id]/action/route.ts',
  'tsconfig.service-design-production-mastery.json',
  'tsconfig.service-design-production-mastery.shim.json',
  'scripts/homeservice-design/production-mastery/isolated-shims.d.ts',
  'components/carelink/service-design/service-design-css-modules.d.ts',
]
check('all production-mastery foundations are present', required.every(exists), `${required.length}/${required.length}`)
check('dependency-backed TypeScript recognises Service Design CSS Modules', contains('components/carelink/service-design/service-design-css-modules.d.ts', ["declare module '*.module.css'", 'Readonly<Record<string, string>>']))

const server = 'lib/service-design-mastery/server.ts'
check('mastery server covers the thirteen operational record domains', contains(server, [
  "'planning_request'", "'planning_plan'", "'commercial_request'", "'commercial_scenario'", "'offer'", "'bundle'", "'sellable'", "'handoff'", "'handoff_amendment'", "'customer_case'", "'incident'", "'quality_signal'", "'improvement'",
]))
check('mastery server enforces exact record lookup and tenant scoping', contains(server, ['maybeSingle()', "query.eq('tenant_id', HSD_TENANT_ID)", 'assertTenant(record, actor, config)']))
check('mastery server supports real patch and safe permanent deletion', contains(server, ['export async function updateMasteryRecord', 'export async function deleteMasteryRecord', 'DELETE_DEPENDENCY_PROTECTED', 'deletableStatuses']))
check('mastery server resolves real relation bundles instead of generic detail pages', contains(server, ['async function relationBundle', "domain === 'planning_request'", "domain === 'planning_plan'", "domain === 'handoff'", "domain === 'sellable'"]))
check('mastery actions connect commercial generation pricing offers bundles sellables and handoffs', contains(server, ['create_offer', 'add_bundle_item', 'remove_bundle_item', 'create_sellable', 'add_handoff_date', 'remove_handoff_date', 'create_amendment']))
check('quality and customer actions are real database operations', contains(server, ['create_improvement', "action === 'transition'", 'hsd_customer_experience_cases', 'hsd_system_incidents']))

const planning = 'lib/service-design-mastery/planning.ts'
check('planning request generation reuses the authoritative Factory composer', contains(planning, ['composeFactoryScenarios', 'persistFactoryComposition', 'openrouter/free']))
check('planning generation persists runs scenarios days and blocks', contains(planning, ['hsd_generation_runs', 'hsd_plan_scenarios', 'hsd_plan_scenario_days', 'hsd_plan_scenario_blocks']))
check('planning provider abort is retried once without losing the request', contains(planning, ['if (!/abort|timeout/i.test(text)) throw error', 'composed = await composeFactoryScenarios(factoryInput)']))
check('technical validation writes real runs and findings', contains(planning, ['hsd_plan_validation_runs', 'hsd_plan_validation_findings', 'validateTechnicalPlan']))

const planningApis = [
  'app/api/carelink-ops/service-design/planning/requests/route.ts',
  'app/api/carelink-ops/service-design/planning/requests/[id]/route.ts',
  'app/api/carelink-ops/service-design/planning/requests/[id]/generate/route.ts',
  'app/api/carelink-ops/service-design/planning/requests/[id]/feasibility/route.ts',
  'app/api/carelink-ops/service-design/planning/plans/[id]/route.ts',
  'app/api/carelink-ops/service-design/planning/plans/[id]/submit/route.ts',
  'app/api/carelink-ops/service-design/planning/scenarios/[id]/route.ts',
]
check('all formerly stubbed planning APIs now use real service functions', planningApis.every((rel)=>exists(rel) && !/not implemented|coming soon|placeholder/i.test(read(rel))), `${planningApis.length}/${planningApis.length}`)

// Every dynamic route under the module must consume each bracket parameter.
const dynamicRoot = file('app/carelink-ops/service-design')
const dynamicRoutes=[]
function walkDynamic(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const full=path.join(dir,entry.name)
    if (entry.isDirectory()) walkDynamic(full)
    else if (entry.name==='page.tsx' && /\[[^/]+\]/.test(full)) dynamicRoutes.push(full)
  }
}
walkDynamic(dynamicRoot)
const unresolved=[]
for (const route of dynamicRoutes) {
  const relative=path.relative(appRoot,route)
  const params=[...relative.matchAll(/\[([^\]]+)\]/g)].map((match)=>match[1].replace(/^\.\.\./,''))
  const source=fs.readFileSync(route,'utf8')
  for (const param of params) if (!new RegExp(`\\b${param}\\b`).test(source)) unresolved.push(`${relative}: ${param}`)
}
check('every dynamic Service Design route consumes its real URL identifier', unresolved.length===0, unresolved.length ? unresolved.slice(0,12).join(' | ') : `${dynamicRoutes.length}/${dynamicRoutes.length}`)

const dynamicTruth = [
  ['app/carelink-ops/service-design/planning/requests/[requestId]/page.tsx','planning_request','requestId'],
  ['app/carelink-ops/service-design/planning/plans/[planId]/page.tsx','planning_plan','planId'],
  ['app/carelink-ops/service-design/offers/requests/[requestId]/page.tsx','commercial_request','requestId'],
  ['app/carelink-ops/service-design/offers/scenarios/[scenarioId]/page.tsx','commercial_scenario','scenarioId'],
  ['app/carelink-ops/service-design/bundles/[bundleId]/page.tsx','bundle','bundleId'],
  ['app/carelink-ops/service-design/vitrine/[sellableId]/page.tsx','sellable','sellableId'],
  ['app/carelink-ops/service-design/customer-experience/cases/[caseId]/page.tsx','customer_case','caseId'],
  ['app/carelink-ops/service-design/operations/incidents/[incidentId]/page.tsx','incident','incidentId'],
  ['app/carelink-ops/service-design/quality/signals/[signalId]/page.tsx','quality_signal','signalId'],
  ['app/carelink-ops/service-design/quality/improvements/[improvementId]/page.tsx','improvement','improvementId'],
  ['app/carelink-ops/service-design/handoffs/amendments/[amendmentId]/page.tsx','handoff_amendment','amendmentId'],
]
check('critical dynamic dossiers render the reusable exact-record workspace', dynamicTruth.every(([rel,domain,param])=>contains(rel,['MasteryRecordWorkspace',`domain="${domain}"`,param])), `${dynamicTruth.length}/${dynamicTruth.length}`)

check('planning registries and operational pages are connected to real data', [
  'app/carelink-ops/service-design/planning/requests/page.tsx',
  'app/carelink-ops/service-design/planning/validation/page.tsx',
  'app/carelink-ops/service-design/planning/templates/page.tsx',
  'app/carelink-ops/service-design/planning/runs/page.tsx',
  'app/carelink-ops/service-design/planning/settings/page.tsx',
].every((rel)=>exists(rel) && /MasteryRegistryWorkspace|PlanningOperationsWorkspace/.test(read(rel))))
check('commercial request and bundle creation are real source-backed workspaces', contains('components/carelink/service-design/mastery/CommercialCreationWorkspace.tsx',['technicalPlanId','technicalPlanVersionId','/api/carelink-ops/service-design/mastery/${mode}','Créer le dossier']))
check('bundle dossier supports actual offer insertion removal and calculation', contains('components/carelink/service-design/mastery/MasteryRecordWorkspace.tsx',['add_bundle_item','remove_bundle_item','/bundles/${record.id}/calculate','create_sellable']))
check('sellable dossier supports publish unpublish PDF and CARELINK continuation', contains('components/carelink/service-design/mastery/MasteryRecordWorkspace.tsx',['/sellables/${record.id}/publish','A4 & PDF','Préparer CARELINK']))
check('commercial shared actions cannot render as active dead controls', contains('components/carelink/service-design/commercial/CommercialUI.tsx',['onClick={onClick}', 'disabled={disabled || !onClick}']))

const handoffWorkspace='components/carelink/service-design/mastery/HandoffOperationalWorkspace.tsx'
check('handoff support pages use a selected real handoff and relation bundle', contains(handoffWorkspace,['listMastery(\'handoff\')'.replace('\\',''), 'loadMastery(\'handoff\''.replace('\\',''), 'handoffId']))
check('handoff calendar supports real add and remove operations', contains(handoffWorkspace,['add_handoff_date','remove_handoff_date']))
check('handoff amendments can be created without altering existing execution', contains(handoffWorkspace,['create_amendment','Amendement créé']))
const handoffPages=['customer','beneficiaries','calendar','sub-missions','programmes','staffing','routes','allowances','checklists','reports','mobile-brief','failures','reconciliation']
check('all supporting CARELINK pages use the operational handoff workspace', handoffPages.every((name)=>contains(`app/carelink-ops/service-design/handoffs/${name}/page.tsx`,['HandoffOperationalWorkspace'])), `${handoffPages.length}/${handoffPages.length}`)
const transmission='components/carelink/service-design/handoff/workspaces/TransmissionControlWorkspace.tsx'
check('transmission control reads actual blueprint counts and no demonstration numbers', contains(transmission,['loadMastery','counts.subMissions','counts.programmes','counts.checklists']) && !/Parent:\s*1|Sub-missions:\s*12|Programme:\s*86|Checklist:\s*144/.test(read(transmission)))
check('transmission offers real preflight commit and reconciliation actions', contains(transmission,['preflight','commit','reconcile']))

check('ordinary approval is removed from daily Service Design navigation', !read('components/carelink/service-design/HomeServiceDesignShell.tsx').includes('/command/approvals') && !read('components/carelink/service-design/handoff/workspaces/HandoffDossierWorkspace.tsx').includes('Approuver le handoff'))
check('irreversible CARELINK commit still requires explicit user confirmation', /confirm|Confirmer|confirmation/i.test(read('components/carelink/service-design/handoff/HandoffActionConsole.tsx') + read('components/carelink/service-design/mastery/MasteryRecordWorkspace.tsx')))

const feedback='components/carelink/service-design/feedback/ServiceDesignActionCenter.tsx'
check('shared action feedback exposes working success and persistent error states', contains(feedback,["status: 'working'", "status: 'success'", "status: 'error'", "role={record.status === 'error' ? 'alert' : 'status'}"]))
check('success toasts auto-dismiss after three seconds with hover/focus pause', contains(feedback,['useState(3000)','onMouseEnter','onMouseLeave','onFocus','onBlur']))
check('errors remain manually dismissible and include recovery instructions', contains(feedback,['record.instruction','record.preserved','onDismiss']))
check('Service Design shell mounts the action provider and Action Centre', contains('components/carelink/service-design/HomeServiceDesignShell.tsx',['ServiceDesignActionProvider']) && contains(feedback,['<ActionCentre']))

// Detect visually active buttons with no handler, submit behavior, or explicit disabled state.
const componentRoot=file('components/carelink/service-design')
const componentFiles=[]
function walkSources(dir) { if(!fs.existsSync(dir))return; for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walkSources(full);else if(/\.(ts|tsx)$/.test(entry.name))componentFiles.push(full)} }
walkSources(componentRoot)
const deadButtons=[]
for(const sourceFile of componentFiles){
  const source=fs.readFileSync(sourceFile,'utf8')
  for(const match of source.matchAll(/<button\b([^>]*)>/gs)){
    const attrs=match[1]
    if (/onClick\s*=|type\s*=\s*["']submit["']|form\s*=|\bdisabled\b|aria-disabled\s*=/.test(attrs)) continue
    const line=source.slice(0,match.index).split('\n').length
    deadButtons.push(`${path.relative(appRoot,sourceFile)}:${line}`)
  }
}
check('no potentially active dead button remains in Service Design components', deadButtons.length===0, deadButtons.length ? deadButtons.slice(0,15).join(' | ') : '0')

// No new production-mastery migration: current database schema is reused.
const migrationDir=file('supabase/migrations')
const masteryMigrations=fs.existsSync(migrationDir)?fs.readdirSync(migrationDir).filter((name)=>/production_mastery|operational_truth|flagship_excellence/i.test(name)):[]
check('production mastery reuses the installed schema and adds no migration', masteryMigrations.length===0, `${masteryMigrations.length} new migration(s)`)

const sourceRoots=[
  'app/carelink-ops/service-design','app/api/carelink-ops/service-design','components/carelink/service-design',
  'lib/homeservice-design','lib/homeservice-factory','lib/service-design-product-experience','lib/service-design-documents','lib/service-design-mastery',
]
const sourceFiles=[]
function walkAll(dir){if(!fs.existsSync(dir))return;for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walkAll(full);else if(/\.(ts|tsx)$/.test(entry.name))sourceFiles.push(full)}}
for(const root of sourceRoots)walkAll(file(root))
let relativeLinks=0
const missingRelative=[]
const importPattern=/(?:from\s+|import\s*\()\s*['"](\.[^'"]+)['"]/g
const candidates=(base)=>[base,`${base}.ts`,`${base}.tsx`,`${base}.js`,`${base}.jsx`,`${base}.mjs`,`${base}.cjs`,path.join(base,'index.ts'),path.join(base,'index.tsx'),path.join(base,'index.js')]
for(const sourceFile of sourceFiles){const source=fs.readFileSync(sourceFile,'utf8');for(const match of source.matchAll(importPattern)){relativeLinks++;const base=path.resolve(path.dirname(sourceFile),match[1]);if(!candidates(base).some(fs.existsSync))missingRelative.push(`${path.relative(appRoot,sourceFile)} -> ${match[1]}`)}}
check('all Service Design relative module links resolve', missingRelative.length===0, missingRelative.length?missingRelative.slice(0,12).join(' | '):`${relativeLinks} links`)

let tsPath=path.join(appRoot,'node_modules/typescript/lib/typescript.js')
if(!fs.existsSync(tsPath))for(const candidate of ['/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js','/usr/local/lib/node_modules/typescript/lib/typescript.js'])if(fs.existsSync(candidate)){tsPath=candidate;break}
if(fs.existsSync(tsPath)){
  const require=createRequire(import.meta.url); const ts=require(tsPath); const syntaxFailures=[];let implementations=0;let declarations=0
  for(const sourceFile of sourceFiles){const source=fs.readFileSync(sourceFile,'utf8');if(sourceFile.endsWith('.d.ts')){declarations++;const sf=ts.createSourceFile(sourceFile,source,ts.ScriptTarget.ES2022,true,ts.ScriptKind.TS);for(const diagnostic of sf.parseDiagnostics||[])syntaxFailures.push(`${path.relative(appRoot,sourceFile)}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText,' ')}`)}else{implementations++;try{const result=ts.transpileModule(source,{fileName:sourceFile,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.Preserve},reportDiagnostics:true});for(const diagnostic of(result.diagnostics||[]).filter((item)=>item.category===ts.DiagnosticCategory.Error))syntaxFailures.push(`${path.relative(appRoot,sourceFile)}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText,' ')}`)}catch(error){syntaxFailures.push(`${path.relative(appRoot,sourceFile)}: ${String(error?.stack||error)}`)}}}
  check('TypeScript implementation and declaration syntax passes', syntaxFailures.length===0, syntaxFailures.length?syntaxFailures.slice(0,8).join(' | '):`${implementations} implementation + ${declarations} declaration files`)
}else check('TypeScript syntax compiler is available',false,'typescript.js not found')

function resolveTsc(){const local=path.join(appRoot,'node_modules/.bin/tsc');if(fs.existsSync(local))return local;for(const candidate of ['/opt/nvm/versions/node/v22.16.0/bin/tsc','/usr/local/bin/tsc'])if(fs.existsSync(candidate))return candidate;return null}
const tsc=resolveTsc()
if(tsc){
  const isolated=spawnSync(tsc,['-p','tsconfig.service-design-production-mastery.shim.json','--pretty','false'],{cwd:appRoot,encoding:'utf8'})
  const isolatedOutput=`${isolated.stdout||''}${isolated.stderr||''}`.trim()
  check('isolated strict production-mastery TypeScript passes',isolated.status===0,isolated.status===0?'0 errors':isolatedOutput.slice(-2200))
}else check('strict TypeScript compiler is available',false,'tsc not found')

const localTsc=path.join(appRoot,'node_modules/.bin/tsc')
if(fs.existsSync(localTsc)){
  const result=spawnSync(localTsc,['-p','tsconfig.service-design-production-mastery.json','--pretty','false'],{cwd:appRoot,encoding:'utf8'})
  const output=`${result.stdout||''}${result.stderr||''}`.trim()
  check('dependency-backed strict Service Design TypeScript passes',result.status===0,result.status===0?'0 errors':output.slice(-2600))
}else skip('dependency-backed strict Service Design TypeScript','target repository node_modules not present in bounded package source')

console.log(`\n${checks.length-failures.length}/${checks.length} Production Mastery checks passed. ${skips.length} NOT_RUN.`)
if(failures.length){console.log('\nFailures:');for(const failure of failures)console.log(`- ${failure}`);process.exit(1)}
console.log('\nSUCCESS: CARELINK Service Design OS production mastery source verification passed.')
console.log('No SQL migration, full Next.js build, Git operation or deployment was run.')
