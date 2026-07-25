import { NextRequest } from "next/server"
import { fail, getUserDirectory, governanceContext, ok } from "@/lib/whatsapp-desktop/server"
import { deviceIsOnline } from "@/lib/whatsapp-desktop/device-lifecycle"

export async function GET(request: NextRequest) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.workspace.view" })
  if ("error" in context) return context.error
  const [workspacesResult, assignmentsResult, devicesResult, requestsResult, commandsResult, securityResult, auditResult, users] = await Promise.all([
    context.supabase.from("whatsapp_desktop_workspaces").select("*,policy:whatsapp_desktop_workspace_policies(*)").order("created_at", { ascending: false }),
    context.supabase.from("whatsapp_desktop_assignments").select("*,workspace:whatsapp_desktop_workspaces(id,name,code)").order("created_at", { ascending: false }).limit(1000),
    context.supabase.from("whatsapp_desktop_devices").select("*,workspace_access:whatsapp_desktop_device_workspace_access(*,workspace:whatsapp_desktop_workspaces(id,name,code))").order("created_at", { ascending: false }).limit(1000),
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
  const rawDevices = devicesResult.data || []
  const nameFrequency = new Map<string, number>()
  for (const row of rawDevices) {
    const key = String(row.device_name || "").trim().toLowerCase()
    if (key) nameFrequency.set(key, (nameFrequency.get(key) || 0) + 1)
  }
  const devices = rawDevices.map((row: any) => {
    const key = String(row.device_name || "").trim().toLowerCase()
    return {
      ...row,
      user: usersById.get(row.current_user_id) || null,
      registered_user: usersById.get(row.registered_user_id) || null,
      online: deviceIsOnline(row),
      duplicate_name_count: nameFrequency.get(key) || 1,
    }
  })
  const requests = (requestsResult.data || []).map((row: any) => ({ ...row, user: usersById.get(row.user_id) || null }))
  const statusCount = (status: string) => devices.filter((row: any) => row.approval_status === status).length
  const lifecycleReadiness = await context.supabase.from("whatsapp_desktop_device_purge_ledger").select("id", { head: true, count: "exact" }).limit(1)
  const controlPlaneReadiness = await context.supabase.from("whatsapp_desktop_device_governance_state").select("id", { head: true, count: "exact" }).limit(1)
  const { data: governanceAlerts } = controlPlaneReadiness.error ? { data: [] } : await context.supabase.from("whatsapp_desktop_governance_alerts").select("id,status,severity").in("status", ["open", "acknowledged"])
  return ok({
    capabilities: { fleet_lifecycle_migration: !lifecycleReadiness.error, governance_control_plane_mz14: !controlPlaneReadiness.error, desktop_runtime_frozen: true },
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
      pending_devices: statusCount("pending"),
      approved_devices: statusCount("approved"),
      suspended_devices: statusCount("suspended"),
      revoked_devices: statusCount("revoked"),
      compromised_devices: statusCount("compromised"),
      rejected_devices: statusCount("rejected"),
      duplicate_devices: devices.filter((row: any) => row.duplicate_name_count > 1).length,
      online_devices: devices.filter((row: any) => row.online).length,
      stale_devices: devices.filter((row: any) => !row.online && row.last_heartbeat_at).length,
      pending_requests: requests.filter((row: any) => row.status === "pending").length,
      open_security_events: (securityResult.data || []).filter((row: any) => row.status === "open").length + (governanceAlerts || []).length,
      open_governance_alerts: (governanceAlerts || []).length,
      critical_governance_alerts: (governanceAlerts || []).filter((row: any) => row.severity === "critical").length,
    },
  })
}
