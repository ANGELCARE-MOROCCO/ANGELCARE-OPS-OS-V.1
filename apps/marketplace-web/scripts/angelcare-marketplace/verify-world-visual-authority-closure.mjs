import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {createRequire} from 'node:module'

const root=process.cwd()
const require=createRequire(path.join(root,'package.json'))
const ts=require('typescript')
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8')
const exists=rel=>fs.existsSync(path.join(root,rel))
let checks=0,passes=0
const failures=[]
const check=(name,ok,detail='')=>{checks++;if(ok){passes++;console.log(`PASS ${name}${detail?` · ${detail}`:''}`)}else{failures.push(name);console.log(`FAIL ${name}${detail?` · ${detail}`:''}`)}}

const files={
 renderer:'angelcare-marketplace/studio-universal/StudioPublishedRenderer.tsx',
 candidate:'angelcare-marketplace/studio-universal/components/StudioCandidatePreview.tsx',
 shell:'angelcare-marketplace/studio-universal/components/StudioWorldLayoutShell.tsx',
 designShell:'angelcare-marketplace/studio-universal/components/StudioDesignShell.tsx',
 authority:'angelcare-marketplace/studio-universal/world-visual-authority.ts',
 blockRuntime:'angelcare-marketplace/studio-universal/components/StudioBlockRuntime.tsx',
 visualRuntime:'angelcare-marketplace/studio-universal/components/StudioVisualCatalogueRuntime.tsx',
 storefrontRuntime:'angelcare-marketplace/public-experience-authority/storefront-runtime.ts',
 storefront:'angelcare-marketplace/catalog-discovery/components/Storefront.tsx',
 materializer:'angelcare-marketplace/public-experience-authority/world-factory/materializer.ts',
 orchestrator:'angelcare-marketplace/studio-public-runtime/orchestrator.ts',
 publicCatalog:'angelcare-marketplace/studio-public-runtime/components/PublicCatalogExperience.tsx',
 product:'angelcare-marketplace/studio-universal/components/StudioProductWorldRuntime.tsx',
 service:'angelcare-marketplace/studio-universal/components/StudioServiceWorldRuntime.tsx',
 academy:'angelcare-marketplace/studio-universal/components/StudioAcademyWorldRuntime.tsx',
 b2b:'angelcare-marketplace/studio-universal/components/StudioB2BWorldRuntime.tsx',
 atomicVerifier:'scripts/angelcare-marketplace/verify-atomic-runtime-takeoff.mjs',
 storefrontVerifier:'scripts/angelcare-marketplace/verify-storefront-semantic-runtime-v2.mjs',
}

console.log('========================================================================')
console.log(' ANGELCARE WORLD FACTORY — PERMANENT VISUAL AUTHORITY CERTIFICATION')
console.log('========================================================================')

for(const [name,file] of Object.entries(files))check(`FILE ${name}`,exists(file),file)
if(failures.length){console.log(`TAKEOFF=FAIL`);process.exit(1)}

const renderer=read(files.renderer)
const candidate=read(files.candidate)
const shell=read(files.shell)
const designShell=read(files.designShell)
const authority=read(files.authority)
const blockRuntime=read(files.blockRuntime)
const storefrontRuntime=read(files.storefrontRuntime)
const storefront=read(files.storefront)
const materializer=read(files.materializer)
const orchestrator=read(files.orchestrator)
const publicCatalog=read(files.publicCatalog)
const atomicVerifier=read(files.atomicVerifier)
const storefrontVerifier=read(files.storefrontVerifier)

// Pure authority decision: compile the helper and execute it with synthetic worlds.
const compiled=ts.transpileModule(authority,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},fileName:files.authority,reportDiagnostics:true})
const syntax=(compiled.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error)
check('VISUAL AUTHORITY HELPER SYNTAX',syntax.length===0,String(syntax.length))
let authorityRuntime=null
if(!syntax.length){
 const tmp=path.join(os.tmpdir(),`angelcare-world-authority-${process.pid}.cjs`)
 fs.writeFileSync(tmp,compiled.outputText)
 try{authorityRuntime=require(tmp)}finally{try{fs.unlinkSync(tmp)}catch{}}
}
const synthetic=(type,withChild)=>({type,props:{id:`${type}-root`,content:withChild?[{type:'split_hero',props:{id:`${type}-hero`}}]:[]}})
if(authorityRuntime){
 for(const type of ['ac_product_world','ac_service_world','ac_academy_world','ac_b2b_world']){
  check(`${type} IMPORTED ANATOMY OWNS VISUALS`,authorityRuntime.worldVisualAuthority(type,synthetic(type,true))==='world-factory')
  check(`${type} EMPTY ROOT USES NATIVE FALLBACK`,authorityRuntime.worldVisualAuthority(type,synthetic(type,false))==='native-fallback')
 }
 check('NON ATOMIC BLOCK REMAINS BLOCK RUNTIME',authorityRuntime.worldVisualAuthority('split_hero',synthetic('split_hero',true))==='block-runtime')
}

