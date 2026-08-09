#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"

const args = process.argv.slice(2)
const value = (name, fallback) => {
  const index = args.indexOf(name)
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback
}
const opsRoot = path.resolve(value("--ops-root", process.cwd()))
const outputRoot = path.resolve(value("--output", path.join(opsRoot, ".phase12-certification")))
const routeRoot = path.join(opsRoot, "app", "(protected)", "revenue-command-center")
const apiRoot = path.join(opsRoot, "app", "api", "revenue-command-center")
const componentRoot = path.join(opsRoot, "components", "revenue-command-center")
const generatedAt = new Date().toISOString()

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
const rel = (file) => path.relative(opsRoot, file).split(path.sep).join("/")
const sha = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex")
const routeFromPage = (file) => {
  const relative = path.relative(routeRoot, path.dirname(file)).split(path.sep).join("/")
  return `/revenue-command-center${relative ? `/${relative}` : ""}`
}
const familyFromRoute = (route) => route.replace(/^\/revenue-command-center\/?/, "").split("/")[0] || "executive"
const csv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`

if (!fs.existsSync(routeRoot)) throw new Error(`Revenue route root missing: ${routeRoot}`)
fs.mkdirSync(outputRoot, { recursive: true })

const routeFiles = walk(routeRoot, (file) => file.endsWith(`${path.sep}page.tsx`)).sort()
const routeRows = routeFiles.map((file, index) => {
  const source = fs.readFileSync(file, "utf8")
  const route = routeFromPage(file)
  const imports = [...source.matchAll(/^import\s+(.+?)\s+from\s+["']([^"']+)["']/gm)].map((match) => `${match[1].trim()} from ${match[2]}`)
  const dynamic = route.includes("[")
  const redirected = /\bredirect\s*\(/.test(source)
  const defaultExport = /export\s+default\s+(?:async\s+)?function|export\s+default\s+[A-Za-z_$]/.test(source)
  const placeholderMarkers = ["Canonical Transition Workspace", "BUILD RESTORED", "next phase will replace", "placeholder", "TODO"].filter((marker) => source.toLowerCase().includes(marker.toLowerCase()))
  const genericImport = imports.some((item) => /RevenueCommandFinalWorkspace|UltimateRevenueCommandPage|CanonicalRevenueWorkspace/.test(item))
  let classification = "STATIC_ACCEPTED"
  if (!defaultExport) classification = "FAILED_NO_DEFAULT_EXPORT"
  else if (placeholderMarkers.length) classification = "FAILED_PLACEHOLDER"
  else if (redirected) classification = "INTENTIONAL_REDIRECT_REQUIRES_RUNTIME"
  else if (dynamic) classification = "STATIC_ACCEPTED_DYNAMIC_RUNTIME_REQUIRED"
  return {
    index: index + 1,
    route,
    family: familyFromRoute(route),
    file: rel(file),
    sha256: sha(file),
    dynamic,
    redirected,
    genericImport,
    imports,
    defaultExport,
    placeholderMarkers,
    classification,
    runtimeStatus: "PENDING_AUTHENTICATED_PREVIEW",
  }
})

const apiFiles = walk(apiRoot, (file) => file.endsWith(`${path.sep}route.ts`)).sort()
const apiRows = apiFiles.map((file, index) => {
  const source = fs.readFileSync(file, "utf8")
  const relative = path.relative(path.join(opsRoot, "app", "api"), path.dirname(file)).split(path.sep).join("/")
  const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"].filter((method) => new RegExp(`export\\s+(?:async\\s+)?function\\s+${method}\\b|export\\s+const\\s+${method}\\b`).test(source))
  const authHints = ["getUser", "require", "authorize", "permission", "service_role", "revenueClient", "createClient"].filter((hint) => source.includes(hint))
  return {
    index: index + 1,
    route: `/api/${relative}`,
    file: rel(file),
    methods,
    authHints,
    sha256: sha(file),
    status: methods.length ? "STATIC_ACCEPTED_RUNTIME_REQUIRED" : "REVIEW_NO_EXPORTED_METHOD",
  }
})

const cssFiles = walk(componentRoot, (file) => file.endsWith(".module.css"))
const cssIssues = []
for (const file of cssFiles) {
  const source = fs.readFileSync(file, "utf8")
  const selectorRegex = /(^|\})(\s*)([^@{}][^{}]*)\{/gm
  for (const match of source.matchAll(selectorRegex)) {
    const selector = match[3].trim()
    if (!selector) continue
    for (const part of selector.split(",").map((item) => item.trim())) {
      const globalLike = /^(?:\*|html\b|body\b)/.test(part)
      const localAnchor = /\.[A-Za-z_-]|#[A-Za-z_-]/.test(part)
      if (globalLike && !part.includes(":global") && !localAnchor) cssIssues.push({ file: rel(file), selector })
    }
  }
}

const allComponentFiles = walk(componentRoot, (file) => /\.(?:ts|tsx)$/.test(file))
const interactionRows = []
for (const file of allComponentFiles) {
  const source = fs.readFileSync(file, "utf8")
  const modalCount = (source.match(/\b(?:Modal|Dialog)\b/g) || []).length
  const drawerCount = (source.match(/\bDrawer\b/g) || []).length
  const buttonCount = (source.match(/<button\b/g) || []).length
  const formCount = (source.match(/<form\b/g) || []).length
  if (modalCount || drawerCount || buttonCount || formCount) interactionRows.push({ file: rel(file), modalCount, drawerCount, buttonCount, formCount })
}

const genericRoutes = routeRows.filter((row) => row.genericImport).map((row) => row.route)
const summary = {
  generatedAt,
  opsRoot,
  routes: routeRows.length,
  routeTarget: 151,
  routeCountPass: routeRows.length === 151,
  staticAccepted: routeRows.filter((row) => row.classification.startsWith("STATIC_ACCEPTED")).length,
  redirects: routeRows.filter((row) => row.redirected).length,
  dynamicRoutes: routeRows.filter((row) => row.dynamic).length,
  placeholderFailures: routeRows.filter((row) => row.placeholderMarkers.length).length,
  genericRouteImports: genericRoutes.length,
  apiRoutes: apiRows.length,
  cssModules: cssFiles.length,
  cssPurityIssues: cssIssues.length,
  interactionFiles: interactionRows.length,
  runtimeAuthority: "Vercel Preview + authenticated smoke testing",
}

fs.writeFileSync(path.join(outputRoot, "REVENUE_COMMAND_CENTER_PHASE12_ROUTE_LEDGER.json"), JSON.stringify({ summary, routes: routeRows }, null, 2) + "\n")
fs.writeFileSync(path.join(outputRoot, "REVENUE_COMMAND_CENTER_PHASE12_API_INVENTORY.json"), JSON.stringify({ generatedAt, count: apiRows.length, routes: apiRows }, null, 2) + "\n")
fs.writeFileSync(path.join(outputRoot, "REVENUE_COMMAND_CENTER_PHASE12_INTERACTION_INVENTORY.json"), JSON.stringify({ generatedAt, count: interactionRows.length, files: interactionRows }, null, 2) + "\n")
fs.writeFileSync(path.join(outputRoot, "REVENUE_COMMAND_CENTER_PHASE12_CSS_PURITY.json"), JSON.stringify({ generatedAt, files: cssFiles.length, issues: cssIssues }, null, 2) + "\n")
fs.writeFileSync(path.join(outputRoot, "REVENUE_COMMAND_CENTER_PHASE12_ROUTE_LEDGER.csv"), [
  ["index", "route", "family", "dynamic", "redirected", "generic_import", "classification", "runtime_status", "file", "sha256"].map(csv).join(","),
  ...routeRows.map((row) => [row.index, row.route, row.family, row.dynamic, row.redirected, row.genericImport, row.classification, row.runtimeStatus, row.file, row.sha256].map(csv).join(",")),
].join("\n") + "\n")

const md = [
  "# ANGELCARE Revenue Command Center — Mega ZIP 12 Route Ledger",
  "",
  `Generated: ${generatedAt}`,
  "",
  `- Routes discovered: **${summary.routes}/151**`,
  `- Static route count gate: **${summary.routeCountPass ? "PASS" : "FAIL"}**`,
  `- Static accepted route files: **${summary.staticAccepted}**`,
  `- Dynamic routes requiring live IDs: **${summary.dynamicRoutes}**`,
  `- Intentional redirects requiring runtime confirmation: **${summary.redirects}**`,
  `- Placeholder failures: **${summary.placeholderFailures}**`,
  `- CSS Module purity issues: **${summary.cssPurityIssues}**`,
  `- API routes inventoried: **${summary.apiRoutes}**`,
  "",
  "> Static acceptance is not production certification. Every route remains pending authenticated Vercel Preview runtime evidence until the Phase 12 smoke ledger is completed.",
  "",
  "| # | Route | Family | Static classification | Runtime status |",
  "|---:|---|---|---|---|",
  ...routeRows.map((row) => `| ${row.index} | \`${row.route}\` | ${row.family} | ${row.classification} | ${row.runtimeStatus} |`),
  "",
].join("\n")
fs.writeFileSync(path.join(outputRoot, "REVENUE_COMMAND_CENTER_PHASE12_ROUTE_LEDGER.md"), md)

