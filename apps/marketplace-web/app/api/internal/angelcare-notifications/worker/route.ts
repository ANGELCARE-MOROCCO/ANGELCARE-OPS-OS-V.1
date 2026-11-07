import { createHash, timingSafeEqual } from "node:crypto";
import { runNotificationWorker } from "@/angelcare-marketplace/admin-notifications/worker";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function POST(request: Request) {
  const secret = process.env.MARKETPLACE_NOTIFICATIONS_WORKER_SECRET || "",
    token = (request.headers.get("authorization") || "").replace(
      /^Bearer /,
      "",
    );
  const headers = { "Cache-Control": "private, no-store" };
  if (
    secret.length < 32 ||
    token.length > 256 ||
    !timingSafeEqual(
      createHash("sha256").update(secret).digest(),
      createHash("sha256").update(token).digest(),
    )
  )
    return Response.json(
      { ok: false, error: "NOT_AUTHORIZED" },
      { status: 401, headers },
    );
  try {
    return Response.json(
      { ok: true, data: await runNotificationWorker() },
      { headers },
    );
  } catch {
    return Response.json(
      { ok: false, error: "NOTIFICATION_WORKER_FAILED" },
      { status: 503, headers },
    );
  }
}
