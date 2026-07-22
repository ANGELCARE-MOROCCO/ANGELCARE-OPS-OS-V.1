import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const deploymentDir = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(deploymentDir, "../..")
let failures = 0

function ok(message) { console.log(`OK  ${message}`) }
function fail(message) { failures += 1; console.error(`FAIL ${message}`) }
function requireFile(relative) {
  const target = path.join(appRoot, relative)
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) fail(`missing ${relative}`)
  else ok(`present ${relative}`)
  return target
}
function read(relative) { return fs.readFileSync(path.join(appRoot, relative), "utf8") }
function sha256(target) { return crypto.createHash("sha256").update(fs.readFileSync(target)).digest("hex") }
function assertIncludes(text, token, message) { text.includes(token) ? ok(message) : fail(message) }
function assertNotIncludes(text, token, message) { !text.includes(token) ? ok(message) : fail(message) }

console.log("AngelCare Market OS Ambassadors — Settings Control Center static verification")

const required = [
  "app/(protected)/market-os/ambassadors/settings/page.tsx",
  "components/market-os/ambassadors/settings/AmbassadorSettingsControlCenter.tsx",
  "lib/market-os/ambassadors/settings/contracts.ts",
  "lib/market-os/ambassadors/settings/defaults.ts",
  "lib/market-os/ambassadors/settings/validation.ts",
  "lib/market-os/ambassadors/settings/runtime.ts",
  "lib/market-os/ambassadors/settings/server.ts",
  "lib/market-os/ambassadors/settings/client.ts",
  "database/market-os-ambassadors/20260721_market_os_ambassador_settings_control_center.sql",
  "database/market-os-ambassadors/20260721_market_os_ambassador_settings_control_center.rollback.sql",
]
for (const item of required) requireFile(item)

const page = read("app/(protected)/market-os/ambassadors/settings/page.tsx")
assertIncludes(page, "AmbassadorSettingsControlCenter", "settings route mounts purpose-built control center")
assertNotIncludes(page, "AmbassadorProductionWorkspace", "settings route no longer mounts generic workspace")

const settingsUi = read("components/market-os/ambassadors/settings/AmbassadorSettingsControlCenter.tsx")
for (const domain of ["program", "recruitment", "onboarding", "training", "territories", "missions", "attribution", "rewards", "kpis", "communications", "governance", "versions"]) {
  assertIncludes(settingsUi, `key: "${domain}"`, `structured UI domain ${domain}`)
}
assertNotIncludes(settingsUi, "font-mono", "settings UI does not expose raw JSON editors")

const apiRoot = path.join(appRoot, "app/api/market-os/ambassadors/settings")
const routeFiles = []
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.name === "route.ts") routeFiles.push(full)
  }
}
walk(apiRoot)
if (routeFiles.length >= 11) ok(`${routeFiles.length} settings API route files found`)
else fail(`expected at least 11 settings API route files, found ${routeFiles.length}`)
for (const route of routeFiles) {
  const source = fs.readFileSync(route, "utf8")
  const relative = path.relative(appRoot, route)
  source.includes("withAmbassadorActor") ? ok(`actor-protected ${relative}`) : fail(`missing actor boundary ${relative}`)
}

const server = read("lib/market-os/ambassadors/settings/server.ts")
for (const permission of ["settings.draft", "settings.validate", "settings.submit", "settings.approve", "settings.publish", "settings.rollback", "settings.runtime"]) {
  assertIncludes(server, permission, `server enforces ${permission}`)
}
assertIncludes(server, "separationOfDutiesRequired", "server enforces finance/compliance separation of duties")
assertNotIncludes(server, "readLocalStore", "no local settings persistence fallback")
assertNotIncludes(server, "writeLocalStore", "no false-success local settings write")

const legacyServer = read("lib/market-os/ambassadors/server.ts")
assertIncludes(legacyServer, "Direct settings updates are retired", "legacy direct settings mutation is fail-closed")
assertIncludes(legacyServer, "getEffectiveAmbassadorSettingsConfiguration", "operational server consumes effective published policy")

