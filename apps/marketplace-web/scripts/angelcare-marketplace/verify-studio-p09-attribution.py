#!/usr/bin/env python3
from __future__ import annotations
import json,os,re,shutil,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
ATTR=ROOT/'angelcare-marketplace/studio-attribution'
DOCS=ROOT/'docs/angelcare-marketplace/studio-saturation'
errors=[]
def read(rel):
 p=ROOT/rel if isinstance(rel,str) else rel
 if not p.exists(): errors.append(f'MISSING:{p.relative_to(ROOT)}');return ''
 return p.read_text(errors='ignore')
def ok(name,cond,detail=''):
 if cond: print(f'PASS {name}{(" "+detail) if detail else ""}')
 else: errors.append(name);print(f'FAIL {name}{(" "+detail) if detail else ""}')

# predecessor, forward-aware
p08=ROOT/'scripts/angelcare-marketplace/verify-studio-p08-public-runtime.py'
ok('P08_VERIFIER_PRESENT',p08.is_file())
if p08.is_file():
 env=dict(os.environ);env['ANGELCARE_VERIFY_P09_ACTIVE']='1'
 ok('P08_STILL_PASS_FORWARD',subprocess.run([sys.executable,str(p08)],cwd=ROOT,env=env).returncode==0)

files={
 'types':ATTR/'types.ts','context':ATTR/'context.ts','client':ATTR/'client.ts','server':ATTR/'server.ts','dev':ATTR/'developer-contract.ts',
 'orch':ROOT/'angelcare-marketplace/studio-public-runtime/orchestrator.ts','published':ROOT/'angelcare-marketplace/studio-universal/StudioPublishedRenderer.tsx','catalog':ROOT/'angelcare-marketplace/catalog-discovery/components/CatalogCard.tsx',
 'action':ROOT/'angelcare-marketplace/studio-action-registry/components/StudioActionLink.tsx','workflow_form':ROOT/'angelcare-marketplace/studio-workflows/components/StudioWorkflowForm.tsx','workflow_exec':ROOT/'angelcare-marketplace/studio-workflows/executor.ts',
 'workflow_route':ROOT/'app/api/angelcare-marketplace/public/studio-workflows/[workflowId]/route.ts','public_types':ROOT/'angelcare-marketplace/public-universe/types.ts','public_repo':ROOT/'angelcare-marketplace/public-universe/repository.ts','public_page':ROOT/'angelcare-marketplace/public-universe/components/PublicPageRenderer.tsx',
 'conv_types':ROOT/'angelcare-marketplace/conversion-universe/types.ts','conv_repo':ROOT/'angelcare-marketplace/conversion-universe/repository.ts','conv_validation':ROOT/'angelcare-marketplace/conversion-universe/validation.ts','conv_hook':ROOT/'angelcare-marketplace/conversion-universe/components/useConversionEngine.ts','conv_admin':ROOT/'angelcare-marketplace/conversion-universe/components/ConversionSessionDossier.tsx',
 'cat_types':ROOT/'angelcare-marketplace/category-native-experience/types.ts','cat_api':ROOT/'angelcare-marketplace/category-native-experience/api-handlers.ts','cat_repo':ROOT/'angelcare-marketplace/category-native-experience/repository.ts','cat_client':ROOT/'angelcare-marketplace/category-native-experience/components/ExperienceConfigurator.tsx',
 'family':ROOT/'angelcare-marketplace/family-experience/repository.ts','inquiry_admin':ROOT/'angelcare-marketplace/total-commerce-control/components/InquiryCommandCenter.tsx','studio_dev':ROOT/'angelcare-marketplace/studio-universal/developer-contract.ts','dev_route':ROOT/'app/api/angelcare-marketplace/cms/developer-contract/route.ts','dev_page':ROOT/'app/angelcare-marketplace/(protected)/admin/experience/developer/page.tsx'
}
t={k:read(v) for k,v in files.items()}

# contract depth
m=re.search(r"STUDIO_ATTRIBUTION_DIMENSIONS:[^=]*=\[(.*?)\]",t['dev'],re.S); dims=re.findall(r"'([^']+)'",m.group(1)) if m else []
ok('ATTRIBUTION_DIMENSIONS_28',len(dims)==28,f'COUNT={len(dims)}')
ok('ATTRIBUTION_SURFACES_2',"'studio_page'|'assigned_template'" in t['types'])
ok('EXISTING_AUTHORITIES_4',sum(x in t['dev'] for x in ['public_inquiry','conversion_session','family_quote_request','b2b_public_request'])==4)
ok('NO_SHADOW_ATTRIBUTION_TABLE','shadowAttributionTable:false' in t['dev'] and not any('studio_attribution' in p.name.lower() and p.suffix=='.sql' for p in ROOT.rglob('*.sql')))

