import type { JsonRecord, WhatsAppDeviceApproval } from "@/lib/whatsapp-desktop/types"

export type GovernanceSyncStatus = "synchronized" | "pending" | "drift" | "offline" | "blocked" | "unknown" | "error"
export type GovernanceSeverity = "informational" | "attention" | "high" | "critical"

export const MINIMUM_SAFE_LOCKED_DESKTOP_VERSION = "1.7.4"

export interface DeviceDesiredState extends JsonRecord {
  station_mode: "standard" | "focus" | "locked"
  whatsapp_enabled: boolean
  ac_plus_enabled: boolean
  split_enabled: boolean
  maximum_tabs: number
  minimum_desktop_version: string
  policy_id?: string | null
  policy_version?: number
}

export interface DeviceReportedState extends JsonRecord {
  station_mode: string
  required_mode: string
  whatsapp_visible: boolean
  whatsapp_link_state: string
  authorization_state: string
  policy_version: number
  tab_count: number
  browser_health: string
  desktop_version: string
  governance_contract_version: string
}

export interface DeviceSyncAssessment {
  status: GovernanceSyncStatus
  score: number
  online: boolean
  drift: Array<{ code: string; label: string; desired: string; reported: string; severity: GovernanceSeverity }>
  blockers: Array<{ code: string; label: string; layer: string; severity: GovernanceSeverity }>
  recommended_actions: string[]
  desired: DeviceDesiredState
  reported: DeviceReportedState
}

type Row = Record<string, any>

const stateDefault: DeviceDesiredState = {
  station_mode: "standard",
  whatsapp_enabled: true,
  ac_plus_enabled: true,
  split_enabled: true,
  maximum_tabs: 8,
  minimum_desktop_version: "1.7.2",
  policy_id: null,
  policy_version: 0,
}

function object(value: unknown): Row {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Row : {}
}

function bool(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback
}

function number(value: unknown, fallback = 0) {
  const next = Number(value)
  return Number.isFinite(next) ? next : fallback
}

function mode(value: unknown): "standard" | "focus" | "locked" {
  return value === "focus" || value === "locked" ? value : "standard"
}

export function compareVersions(left: string | null | undefined, right: string | null | undefined) {
  const parse = (value: string | null | undefined) => String(value || "0").split(/[.-]/).map((part) => Number(part) || 0)
  const a = parse(left)
  const b = parse(right)
  const length = Math.max(a.length, b.length)
  for (let index = 0; index < length; index += 1) {
    if ((a[index] || 0) > (b[index] || 0)) return 1
    if ((a[index] || 0) < (b[index] || 0)) return -1
  }
  return 0
}

export function deviceOnline(device: Row, cutoffMs = 180_000) {
  const heartbeat = new Date(device.last_heartbeat_at || device.last_seen_at || 0).getTime()
  return Number.isFinite(heartbeat) && Date.now() - heartbeat < cutoffMs
}

export function normalizeDesiredState(row: Row | null | undefined, policy: Row | null | undefined): DeviceDesiredState {
  const desired = object(row?.desired_state)
  const policySecurity = object(policy?.security_flags)
  return {
    ...stateDefault,
    ...desired,
    station_mode: mode(row?.desired_mode ?? desired.station_mode ?? policy?.mode),
    whatsapp_enabled: bool(row?.desired_whatsapp_enabled ?? desired.whatsapp_enabled, true),
    ac_plus_enabled: bool(row?.desired_ac_plus_enabled ?? desired.ac_plus_enabled ?? policy?.ac_plus_enabled, true),
    split_enabled: bool(row?.desired_split_enabled ?? desired.split_enabled ?? policy?.split_enabled, true),
    maximum_tabs: Math.max(2, Math.min(50, number(row?.desired_maximum_tabs ?? desired.maximum_tabs ?? policy?.maximum_tabs, 8))),
    minimum_desktop_version: String(desired.minimum_desktop_version || policySecurity.minimum_desktop_version || "1.7.3"),
    policy_id: row?.desired_policy_id || desired.policy_id || policy?.id || null,
    policy_version: number(row?.desired_policy_version ?? desired.policy_version ?? policy?.policy_version, 0),
  }
}

