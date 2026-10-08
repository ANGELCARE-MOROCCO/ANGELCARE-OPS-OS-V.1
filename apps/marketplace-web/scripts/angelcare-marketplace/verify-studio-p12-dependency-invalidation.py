#!/usr/bin/env python3
from __future__ import annotations
import json,os,re,shutil,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
DIR=ROOT/'angelcare-marketplace/studio-dependency-invalidation'
DOCS=ROOT/'docs/angelcare-marketplace/studio-saturation'
errors=[]
def read(p):
 p=ROOT/p if isinstance(p,str) else p
 if not p.exists(): errors.append('MISSING:'+str(p.relative_to(ROOT))); return ''
 return p.read_text(errors='ignore')
def ok(name,cond,detail=''):
 if cond: print(f'PASS {name}{(" "+detail) if detail else ""}')
 else: errors.append(name); print(f'FAIL {name}{(" "+detail) if detail else ""}')

p11=ROOT/'scripts/angelcare-marketplace/verify-studio-p11-governance.py'
ok('P11_VERIFIER_PRESENT',p11.is_file())
if p11.is_file():
 env=dict(os.environ);env['ANGELCARE_VERIFY_P12_ACTIVE']='1'
 ok('P11_STILL_PASS_FORWARD',subprocess.run([sys.executable,str(p11)],cwd=ROOT,env=env).returncode==0)

files={
 'types':DIR/'types.ts','registry':DIR/'registry.ts','extractor':DIR/'extractor.ts','cache':DIR/'cache.ts','public_cache':DIR/'public-cache.ts','repo':DIR/'repository.ts','invalidation':DIR/'invalidation.ts','dev':DIR/'developer-contract.ts','ui':DIR/'components/StudioImpactInspector.tsx','css':DIR/'components/studio-impact-inspector.module.css','api':ROOT/'app/api/angelcare-marketplace/cms/studio/dependencies/inspect/route.ts',
 'studio_repo':ROOT/'angelcare-marketplace/studio-universal/repository.ts','studio_ui':ROOT/'angelcare-marketplace/studio-universal/components/UniversalExperienceStudio.tsx','studio_dev':ROOT/'angelcare-marketplace/studio-universal/developer-contract.ts','dev_route':ROOT/'app/api/angelcare-marketplace/cms/developer-contract/route.ts','dev_page':ROOT/'app/angelcare-marketplace/(protected)/admin/experience/developer/page.tsx',
 'p04_resolver':ROOT/'angelcare-marketplace/studio-template-assignment/resolver.ts','p04_repo':ROOT/'angelcare-marketplace/studio-template-assignment/repository.ts','p05':ROOT/'angelcare-marketplace/studio-live-binding/template-loader.ts','p06':ROOT/'angelcare-marketplace/studio-dynamic-source/engine.ts','p08':ROOT/'angelcare-marketplace/studio-public-runtime/orchestrator.ts','experience_repo':ROOT/'angelcare-marketplace/experience-builder/repository.ts','commerce_repo':ROOT/'angelcare-marketplace/commerce-studio/repository.ts','marketplace_repo':ROOT/'angelcare-marketplace/marketplace-core/repository.ts','category_native':ROOT/'angelcare-marketplace/category-native/repository.ts'
}
t={k:read(v) for k,v in files.items()}
for k,p in files.items(): ok('FILE_'+k.upper(),p.is_file())

