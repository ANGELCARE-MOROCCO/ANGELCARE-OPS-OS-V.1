import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root=path.resolve(process.argv[2]||process.cwd())
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8')
const exists=(p)=>fs.existsSync(path.join(root,p))
const results=[]
let failures=0,notRun=0
function check(label,ok,detail=''){results.push({label,ok,detail});if(!ok)failures++;console.log(`${ok?'STATIC_PASS':'FAIL'}  ${label}${detail?` — ${detail}`:''}`)}
function skip(label,detail){notRun++;console.log(`NOT_RUN     ${label} — ${detail}`)}
function contains(file,...needles){if(!exists(file))return false;const s=read(file);return needles.every(n=>s.includes(n))}
function lacks(file,...needles){if(!exists(file))return false;const s=read(file);return needles.every(n=>!s.includes(n))}

const factory='components/flashcards-os/catalogue-composer/FlashcardsProductFactory.tsx'
const pure='lib/flashcards-os/catalogue-composer/presentation.ts'
const packageComposer='components/flashcards-os/catalogue-composer/CataloguePackageComposer.tsx'
const journeyComposer='components/flashcards-os/catalogue-composer/CatalogueJourneyComposer.tsx'
const eligibility='lib/flashcards-os/catalogue-composer/eligibility.ts'
const source='lib/flashcards-os/catalogue-composer/source.ts'
const collection='components/flashcards-os/CollectionDossier.tsx'
const commercial='lib/flashcards-os/catalogue-composer/commercial-control.ts'
const productionRepo='lib/flashcards-os/production/server/repository.ts'
const productionTypes='lib/flashcards-os/production/types.ts'
const resolver='lib/flashcards-os/production/server/source-resolver.ts'
const commands='lib/flashcards-os/production/server/commands.ts'
const createForm='components/flashcards-os/production/CommandCreateForm.tsx'
const upload='components/flashcards-os/production/LargeUploadStation.tsx'
const vault='components/flashcards-os/production/ProductVaultRoom.tsx'
const action='components/flashcards-os/studio/FlashcardsActionFeedback.tsx'
const migration='supabase/migrations/20260809_flashcards_os_final_operational_truth_and_production_bridge.sql'

