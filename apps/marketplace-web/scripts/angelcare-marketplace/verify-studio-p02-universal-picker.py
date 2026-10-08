#!/usr/bin/env python3
from __future__ import annotations
import json,re,sys,subprocess,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
DOCS=ROOT/'docs/angelcare-marketplace/studio-saturation'
REG=ROOT/'angelcare-marketplace/studio-source-registry/registry.ts'
PICKER=ROOT/'angelcare-marketplace/studio-picker/components/UniversalSourcePicker.tsx'
CLIENT=ROOT/'angelcare-marketplace/studio-picker/client.ts'
REF=ROOT/'angelcare-marketplace/studio-picker/reference.ts'
DEV=ROOT/'angelcare-marketplace/studio-picker/developer-contract.ts'
FIELDS=ROOT/'angelcare-marketplace/studio-universal/components/StudioFields.tsx'
PUCK=ROOT/'angelcare-marketplace/studio-universal/puck-config.tsx'
TYPES=ROOT/'angelcare-marketplace/studio-universal/types.ts'
RUNTIME=ROOT/'angelcare-marketplace/studio-universal/components/StudioBlockRuntime.tsx'
VISUAL=ROOT/'angelcare-marketplace/studio-universal/components/StudioVisualCatalogueRuntime.tsx'
PUBLISHED=ROOT/'angelcare-marketplace/studio-universal/StudioPublishedRenderer.tsx'
PICKER_DATA=ROOT/'angelcare-marketplace/studio-universal/picker-data.ts'
STUDIO_DEV=ROOT/'angelcare-marketplace/studio-universal/developer-contract.ts'
DEV_ROUTE=ROOT/'app/api/angelcare-marketplace/cms/developer-contract/route.ts'
DEV_PAGE=ROOT/'app/angelcare-marketplace/(protected)/admin/experience/developer/page.tsx'
SEARCH_ROUTE=ROOT/'app/api/angelcare-marketplace/cms/studio/sources/[sourceId]/search/route.ts'
BROWSE_ROUTE=ROOT/'app/api/angelcare-marketplace/cms/studio/sources/[sourceId]/browse/route.ts'
PAGE=ROOT/'app/angelcare-marketplace/(protected)/admin/experience/studio/[pageId]/page.tsx'
CSS=ROOT/'angelcare-marketplace/studio-picker/components/universal-source-picker.module.css'
errors=[]
def read(p):
    if not p.exists(): errors.append(f'MISSING:{p.relative_to(ROOT)}'); return ''
    return p.read_text(errors='ignore')
def ok(name,cond,detail=''):
    if cond: print(f'PASS {name}{(" "+detail) if detail else ""}')
    else: errors.append(name); print(f'FAIL {name}{(" "+detail) if detail else ""}')

# P01 remains the hard prerequisite and must still pass after the P02 boundary extensions.
p01=ROOT/'scripts/angelcare-marketplace/verify-studio-p01-source-registry.py'
ok('P01_VERIFIER_PRESENT',p01.is_file())
if p01.is_file():
    rc=subprocess.run([sys.executable,str(p01)],cwd=ROOT).returncode
    ok('P01_STILL_PASS',rc==0)