# source origin and block propagation
ok('ASSIGNED_TEMPLATE_ORIGIN','assignedTemplateAttribution' in t['orch'] and 'const attribution=assignedTemplateAttribution' in t['orch'])
ok('STUDIO_PAGE_ORIGIN','studioPageAttribution' in t['public_page'] and 'published_revision_id' in t['public_page'])
ok('BLOCK_INTERACTION_PROPAGATION','studioAttributionForInteraction' in t['published'] and '__studioAttribution' in t['published'])
ok('CATALOG_ITEM_PROPAGATION','itemId:item.id' in t['catalog'] and 'itemSlug:item.slug' in t['catalog'])

# URL + privacy
ok('INTERNAL_URL_ONLY',"if(!href.startsWith('/')||href.startsWith('//'))return href" in t['context'])
ok('URL_HAS_BOUNDED_ORIGIN_IDS',all(x in t['context'] for x in ['ac_page','ac_tpl','ac_block','ac_interaction','ac_action','ac_workflow','ac_item','ac_collection','ac_placement','ac_campaign','ac_audience','ac_territory','ac_trace']))
ok('URL_EXCLUDES_VISITOR_HASH','visitorHash:' not in re.search(r'const queryMap=\{(.*?)\} as const',t['context'],re.S).group(1))
ok('URL_EXCLUDES_REFERRER','referrerHost:' not in re.search(r'const queryMap=\{(.*?)\} as const',t['context'],re.S).group(1) and 'referrerPath:' not in re.search(r'const queryMap=\{(.*?)\} as const',t['context'],re.S).group(1))
ok('PAGE_ROUTE_PATH_ONLY','pageRoute:fromSearch.pageRoute||window.location.pathname' in t['client'])
ok('REFERRER_PATH_ONLY','url.pathname.slice(0,500)' in t['client'] and 'url.search' not in re.search(r'function referrer\(\).*?\n',t['client'],re.S).group(0))
ok('SERVER_VISITOR_HASH','createHash(\'sha256\')' in t['server'] and 'visitorHash=' in t['server'])

# actions + workflow propagation
ok('P03_ACTION_CLICK_EVENT','studio_action_clicked' in t['action'] and '/api/angelcare-marketplace/public/events' in t['action'])
ok('P03_ACTION_URL_PROPAGATION','withStudioAttributionHref' in t['action'] and 'targetAttribution' in t['action'])
ok('P07_FORM_ATTRIBUTION','clientStudioAttribution' in t['workflow_form'] and 'workflowId:descriptor!.id' in t['workflow_form'])
ok('P07_SERVER_SANITIZATION','serverStudioAttribution' in t['workflow_exec'])
ok('P07_ROUTE_ACCEPTS_ATTRIBUTION',"body.attribution" in t['workflow_route'])

# canonical downstream persistence
ok('PUBLIC_INQUIRY_SOURCE_METADATA','sourceMetadata?:' in t['public_types'] and 'source_metadata: input.sourceMetadata || {}' in t['public_repo'] and 'studioAttribution:input.attribution' in t['workflow_exec'])
ok('CONVERSION_SESSION_METADATA','metadata: Record<string, unknown>' in t['conv_types'] and 'metadata: input.attribution ? { studioAttribution:' in t['conv_repo'] and 'metadata: objectValue(row.metadata)' in t['conv_repo'])
ok('CONVERSION_API_ACCEPTS_ATTRIBUTION',"value.attribution&&typeof value.attribution==='object'" in t['conv_validation'])
ok('CATEGORY_NATIVE_PROPAGATES_ATTRIBUTION',all(x in t['cat_api']+t['cat_repo']+t['cat_client'] for x in ['attribution','hasStudioAttributionSearch','clientStudioAttribution']))
ok('DIRECT_CONVERSION_PROPAGATES_ATTRIBUTION','hasStudioAttributionSearch' in t['conv_hook'] and 'clientStudioAttribution' in t['conv_hook'])
ok('FAMILY_AUDIT_ATTRIBUTION','sourceAttribution' in t['family'] and 'source_attribution:input.sourceAttribution' in t['family'])
ok('B2B_PUBLIC_EVENT_ATTRIBUTION','studio_workflow_submitted' in t['workflow_exec'] and "canonicalObjectType:result.canonicalObjectType" in t['workflow_exec'])

