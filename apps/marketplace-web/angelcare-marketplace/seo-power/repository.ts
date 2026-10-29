import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import type { MarketplaceRequestContext } from "../domain/types";
import { hasMarketplacePermission } from "../auth/context";
import { hash } from "./network";
import {
  type Project,
  type Page,
  type Snapshot,
  type Row,
  parsePolicy,
  record,
  SeoFault,
  text,
  integer,
} from "./model";

export function access(context: MarketplaceRequestContext) {
  const admin =
    context.roleKeys.includes("marketplace_admin") ||
    ["ceo", "admin", "super_admin"].includes(context.actor.sourceRole);
  const global =
    admin || context.assignments.some((a) => a.scopeType === "global");
  return {
    view:
      global &&
      hasMarketplacePermission(context, "marketplace.web_presence.view"),
    manage:
      global &&
      hasMarketplacePermission(context, "marketplace.web_presence.manage"),
    publish:
      global &&
      hasMarketplacePermission(context, "marketplace.web_presence.publish"),
    rollback:
      global &&
      hasMarketplacePermission(context, "marketplace.web_presence.rollback"),
  };
}
export function projectRow(value: unknown): Project {
  const r = record(value);
  return {
    id: String(r.id),
    world: r.world as Project["world"],
    name: String(r.name),
    origin: String(r.origin),
    enabled: r.enabled === true,
    version: Number(r.version),
    policy: parsePolicy(r.policy),
  };
}
export function pageRow(value: unknown): Page {
  return value as Page;
}
export async function db() {
  return createServiceClient();
}
export function databaseError(error: unknown): never {
  const message = String(record(error).message || error),
    code = [
      "GROWTH_DAILY_BUDGET",
      "STALE_INVENTORY_SCAN",
      "STALE_GROWTH_CURSOR",
      "INVENTORY_SCOPE",
      "STALE_GROWTH_LEASE",
      "PROJECT_PAUSED",
      "JOB_NOT_RETRYABLE",
      "VERIFICATION_SUPERSEDED",
      "EXECUTION_NOT_ACTIVE",
      "INVALID_QUEUE_QUERY",
      "STALE_REVISION",
      "STALE_SOURCE",
      "REQUEST_REUSED",
      "LATER_PUBLICATION_PROTECTED",
      "STALE_JOB_LEASE",
      "REVIEW_REQUIRED",
      "NATIVE_PAGE_NOT_PUBLIC",
      "PUBLICATION_BLOCKED",
      "SCHEDULER_EXTENSIONS_REQUIRED",
      "SCHEDULER_SECRET_UNAVAILABLE",
    ].find((c) => message.includes(c));
  if (code)
    throw new SeoFault(
      code,
      (
        {
          GROWTH_DAILY_BUDGET:
            "Limite quotidienne de publication atteinte. L’inventaire peut continuer ; reprise au prochain jour UTC ou après modification de la règle.",
          STALE_GROWTH_CURSOR:
            "Un autre passage a avancé la préparation. Actualisez et reprenez le parcours.",
          STALE_INVENTORY_SCAN:
            "Ce lot a déjà été repris ou terminé. Actualisez la couverture avant de continuer.",
          INVENTORY_SCOPE:
            "Une source n’appartient pas au périmètre public ou à la langue du lot.",
          STALE_GROWTH_LEASE:
            "Un autre passage Growth a repris cette exécution.",
          PROJECT_PAUSED:
            "Cet univers est en pause. Reprenez-le avant de relancer une tâche.",
          JOB_NOT_RETRYABLE:
            "Cette tâche ne demande pas de reprise ou une autre exécution est déjà active.",
          VERIFICATION_SUPERSEDED:
            "Une publication plus récente existe. Vérifiez la correction actuellement publiée.",
          EXECUTION_NOT_ACTIVE:
            "Ce passage est déjà terminé ou n’est plus actif.",
          INVALID_QUEUE_QUERY: "Filtre ou pagination de file invalide.",
          STALE_REVISION:
            "Une révision plus récente existe. Rechargez avant de poursuivre.",
          STALE_SOURCE:
            "Le contenu source a changé. Lancez une nouvelle exploration avant de proposer ou publier.",
          REQUEST_REUSED:
            "Cette clé de requête correspond à une autre commande.",
          LATER_PUBLICATION_PROTECTED:
            "Une publication plus récente est protégée.",
          STALE_JOB_LEASE:
            "La tâche a été annulée ou reprise par une autre exécution.",
          REVIEW_REQUIRED:
            "La correction doit être approuvée avant sa publication.",
          NATIVE_PAGE_NOT_PUBLIC:
            "La page native n’est pas publiquement indexable.",
          PUBLICATION_BLOCKED: "La publication est bloquée par sa portée.",
          SCHEDULER_EXTENSIONS_REQUIRED:
            "Activer pg_cron, pg_net et Supabase Vault dans le Supabase existant avant de lancer la planification.",
          SCHEDULER_SECRET_UNAVAILABLE:
            "Le secret de planification est indisponible.",
        } as Record<string, string>
      )[code],
      code.startsWith("SCHEDULER") ? 503 : 409,
    );
  throw new SeoFault(
    "DATABASE_UNAVAILABLE",
    "SEO POWER ne peut pas confirmer cette opération. Vérifiez sa migration et réessayez.",
    503,
  );
}
export async function rpc(name: string, args: Record<string, unknown>) {
  const client = await db(),
    r = await client.rpc(name, args);
  if (r.error) databaseError(r.error);
  return r.data;
}
export async function projects(): Promise<Project[]> {
  const client = await db(),
    r = await client.from("ac_seo_power_projects").select("*").order("world");
  if (r.error) databaseError(r.error);
  return (r.data || []).map(projectRow);
}
export async function getPage(id: string) {
  const client = await db(),
    r = await client
      .from("ac_seo_power_pages")
      .select("*")
      .eq("id", id)
      .single();
  if (r.error || !r.data)
    throw new SeoFault("PAGE_NOT_FOUND", "Page introuvable.", 404);
  const page = pageRow(r.data),
    project = (await projects()).find((p) => p.id === page.project_id);
  if (!project)
    throw new SeoFault("PROJECT_NOT_FOUND", "Univers introuvable.", 404);
  return { page, project };
}
export async function getChange(id: string) {
  const client = await db(),
    r = await client
      .from("ac_seo_power_changes")
      .select("*")
      .eq("id", id)
      .single();
  if (r.error || !r.data)
    throw new SeoFault("CHANGE_NOT_FOUND", "Correction introuvable.", 404);
  return r.data as Row;
}
export async function command(
  action: string,
  payload: Row,
  context: MarketplaceRequestContext,
  requestKey: string,
) {
  return rpc("ac_seo_power_command", {
    p_action: action,
    p_payload: payload,
    p_actor: context.actor.id,
    p_request: requestKey,
    p_hash: hash({ action, payload, actor: context.actor.id, scope: "global" }),
  });
}

