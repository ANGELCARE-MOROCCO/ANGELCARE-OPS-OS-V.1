import { NextRequest } from "next/server"
import { auditEvent, fail, governanceContext, ok, parseBody, revokeActiveLeases } from "@/lib/whatsapp-desktop/server"

export async function POST(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.workspace.manage" })
  if ("error" in context) return context.error
  const id = String((await Promise.resolve(routeContext.params)).id || "")
  const body = await parseBody(request)
  const reason = String(body.reason || "Révocation de l’affectation")
  const { data: current } = await context.supabase.from("whatsapp_desktop_assignments").select("*").eq("id", id).maybeSingle()
  if (!current) return fail("ASSIGNMENT_NOT_FOUND", 404)
  const now = new Date().toISOString()
  const { data, error } = await context.supabase.from("whatsapp_desktop_assignments").update({ status: "revoked", revoked_at: now, revoked_by: context.userId, revoke_reason: reason }).eq("id", id).select("*").single()
  if (error) return fail(error.message, 400)
  await revokeActiveLeases(context.supabase, { userId: current.user_id, workspaceId: current.workspace_id, actorId: context.userId, reason })
  const { data: devices } = await context.supabase.from("whatsapp_desktop_devices").select("id").eq("current_user_id", current.user_id).in("approval_status", ["approved", "suspended"])
  for (const device of devices || []) {
    await context.supabase.from("whatsapp_desktop_commands").insert({ device_id: device.id, workspace_id: current.workspace_id, command_type: "HIDE_WHATSAPP_VIEW", reason, issued_by: context.userId })
    if (body.clear_session === true) await context.supabase.from("whatsapp_desktop_commands").insert({ device_id: device.id, workspace_id: current.workspace_id, command_type: "CLEAR_WHATSAPP_SESSION", reason, issued_by: context.userId })
  }
  await auditEvent(context.supabase, { actorUserId: context.userId, targetUserId: current.user_id, workspaceId: current.workspace_id, action: "assignment.revoked", reason, previousState: current, newState: data, ip: context.ip, userAgent: context.userAgent })
  return ok(data)
}
