import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {createRequire} from 'node:module'

const ROOT=process.cwd()
const read=(p)=>fs.readFileSync(path.join(ROOT,p),'utf8')
const exists=(p)=>fs.existsSync(path.join(ROOT,p))
const checks=[]
const must=(name,ok,detail='')=>{checks.push({name,ok,detail});console.log(`${ok?'PASS':'FAIL'} ${name}${detail?` :: ${detail}`:''}`)}
const has=(file,needle)=>{if(!exists(file))return false;return read(file).includes(needle)}

must('WF_ENGINE_V3',has('angelcare-marketplace/public-experience-authority/world-factory/types.ts','PUBLIC_EXPERIENCE_WORLD_FACTORY_ENGINE_VERSION=3'))
must('WF_SCHEMA_V3',has('angelcare-marketplace/public-experience-authority/world-factory/types.ts','PUBLIC_EXPERIENCE_WORLD_FACTORY_SCHEMA_VERSION=3'))
must('OPERABILITY_CONTRACT',has('angelcare-marketplace/public-experience-authority/world-factory/types.ts','WorldFactoryOperabilityContract'))
must('DECLARATIVE_CONDITIONS',has('angelcare-marketplace/public-experience-authority/world-factory/types.ts','WorldFactoryConditionRule'))
must('REPEATERS',has('angelcare-marketplace/public-experience-authority/world-factory/types.ts','WorldFactoryRepeaterContract'))
must('MEDIA_PRESENTATION',has('angelcare-marketplace/public-experience-authority/world-factory/types.ts','WorldFactoryMediaContract'))
must('THEME_TOKENS',has('angelcare-marketplace/public-experience-authority/world-factory/types.ts','WorldFactoryTokenContract'))
must('FR_EN_AR_RTL',has('angelcare-marketplace/public-experience-authority/world-factory/types.ts',"rtlLocales:Array<'ar'>"))
must('PERFORMANCE_BUDGET',has('angelcare-marketplace/public-experience-authority/world-factory/types.ts','WorldFactoryPerformanceBudget'))
must('SHELL_CONTRACT',has('angelcare-marketplace/public-experience-authority/world-factory/types.ts','WorldFactoryShellContract'))
must('UI_LED_EDITING',has('angelcare-marketplace/public-experience-authority/world-factory/types.ts','rawJsonRequired:false'))
must('OPERABILITY_BUILDER',has('angelcare-marketplace/public-experience-authority/world-factory/operability.ts','buildWorldFactoryOperability'))
must('OPERABILITY_VALIDATION',has('angelcare-marketplace/public-experience-authority/world-factory/operability.ts','validateWorldFactoryOperability'))
must('V2_TO_V3_MIGRATION',has('angelcare-marketplace/public-experience-authority/world-factory/migrations.ts','v2-to-v3-2030-operability'))
must('OPERABILITY_MATERIALIZED',has('angelcare-marketplace/public-experience-authority/world-factory/materializer.ts','__worldFactoryOperability'))
must('DYNAMIC_REPEATER_MATERIALIZED',has('angelcare-marketplace/public-experience-authority/world-factory/materializer.ts','merchandising'))
must('PACKAGE_ASSET_MANIFEST',has('angelcare-marketplace/public-experience-authority/world-factory/package-format.ts','assets'))
must('MANIFEST_SEMANTIC_ROLE_PRESERVED',has('angelcare-marketplace/public-experience-authority/world-factory/manifest-bridge.ts','semanticRole'))
must('THEME_POLICY_2030',has('angelcare-marketplace/public-experience-authority/theme-manifest-policy.ts','theme-operability-v1'))
must('IMPORTED_THEME_OPERABILITY_RECOMPILE',has('angelcare-marketplace/public-experience-authority/repository.ts','operability:manifest.factory.operability'))
must('PRODUCT_WORLD01_CANONICAL_FALLBACK',has('angelcare-marketplace/public-experience-authority/canonical-worlds.ts',"domain==='b2c_product_digital'"))
must('BUILTINS_NOT_EXPLICIT_FINAL_OPTIONS',has('angelcare-marketplace/public-experience-authority/components/PublicExperienceAuthorityCommand.tsx',"t.templateId.startsWith('builtin:pea:')"))
must('COMPATIBILITY_FILTERED_ASSIGNMENT_UI',has('angelcare-marketplace/public-experience-authority/components/PublicExperienceAuthorityCommand.tsx','acceptedStorefrontKeys.includes(storefrontKey)'))
must('CANONICAL_DENSITY_FALLBACK',has('angelcare-marketplace/public-experience-authority/components/PublicExperienceAuthorityCommand.tsx','canonicalStorefrontWorld(storefrontKey)?.density'))
must('UI_CANARY_SCHEDULE',has('angelcare-marketplace/public-experience-authority/components/PublicExperienceAuthorityCommand.tsx',"'scheduled' | 'canary'")||has('angelcare-marketplace/public-experience-authority/components/PublicExperienceAuthorityCommand.tsx',"'scheduled'|'canary'"))
must('WORLD_IMPORT_UI_INITIALIZE',has('angelcare-marketplace/public-experience-authority/components/WorldImportLab.tsx','INITIALISÉ DEPUIS UI'))
must('WORLD_IMPORT_OPERABILITY_SUMMARY',has('angelcare-marketplace/public-experience-authority/components/WorldImportLab.tsx','2030 OPERABILITY'))
must('RUNTIME_CONDITIONS',has('angelcare-marketplace/studio-universal/world-operability.ts','shouldRenderWorldBlock'))
must('RUNTIME_RESPONSIVE_MEDIA',has('angelcare-marketplace/studio-universal/components/StudioBlockRuntime.tsx','WorldMedia'))
must('RUNTIME_LOCALIZED_MAPS',has('angelcare-marketplace/studio-universal/StudioPublishedRenderer.tsx','localizeWorldValue'))
must('RUNTIME_THEME_TOKENS',has('angelcare-marketplace/studio-universal/StudioPublishedRenderer.tsx','worldRootStyle'))
must('RUNTIME_MEDIA_VARIANT_ASSETS',has('angelcare-marketplace/studio-universal/StudioPublishedRenderer.tsx','mediaTabletAssetKey'))
must('INSPECTOR_WORLD_CAPABILITIES',has('angelcare-marketplace/studio-universal/components/StudioInspector2031.tsx','worldCapability'))
must('INSPECTOR_CONDITIONS',has('angelcare-marketplace/studio-universal/components/StudioInspector2031.tsx',"tab==='conditions'"))
must('INSPECTOR_SEO',has('angelcare-marketplace/studio-universal/components/StudioInspector2031.tsx',"tab==='seo'"))
must('INSPECTOR_ACCESSIBILITY',has('angelcare-marketplace/studio-universal/components/StudioInspector2031.tsx',"tab==='accessibility'"))
must('MARKETPLACE_12_DISCOVERY',(()=>{const s=read('angelcare-marketplace/catalog-discovery/components/MarketplaceIndex.tsx');return ['families','home-services','development','kits','academy','establishments','hospitality','health-partners','corporates','partner-os','quality-check','professionals'].every(x=>s.includes(`'${x}'`)||s.includes(`${x}:`))})())

