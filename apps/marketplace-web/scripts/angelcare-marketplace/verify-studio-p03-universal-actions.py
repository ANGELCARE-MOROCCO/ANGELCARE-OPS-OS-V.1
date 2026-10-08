#!/usr/bin/env python3
from __future__ import annotations
import json,re,subprocess,sys,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
DOCS=ROOT/'docs/angelcare-marketplace/studio-saturation'
REG=ROOT/'angelcare-marketplace/studio-action-registry/registry.ts'
TYPES=ROOT/'angelcare-marketplace/studio-action-registry/types.ts'
REF=ROOT/'angelcare-marketplace/studio-action-registry/reference.ts'
RES=ROOT/'angelcare-marketplace/studio-action-registry/resolver.ts'
PUB=ROOT/'angelcare-marketplace/studio-action-registry/public-resolver.ts'
FIELD=ROOT/'angelcare-marketplace/studio-action-registry/components/StudioActionField.tsx'
LINK=ROOT/'angelcare-marketplace/studio-action-registry/components/StudioActionLink.tsx'
DEV=ROOT/'angelcare-marketplace/studio-action-registry/developer-contract.ts'
PUCK=ROOT/'angelcare-marketplace/studio-universal/puck-config.tsx'
BLOCKS=ROOT/'angelcare-marketplace/studio-universal/block-contracts.ts'
STYPES=ROOT/'angelcare-marketplace/studio-universal/types.ts'
RUNTIME=ROOT/'angelcare-marketplace/studio-universal/components/StudioBlockRuntime.tsx'
VISUAL=ROOT/'angelcare-marketplace/studio-universal/components/StudioVisualCatalogueRuntime.tsx'
PUBLISHED=ROOT/'angelcare-marketplace/studio-universal/StudioPublishedRenderer.tsx'
STUDIO_DEV=ROOT/'angelcare-marketplace/studio-universal/developer-contract.ts'
DEV_ROUTE=ROOT/'app/api/angelcare-marketplace/cms/developer-contract/route.ts'
DEV_PAGE=ROOT/'app/angelcare-marketplace/(protected)/admin/experience/developer/page.tsx'
API=[
 ROOT/'app/api/angelcare-marketplace/cms/studio/actions/route.ts',
 ROOT/'app/api/angelcare-marketplace/cms/studio/actions/[actionId]/route.ts',
 ROOT/'app/api/angelcare-marketplace/cms/studio/actions/[actionId]/validate/route.ts',
]
errors=[]
def read(p):
    if not p.exists(): errors.append(f'MISSING:{p.relative_to(ROOT)}'); return ''
    return p.read_text(errors='ignore')
def ok(name,cond,detail=''):
    if cond: print(f'PASS {name}{(" "+detail) if detail else ""}')
    else: errors.append(name); print(f'FAIL {name}{(" "+detail) if detail else ""}')

# P01 hard source-registry prerequisite.
p01=ROOT/'scripts/angelcare-marketplace/verify-studio-p01-source-registry.py'
ok('P01_VERIFIER_PRESENT',p01.is_file())
if p01.is_file(): ok('P01_STILL_PASS',subprocess.run([sys.executable,str(p01)],cwd=ROOT).returncode==0)
# P02 must remain valid after its explicit phase-aware extension.
p02=ROOT/'scripts/angelcare-marketplace/verify-studio-p02-universal-picker.py'
ok('P02_VERIFIER_PRESENT',p02.is_file())
if p02.is_file(): ok('P02_STILL_PASS',subprocess.run([sys.executable,str(p02)],cwd=ROOT).returncode==0)