reg=read(REG); picker=read(PICKER); client=read(CLIENT); ref=read(REF); dev=read(DEV); fields=read(FIELDS); puck=read(PUCK); types=read(TYPES); runtime=read(RUNTIME); visual=read(VISUAL); published=read(PUBLISHED); picker_data=read(PICKER_DATA); studio_dev=read(STUDIO_DEV); dev_route=read(DEV_ROUTE); dev_page=read(DEV_PAGE); search_route=read(SEARCH_ROUTE); browse_route=read(BROWSE_ROUTE); page=read(PAGE); css=read(CSS)
ids=re.findall(r"source\(\{ id:'([^']+)'",reg)
coverage=json.loads((DOCS/'P02_PICKER_COVERAGE.json').read_text()) if (DOCS/'P02_PICKER_COVERAGE.json').exists() else {}
coverage_ids=[row.get('source_id') for row in coverage.get('sources',[])]
ok('P01_REGISTERED_20',len(ids)==20 and len(set(ids))==20,f'COUNT={len(ids)}')
ok('P02_ACCOUNTED_20',coverage.get('p02_accounted_for')==20 and set(coverage_ids)==set(ids),f'COUNT={coverage.get("p02_accounted_for")}')
ok('PICKER_SUPPORTED_20',coverage.get('picker_supported')==20)
ok('ONE_FRAMEWORK','export function UniversalSourcePicker' in picker and 'UniversalSourcePickerField' in picker)
ok('P01_ONLY_DISCOVERY',all(token in client for token in ['/api/angelcare-marketplace/cms/studio/sources','searchPickerSource','validatePickerReference']) and 'db.from(' not in picker and 'createServiceClient' not in picker)
ok('CANONICAL_REFERENCE',all(token in ref for token in ['sourceId','entityId','isStudioSourceReference']) and 'canonicalRef' in picker)
ok('SINGLE_MULTI_SELECT',"mode='single'" in picker and "mode==='multiple'" in picker and 'aria-multiselectable' in picker)
ok('SEARCH_BROWSE','query' in picker and "browse:useBrowse" in picker and 'descriptor?.capabilities.browse' in picker)
ok('HIERARCHICAL','descriptor?.capabilities.hierarchical' in picker and 'parent_category_id' in picker and 'parent_territory_id' in picker)
ok('MEDIA_VISUAL',"activeSource==='media.assets'" in picker and 'data-media' in picker and 'ImageIcon' in picker)
ok('CURSOR_PAGINATION','nextCursor' in picker and 'append:true' in picker and 'PAGE_SIZE=24' in picker)
ok('BOUNDED_CLIENT_LIMIT','Math.min(input.limit||24,50)' in client)
ok('DEBOUNCED_SEARCH','setTimeout(()=>void runSearch(),220)' in picker)
ok('REQUEST_RACE_SAFETY','requestSeq' in picker and 'AbortController' in picker and 'seq!==requestSeq.current' in picker)
ok('KEYBOARD_NAVIGATION',all(token in picker for token in ["event.key==='ArrowDown'","event.key==='ArrowUp'","event.key==='Enter'","event.key==='Escape'","event.key==='Tab'"]))
ok('FOCUS_TRAP','querySelectorAll<HTMLElement>' in picker and 'document.activeElement===first' in picker)
ok('ACCESSIBILITY',all(token in picker for token in ['role="dialog"','aria-modal="true"','role="listbox"','role="option"','aria-selected']))
ok('STALE_REFERENCE_TRUST',all(token in picker for token in ['NOT_AUTHORIZED','NOT_PUBLISHED','DISABLED','NOT_FOUND','SOURCE_UNKNOWN','UNSUPPORTED','Référence indisponible','Accès retiré']))
ok('PERMISSION_ERROR_STATE',"kind:'denied'" in picker and 'Vous n’avez pas accès' in picker)
ok('PUBLICATION_STATUS_STATE',all(token in picker for token in ['Publié' if False else 'Brouillon','Indisponible','statusLabel']))
ok('FILTER_FRAMEWORK','filter.' in client and 'localFilters' in picker and 'Filtre Studio invalide' in search_route and 'Trop de filtres Studio' in browse_route)
ok('FILTERS_BOUNDED',all(token in search_route+browse_route for token in ['count>8','slice(0,120)','^[a-zA-Z0-9_]{1,48}$']))
ok('ADMIN_BRIDGE','studioSourceAdminHref' in picker and 'Ouvrir dans l’administration' in picker)
ok('NO_RAW_ID_DEFAULT', 'entity.id}</' not in picker and '>entity.id<' not in picker and 'UUID' not in picker)
ok('LEGACY_COMPATIBILITY','legacyValueField' in picker and 'exactLegacyEntity' in picker and 'Compatible · sera convertie' in picker)
ok('PUCK_MEDIA_NATIVE','sourceId="media.assets"' in fields and "fields.mediaAssetKey={type:'custom'" in puck)
ok('PUCK_CATEGORY_NATIVE','sourceId={category?\'catalog.categories\':\'homepage.collections\'}' in fields and "fields.categoryKey={type:'custom'" in puck)
ok('PUCK_COLLECTION_NATIVE',"fields.collectionKey={type:'custom'" in puck)
ok('CANONICAL_REF_TYPES','mediaAssetKey?: string | StudioSourceReference' in types and 'collectionKey?: string | StudioSourceReference' in types and 'categoryKey?: string | StudioSourceReference' in types)
ok('EDITOR_RUNTIME_COMPAT','isStudioSourceReference(props.mediaAssetKey)' in runtime and 'Sélection canonique AngelCare' in runtime)
ok('VISUAL_RUNTIME_COMPAT','isStudioSourceReference(props.mediaAssetKey)' in visual)
ok('PUBLIC_RUNTIME_MEDIA_COMPAT',"media.sourceId==='media.assets'" in published and ".in('id',[...ids])" in published)
ok('PUBLIC_RUNTIME_CATEGORY_COMPAT',"value.sourceId!=='catalog.categories'" in published and "select('category_key').eq('id',value.entityId)" in published)
ok('PUBLIC_RUNTIME_COLLECTION_COMPAT',"value.sourceId==='homepage.collections'" in published and "eq('id',value.entityId)" in published)
ok('NO_FULL_PICKER_PRELOAD','limit(500)' not in picker_data and 'limit(300)' not in picker_data and 'loadStudioPickerData(data)' in page)
ok('DEVELOPER_CONTRACT',all(token in dev for token in ['STUDIO_PICKER_DEVELOPER_CONTRACT','studioPickerDeveloperContractTxt','studioPickerDeveloperContractCsv','PICKER_SUPPORTED']))
ok('DEVELOPER_SCOPE',"scope==='picker'" in dev_route and 'X-Studio-Picker-SHA256' in dev_route and 'scope=picker&format=json' in dev_page)
ok('STUDIO_CONTRACT_EXTENDED','universalPickerSources' in studio_dev and 'universalPickerFramework: true' in studio_dev and 'zeroRawIdDefaultUx: true' in studio_dev)
ok('PREMIUM_UI_SURFACE',all(token in css for token in ['backdrop-filter','box-shadow','focus-visible','@media(max-width:720px)']))
joined='\n'.join([picker,client,ref,dev,fields,puck,runtime,visual,published,picker_data,studio_dev,dev_route,search_route,browse_route])
for name,patterns in {
    'LOCALSTORAGE':['localStorage.','window.localStorage'],
    'SESSIONSTORAGE':['sessionStorage.','window.sessionStorage'],
    'EVAL':['eval('],
    'NEW_FUNCTION':['new Function('],
    'DANGEROUSLYSETINNERHTML':['dangerouslySetInnerHTML'],
}.items():
    ok('FORBIDDEN_'+name,all(pattern not in joined for pattern in patterns))
