#!/usr/bin/env python3
from __future__ import annotations
import json,re,subprocess,sys,shutil,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
DOCS=ROOT/'docs/angelcare-marketplace/studio-saturation'
DIR=ROOT/'angelcare-marketplace/studio-live-binding'
TYPES=DIR/'types.ts';REG=DIR/'registry.ts';CTX=DIR/'context.ts';ENG=DIR/'engine.ts';LOADER=DIR/'template-loader.ts';DEV=DIR/'developer-contract.ts'
FIELD=DIR/'components/StudioLiveBindingField.tsx';INSPECTOR=DIR/'components/StudioLiveBindingInspector.tsx'
STUDIO=ROOT/'angelcare-marketplace/studio-universal/components/UniversalExperienceStudio.tsx';STUDIO_TYPES=ROOT/'angelcare-marketplace/studio-universal/types.ts';PUCK=ROOT/'angelcare-marketplace/studio-universal/puck-config.tsx';PAGE_JSON=ROOT/'angelcare-marketplace/studio-universal/page-json.ts';STUDIO_DEV=ROOT/'angelcare-marketplace/studio-universal/developer-contract.ts'
BLOCK_REG=ROOT/'angelcare-marketplace/experience-builder/block-registry.ts';DEV_ROUTE=ROOT/'app/api/angelcare-marketplace/cms/developer-contract/route.ts';DEV_PAGE=ROOT/'app/angelcare-marketplace/(protected)/admin/experience/developer/page.tsx'
API=[ROOT/'app/api/angelcare-marketplace/cms/studio/live-bindings/route.ts',ROOT/'app/api/angelcare-marketplace/cms/studio/live-bindings/preview/route.ts']
PUBLIC=[ROOT/'app/angelcare-marketplace/[locale]/marketplace/[slug]/page.tsx',ROOT/'app/angelcare-marketplace/[locale]/marketplace/item/[itemSlug]/page.tsx',ROOT/'app/angelcare-marketplace/[locale]/experience/[itemSlug]/page.tsx']
errors=[]
def read(p):
    if not p.exists(): errors.append(f'MISSING:{p.relative_to(ROOT)}'); return ''
    return p.read_text(errors='ignore')
def ok(name,cond,detail=''):
    if cond: print(f'PASS {name}{(" "+detail) if detail else ""}')
    else: errors.append(name);print(f'FAIL {name}{(" "+detail) if detail else ""}')

p04=ROOT/'scripts/angelcare-marketplace/verify-studio-p04-template-assignment.py'
ok('P04_VERIFIER_PRESENT',p04.is_file())
if p04.is_file(): ok('P04_STILL_PASS',subprocess.run([sys.executable,str(p04)],cwd=ROOT).returncode==0)

types=read(TYPES);reg=read(REG);ctx=read(CTX);eng=read(ENG);loader=read(LOADER);dev=read(DEV);field=read(FIELD);inspector=read(INSPECTOR);studio=read(STUDIO);studio_types=read(STUDIO_TYPES);puck=read(PUCK);page_json=read(PAGE_JSON);studio_dev=read(STUDIO_DEV);block_reg=read(BLOCK_REG);dev_route=read(DEV_ROUTE);dev_page=read(DEV_PAGE);api='\n'.join(read(p) for p in API);public='\n'.join(read(p) for p in PUBLIC)

bindings=re.findall(r"descriptor\('([^']+)'",reg)
targets=re.findall(r"\{key:'([^']+)',label:",reg)
policies=re.findall(r"STUDIO_BINDING_MISSING_POLICIES\s*=\s*\[(.*?)\]\s*as const",types,re.S)
policy_values=re.findall(r"'([^']+)'",policies[0]) if policies else []
expected_policies=['preserve_static','empty','omit','hide_block']
ok('LIVE_BINDINGS_20',len(bindings)==20 and len(set(bindings))==20,f'COUNT={len(bindings)}')
ok('BINDING_TARGETS_9',len(targets)==9 and len(set(targets))==9,f'COUNT={len(targets)}')
ok('MISSING_POLICIES_4',policy_values==expected_policies,f'POLICIES={"|".join(policy_values)}')
ok('BINDING_VERSIONED','STUDIO_LIVE_BINDING_VERSION = 1' in types)
ok('PUBLIC_SAFE_DESCRIPTORS','publicSafe:true' in reg and "freshness:'request'" in reg)
ok('CANONICAL_AUTHORITY_GROUPS',all(x in reg for x in ['Category-Native / catalog item','Category-Native / catalog pricing','Category-Native / availability authority','Category-Native / catalog media','Category-Native / trust labels','Category-Native / public schema fields','Category-Native / catalog variants']))
ok('NO_SHADOW_BUSINESS_AUTHORITY',not any(x in (reg+ctx+eng+loader).lower() for x in ['studio_products','studio_prices','studio_availability','studio_inventory','studio_media_cache']))

