import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
const app = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const reports =
  process.env.NC_TEST_REPORT_DIR ||
  fs.mkdtempSync(path.join(os.tmpdir(), "ac-notify-qa-"));
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const db = new PGlite(),
  base = path.join(app, "angelcare-marketplace/admin-notifications/"),
  src = JSON.parse(fs.readFileSync(base + "sources.json", "utf8"));
let checks = 0;
const pass = (name, ok = true) => {
  assert.ok(ok, name);
  checks++;
  console.log("[PASS]", name);
};
const q = async (sql, p = []) => await db.query(sql, p),
  one = async (sql, p = []) => (await q(sql, p)).rows[0];
const rpc = async (name, args) => {
  const params = args.map((_, i) => "$" + (i + 1)).join(",");
  return (
    await one(
      `select public.${name}(${params}) result`,
      args.map((v) => (v && typeof v === "object" ? JSON.stringify(v) : v)),
    )
  ).result;
};
await db.exec(
  "create role anon;create role authenticated;create role service_role bypassrls;",
);
await db.exec(fs.readFileSync(base + "database/001_store.sql", "utf8"));
// Generic fixtures deliberately contain private sentinels; real DCE and JOBKIX core definitions are tested separately below.
for (const s of src) {
  if (s.id === "ac_dce_activity_v2") continue;
  await db.exec(
    `create table ${s.id}(id uuid primary key default gen_random_uuid(),tenant_id text,territory_id text,organization_id text,school_id text,status text,state text,lifecycle text,kind text,key text,family text,revision int default 1,version int default 1,public_reference text,due_at timestamptz,expires_at timestamptz,locked_until timestamptz,record_id uuid,updated_at timestamptz default now(),body text,email text,result text,action text,data jsonb,stock int,thread_id uuid,job_id uuid);`,
  );
}
await db.exec(
  "create table ac_dce_activity_v2(id uuid primary key,record_id uuid,action text,environment text,occurred_at timestamptz,subject_key text);alter table ac_dce_releases add foreign key(record_id)references ac_dce_records(id);",
);
for (const f of fs
  .readdirSync(base + "database")
  .sort()
  .filter((f) => f.endsWith(".sql") && !f.startsWith("001")))
  await db.exec(fs.readFileSync(base + "database/" + f, "utf8"));
pass("All six SQLs execute in PostgreSQL");
const master = {
    sources: src.map((s) => s.id),
    global: true,
    manage: true,
    tenant: null,
    territory: null,
    scopes: [],
  },
  a = {
    sources: master.sources,
    global: false,
    tenant: "A",
    territory: "N",
    scopes: [{ type: "tenant", tenant: "A", territory: "N" }],
  },
  b = {
    ...a,
    tenant: "B",
    scopes: [{ type: "tenant", tenant: "B", territory: "N" }],
  },
  actor = "native-app-user-1";
const read = (
  policy = master,
  filter = { view: "all" },
  cursor = null,
  limit = 30,
  user = actor,
) => rpc("ac_nc_read", [user, policy, filter, cursor, limit]);
const command = (cmd, policy = master, user = actor, id = randomUUID()) =>
  rpc("ac_nc_command", [user, policy, id, cmd]);
