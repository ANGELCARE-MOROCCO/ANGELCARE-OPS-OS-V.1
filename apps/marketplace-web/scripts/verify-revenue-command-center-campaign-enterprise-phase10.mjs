import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
let checks = 0
const failures = []
const check = (condition, label) => {
  checks += 1
  if (!condition) failures.push(label)
}
const file = (relative) => path.join(root, relative)
const read = (relative) => fs.readFileSync(file(relative), "utf8")
const exists = (relative) => fs.existsSync(file(relative))
function walk(directory, output = []) {
  if (!fs.existsSync(directory)) return output
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git"].includes(entry.name)) continue
    const absolute = path.join(directory, entry.name)
    entry.isDirectory() ? walk(absolute, output) : output.push(absolute)
  }
  return output
}

const routes = [
  ["app/(protected)/revenue-command-center/campaigns/page.tsx", "campaign-command"],
  ["app/(protected)/revenue-command-center/campaigns/new/page.tsx", "campaign-create-studio"],
  ["app/(protected)/revenue-command-center/campaigns/board/page.tsx", "campaign-board"],
  ["app/(protected)/revenue-command-center/campaigns/[id]/page.tsx", "campaign-dossier"],
  ["app/(protected)/revenue-command-center/campaigns/[id]/assets/page.tsx", "campaign-assets-studio"],
  ["app/(protected)/revenue-command-center/campaigns/[id]/execution/page.tsx", "campaign-live-room"],
  ["app/(protected)/revenue-command-center/campaigns/[id]/performance/page.tsx", "campaign-performance"],
  ["app/(protected)/revenue-command-center/sdr-execution/page.tsx", "sdr-command"],
]
const revenuePages = walk(file("app/(protected)/revenue-command-center")).filter((entry) => path.basename(entry) === "page.tsx")
check(revenuePages.length === 151, `151 Revenue routes preserved (found ${revenuePages.length})`)
for (const [route, experience] of routes) {
  check(exists(route), `${route} exists`)
  if (!exists(route)) continue
  const source = read(route)
  check(source.includes("RevenueCampaignWorkspace"), `${route} uses the Phase 10 workspace`)
  check(source.includes(`experience=\"${experience}\"`), `${route} declares ${experience}`)
  check(!source.includes("RevenueCommandFinalWorkspace") && !source.includes("CanonicalRevenueWorkspace"), `${route} no longer delegates to a generic workspace`)
}

