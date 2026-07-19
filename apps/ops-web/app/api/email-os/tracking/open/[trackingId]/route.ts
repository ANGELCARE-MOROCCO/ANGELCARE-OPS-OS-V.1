import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

const ONE_BY_ONE_GIF = Buffer.from(
  "R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==",
  "base64"
)

function clean(value: any) {
  return typeof value === "string" ? value.trim() : ""
}

function requestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") || ""
  return clean(forwarded.split(",")[0]) || clean(request.headers.get("x-real-ip")) || ""
}

function trackingGraceMs() {
  const configured = Number(process.env.EMAIL_OS_TRACKING_GRACE_SECONDS || 45)
  const seconds = Number.isFinite(configured) ? Math.max(10, Math.min(300, configured)) : 45
  return seconds * 1000
}

function isKnownAutomatedAgent(userAgent: string) {
  return /(curl|wget|python|node-fetch|undici|axios|postman|insomnia|healthcheck|uptime|monitor|crawler|spider|scanner|security bot|link checker|preview bot)/i.test(userAgent)
}

export async function GET(
  request: Request,
  context: { params: Promise<{ trackingId: string }> }
) {
  const headers = {
    "Content-Type": "image/gif",
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    Pragma: "no-cache",
    Expires: "0",
  }

  try {
    const { trackingId: rawTrackingId } = await context.params
    const trackingId = clean(rawTrackingId).replace(/\.gif$/i, "")
    if (!trackingId) return new NextResponse(ONE_BY_ONE_GIF, { status: 200, headers })

    const db = createEmailOSCoreDb()
    const now = nowIso()
    const userAgent = clean(request.headers.get("user-agent"))
    const ip = requestIp(request)
    const { data: outbox } = await db
      .from("email_os_core_outbox")
      .select("id, mailbox_id, to_email, tracking_id, tracking_enabled, first_opened_at, last_opened_at, open_count, diagnostics, sent_at, created_at")
      .eq("tracking_id", trackingId)
      .limit(1)
      .maybeSingle()

    const sentTimestamp = new Date(outbox?.sent_at || outbox?.created_at || 0).getTime()
    const elapsedMs = Number.isFinite(sentTimestamp) && sentTimestamp > 0 ? Date.now() - sentTimestamp : null
    const firstSignal = Number(outbox?.open_count || 0) === 0 && !outbox?.first_opened_at && !outbox?.last_opened_at
    const graceProbe = firstSignal && elapsedMs !== null && elapsedMs >= 0 && elapsedMs < trackingGraceMs()
    const automatedProbe = isKnownAutomatedAgent(userAgent)
    const ignoredForEngagement = graceProbe || automatedProbe
    const eventType = ignoredForEngagement ? "open_probe" : "open"

    await db.from("email_os_tracking_events").insert({
      id: makeEmailOSId(),
      tracking_id: trackingId,
      outbox_id: outbox?.id || null,
      mailbox_id: outbox?.mailbox_id || null,
      recipient_email: outbox?.to_email || null,
      event_type: eventType,
      user_agent: userAgent || null,
      ip_address: ip || null,
      metadata_json: {
        path: new URL(request.url).pathname,
        ignoredForEngagement,
        reason: graceProbe ? "initial_delivery_probe" : automatedProbe ? "known_automated_agent" : "recipient_open",
        elapsedSinceSendMs: elapsedMs,
      },
      created_at: now
    }).then(() => null, () => null)

    if (outbox?.id && !ignoredForEngagement) {
      const count = Number(outbox.open_count || 0) + 1
      await db
        .from("email_os_core_outbox")
        .update({
          first_opened_at: outbox.first_opened_at || now,
          last_opened_at: now,
          open_count: count,
          diagnostics: {
            ...(outbox.diagnostics || {}),
            tracking: {
              ...((outbox.diagnostics || {}).tracking || {}),
              enabled: true,
              trackingId,
              status: "opened",
              firstOpenedAt: outbox.first_opened_at || now,
              lastOpenedAt: now,
              openCount: count
            }
          },
          updated_at: now
        })
        .eq("tracking_id", trackingId)
        .then(() => null, () => null)
    }

    return new NextResponse(ONE_BY_ONE_GIF, { status: 200, headers })
  } catch {
    return new NextResponse(ONE_BY_ONE_GIF, { status: 200, headers })
  }
}
