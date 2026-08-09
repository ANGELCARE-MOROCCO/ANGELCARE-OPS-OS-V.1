import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root=process.cwd(), failures=[], passes=[]
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8')
const exists=(p)=>fs.existsSync(path.join(root,p))
const check=(condition,label,detail='')=>condition?passes.push({label,detail}):failures.push({label,detail})

const required=[
'app/(protected)/revenue-command-os/signals/layout.tsx','app/(protected)/revenue-command-os/signals/page.tsx','app/(protected)/revenue-command-os/signals/[section]/page.tsx',
'app/(protected)/revenue-command-os/signals/_components/SignalFabricContext.tsx','app/(protected)/revenue-command-os/signals/_components/SignalFabricFrame.tsx','app/(protected)/revenue-command-os/signals/_components/SignalFabricWorkspace.tsx','app/(protected)/revenue-command-os/signals/_components/SignalDrawer.tsx',
'app/api/revenue-command-os/signals/route.ts','lib/revenue-command-os/signal-fabric/constants.ts','lib/revenue-command-os/signal-fabric/adapters.ts','lib/revenue-command-os/signal-fabric/classification.ts','lib/revenue-command-os/signal-fabric/context.ts','lib/revenue-command-os/signal-fabric/seed-data.ts','lib/revenue-command-os/signal-fabric/validation.ts','lib/revenue-command-os/signal-fabric/repository.ts',
'supabase/migrations/20260720_revenue_command_os_phase4_signal_fabric.sql','docs/revenue-command-os/phase-04/CANONICAL_BUILD_CONTRACT_LOCK.md','docs/revenue-command-os/phase-04/README.md','docs/revenue-command-os/phase-04/ARCHITECTURE.md','docs/revenue-command-os/phase-04/DATA_DICTIONARY.md','docs/revenue-command-os/phase-04/API_CONTRACT.md','docs/revenue-command-os/phase-04/SECURITY_AND_GOVERNANCE.md','docs/revenue-command-os/phase-04/INSTALLATION.md','docs/revenue-command-os/phase-04/ACCEPTANCE.md','docs/revenue-command-os/phase-04/SEED_PROVENANCE.md','docs/revenue-command-os/phase-04/CHANGELOG.md','docs/revenue-command-os/phase-04/ROLLBACK.sql',
'tests/revenue-command-os/fixtures/phase4-signal-fabric.json','tests/revenue-command-os/fixtures/phase4-classification-cases.json','tests/revenue-command-os/fixtures/phase4-privacy-cases.json','tsconfig.revenue-os-phase4.json']
for(const file of required)check(exists(file),`Required file: ${file}`)

const constants=read('lib/revenue-command-os/signal-fabric/constants.ts'), adapters=read('lib/revenue-command-os/signal-fabric/adapters.ts'), classification=read('lib/revenue-command-os/signal-fabric/classification.ts'), context=read('lib/revenue-command-os/signal-fabric/context.ts'), seed=read('lib/revenue-command-os/signal-fabric/seed-data.ts'), validation=read('lib/revenue-command-os/signal-fabric/validation.ts'), repository=read('lib/revenue-command-os/signal-fabric/repository.ts'), api=read('app/api/revenue-command-os/signals/route.ts'), frame=read('app/(protected)/revenue-command-os/signals/_components/SignalFabricFrame.tsx'), workspace=read('app/(protected)/revenue-command-os/signals/_components/SignalFabricWorkspace.tsx'), drawer=read('app/(protected)/revenue-command-os/signals/_components/SignalDrawer.tsx'), migration=read('supabase/migrations/20260720_revenue_command_os_phase4_signal_fabric.sql'), rollback=read('docs/revenue-command-os/phase-04/ROLLBACK.sql'), types=read('lib/revenue-command-os/types.ts'), osConstants=read('lib/revenue-command-os/constants.ts'), search=read('lib/revenue-command-os/search.ts'), searchApi=read('app/api/revenue-command-os/search/route.ts')
const fixture=JSON.parse(read('tests/revenue-command-os/fixtures/phase4-signal-fabric.json')), classCases=JSON.parse(read('tests/revenue-command-os/fixtures/phase4-classification-cases.json')), privacyCases=JSON.parse(read('tests/revenue-command-os/fixtures/phase4-privacy-cases.json'))