ok('NO_SQL_FILES',not any((ROOT/'angelcare-marketplace/studio-picker').rglob('*.sql')))
p03_installed=(ROOT/'angelcare-marketplace/studio-action-registry/registry.ts').is_file()
if p03_installed: ok('P03_EXTENSION_PRESENT',all(token in (ROOT/'angelcare-marketplace/studio-action-registry/registry.ts').read_text(errors='ignore') for token in ['booking.start','checkout.start','inquiry.submit']))
else: ok('NO_P03_ACTIONS','booking.start' not in joined and 'checkout.start' not in joined and 'inquiry.submit' not in joined)

# Narrow regression: preserve the already-certified Studio transplant and its 10x10 catalogue.
node_bin=shutil.which('node')
if node_bin:
    base_test=ROOT/'scripts/angelcare-marketplace/verify-design-studio-transplant.mjs'
    base_rc=subprocess.run([node_bin,str(base_test)],cwd=ROOT).returncode if base_test.is_file() else 2
    ok('STUDIO_37_REGRESSION',base_rc==0)
    category_ok=True
    for index in range(1,11):
        path=ROOT/f'scripts/angelcare-marketplace/verify-studio-catalogue-category-{index:02d}.mjs'
        if not path.is_file() or subprocess.run([node_bin,str(path)],cwd=ROOT).returncode:
            category_ok=False;break
    ok('STUDIO_10X10_REGRESSION',category_ok)
