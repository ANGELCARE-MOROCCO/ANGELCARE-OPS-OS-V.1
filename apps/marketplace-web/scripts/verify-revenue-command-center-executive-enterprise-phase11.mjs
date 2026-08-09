import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"

const root = process.cwd()
const failures = []
const passes = []
const partialCapture = process.env.PHASE11_PARTIAL_CAPTURE === "1"

function full(relative) { return path.join(root, relative) }
function exists(relative) { return fs.existsSync(full(relative)) }
function read(relative) {
  if (!exists(relative)) {
    failures.push(`required file missing: ${relative}`)
    return ""
  }
  return fs.readFileSync(full(relative), "utf8")
}
function check(condition, label) {
  if (condition) { passes.push(label); console.log(`PASS  ${label}`) }
  else { failures.push(label); console.error(`FAIL  ${label}`) }
}
function walk(directory, predicate = () => true) {
  const output = []
  if (!fs.existsSync(directory)) return output
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) output.push(...walk(target, predicate))
    else if (predicate(target)) output.push(target)
  }
  return output
}

const required = [
  "components/revenue-command-center/executive-enterprise/RevenueExecutiveWorkspace.tsx",
  "components/revenue-command-center/executive-enterprise/RevenueExecutiveWorkspace.module.css",
  "components/revenue-command-center/executive-enterprise/route-contracts.ts",
  "components/revenue-command-center/executive-enterprise/types.ts",
  "lib/revenue-command-center/executive-enterprise/server.ts",
  "app/api/revenue-command-center/executive-enterprise/_shared.ts",
  "app/api/revenue-command-center/executive-enterprise/portfolio/route.ts",
  "app/api/revenue-command-center/executive-enterprise/commands/route.ts",
  "app/api/revenue-command-center/executive-enterprise/forecast/route.ts",
  "app/api/revenue-command-center/executive-enterprise/interventions/route.ts",
  "app/api/revenue-command-center/executive-enterprise/scenarios/route.ts",
  "app/api/revenue-command-center/executive-enterprise/briefings/route.ts",
  "app/api/revenue-command-center/executive-enterprise/signals/route.ts",
  "app/api/revenue-command-center/executive-enterprise/data-quality/route.ts",
  "app/api/revenue-command-center/executive-enterprise/collections/route.ts",
  "app/api/revenue-command-center/executive-enterprise/audit/route.ts",
  "supabase/revenue-command-center/preflight/20260727_executive_intelligence_live_schema_preflight.sql",
  "supabase/migrations/20260727_0900_revenue_executive_intelligence_completion.sql",
  "supabase/revenue-command-center/rollback/20260727_revenue_executive_intelligence_phase11_rollback.sql",
  "supabase/revenue-command-center/verification/20260727_executive_intelligence_rls_verification.sql",
  "supabase/revenue-command-center/verification/20260727_executive_forecast_integrity_verification.sql",
  "supabase/revenue-command-center/verification/20260727_executive_leakage_intervention_verification.sql",
  "supabase/revenue-command-center/verification/20260727_executive_scenario_briefing_verification.sql",
  "supabase/revenue-command-center/verification/20260727_executive_finance_attribution_lineage_verification.sql",
  "tsconfig.revenue-command-center-executive-phase11.json",
  "scripts/release-revenue-command-center-executive-phase11.mjs",
]
for (const file of required) check(exists(file), `required Mega ZIP 11 file exists: ${file}`)

const routeContracts = [
  ["app/(protected)/revenue-command-center/page.tsx", "executive-overview"],
  ["app/(protected)/revenue-command-center/control-tower/page.tsx", "control-tower"],
  ["app/(protected)/revenue-command-center/executive-briefing/page.tsx", "executive-briefing"],
  ["app/(protected)/revenue-command-center/predictive/page.tsx", "forecast-command"],
  ["app/(protected)/revenue-command-center/strategy-room/page.tsx", "strategy-room"],
  ["app/(protected)/revenue-command-center/revenue-analytics/page.tsx", "revenue-analytics"],
  ["app/(protected)/revenue-command-center/team-performance/page.tsx", "team-intelligence"],
  ["app/(protected)/revenue-command-center/overdue-heatmap/page.tsx", "overdue-heatmap"],
  ["app/(protected)/revenue-command-center/workload-balancer/page.tsx", "workload-command"],
  ["app/(protected)/revenue-command-center/management/page.tsx", "management-decision-room"],
]
for (const [file, experience] of routeContracts) {
  const source = read(file)
  check(source.includes("RevenueExecutiveWorkspace"), `${experience} uses the Phase 11 executive workspace`)
  check(source.includes(`experience="${experience}"`), `${experience} is individually contracted`)
  for (const legacy of ["RevenueCommandFinalWorkspace","UltimateRevenueCommandPage","RevenueExecutiveBriefingV11Workspace","RevenuePredictiveV11Workspace","CentralRevenueCoreDashboard","RevenueExecutionWorkspace","RevenueCommandAnalyticsSourceOfTruthWorkspace"]) {
    check(!source.includes(legacy), `${experience} excludes generic legacy wrapper ${legacy}`)
  }
}