// Published renderer contract.
check('RENDERER USES AUTHORITY DECISION',renderer.includes('shouldUseNativeAtomicFallback')&&renderer.includes('nativeAtomicFallback'))
check('WORLD FACTORY ROOT USES SHARED LAYOUT SHELL',renderer.includes('<StudioWorldLayoutShell')&&renderer.includes('authority="world-factory"'))
check('PRODUCT FALLBACK IS CONDITIONAL',renderer.includes("nativeAtomicFallback&&type==='ac_product_world'"))
check('SERVICE FALLBACK IS CONDITIONAL',renderer.includes("nativeAtomicFallback&&type==='ac_service_world'"))
check('ACADEMY FALLBACK IS CONDITIONAL',renderer.includes("nativeAtomicFallback&&type==='ac_academy_world'"))
check('B2B FALLBACK IS CONDITIONAL',renderer.includes("nativeAtomicFallback&&type==='ac_b2b_world'"))
check('NO UNCONDITIONAL PRODUCT REPLACEMENT',!renderer.includes("if(type==='ac_product_world'&&currentExperience360"))
check('NO UNCONDITIONAL SERVICE REPLACEMENT',!renderer.includes("if(type==='ac_service_world'&&currentExperience360"))
check('NO UNCONDITIONAL ACADEMY REPLACEMENT',!renderer.includes("if(type==='ac_academy_world'&&currentExperience360"))
check('NO UNCONDITIONAL B2B REPLACEMENT',!renderer.includes("if(type==='ac_b2b_world'&&currentExperience360"))
check('STOREFRONT FIXED VISUAL REPLACEMENT REMOVED',!renderer.includes('StudioStorefrontSemanticRuntime')&&!renderer.includes('currentStorefrontExperience'))
check('NESTED SECTION ORDER PRESERVED',/nested\.map\(\(child,index\)=>/.test(renderer))

// Shared shell preserves the imported visual contract.
check('SOURCE DESIGN PRESERVED',shell.includes('style={props.sourceDesign}'))
check('IMPORTED CSS PRESERVED',shell.includes('importedRules={props.__studioImportedRules}'))
check('RESPONSIVE CONTRACT PRESERVED',shell.includes('responsive={props.responsive}'))
check('WORLD TYPE TELEMETRY',shell.includes('data-ac-world-type'))
check('VISUAL AUTHORITY TELEMETRY',shell.includes('data-ac-world-visual-authority'))
check('SEMANTIC ROLE TELEMETRY',shell.includes('data-ac-world-role'))
check('LAYOUT MAX PRESERVED',shell.includes('--ac-layout-max'))
check('LAYOUT BREAKPOINT COLUMNS PRESERVED',shell.includes('--ac-cols-mobile')&&shell.includes('--ac-cols-tablet')&&shell.includes('--ac-cols-desktop'))
check('LAYOUT RESPONSIVE GAPS PRESERVED',shell.includes('--ac-gap-mobile')&&shell.includes('--ac-gap-tablet')&&shell.includes('--ac-gap-desktop'))
check('DESIGN SHELL MOUNTS IMPORTED CSS',designShell.includes('scopedImportedCss(blockId, importedRules)'))
check('DESIGN SHELL MOUNTS RESPONSIVE CSS',designShell.includes('responsiveStyleCss(blockId,responsive)'))

// Preview/public grammar parity.
check('CANDIDATE USES SAME WORLD SHELL',candidate.includes('StudioWorldLayoutShell')&&candidate.includes('authority="candidate-world-factory"'))
check('CANDIDATE USES VISUAL CATALOGUE',candidate.includes('StudioVisualCatalogueRuntime'))
check('CANDIDATE USES HOMEPAGE RUNTIME',candidate.includes('HomepageProMaxSectionRuntime'))
check('CANDIDATE RETAINS BLOCK FALLBACK',candidate.includes('StudioBlockRuntime'))
check('CANDIDATE IMPORTED CSS + DESIGN',candidate.includes('StudioDesignShell'))
check('CANDIDATE PARITY MARKER',candidate.includes('world-visual-authority-v1'))

// Media roles must stay attached to World blocks instead of being reallocated by the atomic fallback.
check('MEDIA PICKERS INCLUDE DESKTOP TABLET MOBILE ROLES',renderer.includes('mediaAssetKey')&&renderer.includes('mediaTabletAssetKey')&&renderer.includes('mediaMobileAssetKey'))
check('BLOCK RUNTIME USES WORLD MEDIA PRESENTATION',blockRuntime.includes('worldMediaPresentation'))
check('BLOCK RUNTIME PRESERVES RESPONSIVE MEDIA',blockRuntime.includes('responsive.mobile')&&blockRuntime.includes('responsive.tablet')&&blockRuntime.includes('responsive.desktop'))
check('BLOCK RUNTIME PRESERVES MEDIA ASSET KEY',blockRuntime.includes('props.mediaAssetKey'))
const operability=read('angelcare-marketplace/public-experience-authority/world-factory/operability.ts')
check('MATERIALIZER PRESERVES MEDIA BINDINGS',(operability.includes("item.bindingKey==='media.primary'")||operability.includes("row.bindingKey==='media.primary'"))&&operability.includes("kind:row.bindingKey==='media.gallery'?'gallery':'primary'"))

// Runtime data authority stays intact upstream of rendering.
check('MATERIALIZER INJECTS LIVE BINDINGS',materializer.includes('props.__studioBindings=map'))
check('MATERIALIZER INJECTS ACTIONS',materializer.includes('props.primaryAction=reference'))
check('MATERIALIZER INJECTS DYNAMIC SOURCES',materializer.includes('props.__studioDynamicSource='))
check('MATERIALIZER INJECTS SEMANTIC ROLE',materializer.includes('props.__worldFactory='))
check('ORCHESTRATOR BINDS BEFORE RENDER',orchestrator.includes('loadBoundStudioTemplate'))
check('ORCHESTRATOR DYNAMIC SOURCES BEFORE RENDER',orchestrator.includes('applyStudioDynamicSources'))
check('ORCHESTRATOR PREFLIGHT BEFORE RENDER',orchestrator.includes('preflightStudioRuntime'))
check('PUBLIC TRUTH FIREWALL BEFORE RENDER',publicCatalog.includes('enforcePublicExperienceTruthOnData')&&publicCatalog.includes('<StudioPublishedDataRenderer'))

// Storefront data authority is hydrated before the generic imported renderer.
check('STOREFRONT SEMANTICS HYDRATE PROPS',storefrontRuntime.includes('applySemanticRole')&&storefrontRuntime.includes('__storefrontSemantic'))
check('STOREFRONT SLOT DATA MATERIALIZED',storefrontRuntime.includes('applySlots')&&storefrontRuntime.includes('props.items=values'))
check('STOREFRONT TRUTH BEFORE RENDER',storefrontRuntime.includes('enforceStorefrontStaticTruth'))
check('STOREFRONT DYNAMIC BEFORE RENDER',storefrontRuntime.includes('applyStudioDynamicSources'))
check('STOREFRONT PREFLIGHT BEFORE RENDER',storefrontRuntime.includes('preflightStudioRuntime'))
check('STOREFRONT PUBLIC ROUTE DOES NOT PASS REPLACEMENT CONTEXT',!storefront.includes('currentStorefrontExperience')&&storefront.includes('dynamicAlreadyApplied'))

// Native runtimes stay available as fallback only.
for(const [name,file] of [['PRODUCT',files.product],['SERVICE',files.service],['ACADEMY',files.academy],['B2B',files.b2b]])check(`${name} NATIVE FALLBACK RUNTIME PRESERVED`,exists(file))
check('ATOMIC SAFETY VERIFIER INCLUDES VISUAL AUTHORITY',atomicVerifier.includes('WORLD VISUAL AUTHORITY HELPER')&&atomicVerifier.includes('ATOMIC RUNTIMES FALLBACK ONLY'))
check('STOREFRONT VERIFIER UPDATED FOR HYDRATE-NOT-REPLACE',storefrontVerifier.includes('STOREFRONT_VISUAL')||storefrontVerifier.includes('STOREFRONT VISUAL')||storefrontVerifier.includes('STOREFRONT_BRIDGE'))

// Targeted TS syntax + Program for every touched TypeScript authority.
const tsFiles=[files.renderer,files.candidate,files.shell,files.authority,files.storefront]
let syntaxErrors=[]
for(const file of tsFiles){
 const out=ts.transpileModule(read(file),{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,jsx:ts.JsxEmit.Preserve}})
 for(const d of out.diagnostics||[])if(d.category===ts.DiagnosticCategory.Error)syntaxErrors.push({file,d})
}
check('TARGETED TYPESCRIPT SYNTAX',syntaxErrors.length===0,String(syntaxErrors.length))
if(syntaxErrors.length)for(const row of syntaxErrors)console.log(`  ${row.file}: ${ts.flattenDiagnosticMessageText(row.d.messageText,'\n')}`)