export async function snapshot(
  context: MarketplaceRequestContext,
  query: URLSearchParams,
): Promise<Snapshot> {
  const permissions = access(context),
    empty: Snapshot = {
      ready: false,
      projects: [],
      pages: [],
      total: 0,
      jobs: [],
      findings: [],
      changes: [],
      receipts: [],
      ci: [],
      runtime: {},
      summary: {},
      permissions,
      actor: context.actor.displayName,
    };
  try {
    const list = await projects(),
      client = await db(),
      chosen = list.find((p) => p.id === query.get("project")),
      offset = integer(query.get("page"), 1, 100000, 1) - 1;
    let urls = client
      .from("ac_seo_power_pages")
      .select("*", { count: "exact" })
      .order("path")
      .range(offset * 40, offset * 40 + 39);
    if (chosen) urls = urls.eq("project_id", chosen.id);
    const search = text(query.get("q"), 160).replace(/[%,()]/g, "");
    if (search) urls = urls.ilike("path", "%" + search + "%");
    const select = (table: string) => {
      let q = client
        .from(table)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(80);
      if (chosen) q = q.eq("project_id", chosen.id);
      return q;
    };
    let issues = client
      .from("ac_seo_power_issues")
      .select("*")
      .order("last_seen", { ascending: false })
      .limit(150);
    if (chosen) issues = issues.eq("project_id", chosen.id);
    const [p, j, f, c, r, ci, runtime, summary, operations] = await Promise.all(
      [
        urls,
        select("ac_seo_power_jobs"),
        issues,
        select("ac_seo_power_changes"),
        client
          .from("ac_seo_power_receipts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(80),
        client
          .from("ac_seo_power_ci")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(30),
        client.rpc("ac_seo_power_runtime_status"),
        client.rpc("ac_seo_power_summary", { p_project: chosen?.id || null }),
        client.rpc("ac_seo_power_operations", {
          p_project: chosen?.id || null,
        }),
      ],
    );
    for (const result of [p, j, f, c, r, ci, runtime])
      if (result.error) databaseError(result.error);
    if (summary.error) databaseError(summary.error);
    return {
      ...empty,
      ready: true,
      observedAt: new Date().toISOString(),
      operations: record(operations.data),
      operationsError: operations.error
        ? "Migration Operations R2 requise ou lecture opérationnelle indisponible. Le statut du moteur ne peut pas être confirmé."
        : undefined,
      projects: list,
      pages: (p.data || []).map(pageRow),
      total: p.count || 0,
      jobs: j.data || [],
      findings: f.data || [],
      changes: c.data || [],
      receipts: r.data || [],
      ci: ci.data || [],
      runtime: {
        ...record(runtime.data),
        node: process.versions.node,
        nodeCompatible:
          Number(process.versions.node.split(".")[0]) > 22 ||
          (Number(process.versions.node.split(".")[0]) === 22 &&
            Number(process.versions.node.split(".")[1]) >= 13),
      },
      summary: record(summary.data),
    };
  } catch (error) {
    return {
      ...empty,
      error:
        error instanceof SeoFault
          ? error.message
          : "Migration SEO POWER requise ou base inaccessible.",
    };
  }
}
export async function detail(id: string) {
  const { page, project } = await getPage(id),
    client = await db();
  const [observations, changes, issues, jobs] = await Promise.all([
    client
      .from("ac_seo_power_observations")
      .select("*")
      .eq("page_id", id)
      .order("observed_at", { ascending: false })
      .limit(20),
    client
      .from("ac_seo_power_changes")
      .select("*")
      .eq("page_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
    client
      .from("ac_seo_power_issues")
      .select("*")
      .eq("page_id", id)
      .order("last_seen", { ascending: false }),
    client
      .from("ac_seo_power_jobs")
      .select("*")
      .eq("page_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);
  for (const r of [observations, changes, issues, jobs])
    if (r.error) databaseError(r.error);
  return {
    page,
    project,
    observations: observations.data || [],
    changes: changes.data || [],
    issues: issues.data || [],
    jobs: jobs.data || [],
  };
}
