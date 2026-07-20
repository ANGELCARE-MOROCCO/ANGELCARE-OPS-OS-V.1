import { NextRequest } from "next/server"
import { auditEvent, fail, governanceContext, ok, parseBody, publicDevice, revokeActiveLeases } from "@/lib/whatsapp-desktop/server"

export async function POST(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.device.revoke" })
  if ("error" in context) return context.error
  const id = String((await Promise.resolve(routeContext.params)).id || "")
  const body = await parseBody(request)
  const reason = String(body.reason || "Suspension contrôlée de l’appareil")
  const { data: current } = await context.supabase.from("whatsapp_desktop_devices").select("*").eq("id", id).maybeSingle()
  if (!current) return fail("DEVICE_NOT_FOUND", 404)
  const { data, error } = await context.supabase.from("whatsapp_desktop_devices").update({ approval_status: "suspended", revoke_reason: reason }).eq("id", id).select("*").single()
  if (error) return fail(error.message, 400)
  await revokeActiveLeases(context.supabase, { deviceId: id, actorId: context.userId, reason })
  await context.supabase.from("whatsapp_desktop_commands").insert({ device_id: id, command_type: "HIDE_WHATSAPP_VIEW", reason, issued_by: context.userId })
  await auditEvent(context.supabase, { actorUserId: context.userId, targetUserId: data.current_user_id, deviceId: id, action: "device.suspended", reason, previousState: current, newState: data, ip: context.ip, userAgent: context.userAgent })
  return ok(publicDevice(data))
}