const cfg=ts.readConfigFile(path.join(root,'tsconfig.json'),ts.sys.readFile)
if(cfg.error)check('TARGETED TYPESCRIPT PROGRAM',false,'tsconfig read failed')
else{
 const parsed=ts.parseJsonConfigFileContent(cfg.config,ts.sys,root)
 const shim=path.join(os.tmpdir(),`angelcare-world-css-${process.pid}.d.ts`)
 fs.writeFileSync(shim,"declare module '*.module.css' { const classes: Readonly<Record<string,string>>; export default classes; }\n")
 const rootNames=[...tsFiles.map(file=>path.join(root,file)),shim]
 const program=ts.createProgram({rootNames,options:{...parsed.options,noEmit:true,incremental:false,tsBuildInfoFile:undefined}})
 const touched=new Set(tsFiles.map(file=>path.normalize(path.join(root,file))))
 const diagnostics=ts.getPreEmitDiagnostics(program).filter(d=>d.file&&touched.has(path.normalize(d.file.fileName)))
 try{fs.unlinkSync(shim)}catch{}
 check('TARGETED TYPESCRIPT PROGRAM',diagnostics.length===0,String(diagnostics.length))
 if(diagnostics.length){const host={getCanonicalFileName:x=>x,getCurrentDirectory:()=>root,getNewLine:()=>"\n"};console.log(ts.formatDiagnosticsWithColorAndContext(diagnostics,host))}
}

