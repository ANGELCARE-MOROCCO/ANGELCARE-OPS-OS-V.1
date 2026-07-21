import fs from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"

const root = path.resolve(import.meta.dirname, "../..")
let failures = 0
const ok = (message) => console.log(`OK  ${message}`)
const fail = (message) => { failures += 1; console.error(`FAIL ${message}`) }
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8")
const exists = (relative) => fs.existsSync(path.join(root, relative))
const expectFile = (relative) => exists(relative) ? ok(`exists: ${relative}`) : fail(`missing: ${relative}`)
const expectIncludes = (relative, tokens) => {
  const text = read(relative)
  for (const token of tokens) text.includes(token) ? ok(`${relative} contains ${token}`) : fail(`${relative} missing ${token}`)
}

const required = [
  "lib/market-os/ambassadors/contracts.ts",
  "lib/market-os/ambassadors/auth.ts",
  "lib/market-os/ambassadors/supabase.ts",
  "lib/market-os/ambassadors/persistence.ts",
  "lib/market-os/ambassadors/server.ts",
  "app/api/market-os/ambassadors/proofs/decision/route.ts",
  "app/api/market-os/ambassadors/payouts/route.ts",
  "database/market-os-ambassadors/20260721_market_os_ambassadors_production_hardening.sql",
]
required.forEach(expectFile)

const backendFiles = [
  "lib/market-os/ambassadors/server.ts",
  "lib/market-os/ambassadors/persistence.ts",
  "lib/market-os/ambassadors/supabase.ts",
]
const forbiddenFallbacks = [
  ".angelcare_market_os_ambassadors_store",
  "readFile(",
  "writeFile(",
  "process.cwd()",
  "local-fallback",
  "local fallback",
]
for (const relative of backendFiles) {
  const text = read(relative)
  for (const token of forbiddenFallbacks) {
    text.includes(token) ? fail(`${relative} contains forbidden fallback marker ${token}`) : ok(`${relative} excludes ${token}`)
  }
}

expectIncludes("lib/market-os/ambassadors/contracts.ts", [
  '"leads"', '"conversions"', '"proofs"', '"payouts"',
  "AmbassadorActor", "AmbassadorWorkspaceSnapshot", "ENTITY_LIFECYCLES",
])
expectIncludes("lib/market-os/ambassadors/auth.ts", [
  "auth.getUser", "market_os_ambassador_actor_roles", "market_os_ambassador_role_permissions", "SCOPE_REQUIRED",
])
expectIncludes("lib/market-os/ambassadors/server.ts", [
  "missionAssignments", "territoryAssignments", "rows.leads", "rows.conversions",
  "market_os_ambassador_convert_candidate", "approvedRewardSource", "approvedProofForMission",
])
expectIncludes("database/market-os-ambassadors/20260721_market_os_ambassadors_production_hardening.sql", [
  "market_os_ambassador_mission_assignments",
  "market_os_ambassador_territory_assignments",
  "market_os_ambassador_actor_roles",
  "market_os_ambassador_role_permissions",
  "market_os_ambassador_convert_candidate",
  "market_os_ambassador_decide_incentive",
  "market_os_ambassador_block_audit_mutation",
  "enable row level security",
])

const apiRoot = path.join(root, "app/api/market-os/ambassadors")
const routes = []
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.name === "route.ts") routes.push(full)
  }
}
walk(apiRoot)
for (const route of routes) {
  const text = fs.readFileSync(route, "utf8")
  const protectedRoute = ["withAmbassadorActor", "listRoute(", "createRoute(", "getRoute(", "patchRoute(", "archiveRoute("].some((token) => text.includes(token))
  protectedRoute ? ok(`actor boundary: ${path.relative(root, route)}`) : fail(`missing actor boundary: ${path.relative(root, route)}`)
}

const git = spawnSync("git", ["diff", "--name-only", "--", "*.tsx", "**/*.tsx"], { cwd: root, encoding: "utf8" })
if (git.status === 0 && git.stdout.trim()) fail(`frozen TSX changed:\n${git.stdout.trim()}`)
else ok("no frozen TSX file changed")

const tsc = spawnSync("tsc", ["-p", "deployment/market-os-ambassadors-production-hardening/tsconfig.verify.json", "--pretty", "false"], {
  cwd: root,
  encoding: "utf8",
})
if (tsc.status === 0) ok("TypeScript static verification passed (no emit)")
else {
  fail("TypeScript static verification failed")
  process.stderr.write(tsc.stdout || "")
  process.stderr.write(tsc.stderr || "")
}

if (failures) {
  console.error(`\n${failures} production-hardening verification failure(s).`)
  process.exit(1)
}
console.log(`\nAll ${routes.length} Ambassador API routes are actor-protected. Static verification passed. No build was run.`)