check(constants.includes("AC-REVENUE-OS-MZ04-SIGNAL-FABRIC"),'Release code locked')
check(constants.includes("4.0.0-phase4"),'Module version locked')
check(constants.includes("shadow-observation"),'Execution posture locked to shadow observation')
const sectionKeys=['overview','live-stream','source-control','source-health','classification','deduplication','scheduled-scans','context-snapshots','stale-data','subscriptions','data-access','model-validation']
for(const key of sectionKeys)check(constants.includes(`key: '${key}'`),`Signal workspace section: ${key}`)
check(sectionKeys.length===fixture.minimum.sections,'Fixture section count matches')

const sourceCodes=['SRC-B2B-PROSPECTS','SRC-B2B-CONTACTS','SRC-B2B-MEETINGS','SRC-B2B-PROPOSALS','SRC-BROWSER-OPPORTUNITIES','SRC-REVENUE-PROSPECTS','SRC-REVENUE-APPOINTMENTS','SRC-REVENUE-PARTNERSHIPS','SRC-EMAIL-INBOX','SRC-EMAIL-OUTBOX','SRC-TRAINING-SESSIONS','SRC-ACADEMY-TRAINERS','SRC-FINANCE-INVOICES','SRC-FINANCE-PAYMENTS','SRC-CUSTOMER-CLAIMS']
for(const code of sourceCodes){check(seed.includes(`"code": "${code}"`),`Source seed: ${code}`);check(adapters.includes(`sourceCode:'${code}'`),`Adapter registered: ${code}`)}
check(sourceCodes.length===fixture.minimum.sources,'Fixture source count matches')
const allowedTables=['b2b_prospects','b2b_contacts','b2b_meetings','b2b_proposals','browser_extension_b2b_opportunities','revenue_prospects','revenue_appointments','revenue_partnerships','email_os_core_inbox','email_os_core_outbox','trn_sessions','academy_trainers','academy_trainer_assignments','angelcare360_invoices','angelcare360_payments','bill_proposals','angelcare360_reclamations']
for(const table of allowedTables)check(constants.includes(`'${table}'`),`Source table allow-listed: ${table}`)
check(adapters.includes('sanitizeRevenueSignalPayload'),'Payload minimization implemented')
for(const secret of ['password','token','cookie','service_role','private_key','bank_account'])check(constants.includes(secret),`Sensitive pattern blocked: ${secret}`)
check(adapters.includes('createSignalDeduplicationKey')&&adapters.includes("createHash('sha256')"),'SHA-256 deduplication implemented')
check(adapters.includes('createSignalPayloadHash'),'Payload hashing implemented')
check(adapters.includes('assertAllowedSignalTable'),'Runtime source table allow-list enforced')

for(let i=1;i<=16;i++)check(seed.includes(`"code": "SIG-RULE-${String(i).padStart(3,'0')}"`),`Classifier rule seeded: SIG-RULE-${String(i).padStart(3,'0')}`)
check(fixture.minimum.rules===16,'Fixture classifier count locked')
for(const category of ['payment','customer-risk','account-intent','proposal','meeting','capacity','renewal','market-opportunity','execution','data-quality','seasonality'])check(classification.includes(`category='${category}'`)||seed.includes(`"category": "${category}"`),`Classification category: ${category}`)
for(const score of ['urgencyScore','opportunityScore','riskScore','priorityScore'])check(classification.includes(score)||types.includes(score),`Signal score modeled: ${score}`)
check(classification.includes('35+opportunity*.35+risk*.3')||classification.includes("urgency*.35+opportunity*.35+risk*.3"),'Priority formula implemented')
check(classCases.length>=12,'Classification regression cases provided')
for(const item of classCases)check(Boolean(item.expectedCategory&&item.expectedSeverity&&item.mustRecommend),`Classification case complete: ${item.case}`)

for(const type of ['RevenueSignalSource','RevenueRawSignalEvent','RevenueSignal','RevenueSignalRule','RevenueScheduledScan','RevenueSignalSourceHealth','RevenueSignalContextSnapshot','RevenueSignalSubscription','RevenueSignalValidationIssue','RevenueSignalReadiness','RevenueSignalBootstrap'])check(types.includes(`type ${type}`),`Type contract: ${type}`)
for(const status of ['new','triaged','acknowledged','context-ready','monitoring','resolved','dismissed','blocked'])check(types.includes(`'${status}'`),`Signal lifecycle status: ${status}`)
for(const confidence of ['confirmed','high','medium','low','unknown'])check(types.includes(`'${confidence}'`),`Signal confidence status: ${confidence}`)

