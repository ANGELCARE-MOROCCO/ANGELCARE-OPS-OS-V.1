import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const root=process.cwd()
const failures=[]
const passes=[]
const check=(condition,label)=>condition?passes.push(label):failures.push(label)
const exists=relative=>fs.existsSync(path.join(root,relative))
const read=relative=>fs.readFileSync(path.join(root,relative),"utf8")

const rebuiltRoutes=[
  ["app/(protected)/revenue-command-center/b2c-workflow/page.tsx","b2c-command"],
  ["app/(protected)/revenue-command-center/b2c-workflow/[id]/page.tsx","family-dossier"],
  ["app/(protected)/revenue-command-center/b2c-workflow/[id]/care-start/page.tsx","family-care-start-dossier"],
  ["app/(protected)/revenue-command-center/b2c-workflow/[id]/consultation/page.tsx","family-consultation-dossier"],
  ["app/(protected)/revenue-command-center/b2c-workflow/[id]/intake/page.tsx","family-intake-dossier"],
  ["app/(protected)/revenue-command-center/b2c-workflow/[id]/matching/page.tsx","family-matching-dossier"],
  ["app/(protected)/revenue-command-center/b2c-workflow/[id]/onboarding/page.tsx","family-onboarding-dossier"],
  ["app/(protected)/revenue-command-center/b2c-workflow/[id]/qualification/page.tsx","family-qualification-dossier"],
  ["app/(protected)/revenue-command-center/b2c-workflow/[id]/recovery/page.tsx","family-recovery-dossier"],
  ["app/(protected)/revenue-command-center/b2c-workflow/active-clients/page.tsx","active-families-command"],
  ["app/(protected)/revenue-command-center/b2c-workflow/analytics/page.tsx","b2c-analytics-command"],
  ["app/(protected)/revenue-command-center/b2c-workflow/care-start/page.tsx","care-start-command"],
  ["app/(protected)/revenue-command-center/b2c-workflow/consultation/page.tsx","consultation-command"],
  ["app/(protected)/revenue-command-center/b2c-workflow/executive/page.tsx","b2c-executive-command"],
  ["app/(protected)/revenue-command-center/b2c-workflow/high-value/page.tsx","high-value-family-command"],
  ["app/(protected)/revenue-command-center/b2c-workflow/intake/page.tsx","intake-command"],
  ["app/(protected)/revenue-command-center/b2c-workflow/matching/page.tsx","matching-command"],
  ["app/(protected)/revenue-command-center/b2c-workflow/new/page.tsx","create-family-studio"],
  ["app/(protected)/revenue-command-center/b2c-workflow/onboarding/page.tsx","onboarding-command"],
  ["app/(protected)/revenue-command-center/b2c-workflow/pipeline/page.tsx","b2c-pipeline-command"],
  ["app/(protected)/revenue-command-center/b2c-workflow/qualification/page.tsx","qualification-command"],
  ["app/(protected)/revenue-command-center/b2c-workflow/recovery/page.tsx","recovery-command"],
  ["app/(protected)/revenue-command-center/b2c-workflow/retention/page.tsx","retention-command"],
  ["app/(protected)/revenue-command-center/b2c-workflow/risk/page.tsx","b2c-risk-command"],
]
const preserved=[
  ["app/(protected)/revenue-command-center/b2c-workflow/quote/page.tsx","RevenueProposalWorkspace"],
  ["app/(protected)/revenue-command-center/b2c-workflow/[id]/quote/page.tsx","RevenueProposalWorkspace"],
]
const files=[
  "components/revenue-command-center/b2c-enterprise/RevenueB2CWorkspace.tsx",
  "components/revenue-command-center/b2c-enterprise/RevenueB2CWorkspace.module.css",
  "components/revenue-command-center/b2c-enterprise/route-contracts.ts",
  "components/revenue-command-center/b2c-enterprise/types.ts",
  "components/revenue-command-center/b2c-enterprise/useB2CPortfolio.ts",
  "lib/revenue-command-center/b2c-enterprise/server.ts",
  "tsconfig.revenue-command-center-b2c-phase9.json",
]
const apiRoutes=[
  "portfolio","cases","cases/[id]","transition","guardians","beneficiaries","emergency-contacts","instructions",
  "requirements","needs-assessments","consultations","recommendations","matching/cycles","matching/candidates",
  "matching/decision","onboarding/plans","onboarding/items","activation/evaluate","activation/authorize","handoff",
  "care-start","satisfaction","complaints","retention/risks","retention/plans","recovery/plans","recovery/checkpoints",
  "renewal","closure","evidence",
]
const tables=[
  "revenue_b2c_guardians","revenue_b2c_beneficiaries","revenue_b2c_emergency_contacts",
  "revenue_b2c_family_instructions","revenue_b2c_service_requirements","revenue_b2c_needs_assessments",
  "revenue_b2c_consultations","revenue_b2c_service_recommendations","revenue_b2c_matching_cycles",
  "revenue_b2c_matching_candidates","revenue_b2c_matching_decisions","revenue_b2c_onboarding_plans",
  "revenue_b2c_onboarding_items","revenue_b2c_activation_gates","revenue_b2c_care_starts",
  "revenue_b2c_satisfaction_checks","revenue_b2c_complaints","revenue_b2c_retention_risks",
  "revenue_b2c_retention_plans","revenue_b2c_recovery_plans","revenue_b2c_recovery_checkpoints",
  "revenue_b2c_status_history","revenue_b2c_evidence","revenue_b2c_closures",
]
const views=["revenue_b2c_command_view","revenue_b2c_matching_command_view","revenue_b2c_retention_command_view"]
const functions=["revenue_evaluate_b2c_activation","revenue_authorize_b2c_activation","revenue_accept_b2c_match"]
const actions=[
  "create-family","edit-family","transition-case","add-guardian","add-beneficiary","add-emergency-contact",
  "add-family-instruction","add-service-requirement","update-service-requirement","create-needs-assessment",
  "complete-needs-assessment","schedule-consultation","record-consultation","create-recommendation",
  "approve-recommendation","create-matching-cycle","add-match-candidate","verify-availability","reject-candidate",
  "present-match","accept-match","reject-match","rematch","create-onboarding","add-onboarding-item",
  "complete-onboarding-item","evaluate-activation","approve-activation","create-operational-handoff",
  "accept-operational-handoff","authorize-care-start","record-care-start","record-satisfaction","record-feedback",
  "create-complaint","contain-complaint","close-complaint","create-retention-risk","launch-retention-plan",
  "close-retention-plan","create-recovery-plan","add-recovery-checkpoint","complete-recovery-checkpoint",
  "create-extension","launch-renewal-quote","launch-upsell-quote","link-contract","link-payment",
  "record-cancellation","close-case","record-evidence","timeline-viewer","audit-viewer",
]
const sql={
  migration:"supabase/migrations/20260725_0700_revenue_b2c_family_matching_retention_completion.sql",
  preflight:"supabase/revenue-command-center/preflight/20260725_b2c_family_matching_retention_live_schema_preflight.sql",
  rollback:"supabase/revenue-command-center/rollback/20260725_revenue_b2c_family_enterprise_phase9_rollback.sql",
  rls:"supabase/revenue-command-center/verification/20260725_b2c_family_matching_retention_rls_verification.sql",
  matching:"supabase/revenue-command-center/verification/20260725_b2c_matching_integrity_verification.sql",
  retention:"supabase/revenue-command-center/verification/20260725_b2c_retention_recovery_verification.sql",
}

