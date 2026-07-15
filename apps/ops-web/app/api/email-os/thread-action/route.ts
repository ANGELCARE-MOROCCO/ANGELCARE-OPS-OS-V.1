import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { nowIso } from "@/lib/email-os-core/schema"
import { audit } from "@/lib/email-os-core/audit"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const threadId = body.threadId
    const action = body.action

    if (!threadId || !action) {
      return NextResponse.json({ ok: false, error: "Missing threadId or action" }, { status: 400 })
    }

    const updates: Record<string, unknown> = {
      updated_at: nowIso(),
      last_action: action
    }

    if (action === "read") updates.status = body.status || "open"
    if (action === "assign") {
      updates.status = "assigned"
      updates.owner = body.owner || "operations"
      updates.assigned_at = nowIso()
    }
    if (action === "resolve") {
      updates.status = "resolved"
      updates.resolved_at = nowIso()
    }
    if (action === "archive") {
      updates.status = "archived"
      updates.archived_at = nowIso()
    }
    if (action === "escalate") {
      updates.status = "escalated"
      updates.priority = "critical"
    }
    if (action === "snooze") {
      updates.status = "snoozed"
      updates.snoozed_until = body.snoozedUntil || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }

    const db = createEmailOSCoreDb()
    const { data, error } = await db
      .from("email_os_core_threads")
      .update(updates)
      .eq("id", threadId)
      .select("*")
      .single()

    if (error) throw error

    await audit(`thread.${action}`, {
      targetType: "thread",
      targetId: threadId,
      severity: action === "escalate" ? "critical" : "info",
      updates
    })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Thread action failed" },
      { status: 500 }
    )
  }
}
