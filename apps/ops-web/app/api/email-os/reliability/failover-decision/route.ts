import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()

    const row = {
      id: makeEmailOSId(),
      mailbox_id: body.mailboxId || null,
      primary_provider_profile_id: body.primaryProviderProfileId || null,
      fallback_provider_profile_id: body.fallbackProviderProfileId || null,
      failover_reason: body.reason || "manual or health-based failover",
      status: body.status || "pending",
      metadata: body.metadata || {},
      created_at: nowIso()
    }

    const { data, error } = await db.from("email_os_core_provider_failover_events").insert(row).select("*").single()
    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failover decision failed" }, { status: 500 })
  }
}
