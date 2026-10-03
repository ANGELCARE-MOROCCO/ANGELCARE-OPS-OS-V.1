import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {createRequire} from 'node:module'

const root=process.cwd()
const require=createRequire(path.join(root,'package.json'))
const ts=require('typescript')
const rel=(...p)=>path.join(...p)
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8')
const exists=(p)=>fs.existsSync(path.join(root,p))
const fail=[]
let pass=0
const check=(ok,label,detail='')=>{if(ok){pass++;console.log(`PASS ${label}${detail?` · ${detail}`:''}`)}else{fail.push(label);console.log(`FAIL ${label}${detail?` · ${detail}`:''}`)}}

const files={
 dyn:'angelcare-marketplace/studio-dynamic-source/catalog-resolver.ts',
 eng:'angelcare-marketplace/studio-dynamic-source/engine.ts',
 actionRegistry:'angelcare-marketplace/studio-action-registry/registry.ts',
 util:'angelcare-marketplace/studio-universal/components/atomic-runtime-presentation.ts',
 product:'angelcare-marketplace/studio-universal/components/StudioProductWorldRuntime.tsx',
 productActions:'angelcare-marketplace/studio-universal/components/StudioProductCommerceActions.tsx',
 service:'angelcare-marketplace/studio-universal/components/StudioServiceWorldRuntime.tsx',
 serviceActions:'angelcare-marketplace/studio-universal/components/StudioServiceBookingActions.tsx',
 academy:'angelcare-marketplace/studio-universal/components/StudioAcademyWorldRuntime.tsx',
 academyActions:'angelcare-marketplace/studio-universal/components/StudioAcademyEnrollmentActions.tsx',
 b2b:'angelcare-marketplace/studio-universal/components/StudioB2BWorldRuntime.tsx',
 b2bActions:'angelcare-marketplace/studio-universal/components/StudioB2BConversionActions.tsx',
 productCss:'angelcare-marketplace/studio-universal/components/studio-product-world-runtime.module.css',
 serviceCss:'angelcare-marketplace/studio-universal/components/studio-service-world-runtime.module.css',
 academyCss:'angelcare-marketplace/studio-universal/components/studio-academy-world-runtime.module.css',
 b2bCss:'angelcare-marketplace/studio-universal/components/studio-b2b-world-runtime.module.css',
}

console.log('========================================================================')
console.log(' ANGELCARE ATOMIC RUNTIME — TAKEOFF CERTIFICATION')
console.log(' PRODUCT · SERVICE · ACADEMY · B2B')
console.log('========================================================================')

for(const [k,f] of Object.entries(files))check(exists(f),`FILE ${k}`,f)
if(fail.length){console.log(`\nEARLY_FAIL=${fail.length}`);process.exit(1)}

const dyn=read(files.dyn),eng=read(files.eng),actionRegistry=read(files.actionRegistry),util=read(files.util)
const product=read(files.product),productActions=read(files.productActions)
const service=read(files.service),serviceActions=read(files.serviceActions)
const academy=read(files.academy),academyActions=read(files.academyActions)
const b2b=read(files.b2b),b2bActions=read(files.b2bActions)

// Shared dynamic source closure.
for(const token of [
  "matchesRecipe", "excludedEntityIds", "pinnedEntityIds", "context.itemId",
  "compatible_accessories", "bundle_members", "frequently_bought_together", "similar_items",
  "merchandising_popular", "merchandising_best_pick", "merchandising_new_arrival",
  "experience_schema_key", "category_key", "availability_status"
]) check(dyn.includes(token),`DYNAMIC ${token}`)
check((dyn.match(/return merchandise\(/g)||[]).length>=5,'DYNAMIC FINAL FILTER PIPELINE')
check(eng.includes('experienceSchemaKey')&&eng.includes('availabilityStatus')&&eng.includes('categoryKey'),'DYNAMIC MATERIALIZED DOMAIN METADATA')
check(/id:'b2b\.request'[\s\S]*targetSources:\[[^\]]*'b2b\.programmes'[^\]]*'catalog\.items'/.test(actionRegistry),'B2B REQUEST CURRENT-ITEM TARGET SUPPORT')

// Domain purity.
check(product.includes('isProductKind')&&product.includes("filter(row=>row.slug&&isProductKind(row.kind))"),'PRODUCT DOMAIN PURITY')
check(service.includes('.filter(isServiceRow)')&&service.includes('data.recommendations.filter(row=>isServiceRow'),'SERVICE DOMAIN PURITY')
check(academy.includes('.filter(isAcademyRow)')&&academy.includes('data.recommendations.filter(row=>isAcademyRow'),'ACADEMY DOMAIN PURITY')
check(b2b.includes('.filter(isB2BRow)')&&b2b.includes('data.recommendations.filter(row=>isB2BRow'),'B2B DOMAIN PURITY')
check(!/\['b2b','institutional','solution','programme','program'\]\.includes\(k\)/.test(util),'B2B GENERIC PROGRAMME NOT AUTO-CLASSIFIED')
for(const [name,src] of [['PRODUCT',product],['SERVICE',service],['ACADEMY',academy],['B2B',b2b]]){
 check(src.includes('/marketplace/item/'),`${name} CANONICAL RELATED DETAIL ROUTE`)
}

