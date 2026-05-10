import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()
    const { data, error } = await db.from("email_os_core_smtp_retry_policies").select("*").order("created_at", { ascending: false })
    if (error) throw error
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load SMTP policies" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()
    const row = {
      id: makeEmailOSId(),
      policy_name: body.policyName || "Default SMTP Retry Policy",
      max_attempts: Number(body.maxAttempts || 5),
      initial_delay_seconds: Number(body.initialDelaySeconds || 60),
      backoff_multiplier: Number(body.backoffMultiplier || 2),
      enabled: body.enabled !== false,
      created_at: nowIso()
    }
    const { data, error } = await db.from("email_os_core_smtp_retry_policies").insert(row).select("*").single()
    if (error) throw error
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to create SMTP policy" }, { status: 500 })
  }
}
