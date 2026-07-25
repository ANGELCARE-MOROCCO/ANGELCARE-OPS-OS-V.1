import { NextRequest } from "next/server"
import { auditEvent, governanceContext, ok, parseBody, publicDevice, revokeActiveLeases } from "@/lib/whatsapp-desktop/server"
import { assertDeviceAction, DEVICE_ACTION_PERMISSIONS, issueDeviceCommand, lifecycleError, loadDevice } from "@/lib/whatsapp-desktop/device-lifecycle"

export async function POST(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: DEVICE_ACTION_PERMISSIONS.suspend })
  if ("error" in context) return context.error
  try {
    const id = String((await Promise.resolve(routeContext.params)).id || "")
    const body = await parseBody(request)
    const reason = String(body.reason || "Suspension administrative temporaire")
    const current = await loadDevice(context.supabase, id)
    assertDeviceAction(current, "suspend")
    const now = new Date().toISOString()
    const { data, error } = await context.supabase.from("whatsapp_desktop_devices").update({ approval_status: "suspended", suspended_at: now, suspended_by: context.userId, suspension_reason: reason, revoke_reason: reason }).eq("id", id).select("*").single()
    if (error) throw error
    await context.supabase.from("whatsapp_desktop_device_workspace_access").update({ status: "suspended", reason }).eq("device_id", id).eq("status", "approved")
    await revokeActiveLeases(context.supabase, { deviceId: id, actorId: context.userId, reason })
    const command = await issueDeviceCommand(context.supabase, { deviceId: id, commandType: "HIDE_WHATSAPP_VIEW", actorId: context.userId, reason })
    await auditEvent(context.supabase, { actorUserId: context.userId, targetUserId: data.current_user_id, deviceId: id, action: "device.suspended", reason, previousState: current, newState: data, commandId: command.id, ip: context.ip, userAgent: context.userAgent })
    return ok(publicDevice(data))
  } catch (error) { return lifecycleError(error) }
}
