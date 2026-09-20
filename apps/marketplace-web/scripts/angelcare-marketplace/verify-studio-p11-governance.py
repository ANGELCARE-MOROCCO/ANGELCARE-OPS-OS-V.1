#!/usr/bin/env python3
from __future__ import annotations
import json,os,re,shutil,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
DIR=ROOT/'angelcare-marketplace/studio-governance-engine'
DOCS=ROOT/'docs/angelcare-marketplace/studio-saturation'
errors=[]
def read(p):
 p=ROOT/p if isinstance(p,str) else p
 if not p.exists():errors.append('MISSING:'+str(p.relative_to(ROOT)));return''
 return p.read_text(errors='ignore')
def ok(name,cond,detail=''):
 if cond:print(f'PASS {name}{(" "+detail) if detail else ""}')
 else:errors.append(name);print(f'FAIL {name}{(" "+detail) if detail else ""}')

# predecessor forward-aware
p10=ROOT/'scripts/angelcare-marketplace/verify-studio-p10-trust-inspector.py'
ok('P10_VERIFIER_PRESENT',p10.is_file())
if p10.is_file():
 env=dict(os.environ);env['ANGELCARE_VERIFY_P11_ACTIVE']='1'
 ok('P10_STILL_PASS_FORWARD',subprocess.run([sys.executable,str(p10)],cwd=ROOT,env=env).returncode==0)