for(const file of files)check(exists(file),`phase 9 required file exists: ${file}`)
for(const [file,experience] of rebuiltRoutes){
  check(exists(file),`B2C route exists: ${file}`)
  if(!exists(file))continue
  const source=read(file)
  check(source.includes("RevenueB2CWorkspace"),`route uses B2C enterprise workspace: ${file}`)
  check(source.includes(`experience="${experience}"`),`route experience is ${experience}: ${file}`)
  check(!source.includes("RevenueB2CWorkflowV12MegaWorkspace"),`retired generic B2C workspace removed: ${file}`)
}
for(const [file,workspace] of preserved){
  check(exists(file),`specialized B2C quote route exists: ${file}`)
  if(exists(file))check(read(file).includes(workspace),`quote route preserves authoritative ${workspace}: ${file}`)
}
const routeRoot=path.join(root,"app","(protected)","revenue-command-center")
function walk(dir,predicate,found=[]){if(!fs.existsSync(dir))return found;for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const absolute=path.join(dir,entry.name);entry.isDirectory()?walk(absolute,predicate,found):predicate(absolute)&&found.push(absolute)}return found}
const pages=walk(routeRoot,file=>file.endsWith(`${path.sep}page.tsx`))
check(pages.length===151,`full Revenue route estate remains 151 (found ${pages.length})`)
const b2cPages=pages.filter(file=>file.includes(`${path.sep}b2c-workflow${path.sep}`)||file.endsWith(`${path.sep}b2c-workflow${path.sep}page.tsx`))
check(b2cPages.length===26,`B2C route estate remains 26 (found ${b2cPages.length})`)
const newCount=b2cPages.filter(file=>read(path.relative(root,file)).includes("RevenueB2CWorkspace")).length
check(newCount===24,`twenty-four B2C routes individually rebuilt (found ${newCount})`)
check(newCount+preserved.length===26,"all 26 B2C routes are rebuilt or preserved specialized experiences")

