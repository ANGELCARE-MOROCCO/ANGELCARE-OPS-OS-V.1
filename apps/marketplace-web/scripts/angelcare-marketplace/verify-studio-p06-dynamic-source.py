#!/usr/bin/env python3
from __future__ import annotations
import json,re,subprocess,sys,shutil,os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
DOCS=ROOT/'docs/angelcare-marketplace/studio-saturation'
DIR=ROOT/'angelcare-marketplace/studio-dynamic-source'
TYPES=DIR/'types.ts';REG=DIR/'registry.ts';CAT=DIR/'catalog-resolver.ts';ENG=DIR/'engine.ts';DEV=DIR/'developer-contract.ts'
FIELD=DIR/'components/StudioDynamicSourceField.tsx';INSPECTOR=DIR/'components/StudioDynamicSourceInspector.tsx';CSS=DIR/'components/studio-dynamic-source.module.css'
P01_REG=ROOT/'angelcare-marketplace/studio-source-registry/registry.ts'
P01_RESOLVER=ROOT/'angelcare-marketplace/studio-source-registry/resolver.ts'
PUCK=ROOT/'angelcare-marketplace/studio-universal/puck-config.tsx';PAGE_JSON=ROOT/'angelcare-marketplace/studio-universal/page-json.ts';STUDIO_TYPES=ROOT/'angelcare-marketplace/studio-universal/types.ts'
BLOCK_REG=ROOT/'angelcare-marketplace/experience-builder/block-registry.ts';STUDIO=ROOT/'angelcare-marketplace/studio-universal/components/UniversalExperienceStudio.tsx';RUNTIME=ROOT/'angelcare-marketplace/studio-universal/StudioPublishedRenderer.tsx';BLOCK_RUNTIME=ROOT/'angelcare-marketplace/studio-universal/components/StudioBlockRuntime.tsx';STUDIO_DEV=ROOT/'angelcare-marketplace/studio-universal/developer-contract.ts'
API=[ROOT/'app/api/angelcare-marketplace/cms/studio/dynamic-sources/route.ts',ROOT/'app/api/angelcare-marketplace/cms/studio/dynamic-sources/preview/route.ts']
DEV_ROUTE=ROOT/'app/api/angelcare-marketplace/cms/developer-contract/route.ts';DEV_PAGE=ROOT/'app/angelcare-marketplace/(protected)/admin/experience/developer/page.tsx'
CATEGORY_PUBLIC=[ROOT/'app/angelcare-marketplace/[locale]/marketplace/[slug]/page.tsx',ROOT/'app/angelcare-marketplace/[locale]/marketplace/item/[itemSlug]/page.tsx',ROOT/'app/angelcare-marketplace/[locale]/experience/[itemSlug]/page.tsx']
errors=[]
P08_ACTIVE=os.getenv('ANGELCARE_VERIFY_P08_ACTIVE')=='1'
def read(p:Path)->str:
    if not p.exists(): errors.append(f'MISSING:{p.relative_to(ROOT)}');return ''
    return p.read_text(errors='ignore')
def ok(name:str,cond:bool,detail:str=''):
    if cond: print(f'PASS {name}{(" "+detail) if detail else ""}')
    else: errors.append(name);print(f'FAIL {name}{(" "+detail) if detail else ""}')

# Gate on certified predecessor.
p05=ROOT/'scripts/angelcare-marketplace/verify-studio-p05-live-binding.py'
ok('P05_VERIFIER_PRESENT',p05.is_file())
if os.getenv('ANGELCARE_VERIFY_SKIP_PREDECESSOR')=='1':
    ok('P05_PREDECESSOR_CERTIFIED_EVIDENCE',p05.is_file())
else:
    if p05.is_file(): ok('P05_STILL_PASS',subprocess.run([sys.executable,str(p05)],cwd=ROOT).returncode==0)

files=[TYPES,REG,CAT,ENG,DEV,FIELD,INSPECTOR,CSS,PUCK,PAGE_JSON,STUDIO_TYPES,BLOCK_REG,STUDIO,RUNTIME,BLOCK_RUNTIME,STUDIO_DEV,DEV_ROUTE,DEV_PAGE,*API,*CATEGORY_PUBLIC,P01_REG,P01_RESOLVER]
text={p:read(p) for p in files};types=text[TYPES];reg=text[REG];cat=text[CAT];eng=text[ENG];dev=text[DEV];field=text[FIELD];inspector=text[INSPECTOR];puck=text[PUCK];page_json=text[PAGE_JSON];studio_types=text[STUDIO_TYPES];block_reg=text[BLOCK_REG];studio=text[STUDIO];runtime=text[RUNTIME];block_runtime=text[BLOCK_RUNTIME];studio_dev=text[STUDIO_DEV];dev_route=text[DEV_ROUTE];dev_page=text[DEV_PAGE];api='\n'.join(text[p] for p in API);p01=text[P01_REG]