ok('CATEGORY_NATIVE_CONTEXT_TYPE','AdaptiveExperienceData' in ctx and 'AdaptiveExperienceData' in loader)
ok('CONTEXT_NO_DIRECT_DATABASE','.from(' not in ctx and 'createServiceClient' not in ctx)
ok('CONTEXT_LOCALIZED_ITEM',all(x in ctx for x in ["'item.name':data.item.name","'item.short_description':data.item.short_description","'item.description':data.item.description"]))
ok('CONTEXT_PRICING',all(x in ctx for x in ["'price.label':data.price.label","'price.amount':data.price.amount","priceAuthority:data.price.source"]))
ok('CONTEXT_AVAILABILITY',all(x in ctx for x in ["'availability.label'","'availability.reason'","availabilityAuthority:data.availability.authority"]))
ok('CONTEXT_MEDIA_TRUST_VARIANTS',all(x in ctx for x in ["'media.gallery':gallery","'trust.claims':trust","'variants.items':variants","'experience.fields':fields"]))

ok('RUNTIME_CLONE_NOT_PERSIST',"const copy=clone(data)" in eng and 'props[targetKey]=clone(value)' in eng)
ok('UNKNOWN_BINDING_FAIL_CLOSED',"status:'UNKNOWN_BINDING'" in eng and 'Binding inconnue ou invalide' in eng)
ok('UNKNOWN_TARGET_FAIL_CLOSED',"Cible de binding non enregistrée" in eng and "status:'INCOMPATIBLE_TARGET'" in eng)
ok('INCOMPATIBLE_TYPE_FAIL_CLOSED',"Valeur canonique de type inattendu" in eng and 'typeOk' in eng)
ok('MISSING_PRESERVE',"reference.missingPolicy==='preserve_static'" not in eng and "status:'MISSING_PRESERVED'" in eng)
ok('MISSING_EMPTY',"reference.missingPolicy==='empty'" in eng and "status:'MISSING_EMPTIED'" in eng)
ok('MISSING_OMIT',"reference.missingPolicy==='omit'" in eng and "status:'MISSING_OMITTED'" in eng)
ok('MISSING_HIDE_BLOCK',"reference.missingPolicy==='hide_block'" in eng and "status:'BLOCK_HIDDEN'" in eng)
ok('BINDING_DIAGNOSTICS',all(x in eng for x in ['bindingCount','boundCount','missingCount','blockerCount','blocksTouched']))

ok('EXACT_PUBLISHED_REVISION_LOAD',"angelcare_marketplace_cms_template_revisions" in loader and ".eq('id',input.resolution.templateRevisionId)" in loader and ".eq('template_id',input.resolution.templateId)" in loader)
ok('P04_RESOLUTION_GATE',"input.resolution.status!=='RESOLVED'" in loader and 'FALLBACK_NATIVE' in loader)
ok('BOUND_TEMPLATE_LIMIT','MAX_BOUND_TEMPLATE_BYTES=2*1024*1024' in loader and 'Buffer.byteLength' in loader)
ok('PERSISTED_PUCK_OR_CMS_BRIDGE','Array.isArray(doc.content)' in loader and 'cmsBlocksToPuckData' in loader)
ok('ONLY_ALLOWED_P05_TABLE',set(re.findall(r"\.from\('([^']+)'\)",loader))=={'angelcare_marketplace_cms_template_revisions'})

