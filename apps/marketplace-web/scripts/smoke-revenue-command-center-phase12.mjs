#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const args = process.argv.slice(2)
const value = (name, fallback) => {
  const index = args.indexOf(name)
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback
}
const strict = args.includes("--strict")
const opsRoot = path.resolve(value("--ops-root", process.cwd()))
const baseUrl = String(value("--base-url", process.env.PHASE12_BASE_URL || "")).replace(/\/$/, "")
const outputRoot = path.resolve(value("--output", path.join(opsRoot, ".phase12-runtime")))
const cookie = process.env.PHASE12_COOKIE || ""
const routeRoot = path.join(opsRoot, "app", "(protected)", "revenue-command-center")
const dynamicIds = JSON.parse(process.env.PHASE12_DYNAMIC_IDS_JSON || "{}")
const timeoutMs = Number(process.env.PHASE12_SMOKE_TIMEOUT_MS || 30000)

if (!baseUrl) {
  console.error("ERROR: Missing --base-url or PHASE12_BASE_URL.")
  process.exit(1)
}

const walk = (root) => {
  const out = []
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name)
    if (entry.isDirectory()) out.push(...walk(file))
    else if (file.endsWith(`${path.sep}page.tsx`)) out.push(file)
  }
  return out
}
const routeFromPage = (file) => {
  const relative = path.relative(routeRoot, path.dirname(file)).split(path.sep).join("/")
  return `/revenue-command-center${relative ? `/${relative}` : ""}`
}
const resolveDynamic = (route) => {
  let resolved = route
  const missing = []
  for (const match of route.matchAll(/\[([^\]]+)\]/g)) {
    const name = match[1]
    const scopedKey = `${route}:${name}`
    const id = dynamicIds[scopedKey] ?? dynamicIds[name]
    if (!id) missing.push(name)
    else resolved = resolved.replace(`[${name}]`, encodeURIComponent(String(id)))
  }
  return { resolved, missing }
}
const fetchWithTimeout = async (url) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      redirect: "manual",
      headers: {
        accept: "text/html,application/xhtml+xml",
        ...(cookie ? { cookie } : {}),
        "user-agent": "ANGELCARE-Phase12-Certification/1.0",
      },
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

fs.mkdirSync(outputRoot, { recursive: true })
const routes = walk(routeRoot).map(routeFromPage).sort()
const rows = []
for (let index = 0; index < routes.length; index += 1) {
  const route = routes[index]
  const { resolved, missing } = resolveDynamic(route)
  if (missing.length) {
    rows.push({ index: index + 1, route, resolved: null, status: "BLOCKED_DYNAMIC_ID", http: null, finalUrl: null, detail: `Missing ID mapping: ${missing.join(", ")}` })
    console.log(`BLOCKED ${route} — missing ${missing.join(", ")}`)
    continue
  }
  const url = `${baseUrl}${resolved}`
  try {
    const response = await fetchWithTimeout(url)
    const text = await response.text()
    const loginRedirect = [301, 302, 303, 307, 308].includes(response.status) && /login|sign-in|auth/i.test(response.headers.get("location") || "")
    const applicationError = /Application error|Internal Server Error|Unhandled Runtime Error|NEXT_NOT_FOUND/i.test(text)
    const status = loginRedirect ? "BLOCKED_AUTH" : response.status >= 500 || applicationError ? "FAILED_RUNTIME" : response.status === 404 ? "FAILED_404" : "PASS_HTTP"
    rows.push({ index: index + 1, route, resolved, status, http: response.status, finalUrl: url, location: response.headers.get("location"), detail: applicationError ? "Runtime error marker detected" : loginRedirect ? "Authentication cookie missing or invalid" : "HTTP response accepted" })
    console.log(`${status.padEnd(16)} ${String(response.status).padEnd(4)} ${route}`)
  } catch (error) {
    rows.push({ index: index + 1, route, resolved, status: "FAILED_NETWORK", http: null, finalUrl: url, detail: error instanceof Error ? error.message : String(error) })
    console.log(`FAILED_NETWORK   ---- ${route}`)
  }
}

const counts = rows.reduce((acc, row) => { acc[row.status] = (acc[row.status] || 0) + 1; return acc }, {})
const summary = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  authenticatedCookieProvided: Boolean(cookie),
  routes: rows.length,
  target: 151,
  counts,
  strict,
  status: rows.every((row) => row.status === "PASS_HTTP") ? "PASS" : "INCOMPLETE_OR_FAILED",
}
fs.writeFileSync(path.join(outputRoot, "REVENUE_COMMAND_CENTER_PHASE12_RUNTIME_LEDGER.json"), JSON.stringify({ summary, routes: rows }, null, 2) + "\n")
const md = [
  "# Revenue Command Center — Phase 12 Runtime Ledger",
  "",
  `Generated: ${summary.generatedAt}`,
  `Preview: ${baseUrl}`,
  `Authentication cookie supplied: ${summary.authenticatedCookieProvided ? "yes" : "no"}`,
  `Overall runtime status: **${summary.status}**`,
  "",
  ...Object.entries(counts).map(([key, count]) => `- ${key}: **${count}**`),
  "",
  "| # | Contract route | Resolved route | HTTP | Runtime status | Detail |",
  "|---:|---|---|---:|---|---|",
  ...rows.map((row) => `| ${row.index} | \`${row.route}\` | ${row.resolved ? `\`${row.resolved}\`` : "—"} | ${row.http ?? "—"} | ${row.status} | ${String(row.detail).replaceAll("|", "\\|")} |`),
  "",
].join("\n")
fs.writeFileSync(path.join(outputRoot, "REVENUE_COMMAND_CENTER_PHASE12_RUNTIME_LEDGER.md"), md)
console.log(`\nRuntime ledger: ${outputRoot}`)
console.log(JSON.stringify(summary, null, 2))
if (strict && summary.status !== "PASS") process.exit(1)