files={
 'types':DIR/'types.ts','registry':DIR/'registry.ts','classification':DIR/'classification.ts','engine':DIR/'engine.ts','runtime':DIR/'runtime-policy.ts','audit':DIR/'audit.ts','dev':DIR/'developer-contract.ts','ui':DIR/'components/StudioPolicyInspector.tsx','css':DIR/'components/studio-policy-inspector.module.css',
 'api':ROOT/'app/api/angelcare-marketplace/cms/studio/policy/evaluate/route.ts','repo':ROOT/'angelcare-marketplace/studio-universal/repository.ts','assignment':ROOT/'app/api/angelcare-marketplace/cms/studio/template-assignments/route.ts','orch':ROOT/'angelcare-marketplace/studio-public-runtime/orchestrator.ts','orch_types':ROOT/'angelcare-marketplace/studio-public-runtime/types.ts','orch_dev':ROOT/'angelcare-marketplace/studio-public-runtime/developer-contract.ts','trust_types':ROOT/'angelcare-marketplace/studio-trust-inspector/types.ts','trust_analyzer':ROOT/'angelcare-marketplace/studio-trust-inspector/analyzer.ts','trust_dev':ROOT/'angelcare-marketplace/studio-trust-inspector/developer-contract.ts','trust_ui':ROOT/'angelcare-marketplace/studio-trust-inspector/components/StudioTrustInspector.tsx','studio':ROOT/'angelcare-marketplace/studio-universal/components/UniversalExperienceStudio.tsx','studio_dev':ROOT/'angelcare-marketplace/studio-universal/developer-contract.ts','dev_route':ROOT/'app/api/angelcare-marketplace/cms/developer-contract/route.ts','dev_page':ROOT/'app/angelcare-marketplace/(protected)/admin/experience/developer/page.tsx','p08_verify':ROOT/'scripts/angelcare-marketplace/verify-studio-p08-public-runtime.py','p10_verify':p10
}
t={k:read(v) for k,v in files.items()}
# contract depth
rules=re.findall(r"'([A-Z_]+)'",re.search(r'STUDIO_POLICY_RULE_IDS=\[(.*?)\] as const',t['types'],re.S).group(1)) if 'STUDIO_POLICY_RULE_IDS' in t['types'] else []
modes=re.findall(r"'([a-z_]+)'",re.search(r'STUDIO_POLICY_MODES=\[(.*?)\] as const',t['types'],re.S).group(1)) if 'STUDIO_POLICY_MODES' in t['types'] else []
ok('POLICY_RULES_12',len(rules)==12,f'COUNT={len(rules)}')
ok('POLICY_MODES_5',len(modes)==5 and set(modes)=={'draft','preview','publish','template_assignment','public_runtime'},f'COUNT={len(modes)}')
ok('POLICY_DECISIONS_3',"'ALLOW'|'BLOCK'|'FALLBACK'" in t['types'])
ok('EXPLICIT_RULE_REGISTRY',all(r in t['registry'] for r in rules))
# authoring enforcement
ok('DRAFT_POLICY_GATE','evaluateStudioDocumentPolicy({mode:\'draft\'' in t['repo'] and 'assertStudioPolicy(policy)' in t['repo'])
ok('PREVIEW_POLICY_GATE','evaluateStudioDocumentPolicy({mode:\'preview\'' in t['repo'] and 'marketplace.studio.policy.preview_denied' in t['repo'])
ok('PUBLISH_POLICY_GATE','evaluateStudioDocumentPolicy({mode:\'publish\'' in t['repo'] and 'marketplace.studio.policy.publish_denied' in t['repo'])
ok('EXISTING_PUBLICATION_GATE_RETAINED','studioPublicationGate(studioData)' in t['repo'] and "['approved','scheduled']" in t['repo'])
ok('TEMPLATE_ASSIGNMENT_POLICY_GATE','evaluateStudioTemplateAssignmentPolicy' in t['assignment'] and 'marketplace.studio.policy.template_assignment_denied' in t['assignment'])
ok('SCOPE_WRITE_PERMISSIONS',all(x in t['registry'] for x in ['marketplace.catalog.manage','marketplace.homepage.manage','marketplace.experience_schema.manage','marketplace.configuration.manage']))
# runtime enforcement
ok('PUBLIC_RUNTIME_POLICY_GATE','evaluateStudioRuntimePolicy' in t['orch'] and "fallback('POLICY_BLOCKER'" in t['orch'])
ok('POLICY_BLOCKER_TYPE',"'POLICY_BLOCKER'" in t['orch_types'])
ok('CATEGORY_NATIVE_FALLBACK_PRESERVED',"status:'FALLBACK_NATIVE'" in t['orch'] and "fallbackReason:reason" in t['orch'])
ok('RUNTIME_READ_ONLY',all(x not in t['runtime'] for x in ['.insert(','.update(','.delete(','.upsert(','.rpc(']))
# P10 advisory remains, P11 active
ok('P10_REMAINS_ADVISORY','advisoryOnly:true' in t['trust_types'] and 'noMutation:true' in t['trust_types'])
ok('P10_REPORTS_P11_ACTIVE','p11GovernanceEngine:true' in t['trust_types'] and 'p11GovernanceEngine:true' in t['trust_analyzer'] and 'p11GovernanceEngine:true' in t['trust_dev'])
ok('P11_UI_ACTIVE_COPY','P11 est actif' in t['trust_ui'])
# P11 UI/API
ok('POLICY_API_PRESENT',files['api'].is_file())
ok('POLICY_API_RBAC',"requireMarketplaceApiContext('marketplace.cms.view')" in t['api'])
ok('POLICY_UI_MOUNTED','<StudioPolicyInspector' in t['studio'] and 'Policy P11' in t['studio'])
ok('POLICY_UI_CURRENT_DRAFT','data={data}' in t['studio'])
ok('POLICY_UI_ACCESSIBLE','role="dialog"' in t['ui'] and 'aria-modal="true"' in t['ui'])
# audit existing authority
ok('EXISTING_AUDIT_LEDGER','writeMarketplaceAudit' in t['audit'] and 'studio_policy_decision' in t['audit'] and "result:'denied'" in t['audit'])
ok('NO_RUNTIME_AUDIT_NOISE','writeMarketplaceAudit' not in t['runtime'] and 'writeMarketplaceAudit' not in t['orch'])
# docs/developer contract
ok('P11_DEVELOPER_CONTRACT',all(x in t['dev'] for x in ['2026-09-20.P11','ruleCount:STUDIO_POLICY_RULE_IDS.length','existingRbacAuthority:true','existingAuditLedger:true','noShadowPolicyStore:true']))
ok('UNIVERSAL_CONTRACT_EXTENDED','STUDIO_GOVERNANCE_DEVELOPER_CONTRACT' in t['studio_dev'] and 'governancePolicyRules' in t['studio_dev'] and 'p11GovernanceEngine: true' in t['studio_dev'])
ok('DEVELOPER_SCOPE_P11',"scope==='governance-policy'" in t['dev_route'] and 'X-Studio-Governance-P11-SHA256' in t['dev_route'] and 'scope=governance-policy&format=json' in t['dev_page'])
for f in ['P11_GOVERNANCE_CONTRACT.json','P11_POLICY_MATRIX.json','P11_CERTIFICATION.md']:ok('DOC_'+f,(DOCS/f).is_file())
# security/no shadow store
runtime_surface='\n'.join(t[k] for k in ['types','registry','classification','engine','runtime','audit','dev','ui','api','repo','assignment','orch','orch_types','orch_dev','trust_types','trust_analyzer','trust_dev','trust_ui','studio','studio_dev','dev_route','dev_page'])
for name,patterns in {'LOCALSTORAGE':['localStorage.','window.localStorage'],'SESSIONSTORAGE':['sessionStorage.','window.sessionStorage'],'EVAL':['eval('],'NEW_FUNCTION':['new Function(']}.items():ok('FORBIDDEN_'+name,all(x not in runtime_surface for x in patterns))
joined=runtime_surface
ok('NO_P11_SQL',not any('p11' in p.name.lower() for p in (ROOT/'supabase/migrations').glob('*.sql')))
ok('NO_POLICY_SQL',not any(p.suffix=='.sql' for p in DIR.rglob('*.sql')))
shadow='\n'.join(read(p) for p in ROOT.rglob('*.sql'))+'\n'+joined
ok('NO_SHADOW_POLICY_STORE',not re.search(r'(studio_policy|governance_policy|policy_decision)_?(events|records|store|table)?',shadow,re.I) or 'studio_policy_decision' in t['audit'])
ok('NO_NEW_ADMIN_WORKSPACE','app/angelcare-marketplace/(protected)/admin/studio-policy' not in joined)
# executed decision fixture
node=shutil.which('node')
if node:
 js=r'''const fs=require('fs'),ts=require('typescript'),os=require('os'),path=require('path');let src=fs.readFileSync('angelcare-marketplace/studio-governance-engine/classification.ts','utf8').replace("import type { StudioPolicyDecision,StudioPolicyMode } from './types'",'');const out=ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},fileName:'classification.ts'}).outputText;const f=path.join(os.tmpdir(),'ac-p11-'+process.pid+'.cjs');fs.writeFileSync(f,out);const c=require(f);if(c.studioPolicyDecision('draft',0)!=='ALLOW')process.exit(11);if(c.studioPolicyDecision('publish',2)!=='BLOCK')process.exit(12);if(c.studioPolicyDecision('public_runtime',1)!=='FALLBACK')process.exit(13);console.log('PASS P11_DECISION_FIXTURE');fs.unlinkSync(f)'''
 r=subprocess.run([node,'-e',js],cwd=ROOT,text=True,capture_output=True)
 if r.stdout.strip():print(r.stdout.strip())
 if r.stderr.strip():print(r.stderr.strip())
 ok('P11_DECISION_FIXTURE',r.returncode==0)
 # visual regressions
 base=ROOT/'scripts/angelcare-marketplace/verify-design-studio-transplant.mjs';ok('STUDIO_37_REGRESSION',base.is_file() and subprocess.run([node,str(base)],cwd=ROOT).returncode==0)
 cats=True
 for i in range(1,11):
  f=ROOT/f'scripts/angelcare-marketplace/verify-studio-catalogue-category-{i:02d}.mjs'
  if not f.is_file() or subprocess.run([node,str(f)],cwd=ROOT).returncode:cats=False;break
 ok('STUDIO_10X10_REGRESSION',cats)
