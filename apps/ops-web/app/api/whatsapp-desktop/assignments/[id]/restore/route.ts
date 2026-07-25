import { NextRequest } from "next/server"
import { auditEvent, fail, governanceContext, ok, parseBody } from "@/lib/whatsapp-desktop/server"

export async function POST(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.workspace.manage" })
  if ("error" in context) return context.error
  const id = String((await Promise.resolve(routeContext.params)).id || "")
  const body = await parseBody(request)
  const reason = String(body.reason || "Restauration de l’affectation")
  const { data: current } = await context.supabase.from("whatsapp_desktop_assignments").select("*").eq("id", id).maybeSingle()
  if (!current) return fail("ASSIGNMENT_NOT_FOUND", 404)
  if (!["suspended", "revoked", "expired"].includes(current.status)) return fail(`INVALID_ASSIGNMENT_TRANSITION:${current.status}:restore`, 409)
  const { data, error } = await context.supabase.from("whatsapp_desktop_assignments").update({ status: "active", revoked_at: null, revoked_by: null, revoke_reason: null, valid_from: new Date().toISOString(), valid_until: body.valid_until || current.valid_until || null }).eq("id", id).select("*").single()
  if (error) return fail(error.message, 400)
  const { data: devices } = await context.supabase.from("whatsapp_desktop_devices").select("id").eq("current_user_id", current.user_id).eq("approval_status", "approved")
  for (const device of devices || []) await context.supabase.from("whatsapp_desktop_commands").insert({ device_id: device.id, workspace_id: current.workspace_id, command_type: "REFRESH_AUTHORIZATION", reason, issued_by: context.userId })
  await auditEvent(context.supabase, { actorUserId: context.userId, targetUserId: current.user_id, workspaceId: current.workspace_id, action: "assignment.restored", reason, previousState: current, newState: data, ip: context.ip, userAgent: context.userAgent })
  return ok(data)
}
