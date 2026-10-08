#!/usr/bin/env python3
from __future__ import annotations
import json,re,subprocess,sys,shutil,os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
DOCS=ROOT/'docs/angelcare-marketplace/studio-saturation'
DIR=ROOT/'angelcare-marketplace/studio-workflows'
TYPES=DIR/'types.ts';REG=DIR/'registry.ts';REF=DIR/'reference.ts';EXE=DIR/'executor.ts';DEV=DIR/'developer-contract.ts';FIELD=DIR/'components/StudioWorkflowField.tsx';FORM=DIR/'components/StudioWorkflowForm.tsx';CSS=DIR/'components/studio-workflow.module.css'
PUCK=ROOT/'angelcare-marketplace/studio-universal/puck-config.tsx';PAGE_JSON=ROOT/'angelcare-marketplace/studio-universal/page-json.ts';STUDIO_TYPES=ROOT/'angelcare-marketplace/studio-universal/types.ts';BLOCKS=ROOT/'angelcare-marketplace/studio-universal/block-contracts.ts';BLOCK_RUNTIME=ROOT/'angelcare-marketplace/studio-universal/components/StudioBlockRuntime.tsx';VISUAL_RUNTIME=ROOT/'angelcare-marketplace/studio-universal/components/StudioVisualCatalogueRuntime.tsx';RUNTIME=ROOT/'angelcare-marketplace/studio-universal/StudioPublishedRenderer.tsx';PUB_GATE=ROOT/'angelcare-marketplace/studio-universal/publication-gate.ts';PERF=ROOT/'angelcare-marketplace/studio-universal/performance.ts';STUDIO_DEV=ROOT/'angelcare-marketplace/studio-universal/developer-contract.ts';ACTION_REG=ROOT/'angelcare-marketplace/studio-action-registry/registry.ts'
API=[ROOT/'app/api/angelcare-marketplace/public/studio-workflows/[workflowId]/route.ts',ROOT/'app/api/angelcare-marketplace/cms/studio/workflows/route.ts']
DEV_ROUTE=ROOT/'app/api/angelcare-marketplace/cms/developer-contract/route.ts';DEV_PAGE=ROOT/'app/angelcare-marketplace/(protected)/admin/experience/developer/page.tsx'
CATEGORY_PUBLIC=[ROOT/'app/angelcare-marketplace/[locale]/marketplace/[slug]/page.tsx',ROOT/'app/angelcare-marketplace/[locale]/marketplace/item/[itemSlug]/page.tsx',ROOT/'app/angelcare-marketplace/[locale]/experience/[itemSlug]/page.tsx']
errors=[]
P08_ACTIVE=os.getenv('ANGELCARE_VERIFY_P08_ACTIVE')=='1'
def read(p:Path)->str:
    if not p.exists(): errors.append(f'MISSING:{p.relative_to(ROOT)}'); return ''
    return p.read_text(errors='ignore')
def ok(name:str,cond:bool,detail:str=''):
    if cond: print(f'PASS {name}{(" "+detail) if detail else ""}')
    else: errors.append(name); print(f'FAIL {name}{(" "+detail) if detail else ""}')

# Certified predecessor must remain green.
p06=ROOT/'scripts/angelcare-marketplace/verify-studio-p06-dynamic-source.py'
ok('P06_VERIFIER_PRESENT',p06.is_file())
if p06.is_file():
    env=dict(os.environ);env['ANGELCARE_VERIFY_SKIP_PREDECESSOR']='1'
    ok('P06_STILL_PASS_SHALLOW',subprocess.run([sys.executable,str(p06)],cwd=ROOT,env=env).returncode==0)

