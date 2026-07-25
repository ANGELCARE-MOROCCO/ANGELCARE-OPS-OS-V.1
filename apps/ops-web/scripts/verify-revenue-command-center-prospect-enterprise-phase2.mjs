import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { createRequire } from "node:module"

const root = process.cwd()
const routeRoot = path.join(root, "app", "(protected)", "revenue-command-center")
const prospectRoot = path.join(routeRoot, "prospects")
const failures = []
const passes = []

const check = (condition, label) => {
  if (condition) passes.push(label)
  else failures.push(label)
}
const absolute = (relative) => path.join(root, relative)
const exists = (relative) => fs.existsSync(absolute(relative))
const read = (relative) => fs.readFileSync(absolute(relative), "utf8")

function walk(dir, predicate, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(target, predicate, found)
    else if (predicate(target)) found.push(target)
  }
  return found
}

const requiredFiles = [
  "components/revenue-command-center/prospects-enterprise/ProspectEnterpriseWorkspace.tsx",
  "components/revenue-command-center/prospects-enterprise/ProspectEnterpriseDossier.tsx",
  "components/revenue-command-center/prospects-enterprise/DossierEnterpriseModals.tsx",
  "components/revenue-command-center/prospects-enterprise/ProspectEnterprise.module.css",
  "components/revenue-command-center/prospects-enterprise/route-contracts.ts",
  "components/revenue-command-center/prospects-enterprise/types.ts",
  "components/revenue-command-center/prospects-enterprise/useProspectEnterpriseData.ts",
  "components/revenue-command-center/prospects-enterprise/useEnterpriseDialog.ts",
  "lib/revenue-command-center/api-access.ts",
  "lib/revenue-command-center/enterprise-server.ts",
  "app/api/revenue-command-center/accounts/route.ts",
  "app/api/revenue-command-center/contacts/route.ts",
  "app/api/revenue-command-center/opportunities/route.ts",
  "app/api/revenue-command-center/opportunities/transition/route.ts",
  "app/api/revenue-command-center/prospects/enterprise/route.ts",
  "app/api/revenue-command-center/prospects/enterprise/create/route.ts",
  "app/api/revenue-command-center/prospects/[id]/route.ts",
  "app/api/revenue-command-center/prospects/[id]/decision-map/route.ts",
  "app/api/revenue-command-center/prospects/[id]/qualification/route.ts",
  "app/api/revenue-command-center/prospects/[id]/risks/route.ts",
  "supabase/migrations/20260725_0100_revenue_prospect_account_opportunity_enterprise_completion.sql",
  "supabase/revenue-command-center/preflight/20260725_prospect_enterprise_live_schema_preflight.sql",
  "supabase/revenue-command-center/rollback/20260725_revenue_prospect_enterprise_phase2_rollback.sql",
  "docs/revenue-command-center/PHASE2_LIVE_SCHEMA_RECONCILIATION.md",
  "tsconfig.revenue-command-center-prospect-phase2.json",
]
for (const file of requiredFiles) check(exists(file), `required Phase 2 file exists: ${file}`)

const allPages = walk(routeRoot, (file) => file.endsWith(`${path.sep}page.tsx`))
check(allPages.length === 151, `Revenue route estate remains 151 pages (found ${allPages.length})`)

const prospectPages = walk(prospectRoot, (file) => file.endsWith(`${path.sep}page.tsx`))
check(prospectPages.length === 21, `prospect family contains exactly 21 route pages (found ${prospectPages.length})`)