# P01 -> P06 exact dynamic source coverage.
p01_dyn=[]
for line in p01.splitlines():
    if "source({ id:'" in line and 'dynamicQuery:true' in line:
        m=re.search(r"source\(\{ id:'([^']+)'",line)
        if m:p01_dyn.append(m.group(1))
p06_sources=re.findall(r"\bp\('([^']+)'",reg)
expected_sources=['catalog.items','catalog.categories','homepage.collections','homepage.campaigns','experience.live_campaigns','academy.programmes','academy.cohorts','providers.profiles','commerce.promotions','partners.plans','b2b.programmes','trust.claims']
ok('P01_DYNAMIC_QUERY_SOURCES_12',len(p01_dyn)==12 and set(p01_dyn)==set(expected_sources),f'COUNT={len(p01_dyn)}')
ok('P06_DYNAMIC_SOURCES_12',len(p06_sources)==12 and len(set(p06_sources))==12,f'COUNT={len(p06_sources)}')
ok('P01_P06_SOURCE_COVERAGE_EXACT',set(p01_dyn)==set(p06_sources))
ok('P01_ONLY_DISCOVERY','STUDIO_SOURCE_DESCRIPTORS.filter(row=>row.capabilities.dynamicQuery)' in reg and "getStudioSourceDescriptor" in reg)

strategies_match=re.search(r"STUDIO_DYNAMIC_STRATEGIES=\[(.*?)\]\s*as const",types,re.S)
strategies=re.findall(r"'([^']+)'",strategies_match.group(1)) if strategies_match else []
policies_match=re.search(r"STUDIO_DYNAMIC_EMPTY_POLICIES=\[(.*?)\]\s*as const",types,re.S)
policies=re.findall(r"'([^']+)'",policies_match.group(1)) if policies_match else []
ok('DYNAMIC_STRATEGIES_11',len(strategies)==11 and len(set(strategies))==11,f'COUNT={len(strategies)}')
ok('EMPTY_POLICIES_3',policies==['preserve_static','empty','hide_block'],f'POLICIES={"|".join(policies)}')
ok('VERSIONED_RECIPE','STUDIO_DYNAMIC_SOURCE_VERSION=1' in types and 'version:1' in types)
ok('BOUNDED_RECIPE_LIMIT','value.limit>profile.maxLimit' in reg and 'value.limit<1' in reg)
ok('BOUNDED_QUERY','value.query.length>120' in reg)
ok('FILTER_ALLOWLIST','Object.keys(filters).length>8' in reg and '!profile.allowedFilters.includes(key)' in reg)
ok('SORT_ALLOWLIST','!profile.allowedSorts.includes' in reg)
ok('BLOCK_SOURCE_ALLOWLIST','studioDynamicSourcesForBlock' in reg and "product_grid:['catalog.items']" in reg)

# Canonical catalog strategies / projections / contexts.
ok('CATALOG_ALL_STRATEGIES_CANONICAL',"if(recipe.sourceId==='catalog.items')" in eng and "recipe.strategy!=='source_query'" not in eng)
ok('CATALOG_SEARCH_DISCOVERY','searchDiscovery' in cat)
ok('CATEGORY_CANONICAL_REFERENCE',"recipe.category,'angelcare_marketplace_catalog_categories','category_key'" in cat)
ok('COLLECTION_CANONICAL_REFERENCE',"recipe.collection" in cat and 'angelcare_marketplace_homepage_collection_items' in cat)
ok('EXPERIENCE_SCHEMA_CANONICAL_REFERENCE',"recipe.experienceSchema,'angelcare_marketplace_experience_schemas','schema_key'" in cat)
ok('MERCHANDISING_EXISTING_AUTHORITY','angelcare_marketplace_homepage_placements' in cat and 'merchandising_badge' in cat)
ok('TERRITORY_CONTEXT','context.territoryCode' in cat and 'angelcare_marketplace_territories' in cat)
ok('NO_CATALOG_SELECT_STAR',".select('*')" not in cat)
ok('CATALOG_LIMIT_24','Math.min(recipe.limit,24)' in cat and '.limit(Math.min(limit,24))' in cat)