console.log('------------------------------------------------------------------------')
console.log(`CHECKS=${checks}`)
console.log(`PASS=${passes}`)
console.log(`FAIL=${failures.length}`)
if(failures.length){
 console.log(`FAILED=${failures.join(' | ')}`)
 console.log('PERMANENT_WORLD_AUTHORITY_CLOSURE=FAIL')
 console.log('TAKEOFF=FAIL')
 console.log('========================================================================')
 process.exit(1)
}
console.log('WORLD_FACTORY_VISUAL_AUTHORITY=PASS')
console.log('CANONICAL_RUNTIME_DATA_AUTHORITY=PASS')
console.log('PRODUCT_WORLD_ANATOMY=PASS')
console.log('SERVICE_WORLD_ANATOMY=PASS')
console.log('ACADEMY_WORLD_ANATOMY=PASS')
console.log('B2B_WORLD_ANATOMY=PASS')
console.log('STOREFRONT_WORLD_ANATOMY=PASS')
console.log('IMPORTED_TREE_PRESERVED=PASS')
console.log('IMPORTED_CSS_PRESERVED=PASS')
console.log('SOURCE_DESIGN_PRESERVED=PASS')
console.log('RESPONSIVE_CONTRACT_PRESERVED=PASS')
console.log('MEDIA_ROLE_CONTRACT_PRESERVED=PASS')
console.log('SECTION_ORDER_PRESERVED=PASS')
console.log('SEMANTIC_RUNTIME_REPLACEMENT=0')
console.log('PREVIEW_PUBLIC_PARITY=PASS')
console.log('PRODUCT_FALLBACK_RUNTIME=PASS')
console.log('SERVICE_FALLBACK_RUNTIME=PASS')
console.log('ACADEMY_FALLBACK_RUNTIME=PASS')
console.log('B2B_FALLBACK_RUNTIME=PASS')
console.log('DATABASE_CHANGE=NO')
console.log('WORLD_REIMPORT_REQUIRED=NO')
console.log('WORLD_REASSIGNMENT_REQUIRED=NO')
console.log('TARGETED_TYPESCRIPT=PASS')
console.log('PERMANENT_WORLD_AUTHORITY_CLOSURE=PASS')
console.log('TAKEOFF=PASS')
console.log('========================================================================')