const apiMd = [
  "# Revenue Command Center — Phase 12 API Inventory",
  "",
  `Generated: ${generatedAt}`,
  "",
  `API routes discovered: **${apiRows.length}**`,
  "",
  "| # | API | Methods | Static status | File |",
  "|---:|---|---|---|---|",
  ...apiRows.map((row) => `| ${row.index} | \`${row.route}\` | ${row.methods.join(", ") || "—"} | ${row.status} | \`${row.file}\` |`),
  "",
].join("\n")
fs.writeFileSync(path.join(outputRoot, "REVENUE_COMMAND_CENTER_PHASE12_API_INVENTORY.md"), apiMd)

const htmlRows = routeRows.map((row) => `<tr><td>${row.index}</td><td><code>${row.route}</code></td><td>${row.family}</td><td><span class="status ${row.classification.includes("FAILED") ? "fail" : "pass"}">${row.classification}</span></td><td>${row.runtimeStatus}</td></tr>`).join("")
const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ANGELCARE MZ12 Certification</title><style>body{margin:0;background:#f4f8fc;color:#17324d;font-family:Inter,Arial,sans-serif}.wrap{max-width:1500px;margin:auto;padding:28px}.hero{background:white;border:1px solid #dbe7f1;border-radius:28px;padding:28px;box-shadow:0 18px 55px #31506d18}.hero h1{font-size:36px;margin:8px 0}.hero p{color:#637a90}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin:18px 0}.card{background:white;border:1px solid #dce7f0;border-radius:18px;padding:18px}.card span{font-size:11px;text-transform:uppercase;color:#73889d}.card strong{display:block;font-size:28px;margin-top:5px}.table{background:white;border:1px solid #dbe7f1;border-radius:22px;overflow:auto}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:12px;border-bottom:1px solid #e7eef5;font-size:12px}th{background:#edf5fb;position:sticky;top:0}.status{display:inline-block;padding:5px 8px;border-radius:999px;background:#ecfdf5;color:#08765a;font-weight:800;font-size:9px}.status.fail{background:#fff1f2;color:#b7172d}code{font-size:11px}@media(max-width:800px){.grid{grid-template-columns:repeat(2,1fr)}.wrap{padding:12px}.hero h1{font-size:27px}}</style></head><body><main class="wrap"><section class="hero"><small>ANGELCARE · SANILA REVENUE OS</small><h1>Mega ZIP 12 — Certification 151/151</h1><p>Preuve statique générée depuis le dépôt. La certification runtime reste soumise au Preview Vercel authentifié.</p></section><section class="grid"><div class="card"><span>Routes</span><strong>${summary.routes}/151</strong></div><div class="card"><span>APIs</span><strong>${summary.apiRoutes}</strong></div><div class="card"><span>Dynamiques</span><strong>${summary.dynamicRoutes}</strong></div><div class="card"><span>CSS issues</span><strong>${summary.cssPurityIssues}</strong></div><div class="card"><span>Placeholders</span><strong>${summary.placeholderFailures}</strong></div></section><section class="table"><table><thead><tr><th>#</th><th>Route</th><th>Famille</th><th>Statique</th><th>Runtime</th></tr></thead><tbody>${htmlRows}</tbody></table></section></main></body></html>`
fs.writeFileSync(path.join(outputRoot, "REVENUE_COMMAND_CENTER_PHASE12_CERTIFICATION_DASHBOARD.html"), html)

console.log(JSON.stringify(summary, null, 2))
if (!summary.routeCountPass || summary.placeholderFailures || summary.cssPurityIssues) process.exitCode = 1