const workspace=read(files[0]),css=read(files[1]),contracts=read(files[2]),types=read(files[3]),hook=read(files[4]),server=read(files[5])
for(const [,experience] of rebuiltRoutes){
  check(types.includes(`"${experience}"`),`experience type exists: ${experience}`)
  check(contracts.includes(`"${experience}"`),`route contract exists: ${experience}`)
  check(workspace.includes(experience),`workspace renders experience: ${experience}`)
}
for(const action of actions){
  check(types.includes(`"${action}"`),`governed action type exists: ${action}`)
  check(workspace.includes(`"${action}"`),`governed action implemented: ${action}`)
}
check(actions.length===53,`53 governed B2C experiences represented (found ${actions.length})`)
for(const marker of ["Command","Dossier","Studio","QueueCommand","Analytics","PortfolioTable","Lifecycle","ActionModal"]){
  check(workspace.includes(marker),`purpose-built B2C composition exists: ${marker}`)
}
check(workspace.includes('Intl.NumberFormat("fr-FR"'),"French corporate number formatting is used")
check(workspace.includes('.replace("MAD","Dh")'),"currency is presented as Dh")
check(workspace.includes('role="dialog"')&&workspace.includes('aria-modal="true"'),"enterprise dialog semantics are present")
check(workspace.includes('document.body.style.overflow="hidden"'),"dialog scroll protection is present")
check((workspace.includes('event.key==="Tab"')||workspace.includes('event.key!=="Tab"'))&&workspace.includes('event.key==="Escape"'),"dialog keyboard and focus controls are present")
check(workspace.includes("Phase 7")&&workspace.includes("CareLink"),"authoritative contract and caregiver boundaries are visible")
check(workspace.includes("Données famille minimisées"),"sensitive family-data boundary is visible")
check(css.includes(".shell")&&css.includes(".studio")&&css.includes(".matchGrid")&&css.includes(".gateBoard"),"premium full-width B2C visual system exists")
check(!/(^|,)\s*(button|a|input|select|textarea)\s*:/m.test(css),"no obvious bare-element CSS Module selector branch exists")
check(hook.includes("cache:\"no-store\""),"portfolio data is not served from a stale browser cache")
check(server.includes("requireRevenueApiAccess"),"server helper enforces Revenue API access")
check(server.includes("SUPABASE_SERVICE_ROLE_KEY"),"service role is used only after user authorization")
check(server.includes("prospect_text_id"),"legacy TEXT prospect identity is preserved")
check(server.includes("optionalRows"),"schema-aware optional reads are implemented")

