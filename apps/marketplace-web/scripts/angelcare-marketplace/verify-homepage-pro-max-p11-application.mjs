import fs from 'node:fs'
import path from 'node:path'

const target=path.resolve(process.argv[2]||process.cwd())
const read=(rel)=>fs.readFileSync(path.join(target,rel),'utf8')
const checks=[]
const check=(name,cond,detail='')=>{checks.push([name,Boolean(cond),detail]);console.log(`${cond?'PASS':'FAIL'} ${name}${detail?` ${detail}`:''}`)}

const recipe=read('angelcare-marketplace/studio-homepage-pro-max/recipe.ts')
const pageJson=read('angelcare-marketplace/studio-universal/page-json.ts')
const studio=read('angelcare-marketplace/studio-universal/components/UniversalExperienceStudio.tsx')
const p11=read('angelcare-marketplace/studio-governance-engine/engine.ts')
const library=read('angelcare-marketplace/studio-homepage-pro-max/components/HomepageProMaxLibrary.tsx')

const ids=[...recipe.matchAll(/\{id:'(S\d\d)',type:'ac_home_pro_max_/g)].map(m=>m[1])
check('ROOT_SECTIONS_18',new Set(ids).size===18 && ids[0]==='S00' && ids.at(-1)==='S17',`COUNT=${new Set(ids).size}`)
check('DYNAMIC_SOURCE_HELPER',recipe.includes("const catalogDynamicSource=(strategy:StudioDynamicStrategy,limit:number):StudioDynamicSourceReference=>({version:1,sourceId:'catalog.items',strategy,limit,emptyPolicy:'hide_block'})"))
for(const [strategy,limit] of [['catalog_featured',6],['catalog_available',6],['merchandising_popular',8],['catalog_newest',8]]){
  check(`DYNAMIC_${strategy.toUpperCase()}`,recipe.includes(`catalogDynamicSource('${strategy}',${limit})`))
}
for(const legacy of ["strategy:'featured'","strategy:'available_now'","strategy:'popular'","strategy:'newest'"]){
  check(`LEGACY_${legacy.replace(/[^a-z0-9]+/gi,'_').toUpperCase()}_ABSENT`,!recipe.includes(legacy))
}
check('PAGE_JSON_NATIVE_WORLD_IMPORT',pageJson.includes("HOMEPAGE_PRO_MAX_COMPONENT_KEYS"))
check('PAGE_JSON_NATIVE_WORLD_REGISTRATION',pageJson.includes('HOMEPAGE_PRO_MAX_COMPONENT_KEYS.includes(type)'))
check('PAGE_JSON_REGISTERED_TYPE_GATE',pageJson.includes('!isRegisteredStudioBlockType(type)'))
const preflight=studio.indexOf('validateStudioPageJson(next)')
const persist=studio.indexOf('persist(validated,summary)')
check('CLIENT_PREFLIGHT_BEFORE_PERSIST',preflight>=0 && persist>preflight)
check('CLIENT_PREFLIGHT_VISIBLE_FAILURE',studio.includes("title:'Application impossible'") && studio.includes("setProgress('Application refusée','error')"))
check('P11_DOCUMENT_INTEGRITY_STILL_ENFORCED',p11.includes("function documentFinding") && p11.includes('validateStudioPageJson(data)') && p11.includes("Politique P11 bloquante"))
check('NO_P11_BYPASS',!p11.includes('DOCUMENT_INTEGRITY_BYPASS') && !p11.includes('skipDocumentIntegrity'))
check('HOMEPAGE_APPLY_STILL_PERSISTS_THROUGH_PARENT',library.includes('await onApply(buildHomepageProMaxWorld01Data(currentData,mode)'))
check('NO_LOCALSTORAGE',!recipe.includes('localStorage') && !pageJson.includes('localStorage'))
check('NO_SESSIONSTORAGE',!recipe.includes('sessionStorage') && !pageJson.includes('sessionStorage'))
check('NO_EVAL',!recipe.includes('eval(') && !pageJson.includes('eval('))

const failed=checks.filter(([,ok])=>!ok)
console.log('='.repeat(88))
if(failed.length){console.log('HOMEPAGE_PRO_MAX_P11_STATIC_GATE=FAIL');console.log('ERRORS='+failed.map(([n])=>n).join(','));process.exit(1)}
console.log('HOMEPAGE_PRO_MAX_P11_STATIC_GATE=PASS')
console.log('DOCUMENT_INTEGRITY_PRODUCER=CANONICAL')
console.log('P11_BYPASS=NO')
console.log('FULL_PAGE_REPLACE_PATH=GOVERNED')
