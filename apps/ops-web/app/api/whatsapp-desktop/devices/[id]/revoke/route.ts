import { NextRequest } from "next/server"
import { auditEvent, governanceContext, ok, parseBody, publicDevice, revokeActiveLeases, securityEvent } from "@/lib/whatsapp-desktop/server"
import { assertDeviceAction, DEVICE_ACTION_PERMISSIONS, issueDeviceCommand, lifecycleError, loadDevice } from "@/lib/whatsapp-desktop/device-lifecycle"

export async function POST(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: DEVICE_ACTION_PERMISSIONS.revoke })
  if ("error" in context) return context.error
  try {
    const id = String((await Promise.resolve(routeContext.params)).id || "")
    const body = await parseBody(request)
    const emergency = body.emergency === true
    const reason = String(body.reason || (emergency ? "Appareil déclaré compromis" : "Révocation de l’appareil"))
    const current = await loadDevice(context.supabase, id)
    assertDeviceAction(current, "revoke")
    const now = new Date().toISOString()
    const status = emergency ? "compromised" : "revoked"
    const { data, error } = await context.supabase.from("whatsapp_desktop_devices").update({ approval_status: status, revoked_at: now, revoked_by: context.userId, revoke_reason: reason, compromised_at: emergency ? now : current.compromised_at }).eq("id", id).select("*").single()
    if (error) throw error
    await context.supabase.from("whatsapp_desktop_device_workspace_access").update({ status: "revoked", revoked_by: context.userId, revoked_at: now, reason }).eq("device_id", id)
    await revokeActiveLeases(context.supabase, { deviceId: id, actorId: context.userId, reason })
    const hide = await issueDeviceCommand(context.supabase, { deviceId: id, commandType: "HIDE_WHATSAPP_VIEW", actorId: context.userId, reason })
    await issueDeviceCommand(context.supabase, { deviceId: id, commandType: "CLEAR_WHATSAPP_SESSION", actorId: context.userId, reason })
    if (emergency) await issueDeviceCommand(context.supabase, { deviceId: id, commandType: "LOG_OUT_ANGELCARE_DESKTOP", actorId: context.userId, reason })
    await auditEvent(context.supabase, { actorUserId: context.userId, targetUserId: data.current_user_id, deviceId: id, action: emergency ? "device.compromised" : "device.revoked", reason, previousState: current, newState: data, commandId: hide.id, ip: context.ip, userAgent: context.userAgent })
    await securityEvent(context.supabase, { severity: emergency ? "critical" : "high", eventType: emergency ? "device_marked_compromised" : "device_revoked", userId: data.current_user_id, deviceId: id, title: emergency ? "Appareil déclaré compromis" : "Appareil révoqué", description: reason })
    return ok(publicDevice(data))
  } catch (error) { return lifecycleError(error) }
}
