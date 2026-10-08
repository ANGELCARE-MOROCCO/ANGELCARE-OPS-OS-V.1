import fs from 'node:fs'
import path from 'node:path'
import postcss from 'postcss'

const root=process.cwd()
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8')
let checks=0,failed=0
const pass=(name,detail='')=>{checks++;console.log(`PASS ${name}${detail?` :: ${detail}`:''}`)}
const fail=(name,detail='')=>{checks++;failed++;console.error(`FAIL ${name}${detail?` :: ${detail}`:''}`)}
const check=(name,ok,detail='')=>ok?pass(name,detail):fail(name,detail)

const contract=read('angelcare-marketplace/families-storefront/contract.ts')
const component=read('angelcare-marketplace/families-storefront/components/FamiliesStorefrontProMax.tsx')
const countdown=read('angelcare-marketplace/families-storefront/components/FamilyRefreshCountdown.tsx')
const rail=read('angelcare-marketplace/families-storefront/components/FamilyCommerceRail.tsx')
const css=read('angelcare-marketplace/families-storefront/components/families-storefront.module.css')
const repo=read('angelcare-marketplace/catalog-discovery/repository.ts')
const storefront=read('angelcare-marketplace/catalog-discovery/components/Storefront.tsx')
const worlds=read('angelcare-marketplace/public-experience-authority/canonical-worlds.ts')
const doctrine=read('angelcare-marketplace/public-experience-authority/registry.ts')
const doc=read('docs/angelcare-marketplace/families-storefront/FAMILIES_STOREFRONT_PROMAX_CONTRACT.md')

const allowed=[
'home-childcare-one-time','home-childcare-recurring','school-pickup-care','overnight-extended-care','emergency-last-minute-care','hotel-travel-childcare','holiday-excursion-programme','montessori-home-service','learning-homework-support','non-medical-support-service','flashcards-learning-product','montessori-development-kit','development-game','activity-subscription-box','digital-learning-resource','preschool-admission']
const forbidden=['academy-course','academy-cohort','certification-pathway','parent-workshop','institutional-training','partner-os-plan','corporate-childcare-benefit','hospitality-kids-programme','school-managed-programme','school-staff-reinforcement','health-adjacent-programme','event-venue-programme','quality-check-assessment','custom-managed-solution','events-group-childcare']

