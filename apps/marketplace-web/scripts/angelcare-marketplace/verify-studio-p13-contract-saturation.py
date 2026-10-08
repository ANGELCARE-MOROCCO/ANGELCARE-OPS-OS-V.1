#!/usr/bin/env python3
from __future__ import annotations
import json,os,re,shutil,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
DIR=ROOT/'angelcare-marketplace/studio-contract-saturation'
DOCS=ROOT/'docs/angelcare-marketplace/studio-saturation'
errors=[]
def read(p):
 p=ROOT/p if isinstance(p,str) else p
 if not p.exists(): errors.append('MISSING:'+str(p.relative_to(ROOT))); return ''
 return p.read_text(errors='ignore')
def ok(name,cond,detail=''):
 if cond: print(f'PASS {name}{(" "+detail) if detail else ""}')
 else: errors.append(name); print(f'FAIL {name}{(" "+detail) if detail else ""}')

p12=ROOT/'scripts/angelcare-marketplace/verify-studio-p12-dependency-invalidation.py'
ok('P12_VERIFIER_PRESENT',p12.is_file())
if p12.is_file():
 env=dict(os.environ);env['ANGELCARE_VERIFY_P13_ACTIVE']='1'
 ok('P12_STILL_PASS_FORWARD',subprocess.run([sys.executable,str(p12)],cwd=ROOT,env=env).returncode==0)

files={
 'types':DIR/'types.ts','registry':DIR/'registry.ts','dev':DIR/'developer-contract.ts','ui':DIR/'components/StudioContractSaturationInspector.tsx','css':DIR/'components/studio-contract-saturation-inspector.module.css',
 'api':ROOT/'app/api/angelcare-marketplace/cms/studio/contract-saturation/route.ts','studio_dev':ROOT/'angelcare-marketplace/studio-universal/developer-contract.ts','studio_ui':ROOT/'angelcare-marketplace/studio-universal/components/UniversalExperienceStudio.tsx','dev_route':ROOT/'app/api/angelcare-marketplace/cms/developer-contract/route.ts','dev_page':ROOT/'app/angelcare-marketplace/(protected)/admin/experience/developer/page.tsx','p12_verifier':p12,
}
t={k:read(v) for k,v in files.items()}
for k,p in files.items():ok('FILE_'+k.upper(),p.is_file())

scope_entries=re.findall(r"\{scope:'([^']+)',phase:'([^']+)'",t['registry'])
ok('MASTER_SCOPE_COUNT_14',len(scope_entries)==14,f'COUNT={len(scope_entries)}')
ok('MASTER_SCOPE_IDS_UNIQUE',len({x[0] for x in scope_entries})==14)
phases={x[1] for x in scope_entries}
ok('P00_ROOT_PRESENT','P00' in phases and 'capability-census' in {x[0] for x in scope_entries})
ok('P01_P12_ALL_PRESENT',all(f'P{i:02d}' in phases for i in range(1,13)))
ok('STUDIO_FOUNDATION_PRESENT','studio-foundation' in {x[0] for x in scope_entries})
links=re.findall(r"\{from:'([^']+)',to:'([^']+)',relation:'([^']+)'",t['registry'])
ok('CROSS_LINK_COUNT_24',len(links)==24,f'COUNT={len(links)}')
ok('CROSS_LINKS_UNIQUE',len(set(links))==24)
classes=re.findall(r"\{classId:'([^']+)',owner:'([^']+)',policy:'([^']+)'",t['registry'])
ok('STABLE_ID_CLASSES_12',len(classes)==12,f'COUNT={len(classes)}')
ok('STABLE_ID_CLASSES_UNIQUE',len({x[0] for x in classes})==12)
ok('COMPATIBILITY_LEVELS',all(x in t['types'] for x in ['PATCH_SAFE','MIGRATION_REQUIRED','BREAKING_FORBIDDEN']))
ok('BREAKING_FORBIDDEN_CORE_IDS',all(x in t['registry'] for x in ["classId:'source_ids',owner:'P01',policy:'BREAKING_FORBIDDEN'","classId:'action_ids',owner:'P03',policy:'BREAKING_FORBIDDEN'","classId:'template_scopes',owner:'P04',policy:'BREAKING_FORBIDDEN'","classId:'binding_keys',owner:'P05',policy:'BREAKING_FORBIDDEN'","classId:'workflow_ids',owner:'P07',policy:'BREAKING_FORBIDDEN'","classId:'governance_rule_ids',owner:'P11',policy:'BREAKING_FORBIDDEN'"]))
ok('IMMUTABLE_INVARIANTS',t['registry'].count("'No ")+t['registry'].count("'Existing ")>=4 and 'Build Marketplace GHCR One-Off' in t['registry'] and 'Coolify Deploy Without Cache' in t['registry'])

