import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { spawnSync } from "node:child_process"

const root = process.cwd()
const startedAt = new Date().toISOString()
const proofDir = path.join(root, "artifacts")
const proofFile = path.join(proofDir, "revenue-command-center-phase10-build-proof.json")
const results = []

function fail(message) {
  if (fs.existsSync(proofFile)) fs.rmSync(proofFile, { force: true })
  console.error(`\nRELEASE BLOCKED — ${message}\n`)
  process.exit(1)
}
function command(label, executable, args, { env = {} } = {}) {
  console.log(`\n=== ${label} ===`)
  const result = spawnSync(executable, args, { cwd: root, stdio: "inherit", env: { ...process.env, ...env }, shell: false })
  const status = result.status ?? 1
  results.push({ label, command: [executable, ...args].join(" "), status })
  if (status !== 0) fail(`${label} failed with exit code ${status}. Do not deploy.`)
}
function versionAtLeast(current, minimum) {
  const parse = (value) => value.replace(/^v/, "").split(".").map(Number)
  const a = parse(current), b = parse(minimum)
  for (let i = 0; i < 3; i += 1) {
    if ((a[i] || 0) > (b[i] || 0)) return true
    if ((a[i] || 0) < (b[i] || 0)) return false
  }
  return true
}
function hashFile(relative) {
  const absolute = path.join(root, relative)
  return fs.existsSync(absolute) ? crypto.createHash("sha256").update(fs.readFileSync(absolute)).digest("hex") : null
}
function walk(directory, output = []) {
  if (!fs.existsSync(directory)) return output
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git"].includes(entry.name)) continue
    const absolute = path.join(directory, entry.name)
    entry.isDirectory() ? walk(absolute, output) : output.push(absolute)
  }
  return output
}
function splitTopLevel(value, delimiter = ",") {
  const output = []
  let depth = 0, quote = "", current = ""
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]
    if (quote) {
      current += character
      if (character === quote && value[index - 1] !== "\\") quote = ""
      continue
    }
    if (character === "\"" || character === "'") { quote = character; current += character; continue }
    if (character === "(" || character === "[") depth += 1
    if (character === ")" || character === "]") depth = Math.max(0, depth - 1)
    if (character === delimiter && depth === 0) { output.push(current.trim()); current = ""; continue }
    current += character
  }
  if (current.trim()) output.push(current.trim())
  return output
}
function selectorBlocks(source) {
  const cleaned = source.replace(/\/\*[\s\S]*?\*\//g, "")
  const selectors = []
  let depth = 0, quote = "", start = 0
  for (let index = 0; index < cleaned.length; index += 1) {
    const character = cleaned[index]
    if (quote) {
      if (character === quote && cleaned[index - 1] !== "\\") quote = ""
      continue
    }
    if (character === "\"" || character === "'") { quote = character; continue }
    if (character === "{") {
      if (depth === 0) {
        const selector = cleaned.slice(start, index).trim().replace(/^.*\}/s, "").trim()
        if (selector && !selector.startsWith("@") && !/^(from|to|\d+(?:\.\d+)?%)$/.test(selector)) selectors.push(selector)
      }
      depth += 1
    } else if (character === "}") {
      depth = Math.max(0, depth - 1)
      if (depth === 0) start = index + 1
    }
  }
  return selectors
}

if (!versionAtLeast(process.version, "22.17.0")) fail(`Node ${process.version} is below v22.17.0. Use Node 22.17+ or Node 24.`)
if (!fs.existsSync(path.join(root, "node_modules", ".bin", "next"))) fail("Dependencies are incomplete. Run npm ci successfully first.")
for (const envFile of [".env", ".env.local", ".env.production.local"]) {
  const absolute = path.join(root, envFile)
  if (fs.existsSync(absolute) && typeof process.loadEnvFile === "function") process.loadEnvFile(absolute)
}
for (const envName of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
  if (!String(process.env[envName] || "").trim()) fail(`${envName} is required for protected Phase 10 server operations.`)
}

const verifiers = [
  "scripts/verify-revenue-command-center-uiux-excellence.mjs",
  "scripts/verify-revenue-command-center-prospect-enterprise-phase2.mjs",
  "scripts/verify-revenue-command-center-execution-enterprise-phase4.mjs",
  "scripts/verify-revenue-command-center-engagement-enterprise-phase5.mjs",
  "scripts/verify-revenue-command-center-proposal-enterprise-phase6.mjs",
  "scripts/verify-revenue-command-center-contract-enterprise-phase7.mjs",
  "scripts/verify-revenue-command-center-partnership-enterprise-phase8.mjs",
  "scripts/verify-revenue-command-center-b2c-enterprise-phase9.mjs",
  "scripts/verify-revenue-command-center-campaign-enterprise-phase10.mjs",
]
for (const verifier of verifiers) command(`Static acceptance: ${path.basename(verifier)}`, process.execPath, [verifier])
command("Focused Phase 10 TypeScript", "npx", ["tsc", "-p", "tsconfig.revenue-command-center-campaign-phase10.json", "--pretty", "false"])

console.log("\n=== CSS Module heuristic (warning-only) ===")
const suspicious = []
for (const cssFile of [...walk(path.join(root, "app")), ...walk(path.join(root, "components"))].filter((entry) => entry.endsWith(".module.css"))) {
  const source = fs.readFileSync(cssFile, "utf8")
  for (const selector of selectorBlocks(source)) {
    for (const branch of splitTopLevel(selector)) {
      const withoutGlobal = branch.replace(/:global\((?:[^()]|\([^()]*\))*\)/g, "")
      if (withoutGlobal && !/[.#][A-Za-z_][\w-]*/.test(withoutGlobal)) suspicious.push(`${path.relative(root, cssFile)} :: ${branch}`)
    }
  }
}
if (suspicious.length) {
  console.warn(`WARN CSS heuristic found ${suspicious.length} suspicious branch(es). This scan is non-authoritative.`)
  suspicious.slice(0, 20).forEach((item) => console.warn(`CSS-HEURISTIC ${item}`))
} else {
  console.log("PASS CSS heuristic found 0 suspicious branches")
}
results.push({ label: "CSS Module heuristic", status: 0, warningCount: suspicious.length, authoritative: false })

fs.rmSync(path.join(root, ".next"), { recursive: true, force: true })
command("Exact Next.js production compilation", "npm", ["run", "build"], { env: { NEXT_TELEMETRY_DISABLED: "1" } })

fs.mkdirSync(proofDir, { recursive: true })
const git = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" })
const npmVersion = spawnSync("npm", ["--version"], { cwd: root, encoding: "utf8" }).stdout?.trim() || "unknown"
const proof = {
  status: "PASSED",
  phase: "Revenue Command Center — Mega ZIP 10 Campaign / SDR / Attribution",
  startedAt,
  completedAt: new Date().toISOString(),
  node: process.version,
  npm: npmVersion,
  gitCommit: git.status === 0 ? git.stdout.trim() : null,
  packageLockSha256: hashFile("package-lock.json"),
  migrationSha256: hashFile("supabase/migrations/20260726_0800_revenue_campaign_sdr_attribution_completion.sql"),
  checks: results,
  buildCommand: "npm run build",
}
fs.writeFileSync(proofFile, JSON.stringify(proof, null, 2) + "\n")
console.log(`\nRELEASE GATE PASSED. Build proof: ${path.relative(root, proofFile)}`)
console.log("This commit is eligible for deployment.\n")