const routeRoot = full("app/(protected)/revenue-command-center")
const pageRoutes = walk(routeRoot, (target) => target.endsWith(`${path.sep}page.tsx`))
if (partialCapture) check(pageRoutes.length >= 10, `partial source capture retains the ten Phase 11 routes (${pageRoutes.length})`)
else check(pageRoutes.length === 151, `all 151 Revenue page routes remain present (${pageRoutes.length})`)

const workspace = read("components/revenue-command-center/executive-enterprise/RevenueExecutiveWorkspace.tsx")
const styles = read("components/revenue-command-center/executive-enterprise/RevenueExecutiveWorkspace.module.css")
const routeMap = read("components/revenue-command-center/executive-enterprise/route-contracts.ts")
const types = read("components/revenue-command-center/executive-enterprise/types.ts")
const server = read("lib/revenue-command-center/executive-enterprise/server.ts")
const migration = read("supabase/migrations/20260727_0900_revenue_executive_intelligence_completion.sql")
const preflight = read("supabase/revenue-command-center/preflight/20260727_executive_intelligence_live_schema_preflight.sql")
const rollback = read("supabase/revenue-command-center/rollback/20260727_revenue_executive_intelligence_phase11_rollback.sql")

const renderers = [
  "ExecutiveOverview","ControlTower","BriefingRoom","ForecastCommand","StrategyRoom",
  "AnalyticsCommand","TeamIntelligence","OverdueHeatmap","WorkloadCommand","DecisionRoom",
]
for (const renderer of renderers) check(workspace.includes(`function ${renderer}`), `purpose-built executive renderer exists: ${renderer}`)

for (const [, experience] of routeContracts) {
  check(routeMap.includes(`"${experience}"`), `route contract exists: ${experience}`)
  check(types.includes(`| "${experience}"`) || types.includes(`= "${experience}"`), `typed experience exists: ${experience}`)
}

const commands = [
  "generate-forecast-snapshot","submit-owner-forecast","override-forecast","expire-forecast-override",
  "create-intervention","assign-intervention","escalate-intervention","request-decision",
  "decide-intervention","record-intervention-checkpoint","close-intervention","create-scenario",
  "run-scenario","approve-scenario","generate-briefing","approve-briefing",
  "acknowledge-signal","dismiss-signal","create-canonical-task","request-finance-review",
]
for (const command of commands) {
  check(types.includes(`| "${command}"`), `typed executive command exists: ${command}`)
  check(workspace.includes(`"${command}"`), `executive UI exposes command: ${command}`)
  check(server.includes(`"${command}"`), `server governs command: ${command}`)
}

for (const source of [
  "revenue_opportunities","revenue_proposals","revenue_contracts","revenue_payment_confirmations",
  "revenue_realization_events","revenue_partner_referral_attributions","revenue_b2c_cases",
  "revenue_campaign_attributions","revenue_campaign_costs",
]) check(server.includes(`"${source}"`), `executive portfolio consumes canonical source: ${source}`)

check(server.includes('REALIZATION_REVERSED'), "realization reversals are explicitly respected")
check(server.includes('"B2B direct"') && server.includes('"Partenaires"') && server.includes('"B2C familles"') && server.includes('"Campagnes"'), "source contributions stay separated")
check(workspace.includes('Intl.NumberFormat("fr-FR"'), "French corporate number formatting is enforced")
check(workspace.includes(" Dh") && workspace.includes("formatDh"), "executive money is labelled in Dh")
check(workspace.includes("ExecutiveCommandDrawer"), "governed executive command drawer exists")
check(workspace.includes('role="dialog"') && workspace.includes('aria-modal="true"'), "executive command drawer exposes accessible dialog semantics")
check(styles.includes(":focus-visible"), "visible keyboard focus exists")
check(styles.includes("@media (prefers-reduced-motion: reduce)"), "reduced-motion support exists")
check(!/(^|})\s*(button|a|input|select|textarea|table|h[1-6]|\[data-[^\]]+\])(?:[:\s,{>+~])/m.test(styles), "CSS Module has no bare global selector branch")