migrations='\n'.join(read(p) for p in (ROOT/'supabase/migrations').glob('*.sql'))
ok('EXISTING_EXPERIENCE_CORE_DEPENDENCY_GRAPH','angelcare_marketplace_cms_dependency_edges' in migrations and 'angelcare_marketplace_cms_refresh_dependencies' in migrations)
ok('P12_REUSES_EXISTING_GRAPH',all(x in t['repo'] for x in ['angelcare_marketplace_cms_dependency_edges',"source_type:'studio_p12'",'syncStudioDocumentDependencies']))
ok('NO_SHADOW_DEPENDENCY_TABLE',not re.search(r'create\s+table[^;]*(studio_p12|studio_dependency|dependency_invalidation)',migrations,re.I))
ok('NO_P12_SQL',not any('p12' in p.name.lower() for p in (ROOT/'supabase/migrations').glob('*.sql')) and not list(DIR.rglob('*.sql')))
ok('DEPENDENCY_VERSION',"STUDIO_DEPENDENCY_VERSION=1" in t['types'])
ok('DEPENDENCY_BOUND_500','STUDIO_DEPENDENCY_MAX_DIRECT=500' in t['types'] and 'STUDIO_DEPENDENCY_MAX_DIRECT' in t['extractor'])
ok('IMPACT_BOUND_250','STUDIO_DEPENDENCY_MAX_IMPACT_PAGES=250' in t['types'] and '.slice(0,250)' in t['repo'])
ok('CANONICAL_REFERENCE_EXTRACTION',all(x in t['extractor'] for x in ['sourceId','entityId','action_target','workflow_target','uses_media','uses_template','uses_context']))
ok('DYNAMIC_SOURCE_FAMILY_DEPENDENCY',"entityId:'*'" in t['extractor'] and '__source_family' in t['extractor'])
ok('NO_BUSINESS_FACT_COPY','noBusinessFactsCopied:true' in t['repo'] and 'noBusinessFactsCopied:true' in t['dev'])

ok('CACHE_ROOT_TAG',"STUDIO_CACHE_ROOT_TAG='acm:studio:p12'" in t['registry'])
ok('TAGGED_CACHE_USES_UNSTABLE_CACHE','unstable_cache' in t['cache'] and "['angelcare-marketplace-studio-p12'" in t['cache'])
ok('CACHE_TTL_BOUNDED','Math.max(30,Math.min(3600' in t['cache'])
ok('REVALIDATE_TAG_MAX',"revalidateTag(tag,'max')" in t['cache'])
ok('REVALIDATE_PATH','revalidatePath(path)' in t['cache'])
ok('TEMPLATE_RESOLUTION_CACHE','cachedTemplateResolution' in t['p04_resolver'])
ok('PUBLISHED_REVISION_CACHE','cachedTemplateRevision' in t['p05'] and "visibility==='public_runtime'" in t['p05'])
ok('ADMIN_PREVIEW_BYPASS_TEMPLATE_CACHE',"visibility==='public_runtime'" in t['p05'])
ok('DYNAMIC_SOURCE_CACHE','cachedDynamicSource' in t['p06'] and "visibility==='public_runtime'" in t['p06'])
ok('ADMIN_PREVIEW_BYPASS_DYNAMIC_CACHE',"visibility==='public_runtime'?cachedDynamicSource" in t['p06'])

ok('DRAFT_DEPENDENCY_SYNC','syncStudioDocumentDependencies' in t['studio_repo'] and 'saved.revision?.id' in t['studio_repo'])
ok('PAGE_INVALIDATION','invalidateStudioPage' in t['studio_repo'] and 'invalidateStudioPage' in t['experience_repo'])
ok('TEMPLATE_INVALIDATION','invalidateStudioTemplate' in t['experience_repo'])
ok('SYMBOL_INVALIDATION',"sourceId:'content.symbols'" in t['experience_repo'])
ok('ASSIGNMENT_INVALIDATION','invalidateStudioAssignment' in t['p04_repo'])
ok('COMMERCE_CENTRAL_INVALIDATION','invalidateStudioCommerceMutation' in t['commerce_repo'] and all(x in t['invalidation'] for x in ['media.assets','homepage.campaigns','homepage.collections','homepage.placements','catalog.items','catalog.categories']))
ok('MARKETPLACE_CORE_ITEM_INVALIDATION','invalidateStudioCommerceMutation' in t['marketplace_repo'])
ok('CATEGORY_NATIVE_SCHEMA_INVALIDATION',"sourceId:'experience.schemas'" in t['category_native'] and 'invalidateStudioReference' in t['category_native'])
ok('CATEGORY_NATIVE_IMPORT_INVALIDATION','category_native_import.' in t['category_native'] and 'category_native_import.rollback' in t['category_native'])

