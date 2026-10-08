#!/usr/bin/env python3
from __future__ import annotations
import json,os,re,shutil,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
DOCS=ROOT/'docs/angelcare-marketplace/studio-saturation'
DIR=ROOT/'angelcare-marketplace/studio-public-runtime'
TYPES=DIR/'types.ts';PREFLIGHT=DIR/'preflight.ts';ORCH=DIR/'orchestrator.ts';COMP=DIR/'components/PublicCatalogExperience.tsx';DEV=DIR/'developer-contract.ts'
ADAPTIVE=ROOT/'angelcare-marketplace/category-native-experience/components/AdaptiveExperience.tsx'
PUBLISHED=ROOT/'angelcare-marketplace/studio-universal/StudioPublishedRenderer.tsx'
PREVIEW=ROOT/'app/api/angelcare-marketplace/cms/studio/live-bindings/preview/route.ts'
INSPECT=ROOT/'app/api/angelcare-marketplace/cms/studio/public-runtime/resolve/route.ts'
DEV_ROUTE=ROOT/'app/api/angelcare-marketplace/cms/developer-contract/route.ts'
DEV_PAGE=ROOT/'app/angelcare-marketplace/(protected)/admin/experience/developer/page.tsx'
STUDIO_DEV=ROOT/'angelcare-marketplace/studio-universal/developer-contract.ts'
PUBLIC=[ROOT/'app/angelcare-marketplace/[locale]/marketplace/[slug]/page.tsx',ROOT/'app/angelcare-marketplace/[locale]/marketplace/item/[itemSlug]/page.tsx',ROOT/'app/angelcare-marketplace/[locale]/experience/[itemSlug]/page.tsx']
NATIVE=[ROOT/'app/angelcare-marketplace/[locale]/booking/[itemSlug]/page.tsx',ROOT/'app/angelcare-marketplace/[locale]/quotation/[itemSlug]/page.tsx',ROOT/'app/angelcare-marketplace/[locale]/enrollment/[itemSlug]/page.tsx',ROOT/'app/angelcare-marketplace/[locale]/subscription/[itemSlug]/page.tsx',ROOT/'app/angelcare-marketplace/[locale]/experience/[itemSlug]/configure/page.tsx']
errors=[]
def read(p:Path)->str:
    if not p.exists(): errors.append(f'MISSING:{p.relative_to(ROOT)}');return ''
    return p.read_text(errors='ignore')
def ok(name:str,cond:bool,detail:str=''):
    if cond: print(f'PASS {name}{(" "+detail) if detail else ""}')
    else: errors.append(name);print(f'FAIL {name}{(" "+detail) if detail else ""}')

# Certified predecessor regression, forward-aware for the intentional P08 switch.
p07=ROOT/'scripts/angelcare-marketplace/verify-studio-p07-workflows.py'
ok('P07_VERIFIER_PRESENT',p07.is_file())
if p07.is_file():
    env=dict(os.environ);env['ANGELCARE_VERIFY_P08_ACTIVE']='1'
    ok('P07_STILL_PASS_FORWARD',subprocess.run([sys.executable,str(p07)],cwd=ROOT,env=env).returncode==0)

files=[TYPES,PREFLIGHT,ORCH,COMP,DEV,ADAPTIVE,PUBLISHED,PREVIEW,INSPECT,DEV_ROUTE,DEV_PAGE,STUDIO_DEV,*PUBLIC,*NATIVE]
text={p:read(p) for p in files};types=text[TYPES];preflight=text[PREFLIGHT];orch=text[ORCH];comp=text[COMP];dev=text[DEV];adaptive=text[ADAPTIVE];published=text[PUBLISHED];preview=text[PREVIEW];inspect=text[INSPECT];dev_route=text[DEV_ROUTE];dev_page=text[DEV_PAGE];studio_dev=text[STUDIO_DEV]

