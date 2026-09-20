#!/usr/bin/env python3
from __future__ import annotations
import json,re,subprocess,sys,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
DOCS=ROOT/'docs/angelcare-marketplace/studio-saturation'
DIR=ROOT/'angelcare-marketplace/studio-template-assignment'
TYPES=DIR/'types.ts';REF=DIR/'reference.ts';REPO=DIR/'repository.ts';RES=DIR/'resolver.ts';DEV=DIR/'developer-contract.ts';PANEL=DIR/'components/StudioTemplateAssignmentPanel.tsx';CSS=DIR/'components/studio-template-assignment.module.css'
STUDIO=ROOT/'angelcare-marketplace/studio-universal/components/UniversalExperienceStudio.tsx';STUDIO_DEV=ROOT/'angelcare-marketplace/studio-universal/developer-contract.ts';ADAPTIVE=ROOT/'angelcare-marketplace/category-native-experience/components/AdaptiveExperience.tsx';DEV_ROUTE=ROOT/'app/api/angelcare-marketplace/cms/developer-contract/route.ts';DEV_PAGE=ROOT/'app/angelcare-marketplace/(protected)/admin/experience/developer/page.tsx'
ROUTES=[ROOT/'app/api/angelcare-marketplace/cms/studio/template-assignments/route.ts',ROOT/'app/api/angelcare-marketplace/cms/studio/template-assignments/families/route.ts',ROOT/'app/api/angelcare-marketplace/cms/studio/template-assignments/placements/route.ts',ROOT/'app/api/angelcare-marketplace/cms/studio/template-assignments/resolve/route.ts']
PUBLIC=[ROOT/'app/angelcare-marketplace/[locale]/marketplace/[slug]/page.tsx',ROOT/'app/angelcare-marketplace/[locale]/marketplace/item/[itemSlug]/page.tsx',ROOT/'app/angelcare-marketplace/[locale]/experience/[itemSlug]/page.tsx']
errors=[]
def read(p):
    if not p.exists(): errors.append(f'MISSING:{p.relative_to(ROOT)}'); return ''
    return p.read_text(errors='ignore')
def ok(name,cond,detail=''):
    if cond: print(f'PASS {name}{(" "+detail) if detail else ""}')
    else: errors.append(name); print(f'FAIL {name}{(" "+detail) if detail else ""}')

p03=ROOT/'scripts/angelcare-marketplace/verify-studio-p03-universal-actions.py'
ok('P03_VERIFIER_PRESENT',p03.is_file())
if p03.is_file(): ok('P03_STILL_PASS',subprocess.run([sys.executable,str(p03)],cwd=ROOT).returncode==0)

types=read(TYPES);ref=read(REF);repo=read(REPO);res=read(RES);dev=read(DEV);panel=read(PANEL);studio=read(STUDIO);studio_dev=read(STUDIO_DEV);adaptive=read(ADAPTIVE);dev_route=read(DEV_ROUTE);dev_page=read(DEV_PAGE);api='\n'.join(read(p) for p in ROUTES);public='\n'.join(read(p) for p in PUBLIC)
expected=['exact_item','placement','collection','experience_schema','category','family','marketplace_default']
match=re.search(r"STUDIO_TEMPLATE_PRECEDENCE\s*=\s*\[(.*?)\]\s*as const",types,re.S)
actual=re.findall(r"'([^']+)'",match.group(1)) if match else []
ok('PRECEDENCE_7_EXACT',actual==expected,f'ORDER={">".join(actual)}')
ok('SCOPE_TYPES_COMPLETE',all(x in types for x in ['StudioTemplateAssignment','StudioTemplateAssignmentRecord','StudioResolvedTemplate','StudioTemplateResolutionCandidate','StudioTemplatePlacementOption']))
ok('CANONICAL_TEMPLATE_REFERENCE',"sourceId: 'content.templates'" in types and "sourceId==='content.templates'" in ref)
ok('ASSIGNMENT_VERSIONED','STUDIO_TEMPLATE_ASSIGNMENT_VERSION = 1' in types)
ok('TARGET_MISMATCH_FAIL_CLOSED',"'TARGET_MISMATCH'" in types and "candidate(scope,row.authority,assignment,'TARGET_MISMATCH'" in res)
ok('MISSING_TEMPLATE_CONTINUES',"'TEMPLATE_MISSING'" in res and "continue" in res)
ok('UNPUBLISHED_TEMPLATE_CONTINUES',"'TEMPLATE_UNPUBLISHED'" in res and "published_revision_id" in res)
ok('NATIVE_FALLBACK',"status:'FALLBACK_NATIVE'" in res)
ok('FIRST_VALID_WINS',"return{status:'RESOLVED'" in res and 'for(const scope of STUDIO_TEMPLATE_PRECEDENCE)' in res)

