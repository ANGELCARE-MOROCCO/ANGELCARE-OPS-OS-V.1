import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const root=process.cwd()
const failures=[]
const passes=[]
const check=(condition,label)=>condition?passes.push(label):failures.push(label)
const exists=(relative)=>fs.existsSync(path.join(root,relative))
const read=(relative)=>fs.readFileSync(path.join(root,relative),"utf8")

const rebuiltRoutes=[
  ["app/(protected)/revenue-command-center/partnerships/page.tsx","partnership-command"],
  ["app/(protected)/revenue-command-center/partnerships/[id]/page.tsx","partner-dossier"],
  ["app/(protected)/revenue-command-center/partnerships/[id]/decision-map/page.tsx","partner-decision-map"],
  ["app/(protected)/revenue-command-center/partnerships/[id]/qualification/page.tsx","partner-qualification-dossier"],
  ["app/(protected)/revenue-command-center/partnerships/[id]/recovery/page.tsx","partner-recovery-dossier"],
  ["app/(protected)/revenue-command-center/partnerships/[id]/referrals/page.tsx","partner-referrals-dossier"],
  ["app/(protected)/revenue-command-center/partnerships/decision-map/page.tsx","decision-map-command"],
  ["app/(protected)/revenue-command-center/partnerships/executive/page.tsx","executive-command"],
  ["app/(protected)/revenue-command-center/partnerships/growth/page.tsx","growth-command"],
  ["app/(protected)/revenue-command-center/partnerships/high-value/page.tsx","high-value-command"],
  ["app/(protected)/revenue-command-center/partnerships/meetings/page.tsx","meetings-command"],
  ["app/(protected)/revenue-command-center/partnerships/new/page.tsx","create-partnership"],
  ["app/(protected)/revenue-command-center/partnerships/performance/page.tsx","performance-command"],
  ["app/(protected)/revenue-command-center/partnerships/pipeline/page.tsx","pipeline-command"],
  ["app/(protected)/revenue-command-center/partnerships/qualification/page.tsx","qualification-command"],
  ["app/(protected)/revenue-command-center/partnerships/recovery/page.tsx","recovery-command"],
  ["app/(protected)/revenue-command-center/partnerships/referrals/page.tsx","referral-command"],
  ["app/(protected)/revenue-command-center/partnerships/risk/page.tsx","risk-command"],
]
const preservedSpecializedRoutes=[
  ["app/(protected)/revenue-command-center/partnerships/proposals/page.tsx","RevenueProposalWorkspace"],
  ["app/(protected)/revenue-command-center/partnerships/[id]/proposal/page.tsx","RevenueProposalWorkspace"],
  ["app/(protected)/revenue-command-center/partnerships/agreements/page.tsx","RevenueContractWorkspace"],
  ["app/(protected)/revenue-command-center/partnerships/[id]/agreement/page.tsx","RevenueContractWorkspace"],
  ["app/(protected)/revenue-command-center/partnerships/activation/page.tsx","RevenueContractWorkspace"],
  ["app/(protected)/revenue-command-center/partnerships/[id]/activation/page.tsx","RevenueContractWorkspace"],
]
const componentFiles=[
  "components/revenue-command-center/partnership-enterprise/RevenuePartnershipWorkspace.tsx",
  "components/revenue-command-center/partnership-enterprise/RevenuePartnershipWorkspace.module.css",
  "components/revenue-command-center/partnership-enterprise/route-contracts.ts",
  "components/revenue-command-center/partnership-enterprise/types.ts",
  "components/revenue-command-center/partnership-enterprise/usePartnershipPortfolio.ts",
  "lib/revenue-command-center/partnership-enterprise/server.ts",
  "tsconfig.revenue-command-center-partnership-phase8.json",
]
const apiRoutes=[
  "portfolio","partnerships","partnerships/[id]","transition","qualification","stakeholders","programs","benefits","obligations","milestones",
  "activation/evaluate","referrals","referrals/[id]","referrals/accept","referrals/attribution","referrals/conflicts",
  "performance/periods","performance/close","reviews","recovery","renewal","expansion","risks","closure",
]
const tables=[
  "revenue_partnership_stakeholders","revenue_partnership_qualifications","revenue_partner_programs",
  "revenue_partner_program_locations","revenue_partner_program_service_lines","revenue_partner_benefits",
  "revenue_partner_benefit_usage","revenue_partnership_obligations","revenue_partnership_milestones",
  "revenue_partner_activation_plans","revenue_partner_activation_gates","revenue_partner_referrals",
  "revenue_partner_referral_status_history","revenue_partner_referral_attributions","revenue_partner_attribution_conflicts",
  "revenue_partner_performance_periods","revenue_partner_performance_metrics","revenue_partner_scorecards",
  "revenue_partner_reviews","revenue_partner_recovery_plans","revenue_partner_recovery_checkpoints",
  "revenue_partner_renewal_readiness","revenue_partner_expansions","revenue_partnership_status_history",
  "revenue_partnership_risks","revenue_partnership_closures",
]
const views=["revenue_partnership_command_view","revenue_partner_referral_command_view","revenue_partner_performance_command_view"]
const functions=["revenue_accept_partner_referral","revenue_create_partner_attribution","revenue_close_partner_performance_period","revenue_evaluate_partner_activation","revenue_launch_partner_renewal_workflow"]
const actionKinds=[
  "create-partnership","edit-partnership","classify-partner","complete-qualification","disqualify-partner",
  "add-stakeholder","edit-stakeholder","create-decision-map","create-opportunity","define-model","create-program",
  "add-program-location","add-program-service","define-partner-benefit","define-angelcare-benefit","approve-benefit",
  "record-benefit-usage","define-obligation","complete-obligation","record-obligation-breach","add-milestone",
  "complete-milestone","create-activation-plan","add-activation-gate","evaluate-activation","approve-launch",
  "register-referral","review-duplicate-referral","accept-referral","reject-referral","link-existing-prospect",
  "convert-referral","link-opportunity","create-attribution","raise-attribution-conflict","resolve-attribution-conflict",
  "override-attribution","create-performance-period","set-targets","record-performance-result","complete-partner-review",
  "create-corrective-action","launch-recovery-plan","complete-recovery-checkpoint","prepare-renewal","approve-renewal",
  "launch-renewal-proposal","launch-renewal-negotiation","create-expansion-assessment","approve-expansion",
  "suspend-partnership","terminate-partnership","close-partnership","evidence-viewer","referral-history",
  "attribution-history","performance-history","partner-audit",
]
const sqlFiles={
  migration:"supabase/migrations/20260725_0600_revenue_partnership_referral_performance_completion.sql",
  preflight:"supabase/revenue-command-center/preflight/20260725_partnership_referral_performance_live_schema_preflight.sql",
  rollback:"supabase/revenue-command-center/rollback/20260725_revenue_partnership_enterprise_phase8_rollback.sql",
  rls:"supabase/revenue-command-center/verification/20260725_partnership_referral_performance_rls_verification.sql",
  attribution:"supabase/revenue-command-center/verification/20260725_partnership_referral_attribution_verification.sql",
  performance:"supabase/revenue-command-center/verification/20260725_partnership_performance_calculation_verification.sql",
}

