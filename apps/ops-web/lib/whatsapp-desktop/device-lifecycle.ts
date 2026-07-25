import type { NextRequest } from "next/server"
import { auditEvent, fail, ok, revokeActiveLeases, securityEvent } from "@/lib/whatsapp-desktop/server"
import type { WhatsAppDeviceApproval, WhatsAppRemoteCommand } from "@/lib/whatsapp-desktop/types"
import { evaluateDeviceSynchronization } from "@/lib/whatsapp-desktop/control-plane"

type Row = Record<string, any>

export const DEVICE_ACTION_PERMISSIONS = {
  view: "whatsapp_desktop.device.view",
  approve: "whatsapp_desktop.device.approve",
  suspend: "whatsapp_desktop.device.suspend",
  restore: "whatsapp_desktop.device.restore",
  disconnect: "whatsapp_desktop.device.disconnect",
  reassign: "whatsapp_desktop.device.reassign",
  revoke: "whatsapp_desktop.device.revoke",
  delete: "whatsapp_desktop.device.delete",
  forceDelete: "whatsapp_desktop.device.force_delete",
  bulk: "whatsapp_desktop.device.bulk_manage",
} as const

export const DEVICE_ACTIONS_BY_STATE: Record<WhatsAppDeviceApproval, string[]> = {
  pending: ["approve", "reject", "delete", "force_purge"],
  approved: ["disconnect_whatsapp", "logout_desktop", "suspend", "reassign", "revoke"],
  rejected: ["reinstate", "delete", "force_purge"],
  suspended: ["restore", "disconnect_whatsapp", "logout_desktop", "revoke", "delete", "force_purge"],
  revoked: ["reinstate", "delete", "force_purge"],
  compromised: ["disconnect_whatsapp", "logout_desktop", "force_purge"],
}

export function deviceIsOnline(device: Row, cutoffMs = 180_000) {
  if (!device?.last_heartbeat_at) return false
  const last = new Date(device.last_heartbeat_at).getTime()
  return Number.isFinite(last) && Date.now() - last < cutoffMs
}

export function assertDeviceAction(device: Row, action: string) {
  const status = String(device?.approval_status || "") as WhatsAppDeviceApproval
  const allowed = DEVICE_ACTIONS_BY_STATE[status] || []
  if (!allowed.includes(action)) {
    throw new Error(`INVALID_DEVICE_TRANSITION:${status}:${action}`)
  }
}

export async function loadDevice(supabase: any, id: string, columns = "*") {
  const { data, error } = await supabase.from("whatsapp_desktop_devices").select(columns).eq("id", id).maybeSingle()
  if (error) throw error
  if (!data) throw new Error("DEVICE_NOT_FOUND")
  return data as Row
}

export async function issueDeviceCommand(
  supabase: any,
  input: { deviceId: string; workspaceId?: string | null; commandType: WhatsAppRemoteCommand; actorId: string; reason: string; payload?: Row },
) {
  const { data, error } = await supabase.from("whatsapp_desktop_commands").insert({
    device_id: input.deviceId,
    workspace_id: input.workspaceId || null,
    command_type: input.commandType,
    payload: input.payload || {},
    reason: String(input.reason || "Commande gouvernée ANGELCARE").slice(0, 1000),
    issued_by: input.actorId,
  }).select("*").single()
  if (error) throw error
  return data
}

export async function restoreDevice(context: Row, deviceId: string, reason: string) {
  const current = await loadDevice(context.supabase, deviceId)
  assertDeviceAction(current, "restore")
  const now = new Date().toISOString()
  const { data, error } = await context.supabase.from("whatsapp_desktop_devices").update({
    approval_status: "approved",
    approved_at: now,
    approved_by: context.userId,
    suspended_at: null,
    suspended_by: null,
    suspension_reason: null,
    restored_at: now,
    restored_by: context.userId,
    revoked_at: null,
    revoked_by: null,
    revoke_reason: null,
  }).eq("id", deviceId).select("*").single()
  if (error) throw error
  await context.supabase.from("whatsapp_desktop_device_workspace_access").update({
    status: "approved",
    approved_by: context.userId,
    approved_at: now,
    revoked_by: null,
    revoked_at: null,
    reason,
  }).eq("device_id", deviceId).eq("status", "suspended")
  const command = await issueDeviceCommand(context.supabase, { deviceId, commandType: "REFRESH_AUTHORIZATION", actorId: context.userId, reason })
  await auditEvent(context.supabase, { actorUserId: context.userId, targetUserId: data.current_user_id, deviceId, action: "device.restored", reason, previousState: current, newState: data, commandId: command.id, ip: context.ip, userAgent: context.userAgent })
  return data
}

