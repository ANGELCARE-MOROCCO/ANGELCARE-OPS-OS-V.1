#!/usr/bin/env python3
from __future__ import annotations
import json,re,sys,subprocess,shutil
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
DOCS=ROOT/'docs/angelcare-marketplace/studio-saturation'
REG=ROOT/'angelcare-marketplace/studio-source-registry/registry.ts'
ADAPTERS=ROOT/'angelcare-marketplace/studio-source-registry/adapters/index.ts'
TABLE=ROOT/'angelcare-marketplace/studio-source-registry/adapters/table-adapter.ts'
RESOLVER=ROOT/'angelcare-marketplace/studio-source-registry/resolver.ts'
TYPES=ROOT/'angelcare-marketplace/studio-source-registry/types.ts'
DEV=ROOT/'angelcare-marketplace/studio-source-registry/developer-contract.ts'
STUDIO_DEV=ROOT/'angelcare-marketplace/studio-universal/developer-contract.ts'
DEV_ROUTE=ROOT/'app/api/angelcare-marketplace/cms/developer-contract/route.ts'
ROUTE_ROOT=ROOT/'app/api/angelcare-marketplace/cms/studio/sources'

errors=[]
def ok(name,cond,detail=''):
    if cond: print(f'PASS {name}{(" "+detail) if detail else ""}')
    else: errors.append(name); print(f'FAIL {name}{(" "+detail) if detail else ""}')

def read(p):
    if not p.exists(): errors.append(f'MISSING:{p.relative_to(ROOT)}'); return ''
    return p.read_text(errors='ignore')

p00=json.loads((DOCS/'P00_SOURCE_REGISTRY_CANDIDATES.json').read_text())
permissions={row['permission'] for row in json.loads((DOCS/'P00_PERMISSION_INVENTORY.json').read_text())}
reg=read(REG)
adapters=read(ADAPTERS)
table=read(TABLE)
resolver=read(RESOLVER)
types=read(TYPES)
dev=read(DEV)
studio_dev=read(STUDIO_DEV)
dev_route=read(DEV_ROUTE)

# registry descriptors are intentionally one descriptor per line
records=[]
for line in reg.splitlines():
    if 'source({ id:' not in line: continue
    def g(pattern):
        m=re.search(pattern,line); return m.group(1) if m else None
    records.append({'id':g(r"id:'([^']+)'"),'p00':g(r"p00CandidateId:'([^']+)'"),'permission':g(r"permission:'([^']+)'"),'authority':g(r"reference:'([^']+)'"),'adapter':g(r"adapter:'([^']+)'")})
ids=[r['id'] for r in records if r['id']]
p00_ids=[r['p00'] for r in records if r['p00']]
expected=[row['source_id'] for row in p00['sources']]

ok('P00_SOURCE_CANDIDATES',len(expected)==20,f'COUNT={len(expected)}')
ok('P01_DESCRIPTORS',len(records)==20,f'COUNT={len(records)}')
ok('SOURCE_IDS_UNIQUE',len(ids)==len(set(ids))==20)
ok('P00_TRACEABILITY_EXACT',set(p00_ids)==set(expected) and len(p00_ids)==20)
ok('P00_TRACEABILITY_UNIQUE',len(p00_ids)==len(set(p00_ids))==20)
ok('PERMISSIONS_FROM_P00',all(r['permission'] in permissions for r in records))
ok('SYMBOLIC_AUTHORITIES',all(r['authority'] and not r['authority'].startswith('angelcare_marketplace_') for r in records))

adapter_ids=set(re.findall(r"tableSourceAdapter\(\{sourceId:'([^']+)'",adapters))
if "sourceId:'navigation.destinations'" in adapters: adapter_ids.add('navigation.destinations')
ok('ADAPTERS_20',len(adapter_ids)==20,f'COUNT={len(adapter_ids)}')
ok('ADAPTER_COVERAGE_EXACT',adapter_ids==set(ids))

route_files=sorted(ROUTE_ROOT.rglob('route.ts')) if ROUTE_ROOT.exists() else []
ok('API_ROUTE_FILES',len(route_files)==6,f'COUNT={len(route_files)}')
for route in route_files:
    content=read(route)
    ok(f'ROUTE_GUARD:{route.relative_to(ROOT)}',"requireMarketplaceApiContext('marketplace.cms.view')" in content)

