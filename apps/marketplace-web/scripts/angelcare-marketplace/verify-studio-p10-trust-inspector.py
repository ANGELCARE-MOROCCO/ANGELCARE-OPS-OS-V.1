#!/usr/bin/env python3
from __future__ import annotations
import json,os,re,shutil,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
TRUST=ROOT/'angelcare-marketplace/studio-trust-inspector'
DOCS=ROOT/'docs/angelcare-marketplace/studio-saturation'
errors=[]
def read(rel):
 p=ROOT/rel if isinstance(rel,str) else rel
 if not p.exists():errors.append(f'MISSING:{p.relative_to(ROOT)}');return ''
 return p.read_text(errors='ignore')
def ok(name,cond,detail=''):
 if cond:print(f'PASS {name}{(" "+detail) if detail else ""}')
 else:errors.append(name);print(f'FAIL {name}{(" "+detail) if detail else ""}')

# predecessor forward-aware
p09=ROOT/'scripts/angelcare-marketplace/verify-studio-p09-attribution.py'
ok('P09_VERIFIER_PRESENT',p09.is_file())
if p09.is_file():
 env=dict(os.environ);env['ANGELCARE_VERIFY_P10_ACTIVE']='1';
 if os.environ.get('ANGELCARE_VERIFY_P11_ACTIVE')=='1':env['ANGELCARE_VERIFY_P11_ACTIVE']='1'
 ok('P09_STILL_PASS_FORWARD',subprocess.run([sys.executable,str(p09)],cwd=ROOT,env=env).returncode==0)

files={
 'types':TRUST/'types.ts','classification':TRUST/'classification.ts','analyzer':TRUST/'analyzer.ts','dev':TRUST/'developer-contract.ts','ui':TRUST/'components/StudioTrustInspector.tsx','css':TRUST/'components/studio-trust-inspector.module.css',
 'api':ROOT/'app/api/angelcare-marketplace/cms/studio/trust/inspect/route.ts','studio':ROOT/'angelcare-marketplace/studio-universal/components/UniversalExperienceStudio.tsx','studio_dev':ROOT/'angelcare-marketplace/studio-universal/developer-contract.ts','dev_route':ROOT/'app/api/angelcare-marketplace/cms/developer-contract/route.ts','dev_page':ROOT/'app/angelcare-marketplace/(protected)/admin/experience/developer/page.tsx',
 'p09_verify':p09
}
t={k:read(v) for k,v in files.items()}

# contract depth
layers=re.findall(r"'([^']+)'",re.search(r'STUDIO_TRUST_INSPECTOR_LAYERS=\[(.*?)\] as const',t['dev'],re.S).group(1)) if 'STUDIO_TRUST_INSPECTOR_LAYERS' in t['dev'] else []
sections=re.findall(r"'([^']+)'",re.search(r'STUDIO_TRUST_INSPECTOR_SECTIONS=\[(.*?)\] as const',t['dev'],re.S).group(1)) if 'STUDIO_TRUST_INSPECTOR_SECTIONS' in t['dev'] else []
ok('TRUST_LAYERS_8',len(layers)==8,f'COUNT={len(layers)}')
ok('TRUST_SECTIONS_5',len(sections)==5,f'COUNT={len(sections)}')
ok('TRUST_STATES_3',"states:['READY','ATTENTION','BLOCKED']" in t['dev'])
ok('READ_ONLY_ADVISORY',all(x in t['dev'] for x in ['readOnly:true','advisoryOnly:true','noMutation:true','noPublishGateChange:true']))
p11_active=os.environ.get('ANGELCARE_VERIFY_P11_ACTIVE')=='1'
ok('P11_PHASE_BOUNDARY',('p11GovernanceEngine:true' in t['dev'] and (ROOT/'angelcare-marketplace/studio-governance-engine').exists()) if p11_active else ('p11GovernanceEngine:false' in t['dev'] and not (ROOT/'angelcare-marketplace/studio-governance-engine').exists()))

# P01 -> P09 wiring
checks={
 'P01_SOURCE_VALIDATION':['validateStudioSourceReference','getStudioSourceDescriptor','studioSourceAdminHref'],
 'P02_CANONICAL_CONTEXT_PICKERS':['UniversalSourcePickerField','sourceId="catalog.items"','sourceId="homepage.collections"','sourceId="audience.segments"','sourceId="homepage.campaigns"'],
 'P03_ACTION_CONSEQUENCE':['getStudioActionDescriptor','resolveStudioPublicAction','canonicalEngine','adminDestination','validations'],
 'P04_TEMPLATE_PROVENANCE':['resolveStudioTemplateForCatalogItem','provenance','matchedScope'],
 'P05_BINDING_TRANSPARENCY':['studioBindingTarget','studioLiveBinding','isStudioLiveBindingReference'],
 'P06_DYNAMIC_EXECUTION':['applyStudioDynamicSources','admin_preview'],
 'P07_WORKFLOW_CONSEQUENCE':['getStudioWorkflowDescriptor','consentKeys','creates'],
 'P08_SAME_ORCHESTRATOR':['prepareStudioPublicRuntime','getAdaptiveExperience'],
 'P09_ATTRIBUTION_TRANSPARENCY':['STUDIO_ATTRIBUTION_DEVELOPER_CONTRACT','studioPageAttribution','dimensionCount']
}
for name,needles in checks.items():ok(name,all(n in t['analyzer']+t['ui'] for n in needles))

