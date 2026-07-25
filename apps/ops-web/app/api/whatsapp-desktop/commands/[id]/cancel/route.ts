import { NextRequest } from "next/server"
import { auditEvent, fail, governanceContext, ok, parseBody } from "@/lib/whatsapp-desktop/server"

export async function POST(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.command.issue" })
  if ("error" in context) return context.error
  const id = String((await Promise.resolve(routeContext.params)).id || "")
  const body = await parseBody(request)
  const channel = body.command_channel === "station" ? "station" : "whatsapp"
  const table = channel === "station" ? "desktop_station_commands" : "whatsapp_desktop_commands"
  const { data: current } = await context.supabase.from(table).select("*").eq("id", id).maybeSingle()
  if (!current) return fail("COMMAND_NOT_FOUND", 404)
  if (!["created", "delivered", "received"].includes(current.status)) return fail("COMMAND_NOT_CANCELLABLE", 409)
  const reason = String(body.reason || "Commande annulée depuis le centre de gouvernance").slice(0, 1000)
  const { data, error } = await context.supabase.from(table).update({ status: "cancelled", cancelled_by: context.userId, cancelled_at: new Date().toISOString(), cancellation_reason: reason }).eq("id", id).select("*").single()
  if (error) return fail(error.message, 400)
  await auditEvent(context.supabase, { actorUserId: context.userId, deviceId: current.device_id, workspaceId: current.workspace_id, action: "remote_command.cancelled", reason, previousState: current, newState: data, commandId: channel === "whatsapp" ? id : null, ip: context.ip, userAgent: context.userAgent })
  return ok(data)
}