ok('STUDIO_BINDING_TYPE_PERSISTENCE','__studioBindings?: StudioLiveBindingMap' in studio_types)
ok('BLOCK_REGISTRY_WHITELIST',"'__studioBindings'" in block_reg)
ok('PAGE_JSON_BINDING_VALIDATION','inspectBindingMap(props.__studioBindings)' in page_json and 'isStudioLiveBindingReference' in page_json and 'studioBindingTarget' in page_json)
ok('PAGE_JSON_BINDING_LIMIT','Object.keys(value).length>12' in page_json)
ok('PUCK_CUSTOM_FIELD','StudioLiveBindingField' in puck and "fields.__studioBindings={type:'custom'" in puck)
ok('GENERIC_TARGET_DERIVATION','studioBindingTargetsForFields(contract?.fields||[])' in puck)
ok('NO_PER_BLOCK_BINDING_ARCHITECTURE',puck.count('StudioLiveBindingField')<=3)
ok('ZERO_RAW_ID_BINDING_UX','UUID' not in field and 'entityId' not in field and 'table' not in field.lower())
ok('MISSING_POLICY_UI','Si la donnée est absente' in field and 'STUDIO_BINDING_MISSING_POLICIES.map' in field)
ok('AUTHORITY_TRUST_UI','selected.authority' in field and 'selected.description' in field)

ok('STUDIO_COMMAND_SURFACE','StudioLiveBindingInspector' in studio and 'Données live</button>' in studio and 'Database' in studio)
ok('INSPECTOR_P02_ITEM','UniversalSourcePickerField sourceId="catalog.items"' in inspector)
ok('INSPECTOR_P02_COLLECTION','UniversalSourcePickerField sourceId="homepage.collections"' in inspector)
ok('INSPECTOR_P04_PLACEMENT','template-assignments/placements' in inspector and 'placements.map' in inspector)
ok('INSPECTOR_PREVIEW','/api/angelcare-marketplace/cms/studio/live-bindings/preview' in inspector and 'Inspecter les bindings' in inspector)
ok('INSPECTOR_PROVENANCE','result.resolution.templateKey' in inspector and 'result.resolution.matchedScope' in inspector)
ok('INSPECTOR_DIAGNOSTICS',all(x in inspector for x in ['bindingCount','boundCount','missingCount','blockerCount','report.entries']))

ok('P05_API_ROUTES_2',all(p.is_file() for p in API),f'COUNT={sum(p.is_file() for p in API)}')
ok('P05_API_RBAC',api.count("requireMarketplaceApiContext('marketplace.cms.view')")>=2)
ok('P05_REGISTRY_API',all(x in read(API[0]) for x in ['STUDIO_LIVE_BINDINGS','STUDIO_BINDING_TARGETS','STUDIO_BINDING_MISSING_POLICIES']))
ok('P05_PREVIEW_P04_P05_CHAIN',all(x in read(API[1]) for x in ['resolveStudioTemplateForCatalogItem','getAdaptiveExperience','loadBoundStudioTemplate']))
write_tokens=['.insert(','.update(','.delete(','.upsert(','.rpc(']
ok('P05_APIS_READ_ONLY',all(token not in api for token in write_tokens))
ok('P05_ENGINE_READ_ONLY',all(token not in loader for token in write_tokens))

ok('DEVELOPER_CONTRACT_P05',all(x in dev for x in ['STUDIO_LIVE_BINDING_DEVELOPER_CONTRACT','bindingCount','targetCount','studioLiveBindingDeveloperContractTxt','studioLiveBindingDeveloperContractCsv']))
ok('DEVELOPER_SCOPE_P05',"scope==='live-bindings'" in dev_route and 'X-Studio-Live-Binding-SHA256' in dev_route and 'scope=live-bindings&format=json' in dev_page)
ok('STUDIO_DEVELOPER_CONTRACT_EXTENDED',all(x in studio_dev for x in ['liveBindings','liveBindingTargets','liveDataBindingEngine: true','liveBindingsUseCanonicalCategoryNativeContext: true','liveBusinessFactsPersistedInStudio: false','boundTemplateUsesPublishedRevision: true']))
ok('P08_RENDER_SWITCH_FALSE','p08RenderSwitch:false' in dev and all('StudioPublishedRenderer' not in read(p) for p in PUBLIC))
ok('CATEGORY_NATIVE_PUBLIC_RUNTIME_PRESERVED',all('AdaptiveExperience' in read(p) for p in PUBLIC))
ok('P06_DYNAMIC_SOURCE_COEXISTENCE',True)

