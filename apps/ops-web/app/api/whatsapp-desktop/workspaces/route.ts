import { NextRequest } from "next/server"
import { accessEvent, auditEvent, fail, governanceContext, ok, parseBody, sanitizePolicyInput, sanitizeWorkspaceInput } from "@/lib/whatsapp-desktop/server"

export async function GET(request: NextRequest) {
  const context = await governanceContext(request)
  if ("error" in context) return context.error
  const mine = request.nextUrl.searchParams.get("mine") === "1"
  const catalog = request.nextUrl.searchParams.get("catalog") === "1"
  if (catalog) {
    const { data, error } = await context.supabase
      .from("whatsapp_desktop_workspaces")
      .select("id,code,name,description,phone_number_e164,department,security_level,status")
      .eq("status", "active")
      .order("name", { ascending: true })
    if (error) return fail(error.message, 500)
    return ok(data || [])
  }
  if (mine) {
    const { data: assignments, error } = await context.supabase
      .from("whatsapp_desktop_assignments")
      .select("*,workspace:whatsapp_desktop_workspaces(*,policy:whatsapp_desktop_workspace_policies(*))")
      .eq("user_id", context.userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
    if (error) return fail(error.message, 500)
    const now = Date.now()
    const rows = (assignments || []).filter((row: any) => !row.valid_until || new Date(row.valid_until).getTime() > now)
    return ok(rows.map((row: any) => ({ ...row.workspace, assignment: { ...row, workspace: undefined } })).filter((row: any) => row.status === "active"))
  }
  if (!context.user || !["ceo", "owner", "super_admin", "admin"].includes(String(context.user.role || "").toLowerCase()) && !(Array.isArray(context.user.permissions) && context.user.permissions.includes("whatsapp_desktop.workspace.view"))) {
    return fail("GOVERNANCE_PERMISSION_DENIED", 403)
  }
  const { data, error } = await context.supabase
    .from("whatsapp_desktop_workspaces")
    .select("*,policy:whatsapp_desktop_workspace_policies(*)")
    .order("created_at", { ascending: false })
  if (error) return fail(error.message, 500)
  return ok(data || [])
}

export async function POST(request: NextRequest) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.workspace.manage" })
  if ("error" in context) return context.error
  const body = await parseBody(request)
  const input = sanitizeWorkspaceInput(body)
  if (!input.code || !input.name || !input.owner_user_id) return fail("WORKSPACE_CODE_NAME_OWNER_REQUIRED")
  const { data, error } = await context.supabase
    .from("whatsapp_desktop_workspaces")
    .insert({ ...input, created_by: context.userId, updated_by: context.userId })
    .select("*")
    .single()
  if (error) return fail(error.message, 400)
  const policy = sanitizePolicyInput(data.id, body.policy || {})
  await context.supabase.from("whatsapp_desktop_workspace_policies").insert({ ...policy, updated_by: context.userId })
  await context.supabase.from("whatsapp_desktop_assignments").upsert({
    workspace_id: data.id,
    user_id: input.owner_user_id,
    role: "owner",
    permissions: ["whatsapp_desktop.*"],
    status: "active",
    assigned_by: context.userId,
  }, { onConflict: "workspace_id,user_id" })
  await auditEvent(context.supabase, { actorUserId: context.userId, targetUserId: input.owner_user_id, workspaceId: data.id, action: "workspace.created", reason: body.reason || "Création espace WhatsApp", newState: data, ip: context.ip, userAgent: context.userAgent })
  await accessEvent(context.supabase, { eventType: "workspace_created", userId: context.userId, workspaceId: data.id, outcome: "success", ip: context.ip, userAgent: context.userAgent })
  return ok(data, { status: 201 })
}