const sql = read("database/market-os-ambassadors/20260721_market_os_ambassador_settings_control_center.sql")
const rollback = read("database/market-os-ambassadors/20260721_market_os_ambassador_settings_control_center.rollback.sql")
if ((sql.match(/\$\$/g) || []).length % 2 === 0) ok("SQL dollar-quoted bodies are balanced")
else fail("SQL dollar-quoted bodies are unbalanced")
if ((sql.match(/^begin;\s*$/gmi) || []).length === 1 && (sql.match(/^commit;\s*$/gmi) || []).length === 1) ok("SQL has one additive transaction boundary")
else fail("SQL transaction boundary is invalid")
for (const table of [
  "market_os_ambassador_settings_versions",
  "market_os_ambassador_settings_approvals",
  "market_os_ambassador_settings_active_scopes",
  "market_os_ambassador_settings_publications",
  "market_os_ambassador_settings_runtime_events",
]) assertIncludes(sql, table, `SQL contains ${table}`)
for (const rpc of [
  "market_os_ambassador_submit_settings_version",
  "market_os_ambassador_decide_settings_approval",
  "market_os_ambassador_schedule_settings_version",
  "market_os_ambassador_publish_settings_version",
  "market_os_ambassador_rollback_settings_version",
]) {
  assertIncludes(sql, rpc, `SQL contains transactional RPC ${rpc}`)
  assertIncludes(rollback, rpc, `rollback removes ${rpc}`)
}
for (const operation of ["settings_submit", "settings_approval", "settings_schedule", "settings_publish", "settings_rollback"]) {
  assertIncludes(sql, operation, `SQL persists idempotency for ${operation}`)
}
if (/grant\s+(insert|update|delete|all)[^;]*authenticated/gi.test(sql)) fail("SQL grants mutating settings access to authenticated browser clients")
else ok("browser-authenticated settings access is SELECT-only")
assertIncludes(sql, "settings runtime events are immutable", "SQL protects immutable runtime evidence")
assertIncludes(rollback, "Rollback blocked", "destructive rollback is guarded")

const frozenPath = path.join(deploymentDir, "FROZEN_UI_BASELINE_SHA256.json")
const frozen = JSON.parse(fs.readFileSync(frozenPath, "utf8"))
const authorized = new Set(["apps/ops-web/app/(protected)/market-os/ambassadors/settings/page.tsx"])
let checked = 0
for (const [repositoryPath, metadata] of Object.entries(frozen)) {
  if (authorized.has(repositoryPath)) continue
  const relative = repositoryPath.replace(/^apps\/ops-web\//, "")
  const target = path.join(appRoot, relative)
  if (!fs.existsSync(target)) { fail(`frozen UI file missing ${relative}`); continue }
  const expected = typeof metadata === "string" ? metadata : metadata.sha256
  if (sha256(target) !== expected) fail(`unauthorized frozen UI change ${relative}`)
  else checked += 1
}
if (checked > 0) ok(`${checked} non-settings Ambassador TSX files remain byte-identical`)

function findTsc() {
  const candidates = [
    path.join(appRoot, "node_modules/.bin/tsc"),
    path.resolve(appRoot, "../../node_modules/.bin/tsc"),
    "tsc",
  ]
  for (const candidate of candidates) {
    const probe = spawnSync(candidate, ["--version"], { encoding: "utf8", shell: false })
    if (probe.status === 0) return candidate
  }
  return null
}
const tsc = findTsc()
if (!tsc) fail("TypeScript compiler not found; no dependency installation was attempted")
else {
  for (const config of ["tsconfig.backend.verify.json", "tsconfig.ui.verify.json"]) {
    const result = spawnSync(tsc, ["-p", path.join(deploymentDir, config), "--pretty", "false"], { cwd: appRoot, encoding: "utf8" })
    if (result.status === 0) ok(`TypeScript static verification passed: ${config}`)
    else {
      fail(`TypeScript static verification failed: ${config}`)
      if (result.stdout) console.error(result.stdout)
      if (result.stderr) console.error(result.stderr)
    }
  }
}

if (failures) {
  console.error(`\n${failures} verification failure(s)`)
  process.exit(1)
}
console.log("\nALL SETTINGS CONTROL CENTER STATIC CHECKS PASSED")