check('ATOMIC_COUNT_16',(contract.match(/schemaKey:'/g)||[]).length===16)
for(const key of allowed)check(`ATOM_${key}`,contract.includes(`'${key}'`)&&doc.includes(`\`${key}\``))
check('NO_FORBIDDEN_ATOMS_IN_FAMILY_ARRAY',forbidden.every(key=>!contract.match(new RegExp(`schemaKey:'${key}'`))))
check('REPOSITORY_USES_SCHEMA_ORCHESTRATION',repo.includes(".in('experience_schema_key',[...FAMILY_ATOMIC_SCHEMA_KEYS])"))
check('REPOSITORY_FAMILIES_SPECIAL_CASE',repo.includes("input.key==='families'?await familyOrchestrationSearch"))
check('REPOSITORY_PUBLISHED_ONLY',repo.includes(".eq('status','published').in('experience_schema_key'"))
check('REPOSITORY_COLLECTION_TRUTH_FILTER',repo.includes("input.key!=='families'||isFamilyAtomicSchemaKey"))
check('STOREFRONT_DEDICATED_RUNTIME',storefront.includes("experience.key==='families'")&&storefront.includes('FamiliesStorefrontProMax'))
check('CUSTOM_STUDIO_WORLD_PRECEDENCE',storefront.indexOf("world.status==='READY'")<storefront.indexOf("experience.key==='families'"))
check('BUILTIN_WORLD_ID_PRESERVED',worlds.includes("id:'builtin:pea:storefront:families:v1'"))
check('BUILTIN_WORLD_HYPER_COMMERCE',worlds.includes("storefrontKey:'families',density:'hyper_commerce'"))
check('DOCTRINE_STILL_12_STOREFRONTS',doctrine.includes("if(PUBLIC_EXPERIENCE_STOREFRONTS.length!==12)"))
check('HERO_THREE_PART',component.includes('heroCopy')&&component.includes('heroMedia')&&component.includes('heroDecision'))
check('NEED_MAP_16',component.includes('FAMILY_ATOMIC_STORIES.map'))
check('ATOMIC_STORY_REPEAT',component.includes('FamilyAtomicSection')&&component.includes('data-schema={story.schemaKey}'))
check('CANONICAL_CARDS',component.includes('<CatalogCard'))
check('LIVE_ITEM_MEDIA_FIRST',component.includes("items.find(item=>item.media_url)?.media_url||fallback"))
check('EDITORIAL_FALLBACK_ASSETS',allowed.every(key=>contract.slice(contract.indexOf(`schemaKey:'${key}'`),contract.indexOf(`schemaKey:'${key}'`)+1000).includes('fallbackMedia:')))
check('EMPTY_BLOCK_VISIBLE',component.includes('updatingState')&&component.includes('FamilyRefreshCountdown'))
check('EMPTY_GHOST_SHELF',component.includes('ghostShelf')&&component.includes('ghostCard'))
check('COUNTDOWN_24H',countdown.includes('24*60*60*1000'))
check('COUNTDOWN_REPEATING',countdown.includes('const now=Date.now()')&&countdown.includes('now%DAY'))
check('COUNTDOWN_TRUTH_NOTE',contract.includes('pas une promesse de publication ou de disponibilité')&&doc.includes('not a promise'))
check('UNAVAILABLE_PUBLISHED_NOT_FILTERED',!component.includes("availability_status!=='unavailable'"))
check('FAMILY_REQUEST_RESCUE',component.includes('/family/request'))
check('DRAGGABLE_RAIL',rail.includes('onPointerDown')&&rail.includes('scrollBy'))
check('RAIL_ARROW_CONTROLS',rail.includes('ChevronLeft')&&rail.includes('ChevronRight'))
check('MOBILE_DENSITY',css.includes('grid-auto-columns:82vw'))
check('REDUCED_MOTION',css.includes('@media(prefers-reduced-motion:reduce)'))
check('RTL_ROOT',component.includes("dir={experience.locale==='ar'?'rtl':'ltr'}"))
check('NO_FAKE_RATINGS',!component.match(/rating|avis clients|reviews?/i))
check('NO_FAKE_DISCOUNT',!component.match(/-[1-9][0-9]?%|discount|remise/i))
check('NO_FAKE_SCARCITY',!component.match(/[0-9]+ places restantes|only [0-9]+ left/i))
check('NO_ACADEMY_COPY',!contract.match(/schemaKey:'academy-/)&&!component.includes('/academy'))
check('NO_SAAS_COPY',!contract.match(/schemaKey:'partner-os-plan'/)&&!component.includes('/partner-os'))
check('NO_B2B_COPY',!contract.match(/schemaKey:'corporate-childcare-benefit'|schemaKey:'hospitality-kids-programme'|schemaKey:'school-managed-programme'|schemaKey:'health-adjacent-programme'/))
check('COLLECTIONS_FAMILY_ONLY',component.includes('familyCollections')&&repo.includes("contains('storefront_keys',[input.key])"))
check('CONCIERGE_CLOSE',component.includes('concierge')&&component.includes('FAMILY CONCIERGE'))
check('TRUTH_FIREWALL',component.includes('TRUTH FIREWALL')&&component.includes('Aucune promesse inventée'))
check('CONTRACT_DOC',doc.includes('Hyper-Commerce Family Concierge World 01'))
try{postcss.parse(css);pass('CSS_PARSE')}catch(error){fail('CSS_PARSE',String(error))}

console.log(`\nFAMILIES_STOREFRONT_PROMAX_CHECKS=${checks}`)
console.log(`FAMILIES_STOREFRONT_PROMAX_FAILED=${failed}`)
console.log(`FAMILIES_STOREFRONT_PROMAX_VERIFY=${failed?'FAIL':'PASS'}`)
if(failed)process.exit(1)
