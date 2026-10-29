import "server-only";
import { trackingGrant } from "./growth-telemetry";
import { GrowthSignals } from "./GrowthSignals";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { unstable_cache } from "next/cache";
import { createHash } from "node:crypto";
import { db, projectRow } from "./repository";
import { type World, type ChangePatch, publicPath, record } from "./model";
import { pageStructuredData, safeJsonLd } from "./structured";
import styles from "./public.module.css";
export async function samePublicHost(origin: string) {
  try {
    return (
      (await headers()).get("host")?.toLowerCase() ===
      new URL(origin).host.toLowerCase()
    );
  } catch {
    return false;
  }
}
export const SEO_CACHE_TAG = "angelcare-seo-power-public-r1";
export const publication = unstable_cache(
  async (world: World, path: string) => {
    try {
      publicPath(path, world);
      const client = await db(),
        p = await client
          .from("ac_seo_power_projects")
          .select("*")
          .eq("world", world)
          .eq("enabled", true)
          .maybeSingle();
      if (p.error || !p.data) return null;
      const page = await client
        .from("ac_seo_power_pages")
        .select("*")
        .eq("project_id", p.data.id)
        .eq("path", path)
        .maybeSingle();
      if (page.error || !page.data?.published_change_id) return null;
      const change = await client
        .from("ac_seo_power_changes")
        .select("*")
        .eq("id", page.data.published_change_id)
        .eq("state", "published")
        .maybeSingle();
      if (change.error || !change.data) return null;
      return {
        project: projectRow(p.data),
        page: page.data,
        change: change.data,
        patch: change.data.patch as ChangePatch & { sourceStamp?: string },
      };
    } catch {
      return null;
    }
  },
  ["seo-power-published-r1"],
  { tags: [SEO_CACHE_TAG], revalidate: 60 },
);
function nativeStamp(base: Metadata) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        title: base.title || null,
        description: base.description || null,
        alternates: base.alternates || null,
        robots: base.robots || null,
      }),
    )
    .digest("hex");
}
export function noindex(meta: Metadata): boolean {
  return typeof meta.robots === "string"
    ? /noindex/i.test(meta.robots)
    : meta.robots?.index === false;
}
export async function seoMetadata(
  world: World,
  path: string,
  base: Metadata,
): Promise<Metadata> {
  try {
    publicPath(path, world);
  } catch {
    return base;
  }
  const sourceStamp = nativeStamp(base),
    observed = {
      ...base,
      other: {
        ...base.other,
        "seo-power": "r1:" + world,
        "seo-power-source": sourceStamp,
        "seo-power-body":
          base.other?.["seo-power-body"] === "none" ? "none" : "r1",
      },
    };
  if (noindex(base)) return observed;
  const active = await publication(world, path);
  if (!active || !(await samePublicHost(active.project.origin)))
    return observed;
  if (active.patch.sourceStamp && active.patch.sourceStamp !== sourceStamp)
    return {
      ...observed,
      other: {
        ...observed.other,
        "seo-power-conflict": "native-source-changed",
      },
    };
  const p = active.patch,
    canonical = p.canonicalPath
      ? new URL(p.canonicalPath, active.project.origin).href
      : undefined;
  return {
    ...observed,
    ...(p.title ? { title: { absolute: p.title } } : {}),
    ...(p.description ? { description: p.description } : {}),
    ...(canonical ? { alternates: { ...base.alternates, canonical } } : {}),
    ...(base.openGraph
      ? {
          openGraph: {
            ...base.openGraph,
            ...(p.title ? { title: p.title } : {}),
            ...(p.description ? { description: p.description } : {}),
            ...(canonical ? { url: canonical } : {}),
          },
        }
      : {}),
    ...(base.twitter
      ? {
          twitter: {
            ...base.twitter,
            ...(p.title ? { title: p.title } : {}),
            ...(p.description ? { description: p.description } : {}),
          },
        }
      : {}),
    other: {
      ...observed.other,
      "seo-power-revision": String(active.change.id),
    },
  };
}
export async function SeoEnhancements({
  world,
  path,
  base,
}: {
  world: World;
  path: string;
  base?: Metadata;
}) {
  if (base && noindex(base)) return null;
  const grant = await trackingGrant(world, path);
  const tracking = grant ? <GrowthSignals token={grant} /> : null;
  const active = await publication(world, path);
  if (
    !active ||
    (active.patch.sourceStamp &&
      base &&
      active.patch.sourceStamp !== nativeStamp(base))
  )
    return tracking;
  if (!(await samePublicHost(active.project.origin))) return null;
  const p = active.patch,
    related = p.relatedPaths || [],
    client = await db();
  const linked = related.length
    ? await client
        .from("ac_seo_power_pages")
        .select("path,title,indexable,http_status")
        .eq("project_id", active.project.id)
        .in("path", related)
    : null;
  const links = (linked?.data || []).filter(
    (v) => v.indexable && v.http_status === 200,
  );
  return (
    <section
      className={styles.enhancements}
      data-seo-power="r1"
      aria-label={
        active.page.locale === "fr"
          ? "À découvrir"
          : active.page.locale === "ar"
            ? "اكتشف المزيد"
            : "Explore more"
      }
    >
      {tracking}
      {p.schema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd(
              pageStructuredData(
                active.project,
                path,
                String(active.page.locale),
                p,
              ),
            ),
          }}
        />
      ) : null}
      {links.length ? (
        <>
          <h2>
            {active.page.locale === "fr"
              ? "Pour continuer votre découverte"
              : active.page.locale === "ar"
                ? "تابع اكتشافك"
                : "Continue exploring"}
          </h2>
          <ul>
            {links.map((link) => (
              <li key={link.path}>
                <a href={link.path}>{link.title || link.path}</a>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
export async function publicPages(world?: World) {
  try {
    const client = await db();
    let pq = client
      .from("ac_seo_power_projects")
      .select("*")
      .eq("enabled", true);
    if (world) pq = pq.eq("world", world);
    const pr = await pq;
    if (pr.error) throw pr.error;
    const projects = (pr.data || []).map(projectRow),
      out: Record<string, unknown>[] = [];
    for (const project of projects) {
      const eligibility = await client.rpc("ac_seo_growth_sitemap_paths", {
        p_project: project.id,
      });
      if (eligibility.error && eligibility.error.code !== "PGRST202")
        throw eligibility.error;
      const managed = new Map(
        (Array.isArray(eligibility.data) ? eligibility.data : []).map(
          (r: { path: string; eligible: boolean }) => [r.path, r.eligible],
        ),
      );
      let cursor = "";
      for (let i = 0; i < 20; i++) {
        let q = client
          .from("ac_seo_power_pages")
          .select(
            "id,path,locale,kind,last_scanned_at,project_id,published_change_id",
          )
          .eq("project_id", project.id)
          .eq("indexable", true)
          .eq("http_status", 200)
          .order("id")
          .limit(500);
        if (cursor) q = q.gt("id", cursor);
        const r = await q;
        if (r.error) throw r.error;
        if (!r.data?.length) break;
        const landingIds = r.data
          .filter((row) => row.kind === "landing" && row.published_change_id)
          .map((row) => row.published_change_id);
        const live = landingIds.length
          ? await client
              .from("ac_seo_power_changes")
              .select("id,verified_at")
              .in("id", landingIds)
              .eq("state", "published")
          : null;
        if (live?.error) throw live.error;
        const verified = new Set(
          (live?.data || []).filter((v) => v.verified_at).map((v) => v.id),
        );
        for (const row of r.data) {
          try {
            publicPath(row.path, project.world);
            if (managed.has(row.path) && managed.get(row.path) !== true)
              continue;
            if (row.kind !== "landing" || verified.has(row.published_change_id))
              out.push({
                ...row,
                origin: project.origin,
                world: project.world,
              });
          } catch {}
        }
        cursor = r.data[r.data.length - 1].id;
      }
    }
    return out;
  } catch {
    throw new Error("SEO_PUBLIC_INVENTORY_UNAVAILABLE");
  }
}
export async function publicIndexNowKey() {
  try {
    const c = await db(),
      r = await c
        .from("ac_seo_power_runtime")
        .select("indexnow_key")
        .eq("singleton", true)
        .single();
    return typeof r.data?.indexnow_key === "string"
      ? r.data.indexnow_key
      : null;
  } catch {
    return null;
  }
}
export function sourceStampFromFacts(facts: unknown) {
  return String(record(facts).sourceStamp || "");
}