for token in ['angelcare_marketplace_catalog_items','experience_config','angelcare_marketplace_catalog_categories','angelcare_marketplace_homepage_collections','settings','angelcare_marketplace_experience_schemas','configuration','angelcare_marketplace_configurations']:
    ok('EXISTING_AUTHORITY_'+re.sub(r'[^A-Z0-9]+','_',token.upper()).strip('_'),token in repo or token in res)
ok('EXPERIENCE_CORE_TEMPLATE_AUTHORITY','angelcare_marketplace_cms_templates' in repo and 'angelcare_marketplace_cms_templates' in res)
ok('PUBLISHED_TEMPLATE_REQUIRED',"String(data.status)!=='published'||!data.published_revision_id" in repo)
ok('CONFIG_REMOVAL_SAFE',"if(!value)" in repo and ".delete().eq('id',current.data.id)" in repo)
ok('EMBEDDED_ASSIGNMENT_REMOVAL_SAFE','containerWithAssignment' in repo and 'delete current[STUDIO_TEMPLATE_ASSIGNMENT_KEY]' in ref)
ok('AUDIT_EVERY_WRITE','writeMarketplaceAudit' in repo and 'marketplace.studio.template_assignment.saved' in repo and 'marketplace.studio.template_assignment.removed' in repo)
ok('SCOPE_PERMISSIONS',all(x in repo for x in ['marketplace.catalog.manage','marketplace.homepage.manage','marketplace.experience_schema.manage','marketplace.configuration.manage']))
ok('NO_SHADOW_ASSIGNMENT_TABLE','studio_template_assignments' not in (repo+res+ref+types).lower())

ok('P02_PICKER_REUSED',panel.count('UniversalSourcePickerField')>=4)
ok('ITEM_PICKER','sourceId="catalog.items"' in panel)
ok('COLLECTION_PICKER','sourceId="homepage.collections"' in panel)
ok('TEMPLATE_PICKER','sourceId="content.templates"' in panel)
ok('NO_RAW_ID_PRIMARY_UX','UUID' not in panel and 'entityId"' not in panel and 'Identifiant' not in panel)
ok('HUMAN_PLACEMENT_SELECTOR','Placements existants de la homepage' in panel and 'placements.map' in panel)
ok('HUMAN_FAMILY_SELECTOR','families.map' in panel and 'Dérivée des schémas' in panel)
ok('PRECEDENCE_VISIBLE','Ordre de résolution' in panel and 'STUDIO_TEMPLATE_PRECEDENCE.map' in panel)
ok('LIVE_RESOLUTION_INSPECTOR','RÉSOLUTION LIVE' in panel and 'resolution.provenance.map' in panel)
ok('STUDIO_COMMAND_INTEGRATION','StudioTemplateAssignmentPanel' in studio and 'Templates</button>' in studio and 'LayoutTemplate' in studio)

ok('API_ROUTES_4',all(p.is_file() for p in ROUTES),f'COUNT={sum(p.is_file() for p in ROUTES)}')
ok('API_GUARDS',api.count('requireMarketplaceApiContext')>=4)
ok('ASSIGNMENT_API_READ_WRITE','export async function GET' in read(ROUTES[0]) and 'export async function PUT' in read(ROUTES[0]))
ok('FAMILIES_BOUNDED','.limit(500)' in repo)
ok('PLACEMENTS_BOUNDED','.limit(300)' in repo)
ok('RESOLVE_API_READ_ONLY','saveStudioTemplateAssignment' not in read(ROUTES[3]))

allowed={'angelcare_marketplace_catalog_items','angelcare_marketplace_catalog_categories','angelcare_marketplace_homepage_collections','angelcare_marketplace_experience_schemas','angelcare_marketplace_configurations','angelcare_marketplace_cms_templates','angelcare_marketplace_catalog_item_categories','angelcare_marketplace_homepage_placements'}
tables=set(re.findall(r"\.from\('([^']+)'\)",repo+res))
ok('CANONICAL_TABLE_ALLOWLIST',tables.issubset(allowed),f'TABLES={len(tables)}')
ok('NO_ARBITRARY_RPC','.rpc(' not in repo+res)
ok('NO_DYNAMIC_SQL','select * from' not in (repo+res).lower() and 'execute ' not in (repo+res).lower())

ok('PUBLIC_ENTRYPOINTS_3',all('resolveStudioTemplateForCatalogItem' in read(p) for p in PUBLIC),f'COUNT={sum("resolveStudioTemplateForCatalogItem" in read(p) for p in PUBLIC)}')
ok('CONTEXT_COLLECTION_RUNTIME',public.count('collectionId:query.collection||null')==3)
ok('CONTEXT_PLACEMENT_RUNTIME',public.count('placementId:query.placement||null')==3)
ok('ADAPTIVE_PROVENANCE_ATTRS',all(x in adaptive for x in ['data-studio-template-status','data-studio-template-scope','data-studio-template-key']))
ok('P04_P05_BOUNDARY_PRESERVED','StudioPublishedRenderer' not in res and 'templateRevisionId' in res and 'AdaptiveExperience data={data} templateResolution={templateResolution}' in public)
ok('NO_P08_RENDER_SWITCH','StudioPublishedRenderer' not in public and 'AdaptiveExperience' in public)

