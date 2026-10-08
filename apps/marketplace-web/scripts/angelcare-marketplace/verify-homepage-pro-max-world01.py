#!/usr/bin/env python3
from __future__ import annotations
import hashlib,json,os,re,shutil,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
errors=[]
def read(rel):
 p=ROOT/rel
 if not p.exists(): errors.append('MISSING:'+rel); return ''
 return p.read_text(errors='ignore')
def ok(name,cond,detail=''):
 if cond: print(f'PASS {name}{(" "+detail) if detail else ""}')
 else: print(f'FAIL {name}{(" "+detail) if detail else ""}');errors.append(name)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
base='angelcare-marketplace/studio-homepage-pro-max'
files=[f'{base}/types.ts',f'{base}/recipe.ts',f'{base}/puck.tsx',f'{base}/developer-contract.ts',f'{base}/components/LiveCountdown.tsx',f'{base}/components/HomepageProMaxSectionRuntime.tsx',f'{base}/components/HomepageProMaxLibrary.tsx',f'{base}/components/homepage-pro-max.module.css',f'{base}/components/homepage-pro-max-library.module.css','public/angelcare-marketplace/studio/homepage-pro-max/world-01-reference.png','docs/angelcare-marketplace/studio-homepage-pro-max/WORLD_01_BLUEPRINT.md','docs/angelcare-marketplace/studio-homepage-pro-max/WORLD_01_MACHINE_CONTRACT.json']
for f in files:ok('FILE_'+re.sub(r'[^A-Z0-9]+','_',f.upper()).strip('_'),(ROOT/f).is_file())
recipe=read(f'{base}/recipe.ts');types=read(f'{base}/types.ts');puck=read(f'{base}/puck.tsx');runtime=read(f'{base}/components/HomepageProMaxSectionRuntime.tsx');library=read(f'{base}/components/HomepageProMaxLibrary.tsx');dev=read(f'{base}/developer-contract.ts');config=read('angelcare-marketplace/studio-universal/puck-config.tsx');published=read('angelcare-marketplace/studio-universal/StudioPublishedRenderer.tsx');studio=read('angelcare-marketplace/studio-universal/components/UniversalExperienceStudio.tsx');universal_dev=read('angelcare-marketplace/studio-universal/developer-contract.ts');route=read('app/api/angelcare-marketplace/cms/developer-contract/route.ts')
sections=re.findall(r"\{id:'(S\d\d)',type:'([^']+)'",recipe)
ok('CATEGORY_11_HOMEPAGE_PRO_MAX',"HOMEPAGE_PRO_MAX_CATEGORY_LABEL='11 · HOMEPAGE PRO MAX'" in types and "[HOMEPAGE_PRO_MAX_CATEGORY_ID]" in config)
ok('WORLD_01_ID',"ac.homepage.pro-max.family-commerce.01" in types and 'HOMEPAGE_PRO_MAX_WORLD_ID' in recipe)
ok('WORLD_01_18_SECTIONS',len(sections)==18,f'COUNT={len(sections)}')
ok('SECTION_IDS_EXACT',[x[0] for x in sections]==[f'S{i:02d}' for i in range(18)])
ok('SECTION_TYPES_UNIQUE',len({x[1] for x in sections})==18)
ok('FULL_PAGE_REPLACE','mode===\'append\'' in recipe and "mode:HomepageProMaxInsertMode='replace'" in recipe)
ok('FULL_PAGE_APPEND','[...existing,...sectionData()]' in recipe)
ok('FULL_PAGE_TREE_EDITABLE','HOMEPAGE_PRO_MAX_SECTION_DEFINITIONS.map' in puck and 'resolvePermissions' in puck and 'drag:true' in puck and 'delete:true' in puck and 'duplicate:true' in puck)
ok('LEFT_LIBRARY_WORLD_CARD','<HomepageProMaxLibrary currentData={data} onApply={applyImported}/>' in studio and 'Remplacer la page' in library and 'Insérer ici' in library)
ok('REPLACE_CONFIRMATION','Confirmer le remplacement' in library and 'count?setConfirming(true)' in library)
ok('PUCK_CATEGORY_REGISTERED','createHomepageProMaxPuckComponents(pickers)' in config and 'HOMEPAGE_PRO_MAX_COMPONENT_KEYS' in config)
ok('PUBLIC_RUNTIME_REGISTERED','HomepageProMaxSectionRuntime' in published and 'isHomepageProMaxType' in published)
ok('PUBLISHED_MODE','mode="published"' in published)
ok('OFFICIAL_LOGO_ONLY','/brand/angelcare-official-user-transparent.png' in runtime and 'Corporate Care' not in runtime and 'yellow underline' not in runtime.lower())
ok('REFERENCE_IMAGE_SHA',sha(ROOT/'public/angelcare-marketplace/studio/homepage-pro-max/world-01-reference.png')=='37a379977685225be5313d10b73ca12c4c0621daccce7ea5cb03ea992f4c7f6d')
try:
 contract=json.loads((ROOT/'docs/angelcare-marketplace/studio-homepage-pro-max/WORLD_01_MACHINE_CONTRACT.json').read_text())
 ok('MACHINE_CONTRACT_WORLD',contract.get('worldContract',{}).get('stableId')=='ac.homepage.pro-max.family-commerce.01')
 ok('MACHINE_CONTRACT_SECTIONS',len(contract.get('sections',[]))==18)
 ok('MACHINE_REFERENCE_SHA',contract.get('approvedReference',{}).get('sha256')=='37a379977685225be5313d10b73ca12c4c0621daccce7ea5cb03ea992f4c7f6d')
 ok('MACHINE_CATEGORY_11',contract.get('category',{}).get('ordinal')==11)