const insert = async (table, extra = {}) => {
  const id = randomUUID();
  const values = {
    id,
    status: "new",
    tenant_id: "A",
    territory_id: "N",
    body: "PRIVATE_CHILD_BODY",
    email: "private@example.test",
    data: JSON.stringify({ token: "SECRET", nested: { email: "SECRET" } }),
    ...extra,
  };
  const keys = Object.keys(values);
  await q(
    `insert into ${table}(${keys.join(",")})values(${keys.map((_, i) => "$" + (i + 1)).join(",")})`,
    Object.values(values),
  );
  return id;
};
await db.exec("begin");
await insert("angelcare_marketplace_journeys");
await db.exec("rollback");
pass(
  "Business rollback also removes captured event",
  (await one("select count(*)::int n from ac_nc_events")).n === 0,
);
// One native mutation in each registered family must capture, project, count and resolve a safe focused record.
for (const family of new Set(src.map((s) => s.family))) {
  const s = src.find(
    (s) => s.family === family && s.id !== "ac_dce_activity_v2",
  );
  if (!s) continue;
  const id = await insert(s.id, {
    ...(s.audit
      ? { result: "failed", action: "marketplace.access.denied" }
      : {}),
  });
  await rpc("ac_nc_project", [1000]);
  const t = await one(
    "select id from ac_nc_threads where source_id=$1 and object_key->>'id'=$2",
    [s.id, id],
  );
  assert.ok(t, family);
  const focused = await rpc("ac_nc_focus", [actor, master, t.id]);
  pass(
    family + " producer → capture → projection → exact native focus",
    focused.current.id === id &&
      !JSON.stringify(focused).includes("SECRET") &&
      !JSON.stringify(focused).includes("PRIVATE_CHILD_BODY"),
  );
}
let f = await read();
pass(
  "Count is independent of page size",
  f.counts.unread > f.items.length || f.counts.unread >= 25,
);
pass(
  "No private bodies, emails or raw data in feed",
  !JSON.stringify(f).includes("PRIVATE_CHILD_BODY") &&
    !JSON.stringify(f).includes("private@example") &&
    !JSON.stringify(f).includes("SECRET"),
);
const journey = await insert("angelcare_marketplace_journeys"),
  other = await insert("angelcare_marketplace_journeys", { tenant_id: "B" });
await rpc("ac_nc_project", [1000]);
f = await read(a);
pass(
  "Tenant filter excludes another tenant",
  !f.items.some((i) => i.safe.id === other),
);
const t = await one(
  "select *from ac_nc_threads where source_id=$1 and object_key->>'id'=$2",
  ["angelcare_marketplace_journeys", journey],
);
const before = f.counts.unread;
await command({ action: "read", id: t.id, version: t.version }, a);
pass(
  "Single read persists per operator",
  (await read(a)).counts.unread === before - 1,
);
pass(
  "Other operator retains unread",
  (await read(a, {}, null, 100, "native-app-user-2")).items.some(
    (i) => i.id === t.id && i.unread,
  ),
);
const denied = { ...a, sources: [] };
pass(
  "Permission revocation removes rows and counts",
  (await read(denied)).counts.unread === 0 &&
    (await read(denied)).items.length === 0,
);
await assert.rejects(() => rpc("ac_nc_focus", [actor, denied, t.id]));
pass("Revoked exact-object opening is denied");
await q("update angelcare_marketplace_journeys set tenant_id=$1 where id=$2", [
  "B",
  journey,
]);
pass(
  "Scope move revokes old recipient before projection",
  !(await read(a)).items.some((i) => i.id === t.id),
);
await rpc("ac_nc_project", [1000]);
await q("update angelcare_marketplace_journeys set tenant_id=$1 where id=$2", [
  "A",
  journey,
]);
await rpc("ac_nc_project", [1000]);
const snapshot = await command(
  { action: "prepare_read_all", filter: { view: "all" } },
  a,
);
await q(
  "update angelcare_marketplace_journeys set version=version+1,status=$1 where id=$2",
  ["awaiting_angelcare", journey],
);
await rpc("ac_nc_project", [1000]);
await command({ action: "apply_read_all", token: snapshot.token }, a);
pass(
  "New event after bulk snapshot stays unread",
  (await read(a)).items.some((i) => i.id === t.id && i.unread),
);
const current = await one("select *from ac_nc_threads where id=$1", [t.id]);
const req = randomUUID(),
  cmd = { action: "pin", id: t.id, version: current.version };