# P08 runtime contract / pipeline.
reasons=re.findall(r"'([A-Z_]+)'",re.search(r"StudioPublicRuntimeFallbackReason=(.*)",types).group(1)) if 'StudioPublicRuntimeFallbackReason=' in types else []
p11_active=os.environ.get('ANGELCARE_VERIFY_P11_ACTIVE')=='1'
expected=['NO_RESOLVED_TEMPLATE','BOUND_TEMPLATE_UNAVAILABLE','BINDING_BLOCKER','DYNAMIC_SOURCE_BLOCKER','ACTION_BLOCKER','WORKFLOW_BLOCKER','EMPTY_TEMPLATE','RUNTIME_ERROR']+(['POLICY_BLOCKER'] if p11_active else [])
ok('FALLBACK_REASONS_'+str(len(expected)),len(reasons)==len(expected) and set(reasons)==set(expected),f'COUNT={len(reasons)}')
ok('RUNTIME_STATUS_CONTRACT',"'STUDIO_READY'|'FALLBACK_NATIVE'" in types)
ok('P04_ASSIGNMENT_INPUT','StudioResolvedTemplate' in types and "input.resolution.status!=='RESOLVED'" in orch)
ok('P05_BOUND_TEMPLATE','loadBoundStudioTemplate' in orch and "bound.report.blockerCount>0" in orch)
ok('P06_DYNAMIC_RUNTIME','applyStudioDynamicSources' in orch and "visibility:input.visibility||'public_runtime'" in orch and 'dynamic.report.blockerCount>0' in orch)
ok('P03_ACTION_PREFLIGHT','resolveStudioPublicAction' in preflight and 'isStudioActionReference' in preflight)
ok('P07_WORKFLOW_PREFLIGHT','isStudioWorkflowReference' in preflight and 'getStudioWorkflowDescriptor' in preflight and 'targetRequired' in preflight)
ok('PIPELINE_ORDER',orch.find('loadBoundStudioTemplate')<orch.find('applyStudioDynamicSources')<orch.find('preflightStudioRuntime'))
ok('RUNTIME_CLONE_CHAIN','loadBoundStudioTemplate' in orch and 'applyStudioDynamicSources(bound.data' in orch)
ok('EMPTY_TEMPLATE_FAIL_CLOSED',"fallback('EMPTY_TEMPLATE'" in orch)
ok('UNEXPECTED_ERROR_FAIL_CLOSED',"fallback('RUNTIME_ERROR'" in orch)
ok('NO_PARTIAL_BLOCKER_RENDER',"fallback('BINDING_BLOCKER'" in orch and "fallback('DYNAMIC_SOURCE_BLOCKER'" in orch and "fallback(workflowBlock?'WORKFLOW_BLOCKER':'ACTION_BLOCKER'" in orch)

# Render switch / deterministic native fallback.
ok('CATEGORY_NATIVE_EXPORT','CategoryNativeExperience' in adaptive and 'AdaptiveExperience=CategoryNativeExperience' in adaptive)
ok('PUBLIC_COMPONENT_STUDIO_RENDER','StudioPublishedDataRenderer' in comp and "runtime.status==='STUDIO_READY'" in comp)
ok('PUBLIC_COMPONENT_NATIVE_FALLBACK','CategoryNativeExperience' in comp and 'data-ac-studio-fallback' in comp)
ok('PUBLIC_RUNTIME_DIAGNOSTIC_ATTRS',all(x in comp for x in ['data-ac-template-scope','data-ac-binding-count','data-ac-dynamic-source-count','data-ac-action-count','data-ac-workflow-count']))
ok('PREAPPLIED_DYNAMIC_NO_DOUBLE_RESOLVE','dynamicAlreadyApplied' in published and 'dynamicReport' in published)
ok('STUDIO_PUBLISHED_DATA_RENDERER','export async function StudioPublishedDataRenderer' in published)

public='\n'.join(text[p] for p in PUBLIC)
ok('PUBLIC_ENTRYPOINTS_3',all(p.is_file() for p in PUBLIC),f'COUNT={sum(p.is_file() for p in PUBLIC)}')
ok('ASSIGNED_TEMPLATE_SWITCH_3',sum('PublicCatalogExperience' in text[p] for p in PUBLIC)==3)
ok('P04_RESOLVER_RETAINED_3',sum('resolveStudioTemplateForCatalogItem' in text[p] for p in PUBLIC)==3)
ok('COLLECTION_PLACEMENT_CONTEXT_3',all('collectionId={query.collection||null}' in text[p] and 'placementId={query.placement||null}' in text[p] for p in PUBLIC))
ok('NO_DIRECT_ADAPTIVE_RENDER_ON_PUBLIC_ENTRYPOINTS',all('return <AdaptiveExperience' not in text[p] for p in PUBLIC))

