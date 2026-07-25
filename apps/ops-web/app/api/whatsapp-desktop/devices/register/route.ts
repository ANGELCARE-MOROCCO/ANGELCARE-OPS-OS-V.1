import { NextRequest } from "next/server"
import {
  accessEvent,
  fail,
  governanceContext,
  ok,
  parseBody,
  publicDevice,
  securityEvent,
} from "@/lib/whatsapp-desktop/server"

type Row = Record<string, any>

function platformOf(value: unknown) {
  const raw = String(value || "").toLowerCase()
  if (raw === "darwin" || raw === "macos") return "macos"
  if (raw === "win32" || raw === "windows") return "windows"
  if (raw === "linux") return "linux"
  return "unknown"
}

function activeAssignment(row: Row) {
  if (row.status !== "active") return false
  const now = Date.now()
  if (row.valid_from && new Date(row.valid_from).getTime() > now) return false
  if (row.valid_until && new Date(row.valid_until).getTime() <= now) return false
  return true
}

export async function POST(request: NextRequest) {
  const context = await governanceContext(request)
  if ("error" in context) return context.error

  const body = await parseBody(request)
  const installationId = String(body.installation_id || "").trim().slice(0, 160)
  const deviceName = String(body.device_name || "ANGELCARE Desktop").trim().slice(0, 180)
  if (!installationId || installationId.length < 16) return fail("VALID_INSTALLATION_ID_REQUIRED")

  const { data: existing, error: existingError } = await context.supabase
    .from("whatsapp_desktop_devices")
    .select("*")
    .eq("installation_id", installationId)
    .maybeSingle()
  if (existingError) return fail(existingError.message, 500)

  if (existing && ["revoked", "compromised"].includes(existing.approval_status)) {
    await securityEvent(context.supabase, {
      severity: "critical",
      eventType: "blocked_device_reconnect",
      userId: context.userId,
      deviceId: existing.id,
      title: "Tentative de reconnexion d’un appareil bloqué",
      description: `Installation ${installationId} refusée.`,
      metadata: {
        desktop_version: String(body.desktop_version || ""),
        desktop_contract_version: String(body.desktop_contract_version || ""),
      },
    })
    return fail(`DEVICE_${String(existing.approval_status).toUpperCase()}`, 403, {
      data: publicDevice(existing),
    })
  }

  const now = new Date().toISOString()
  const update = {
    installation_id: installationId,
    device_name: deviceName,
    platform: platformOf(body.platform),
    architecture: String(body.architecture || "").slice(0, 80) || null,
    desktop_version: String(body.desktop_version || "").slice(0, 80) || null,
    operating_system_version: String(body.operating_system_version || "").slice(0, 160) || null,
    registered_user_id: existing?.registered_user_id || context.userId,
    current_user_id: context.userId,
    last_seen_at: now,
    runtime_health: body.runtime_health && typeof body.runtime_health === "object" ? body.runtime_health : {},
    metadata: {
      ...(existing?.metadata && typeof existing.metadata === "object" ? existing.metadata : {}),
      ...(body.metadata && typeof body.metadata === "object" ? body.metadata : {}),
      desktop_contract_version: String(body.desktop_contract_version || "").slice(0, 80) || null,
      selected_workspace_id: String(body.selected_workspace_id || "").slice(0, 100) || null,
      registration_reason: String(body.registration_reason || "runtime").slice(0, 160),
      previous_device_id: String(body.previous_device_id || "").slice(0, 100) || null,
      last_registration_reconciled_at: now,
    },
  }

  const response = existing
    ? await context.supabase
        .from("whatsapp_desktop_devices")
        .update(update)
        .eq("id", existing.id)
        .select("*")
        .single()
    : await context.supabase
        .from("whatsapp_desktop_devices")
        .insert(update)
        .select("*")
        .single()

  if (response.error) return fail(response.error.message, 400)
  const device = response.data

  const { data: assignments, error: assignmentsError } = await context.supabase
    .from("whatsapp_desktop_assignments")
    .select("id,workspace_id,user_id,role,status,valid_from,valid_until,workspace:whatsapp_desktop_workspaces(id,name,code,status)")
    .eq("user_id", context.userId)
    .eq("status", "active")
  if (assignmentsError) return fail(assignmentsError.message, 500)

  const activeAssignments = (assignments || []).filter(activeAssignment)
  const workspaceIds = [...new Set(activeAssignments.map((row: Row) => String(row.workspace_id)).filter(Boolean))]

  const { data: currentAccess, error: accessError } = workspaceIds.length
    ? await context.supabase
        .from("whatsapp_desktop_device_workspace_access")
        .select("workspace_id,status")
        .eq("device_id", device.id)
        .in("workspace_id", workspaceIds)
    : { data: [], error: null }
  if (accessError) return fail(accessError.message, 500)

  const existingAccess = new Map((currentAccess || []).map((row: Row) => [String(row.workspace_id), row.status]))
  const missingAccess = workspaceIds
    .filter((workspaceId) => !existingAccess.has(workspaceId))
    .map((workspaceId) => ({
      device_id: device.id,
      workspace_id: workspaceId,
      status: "pending",
      reason: "Nouvel appareil enregistré — approbation administrative requise",
    }))

  if (missingAccess.length) {
    const { error } = await context.supabase
      .from("whatsapp_desktop_device_workspace_access")
      .insert(missingAccess)
    if (error) return fail(error.message, 500)
  }

  const { data: linkedRequests, error: requestLinkError } = await context.supabase
    .from("whatsapp_desktop_access_requests")
    .update({ device_id: device.id, updated_at: now })
    .eq("user_id", context.userId)
    .is("device_id", null)
    .in("status", ["pending", "approved"])
    .select("id,workspace_id,status")
  if (requestLinkError) return fail(requestLinkError.message, 500)

  const selectedWorkspaceId = String(body.selected_workspace_id || "")
  const workspaceCandidates = activeAssignments.map((assignment: Row) => ({
    assignment_id: assignment.id,
    workspace_id: assignment.workspace_id,
    workspace_name: assignment.workspace?.name || null,
    workspace_code: assignment.workspace?.code || null,
    access_status: existingAccess.get(String(assignment.workspace_id)) || "pending",
    selected: selectedWorkspaceId === String(assignment.workspace_id),
  }))

  await accessEvent(context.supabase, {
    eventType: existing ? "device_registration_reconciled" : "device_registered",
    userId: context.userId,
    deviceId: device.id,
    outcome: device.approval_status,
    metadata: {
      platform: device.platform,
      desktop_version: device.desktop_version,
      desktop_contract_version: body.desktop_contract_version || null,
      registration_reason: body.registration_reason || "runtime",
      workspace_candidates: workspaceIds,
      linked_request_count: (linkedRequests || []).length,
    },
    ip: context.ip,
    userAgent: context.userAgent,
  })

  if (!existing) {
    await securityEvent(context.supabase, {
      severity: "attention",
      eventType: "new_device_registered",
      userId: context.userId,
      deviceId: device.id,
      title: "Nouvel appareil ANGELCARE Desktop enregistré",
      description: `${device.device_name} attend une décision administrateur.`,
      metadata: {
        workspace_candidates: workspaceIds,
        linked_request_count: (linkedRequests || []).length,
      },
    })
  }

  return ok(
    {
      device: publicDevice(device),
      workspace_candidates: workspaceCandidates,
      linked_request_count: (linkedRequests || []).length,
      recovered: Boolean(existing),
    },
    { status: existing ? 200 : 201 },
  )
}
