import { execFileSync } from "node:child_process"
import { readFileSync, existsSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const app = resolve(here, "../..")
let checks = 0

function ok(message) {
  checks += 1
  console.log(`OK  ${message}`)
}

function requireFile(relative) {
  const target = resolve(app, relative)
  if (!existsSync(target)) throw new Error(`Required file missing: ${relative}`)
  ok(`required file exists: ${relative}`)
  return readFileSync(target, "utf8")
}

function contains(text, needle, label) {
  if (!text.includes(needle)) throw new Error(`${label} is missing: ${needle}`)
  ok(`${label} contains ${needle}`)
}

function excludes(text, needle, label) {
  if (text.toLowerCase().includes(needle.toLowerCase())) throw new Error(`${label} unexpectedly contains: ${needle}`)
  ok(`${label} excludes ${needle}`)
}

const auth = requireFile("lib/market-os/ambassadors/auth.ts")
const contracts = requireFile("lib/market-os/ambassadors/contracts.ts")
const persistence = requireFile("lib/market-os/ambassadors/persistence.ts")
const migration = requireFile("database/market-os-ambassadors/20260722_market_os_ambassador_ops_session_bridge.sql")
const bootstrap = requireFile("database/market-os-ambassadors/20260722_market_os_ambassador_ops_session_bridge_bootstrap_ceo.sql")
requireFile("database/market-os-ambassadors/20260722_market_os_ambassador_ops_session_bridge.rollback.sql")
requireFile("deployment/market-os-ambassadors-session-bridge/EXPLICIT_MAPPING.sql.example")
requireFile("deployment/market-os-ambassadors-session-bridge/VERIFY_DATABASE.sql")

for (const value of [
  'const OPS_SESSION_COOKIE = "angelcare_ops_session"',
  '.from("app_sessions")',
  '.from("app_users")',
  'resolveOpsSessionActor',
  'resolveSupabaseActor',
  '"app_user_id"',
  'authenticationSource: "ops_session"',
  'authenticationSource: "supabase_auth"',
  'OpsOS session is expired',
  'OpsOS session is invalid or revoked',
  'No active Ambassador scope is assigned to this user',
]) contains(auth, value, "auth bridge")

contains(contracts, 'export type AmbassadorAuthenticationSource = "supabase_auth" | "ops_session"', "actor contract")
contains(contracts, "authUserId: string | null", "actor contract")
contains(contracts, "appUserId: string | null", "actor contract")
contains(contracts, "authenticationSource: AmbassadorAuthenticationSource", "actor contract")
contains(persistence, "authentication_source: actor.authenticationSource", "immutable audit")
contains(persistence, "app_user_id: actor.appUserId", "immutable audit")

for (const value of [
  "add column if not exists app_user_id uuid",
  "alter column auth_user_id drop not null",
  "market_os_ambassador_actor_identity_required",
  "uq_market_os_ambassador_actor_app_user_active_scope",
  "references public.app_users(id) on delete cascade",
]) contains(migration.toLowerCase(), value.toLowerCase(), "bridge migration")

contains(bootstrap, "v_user_count <> 1", "guarded CEO bootstrap")
contains(bootstrap, "v_scope_count <> 1", "guarded scope bootstrap")
contains(bootstrap, "'ambassador_admin'", "guarded bootstrap")

for (const forbidden of [
  "role === 'ceo' ? 'ambassador_admin'",
  'role === "ceo" ? "ambassador_admin"',
  "anonymous actor",
  "local fallback",
  "return mock",
]) excludes(auth, forbidden, "auth bridge")

const localTsc = resolve(app, "node_modules", ".bin", process.platform === "win32" ? "tsc.cmd" : "tsc")
const tsc = existsSync(localTsc) ? localTsc : (process.platform === "win32" ? "tsc.cmd" : "tsc")
execFileSync(tsc, ["-p", resolve(here, "tsconfig.verify.json"), "--pretty", "false"], {
  cwd: app,
  stdio: "inherit",
})
ok("strict TypeScript static verification passed")

console.log(`\nPASS  Ambassador OpsOS session bridge verification: ${checks} checks`)