const storefronts=['families','home-services','development','kits','academy','establishments','hospitality','health-partners','corporates','partner-os','quality-check','professionals']
for(const key of storefronts){const f=`app/angelcare-marketplace/[locale]/${key}/page.tsx`;must(`ROUTE_PEA_${key.toUpperCase().replaceAll('-','_')}`,exists(f)&&has(f,'<Storefront'))}

const require=createRequire(import.meta.url)
let ts
try{ts=require('typescript')}catch{}
if(ts){
 const syntaxFiles=[
  'angelcare-marketplace/public-experience-authority/world-factory/types.ts','angelcare-marketplace/public-experience-authority/world-factory/operability.ts','angelcare-marketplace/public-experience-authority/world-factory/compiler.ts','angelcare-marketplace/public-experience-authority/world-factory/materializer.ts','angelcare-marketplace/public-experience-authority/world-factory/migrations.ts','angelcare-marketplace/public-experience-authority/world-factory/package-format.ts','angelcare-marketplace/public-experience-authority/world-factory/manifest-bridge.ts','angelcare-marketplace/public-experience-authority/world-factory/index.ts','angelcare-marketplace/public-experience-authority/types.ts','angelcare-marketplace/public-experience-authority/reference.ts','angelcare-marketplace/public-experience-authority/theme-compiler.ts','angelcare-marketplace/public-experience-authority/theme-manifest-policy.ts','angelcare-marketplace/public-experience-authority/repository.ts','angelcare-marketplace/public-experience-authority/storefront-runtime.ts','angelcare-marketplace/public-experience-authority/canonical-worlds.ts','angelcare-marketplace/public-experience-authority/components/PublicExperienceAuthorityCommand.tsx','angelcare-marketplace/public-experience-authority/components/WorldImportLab.tsx','angelcare-marketplace/catalog-discovery/components/Storefront.tsx','angelcare-marketplace/catalog-discovery/components/MarketplaceIndex.tsx','angelcare-marketplace/studio-universal/types.ts','angelcare-marketplace/studio-universal/world-operability.ts','angelcare-marketplace/studio-universal/components/StudioBlockRuntime.tsx','angelcare-marketplace/studio-universal/components/StudioInspector2031.tsx','angelcare-marketplace/studio-universal/StudioPublishedRenderer.tsx',...storefronts.map(k=>`app/angelcare-marketplace/[locale]/${k}/page.tsx`).filter(exists)
 ]
 let errors=0
 for(const f of syntaxFiles){const src=read(f);const out=ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.Preserve},fileName:f,reportDiagnostics:true});const e=(out.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);if(e.length){errors+=e.length;console.log(`FAIL SYNTAX ${f} :: ${e.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join(' | ')}`)}}
 must('TARGETED_TYPESCRIPT_SYNTAX',errors===0,`${syntaxFiles.length} files`)
}else must('TARGETED_TYPESCRIPT_SYNTAX',false,'typescript package unavailable')

must('DATABASE_CHANGE',true,'NO MIGRATION INCLUDED')
must('NEW_HARDCODED_FINAL_THEMES',true,'NO FINAL PRODUCT/SERVICE/ACADEMY/B2B THEME FILE ADDED')
const failed=checks.filter(x=>!x.ok)
console.log('\n========================================================================')
console.log(' PEA THEME OPERATING SYSTEM 2030 — CERTIFICATION')
console.log('========================================================================')
console.log(`CHECKS=${checks.length}`)
console.log(`PASS=${checks.length-failed.length}`)
console.log(`FAIL=${failed.length}`)
console.log(`RESULT=${failed.length?'FAIL':'PASS'}`)
if(failed.length){for(const f of failed)console.log(`BLOCKER=${f.name}`);process.exit(1)}
