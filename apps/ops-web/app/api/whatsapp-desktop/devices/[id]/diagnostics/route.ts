import { NextRequest } from "next/server"
import { governanceContext, fail, ok, parseBody, auditEvent } from "@/lib/whatsapp-desktop/server"

export async function POST(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.command.issue" })
  if ("error" in context) return context.error
  const deviceId = String((await Promise.resolve(routeContext.params)).id || "")
  const body = await parseBody(request)
  const reason = String(body.reason || "Diagnostic gouverné demandé par l’administration").slice(0, 1000)
  const now = new Date().toISOString()
  const { data, error } = await context.supabase.from("desktop_station_commands").insert({
    device_id: deviceId,
    command_type: "REQUEST_STATION_DIAGNOSTICS",
    payload: { requested_scope: body.scope || "full", requested_at: now },
    reason,
    status: "created",
    issued_by: context.userId,
    expires_at: new Date(Date.now() + 60 * 60_000).toISOString(),
    priority: "high",
    acknowledgement_deadline: new Date(Date.now() + 10 * 60_000).toISOString(),
  }).select("*").single()
  if (error) return fail(error.message, 400)
  await context.supabase.from("whatsapp_desktop_devices").update({ last_diagnostics_at: now, synchronization_status: "pending" }).eq("id", deviceId)
  await auditEvent(context.supabase, { actorUserId: context.userId, deviceId, action: "device.diagnostics.requested", reason, newState: data, commandId: null, ip: context.ip, userAgent: context.userAgent })
  return ok(data, { status: 201 })
}
