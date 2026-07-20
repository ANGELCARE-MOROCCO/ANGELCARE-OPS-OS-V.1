import { NextRequest } from "next/server"
import { auditEvent, fail, governanceContext, ok, parseBody, publicDevice, revokeActiveLeases, securityEvent } from "@/lib/whatsapp-desktop/server"

export async function POST(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.device.revoke" })
  if ("error" in context) return context.error
  const id = String((await Promise.resolve(routeContext.params)).id || "")
  const body = await parseBody(request)
  const emergency = body.emergency === true
  const reason = String(body.reason || (emergency ? "Appareil déclaré compromis" : "Révocation de l’appareil"))
  const { data: current } = await context.supabase.from("whatsapp_desktop_devices").select("*").eq("id", id).maybeSingle()
  if (!current) return fail("DEVICE_NOT_FOUND", 404)
  const now = new Date().toISOString()
  const status = emergency ? "compromised" : "revoked"
  const { data, error } = await context.supabase.from("whatsapp_desktop_devices").update({ approval_status: status, revoked_at: now, revoked_by: context.userId, revoke_reason: reason, compromised_at: emergency ? now : current.compromised_at }).eq("id", id).select("*").single()
  if (error) return fail(error.message, 400)
  await context.supabase.from("whatsapp_desktop_device_workspace_access").update({ status: "revoked", revoked_by: context.userId, revoked_at: now, reason }).eq("device_id", id)
  await revokeActiveLeases(context.supabase, { deviceId: id, actorId: context.userId, reason })
  const commands = ["HIDE_WHATSAPP_VIEW", "CLEAR_WHATSAPP_SESSION", ...(emergency ? ["LOG_OUT_ANGELCARE_DESKTOP"] : [])]
  for (const command of commands) await context.supabase.from("whatsapp_desktop_commands").insert({ device_id: id, command_type: command, reason, issued_by: context.userId })
  await auditEvent(context.supabase, { actorUserId: context.userId, targetUserId: data.current_user_id, deviceId: id, action: emergency ? "device.compromised" : "device.revoked", reason, previousState: current, newState: data, ip: context.ip, userAgent: context.userAgent })
  await securityEvent(context.supabase, { severity: emergency ? "critical" : "high", eventType: emergency ? "device_marked_compromised" : "device_revoked", userId: data.current_user_id, deviceId: id, title: emergency ? "Appareil déclaré compromis" : "Appareil révoqué", description: reason })
  return ok(publicDevice(data))
}