# Conversion action destinations remain canonical, not swallowed by assigned templates.
ok('NATIVE_CONVERSION_ROUTES_PRESERVED',all('AdaptiveExperience' in text[p] and 'PublicCatalogExperience' not in text[p] for p in NATIVE),f'COUNT={len(NATIVE)}')

# Preview/public same preparation engine.
ok('ADMIN_PREVIEW_USES_P08','prepareStudioPublicRuntime' in preview and "visibility:'admin_preview'" in preview and 'runtimeResult' in preview)
ok('P08_INSPECT_API',INSPECT.is_file() and 'prepareStudioPublicRuntime' in inspect and "requireMarketplaceApiContext('marketplace.cms.view')" in inspect)
ok('INSPECT_NO_MUTATION',all(x not in inspect for x in ['.insert(','.update(','.delete(','.upsert(','.rpc(']))

# Developer contract and active Studio contract.
ok('P08_DEVELOPER_CONTRACT',all(x in dev for x in ['STUDIO_PUBLIC_RUNTIME_DEVELOPER_CONTRACT','studioPublicRuntimeDeveloperContractTxt','studioPublicRuntimeDeveloperContractCsv','entrypoints:3']))
ok('P08_CONTRACT_INVARIANTS',all(x in dev for x in ['assignedTemplateRenderSwitch:true','publishedRevisionOnly:true','runtimeCloneOnly:true','categoryNativeFallback:true','p09AttributionExpansion:false','sqlRequired:false']))
ok('DEVELOPER_SCOPE_P08',"scope==='public-runtime'" in dev_route and 'X-Studio-Public-Runtime-SHA256' in dev_route and 'scope=public-runtime&format=json' in dev_page)
ok('UNIVERSAL_DEVELOPER_CONTRACT_P08',all(x in studio_dev for x in ['STUDIO_PUBLIC_RUNTIME_DEVELOPER_CONTRACT','publicRuntimeEntrypoints','publicRuntimeOrchestrator: true','assignedStudioTemplatesRenderPublicly: true','publicRuntimeSamePipelinePreviewAndPublished: true']))

# Docs / no P09 drift.
for f,name in [('P08_ENTRYPOINT_MATRIX.json','P08_ENTRYPOINT_DOC'),('P08_RUNTIME_ORCHESTRATION_CONTRACT.json','P08_RUNTIME_DOC'),('P08_FALLBACK_MATRIX.json','P08_FALLBACK_DOC'),('P08_CERTIFICATION.md','P08_CERTIFICATION_DOC')]:ok(name,(DOCS/f).is_file())
if (DOCS/'P08_RUNTIME_ORCHESTRATION_CONTRACT.json').is_file():
    d=json.loads((DOCS/'P08_RUNTIME_ORCHESTRATION_CONTRACT.json').read_text());ok('DOC_ENTRYPOINTS_3',d.get('public_entrypoints')==3);ok('DOC_P09_FALSE',d.get('p09_attribution_expansion') is False);ok('DOC_SQL_NO',d.get('sql_required') is False)
p09_active=os.environ.get('ANGELCARE_VERIFY_P09_ACTIVE')=='1'
if p09_active: ok('P09_FORWARD_COMPAT','studio-attribution' in orch and 'p09AttributionExpansion:false' in dev)
if p11_active: ok('P11_FORWARD_COMPAT','evaluateStudioRuntimePolicy' in orch and "fallback('POLICY_BLOCKER'" in orch and 'p11GovernanceEngine:true' in dev)
else: ok('P09_NOT_IMPLEMENTED','studio-attribution' not in '\n'.join(read(p) for p in [ORCH,COMP,DEV]) and 'p09AttributionExpansion:false' in dev)

# Security / no shadow authority / no writes.
joined='\n'.join([types,preflight,orch,comp,dev,published,preview,inspect])
for name,patterns in {'LOCALSTORAGE':['localStorage.','window.localStorage'],'SESSIONSTORAGE':['sessionStorage.','window.sessionStorage'],'EVAL':['eval('],'NEW_FUNCTION':['new Function('],'DANGEROUS_HTML':['dangerouslySetInnerHTML']}.items():ok('FORBIDDEN_'+name,all(x not in joined for x in patterns))
ok('P08_READ_ONLY',all(x not in '\n'.join([preflight,orch,inspect]) for x in ['.insert(','.update(','.delete(','.upsert(','.rpc(']))
ok('NO_SHADOW_RUNTIME_AUTHORITY',not any(x in joined.lower() for x in ['studio_runtime_sessions','studio_runtime_items','studio_runtime_orders','studio_runtime_bookings']))
ok('NO_SQL_FILES',not any(DIR.rglob('*.sql')))
ok('NO_P08_MIGRATION_FILES',not any((ROOT/'supabase/migrations').glob('*p08*')))