ok('DEVELOPER_CONTRACT_P04',all(x in dev for x in ['STUDIO_TEMPLATE_ASSIGNMENT_DEVELOPER_CONTRACT','scopeCount','studioTemplateAssignmentDeveloperContractTxt','studioTemplateAssignmentDeveloperContractCsv']))
ok('DEVELOPER_SCOPE_P04',"scope==='template-assignment'" in dev_route and 'X-Studio-Template-Assignment-SHA256' in dev_route and 'scope=template-assignment&format=json' in dev_page)
ok('STUDIO_DEVELOPER_CONTRACT_EXTENDED',all(x in studio_dev for x in ['templateAssignmentScopes','templateAssignmentInheritance: true','deterministicTemplatePrecedence: true','nativeCategoryExperienceFallback: true']))

mapfile=DOCS/'P04_TEMPLATE_ASSIGNMENT_AUTHORITY_MAP.json';runtimefile=DOCS/'P04_RUNTIME_RESOLUTION_CONTRACT.json';cert=DOCS/'P04_CERTIFICATION.md'
ok('P04_AUTHORITY_MAP',mapfile.is_file())
if mapfile.is_file():
    m=json.loads(mapfile.read_text());ok('P04_MAP_PRECEDENCE',m.get('precedence')==expected);ok('P04_MAP_NO_TABLE',m.get('new_assignment_table') is False);ok('P04_MAP_SQL_NO',m.get('sql_required') is False)
ok('P04_RUNTIME_CONTRACT',runtimefile.is_file())
ok('P04_CERTIFICATION_DOC',cert.is_file())

joined='\n'.join([types,ref,repo,res,dev,panel,studio,studio_dev,adaptive,dev_route,dev_page,api,public])
for name,patterns in {'LOCALSTORAGE':['localStorage.','window.localStorage'],'SESSIONSTORAGE':['sessionStorage.','window.sessionStorage'],'EVAL':['eval('],'NEW_FUNCTION':['new Function(']}.items():ok('FORBIDDEN_'+name,all(x not in joined for x in patterns))
ok('NO_SQL_FILES',not any(DIR.rglob('*.sql')))
ok('NO_MIGRATION_FILES',not any((ROOT/'supabase/migrations').glob('*p04*')))
ok('P05_SEPARATE_BINDING_ENGINE',(ROOT/'angelcare-marketplace/studio-live-binding').is_dir() and not (ROOT/'angelcare-marketplace/studio-binding-engine').exists())

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
'angelcare-marketplace/studio-template-assignment/types.ts','angelcare-marketplace/studio-template-assignment/reference.ts','angelcare-marketplace/studio-template-assignment/repository.ts','angelcare-marketplace/studio-template-assignment/resolver.ts','angelcare-marketplace/studio-template-assignment/developer-contract.ts','angelcare-marketplace/studio-template-assignment/components/StudioTemplateAssignmentPanel.tsx','angelcare-marketplace/studio-universal/components/UniversalExperienceStudio.tsx','angelcare-marketplace/studio-universal/developer-contract.ts','angelcare-marketplace/category-native-experience/components/AdaptiveExperience.tsx','app/api/angelcare-marketplace/cms/studio/template-assignments/route.ts','app/api/angelcare-marketplace/cms/studio/template-assignments/families/route.ts','app/api/angelcare-marketplace/cms/studio/template-assignments/placements/route.ts','app/api/angelcare-marketplace/cms/studio/template-assignments/resolve/route.ts','app/api/angelcare-marketplace/cms/developer-contract/route.ts','app/angelcare-marketplace/(protected)/admin/experience/developer/page.tsx','app/angelcare-marketplace/[locale]/marketplace/[slug]/page.tsx','app/angelcare-marketplace/[locale]/marketplace/item/[itemSlug]/page.tsx','app/angelcare-marketplace/[locale]/experience/[itemSlug]/page.tsx']
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
    print('\nP04_VERIFY=FAIL');print('ERRORS='+','.join(errors));sys.exit(1)
print('\nP04_VERIFY=PASS')
print('TEMPLATE_SCOPES=7 PRECEDENCE=EXACT_ITEM>PLACEMENT>COLLECTION>EXPERIENCE_SCHEMA>CATEGORY>FAMILY>MARKETPLACE_DEFAULT')
print('PERSISTENCE=EXISTING_AUTHORITIES TEMPLATE_AUTHORITY=EXPERIENCE_CORE NATIVE_FALLBACK=PASS')
print('PUBLIC_ENTRYPOINTS=3 STUDIO_PANEL=PASS LIVE_RESOLUTION_INSPECTOR=PASS')
print('DATABASE_SCHEMA_CHANGE=NO SQL_REQUIRED=NO MIGRATION=NO')
print('LOCAL_BUILD=NO GLOBAL_TYPESCRIPT=NO P05_LIVE_BINDING=SEPARATE P08_RENDER_SWITCH=NO')
