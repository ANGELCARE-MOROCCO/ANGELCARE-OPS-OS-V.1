import "server-only";
import { randomUUID } from "node:crypto";
import { db, rpc, projects, command, getPage, getChange } from "./repository";
import { perform, refresh } from "./actions";
import { inventoryBatch, resolveInventory } from "./growth-inventory";
import {
  candidate,
  growthPolicy,
  type InventoryItem,
  safeSuggestion,
  overlap,
} from "./growth-model";
import {
  locales,
  record,
  SeoFault,
  uuid,
  type Row,
  type Project,
} from "./model";
import type { MarketplaceRequestContext } from "../domain/types";
import { hash } from "./network";
const SYSTEM = "00000000-0000-4000-8000-000000000001";
async function change(
  action: string,
  projectId: string,
  payload: Row,
  actor: string,
  key: string,
) {
  return record(
    await rpc("ac_seo_growth_command", {
      p_action: action,
      p_project: projectId,
      p_payload: payload,
      p_actor: actor,
      p_request: key,
      p_hash: hash({ action, projectId, payload, actor, scope: "global" }),
    }),
  );
}
async function config(projectId: string) {
  const c = await db(),
    v = await c
      .from("ac_seo_growth_config")
      .select("*")
      .eq("project_id", projectId)
      .single();
  if (v.error || !v.data)
    throw new SeoFault(
      "GROWTH_MIGRATION_REQUIRED",
      "La migration Growth R3 est requise.",
      503,
    );
  return v.data;
}
export async function growthSnapshot(
  projectId: string | null,
  state = "all",
  page = 1,
) {
  if (
    !["all", "candidate", "ready", "published", "parked", "stale"].includes(
      state,
    )
  )
    throw new SeoFault("INVALID_FILTER", "Filtre invalide.");
  return {
    ...record(
      await rpc("ac_seo_growth_snapshot", {
        p_project: projectId,
        p_state: state,
        p_page: Math.max(1, Math.min(100000, Math.trunc(page) || 1)),
      }),
    ),
    telemetrySecretConfigured:
      (process.env.MARKETPLACE_DCE_ANALYTICS_SECRET || "").length >= 32,
  };
}
export async function syncInventory(
  project: Project,
  actor: string,
  key: string,
  force = false,
) {
  const client = await db(),
    policy = growthPolicy((await config(project.id)).policy);
  const init = await client.from("ac_seo_growth_scans").upsert(
    locales(project.world).map((locale) => ({
      project_id: project.id,
      locale,
    })),
    { onConflict: "project_id,locale", ignoreDuplicates: true },
  );
  if (init.error)
    throw new SeoFault(
      "INVENTORY_INIT_FAILED",
      "Initialisation non confirmée.",
      503,
    );
  let q = client
    .from("ac_seo_growth_scans")
    .select("*")
    .eq("project_id", project.id)
    .order("updated_at")
    .limit(1);
  if (!force) q = q.lte("next_due", new Date().toISOString());
  const scan = await q;
  if (scan.error)
    throw new SeoFault(
      "INVENTORY_READ_FAILED",
      "Lecture du parcours indisponible.",
      503,
    );
  if (!scan.data?.length) return { waiting: true };
  const s = scan.data[0],
    v = await inventoryBatch(project, s.locale, s.page);
  return change(
    "inventory",
    project.id,
    {
      locale: s.locale,
      page: s.page,
      cycle: s.cycle,
      items: v.items,
      done: v.done,
      total: v.total,note:v.note,
    },
    actor,
    key,
  );
}
export async function buildOpportunities(
  project: Project,
  actor: string,
  key: string,
) {
  const client = await db(),
    cfg = await config(project.id),
    policy = growthPolicy(cfg.policy),
    batch = await rpc("ac_seo_growth_groups", {
      p_project: project.id,
      p_after: String(cfg.build_cursor || ""),
      p_limit: 12,
    });
  const rows = Array.isArray(batch) ? batch.map(record) : [];
  const saved = [];
  for (const [i, g] of rows.entries()) {
    const items = (Array.isArray(g.items) ? g.items : []) as InventoryItem[],
      v = candidate(items, policy);
    v.path =
      v.path.slice(0, 155).replace(/-+$/, "") + "-" + hash(v.key).slice(0, 10);
    Object.assign(v.evidence, { totalNativeItems: g.total });
    const duplicate = await client
      .from("ac_seo_growth_opportunities")
      .select("key,data")
      .eq("project_id", project.id)
      .eq("locale", v.locale)
      .neq("key", v.key)
      .limit(100);
    if (duplicate.error)
      throw new SeoFault(
        "GROWTH_READ_FAILED",
        "Lecture des chevauchements indisponible.",
        503,
      );
    if (
      (duplicate.data || []).some(
        (x) =>
          overlap(v.items, (record(x.data).items || []) as InventoryItem[]) >=
          0.8,
      )
    ) {
      v.blocks.push("OVERLAPPING_SELECTION");
      v.ready = false;
    }
    const existing = await client
      .from("ac_seo_growth_opportunities")
      .select("source_hash,state")
      .eq("project_id", project.id)
      .eq("key", v.key)
      .maybeSingle();
    if (existing.error)
      throw new SeoFault(
        "GROWTH_READ_FAILED",
        "Comparaison des sources indisponible.",
        503,
      );
    if (
      existing.data?.state === "parked" ||
      existing.data?.source_hash === hash(v)
    )
      continue;
    saved.push(
      await change(
        "opportunity",
        project.id,
        {
          key: v.key,
          path: v.path,
          locale: v.locale,
          data: v,
          sourceHash: hash(v),
        },
        actor,
        key + "-" + i,
      ),
    );
  }
  const cursor = rows.length === 12 ? String(rows.at(-1)?.cursor || "") : "";
  await change(
    "cursor",
    project.id,
    {
      expectedCursor: String(cfg.build_cursor || ""),
      expectedGeneration: Number(cfg.build_generation || 1),
      nextCursor: cursor,
    },
    actor,
    key + "-cursor",
  );
  return { processed: saved.length, more: !!cursor };
}
export async function publishOpportunity(
  id: string,
  ctx: MarketplaceRequestContext,
  key: string,
  automatic = false,
) {
  const client = await db(),
    found = await client
      .from("ac_seo_growth_opportunities")
      .select("*")
      .eq("id", id)
      .single();
  if (found.error || !found.data)
    throw new SeoFault(
      "OPPORTUNITY_NOT_FOUND",
      "Opportunité introuvable.",
      404,
    );
  const op = found.data,
    project = (await projects()).find((p) => p.id === op.project_id);
  if (!project || !project.enabled)
    throw new SeoFault("PROJECT_PAUSED", "Univers en pause.", 409);
  const policy = growthPolicy((await config(project.id)).policy);
  if (automatic && (!policy.enabled || !policy.automaticPublish))
    throw new SeoFault(
      "AUTOMATION_DISABLED",
      "Publication automatique désactivée.",
    );
  if (op.state === "parked")
    throw new SeoFault(
      "OPPORTUNITY_PARKED",
      "Cette sélection est mise de côté.",
    );
  const live = await resolveInventory(
      project,
      record(op.data).items as InventoryItem[],
    ),
    fresh = candidate(live, policy);
  if (!fresh.ready)
    throw new SeoFault(
      "GROWTH_QUALITY_BLOCKED",
      "Sources insuffisantes : " + fresh.blocks.join(", "),
      409,
    );
  const old = record(op.data);
  if (op.change_id) {
    const current = await getPage(op.page_id);
    if (current.page.published_change_id !== op.change_id)
      throw new SeoFault(
        "LATER_PUBLICATION_PROTECTED",
        "Une publication native plus récente existe. Examinez-la avant de remplacer cette sélection.",
        409,
      );
    if (
      op.state === "published" &&
      hash(record(op.published_data).items) === hash(fresh.items)
    )
      return { ...op, reused: true };
  }
  if (hash(old.items) !== hash(fresh.items))
    throw new SeoFault(
      "STALE_INVENTORY",
      "Le catalogue a changé. Actualisez les sources et les opportunités.",
      409,
    );
  if (Array.isArray(old.blocks) && old.blocks.includes("OVERLAPPING_SELECTION"))
    throw new SeoFault(
      "DUPLICATE_SELECTION",
      "Une sélection équivalente existe déjà.",
      409,
    );
  await change(
    "reserve",
    project.id,
    { id: op.id },
    ctx.actor.id,
    key + "-reserve",
  );
  const ids = (await command(
    "register",
    { projectId: project.id, paths: [op.path], kind: "landing" },
    ctx,
    key + "-register",
  )) as string[];
  const { page } = await getPage(ids[0]);
  const draft = record(
    await perform(
      "propose",
      {
        pageId: page.id,
        baseHash: page.content_hash,
        patch: {
          title: fresh.title,
          heading: fresh.title,
          description: fresh.description,
          body: fresh.body,
          schema: true,
        },
        reason:
          "Sélection issue du catalogue publié ; demande de recherche non mesurée.",
      },
      ctx,
      key + "-propose",
    ),
  );
  const approved = record(
    await perform(
      "approve",
      { id: draft.id, version: draft.version },
      ctx,
      key + "-approve",
    ),
  );
  const published = record(
    await perform(
      "publish",
      { id: approved.id, version: approved.version },
      ctx,
      key + "-publish",
    ),
  );
  const attached = await change(
    "attach",
    project.id,
    {
      id: op.id,
      version: op.version,
      sourceHash: op.source_hash,
      pageId: page.id,
      changeId: published.id,
    },
    ctx.actor.id,
    key + "-attach",
  );
  refresh(op.path);
  return attached;
}
export async function suggestCorrection(
  pageId: string,
  ctx: MarketplaceRequestContext,
  key: string,
) {
  const { page } = await getPage(pageId),
    client = await db(),
    r = await client
      .from("ac_seo_power_pages")
      .select("id,path,locale,project_id,title,indexable,http_status")
      .eq("project_id", page.project_id)
      .eq("locale", page.locale)
      .eq("indexable", true)
      .limit(200);
  if (r.error)
    throw new SeoFault(
      "GROWTH_READ_FAILED",
      "Lecture des liens indisponible.",
      503,
    );
  const patch = safeSuggestion(page as unknown as Row, r.data || []);
  if (!patch)
    throw new SeoFault(
      "NO_SAFE_CORRECTION",
      "Aucune correction déterministe sûre n’est disponible. Une nouvelle exploration ou un travail éditorial peut être nécessaire.",
      409,
    );
  return perform(
    "propose",
    {
      pageId,
      baseHash: page.content_hash,
      patch,
      reason:
        "Correction fondée sur les titres, descriptions et liens réellement observés ; aucune information commerciale inventée.",
    },
    ctx,
    key,
  );
}
async function automaticMetadata(project: Project, key: string) {
  const client = await db(),
    issues = await client
      .from("ac_seo_power_issues")
      .select("page_id")
      .eq("project_id", project.id)
      .eq("state", "open")
      .in("code", ["TITLE_MISSING", "DESCRIPTION_MISSING", "CANONICAL_MISSING"])
      .order("last_seen", { ascending: false })
      .limit(1);
  if (issues.error)
    throw new SeoFault(
      "GROWTH_READ_FAILED",
      "Lecture des métadonnées indisponible.",
    );
  if (!issues.data?.[0]) return null;
  const { page } = await getPage(issues.data[0].page_id);
  if (
    !page.last_scanned_at ||
    Date.now() - Date.parse(page.last_scanned_at) > 24 * 3600000
  )
    return { deferred: "FRESH_SCAN_REQUIRED", pageId: page.id };
  const patch = safeSuggestion(page as unknown as Row, []);
  if (!patch) return null;
  if (page.published_change_id) {
    const active = await getChange(page.published_change_id),
      existing = record(active.patch);
    if (
      Object.keys(patch)
        .filter((k) => k !== "sourceStamp")
        .every((k) => existing[k] === patch[k])
    )
      return { deferred: "PUBLIC_VERIFICATION_PENDING", pageId: page.id };
  }
  const ctx = { actor: { id: SYSTEM } } as MarketplaceRequestContext;
  await change(
    "reserve",
    project.id,
    { id: page.id },
    SYSTEM,
    key + "-reserve",
  );
  const draft = record(
    await perform(
      "propose",
      {
        pageId: page.id,
        baseHash: page.content_hash,
        patch,
        reason:
          "Règle autorisée : compléter uniquement des métadonnées absentes avec les faits natifs observés.",
      },
      ctx,
      key + "-propose",
    ),
  );
  const approved = record(
    await perform(
      "approve",
      { id: draft.id, version: draft.version },
      ctx,
      key + "-approve",
    ),
  );
  const published = await perform(
    "publish",
    { id: approved.id, version: approved.version },
    ctx,
    key + "-publish",
  );
  // A fresh crawl resolves the native findings; verification remains queued by the publication authority.
  await command(
    "queue",
    { pageIds: [page.id], kind: "crawl", options: {} },
    ctx,
    key + "-crawl",
  );
  return { pageId: page.id, publication: published };
}
export async function growthAction(
  action: string,
  input: Row,
  ctx: MarketplaceRequestContext,
  key: string,
) {
  if (action === "growth-rollback") {
    const client = await db(),
      r = await client
        .from("ac_seo_growth_opportunities")
        .select("*")
        .eq("id", uuid(input.id))
        .single();
    if (r.error || !r.data)
      throw new SeoFault(
        "OPPORTUNITY_NOT_FOUND",
        "Sélection introuvable.",
        404,
      );
    const op = r.data;
    if (!op.change_id) return { ...op, reused: true };
    const changeRow = await getChange(op.change_id),
      current = await getPage(op.page_id);
    if (changeRow.state === "reverted") {
      if (current.page.published_change_id !== changeRow.previous_id)
        throw new SeoFault(
          "LATER_PUBLICATION_PROTECTED",
          "Une publication plus récente est protégée.",
          409,
        );
    } else
      await perform(
        "rollback",
        {
          id: changeRow.id,
          version: changeRow.version,
          reason:
            "Restauration demandée explicitement depuis le workspace Growth.",
        },
        ctx,
        key + "-rollback",
      );
    const result = await change(
      "withdraw",
      op.project_id,
      { id: op.id, version: op.version },
      ctx.actor.id,
      key + "-withdraw",
    );
    refresh(op.path);
    return result;
  }
  if (action === "growth-publish")
    return publishOpportunity(uuid(input.id), ctx, key);
  if (action === "growth-suggest")
    return suggestCorrection(uuid(input.pageId), ctx, key);
  const project = (await projects()).find(
    (p) => p.id === uuid(input.projectId),
  );
  if (!project)
    throw new SeoFault("PROJECT_NOT_FOUND", "Univers introuvable.", 404);
  if (action === "growth-policy")
    return change(
      "policy",
      project.id,
      { version: Number(input.version), policy: growthPolicy(input.policy) },
      ctx.actor.id,
      key,
    );
  if (action === "growth-sync")
    return syncInventory(project, ctx.actor.id, key, true);
  if (action === "growth-build")
    return buildOpportunities(project, ctx.actor.id, key);
  if (action === "growth-park")
    return change(
      "park",
      project.id,
      {
        id: uuid(input.id),
        version: Number(input.version),
        parked: input.parked === true,
      },
      ctx.actor.id,
      key,
    );
  throw new SeoFault("UNKNOWN_GROWTH_ACTION", "Action Growth inconnue.");
}
export async function growthTick(projectId: string | null = null) {
  const client = await db();
  let query = client
    .from("ac_seo_growth_config")
    .select("*")
    .order("last_tick", { ascending: true, nullsFirst: true })
    .limit(3);
  if (projectId) query = query.eq("project_id", projectId);
  const q = await query;
  if (q.error) return { available: false, reason: "GROWTH_MIGRATION_REQUIRED" };
  for (const cfg of q.data || []) {
    const policy = growthPolicy(cfg.policy);
    if (!policy.enabled) continue;
    const project = (await projects()).find(
      (p) => p.id === cfg.project_id && p.enabled,
    );
    if (!project) continue;
    const lease = randomUUID(),
      claim = await rpc("ac_seo_growth_lease", {
        p_project: project.id,
        p_token: lease,
      });
    if (!claim) continue;
    try {
      const key = "growth-tick-" + lease,
        sync = await syncInventory(project, SYSTEM, key + "-sync"),
        built = policy.automaticDrafts
          ? await buildOpportunities(project, SYSTEM, key + "-build")
          : { processed: 0 };
      let publication = null,
        metadata = null;
      if (
        policy.automaticPublish &&
        (!cfg.publish_after || Date.parse(cfg.publish_after) <= Date.now())
      ) {
        const ready = await client
          .from("ac_seo_growth_opportunities")
          .select("id")
          .eq("project_id", project.id)
          .in("state", ["ready", "stale"])
          .eq("data->>ready", "true")
          .order("updated_at")
          .limit(1);
        if (ready.error)
          throw new SeoFault(
            "GROWTH_READ_FAILED",
            "Sélection de publication indisponible.",
          );
        if (ready.data?.[0]) {
          const ctx = { actor: { id: SYSTEM } } as MarketplaceRequestContext;
          publication = await publishOpportunity(
            ready.data[0].id,
            ctx,
            key + "-publish",
            true,
          );
        }
      }
      if (
        !publication &&
        policy.automaticMetadata &&
        (!cfg.publish_after || Date.parse(cfg.publish_after) <= Date.now())
      )
        metadata = await automaticMetadata(project, key + "-metadata");
      await rpc("ac_seo_growth_release", {
        p_project: project.id,
        p_token: lease,
        p_detail: { sync, built, publication, metadata },
        p_error: null,
      });
      return { projectId: project.id, sync, built, publication, metadata };
    } catch (e) {
      const code = e instanceof SeoFault ? e.code : "GROWTH_INTERRUPTED";
      if (code === "GROWTH_DAILY_BUDGET") {
        const next = new Date();
        next.setUTCHours(24, 0, 0, 0);
        await client
          .from("ac_seo_growth_config")
          .update({ publish_after: next.toISOString() })
          .eq("project_id", project.id);
      }
      await rpc("ac_seo_growth_release", {
        p_project: project.id,
        p_token: lease,
        p_detail: {
          code,
          message: e instanceof Error ? e.message : "Interrompu",
        },
        p_error: code,
      });
      return { projectId: project.id, error: code };
    }
  }
  return { waiting: true };
}