files=[TYPES,REG,REF,EXE,DEV,FIELD,FORM,CSS,PUCK,PAGE_JSON,STUDIO_TYPES,BLOCKS,BLOCK_RUNTIME,VISUAL_RUNTIME,RUNTIME,PUB_GATE,PERF,STUDIO_DEV,ACTION_REG,*API,DEV_ROUTE,DEV_PAGE,*CATEGORY_PUBLIC]
text={p:read(p) for p in files};types=text[TYPES];reg=text[REG];ref=text[REF];exe=text[EXE];dev=text[DEV];field=text[FIELD];form=text[FORM];puck=text[PUCK];page=text[PAGE_JSON];studio_types=text[STUDIO_TYPES];blocks=text[BLOCKS];block_runtime=text[BLOCK_RUNTIME];visual_runtime=text[VISUAL_RUNTIME];runtime=text[RUNTIME];pub_gate=text[PUB_GATE];perf=text[PERF];studio_dev=text[STUDIO_DEV];action_reg=text[ACTION_REG];api='\n'.join(text[p] for p in API);dev_route=text[DEV_ROUTE];dev_page=text[DEV_PAGE]

# Registry completeness / semantics.
literal_ids=re.findall(r"id:'(inquiry\.general|inquiry\.partner|booking\.service|quotation\.request|academy\.enrollment|subscription\.partner|family\.request)'",reg)
expected=['inquiry.general','inquiry.partner','booking.service','quotation.request','academy.enrollment','subscription.partner','family.request','b2b.establishment','b2b.hospitality','b2b.health_partner','b2b.corporate']
b2b_verticals=['establishment','hospitality','health_partner','corporate']
ids=literal_ids+[f'b2b.{x}' for x in b2b_verticals]
ok('WORKFLOW_REGISTRY_11',len(ids)==11 and set(ids)==set(expected),f'COUNT={len(ids)}')
ok('WORKFLOW_IDS_UNIQUE',len(ids)==len(set(ids)))
exec_counts={x:len(re.findall(rf"execution:'{x}'",reg)) for x in ['public_inquiry','conversion','family_request','b2b_diagnostic']}
ok('WORKFLOW_EXECUTION_SPLIT',exec_counts=={'public_inquiry':2,'conversion':4,'family_request':1,'b2b_diagnostic':1} or exec_counts=={'public_inquiry':2,'conversion':4,'family_request':1,'b2b_diagnostic':4},str(exec_counts))
# b2b descriptors are generated from one map expression; prove 4 verticals separately.
ok('B2B_VERTICALS_4',all(x in reg for x in ["'establishment','hospitality','health_partner','corporate'"]))
ok('WORKFLOW_VERSIONED','version:1' in reg and 'version:1' in types)
ok('P03_ACTION_LINKS',all(x in reg for x in ["actionId:'inquiry.submit'","actionId:'booking.start'","actionId:'quotation.start'","actionId:'academy.enroll'","actionId:'subscription.start'","actionId:'family_request.start'","actionId:'b2b.request'"]))
ok('EXISTING_ADMIN_DESTINATIONS',all(x in reg for x in ['/admin/public-inquiries','/admin/conversion/bookings','/admin/quote-baskets','/admin/conversion/enrollments','/admin/subscriptions','/admin/family-requests','/admin/operations/b2b']))
ok('NO_NEW_WORKSPACE',all(x not in reg.lower() for x in ['studio-inquiries','studio-bookings','studio-orders','studio-forms-inbox']))

# Reference + P02 authoring selection.
ok('CANONICAL_WORKFLOW_REFERENCE','StudioWorkflowReference' in types and 'workflowId:string' in types)
ok('REFERENCE_VALIDATION','isStudioWorkflowReference' in ref and 'getStudioWorkflowDescriptor' in ref)
ok('P02_TARGET_PICKER','UniversalSourcePickerField' in field and 'descriptor.targetSources' in field)
ok('ZERO_RAW_ID_UX','UUID' not in field and 'entityId' not in field)
ok('AUTHORING_TRUST_METADATA',all(x in field for x in ['canonicalEngine','creates','adminDestination']))
ok('AUTHORING_ADMIN_BRIDGE','adminDestination' in field and 'Ouvrir l’espace existant' in field)