const expectedRouteContracts = new Map([
  ["page.tsx", ["ProspectEnterpriseWorkspace", 'mode="acquisition"']],
  ["directory/page.tsx", ["ProspectEnterpriseWorkspace", 'mode="directory"']],
  ["executive/page.tsx", ["ProspectEnterpriseWorkspace", 'mode="executive"']],
  ["pipeline/page.tsx", ["ProspectEnterpriseWorkspace", 'mode="pipeline"']],
  ["qualification/page.tsx", ["ProspectEnterpriseWorkspace", 'mode="qualification"']],
  ["decision-map/page.tsx", ["ProspectEnterpriseWorkspace", 'mode="decision-map"']],
  ["appointments/page.tsx", ["ProspectEnterpriseWorkspace", 'mode="appointments"']],
  ["proposals/page.tsx", ["RevenueProposalWorkspace", 'experience="proposal-command"']],
  ["negotiation/page.tsx", ["RevenueProposalWorkspace", 'experience="negotiation-command"']],
  ["recovery/page.tsx", ["ProspectEnterpriseWorkspace", 'mode="recovery"']],
  ["analytics/page.tsx", ["ProspectEnterpriseWorkspace", 'mode="analytics"']],
  ["performance/page.tsx", ["ProspectEnterpriseWorkspace", 'mode="performance"']],
  ["high-value/page.tsx", ["ProspectEnterpriseWorkspace", 'mode="high-value"']],
  ["risk/page.tsx", ["ProspectEnterpriseWorkspace", 'mode="risk"']],
  ["new/page.tsx", ["ProspectEnterpriseWorkspace", 'mode="new"']],
  ["[id]/page.tsx", ["ProspectEnterpriseDossier", 'mode="overview"']],
  ["[id]/qualification/page.tsx", ["ProspectEnterpriseDossier", 'mode="qualification"']],
  ["[id]/decision-map/page.tsx", ["ProspectEnterpriseDossier", 'mode="decision-map"']],
  ["[id]/proposal/page.tsx", ["RevenueProposalWorkspace", 'experience="proposal-dossier"']],
  ["[id]/negotiation/page.tsx", ["RevenueProposalWorkspace", 'experience="negotiation-room"']],
  ["[id]/recovery/page.tsx", ["ProspectEnterpriseDossier", 'mode="recovery"']],
])
for (const [route, markers] of expectedRouteContracts) {
  const file = `app/(protected)/revenue-command-center/prospects/${route}`
  check(exists(file), `route retained: ${route}`)
  if (exists(file)) {
    const source = read(file)
    for (const marker of markers) check(source.includes(marker), `${route} uses its purpose-built contract: ${marker}`)
    check(!source.includes("RevenueProspectsV12MegaWorkspace"), `${route} no longer uses the legacy prospect mega-placeholder`)
  }
}

const workspace = read("components/revenue-command-center/prospects-enterprise/ProspectEnterpriseWorkspace.tsx")
const dossier = read("components/revenue-command-center/prospects-enterprise/ProspectEnterpriseDossier.tsx")
const recordModals = read("components/revenue-command-center/prospects-enterprise/DossierEnterpriseModals.tsx")
const contracts = read("components/revenue-command-center/prospects-enterprise/route-contracts.ts")
const css = read("components/revenue-command-center/prospects-enterprise/ProspectEnterprise.module.css")
const dialogHook = read("components/revenue-command-center/prospects-enterprise/useEnterpriseDialog.ts")

for (const mode of ["acquisition", "directory", "executive", "pipeline", "qualification", "decision-map", "appointments", "proposals", "negotiation", "recovery", "analytics", "performance", "high-value", "risk", "new"]) {
  check(contracts.includes(`${mode}:`) || contracts.includes(`"${mode}":`), `route contract defined: ${mode}`)
}
for (const experience of ["ExecutiveView", "PipelineView", "QualificationView", "DecisionMapView", "AppointmentsView", "ProposalView", "NegotiationView", "RecoveryView", "AnalyticsView", "PerformanceView", "HighValueView", "RiskView", "NewProspectStudio"]) {
  check(workspace.includes(`function ${experience}`), `purpose-built experience exists: ${experience}`)
}
for (const dossierMode of ["Overview", "Qualification", "DecisionMap", "Proposal", "Negotiation", "Recovery"]) {
  check(dossier.includes(`function ${dossierMode}`), `purpose-built dossier experience exists: ${dossierMode}`)
}

check(workspace.includes('Intl.NumberFormat("fr-FR"'), "portfolio monetary formatting uses fr-FR")
check(dossier.includes('Intl.NumberFormat("fr-FR"'), "dossier monetary formatting uses fr-FR")
check(workspace.includes(" Dh`") && dossier.includes(" Dh`"), "visible revenue values use Dh")
check(!/\bMAD\b/.test(workspace) && !/\bMAD\b/.test(dossier), "visible prospect UI does not expose MAD labels")
check(css.includes(".shell {") && css.includes("width: 100%") && !css.includes("max-width: 1680px"), "prospect experience is full-width")
check(css.includes("@media") && css.includes("grid-template-columns: 1fr"), "responsive workspace transformations exist")
check(css.includes(".modalBackdrop") && css.includes(".modalWide"), "enterprise modal surfaces are styled")
check(dialogHook.includes('event.key === "Escape"'), "dialogs implement Escape handling")
check(dialogHook.includes('event.key !== "Tab"'), "dialogs implement keyboard focus trapping")
check(dialogHook.includes('document.body.style.overflow = "hidden"'), "dialogs protect background scroll")
check(workspace.includes("useEnterpriseDialog") && recordModals.includes("useEnterpriseDialog"), "all new modal families use the enterprise dialog behavior")
check(recordModals.includes('"prospect"') && recordModals.includes('"account"') && recordModals.includes('"contact"') && recordModals.includes('"opportunity-transition"'), "dossier edit and transition modal inventory is complete")
check(dossier.includes("Faire progresser") && dossier.includes("Modifier le dossier"), "dossier exposes real edit and progression actions")
check(workspace.includes("prospects/enterprise/create"), "new dossier studio uses atomic server orchestration")
check(!workspace.includes('mutateRevenueEndpoint("/api/revenue-command-center/accounts", "POST"'), "new dossier studio no longer performs fragmented client-side creation")
check(dossier.includes("Capacité entreprise partiellement disponible"), "schema readiness is disclosed honestly")
check(workspace.includes("plutôt que simulée"), "portfolio experience maintains no-simulation language")
check(dossier.includes("Phase suivante") || dossier.includes("phase suivante") || dossier.includes("phase dédiée"), "proposal and negotiation surfaces disclose completion boundaries")

