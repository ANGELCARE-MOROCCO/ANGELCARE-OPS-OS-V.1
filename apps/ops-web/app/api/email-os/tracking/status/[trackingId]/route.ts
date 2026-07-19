import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

function clean(value: any) {
  return String(value ?? "").trim()
}

function trackingGraceMs() {
  const configured = Number(process.env.EMAIL_OS_TRACKING_GRACE_SECONDS || 45)
  const seconds = Number.isFinite(configured) ? Math.max(10, Math.min(300, configured)) : 45
  return seconds * 1000
}

export async function GET(
  request: Request,
  context: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId: rawTrackingId } = await context.params
    const trackingId = clean(rawTrackingId).replace(/\.gif$/i, "")
    if (!trackingId) {
      return NextResponse.json({ ok: false, error: "trackingId is required" }, { status: 400 })
    }

    const db = createEmailOSCoreDb()
    const { data: outbox, error } = await db
      .from("email_os_core_outbox")
      .select("id, mailbox_id, tracking_id, tracking_enabled, first_opened_at, last_opened_at, open_count, diagnostics, updated_at, sent_at, created_at")
      .eq("tracking_id", trackingId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    const { data: events } = await db
      .from("email_os_tracking_events")
      .select("id, event_type, user_agent, ip_address, created_at, metadata_json")
      .eq("tracking_id", trackingId)
      .order("created_at", { ascending: false })
      .limit(50)
      .then((result: any) => result, () => ({ data: [] }))

    const sentTimestamp = new Date(outbox?.sent_at || outbox?.created_at || 0).getTime()
    const engagementEvents = (events || []).filter((event: any) => {
      if (event.event_type !== "open") return false
      if (event.metadata_json?.ignoredForEngagement === true) return false
      const eventTimestamp = new Date(event.created_at || 0).getTime()
      if (sentTimestamp > 0 && eventTimestamp > 0 && eventTimestamp - sentTimestamp < trackingGraceMs()) return false
      return true
    })
    const probeEvents = (events || []).filter((event: any) => event.event_type === "open_probe" || event.metadata_json?.ignoredForEngagement === true)
    const hasEventHistory = (events || []).length > 0
    const eventOpenCount = engagementEvents.length
    const storedOpenCount = Number(outbox?.open_count || outbox?.diagnostics?.tracking?.openCount || 0)
    const openCount = hasEventHistory ? eventOpenCount : storedOpenCount
    const firstEvent = engagementEvents.slice().reverse()[0]
    const lastEvent = engagementEvents[0]
    const opened = openCount > 0

    return NextResponse.json({
      ok: true,
      data: {
        trackingId,
        opened,
        firstOpenedAt: opened ? firstEvent?.created_at || outbox?.first_opened_at || outbox?.diagnostics?.tracking?.firstOpenedAt || null : null,
        lastOpenedAt: opened ? lastEvent?.created_at || outbox?.last_opened_at || outbox?.diagnostics?.tracking?.lastOpenedAt || null : null,
        openCount,
        probeCount: probeEvents.length,
        events: events || [],
        trackingUrl: outbox?.diagnostics?.tracking?.url || null,
        trackingBaseUrl: outbox?.diagnostics?.tracking?.baseUrl || null,
        outboxId: outbox?.id || null,
        mailboxId: outbox?.mailbox_id || null
      }
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Tracking status failed" }, { status: 500 })
  }
}
