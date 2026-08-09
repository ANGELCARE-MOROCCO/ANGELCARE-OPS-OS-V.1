import fs from 'node:fs'
import path from 'node:path'
const app=process.argv[2]?path.resolve(process.argv[2]):process.cwd()
const failures=[]
let pass=0
const check=(label,condition)=>{if(condition){console.log(`  ✓ ${label}`);pass+=1}else failures.push(label)}
const file=(rel)=>path.join(app,rel)
const text=(rel)=>fs.readFileSync(file(rel),'utf8')
const required=[
'angelcare-marketplace/operations-reconciliation/types.ts',
'angelcare-marketplace/operations-reconciliation/validation.ts',
'angelcare-marketplace/operations-reconciliation/repository.ts',
'angelcare-marketplace/operations-reconciliation/api-handlers.ts',
'angelcare-marketplace/operations-reconciliation/content.ts',
'angelcare-marketplace/operations-reconciliation/operations-commerce.module.css',
'angelcare-marketplace/operations-reconciliation/components/OperationsCommerceCommand.tsx',
'angelcare-marketplace/operations-reconciliation/components/OperationsQueuePage.tsx',
'angelcare-marketplace/operations-reconciliation/components/CounterpartyCommands.tsx',
'angelcare-marketplace/operations-reconciliation/components/CaseCommands.tsx',
'angelcare-marketplace/operations-reconciliation/components/FulfillmentActionClient.tsx',
'angelcare-marketplace/operations-reconciliation/components/FulfillmentDossier.tsx',
'app/angelcare-marketplace/(protected)/admin/operations/page.tsx',
'app/angelcare-marketplace/(protected)/admin/operations/action-center/page.tsx',
'app/angelcare-marketplace/(protected)/admin/operations/fulfillment/page.tsx',
'app/angelcare-marketplace/(protected)/admin/operations/fulfillment/[caseId]/page.tsx',
'app/angelcare-marketplace/(protected)/admin/operations/returns/page.tsx',
'app/angelcare-marketplace/(protected)/admin/operations/disputes/page.tsx',
'app/angelcare-marketplace/(protected)/admin/operations/recovery/page.tsx',
'app/angelcare-marketplace/(protected)/admin/operations/reconciliation/page.tsx',
'app/angelcare-marketplace/(protected)/admin/operations/settlements/page.tsx',
'app/angelcare-marketplace/(protected)/admin/operations/exceptions/page.tsx',
'app/angelcare-marketplace/(protected)/admin/vendors/page.tsx',
'app/angelcare-marketplace/(protected)/admin/providers/commerce/page.tsx',
'app/api/angelcare-marketplace/operations/commerce/summary/route.ts',
'app/api/angelcare-marketplace/operations/fulfillment/route.ts',
'app/api/angelcare-marketplace/operations/fulfillment/[caseId]/route.ts',
'app/api/angelcare-marketplace/operations/fulfillment/[caseId]/transition/route.ts',
'app/api/angelcare-marketplace/operations/fulfillment/[caseId]/evidence/route.ts',
'app/api/angelcare-marketplace/operations/reconciliation/[caseId]/handover/route.ts',
'supabase/migrations/20260802210000_angelcare_marketplace_operations_reconciliation_universe.sql',
'angelcare-marketplace/database/rollback/20260802210000_angelcare_marketplace_operations_reconciliation_SAFE_ROLLBACK.sql',
'tsconfig.angelcare-marketplace-operations-reconciliation.json',
]
console.log('ANGELCARE Marketplace Operations & Reconciliation — contractual verifier')
for(const rel of required)check(`required ${rel}`,fs.existsSync(file(rel)))
const sql=text('supabase/migrations/20260802210000_angelcare_marketplace_operations_reconciliation_universe.sql')
for(const marker of [
'angelcare_marketplace_fulfillment_cases','angelcare_marketplace_fulfillment_obligations','angelcare_marketplace_fulfillment_events','angelcare_marketplace_fulfillment_evidence',
'angelcare_marketplace_vendor_links','angelcare_marketplace_provider_links','angelcare_marketplace_return_cases','angelcare_marketplace_replacement_cases',
'angelcare_marketplace_disputes','angelcare_marketplace_dispute_evidence','angelcare_marketplace_recovery_plans','angelcare_marketplace_recovery_actions',
'angelcare_marketplace_reconciliation_cases','angelcare_marketplace_reconciliation_lines','angelcare_marketplace_settlement_readiness',
'angelcare_marketplace_operational_exceptions','angelcare_marketplace_operational_sla_events','angelcare_marketplace_operations_policies',
'angelcare_marketplace_operations_command_v','angelcare_marketplace_operations_financial_v','angelcare_marketplace_materialize_fulfillment_from_journey',
"'operations-reconciliation-universe'",'marketplace_operations_reconciliation_manager',',24)','marketplace.operations.reconciliation.enabled',
'enable row level security','revoke all on table','grant all on table'
])check(`SQL ${marker}`,sql.toLowerCase().includes(marker.toLowerCase()))
check('SQL no destructive table/column operation',!/drop\s+table|truncate\s+table|drop\s+column/i.test(sql))
check('SQL no volatile generated now()',!/generated\s+always\s+as\s*\([^)]*now\s*\(/i.test(sql))
check('SQL journey materialization idempotency',/on\s+conflict\s*\(\s*journey_id\s*,\s*canonical_object_type\s*,\s*canonical_object_id\s*\)\s*do\s+nothing/i.test(sql))
check('SQL post-MZ20 governed sequence',/introduced_by_mega_zip\s*>?=\s*1/i.test(sql))
check('SQL evidence authority persistent',/validation_status[^;]+submitted[^;]+under_review[^;]+validated[^;]+rejected/i.test(sql))
check('SQL Finance handover persistent',/finance_handover_status/i.test(sql)&&/reconciliation_lines/i.test(sql))
check('SQL settlement gates persistent',/evidence_complete/i.test(sql)&&/quality_validated/i.test(sql)&&/dispute_clear/i.test(sql)&&/approval_ready/i.test(sql))
check('SQL does not post invoices/payments',!/insert\s+into\s+public\.(?:angelcare_marketplace_)?(?:invoices|payments|ledger|general_ledger)/i.test(sql))
const rollback=text('angelcare-marketplace/database/rollback/20260802210000_angelcare_marketplace_operations_reconciliation_SAFE_ROLLBACK.sql')
check('rollback preserves history tables',/history tables are deliberately retained/i.test(rollback)&&!/drop\s+table|truncate/i.test(rollback))
const repository=text('angelcare-marketplace/operations-reconciliation/repository.ts')
for(const marker of ['writeMarketplaceAudit','tenantId','territoryId','assertFulfillmentTransition','Une preuve est requise','Une réconciliation approuvée est requise','finance_handover','dispute_open','approval_status','Litige introuvable dans votre périmètre','Réconciliation introuvable dans votre périmètre','replace(/[%_,.()]/g'])check(`repository ${marker}`,repository.includes(marker))
check('repository no Finance posting',!/\.from\(['"](?:angelcare_marketplace_)?(?:invoices|payments|ledger)/i.test(repository))
const validation=text('angelcare-marketplace/operations-reconciliation/validation.ts')
check('server lifecycle map exists',validation.includes('const transitions:Record<FulfillmentStatus,FulfillmentStatus[]>'))
check('closed lifecycle terminal',/closed:\[\]/.test(validation))
const nav=text('angelcare-marketplace/shells/AdminNavigation.tsx')
for(const href of ['/angelcare-marketplace/admin/operations/action-center','/angelcare-marketplace/admin/operations/fulfillment','/angelcare-marketplace/admin/vendors','/angelcare-marketplace/admin/providers/commerce','/angelcare-marketplace/admin/operations/reconciliation','/angelcare-marketplace/admin/operations/live'])check(`navigation ${href}`,nav.includes(href))
check('Mission Control preserved',fs.existsSync(file('app/angelcare-marketplace/(protected)/admin/operations/live/page.tsx'))&&nav.includes("label:'Mission Control'"))
const css=text('angelcare-marketplace/operations-reconciliation/operations-commerce.module.css')
for(const marker of ['.hero{','.metrics{','.cards{','.board{','.dossierGrid{','.actions{','.vendor{','.provider{','.recovery{','.finance{','@media(max-width:720px)','@media(prefers-reduced-motion:reduce)'])check(`visual ${marker}`,css.includes(marker))
const sourceRoots=['angelcare-marketplace/operations-reconciliation','app/angelcare-marketplace/(protected)/admin/operations','app/angelcare-marketplace/(protected)/admin/vendors','app/angelcare-marketplace/(protected)/admin/providers/commerce','app/api/angelcare-marketplace/operations']
function walk(dir){if(!fs.existsSync(dir))return;for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const target=path.join(dir,entry.name);if(entry.isDirectory())walk(target);else if(/\.(ts|tsx)$/.test(entry.name)){const source=fs.readFileSync(target,'utf8');check(`${path.relative(app,target)} no suppression`,!/@ts-ignore|@ts-nocheck|\bas any\b|unknown as|ignoreBuildErrors|TODO\s*:|lorem ipsum|localStorage/i.test(source))}}}
for(const root of sourceRoots)walk(file(root))
const apiRoot=file('app/api/angelcare-marketplace/operations')
function checkThin(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const target=path.join(dir,entry.name);if(entry.isDirectory())checkThin(target);else if(entry.name==='route.ts'){const nonblank=fs.readFileSync(target,'utf8').split(/\r?\n/).filter(Boolean);check(`thin API ${path.relative(app,target)}`,nonblank.length<=4)}}}
checkThin(apiRoot)
for(const doc of ['CONSOLIDATED_CONTRACT','IMPLEMENTATION_REPORT','CANONICAL_AUTHORITY_MATRIX','ROUTE_REGISTER','ENTITY_REGISTER','PERMISSION_MATRIX','LIFECYCLE_MATRIX','FINANCIAL_RECONCILIATION_CONTRACT','VENDOR_PROVIDER_ISOLATION','CUSTOMER_SAFE_VISIBILITY','QA_EVIDENCE','MIGRATION_REGISTER','OPERATOR_GUIDE','HANDOVER','KNOWN_DEPENDENCIES','ACCEPTANCE_MATRIX'])check(`handover artifact ${doc}`,fs.existsSync(file(`angelcare-marketplace/documentation/operations-reconciliation/${doc}.md`)))
console.log(`\nPASS ${pass}`)
if(failures.length){console.log(`FAIL ${failures.length}`);for(const failure of failures)console.log(`  ✗ ${failure}`);process.exit(1)}
console.log('RESULT: OPERATIONS & RECONCILIATION STATIC CONTRACTUAL ACCEPTANCE PASSED')