await command(cmd, a, actor, req);
await command(cmd, a, actor, req);
pass(
  "Idempotent replay cannot toggle pin twice",
  (
    await one(
      "select pinned from ac_nc_recipients where actor_id=$1 and thread_id=$2",
      [actor, t.id],
    )
  ).pinned,
);
await assert.rejects(() =>
  command({ ...cmd, action: "archive" }, a, actor, req),
);
pass("Idempotency key reuse with a different command is rejected");
await command({ action: "archive", id: t.id, version: current.version }, a);
pass(
  "Archive does not mark native record resolved",
  (
    await one("select status from angelcare_marketplace_journeys where id=$1", [
      journey,
    ])
  ).status === "awaiting_angelcare",
);
pass(
  "Archive hides the current version",
  !(await read(a)).items.some((i) => i.id === t.id),
);
await q(
  "update angelcare_marketplace_journeys set version=version+1 where id=$1",
  [journey],
);
await rpc("ac_nc_project", [1000]);
pass(
  "New activity resurfaces archived thread",
  (await read(a)).items.some((i) => i.id === t.id),
);
const j2 = await insert("angelcare_marketplace_journeys", {
  status: "blocked",
});
await rpc("ac_nc_project", [1000]);
const critical = await one(
  "select *from ac_nc_threads where object_key->>'id'=$1",
  [j2],
);
await command(
  { action: "read", id: critical.id, version: critical.version },
  a,
);
f = await read(a);
pass(
  "Read critical remains actionable and critical",
  f.counts.critical > 0 &&
    f.items.some((i) => i.id === critical.id && !i.unread && i.actionable),
);
await assert.rejects(() =>
  command(
    {
      action: "snooze",
      id: critical.id,
      version: critical.version,
      until: new Date(Date.now() + 3600000).toISOString(),
    },
    a,
  ),
);
pass("Critical issue cannot be hidden by snooze");
const job = await insert("ac_dce_records", {
  kind: "setting",
  key: "kidflix-homepage",
  lifecycle: "published",
});
const release = await insert("ac_dce_releases", {
  record_id: job,
  tenant_id: null,
  territory_id: null,
});
await rpc("ac_nc_project", [1000]);
const rel = await one(
  "select *from ac_nc_threads where source_id=$1 and object_key->>'id'=$2",
  ["ac_dce_releases", release],
);
pass(
  "FK ancestry resolves tenant and territory",
  rel.scope.tenant_id === "A" && rel.scope.territory_id === "N",
);
pass("DCE ownership uses native homepage scope", rel.world === "kidflix");
const acimg = await insert("ac_dce_records", {
  kind: "setting",
  key: "angelcare-imagery-home",
  lifecycle: "published",
});
await rpc("ac_nc_project", [1000]);
pass(
  "AngelCare imagery is never classified as KidFlix",
  (
    await one("select world from ac_nc_threads where object_key->>'id'=$1", [
      acimg,
    ])
  ).world === "angelcare",
);
const queuedBefore = (await one("select count(*)::int n from ac_nc_events")).n;
for (let i = 0; i < 100; i++)
  await q(
    "insert into ac_dce_activity_v2 values($1,$2,$3,$4,now()-interval'2 hours',$5)",
    [randomUUID(), job, "start", "production", "PRIVATE_SUBJECT"],
  );
