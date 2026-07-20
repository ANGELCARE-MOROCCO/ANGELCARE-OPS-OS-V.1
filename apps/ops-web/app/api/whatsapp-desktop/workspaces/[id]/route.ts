import { NextRequest } from "next/server"
import { auditEvent, fail, governanceContext, ok, parseBody, sanitizeWorkspaceInput } from "@/lib/whatsapp-desktop/server"

async function idOf(context: { params: Promise<{ id: string }> | { id: string } }) {
  return String((await Promise.resolve(context.params)).id || "")
}

export async function GET(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.workspace.view" })
  if ("error" in context) return context.error
  const id = await idOf(routeContext)
  const { data, error } = await context.supabase.from("whatsapp_desktop_workspaces").select("*,policy:whatsapp_desktop_workspace_policies(*)").eq("id", id).maybeSingle()
  if (error) return fail(error.message, 500)
  if (!data) return fail("WORKSPACE_NOT_FOUND", 404)
  return ok(data)
}

export async function PATCH(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.workspace.manage" })
  if ("error" in context) return context.error
  const id = await idOf(routeContext)
  const { data: current } = await context.supabase.from("whatsapp_desktop_workspaces").select("*").eq("id", id).maybeSingle()
  if (!current) return fail("WORKSPACE_NOT_FOUND", 404)
  const body = await parseBody(request)
  const update = sanitizeWorkspaceInput(body, current)
  const { data, error } = await context.supabase.from("whatsapp_desktop_workspaces").update({ ...update, updated_by: context.userId }).eq("id", id).select("*").single()
  if (error) return fail(error.message, 400)
  await auditEvent(context.supabase, { actorUserId: context.userId, targetUserId: data.owner_user_id, workspaceId: id, action: "workspace.updated", reason: body.reason || "Mise à jour espace WhatsApp", previousState: current, newState: data, ip: context.ip, userAgent: context.userAgent })
  return ok(data)
}
