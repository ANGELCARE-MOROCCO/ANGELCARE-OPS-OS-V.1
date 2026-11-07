#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url),
  ts = require("typescript"),
  app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."),
  base = path.join(app, "angelcare-marketplace/admin-notifications");
let checks = 0;
const pass = (name, value = true) => {
  assert.ok(value, name);
  checks++;
  console.log("[PASS]", name);
};
const context = {
  actor: {
    id: "native-app-actor",
    displayName: "Operator",
    email: null,
    sourceRole: "ceo",
  },
  roleKeys: [],
  permissions: [],
  assignments: [],
  workspaceKeys: [],
  tenantId: null,
  territoryId: null,
  locale: "fr",
  sessionReference: "native-session",
};
let calls = [],
  allowOrigin = true;
const modules = new Map(),
  uuid = "00000000-0000-4000-8000-000000000001",
  feed = {
    items: [],
    counts: { unread: 176, critical: 1, actionable: 3, worlds: {} },
    cursor: { at: "2026-11-06T12:00:00Z", id: uuid },
    health: { sources: [], worker: { stale: false }, pending: 0, failed: 0 },
    preferences: {},
    generatedAt: "2026-11-06T12:00:00Z",
  };
class MarketplaceError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
function load(file) {
  if (modules.has(file)) return modules.get(file).exports;
  if (file.endsWith(".json")) return JSON.parse(fs.readFileSync(file));
  const mod = { exports: {} };
  modules.set(file, mod);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
  }).outputText;
  new Function("require", "module", "exports", code)(
    (name) => {
      if (name === "server-only") return {};
      if (name === "node:crypto") return require(name);
      if (name.endsWith("auth/context"))
        return {
          requireMarketplaceApiContext: async () => context,
          hasMarketplacePermission: (c) =>
            ["ceo", "admin", "super_admin"].includes(c.actor.sourceRole) ||
            c.roleKeys.includes("marketplace_admin") ||
            c.permissions.includes("marketplace.admin.access"),
          hasMarketplaceWorkspaceAccess: (c, w) =>
            ["ceo", "admin", "super_admin"].includes(c.actor.sourceRole) ||
            c.workspaceKeys.includes(w),
        };
      if (name.endsWith("auth/admin/admin-auth"))
        return { assertAdminLoginSameOrigin: () => allowOrigin };
      if (name.endsWith("server/errors")) return { MarketplaceError };
      if (name.endsWith("server/request"))
        return {
          apiSuccess: (data) => Response.json({ ok: true, data }),
          apiFailure: (e) =>
            Response.json(
              { ok: false, error: { code: e.code, message: e.message } },
              {
                status:
                  e.code === "FORBIDDEN"
                    ? 403
                    : e.code === "NOT_FOUND"
                      ? 404
                      : 400,
              },
            ),
        };
      if (name.endsWith("supabase/server"))
        return {
          createServiceClient: async () => ({
            rpc: async (n, args) => {
              calls.push({ n, args });
              return {
                data:
                  n === "ac_nc_read"
                    ? feed
                    : n === "ac_nc_focus"
                      ? {
                          id: uuid,
                          source: "angelcare_marketplace_journeys",
                          current: { id: uuid },
                          events: [],
                        }
                      : args.p_command,
                error: null,
              };
            },
          }),
        };
      if (name.endsWith("admin-notifications/worker"))
        return { runNotificationWorker: async () => ({ projected: 1 }) };
      const target = name.startsWith("@/")
        ? path.join(app, name.slice(2))
        : path.resolve(path.dirname(file), name);
      return load(
        /\.(json|tsx?)$/.test(target)
          ? target
          : target + (fs.existsSync(target + ".ts") ? ".ts" : ".tsx"),
      );
    },
    mod,
    mod.exports,
  );
  return mod.exports;
}
process.env.MARKETPLACE_NOTIFICATIONS_WORKER_SECRET =
  "TEST_ONLY_NOTIFICATION_KEY_NEVER_PRODUCTION_12345";
const model = load(base + "/model.ts"),
  registry = load(base + "/registry.ts"),
  policy = load(base + "/policy.ts"),
  cursor = load(base + "/cursor.ts");
pass(
  "All sources have unique identities",
  new Set(registry.SOURCES.map((s) => s.id)).size === registry.SOURCES.length,
);
pass(
  "Targets are internal native admin routes",
  registry.SOURCES.every(
    (s) =>
      s.route.startsWith("/angelcare-marketplace/admin/") &&
      !s.route.includes("[") &&
      !s.route.includes("//"),
  ),
);
pass(
  "Badge caps visually while counts stay exact",
  model.badge(feed) === "99+",
);
pass("Unknown count is not zero", model.badge(null) === "—");
pass(
  "Unknown filter never becomes another source",
  model.normalizeFilter({ source: "invented" }).source === "",
);
pass(
  "Ordinary operator cannot manage source policies",
  !policy.notificationPolicy({
    ...context,
    actor: { ...context.actor, sourceRole: "agent" },
  }).manage,
);
const after = { at: "2026-11-06T12:00:00Z", id: uuid },
  binding = { actor: "one", scope: "A" },
  token = cursor.encodeCursor(after, binding);