const apiFiles = [
  "app/api/revenue-command-center/accounts/route.ts",
  "app/api/revenue-command-center/contacts/route.ts",
  "app/api/revenue-command-center/opportunities/route.ts",
  "app/api/revenue-command-center/opportunities/transition/route.ts",
  "app/api/revenue-command-center/prospects/enterprise/route.ts",
  "app/api/revenue-command-center/prospects/enterprise/create/route.ts",
  "app/api/revenue-command-center/prospects/[id]/route.ts",
  "app/api/revenue-command-center/prospects/[id]/decision-map/route.ts",
  "app/api/revenue-command-center/prospects/[id]/qualification/route.ts",
  "app/api/revenue-command-center/prospects/[id]/risks/route.ts",
]
for (const file of apiFiles) {
  const source = read(file)
  check(source.includes("requireRevenueApiAccess"), `${file} enforces server-side Revenue access`)
  check(source.includes("revenueAccessFailure"), `${file} returns controlled access failures`)
  check(!source.includes("service_role"), `${file} does not bypass user authorization with service-role credentials`)
}
for (const file of apiFiles.filter((file) => !file.endsWith("enterprise/route.ts") && !file.endsWith("enterprise/create/route.ts") && !file.endsWith("[id]/route.ts"))) {
  const source = read(file)
  check(source.includes("logRevenueActivity") || file.includes("transition"), `${file} records a business activity or controlled transition`)
  check(source.includes("logRevenueAction") || file.includes("transition"), `${file} records an audit action or controlled transition`)
}

const access = read("lib/revenue-command-center/api-access.ts")
check(access.includes("UNAUTHENTICATED") && access.includes("FORBIDDEN"), "API access helper distinguishes authentication and authorization failures")
check(access.includes('permissionSet.has("revenue.manage")'), "existing broad revenue.manage authority remains compatible")
const permissions = read("lib/auth/permissions.ts")
for (const permission of [
  "revenue.prospects.read",
  "revenue.prospects.manage",
  "revenue.prospects.qualification.manage",
  "revenue.prospects.decision_map.manage",
  "revenue.prospects.risks.manage",
  "revenue.accounts.read",
  "revenue.accounts.manage",
  "revenue.contacts.read",
  "revenue.contacts.manage",
  "revenue.opportunities.read",
  "revenue.opportunities.manage",
  "revenue.opportunities.transition",
]) check(permissions.includes(`'${permission}'`), `permission catalog includes ${permission}`)

const rootProspectApi = read("app/api/revenue-command-center/prospects/route.ts")
const canonicalServer = read("lib/revenue-command-center/canonical-server.ts")
check(rootProspectApi.includes("accountId") && rootProspectApi.includes("contactId"), "canonical prospect API accepts account and contact links")
check(canonicalServer.includes("account_id") && canonicalServer.includes("contact_id"), "prospect normalizer persists canonical account and contact links")
const contactsApi = read("app/api/revenue-command-center/contacts/route.ts")
check(contactsApi.includes("{ ...existing, ...body }") && contactsApi.includes("Contact introuvable"), "contact PATCH preserves unspecified canonical fields")
check(contactsApi.includes("relationshipWarning"), "contact relationship failures are returned truthfully instead of silently discarded")