# report and trust surface
ok('REPORT_SCHEMA_P10',"schemaVersion:'2026-09-19.P10'" in t['analyzer'] and "schemaVersion:'2026-09-19.P10'" in t['types'])
ok('REPORT_COUNTS',all(x in t['types'] for x in ['sources:number','bindings:number','dynamicSources:number','actions:number','workflows:number','adminDestinations:number','warnings:number','blockers:number']))
ok('RUNTIME_FALLBACK_EXPLAINED',all(x in t['types']+t['ui'] for x in ['fallbackReason','templateRevisionId','matchedScope','bindingBlockers','dynamicBlockers','preflightBlockers']))
ok('ADMIN_DESTINATION_BRIDGE','adminDestination' in t['analyzer'] and 'Ouvrir le workspace existant' in t['ui'])
ok('PERMISSION_VISIBILITY','hasMarketplacePermission' in t['analyzer'] and 'Permissions requises' in t['ui'])
ok('PRIVACY_VISIBILITY',all(x in t['types']+t['ui'] for x in ['piiInUrl','rawVisitorReferencePersisted','rawReferrerQueryPersisted','externalUrlDecoration','serverVisitorHash']))

# API security + read-only
ok('TRUST_API_PRESENT',files['api'].is_file())
ok('TRUST_API_RBAC',"requireMarketplaceApiContext('marketplace.cms.view')" in t['api'])
ok('TRUST_API_PAGE_VALIDATION','validateStudioPageJson' in t['api'])
ok('TRUST_API_FORCE_DYNAMIC',"runtime='nodejs'" in t['api'] and "dynamic='force-dynamic'" in t['api'])
read_only=t['analyzer']+t['api']
ok('NO_DIRECT_DB_CLIENT','createServiceClient' not in read_only and 'supabase' not in read_only.lower())
ok('NO_DIRECT_DB_WRITE',not any(token in read_only for token in ['.insert(','.update(','.upsert(','.delete(','.rpc(']))
ok('NO_PUBLISH_MUTATION',"/publish" not in t['ui']+t['analyzer']+t['api'])
shadow_store_patterns=[
 r"\.from\(\s*['\"](?:public\.)?angelcare_marketplace_(?:studio_trust|trust_inspector)",
 r"CREATE\s+TABLE[^\n]*angelcare_marketplace_(?:studio_trust|trust_inspector)",
 r"INSERT\s+INTO[^\n]*angelcare_marketplace_(?:studio_trust|trust_inspector)",
]
shadow_store_haystack=read_only+'\n'+'\n'.join(read(p) for p in ROOT.rglob('*.sql'))
ok('NO_NEW_BUSINESS_STORE',not any(re.search(pattern,shadow_store_haystack,re.I) for pattern in shadow_store_patterns))

# Studio UX integration
ok('STUDIO_COMMAND_BUTTON','setTrustInspectorOpen(true)' in t['studio'] and 'Confiance' in t['studio'])
ok('STUDIO_INSPECTOR_MOUNTED','<StudioTrustInspector' in t['studio'])
ok('CURRENT_DRAFT_DATA_PASSED','data={data}' in t['studio'])
ok('PAGE_CONTEXT_PASSED','pageId={page.id}' in t['studio'] and 'pageRoute={' in t['studio'])
ok('PUBLISH_GATE_UNCHANGED',"const publishReady=canPublish&&['approved','scheduled','published'].includes(page.status)" in t['studio'])
ok('PREMIUM_UI_SURFACE',all(x in t['css'] for x in ['backdrop','panel','statusCard','metrics','traceGrid','dimensionCloud']))
ok('ACCESSIBLE_DIALOG','role="dialog"' in t['ui'] and 'aria-modal="true"' in t['ui'] and 'aria-label="Studio Trust Inspector"' in t['ui'])

# Developer contract
ok('P10_DEVELOPER_CONTRACT',all(x in t['dev'] for x in ['2026-09-19.P10','sameP08RuntimeOrchestrator:true','noShadowBusinessAuthority:true',('p11GovernanceEngine:true' if p11_active else 'p11GovernanceEngine:false')]))
ok('UNIVERSAL_CONTRACT_EXTENDED','STUDIO_TRUST_INSPECTOR_DEVELOPER_CONTRACT' in t['studio_dev'] and 'trustInspectorLayers' in t['studio_dev'] and 'studioTrustInspector' in t['studio_dev'])
ok('DEVELOPER_SCOPE_P10',"scope==='trust-inspector'" in t['dev_route'] and 'X-Studio-Trust-Inspector-SHA256' in t['dev_route'] and 'scope=trust-inspector&format=json' in t['dev_page'])
for f in ['P10_TRUST_INSPECTOR_CONTRACT.json','P10_SIGNAL_MATRIX.json','P10_CERTIFICATION.md']:ok('DOC_'+f,(DOCS/f).is_file())