for(const file of componentFiles)check(exists(file),`phase 8 required file exists: ${file}`)
for(const [file,experience] of rebuiltRoutes){
  check(exists(file),`partnership route exists: ${file}`)
  if(!exists(file))continue
  const source=read(file)
  check(source.includes("RevenuePartnershipWorkspace"),`route uses partnership enterprise workspace: ${file}`)
  check(source.includes(`experience="${experience}"`),`route experience is ${experience}: ${file}`)
  check(!source.includes("RevenuePartnershipsEnterpriseWorkspace")&&!source.includes("RevenuePartnershipsV13ActionsWorkspace")&&!source.includes("RevenuePartnershipsEnterprisePage"),`retired partnership workspace removed: ${file}`)
}
for(const [file,workspace] of preservedSpecializedRoutes){
  check(exists(file),`specialized partnership route exists: ${file}`)
  if(exists(file))check(read(file).includes(workspace),`specialized route keeps authoritative ${workspace}: ${file}`)
}

const routeRoot=path.join(root,"app","(protected)","revenue-command-center")
function walk(dir,predicate,found=[]){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const absolute=path.join(dir,entry.name);if(entry.isDirectory())walk(absolute,predicate,found);else if(predicate(absolute))found.push(absolute)}return found}
const pages=walk(routeRoot,(file)=>file.endsWith(`${path.sep}page.tsx`))
check(pages.length===151,`full Revenue route estate remains 151 (found ${pages.length})`)
const partnershipPages=pages.filter((file)=>file.includes(`${path.sep}partnerships${path.sep}`)||file.endsWith(`${path.sep}partnerships${path.sep}page.tsx`))
check(partnershipPages.length===24,`partnership route estate remains 24 (found ${partnershipPages.length})`)
const newWorkspaceCount=partnershipPages.filter(file=>fs.readFileSync(file,"utf8").includes("RevenuePartnershipWorkspace")).length
check(newWorkspaceCount===18,`eighteen partnership routes newly rebuilt (found ${newWorkspaceCount})`)
check(newWorkspaceCount+preservedSpecializedRoutes.length===24,"all 24 partnership routes are purpose-built or preserved specialized experiences")

