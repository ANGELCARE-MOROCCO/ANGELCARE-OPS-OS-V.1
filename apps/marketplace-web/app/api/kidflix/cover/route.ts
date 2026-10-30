import { getDetail } from "@/angelcare-marketplace/kidflix/detail/service";
import { asset, obj, str } from "@/angelcare-marketplace/kidflix/detail/model";
import { publishedMediaUuid } from "@/angelcare-marketplace/kidflix/detail/published-media";
import { publicHost } from "@/angelcare-marketplace/kidflix/server";
import { isLocale } from "@/angelcare-marketplace/kidflix/catalogue";
import { fetchPublishedDocumentBinary } from "@/angelcare-marketplace/kidflix/documents/delivery";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex" };
export async function GET(request: Request) {
  const u = new URL(request.url);
  const locale = u.searchParams.get("locale") || "";
  const key = u.searchParams.get("key") || "";
  const release = u.searchParams.get("release") || "";
  if (!isLocale(locale) || !/^[a-z0-9][a-z0-9._-]{1,119}$/.test(key) ||
      !publishedMediaUuid(release) || request.headers.get("sec-fetch-site") === "cross-site")
    return Response.json({ error: "INVALID_COVER_REQUEST" }, { status: 400, headers: { ...headers, "Cache-Control": "no-store" } });
  try {
    const host = publicHost(request.headers.get("host") || u.host);
    const detail = await getDetail(host, locale, key);
    if (!detail || detail.releaseId !== release)
      return Response.json({ error: "COVER_NOT_PUBLISHED" }, { status: 404, headers: { ...headers, "Cache-Control": "no-store" } });
    const id = str(obj(detail.manifest.definition).coverAssetId);
    const source = publishedMediaUuid(id) ? asset(detail.manifest, id, "image/") : null;
    if (!source || !["image/png", "image/jpeg", "image/webp", "image/avif"].includes(source.mime))
      return Response.json({ error: "COVER_NOT_READY" }, { status: 404, headers: { ...headers, "Cache-Control": "no-store" } });
    const bytes = await fetchPublishedDocumentBinary(id, source.url, source.mime, host);
    return new Response(bytes as BodyInit, { headers: { ...headers, "Content-Type": source.mime, "Content-Length": String(bytes.byteLength) } });
  } catch {
    return Response.json({ error: "COVER_DELIVERY_UNAVAILABLE" }, { status: 503, headers: { ...headers, "Cache-Control": "no-store" } });
  }
}
