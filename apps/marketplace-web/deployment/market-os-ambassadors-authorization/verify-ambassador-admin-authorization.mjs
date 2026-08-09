import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const root = path.resolve(import.meta.dirname, "../..")
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8")
const authSource = read("lib/market-os/ambassadors/auth.ts")
const lifecycleSource = read("lib/market-os/ambassadors/data-lifecycle.ts")
const settingsSource = read("lib/market-os/ambassadors/settings/server.ts")
const apiSource = read("lib/market-os/ambassadors/api.ts")
const recruitmentRoute = read("app/api/market-os/ambassadors/recruitment/route.ts")

const actorCanBody = authSource.match(/export function actorCan\([^)]*\): boolean \{([\s\S]*?)\n\}/)?.[1]
assert.ok(actorCanBody, "actorCan implementation is present")
const actorCan = new Function("actor", "permission", actorCanBody)

const actor = (roleKey, permissions = new Set()) => ({
  actorId: "actor-1",
  authUserId: "auth-1",
  appUserId: null,
  authenticationSource: "supabase_auth",
  displayName: "Test actor",
  email: null,
  roleKey,
  tenantId: "tenant-1",
  organizationId: "org-1",
  permissions,
  requestId: "request-1",
  ipAddress: null,
  userAgent: null,
})

for (const permission of ["recruitment.write", "missions.write", "settings.write"]) {
  assert.equal(actorCan(actor("ambassador_admin"), permission), true, `admin authorizes ${permission} without matrix entry`)
}
assert.equal(actorCan(actor("market_manager", new Set(["recruitment.write"])), "recruitment.write"), true)
assert.equal(actorCan(actor("market_manager"), "recruitment.write"), false)
assert.equal(actorCan(actor("ambassador-admin"), "recruitment.write"), false)

assert.match(authSource, /if \(roleKey === "ambassador_admin"\) return new Set<string>\(\)/)
assert.match(authSource, /actor\.roleKey === "ambassador_admin" \|\| actor\.permissions\.has\("\*"\)/)
assert.match(authSource, /throw new AmbassadorServiceError\("AUTH_REQUIRED"/)
assert.match(authSource, /function selectedScope\(/)
assert.match(authSource, /throw new AmbassadorServiceError\("SCOPE_REQUIRED"/)
assert.match(lifecycleSource, /actor\.role_key !== "ambassador_admin"/)
assert.match(settingsSource, /actor\.roleKey === "ambassador_admin" \|\| actor\.permissions\.has\("\*"\)/)
assert.match(apiSource, /resolveAmbassadorActor\(request\)/)
assert.match(recruitmentRoute, /return createRoute\("recruitment", request\)/)

console.log("PASS Ambassador admin authorization acceptance cases")
console.log("PASS authentication and tenant/organization scope guards remain in the resolver")
console.log("PASS recruitment POST remains on the existing persistence route")