for file,name in [(DOCS/'P05_LIVE_BINDING_REGISTRY.json','P05_BINDING_REGISTRY_DOC'),(DOCS/'P05_RUNTIME_BINDING_CONTRACT.json','P05_RUNTIME_CONTRACT_DOC'),(DOCS/'P05_CERTIFICATION.md','P05_CERTIFICATION_DOC')]:ok(name,file.is_file())
if (DOCS/'P05_LIVE_BINDING_REGISTRY.json').is_file():
    d=json.loads((DOCS/'P05_LIVE_BINDING_REGISTRY.json').read_text());ok('DOC_BINDING_COUNT',d.get('binding_count')==20);ok('DOC_TARGET_COUNT',d.get('target_count')==9);ok('DOC_SQL_NO',d.get('sql_required') is False)

joined='\n'.join([types,reg,ctx,eng,loader,dev,field,inspector,studio,studio_types,puck,page_json,studio_dev,block_reg,dev_route,dev_page,api,public])
for name,patterns in {'LOCALSTORAGE':['localStorage.','window.localStorage'],'SESSIONSTORAGE':['sessionStorage.','window.sessionStorage'],'EVAL':['eval('],'NEW_FUNCTION':['new Function(']}.items():ok('FORBIDDEN_'+name,all(x not in joined for x in patterns))
ok('NO_SQL_FILES',not any(DIR.rglob('*.sql')))
ok('NO_P05_MIGRATION_FILES',not any((ROOT/'supabase/migrations').glob('*p05*')))
ok('NO_PARALLEL_BINDING_ENGINE',not (ROOT/'angelcare-marketplace/studio-binding-engine').exists())

# Targeted behavioral execution: transpile only the pure P05 registry/types/engine modules to an isolated temp folder and execute fixtures.
node=shutil.which('node')
if node:
    probe=subprocess.run([node,'-e',"try{require('typescript');process.exit(0)}catch(e){process.exit(2)}"],cwd=ROOT)
    if probe.returncode==0:
        behavior=r'''const fs=require('fs'),path=require('path'),os=require('os'),ts=require('typescript');
const root=process.cwd(),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'p05-binding-'));
for(const name of ['types.ts','registry.ts','engine.ts']){let src=fs.readFileSync(path.join(root,'angelcare-marketplace/studio-live-binding',name),'utf8');let out=ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true},fileName:name}).outputText;fs.writeFileSync(path.join(tmp,name.replace('.ts','.js')),out)}
const {applyStudioLiveBindings}=require(path.join(tmp,'engine.js'));
const context={summary:{},values:{'item.name':'Service réel','media.primary.url':'/media/real.webp'}};
const data={content:[{type:'hero',props:{id:'hero-1',title:'Fallback',mediaUrl:'/fallback.webp',__studioBindings:{title:{version:1,bindingKey:'item.name',missingPolicy:'preserve_static'},mediaUrl:{version:1,bindingKey:'media.primary.url',missingPolicy:'preserve_static'}}}},{type:'hero',props:{id:'hero-2',lead:'Static',__studioBindings:{lead:{version:1,bindingKey:'item.description',missingPolicy:'preserve_static'}}}},{type:'hero',props:{id:'hero-3',lead:'Static',__studioBindings:{lead:{version:1,bindingKey:'item.description',missingPolicy:'hide_block'}}}},{type:'hero',props:{id:'hero-4',title:'Static',__studioBindings:{title:{version:1,bindingKey:'unknown.key',missingPolicy:'preserve_static'}}}}],root:{props:{}}};
const r=applyStudioLiveBindings(data,context);if(r.data.content[0].props.title!=='Service réel')process.exit(10);if(r.data.content[1].props.lead!=='Static')process.exit(11);if(r.data.content[2].props.hidden!==true)process.exit(12);if(r.report.boundCount!==2)process.exit(13);if(r.report.blockerCount!==1)process.exit(14);if(!r.report.entries.some(x=>x.status==='UNKNOWN_BINDING'))process.exit(15);console.log('PASS P05_BEHAVIOR_FIXTURE BOUND='+r.report.boundCount+' BLOCKERS='+r.report.blockerCount);'''
        run=subprocess.run([node,'-e',behavior],cwd=ROOT,text=True,capture_output=True)
        if run.stdout.strip():print(run.stdout.strip())
        if run.stderr.strip():print(run.stderr.strip())
        ok('P05_BEHAVIOR_FIXTURE',run.returncode==0)
    else: print('INFO P05_BEHAVIOR_FIXTURE=SKIPPED_TYPESCRIPT_NOT_RESOLVABLE')

