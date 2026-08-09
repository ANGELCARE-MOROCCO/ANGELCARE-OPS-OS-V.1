import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { spawnSync } from "node:child_process"

const root = process.cwd()
const args = new Set(process.argv.slice(2))
const skipBuild = args.has("--skip-build")
const startedAt = new Date().toISOString()
const results = []

function run(label, command, commandArgs, options = {}) {
  console.log(`\n=== ${label} ===`)
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: undefined },
    ...options,
  })
  const status = result.status ?? 1
  results.push({ label, command: [command, ...commandArgs].join(" "), status })
  if (status !== 0) {
    console.error(`\nRELEASE GATE BLOCKED at: ${label}`)
    process.exit(status)
  }
}

function sha256(file) {
  if (!fs.existsSync(file)) return null
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex")
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
  "scripts/verify-revenue-command-center-executive-enterprise-phase11.mjs",
]

for (const verifier of verifiers) {
  if (!fs.existsSync(path.join(root, verifier))) {
    console.error(`Missing cumulative verifier: ${verifier}`)
    process.exit(1)
  }
  run(`Static acceptance: ${path.basename(verifier)}`, process.execPath, [verifier])
}

run(
  "Focused Phase 11 TypeScript",
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["tsc", "-p", "tsconfig.revenue-command-center-executive-phase11.json", "--pretty", "false"],
)

console.log("\n=== CSS Module heuristic (warning-only) ===")
const moduleCss = []
function walk(directory) {
  if (!fs.existsSync(directory)) return
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(target)
    else if (target.endsWith(".module.css")) moduleCss.push(target)
  }
}
walk(path.join(root, "components/revenue-command-center/executive-enterprise"))
const suspicious = []
for (const file of moduleCss) {
  const text = fs.readFileSync(file, "utf8")
  const branches = text.match(/(^|})\s*(button|a|input|select|textarea|table|h[1-6]|\[data-[^\]]+\])(?:[:\s,{>+~])/gm) || []
  for (const branch of branches) suspicious.push(`${path.relative(root,file)} :: ${branch.trim()}`)
}
if (suspicious.length) {
  console.warn(`WARN CSS heuristic found ${suspicious.length} suspicious branch(es). The Next.js compiler remains authoritative.`)
  for (const item of suspicious.slice(0,20)) console.warn(`CSS-HEURISTIC ${item}`)
} else {
  console.log("PASS CSS Module heuristic (0 suspicious branches)")
}
results.push({ label: "CSS Module heuristic", status: 0, suspicious: suspicious.length })

const artifactDirectory = path.join(root, "artifacts")
fs.mkdirSync(artifactDirectory, { recursive: true })

if (skipBuild) {
  const localProof = {
    phase: 11,
    classification: "local-static-only",
    deployable: false,
    reason: "The authoritative Next.js production compiler must run on remote Preview infrastructure.",
    startedAt,
    completedAt: new Date().toISOString(),
    node: process.version,
    npm: spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["-v"], { encoding: "utf8" }).stdout?.trim(),
    lockfileSha256: sha256(path.join(root, "package-lock.json")),
    results,
  }
  fs.writeFileSync(
    path.join(artifactDirectory, "revenue-command-center-phase11-local-proof.json"),
    JSON.stringify(localProof, null, 2),
  )
  console.log("\nLOCAL PHASE 11 GATES PASSED")
  console.log("Remote Preview compilation is still mandatory before deployment.")
  process.exit(0)
}

run("Exact Next.js production compilation", process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"])

const buildProof = {
  phase: 11,
  classification: "production-compiler-proof",
  deployable: true,
  startedAt,
  completedAt: new Date().toISOString(),
  node: process.version,
  npm: spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["-v"], { encoding: "utf8" }).stdout?.trim(),
  lockfileSha256: sha256(path.join(root, "package-lock.json")),
  gitCommit: spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).stdout?.trim() || null,
  results,
}
fs.writeFileSync(
  path.join(artifactDirectory, "revenue-command-center-phase11-build-proof.json"),
  JSON.stringify(buildProof, null, 2),
)
console.log("\nRELEASE GATE PASSED")
console.log("This commit is eligible for deployment.")