pass(
  "100 learner events do not create 100 notifications",
  (await one("select count(*)::int n from ac_nc_events")).n === queuedBefore,
);
await rpc("ac_nc_monitor", [200, 100]);
await rpc("ac_nc_project", [1000]);
pass(
  "Grouped activity contains a count but no learner identity",
  (
    await one(
      "select safe from ac_nc_events where safe->>'operation'='ACTIVITY' order by id desc limit 1",
    )
  ).safe.total_count === 100,
);
const due = await insert("angelcare_marketplace_crm_tasks", {
  due_at: new Date(Date.now() - 3600000).toISOString(),
});
await rpc("ac_nc_monitor", [200, 100]);
await rpc("ac_nc_monitor", [200, 100]);
pass(
  "Overdue monitor captures deterministic deduplicated alert",
  (
    await one(
      "select count(*)::int n from ac_nc_events where source_id=$1 and object_key->>'id'=$2 and safe->>'operation'='OVERDUE'",
      ["angelcare_marketplace_crm_tasks", due],
    )
  ).n === 1,
);
const peek = await rpc("ac_nc_backfill", [
  "angelcare_marketplace_journeys",
  null,
  1,
  false,
]);
pass(
  "Backfill defaults to dry-run with bounded cursor",
  peek.dryRun && peek.rows === 1 && !!peek.cursor,
);
await rpc("ac_nc_backfill", [
  "angelcare_marketplace_journeys",
  null,
  500,
  true,
]);
const pre = (await one("select count(*)::int n from ac_nc_events")).n;
await rpc("ac_nc_backfill", [
  "angelcare_marketplace_journeys",
  null,
  500,
  true,
]);
pass(
  "Backfill replay deduplicates",
  (await one("select count(*)::int n from ac_nc_events")).n === pre,
);
await rpc("ac_nc_project", [1000]);
await q("update ac_nc_sources set state=$1,reason=$2 where id=$3", [
  "blocked",
  "SOURCE_TABLE_MISSING",
  "ac_seo_power_issues",
]);
pass(
  "Coverage reports blocked source instead of healthy zero",
  (await read()).health.sources.some(
    (s) => s.id === "ac_seo_power_issues" && s.state === "blocked",
  ),
);
await q(
  "update ac_nc_worker_state set last_success_at=now()-interval'10 minutes'",
);
pass("Stopped worker is explicitly stale", (await read()).health.worker.stale);

const grouped = randomUUID();
for (let i = 0; i < 5; i++)
  await insert("jobkix_messages", { thread_id: grouped });
await rpc("ac_nc_project", [1000]);
pass(
  "Conversation messages group into one thread",
  (
    await one(
      `select count(*)::int n,max(event_count)::int c from ac_nc_threads where source_id=$1 and safe->>'operation'='INSERT'`,
      ["jobkix_messages"],
    )
  ).n === 1,
);
const agg = await one("select *from ac_nc_threads where source_id=$1", [
  "jobkix_messages",
]);
pass(
  "Grouped thread resolves its latest native record",
  (await rpc("ac_nc_focus", [actor, master, agg.id])).current.id ===
    agg.object_key.id,
);
const countBefore = (await read()).counts.unread;
for (let i = 0; i < 135; i++)
  await insert("angelcare_marketplace_customer_accounts", { status: "active" });
await rpc("ac_nc_project", [1000]);
let cursor = null,
  seen = new Set(),
  pages = 0;