const workspace=read(componentFiles[0])
const css=read(componentFiles[1])
const routeDefinitions=read(componentFiles[2])
const types=read(componentFiles[3])
const hook=read(componentFiles[4])
const server=read(componentFiles[5])
for(const [,experience] of rebuiltRoutes){
  check(types.includes(`"${experience}"`),`experience type exists: ${experience}`)
  check(routeDefinitions.includes(`"${experience}"`),`route contract exists: ${experience}`)
  check(workspace.includes(experience),`workspace renders experience: ${experience}`)
}
for(const action of actionKinds){
  check(types.includes(`"${action}"`),`governed action type exists: ${action}`)
  check(workspace.includes(`"${action}"`),`governed action is implemented: ${action}`)
}
check(actionKinds.length===58,`58 governed partnership experiences represented (found ${actionKinds.length})`)
for(const marker of ["ReferralCards","StakeholderCards","QualificationMatrix","PerformanceCommand","RiskCommand","GrowthCommand","ExecutiveCommand","CreateStudio","PortfolioTable","Lifecycle"]){
  check(workspace.includes(marker),`purpose-built workspace composition exists: ${marker}`)
}
check(workspace.includes('Intl.NumberFormat("fr-FR"'),"French corporate number formatting is used")
check(workspace.includes('.replace("MAD","Dh")'),"currency is presented as Dh")
check(workspace.includes('role="dialog"')&&workspace.includes('aria-modal="true"'),"enterprise dialog semantics are present")
check(workspace.includes('document.body.style.overflow="hidden"'),"dialog scroll protection is present")
check(workspace.includes('event.key==="Tab"')&&workspace.includes('event.key==="Escape"'),"dialog keyboard focus and Escape controls are present")
check(workspace.includes("revenue_realized"),"UI distinguishes realized revenue attribution")
check(workspace.includes("Contract Control Plane")||workspace.includes("Contract"),"contract ownership boundary is visible")
check(workspace.includes("Aucune attribution finale")||workspace.includes("Attribution uniquement"),"attribution conflict boundary is explicit")

