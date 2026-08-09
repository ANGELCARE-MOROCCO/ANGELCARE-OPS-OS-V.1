#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
import { chromium } from "playwright"

const args = process.argv.slice(2)
const value = (name, fallback) => {
  const index = args.indexOf(name)
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback
}
const strict = args.includes("--strict")
const opsRoot = path.resolve(value("--ops-root", process.cwd()))
const baseUrl = String(value("--base-url", process.env.PHASE12_BASE_URL || "")).replace(/\/$/, "")
const outputRoot = path.resolve(value("--output", path.join(opsRoot, ".phase12-visual-evidence")))
const cookie = process.env.PHASE12_COOKIE || ""
const dynamicIds = JSON.parse(process.env.PHASE12_DYNAMIC_IDS_JSON || "{}")
const routeRoot = path.join(opsRoot, "app", "(protected)", "revenue-command-center")
if (!baseUrl) throw new Error("Missing --base-url or PHASE12_BASE_URL")

const walk = (root) => fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
  const file = path.join(root, entry.name)
  return entry.isDirectory() ? walk(file) : file.endsWith(`${path.sep}page.tsx`) ? [file] : []
})
const routeFromPage = (file) => {
  const relative = path.relative(routeRoot, path.dirname(file)).split(path.sep).join("/")
  return `/revenue-command-center${relative ? `/${relative}` : ""}`
}
const resolveRoute = (route) => {
  let resolved = route
  const missing = []
  for (const match of route.matchAll(/\[([^\]]+)\]/g)) {
    const name = match[1]
    const id = dynamicIds[`${route}:${name}`] ?? dynamicIds[name]
    if (!id) missing.push(name)
    else resolved = resolved.replace(`[${name}]`, encodeURIComponent(String(id)))
  }
  return { resolved, missing }
}
const safeName = (route) => route.replace(/^\//, "").replaceAll("/", "__").replaceAll("[", "_").replaceAll("]", "_") || "root"
const viewports = [
  { key: "desktop", width: 1440, height: 1100 },
  { key: "tablet", width: 1024, height: 1366 },
  { key: "mobile", width: 390, height: 844 },
]

fs.mkdirSync(outputRoot, { recursive: true })
const routes = walk(routeRoot).map(routeFromPage).sort()
const browser = await chromium.launch({ headless: true })
const results = []
try {
  for (const viewport of viewports) {
    const dir = path.join(outputRoot, viewport.key)
    fs.mkdirSync(dir, { recursive: true })
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, extraHTTPHeaders: cookie ? { Cookie: cookie } : {} })
    const page = await context.newPage()
    for (const route of routes) {
      const { resolved, missing } = resolveRoute(route)
      if (missing.length) {
        results.push({ route, viewport: viewport.key, status: "BLOCKED_DYNAMIC_ID", detail: missing.join(", ") })
        continue
      }
      const target = `${baseUrl}${resolved}`
      const destination = path.join(dir, `${safeName(route)}.png`)
      try {
        const response = await page.goto(target, { waitUntil: "domcontentloaded", timeout: 45000 })
        await page.waitForTimeout(1200)
        const body = await page.locator("body").innerText().catch(() => "")
        const failed = !response || response.status() >= 500 || /Application error|Internal Server Error|Unhandled Runtime Error/i.test(body)
        if (failed) results.push({ route, resolved, viewport: viewport.key, status: "FAILED_RUNTIME", http: response?.status() ?? null, target })
        else {
          await page.screenshot({ path: destination, fullPage: true })
          results.push({ route, resolved, viewport: viewport.key, status: "PASS_SCREENSHOT", http: response.status(), target, file: path.relative(outputRoot, destination) })
        }
      } catch (error) {
        results.push({ route, resolved, viewport: viewport.key, status: "FAILED_CAPTURE", target, detail: error instanceof Error ? error.message : String(error) })
      }
    }
    await context.close()
  }
} finally {
  await browser.close()
}
const counts = results.reduce((acc, row) => { acc[row.status] = (acc[row.status] || 0) + 1; return acc }, {})
const summary = { generatedAt: new Date().toISOString(), baseUrl, routes: routes.length, viewports: viewports.length, expectedScreenshots: routes.length * viewports.length, counts, status: results.every((row) => row.status === "PASS_SCREENSHOT") ? "PASS" : "INCOMPLETE_OR_FAILED" }
fs.writeFileSync(path.join(outputRoot, "VISUAL_EVIDENCE_MANIFEST.json"), JSON.stringify({ summary, results }, null, 2) + "\n")
fs.writeFileSync(path.join(outputRoot, "VISUAL_EVIDENCE_SUMMARY.md"), ["# Phase 12 Visual Evidence", "", `Preview: ${baseUrl}`, `Status: **${summary.status}**`, `Expected captures: ${summary.expectedScreenshots}`, "", ...Object.entries(counts).map(([key, count]) => `- ${key}: ${count}`), ""].join("\n"))
console.log(JSON.stringify(summary, null, 2))
if (strict && summary.status !== "PASS") process.exit(1)
