import crypto from "node:crypto"
import { NextRequest } from "next/server"
import { auditEvent, fail, governanceContext, ok, parseBody } from "@/lib/whatsapp-desktop/server"

export async function POST(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.command.issue" })
  if ("error" in context) return context.error
  const id = String((await Promise.resolve(routeContext.params)).id || "")
  const body = await parseBody(request)
  const channel = body.command_channel === "station" ? "station" : "whatsapp"
  const table = channel === "station" ? "desktop_station_commands" : "whatsapp_desktop_commands"
  const { data: current, error: readError } = await context.supabase.from(table).select("*").eq("id", id).maybeSingle()
  if (readError) return fail(readError.message, 500)
  if (!current) return fail("COMMAND_NOT_FOUND", 404)
  if (!["failed", "expired", "cancelled"].includes(current.status)) return fail("COMMAND_NOT_RETRYABLE", 409)
  if (Number(current.retry_count || 0) >= Number(current.max_retries || 3)) return fail("MAX_RETRIES_REACHED", 409)
  const reason = String(body.reason || `Nouvelle tentative de ${current.command_type}`).slice(0, 1000)
  const correlationId = current.correlation_id || crypto.randomUUID()
  const { data, error } = await context.supabase.from(table).insert({
    device_id: current.device_id,
    workspace_id: current.workspace_id || null,
    ...(channel === "station" ? { policy_id: current.policy_id || null } : {}),
    command_type: current.command_type,
    payload: current.payload || {},
    reason,
    status: "created",
    issued_by: context.userId,
    expires_at: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
    correlation_id: correlationId,
    priority: current.priority || "high",
    retry_count: Number(current.retry_count || 0) + 1,
    max_retries: Number(current.max_retries || 3),
    last_retry_at: new Date().toISOString(),
    acknowledgement_deadline: new Date(Date.now() + 10 * 60_000).toISOString(),
  }).select("*").single()
  if (error) return fail(error.message, 400)
  await auditEvent(context.supabase, { actorUserId: context.userId, deviceId: current.device_id, workspaceId: current.workspace_id, action: "remote_command.retried", reason, previousState: current, newState: data, commandId: channel === "whatsapp" ? data.id : null, ip: context.ip, userAgent: context.userAgent })
  return ok(data, { status: 201 })
}