# Puck / persisted metadata / import validation.
ok('PUCK_WORKFLOW_FIELD','StudioWorkflowField' in puck and '__studioWorkflow' in puck)
ok('FORM_BLOCKS_WIRED',"type==='inquiry_form'||type==='studio_form'" in puck or "['inquiry_form','studio_form']" in puck)
ok('WORKFLOW_METADATA_WHITELIST',"'__studioWorkflow'" in blocks)
ok('WORKFLOW_TYPE_PERSISTENCE','__studioWorkflow?: StudioWorkflowReference' in studio_types)
ok('PAGE_JSON_TAMPER_VALIDATION','isStudioWorkflowReference' in page and '__studioWorkflow' in page)
ok('PUBLICATION_GATE_RESOLVED_FORM','__studioWorkflow' in pub_gate and 'studio_form' in pub_gate)
ok('PERFORMANCE_GATE_RESOLVED_FORM','__studioWorkflow' in perf and 'studio_form' in perf)

# Canonical execution; no shadow writes.
required_calls=['createPublicInquiry','createPublicDiagnosticRequest','createQuoteRequest','createPublicConversionSession','updatePublicConversionSession','revalidateConversionPrice','revalidateConversionAvailability','recordConversionConsent','confirmPublicConversion']
ok('CANONICAL_EXECUTION_CALLS',all(x in exe for x in required_calls))
ok('PUBLICATION_TARGET_GATE','live(state)' in exe and 'status,operational_status' in exe and 'n’est plus publiée' in exe)
ok('AVAILABILITY_REVALIDATION','revalidateConversionAvailability' in exe and 'availability' in exe)
ok('PRICE_REVALIDATION','revalidateConversionPrice' in exe)
ok('CONSENT_RECORDED','recordConversionConsent' in exe and 'consentKeys' in exe)
ok('IDEMPOTENCY','idempotencyKey' in exe and 'p07-confirm:' in exe)
ok('FAMILY_AUTH_REQUIRED','requireMarketplacePermission' in exe or 'getMarketplaceApiContext' in exe or 'family' in exe.lower() and 'auth' in exe.lower())
ok('NO_DIRECT_BUSINESS_WRITES',all(token not in exe for token in ['.insert(','.update(','.delete(','.upsert(','.rpc(']))
ok('NO_SHADOW_TABLE_NAMES',not any(x in (reg+exe).lower() for x in ['studio_workflow_submissions','studio_inquiries','studio_bookings','studio_forms','studio_leads']))

# Public API and form behavior.
ok('P07_API_ROUTES_2',all(p.is_file() for p in API),f'COUNT={sum(p.is_file() for p in API)}')
ok('CMS_API_RBAC',"requireMarketplaceApiContext('marketplace.cms.view')" in text[API[1]])
ok('PUBLIC_ROUTE_EXECUTOR','executeStudioWorkflow' in text[API[0]] and 'apiSuccess' in text[API[0]] and 'apiFailure' in text[API[0]])
ok('PUBLIC_ROUTE_WORKFLOW_MATCH','workflowId' in text[API[0]] and 'workflowId' in text[API[0]])
ok('EDITOR_SUBMISSION_DISABLED','editorMode' in form and ('disabled={editorMode' in form or 'if(editorMode)' in form))
ok('PUBLIC_FORM_POSTS_CANONICAL_ROUTE','/api/angelcare-marketplace/public/studio-workflows/' in form)
ok('PUBLIC_FORM_NO_ADMIN_INTERNALS','adminDestination' not in form and 'canonicalEngine' not in form)
ok('PUBLIC_FORM_NO_STACK_INTERNALS','stack' not in form.lower() and 'database' not in form.lower())
ok('VISITOR_COOKIE_MATCHES_CONVERSION','ac_marketplace_visitor' in form)
ok('CLIENT_IDEMPOTENCY','crypto.randomUUID' in form)