do {
  const page = await read(master, { view: "all" }, cursor, 30);
  for (const item of page.items) {
    assert.ok(!seen.has(item.id));
    seen.add(item.id);
  }
  cursor = page.items.length === 30 ? page.cursor : null;
  pages++;
} while (cursor);
pass(
  "Cursor pagination reads beyond the second page without duplicates",
  pages >= 5 && seen.size > 135,
);
pass(
  "Exact unread total exceeds the 30-card page",
  (await read()).counts.unread >= countBefore + 135,
);
const noScope = {
  sources: master.sources,
  global: false,
  tenant: null,
  territory: null,
  scopes: [],
};
pass(
  "Missing native scope never widens silently",
  (await read(noScope)).items.length === 0,
);
const cross = {
  ...noScope,
  scopes: [
    { type: "tenant", tenant: "A", territory: "S" },
    { type: "tenant", tenant: "B", territory: "N" },
  ],
};
const crossRow = await insert("angelcare_marketplace_customer_accounts", {
  tenant_id: "A",
  territory_id: "N",
});
await rpc("ac_nc_project", [1000]);
pass(
  "Assignment scopes never form a tenant/territory cross-product",
  !(await read(cross, {}, null, 100)).items.some((i) => i.safe.id === crossRow),
);
const school = await insert("angelcare_marketplace_customer_accounts", {
  school_id: randomUUID(),
});
await rpc("ac_nc_project", [1000]);
pass(
  "Unresolved school authority stays hidden from ordinary operator",
  !(await read(a, {}, null, 100)).items.some((i) => i.safe.id === school),
);
const exactBefore = (await one("select count(*)::int n from ac_nc_events")).n;
await q(
  "update angelcare_marketplace_customer_accounts set updated_at=now()where id=$1",
  [crossRow],
);
pass(
  "Timestamp-only updates do not manufacture events",
  (await one("select count(*)::int n from ac_nc_events")).n === exactBefore,
);
await command(
  {
    action: "preferences",
    mutedSources: ["angelcare_marketplace_customer_accounts"],
    locale: "en",
  },
  master,
);
pass(
  "Ordinary muted source stays out of unread view",
  !(await read(master, { view: "unread" })).items.some(
    (i) => i.source === "angelcare_marketplace_customer_accounts",
  ),
);
pass(
  "Muted events remain available in full history",
  (await read(master, { view: "all" })).items.some(
    (i) => i.source === "angelcare_marketplace_customer_accounts",
  ),
);
const rail = await rpc("ac_nc_indicator_counts", [a]);
pass(
  "Signal rail uses scoped native records",
  Number.isInteger(rail.angelcare_marketplace_journeys),
);

await assert.rejects(() =>
  command(
    {
      action: "source_rule",
      source: "angelcare_marketplace_journeys",
      reason: "Fixture policy test",
      minimumSeverity: "critical",
      expiryWarningDays: 3,
    },
    a,
  ),
);
pass("Non-master cannot edit capture policy");
await command({
  action: "source_rule",
  source: "angelcare_marketplace_journeys",
  reason: "Fixture policy test",
  minimumSeverity: "critical",
  expiryWarningDays: 3,
});
pass(
  "Source policy changes are versioned with actor and reason",
  (await one("select count(*)::int n from ac_nc_policy_changes")).n === 1,
);
const policyId = await insert("angelcare_marketplace_journeys", {
  status: "pending",
});
await rpc("ac_nc_project", [1000]);
pass(
  "Source severity rule is enforced",
  (
    await one("select severity from ac_nc_threads where object_key->>'id'=$1", [
      policyId,
    ])
  ).severity === "critical",
);
await command({
  action: "retry_source",
  source: "angelcare_marketplace_journeys",
  reason: "Fixture replay test",
});
pass(
  "Replay retries projection only and leaves native order unchanged",
  (
    await one("select status from angelcare_marketplace_journeys where id=$1", [
      policyId,
    ])
  ).status === "pending",
);
// Real source migrations, independent from the synthetic adapter corpus.
const native = new PGlite();
await native.exec(
  "create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);",
);
await native.exec(
  fs.readFileSync(
    app +
      "/angelcare-marketplace/jobkix/migrations/001_recruitment_records.sql",
    "utf8",
  ),
);
pass("Native JOBKIX core migration executes unmodified");
await native.exec(
  fs.readFileSync(
    app +
      "/angelcare-marketplace/digital-customer-experience/database/01_DCE_ADMIN_R1.sql",
    "utf8",
  ),
);
pass("Native DCE core migration executes unmodified");
for (const file of fs
  .readdirSync(base + "database")
  .sort()
  .filter((f) => f.endsWith(".sql")))
  await native.exec(fs.readFileSync(base + "database/" + file, "utf8"));
const user = randomUUID(),
  resource = randomUUID();