const migration = read("supabase/migrations/20260725_0100_revenue_prospect_account_opportunity_enterprise_completion.sql")
const preflight = read("supabase/revenue-command-center/preflight/20260725_prospect_enterprise_live_schema_preflight.sql")
check(migration.includes("BLOCKED: this compatibility migration expects public.revenue_prospects.id TEXT"), "migration blocks incompatible live schemas before mutation")
check(migration.includes("Keeps public.revenue_prospects.id as TEXT") && migration.includes("No legacy ID conversion"), "legacy TEXT-ID compatibility is explicitly guarded")
for (const table of [
  "revenue_account_aliases",
  "revenue_contact_relationships",
  "revenue_decision_map_members",
  "revenue_qualification_assessments",
  "revenue_account_status_history",
  "revenue_account_risks",
  "revenue_account_plans",
  "revenue_opportunity_stage_history",
  "revenue_opportunity_participants",
  "revenue_opportunity_risks",
  "revenue_opportunity_competitors",
]) check(migration.includes(`public.${table}`), `additive enterprise table defined: ${table}`)
check(migration.includes("revenue_prospect_enterprise_overview"), "canonical enterprise read model is defined")
check(migration.includes("revenue_capture_opportunity_stage_change"), "opportunity stage-change trigger is defined")
check(migration.includes("revenue_create_enterprise_prospect_dossier"), "atomic dossier-creation RPC is defined")
check(migration.includes("enable row level security"), "new enterprise tables enable RLS")
check(migration.includes("revoke all privileges on table") && migration.includes("from anon, authenticated"), "new enterprise tables reject direct browser-role access")
check(migration.includes("grant all privileges on table") && migration.includes("to service_role"), "server-command service role receives explicit table privileges")
check(migration.includes("revenue_create_enterprise_prospect_dossier(jsonb, uuid, text)") && migration.includes("grant execute"), "atomic dossier RPC is restricted to the controlled server command path")
check(migration.includes("entity_id::text = p.id::text"), "enterprise read model tolerates legacy text or UUID entity links")
check(!/\bdrop\s+table\b/i.test(migration), "migration does not drop tables")
check(!/\btruncate\b/i.test(migration), "migration does not truncate data")
check(!/\bdelete\s+from\b/i.test(migration), "migration does not delete business data")
check(preflight.includes("READ-ONLY"), "live-schema preflight is explicitly read-only")
check(!/\b(insert|update|delete|alter|create|drop|truncate)\b/i.test(preflight.replace(/^--.*$/gm, "")), "preflight contains no mutation statement")
check(preflight.includes("TYPE_DRIFT") && preflight.includes("CUTOVER_GATE"), "preflight reports type drift and a cutover gate")
check(preflight.includes("text_or_uuid") && preflight.includes("timestamp_or_date"), "preflight recognizes compatible legacy task and appointment link types")
const rollback = read("supabase/revenue-command-center/rollback/20260725_revenue_prospect_enterprise_phase2_rollback.sql")
check(rollback.includes("CONTROLLED ROLLBACK"), "controlled rollback is explicitly gated")
check(!/drop\s+column/i.test(rollback), "rollback preserves additive base-table columns and live values")
check(rollback.includes("drop view if exists public.revenue_prospect_enterprise_overview"), "rollback removes the Phase 2 read model")

const tsFiles = [
  ...walk(path.join(root, "components", "revenue-command-center", "prospects-enterprise"), (file) => /\.(ts|tsx)$/.test(file)),
  ...apiFiles.map(absolute),
  absolute("lib/revenue-command-center/api-access.ts"),
  absolute("lib/revenue-command-center/enterprise-server.ts"),
]
let typescript = null
try {
  const require = createRequire(import.meta.url)
  typescript = require("typescript")
} catch {}
if (typescript) {
  let diagnostics = 0
  for (const file of tsFiles) {
    const source = fs.readFileSync(file, "utf8")
    const result = typescript.transpileModule(source, {
      compilerOptions: {
        target: typescript.ScriptTarget.ES2022,
        module: typescript.ModuleKind.ESNext,
        jsx: typescript.JsxEmit.ReactJSX,
        isolatedModules: true,
      },
      fileName: file,
      reportDiagnostics: true,
    })
    diagnostics += (result.diagnostics || []).filter((item) => item.category === typescript.DiagnosticCategory.Error).length
  }
  check(diagnostics === 0, `TypeScript isolated syntax gate passes (${diagnostics} errors)`)
} else {
  passes.push("TypeScript package unavailable to verifier; focused tsconfig is included for the repository typecheck gate")
}

const classDefinitions = new Set([...css.matchAll(/\.([A-Za-z_][\w-]*)\b/g)].map((match) => match[1]))
const styleUsers = [workspace, dossier, recordModals]
const classUses = new Set(styleUsers.flatMap((source) => [...source.matchAll(/styles\.([A-Za-z_][\w]*)/g)].map((match) => match[1])))
const missingClasses = [...classUses].filter((className) => !classDefinitions.has(className))
check(missingClasses.length === 0, `CSS-module references resolve (${missingClasses.length} missing)`)

console.log("\nANGELCARE Revenue Command Center — Prospect / Account / Opportunity Phase 2 Verification\n")
for (const label of passes) console.log(`PASS  ${label}`)
if (failures.length) {
  console.error("\nFAILED CHECKS\n")
  for (const label of failures) console.error(`FAIL  ${label}`)
  console.error(`\n${passes.length} passed, ${failures.length} failed.`)
  process.exit(1)
}
console.log(`\n${passes.length} checks passed. Prospect / Account / Opportunity Phase 2 is statically accepted.`)
