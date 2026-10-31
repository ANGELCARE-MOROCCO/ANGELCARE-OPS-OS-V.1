import { getDetail } from "@/angelcare-marketplace/kidflix/detail/service";
import { asset, obj, rows } from "@/angelcare-marketplace/kidflix/detail/model";
import { publicHost } from "@/angelcare-marketplace/kidflix/server";
import { isLocale } from "@/angelcare-marketplace/kidflix/catalogue";
import { takeBudget } from "@/angelcare-marketplace/kidflix/documents/server";
import { fetchDocumentBinary } from "@/angelcare-marketplace/kidflix/documents/delivery";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const u = new URL(request.url), locale = u.searchParams.get("locale") || "", key = u.searchParams.get("key") || "", id = u.searchParams.get("asset") || "", release = u.searchParams.get("release") || "";
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex" };
  const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  if (!isLocale(locale) || !/^[a-z0-9][a-z0-9._-]{1,119}$/.test(key) || !uuid.test(id) || !uuid.test(release) || request.headers.get("sec-fetch-site") === "cross-site") return Response.json({ error: "INVALID_READER_REQUEST" }, { status: 400, headers });
  try {
    const host = publicHost(request.headers.get("host") || u.host);
    await takeBudget(request, host, locale, "delivery");
    const value = await getDetail(host, locale, key);
    const source = value && value.releaseId === release && rows(obj(value.manifest.definition).units).some(x => x.assetId === id) ? asset(value.manifest, id) : null;
    if (!source || source.mime !== "application/pdf") return Response.json({ error: "READER_SOURCE_UNAVAILABLE" }, { status: 404, headers });
    // Native fetcher pins public DNS, bounds redirects/time/size and checks %PDF-.
    const bytes = await fetchDocumentBinary(new URL(source.url, "https://" + host).href, "application/pdf");
    const current = await getDetail(host, locale, key);
    const confirmed = current && current.releaseId === release && rows(obj(current.manifest.definition).units).some(x => x.assetId === id) ? asset(current.manifest, id) : null;
    if (!confirmed || confirmed.url !== source.url || confirmed.mime !== source.mime) return Response.json({ error: "READER_SOURCE_CHANGED" }, { status: 409, headers });
    const responseHeaders: Record<string,string> = { ...headers, "Content-Type": "application/pdf", "Content-Disposition": "inline; filename=\"kidflix-document.pdf\"", "Accept-Ranges": "bytes", "Content-Security-Policy": "default-src 'none'; frame-ancestors 'self'" };
    const range = request.headers.get("range");
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      let start = 0, end = bytes.length - 1;
      if (match && match[1]) { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
      else if (match && match[2]) start = Math.max(0, bytes.length - Number(match[2]));
      if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || start >= bytes.length || (match[1] === "" && Number(match[2]) === 0)) return new Response(null, { status: 416, headers: { ...responseHeaders, "Content-Range": "bytes */" + bytes.length } });
      const slice = bytes.slice(start, end + 1);
      return new Response(slice as BodyInit, { status: 206, headers: { ...responseHeaders, "Content-Range": `bytes ${start}-${end}/${bytes.length}`, "Content-Length": String(slice.length) } });
    }
    return new Response(bytes as BodyInit, { headers: { ...responseHeaders, "Content-Length": String(bytes.length) } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    return Response.json({ error: code === "RATE_LIMITED" ? "READER_RATE_LIMITED" : "READER_UNAVAILABLE" }, { status: code === "RATE_LIMITED" ? 429 : 503, headers });
  }
}
