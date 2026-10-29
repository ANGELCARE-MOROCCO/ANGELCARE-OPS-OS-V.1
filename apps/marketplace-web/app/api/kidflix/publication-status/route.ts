import { getHome, getCatalogue, getExperience, publicHost } from "@/angelcare-marketplace/kidflix/server";
import { getDetail } from "@/angelcare-marketplace/kidflix/detail/service";
import { getStorefront } from "@/angelcare-marketplace/kidflix/storefronts/server";
import { getDocuments } from "@/angelcare-marketplace/kidflix/documents/server";
import { isLocale, path } from "@/angelcare-marketplace/kidflix/catalogue";
import { asset, obj, rows, str } from "@/angelcare-marketplace/kidflix/detail/model";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const u = new URL(request.url), locale = u.searchParams.get("locale") || "fr", key = u.searchParams.get("key") || "";
  const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  if (!isLocale(locale) || !/^[a-z0-9][a-z0-9._-]{1,119}$/.test(key)) return Response.json({ error: "INVALID_REQUEST" }, { status: 400, headers });
  try {
    const host = publicHost(request.headers.get("host") || u.host);
    const home = await getHome(host, locale);
    if (!home.published) return Response.json({ status: "blocked", code: "PUBLIC_HOME_BINDING_REQUIRED", checks: { configuration: false }, locale }, { headers });
    const value = await getExperience(host, locale, key);
    if (!value) return Response.json({ status: "blocked", code: "NO_PUBLIC_EDITION_IN_THIS_SCOPE", checks: { configuration: true, edition: false }, locale }, { headers });
    const catalogue = await getCatalogue(host, locale, { keys: key });
    const detail = await getDetail(host, locale, key);
    const d = obj(detail?.manifest.definition), m = detail?.manifest || {};
    const fileUnits = rows(d.units).filter(x => ["pdf", "image", "video", "audio"].includes(str(x.kind)) || str(x.assetId));
    const missingFiles = fileUnits.filter(x => !asset(m, x.assetId)).length;
    const storefront = value.manifest.family === "documents" ? null : await getStorefront(host, locale, value.manifest.family, { keys: key }, false);
    let category = !!storefront?.catalogue.rows.some(x => x.key === key);
    if (value.manifest.family === "documents") {
      const documents = await getDocuments(host, locale, { q: value.manifest.title, language: locale });
      category = documents.configured && documents.total > 0 && documents.rows.some(x => x.key === key);
      // Titles can collide across multiple pages; the native filtered total is
      // evidence of a matching title, not proof of this exact key on later pages.
    }
    const checks = { configuration: true, edition: true, discovery: catalogue.rows.some(x => x.key === key), category, detail: !!detail, files: missingFiles === 0 };
    return Response.json({ status: Object.values(checks).every(Boolean) ? "ready" : "blocked", checks, missingFiles, fileUnits: fileUnits.length, releaseId: value.releaseId, href: path(locale, "/experience/" + key), locale, checkedAt: new Date().toISOString(), fileTransport: "not_checked" }, { headers });
  } catch {
    return Response.json({ status: "error", code: "PUBLIC_JOURNEY_UNAVAILABLE" }, { status: 503, headers });
  }
}