export async function disconnectWhatsApp(context: Row, deviceId: string, reason: string) {
  const current = await loadDevice(context.supabase, deviceId)
  assertDeviceAction(current, "disconnect_whatsapp")
  await revokeActiveLeases(context.supabase, { deviceId, actorId: context.userId, reason })
  const hide = await issueDeviceCommand(context.supabase, { deviceId, commandType: "HIDE_WHATSAPP_VIEW", actorId: context.userId, reason })
  const clear = await issueDeviceCommand(context.supabase, { deviceId, commandType: "CLEAR_WHATSAPP_SESSION", actorId: context.userId, reason })
  const { data, error } = await context.supabase.from("whatsapp_desktop_devices").update({ whatsapp_link_state: "logged_out" }).eq("id", deviceId).select("*").single()
  if (error) throw error
  await auditEvent(context.supabase, { actorUserId: context.userId, targetUserId: data.current_user_id, deviceId, action: "device.whatsapp_disconnected", reason, previousState: current, newState: data, commandId: clear.id, ip: context.ip, userAgent: context.userAgent })
  return { device: data, commands: [hide, clear] }
}

export async function logoutDesktop(context: Row, deviceId: string, reason: string) {
  const current = await loadDevice(context.supabase, deviceId)
  assertDeviceAction(current, "logout_desktop")
  await revokeActiveLeases(context.supabase, { deviceId, actorId: context.userId, reason })
  const command = await issueDeviceCommand(context.supabase, { deviceId, commandType: "LOG_OUT_ANGELCARE_DESKTOP", actorId: context.userId, reason })
  await auditEvent(context.supabase, { actorUserId: context.userId, targetUserId: current.current_user_id, deviceId, action: "device.desktop_logout_requested", reason, previousState: current, newState: { ...current, active_leases: "revoked" }, commandId: command.id, ip: context.ip, userAgent: context.userAgent })
  return { device: current, command }
}

export async function reinstateDevice(context: Row, deviceId: string, reason: string) {
  const current = await loadDevice(context.supabase, deviceId)
  assertDeviceAction(current, "reinstate")
  const now = new Date().toISOString()
  const { data, error } = await context.supabase.from("whatsapp_desktop_devices").update({
    approval_status: "pending",
    approved_at: null,
    approved_by: null,
    rejected_at: null,
    rejected_by: null,
    revoked_at: null,
    revoked_by: null,
    revoke_reason: null,
    compromised_at: null,
    restored_at: now,
    restored_by: context.userId,
  }).eq("id", deviceId).select("*").single()
  if (error) throw error
  await context.supabase.from("whatsapp_desktop_device_workspace_access").update({ status: "pending", revoked_by: null, revoked_at: null, reason }).eq("device_id", deviceId)
  await auditEvent(context.supabase, { actorUserId: context.userId, targetUserId: data.current_user_id, deviceId, action: "device.reinstatement_requested", reason, previousState: current, newState: data, ip: context.ip, userAgent: context.userAgent })
  return data
}

export async function reassignDevice(context: Row, deviceId: string, input: { userId: string; workspaceIds: string[]; reason: string }) {
  const current = await loadDevice(context.supabase, deviceId)
  assertDeviceAction(current, "reassign")
  if (!input.userId) throw new Error("TARGET_USER_REQUIRED")
  await revokeActiveLeases(context.supabase, { deviceId, actorId: context.userId, reason: input.reason })
  const now = new Date().toISOString()
  const { data, error } = await context.supabase.from("whatsapp_desktop_devices").update({ current_user_id: input.userId }).eq("id", deviceId).select("*").single()
  if (error) throw error
  await context.supabase.from("whatsapp_desktop_device_workspace_access").update({ status: "revoked", revoked_by: context.userId, revoked_at: now, reason: input.reason }).eq("device_id", deviceId)
  for (const workspaceId of input.workspaceIds) {
    await context.supabase.from("whatsapp_desktop_device_workspace_access").upsert({ device_id: deviceId, workspace_id: workspaceId, status: "approved", approved_by: context.userId, approved_at: now, revoked_by: null, revoked_at: null, reason: input.reason }, { onConflict: "device_id,workspace_id" })
  }
  const logout = await issueDeviceCommand(context.supabase, { deviceId, commandType: "LOG_OUT_ANGELCARE_DESKTOP", actorId: context.userId, reason: input.reason })
  await auditEvent(context.supabase, { actorUserId: context.userId, targetUserId: input.userId, deviceId, action: "device.reassigned", reason: input.reason, previousState: current, newState: { ...data, workspace_ids: input.workspaceIds }, commandId: logout.id, ip: context.ip, userAgent: context.userAgent })
  return data
}

