import { NextRequest } from "next/server"
import { auditEvent, fail, governanceContext, ok, parseBody, sanitizePolicyInput } from "@/lib/whatsapp-desktop/server"

export async function GET(request: NextRequest) {
  const context = await governanceContext(request)
  if ("error" in context) return context.error
  const workspaceId = String(request.nextUrl.searchParams.get("workspaceId") || "")
  if (!workspaceId) return fail("WORKSPACE_REQUIRED")
  const { data, error } = await context.supabase.from("whatsapp_desktop_workspace_policies").select("*").eq("workspace_id", workspaceId).maybeSingle()
  if (error) return fail(error.message, 500)
  return ok(data || sanitizePolicyInput(workspaceId, {}))
}

export async function PATCH(request: NextRequest) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.workspace.manage" })
  if ("error" in context) return context.error
  const body = await parseBody(request)
  const workspaceId = String(body.workspace_id || "")
  if (!workspaceId) return fail("WORKSPACE_REQUIRED")
  const { data: current } = await context.supabase.from("whatsapp_desktop_workspace_policies").select("*").eq("workspace_id", workspaceId).maybeSingle()
  const policy = sanitizePolicyInput(workspaceId, body, current)
  const { data, error } = await context.supabase.from("whatsapp_desktop_workspace_policies").upsert({ ...policy, updated_by: context.userId }, { onConflict: "workspace_id" }).select("*").single()
  if (error) return fail(error.message, 400)
  await auditEvent(context.supabase, { actorUserId: context.userId, workspaceId, action: "workspace_policy.updated", reason: body.reason || "Mise à jour politique WhatsApp Desktop", previousState: current, newState: data, ip: context.ip, userAgent: context.userAgent })
  return ok(data)
}