# classification behavior fixture
node=shutil.which('node')
if node:
 js=r'''const fs=require('fs'),ts=require('typescript'),os=require('os'),path=require('path');const src=fs.readFileSync('angelcare-marketplace/studio-trust-inspector/classification.ts','utf8').replace("import type { StudioTrustSeverity,StudioTrustStatus } from './types'",'');const out=ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},fileName:'classification.ts'}).outputText;const f=path.join(os.tmpdir(),'ac-p10-class-'+process.pid+'.cjs');fs.writeFileSync(f,out);const c=require(f);if(c.studioTrustStatus(0,0)!=='READY')process.exit(11);if(c.studioTrustStatus(0,2)!=='ATTENTION')process.exit(12);if(c.studioTrustStatus(1,0)!=='BLOCKED')process.exit(13);if(c.studioTrustRuntimeSeverity('FALLBACK_NATIVE','NO_RESOLVED_TEMPLATE')!=='warning')process.exit(14);if(c.studioTrustRuntimeSeverity('FALLBACK_NATIVE','ACTION_BLOCKER')!=='blocker')process.exit(15);console.log('PASS P10_CLASSIFICATION_FIXTURE');fs.unlinkSync(f)'''
 r=subprocess.run([node,'-e',js],cwd=ROOT,text=True,capture_output=True)
 if r.stdout.strip():print(r.stdout.strip())
 if r.stderr.strip():print(r.stderr.strip())
 ok('P10_CLASSIFICATION_FIXTURE',r.returncode==0)

# targeted transpile only
changed=['angelcare-marketplace/studio-trust-inspector/types.ts','angelcare-marketplace/studio-trust-inspector/classification.ts','angelcare-marketplace/studio-trust-inspector/developer-contract.ts','angelcare-marketplace/studio-trust-inspector/analyzer.ts','angelcare-marketplace/studio-trust-inspector/components/StudioTrustInspector.tsx','angelcare-marketplace/studio-universal/components/UniversalExperienceStudio.tsx','angelcare-marketplace/studio-universal/developer-contract.ts','app/api/angelcare-marketplace/cms/studio/trust/inspect/route.ts','app/api/angelcare-marketplace/cms/developer-contract/route.ts','app/angelcare-marketplace/(protected)/admin/experience/developer/page.tsx']
if node:
 js="""const fs=require('fs'),ts=require('typescript');const files=JSON.parse(process.argv[1]);let bad=[];for(const f of files){const r=ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX},fileName:f,reportDiagnostics:true});const ds=(r.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);if(ds.length)bad.push([f,ds.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' '))]);}if(bad.length){for(const [f,d] of bad)console.error('TRANSPILE_FAIL',f,d.join('; '));process.exit(1)}console.log('PASS TARGETED_TYPESCRIPT_TRANSPILE FILES='+files.length)"""
 r=subprocess.run([node,'-e',js,json.dumps(changed)],cwd=ROOT,text=True,capture_output=True)
 if r.stdout.strip():print(r.stdout.strip())
 if r.stderr.strip():print(r.stderr.strip())
 ok('TARGETED_TYPESCRIPT_TRANSPILE',r.returncode==0,f'FILES={len(changed)}')

ok('NO_P10_SQL',not any('p10' in p.name.lower() for p in (ROOT/'supabase/migrations').glob('*.sql')))
ok('NO_TRUST_INSPECTOR_SQL',not any(p.suffix=='.sql' for p in TRUST.rglob('*.sql')))

if errors:
 print('\nP10_VERIFY=FAIL');print('ERRORS='+','.join(errors));sys.exit(1)
print('\nP10_VERIFY=PASS')
print(f'TRUST_LAYERS={len(layers)} SECTIONS={len(sections)} STATES=3 API_ROUTES=1')
print('P01_SOURCES=PASS P03_ACTIONS=PASS P04_TEMPLATES=PASS P05_BINDINGS=PASS P06_DYNAMIC=PASS P07_WORKFLOWS=PASS P08_RUNTIME=PASS P09_ATTRIBUTION=PASS')
print('READ_ONLY=PASS ADMIN_DESTINATIONS=PASS PERMISSIONS=PASS PRIVACY=PASS P11_GOVERNANCE_ENGINE='+('YES' if p11_active else 'NO'))
print('DATABASE_SCHEMA_CHANGE=NO SQL_REQUIRED=NO MIGRATION=NO')
print('LOCAL_BUILD=NO GLOBAL_TYPESCRIPT=NO P11_POLICY_REWRITE=NO')