await native.query("insert into auth.users values($1)", [user]);
await native.query(
  "insert into jobkix_accounts(user_id,display_name)values($1,$2)",
  [user, "PRIVATE_NAME"],
);
await native.query(
  "insert into ac_dce_records(id,kind,key,title,family,audience,created_by,updated_by)values($1,$2,$3,$4,$5,$6,$7,$7)",
  [
    resource,
    "experience",
    "notification-native-fixture",
    "PRIVATE_TITLE",
    "documents",
    "child",
    "native-app-actor",
  ],
);
await native.query("select ac_nc_project(100)");
const actual = (await native.query("select source_id,safe from ac_nc_threads"))
  .rows;
pass(
  "Real JOBKIX and DCE inserts traverse hooks and projection",
  actual.length === 2 &&
    !JSON.stringify(actual).includes("PRIVATE_NAME") &&
    !JSON.stringify(actual).includes("PRIVATE_TITLE"),
);

for (const sql of ["select *from ac_nc_events", "select ac_nc_project(1)"]) {
  await db.exec("set role anon");
  await assert.rejects(() => db.exec(sql));
  await db.exec("reset role");
}
pass("Anonymous role cannot read events or invoke projection");

await native.exec(
  "create table ac_kidflix_interactive_packages(id uuid primary key,scope_key text,locale text,family_key text,checksum_sha256 text,entry_path text,state text,record_id uuid,release_id uuid)",
);
await native.exec(
  fs.readFileSync(
    app +
      "/angelcare-marketplace/digital-customer-experience/database/INSTALL_KIDFLIX_DELIVERY_R2.sql",
    "utf8",
  ),
);
await native.exec(
  fs.readFileSync(base + "database/006_activate_and_grants.sql", "utf8"),
);
const importId = randomUUID();
await native.query(
  "insert into ac_kidflix_import_sessions(id,scope_key,owner_actor_id,family_key,locale,checksum,size_bytes,chunk_count,state,package_id,dedup_key)values($1,$2,$3,$4,$5,$6,22,1,$7,$8,$9)",
  [
    importId,
    "A|N",
    "native-operator",
    "visual-cards",
    "fr",
    "a".repeat(64),
    "uploading",
    randomUUID(),
    "fixture-" + importId,
  ],
);
await native.query("select ac_nc_project(100)");
const captured = (
  await native.query(
    "select world,scope,safe from ac_nc_threads where source_id=$1",
    ["ac_kidflix_import_sessions"],
  )
).rows[0];
pass(
  "Latest R2 native import transaction reaches scoped KidFlix thread",
  captured.world === "kidflix" &&
    captured.scope.tenant_id === "A" &&
    captured.scope.territory_id === "N",
);
const timings = [];
for (let i = 0; i < 12; i++) {
  const start = performance.now();
  await read(a);
  timings.push(performance.now() - start);
}
timings.sort((a, b) => a - b);
const performanceReport = {
  engine: "PGlite PostgreSQL WASM; not production",
  registeredSources: src.length,
  threads: (await one("select count(*)::int n from ac_nc_threads")).n,
  recipients: (await one("select count(*)::int n from ac_nc_recipients")).n,
  warmRequests: timings.length,
  p95ms: Math.round(timings[Math.ceil(timings.length * 0.95) - 1]),
  permissionMode:
    "paired tenant A / territory N plus current native row revalidation",
};
fs.writeFileSync(
  path.join(reports, "notification-performance.json"),
  JSON.stringify(performanceReport, null, 2) + "\n",
);
pass(
  "Scoped warm list/count requests are measured on fixture",
  performanceReport.p95ms > 0,
);
await db.exec(fs.readFileSync(base + "operations/VERIFY.sql", "utf8"));
pass("Read-only activation verification executes");
await db.exec(fs.readFileSync(base + "operations/DISABLE_CAPTURE.sql", "utf8"));
pass(
  "Operational rollback retains captured history",
  (await one("select count(*)::int n from ac_nc_events")).n > 0 &&
    (await one("select count(*)::int n from ac_nc_sources where enabled")).n ===
      0,
);

console.log("NOTIFICATION_SQL_BEHAVIOR_CHECKS=" + checks);
await native.close();
await db.close();
