import crypto from "node:crypto"
import { ANGELCARE_DESKTOP_RELEASE } from "@/lib/desktop/release"
import { evaluateDeviceSynchronization } from "@/lib/whatsapp-desktop/control-plane"
import { auditEvent, getUserDirectory } from "@/lib/whatsapp-desktop/server"

type Row = Record<string, any>

function asArray<T = Row>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : []
}

function effectivePolicyForDevice(device: Row, assignments: Row[], policies: Row[]) {
  const policyById = new Map(policies.map((policy) => [String(policy.id), policy]))
  const candidates = assignments.filter((assignment) => {
    if (!assignment.active) return false
    const targetId = String(assignment.target_id || "")
    if (assignment.target_type === "fleet") return targetId === "fleet"
    if (assignment.target_type === "device") return targetId === String(device.id)
    if (assignment.target_type === "installation") return targetId === String(device.installation_id)
    if (assignment.target_type === "user") return targetId === String(device.current_user_id || device.registered_user_id || "")
    if (assignment.target_type === "workspace") return targetId === String(device.current_workspace_id || "")
    return false
  }).sort((left, right) => Number(right.precedence || 0) - Number(left.precedence || 0) || new Date(right.updated_at || 0).getTime() - new Date(left.updated_at || 0).getTime())
  return policyById.get(String(candidates[0]?.policy_id || "")) || null
}

function pending(rows: Row[]) {
  return rows.filter((row) => ["created", "delivered", "received", "executing"].includes(String(row.status)))
}

function alertDefinition(device: Row, assessment: Row) {
  const results: Row[] = []
  for (const blocker of asArray(assessment.blockers)) {
    results.push({
      device_id: device.id,
      workspace_id: device.current_workspace_id || null,
      alert_type: blocker.code,
      severity: blocker.severity || "attention",
      title: blocker.label,
      description: `Couche bloquante: ${blocker.layer}. Poste: ${device.device_name}.`,
      evidence: { blocker, synchronization_status: assessment.status, desktop_version: device.desktop_version },
      dedup_key: `${device.id}:${blocker.code}`,
    })
  }
  for (const drift of asArray(assessment.drift)) {
    results.push({
      device_id: device.id,
      workspace_id: device.current_workspace_id || null,
      alert_type: drift.code,
      severity: drift.severity || "attention",
      title: drift.label,
      description: `État attendu: ${drift.desired}. État signalé: ${drift.reported}.`,
      evidence: { drift, synchronization_status: assessment.status },
      dedup_key: `${device.id}:${drift.code}`,
    })
  }
  return results
}

async function refreshAlerts(supabase: any, devices: Row[]) {
  const activeKeys = new Set<string>()
  for (const device of devices) {
    for (const alert of alertDefinition(device, device.sync_assessment || {})) {
      activeKeys.add(alert.dedup_key)
      const { data: existing } = await supabase.from("whatsapp_desktop_governance_alerts").select("id,occurrences,status").eq("dedup_key", alert.dedup_key).maybeSingle()
      if (existing) {
        await supabase.from("whatsapp_desktop_governance_alerts").update({
          ...alert,
          occurrences: Number(existing.occurrences || 0) + 1,
          last_detected_at: new Date().toISOString(),
          status: existing.status === "resolved" || existing.status === "dismissed" ? "open" : existing.status,
          resolved_by: null,
          resolved_at: null,
          resolution_note: null,
        }).eq("id", existing.id)
      } else {
        await supabase.from("whatsapp_desktop_governance_alerts").insert(alert)
      }
    }
  }
  const { data: openAlerts } = await supabase.from("whatsapp_desktop_governance_alerts").select("id,dedup_key,status").in("status", ["open", "acknowledged"])
  const staleIds = asArray(openAlerts).filter((row) => !activeKeys.has(String(row.dedup_key))).map((row) => row.id)
  if (staleIds.length) {
    await supabase.from("whatsapp_desktop_governance_alerts").update({ status: "resolved", resolved_at: new Date().toISOString(), resolution_note: "Condition revenue à l’état conforme lors du dernier calcul MZ14." }).in("id", staleIds)
  }
}