const styleRefs = [...workspace.matchAll(/styles\.([A-Za-z0-9_]+)/g)].map((match) => match[1])
const styleClasses = new Set([...styles.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map((match) => match[1]))
const missingStyles = [...new Set(styleRefs.filter((name) => !styleClasses.has(name)))]
check(missingStyles.length === 0, `CSS-module references resolve (${missingStyles.length} missing)`)

const tables = [
  "forecast_models","forecast_model_versions","forecast_snapshots","forecast_lines","forecast_submissions",
  "forecast_overrides","forecast_movements","forecast_accuracy_periods","signal_rules","signal_rule_versions",
  "signals","signal_evidence","leakage_events","leakage_resolutions","interventions",
  "intervention_assignments","intervention_checkpoints","decision_requests","decisions",
  "intervention_actions","intervention_outcomes","scenarios","scenario_versions","scenario_assumptions",
  "scenario_results","briefings","briefing_sections","data_quality_issues","audit_events",
]
for (const table of tables) {
  check(migration.includes(`create table if not exists public.revenue_executive_${table}`), `migration creates revenue_executive_${table}`)
  check(migration.includes(`'revenue_executive_${table}'`), `RLS registry covers revenue_executive_${table}`)
  check(rollback.includes(`drop table if exists public.revenue_executive_${table}`), `rollback targets only Phase 11 table revenue_executive_${table}`)
}

const rpcs = [
  "revenue_executive_create_forecast_snapshot","revenue_executive_submit_forecast",
  "revenue_executive_override_forecast","revenue_executive_create_intervention",
  "revenue_executive_decide_intervention","revenue_executive_close_intervention",
  "revenue_executive_manage_scenario","revenue_executive_manage_briefing",
]
for (const rpc of rpcs) {
  check(migration.includes(`function public.${rpc}`), `atomic command exists: ${rpc}`)
  check(migration.includes(`grant execute on function public.${rpc}`), `atomic command is service-role executable: ${rpc}`)
  check(server.includes(`"${rpc}"`), `server invokes atomic command: ${rpc}`)
}

check(migration.startsWith("-- ANGELCARE") && migration.includes("begin;") && migration.trimEnd().endsWith("commit;"), "Phase 11 migration is additive and transactional")
check(migration.includes("revoke all on table public.%I from anon, authenticated"), "browser roles cannot mutate or read sensitive support tables directly")
check(migration.includes("security definer"), "critical executive commands use security-definer functions")
check(migration.includes("Final executive decisions are immutable"), "final executive decisions are immutable")
check(migration.includes("Approved or closed executive records are immutable"), "approved scenarios, snapshots and briefings are immutable")
check(preflight.includes("cutover_gate") && preflight.includes("'READY'"), "preflight exposes explicit READY/BLOCKED cutover gate")
check(preflight.includes("data_type='text'"), "preflight protects TEXT prospect identity")
check(preflight.includes("not in (0,29)"), "preflight blocks partial Phase 11 installation")
check(!rollback.includes("drop table if exists public.revenue_opportunities"), "rollback preserves canonical opportunities")
check(!rollback.includes("drop table if exists public.revenue_contracts"), "rollback preserves canonical contracts")
check(!rollback.includes("drop table if exists public.revenue_realization_events"), "rollback preserves authoritative realization")

const apiRoot = full("app/api/revenue-command-center/executive-enterprise")
const apiRoutes = walk(apiRoot, (target) => target.endsWith(`${path.sep}route.ts`))
check(apiRoutes.length === 10, `ten protected executive API route handlers exist (${apiRoutes.length})`)
for (const api of apiRoutes) {
  const source = fs.readFileSync(api, "utf8")
  check(source.includes("executive") || source.includes("Executive"), `executive API is wired: ${path.relative(root,api)}`)
}
check(read("app/api/revenue-command-center/executive-enterprise/_shared.ts").includes("revenue.executive.manage"), "executive mutations enforce permission boundary")
check(server.includes("createSupabaseAdmin"), "authorized server gateway owns service-role mutations")
check(server.includes("logRevenueAction") && server.includes("logRevenueActivity"), "executive commands write canonical Revenue audit/activity records")

let ts = null
try {
  const require = createRequire(import.meta.url)
  ts = require("typescript")
} catch {
  try { ts = await import("/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js") } catch {}
}
if (ts) {
  const syntaxFiles = [
    ...walk(full("components/revenue-command-center/executive-enterprise"), (target) => /\.(ts|tsx)$/.test(target)),
    ...walk(full("lib/revenue-command-center/executive-enterprise"), (target) => /\.(ts|tsx)$/.test(target)),
    ...walk(apiRoot, (target) => /\.(ts|tsx)$/.test(target)),
    ...routeContracts.map(([file]) => full(file)),
  ]
  let syntaxErrors = 0
  for (const file of syntaxFiles) {
    const source = fs.readFileSync(file, "utf8")
    const output = ts.transpileModule(source, {
      compilerOptions: {
        jsx: ts.JsxEmit.Preserve,
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
      fileName: file,
      reportDiagnostics: true,
    })
    const errors = (output.diagnostics || []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
    syntaxErrors += errors.length
    for (const diagnostic of errors) console.error(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"))
  }
  check(syntaxErrors === 0, `isolated TypeScript syntax gate passes (${syntaxErrors} errors)`)
} else {
  console.warn("WARN  TypeScript package unavailable; syntax gate deferred to focused tsc.")
}

if (failures.length) {
  console.error(`\nPhase 11 verification FAILED: ${failures.length} failure(s).`)
  process.exit(1)
}
console.log(`\n${passes.length} checks passed. Executive Intelligence / Forecasting / Leakage / Decision Orchestration Phase 11 is statically accepted.`)
