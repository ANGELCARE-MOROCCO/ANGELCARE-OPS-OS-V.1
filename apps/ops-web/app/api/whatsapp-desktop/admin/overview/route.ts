import { NextRequest } from "next/server"
import { fail, getUserDirectory, governanceContext, ok, publicDevice } from "@/lib/whatsapp-desktop/server"

export async function GET(request: NextRequest) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.workspace.view" })
  if ("error" in context) return context.error
  const [workspacesResult, assignmentsResult, devicesResult, requestsResult, commandsResult, securityResult, auditResult, users] = await Promise.all([
    context.supabase.from("whatsapp_desktop_workspaces").select("*,policy:whatsapp_desktop_workspace_policies(*)").order("created_at", { ascending: false }),
    context.supabase.from("whatsapp_desktop_assignments").select("*,workspace:whatsapp_desktop_workspaces(id,name,code)").order("created_at", { ascending: false }).limit(1000),
    context.supabase.from("whatsapp_desktop_devices").select("*,workspace_access:whatsapp_desktop_device_workspace_access(*)").order("created_at", { ascending: false }).limit(1000),
    context.supabase.from("whatsapp_desktop_access_requests").select("*,workspace:whatsapp_desktop_workspaces(id,name,code),device:whatsapp_desktop_devices(id,device_name)").order("created_at", { ascending: false }).limit(500),
    context.supabase.from("whatsapp_desktop_commands").select("*,device:whatsapp_desktop_devices(id,device_name),workspace:whatsapp_desktop_workspaces(id,name,code)").order("issued_at", { ascending: false }).limit(500),
    context.supabase.from("whatsapp_desktop_security_events").select("*").order("created_at", { ascending: false }).limit(500),
    context.supabase.from("whatsapp_desktop_audit_events").select("*").order("created_at", { ascending: false }).limit(500),
    getUserDirectory(context.supabase),
  ])
  const error = [workspacesResult.error, assignmentsResult.error, devicesResult.error, requestsResult.error, commandsResult.error, securityResult.error, auditResult.error].find(Boolean)
  if (error) return fail(error.message, 500)
  const usersById = new Map(users.map((user: any) => [user.id, user]))
  const workspaces = workspacesResult.data || []
  const assignments = (assignmentsResult.data || []).map((row: any) => ({ ...row, user: usersById.get(row.user_id) || null }))
  const devices = (devicesResult.data || []).map((row: any) => ({ ...publicDevice(row), user: usersById.get(row.current_user_id) || null }))
  const requests = (requestsResult.data || []).map((row: any) => ({ ...row, user: usersById.get(row.user_id) || null }))
  return ok({
    workspaces,
    assignments,
    devices,
    requests,
    commands: commandsResult.data || [],
    security_events: securityResult.data || [],
    audit_events: auditResult.data || [],
    users,
    counts: {
      workspaces: workspaces.length,
      active_workspaces: workspaces.filter((row: any) => row.status === "active").length,
      active_assignments: assignments.filter((row: any) => row.status === "active").length,
      devices: devices.length,
      pending_devices: devices.filter((row: any) => row.approval_status === "pending").length,
      online_devices: devices.filter((row: any) => row.last_heartbeat_at && Date.now() - new Date(row.last_heartbeat_at).getTime() < 180000).length,
      pending_requests: requests.filter((row: any) => row.status === "pending").length,
      open_security_events: (securityResult.data || []).filter((row: any) => row.status === "open").length,
    },
  })
}