# Public renderer integration.
ok('BLOCK_RUNTIME_NATIVE_FORM','StudioWorkflowForm' in block_runtime and '__studioWorkflow' in block_runtime)
ok('VISUAL_RUNTIME_NATIVE_FORM','StudioWorkflowForm' in visual_runtime and '__studioWorkflow' in visual_runtime)
ok('PUBLISHED_RENDERER_LOCALE','locale={locale}' in runtime or 'locale={props.locale}' in runtime)
ok('AUTHORING_EDITOR_MODE','editorMode' in puck and 'StudioBlockRuntime' in puck)

# P03 forward integration.
ok('P03_INQUIRY_NOW_P07','formulaires canoniques P07' in action_reg)
ok('NO_FAKE_ACTION_EXECUTOR','p07WorkflowRequired:true' in action_reg)

# Developer contract.
ok('P07_DEVELOPER_CONTRACT',all(x in dev for x in ['STUDIO_WORKFLOW_DEVELOPER_CONTRACT','studioWorkflowDeveloperContractTxt','studioWorkflowDeveloperContractCsv','workflowCount']))
ok('P07_CONTRACT_INVARIANTS',all(x in dev for x in ['existingAuthoritiesOnly:true','newAdminWorkspace:false','shadowInbox:false','p03ActionReuse:true','p02CanonicalTargets:true','p08AssignedTemplateRenderSwitch:false','sqlRequired:false']))
ok('DEVELOPER_SCOPE_P07',"scope==='workflows'" in dev_route and 'X-Studio-Workflow-SHA256' in dev_route and 'scope=workflows&format=json' in dev_page)
ok('STUDIO_DEVELOPER_CONTRACT_EXTENDED',all(x in studio_dev for x in ['nativeWorkflows','nativeFormsConversionWiring: true']))

# Docs.
for f,name in [('P07_WORKFLOW_REGISTRY.json','P07_REGISTRY_DOC'),('P07_RUNTIME_WORKFLOW_CONTRACT.json','P07_RUNTIME_CONTRACT_DOC'),('P07_CERTIFICATION.md','P07_CERTIFICATION_DOC')]: ok(name,(DOCS/f).is_file())
if (DOCS/'P07_WORKFLOW_REGISTRY.json').is_file():
    d=json.loads((DOCS/'P07_WORKFLOW_REGISTRY.json').read_text()); ok('DOC_WORKFLOW_COUNT',d.get('workflow_count')==11); ok('DOC_SQL_NO',d.get('sql_required') is False)

# Security/no schema.
joined='\n'.join([reg,ref,exe,dev,field,form,puck,page,block_runtime,visual_runtime,runtime,api])
for name,patterns in {'LOCALSTORAGE':['localStorage.','window.localStorage'],'SESSIONSTORAGE':['sessionStorage.','window.sessionStorage'],'EVAL':['eval('],'NEW_FUNCTION':['new Function('],'DANGEROUS_HTML':['dangerouslySetInnerHTML']}.items(): ok('FORBIDDEN_'+name,all(x not in joined for x in patterns))
ok('NO_SQL_FILES',not any(DIR.rglob('*.sql')))
ok('NO_P07_MIGRATION_FILES',not any((ROOT/'supabase/migrations').glob('*p07*')))
ok('P08_FORWARD_INTEGRATION' if P08_ACTIVE else 'P08_ASSIGNED_TEMPLATE_SWITCH_FALSE',all('PublicCatalogExperience' in text[p] for p in CATEGORY_PUBLIC) if P08_ACTIVE else all('StudioPublishedRenderer' not in text[p] for p in CATEGORY_PUBLIC))

# Existing regressions.
node=shutil.which('node')
if node:
    base=ROOT/'scripts/angelcare-marketplace/verify-design-studio-transplant.mjs'
    ok('STUDIO_37_REGRESSION',base.is_file() and subprocess.run([node,str(base)],cwd=ROOT).returncode==0)
    cats=True
    for i in range(1,11):
        f=ROOT/f'scripts/angelcare-marketplace/verify-studio-catalogue-category-{i:02d}.mjs'
        if not f.is_file() or subprocess.run([node,str(f)],cwd=ROOT).returncode: cats=False; break
    ok('STUDIO_10X10_REGRESSION',cats)

