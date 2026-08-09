#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"

const opsRoot = path.resolve(process.argv[2] || process.cwd())
const routeRoot = path.join(opsRoot, "app", "(protected)", "revenue-command-center")
const apiRoot = path.join(opsRoot, "app", "api", "revenue-command-center")
const componentRoot = path.join(opsRoot, "components", "revenue-command-center")
const reportRoot = path.resolve(process.argv[3] || path.join(opsRoot, ".phase12-certification"))
let checks = 0
const failures = []

const pass = (condition, message) => {
  checks += 1
  if (condition) console.log(`PASS — ${message}`)
  else { console.error(`FAIL — ${message}`); failures.push(message) }
}
const walk = (root, predicate = () => true) => {
  if (!fs.existsSync(root)) return []
  const out = []
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name)
    if (entry.isDirectory()) out.push(...walk(file, predicate))
    else if (predicate(file)) out.push(file)
  }
  return out
}
const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, "utf8") : ""

pass(fs.existsSync(routeRoot), "Revenue Command Center protected route root exists")
const pages = walk(routeRoot, (file) => file.endsWith(`${path.sep}page.tsx`))
pass(pages.length === 151, `exact 151/151 route pages are present (found ${pages.length})`)

for (const page of pages) {
  const source = read(page)
  const relative = path.relative(routeRoot, page).split(path.sep).join("/")
  pass(/export\s+default\s+(?:async\s+)?function|export\s+default\s+[A-Za-z_$]/.test(source), `${relative} exports a default route component`)
  pass(!/Canonical Transition Workspace|BUILD RESTORED|next phase will replace/i.test(source), `${relative} contains no transition-placeholder language`)
}

const finalWorkspace = path.join(componentRoot, "final-certification", "RevenueCertifiedWorkspace.tsx")
const finalCss = path.join(componentRoot, "final-certification", "RevenueCertifiedWorkspace.module.css")
const canonical = path.join(componentRoot, "CanonicalRevenueWorkspace.tsx")
pass(fs.existsSync(finalWorkspace), "final certification workspace exists")
pass(fs.existsSync(finalCss), "final certification CSS Module exists")
pass(read(canonical).includes("final-certification/RevenueCertifiedWorkspace"), "legacy canonical wrapper now resolves to the final certified workspace")

const finalSource = read(finalWorkspace)
const requiredWorkspaces = [
  "automation", "businessDevelopment", "campaigns", "campaignBoard", "campaignNew", "campaignDetail", "campaignAssets", "campaignExecution", "campaignPerformance", "cockpit", "elite-command", "growth", "leads-impact", "market-mapping", "master-command", "myWork", "notifications", "system-activation",
]
for (const key of requiredWorkspaces) pass(finalSource.includes(`key: \"${key}\"`) || finalSource.includes(`case \"${key}\"`), `final route experience is explicitly constituted for ${key}`)

