import { cookies } from "next/headers";
import {
  LOVE_COOKIE,
  loveState,
  newLoveCookie,
  readLoveIdentity,
} from "@/angelcare-marketplace/kidflix/detail/love-server";
import { publicHost } from "@/angelcare-marketplace/kidflix/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie, Host",
  "X-Content-Type-Options": "nosniff",
};
async function handle(
  request: Request,
  params: Promise<{ key: string }>,
  write: boolean,
) {
  try {
    const u = new URL(request.url),
      host = publicHost(request.headers.get("host") || u.host),
      origin = request.headers.get("origin");
    if (
      request.headers.get("sec-fetch-site") === "cross-site" ||
      (origin && publicHost(new URL(origin).host) !== host) ||
      (write && !origin)
    )
      return Response.json(
        { error: "ORIGIN_DENIED" },
        { status: 403, headers },
      );
    const { key } = await params,
      jar = await cookies();
    let cookie = jar.get(LOVE_COOKIE)?.value,
      subject = readLoveIdentity(cookie);
    if (!subject && write)
      return Response.json(
        { error: "BROWSER_COOKIE_REQUIRED" },
        { status: 428, headers },
      );
    if (!subject) {
      cookie = newLoveCookie();
      subject = readLoveIdentity(cookie)!;
    }
    let locale = u.searchParams.get("locale") || "en",
      liked: boolean | null = null;
    if (write) {
      if (Number(request.headers.get("content-length") || 0) > 2048)
        return Response.json(
          { error: "INVALID_REQUEST" },
          { status: 413, headers },
        );
      const text = await request.text();
      if (text.length > 2048)
        return Response.json(
          { error: "INVALID_REQUEST" },
          { status: 413, headers },
        );
      let input;
      try {
        input = JSON.parse(text);
      } catch {
        throw Error("INVALID_REQUEST");
      }
      if (
        !input ||
        typeof input !== "object" ||
        Array.isArray(input) ||
        typeof input.liked !== "boolean" ||
        typeof input.locale !== "string"
      )
        throw Error("INVALID_REQUEST");
      locale = input.locale;
      liked = input.liked;
    }
    const value = await loveState(host, locale, key, subject, liked);
    if (!write && cookie !== jar.get(LOVE_COOKIE)?.value)
      jar.set(LOVE_COOKIE, cookie!, {
        httpOnly: true,
        secure:
          u.protocol === "https:" ||
          request.headers.get("x-forwarded-proto") === "https",
        sameSite: "lax",
        path: "/api/kidflix",
        maxAge: 31536000,
      });
    return Response.json(value, { headers });
  } catch (e) {
    const code = (e as Error).message,
      status =
        code === "NOT_FOUND"
          ? 404
          : code === "RATE_LIMITED"
            ? 429
            : code === "INVALID_REQUEST"
              ? 400
              : 503;
    return Response.json(
      {
        error: ["NOT_FOUND", "RATE_LIMITED", "INVALID_REQUEST"].includes(code)
          ? code
          : "LOVE_UNAVAILABLE",
      },
      {
        status,
        headers: {
          ...headers,
          ...(status === 429 ? { "Retry-After": "60" } : {}),
        },
      },
    );
  }
}
export const GET = (
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) => handle(request, params, false);
export const PUT = (
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) => handle(request, params, true);
