import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { nowIso } from "@/lib/email-os-core/schema"
import { audit } from "@/lib/email-os-core/audit"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const ids: string[] = Array.isArray(body.threadIds) ? body.threadIds : []
    const action = body.action || "archive"

    if (ids.length === 0) {
      return NextResponse.json({ ok: false, error: "No thread IDs provided" }, { status: 400 })
    }

    const updates: Record<string, unknown> = {
      updated_at: nowIso(),
      last_action: `bulk.${action}`
    }

    if (action === "archive") {
      updates.status = "archived"
      updates.archived_at = nowIso()
    }

    if (action === "resolve") {
      updates.status = "resolved"
      updates.resolved_at = nowIso()
    }

    if (action === "assign") {
      updates.status = "assigned"
      updates.owner = body.owner || "operations"
      updates.assigned_at = nowIso()
    }

    if (action === "escalate") {
      updates.status = "escalated"
      updates.priority = "critical"
    }

    const db = createEmailOSCoreDb()
    const { data, error } = await db
      .from("email_os_core_threads")
      .update(updates)
      .in("id", ids)
      .select("*")

    if (error) throw error

    await audit(`bulk.thread.${action}`, {
      targetType: "threads",
      count: ids.length,
      action
    })
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Bulk action failed" }, { status: 500 })
  }
}