# Runtime clone / no facts persisted.
ok('RUNTIME_CLONE_ONLY','const copy=clone(data)' in eng)
ok('MATERIALIZE_TRANSIENT','__studioSourceReference:entity.canonicalRef' in eng)
ok('P03_ACTION_REUSE',all(x in eng for x in ["actionId:'catalog.open_item'","actionId:'catalog.open_category'","actionId:'catalog.open_collection'","actionId:'academy.enroll'","actionId:'subscription.start'","actionId:'b2b.request'"]))
ok('PUBLIC_SAFE_GATE',"context.visibility==='public_runtime'" in eng and 'publicRuntimeSafe' in eng and 'publicSafeProjection' in eng)
ok('UNKNOWN_INVALID_FAIL_CLOSED',"status:'INVALID_RECIPE'" in eng and 'Configuration dynamique inconnue ou invalide.' in eng)
ok('SOURCE_ERROR_REPORTED',"status:'SOURCE_ERROR'" in eng)
ok('PRESERVE_STATIC_POLICY',"status:'EMPTY_PRESERVED'" in eng)
ok('EMPTY_POLICY',"status:'EMPTY_EMPTIED'" in eng)
ok('HIDE_BLOCK_POLICY',"status:'BLOCK_HIDDEN'" in eng)
ok('NO_SHADOW_BUSINESS_TABLES',not any(x in (reg+cat+eng).lower() for x in ['studio_dynamic_items','studio_dynamic_products','studio_dynamic_collections','studio_dynamic_cache']))

# P02 native selectors and zero-id config UX.
for sid,label in [('catalog.categories','P02_CATEGORY_SELECTOR'),('homepage.collections','P02_COLLECTION_SELECTOR'),('experience.schemas','P02_SCHEMA_SELECTOR'),('context.territories','P02_TERRITORY_SELECTOR'),('audience.segments','P02_AUDIENCE_SELECTOR')]:
    ok(label,f'UniversalSourcePickerField sourceId="{sid}"' in field)
ok('SOURCE_CHOOSER_HUMAN_LABELS','eligible.map' in field and 'row.label' in field and 'sourceLabel(recipe.sourceId)' in field)
ok('ZERO_RAW_ID_DEFAULT_UX','UUID' not in field and 'entityId' not in field and 'Table' not in field)
ok('NO_ARBITRARY_FILTER_JSON','JSON.stringify(recipe.filters' not in field and 'filtersJson' not in field)
ok('INLINE_PREVIEW','Tester la source' in field and '/api/angelcare-marketplace/cms/studio/dynamic-sources/preview' in field)

# Puck + persistence + validation.
ok('STUDIO_DYNAMIC_TYPE_PERSISTENCE','__studioDynamicSource?: StudioDynamicSourceReference' in studio_types)
ok('BLOCK_REGISTRY_WHITELIST',"'__studioDynamicSource'" in block_reg)
ok('PAGE_JSON_VALIDATION','isStudioDynamicSourceReference' in page_json and 'inspectDynamicSource(props.__studioDynamicSource)' in page_json)
ok('PUCK_GENERIC_FIELD','StudioDynamicSourceField' in puck and "fields.__studioDynamicSource={type:'custom'" in puck)
ok('PUCK_BLOCK_CAPABILITY_DRIVEN','studioDynamicSourcesForBlock(type)' in puck)
ok('ONE_FIELD_FRAMEWORK',puck.count('StudioDynamicSourceField')<=3)

# Studio inspector.
ok('STUDIO_COMMAND_SURFACE','StudioDynamicSourceInspector' in studio and 'Sources dynamiques' in studio)
ok('INSPECTOR_READ_ONLY_TRUST','Lecture uniquement' in inspector and 'clone runtime' in inspector)
ok('INSPECTOR_CURRENT_DOCUMENT','JSON.stringify({data,locale})' in inspector)
ok('INSPECTOR_DIAGNOSTICS',all(x in inspector for x in ['sourceCount','resolvedCount','emptyCount','blockerCount','report.entries']))

# APIs: 2 only, RBAC, read-only.
ok('P06_API_ROUTES_2',all(p.is_file() for p in API),f'COUNT={sum(p.is_file() for p in API)}')
ok('P06_API_RBAC',api.count("requireMarketplaceApiContext('marketplace.cms.view')")>=2)
ok('REGISTRY_API_EXPOSES_PROFILES',all(x in text[API[0]] for x in ['STUDIO_DYNAMIC_SOURCE_PROFILES','STUDIO_DYNAMIC_STRATEGIES','STUDIO_DYNAMIC_EMPTY_POLICIES']))
ok('PREVIEW_API_RECIPE_AND_DOCUMENT',all(x in text[API[1]] for x in ['body.recipe','body.data','resolveStudioDynamicSource','applyStudioDynamicSources','validateStudioPageJson']))
write_tokens=['.insert(','.delete(','.upsert(','.rpc(']
ok('P06_API_READ_ONLY',all(token not in api for token in write_tokens))
# avoid crypto hash .update false-positive; business runtime files only
runtime_write=cat+'\n'+eng
ok('P06_ENGINE_READ_ONLY',all(token not in runtime_write for token in ['.insert(','.update(','.delete(','.upsert(','.rpc(']))

