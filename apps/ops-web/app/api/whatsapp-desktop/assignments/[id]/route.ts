import { NextRequest } from "next/server"
import { auditEvent, fail, governanceContext, ok, parseBody } from "@/lib/whatsapp-desktop/server"

export async function PATCH(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.workspace.manage" })
  if ("error" in context) return context.error
  const id = String((await Promise.resolve(routeContext.params)).id || "")
  const { data: current } = await context.supabase.from("whatsapp_desktop_assignments").select("*").eq("id", id).maybeSingle()
  if (!current) return fail("ASSIGNMENT_NOT_FOUND", 404)
  const body = await parseBody(request)
  const update: Record<string, unknown> = {}
  if (body.role && ["owner", "administrator", "supervisor", "operator", "auditor"].includes(String(body.role))) update.role = body.role
  if (Array.isArray(body.permissions)) update.permissions = body.permissions
  if (body.status && ["pending", "active", "suspended", "revoked", "expired"].includes(String(body.status))) update.status = body.status
  if ("valid_until" in body) update.valid_until = body.valid_until || null
  const { data, error } = await context.supabase.from("whatsapp_desktop_assignments").update(update).eq("id", id).select("*").single()
  if (error) return fail(error.message, 400)
  await auditEvent(context.supabase, { actorUserId: context.userId, targetUserId: data.user_id, workspaceId: data.workspace_id, action: "assignment.updated", reason: body.reason || "Mise à jour affectation", previousState: current, newState: data, ip: context.ip, userAgent: context.userAgent })
  return ok(data)
}