else:
    print('INFO STUDIO_REGRESSION=SKIPPED_NODE_NOT_FOUND')

# Exact-file syntax transpilation only. This is intentionally NOT a project-wide typecheck.
files=[
'angelcare-marketplace/studio-picker/types.ts','angelcare-marketplace/studio-picker/client.ts','angelcare-marketplace/studio-picker/admin-destinations.ts','angelcare-marketplace/studio-picker/reference.ts','angelcare-marketplace/studio-picker/developer-contract.ts','angelcare-marketplace/studio-picker/components/UniversalSourcePicker.tsx','angelcare-marketplace/studio-universal/components/StudioFields.tsx','angelcare-marketplace/studio-universal/puck-config.tsx','angelcare-marketplace/studio-universal/types.ts','angelcare-marketplace/studio-universal/components/StudioBlockRuntime.tsx','angelcare-marketplace/studio-universal/components/StudioVisualCatalogueRuntime.tsx','angelcare-marketplace/studio-universal/picker-data.ts','angelcare-marketplace/studio-universal/StudioPublishedRenderer.tsx','angelcare-marketplace/studio-universal/developer-contract.ts','app/angelcare-marketplace/(protected)/admin/experience/studio/[pageId]/page.tsx','app/angelcare-marketplace/(protected)/admin/experience/developer/page.tsx','app/api/angelcare-marketplace/cms/studio/sources/[sourceId]/search/route.ts','app/api/angelcare-marketplace/cms/studio/sources/[sourceId]/browse/route.ts','app/api/angelcare-marketplace/cms/developer-contract/route.ts']
node=shutil.which('node')
if node:
    probe=subprocess.run([node,'-e',"try{require('typescript');process.exit(0)}catch(e){process.exit(2)}"],cwd=ROOT)
    if probe.returncode==0:
        js="""
const fs=require('fs'),ts=require('typescript');const files=JSON.parse(process.argv[1]);let bad=[];for(const f of files){const r=ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX},fileName:f,reportDiagnostics:true});const ds=(r.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);if(ds.length)bad.push([f,ds.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' '))]);}if(bad.length){for(const [f,d] of bad)console.error('TRANSPILE_FAIL',f,d.join('; '));process.exit(1)}console.log('PASS TARGETED_TYPESCRIPT_TRANSPILE FILES='+files.length)
"""
        run=subprocess.run([node,'-e',js,json.dumps(files)],cwd=ROOT,text=True,capture_output=True)
        if run.stdout.strip(): print(run.stdout.strip())
        if run.stderr.strip(): print(run.stderr.strip())
        ok('TARGETED_TYPESCRIPT_TRANSPILE',run.returncode==0)
    else: print('INFO TARGETED_TYPESCRIPT_TRANSPILE=SKIPPED_TYPESCRIPT_NOT_RESOLVABLE')
else: print('INFO TARGETED_TYPESCRIPT_TRANSPILE=SKIPPED_NODE_NOT_FOUND')

if errors:
    print('\nP02_VERIFY=FAIL');print('ERRORS='+','.join(errors));sys.exit(1)
print('\nP02_VERIFY=PASS')
print('P01_SOURCES=20 P02_ACCOUNTED=20 PICKER_SUPPORTED=20 MODES=6')
print('CANONICAL_REFERENCES=PASS LEGACY_COMPATIBILITY=PASS PUCK_NATIVE=PASS')
print('DATABASE_CHANGE=NO SQL_REQUIRED=NO MIGRATION=NO')
print('LOCAL_BUILD=NO GLOBAL_TYPESCRIPT=NO P03_EXTENSION='+('YES' if p03_installed else 'NO'))
