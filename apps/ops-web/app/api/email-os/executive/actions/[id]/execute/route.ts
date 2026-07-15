import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { nowIso } from "@/lib/email-os-core/schema"
import { audit } from "@/lib/email-os-core/audit"

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const db = createEmailOSCoreDb()

    const { data: action, error: loadError } = await db
      .from("email_os_core_executive_command_actions")
      .select("*")
      .eq("id", id)
      .single()

    if (loadError) throw loadError
    if (!action) throw new Error("Executive action not found")

    const result: Record<string, unknown> = {
      executed: true,
      actionType: action.action_type,
      executedAt: nowIso()
    }

    if (action.action_type === "assign_thread" && action.target_id) {
      await db
        .from("email_os_core_threads")
        .update({
          owner: action.payload?.owner || "executive-office",
          status: "assigned",
          last_action: "executive.assign_thread",
          updated_at: nowIso()
        })
        .eq("id", action.target_id)

      result.threadAssigned = true
    }

    if (action.action_type === "escalate_thread" && action.target_id) {
      await db
        .from("email_os_core_threads")
        .update({
          status: "escalated",
          priority: "critical",
          last_action: "executive.escalate_thread",
          updated_at: nowIso()
        })
        .eq("id", action.target_id)

      result.threadEscalated = true
    }

    const { data, error } = await db
      .from("email_os_core_executive_command_actions")
      .update({
        command_status: "executed",
        result,
        executed_at: nowIso()
      })
      .eq("id", id)
      .select("*")
      .single()

    if (error) throw error

    await audit("executive.action_executed", {
      targetType: action.target_type,
      targetId: action.target_id,
      actionType: action.action_type
    })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Executive action execution failed" }, { status: 500 })
  }
}
