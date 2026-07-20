import { NextRequest } from "next/server"
import { auditEvent, fail, governanceContext, ok, parseBody } from "@/lib/whatsapp-desktop/server"

export async function GET(request: NextRequest) {
  const context = await governanceContext(request)
  if ("error" in context) return context.error
  const mine = request.nextUrl.searchParams.get("mine") === "1"
  let query = context.supabase.from("whatsapp_desktop_access_requests").select("*,workspace:whatsapp_desktop_workspaces(id,name,code),device:whatsapp_desktop_devices(id,device_name,installation_id)").order("created_at", { ascending: false })
  if (mine) query = query.eq("user_id", context.userId)
  else {
    const role = String(context.user.role || "").toLowerCase()
    const allowed = ["ceo", "owner", "super_admin", "admin"].includes(role) || (Array.isArray(context.user.permissions) && context.user.permissions.includes("whatsapp_desktop.workspace.manage"))
    if (!allowed) return fail("GOVERNANCE_PERMISSION_DENIED", 403)
  }
  const { data, error } = await query.limit(500)
  if (error) return fail(error.message, 500)
  return ok(data || [])
}

export async function POST(request: NextRequest) {
  const context = await governanceContext(request)
  if ("error" in context) return context.error
  const body = await parseBody(request)
  const workspaceId = String(body.workspace_id || "")
  const reason = String(body.business_reason || "").trim()
  if (!workspaceId || reason.length < 8) return fail("WORKSPACE_AND_BUSINESS_REASON_REQUIRED")
  let deviceId = body.device_id || null
  if (!deviceId && body.installation_id) {
    const { data: device } = await context.supabase.from("whatsapp_desktop_devices").select("id").eq("installation_id", body.installation_id).eq("current_user_id", context.userId).maybeSingle()
    deviceId = device?.id || null
  }
  const { data, error } = await context.supabase.from("whatsapp_desktop_access_requests").insert({ workspace_id: workspaceId, user_id: context.userId, device_id: deviceId, business_reason: reason.slice(0, 3000), requested_until: body.requested_until || null }).select("*").single()
  if (error) return fail(error.message, 400)
  await auditEvent(context.supabase, { actorUserId: context.userId, targetUserId: context.userId, deviceId, workspaceId, action: "access_request.created", reason, newState: data, ip: context.ip, userAgent: context.userAgent })
  return ok(data, { status: 201 })
}