ok('P13_SCHEMA',"schemaVersion:'2026-09-20.P13'" in t['dev'] and "phase:'P13'" in t['dev'])
ok('P13_MASTER_HASH','createHash' in t['dev'] and "digest('hex')" in t['dev'])
ok('P13_MASTER_COUNTS',all(x in t['dev'] for x in ['phaseCount','scopeCount','stableIdentifierCount','crossLinkCount']))
ok('P13_COMPLETENESS',all(x in t['dev'] for x in ['p00CensusRequired:true','p01ThroughP12Fingerprinted:true','allScopesHaveSchema:true','allScopesHaveHash:true','allRequiredCrossLinksDeclared:true','machineReadable:true','humanReadable:true','csvReadable:true']))
ok('P13_NO_SHADOW',all(x in t['dev'] for x in ['existingAuthoritiesOnly:true','noRuntimeMutation:true','noBusinessStore:true','noNewAdminWorkspace:true','noSql:true','noMigration:true']))
ok('P13_FINAL_GATE_EXPLICIT','finalCertificationStillRequired:true' in t['dev'])
ok('TXT_CSV_JSON_EXPORTS',all(x in t['dev'] for x in ['studioContractSaturationDeveloperContractJson','studioContractSaturationDeveloperContractTxt','studioContractSaturationDeveloperContractCsv']))

ok('PROTECTED_P13_API',"requireMarketplaceApiContext('marketplace.cms.export')" in t['api'] and 'studioContractSaturationDeveloperContractJson' in t['api'])
ok('P13_API_READ_ONLY',all(x not in t['api'] for x in ['.insert(','.update(','.delete(','.upsert(','.rpc(']))
ok('P13_DEVELOPER_SCOPE',"scope==='contract-saturation'" in t['dev_route'] and 'X-Studio-Contract-P13-SHA256' in t['dev_route'] and all(f'format={f}' in t['dev_page'] for f in ['txt','csv','json']))
ok('P13_UNIVERSAL_CONTRACT_EXTENDED',all(x in t['studio_dev'] for x in ['STUDIO_CONTRACT_SATURATION_DEVELOPER_CONTRACT','contractSaturationScopes','contractSaturationStableIds','contractSaturationCrossLinks','developerContractSaturation','p13DeveloperContractSaturation: true','p13BreakingChangePolicy: true']))
ok('P13_STUDIO_INSPECTOR_MOUNTED','<StudioContractSaturationInspector' in t['studio_ui'] and 'Contrat P13' in t['studio_ui'])
ok('P13_INSPECTOR_READ_ONLY','fetch(' in t['ui'] and 'method:' not in t['ui'] and 'role="dialog"' in t['ui'] and 'aria-modal="true"' in t['ui'])
ok('P13_INSPECTOR_EXPORT_BRIDGE','scope=contract-saturation&format=json' in t['ui'] and '/admin/experience/developer' in t['ui'])

for f in ['P13_PHASE_LINEAGE.json','P13_COMPATIBILITY_POLICY.json','P13_MASTER_CONTRACT_MATRIX.json','P13_CERTIFICATION.md']:ok('DOC_'+f,(DOCS/f).is_file())
try:
 lineage=json.loads((DOCS/'P13_PHASE_LINEAGE.json').read_text()); compat=json.loads((DOCS/'P13_COMPATIBILITY_POLICY.json').read_text()); matrix=json.loads((DOCS/'P13_MASTER_CONTRACT_MATRIX.json').read_text())
 ok('DOC_PHASES_P00_P13',len(lineage['phases'])==14 and lineage['phases'][0]['phase']=='P00' and lineage['phases'][-1]['phase']=='P13')
 ok('DOC_COMPATIBILITY_CLASSES',len(compat['stableClasses'])==12 and set(compat['levels'])=={'PATCH_SAFE','MIGRATION_REQUIRED','BREAKING_FORBIDDEN'})
 ok('DOC_MASTER_COUNTS',matrix['scopeCount']==14 and matrix['phaseCount']==14 and matrix['crossLinkCount']==24)