export function normalizeReportedState(device: Row): DeviceReportedState {
  const reported = object(device.reported_state)
  const runtime = object(device.runtime_health)
  return {
    ...reported,
    station_mode: String(reported.station_mode || device.station_mode || "standard"),
    required_mode: String(reported.required_mode || device.station_required_mode || "standard"),
    whatsapp_visible: bool(reported.whatsapp_visible ?? runtime.whatsapp_visible, false),
    whatsapp_link_state: String(reported.whatsapp_link_state || device.whatsapp_link_state || "unknown"),
    authorization_state: String(reported.authorization_state || runtime.authorization_state || "unknown"),
    policy_version: number(reported.policy_version ?? device.station_policy_version, 0),
    tab_count: number(reported.tab_count ?? device.station_tab_count, 0),
    browser_health: String(reported.browser_health || device.station_browser_health || "unknown"),
    desktop_version: String(reported.desktop_version || device.desktop_version || "0.0.0"),
    governance_contract_version: String(reported.governance_contract_version || device.governance_contract_version || runtime.governance_contract_version || "unknown"),
  }
}

export function evaluateDeviceSynchronization(input: {
  device: Row
  desiredState?: Row | null
  policy?: Row | null
  workspaceAccess?: Row[]
  assignments?: Row[]
  activeSessions?: Row[]
  pendingCommands?: Row[]
}): DeviceSyncAssessment {
  const { device, desiredState, policy } = input
  const online = deviceOnline(device)
  const desired = normalizeDesiredState(desiredState, policy)
  const reported = normalizeReportedState(device)
  const drift: DeviceSyncAssessment["drift"] = []
  const blockers: DeviceSyncAssessment["blockers"] = []
  const recommendations = new Set<string>()
  const approval = String(device.approval_status || "pending") as WhatsAppDeviceApproval

  if (approval !== "approved") {
    const labels: Record<string, string> = {
      pending: "Appareil en attente d’approbation",
      suspended: "Appareil suspendu",
      revoked: "Appareil révoqué",
      compromised: "Appareil compromis",
      rejected: "Enrôlement rejeté",
    }
    blockers.push({ code: `DEVICE_${approval.toUpperCase()}`, label: labels[approval] || "Appareil non approuvé", layer: "Appareil", severity: approval === "compromised" ? "critical" : "high" })
  }
  const approvedAccess = (input.workspaceAccess || []).filter((row) => row.status === "approved")
  if (!approvedAccess.length) blockers.push({ code: "WORKSPACE_ACCESS_MISSING", label: "Aucun accès appareil-espace approuvé", layer: "Accès espace", severity: "high" })
  const activeAssignments = (input.assignments || []).filter((row) => row.status === "active")
  if (!activeAssignments.length) blockers.push({ code: "ASSIGNMENT_MISSING", label: "Aucune affectation utilisateur active", layer: "Affectation", severity: "high" })
  if (!online) blockers.push({ code: "DEVICE_OFFLINE", label: "Le poste ne répond pas au heartbeat attendu", layer: "Connectivité", severity: "attention" })
  if (compareVersions(reported.desktop_version, desired.minimum_desktop_version) < 0) {
    blockers.push({ code: "DESKTOP_VERSION_OUTDATED", label: `Desktop ${reported.desktop_version} inférieur au minimum ${desired.minimum_desktop_version}`, layer: "Conformité version", severity: "high" })
  }
  if (desired.station_mode === "locked" && compareVersions(reported.desktop_version, MINIMUM_SAFE_LOCKED_DESKTOP_VERSION) < 0) {
    blockers.push({ code: "LOCKED_MODE_UNLOCK_PROTOCOL_UNSAFE", label: `Corporate Locked interdit sur Desktop ${reported.desktop_version}; niveau sûr requis ${MINIMUM_SAFE_LOCKED_DESKTOP_VERSION}`, layer: "Sécurité anti-verrouillage", severity: "critical" })
    recommendations.add("ENTER_STANDARD_MODE")
  }

  if (reported.station_mode !== desired.station_mode) {
    drift.push({ code: "STATION_MODE_DRIFT", label: "Mode du poste différent de la consigne", desired: desired.station_mode, reported: reported.station_mode, severity: "high" })
    recommendations.add("APPLY_STATION_MODE")
  }
  if (desired.policy_version && reported.policy_version !== desired.policy_version) {
    drift.push({ code: "POLICY_VERSION_DRIFT", label: "Version de politique non synchronisée", desired: String(desired.policy_version), reported: String(reported.policy_version), severity: "high" })
    recommendations.add("REFRESH_STATION_POLICY")
  }
  if (!desired.whatsapp_enabled && reported.whatsapp_visible) {
    drift.push({ code: "WHATSAPP_VISIBILITY_DRIFT", label: "WhatsApp est visible alors que la consigne le bloque", desired: "Bloqué", reported: "Visible", severity: "critical" })
    recommendations.add("HIDE_WHATSAPP_VIEW")
  }
  if (desired.maximum_tabs > 0 && reported.tab_count > desired.maximum_tabs) {
    drift.push({ code: "TAB_LIMIT_DRIFT", label: "Nombre d’onglets supérieur à la politique", desired: String(desired.maximum_tabs), reported: String(reported.tab_count), severity: "attention" })
    recommendations.add("REFRESH_STATION_POLICY")
  }
  if (["failed", "degraded", "load-failed"].includes(reported.browser_health)) {
    drift.push({ code: "BROWSER_HEALTH_DEGRADED", label: "Santé du navigateur dégradée", desired: "healthy", reported: reported.browser_health, severity: "high" })
    recommendations.add("REQUEST_STATION_DIAGNOSTICS")
  }
  const staleCommands = (input.pendingCommands || []).filter((row) => {
    const issued = new Date(row.issued_at || row.created_at || 0).getTime()
    return ["created", "delivered", "received", "executing"].includes(row.status) && Date.now() - issued > 10 * 60_000
  })
  if (staleCommands.length) {
    blockers.push({ code: "COMMAND_ACKNOWLEDGEMENT_OVERDUE", label: `${staleCommands.length} commande(s) sans preuve d’exécution`, layer: "Commandes", severity: "attention" })
    recommendations.add("REVIEW_COMMANDS")
  }
  if (!blockers.length && !drift.length) recommendations.add("NO_ACTION_REQUIRED")
  else if (online && approval === "approved") recommendations.add("SYNCHRONIZE_NOW")
  if (reported.authorization_state !== "authorized" && approval === "approved") recommendations.add("REFRESH_AUTHORIZATION")

  const highBlocker = blockers.some((item) => item.severity === "critical" || item.severity === "high")
  const status: GovernanceSyncStatus = !online ? "offline" : highBlocker ? "blocked" : drift.length ? "drift" : (input.pendingCommands || []).some((row) => ["created", "delivered", "received", "executing"].includes(row.status)) ? "pending" : "synchronized"
  const penalty = blockers.reduce((sum, item) => sum + (item.severity === "critical" ? 30 : item.severity === "high" ? 20 : 10), 0) + drift.reduce((sum, item) => sum + (item.severity === "critical" ? 25 : item.severity === "high" ? 15 : 8), 0)
  return { status, score: Math.max(0, 100 - penalty), online, drift, blockers, recommended_actions: [...recommendations], desired, reported }
}

export function commandStatusLabel(status: string) {
  const labels: Record<string, string> = {
    created: "Préparée",
    delivered: "Livrée",
    received: "Reçue",
    executing: "En exécution",
    completed: "Exécutée",
    failed: "Échouée",
    expired: "Expirée",
    cancelled: "Annulée",
  }
  return labels[status] || status
}

export function summarizeMetadata(value: unknown) {
  const row = object(value)
  const entries = Object.entries(row).filter(([, item]) => ["string", "number", "boolean"].includes(typeof item)).slice(0, 5)
  return entries.length ? entries.map(([key, item]) => `${key.replaceAll("_", " ")}: ${String(item)}`).join(" · ") : "Preuve technique disponible dans le dossier avancé."
}