export async function loadControlPlaneOverview(supabase: any, options: { refreshAlerts?: boolean } = {}): Promise<Row> {
  const [workspaces, assignments, devices, desiredStates, whatsappCommands, stationCommands, policies, policyAssignments, sessions, alerts, users] = await Promise.all([
    supabase.from("whatsapp_desktop_workspaces").select("*").order("name"),
    supabase.from("whatsapp_desktop_assignments").select("*,workspace:whatsapp_desktop_workspaces(id,name,code)").order("created_at", { ascending: false }).limit(2000),
    supabase.from("whatsapp_desktop_devices").select("*,workspace_access:whatsapp_desktop_device_workspace_access(*,workspace:whatsapp_desktop_workspaces(id,name,code))").order("created_at", { ascending: false }).limit(2000),
    supabase.from("whatsapp_desktop_device_governance_state").select("*").order("updated_at", { ascending: false }).limit(2000),
    supabase.from("whatsapp_desktop_commands").select("*,device:whatsapp_desktop_devices(id,device_name),workspace:whatsapp_desktop_workspaces(id,name,code)").order("issued_at", { ascending: false }).limit(1000),
    supabase.from("desktop_station_commands").select("*,device:whatsapp_desktop_devices(id,device_name)").order("issued_at", { ascending: false }).limit(1000),
    supabase.from("desktop_station_policies").select("*,browser_policy:desktop_station_browser_policies(*)").eq("active", true),
    supabase.from("desktop_station_policy_assignments").select("*").eq("active", true),
    supabase.from("whatsapp_desktop_device_sessions").select("id,device_id,workspace_id,user_id,status,issued_at,expires_at,last_renewed_at").order("issued_at", { ascending: false }).limit(3000),
    supabase.from("whatsapp_desktop_governance_alerts").select("*,device:whatsapp_desktop_devices(id,device_name),workspace:whatsapp_desktop_workspaces(id,name,code)").order("last_detected_at", { ascending: false }).limit(1000),
    getUserDirectory(supabase),
  ])
  const criticalError = [workspaces.error, assignments.error, devices.error, whatsappCommands.error, stationCommands.error, policies.error, policyAssignments.error, sessions.error].find(Boolean)
  if (criticalError) throw criticalError
  if (desiredStates.error || alerts.error) {
    return {
      release: { ...ANGELCARE_DESKTOP_RELEASE, backofficeRelease: "MZ14", adminRoute: "/whatsapp-os/admin" },
      capabilities: { mz14_schema: false, desired_state: false, intervention_queue: false, desktop_runtime_frozen: true },
      counts: {}, devices: [], alerts: [], commands: [], station_commands: [], policies: policies.data || [], workspaces: workspaces.data || [], users,
      migration_error: desiredStates.error?.message || alerts.error?.message || "MZ14_SCHEMA_REQUIRED",
    }
  }

  const userById = new Map(users.map((user: Row) => [String(user.id), user]))
  const desiredByDevice = new Map(asArray(desiredStates.data).map((row) => [String(row.device_id), row]))
  const whatsappByDevice = new Map<string, Row[]>()
  const stationByDevice = new Map<string, Row[]>()
  const sessionsByDevice = new Map<string, Row[]>()
  const alertByDevice = new Map<string, Row[]>()
  for (const row of asArray(whatsappCommands.data)) whatsappByDevice.set(String(row.device_id), [...(whatsappByDevice.get(String(row.device_id)) || []), row])
  for (const row of asArray(stationCommands.data)) stationByDevice.set(String(row.device_id), [...(stationByDevice.get(String(row.device_id)) || []), row])
  for (const row of asArray(sessions.data)) sessionsByDevice.set(String(row.device_id), [...(sessionsByDevice.get(String(row.device_id)) || []), row])
  for (const row of asArray(alerts.data)) if (row.device_id) alertByDevice.set(String(row.device_id), [...(alertByDevice.get(String(row.device_id)) || []), row])

  const deviceRows: Row[] = asArray<Row>(devices.data).map((device: Row): Row => {
    const effectivePolicy = effectivePolicyForDevice(device, asArray(policyAssignments.data), asArray(policies.data))
    const deviceAssignments = asArray(assignments.data).filter((row) => row.user_id === device.current_user_id || row.user_id === device.registered_user_id)
    const commandRows = [...(whatsappByDevice.get(String(device.id)) || []), ...(stationByDevice.get(String(device.id)) || [])]
    const activeSessions = (sessionsByDevice.get(String(device.id)) || []).filter((row) => ["active", "grace"].includes(row.status))
    const assessment = evaluateDeviceSynchronization({
      device,
      desiredState: desiredByDevice.get(String(device.id)),
      policy: effectivePolicy,
      workspaceAccess: asArray(device.workspace_access),
      assignments: deviceAssignments,
      activeSessions,
      pendingCommands: pending(commandRows),
    })
    return {
      ...device,
      user: userById.get(String(device.current_user_id || "")) || null,
      registered_user: userById.get(String(device.registered_user_id || "")) || null,
      desired_state: desiredByDevice.get(String(device.id)) || null,
      effective_policy: effectivePolicy,
      sync_assessment: assessment,
      pending_command_count: pending(commandRows).length,
      open_alert_count: (alertByDevice.get(String(device.id)) || []).filter((row) => ["open", "acknowledged"].includes(row.status)).length,
      active_session_count: activeSessions.length,
    }
  })

  if (options.refreshAlerts) await refreshAlerts(supabase, deviceRows)
  const { data: freshAlerts } = options.refreshAlerts
    ? await supabase.from("whatsapp_desktop_governance_alerts").select("*,device:whatsapp_desktop_devices(id,device_name),workspace:whatsapp_desktop_workspaces(id,name,code)").order("last_detected_at", { ascending: false }).limit(1000)
    : { data: alerts.data || [] }

  const whatsappCommandRows: Row[] = asArray<Row>(whatsappCommands.data).map((row: Row): Row => ({ ...row, command_channel: "whatsapp" }))
  const stationCommandRows: Row[] = asArray<Row>(stationCommands.data).map((row: Row): Row => ({ ...row, command_channel: "station" }))
  const allCommands: Row[] = [...whatsappCommandRows, ...stationCommandRows].sort((left: Row, right: Row) => new Date(String(right.issued_at || 0)).getTime() - new Date(String(left.issued_at || 0)).getTime())
  const openAlerts: Row[] = asArray<Row>(freshAlerts).filter((row: Row) => ["open", "acknowledged"].includes(String(row.status)))
  return {
    release: { ...ANGELCARE_DESKTOP_RELEASE, backofficeRelease: "MZ14", adminRoute: "/whatsapp-os/admin", desktopRuntimeFrozen: true },
    capabilities: { mz14_schema: true, desired_state: true, intervention_queue: true, command_evidence: true, desktop_runtime_frozen: true },
    counts: {
      devices: deviceRows.length,
      online: deviceRows.filter((row) => row.sync_assessment.online).length,
      synchronized: deviceRows.filter((row) => row.sync_assessment.status === "synchronized").length,
      drift: deviceRows.filter((row) => row.sync_assessment.status === "drift").length,
      blocked: deviceRows.filter((row) => row.sync_assessment.status === "blocked").length,
      offline: deviceRows.filter((row) => row.sync_assessment.status === "offline").length,
      pending_commands: allCommands.filter((row) => ["created", "delivered", "received", "executing"].includes(row.status)).length,
      failed_commands: allCommands.filter((row) => row.status === "failed").length,
      open_alerts: openAlerts.length,
      critical_alerts: openAlerts.filter((row) => row.severity === "critical").length,
      windows: deviceRows.filter((row) => row.platform === "windows").length,
      macos: deviceRows.filter((row) => row.platform === "macos").length,
      active_sessions: deviceRows.reduce((sum, row) => sum + Number(row.active_session_count || 0), 0),
    },
    devices: deviceRows,
    alerts: freshAlerts || [],
    commands: allCommands,
    station_commands: stationCommands.data || [],
    policies: policies.data || [],
    workspaces: workspaces.data || [],
    users,
  }
}