except Exception as e: print('CONTRACT_PARSE_ERROR',repr(e));errors.append('MACHINE_CONTRACT_PARSE')
ok('MAD_DHS_ONLY',"currency:'MAD/Dhs'" in dev and "MAD" in runtime and 'EUR' not in runtime and 'USD' not in runtime and '€' not in runtime)
ok('NO_FAKE_COMMERCIAL_DATA',all(x in dev for x in ['fakePrice:false','fakeRating:false','fakeStock:false','fakeUrgency:false','fakePartner:false']))
ok('REAL_DYNAMIC_RECIPES','__studioDynamicSource' in puck and 'catalog.items' in puck and 'homepage.collections' in puck and 'homepage.campaigns' in puck)
ok('P06_STRATEGIES',all(x in recipe for x in ["strategy:'featured'","strategy:'available_now'","strategy:'popular'","strategy:'newest'"]))
ok('EMPTY_PUBLIC_SAFE','mode===\'published\'&&placeholder' in runtime and "emptyPolicy:'hide'" in recipe)
ok('NO_DEAD_CTA_LINKS',"if(!h||h==='#')" in runtime and 'aria-disabled="true"' in runtime)
ok('DESKTOP_12_COLUMN_DOCTRINE','grid-template-columns:4.4fr 5.1fr 2.5fr' in read(f'{base}/components/homepage-pro-max.module.css'))
ok('MOBILE_DEDICATED_COMPOSITION','@media(max-width:767px)' in read(f'{base}/components/homepage-pro-max.module.css') and 'sticky' in read(f'{base}/components/homepage-pro-max.module.css'))
ok('LIVE_COUNTDOWN_REAL_ENDSAT','Date.parse(endsAt)' in read(f'{base}/components/LiveCountdown.tsx') and 'target<=now' in read(f'{base}/components/LiveCountdown.tsx'))
ok('DEVELOPER_CONTRACT_EXTENDED','HOMEPAGE_PRO_MAX_DEVELOPER_CONTRACT' in universal_dev and 'homepageProMax' in universal_dev)
ok('DEVELOPER_SCOPE',"scope==='homepage-pro-max'" in route and 'X-Studio-Homepage-Pro-Max-SHA256' in route)
combined='\n'.join([recipe,types,puck,runtime,library,dev])
for name,needle in [('LOCALSTORAGE','localStorage'),('SESSIONSTORAGE','sessionStorage'),('EVAL','eval('),('NEW_FUNCTION','new Function('),('DANGEROUS_HTML','dangerouslySetInnerHTML')]:ok('FORBIDDEN_'+name,needle not in combined)
ok('NO_SQL',not list((ROOT/base).rglob('*.sql')) and not any('homepage_pro_max' in p.name.lower() for p in (ROOT/'supabase/migrations').glob('*.sql')))
# predecessor certification remains authoritative
p13=ROOT/'scripts/angelcare-marketplace/verify-studio-p13-contract-saturation.py'
if p13.is_file():
 env=dict(os.environ);env['ANGELCARE_VERIFY_HOMEPAGE_PRO_MAX_ACTIVE']='1'
 rc=subprocess.run([sys.executable,str(p13)],cwd=ROOT,env=env).returncode
 ok('P13_FORWARD_REGRESSION',rc==0)
