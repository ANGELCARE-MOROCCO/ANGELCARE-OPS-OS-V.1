import {outcomeReceipt} from "@/angelcare-marketplace/kidflix/journey/runtime-server";
import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { publicAction } from "@/angelcare-marketplace/kidflix/detail/service";
import { publicHost } from "@/angelcare-marketplace/kidflix/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Bounded per-instance abuse protection; not used as a certification or formal-attempt authority.
const limits = new Map<string, { at: number; count: number }>();
export async function POST(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const headers = {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
  try {
    const u = new URL(request.url),
      origin = request.headers.get("origin"),
      host = publicHost(request.headers.get("host") || u.host);
    if (
      request.headers.get("sec-fetch-site") === "cross-site" ||
      (origin && publicHost(new URL(origin).host) !== host)
    )
      return Response.json(
        { error: "ORIGIN_DENIED" },
        { status: 403, headers },
      );
    if (Number(request.headers.get("content-length") || 0) > 100000)
      return Response.json(
        { error: "REQUEST_TOO_LARGE" },
        { status: 413, headers },
      );
    const source = await request.text();
    if (source.length > 100000)
      return Response.json(
        { error: "REQUEST_TOO_LARGE" },
        { status: 413, headers },
      );
    let input;
    try {
      input = JSON.parse(source);
    } catch {
      throw Error("INVALID_REQUEST");
    }
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw Error("INVALID_REQUEST");
    const { key } = await params,
      jar = await cookies();
    let visitor = jar.get("kidflix_visitor")?.value;
    if (!visitor || !/^[A-Za-z0-9_-]{43}$/.test(visitor)) {
      visitor = randomBytes(32).toString("base64url");
      jar.set("kidflix_visitor", visitor, {
        httpOnly: true,
        secure: u.protocol === "https:",
        sameSite: "lax",
        path: "/api/kidflix",
        maxAge: 90 * 86400,
      });
    }
    const rateKey = createHash("sha256").update(visitor).digest("hex"),
      now = Date.now(),
      prior = limits.get(rateKey),
      bucket = prior && now - prior.at < 60000 ? prior : { at: now, count: 0 };
    if (++bucket.count > 90)
      return Response.json(
        { error: "PLEASE_WAIT" },
        { status: 429, headers: { ...headers, "Retry-After": "60" } },
      );
    limits.set(rateKey, bucket);
    if (limits.size > 10000)
      for (const [id, b] of limits) if (now - b.at > 60000) limits.delete(id);
    if (limits.size > 10000) {
      const oldest = limits.keys().next().value;
      if (oldest) limits.delete(oldest);
    }
    const result=await publicAction(host,key,input,visitor);
    return Response.json({...result,...(input.operation==='grade'&&typeof result.percent==='number'?{outcomeReceipt:outcomeReceipt(key,input.locale,input.releaseId,'result'),completionReceipt:outcomeReceipt(key,input.locale,input.releaseId,'complete')}:{})},{headers});
  } catch (e) {
    const code = (e as Error).message,
      status =
        code === "NOT_FOUND"
          ? 404
          : code === "EDITION_CHANGED"
            ? 409
            : code.startsWith("INVALID")
              ? 400
              : 503;
    return Response.json(
      {
        error: [
          "NOT_FOUND",
          "EDITION_CHANGED",
          "INVALID_CHOICES",
          "INVALID_REQUEST",
          "ACTION_NOT_AVAILABLE",
        ].includes(code)
          ? code
          : "ACTION_UNAVAILABLE",
      },
      { status, headers },
    );
  }
}
