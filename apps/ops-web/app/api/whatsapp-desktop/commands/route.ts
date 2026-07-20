import { NextRequest } from "next/server"
import { auditEvent, fail, governanceContext, ok, parseBody, pendingCommands, REMOTE_COMMANDS } from "@/lib/whatsapp-desktop/server"

export async function GET(request: NextRequest) {
  const context = await governanceContext(request)
  if ("error" in context) return context.error
  const installationId = String(request.nextUrl.searchParams.get("installationId") || "")
  if (installationId) {
    const { data: device } = await context.supabase.from("whatsapp_desktop_devices").select("id,current_user_id").eq("installation_id", installationId).maybeSingle()
    if (!device) return fail("DEVICE_NOT_REGISTERED", 404)
    if (device.current_user_id && device.current_user_id !== context.userId) return fail("DEVICE_USER_MISMATCH", 403)
    return ok(await pendingCommands(context.supabase, device.id))
  }
  const role = String(context.user.role || "").toLowerCase()
  const allowed = ["ceo", "owner", "super_admin", "admin"].includes(role) || (Array.isArray(context.user.permissions) && context.user.permissions.includes("whatsapp_desktop.command.issue"))
  if (!allowed) return fail("GOVERNANCE_PERMISSION_DENIED", 403)
  const { data, error } = await context.supabase.from("whatsapp_desktop_commands").select("*,device:whatsapp_desktop_devices(id,device_name,installation_id),workspace:whatsapp_desktop_workspaces(id,name,code)").order("issued_at", { ascending: false }).limit(500)
  if (error) return fail(error.message, 500)
  return ok(data || [])
}

export async function POST(request: NextRequest) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.command.issue" })
  if ("error" in context) return context.error
  const body = await parseBody(request)
  const deviceId = String(body.device_id || "")
  const commandType = String(body.command_type || "") as any
  const reason = String(body.reason || "Commande distante ANGELCARE")
  if (!deviceId || !REMOTE_COMMANDS.has(commandType)) return fail("VALID_DEVICE_AND_COMMAND_REQUIRED")
  const expiresAt = body.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await context.supabase.from("whatsapp_desktop_commands").insert({ device_id: deviceId, workspace_id: body.workspace_id || null, command_type: commandType, payload: body.payload && typeof body.payload === "object" ? body.payload : {}, reason, issued_by: context.userId, expires_at: expiresAt }).select("*").single()
  if (error) return fail(error.message, 400)
  await auditEvent(context.supabase, { actorUserId: context.userId, deviceId, workspaceId: body.workspace_id || null, action: "remote_command.issued", reason, newState: data, commandId: data.id, ip: context.ip, userAgent: context.userAgent })
  return ok(data, { status: 201 })
}
