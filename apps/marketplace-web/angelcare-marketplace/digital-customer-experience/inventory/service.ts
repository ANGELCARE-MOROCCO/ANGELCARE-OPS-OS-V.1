import { createHash } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { MarketplaceError } from "../../server/errors";
import type { MarketplaceRequestContext as Context } from "../../domain/types";
import { authorize } from "../repository";
import { FAMILIES } from "../registry";
import {
  editionDefinition,
  editionReadiness,
  stable,
} from "../experience-contract";
import { isId } from "../model";
import {
  object,
  text,
  array,
  type DceRecord,
  type Locale,
  type Command,
} from "../types";
import {
  LANGUAGES,
  PLAN_KEY,
  EMPTY_PLAN,
  validatePlan,
  topicProblems,
  type Snapshot,
  type Entry,
  type Topic,
  type LanguageState,
  type Publication,
} from "./model";
const hash = (v: unknown) =>
  createHash("sha256").update(stable(v)).digest("hex");
const scope = (q: any, c: Pick<Context, "tenantId" | "territoryId">) => {
  q = c.tenantId ? q.eq("tenant_id", c.tenantId) : q.is("tenant_id", null);
  return c.territoryId
    ? q.eq("territory_id", c.territoryId)
    : q.is("territory_id", null);
};
const error = (code: any, message: string) =>
  new MarketplaceError(code, message);
async function checked(q: PromiseLike<any>) {
  const r = await q;
  if (r.error)
    throw error(
      "DEPENDENCY_BLOCKED",
      "Inventory could not be read completely. Retain the previous view and retry.",
    );
  return r;
}
/** Stable ID cursor; count is checked so an API row cap cannot masquerade as empty inventory. */
async function scan(
  db: any,
  table: string,
  columns: string,
  c: Context,
  filter: (q: any) => any,
  onPage: (rows: any[]) => Promise<void>,
) {
  let cursor = "";
  while (true) {
    let q = filter(scope(db.from(table).select(columns, { count: "exact" }), c))
      .order("id", { ascending: true })
      .limit(100);
    if (cursor) q = q.gt("id", cursor);
    const r = await checked(q),
      rows = r.data || [];
    if (typeof r.count !== "number" || (r.count > 0 && !rows.length))
      throw error(
        "DEPENDENCY_BLOCKED",
        "Inventory pagination is incomplete. No empty counts were substituted.",
      );
    if (!rows.length) break;
    const next = rows.at(-1).id;
    if (typeof next !== "string" || next <= cursor)
      throw error("DEPENDENCY_BLOCKED", "Inventory cursor did not advance.");
    await onPage(rows);
    cursor = next;
    if (rows.length >= r.count) break;
  }
}
async function editionRows(db: any, c: Context, ids: string[]) {
  const rows: any[] = [];
  let offset = 0;
  while (true) {
    const r = await checked(
      scope(
        db
          .from("ac_dce_editions")
          .select(
            "record_id,locale,state,definition_hash,active_release_id,revision,updated_at",
            { count: "exact" },
          ),
        c,
      )
        .in("record_id", ids)
        .order("record_id", { ascending: true })
        .order("locale", { ascending: true })
        .range(offset, offset + 99),
    );
    if (typeof r.count !== "number" || (r.count > offset && !r.data?.length))
      throw error(
        "DEPENDENCY_BLOCKED",
        "Language editions were not read completely.",
      );
    rows.push(...(r.data || []));
    offset += r.data?.length || 0;
    if (offset >= r.count) break;
  }
  return rows;
}
async function planRecord(db: any, c: Context) {
  return (
    await checked(
      scope(db.from("ac_dce_records").select("*"), c)
        .eq("kind", "setting")
        .eq("key", PLAN_KEY)
        .maybeSingle(),
    )
  ).data;
}
const tokens = (v: unknown) =>
  typeof v === "string"
    ? v
        .split(/[\n,]/)
        .map((v) => v.trim())
        .filter(Boolean)
    : Array.isArray(v)
      ? v.filter((v): v is string => typeof v === "string")
      : [];
const releaseColumns =
  "id,record_id,state,published_at,editionLocale:manifest->>editionLocale,family:manifest->>family,topic:snapshot->>topic,visibility:manifest->definition->>visibility,subtype:manifest->definition->>subtype";
