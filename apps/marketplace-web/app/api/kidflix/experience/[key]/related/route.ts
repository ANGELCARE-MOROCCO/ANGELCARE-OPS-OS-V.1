import { related } from "@/angelcare-marketplace/kidflix/detail/service";
import { isLocale } from "@/angelcare-marketplace/kidflix/catalogue";
import { publicHost } from "@/angelcare-marketplace/kidflix/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const headers = {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
    u = new URL(request.url),
    locale = u.searchParams.get("locale") || "en";
  if (!isLocale(locale))
    return Response.json(
      { error: "INVALID_LANGUAGE" },
      { status: 400, headers },
    );
  try {
    const { key } = await params;
    return Response.json(
      await related(
        publicHost(request.headers.get("host") || u.host),
        locale,
        key,
        u.searchParams.get("shelf") || "family",
        Number(u.searchParams.get("page") || 1),
        {
          score: u.searchParams.has("score")
            ? Number(u.searchParams.get("score"))
            : undefined,
          complete: u.searchParams.get("complete") === "true",
        },
      ),
      { headers },
    );
  } catch (e) {
    return Response.json(
      {
        error:
          (e as Error).message === "NOT_FOUND"
            ? "NOT_FOUND"
            : "DISCOVERY_UNAVAILABLE",
      },
      { status: (e as Error).message === "NOT_FOUND" ? 404 : 503, headers },
    );
  }
}