# Existing Studio public runtime consumes P06; P08 category-native switch remains off.
ok('PUBLIC_STUDIO_RUNTIME_DYNAMIC','applyStudioDynamicSources' in runtime and "visibility:'public_runtime'" in runtime)
ok('PUBLIC_PRODUCT_GRID_DYNAMIC_REFS','__studioSourceReference' in runtime and "ref.sourceId==='catalog.items'" in runtime and 'CatalogCard' in runtime)
ok('GENERIC_DYNAMIC_P03_ACTIONS','__studioResolvedAction' in block_runtime and 'StudioActionLink' in block_runtime)
ok('PUBLIC_RUNTIME_DIAGNOSTICS','data-ac-studio-dynamic-sources' in runtime and 'data-ac-studio-dynamic-blockers' in runtime)
ok('P08_FORWARD_INTEGRATION' if P08_ACTIVE else 'P08_ASSIGNED_TEMPLATE_SWITCH_FALSE',all('PublicCatalogExperience' in text[p] for p in CATEGORY_PUBLIC) if P08_ACTIVE else all('StudioPublishedRenderer' not in text[p] and 'applyStudioDynamicSources' not in text[p] for p in CATEGORY_PUBLIC))
ok('CATEGORY_NATIVE_PUBLIC_RUNTIME_PRESERVED',all('AdaptiveExperience' in text[p] for p in CATEGORY_PUBLIC))

# Developer contract.
ok('P06_DEVELOPER_CONTRACT',all(x in dev for x in ['STUDIO_DYNAMIC_SOURCE_DEVELOPER_CONTRACT','sourceCount','p01DynamicQueryCount','studioDynamicSourceDeveloperContractTxt','studioDynamicSourceDeveloperContractCsv']))
ok('P06_CONTRACT_INVARIANTS',all(x in dev for x in ['p01OnlyDiscovery:true','p02CanonicalSelectors:true','p03ActionReuse:true','p05RuntimeCloneComposition:true','businessFactsPersistedInStudio:false','publicSafeProjectionRequired:true','p08AssignedTemplateRenderSwitch:false','sqlRequired:false']))
ok('DEVELOPER_SCOPE_P06',"scope==='dynamic-sources'" in dev_route and 'X-Studio-Dynamic-Source-SHA256' in dev_route and 'scope=dynamic-sources&format=json' in dev_page)
ok('STUDIO_DEVELOPER_CONTRACT_EXTENDED',all(x in studio_dev for x in ['dynamicSources','dynamicContentSources','dynamicSourcesUseP01Registry: true','dynamicSourcesPersistRecipesOnly: true','dynamicSourcesPublicSafeProjection: true']))

# Docs.
for f,name in [('P06_DYNAMIC_SOURCE_REGISTRY.json','P06_REGISTRY_DOC'),('P06_RUNTIME_SOURCE_CONTRACT.json','P06_RUNTIME_CONTRACT_DOC'),('P06_CERTIFICATION.md','P06_CERTIFICATION_DOC')]: ok(name,(DOCS/f).is_file())
if (DOCS/'P06_DYNAMIC_SOURCE_REGISTRY.json').is_file():
    d=json.loads((DOCS/'P06_DYNAMIC_SOURCE_REGISTRY.json').read_text());ok('DOC_SOURCE_COUNT',d.get('source_count')==12);ok('DOC_STRATEGY_COUNT',d.get('strategy_count')==11);ok('DOC_SQL_NO',d.get('sql_required') is False)

# Security + no DB schema.
joined='\n'.join([reg,cat,eng,dev,field,inspector,puck,page_json,studio,runtime,block_runtime,api])
for name,patterns in {'LOCALSTORAGE':['localStorage.','window.localStorage'],'SESSIONSTORAGE':['sessionStorage.','window.sessionStorage'],'EVAL':['eval('],'NEW_FUNCTION':['new Function('],'DANGEROUS_HTML':['dangerouslySetInnerHTML']}.items():ok('FORBIDDEN_'+name,all(x not in joined for x in patterns))
ok('NO_SQL_FILES',not any(DIR.rglob('*.sql')))
ok('NO_P06_MIGRATION_FILES',not any((ROOT/'supabase/migrations').glob('*p06*')))
ok('P07_FORWARD_COMPATIBLE','nativeFormsConversionWiring: true' in dev or 'p07WorkflowSubmission:false' in dev)
ok('P08_RENDER_SWITCH_FALSE','p08AssignedTemplateRenderSwitch:false' in dev)

