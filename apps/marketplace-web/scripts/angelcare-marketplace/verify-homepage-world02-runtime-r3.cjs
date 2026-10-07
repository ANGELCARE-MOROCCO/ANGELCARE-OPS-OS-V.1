/* Behavioural source-contract tests. No database connection or SQL execution. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const root=process.cwd(),worldPath=path.join(root,'angelcare-marketplace/homepage-living-marketplace/world.ts');
function load(file,mocks={}){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;vm.runInNewContext(code,{module,exports:module.exports,require:name=>{if(Object.prototype.hasOwnProperty.call(mocks,name))return mocks[name];throw new Error('Unexpected runtime import: '+name)},console},{filename:file});return module.exports;}
const world=load(worldPath),checks=[];const check=(name,run)=>{run();checks.push(name);console.log('PASS '+name)};
const source=world.buildLivingMarketplaceWorld02Data({root:{props:{title:'Homepage',locale:'fr',__homepageProMaxWorld:{worldId:'legacy'}}},content:[{type:'ac_home_pro_max_hero',props:{id:'old'}}]},'replace');
check('WORLD02_REPLACES_ONLY_DOCUMENT',()=>{assert.equal(source.content.length,1);assert.equal(source.content[0].type,world.LIVING_MARKETPLACE_COMPONENT_TYPE);assert.equal(source.root.props.title,'Homepage');assert.equal(source.root.props.__homepageProMaxWorld,undefined)});
check('ROOT_MARKER_ALONE_IS_NOT_ASSIGNMENT',()=>assert.equal(world.livingMarketplaceComponentInData({content:[],root:source.root}),null));
check('PERSISTED_CANONICAL_SELECTOR_RECOGNISED',()=>assert.equal(world.isLivingMarketplaceComponent({type:'homepage_world',props:{worldId:world.LIVING_MARKETPLACE_WORLD_ID}}),true));
check('UNKNOWN_WORLD_NOT_CLAIMED',()=>assert.equal(world.isLivingMarketplaceComponent({type:'homepage_world',props:{worldId:'unknown'}}),false));
check('HIDDEN_SELECTOR_NOT_RENDERED',()=>assert.equal(world.isLivingMarketplaceComponent({...source.content[0],props:{...source.content[0].props,hidden:true}}),false));
check('MIXED_DOCUMENT_RESOLVES_WORLD02',()=>assert.equal(world.livingMarketplaceComponentInData({content:[{type:'ac_home_pro_max_hero',props:{}},source.content[0]]}).type,world.LIVING_MARKETPLACE_COMPONENT_TYPE));
const recipeTypes=load(path.join(root,'angelcare-marketplace/studio-homepage-pro-max/types.ts'));
const recipe=load(path.join(root,'angelcare-marketplace/studio-homepage-pro-max/recipe.ts'),{'./types':recipeTypes,'@/angelcare-marketplace/homepage-living-marketplace/world':world});
const bridge=load(path.join(root,'angelcare-marketplace/studio-universal/puck-bridge.ts'),{'./visual-catalogue':{canonicalStudioBlockType:x=>x,studioVisualExperience:()=>null,visualAliasFromMetadata:()=>null},'@/angelcare-marketplace/studio-homepage-pro-max/recipe':recipe});
const persisted=bridge.puckDataToCmsBlocks(source)[0];
check('SAVE_PERSISTS_HOMEPAGE_WORLD',()=>{assert.equal(persisted.blockType,'homepage_world');assert.equal(persisted.content.worldId,world.LIVING_MARKETPLACE_WORLD_ID)});
const block={id:'block',page_id:'p2',block_key:persisted.blockKey,block_type:persisted.blockType,sort_order:0,status:'active',content:persisted.content,settings:persisted.settings};
check('SAVE_RELOAD_ROUNDTRIP',()=>assert.equal(bridge.cmsBlocksToPuckData([block]).content[0].type,world.LIVING_MARKETPLACE_COMPONENT_TYPE));
check('HIDDEN_DB_ROW_CANNOT_BYPASS_VISIBILITY',()=>assert.equal(world.livingMarketplaceComponentInData(bridge.cmsBlocksToPuckData([{...block,status:'hidden'}])),null));
const queries=[];
const candidate={id:'p2',published_revision_id:'r2',published_locale:'fr',locale:'fr',published_slug:'same-slug',slug:'same-slug',route_key:'public.home',publication_state:'published'};
const db={from(table){const query={table,filters:[]};queries.push(query);const q={};for(const method of ['select','eq','in','or','like','order','limit'])q[method]=(...args)=>{query.filters.push([method,...args]);return q};const result=()=>({error:null,data:table==='angelcare_marketplace_territories'?{id:'territory'}:table==='angelcare_marketplace_cms_pages'?[candidate,{...candidate,id:'p1'}]:table==='angelcare_marketplace_cms_revisions'?{id:'r2',page_id:'p2',document:{blocks:[block]},page_snapshot:{title:'World 02',slug:'same-slug',locale:'fr',route_key:'public.home'}}:[]});q.maybeSingle=async()=>result();q.then=(resolve,reject)=>Promise.resolve(result()).then(resolve,reject);return q}};
const repo=load(path.join(root,'angelcare-marketplace/public-universe/repository.ts'),{'@/lib/supabase/server':{createServiceClient:async()=>db},'../server/errors':{MarketplaceError:class extends Error{}},'../studio-universal/database-error':{marketplaceDatabaseError:()=>new Error('Database error')},'../homepage-living-marketplace/world':world});
(async()=>{
 const result=await repo.getPublishedStudioHomepage({locale:'fr'});
 check('PUBLIC_LOADS_EXACT_CANDIDATE_REVISION',()=>{assert.equal(result.page.id,'p2');assert.equal(result.blocks[0].content.worldId,world.LIVING_MARKETPLACE_WORLD_ID);assert.ok(queries.some(q=>q.table==='angelcare_marketplace_cms_revisions'&&q.filters.some(f=>f[0]==='eq'&&f[1]==='page_id'&&f[2]==='p2')))});
 check('PUBLIC_DOES_NOT_RELOOKUP_BY_SLUG',()=>assert.ok(!queries.some(q=>q.table==='angelcare_marketplace_cms_pages'&&q.filters.some(f=>f[0]==='eq'&&/slug/.test(f[1])))));
 const renderer=fs.readFileSync(path.join(root,'angelcare-marketplace/studio-universal/StudioPublishedRenderer.tsx'),'utf8');
 check('WORLD02_RESOLVED_BEFORE_GENERIC_HYDRATION',()=>{const start=renderer.indexOf('export async function StudioPublishedDataRenderer');assert.ok(renderer.indexOf('livingMarketplaceComponentInData(sourceData)',start)<renderer.indexOf('await applyStudioDynamicSources(sourceData',start))});
 const preview=fs.readFileSync(path.join(root,'app/angelcare-marketplace/preview/[token]/page.tsx'),'utf8');
 check('HOMEPAGE_PREVIEW_USES_MARKETPLACE_SHELL',()=>assert.ok(preview.includes("variant={homepage ? 'marketplace' : 'standard'}")));
 const catalogRows=['global','MA','EU'].map((id,index)=>({id,territory_id:index?id:null,status:'published',kind:'product',name_fr:'TEST '+id,slug:id,price_amount:100,price_mode:'fixed',availability_status:'available'}));
 const fixtures={angelcare_marketplace_catalog_items:catalogRows,angelcare_marketplace_catalog_item_media:[{catalog_item_id:'MA',asset_url:'/cover.jpg'},{catalog_item_id:'MA',asset_url:'/other.jpg'}],angelcare_marketplace_trust_badge_issuances:[{object_id:'MA',badge_key:'expired',valid_until:'2000-01-01',public_claims:['Expired']},{object_id:'MA',badge_key:'current',valid_until:'2099-01-01',public_claims:['Current']}]};
 let catalogFailure=false,resolvedTerritory='MA';
 const catalogDb={from(table){const q={};for(const method of ['select','eq','in','is','or','lte','order','limit'])q[method]=()=>q;const result=()=>({data:fixtures[table]||[],error:catalogFailure&&table==='angelcare_marketplace_catalog_items'?{code:'XX000',message:'Test inventory failure'}:null});q.maybeSingle=async()=>({data:table==='angelcare_marketplace_territories'?{id:'MA',territory_code:'MA-MASTER'}:null,error:null});q.then=(resolve,reject)=>Promise.resolve(result()).then(resolve,reject);return q}};
 const catalog=load(path.join(root,'angelcare-marketplace/homepage-flagship/repository.ts'),{'next/headers':{cookies:async()=>({get:()=>null})},'@/lib/supabase/server':{createServiceClient:async()=>catalogDb},'../server/errors':{MarketplaceError:class extends Error{}},'../public-universe/repository':{resolveTerritoryId:async()=>resolvedTerritory},'../theme-studio/repository':{publishedThemeStudioState:async()=>({active:false})}});
 const ma=await catalog.getHomepageExperience({locale:'fr'});
 check('CATALOGUE_EXCLUDES_OTHER_TERRITORIES',()=>assert.equal(ma.catalogItems.map(i=>i.id).join(','),'global,MA'));
 check('FIRST_SORTED_MEDIA_IS_COVER',()=>assert.equal(ma.catalogItems.find(i=>i.id==='MA').media_url,'/cover.jpg'));
 check('EXPIRED_PROOFS_EXCLUDED',()=>{assert.equal(ma.trustSignals.length,1);assert.equal(ma.catalogItems.find(i=>i.id==='MA').trust_labels.join(','),'current')});
 const eu=await catalog.getHomepageExperience({locale:'fr',territoryId:'EU'});
 check('EXPLICIT_PUBLIC_TERRITORY_IS_USED',()=>assert.equal(eu.catalogItems.map(i=>i.id).join(','),'global,EU'));
 resolvedTerritory=null;const global=await catalog.getHomepageExperience({locale:'fr'});
 check('UNRESOLVED_TERRITORY_DOES_NOT_LEAK_INVENTORY',()=>assert.equal(global.catalogItems.map(i=>i.id).join(','),'global'));
 catalogFailure=true;let rejected=false;try{await catalog.getHomepageExperience({locale:'fr'})}catch{rejected=true}
 check('INVENTORY_READ_ERROR_IS_NOT_EMPTY_SUCCESS',()=>assert.ok(rejected));
 console.log('WORLD02_RUNTIME_R3_CHECKS='+checks.length);console.log('WORLD02_RUNTIME_R3=PASS');
})().catch(error=>{console.error(error);process.exitCode=1});