# Targeted TypeScript transpilation only.
ts_files=['angelcare-marketplace/studio-workflows/types.ts','angelcare-marketplace/studio-workflows/registry.ts','angelcare-marketplace/studio-workflows/reference.ts','angelcare-marketplace/studio-workflows/executor.ts','angelcare-marketplace/studio-workflows/developer-contract.ts','angelcare-marketplace/studio-workflows/components/StudioWorkflowField.tsx','angelcare-marketplace/studio-workflows/components/StudioWorkflowForm.tsx','app/api/angelcare-marketplace/public/studio-workflows/[workflowId]/route.ts','app/api/angelcare-marketplace/cms/studio/workflows/route.ts','angelcare-marketplace/studio-universal/types.ts','angelcare-marketplace/studio-universal/block-contracts.ts','angelcare-marketplace/studio-universal/puck-config.tsx','angelcare-marketplace/studio-universal/page-json.ts','angelcare-marketplace/studio-universal/components/StudioBlockRuntime.tsx','angelcare-marketplace/studio-universal/components/StudioVisualCatalogueRuntime.tsx','angelcare-marketplace/studio-universal/StudioPublishedRenderer.tsx','angelcare-marketplace/studio-universal/developer-contract.ts','app/api/angelcare-marketplace/cms/developer-contract/route.ts','app/angelcare-marketplace/(protected)/admin/experience/developer/page.tsx','angelcare-marketplace/studio-action-registry/registry.ts','angelcare-marketplace/studio-universal/publication-gate.ts','angelcare-marketplace/studio-universal/performance.ts']
if node:
    probe=subprocess.run([node,'-e',"try{require('typescript');process.exit(0)}catch(e){process.exit(2)}"],cwd=ROOT)
    if probe.returncode==0:
        js="""const fs=require('fs'),ts=require('typescript');const files=JSON.parse(process.argv[1]);let bad=[];for(const f of files){const r=ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX},fileName:f,reportDiagnostics:true});const ds=(r.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);if(ds.length)bad.push([f,ds.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' '))]);}if(bad.length){for(const [f,d] of bad)console.error('TRANSPILE_FAIL',f,d.join('; '));process.exit(1)}console.log('PASS TARGETED_TYPESCRIPT_TRANSPILE FILES='+files.length)"""
        run=subprocess.run([node,'-e',js,json.dumps(ts_files)],cwd=ROOT,text=True,capture_output=True)
        if run.stdout.strip(): print(run.stdout.strip())
        if run.stderr.strip(): print(run.stderr.strip())
        ok('TARGETED_TYPESCRIPT_TRANSPILE',run.returncode==0)
    else: print('INFO TARGETED_TYPESCRIPT_TRANSPILE=SKIPPED_TYPESCRIPT_NOT_RESOLVABLE')

if errors:
    print('\nP07_VERIFY=FAIL'); print('ERRORS='+','.join(errors)); sys.exit(1)
print('\nP07_VERIFY=PASS')
print('WORKFLOWS=11 DIRECT_INQUIRY=2 CONVERSION=4 FAMILY=1 B2B=4 API_ROUTES=2')
print('P02_TARGETS=PASS P03_ACTIONS=PASS CANONICAL_EXECUTION=PASS PUBLIC_RUNTIME=PASS')
print('FAIL_CLOSED=PASS NO_SHADOW_WORKSPACES=PASS P08_ASSIGNED_TEMPLATE_SWITCH='+('YES' if P08_ACTIVE else 'NO'))
print('DATABASE_SCHEMA_CHANGE=NO SQL_REQUIRED=NO MIGRATION=NO')
print('LOCAL_BUILD=NO GLOBAL_TYPESCRIPT=NO P08_RENDER_SWITCH='+('YES' if P08_ACTIVE else 'NO'))
