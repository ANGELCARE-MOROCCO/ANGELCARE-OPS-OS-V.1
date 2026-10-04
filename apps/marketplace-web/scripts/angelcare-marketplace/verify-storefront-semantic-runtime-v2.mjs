import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd()
let checks=0,pass=0,fail=0
const out=[]
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8')
const exists=(p)=>fs.existsSync(path.join(root,p))
function check(name,ok,detail=''){
  checks++
  if(ok){pass++;out.push(`PASS ${name}${detail?` · ${detail}`:''}`)}else{fail++;out.push(`FAIL ${name}${detail?` · ${detail}`:''}`)}
}
const contains=(file,needle)=>exists(file)&&read(file).includes(needle)
const count=(file,needle)=>exists(file)?read(file).split(needle).length-1:0

const types='angelcare-marketplace/public-experience-authority/world-factory/types.ts'
const packs='angelcare-marketplace/public-experience-authority/world-factory/storefront-capabilities.ts'
const compiler='angelcare-marketplace/public-experience-authority/world-factory/compiler.ts'
const operability='angelcare-marketplace/public-experience-authority/world-factory/operability.ts'
const ontology='angelcare-marketplace/public-experience-authority/world-factory/ontology.ts'
const bindings='angelcare-marketplace/public-experience-authority/typed-bindings.ts'
const runtime='angelcare-marketplace/public-experience-authority/storefront-runtime.ts'
const renderer='angelcare-marketplace/studio-universal/StudioPublishedRenderer.tsx'
const semantic='angelcare-marketplace/studio-universal/components/StudioStorefrontSemanticRuntime.tsx'
const css='angelcare-marketplace/studio-universal/components/studio-storefront-semantic-runtime.module.css'
const inspector='angelcare-marketplace/studio-universal/components/StudioInspector2031.tsx'
const dynamic='angelcare-marketplace/studio-dynamic-source/components/StudioDynamicSourceField.tsx'
const storefront='angelcare-marketplace/catalog-discovery/components/Storefront.tsx'

for(const f of [types,packs,compiler,operability,ontology,bindings,runtime,renderer,semantic,css,inspector,dynamic,storefront])check(`FILE ${f}`,exists(f))

const keys=['families','home-services','development','kits','academy','establishments','hospitality','health-partners','corporates','partner-os','quality-check','professionals']
for(const key of keys)check(`PACK ${key}`,contains(packs,`key:'${key}'`))
check('STOREFRONT_PACK_COUNT',keys.every(k=>contains(packs,`key:'${k}'`)),'12/12')

const roles=[
 'storefront_availability','storefront_process','storefront_pathways','storefront_sessions','storefront_segments','storefront_diagnostic','storefront_seasonal','storefront_use_cases','storefront_boundary','storefront_referral','storefront_benefits','storefront_impact','storefront_plans','storefront_capabilities','storefront_framework','storefront_assessment','storefront_qualifications','storefront_professional_availability','storefront_comparison','storefront_editorial','storefront_proof','storefront_trust','storefront_final_conversion'
]
for(const role of roles)check(`ROLE ${role}`,contains(types,`'${role}'`)&&contains(ontology,`r('${role}'`)&&contains(bindings,`'${role.replace('storefront_','storefront.').replace('use_cases','useCases').replace('professional_availability','professionalAvailability').replace('final_conversion','finalConversion')}'`))
check('SEMANTIC_ROLES_V2',roles.every(role=>contains(types,`'${role}'`)),'23 expanded roles')

const sources=['catalog.items','catalog.categories','homepage.collections','homepage.campaigns','academy.programmes','academy.cohorts','providers.profiles','commerce.promotions','partners.plans','b2b.programmes','trust.claims']
for(const src of sources)check(`SOURCE ${src}`,contains(packs,`'${src}'`))
check('PACK_SOURCE_AUTHORITY',contains(operability,'allowedSourceIds')&&contains(inspector,'allowedDynamicSources'))
check('MERCH_AUTOMATIC',contains(operability,"'automatic'"))
check('MERCH_CURATED',contains(operability,"'curated'"))
check('MERCH_MANUAL',contains(operability,"'manual'"))
check('MERCH_HYBRID',contains(operability,"'hybrid'"))
check('PIN_EXCLUDE',contains(dynamic,'toggleMerch'))
check('CURATED_REORDER',contains(dynamic,'movePinned')&&contains(dynamic,'ArrowUp')&&contains(dynamic,'ArrowDown'))

