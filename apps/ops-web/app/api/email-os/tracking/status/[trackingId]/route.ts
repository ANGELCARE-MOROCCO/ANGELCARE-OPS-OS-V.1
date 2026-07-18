import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

function clean(value: any) {
  return String(value ?? "").trim()
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
      .select("id, mailbox_id, tracking_id, tracking_enabled, first_opened_at, last_opened_at, open_count, diagnostics, updated_at")
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
      .limit(10)
      .then((result: any) => result, () => ({ data: [] }))

    return NextResponse.json({
      ok: true,
      data: {
        trackingId,
        opened: Number(outbox?.open_count || 0) > 0 || Boolean(outbox?.first_opened_at || outbox?.last_opened_at) || Boolean((events || []).length),
        firstOpenedAt: outbox?.first_opened_at || outbox?.diagnostics?.tracking?.firstOpenedAt || (events || []).slice().reverse()[0]?.created_at || null,
        lastOpenedAt: outbox?.last_opened_at || outbox?.diagnostics?.tracking?.lastOpenedAt || (events || [])[0]?.created_at || null,
        openCount: Math.max(Number(outbox?.open_count || outbox?.diagnostics?.tracking?.openCount || 0), (events || []).filter((event: any) => event.event_type === "open" || event.event_type === "open_probe").length),
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