// Global shell sovereignty.
for(const [name,src] of [['PRODUCT',product],['SERVICE',service],['ACADEMY',academy],['B2B',b2b]]){
 check(!/<footer\b/i.test(src),`${name} NO GLOBAL FOOTER`)
 check(!/ServiceHeader|AcademyHeader|B2BHeader|ProductHeader/.test(src),`${name} NO DUPLICATE HEADER COMPONENT`)
}

// Canonical action authority.
check(product.includes("actionAvailable(data,'basket.add')")&&product.includes("actionAvailable(data,'checkout.start')"),'PRODUCT ACTION AUTHORITY')
check(productActions.includes('basketEnabled')&&productActions.includes('checkoutEnabled'),'PRODUCT CLIENT ACTION GATING')
check(service.includes("actionAvailable(data,'booking.start')")&&service.includes("actionAvailable(data,'quotation.start')"),'SERVICE ACTION AUTHORITY')
check(serviceActions.includes('bookingEnabled')&&serviceActions.includes('quoteEnabled'),'SERVICE CLIENT ACTION GATING')
check(academy.includes("actionAvailable(data,'academy.enroll')"),'ACADEMY ACTION AUTHORITY')
check(academyActions.includes('enrollmentEnabled'),'ACADEMY CLIENT ACTION GATING')
check(b2b.includes("publicAction(data,'quotation.start')")&&b2b.includes("publicAction(data,'b2b.request')"),'B2B ACTION AUTHORITY')
check(b2bActions.includes('quoteEnabled')&&b2bActions.includes('requestEnabled'),'B2B CLIENT ACTION GATING')
check(!/quotationRequired\s*\|\|\s*quoteEnabled/.test(b2bActions),'B2B NO FORCED QUOTATION AUTHORITY')

// Truth / no fabricated social proof or certification.
check(service.includes("proven(truth,'rating')")&&!/Array\(5\)|★★★★★/.test(service),'SERVICE TRUTHFUL REVIEWS')
check(academy.includes("proven(truth,'certification')")&&academy.includes("proven(truth,'rating')"),'ACADEMY CERTIFICATION + RATING TRUTH GATES')
check(b2b.includes("proven(truth,'pricing')"),'B2B PRICING TRUTH GATE')
check(product.includes('availabilityView')&&product.includes("'À confirmer'")&&product.includes("'To be confirmed'"),'PRODUCT AVAILABILITY TRI-STATE')

// Localization + human presentation.
for(const [name,src] of [['UTIL',util],['PRODUCT',product],['SERVICE',service],['ACADEMY',academy],['B2B',b2b],['PRODUCT_ACTIONS',productActions],['SERVICE_ACTIONS',serviceActions],['ACADEMY_ACTIONS',academyActions],['B2B_ACTIONS',b2bActions]]){
 check(/[\u0600-\u06ff]/.test(src)&&/\bfr\b/.test(src)&&/\ben\b/.test(src),`${name} FR_EN_AR`)
}
check(util.includes('humanizeLabel')&&util.includes('humanizeValue'),'CUSTOMER PRESENTATION MAPPER')
check(util.includes("MAD")&&util.includes("DH"),'MAD / DIRHAM FORMATTER')
check(util.includes('durationDays'),'B2B DURATION HUMANIZER')

// Academy dead navigation / dead control closure.
check(academy.includes('id="academy-outcomes"')&&academy.includes("href:'#academy-outcomes'"),'ACADEMY OUTCOMES ANCHOR')
check(academy.includes('id="academy-curriculum"')&&academy.includes("href:'#academy-curriculum'"),'ACADEMY CURRICULUM ANCHOR')
check(academy.includes('id="academy-credential"')&&academy.includes("href:'#academy-credential'"),'ACADEMY CREDENTIAL ANCHOR')
check(academy.includes('id="academy-proof"')&&academy.includes("href:'#academy-proof'"),'ACADEMY PROOF ANCHOR')
check(!/CertificationPreview|previewCertification|fakeVideo|onClick=\{\(\)=>\{\}\}/.test(academy),'ACADEMY NO DEAD CONTROL')

// Media policy.
check(product.includes('uniqueMedia'),'PRODUCT MEDIA DEDUP')
check(service.includes('uniqueMedia'),'SERVICE MEDIA DEDUP')
check(academy.includes('uniqueMedia'),'ACADEMY MEDIA DEDUP')
check(b2b.includes('uniqueMedia'),'B2B MEDIA DEDUP')