pass(
  "Signed cursor round trips",
  cursor.decodeCursor(token, binding).id === uuid,
);
assert.throws(() => cursor.decodeCursor(token, { actor: "two", scope: "A" }));
pass("Cursor cannot cross actors");
assert.throws(() => cursor.decodeCursor(token, { actor: "one", scope: "B" }));
pass("Cursor cannot cross scopes");
assert.throws(() => cursor.decodeCursor(token + "x", binding));
pass("Cursor tampering is rejected");
const route = load(
  path.join(app, "app/api/angelcare-marketplace/admin/notifications/route.ts"),
);
const command = (
  body,
  headers = {
    origin: "https://my.angelcarehub.com",
    "Content-Type": "application/json",
  },
) =>
  new Request(
    "https://my.angelcarehub.com/api/angelcare-marketplace/admin/notifications",
    {
      method: "POST",
      headers,
      body: typeof body === "string" ? body : JSON.stringify(body),
    },
  );
const cmd = { action: "read", requestId: uuid, id: uuid, version: 1 };
let response = await route.POST(
  command(cmd, { "Content-Type": "application/json" }),
);
pass(
  "Missing Origin blocks mutations",
  response.status === 403 && calls.length === 0,
);
allowOrigin = false;
response = await route.POST(command(cmd));
pass("False same-origin result is enforced", response.status === 403);
allowOrigin = true;
response = await route.POST(
  command(cmd, {
    origin: "https://my.angelcarehub.com",
    "Content-Type": "application/json",
    "sec-fetch-site": "cross-site",
  }),
);
pass("Cross-site mutation is blocked", response.status === 403);
response = await route.POST(command("["));
pass("Invalid JSON is rejected", response.status === 400);
response = await route.POST(command([]));
pass("Array commands are rejected", response.status === 400);
response = await route.POST(command({ ...cmd, payload: "x".repeat(17000) }));
pass("Oversized commands are rejected", response.status === 400);
response = await route.POST(
  command({ ...cmd, action: "resolve_native_record" }),
);
pass(
  "Personal state API cannot resolve native business",
  response.status === 400,
);
response = await route.POST(
  command({ ...cmd, actorId: "forged", policy: { global: true } }),
);
pass("Valid native read succeeds", response.status === 200);
const call = calls.at(-1);
pass(
  "Client actor and policy never become authority",
  call.args.p_actor === "native-app-actor" &&
    !("actorId" in call.args.p_command),
);
response = await route.GET(
  new Request(
    "https://my.angelcarehub.com/api/angelcare-marketplace/admin/notifications",
  ),
);
const result = await response.json();
pass("Read API preserves exact counts", result.data.counts.unread === 176);
pass(
  "List cursor is opaque and signed",
  typeof result.data.cursor === "string" && result.data.cursor.includes("."),
);
pass(
  "Responses are private no-store",
  response.headers.get("cache-control") === "private, no-store" &&
    response.headers.get("vary") === "Cookie",
);
const opens = load(
  path.join(
    app,
    "app/api/angelcare-marketplace/admin/notifications/open/route.ts",
  ),
);
const before = calls.length;
response = await opens.GET(
  new Request(
    "https://my.angelcarehub.com/api/angelcare-marketplace/admin/notifications/open?id=" +
      uuid +
      "&redirect=https://evil.test",
  ),
);
pass(
  "Destination resolves exact typed native order",
  response.status === 303 &&
    response.headers.get("location") ===
      "/angelcare-marketplace/admin/orders/" + uuid + "?acNotice=" + uuid,
);
pass(
  "Opening GET never marks read",
  calls.slice(before).every((c) => c.n === "ac_nc_focus"),
);
pass(
  "Arbitrary source targets are rejected",
  (() => {
    try {
      model.destination("javascript:alert(1)", {}, uuid);
      return false;
    } catch {
      return true;
    }
  })(),
);
pass(
  "SANILA demo links focus native SANILA requests",
  model
    .destination(
      "angelcare_marketplace_public_inquiries",
      { type: "SANILA_DEMO_REQUEST" },
      uuid,
    )
    .startsWith("/angelcare-marketplace/admin/sanila/requests?"),
);
const worker = load(
  path.join(app, "app/api/internal/angelcare-notifications/worker/route.ts"),
);
response = await worker.POST(
  new Request("http://127.0.0.1/api/internal/angelcare-notifications/worker", {
    method: "POST",
  }),
);
pass("Worker denies missing secret", response.status === 401);
response = await worker.POST(
  new Request("http://127.0.0.1/api/internal/angelcare-notifications/worker", {
    method: "POST",
    headers: {
      Authorization:
        "Bearer " + process.env.MARKETPLACE_NOTIFICATIONS_WORKER_SECRET,
    },
  }),
);
pass("Worker accepts its dedicated credential", response.status === 200);
for (const [name, pattern] of [
  ["No raw notification HTML", /dangerouslySetInnerHTML/],
  ["No client service key", /SUPABASE_SERVICE_ROLE/],
])
  pass(
    name,
    !pattern.test(fs.readFileSync(base + "/NotificationCenter.tsx", "utf8")),
  );
console.log("NOTIFICATION_API_MODEL_CHECKS=" + checks);