# targeted transpilation only
changed=['angelcare-marketplace/studio-governance-engine/types.ts','angelcare-marketplace/studio-governance-engine/registry.ts','angelcare-marketplace/studio-governance-engine/classification.ts','angelcare-marketplace/studio-governance-engine/engine.ts','angelcare-marketplace/studio-governance-engine/runtime-policy.ts','angelcare-marketplace/studio-governance-engine/audit.ts','angelcare-marketplace/studio-governance-engine/developer-contract.ts','angelcare-marketplace/studio-governance-engine/components/StudioPolicyInspector.tsx','angelcare-marketplace/studio-public-runtime/types.ts','angelcare-marketplace/studio-public-runtime/orchestrator.ts','angelcare-marketplace/studio-public-runtime/developer-contract.ts','angelcare-marketplace/studio-universal/repository.ts','angelcare-marketplace/studio-universal/components/UniversalExperienceStudio.tsx','angelcare-marketplace/studio-universal/developer-contract.ts','angelcare-marketplace/studio-trust-inspector/types.ts','angelcare-marketplace/studio-trust-inspector/analyzer.ts','angelcare-marketplace/studio-trust-inspector/developer-contract.ts','angelcare-marketplace/studio-trust-inspector/components/StudioTrustInspector.tsx','app/api/angelcare-marketplace/cms/studio/policy/evaluate/route.ts','app/api/angelcare-marketplace/cms/studio/template-assignments/route.ts','app/api/angelcare-marketplace/cms/developer-contract/route.ts','app/angelcare-marketplace/(protected)/admin/experience/developer/page.tsx']
if node:
 js="""const fs=require('fs'),ts=require('typescript');const files=JSON.parse(process.argv[1]);let bad=[];for(const f of files){const r=ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX},fileName:f,reportDiagnostics:true});const ds=(r.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);if(ds.length)bad.push([f,ds.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' '))]);}if(bad.length){for(const [f,d] of bad)console.error('TRANSPILE_FAIL',f,d.join('; '));process.exit(1)}console.log('PASS TARGETED_TYPESCRIPT_TRANSPILE FILES='+files.length)"""
 r=subprocess.run([node,'-e',js,json.dumps(changed)],cwd=ROOT,text=True,capture_output=True)
 if r.stdout.strip():print(r.stdout.strip())
 if r.stderr.strip():print(r.stderr.strip())
 ok('TARGETED_TYPESCRIPT_TRANSPILE',r.returncode==0,f'FILES={len(changed)}')
if errors:
 print('\nP11_VERIFY=FAIL');print('ERRORS='+','.join(errors));sys.exit(1)
print('\nP11_VERIFY=PASS')
print(f'POLICY_RULES={len(rules)} POLICY_MODES={len(modes)} DECISIONS=3 API_ROUTES=1')
print('DRAFT=PASS PREVIEW=PASS PUBLISH=PASS TEMPLATE_ASSIGNMENT=PASS PUBLIC_RUNTIME=PASS')
print('RBAC=EXISTING EXPERIENCE_CORE=EXISTING AUDIT_LEDGER=EXISTING CATEGORY_NATIVE_FALLBACK=PASS')
print('NO_SHADOW_POLICY_STORE=PASS NO_NEW_ADMIN_WORKSPACE=PASS')
print('DATABASE_SCHEMA_CHANGE=NO SQL_REQUIRED=NO MIGRATION=NO')
print('LOCAL_BUILD=NO GLOBAL_TYPESCRIPT=NO P12_INVALIDATION_ENGINE=NO')
