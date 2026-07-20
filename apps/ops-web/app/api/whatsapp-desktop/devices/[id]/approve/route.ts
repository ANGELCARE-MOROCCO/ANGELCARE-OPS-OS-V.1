import { NextRequest } from "next/server"
import { auditEvent, fail, governanceContext, ok, parseBody, publicDevice, securityEvent } from "@/lib/whatsapp-desktop/server"

export async function POST(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.device.approve" })
  if ("error" in context) return context.error
  const id = String((await Promise.resolve(routeContext.params)).id || "")
  const body = await parseBody(request)
  const { data: current } = await context.supabase.from("whatsapp_desktop_devices").select("*").eq("id", id).maybeSingle()
  if (!current) return fail("DEVICE_NOT_FOUND", 404)
  const now = new Date().toISOString()
  const { data, error } = await context.supabase.from("whatsapp_desktop_devices").update({ approval_status: "approved", approved_at: now, approved_by: context.userId, rejected_at: null, rejected_by: null, revoked_at: null, revoked_by: null, revoke_reason: null }).eq("id", id).select("*").single()
  if (error) return fail(error.message, 400)
  const workspaceIds = Array.isArray(body.workspace_ids) ? body.workspace_ids : body.workspace_id ? [body.workspace_id] : []
  for (const workspaceId of workspaceIds) {
    await context.supabase.from("whatsapp_desktop_device_workspace_access").upsert({ device_id: id, workspace_id: workspaceId, status: "approved", approved_by: context.userId, approved_at: now, reason: body.reason || "Approbation appareil" }, { onConflict: "device_id,workspace_id" })
  }
  await auditEvent(context.supabase, { actorUserId: context.userId, targetUserId: data.current_user_id, deviceId: id, action: "device.approved", reason: body.reason || "Approbation appareil", previousState: current, newState: data, ip: context.ip, userAgent: context.userAgent })
  await securityEvent(context.supabase, { severity: "informational", eventType: "device_approved", userId: data.current_user_id, deviceId: id, title: "Appareil ANGELCARE Desktop approuvé", description: data.device_name, metadata: { workspace_ids: workspaceIds } })
  return ok(publicDevice(data))
}