reg=read(REG);types=read(TYPES);ref=read(REF);res=read(RES);pub=read(PUB);field=read(FIELD);link=read(LINK);dev=read(DEV);puck=read(PUCK);blocks=read(BLOCKS);stypes=read(STYPES);runtime=read(RUNTIME);visual=read(VISUAL);published=read(PUBLISHED);studio_dev=read(STUDIO_DEV);dev_route=read(DEV_ROUTE);dev_page=read(DEV_PAGE)
p00=json.loads((DOCS/'P00_ACTION_REGISTRY_CANDIDATES.json').read_text())['actions']
p00_ids=[row['action_id'] for row in p00]
ids=re.findall(r"a\(\{id:'([^']+)'",reg)
ok('P00_ACTION_CANDIDATES_14',len(p00_ids)==14,f'COUNT={len(p00_ids)}')
ok('P03_REGISTERED_14',len(ids)==14 and len(set(ids))==14,f'COUNT={len(ids)}')
ok('P00_ACTION_COVERAGE_EXACT',set(ids)==set(p00_ids))
source_reg=read(ROOT/'angelcare-marketplace/studio-source-registry/registry.ts')
source_ids=set(re.findall(r"source\(\{ id:'([^']+)'",source_reg))
targets=set(re.findall(r"targetSources:\[([^\]]*)\]",reg))
flat=[]
for chunk in targets: flat += re.findall(r"'([^']+)'",chunk)
ok('ACTION_TARGETS_USE_P01',set(flat).issubset(source_ids),f'TARGET_SOURCES={len(set(flat))}')
ok('STRUCTURED_ACTION_REFERENCE',all(token in types for token in ['StudioActionReference','actionId:string','target?:StudioSourceReference','externalUrl?:string']))
ok('FAIL_CLOSED_UNKNOWN_ACTION',"if(!descriptor)return{status:'INVALID'" in pub)
ok('FAIL_CLOSED_TARGET_REQUIRED',"status:'TARGET_REQUIRED'" in pub and 'targetRequired' in reg)
ok('FAIL_CLOSED_TARGET_SOURCE',"status:'TARGET_UNSUPPORTED'" in pub)
ok('FAIL_CLOSED_UNPUBLISHED',"status:'TARGET_NOT_PUBLISHED'" in pub and 'live(' in pub)
ok('FAIL_CLOSED_EXTERNAL_URL',all(token in ref for token in ['http:','https:','mailto:','tel:']) and "status:'UNSAFE_EXTERNAL_URL'" in pub)
ok('P07_BOUNDARY_EXPLICIT',"p07WorkflowRequired:true" in reg and "status:'WORKFLOW_REQUIRED'" in pub and 'inquiry.submit' in reg)
ok('P02_PICKER_REUSED','UniversalSourcePickerField' in field and 'allowedSources' in field and 'targetSources' in field)
ok('ZERO_RAW_ID_ACTION_UX','entityId' not in field and 'UUID' not in field)
ok('ACTION_TRUST_PANEL',all(token in field for token in ['Conséquence','Administration','Contrôles','canonicalEngine','adminDestination']))
ok('ADMIN_BRIDGE_REUSES_EXISTING',"Ouvrir l’espace existant" in field)
ok('PUCK_PRIMARY_ACTION','StudioActionField' in puck and 'fields.primaryAction' in puck)
ok('PUCK_SECONDARY_ACTION','fields.secondaryAction' in puck)
ok('PUCK_NESTED_ACTION',"action:{type:'custom'" in puck and 'Action de l’élément' in puck)
ok('LEGACY_HREF_COMPAT',all(token in puck for token in ['Destination legacy · compatibilité','Lien legacy · compatibilité']) and 'primaryCtaHref?: string' in stypes)
ok('BLOCK_CONTRACT_ACTIONS',all(token in blocks for token in ["'primaryAction'","'secondaryAction'"]))
ok('PUBLIC_RUNTIME_HYDRATION','hydrateActions' in published and 'resolveStudioPublicAction' in published and '__studioResolvedAction' in published)
ok('PUBLIC_RUNTIME_PRIMARY_SECONDARY','__studioResolvedPrimaryAction' in runtime and '__studioResolvedSecondaryAction' in runtime)
ok('VISUAL_RUNTIME_ACTION_LINK','StudioActionLink' in visual and '__studioResolvedAction' in visual)
for route in ['/booking/${slug}','/quotation/${slug}','/basket?item=','/enrollment/${slug}','/subscription/${slug}','/family/request']:
    ok('CANONICAL_ROUTE_'+re.sub(r'[^A-Z0-9]+','_',route.upper()).strip('_'),route in pub)
