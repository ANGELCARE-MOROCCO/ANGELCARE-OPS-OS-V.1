"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  ArrowRight,
  Ban,
  BarChart3,
  Binary,
  CheckCircle2,
  ClipboardList,
  Copy,
  Database,
  Download,
  HardDrive,
  HardDriveDownload,
  History,
  Info,
  Loader2,
  Lock,
  Mail,
  MailCheck,
  Monitor,
  Network,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Server,
  Settings2,
  ShieldX,
  TriangleAlert,
  Upload,
  Wifi,
  WifiOff,
  X,
} from "lucide-react"
import type {
  MaintenanceModeState,
  WindowsAuditEvent,
  WindowsBackupStatus,
  WindowsNodeHealthStatus,
  WindowsNodeStatus,
  WindowsNodeLogType,
  WindowsNetworkDiagnostic,
} from "@/lib/opsos/windows-node-types"

type ApiResponse<T> = {
  ok: boolean
  data?: T
  error?: string
  errorName?: string
  errorMessage?: string
  recommendedAction?: string
  cause?: { code?: string; detail?: string }
}

type LogPayload = {
  kind?: WindowsNodeLogType
  lines?: Array<Record<string, unknown>>
  totalLines?: number
  returnedLines?: number
}

type ModalState =
  | { kind: "service"; title: string; action: "start" | "stop" | "restart"; serviceName: "angelcare-email-bridge" | "angelcare-caddy" | "both"; reason: string; confirmation: string }
  | { kind: "backup"; title: string; reason: string; confirmation: boolean }
  | { kind: "proof"; title: string; toEmail: string; subject: string; text: string; reason: string; confirmation: boolean }
  | { kind: "maintenance"; title: string; mode: "enable" | "disable" | "extend"; reason: string; duration: string; message: string; confirmation: boolean }
  | { kind: "system"; title: string; mode: "restart" | "shutdown" | "cancel"; reason: string; confirmation: string }
  | null

const SECTION_TABS = [
  { id: "overview", label: "Overview" },
  { id: "services", label: "Services" },
  { id: "network", label: "Network & Public Access" },
  { id: "smtp", label: "SMTP & Delivery" },
  { id: "logs", label: "Logs" },
  { id: "backups", label: "Backups" },
  { id: "updates", label: "Updates" },
  { id: "security", label: "Security" },
  { id: "maintenance", label: "Maintenance" },
  { id: "disaster-recovery", label: "Disaster Recovery" },
  { id: "audit", label: "Audit" },
] as const

const LOG_TABS: { id: WindowsNodeLogType; label: string }[] = [
  { id: "bridge", label: "Bridge" },
  { id: "bridge-error", label: "Bridge Error" },
  { id: "caddy", label: "Caddy" },
  { id: "caddy-error", label: "Caddy Error" },
  { id: "duckdns", label: "DuckDNS" },
  { id: "audit", label: "Audit" },
  { id: "service", label: "Service Actions" },
]

const DESKTOP_CHAIN = [
  "Vercel OPS",
  "DuckDNS",
  "Caddy :443",
  "127.0.0.1:3005",
  "Menara SMTP :587",
  "Recipient",
] as const

const SERVICE_META = {
  "angelcare-email-bridge": {
    title: "angelcare-email-bridge",
    role: "Bridge service",
    port: "3005",
    endpoint: "http://127.0.0.1:3005/health",
    logHint: "bridge / bridge-error",
  },
  "angelcare-caddy": {
    title: "angelcare-caddy",
    role: "Caddy HTTPS reverse proxy",
    port: "443",
    endpoint: "https://angelcare-mailbridge.duckdns.org",
    logHint: "caddy / caddy-error",
  },
} as const

function api<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  return fetch(path, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  }).then(async (response) => {
    const json = await response.json().catch(() => null)
    return {
      ok: Boolean(response.ok && json?.ok !== false),
      data: json?.data ?? json,
      error: json?.error || json?.errorMessage || (!response.ok ? `HTTP ${response.status}` : undefined),
      errorName: json?.errorName,
      errorMessage: json?.errorMessage,
      recommendedAction: json?.recommendedAction,
      cause: json?.cause,
    }
  }).catch((error) => ({
    ok: false,
    error: error instanceof Error ? error.message : "Request failed",
  }))
}

function statusTone(status?: string) {
  const normalized = String(status || "unknown").toLowerCase()
  if (["healthy", "running", "ok", "synced", "valid"].includes(normalized)) return "healthy"
  if (["degraded", "warning", "partial", "unknown"].includes(normalized)) return "degraded"
  return "critical"
}

function toneClasses(status?: string) {
  const tone = statusTone(status)
  if (tone === "healthy") return "border-emerald-200 bg-emerald-50 text-emerald-800"
  if (tone === "degraded") return "border-amber-200 bg-amber-50 text-amber-800"
  return "border-rose-200 bg-rose-50 text-rose-800"
}

function dotClasses(status?: string) {
  const tone = statusTone(status)
  if (tone === "healthy") return "bg-emerald-500"
  if (tone === "degraded") return "bg-amber-500"
  return "bg-rose-500"
}

function formatDateTime(value?: string) {
  if (!value) return "Unknown"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date)
}

function formatBytes(value?: number) {
  const bytes = Number(value || 0)
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  let current = bytes
  let index = 0
  while (current >= 1024 && index < units.length - 1) {
    current /= 1024
    index += 1
  }
  return `${current.toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function shortValue(value?: unknown) {
  if (value === null || value === undefined || value === "") return "Unknown"
  return String(value)
}

function sanitizeLogText(text: string) {
  return text
    .replace(/([A-Fa-f0-9]{24,})/g, "***REDACTED***")
    .replace(/(eyJ[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+){1,2})/g, "***REDACTED***")
    .replace(/\b([A-Za-z0-9_\-]{32,})\b/g, "***REDACTED***")
    .replace(/([?&](?:token|secret|password|pass|key)=)[^&\s]+/gi, "$1***REDACTED***")
}

function logEntryText(entry: Record<string, unknown>) {
  return sanitizeLogText([
    entry.timestamp,
    entry.event,
    entry.level,
    entry.message,
    entry.action,
    entry.target,
    entry.subject,
    entry.response,
    entry.raw,
  ].filter(Boolean).map(String).join(" "))
}

function metricTone(value?: string) {
  const normalized = String(value || "").toLowerCase()
  if (["healthy", "running", "ok", "synced", "valid"].includes(normalized)) return "healthy"
  if (["degraded", "warning", "partial", "unknown"].includes(normalized)) return "degraded"
  return "critical"
}

function MetricCard({
  label,
  value,
  detail,
  status = "unknown",
  action,
}: {
  label: string
  value: string
  detail: string
  status?: string
  action?: string
}) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-slate-400">{label}</p>
          <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-slate-950">{value}</p>
        </div>
        <span className={`h-2.5 w-2.5 rounded-full ${dotClasses(status)}`} />
      </div>
      <div className={`mt-4 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] ${toneClasses(status)}`}>{detail}</div>
      {action ? <p className="mt-3 text-xs font-semibold text-slate-500">{action}</p> : null}
    </article>
  )
}

function SectionFrame({
  id,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-28 rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_70px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-100 px-6 py-5">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-950">{title}</h2>
        {subtitle ? <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">{subtitle}</p> : null}
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

function ChainNode({
  label,
  status,
  caption,
}: {
  label: string
  status?: string
  caption: string
}) {
  return (
    <div className="flex min-w-[150px] flex-1 flex-col rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-slate-950">{label}</p>
        <span className={`h-2.5 w-2.5 rounded-full ${dotClasses(status)}`} />
      </div>
      <p className={`mt-3 inline-flex self-start rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${toneClasses(status)}`}>
        {caption}
      </p>
    </div>
  )
}

function LogLine({
  entry,
}: {
  entry: Record<string, unknown>
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-700">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-black text-slate-950">{shortValue(entry.timestamp)}</span>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] ${toneClasses(String(entry.level || entry.status || "unknown"))}`}>
          {shortValue(entry.level || entry.status || entry.event)}
        </span>
        <span className="font-semibold text-slate-500">{shortValue(entry.event || entry.action || entry.kind)}</span>
      </div>
      <div className="mt-2 break-words text-slate-700">{logEntryText(entry)}</div>
    </div>
  )
}