export async function inventoryRead(c: Context): Promise<Snapshot> {
  authorize(c, "view");
  const startedAt = new Date().toISOString(),
    db = await createServiceClient(),
    entries: Entry[] = [],
    topics: Topic[] = [],
    warnings: string[] = [],
    support: Record<string, number> = {};
  const plan = await planRecord(db, c);
  if (plan?.lifecycle === "archived")
    throw error(
      "DEPENDENCY_BLOCKED",
      "Inventory target settings are archived. Restore them before using the planning map.",
    );
  const targets = validatePlan(plan?.data?.plan || EMPTY_PLAN);
  await scan(
    db,
    "ac_dce_records",
    "id,key,title,family,data,lifecycle",
    c,
    (q) => q.eq("kind", "topic").neq("lifecycle", "archived"),
    async (rows) => {
      for (const r of rows)
        topics.push({
          id: r.id,
          parent: text(r.data?.parentId),
          key: r.key,
          title: [
            text(r.data?.locales?.en?.title) || text(r.title),
            text(r.data?.locales?.fr?.title) || text(r.title),
            text(r.data?.locales?.ar?.title) || text(r.title),
          ],
        });
    },
  );
  await scan(
    db,
    "ac_dce_records",
    "id,key,kind,title,family,topic,audience,lifecycle,revision,updated_at,published_release_id,data",
    c,
    (q) => q.in("kind", ["experience", "bundle"]).neq("lifecycle", "archived"),
    async (rows) => {
      const editions = await editionRows(
          db,
          c,
          rows.map((r) => r.id),
        ),
        ids = [
          ...new Set<string>(
            [
              ...editions.map((e) => e.active_release_id),
              ...rows.map((r) => r.published_release_id),
            ].filter(Boolean),
          ),
        ],
        releases: any[] = [];
      for (let i = 0; i < ids.length; i += 60) {
        const chunk = ids.slice(i, i + 60);
        await scan(
          db,
          "ac_dce_releases",
          releaseColumns,
          c,
          (q) => q.in("id", chunk),
          async (r) => {
            releases.push(...r);
          },
        );
      }
      for (const r of rows as DceRecord[]) {
        const family = r.family || (r.kind === "bundle" ? "bundles" : "");
        if (!FAMILIES.some((f) => f.key === family)) {
          support.unassignedFamily = (support.unassignedFamily || 0) + 1;
          continue;
        }
        const source = r,
          own = editions.filter((e) => e.record_id === r.id),
          publications: Publication[] = [],
          issues: string[] = [];
        const languages = Object.fromEntries(
          LANGUAGES.map((l) => {
            const ready = editionReadiness(source, l),
              e = own.find((e) => e.locale === l),
              current = hash(editionDefinition(source, l)),
              changed = !!e && e.definition_hash !== current;
            if (e?.active_release_id) {
              const release = releases.find(
                (z) =>
                  z.id === e.active_release_id &&
                  z.record_id === r.id &&
                  z.state === "published" &&
                  z.editionLocale === l,
              );
              if (release) {
                publications.push({
                  locale: l,
                  id: release.id,
                  family: text(release.family) || family,
                  subtype: text(release.subtype),
                  topic: text(release.topic),
                  at: release.published_at || null,
                  public:
                    (!release.visibility || release.visibility === "free") &&
                    release.family === family,
                });
                if (release.family !== family)
                  issues.push(
                    l.toUpperCase() +
                      ": active release uses a different family.",
                  );
              } else
                issues.push(
                  l.toUpperCase() +
                    ": active edition has no matching published release.",
                );
            }
            return [
              l,
              {
                present: ready.present,
                complete: ready.coverage.complete && ready.present,
                filled: ready.coverage.filled,
                total: ready.coverage.total,
                missing: ready.coverage.missing.slice(0, 20),
                state: e?.definition_hash === current ? e.state : "draft",
                changed,
                activeId: e?.active_release_id || null,
              } satisfies LanguageState,
            ];
          }),
        ) as Entry["languages"];
        const facets: Entry["facets"] = {};
        for (const key of [
          "documentUses",
          "documentGrades",
          "documentThemes",
          "documentNeeds",
          "documentSubject",
          "storefrontFocus",
          "storefrontThemes",
          "storefrontNeeds",
          "storefrontQuick",
        ])
          if (r.data[key]) facets[key] = tokens(r.data[key]);
        entries.push({
          id: r.id,
          key: r.key,
          kind: r.kind,
          title: Object.fromEntries(
            LANGUAGES.map((l) => [
              l,
              text(object(object(r.data.locales)[l]).title) ||
                (l === (text(r.data.defaultLocale) || "en") ? r.title : ""),
            ]),
          ) as Entry["title"],
          family,
          subtype: text(r.data.subtype),
          topic: text(r.topic),
          lifecycle: r.lifecycle,
          revision: r.revision,
          updatedAt: r.updated_at,
          legacy: releases.some(
            (z) =>
              z.id === r.published_release_id &&
              z.record_id === r.id &&
              z.state === "published" &&
              !z.editionLocale,
          ),
          languages,
          publications,
          facets,
          units: array(r.data.units).length,
          issues,
        });
      }
    },
  );
  for (const kind of ["template", "content", "asset"]) {
    const r = await checked(
      scope(
        db.from("ac_dce_records").select("id", { count: "exact", head: true }),
        c,
      )
        .eq("kind", kind)
        .neq("lifecycle", "archived"),
    );
    if (typeof r.count !== "number")
      throw error(
        "DEPENDENCY_BLOCKED",
        "Support inventory count is unavailable.",
      );
    support[kind] = r.count;
  }
  warnings.push(...topicProblems(topics));
  if (support.unassignedFamily)
    warnings.push(
      support.unassignedFamily +
        " dossiers have no native category assignment and are excluded from category totals.",
    );
  if (entries.some((e) => e.legacy))
    warnings.push(
      "Some dossiers retain a legacy generic release. Inspect their native language editions; no language coverage was inferred.",
    );
  return {
    version: 1,
    startedAt,
    at: new Date().toISOString(),
    scopeKey: hash([c.tenantId, c.territoryId]),
    entries,
    topics,
    plan: targets,
    planRevision: plan?.revision || 0,
    warnings,
    support,
  };
}
export async function inventoryPlanSave(c: Context, cmd: Command) {
  authorize(c, "manage");
  if (!isId(cmd.requestId))
    throw error("VALIDATION_ERROR", "A stable command receipt is required.");
  const commandHash = hash({
    tenant: c.tenantId,
    territory: c.territoryId,
    command: cmd,
  });
  const plan = validatePlan(cmd.plan),
    db = await createServiceClient(),
    receipt = (
      await checked(
        db
          .from("ac_dce_commands")
          .select("input_hash,response")
          .eq("actor_id", c.actor.id)
          .eq("request_id", cmd.requestId)
          .maybeSingle(),
      )
    ).data;
  if (receipt) {
    if (receipt.input_hash !== commandHash)
      throw error("CONFLICT", "This receipt belongs to another operation.");
    return receipt.response;
  }
  const prior = await planRecord(db, c);
  if (Number(cmd.revision) !== Number(prior?.revision || 0))
    throw error(
      "CONFLICT",
      "Targets changed in another session. Keep your edits, reload and reconcile.",
    );
  if (prior?.lifecycle === "archived")
    throw error("DEPENDENCY_BLOCKED", "Target settings are archived.");
  const result = await db.rpc("ac_dce_write", {
    p_actor: c.actor.id,
    p_tenant: c.tenantId,
    p_territory: c.territoryId,
    p_request: cmd.requestId,
    p_hash: commandHash,
    p_action: "save",
    p_id: prior?.id || null,
    p_revision: prior?.revision || 0,
    p_record: {
      kind: "setting",
      key: PLAN_KEY,
      title: "KidFlix inventory targets",
      family: null,
      topic: null,
      audience: "professional",
      data: { plan },
    },
    p_refs: { record: [], media: [], offer: [] },
  });
  if (result.error)
    throw error(
      /CONFLICT|REVISION|duplicate/i.test(result.error.message)
        ? "CONFLICT"
        : "DEPENDENCY_BLOCKED",
      "Targets were not changed. Reload and reconcile before retrying.",
    );
  return result.data;
}