ok('B2B_EXISTING_VERTICAL_ROUTES',all(token in pub for token in ["'hospitality'","'health-partners'","'corporates'"]))
ok('CHECKOUT_CONTEXT_SAFE',"status:'CONTEXT_REQUIRED'" in pub and '/basket' in pub)
api_text='\n'.join(read(p) for p in API)
ok('ACTION_API_ROUTES_3',all(p.is_file() for p in API),f'COUNT={sum(p.is_file() for p in API)}')
ok('ACTION_API_GUARDED',api_text.count("requireMarketplaceApiContext('marketplace.cms.view')")==3)
ok('ACTION_API_NO_EXECUTE','createPublicInquiry' not in api_text and '.insert(' not in api_text and '.update(' not in api_text)
ok('DEVELOPER_CONTRACT_ACTIONS',all(token in dev for token in ['STUDIO_ACTION_DEVELOPER_CONTRACT','actionCount','studioActionDeveloperContractTxt','studioActionDeveloperContractCsv']))
ok('DEVELOPER_SCOPE_ACTIONS',"scope==='actions'" in dev_route and 'X-Studio-Action-Registry-SHA256' in dev_route and 'scope=actions&format=json' in dev_page)
ok('STUDIO_CONTRACT_EXTENDED',all(token in studio_dev for token in ['universalActions','universalActionRegistry: true','structuredActionReferences: true','actionUnknownFailsClosed: true']))
coverage=json.loads((DOCS/'P03_ACTION_COVERAGE.json').read_text()) if (DOCS/'P03_ACTION_COVERAGE.json').is_file() else {}
ok('P03_COVERAGE_DOC',coverage.get('p00_candidates')==14 and coverage.get('registered')==14 and coverage.get('unmapped')==0)
ok('P03_RUNTIME_MATRIX',(DOCS/'P03_RUNTIME_ROUTE_MATRIX.json').is_file())
ok('NO_NEW_ADMIN_WORKSPACE',coverage.get('invariants',{}).get('new_admin_workspace') is False)
joined='\n'.join([reg,types,ref,res,pub,field,link,dev,puck,blocks,stypes,runtime,visual,published,studio_dev,dev_route,api_text])
for name,patterns in {'LOCALSTORAGE':['localStorage.','window.localStorage'],'SESSIONSTORAGE':['sessionStorage.','window.sessionStorage'],'EVAL':['eval('],'NEW_FUNCTION':['new Function('],'DANGEROUSLYSETINNERHTML':['dangerouslySetInnerHTML']}.items():ok('FORBIDDEN_'+name,all(x not in joined for x in patterns))
action_dir=ROOT/'angelcare-marketplace/studio-action-registry'
action_runtime_text='\n'.join(read(p) for p in action_dir.rglob('*.ts*') if p.name != 'developer-contract.ts')
ok('READ_ONLY_ACTION_REGISTRY',all(token not in action_runtime_text for token in ['.insert(','.update(','.delete(','.upsert(','.rpc(']))
ok('NO_SQL_FILES',not any(action_dir.rglob('*.sql')))
p04_marker=(DOCS/'P04_TEMPLATE_ASSIGNMENT_AUTHORITY_MAP.json').is_file()
ok('P04_PHASE_AWARE_BOUNDARY',((not p04_marker) and 'templateAssignmentInheritance' not in joined) or (p04_marker and (ROOT/'angelcare-marketplace/studio-template-assignment/resolver.ts').is_file()))

# Existing Studio regressions remain green.
node=shutil.which('node')
if node:
    base=ROOT/'scripts/angelcare-marketplace/verify-design-studio-transplant.mjs'
    ok('STUDIO_37_REGRESSION',base.is_file() and subprocess.run([node,str(base)],cwd=ROOT).returncode==0)
    cats=True
    for i in range(1,11):
        f=ROOT/f'scripts/angelcare-marketplace/verify-studio-catalogue-category-{i:02d}.mjs'
        if not f.is_file() or subprocess.run([node,str(f)],cwd=ROOT).returncode: cats=False;break
    ok('STUDIO_10X10_REGRESSION',cats)

files=[
'angelcare-marketplace/studio-action-registry/types.ts','angelcare-marketplace/studio-action-registry/registry.ts','angelcare-marketplace/studio-action-registry/reference.ts','angelcare-marketplace/studio-action-registry/resolver.ts','angelcare-marketplace/studio-action-registry/public-resolver.ts','angelcare-marketplace/studio-action-registry/developer-contract.ts','angelcare-marketplace/studio-action-registry/components/StudioActionField.tsx','angelcare-marketplace/studio-action-registry/components/StudioActionLink.tsx','angelcare-marketplace/studio-universal/block-contracts.ts','angelcare-marketplace/studio-universal/types.ts','angelcare-marketplace/studio-universal/puck-config.tsx','angelcare-marketplace/studio-universal/components/StudioBlockRuntime.tsx','angelcare-marketplace/studio-universal/components/StudioVisualCatalogueRuntime.tsx','angelcare-marketplace/studio-universal/StudioPublishedRenderer.tsx','angelcare-marketplace/studio-universal/developer-contract.ts','app/api/angelcare-marketplace/cms/studio/actions/route.ts','app/api/angelcare-marketplace/cms/studio/actions/[actionId]/route.ts','app/api/angelcare-marketplace/cms/studio/actions/[actionId]/validate/route.ts','app/api/angelcare-marketplace/cms/developer-contract/route.ts','app/angelcare-marketplace/(protected)/admin/experience/developer/page.tsx']
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
    print('\nP03_VERIFY=FAIL');print('ERRORS='+','.join(errors));sys.exit(1)
print('\nP03_VERIFY=PASS')
print('P00_ACTIONS=14 REGISTERED=14 TARGETED_ACTION_API_ROUTES=3')
print('STRUCTURED_ACTIONS=PASS P02_PICKER_TARGETS=PASS PUBLIC_RESOLUTION=PASS FAIL_CLOSED=PASS')
print('DATABASE_CHANGE=NO SQL_REQUIRED=NO MIGRATION=NO')
print('LOCAL_BUILD=NO GLOBAL_TYPESCRIPT=NO P04_TEMPLATE_ASSIGNMENT=NO')