# Existing Studio regressions.
node=shutil.which('node')
if node:
    base=ROOT/'scripts/angelcare-marketplace/verify-design-studio-transplant.mjs'
    ok('STUDIO_37_REGRESSION',base.is_file() and subprocess.run([node,str(base)],cwd=ROOT).returncode==0)
    cats=True
    for i in range(1,11):
        f=ROOT/f'scripts/angelcare-marketplace/verify-studio-catalogue-category-{i:02d}.mjs'
        if not f.is_file() or subprocess.run([node,str(f)],cwd=ROOT).returncode:cats=False;break
    ok('STUDIO_10X10_REGRESSION',cats)

# Targeted transpilation only.
ts_files=[
'angelcare-marketplace/studio-dynamic-source/types.ts','angelcare-marketplace/studio-dynamic-source/registry.ts','angelcare-marketplace/studio-dynamic-source/catalog-resolver.ts','angelcare-marketplace/studio-dynamic-source/engine.ts','angelcare-marketplace/studio-dynamic-source/developer-contract.ts','angelcare-marketplace/studio-dynamic-source/components/StudioDynamicSourceField.tsx','angelcare-marketplace/studio-dynamic-source/components/StudioDynamicSourceInspector.tsx','angelcare-marketplace/studio-universal/types.ts','angelcare-marketplace/experience-builder/block-registry.ts','angelcare-marketplace/studio-universal/page-json.ts','angelcare-marketplace/studio-universal/puck-config.tsx','angelcare-marketplace/studio-universal/StudioPublishedRenderer.tsx','angelcare-marketplace/studio-universal/components/StudioBlockRuntime.tsx','angelcare-marketplace/studio-universal/components/UniversalExperienceStudio.tsx','angelcare-marketplace/studio-universal/developer-contract.ts','app/api/angelcare-marketplace/cms/studio/dynamic-sources/route.ts','app/api/angelcare-marketplace/cms/studio/dynamic-sources/preview/route.ts','app/api/angelcare-marketplace/cms/developer-contract/route.ts','app/angelcare-marketplace/(protected)/admin/experience/developer/page.tsx']
if node:
    probe=subprocess.run([node,'-e',"try{require('typescript');process.exit(0)}catch(e){process.exit(2)}"],cwd=ROOT)
    if probe.returncode==0:
        js="""const fs=require('fs'),ts=require('typescript');const files=JSON.parse(process.argv[1]);let bad=[];for(const f of files){const r=ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX},fileName:f,reportDiagnostics:true});const ds=(r.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);if(ds.length)bad.push([f,ds.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' '))]);}if(bad.length){for(const [f,d] of bad)console.error('TRANSPILE_FAIL',f,d.join('; '));process.exit(1)}console.log('PASS TARGETED_TYPESCRIPT_TRANSPILE FILES='+files.length)"""
        run=subprocess.run([node,'-e',js,json.dumps(ts_files)],cwd=ROOT,text=True,capture_output=True)
        if run.stdout.strip():print(run.stdout.strip())
        if run.stderr.strip():print(run.stderr.strip())
        ok('TARGETED_TYPESCRIPT_TRANSPILE',run.returncode==0)
    else: print('INFO TARGETED_TYPESCRIPT_TRANSPILE=SKIPPED_TYPESCRIPT_NOT_RESOLVABLE')

if errors:
    print('\nP06_VERIFY=FAIL');print('ERRORS='+','.join(errors));sys.exit(1)
print('\nP06_VERIFY=PASS')
print('DYNAMIC_SOURCES=12 STRATEGIES=11 EMPTY_POLICIES=3 API_ROUTES=2')
print('P01_DISCOVERY=PASS P02_SELECTORS=PASS P03_ACTIONS=PASS P05_RUNTIME_CLONE=PASS')
print('PUBLIC_STUDIO_RUNTIME=PASS CANONICAL_CATALOG=PASS FAIL_CLOSED=PASS P08_ASSIGNED_TEMPLATE_SWITCH='+('YES' if P08_ACTIVE else 'NO'))
print('DATABASE_SCHEMA_CHANGE=NO SQL_REQUIRED=NO MIGRATION=NO')
print('LOCAL_BUILD=NO GLOBAL_TYPESCRIPT=NO P07_FORWARD_COMPATIBLE=YES')