const componentFiles = [
  "components/revenue-command-center/campaign-enterprise/RevenueCampaignWorkspace.tsx",
  "components/revenue-command-center/campaign-enterprise/RevenueCampaignWorkspace.module.css",
  "components/revenue-command-center/campaign-enterprise/campaign-actions.ts",
  "components/revenue-command-center/campaign-enterprise/route-contracts.ts",
  "components/revenue-command-center/campaign-enterprise/types.ts",
  "components/revenue-command-center/campaign-enterprise/useCampaignPortfolio.ts",
]
for (const item of componentFiles) check(exists(item), `${item} exists`)
const workspace = read(componentFiles[0])
for (const marker of [
  "CampaignCommand", "CampaignCreateStudio", "CampaignBoard", "CampaignDossier", "CampaignAssets", "CampaignLiveRoom", "CampaignPerformance", "SDRCommand", "ActionModal", "CampaignTable",
  "Délivrabilité", "Attribution", "Suppression", "Séquence", "Dh",
]) check(workspace.includes(marker), `workspace contains ${marker}`)
const routeContracts = read(componentFiles[3])
for (const [, experience] of routes) check(routeContracts.includes(`\"${experience}\"`), `route contract exists for ${experience}`)
const actions = read(componentFiles[2])
const actionKinds = [...actions.matchAll(/^\s*"([a-z][a-z0-9-]+)":\s*\{/gm)].map((match) => match[1])
check(actionKinds.length >= 40, `at least 40 governed campaign actions exist (found ${actionKinds.length})`)
for (const required of [
  "create-campaign", "freeze-audience", "evaluate-eligibility", "suppress-recipient", "create-sequence",
  "approve-sequence", "approve-template", "evaluate-readiness", "launch-campaign", "emergency-stop",
  "enroll-recipient", "remove-recipient", "dispatch-step", "record-provider-event", "record-reply", "record-call-outcome",
  "create-meeting-conversion", "create-opportunity-conversion", "create-attribution", "resolve-attribution-conflict",
  "record-cost", "close-performance-period", "create-recovery-plan",
]) check(actionKinds.includes(required), `governed action ${required} exists`)

const apiRoot = file("app/api/revenue-command-center/campaign-enterprise")
const apiRoutes = walk(apiRoot).filter((entry) => path.basename(entry) === "route.ts")
check(apiRoutes.length === 25, `25 protected Phase 10 API routes exist (found ${apiRoutes.length})`)
for (const apiRoute of apiRoutes) {
  const source = fs.readFileSync(apiRoute, "utf8")
  const relative = path.relative(root, apiRoute)
  check(source.includes("campaignCommand") || source.includes("campaignDynamicCommand") || source.includes("campaignContext"), `${relative} uses protected campaign access`)
  check(!source.includes("SUPABASE_SERVICE_ROLE_KEY"), `${relative} does not expose service credentials`)
}
const legacyApi = read("app/api/revenue-command-center/campaigns/route.ts")
check(legacyApi.includes("campaignContext"), "legacy campaign CRUD API is access controlled")
check(legacyApi.includes("revenue.campaigns.read") && legacyApi.includes("revenue.campaigns.manage"), "legacy campaign CRUD separates read and mutation authority")

const serverPath = "lib/revenue-command-center/campaign-enterprise/server.ts"
check(exists(serverPath), `${serverPath} exists`)
const server = read(serverPath)
for (const marker of [
  "CAMPAIGN_OPERATION_PERMISSIONS", "requireRevenueApiAccess", "SUPABASE_SERVICE_ROLE_KEY",
  "revenue_evaluate_campaign_recipient", "revenue_freeze_campaign_audience", "revenue_enroll_campaign_recipient", "revenue_approve_campaign_sequence",
  "revenue_dispatch_campaign_step", "revenue_record_campaign_provider_event", "revenue_process_campaign_reply",
  "revenue_create_campaign_attribution", "revenue_close_campaign_performance_period", "ensureCampaignCommunicationThread",
]) check(server.includes(marker), `server contains ${marker}`)
check(server.includes("Phase 10 requires server-only Supabase service-role credentials"), "server refuses unsafe direct-client fallback")
check(!server.includes('"revenue.view"'), "mutation server has no broad revenue.view fallback")

const migrationPath = "supabase/migrations/20260726_0800_revenue_campaign_sdr_attribution_completion.sql"
const preflightPath = "supabase/revenue-command-center/preflight/20260726_campaign_sdr_attribution_live_schema_preflight.sql"
const rollbackPath = "supabase/revenue-command-center/rollback/20260726_revenue_campaign_enterprise_phase10_rollback.sql"
const verificationPaths = [
  "supabase/revenue-command-center/verification/20260726_campaign_sdr_attribution_rls_verification.sql",
  "supabase/revenue-command-center/verification/20260726_campaign_eligibility_sequence_integrity_verification.sql",
  "supabase/revenue-command-center/verification/20260726_campaign_attribution_verification.sql",
  "supabase/revenue-command-center/verification/20260726_campaign_performance_cost_verification.sql",
]
for (const item of [migrationPath, preflightPath, rollbackPath, ...verificationPaths]) check(exists(item), `${item} exists`)
const migration = read(migrationPath)
const supportTables = [...migration.matchAll(/create table if not exists public\.(revenue_campaign_[a-z0-9_]+)/gi)].map((match) => match[1])
check(new Set(supportTables).size === 34, `34 additive Phase 10 support tables exist (found ${new Set(supportTables).size})`)
for (const required of [
  "revenue_campaign_recipients", "revenue_campaign_suppressions", "revenue_campaign_sequences",
  "revenue_campaign_sequence_versions", "revenue_campaign_sequence_steps", "revenue_campaign_template_versions",
  "revenue_campaign_dispatch_attempts", "revenue_campaign_replies", "revenue_campaign_attributions",
  "revenue_campaign_attribution_conflicts", "revenue_campaign_costs", "revenue_campaign_performance_periods",
]) check(supportTables.includes(required), `migration creates ${required}`)
for (const fn of [
  "revenue_evaluate_campaign_recipient", "revenue_freeze_campaign_audience", "revenue_enroll_campaign_recipient", "revenue_approve_campaign_sequence",
  "revenue_evaluate_campaign_readiness", "revenue_launch_campaign", "revenue_dispatch_campaign_step",
  "revenue_record_campaign_provider_event", "revenue_process_campaign_reply", "revenue_create_campaign_attribution",
  "revenue_close_campaign_performance_period",
]) check(migration.includes(`function public.${fn}`), `migration defines ${fn}`)
check(migration.includes("revenue_prospects.id must remain text"), "migration preserves TEXT prospect identity")
check(migration.includes("revenue_communication_threads"), "campaign communications reuse canonical threads")
check(migration.includes("thread_id,campaign_id"), "campaign communication events persist thread lineage")
check(migration.includes("security_invoker=true"), "command views use security-invoker semantics")
check(migration.includes("revoke all on public.%I from anon,authenticated"), "support tables deny direct client access")
check(migration.includes("grant execute on function public.revenue_dispatch_campaign_step") && migration.includes("to service_role"), "atomic mutations are server-only")
check(!migration.includes("grant select on public.revenue_campaign_command_view,public.revenue_campaign_recipient_command_view,public.revenue_sdr_campaign_queue_view to authenticated"), "sensitive command views are not granted directly to authenticated clients")
check(migration.trim().startsWith("begin;") && migration.trim().endsWith("commit;"), "migration is transactional")
const preflight = read(preflightPath)
for (const required of ["revenue_campaigns", "revenue_prospects", "revenue_communication_threads", "revenue_communication_events", "revenue_opportunities", "revenue_proposals", "revenue_contracts", "revenue_payment_confirmations", "revenue_realization_events", "READY", "BLOCKED"]) check(preflight.includes(required), `preflight covers ${required}`)
const rollback = read(rollbackPath)
for (const fn of ["revenue_freeze_campaign_audience", "revenue_approve_campaign_sequence", "revenue_record_campaign_provider_event", "revenue_create_campaign_attribution"]) check(rollback.includes(fn), `rollback removes ${fn}`)

const cssPath = componentFiles[1]
const css = read(cssPath)
check(css.includes(".shell"), "Phase 10 CSS has a local shell scope")
check(!/(^|,)\s*(button|a|input|select|textarea)(?:\s|:|\{|>)/m.test(css), "Phase 10 CSS has no obvious bare global selector branch")
for (const match of workspace.matchAll(/styles\.([A-Za-z0-9_]+)/g)) check(new RegExp(`\\.${match[1]}(?:[\\s:{,.#>+~\\[])`).test(css), `CSS class ${match[1]} resolves`)

const packageJson = JSON.parse(read("package.json"))
check(packageJson.scripts?.["revenue-command-center:phase10:verify"]?.includes("verify-revenue-command-center-campaign-enterprise-phase10.mjs"), "package has Phase 10 verifier command")
check(packageJson.scripts?.["revenue-command-center:phase10:typecheck"]?.includes("tsconfig.revenue-command-center-campaign-phase10.json"), "package has focused Phase 10 TypeScript command")
check(packageJson.scripts?.["revenue-command-center:phase10:release"]?.includes("release-revenue-command-center-campaign-phase10.mjs"), "package has Phase 10 release command")

if (failures.length) {
  console.error(`\n${failures.length} Phase 10 acceptance check(s) failed:`)
  failures.forEach((failure, index) => console.error(`${index + 1}. ${failure}`))
  process.exit(1)
}
console.log(`${checks} checks passed. Campaign / SDR / Sequence / Attribution Phase 10 is statically accepted.`)