# admin visibility, not P10
ok('PUBLIC_INQUIRY_ADMIN_ORIGIN','Origine Studio' in t['inquiry_admin'] and 'studioAttribution' in t['inquiry_admin'])
ok('CONVERSION_ADMIN_ORIGIN','STUDIO ORIGIN' in t['conv_admin'] and "key: 'origin'" in t['conv_admin'] and 'session.metadata' in t['conv_admin'])
p10_active=os.environ.get('ANGELCARE_VERIFY_P10_ACTIVE')=='1'
ok('P10_PHASE_BOUNDARY',p10_active or 'studio-trust-inspector' not in '\n'.join(t.values()).lower())

# developer contract / docs
ok('P09_DEVELOPER_CONTRACT',all(x in t['dev'] for x in ['2026-09-19.P09','dimensionCount','existingAuthoritiesOnly:true','adminOriginVisibility:true']))
ok('UNIVERSAL_CONTRACT_EXTENDED','STUDIO_ATTRIBUTION_DEVELOPER_CONTRACT' in t['studio_dev'] and 'attributionDimensions' in t['studio_dev'] and 'originAttribution' in t['studio_dev'])
ok('DEVELOPER_SCOPE_P09',"scope==='attribution'" in t['dev_route'] and 'X-Studio-Attribution-SHA256' in t['dev_route'] and 'scope=attribution&format=json' in t['dev_page'])
for f in ['P09_ATTRIBUTION_CONTRACT.json','P09_PROPAGATION_MATRIX.json','P09_PRIVACY_POLICY.json','P09_CERTIFICATION.md']:ok('DOC_'+f,(DOCS/f).is_file())

# behavior fixture for pure context module
node=shutil.which('node')
if node:
 probe=subprocess.run([node,'-e',"try{require('typescript');process.exit(0)}catch(e){process.exit(2)}"],cwd=ROOT)
 if probe.returncode==0:
  js=r'''const fs=require('fs'),ts=require('typescript'),os=require('os'),path=require('path');const src=fs.readFileSync('angelcare-marketplace/studio-attribution/context.ts','utf8');const out=ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},fileName:'context.ts'}).outputText;const f=path.join(os.tmpdir(),'ac-p09-context-'+process.pid+'.cjs');fs.writeFileSync(f,out);const c=require(f);const a=c.sanitizeStudioAttribution({surface:'studio_page',locale:'fr',pageId:'p1',visitorHash:'secret',referrerHost:'example.com',referrerPath:'/source'});const internal=c.withStudioAttributionHref('/angelcare-marketplace/fr/marketplace?x=1',c.studioAttributionForInteraction(a,{blockId:'b1',actionId:'open'}));const external=c.withStudioAttributionHref('https://example.com/x',a);if(!internal.includes('ac_page=p1')||!internal.includes('ac_block=b1')||!internal.includes('ac_action=open'))process.exit(11);if(internal.includes('secret')||internal.includes('referrer'))process.exit(12);if(external!=='https://example.com/x')process.exit(13);if(!c.hasStudioAttributionSearch('?ac_page=p1')||c.hasStudioAttributionSearch('?foo=1'))process.exit(14);console.log('PASS P09_BEHAVIOR_FIXTURE');fs.unlinkSync(f)'''
  r=subprocess.run([node,'-e',js],cwd=ROOT,text=True,capture_output=True)
  if r.stdout.strip():print(r.stdout.strip())
  if r.stderr.strip():print(r.stderr.strip())
  ok('P09_BEHAVIOR_FIXTURE',r.returncode==0)
 else: print('INFO P09_BEHAVIOR_FIXTURE=SKIPPED_TYPESCRIPT_NOT_RESOLVABLE')

