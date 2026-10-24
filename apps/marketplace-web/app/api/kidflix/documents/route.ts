import { isLocale } from "@/angelcare-marketplace/kidflix/catalogue";
import { getDocuments } from "@/angelcare-marketplace/kidflix/documents/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const u = new URL(request.url),
    locale = u.searchParams.get("locale") || "en",
    headers = {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    };
  if (!isLocale(locale))
    return Response.json(
      { error: "INVALID_LANGUAGE" },
      { status: 400, headers },
    );
  try {
    return Response.json(
      await getDocuments(
        request.headers.get("host") || u.host,
        locale,
        Object.fromEntries(u.searchParams),
      ),
      { headers },
    );
  } catch (e) {
    const invalid = String((e as Error).message).startsWith("INVALID_");
    return Response.json(
      { error: invalid ? "INVALID_FILTER" : "DOCUMENTS_UNAVAILABLE" },
      { status: invalid ? 400 : 503, headers },
    );
  }
}