check(context.includes('buildSignalContextSnapshot'),'Context builder implemented')
check(context.includes('facts:')&&context.includes('hypotheses:'),'Facts separated from hypotheses')
check(context.includes('visibilityProfile'),'Visibility profiles enforced')
check(context.includes('redactedFields'),'Context redactions represented')
check(context.includes('Digital Twin')||context.includes('digitalTwin'),'Digital Twin context bridge implemented')
check(context.includes('doctrines'),'Doctrine context bridge implemented')
check(context.includes('expiresAt'),'Context expiry implemented')
for(const profile of ['executive','revenue-manager','commercial-agent','auditor'])check(constants.includes(`'${profile}'`),`Visibility profile: ${profile}`)
check(privacyCases.length>=10,'Privacy regression cases provided')
for(const item of privacyCases)check(Boolean(item.mustRedact||item.mustSummarize||item.mustHide||item.mustMinimize||item.mustNotCentralize),`Privacy case complete: ${item.field||item.profile||item.source}`)

check(repository.includes("import 'server-only'"),'Signal repository is server-only')
for(const fn of ['readRevenueSignalFabric','ingestRevenueSignal','runRevenueSignalSourceScan','runAllRevenueSignalScans','updateRevenueSignalStatus','createRevenueSignalContext','persistRevenueSignalValidation','updateRevenueSignalValidationStatus','updateRevenueSignalSourceStatus'])check(repository.includes(`function ${fn}`),`Repository function: ${fn}`)
check(repository.includes('revenue_os_signal_raw_events'),'Raw event persistence implemented')
check(repository.includes('revenue_os_signals'),'Normalized signal persistence implemented')
check(repository.includes('revenue_os_business_events')&&repository.includes('revenue_os_event_outbox'),'Foundation event/outbox bridge implemented')
check(repository.includes('duplicate:true'),'Duplicate outcome explicit')
check(repository.includes('shadowOnly:true'),'Shadow-only metadata persisted')
check(repository.includes('noExternalModelInvoked:true'),'Context audit states no external model')
check(!repository.includes('OPENAI_API_KEY')&&!repository.includes('new OpenAI')&&!repository.includes('responses.create'),'MZ04 invokes no OpenAI model')
check(!repository.includes('send_whatsapp')&&!repository.includes('send_email'),'MZ04 cannot send external messages')
check(!repository.includes('apply_discount')&&!repository.includes('sign_contract'),'MZ04 cannot alter prices or contracts')

const actions=['ingest_event','run_source_scan','run_all_scans','update_signal_status','build_context','run_validation','update_validation_status','update_source_status']
for(const action of actions)check(api.includes(`action==='${action}'`),`API action allow-listed: ${action}`)
for(const permission of ['revenue_os.signals.manage','revenue_os.signals.ingest','revenue_os.signals.audit'])check(api.includes(permission)&&osConstants.includes(permission),`Permission wired: ${permission}`)
check(api.includes('normalizeRevenueOsError'),'Controlled API errors implemented')
check(!api.includes('send_whatsapp')&&!api.includes('send_email'),'Signal API has no external send action')

check(frame.includes('Tissu nerveux des signaux revenus'),'Premium Signal Fabric identity rendered')
check(frame.includes('Scanner les sources')&&frame.includes('Valider le tissu'),'Primary control actions rendered')
check(frame.includes('Shadow observation'),'Safe posture visible')
for(const label of ['Flux en direct','Sources & connecteurs','Santé des sources','Classification','Déduplication','Scans programmés','Snapshots de contexte','Données périmées','Abonnements','Accès & confidentialité','Validation du tissu'])check(workspace.includes(label)||constants.includes(label),`Premium workspace implemented: ${label}`)
check(workspace.includes('runSourceScan'),'Source scan UI action wired')
check(workspace.includes('updateSourceStatus'),'Source pause control wired')
check(workspace.includes('updateIssueStatus'),'Validation triage action wired')
check(drawer.includes('buildContext'),'Signal context action wired')
check(drawer.includes('acknowledged')&&drawer.includes('monitoring')&&drawer.includes('dismissed'),'Signal lifecycle controls rendered')
check(search.includes('buildRevenueSignalSearchIndex'),'Global signal search index implemented')
for(const type of ['revenue-signal','signal-source','context-snapshot'])check(search.includes(`type: '${type}'`),`Search result type: ${type}`)
check(searchApi.includes('readRevenueSignalFabric'),'Global search loads Signal Fabric')

