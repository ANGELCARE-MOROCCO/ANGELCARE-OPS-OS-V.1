import { getHome, getCatalogue, getExperience, publicHost } from "@/angelcare-marketplace/kidflix/server";
import { getDetail } from "@/angelcare-marketplace/kidflix/detail/service";
import { getStorefront } from "@/angelcare-marketplace/kidflix/storefronts/server";
import { getDocuments } from "@/angelcare-marketplace/kidflix/documents/server";
import { isLocale, path } from "@/angelcare-marketplace/kidflix/catalogue";
import { publicMediaReadiness } from "@/angelcare-marketplace/digital-customer-experience/public-readiness";
import { rows, obj } from "@/angelcare-marketplace/kidflix/detail/model";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const u = new URL(request.url), locale = u.searchParams.get("locale") || "fr", key = u.searchParams.get("key") || "";
  const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  if (!isLocale(locale) || !/^[a-z0-9][a-z0-9._-]{1,119}$/.test(key)) return Response.json({ error: "INVALID_REQUEST" }, { status: 400, headers });
  const checks = { configuration: false, edition: false, discovery: false, category: false, detail: false, cover: false, files: false };
  let stage = "configuration";
  try {
    const host = publicHost(request.headers.get("host") || u.host);
    const home = await getHome(host, locale);
    if (!home.published) return Response.json({ status: "blocked", code: "PUBLIC_HOME_BINDING_REQUIRED", checks, locale }, { headers });
    checks.configuration = true; stage = "edition";
    const value = await getExperience(host, locale, key);
    if (!value) return Response.json({ status: "blocked", code: "NO_PUBLIC_EDITION_IN_THIS_SCOPE", checks, locale }, { headers });
    checks.edition = true; stage = "detail";
    const detail = await getDetail(host, locale, key);
    checks.detail = !!detail;
    const health = detail ? publicMediaReadiness(detail.manifest) : null;
    checks.cover = health?.cover.ready === true; checks.files = health?.files.ready === true;
    stage = "discovery";
    const catalogue = await getCatalogue(host, locale, { keys: key });
    checks.discovery = catalogue.rows.some(x => x.key === key);
    stage = "category";
    let categoryIncomplete = false;
    if (value.manifest.family === "documents") {
      const first = await getDocuments(host, locale, { q: value.manifest.title, language: locale });
      checks.category = first.configured && first.rows.some(x => x.key === key);
      const pages = Math.ceil(first.total / first.pageSize);
      for (let page = 2; !checks.category && page <= Math.min(pages, 10); page++) {
        const next = await getDocuments(host, locale, { q: value.manifest.title, language: locale, page: String(page) });
        checks.category = next.rows.some(x => x.key === key);
      }
      categoryIncomplete = !checks.category && pages > 10;
    } else {
      const storefront = await getStorefront(host, locale, value.manifest.family, { keys: key }, false);
      checks.category = storefront.catalogue.rows.some(x => x.key === key);
    }
    return Response.json({ status: categoryIncomplete ? "incomplete" : Object.values(checks).every(Boolean) ? "ready" : "blocked", ...(categoryIncomplete ? { code: "CATEGORY_CHECK_BUDGET_REACHED" } : {}), checks,
      issues: health?.issues || [], missingFiles: health?.files.missing || 0,
      fileUnits: rows(obj(detail?.manifest.definition).units).length,
      mediaPlacements: health?.files.total || 0, releaseId: value.releaseId,
      publishedRevision: detail?.manifest.revision || 0,
      href: path(locale, "/experience/" + key),
      categoryHref: path(locale, "/explore/" + value.manifest.family),
      allLanguagesHref: value.manifest.family === "documents" ? path(locale, "/explore/documents") + "?language=all" : null,
      locale, checkedAt: new Date().toISOString(), fileTransport: "not_checked" }, { headers });
  } catch (error) {
    console.error("KIDFLIX_PUBLIC_JOURNEY_CHECK_FAILED", { stage, message: error instanceof Error ? error.message : "unknown" });
    return Response.json({ status: "error", code: "PUBLIC_JOURNEY_UNAVAILABLE", failedStage: stage, checks, locale, checkedAt: new Date().toISOString() }, { status: 503, headers });
  }
}