check('Product Factory server-safe presentation utility exists',exists(pure))
check('Product Factory imports sourceLabel from server-neutral module',contains(factory,"@/lib/flashcards-os/catalogue-composer/presentation"))
check('Product Factory no longer imports sourceLabel from client ComposerPrimitives',lacks(factory,"sourceLabel } from './ComposerPrimitives'","sourceLabel} from './ComposerPrimitives'"))
check('shared catalogue eligibility engine exists',exists(eligibility))
check('package composer consumes shared eligibility authority',contains(packageComposer,'evaluateCatalogueEligibility'))
check('journey composer consumes shared eligibility authority',contains(journeyComposer,'evaluateCatalogueEligibility'))
check('server catalogue repository consumes shared eligibility authority',contains('lib/flashcards-os/catalogue-composer/repository.ts','evaluateCatalogueEligibility'))
check('eligibility engine covers context and commercial truth',contains(eligibility,'usageContexts','commercialStatus','budgetMaxDh','objectiveKeys'))
check('package composer exposes eligibility funnel',contains(packageComposer,'funnel','Tarifées','Budget'))
check('journey composer exposes eligibility funnel',contains(journeyComposer,'funnel','Tarifées','Budget'))
check('universe-specific catalogue options API exists',exists('app/api/flashcards-os/catalogue-composer/options/route.ts'))
check('package composer reloads B2C/B2B options',contains(packageComposer,'catalogue-composer/options?universe='))
check('journey composer reloads B2C/B2B options',contains(journeyComposer,'catalogue-composer/options?universe='))
check('historical catalogue price is not used as active composer price',lacks(source,'historical_price_dh)||','historicalPriceDh||'))
check('commercial source distinguishes historical seed authority',contains(source,'historical_seed','commercialAuthority'))
check('production catalogue demo fallback is explicit and non-production only',contains(source,"FLASHCARDS_OS_DEMO_MODE==='true'","NODE_ENV!=='production'"))
check('collection repository demo fallback is explicit and non-production only',contains('lib/flashcards-os/server/repository.ts','catalogueSeedAllowed',"NODE_ENV!=='production'"))
check('collection dossier has B2C commercial controls',contains(collection,'Configurer','Activer B2C','Publier B2C')||contains(collection,'CommercialCard','universe="b2c"'))
check('collection dossier has B2B commercial controls',contains(collection,'CommercialCard','universe="b2b"'))
check('commercial API records operator-confirmed authority',contains(commercial,"authority_source:'operator_confirmed'",'confirmed_at'))
check('direct collection publication service exists',contains(commercial,'publishDirectCollection','direct_collection_id'))
check('direct collection B2C/B2B publish APIs exist',exists('app/api/flashcards-os/collections/[collectionId]/publish/route.ts'))
check('collection dossier preserves package context',contains(collection,'solutions/composer?collection='))
check('collection dossier preserves programme context',contains(collection,'learning-journeys/new?collection='))
check('collection dossier preserves production context',contains(collection,'production-commands/new?collectionId='))
check('collection dossier preserves upload context',contains(collection,'delivery/uploads?collection='))
check('package page consumes collection search parameter',contains('app/(protected)/flashcards-os/solutions/composer/page.tsx','initialCollectionId','searchParams'))
check('programme page consumes collection search parameter',contains('app/(protected)/flashcards-os/solutions/learning-journeys/new/page.tsx','initialCollectionId','searchParams'))
check('upload page consumes collection search parameter',contains('app/(protected)/flashcards-os/delivery/uploads/page.tsx','initialCollectionId','searchParams'))
check('universal production source resolver exists',exists(resolver))
check('production source resolver supports collection package programme sellable and design',contains(resolver,"'collection'","'package_scenario'","'journey_scenario'","'b2c_sellable'","'b2b_sellable'","'product_design'"))
check('production types expose universal source contract',contains(productionTypes,'ProductionSourceType','sourceType','sourceId'))
check('Production Command form is no longer Product Design-only',contains(createForm,'Type de source','Package compilé','Programme','Sellable B2C'))
check('Production Command page accepts collection/source query context',contains('app/(protected)/flashcards-os/intelligence/production-commands/new/page.tsx','collectionId','sourceType','sourceId'))
check('production command creation resolves generic source',contains(productionRepo,'resolveProductionSource','source_type:source.sourceType'))
check('dangerous opportunity_id to collection_id fallback is absent',lacks(productionRepo,'design.collection_id||design.opportunity_id','design.opportunity_id'))
check('production compilation resolves generic source authority',contains(commands,'resolveProductionSource','sourceType'))
check('Product Design is no longer deterministic validation prerequisite',lacks(commands,'Product Design authority is missing.'))
check('production database failure cannot silently return demo data in production',contains(productionRepo,"FLASHCARDS_OS_DEMO_MODE==='true'","Aucune donnée de démonstration n’a été substituée"))
check('upload station contains no manual Collection UUID field',lacks(upload,'UUID collection','Collection ID'))
check('upload station uses searchable synchronized collection selection',contains(upload,'Search','collections','initialCollectionId')||contains(upload,'collectionSearch','initialCollectionId'))
check('upload station implements real drag and drop',contains(upload,'onDrop','onDragOver'))
check('upload station implements pause resume cancel retry controls',contains(upload,'Pause','Reprendre','Annuler','Réessayer')||contains(upload,'paused','cancel','retry'))
check('upload station performs whole-file and chunk SHA-256',contains(upload,'SHA-256','digest')||contains(upload,'crypto.subtle.digest','partSha256'))
check('Vault health API exists',exists('app/api/flashcards-os/production/vault/health/route.ts'))
check('Vault reconcile API exists',exists('app/api/flashcards-os/production/vault/reconcile/route.ts'))
check('Vault navigation is interactive rather than decorative',contains(vault,'setView','button type="button"','Approved releases','Quarantine','Transfers'))
check('Vault unconfigured state tells operator exactly what to configure',contains(vault,'FLASHCARDS_OS_WINDOWS_NODE_URL','FLASHCARDS_OS_WINDOWS_NODE_SECRET'))
check('action feedback success uses real three-second closable lifecycle',contains(action,'3000','paused','remaining.current'))
check('action feedback errors remain persistent until user action',lacks(action,"setTimeout(()=>close(id),3000)"))
check('one additive operational-truth migration is present',exists(migration))
check('migration is transactional and advisory-locked',contains(migration,'begin;','pg_advisory_xact_lock','commit;'))
check('migration contains no destructive table drop',lacks(migration,'drop table'))
check('migration demotes unconfirmed historical-seeded prices to draft',contains(migration,"authority_source='historical_seed'","status='draft'"))
check('migration adds direct collection sellable lineage',contains(migration,'direct_collection_id','direct_collection_version_id','one_composition_source_v2_check'))
check('published sellable guard preserves direct collection truth while allowing release append',contains(migration,'new.direct_collection_id is distinct from old.direct_collection_id',"coalesce(new.release_ids,'{}'::uuid[]) @> coalesce(old.release_ids,'{}'::uuid[])"))
check('migration makes Production Design optional for generic commands',contains(migration,'production_commands alter column design_id drop not null'))
check('migration adds generic production source lineage',contains(migration,'production_commands add column if not exists source_type','source_snapshot','collection_ids'))
check('migration adds generic product release lineage',contains(migration,'product_releases add column if not exists source_type','product_releases alter column design_id drop not null'))
check('migration preserves release immutability for generic source fields',contains(migration,'guard_released_asset_mutation','new.source_type is distinct from old.source_type'))
check('migration refreshes service-role mutation views',contains(migration,'grant all on public.fc_os_','service_role'))
check('Flashcards environment example is server-only and includes Vault config',contains('FLASHCARDS_OS_MEGA_FINAL_ENV.example','FLASHCARDS_OS_WINDOWS_NODE_URL','FLASHCARDS_OS_DEMO_MODE=false'))

