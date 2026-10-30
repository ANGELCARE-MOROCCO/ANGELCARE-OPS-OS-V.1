import { getDetail } from "@/angelcare-marketplace/kidflix/detail/service";
import { asset } from "@/angelcare-marketplace/kidflix/detail/model";
import { publishedMediaUuid } from "@/angelcare-marketplace/kidflix/detail/published-media";
import { publicHost } from "@/angelcare-marketplace/kidflix/server";
import { isLocale } from "@/angelcare-marketplace/kidflix/catalogue";
import { fetchPublishedDocumentBinary } from "@/angelcare-marketplace/kidflix/documents/delivery";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex" };
/** Public reader images are restricted to the exact current published release. */
export async function GET(request: Request) {
  const u = new URL(request.url);
  const locale = u.searchParams.get("locale") || "";
  const key = u.searchParams.get("key") || "";
  const release = u.searchParams.get("release") || "";
  const id = u.searchParams.get("asset") || "";
  if (!isLocale(locale) || !/^[a-z0-9][a-z0-9._-]{1,119}$/.test(key) ||
      !publishedMediaUuid(release) || !publishedMediaUuid(id) ||
      request.headers.get("sec-fetch-site") === "cross-site")
    return Response.json({ error: "INVALID_PUBLIC_IMAGE" }, { status: 400, headers });
  try {
    const host = publicHost(request.headers.get("host") || u.host);
    const detail = await getDetail(host, locale, key);
    if (!detail || detail.releaseId !== release)
      return Response.json({ error: "IMAGE_NOT_PUBLISHED" }, { status: 404, headers });
    const source = asset(detail.manifest, id, "image/");
    if (!source || !["image/png", "image/jpeg", "image/webp", "image/avif"].includes(source.mime))
      return Response.json({ error: "IMAGE_NOT_READY" }, { status: 404, headers });
    const bytes = await fetchPublishedDocumentBinary(id, source.url, source.mime, host);
    return new Response(bytes as BodyInit, { headers: { ...headers, "Content-Type": source.mime, "Content-Length": String(bytes.byteLength) } });
  } catch {
    return Response.json({ error: "IMAGE_DELIVERY_UNAVAILABLE" }, { status: 503, headers });
  }
}