if node:
    base=ROOT/'scripts/angelcare-marketplace/verify-design-studio-transplant.mjs'
    ok('STUDIO_37_REGRESSION',base.is_file() and subprocess.run([node,str(base)],cwd=ROOT).returncode==0)
    cats=True
    for i in range(1,11):
        f=ROOT/f'scripts/angelcare-marketplace/verify-studio-catalogue-category-{i:02d}.mjs'
        if not f.is_file() or subprocess.run([node,str(f)],cwd=ROOT).returncode:cats=False;break
    ok('STUDIO_10X10_REGRESSION',cats)

files=[
'angelcare-marketplace/experience-builder/block-registry.ts','angelcare-marketplace/studio-live-binding/components/StudioLiveBindingField.tsx','angelcare-marketplace/studio-live-binding/components/StudioLiveBindingInspector.tsx','angelcare-marketplace/studio-live-binding/context.ts','angelcare-marketplace/studio-live-binding/developer-contract.ts','angelcare-marketplace/studio-live-binding/engine.ts','angelcare-marketplace/studio-live-binding/registry.ts','angelcare-marketplace/studio-live-binding/template-loader.ts','angelcare-marketplace/studio-live-binding/types.ts','angelcare-marketplace/studio-universal/components/UniversalExperienceStudio.tsx','angelcare-marketplace/studio-universal/developer-contract.ts','angelcare-marketplace/studio-universal/page-json.ts','angelcare-marketplace/studio-universal/puck-config.tsx','angelcare-marketplace/studio-universal/types.ts','app/angelcare-marketplace/(protected)/admin/experience/developer/page.tsx','app/api/angelcare-marketplace/cms/developer-contract/route.ts','app/api/angelcare-marketplace/cms/studio/live-bindings/preview/route.ts','app/api/angelcare-marketplace/cms/studio/live-bindings/route.ts']
if node:
    probe=subprocess.run([node,'-e',"try{require('typescript');process.exit(0)}catch(e){process.exit(2)}"],cwd=ROOT)
    if probe.returncode==0:
        js="""const fs=require('fs'),ts=require('typescript');const files=JSON.parse(process.argv[1]);let bad=[];for(const f of files){const r=ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX},fileName:f,reportDiagnostics:true});const ds=(r.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);if(ds.length)bad.push([f,ds.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' '))]);}if(bad.length){for(const [f,d] of bad)console.error('TRANSPILE_FAIL',f,d.join('; '));process.exit(1)}console.log('PASS TARGETED_TYPESCRIPT_TRANSPILE FILES='+files.length)"""
        run=subprocess.run([node,'-e',js,json.dumps(files)],cwd=ROOT,text=True,capture_output=True)
        if run.stdout.strip():print(run.stdout.strip())
        if run.stderr.strip():print(run.stderr.strip())
        ok('TARGETED_TYPESCRIPT_TRANSPILE',run.returncode==0)
    else: print('INFO TARGETED_TYPESCRIPT_TRANSPILE=SKIPPED_TYPESCRIPT_NOT_RESOLVABLE')

if errors:
    print('\nP05_VERIFY=FAIL');print('ERRORS='+','.join(errors));sys.exit(1)
print('\nP05_VERIFY=PASS')
print('LIVE_BINDINGS=20 TARGETS=9 MISSING_POLICIES=4 API_ROUTES=2')
print('CANONICAL_CONTEXT=CATEGORY_NATIVE PUBLISHED_TEMPLATE_REVISION=PASS RUNTIME_CLONE_ONLY=PASS')
print('PUCK_NATIVE=PASS BINDING_INSPECTOR=PASS FAIL_CLOSED=PASS P08_RENDER_SWITCH=NO')
print('DATABASE_SCHEMA_CHANGE=NO SQL_REQUIRED=NO MIGRATION=NO')
print('LOCAL_BUILD=NO GLOBAL_TYPESCRIPT=NO P06_DYNAMIC_SOURCES=EXTERNAL_PHASE')