for(const dimension of ['sourceCoverage','sourceHealth','freshness','classificationCoverage','deduplicationSafety','contextReadiness','privacySafety','scheduleReliability'])check(validation.includes(dimension),`Readiness dimension: ${dimension}`)
check(validation.includes('validateRevenueSignalFabric'),'Signal validation engine implemented')
check(validation.includes('critical')&&validation.includes('context'),'Critical signal context blocker implemented')
check(validation.includes('stale')&&validation.includes('freshness'),'Stale source validation implemented')
check(validation.includes('consecutiveFailures'),'Scan failure validation implemented')

const tables=['revenue_os_signal_sources','revenue_os_signal_source_cursors','revenue_os_signal_raw_events','revenue_os_signals','revenue_os_signal_entities','revenue_os_signal_evidence','revenue_os_signal_rules','revenue_os_signal_scheduled_scans','revenue_os_signal_scan_runs','revenue_os_signal_source_health','revenue_os_signal_deduplication_log','revenue_os_signal_context_snapshots','revenue_os_signal_context_sources','revenue_os_signal_subscriptions','revenue_os_signal_subscription_deliveries','revenue_os_signal_access_logs','revenue_os_signal_stale_checks','revenue_os_signal_webhook_receipts','revenue_os_signal_validation_issues','revenue_os_signal_snapshots']
for(const table of tables){check(migration.includes(`create table if not exists public.${table}`),`Migration table: ${table}`);check(rollback.includes(`drop table if exists public.${table}`),`Rollback table: ${table}`)}
check(tables.length===fixture.minimum.tables,'Fixture table count matches')
check(migration.includes('revenue_os_signal_prevent_raw_mutation'),'Append-only raw event guard included')
check(migration.includes('deduplication_key'),'Deduplication key indexed and stored')
check(migration.includes('enable row level security'),'RLS enabled across MZ04 tables')
check(migration.includes('revoke all on table')&&migration.includes('from anon, authenticated'),'Direct client table access revoked')
check(migration.includes('grant all on table')&&migration.includes('to service_role'),'Controlled server access granted')
check(migration.includes('on conflict'),'MZ04 seeds are idempotent')
check(migration.includes("'revenue_os.signal_fabric'"),'Signal Fabric feature flag seeded')
check(migration.includes("'revenue_os.signal_ingestion'"),'Signal ingestion feature flag seeded')
check(migration.includes("'revenue_os.signal_scheduled_scans'"),'Scheduled scans feature flag seeded')
check(migration.includes("'shadow'"),'Installation remains Shadow')
check(migration.includes("'externalActions',false"),'External actions explicitly disabled in installation metadata')
check(migration.includes("'sourceSecretsStored',false"),'No source secrets stored contract persisted')
check(!migration.toLowerCase().includes('drop table public.revenue_os_business_units'),'Migration preserves MZ02 Digital Twin')
check(!migration.toLowerCase().includes('drop table public.revenue_os_doctrines'),'Migration preserves MZ03 Doctrine')
check(!migration.toLowerCase().includes('drop table public.revenue_os_objectives'),'Migration preserves MZ01 Foundation')


check(exists('app/api/revenue-command-os/signals/cron/route.ts'), 'Scheduler route implemented')
check(exists('app/api/revenue-command-os/signals/webhook/[sourceCode]/route.ts'), 'Signed webhook route implemented')
const cronRoute = read('app/api/revenue-command-os/signals/cron/route.ts')
const webhookRoute = read('app/api/revenue-command-os/signals/webhook/[sourceCode]/route.ts')
check(cronRoute.includes('CRON_SECRET') && cronRoute.includes('REVENUE_OS_SIGNAL_SCAN_ENABLED'), 'Scheduler secret and kill switch enforced')
check(webhookRoute.includes('createHmac') && webhookRoute.includes('timingSafeEqual'), 'Webhook HMAC signature verification enforced')
check(webhookRoute.includes('5 * 60 * 1000'), 'Webhook replay window bounded')
check(webhookRoute.includes('revenue_os_signal_webhook_receipts'), 'Webhook receipts persisted hash-only')
check(!webhookRoute.includes('NEXT_PUBLIC_'), 'Webhook secrets remain server-only')

console.log(`\nANGELCARE Revenue Command OS Mega ZIP 4 Verification`)
console.log(`Passes: ${passes.length}`)
console.log(`Failures: ${failures.length}\n`)
for(const item of passes)console.log(`  ✓ ${item.label}${item.detail?` — ${item.detail}`:''}`)
for(const item of failures)console.error(`  ✗ ${item.label}${item.detail?` — ${item.detail}`:''}`)
if(failures.length)process.exit(1)
console.log('\nMEGA ZIP 4 STATIC ACCEPTANCE: PASS\n')
