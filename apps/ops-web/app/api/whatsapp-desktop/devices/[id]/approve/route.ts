import { NextRequest } from "next/server"
import { auditEvent, governanceContext, ok, parseBody, publicDevice, securityEvent } from "@/lib/whatsapp-desktop/server"
import { assertDeviceAction, DEVICE_ACTION_PERMISSIONS, lifecycleError, loadDevice } from "@/lib/whatsapp-desktop/device-lifecycle"

export async function POST(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: DEVICE_ACTION_PERMISSIONS.approve })
  if ("error" in context) return context.error
  try {
    const id = String((await Promise.resolve(routeContext.params)).id || "")
    const body = await parseBody(request)
    const current = await loadDevice(context.supabase, id)
    assertDeviceAction(current, "approve")
    const now = new Date().toISOString()
    const { data, error } = await context.supabase.from("whatsapp_desktop_devices").update({ approval_status: "approved", approved_at: now, approved_by: context.userId, rejected_at: null, rejected_by: null, revoked_at: null, revoked_by: null, revoke_reason: null, suspended_at: null, suspended_by: null, suspension_reason: null }).eq("id", id).select("*").single()
    if (error) throw error
    const workspaceIds = Array.isArray(body.workspace_ids) ? body.workspace_ids.map(String) : body.workspace_id ? [String(body.workspace_id)] : []
    if (!workspaceIds.length) throw new Error("WORKSPACE_APPROVAL_REQUIRED")
    for (const workspaceId of workspaceIds) {
      await context.supabase.from("whatsapp_desktop_device_workspace_access").upsert({ device_id: id, workspace_id: workspaceId, status: "approved", approved_by: context.userId, approved_at: now, revoked_by: null, revoked_at: null, reason: body.reason || "Approbation appareil" }, { onConflict: "device_id,workspace_id" })
    }
    await auditEvent(context.supabase, { actorUserId: context.userId, targetUserId: data.current_user_id, deviceId: id, action: "device.approved", reason: String(body.reason || "Approbation appareil"), previousState: current, newState: data, ip: context.ip, userAgent: context.userAgent })
    await securityEvent(context.supabase, { severity: "informational", eventType: "device_approved", userId: data.current_user_id, deviceId: id, title: "Appareil ANGELCARE Desktop approuvé", description: data.device_name, metadata: { workspace_ids: workspaceIds } })
    return ok(publicDevice(data))
  } catch (error) { return lifecycleError(error) }
}