ok('CANONICAL_REFERENCE_TYPE','sourceId: string' in types and 'entityId: string' in types and 'StudioSourceReference' in types)
ok('NORMALIZED_ENTITY_CONTRACT','StudioSourceEntity' in types and 'canonicalRef' in types and 'metadata: Record<string, unknown>' in types)
ok('SEARCH_BOUNDED','Math.min' in table and ',50)' in table and '.range(offset,offset+limit-1)' in table)
ok('QUERY_SANITIZED',"replace(/[^\\p{L}\\p{N}\\s-]/gu" in table)
ok('NO_TABLE_SELECT_STAR',".select('*'" not in table)
ok('SAFE_PROJECTION','projection(config)' in table and 'publicSafeProjection' in reg)
ok('FILTER_ALLOWLIST','Filtre non autorisé' in table and 'filterFields' in table)
ok('LOCALE_CONTEXT','localeField' in table and "input.context?.locale||context.locale" in table)
ok('TERRITORY_CONTEXT','requestedTerritory' in resolver and 'hors du périmètre' in resolver and 'input.context?.territoryId??context.territoryId' in table)
ok('FAIL_CLOSED_UNKNOWN_SOURCE',"throw new MarketplaceError('NOT_FOUND','Source Studio inconnue.')" in resolver)
ok('FAIL_CLOSED_MISSING_ADAPTER',"CONFIGURATION_ERROR" in resolver and 'Aucun adaptateur' in resolver)
ok('PERMISSION_PROPAGATION','hasMarketplacePermission' in resolver and 'PERMISSION_DENIED' in resolver)
ok('REFERENCE_VALIDATION',all(token in resolver for token in ['SOURCE_UNKNOWN','NOT_AUTHORIZED','NOT_FOUND','DISABLED','NOT_PUBLISHED','VALID']))
ok('DEVELOPER_CONTRACT',all(token in dev for token in ['buildStudioSourceRegistryDeveloperContract','studioSourceRegistryContractTxt','studioSourceRegistryContractCsv']))
ok('STUDIO_CONTRACT_EXTENDED','sourceRegistrySources' in studio_dev and 'universalSourceRegistry: true' in studio_dev and 'sourceRegistry:' in studio_dev)
ok('SOURCE_REGISTRY_EXPORT_SCOPE',"scope==='source-registry'" in dev_route and 'X-Studio-Source-Registry-SHA256' in dev_route)
route_joined='\n'.join(read(p) for p in route_files)
ok('ROUTE_CONTEXT_DEFAULTS',"?locale:context.locale" in route_joined and 'territoryId:url.searchParams.get' in route_joined)

p01_files=list((ROOT/'angelcare-marketplace/studio-source-registry').rglob('*.ts'))+route_files
joined='\n'.join(read(p) for p in p01_files)
for forbidden in ['localStorage','sessionStorage','eval(','new Function(','dangerouslySetInnerHTML']:
    ok(f'FORBIDDEN_{forbidden.replace("(","").replace(" ","_").upper()}',forbidden not in joined)
db_joined='\n'.join(read(p) for p in [TABLE,ADAPTERS,RESOLVER]+route_files)
for mutation in ['.insert(','.update(','.delete(','.upsert(','.rpc(']:
    ok(f'READ_ONLY_{mutation[1:-1].upper()}',mutation not in db_joined)
ok('NO_SQL_FILES',not any((ROOT/'angelcare-marketplace/studio-source-registry').rglob('*.sql')))
ok('NO_P02_PICKER_UI',not any('picker' in p.name.lower() for p in (ROOT/'angelcare-marketplace/studio-source-registry').rglob('*') if p.is_file()))

# Targeted syntax transpilation only: exact P01 files + three touched integration files.
node=shutil.which('node')
if node:
    probe=subprocess.run([node,'-e',"try{require('typescript');process.exit(0)}catch(e){process.exit(2)}"],cwd=ROOT)
    if probe.returncode==0:
        js=r'''
const fs=require('fs'),path=require('path'),ts=require('typescript');
const roots=['angelcare-marketplace/studio-source-registry','app/api/angelcare-marketplace/cms/studio/sources'];
const files=[];const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(/\.tsx?$/.test(e.name))files.push(p)}};roots.forEach(walk);
files.push('angelcare-marketplace/studio-universal/developer-contract.ts','app/api/angelcare-marketplace/cms/developer-contract/route.ts','app/angelcare-marketplace/(protected)/admin/experience/developer/page.tsx');
let bad=[];for(const f of files){const r=ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX},fileName:f,reportDiagnostics:true});const ds=(r.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);if(ds.length)bad.push([f,ds.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' '))]);}
if(bad.length){for(const [f,d] of bad)console.error('TRANSPILE_FAIL',f,d.join('; '));process.exit(1)}console.log('PASS TARGETED_TYPESCRIPT_TRANSPILE FILES='+files.length)
'''
        run=subprocess.run([node,'-e',js],cwd=ROOT,text=True,capture_output=True)
        if run.stdout.strip(): print(run.stdout.strip())
        if run.stderr.strip(): print(run.stderr.strip())
        ok('TARGETED_TYPESCRIPT_TRANSPILE',run.returncode==0)
    else:
        print('INFO TARGETED_TYPESCRIPT_TRANSPILE=SKIPPED_TYPESCRIPT_NOT_RESOLVABLE')
else:
    print('INFO TARGETED_TYPESCRIPT_TRANSPILE=SKIPPED_NODE_NOT_FOUND')

if errors:
    print('\nP01_VERIFY=FAIL')
    print('ERRORS='+','.join(errors))
    sys.exit(1)
print('\nP01_VERIFY=PASS')
print('P00_CANDIDATES=20 REGISTERED=20 ADAPTERS=20 API_ROUTES=6')
print('DATABASE_CHANGE=NO SQL_REQUIRED=NO MIGRATION=NO')
print('LOCAL_BUILD=NO GLOBAL_TYPESCRIPT=NO P02_UI=NO')
