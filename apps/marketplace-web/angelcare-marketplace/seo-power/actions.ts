import "server-only";
import { randomBytes } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import type { MarketplaceRequestContext } from "../domain/types";
import { WORLDS as KIDFLIX_WORLDS } from "../kidflix/catalogue";
import { getPublicStorefrontNavigation } from "../public-experience-authority/storefront-navigation";
import { command, db, getChange, getPage, projects, rpc } from "./repository";
import {
  canonicalOrigin,
  type ChangePatch,
  type Row,
  locales,
  parsePatch,
  parsePolicy,
  publicPath,
  record,
  root,
  SeoFault,
  text,
  uuid,
} from "./model";
import { inspectPage } from "./crawler";
import { hash } from "./network";
import { SEO_CACHE_TAG } from "./public";

export function refresh(path: string) {
  revalidateTag(SEO_CACHE_TAG, { expire: 0 });
  revalidatePath(path);
  revalidatePath("/seo-power-sitemap.xml");
}
export async function perform(
  action: string,
  input: Row,
  ctx: MarketplaceRequestContext,
  key: string,
): Promise<unknown> {
  if (action === "project") {
    const origin = canonicalOrigin(input.origin),
      policy = parsePolicy(input.policy);
    return command(
      action,
      {
        id: uuid(input.id),
        version: Number(input.version),
        origin,
        enabled: input.enabled !== false,
        policy,
      },
      ctx,
      key,
    );
  }
  if (action === "register" || action === "initialize") {
    const project = (await projects()).find(
      (p) => p.id === uuid(input.projectId),
    );
    if (!project)
      throw new SeoFault("PROJECT_NOT_FOUND", "Univers introuvable.", 404);
    let paths: string[];
    if (action === "initialize")
      paths = locales(project.world).flatMap((locale) =>
        project.world === "kidflix"
          ? [
              `/kidflix/${locale}`,
              ...KIDFLIX_WORLDS.map(
                (w) => `/kidflix/${locale}/explore/${w.key}`,
              ),
            ]
          : project.world === "jobkix"
            ? [
                "",
                "jobs",
                "sectors",
                "professions",
                "countries",
                "employers",
                "resources",
                "for-jobseekers",
                "for-employers",
                "how-it-works",
                "trust-safety",
                "help",
                "contact",
                "about",
              ].map((p) => `/jobkix/${locale}${p ? "/" + p : ""}`)
            : [
                `/angelcare-marketplace/${locale}`,
                ...getPublicStorefrontNavigation(
                  locale as "en" | "fr" | "ar",
                ).map((p) => p.href),
              ],
      );
    else {
      if (
        !Array.isArray(input.paths) ||
        input.paths.some((p) => typeof p !== "string")
      )
        throw new SeoFault("INVALID_PATHS", "Liste de chemins requise.");
      paths = input.paths as string[];
    }
    paths = [...new Set(paths.map((p) => publicPath(p, project.world)))];
    if (!paths.length || paths.length > 100)
      throw new SeoFault("INVALID_BATCH", "De 1 à 100 URL par import.");
    return command("register", { projectId: project.id, paths }, ctx, key);
  }
  if (action === "create-page") {
    const project = (await projects()).find(
      (p) => p.id === uuid(input.projectId),
    );
    if (!project)
      throw new SeoFault("PROJECT_NOT_FOUND", "Univers introuvable.", 404);
    const locale = text(input.locale, 3),
      slug = text(input.slug, 100);
    if (
      !locales(project.world).includes(locale) ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    )
      throw new SeoFault("INVALID_SLUG", "Langue ou slug invalide.");
    const path = `${root(project.world)}/${locale}/discover/${slug}`,
      patch = parsePatch(input.patch, project, "landing");
    const ids = (await command(
      "register",
      { projectId: project.id, paths: [path], kind: "landing" },
      ctx,
      key + "-register",
    )) as string[];
    const { page } = await getPage(ids[0]);
    if (page.kind !== "landing")
      throw new SeoFault(
        "ROUTE_OWNERSHIP",
        "Ce chemin appartient à une page native.",
      );
    return command(
      "propose",
      {
        pageId: page.id,
        baseHash: page.content_hash,
        patch,
        reason:
          text(input.reason, 2000) || "Création d’une page éditoriale SEO.",
      },
      ctx,
      key + "-draft",
    );
  }
  if (action === "queue") {
    if (!Array.isArray(input.pageIds) || input.pageIds.length > 100)
      throw new SeoFault("INVALID_BATCH", "Sélection de pages invalide.");
    const ids = input.pageIds.map(uuid),
      kind = text(input.kind, 20);
    if (!["crawl", "links", "verify", "indexnow"].includes(kind))
      throw new SeoFault("INVALID_KIND", "Action de vérification invalide.");
    if (kind === "verify") {
      const results = [];
      for (const id of ids) {
        const { page } = await getPage(id);
        if (!page.published_change_id)
          throw new SeoFault(
            "NO_PUBLICATION",
            "Cette page n’a pas de correction publiée.",
          );
        results.push(
          await command(
            "queue",
            {
              pageIds: [id],
              kind,
              options: { changeId: page.published_change_id },
            },
            ctx,
            key + "-" + id,
          ),
        );
      }
      return results;
    }
    return command(
      action,
      {
        pageIds: ids,
        kind,
        options: {
          discover: kind === "crawl" && record(input.options).discover === true,
        },
      },
      ctx,
      key,
    );
  }
  if (action === "cancel")
    return command(action, { id: uuid(input.id) }, ctx, key);
  if (action === "issue") {
    if (!["open", "ignored"].includes(String(input.state)))
      throw new SeoFault("INVALID_STATE", "Statut invalide.");
    return command(
      action,
      { id: uuid(input.id), state: input.state },
      ctx,
      key,
    );
  }
  if (action === "propose") {
    const { page, project } = await getPage(uuid(input.pageId)),
      patch = parsePatch(input.patch, project, page.kind);
    if (
      page.kind !== "landing" &&
      (!page.indexable || page.facts?.seoPower !== "r1:" + project.world)
    )
      throw new SeoFault(
        "NATIVE_ADAPTER_REQUIRED",
        "Explorez d’abord cette page publique et vérifiez que son adaptateur SEO est actif.",
      );
    if(page.kind!=='landing'&&(patch.schema===true||patch.relatedPaths?.length)&&page.facts?.bodyHook!=='r1')throw new SeoFault('BODY_ADAPTER_REQUIRED','Cette page permet la correction des métadonnées ; son Studio natif doit gérer le balisage et le maillage.');
    return command(
      action,
      {
        pageId: page.id,
        baseHash: input.baseHash ?? null,
        patch: {
          ...patch,
          ...(page.kind !== "landing" && page.facts
            ? { sourceStamp: String(record(page.facts).sourceStamp || "") }
            : {}),
        },
        reason: text(input.reason, 2000),
      },
      ctx,
      key,
    );
  }
  if (action === "revise") {
    const change = await getChange(uuid(input.id)),
      { page, project } = await getPage(String(change.page_id)),
      patch = parsePatch(input.patch, project, page.kind);
    if(page.kind!=='landing'&&(patch.schema===true||patch.relatedPaths?.length)&&page.facts?.bodyHook!=='r1')throw new SeoFault('BODY_ADAPTER_REQUIRED','Le balisage et le maillage nécessitent un adaptateur de contenu actif.');
    return command(
      action,
      {
        id: change.id,
        version: Number(input.version),
        baseHash: page.content_hash,
        patch: {
          ...patch,
          ...(page.kind !== "landing" && page.facts
            ? { sourceStamp: page.facts.sourceStamp }
            : {}),
        },
        reason: text(input.reason, 2000),
      },
      ctx,
      key,
    );
  }
  if (["approve", "publish", "rollback"].includes(action)) {
    const id = uuid(input.id),
      change = await getChange(id),
      { page, project } = await getPage(String(change.page_id)),
      patch = parsePatch(change.patch, project, page.kind);
    let liveHash: string | null = null;
    if (action === "publish") {
      if (!project.enabled)
        throw new SeoFault("PROJECT_PAUSED", "Cet univers est en pause.");
      if (page.kind !== "landing") {
        const live = await inspectPage(project, page.path);
        if (
          live.status !== 200 ||
          /noindex/i.test(live.robots) ||
          live.seoPower !== "r1:" + project.world
        )
          throw new SeoFault(
            "NATIVE_PAGE_NOT_PUBLIC",
            "Le contenu public et l’adaptateur SEO doivent être disponibles.",
          );
        liveHash = live.contentHash;
      }
      const targets = [
        ...(patch.relatedPaths || []),
        ...(patch.canonicalPath && patch.canonicalPath !== page.path
          ? [patch.canonicalPath]
          : []),
      ];
      if (targets.length) {
        const client = await db(),
          found = await client
            .from("ac_seo_power_pages")
            .select("path,indexable,http_status,last_scanned_at")
            .eq("project_id", project.id)
            .in("path", targets);
        if (
          found.error ||
          targets.some(
            (path) =>
              !found.data?.some(
                (v) =>
                  v.path === path &&
                  v.indexable &&
                  v.http_status === 200 &&
                  Date.parse(String(v.last_scanned_at)) > Date.now() - 86400000,
              ),
          )
        )
          throw new SeoFault(
            "TARGETS_UNVERIFIED",
            "Chaque cible de lien ou de canonique doit avoir été vérifiée publiquement depuis moins de 24 heures.",
          );
      }
    }
    const result = await command(
      action,
      {
        id,
        version: Number(input.version),
        ...(action === "publish"
          ? { liveHash }
          : action === "rollback"
            ? { reason: text(input.reason, 2000) }
            : {}),
      },
      ctx,
      key,
    );
    if (action !== "approve") refresh(page.path);
    return result;
  }
  if (action === "scheduler") {
    const enabled = input.enabled === true,
      origin = canonicalOrigin(input.origin),
      configured = await projects();
    if (!configured.some((p) => p.origin === origin))
      throw new SeoFault(
        "SCHEDULER_ORIGIN",
        "Le domaine du planificateur doit appartenir à un univers configuré.",
      );
    const secret = randomBytes(32).toString("hex");
    return rpc("ac_seo_power_scheduler", {
      p_endpoint: origin + "/api/angelcare-marketplace/admin/seo-power/run",
      p_secret: secret,
      p_hash: hash(secret),
      p_enabled: enabled,
      p_actor: ctx.actor.id,
      p_request: key,
      p_input_hash: hash({ action, origin, enabled, actor: ctx.actor.id }),
    });
  }
  if (action === "ci-import") {
    const data = record(input.report);
    if (
      Object.keys(data).length === 0 ||
      JSON.stringify(data).length > 2000000 ||
      !text(data.lighthouseVersion, 30)
    )
      throw new SeoFault("INVALID_REPORT", "Rapport Lighthouse invalide.");
    const audits = record(data.categories),
      url = text(data.finalDisplayedUrl || data.finalUrl, 1800);
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new SeoFault("INVALID_REPORT", "URL de rapport requise.");
    }
    const candidate =
      parsed.protocol === "http:" &&
      ["127.0.0.1", "localhost"].includes(parsed.hostname);
    if (parsed.protocol !== "https:" && !candidate)
      throw new SeoFault(
        "INVALID_REPORT",
        "URL publique HTTPS ou candidat local Lighthouse requis.",
      );
    const score = (id: string) => {
      const n = record(audits[id]).score;
      return typeof n === "number" && n >= 0 && n <= 1 ? n : null;
    };
    const source = candidate
        ? "manual-candidate-lighthouse-report"
        : "manual-lighthouse-report",
      results = {
        url,
        candidate,
        performance: score("performance"),
        seo: score("seo"),
        accessibility: score("accessibility"),
        fetchedAt: data.fetchTime || null,
        runtimeError: data.runtimeError || null,
        importedBy: ctx.actor.id,
      };
    const client = await db(),
      existing = await client
        .from("ac_seo_power_ci")
        .select("*")
        .eq("run_id", "manual-" + key)
        .eq("source", source)
        .maybeSingle();
    if (existing.error)
      throw new SeoFault(
        "REPORT_SAVE_FAILED",
        "Le rapport n’a pas été confirmé.",
        503,
      );
    if (existing.data) {
      if (hash(existing.data.results) !== hash(results))
        throw new SeoFault(
          "REQUEST_REUSED",
          "Cette clé possède un autre rapport.",
          409,
        );
      return existing.data;
    }
    const r = await client
      .from("ac_seo_power_ci")
      .insert({
        source_sha: /^[a-f0-9]{40}$/i.test(String(input.sourceSha))
          ? String(input.sourceSha)
          : "manual",
        run_id: "manual-" + key,
        source,
        results,
      })
      .select("*")
      .single();
    if (r.error)
      throw new SeoFault(
        "REPORT_SAVE_FAILED",
        "Le rapport n’a pas été enregistré.",
        503,
      );
    return r.data;
  }
  throw new SeoFault("UNKNOWN_ACTION", "Action SEO inconnue.");
}