# Existing Studio visual regressions.
node=shutil.which('node')
if node:
    base=ROOT/'scripts/angelcare-marketplace/verify-design-studio-transplant.mjs'
    ok('STUDIO_37_REGRESSION',base.is_file() and subprocess.run([node,str(base)],cwd=ROOT).returncode==0)
    cats=True
    for i in range(1,11):
        f=ROOT/f'scripts/angelcare-marketplace/verify-studio-catalogue-category-{i:02d}.mjs'
        if not f.is_file() or subprocess.run([node,str(f)],cwd=ROOT).returncode:cats=False;break
    ok('STUDIO_10X10_REGRESSION',cats)

# Targeted syntax transpilation only.
ts_files=[
'angelcare-marketplace/studio-public-runtime/types.ts','angelcare-marketplace/studio-public-runtime/preflight.ts','angelcare-marketplace/studio-public-runtime/orchestrator.ts','angelcare-marketplace/studio-public-runtime/components/PublicCatalogExperience.tsx','angelcare-marketplace/studio-public-runtime/developer-contract.ts','angelcare-marketplace/category-native-experience/components/AdaptiveExperience.tsx','angelcare-marketplace/studio-universal/StudioPublishedRenderer.tsx','app/api/angelcare-marketplace/cms/studio/live-bindings/preview/route.ts','app/api/angelcare-marketplace/cms/studio/public-runtime/resolve/route.ts','app/api/angelcare-marketplace/cms/developer-contract/route.ts','app/angelcare-marketplace/(protected)/admin/experience/developer/page.tsx','angelcare-marketplace/studio-universal/developer-contract.ts','app/angelcare-marketplace/[locale]/experience/[itemSlug]/page.tsx','app/angelcare-marketplace/[locale]/marketplace/[slug]/page.tsx','app/angelcare-marketplace/[locale]/marketplace/item/[itemSlug]/page.tsx']
if node:
    probe=subprocess.run([node,'-e',"try{require('typescript');process.exit(0)}catch(e){process.exit(2)}"],cwd=ROOT)
    if probe.returncode==0:
        js="""const fs=require('fs'),ts=require('typescript');const files=JSON.parse(process.argv[1]);let bad=[];for(const f of files){const r=ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX},fileName:f,reportDiagnostics:true});const ds=(r.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);if(ds.length)bad.push([f,ds.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' '))]);}if(bad.length){for(const [f,d] of bad)console.error('TRANSPILE_FAIL',f,d.join('; '));process.exit(1)}console.log('PASS TARGETED_TYPESCRIPT_TRANSPILE FILES='+files.length)"""
        run=subprocess.run([node,'-e',js,json.dumps(ts_files)],cwd=ROOT,text=True,capture_output=True)
        if run.stdout.strip():print(run.stdout.strip())
        if run.stderr.strip():print(run.stderr.strip())
        ok('TARGETED_TYPESCRIPT_TRANSPILE',run.returncode==0)
    else:print('INFO TARGETED_TYPESCRIPT_TRANSPILE=SKIPPED_TYPESCRIPT_NOT_RESOLVABLE')

if errors:
    print('\nP08_VERIFY=FAIL');print('ERRORS='+','.join(errors));sys.exit(1)
print('\nP08_VERIFY=PASS')
print('PUBLIC_ENTRYPOINTS=3 PIPELINE=P04>P05>P06>P03>P07 RENDER_SWITCH=PASS')
print('ASSIGNED_TEMPLATE=PASS PREVIEW_PARITY=PASS CATEGORY_NATIVE_FALLBACK=PASS')
print('BINDING_BLOCKERS=FAIL_CLOSED DYNAMIC_BLOCKERS=FAIL_CLOSED ACTION_BLOCKERS=FAIL_CLOSED WORKFLOW_BLOCKERS=FAIL_CLOSED')
print('DATABASE_SCHEMA_CHANGE=NO SQL_REQUIRED=NO MIGRATION=NO')
print('LOCAL_BUILD=NO GLOBAL_TYPESCRIPT=NO P09_ATTRIBUTION_EXPANSION=NO')