check('COMPILER_PACK_AWARE',contains(compiler,'worldFactoryStorefrontPack'))
check('COMPILER_RUNTIME_CAPABILITY',contains(compiler,"'storefront-semantic-runtime-v2':'Studio Storefront Semantic Runtime V2'"))
check('COMPILER_GLOBAL_SHELL_GATE',contains(compiler,"gate('storefront-shell'")&&contains(compiler,'forbiddenStorefrontShell'))
check('GLOBAL_HEADER_DUPLICATION_NO',contains(compiler,'Global AngelCare header/navigation/footer remain outside the imported Storefront World.'))
check('INVENTED_LOGO_NO',!contains(semantic,'AngelCare Pro')&&!contains(semantic,'logo.svg'))
check('RUNTIME_SEMANTIC_MATERIALIZATION',contains(runtime,'applySemanticRole')&&contains(runtime,'__storefrontSemantic'))
check('RUNTIME_PRICE_PRESERVATION',contains(runtime,'priceMad:item.price_amount')&&contains(runtime,'priceMode:item.price_mode'))
check('RUNTIME_TRUST_PRESERVATION',contains(runtime,'trustLabels:item.trust_labels'))
check('RENDERER_STOREFRONT_BRIDGE',contains(runtime,'applySemanticRole')&&contains(renderer,'StudioWorldLayoutShell')&&!contains(renderer,'StudioStorefrontSemanticRuntime')&&!contains(renderer,'currentStorefrontExperience'))
check('ROUTE_RUNTIME_CONTEXT',contains(storefront,'preparePublicStorefrontWorld')&&contains(storefront,'dynamicAlreadyApplied')&&!contains(storefront,'currentStorefrontExperience={experience}'))
check('INSPECTOR_DYNAMIC_SOURCE_CORRECT',contains(inspector,'cap?.dynamicSource||worldCapability.acceptsDynamicSource')&&!contains(inspector,'cap?.source||worldCapability.acceptsDynamicSource'))
check('INSPECTOR_WORLD_SOURCES',contains(inspector,'worldAllowedSources')&&contains(inspector,'allowedSources={allowedDynamicSources}'))
check('FR_EN_AR_UI',contains(semantic,"locale==='ar'")&&contains(semantic,"locale==='en'")&&contains(semantic,"locale==='fr'"))
check('RTL_RUNTIME',contains(renderer,"dir={locale==='ar'?'rtl':'ltr'}"))
check('WIDE_DESKTOP',contains(css,'1600px')&&contains(css,'clamp('))
check('MOBILE_NATIVE',contains(css,'@media(max-width:520px)')&&contains(css,'@media(max-width:800px)'))
check('REDUCED_MOTION',contains(css,'prefers-reduced-motion'))
check('EMPTY_REFLOW',contains(semantic,'hideWhenEmpty')&&contains(semantic,'shouldHide'))
check('NATIVE_FALLBACK',contains(runtime,"status:'FALLBACK_NATIVE'")&&contains(storefront,'nativeFallback'))
check('TRUTH_FIREWALL',contains(runtime,'enforceStorefrontStaticTruth'))
check('CANONICAL_ACTIONS',contains(semantic,'StudioActionLink'))

const routeMap={
 families:'families', 'home-services':'home-services', development:'development', kits:'kits', academy:'academy', establishments:'establishments', hospitality:'hospitality', 'health-partners':'health-partners', corporates:'corporates', 'partner-os':'partner-os', 'quality-check':'quality-check', professionals:'professionals'
}
let routePass=0
for(const [key,dir] of Object.entries(routeMap)){
 const f=`app/angelcare-marketplace/[locale]/${dir}/page.tsx`
 const ok=exists(f)&&contains(f,'Storefront')
 if(ok)routePass++
 check(`ROUTE ${key}`,ok)
}
check('ROUTE_AUTHORITY_12_12',routePass===12,`${routePass}/12`)

for(const atomic of ['StudioProductWorldRuntime','StudioServiceWorldRuntime','StudioAcademyWorldRuntime','StudioB2BWorldRuntime'])check(`ATOMIC_PRESERVED ${atomic}`,contains(renderer,atomic))
check('NO_FINAL_STOREFRONT_COMPONENTS',!fs.readdirSync(path.join(root,'angelcare-marketplace/public-experience-authority/components')).some(n=>/FamiliesStorefrontV2|AcademyStorefrontV2|PartnerOsStorefrontV2/.test(n)))

console.log('========================================================================')
console.log(' STOREFRONT SEMANTIC RUNTIME V2 — CONTRACT VERIFIER')
console.log('========================================================================')
for(const line of out)console.log(line)
console.log('------------------------------------------------------------------------')
console.log(`CHECKS=${checks}`)
console.log(`PASS=${pass}`)
console.log(`FAIL=${fail}`)
console.log(`RESULT=${fail===0?'PASS':'FAIL'}`)
console.log('========================================================================')
process.exit(fail===0?0:1)
