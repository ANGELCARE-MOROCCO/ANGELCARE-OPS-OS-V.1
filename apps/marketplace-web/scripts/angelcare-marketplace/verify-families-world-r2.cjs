/* Behavioral tests of application source; no database, network, SQL or build. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const root=process.cwd();
function load(relative,mocks={}){const file=path.join(root,relative),module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;vm.runInNewContext(code,{module,exports:module.exports,require:name=>{if(name in mocks)return mocks[name];throw new Error('Unexpected import: '+name)},console,URLSearchParams},{filename:file});return module.exports}
const checks=[];function check(name,run){run();checks.push(name);console.log('PASS '+name)}
const contract=load('angelcare-marketplace/families-storefront/contract.ts'),experience=load('angelcare-marketplace/families-storefront/experience.ts',{'./contract':contract});
const item=(id,key='home-childcare-one-time',extra={})=>({id,slug:id,name:id,kind:'service',short_description:'',price_amount:100,currency_label:'MAD',price_mode:'fixed',availability_status:'available',featured:false,metadata:{experience_schema_key:key},...extra});
check('SIXTEEN_ATOMIC_CATEGORIES_PRESERVED',()=>assert.equal(new Set(contract.FAMILY_ATOMIC_SCHEMA_KEYS).size,16));
check('ALL_SIXTEEN_HAVE_LOCALIZED_LABELS',()=>contract.FAMILY_ATOMIC_SCHEMA_KEYS.forEach(key=>['fr','en','ar'].forEach(locale=>assert.ok(experience.familyLabel(key,locale).length))));
check('FOUR_CHAPTERS_COVER_EACH_ATOM_ONCE',()=>assert.equal(experience.FAMILY_STORIES_BY_CHAPTER.flatMap(row=>row.stories).map(row=>row.schemaKey).sort().join(','),[...contract.FAMILY_ATOMIC_SCHEMA_KEYS].sort().join(',')));
check('ACADEMY_AND_B2B_EXCLUDED',()=>assert.equal(experience.selectFamilyItems([item('ok'),item('academy','academy-course'),item('b2b','school-managed-programme')],{},'fr').map(row=>row.id).join(','),'ok'));
check('PUBLISHED_UNAVAILABLE_OFFER_REMAINS',()=>assert.equal(experience.selectFamilyItems([item('off',undefined,{availability_status:'unavailable'})],{},'fr').length,1));
check('AVAILABLE_FILTER_REJECTS_UNKNOWN_AND_UNAVAILABLE',()=>assert.equal(experience.selectFamilyItems([item('on'),item('unknown',undefined,{availability_status:'mystery'}),item('off',undefined,{availability_status:'unavailable'})],{availableOnly:true},'fr').map(row=>row.id).join(','),'on'));
check('SEARCH_USES_ACTUAL_NAMES_AND_CATEGORY_LABELS',()=>assert.equal(experience.selectFamilyItems([item('cards','flashcards-learning-product'),item('care')],{query:'flashcards'},'fr')[0].id,'cards'));
check('PRICE_SORT_USES_CANONICAL_VALUES',()=>assert.equal(experience.selectFamilyItems([item('high',undefined,{price_amount:500}),item('low',undefined,{price_amount:10})],{sort:'price-low'},'fr')[0].id,'low'));
check('MISSING_PRICE_IS_NOT_A_FABRICATED_QUOTE',()=>assert.equal(experience.familyPrice(item('null',undefined,{price_amount:null}),'fr'),'Consulter les conditions'));
check('ZERO_PRICE_REMAINS_ZERO',()=>assert.match(experience.familyPrice(item('free',undefined,{price_amount:0}),'fr'),/^0 MAD$/));
check('UNKNOWN_NEED_REJECTED',()=>assert.equal(experience.familyRequestNeed('academy-course'),null));
check('CATEGORY_ASSISTANCE_PRESERVES_NEED',()=>assert.equal(experience.familyRequestHref('fr','school-pickup-care'),'/angelcare-marketplace/fr/family/request?need=school-pickup-care'));
check('ADMISSION_AND_SUBSCRIPTION_HAVE_DISTINCT_ACTION_LABELS',()=>{assert.match(experience.familyAction(item('p','preschool-admission'),'fr'),/admission/);assert.match(experience.familyAction(item('b','activity-subscription-box'),'fr'),/abonnement/);});
const media=load('angelcare-marketplace/families-storefront/media.ts');
check('SIXTEEN_DISTINCT_CATEGORY_PHOTOGRAPHS_EXIST',()=>{const assets=Object.values(media.FAMILY_EDITORIAL_MEDIA);assert.equal(new Set(assets).size,16);assets.forEach(asset=>assert.ok(fs.existsSync(path.join(root,'public',asset))));assert.ok(fs.existsSync(path.join(root,'public',media.FAMILY_HERO_MEDIA)))});
(async()=>{
let territoryFailure=false,catalogFailure=false;const traces=[];
const catalogue=Array.from({length:260},(_,index)=>({id:'ma-'+index,slug:'ma-'+index,name_fr:'Care '+index,kind:'service',price_mode:'fixed',price_amount:100+index,currency_label:'MAD',territory_id:index===0?null:'MA',status:'published',experience_schema_key:'home-childcare-one-time',availability_status:index===1?'unavailable':'available'}));
catalogue.push({...catalogue[1],id:'eu',territory_id:'EU'},{...catalogue[1],id:'draft',status:'draft'},{...catalogue[1],id:'academy',experience_schema_key:'academy-course'});
const db={from(table){const trace={table,filters:[],range:null};traces.push(trace);const q={};for(const method of ['select','eq','in','contains','is','or','order'])q[method]=(...args)=>{trace.filters.push([method,...args]);return q};q.range=(start,end)=>{trace.range=[start,end];return q};const result=()=>{
if(table==='angelcare_marketplace_territories'){const code=trace.filters.find(x=>x[0]==='eq'&&x[1]==='territory_code')?.[2];return {data:code==='MA-MASTER'?{id:'MA'}:null,error:territoryFailure?{code:'XX000'}:null}}
if(table==='angelcare_marketplace_catalog_discovery_v'){let data=catalogue.filter(row=>row.status==='published'&&contract.isFamilyAtomicSchemaKey(row.experience_schema_key));data=data.filter(row=>trace.filters.some(x=>x[0]==='is'&&x[1]==='territory_id')?row.territory_id===null:row.territory_id===null||row.territory_id==='MA');const count=data.length;data=data.slice(trace.range[0],trace.range[1]+1);return {data,count,error:catalogFailure?{code:'XX000'}:null}}
if(table==='angelcare_marketplace_catalog_collections_v')return{data:[{id:'collection',title:'Collection',items:[{id:'ma-0',price_amount:9999},{id:'eu'},{id:'draft'},{id:'academy'}]}],error:null};
if(table==='angelcare_marketplace_catalog_categories')return {data:null,error:null};
return {data:[],error:null}
};q.maybeSingle=async()=>result();q.then=(resolve,reject)=>Promise.resolve(result()).then(resolve,reject);return q;}};
const repo=load('angelcare-marketplace/catalog-discovery/repository.ts',{'@/lib/supabase/server':{createServiceClient:async()=>db},'../server/errors':{MarketplaceError:class extends Error{}},'./content':{storefrontHero:()=>({eyebrow:'',title:'',lead:'',visualTheme:'pink'})},'../total-commerce-control/repository':{expandDiscoveryQuery:async()=>({query:''}),listSearchRules:async()=>[]},'../families-storefront/contract':contract});
const actual=await repo.storefrontExperience({locale:'fr',key:'families'});
check('MORE_THAN_240_ITEMS_ARE_LOADED',()=>assert.equal(actual.items.length,260));
check('FAMILY_TERRITORY_EXCLUDES_FOREIGN_INVENTORY',()=>assert.ok(actual.items.every(row=>!row.territory_id||row.territory_id==='MA')));
check('COLLECTIONS_USE_CURRENT_ELIGIBLE_ITEM_PROJECTION',()=>{assert.equal(actual.collections[0].items.map(row=>row.id).join(','),'ma-0');assert.equal(actual.collections[0].items[0].price_amount,100)});
check('UNAVAILABLE_ITEM_SURVIVES_REPOSITORY',()=>assert.equal(actual.items.find(row=>row.id==='ma-1').availability_status,'unavailable'));
check('RESOLVED_TERRITORY_PROPAGATES_TO_STOREFRONT',()=>assert.equal(actual.territoryId,'MA'));
const unknown=await repo.storefrontExperience({locale:'fr',key:'families',territoryCode:'UNKNOWN'});
check('UNRESOLVED_TERRITORY_SHOWS_GLOBAL_ONLY',()=>assert.equal(unknown.items.map(row=>row.id).join(','),'ma-0'));
territoryFailure=true;let rejected=false;try{await repo.storefrontExperience({locale:'fr',key:'families'})}catch{rejected=true}
check('TERRITORY_LOOKUP_FAILURE_IS_NOT_EMPTY_SUCCESS',()=>assert.ok(rejected));territoryFailure=false;
catalogFailure=true;rejected=false;try{await repo.storefrontExperience({locale:'fr',key:'families'})}catch{rejected=true}
check('INVENTORY_FAILURE_IS_NOT_EMPTY_SUCCESS',()=>assert.ok(rejected));
const redirects=[],returnPaths=[];
const route=load('app/angelcare-marketplace/[locale]/family/request/page.tsx',{'next/navigation':{redirect:href=>{redirects.push(href)}},'@/angelcare-marketplace/families-storefront/experience':experience,'@/angelcare-marketplace/customer-commerce/customer-auth':{requireCustomerPageContext:async(locale,href)=>returnPaths.push(href)}});
await route.default({params:Promise.resolve({locale:'fr'}),searchParams:Promise.resolve({need:'school-pickup-care'})});
check('LOGIN_RETURN_AND_REDIRECT_KEEP_SELECTED_NEED',()=>{assert.equal(returnPaths[0],experience.familyRequestHref('fr','school-pickup-care'));assert.equal(redirects[0],'/angelcare-marketplace/family/request?need=school-pickup-care')});
const store=fs.readFileSync(path.join(root,'angelcare-marketplace/catalog-discovery/components/Storefront.tsx'),'utf8');
check('CUSTOM_STUDIO_WORLD_PRECEDENCE_PRESERVED',()=>assert.ok(store.indexOf("if(world.status==='READY'")<store.indexOf("if(experience.key==='families')")));
const component=fs.readFileSync(path.join(root,'angelcare-marketplace/families-storefront/components/FamiliesStorefrontProMax.tsx'),'utf8');
check('EMPTY_SHELVES_HAVE_EDITORIAL_JOURNEYS',()=>{assert.ok(component.includes('data-family-editorial'));assert.ok(!component.includes('ghostShelf'))});
check('CUSTOMER_COPY_DOES_NOT_EXPOSE_ENGINEERING_LABELS',()=>assert.ok(!/TRUTH FIREWALL|Données canoniques|16 atomes|zero Academy/.test(component)));
const form=fs.readFileSync(path.join(root,'angelcare-marketplace/family-experience/components/QuoteRequestForm.tsx'),'utf8');
check('REQUEST_CONTEXT_SUBMITTED_WITH_EXISTING_PAYLOAD',()=>{assert.ok(form.includes("name=\"priorities\" value={'Univers famille : '+need}"));assert.ok(form.includes("defaultValue={needLabel||''}"));assert.ok(form.includes('formElement.reset()'))});
console.log('FAMILIES_R2_RUNTIME_CHECKS='+checks.length);console.log('FAMILIES_R2_RUNTIME=PASS');
})().catch(error=>{console.error(error);process.exitCode=1});