for(const api of apiRoutes){
  const file=`app/api/revenue-command-center/partnership/${api}/route.ts`
  check(exists(file),`protected partnership API exists: ${api}`)
  if(!exists(file))continue
  const source=read(file)
  check(source.includes("partnershipContext("),`API resolves protected partnership context: ${api}`)
  check(source.includes("revenueAccessFailure"),`API returns controlled access errors: ${api}`)
}
check(apiRoutes.length===24,`24 protected partnership API routes represented (found ${apiRoutes.length})`)
check(server.includes("requireRevenueApiAccess"),"server helper enforces Revenue API access")
check(server.includes("SUPABASE_SERVICE_ROLE_KEY"),"server commands support service-role execution after user authorization")
check(server.includes("normalizePartnershipPayload"),"partnership normalization exists")
check(server.includes("normalizeReferralPayload"),"referral normalization exists")
check(server.includes("recordPartnershipEvent"),"partnership audit event helper exists")
check(server.includes("public.revenue_prospects.id")===false,"server helper does not attempt identifier conversion")
check(server.includes("prospect_text_id"),"partnership server uses the production-safe TEXT prospect bridge")
check(!server.includes("alter column id type uuid"),"partnership server never requests identifier conversion")
const referralApi=read("app/api/revenue-command-center/partnership/referrals/route.ts")
const attributionApi=read("app/api/revenue-command-center/partnership/referrals/attribution/route.ts")
check(referralApi.includes("existingProspect")&&referralApi.includes("pre_existing_prospect"),"referral intake detects pre-existing canonical prospects")
check(!referralApi.includes('.or([row.normalized_email'),"referral duplicate detection avoids unsafe empty OR filters")
check(attributionApi.includes("evidenceReference")&&attributionApi.includes("EVENT_TYPES"),"attribution API validates evidence and allowed commercial events")
const renewalApi=read("app/api/revenue-command-center/partnership/renewal/route.ts")
const performanceCloseApi=read("app/api/revenue-command-center/partnership/performance/close/route.ts")
check(workspace.includes('/api/revenue-command-center/opportunities'),"partnership opportunity action uses the canonical opportunity API")
check(!workspace.includes('/api/revenue-command-center/prospects/opportunities'),"obsolete prospect opportunity endpoint is absent")
check(workspace.includes('normalizedForm')&&workspace.includes('field.options?.[0]?.[0]')&&workspace.includes('normalizedForm[field.key]=field.options[0][0]'),"static select defaults are included in submitted commands")
check(workspace.includes('DYNAMIC_FIELD_SOURCES')&&workspace.includes('rows.map(row=><option value={row.id}'),"internal entity identifiers are selected from governed live options")
check(read("app/api/revenue-command-center/partnership/benefits/route.ts").includes('Une preuve est obligatoire pour tout usage financier'),"financial benefit usage requires evidence")
check(read("app/api/revenue-command-center/partnership/obligations/route.ts").includes('Une preuve est obligatoire pour compléter l’obligation'),"obligation completion requires evidence")
check(read("app/api/revenue-command-center/partnership/milestones/route.ts").includes('Une preuve est obligatoire pour compléter le milestone'),"milestone completion requires evidence")
check(performanceCloseApi.includes('revenue_close_partner_performance_period')&&performanceCloseApi.includes('p_commitments'),"partner review closure uses the atomic performance command")
check(renewalApi.includes('revenue_launch_partner_renewal_workflow')&&renewalApi.includes('launch_proposal')&&renewalApi.includes('launch_negotiation'),"renewal launches canonical proposal and negotiation workflows")