function ConfirmModal({
  open,
  title,
  target,
  risk,
  expectedImpact,
  confirmationLabel,
  reason,
  setReason,
  checkboxLabel,
  confirmed,
  setConfirmed,
  secondaryFields,
  onCancel,
  onConfirm,
  confirmLabel = "Confirm",
}: {
  open: boolean
  title: string
  target: string
  risk: "low" | "medium" | "high" | "critical"
  expectedImpact: string
  confirmationLabel: string
  reason: string
  setReason: (value: string) => void
  checkboxLabel: string
  confirmed: boolean
  setConfirmed: (value: boolean) => void
  secondaryFields?: React.ReactNode
  onCancel: () => void
  onConfirm: () => Promise<void>
  confirmLabel?: string
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[30px] border border-slate-200 bg-white shadow-[0_34px_120px_rgba(15,23,42,0.28)]">
        <div className="border-b border-slate-100 px-6 py-5">
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-slate-400">Confirmation required</p>
          <h3 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{target}</p>
        </div>
        <div className="grid gap-4 px-6 py-5">
          <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${risk === "critical" ? "border-rose-200 bg-rose-50 text-rose-800" : risk === "high" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-sky-200 bg-sky-50 text-sky-800"}`}>
            {expectedImpact}
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Reason</label>
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-0 focus:border-slate-400" placeholder={confirmationLabel} />
          </div>
          {secondaryFields}
          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900" />
            <span>{checkboxLabel}</span>
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 px-6 py-5">
          <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50">Cancel</button>
          <button
            type="button"
            onClick={() => { void onConfirm() }}
            disabled={!confirmed || !reason.trim()}
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function WindowsNodeControlCenter() {
  const [status, setStatus] = useState<WindowsNodeStatus | null>(null)
  const [backupStatus, setBackupStatus] = useState<WindowsBackupStatus | null>(null)
  const [maintenance, setMaintenance] = useState<MaintenanceModeState | null>(null)
  const [auditRows, setAuditRows] = useState<WindowsAuditEvent[]>([])
  const [activeLogType, setActiveLogType] = useState<WindowsNodeLogType>("bridge")
  const [logPayload, setLogPayload] = useState<LogPayload | null>(null)
  const [logSearch, setLogSearch] = useState("")
  const [logLines, setLogLines] = useState<50 | 100 | 300>(100)
  const [logUpdatedAt, setLogUpdatedAt] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [busyAction, setBusyAction] = useState("")
  const [message, setMessage] = useState("")
  const [modal, setModal] = useState<ModalState>(null)

  const overallStatus = status?.classification || "unknown"
  const overallTone = metricTone(overallStatus)
  const isMaintenanceEnabled = Boolean(maintenance?.enabled || status?.maintenanceMode?.enabled)

  async function loadStatus() {
    setRefreshing(true)
    const [statusRes, backupRes, maintenanceRes, auditRes] = await Promise.all([
      api<WindowsNodeStatus>("/api/opsos/windows-node/status"),
      api<WindowsBackupStatus>("/api/opsos/windows-node/backup/status"),
      api<MaintenanceModeState>("/api/opsos/windows-node/maintenance-mode"),
      api<{ lines: WindowsAuditEvent[] }>("/api/opsos/windows-node/audit?lines=100"),
    ])

    if (statusRes.ok && statusRes.data) {
      setStatus(statusRes.data)
    }
    if (backupRes.ok && backupRes.data) {
      setBackupStatus(backupRes.data)
    } else if (statusRes.ok && statusRes.data?.backups) {
      setBackupStatus(statusRes.data.backups)
    }
    if (maintenanceRes.ok && maintenanceRes.data) {
      setMaintenance(maintenanceRes.data)
    } else if (statusRes.ok && statusRes.data?.maintenanceMode) {
      setMaintenance(statusRes.data.maintenanceMode)
    }
    if (auditRes.ok && auditRes.data?.lines) {
      setAuditRows(auditRes.data.lines)
    }
    setMessage(statusRes.ok ? "Status refreshed." : statusRes.error || "Unable to refresh status.")
    setLoading(false)
    setRefreshing(false)
  }

  async function loadLogs(type: WindowsNodeLogType, lines = logLines) {
    const response = await api<LogPayload>(`/api/opsos/windows-node/logs?type=${encodeURIComponent(type)}&lines=${lines}`)
    if (response.ok && response.data) {
      setLogPayload(response.data)
      setLogUpdatedAt(new Date().toISOString())
      setMessage(`Loaded ${type} logs.`)
    } else {
      setMessage(response.error || `Unable to load ${type} logs.`)
    }
  }

  async function runQuickAction(action: string, payload: Record<string, unknown> = {}) {
    setBusyAction(action)
    const response = await api<Record<string, unknown>>("/api/opsos/windows-node/action", {
      method: "POST",
      body: JSON.stringify({ action, ...payload }),
    })
    if (response.ok) {
      setMessage(`Action ${action} completed.`)
      await loadStatus()
    } else {
      setMessage(response.error || `Action ${action} failed.`)
    }
    setBusyAction("")
  }

  async function createBackup(reason: string) {
    setBusyAction("backup")
    const response = await api<Record<string, unknown>>("/api/opsos/windows-node/backup", {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
    if (response.ok && response.data) {
      setMessage("Backup created.")
      await loadStatus()
    } else {
      setMessage(response.error || "Backup failed.")
    }
    setBusyAction("")
  }

  async function submitProofSend(payload: { toEmail: string; subject: string; text: string; reason: string }) {
    setBusyAction("proof-send")
    const response = await api<Record<string, unknown>>("/api/opsos/windows-node/proof-send", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    if (response.ok) {
      setMessage("Proof email sent.")
      await loadStatus()
    } else {
      setMessage(response.error || "Proof send failed.")
    }
    setBusyAction("")
  }

  async function submitMaintenance(mode: "enable" | "disable" | "extend", payload: { reason: string; duration?: string; message?: string }) {
    setBusyAction(`maintenance-${mode}`)
    const response = await api<MaintenanceModeState>("/api/opsos/windows-node/maintenance-mode", {
      method: "POST",
      body: JSON.stringify({ mode, reason: payload.reason, duration: payload.duration, message: payload.message }),
    })
    if (response.ok && response.data) {
      setMaintenance(response.data)
      setMessage(`Maintenance ${mode}d.`)
      await loadStatus()
    } else {
      setMessage(response.error || `Maintenance ${mode} failed.`)
    }
    setBusyAction("")
  }

  async function runServiceAction(serviceName: string, action: "start" | "stop" | "restart", reason: string, confirmation: string) {
    setBusyAction(`${serviceName}-${action}`)
    const response = await api<Record<string, unknown>>("/api/opsos/windows-node/service", {
      method: "POST",
      body: JSON.stringify({ serviceName, action, reason, confirmation }),
    })
    if (response.ok) {
      setMessage(`${serviceName} ${action} complete.`)
      await loadStatus()
    } else {
      setMessage(response.error || "Service action failed.")
    }
    setBusyAction("")
  }

  async function runSystemAction(mode: "restart" | "shutdown" | "cancel", reason: string, confirmation: string) {
    setBusyAction(`system-${mode}`)
    const response = await api<Record<string, unknown>>("/api/opsos/windows-node/action", {
      method: "POST",
      body: JSON.stringify({
        action: mode === "restart" ? "system_restart" : mode === "shutdown" ? "system_shutdown" : "cancel_shutdown",
        reason,
        confirmation,
      }),
    })
    if (response.ok) {
      setMessage(`System ${mode} queued.`)
      await loadStatus()
    } else {
      setMessage(response.error || "System command failed.")
    }
    setBusyAction("")
  }

  async function copySanitizedLogs() {
    const lines = logPayload?.lines || []
    const text = lines.map((line) => sanitizeLogText(JSON.stringify(line))).join("\n")
    await navigator.clipboard.writeText(text)
    setMessage("Sanitized logs copied.")
  }

  useEffect(() => {
    void loadStatus()
  }, [])

  useEffect(() => {
    void loadLogs(activeLogType, logLines)
  }, [activeLogType, logLines])

  const selectedLogs = useMemo(() => {
    const lines = logPayload?.lines || []
    const search = logSearch.trim().toLowerCase()
    if (!search) return lines
    return lines.filter((line) => logEntryText(line).toLowerCase().includes(search))
  }, [logPayload, logSearch])

  const auditFiltered = useMemo(() => auditRows.filter((row) => {
    if (!logSearch.trim()) return true
    return logEntryText(row as unknown as Record<string, unknown>).toLowerCase().includes(logSearch.trim().toLowerCase())
  }), [auditRows, logSearch])

  const bridgeService = status?.services.bridge || status?.bridgeService
  const caddyService = status?.services.caddy || status?.caddyService
  const network = status?.network
  const smtp = status?.smtp
  const duckdns = status?.duckdns

  const serviceCards = [
    {
      ...SERVICE_META["angelcare-email-bridge"],
      service: bridgeService,
    },
    {
      ...SERVICE_META["angelcare-caddy"],
      service: caddyService,
    },
  ]

  const proofAccepted = busyAction === "proof-send"

  return (
    <div className="space-y-6 text-slate-950">
      <div className="rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(219,234,254,.8),transparent_34%),radial-gradient(circle_at_top_right,rgba(191,219,254,.46),transparent_24%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_18px_80px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">OPSOS Infrastructure</p>
              <h1 className="mt-2 text-4xl font-black tracking-[-0.06em] text-slate-950">Windows Production Node Control Center</h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
                Email Bridge, Caddy, DuckDNS, Menara SMTP, Services, Backups, Maintenance & Recovery
              </p>
            </div>
            <div className={`rounded-2xl border px-4 py-3 text-sm font-black uppercase tracking-[0.16em] ${metricTone(overallTone) === "healthy" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : metricTone(overallTone) === "degraded" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
              {overallStatus}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 text-sm font-black text-slate-700">
              {DESKTOP_CHAIN.map((item, index) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">{item}</span>
                  {index < DESKTOP_CHAIN.length - 1 ? <ArrowRight className="h-4 w-4 text-slate-300" /> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Global Node Status"
              value={shortValue(status?.classification || "unknown")}
              detail={shortValue(status?.recommendedAction || "Awaiting diagnostic")}
              status={status?.classification}
            />
            <MetricCard
              label="Windows Hostname"
              value={shortValue(status?.hostname || status?.technical.hostname)}
              detail={shortValue(status?.processId ? `PID ${status.processId}` : "Unknown")}
              status="healthy"
            />
            <MetricCard
              label="Bridge Service"
              value={shortValue(bridgeService?.serviceState || bridgeService?.status || "unknown")}
              detail={shortValue(bridgeService?.detail || "Awaiting status")}
              status={bridgeService?.status}
              action={shortValue(bridgeService?.recommendedAction)}
            />
            <MetricCard
              label="Caddy Service"
              value={shortValue(caddyService?.serviceState || caddyService?.status || "unknown")}
              detail={shortValue(caddyService?.detail || "Awaiting status")}
              status={caddyService?.status}
              action={shortValue(caddyService?.recommendedAction)}
            />
            <MetricCard
              label="Local Bridge Health"
              value={shortValue(network?.localHealth || status?.localHealth || "unknown")}
              detail={shortValue(network?.localBridgeHealth?.message || "No local check")}
              status={network?.localBridgeHealth?.status || status?.localHealth}
            />
            <MetricCard
              label="Public HTTPS Health"
              value={shortValue(network?.publicHealth || status?.publicHealth || "unknown")}
              detail={shortValue(network?.publicHealth?.message || "No public check")}
              status={network?.publicHealth?.status || status?.publicHealth}
            />
            <MetricCard
              label="DuckDNS Sync"
              value={shortValue(duckdns?.syncStatus || "unknown")}
              detail={shortValue(duckdns?.error || "Domain resolution check")}
              status={duckdns?.status}
            />
            <MetricCard
              label="Menara SMTP"
              value={shortValue(smtp?.authStatus?.status || smtp?.authStatus || "unknown")}
              detail={shortValue(smtp?.authStatus?.message || smtp?.lastTest?.message || "No SMTP test")}
              status={smtp?.authStatus?.status || smtp?.authStatus?.status}
            />
            <MetricCard
              label="Last Proof Email"
              value={shortValue((status?.lastProofEmail as { messageId?: string } | null)?.messageId || "None")}
              detail={shortValue((status?.lastProofEmail as { timestamp?: string } | null)?.timestamp || "No proof email")}
              status={status?.lastProofEmail ? "healthy" : "unknown"}
            />
            <MetricCard
              label="CPU Snapshot"
              value={shortValue(status?.cpuSnapshot ? `${status.cpuSnapshot.cores} cores` : "Unknown")}
              detail={shortValue(status?.cpuSnapshot?.loadAverage || "No snapshot")}
              status="healthy"
            />
            <MetricCard
              label="Memory Usage"
              value={shortValue(status?.memory ? formatBytes(status.memory.rss) : "Unknown")}
              detail={shortValue(status?.memory ? `${formatBytes(status.memory.systemUsed)} / ${formatBytes(status.memory.systemTotal)}` : "No snapshot")}
              status="healthy"
            />
            <MetricCard
              label="Disk Space"
              value={shortValue(status?.disk ? `${status.disk.usedPercent}% used` : "Unknown")}
              detail={shortValue(status?.disk ? `${formatBytes(status.disk.usedBytes)} used` : "No snapshot")}
              status={status?.disk && status.disk.usedPercent > 85 ? "critical" : status?.disk && status.disk.usedPercent > 70 ? "degraded" : "healthy"}
            />
            <MetricCard
              label="Last Restart / Uptime"
              value={shortValue(status?.uptimeSeconds ? `${Math.round(status.uptimeSeconds / 60)} min` : "Unknown")}
              detail={shortValue(status?.technical.localTime || status?.localTime || "Unknown")}
              status="healthy"
            />
            <MetricCard
              label="Last Admin Action"
              value={shortValue(status?.lastAdminAction?.action || "None")}
              detail={shortValue(status?.lastAdminAction?.reason || "No recent action")}
              status={status?.lastAdminAction ? "healthy" : "unknown"}
            />
          </div>

          {isMaintenanceEnabled ? (
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-amber-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-700">Maintenance mode</p>
                  <p className="mt-2 text-lg font-black">Production impact banner active</p>
                </div>
                <div className="text-sm font-semibold">
                  <p>Reason: {maintenance?.reason || status?.maintenanceMode?.reason || "Unknown"}</p>
                  <p>Expected: {maintenance?.expectedDuration || status?.maintenanceMode?.expectedDuration || "Unknown"}</p>
                  <p>Started: {formatDateTime(maintenance?.startedAt || status?.maintenanceMode?.startedAt)}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => void runQuickAction("full_diagnostic")} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50" disabled={busyAction === "full_diagnostic"}>
              {busyAction === "full_diagnostic" ? "Running..." : "Run Full Diagnostic"}
            </button>
            <button type="button" onClick={() => void loadStatus()} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-800">
              {refreshing ? "Refreshing..." : "Refresh Status"}
            </button>
            <button
              type="button"
              onClick={() => setModal({ kind: "backup", title: "Create Production Backup", reason: "", confirmation: false })}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-800"
            >
              Create Backup Now
            </button>
            <button
              type="button"
              onClick={() => setModal({ kind: "service", title: "Restart Both Services", action: "restart", serviceName: "both", reason: "", confirmation: "" })}
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-black text-rose-800"
            >
              Restart Services
            </button>
            <button
              type="button"
              onClick={() => setModal({ kind: "proof", title: "Send Proof Email", toEmail: "", subject: "AngelCare bridge proof", text: "Bridge proof email from Windows node.", reason: "", confirmation: false })}
              className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-black text-sky-800"
            >
              Send Proof Email
            </button>
            <button
              type="button"
              onClick={() => void runQuickAction("refresh_status")}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-800"
            >
              {busyAction === "refresh_status" ? "Running..." : "Refresh via API"}
            </button>
          </div>

          {message ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">{message}</div>
          ) : null}
        </div>
      </div>

      <div className="sticky top-20 z-20 rounded-[24px] border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex flex-wrap gap-2">
          {SECTION_TABS.map((tab) => (
            <a key={tab.id} href={`#${tab.id}`} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-600 hover:bg-slate-950 hover:text-white">
              {tab.label}
            </a>
          ))}
        </div>
      </div>

      <SectionFrame
        id="overview"
        eyebrow="Cockpit"
        title="Overview"
        subtitle="Production route map, classification, maintenance banner, and immediate operator actions."
      >
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Production route map</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {DESKTOP_CHAIN.map((item, index) => {
                  const tone = index === 0 ? "healthy" : index === 1 ? duckdns?.status : index === 2 ? caddyService?.status : index === 3 ? bridgeService?.status : index === 4 ? smtp?.authStatus?.status : "healthy"
                  return (
                    <div key={item} className="flex items-center gap-3">
                      <div className={`rounded-2xl border px-3 py-2 text-sm font-black ${toneClasses(String(tone))}`}>{item}</div>
                      {index < DESKTOP_CHAIN.length - 1 ? <ArrowRight className="h-4 w-4 text-slate-300" /> : null}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className={`rounded-[24px] border p-5 ${overallTone === "healthy" ? "border-emerald-200 bg-emerald-50" : overallTone === "degraded" ? "border-amber-200 bg-amber-50" : "border-rose-200 bg-rose-50"}`}>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Global health summary</p>
              <h3 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-950">{shortValue(status?.classification || "unknown")}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{shortValue(status?.recommendedAction || "Awaiting operator diagnostic.")}</p>
              <p className="mt-3 text-xs font-semibold text-slate-500">Last full diagnostic: {formatDateTime(status?.localTime || status?.technical.localTime)}</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Quick actions</p>
              <div className="mt-4 grid gap-3">
                <button type="button" onClick={() => void runQuickAction("full_diagnostic")} className="rounded-xl bg-slate-950 px-4 py-3 text-left text-sm font-black text-white">Run Full Diagnostic</button>
                <button type="button" onClick={() => void loadStatus()} className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-black text-slate-800">Refresh Status</button>
                <button type="button" onClick={() => setModal({ kind: "backup", title: "Create Production Backup", reason: "", confirmation: false })} className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-black text-slate-800">Create Backup Now</button>
                <button type="button" onClick={() => setModal({ kind: "proof", title: "Send Proof Email", toEmail: "", subject: "AngelCare bridge proof", text: "Bridge proof email from Windows node.", reason: "", confirmation: false })} className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-black text-slate-800">Send Proof Email</button>
                <button type="button" onClick={() => setModal({ kind: "service", title: "Restart Bridge Service", action: "restart", serviceName: "angelcare-email-bridge", reason: "", confirmation: "" })} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm font-black text-rose-800">Restart Bridge</button>
                <button type="button" onClick={() => setModal({ kind: "service", title: "Restart Caddy Service", action: "restart", serviceName: "angelcare-caddy", reason: "", confirmation: "" })} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm font-black text-amber-800">Restart Caddy</button>
              </div>
            </div>
          </div>
        </div>
      </SectionFrame>

      <SectionFrame
        id="services"
        eyebrow="Windows services"
        title="Services"
        subtitle="Manage the NSSM-controlled bridge and Caddy services with confirmation, reasons, and live status checks."
      >
        <div className="grid gap-5 xl:grid-cols-2">
          {serviceCards.map((item) => {
            const service = item.service
            return (
              <article key={item.title} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{item.role}</p>
                    <h3 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-950">{item.title}</h3>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] ${toneClasses(service?.status)}`}>
                    {shortValue(service?.serviceState || service?.status || "unknown")}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">Startup: <span className="font-black text-slate-950">{shortValue(service?.startupType)}</span></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">Port: <span className="font-black text-slate-950">{item.port}</span></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">Endpoint: <span className="font-black text-slate-950 break-all">{item.endpoint}</span></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">Logs: <span className="font-black text-slate-950">{item.logHint}</span></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">Last action: <span className="font-black text-slate-950">{shortValue(service?.lastAction || "unknown")}</span></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">Last restart: <span className="font-black text-slate-950">{formatDateTime(service?.lastRestartAt)}</span></div>
                </div>
                <p className="mt-3 text-sm text-slate-500">{shortValue(service?.detail || service?.recommendedAction || "Awaiting live status.")}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button type="button" onClick={() => setModal({ kind: "service", title: `Start ${item.title}`, action: "start", serviceName: item.title, reason: "", confirmation: "" })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-800">Start</button>
                  <button type="button" onClick={() => setModal({ kind: "service", title: `Stop ${item.title}`, action: "stop", serviceName: item.title, reason: "", confirmation: "" })} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-black text-rose-800">Stop</button>
                  <button type="button" onClick={() => setModal({ kind: "service", title: `Restart ${item.title}`, action: "restart", serviceName: item.title, reason: "", confirmation: "" })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-800">Restart</button>
                  <button type="button" onClick={() => void setActiveLogType(item.title === "angelcare-caddy" ? "caddy" : "bridge")} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-800">View logs</button>
                </div>
              </article>
            )
          })}
        </div>
      </SectionFrame>

      <SectionFrame
        id="network"
        eyebrow="Connectivity"
        title="Network & Public Access"
        subtitle="Route validation, DuckDNS, NAT expectations, port checks, local health, public HTTPS, and diagnostic tree."
      >
        <div className="grid gap-4 xl:grid-cols-4">
          <MetricCard label="LAN IP" value={shortValue(network?.lanIp || status?.network?.lanIp)} detail="Local interface" status="healthy" />
          <MetricCard label="Public IP" value={shortValue(network?.publicIp || "unknown")} detail="Current egress" status={network?.publicIp ? "healthy" : "degraded"} />
          <MetricCard label="DuckDNS Resolved IP" value={shortValue(duckdns?.resolvedIp || "unknown")} detail={shortValue(duckdns?.domain || "DuckDNS")} status={duckdns?.status} />
          <MetricCard label="DuckDNS Match" value={shortValue(network?.ipMatch ? "match" : "mismatch")} detail={shortValue(duckdns?.currentPublicIp || "Unknown")} status={network?.ipMatch ? "healthy" : "critical"} />
          <MetricCard label="Port 80" value={shortValue(network?.ports?.[80] || "unknown")} detail="HTTP entry point" status={network?.ports?.[80]} />
          <MetricCard label="Port 443" value={shortValue(network?.ports?.[443] || "unknown")} detail="HTTPS entry point" status={network?.ports?.[443]} />
          <MetricCard label="Port 3005" value={shortValue(network?.ports?.[3005] || "unknown")} detail="Local bridge" status={network?.ports?.[3005]} />
          <MetricCard label="Caddy TLS Status" value={shortValue(status?.caddy?.certificateStatus?.status || "unknown")} detail={shortValue(status?.caddy?.certificateStatus?.message || "No TLS check")} status={status?.caddy?.certificateStatus?.status} />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Diagnostic tree</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void runQuickAction("network_diagnostic")} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Run Network Diagnostic</button>
                <button type="button" onClick={() => void runQuickAction("duckdns_status")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800">Refresh DuckDNS Status</button>
                <button type="button" onClick={() => void runQuickAction("validate_caddy")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800">Validate Caddy Config</button>
                <button type="button" onClick={() => void runQuickAction("reload_caddy")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800">Reload Caddy</button>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {(network?.diagnosticTree || []).map((item) => (
                <div key={item.step} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">{item.step}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.message}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${toneClasses(item.status)}`}>{item.status}</span>
                  </div>
                </div>
              ))}
              {!network?.diagnosticTree?.length ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">No diagnostic tree yet. Run a network diagnostic.</div> : null}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Router / NAT expected forwarding</p>
            <div className="mt-4 grid gap-3 text-sm text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">WAN 80 → local 80</div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">WAN 443 → Caddy 443</div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">Local 3005 remains loopback-only</div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">DuckDNS must resolve to current public IP</div>
            </div>
          </div>
        </div>
      </SectionFrame>

      <SectionFrame
        id="smtp"
        eyebrow="Delivery"
        title="SMTP & Delivery"
        subtitle="Menara SMTP connectivity, auth posture, last proof email, and safe proof-send controls."
      >
        <div className="grid gap-4 xl:grid-cols-4">
          <MetricCard label="SMTP Host" value={shortValue(smtp?.host || "smtp-auth.menara.ma")} detail="Menara relay" status="healthy" />
          <MetricCard label="SMTP Port" value={shortValue(smtp?.port || 587)} detail={shortValue(smtp?.secure ? "Secure" : "STARTTLS / false")} status="healthy" />
          <MetricCard label="DNS Resolution" value={shortValue(network?.smtpHostResolutionStatus || "unknown")} detail={shortValue(network?.smtpHostResolution || smtp?.user || "Unknown")} status={network?.smtpHostResolutionStatus} />
          <MetricCard label="Auth Status" value={shortValue(smtp?.authStatus?.status || "unknown")} detail={shortValue(smtp?.authStatus?.message || "No test yet")} status={smtp?.authStatus?.status} />
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">SMTP evidence</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void runQuickAction("smtp_test")} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Run SMTP Test</button>
                <button type="button" onClick={() => setModal({ kind: "proof", title: "Send Proof Email", toEmail: "", subject: "AngelCare bridge proof", text: "Bridge proof email from Windows node.", reason: "", confirmation: false })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800">Send Proof Email</button>
                <button type="button" onClick={() => void setActiveLogType("bridge-error")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800">View SMTP / bridge error logs</button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Last SMTP test</p>
                <p className="mt-2 font-black text-slate-950">{shortValue(smtp?.lastTest?.status || smtp?.authStatus?.status || "unknown")}</p>
                <p className="mt-2 text-slate-500">{shortValue(smtp?.lastTest?.message || smtp?.authStatus?.message || "No test yet")}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Last proof email</p>
                <p className="mt-2 font-black text-slate-950">{shortValue((status?.lastProofEmail as { messageId?: string } | null)?.messageId || "None")}</p>
                <p className="mt-2 text-slate-500">{shortValue((status?.lastProofEmail as { response?: string } | null)?.response || "No proof send yet")}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm md:col-span-2">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Last SMTP error</p>
                <p className="mt-2 text-slate-700">{shortValue((status?.lastError as { message?: string } | null)?.message || "No recent SMTP error")}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Proof send controls</p>
            <button type="button" onClick={() => setModal({ kind: "proof", title: "Send Proof Email", toEmail: "", subject: "AngelCare bridge proof", text: "Bridge proof email from Windows node.", reason: "", confirmation: false })} className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Open Proof Send Modal</button>
            <p className="mt-3 text-sm leading-6 text-slate-500">Recipient, subject, message, and purpose are required. The browser never receives SMTP passwords or bridge tokens.</p>
          </div>
        </div>
      </SectionFrame>

      <SectionFrame
        id="logs"
        eyebrow="Observability"
        title="Logs"
        subtitle="Bridge, Caddy, DuckDNS, audit, and service-action log streams with client-side search and sanitized copy."
      >
        <div className="flex flex-wrap items-center gap-3">
          {LOG_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveLogType(tab.id)}
              className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${activeLogType === tab.id ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600"}`}
            >
              {tab.label}
            </button>
          ))}
          <select value={logLines} onChange={(event) => setLogLines(Number(event.target.value) as 50 | 100 | 300)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-600">
            <option value={50}>50 lines</option>
            <option value={100}>100 lines</option>
            <option value={300}>300 lines</option>
          </select>
          <button type="button" onClick={() => void loadLogs(activeLogType, logLines)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-600">
            Refresh
          </button>
          <button type="button" onClick={() => void copySanitizedLogs()} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-600">
            Copy sanitized logs
          </button>
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_0.42fr]">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{activeLogType}</p>
              <div className="text-xs font-semibold text-slate-500">Updated: {formatDateTime(logUpdatedAt)}</div>
            </div>
            <input
              value={logSearch}
              onChange={(event) => setLogSearch(event.target.value)}
              placeholder="Search sanitized logs"
              className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
            />
            <div className="mt-4 grid gap-3">
              {selectedLogs.length ? selectedLogs.map((entry, index) => <LogLine key={`${String(entry.timestamp || index)}-${index}`} entry={entry} />) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">No logs available.</div>
              )}
            </div>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Sanitization</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">Token-like strings, auth headers, and secret-shaped fragments are masked before rendering or copying.</p>
            <div className="mt-4 grid gap-3 text-sm text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">No arbitrary file path access</div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">Allowlisted log categories only</div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">Safe 50 / 100 / 300 line windows</div>
            </div>
          </div>
        </div>
      </SectionFrame>

      <SectionFrame
        id="backups"
        eyebrow="Recovery"
        title="Backups"
        subtitle="Backup health, protected asset matrix, and restore-oriented operator controls."
      >
        <div className="grid gap-4 xl:grid-cols-4">
          <MetricCard label="Backup Health" value={shortValue(backupStatus?.directoryExists ? "ready" : "missing")} detail={shortValue(backupStatus?.latestManifestSummary || "No backup yet")} status={backupStatus?.directoryExists ? "healthy" : "critical"} />
          <MetricCard label="Latest Backup" value={shortValue(backupStatus?.latestBackupName || "None")} detail={formatDateTime(backupStatus?.latestBackupAt)} status={backupStatus?.latestBackupName ? "healthy" : "unknown"} />
          <MetricCard label="Backup Count" value={shortValue(backupStatus?.backupCount ?? 0)} detail={shortValue(backupStatus?.folderSizeBytes ? formatBytes(backupStatus.folderSizeBytes) : "0 B")} status="healthy" />
          <MetricCard label="Protected Assets" value={shortValue(backupStatus?.protectedAssets?.filter((item) => item.present).length || 0)} detail="Present / tracked" status="healthy" />
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.85fr]">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Protected asset matrix</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => void loadStatus()} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800">Refresh Backup Status</button>
                <button type="button" onClick={() => setModal({ kind: "backup", title: "Create Production Backup", reason: "", confirmation: false })} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Create Backup Now</button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {(backupStatus?.protectedAssets || []).map((asset) => (
                <div key={asset.name} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-950">{asset.name}</p>
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${asset.present ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>{asset.present ? "present" : "missing"}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 break-all">{asset.path}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Operator actions</p>
            <div className="mt-4 grid gap-3">
              <button type="button" onClick={() => setModal({ kind: "backup", title: "Create Production Backup", reason: "", confirmation: false })} className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-black text-slate-800">Create Backup Now</button>
              <button type="button" onClick={() => void loadStatus()} className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-black text-slate-800">Refresh Backup Status</button>
              <button type="button" onClick={() => void navigator.clipboard.writeText(JSON.stringify(backupStatus || {}, null, 2))} className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-black text-slate-800">View Latest Manifest</button>
              <button type="button" onClick={() => setMessage("Restore checklist is documented in the Disaster Recovery section.")} className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-black text-slate-800">Open Restore Checklist</button>
            </div>
          </div>
        </div>
      </SectionFrame>

      <SectionFrame
        id="updates"
        eyebrow="Upgrade readiness"
        title="Updates"
        subtitle="Versioning, file change recency, and safe validation before restarts."
      >
        <div className="grid gap-4 xl:grid-cols-4">
          <MetricCard label="Bridge Version" value={shortValue(status?.updateReadiness?.bridgeVersion || status?.version || "unknown")} detail="Bridge package version" status="healthy" />
          <MetricCard label="server.js Modified" value={formatDateTime(status?.bridgeFiles?.serverJsModifiedAt || status?.updateReadiness?.serverJsModifiedAt)} detail="Source recency" status="healthy" />
          <MetricCard label="package.json Modified" value={formatDateTime(status?.bridgeFiles?.packageJsonModifiedAt || status?.updateReadiness?.packageJsonModifiedAt)} detail="Dependency manifest" status="healthy" />
          <MetricCard label="Node Version" value={shortValue(status?.nodeVersion || status?.technical.nodeVersion || "unknown")} detail={shortValue(status?.updateReadiness?.npmDependenciesStatus || "unknown")} status="healthy" />
        </div>
        <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setMessage("Manual validation command: node --check C:\\AngelCare\\email-bridge\\server.js")} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white">Validate Bridge Syntax</button>
            <button type="button" onClick={() => setModal({ kind: "service", title: "Restart Bridge After Update", action: "restart", serviceName: "angelcare-email-bridge", reason: "Post-update restart", confirmation: "" })} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-800">Restart Bridge After Update</button>
            <button type="button" onClick={() => void runQuickAction("full_diagnostic")} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-800">Run Post-Update Diagnostic</button>
            <button type="button" onClick={() => setMessage("Rollback steps are listed in the Disaster Recovery section.")} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-800">Rollback Checklist</button>
          </div>
        </div>
      </SectionFrame>

      <SectionFrame
        id="security"
        eyebrow="Access control"
        title="Security"
        subtitle="Token posture, unauthorized access signals, and rotation checklist without exposing secret values."
      >
        <div className="grid gap-4 xl:grid-cols-4">
          <MetricCard label="Admin token configured" value={status?.security?.adminTokenConfigured ? "yes" : "no"} detail="Server-side only" status={status?.security?.adminTokenConfigured ? "healthy" : "critical"} />
          <MetricCard label="Bridge token configured" value={status?.security?.bridgeTokenConfigured ? "yes" : "no"} detail="Server-side only" status={status?.security?.bridgeTokenConfigured ? "healthy" : "critical"} />
          <MetricCard label=".env present" value={status?.security?.envPresent ? "yes" : "no"} detail="Windows node local file" status={status?.security?.envPresent ? "healthy" : "degraded"} />
          <MetricCard label="Secrets masked" value={status?.security?.maskedSecrets ? "yes" : "no"} detail="Browser safe" status="healthy" />
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[24px] border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Security posture</p>
            <div className="mt-4 grid gap-3 text-sm text-slate-700">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">Recent unauthorized attempts: <span className="font-black text-slate-950">{shortValue(status?.security?.recentUnauthorizedAttempts || 0)}</span></div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">Recent token mismatch suspicion: <span className="font-black text-slate-950">{shortValue(status?.security?.recentTokenMismatchSuspicion || 0)}</span></div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">Recent failed SMTP auth: <span className="font-black text-slate-950">{shortValue(status?.security?.recentFailedSmtpAuth || 0)}</span></div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">Recent failed API calls: <span className="font-black text-slate-950">{shortValue(status?.security?.recentFailedApiCalls || 0)}</span></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => setMessage("Rotate tokens using the checklist below.")} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-800">Token Rotation Checklist</button>
              <button type="button" onClick={() => void runQuickAction("refresh_status")} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white">Restart after Token Rotation</button>
              <button type="button" onClick={() => void loadStatus()} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-800">View Security Audit</button>
            </div>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Token rotation checklist</p>
            <ol className="mt-4 grid gap-3 text-sm text-slate-700">
              {[
                "Generate new token securely",
                "Update Windows .env",
                "Restart bridge service",
                "Update Vercel env",
                "Redeploy production",
                "Test bridge-health",
                "Test send-direct",
                "Rotate old token out",
                "Audit completion",
              ].map((item, index) => (
                <li key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold">
                  <span className="mr-3 rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-black text-white">{index + 1}</span>
                  {item}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </SectionFrame>

      <SectionFrame
        id="maintenance"
        eyebrow="Operational control"
        title="Maintenance"
        subtitle="Enable, disable, and extend the maintenance window without blocking emergency admin actions."
      >
        <div className="grid gap-4 xl:grid-cols-4">
          <MetricCard label="Mode" value={maintenance?.enabled ? "enabled" : "disabled"} detail={shortValue(maintenance?.reason || "No active window")} status={maintenance?.enabled ? "degraded" : "healthy"} />
          <MetricCard label="Duration" value={shortValue(maintenance?.expectedDuration || "None")} detail="Expected window" status="healthy" />
          <MetricCard label="Started at" value={formatDateTime(maintenance?.startedAt)} detail={shortValue(maintenance?.startedBy || "Unknown")} status={maintenance?.enabled ? "degraded" : "unknown"} />
          <MetricCard label="Message" value={shortValue(maintenance?.message || "None")} detail="Banner text" status="healthy" />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={() => setModal({ kind: "maintenance", title: "Enable Maintenance Mode", mode: "enable", reason: "", duration: "", message: "", confirmation: false })} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white">Enable Maintenance Mode</button>
          <button type="button" onClick={() => setModal({ kind: "maintenance", title: "Disable Maintenance Mode", mode: "disable", reason: maintenance?.reason || "", duration: maintenance?.expectedDuration || "", message: maintenance?.message || "", confirmation: false })} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-800">Disable Maintenance Mode</button>
          <button type="button" onClick={() => setModal({ kind: "maintenance", title: "Extend Maintenance Window", mode: "extend", reason: maintenance?.reason || "", duration: maintenance?.expectedDuration || "", message: maintenance?.message || "", confirmation: false })} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-800">Extend Maintenance Window</button>
          <button type="button" onClick={() => setModal({ kind: "system", title: "Controlled Windows Restart", mode: "restart", reason: "", confirmation: "" })} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-black text-amber-800">Reboot Windows</button>
          <button type="button" onClick={() => setModal({ kind: "system", title: "Controlled Windows Shutdown", mode: "shutdown", reason: "", confirmation: "" })} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-black text-rose-800">Shutdown Windows</button>
          <button type="button" onClick={() => setModal({ kind: "system", title: "Cancel Scheduled Shutdown", mode: "cancel", reason: "", confirmation: "" })} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-800">Cancel Shutdown</button>
        </div>
      </SectionFrame>

      <SectionFrame
        id="disaster-recovery"
        eyebrow="Runbooks"
        title="Disaster Recovery"
        subtitle="Guided incident playbooks for bridge failure, public HTTPS failure, DNS mismatch, SMTP failure, node offline, migration, token rotation, and backup restore."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {[
            ["If bridge service fails", "Bridge layer", "Verify SERVICE_RUNNING, restart angelcare-email-bridge, then check local /health and send-direct proof."],
            ["If Caddy/public HTTPS fails", "Edge layer", "Validate Caddy config, restart angelcare-caddy, then confirm public HTTPS and TLS certificate status."],
            ["If DuckDNS mismatch", "DNS edge", "Refresh DuckDNS status, verify current public IP, then update the mapping and confirm the match."],
            ["If SMTP auth fails", "Delivery layer", "Run SMTP test, confirm Menara DNS and port 587 reachability, then inspect auth logs and credentials state."],
            ["If Windows node is offline", "Host layer", "Check host reachability, port 3005, service recovery, and controlled reboot status before resuming traffic."],
            ["If migrating to new machine", "Cutover plan", "Provision Windows, install Node/Git/NSSM/Caddy, restore folder set, recreate services, then prove with send-direct."],
            ["If rotating tokens", "Security", "Update .env, restart bridge, update Vercel env, redeploy, test bridge-health, test send-direct, and audit completion."],
            ["If restoring from backup", "Restore path", "Choose latest backup, restore bridge files and Caddyfile, restart services, validate health, then send proof email."],
          ].map(([title, layer, body]) => (
            <article key={title} className="rounded-[24px] border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{layer}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            </article>
          ))}
        </div>
        <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">New machine migration checklist</p>
          <ol className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
            {[
              "Provision Windows machine",
              "Install Node.js, Git, NSSM, Caddy",
              "Create C:\\AngelCare folders",
              "Restore bridge folder",
              "Restore .env",
              "Restore Caddyfile",
              "Recreate NSSM services",
              "Restore DuckDNS updater",
              "Configure firewall/router/NAT",
              "Start services",
              "Validate local health",
              "Validate public health",
              "Run SMTP test",
              "Run production send-direct proof",
              "Declare cutover complete",
            ].map((item, index) => (
              <li key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold">
                <span className="mr-3 rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-black text-white">{index + 1}</span>
                {item}
              </li>
            ))}
          </ol>
        </div>
      </SectionFrame>

      <SectionFrame
        id="audit"
        eyebrow="Traceability"
        title="Audit"
        subtitle="Filtered, safe audit evidence for page views, diagnostics, service actions, backups, maintenance, and blocked access."
      >
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => void api<{ lines: WindowsAuditEvent[] }>("/api/opsos/windows-node/audit?lines=100").then((response) => {
            if (response.ok && response.data?.lines) setAuditRows(response.data.lines)
          })} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-600">
            Refresh Audit
          </button>
          <button type="button" onClick={() => setActiveLogType("audit")} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-600">
            Open Audit Logs
          </button>
          <input value={logSearch} onChange={(event) => setLogSearch(event.target.value)} placeholder="Filter audit rows" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-600" />
        </div>
        <div className="mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
          <div className="grid grid-cols-[1.2fr_1fr_1.2fr_1fr_1fr_1fr_1fr_1.5fr] gap-0 border-b border-slate-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            <div>Timestamp</div>
            <div>Actor</div>
            <div>Action</div>
            <div>Target</div>
            <div>Result</div>
            <div>Severity</div>
            <div>Reason</div>
            <div>Metadata summary</div>
          </div>
          <div className="max-h-[540px] overflow-auto">
            {auditFiltered.length ? auditFiltered.map((row, index) => (
              <div key={`${row.timestamp}-${index}`} className="grid grid-cols-[1.2fr_1fr_1.2fr_1fr_1fr_1fr_1fr_1.5fr] gap-0 border-b border-slate-200 px-4 py-3 text-sm text-slate-700 last:border-b-0">
                <div className="font-black text-slate-950">{formatDateTime(row.timestamp)}</div>
                <div>{row.actor}</div>
                <div className="font-semibold">{row.action}</div>
                <div>{row.target}</div>
                <div>{row.result}</div>
                <div>{row.severity}</div>
                <div>{row.reason}</div>
                <div className="text-slate-500">{row.metadataSummary}</div>
              </div>
            )) : (
              <div className="p-6 text-sm text-slate-500">No audit events available.</div>
            )}
          </div>
        </div>
      </SectionFrame>

      <ConfirmModal
        open={Boolean(modal && modal.kind === "service")}
        title={modal?.kind === "service" ? modal.title : ""}
        target={modal?.kind === "service" ? `${modal.serviceName} • ${modal.action.toUpperCase()}` : ""}
        risk={modal?.kind === "service" && modal.action === "stop" ? "high" : "medium"}
        expectedImpact={modal?.kind === "service" && modal.serviceName === "both" ? "This will restart bridge first and then Caddy. Public sending may be unavailable briefly." : "This action may interrupt Email-OS sending or public reachability until the service returns healthy."}
        confirmationLabel="Describe the operational reason for this change."
        reason={modal?.kind === "service" ? modal.reason : ""}
        setReason={(value) => setModal((current) => current && current.kind === "service" ? { ...current, reason: value } : current)}
        checkboxLabel="I understand the impact and have validated the target."
        confirmed={Boolean(modal?.kind === "service" && modal.confirmation)}
        setConfirmed={(value) => setModal((current) => current && current.kind === "service" ? { ...current, confirmation: value ? "CONFIRM SERVICE ACTION" : "" } : current)}
        onCancel={() => setModal(null)}
        onConfirm={async () => {
          if (modal?.kind !== "service") return
          if (modal.serviceName === "both") {
            await runServiceAction("angelcare-email-bridge", modal.action, modal.reason, "CONFIRM SERVICE ACTION")
            await runServiceAction("angelcare-caddy", modal.action, modal.reason, "CONFIRM SERVICE ACTION")
          } else {
            await runServiceAction(modal.serviceName, modal.action, modal.reason, "CONFIRM SERVICE ACTION")
          }
          setModal(null)
        }}
        confirmLabel="Execute service action"
      />

      <ConfirmModal
        open={Boolean(modal && modal.kind === "backup")}
        title={modal?.kind === "backup" ? modal.title : ""}
        target="Create timestamped backup under C:\\AngelCare\\backups"
        risk="medium"
        expectedImpact="The backup captures bridge files, Caddyfile, and a manifest. It does not expose secrets in the browser response."
        confirmationLabel="Explain why this backup is required."
        reason={modal?.kind === "backup" ? modal.reason : ""}
        setReason={(value) => setModal((current) => current && current.kind === "backup" ? { ...current, reason: value } : current)}
        checkboxLabel="I confirm the backup should be taken now."
        confirmed={Boolean(modal?.kind === "backup" && modal.confirmation)}
        setConfirmed={(value) => setModal((current) => current && current.kind === "backup" ? { ...current, confirmation: value } : current)}
        onCancel={() => setModal(null)}
        onConfirm={async () => {
          if (modal?.kind !== "backup") return
          await createBackup(modal.reason)
          setModal(null)
        }}
        confirmLabel="Create backup"
      />

      <ConfirmModal
        open={Boolean(modal && modal.kind === "proof")}
        title={modal?.kind === "proof" ? modal.title : ""}
        target="Send a controlled proof email through the Menara SMTP relay."
        risk="medium"
        expectedImpact="This sends a real message through the production SMTP path and records the delivery evidence."
        confirmationLabel="Why is this proof message being sent?"
        reason={modal?.kind === "proof" ? modal.reason : ""}
        setReason={(value) => setModal((current) => current && current.kind === "proof" ? { ...current, reason: value } : current)}
        checkboxLabel="I confirm the recipient is valid and the message is intentional."
        confirmed={Boolean(modal?.kind === "proof" && modal.confirmation)}
        setConfirmed={(value) => setModal((current) => current && current.kind === "proof" ? { ...current, confirmation: value } : current)}
        secondaryFields={modal?.kind === "proof" ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2 md:col-span-2">
              <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Recipient email</label>
              <input
                value={modal.toEmail}
                onChange={(event) =>
                  setModal((current) =>
                    current && current.kind === "proof"
                      ? { ...current, toEmail: event.target.value }
                      : current
                  )
                }
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Subject</label>
              <input
                value={modal.subject}
                onChange={(event) =>
                  setModal((current) =>
                    current && current.kind === "proof"
                      ? { ...current, subject: event.target.value }
                      : current
                  )
                }
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Message</label>
              <textarea
                value={modal.text}
                onChange={(event) =>
                  setModal((current) =>
                    current && current.kind === "proof"
                      ? { ...current, text: event.target.value }
                      : current
                  )
                }
                className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />
            </div>
          </div>
        ) : null}
        onCancel={() => setModal(null)}
        onConfirm={async () => {
          if (modal?.kind !== "proof") return
          await submitProofSend({ toEmail: modal.toEmail, subject: modal.subject, text: modal.text, reason: modal.reason })
          setModal(null)
        }}
        confirmLabel={proofAccepted ? "Sending..." : "Send proof email"}
      />

      <ConfirmModal
        open={Boolean(modal && modal.kind === "maintenance")}
        title={modal?.kind === "maintenance" ? modal.title : ""}
        target="Maintenance mode changes are audited and bannered immediately."
        risk={modal?.kind === "maintenance" && modal.mode === "disable" ? "low" : "high"}
        expectedImpact="Maintenance banners may warn other operators. Emergency actions remain available."
        confirmationLabel="Reason for maintenance change"
        reason={modal?.kind === "maintenance" ? modal.reason : ""}
        setReason={(value) => setModal((current) => current && current.kind === "maintenance" ? { ...current, reason: value } : current)}
        checkboxLabel="I understand the operational impact."
        confirmed={Boolean(modal?.kind === "maintenance" && modal.confirmation)}
        setConfirmed={(value) => setModal((current) => current && current.kind === "maintenance" ? { ...current, confirmation: value } : current)}
        secondaryFields={modal?.kind === "maintenance" ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Expected duration</label>
              <input
                value={modal.duration}
                onChange={(event) =>
                  setModal((current) =>
                    current && current.kind === "maintenance"
                      ? { ...current, duration: event.target.value }
                      : current
                  )
                }
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Message</label>
              <input
                value={modal.message}
                onChange={(event) =>
                  setModal((current) =>
                    current && current.kind === "maintenance"
                      ? { ...current, message: event.target.value }
                      : current
                  )
                }
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />
            </div>
          </div>
        ) : null}
        onCancel={() => setModal(null)}
        onConfirm={async () => {
          if (modal?.kind !== "maintenance") return
          await submitMaintenance(modal.mode, { reason: modal.reason, duration: modal.duration, message: modal.message })
          setModal(null)
        }}
        confirmLabel="Apply maintenance change"
      />

      <ConfirmModal
        open={Boolean(modal && modal.kind === "system")}
        title={modal?.kind === "system" ? modal.title : ""}
        target={modal?.kind === "system" ? (modal.mode === "shutdown" ? "This will stop Email-OS sending until the Windows node is powered on and services are validated." : modal.mode === "restart" ? "Email-OS sending may be unavailable for 3–10 minutes." : "Cancel an already scheduled shutdown.") : ""}
        risk={modal?.kind === "system" && modal.mode === "shutdown" ? "critical" : "high"}
        expectedImpact={modal?.kind === "system" && modal.mode === "cancel" ? "This cancels pending shutdown only." : "This is a controlled power operation with a mandatory delay."}
        confirmationLabel="Reason for system control"
        reason={modal?.kind === "system" ? modal.reason : ""}
        setReason={(value) => setModal((current) => current && current.kind === "system" ? { ...current, reason: value } : current)}
        checkboxLabel="I have validated the operational window."
        confirmed={Boolean(modal?.kind === "system" && modal.confirmation)}
        setConfirmed={(value) => setModal((current) => current && current.kind === "system" ? { ...current, confirmation: value ? "CONFIRM" : "" } : current)}
        onCancel={() => setModal(null)}
        onConfirm={async () => {
          if (modal?.kind !== "system") return
          await runSystemAction(modal.mode, modal.reason, modal.confirmation || "CONFIRM")
          setModal(null)
        }}
        confirmLabel={modal?.kind === "system" && modal.mode === "cancel" ? "Cancel shutdown" : "Execute system control"}
      />
    </div>
  )
}