pass(finalSource.includes('src="/logo.png"'), "official AngelCare logo is used")
pass(finalSource.includes("Aucune donnée simulée"), "data-honesty boundary is visible")
pass(finalSource.includes("/api/revenue-command-center/v12/pulse"), "final workspaces consume existing Revenue pulse API")
pass(finalSource.includes("/api/revenue-command-center/v12/records"), "final workspaces consume existing Revenue records API")
pass(finalSource.includes("/api/revenue-command-center/campaigns"), "campaign workspaces consume the canonical Campaign API")
pass(finalSource.includes("/api/revenue-command-center/notifications"), "notification workspace consumes the canonical Notifications API")
pass(finalSource.includes("/api/revenue-command-center/automation/run"), "automation execution remains explicit and server-backed")
pass(!/SUPABASE_SERVICE_ROLE|SERVICE_ROLE_KEY|PGPASSWORD/.test(finalSource), "no secret or service-role credential is exposed in the client")
pass(!/bg-\[#050b16\]|Canonical Transition Workspace|BUILD RESTORED/.test(finalSource), "dark transition placeholder has been removed")

const css = read(finalCss)
pass(css.includes("@media(prefers-reduced-motion:reduce)"), "reduced-motion support is present")
pass(css.includes(".page *,.page *::before,.page *::after"), "reduced-motion selector is locally scoped for CSS Modules")
pass(!/@media[^{}]*prefers-reduced-motion[^{}]*\{\s*\*\s*,/s.test(css), "no unscoped universal reduced-motion selector exists")
pass(css.includes("background:linear-gradient(180deg,#f8fbff"), "white and icy-blue enterprise canvas is enforced")

const apiFiles = walk(apiRoot, (file) => file.endsWith(`${path.sep}route.ts`))
pass(apiFiles.length >= 67, `Revenue API inventory is complete enough for final reconciliation (found ${apiFiles.length})`)
const executiveApiRoot = path.join(apiRoot, "executive-enterprise")
const executiveApis = walk(executiveApiRoot, (file) => file.endsWith(`${path.sep}route.ts`))
pass(executiveApis.length === 10, `all ten MZ11 executive APIs remain present (found ${executiveApis.length})`)

const executiveRoutes = ["", "control-tower", "executive-briefing", "predictive", "strategy-room", "revenue-analytics", "team-performance", "overdue-heatmap", "workload-balancer", "management"]
for (const suffix of executiveRoutes) {
  const page = path.join(routeRoot, suffix, "page.tsx")
  pass(read(page).includes("RevenueExecutiveWorkspace"), `${suffix || "root"} keeps its purpose-built MZ11 executive renderer`)
}

const migration = path.join(opsRoot, "supabase", "migrations", "20260727_0900_revenue_executive_intelligence_completion.sql")
const migrationSource = read(migration)
pass(fs.existsSync(migration), "MZ11 executive migration remains present")
pass((migrationSource.match(/create table if not exists public\.revenue_executive_/gi) || []).length === 29, "MZ11 migration retains exactly 29 executive tables")
pass(migrationSource.includes("Restrict Phase 11 command views to server-authorized access only"), "MZ11 migration permanently contains command-view hardening")
pass(/revoke all on table public\.revenue_executive_forecast_command_view[\s\S]*from public, anon, authenticated/i.test(migrationSource), "forecast command view is revoked from browser roles")
pass(/revoke all on table public\.revenue_executive_intervention_command_view[\s\S]*from public, anon, authenticated/i.test(migrationSource), "intervention command view is revoked from browser roles")

const generator = path.join(opsRoot, "scripts", "generate-revenue-command-center-phase12-ledgers.mjs")
const generated = spawnSync(process.execPath, [generator, "--ops-root", opsRoot, "--output", reportRoot], { encoding: "utf8" })
if (generated.stdout) process.stdout.write(generated.stdout)
if (generated.stderr) process.stderr.write(generated.stderr)
pass(generated.status === 0, "151-route, API, interaction and CSS certification ledgers generate successfully")

const ledger = path.join(reportRoot, "REVENUE_COMMAND_CENTER_PHASE12_ROUTE_LEDGER.json")
const apiLedger = path.join(reportRoot, "REVENUE_COMMAND_CENTER_PHASE12_API_INVENTORY.json")
pass(fs.existsSync(ledger), "151-route machine-readable ledger was generated")
pass(fs.existsSync(apiLedger), "API inventory ledger was generated")
if (fs.existsSync(ledger)) {
  const parsed = JSON.parse(read(ledger))
  pass(parsed.summary?.routes === 151, "generated route ledger records 151 routes")
  pass(parsed.summary?.placeholderFailures === 0, "generated route ledger reports zero placeholder pages")
  pass(parsed.summary?.cssPurityIssues === 0, "generated route ledger reports zero CSS purity issues")
}

const packageJson = JSON.parse(read(path.join(opsRoot, "package.json")) || "{}")
const expectedScripts = {
  "revenue-command-center:phase12:ledgers": "node scripts/generate-revenue-command-center-phase12-ledgers.mjs",
  "revenue-command-center:phase12:verify": "node scripts/verify-revenue-command-center-final-certification-phase12.mjs",
  "revenue-command-center:phase12:typecheck": "tsc -p tsconfig.revenue-command-center-phase12.json --pretty false",
  "revenue-command-center:phase12:smoke": "node scripts/smoke-revenue-command-center-phase12.mjs",
  "revenue-command-center:phase12:visual": "node scripts/capture-revenue-command-center-phase12-visual-evidence.mjs",
}
for (const [name, command] of Object.entries(expectedScripts)) pass(packageJson.scripts?.[name] === command, `package.json exposes ${name}`)

const phase12MigrationFiles = walk(path.join(opsRoot, "supabase", "migrations"), (file) => /20260727.*phase12|phase12.*final.*certification/i.test(path.basename(file)) && file.endsWith(".sql"))
pass(phase12MigrationFiles.length === 0, "Phase 12 introduces no new migration or database architecture")

console.log(`\n${checks - failures.length}/${checks} Phase 12 static certification checks passed.`)
if (failures.length) {
  console.error(`\n${failures.length} failure(s):`)
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log("PASS: Revenue Command Center Mega ZIP 12 is statically accepted. Live Vercel Preview and authenticated runtime evidence remain separate authority gates.")