except Exception as e:
 print('DOC_PARSE_ERROR',repr(e));errors.append('DOC_PARSE')

p00_required=['P00_CAPABILITY_CENSUS.md','P00_CAPABILITY_REGISTRY.json','P00_SOURCE_REGISTRY_CANDIDATES.json','P00_ACTION_REGISTRY_CANDIDATES.json']
ok('P00_CONSTITUTION_PRESENT',all((DOCS/f).is_file() for f in p00_required))
contract_files=[
 'studio-source-registry/developer-contract.ts','studio-picker/developer-contract.ts','studio-action-registry/developer-contract.ts','studio-template-assignment/developer-contract.ts','studio-live-binding/developer-contract.ts','studio-dynamic-source/developer-contract.ts','studio-workflows/developer-contract.ts','studio-public-runtime/developer-contract.ts','studio-attribution/developer-contract.ts','studio-trust-inspector/developer-contract.ts','studio-governance-engine/developer-contract.ts','studio-dependency-invalidation/developer-contract.ts'
]
all_contracts=True
for rel in contract_files:
 text=read(ROOT/'angelcare-marketplace'/rel)
 good='schemaVersion' in text and 'sha256' in text.lower() or ('schemaVersion' in text and 'createHash' in text)
 if not good: print('CONTRACT_FINGERPRINT_FAIL',rel);all_contracts=False
ok('P01_P12_CONTRACTS_FINGERPRINTABLE',all_contracts,f'COUNT={len(contract_files)}')

runtime='\n'.join(t[k] for k in ['types','registry','dev','ui','api'])
for name,patterns in {'LOCALSTORAGE':['localStorage.','window.localStorage'],'SESSIONSTORAGE':['sessionStorage.','window.sessionStorage'],'EVAL':['eval('],'NEW_FUNCTION':['new Function('],'DANGEROUS_HTML':['dangerouslySetInnerHTML']}.items():ok('FORBIDDEN_'+name,all(x not in runtime for x in patterns))
ok('NO_P13_SQL',not list(DIR.rglob('*.sql')) and not any('p13' in p.name.lower() for p in (ROOT/'supabase/migrations').glob('*.sql')))

node=shutil.which('node')
if node:
 fixture=r'''const fs=require('fs'),ts=require('typescript'),os=require('os'),path=require('path');let src=fs.readFileSync('angelcare-marketplace/studio-contract-saturation/developer-contract.ts','utf8');src=src.replace(/import \{ createHash \} from 'node:crypto'\n/,"const {createHash}=require('node:crypto')\n").replace(/import \{ STUDIO_CONTRACT_COMPATIBILITY_LEVELS,STUDIO_CONTRACT_SATURATION_VERSION \} from '\.\/types'\n/,"const STUDIO_CONTRACT_COMPATIBILITY_LEVELS=['PATCH_SAFE','MIGRATION_REQUIRED','BREAKING_FORBIDDEN'];const STUDIO_CONTRACT_SATURATION_VERSION=1\n").replace(/import \{ STUDIO_CONTRACT_CROSS_LINKS,STUDIO_CONTRACT_IMMUTABLE_INVARIANTS,STUDIO_CONTRACT_SCOPES,STUDIO_CONTRACT_STABLE_ID_CLASSES \} from '\.\/registry'\n/,"const STUDIO_CONTRACT_SCOPES=Array.from({length:14},(_,i)=>({scope:'s'+i,phase:i===0?'P00':i===1?'FOUNDATION':'P'+String(i-1).padStart(2,'0'),schemaVersion:'v'+i,hash:'a'.repeat(64),authority:'x',exportScope:'x',stableIds:i+1,dependsOn:[]}));const STUDIO_CONTRACT_CROSS_LINKS=Array.from({length:24},(_,i)=>({from:'P'+i,to:'P'+(i-1),relation:'r'+i,required:true}));const STUDIO_CONTRACT_STABLE_ID_CLASSES=Array.from({length:12},(_,i)=>({classId:'c'+i,owner:'P'+i,policy:'BREAKING_FORBIDDEN',examples:[]}));const STUDIO_CONTRACT_IMMUTABLE_INVARIANTS=['one']\n");const out=ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},fileName:'developer-contract.ts'}).outputText;const f=path.join(os.tmpdir(),'ac-p13-'+process.pid+'.cjs');fs.writeFileSync(f,out);const m=require(f);const c=m.studioContractSaturationDeveloperContractJson();if(c.phase!=='P13'||c.scopeCount!==14||c.crossLinkCount!==24||c.compatibilityLevels.length!==3||!/^([a-f0-9]{64})$/.test(c.hash))process.exit(17);if(c.compatibilityPolicy.renameOrRemoveStableId!=='BREAKING_FORBIDDEN')process.exit(18);console.log('PASS P13_MASTER_CONTRACT_FIXTURE');fs.unlinkSync(f)'''
 r=subprocess.run([node,'-e',fixture],cwd=ROOT,text=True,capture_output=True)
 if r.stdout.strip():print(r.stdout.strip())
 if r.stderr.strip():print(r.stderr.strip())
 ok('P13_MASTER_CONTRACT_FIXTURE',r.returncode==0)
 base=ROOT/'scripts/angelcare-marketplace/verify-design-studio-transplant.mjs';ok('STUDIO_37_REGRESSION',base.is_file() and subprocess.run([node,str(base)],cwd=ROOT).returncode==0)
 cats=True
 for i in range(1,11):
  f=ROOT/f'scripts/angelcare-marketplace/verify-studio-catalogue-category-{i:02d}.mjs'
  if not f.is_file() or subprocess.run([node,str(f)],cwd=ROOT).returncode:cats=False;break
 ok('STUDIO_10X10_REGRESSION',cats)

