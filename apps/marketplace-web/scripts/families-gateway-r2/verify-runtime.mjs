import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import {createRequire} from 'node:module'
const root=path.resolve(process.argv[2]||'.'),require=createRequire(path.join(root,'package.json')),ts=require('typescript'),base='angelcare-marketplace/families-storefront/',results=[]
function load(relative){const file=path.resolve(root,relative),module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(key=>{if(!key.startsWith('.'))throw Error('Unexpected runtime dependency '+key);return load(path.relative(root,path.resolve(path.dirname(file),key+'.ts')))},module,module.exports);return module.exports}
const g=load(base+'gateway/contract.ts'),e=load(base+'experience.ts'),c=load(base+'contract.ts')
function test(name,fn){fn();results.push(name);console.log('PASS '+name)}
function item(id='one',overrides={}){return {id,public_reference:id,item_key:id,slug:id,kind:'service',name:'Offer '+id,short_description:null,description:null,currency_label:'Dh',price_mode:'fixed',price_amount:120,featured:false,availability_status:'available',territory_id:null,category_key:null,category_title:null,media_url:null,trust_labels:[],metadata:{experience_schema_key:'home-childcare-one-time',experience_configuration:{}},...overrides}}
const recurring=item('recurring',{metadata:{experience_schema_key:'home-childcare-recurring',experience_configuration:{}}}),one=item(),baby=item('baby',{metadata:{family_storefront_assignment:true,family_sellable_type:'one_time_service',family_service_capability:'home-care-postpartum'}}),kit=item('kit',{kind:'product',metadata:{experience_schema_key:'montessori-development-kit',experience_configuration:{age_min:3,age_max:6}}}),digital=item('digital',{kind:'product',metadata:{experience_schema_key:'digital-learning-resource',experience_configuration:{}}})
test('THREE_CANONICAL_STOREFRONT_ROUTES',()=>{for(const locale of ['fr','en','ar'])for(const world of g.GATEWAY_WORLDS)assert.equal(g.gatewayHref(locale,world),'/angelcare-marketplace/'+locale+'/'+world)})
test('SIXTEEN_UNIQUE_SECTIONS',()=>{assert.equal(g.GATEWAY_SECTIONS.length,16);assert.equal(new Set(g.GATEWAY_SECTIONS).size,16)})
test('EXPLICIT_RECURRING_MATCHES_RECURRING_ONLY',()=>{assert.equal(g.matchesRhythm(recurring,'recurring'),true);assert.equal(g.matchesRhythm(one,'recurring'),false)})
test('SUBSCRIPTION_PRICE_DOES_NOT_CREATE_RECURRING',()=>assert.equal(g.matchesRhythm(item('subscription',{price_mode:'subscription'}),'recurring'),false))
test('LEGACY_RECURRING_SELLABLE_TYPE_IS_RESPECTED',()=>assert.equal(g.matchesRhythm(item('legacy',{metadata:{family_storefront_assignment:true,family_sellable_type:'recurring_service',family_service_capability:'advanced-childcare'}}),'recurring'),true))
test('POSTPARTUM_IS_CAPABILITY_NOT_INVENTED_SCHEMA',()=>{assert.equal(g.matchesNeed(baby,'baby'),true);assert.equal(e.familyRequestHref('fr','postpartum'),'/angelcare-marketplace/fr/family/request')})
test('EXPLICIT_SCHEMA_OVERRIDES_LEGACY_CAPABILITY',()=>{const x=item('priority',{metadata:{experience_schema_key:'home-childcare-recurring',family_service_capability:'home-care-postpartum'}});assert.equal(g.matchesNeed(x,'baby'),false);assert.equal(g.matchesRhythm(x,'recurring'),true)})
test('NIGHT_AND_PICKUP_USE_OWN_CONTRACTS',()=>{for(const [rhythm,key]of [['night','overnight-extended-care'],['pickup','school-pickup-care']])assert.equal(g.matchesRhythm(item(key,{metadata:{experience_schema_key:key}}),rhythm),true)})
test('KIT_AND_DIGITAL_KEEP_CORRECT_DESTINATIONS',()=>{assert.equal(g.gatewayDestination(kit),'kits');assert.equal(g.gatewayDestination(digital),'development');assert.equal(g.gatewayDestination(one),'home-services')})
test('SUBSCRIPTION_BOX_KEEP_KITS_DESTINATION_WITHOUT_INFERRING_SERVICE_RECURRENCE',()=>{const box=item('box',{kind:'product',price_mode:'subscription',metadata:{experience_schema_key:'activity-subscription-box'}});assert.equal(g.gatewayDestination(box),'kits');assert.equal(g.matchesRhythm(box,'recurring'),false)})
test('NUMERIC_AGE_RANGE_USES_OVERLAP',()=>{assert.equal(g.matchesAge(kit,'3-5'),true);assert.equal(g.matchesAge(kit,'6-8'),true);assert.equal(g.matchesAge(kit,'0-2'),false);assert.equal(g.matchesAge(kit,'9-12'),false)})
test('UNKNOWN_AGE_NOT_INFERRED_FROM_NAME',()=>assert.equal(g.matchesAge(item('unknown',{name:'For ages 3-5'}),'3-5'),false))
test('INVALID_NUMERIC_AGE_RANGE_REJECTED',()=>assert.deepEqual(g.configuredAgeRanges(item('bad',{metadata:{experience_configuration:{age_min:6,age_max:3}}})),[]))
test('TEXT_YEAR_RANGES_SUPPORTED',()=>{for(const age_range of ['3-6 ans','3–6 years','3 إلى 6 سنوات'])assert.equal(g.matchesAge(item('text',{metadata:{experience_configuration:{age_range}}}),'3-5'),true)})
test('MONTHS_NOT_MISREAD_AS_YEARS',()=>assert.equal(g.matchesAge(item('months',{metadata:{experience_configuration:{age_range:'3-6 mois'}}}),'3-5'),false))
test('PUBLIC_LEGACY_AGE_FACTS_SUPPORTED',()=>assert.equal(g.matchesAge(item('legacy-age',{metadata:{family_card_details:['2 h','3-6 ans']}}),'3-5'),true))
test('ALL_AGES_INCLUDES_UNSPECIFIED_OFFERS',()=>assert.equal(g.matchesAge(one,'all'),true))
test('CONFIGURED_NATIVE_PRODUCT_COMPETENCIES_SUPPORTED',()=>assert.equal(g.matchesInterest(item('language',{metadata:{experience_configuration:{competency_domains:['language','memory']}}}),'language'),true))
test('GOALS_NOT_INFERRED_FROM_NAMES_OR_DESCRIPTIONS',()=>assert.equal(g.matchesInterest(item('title',{name:'Language and creativity',short_description:'Build concentration'}),'language'),false))
test('FOREIGN_ATOMIC_SCHEMAS_NEVER_RECOMMENDED',()=>assert.equal(g.recommendGateway([item('foreign',{metadata:{experience_schema_key:'academy-course'}})],'fr').length,0))
test('PUBLISHED_UNAVAILABLE_OFFERS_STAY_DISCOVERABLE',()=>assert.equal(g.recommendGateway([item('unavailable',{availability_status:'unavailable'})],'fr').length,1))
test('CANONICAL_INPUTS_NOT_MUTATED',()=>{const data=[one,recurring,kit];const before=JSON.stringify(data);g.recommendGateway(data,'fr',{need:'care',rhythm:'recurring'});assert.equal(JSON.stringify(data),before)})
test('COLLECTIONS_USE_CANONICAL_IDENTITIES_AND_DEDUPLICATE',()=>{const result=g.canonicalCollections({collections:[{id:'c',items:[{...one,name:'Stale'},one,item('foreign')]}]},[one]);assert.equal(result[0].items.length,1);assert.equal(result[0].items[0],one)})
test('FOREIGN_ONLY_COLLECTIONS_ARE_EXCLUDED',()=>assert.equal(g.canonicalCollections({collections:[{id:'c',items:[item('foreign')]}]},[one]).length,0))
test('ALL_SIXTEEN_SCHEMAS_HAVE_EXISTING_ENTRY_ROUTES',()=>{for(const key of c.FAMILY_ATOMIC_SCHEMA_KEYS){assert.ok(g.directoryHref('fr',key).startsWith('/angelcare-marketplace/fr/'));assert.ok(g.directoryAnchor(key))}})
test('RECENTS_REJECT_FOREIGN_AND_MALFORMED_IDENTITIES',()=>{const allowed=new Set(['one','kit']);assert.deepEqual(g.safeStoredIds('["one","foreign","one","kit",5]',allowed),['one','kit']);assert.deepEqual(g.safeStoredIds('{oops',allowed),[]);assert.deepEqual(g.safeStoredIds('"one"',allowed),[])})
const source=fs.readFileSync(path.join(root,base+'gateway/FamilyGateway.tsx'),'utf8'),wrapper=fs.readFileSync(path.join(root,base+'components/FamiliesStorefrontProMax.tsx'),'utf8')
test('EXISTING_STUDIO_ENTRY_POINT_PRESERVED',()=>assert.ok(wrapper.includes('FamilyGateway as FamiliesStorefrontProMax')))
test('NO_WAITING_CLOCK_OR_FALSE_BOOKING_PROMISE',()=>assert.ok(!/setInterval|24-hour|FamilyRefreshCountdown|only \d+ left|Guaranteed booking/i.test(source)))
test('HEADER_FOOTER_AND_IMPORT_ENGINES_NOT_REIMPLEMENTED',()=>assert.ok(!/GlobalPublicShell|createServiceClient|INSERT INTO|UPDATE public\./.test(source)))
console.log('FAMILIES_GATEWAY_RUNTIME='+results.length+'/'+results.length+' PASS')