for(const file of Object.values(sqlFiles))check(exists(file),`phase 8 SQL asset exists: ${file}`)
const migration=read(sqlFiles.migration),preflight=read(sqlFiles.preflight),rollback=read(sqlFiles.rollback),rls=read(sqlFiles.rls),attribution=read(sqlFiles.attribution),performance=read(sqlFiles.performance)
check(migration.trimStart().startsWith("begin;")&&migration.trimEnd().endsWith("commit;"),"migration is transactional")
check(migration.includes("public.revenue_prospects.id must remain TEXT"),"migration preserves live TEXT prospect identity")
check(!migration.includes("alter column id type uuid"),"migration never converts legacy prospect IDs")
check(migration.includes("public.revenue_contracts")&&migration.includes("public.revenue_realization_events"),"Phase 7 contract and realization foundations are required")
check(migration.includes("account_label_expression"),"live account naming compatibility is dynamic")
check(migration.includes("prospect_text_id")&&migration.includes("additive_text_bridge")===false,"migration creates a non-destructive TEXT prospect bridge")
check(migration.includes("revenue_tasks.partnership_id must be TEXT")&&migration.includes("revenue_appointments.partnership_id must be TEXT")&&migration.includes("revenue_contracts.partnership_id must be TEXT"),"migration preflight reconciles cross-module partnership identifiers")
check(migration.includes("period.partnership_id::text"),"performance calculations cast UUID partner identity to legacy TEXT cross-module links")
check(migration.includes("where partnership_id=period.partnership_id and created_at::date<=period.period_end"),"Phase 8 obligations use the canonical UUID partnership identity directly")
check(migration.includes("total>0 and total=passed")&&migration.includes("Les gates obligatoires ne sont pas satisfaits."),"activation cannot pass without at least one configured gate")
check(migration.includes("revenue_proposals")&&migration.includes("revenue_negotiations")&&migration.includes("revenue_launch_partner_renewal_workflow"),"renewal command reuses canonical Proposal and Negotiation systems")
check(migration.includes("proposal_id uuid references public.revenue_proposals")&&migration.includes("negotiation_id uuid references public.revenue_negotiations"),"renewal readiness stores canonical proposal and negotiation references")
check(migration.includes("partnership_columns")&&migration.includes("column_name not in ('entity_name'"),"partnership command view prevents duplicate computed column names")
check(migration.includes("revenue_partner_referrals_email_idx")&&migration.includes("revenue_partner_referrals_phone_idx"),"referral duplicate detection indexes exist")
check(migration.includes("source_evidence")&&migration.includes("evidence_reference"),"referral source and attribution evidence are persisted")
check(migration.includes("sum(attribution_share)")&&migration.includes("exceeds 100"),"attribution cannot exceed 100 percent")
check(migration.includes("status in ('realized','partially_realized')"),"realized attribution validates authoritative realization state")
check(migration.includes("c.partnership_id=referral.partnership_id::text")&&migration.includes("c.prospect_id=referral.linked_prospect_id")&&migration.includes("c.opportunity_id=referral.linked_opportunity_id"),"realized attribution validates commercial lineage to the referral")
check(migration.includes("revenue_partner_realization_reversal_trigger")&&migration.includes("status='reversed'"),"Finance realization reversals invalidate partner attribution")
check(migration.includes("existing_attribution_id")&&migration.includes("return query select existing_attribution_id"),"attribution command is idempotent for an existing referral event")
check(migration.includes("metadata->>'partner_referral_id'")&&migration.includes("generated_task_id is null"),"referral acceptance prevents duplicate follow-up tasks")
check(migration.includes("pre_existing_prospect")&&migration.includes("duplicate_review"),"atomic referral conversion protects existing prospects")
check(migration.includes("p_convert_to_prospect")&&migration.includes("revenue_prospects"),"controlled referral-to-prospect conversion exists")
check(migration.includes("for update"),"critical atomic commands lock authoritative rows")
check(migration.includes("security definer"),"atomic commands use controlled security-definer execution")
check(migration.includes("revoke insert,update,delete")&&migration.includes("grant select"),"browser roles remain read-only on support tables")
check(migration.includes("to service_role"),"mutating command authority is restricted to service role")
for(const table of tables){
  check(migration.includes(`create table if not exists public.${table}`),`additive table represented: ${table}`)
  check(rollback.includes(`drop table if exists public.${table}`),`rollback covers table: ${table}`)
  check(rls.includes(table),`RLS verification covers table: ${table}`)
}
for(const view of views){
  check(migration.includes(`view public.${view}`),`enterprise read model represented: ${view}`)
  check(rollback.includes(`drop view if exists public.${view}`),`rollback covers view: ${view}`)
}
for(const fn of functions){
  check(migration.includes(`function public.${fn}`),`atomic command represented: ${fn}`)
  check(migration.includes(`revoke all on function public.${fn}`),`browser execution revoked: ${fn}`)
  check(migration.includes(`grant execute on function public.${fn}`),`service execution granted: ${fn}`)
  check(rollback.includes(`drop function if exists public.${fn}`),`rollback covers command: ${fn}`)
}
check(preflight.includes("CUTOVER_GATE")&&preflight.includes("READY")&&preflight.includes("BLOCKED"),"preflight has explicit production cutover gate")
check(preflight.includes("BLOCKED_PARTIAL_INSTALL"),"partial Phase 8 installation is blocked")
check(preflight.includes("prospect_id_contract")&&preflight.includes("text"),"preflight preserves TEXT prospect contract")
check(preflight.includes("READY_FOR_TEXT_BRIDGE")&&preflight.includes("cross_module_partnership_links"),"preflight explicitly reports legacy relationship bridge compatibility")
check(preflight.includes("revenue_tasks.partnership_id")&&preflight.includes("revenue_contracts.partnership_id"),"preflight validates cross-module link types before cutover")
check(rollback.includes("trg_revenue_partner_realization_reversal")&&rollback.includes("revenue_partner_realization_reversal_trigger"),"rollback removes realization reversal synchronization")
check(attribution.includes("PROSPECT_ATTRIBUTION_WITHOUT_EVENT"),"attribution verification validates prospect events")
check(attribution.includes("OPPORTUNITY_ATTRIBUTION_WITHOUT_EVENT"),"attribution verification validates opportunity events")
check(attribution.includes("MEETING_ATTRIBUTION_WITHOUT_EVENT"),"attribution verification validates completed meetings")
check(attribution.includes("PROPOSAL_ATTRIBUTION_WITHOUT_EVENT"),"attribution verification validates proposals")
check(attribution.includes("CONTRACT_ATTRIBUTION_WITHOUT_EVENT"),"attribution verification validates signed contracts")
check(attribution.includes("PAYMENT_ATTRIBUTION_WITHOUT_EVENT"),"attribution verification validates confirmed payments")
check(attribution.includes("REALIZED_ATTRIBUTION_WITHOUT_REALIZATION_EVENT"),"attribution verification validates realization lineage")
check(attribution.includes("sum(attribution_share)>100"),"attribution verification catches over-allocation")
check(performance.includes("CLOSED_PERIOD_WITHOUT_SCORECARD"),"performance verification catches missing scorecards")
check(performance.includes("SCORE_OUT_OF_RANGE"),"performance verification checks score boundaries")
check(performance.includes("APPROVED_RENEWAL_WITHOUT_CANONICAL_WORKFLOW"),"performance verification validates renewal workflow linkage")
check(exists("scripts/release-revenue-command-center-partnership-phase8.mjs"),"mandatory production release gate exists")
if(exists("scripts/release-revenue-command-center-partnership-phase8.mjs")){
  const releaseGate=read("scripts/release-revenue-command-center-partnership-phase8.mjs")
  check(releaseGate.includes("npm run build"),"release gate invokes the exact Next.js production build")
  check(releaseGate.includes("verify-revenue-command-center-partnership-enterprise-phase8.mjs"),"release gate includes Phase 8 static acceptance")
  check(releaseGate.includes("tsconfig.revenue-command-center-partnership-phase8.json"),"release gate includes focused Phase 8 TypeScript")
  check(releaseGate.includes("CSS Module selector purity"),"release gate scans CSS Module selector purity before build")
}
check(rollback.trimStart().startsWith("-- Controlled rollback")&&rollback.trimEnd().endsWith("commit;"),"rollback is explicit and transactional")