base_env=os.environ.get('ANGELCARE_P13_BASELINE');changed=[]
if base_env and Path(base_env).is_dir():
 base=Path(base_env)
 for p in ROOT.rglob('*'):
  if p.is_file() and p.suffix in {'.ts','.tsx'} and '.angelcare_patch_backups' not in p.parts:
   rel=p.relative_to(ROOT);q=base/rel
   if not q.exists() or p.read_bytes()!=q.read_bytes():changed.append(str(rel))
else:
 changed=[str(files[k].relative_to(ROOT)) for k in ['types','registry','dev','ui','api','studio_dev','studio_ui','dev_route','dev_page'] if files[k].suffix in {'.ts','.tsx'}]
changed=sorted(set(changed))
if node:
 js="""const fs=require('fs'),ts=require('typescript');const files=JSON.parse(process.argv[1]);let bad=[];for(const f of files){const r=ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.Preserve,isolatedModules:true},fileName:f,reportDiagnostics:true});const ds=(r.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);if(ds.length)bad.push([f,ds.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' '))]);}if(bad.length){for(const [f,d] of bad)console.error('TRANSPILE_FAIL',f,d.join('; '));process.exit(1)}console.log('PASS TARGETED_TYPESCRIPT_TRANSPILE FILES='+files.length)"""
 r=subprocess.run([node,'-e',js,json.dumps(changed)],cwd=ROOT,text=True,capture_output=True)
 if r.stdout.strip():print(r.stdout.strip())
 if r.stderr.strip():print(r.stderr.strip())
 ok('TARGETED_TYPESCRIPT_TRANSPILE',r.returncode==0,f'FILES={len(changed)}')

if errors:
 print('\nP13_VERIFY=FAIL');print('ERRORS='+','.join(errors));sys.exit(1)
print('\nP13_VERIFY=PASS')
print('PHASES=P00-P13 SCOPE_CONTRACTS=14 CROSS_LINKS=24 COMPATIBILITY_CLASSES=12')
print('MASTER_HASH=PASS TXT=PASS CSV=PASS JSON=PASS STUDIO_INSPECTOR=PASS')
print('BREAKING_CHANGE_POLICY=PASS P12_FORWARD_REGRESSION=PASS FINAL_CERTIFICATION_NEXT=YES')
print('DATABASE_SCHEMA_CHANGE=NO SQL_REQUIRED=NO MIGRATION=NO')
print('LOCAL_BUILD=NO GLOBAL_TYPESCRIPT=NO COMMIT=NO PUSH=NO DEPLOY=NO')