export async function saveDesiredState(context: Row, deviceId: string, body: Row) {
  const { data: device, error: deviceError } = await context.supabase.from("whatsapp_desktop_devices").select("*").eq("id", deviceId).maybeSingle()
  if (deviceError) throw deviceError
  if (!device) throw new Error("DEVICE_NOT_FOUND")
  const { data: current } = await context.supabase.from("whatsapp_desktop_device_governance_state").select("*").eq("device_id", deviceId).maybeSingle()
  const desiredMode = ["standard", "focus", "locked"].includes(String(body.desired_mode)) ? String(body.desired_mode) : String(current?.desired_mode || device.station_required_mode || "standard")
  const maximumTabs = Math.max(2, Math.min(50, Number(body.desired_maximum_tabs ?? current?.desired_maximum_tabs ?? 8)))
  const next = {
    device_id: deviceId,
    desired_state: body.desired_state && typeof body.desired_state === "object" ? body.desired_state : current?.desired_state || {},
    desired_revision: Number(current?.desired_revision || 0) + 1,
    desired_policy_id: body.desired_policy_id || current?.desired_policy_id || null,
    desired_policy_version: Math.max(0, Number(body.desired_policy_version ?? current?.desired_policy_version ?? 0)),
    desired_mode: desiredMode,
    desired_whatsapp_enabled: body.desired_whatsapp_enabled !== false,
    desired_ac_plus_enabled: desiredMode === "locked" ? false : body.desired_ac_plus_enabled !== false,
    desired_split_enabled: desiredMode === "locked" ? false : body.desired_split_enabled !== false,
    desired_maximum_tabs: maximumTabs,
    reason: String(body.reason || "Mise à jour de l’état désiré MZ14").slice(0, 1000),
    updated_by: context.userId,
  }
  const { data, error } = await context.supabase.from("whatsapp_desktop_device_governance_state").upsert(next, { onConflict: "device_id" }).select("*").single()
  if (error) throw error
  await auditEvent(context.supabase, { actorUserId: context.userId, targetUserId: device.current_user_id, deviceId, workspaceId: device.current_workspace_id, action: "device.desired_state.updated", reason: next.reason, previousState: current, newState: data, ip: context.ip, userAgent: context.userAgent })
  return data
}