export async function loadDeviceLifecycle(supabase: any, deviceId: string) {
  const device = await loadDevice(supabase, deviceId)
  const [access, sessions, commands, receipts, heartbeats, audit, security, desired, stationCommands, stationEvents, alerts, assignments] = await Promise.all([
    supabase.from("whatsapp_desktop_device_workspace_access").select("*,workspace:whatsapp_desktop_workspaces(id,name,code)").eq("device_id", deviceId).order("created_at", { ascending: false }),
    supabase.from("whatsapp_desktop_device_sessions").select("*,workspace:whatsapp_desktop_workspaces(id,name,code)").eq("device_id", deviceId).order("issued_at", { ascending: false }).limit(250),
    supabase.from("whatsapp_desktop_commands").select("*,workspace:whatsapp_desktop_workspaces(id,name,code)").eq("device_id", deviceId).order("issued_at", { ascending: false }).limit(250),
    supabase.from("whatsapp_desktop_command_receipts").select("*").eq("device_id", deviceId).order("created_at", { ascending: false }).limit(500),
    supabase.from("whatsapp_desktop_heartbeats").select("*").eq("device_id", deviceId).order("received_at", { ascending: false }).limit(100),
    supabase.from("whatsapp_desktop_audit_events").select("*").eq("device_id", deviceId).order("created_at", { ascending: false }).limit(250),
    supabase.from("whatsapp_desktop_security_events").select("*").eq("device_id", deviceId).order("created_at", { ascending: false }).limit(250),
    supabase.from("whatsapp_desktop_device_governance_state").select("*").eq("device_id", deviceId).maybeSingle(),
    supabase.from("desktop_station_commands").select("*").eq("device_id", deviceId).order("issued_at", { ascending: false }).limit(250),
    supabase.from("desktop_station_events").select("*").eq("device_id", deviceId).order("created_at", { ascending: false }).limit(250),
    supabase.from("whatsapp_desktop_governance_alerts").select("*").eq("device_id", deviceId).order("last_detected_at", { ascending: false }).limit(250),
    supabase.from("whatsapp_desktop_assignments").select("*").in("user_id", [device.current_user_id, device.registered_user_id].filter(Boolean)).order("created_at", { ascending: false }),
  ])
  const error = [access.error, sessions.error, commands.error, receipts.error, heartbeats.error, audit.error, security.error, desired.error, stationCommands.error, stationEvents.error, alerts.error, assignments.error].find(Boolean)
  if (error) throw error
  const commandReceipts = new Map<string, Row[]>()
  for (const receipt of receipts.data || []) commandReceipts.set(receipt.command_id, [...(commandReceipts.get(receipt.command_id) || []), receipt])
  const whatsappCommandRows = (commands.data || []).map((command: Row) => ({ ...command, command_channel: "whatsapp", receipts: commandReceipts.get(command.id) || [] }))
  const stationCommandRows = (stationCommands.data || []).map((command: Row) => ({ ...command, command_channel: "station" }))
  const assessment = evaluateDeviceSynchronization({
    device,
    desiredState: desired.data,
    workspaceAccess: access.data || [],
    assignments: assignments.data || [],
    activeSessions: (sessions.data || []).filter((row: Row) => ["active", "grace"].includes(row.status)),
    pendingCommands: [...whatsappCommandRows, ...stationCommandRows],
  })
  return {
    device: { ...device, online: deviceIsOnline(device), available_actions: DEVICE_ACTIONS_BY_STATE[device.approval_status as WhatsAppDeviceApproval] || [] },
    workspace_access: access.data || [],
    sessions: sessions.data || [],
    commands: whatsappCommandRows,
    heartbeats: heartbeats.data || [],
    audit_events: audit.data || [],
    security_events: security.data || [],
    desired_state: desired.data || null,
    sync_assessment: assessment,
    station_commands: stationCommandRows,
    station_events: stationEvents.data || [],
    alerts: alerts.data || [],
  }
}

export async function purgeDevice(context: Row, request: NextRequest, deviceId: string, body: Row, forced: boolean) {
  const current = await loadDevice(context.supabase, deviceId)
  assertDeviceAction(current, forced ? "force_purge" : "delete")
  const reason = String(body.reason || "").trim()
  const confirmationName = String(body.confirmation_name || "").trim()
  if (reason.length < 8) throw new Error("DELETION_REASON_REQUIRED")
  if (confirmationName !== current.device_name) throw new Error("DEVICE_NAME_CONFIRMATION_MISMATCH")
  if (body.acknowledge_irreversible !== true) throw new Error("IRREVERSIBLE_ACKNOWLEDGEMENT_REQUIRED")
  const { data, error } = await context.supabase.rpc("whatsapp_desktop_purge_device", {
    p_device_id: deviceId,
    p_actor_user_id: context.userId,
    p_reason: reason,
    p_forced: forced,
    p_request_ip: context.ip,
    p_user_agent: context.userAgent,
    p_confirmation_name: confirmationName,
  })
  if (error) throw error
  await securityEvent(context.supabase, { severity: forced ? "critical" : "high", eventType: forced ? "device_force_purged" : "device_purged", userId: current.current_user_id, title: forced ? "Purge forcée d’un appareil" : "Appareil supprimé définitivement", description: `${current.device_name} — ${reason}`, metadata: { purge_ledger_id: data, installation_id: current.installation_id } })
  return { purge_ledger_id: data, device_name: current.device_name, installation_id_released: current.installation_id }
}

export function lifecycleError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  const status = message === "DEVICE_NOT_FOUND" ? 404 : message.startsWith("INVALID_DEVICE_TRANSITION") ? 409 : message.includes("PERMISSION") ? 403 : 400
  return fail(message, status)
}