# targeted syntax only
changed=['angelcare-marketplace/catalog-discovery/components/CatalogCard.tsx', 'angelcare-marketplace/category-native-experience/api-handlers.ts', 'angelcare-marketplace/category-native-experience/components/ExperienceConfigurator.tsx', 'angelcare-marketplace/category-native-experience/repository.ts', 'angelcare-marketplace/category-native-experience/types.ts', 'angelcare-marketplace/conversion-universe/components/ConversionSessionDossier.tsx', 'angelcare-marketplace/conversion-universe/components/useConversionEngine.ts', 'angelcare-marketplace/conversion-universe/repository.ts', 'angelcare-marketplace/conversion-universe/types.ts', 'angelcare-marketplace/conversion-universe/validation.ts', 'angelcare-marketplace/family-experience/repository.ts', 'angelcare-marketplace/public-universe/components/PublicPageRenderer.tsx', 'angelcare-marketplace/public-universe/repository.ts', 'angelcare-marketplace/public-universe/types.ts', 'angelcare-marketplace/studio-action-registry/components/StudioActionLink.tsx', 'angelcare-marketplace/studio-attribution/client.ts', 'angelcare-marketplace/studio-attribution/context.ts', 'angelcare-marketplace/studio-attribution/developer-contract.ts', 'angelcare-marketplace/studio-attribution/server.ts', 'angelcare-marketplace/studio-attribution/types.ts', 'angelcare-marketplace/studio-public-runtime/components/PublicCatalogExperience.tsx', 'angelcare-marketplace/studio-public-runtime/orchestrator.ts', 'angelcare-marketplace/studio-public-runtime/types.ts', 'angelcare-marketplace/studio-universal/StudioPublishedRenderer.tsx', 'angelcare-marketplace/studio-universal/components/StudioBlockRuntime.tsx', 'angelcare-marketplace/studio-universal/components/StudioVisualCatalogueRuntime.tsx', 'angelcare-marketplace/studio-universal/developer-contract.ts', 'angelcare-marketplace/studio-universal/types.ts', 'angelcare-marketplace/studio-workflows/components/StudioWorkflowForm.tsx', 'angelcare-marketplace/studio-workflows/executor.ts', 'angelcare-marketplace/studio-workflows/types.ts', 'angelcare-marketplace/total-commerce-control/components/InquiryCommandCenter.tsx', 'app/angelcare-marketplace/(protected)/admin/experience/developer/page.tsx', 'app/angelcare-marketplace/[locale]/experience/[itemSlug]/page.tsx', 'app/angelcare-marketplace/[locale]/marketplace/[slug]/page.tsx', 'app/angelcare-marketplace/[locale]/marketplace/item/[itemSlug]/page.tsx', 'app/api/angelcare-marketplace/cms/developer-contract/route.ts', 'app/api/angelcare-marketplace/public/studio-workflows/[workflowId]/route.ts']
if node and changed:
 js="""const fs=require('fs'),ts=require('typescript');const files=JSON.parse(process.argv[1]);let bad=[];for(const f of files){const r=ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX},fileName:f,reportDiagnostics:true});const ds=(r.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);if(ds.length)bad.push([f,ds.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' '))]);}if(bad.length){for(const [f,d] of bad)console.error('TRANSPILE_FAIL',f,d.join('; '));process.exit(1)}console.log('PASS TARGETED_TYPESCRIPT_TRANSPILE FILES='+files.length)"""
 r=subprocess.run([node,'-e',js,json.dumps(changed)],cwd=ROOT,text=True,capture_output=True)
 if r.stdout.strip():print(r.stdout.strip())
 if r.stderr.strip():print(r.stderr.strip())
 ok('TARGETED_TYPESCRIPT_TRANSPILE',r.returncode==0,f'FILES={len(changed)}')

# no schema work
ok('NO_P09_SQL',not any('p09' in p.name.lower() for p in (ROOT/'supabase/migrations').glob('*.sql')))
ok('NO_ATTRIBUTION_SQL',not any(p.suffix=='.sql' for p in ATTR.rglob('*.sql')))

if errors:
 print('\nP09_VERIFY=FAIL');print('ERRORS='+','.join(errors));sys.exit(1)
print('\nP09_VERIFY=PASS')
print(f'ATTRIBUTION_DIMENSIONS={len(dims)} AUTHORITIES=4 ADMIN_ORIGIN_SURFACES=2')
print('STUDIO_PAGE=PASS ASSIGNED_TEMPLATE=PASS P03_ACTIONS=PASS P07_WORKFLOWS=PASS')
print('PUBLIC_INQUIRY=PASS CONVERSION_SESSION=PASS FAMILY_AUDIT=PASS B2B_EVENT=PASS')
print('PRIVACY=PASS NO_SHADOW_ATTRIBUTION=PASS P10_TRUST_INSPECTOR='+('FORWARD_ACTIVE' if p10_active else 'NO'))
print('DATABASE_SCHEMA_CHANGE=NO SQL_REQUIRED=NO MIGRATION=NO')
print('LOCAL_BUILD=NO GLOBAL_TYPESCRIPT=NO P10_TRUST_INSPECTOR='+('FORWARD_ACTIVE' if p10_active else 'NO'))