export async function queueSynchronization(context: Row, deviceId: string, reason: string, triggerType = "manual") {
  const overview = await loadControlPlaneOverview(context.supabase)
  const device: Row | undefined = asArray<Row>(overview.devices).find((row: Row) => String(row.id) === deviceId)
  if (!device) throw new Error("DEVICE_NOT_FOUND")
  const correlationId = crypto.randomUUID()
  const assessment: Row = device.sync_assessment && typeof device.sync_assessment === "object" ? device.sync_assessment as Row : {}
  const whatsappCommandIds: string[] = []
  const stationCommandIds: string[] = []
  const expiresAt = new Date(Date.now() + 24 * 60 * 60_000).toISOString()
  const insertStation = async (commandType: string, payload: Row = {}) => {
    const { data, error } = await context.supabase.from("desktop_station_commands").insert({ device_id: deviceId, policy_id: device.desired_state?.desired_policy_id || null, workspace_id: device.current_workspace_id || null, command_type: commandType, payload, reason, status: "created", issued_by: context.userId, expires_at: expiresAt, correlation_id: correlationId, priority: "high", acknowledgement_deadline: new Date(Date.now() + 10 * 60_000).toISOString() }).select("id").single()
    if (error) throw error
    stationCommandIds.push(data.id)
  }
  const insertWhatsApp = async (commandType: string, payload: Row = {}) => {
    const { data, error } = await context.supabase.from("whatsapp_desktop_commands").insert({ device_id: deviceId, workspace_id: device.current_workspace_id || null, command_type: commandType, payload, reason, status: "created", issued_by: context.userId, expires_at: expiresAt, correlation_id: correlationId, priority: "high", acknowledgement_deadline: new Date(Date.now() + 10 * 60_000).toISOString() }).select("id").single()
    if (error) throw error
    whatsappCommandIds.push(data.id)
  }
  const recommendations = new Set(asArray<string>(assessment.recommended_actions))
  const desired: Row = assessment.desired && typeof assessment.desired === "object" ? assessment.desired as Row : {}
  const reported: Row = assessment.reported && typeof assessment.reported === "object" ? assessment.reported as Row : {}
  if (recommendations.has("APPLY_STATION_MODE")) await insertStation(desired.station_mode === "locked" ? "ENTER_LOCKED_MODE" : desired.station_mode === "focus" ? "ENTER_FOCUS_MODE" : "ENTER_STANDARD_MODE")
  if (recommendations.has("REFRESH_STATION_POLICY") || desired.policy_version !== reported.policy_version) await insertStation("REFRESH_STATION_POLICY")
  if (recommendations.has("REQUEST_STATION_DIAGNOSTICS")) await insertStation("REQUEST_STATION_DIAGNOSTICS")
  if (recommendations.has("REFRESH_AUTHORIZATION") || triggerType === "authorization") await insertWhatsApp("REFRESH_AUTHORIZATION")
  if (recommendations.has("HIDE_WHATSAPP_VIEW")) await insertWhatsApp("HIDE_WHATSAPP_VIEW")
  if (!stationCommandIds.length && !whatsappCommandIds.length) {
    await insertStation("REFRESH_STATION_POLICY")
    await insertWhatsApp("REFRESH_AUTHORIZATION")
  }
  const { data: syncRun, error: syncError } = await context.supabase.from("whatsapp_desktop_sync_runs").insert({ correlation_id: correlationId, device_id: deviceId, actor_user_id: context.userId, trigger_type: triggerType, desired_snapshot: assessment.desired || {}, reported_snapshot: assessment.reported || {}, assessment_snapshot: assessment, whatsapp_command_ids: whatsappCommandIds, station_command_ids: stationCommandIds, status: "queued", reason, request_ip: context.ip, user_agent: context.userAgent }).select("*").single()
  if (syncError) throw syncError
  await context.supabase.from("whatsapp_desktop_device_governance_state").update({ last_command_correlation_id: correlationId }).eq("device_id", deviceId)
  await context.supabase.from("whatsapp_desktop_devices").update({ synchronization_status: "pending" }).eq("id", deviceId)
  await auditEvent(context.supabase, { actorUserId: context.userId, targetUserId: device.current_user_id, deviceId, workspaceId: device.current_workspace_id, action: "device.synchronization.queued", reason, newState: { sync_run_id: syncRun.id, correlation_id: correlationId, whatsapp_command_ids: whatsappCommandIds, station_command_ids: stationCommandIds }, ip: context.ip, userAgent: context.userAgent })
  return syncRun
}