for(const api of apiRoutes){
  const file=`app/api/revenue-command-center/b2c-enterprise/${api}/route.ts`
  check(exists(file),`protected B2C API exists: ${api}`)
  if(!exists(file))continue
  const source=read(file)
  check(source.includes("b2cContext("),`API resolves protected B2C context: ${api}`)
  check(source.includes("revenueAccessFailure"),`API returns controlled access errors: ${api}`)
}
check(apiRoutes.length===30,`30 protected B2C API routes represented (found ${apiRoutes.length})`)

for(const file of Object.values(sql))check(exists(file),`Phase 9 SQL artifact exists: ${file}`)
const migration=read(sql.migration),preflight=read(sql.preflight),rollback=read(sql.rollback),rls=read(sql.rls)
for(const table of tables){
  check(migration.includes(table),`migration represents table: ${table}`)
  check(rollback.includes(table),`rollback represents table: ${table}`)
  check(rls.includes(table),`RLS verification represents table: ${table}`)
}
check(tables.length===24,`24 B2C support tables represented (found ${tables.length})`)
for(const view of views){check(migration.includes(view),`migration creates view: ${view}`);check(rls.includes(view),`verification checks view: ${view}`)}
for(const fn of functions){check(migration.includes(fn),`migration creates atomic command: ${fn}`);check(rls.includes(fn),`verification checks atomic command: ${fn}`)}
check(migration.includes("revenue_prospects.id")||preflight.includes("revenue_prospects"),"legacy prospect contract is preflighted")
check(preflight.includes("prospect_id_type='text'")||preflight.includes("data_type='text'"),"preflight requires TEXT prospect identity")
check(preflight.includes("CUTOVER_GATE")&&preflight.includes("READY")&&preflight.includes("BLOCKED"),"preflight has explicit cutover gate")
check(migration.includes("security definer"),"critical atomic commands are security definer")
check(migration.includes("revoke all on function")&&migration.includes("to service_role"),"atomic commands are server-only")
check(migration.includes("revoke insert,update,delete")&&migration.includes("enable row level security"),"support tables are read-only to authenticated browser roles")
check(migration.includes("availability_status<>'verified'"),"matching acceptance blocks unverified availability")
check(migration.includes("revenue_payment_confirmations"),"activation evaluates authoritative Finance confirmation")
check(migration.includes("revenue_operational_handoffs"),"activation evaluates authoritative operational handoff")
check(rollback.includes("ROLLBACK BLOCKED"),"rollback protects operational data")
check(read(sql.matching).includes("ACCEPTED_WITHOUT_VERIFIED_AVAILABILITY"),"matching verification checks availability integrity")
check(read(sql.retention).includes("RECOVERY_WITHOUT_PLAN"),"retention verification checks recovery integrity")

const packageJson=JSON.parse(read("package.json"))
check(packageJson.scripts?.["revenue-command-center:phase9:release"]==="node scripts/release-revenue-command-center-b2c-phase9.mjs","package exposes mandatory Phase 9 release gate")
check(exists("scripts/release-revenue-command-center-b2c-phase9.mjs"),"Phase 9 production release script exists")

if(failures.length){
  console.error(`\n${failures.length} Phase 9 check(s) failed:`)
  failures.forEach(item=>console.error(`FAIL  ${item}`))
  console.error(`\n${passes.length} check(s) passed before failure.`)
  process.exit(1)
}
passes.forEach(item=>console.log(`PASS  ${item}`))
console.log(`\n${passes.length} checks passed. B2C Family Enterprise Phase 9 is statically accepted.`)
