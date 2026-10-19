import {
  getCatalogue,
  publicHost,
} from "@/angelcare-marketplace/kidflix/server";
import { isLocale } from "@/angelcare-marketplace/kidflix/catalogue";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const url = new URL(request.url),
    locale = url.searchParams.get("locale") || "en";
  if (!isLocale(locale))
    return Response.json({ error: "INVALID_LANGUAGE" }, { status: 400 });
  try {
    const host = publicHost(request.headers.get("host") || url.host),
      value = await getCatalogue(
        host,
        locale,
        Object.fromEntries(url.searchParams),
      );
    return Response.json(value, {
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json(
      { error: "DISCOVERY_UNAVAILABLE" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