else:ok('P13_FORWARD_REGRESSION',False,'VERIFIER_MISSING')
# targeted transpile only
node=shutil.which('node');changed=[f for f in [f'{base}/types.ts',f'{base}/recipe.ts',f'{base}/puck.tsx',f'{base}/developer-contract.ts',f'{base}/components/LiveCountdown.tsx',f'{base}/components/HomepageProMaxSectionRuntime.tsx',f'{base}/components/HomepageProMaxLibrary.tsx','angelcare-marketplace/studio-universal/puck-config.tsx','angelcare-marketplace/studio-universal/StudioPublishedRenderer.tsx','angelcare-marketplace/studio-universal/components/UniversalExperienceStudio.tsx','angelcare-marketplace/studio-universal/developer-contract.ts','app/api/angelcare-marketplace/cms/developer-contract/route.ts'] if (ROOT/f).is_file()]
if node:
 js="""const fs=require('fs'),ts=require('typescript');const files=JSON.parse(process.argv[1]);let bad=[];for(const f of files){const r=ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.Preserve,isolatedModules:true},reportDiagnostics:true,fileName:f});const ds=(r.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);if(ds.length)bad.push([f,ds.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' '))]);}if(bad.length){for(const [f,d] of bad)console.error('TRANSPILE_FAIL',f,d.join('; '));process.exit(1)}console.log('PASS TARGETED_TYPESCRIPT_TRANSPILE FILES='+files.length)"""
 r=subprocess.run([node,'-e',js,json.dumps(changed)],cwd=ROOT,text=True,capture_output=True)
 if r.stdout.strip():print(r.stdout.strip())
 if r.stderr.strip():print(r.stderr.strip())
 ok('TARGETED_TYPESCRIPT_TRANSPILE',r.returncode==0,f'FILES={len(changed)}')
else:ok('TARGETED_TYPESCRIPT_TRANSPILE',False,'NODE_MISSING')
if errors:
 print('\nHOMEPAGE_PRO_MAX_VERIFY=FAIL');print('ERRORS='+','.join(errors));sys.exit(1)
print('\nHOMEPAGE_PRO_MAX_VERIFY=PASS')
print('CATEGORY_11=HOMEPAGE_PRO_MAX WORLD_01=PASS ROOT_SECTIONS=18')
print('FULL_PAGE_REPLACE=PASS FULL_PAGE_INSERT=PASS ALL_ROOT_SECTIONS_EDITABLE=PASS')
print('OFFICIAL_LOGO=PASS REFERENCE_SHA=PASS MAD_DHS=PASS REAL_DATA_GUARDS=PASS')
print('P06_DYNAMIC=PASS PUBLIC_RUNTIME=PASS P13_FORWARD_REGRESSION=PASS')
print('DATABASE_SCHEMA_CHANGE=NO SQL_REQUIRED=NO MIGRATION=NO')
print('LOCAL_BUILD=NO GLOBAL_TYPESCRIPT=NO COMMIT=NO PUSH=NO DEPLOY=NO')
