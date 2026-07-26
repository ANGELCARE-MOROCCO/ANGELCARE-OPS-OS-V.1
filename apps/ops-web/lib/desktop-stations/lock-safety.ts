import { auditEvent } from "@/lib/whatsapp-desktop/server"

type Row = Record<string, any>

export const MINIMUM_SAFE_LOCKED_DESKTOP_VERSION = "1.7.4"
export const EMERGENCY_POLICY_NAME = "MZ16 — Mode sûr de récupération"

export function compareDesktopVersions(left: string | null | undefined, right: string | null | undefined) {
  const parse = (value: string | null | undefined) => String(value || "0").split(/[.-]/).map((part) => Number(part) || 0)
  const a = parse(left)
  const b = parse(right)
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    if ((a[index] || 0) > (b[index] || 0)) return 1
    if ((a[index] || 0) < (b[index] || 0)) return -1
  }
  return 0
}

export function lockedModeCertified(device: Row | null | undefined) {
  return compareDesktopVersions(device?.desktop_version, MINIMUM_SAFE_LOCKED_DESKTOP_VERSION) >= 0
}

export function deviceLockRisk(device: Row | null | undefined) {
  if (!device) return { unsafe: true, code: "DEVICE_MISSING", label: "Appareil introuvable" }
  if (!lockedModeCertified(device)) return { unsafe: true, code: "UNLOCK_PROTOCOL_NOT_CERTIFIED", label: `Desktop ${device.desktop_version || "inconnu"} inférieur au niveau sûr ${MINIMUM_SAFE_LOCKED_DESKTOP_VERSION}` }
  if (device.station_lockout_until && new Date(device.station_lockout_until).getTime() > Date.now()) return { unsafe: true, code: "ACTIVE_LOCKOUT", label: "Lockout actif" }
  return { unsafe: false, code: "LOCK_READY", label: "Protocole de déverrouillage certifié" }
}

export async function rescueStationLock(context: Row, deviceId: string, reason: string, scope = "device") {
  const { data: device, error: deviceError } = await context.supabase.from("whatsapp_desktop_devices").select("*").eq("id", deviceId).maybeSingle()
  if (deviceError) throw deviceError
  if (!device) throw new Error("DEVICE_NOT_FOUND")

  const { data, error } = await context.supabase.rpc("desktop_station_queue_lock_rescue_mz16", {
    p_device_id: deviceId,
    p_actor_user_id: context.userId,
    p_reason: reason,
    p_scope: scope,
    p_request_ip: context.ip || null,
    p_user_agent: context.userAgent || null,
  })
  if (error) throw error
  const result: Row = data && typeof data === "object" ? data as Row : {}

  await auditEvent(context.supabase, {
    actorUserId: context.userId,
    targetUserId: device.current_user_id,
    deviceId,
    workspaceId: device.current_workspace_id,
    action: "desktop_station.lock_rescue.queued",
    reason,
    previousState: { device, assignment: result.previous_assignment || null },
    newState: result,
    ip: context.ip,
    userAgent: context.userAgent,
  })
  return result
}

export async function loadLockSafetyOverview(context: Row) {
  const [devices, runs] = await Promise.all([
    context.supabase.from("whatsapp_desktop_devices").select("*").order("last_heartbeat_at", { ascending: false }),
    context.supabase.from("desktop_station_lock_rescue_runs").select("*").order("created_at", { ascending: false }).limit(100),
  ])
  if (devices.error) throw devices.error
  if (runs.error) throw runs.error
  const rows = (devices.data || []).map((device: Row) => ({ ...device, lock_risk: deviceLockRisk(device) }))
  const unsafe = rows.filter((device: Row) => device.lock_risk.unsafe)
  const locked = rows.filter((device: Row) => device.station_mode === "locked" || device.station_required_mode === "locked")
  const activeLockouts = rows.filter((device: Row) => device.station_lockout_until && new Date(device.station_lockout_until).getTime() > Date.now())
  return {
    minimum_safe_locked_version: MINIMUM_SAFE_LOCKED_DESKTOP_VERSION,
    counts: { total: rows.length, unsafe: unsafe.length, locked: locked.length, active_lockouts: activeLockouts.length },
    devices: rows,
    rescue_runs: runs.data || [],
  }
}