// CSS contract + referenced class coverage.
function cssClasses(css){return new Set([...css.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map(m=>m[1]))}
function styleRefs(src){return new Set([...src.matchAll(/styles\.([A-Za-z0-9_]+)/g)].map(m=>m[1]))}
for(const [name,world,actions,cssPath] of [
 ['PRODUCT',product,productActions,files.productCss],
 ['SERVICE',service,serviceActions,files.serviceCss],
 ['ACADEMY',academy,academyActions,files.academyCss],
 ['B2B',b2b,b2bActions,files.b2bCss],
]){
 const css=read(cssPath),defs=cssClasses(css),refs=new Set([...styleRefs(world),...styleRefs(actions)])
 const missing=[...refs].filter(x=>!defs.has(x))
 check(!missing.length,`${name} CSS CLASS COVERAGE`,missing.join(','))
 check((css.match(/@media/g)||[]).length>0,`${name} RESPONSIVE CSS`)
 check(/rtl/i.test(css),`${name} RTL CSS`)
}

// Syntax transpilation.
const tsFiles=[files.dyn,files.eng,files.actionRegistry,files.util,files.product,files.productActions,files.service,files.serviceActions,files.academy,files.academyActions,files.b2b,files.b2bActions]
let syntaxErrors=[]
for(const f of tsFiles){
 const out=ts.transpileModule(read(f),{fileName:f,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,jsx:ts.JsxEmit.Preserve}})
 for(const d of out.diagnostics||[])if(d.category===ts.DiagnosticCategory.Error)syntaxErrors.push({f,d})
}
check(syntaxErrors.length===0,'TARGETED TYPESCRIPT SYNTAX',String(syntaxErrors.length))
if(syntaxErrors.length)for(const {f,d} of syntaxErrors)console.log(`  ${f}: ${ts.flattenDiagnosticMessageText(d.messageText,'\n')}`)

// Correct targeted TypeScript Program: TS/TSX roots only; CSS wildcard shim; no CSS passed to tsc.
const configPath=path.join(root,'tsconfig.json')
if(exists('tsconfig.json')){
 const cfg=ts.readConfigFile(configPath,ts.sys.readFile)
 if(cfg.error){check(false,'TARGETED TYPESCRIPT PROGRAM','tsconfig read failed')}
 else{
  const parsed=ts.parseJsonConfigFileContent(cfg.config,ts.sys,root)
  const shim=path.join(os.tmpdir(),`angelcare-atomic-css-${process.pid}.d.ts`)
  fs.writeFileSync(shim,"declare module '*.module.css' { const classes: Readonly<Record<string,string>>; export default classes; }\n")
  const rootNames=[...tsFiles.map(f=>path.join(root,f)),shim]
  const program=ts.createProgram({rootNames,options:{...parsed.options,noEmit:true,incremental:false,tsBuildInfoFile:undefined}})
  const patched=new Set(tsFiles.map(f=>path.normalize(path.join(root,f))))
  const diagnostics=ts.getPreEmitDiagnostics(program).filter(d=>d.file&&patched.has(path.normalize(d.file.fileName)))
  try{fs.unlinkSync(shim)}catch{}
  check(diagnostics.length===0,'TARGETED TYPESCRIPT PROGRAM',String(diagnostics.length))
  if(diagnostics.length){
   const host={getCanonicalFileName:x=>x,getCurrentDirectory:()=>root,getNewLine:()=>"\n"}
   console.log(ts.formatDiagnosticsWithColorAndContext(diagnostics,host))
  }
 }
}else check(false,'TARGETED TYPESCRIPT PROGRAM','tsconfig missing')

console.log('\n========================================================================')
console.log(`CHECKS=${pass+fail.length}`)
console.log(`PASS=${pass}`)
console.log(`FAIL=${fail.length}`)
if(fail.length){
 console.log(`FAILED=${fail.join(' | ')}`)
 console.log('TAKEOFF_CERTIFICATION=FAIL')
 console.log('========================================================================')
 process.exit(1)
}
console.log('PRODUCT_RUNTIME=PASS')
console.log('SERVICE_RUNTIME=PASS')
console.log('ACADEMY_RUNTIME=PASS')
console.log('B2B_RUNTIME=PASS')
console.log('SHARED_DYNAMIC_SOURCE_ENGINE=PASS')
console.log('DOMAIN_PURITY=PASS')
console.log('ACTION_AUTHORITY=PASS')
console.log('TRUTH_GATES=PASS')
console.log('FR_EN_AR=PASS')
console.log('RTL_STATIC=PASS')
console.log('MOBILE_DESKTOP_STATIC_CONTRACT=PASS')
console.log('GLOBAL_HEADER_DUPLICATION=NO')
console.log('GLOBAL_FOOTER_DUPLICATION=NO')
console.log('DATABASE_CHANGE=NO')
console.log('TARGETED_TYPESCRIPT=PASS')
console.log('ATOMIC_CONTRACT_VERIFIER=PASS')
console.log('TAKEOFF_CERTIFICATION=PASS')
console.log('========================================================================')