ok('IMPACT_INSPECTOR_API',files['api'].is_file() and "requireMarketplaceApiContext('marketplace.cms.view')" in t['api'] and 'inspectStudioDependencies' in t['api'])
ok('IMPACT_API_READ_ONLY',all(x not in t['api'] for x in ['.insert(','.update(','.delete(','.upsert(','.rpc(']))
ok('IMPACT_INSPECTOR_BATCHED','targetTypes.length' in t['repo'] and '.limit(5000)' in t['repo'] and 'for(const row of graph.dependencies.slice(0,25))' not in t['repo'])
ok('IMPACT_UI_MOUNTED','<StudioImpactInspector' in t['studio_ui'] and 'Impact P12' in t['studio_ui'])
ok('IMPACT_UI_CURRENT_DRAFT','data={data}' in t['studio_ui'] and 'pageId={page.id}' in t['studio_ui'])
ok('IMPACT_UI_ACCESSIBLE','role="dialog"' in t['ui'] and 'aria-modal="true"' in t['ui'])

ok('P12_DEVELOPER_CONTRACT',all(x in t['dev'] for x in ['2026-09-20.P12','angelcare_marketplace_cms_dependency_edges','template-resolution','template-revision','dynamic-source','noShadowDependencyStore:true','noSql:true']))
ok('UNIVERSAL_CONTRACT_EXTENDED','STUDIO_DEPENDENCY_INVALIDATION_DEVELOPER_CONTRACT' in t['studio_dev'] and 'dependencyInvalidationTaggedReads' in t['studio_dev'] and 'p12DependencyInvalidationEngine: true' in t['studio_dev'])
ok('DEVELOPER_SCOPE_P12',"scope==='dependency-invalidation'" in t['dev_route'] and 'X-Studio-Dependency-P12-SHA256' in t['dev_route'] and 'scope=dependency-invalidation&format=json' in t['dev_page'])
for f in ['P12_DEPENDENCY_INVALIDATION_CONTRACT.json','P12_IMPACT_MATRIX.json','P12_CERTIFICATION.md']: ok('DOC_'+f,(DOCS/f).is_file())

runtime='\n'.join(t[k] for k in ['types','registry','extractor','cache','public_cache','repo','invalidation','dev','ui','api'])
for name,patterns in {'LOCALSTORAGE':['localStorage.','window.localStorage'],'SESSIONSTORAGE':['sessionStorage.','window.sessionStorage'],'EVAL':['eval('],'NEW_FUNCTION':['new Function(']}.items(): ok('FORBIDDEN_'+name,all(x not in runtime for x in patterns))
p13_active=os.environ.get('ANGELCARE_VERIFY_P13_ACTIVE')=='1'
if p13_active:
 ok('P13_FORWARD_COMPAT',"scope==='contract-saturation'" in t['dev_route'] and 'contractSaturationScopes' in t['studio_dev'] and 'P13 Master Contract' in t['dev_page'])
else:
 ok('NO_P13_SATURATION','developer contract saturation' not in runtime.lower())

node=shutil.which('node')
if node:
 fixture = r"""const fs=require('fs'),ts=require('typescript'),os=require('os'),path=require('path');let src=fs.readFileSync('angelcare-marketplace/studio-dependency-invalidation/extractor.ts','utf8');src=src.replace(/import type \{ ComponentData,Data \} from '@puckeditor\/core'\n/,'').replace(/import \{ getStudioSourceDescriptor \} from '@\/angelcare-marketplace\/studio-source-registry\/registry'\n/,"const getStudioSourceDescriptor=(id)=>({id})\n").replace(/import type \{ StudioSourceReference \} from '@\/angelcare-marketplace\/studio-source-registry\/types'\n/,'').replace(/import \{ isStudioDependencySource,studioSourceEntityTag,studioSourceFamilyTag \} from '\.\/registry'\n/,"const isStudioDependencySource=()=>true;const studioSourceFamilyTag=(s)=>'family:'+s;const studioSourceEntityTag=(r)=>'entity:'+r.sourceId+':'+r.entityId\n").replace(/import \{ STUDIO_DEPENDENCY_MAX_DIRECT,type StudioDependencyGraph,type StudioDependencyReference,type StudioDependencyRelation \} from '\.\/types'\n/,"const STUDIO_DEPENDENCY_MAX_DIRECT=500\n");const out=ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},fileName:'extractor.ts'}).outputText;const f=path.join(os.tmpdir(),'ac-p12-'+process.pid+'.cjs');fs.writeFileSync(f,out);const m=require(f);const data={content:[{type:'x',props:{id:'b1',product:{sourceId:'catalog.items',entityId:'p1'},hero:{sourceId:'media.assets',entityId:'m1'},__studioDynamicSource:{sourceId:'catalog.items',strategy:'featured'}}}]};const g=m.extractStudioDependencies(data);if(g.dependencyCount!==3)process.exit(11);if(!g.dependencies.some(x=>x.sourceId==='catalog.items'&&x.entityId==='*'))process.exit(12);if(!g.cacheTags.includes('entity:catalog.items:p1'))process.exit(13);console.log('PASS P12_DEPENDENCY_FIXTURE');fs.unlinkSync(f)"""
 r=subprocess.run([node,'-e',fixture],cwd=ROOT,text=True,capture_output=True)
 if r.stdout.strip(): print(r.stdout.strip())
 if r.stderr.strip(): print(r.stderr.strip())
 ok('P12_DEPENDENCY_FIXTURE',r.returncode==0)
 base=ROOT/'scripts/angelcare-marketplace/verify-design-studio-transplant.mjs'
 ok('STUDIO_37_REGRESSION',base.is_file() and subprocess.run([node,str(base)],cwd=ROOT).returncode==0)
 cats=True
 for i in range(1,11):
  f=ROOT/f'scripts/angelcare-marketplace/verify-studio-catalogue-category-{i:02d}.mjs'
  if not f.is_file() or subprocess.run([node,str(f)],cwd=ROOT).returncode: cats=False; break
 ok('STUDIO_10X10_REGRESSION',cats)