export async function reconcileSynchronizationRun(supabase: any, deviceId: string, correlationId: string | null | undefined) {
  if (!correlationId) return null
  const [whatsapp, station] = await Promise.all([
    supabase.from("whatsapp_desktop_commands").select("id,status").eq("correlation_id", correlationId),
    supabase.from("desktop_station_commands").select("id,status").eq("correlation_id", correlationId),
  ])
  if (whatsapp.error || station.error) return null
  const rows = [...(whatsapp.data || []), ...(station.data || [])]
  if (!rows.length) return null
  const statuses = rows.map((row: Row) => String(row.status))
  const allCompleted = statuses.every((status) => status === "completed")
  const terminal = statuses.every((status) => ["completed", "failed", "expired", "cancelled"].includes(status))
  const hasFailure = statuses.some((status) => ["failed", "expired"].includes(status))
  const hasAcknowledgement = statuses.some((status) => ["received", "executing", "completed"].includes(status))
  const status = allCompleted ? "completed" : terminal && hasFailure ? "partial" : hasAcknowledgement ? "acknowledged" : "delivered"
  const { data } = await supabase.from("whatsapp_desktop_sync_runs").update({ status, ...(terminal ? { completed_at: new Date().toISOString() } : {}) }).eq("correlation_id", correlationId).eq("device_id", deviceId).select("*").maybeSingle()
  await supabase.from("whatsapp_desktop_devices").update({ synchronization_status: allCompleted ? "pending" : hasFailure ? "error" : "pending" }).eq("id", deviceId)
  return data || null
}
