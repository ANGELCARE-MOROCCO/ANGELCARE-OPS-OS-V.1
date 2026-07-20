import { NextRequest } from "next/server"
import { auditEvent, fail, governanceContext, ok, parseBody } from "@/lib/whatsapp-desktop/server"

export async function POST(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.workspace.manage" })
  if ("error" in context) return context.error
  const id = String((await Promise.resolve(routeContext.params)).id || "")
  const body = await parseBody(request)
  const decision = body.decision === "approved" ? "approved" : body.decision === "rejected" ? "rejected" : ""
  if (!decision) return fail("VALID_DECISION_REQUIRED")
  const { data: current } = await context.supabase.from("whatsapp_desktop_access_requests").select("*").eq("id", id).maybeSingle()
  if (!current) return fail("ACCESS_REQUEST_NOT_FOUND", 404)
  const now = new Date().toISOString()
  const { data, error } = await context.supabase.from("whatsapp_desktop_access_requests").update({ status: decision, decided_by: context.userId, decided_at: now, decision_reason: String(body.reason || "Décision administrateur").slice(0, 2000) }).eq("id", id).select("*").single()
  if (error) return fail(error.message, 400)
  if (decision === "approved") {
    await context.supabase.from("whatsapp_desktop_assignments").upsert({ workspace_id: current.workspace_id, user_id: current.user_id, role: body.role || "operator", permissions: Array.isArray(body.permissions) ? body.permissions : [], status: "active", valid_until: current.requested_until || null, assigned_by: context.userId }, { onConflict: "workspace_id,user_id" })
    if (current.device_id) await context.supabase.from("whatsapp_desktop_device_workspace_access").upsert({ device_id: current.device_id, workspace_id: current.workspace_id, status: "approved", approved_by: context.userId, approved_at: now, reason: body.reason || "Demande d’accès approuvée" }, { onConflict: "device_id,workspace_id" })
  }
  await auditEvent(context.supabase, { actorUserId: context.userId, targetUserId: current.user_id, deviceId: current.device_id, workspaceId: current.workspace_id, action: `access_request.${decision}`, reason: body.reason || "Décision administrateur", previousState: current, newState: data, ip: context.ip, userAgent: context.userAgent })
  return ok(data)
}
