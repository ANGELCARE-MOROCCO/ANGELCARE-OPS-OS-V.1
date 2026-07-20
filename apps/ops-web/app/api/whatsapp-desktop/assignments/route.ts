import { NextRequest } from "next/server"
import { auditEvent, fail, governanceContext, ok, parseBody } from "@/lib/whatsapp-desktop/server"

export async function GET(request: NextRequest) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.workspace.view" })
  if ("error" in context) return context.error
  let query = context.supabase.from("whatsapp_desktop_assignments").select("*,workspace:whatsapp_desktop_workspaces(id,name,code,status)").order("created_at", { ascending: false })
  const workspaceId = request.nextUrl.searchParams.get("workspaceId")
  if (workspaceId) query = query.eq("workspace_id", workspaceId)
  const { data, error } = await query
  if (error) return fail(error.message, 500)
  return ok(data || [])
}

export async function POST(request: NextRequest) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.workspace.manage" })
  if ("error" in context) return context.error
  const body = await parseBody(request)
  const workspaceId = String(body.workspace_id || "")
  const userId = String(body.user_id || "")
  const role = ["owner", "administrator", "supervisor", "operator", "auditor"].includes(String(body.role)) ? String(body.role) : "operator"
  if (!workspaceId || !userId) return fail("WORKSPACE_AND_USER_REQUIRED")
  const row = {
    workspace_id: workspaceId,
    user_id: userId,
    role,
    permissions: Array.isArray(body.permissions) ? body.permissions : [],
    status: "active",
    valid_from: body.valid_from || new Date().toISOString(),
    valid_until: body.valid_until || null,
    assigned_by: context.userId,
    revoked_at: null,
    revoked_by: null,
    revoke_reason: null,
  }
  const { data, error } = await context.supabase.from("whatsapp_desktop_assignments").upsert(row, { onConflict: "workspace_id,user_id" }).select("*").single()
  if (error) return fail(error.message, 400)
  await auditEvent(context.supabase, { actorUserId: context.userId, targetUserId: userId, workspaceId, action: "assignment.activated", reason: body.reason || "Affectation WhatsApp Desktop", newState: data, ip: context.ip, userAgent: context.userAgent })
  return ok(data, { status: 201 })
}
