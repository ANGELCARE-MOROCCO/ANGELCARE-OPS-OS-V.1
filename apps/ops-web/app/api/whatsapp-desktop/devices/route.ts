import { NextRequest } from "next/server"
import { fail, governanceContext, ok, publicDevice } from "@/lib/whatsapp-desktop/server"

export async function GET(request: NextRequest) {
  const context = await governanceContext(request)
  if ("error" in context) return context.error
  const mine = request.nextUrl.searchParams.get("mine") === "1"
  let query = context.supabase.from("whatsapp_desktop_devices").select("*,workspace_access:whatsapp_desktop_device_workspace_access(*)").order("created_at", { ascending: false })
  if (mine) query = query.eq("current_user_id", context.userId)
  else {
    const role = String(context.user.role || "").toLowerCase()
    const allowed = ["ceo", "owner", "super_admin", "admin"].includes(role) || (Array.isArray(context.user.permissions) && context.user.permissions.includes("whatsapp_desktop.device.view"))
    if (!allowed) return fail("GOVERNANCE_PERMISSION_DENIED", 403)
  }
  const { data, error } = await query
  if (error) return fail(error.message, 500)
  return ok((data || []).map(publicDevice))
}