const tsconfig=JSON.parse(read("tsconfig.revenue-command-center-partnership-phase8.json"))
check(tsconfig.compilerOptions?.noEmit===true,"focused TypeScript gate is no-emit")
check(tsconfig.include.some(value=>value.includes("partnership-enterprise")),"focused TypeScript gate includes partnership enterprise source")
check(tsconfig.include.some(value=>value.includes("app/api/revenue-command-center/partnership")),"focused TypeScript gate includes partnership APIs")

function selectorBranches(source){
  const withoutComments=source.replace(/\/\*[\s\S]*?\*\//g,"")
  const branches=[]
  for(const block of withoutComments.split("{").slice(0,-1)){
    const selector=block.slice(block.lastIndexOf("}")+1).trim()
    if(!selector||selector.startsWith("@")||selector.startsWith("from")||selector.startsWith("to")||/^\d+%$/.test(selector))continue
    for(const branch of selector.split(","))branches.push(branch.trim())
  }
  return branches
}
const cssFiles=walk(path.join(root,"components","revenue-command-center"),file=>file.endsWith(".module.css"))
const impure=[]
for(const file of cssFiles){
  const source=fs.readFileSync(file,"utf8")
  for(const branch of selectorBranches(source)){
    const localCandidate=branch.replace(/:global\([^)]*\)/g,"")
    if(!/[.#][A-Za-z_][\w-]*/.test(localCandidate))impure.push(`${path.relative(root,file)} :: ${branch}`)
  }
}
check(impure.length===0,`Revenue Command CSS Module selector purity passes (${impure.length} suspicious branches)`)
if(impure.length)for(const item of impure.slice(0,30))failures.push(`impure CSS selector: ${item}`)
check(!css.includes(",button:focus-visible")&&!css.includes(",a:focus-visible")&&!css.includes(",input:focus-visible"),"Phase 8 CSS has no bare comma-separated element selectors")

console.log("\nANGELCARE Revenue Command Center — Strategic Partnerships Phase 8 Verification\n")
for(const label of passes)console.log(`PASS  ${label}`)
if(failures.length){console.error("\nFAILED CHECKS\n");for(const label of failures)console.error(`FAIL  ${label}`);console.error(`\n${passes.length} passed, ${failures.length} failed.`);process.exit(1)}
console.log(`\n${passes.length} checks passed. Strategic Partnerships / Referrals / Performance / Renewal / Expansion Phase 8 is statically accepted.`)