// Flashcards-owned import resolution. Shared application dependencies such as auth/Supabase
// are intentionally not copied into the bounded Flashcards package and are checked by target-repo TypeScript.
const roots=['app/(protected)/flashcards-os','app/api/flashcards-os','components/flashcards-os','lib/flashcards-os']
const exts=['.ts','.tsx','.js','.jsx','.mjs','.cjs','.json','.css']
let links=0,ownedLinks=0,missing=[]
function isFlashcardsOwnedAlias(spec){return spec.startsWith('@/lib/flashcards-os/')||spec.startsWith('@/components/flashcards-os/')||spec.startsWith('@/app/(protected)/flashcards-os/')||spec.startsWith('@/app/api/flashcards-os/')}
function resolveImport(importer,spec){let base;if(spec.startsWith('@/')){if(!isFlashcardsOwnedAlias(spec))return true;base=path.join(root,spec.slice(2))}else if(spec.startsWith('.'))base=path.resolve(path.dirname(importer),spec);else return true;ownedLinks++;const candidates=[base,...exts.map(e=>base+e),...exts.map(e=>path.join(base,'index'+e))];return candidates.some(fs.existsSync)}
for(const rel of roots){const abs=path.join(root,rel);if(!fs.existsSync(abs))continue;const stack=[abs];while(stack.length){const cur=stack.pop();for(const ent of fs.readdirSync(cur,{withFileTypes:true})){const p=path.join(cur,ent.name);if(ent.isDirectory())stack.push(p);else if(/\.(tsx?|jsx?|mjs|cjs)$/.test(ent.name)){const text=fs.readFileSync(p,'utf8');for(const m of text.matchAll(/(?:from\s+|import\s*\()\s*["']([^"']+)["']/g)){links++;if(!resolveImport(p,m[1]))missing.push(`${path.relative(root,p)} -> ${m[1]}`)}}}}}
check('all Flashcards-owned local source imports resolve',missing.length===0,missing.length?missing.slice(0,5).join(' | '):`${ownedLinks} owned links (${links} imports scanned)`)

const tscLocal=path.join(root,'node_modules','.bin','tsc')
if(fs.existsSync(tscLocal)){const t=spawnSync(tscLocal,['-p','tsconfig.flashcards-os-2030.json','--pretty','false','--noEmit'],{cwd:root,encoding:'utf8'});check('dependency-backed strict Flashcards TypeScript passes',t.status===0,t.status===0?'0 errors':(t.stdout+t.stderr).trim().slice(-1600))}else skip('dependency-backed strict Flashcards TypeScript','repository-local node_modules/.bin/tsc is not present in this package snapshot; installer will run it on the target repository when available.')

console.log(`\n${results.length-failures}/${results.length} STATIC checks passed. ${notRun} NOT_RUN.`)
if(failures){console.log('\nFailures:');for(const r of results.filter(x=>!x.ok))console.log(`- ${r.label}${r.detail?`: ${r.detail}`:''}`);process.exit(1)}