base_env=os.environ.get('ANGELCARE_P12_BASELINE')
changed=[]
if base_env and Path(base_env).is_dir():
 base=Path(base_env)
 for p in ROOT.rglob('*'):
  if p.is_file() and p.suffix in {'.ts','.tsx'}:
   rel=p.relative_to(ROOT); q=base/rel
   if not q.exists() or p.read_bytes()!=q.read_bytes(): changed.append(str(rel))
else:
 changed=[str(files[k].relative_to(ROOT)) for k in ['types','registry','extractor','cache','public_cache','repo','invalidation','dev','ui','api','studio_repo','studio_ui','studio_dev','dev_route','dev_page','p04_resolver','p04_repo','p05','p06','p08','experience_repo','commerce_repo','marketplace_repo','category_native'] if files[k].suffix in {'.ts','.tsx'}]
changed=sorted(set(changed))
if node:
 js="""const fs=require('fs'),ts=require('typescript');const files=JSON.parse(process.argv[1]);let bad=[];for(const f of files){const r=ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.Preserve,isolatedModules:true},fileName:f,reportDiagnostics:true});const ds=(r.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);if(ds.length)bad.push([f,ds.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' '))]);}if(bad.length){for(const [f,d] of bad)console.error('TRANSPILE_FAIL',f,d.join('; '));process.exit(1)}console.log('PASS TARGETED_TYPESCRIPT_TRANSPILE FILES='+files.length)"""
 r=subprocess.run([node,'-e',js,json.dumps(changed)],cwd=ROOT,text=True,capture_output=True)
 if r.stdout.strip(): print(r.stdout.strip())
 if r.stderr.strip(): print(r.stderr.strip())
 ok('TARGETED_TYPESCRIPT_TRANSPILE',r.returncode==0,f'FILES={len(changed)}')

if errors:
 print('\nP12_VERIFY=FAIL');print('ERRORS='+','.join(errors));sys.exit(1)
print('\nP12_VERIFY=PASS')
print('DEPENDENCY_AUTHORITY=EXPERIENCE_CORE TAGGED_READS=3 AUTOMATIC_INVALIDATION=PASS IMPACT_INSPECTOR=PASS')
print('CACHE=UNSTABLE_CACHE REVALIDATE_TAG=PASS REVALIDATE_PATH=PASS ADMIN_PREVIEW_BYPASS=PASS')
print('NO_SHADOW_DEPENDENCY_STORE=PASS NO_BUSINESS_FACT_COPY=PASS')
print('DATABASE_SCHEMA_CHANGE=NO SQL_REQUIRED=NO MIGRATION=NO')
print('LOCAL_BUILD=NO GLOBAL_TYPESCRIPT=NO P13_CONTRACT_SATURATION=NO')
