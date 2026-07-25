import { NextRequest } from "next/server"
import { auditEvent, governanceContext, ok, parseBody, publicDevice } from "@/lib/whatsapp-desktop/server"
import { assertDeviceAction, DEVICE_ACTION_PERMISSIONS, lifecycleError, loadDevice } from "@/lib/whatsapp-desktop/device-lifecycle"

export async function POST(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: DEVICE_ACTION_PERMISSIONS.approve })
  if ("error" in context) return context.error
  try {
    const id = String((await Promise.resolve(routeContext.params)).id || "")
    const body = await parseBody(request)
    const reason = String(body.reason || "Demande d’appareil rejetée")
    const current = await loadDevice(context.supabase, id)
    assertDeviceAction(current, "reject")
    const now = new Date().toISOString()
    const { data, error } = await context.supabase.from("whatsapp_desktop_devices").update({ approval_status: "rejected", rejected_at: now, rejected_by: context.userId, rejection_reason: reason }).eq("id", id).select("*").single()
    if (error) throw error
    await auditEvent(context.supabase, { actorUserId: context.userId, targetUserId: data.current_user_id, deviceId: id, action: "device.rejected", reason, previousState: current, newState: data, ip: context.ip, userAgent: context.userAgent })
    return ok(publicDevice(data))
  } catch (error) { return lifecycleError(error) }
}
