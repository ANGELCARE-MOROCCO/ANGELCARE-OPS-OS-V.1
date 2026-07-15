"use client"

import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BellRing,
  Bolt,
  CheckCircle2,
  ClipboardCopy,
  Clock3,
  Database,
  Globe,
  HardDriveDownload,
  History,
  Loader2,
  LockKeyhole,
  Mail,
  MailCheck,
  Network,
  RefreshCw,
  RotateCcw,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  SquareTerminal,
  TriangleAlert,
  Wifi,
  X
} from "lucide-react"
import { cleanString, type ServerControlLogType } from "@/lib/email-os/server-control-shared"

type ApiResult<T = any> = { ok: boolean; data?: T; error?: string | null }

type ControlStatus = any
type LogEntry = {
  timestamp?: string
  event?: string
  level?: string
  message?: string
  raw?: string
  kind?: string
  source?: string
  service?: string
  mailbox?: string
  mailboxId?: string
  to?: string
  subject?: string
  latencyMs?: number
  response?: string
  messageId?: string
  status?: string
  action?: string
}

type AuditEntry = {
  timestamp?: string
  action?: string
  result?: string
  durationMs?: number
  error?: string
  actor?: string
  source?: string
  ip?: string
  sourceIp?: string
  params?: any
  before?: any
  after?: any
}

type OperationResult = {
  title: string
  status: "idle" | "running" | "ok" | "error"
  message?: string
  durationMs?: number
  before?: string
  after?: string
  next?: string
}

type ConfirmModalState = {
  title: string
  description: string
  confirmText: string
  actionLabel: string
  onConfirm: () => Promise<void>
} | null

type LogTab = {
  key: ServerControlLogType
  label: string
  color: string
}

const LOG_TABS: LogTab[] = [
  { key: "bridge", label: "Bridge out", color: "emerald" },
  { key: "bridge-error", label: "Bridge errors", color: "rose" },
  { key: "caddy", label: "Caddy out", color: "sky" },
  { key: "caddy-error", label: "Caddy errors", color: "amber" },
  { key: "audit", label: "Audit", color: "slate" }
]

const NAV_ITEMS = [
  ["vue-globale", "Vue globale"],
  ["sante-serveur", "Santé serveur"],
  ["services-windows", "Services Windows"],
  ["caddy-https", "Caddy & HTTPS"],
  ["duckdns-reseau", "DuckDNS & réseau"],
  ["menara-smtp", "Menara SMTP"],
  ["journaux", "Journaux temps réel"],
  ["derniers-envois", "Derniers envois"],
  ["reparation", "Actions de réparation"],
  ["restart-shutdown", "Redémarrage / arrêt sécurisé"],
  ["audit", "Audit"],
  ["technique", "Paramètres techniques"]
] as const

function api<T = any>(path: string, options?: RequestInit): Promise<ApiResult<T>> {
  return fetch(path, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    }
  })
    .then(async (response) => {
      const json = await response.json().catch(() => null)
      return {
        ok: response.ok && json?.ok !== false,
        data: json?.data ?? json,
        error: json?.error || (!response.ok ? `HTTP ${response.status}` : null)
      }
    })
    .catch((error) => ({
      ok: false,
      error: error instanceof Error ? error.message : "Request failed"
    }))
}

function valueOr(value: any, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback
  return value
}

function formatDate(value?: string) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "medium"
  }).format(date)
}

function formatDuration(ms?: number) {
  if (!Number.isFinite(ms as number)) return "—"
  if ((ms || 0) < 1000) return `${Math.round(ms || 0)} ms`
  return `${(Math.round((ms || 0) / 100) / 10).toFixed(1)} s`
}

function badgeClasses(status: string) {
  const normalized = String(status || "").toLowerCase()
  if (["operational", "ok", "healthy", "running", "synced", "valid"].includes(normalized)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800"
  }
  if (["degraded", "warning", "mismatch", "partial", "unknown"].includes(normalized)) {
    return "border-amber-200 bg-amber-50 text-amber-800"
  }
  if (["critical", "failed", "error", "stopped", "down", "offline"].includes(normalized)) {
    return "border-rose-200 bg-rose-50 text-rose-800"
  }
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function badgeLabel(status: any) {
  return String(status || "unknown")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

function statusDot(status: string) {
  const normalized = String(status || "").toLowerCase()
  if (["operational", "ok", "healthy", "running", "synced", "valid"].includes(normalized)) return "bg-emerald-500"
  if (["degraded", "warning", "mismatch", "partial", "unknown"].includes(normalized)) return "bg-amber-500"
  return "bg-rose-500"
}

function cardTone(status: string) {
  const normalized = String(status || "").toLowerCase()
  if (["operational", "ok", "healthy", "running", "synced", "valid"].includes(normalized)) return "from-emerald-50 to-white"
  if (["degraded", "warning", "mismatch", "partial", "unknown"].includes(normalized)) return "from-amber-50 to-white"
  if (["critical", "failed", "error", "stopped", "down", "offline"].includes(normalized)) return "from-rose-50 to-white"
  return "from-slate-50 to-white"
}

function asArray(value: any): any[] {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.lines)) return value.lines
  if (Array.isArray(value?.entries)) return value.entries
  if (Array.isArray(value?.data)) return value.data
  return []
}

function buildLogText(entry: LogEntry) {
  const fragments = [
    entry.timestamp,
    entry.event,
    entry.level,
    entry.message,
    entry.mailbox,
    entry.to,
    entry.subject,
    entry.response,
    entry.raw
  ].filter(Boolean)
  return fragments.map((item) => String(item)).join(" ")
}

function normalizeLogEntry(item: any): LogEntry {
  return {
    timestamp: item?.timestamp || item?.time || item?.created_at || item?.createdAt || item?.at,
    event: item?.event || item?.type || item?.action || item?.eventType,
    level: item?.level || item?.severity || item?.status,
    message: item?.message || item?.summary || item?.result || item?.details || item?.text,
    raw: item?.raw || item?.line || item?.text || "",
    kind: item?.kind || item?.source || item?.logType,
    source: item?.source || item?.origin || item?.service,
    service: item?.service || item?.serviceName,
    mailbox: item?.mailbox || item?.mailboxKey || item?.mailboxLabel,
    mailboxId: item?.mailboxId || item?.mailbox_id,
    to: item?.to || item?.toEmail || item?.recipient,
    subject: item?.subject,
    latencyMs: item?.latencyMs || item?.latency_ms,
    response: item?.response || item?.smtpResponse,
    messageId: item?.messageId || item?.message_id,
    status: item?.status,
    action: item?.action
  }
}

function sanitizeSearch(value: string) {
  return value.trim().toLowerCase()
}

function matchesSearch(entry: LogEntry, search: string) {
  if (!search) return true
  return buildLogText(entry).toLowerCase().includes(search)
}

function extractLastSend(entries: LogEntry[]) {
  return entries.filter((entry) => {
    const token = `${entry.event || ""} ${entry.message || ""} ${entry.raw || ""}`.toUpperCase()
    return token.includes("SEND_")
  })
}

function parseSafeJson(value: any) {
  if (!value) return null
  if (typeof value === "object") return value
  try {
    return JSON.parse(String(value))
  } catch {
    return null
  }
}

function SectionTitle({ id, title, subtitle, action }: { id: string; title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div id={id} className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-950">{title}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{subtitle}</p>
        </div>
        {action}
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  hint,
  tone = "slate",
  icon: Icon
}: {
  label: string
  value: string
  hint?: string
  tone?: string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <div className={`rounded-3xl border border-slate-200 bg-gradient-to-br ${tone} p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</div>
          <div className="mt-3 text-2xl font-black text-slate-950">{value}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-500 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {hint ? <div className="mt-3 text-sm leading-6 text-slate-500">{hint}</div> : null}
    </div>
  )
}

function ActionButton({
  label,
  busy,
  variant = "primary",
  onClick
}: {
  label: string
  busy?: boolean
  variant?: "primary" | "secondary" | "danger"
  onClick: () => void
}) {
  const variantClasses =
    variant === "primary"
      ? "border-slate-950 bg-slate-950 text-white"
      : variant === "danger"
        ? "border-rose-300 bg-rose-600 text-white"
        : "border-slate-200 bg-white text-slate-800"

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses}`}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {label}
    </button>
  )
}

function ConfirmModal({
  modal,
  value,
  setValue,
  onClose
}: {
  modal: ConfirmModalState
  value: string
  setValue: (value: string) => void
  onClose: () => void
}) {
  if (!modal) return null

  const canConfirm = value.trim() === modal.confirmText.trim()

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-rose-700">
              <TriangleAlert className="h-3.5 w-3.5" />
              Action sensible
            </div>
            <h3 className="mt-4 text-2xl font-black text-slate-950">{modal.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{modal.description}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-500">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 rounded-3xl border border-rose-100 bg-rose-50/70 p-4">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-rose-700">Confirmation exacte requise</div>
          <div className="mt-2 font-mono text-sm font-bold text-slate-900">{modal.confirmText}</div>
        </div>
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="mt-4 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none ring-0 focus:border-slate-950"
          placeholder="Saisir le texte de confirmation"
        />
        <div className="mt-5 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700">
            Annuler
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => {
              void modal.onConfirm()
              onClose()
            }}
            className="h-11 rounded-2xl border border-rose-300 bg-rose-600 px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {modal.actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EmailOSServerControlCenter() {
  const [status, setStatus] = useState<ControlStatus | null>(null)
  const [logs, setLogs] = useState<Record<ServerControlLogType, LogEntry[]>>({
    bridge: [],
    "bridge-error": [],
    caddy: [],
    "caddy-error": [],
    audit: []
  })
  const [audit, setAudit] = useState<AuditEntry[]>([])
  const [activeLogTab, setActiveLogTab] = useState<ServerControlLogType>("bridge")
  const [search, setSearch] = useState("")
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string>("")
  const [operation, setOperation] = useState<OperationResult>({
    title: "Dernière opération",
    status: "idle"
  })
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>(null)
  const [confirmValue, setConfirmValue] = useState("")
  const [serviceConfirmation, setServiceConfirmation] = useState("")
  const [testSend, setTestSend] = useState({ toEmail: "", subject: "AngelCare - preuve de livraison Menara", text: "Message de validation généré depuis le centre de contrôle serveur Email Bridge." })
  const [serviceActionState, setServiceActionState] = useState<Record<string, "idle" | "running">>({})
  const [actionBusy, setActionBusy] = useState<Record<string, boolean>>({})
  const logScrollRef = useRef<HTMLDivElement | null>(null)

  async function loadStatus() {
    const response = await api("/api/email-os/server-control/status")
    if (response.ok) {
      setStatus(response.data || null)
      setMessage("")
    } else {
      setMessage(response.error || "Échec du chargement de l’état serveur")
    }
    return response
  }

  async function loadLogs() {
    const nextLogs: Partial<Record<ServerControlLogType, LogEntry[]>> = {}
    for (const tab of LOG_TABS) {
      const response = await api(`/api/email-os/server-control/logs?type=${tab.key}&lines=200`)
      nextLogs[tab.key] = asArray(response.data).map(normalizeLogEntry)
    }
    setLogs((current) => ({ ...current, ...nextLogs }) as Record<ServerControlLogType, LogEntry[]>)
  }

  async function loadAudit() {
    const response = await api("/api/email-os/server-control/audit?lines=200")
    if (response.ok) {
      setAudit(asArray(response.data))
    }
  }

  async function refreshAll() {
    setLoading(true)
    await Promise.all([loadStatus(), loadLogs(), loadAudit()])
    setLoading(false)
  }

  useEffect(() => {
    void refreshAll()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const timer = window.setInterval(() => {
      void loadLogs()
      void loadAudit()
    }, 15000)
    return () => window.clearInterval(timer)
  }, [autoRefresh])

  const classification = String(status?.classification || status?.statusClassification || status?.status || "unknown")
  const publicDomain = status?.network?.publicDomain || status?.publicDomain || status?.technicalSettings?.publicBridgeDomain || "angelcare-mailbridge.duckdns.org"
  const localBridgeStatus = status?.network?.localBridgeHealth?.status || status?.localBridgeHealth?.status || "unknown"
  const publicHealthStatus = status?.network?.publicHealth?.status || status?.publicHealth?.status || "unknown"
  const bridgeServiceStatus = status?.services?.bridge?.status || status?.bridgeService?.status || "unknown"
  const caddyServiceStatus = status?.services?.caddy?.status || status?.caddyService?.status || "unknown"
  const menaraStatus = status?.smtp?.status || status?.smtpStatus || "unknown"
  const duckdnsStatus = status?.duckdns?.status || status?.network?.duckdns?.status || "unknown"
  const recommendation = status?.recommendedAction || status?.nextAction || "Rafraîchir le diagnostic complet."
  const currentLogEntries = useMemo(() => {
    const filtered = logs[activeLogTab].filter((entry) => matchesSearch(entry, sanitizeSearch(search)))
    return filtered
  }, [logs, activeLogTab, search])

  const sendEvents = useMemo(() => {
    const combined = [...logs.bridge, ...logs["bridge-error"]]
    return extractLastSend(combined)
      .concat(
        (audit || []).map((row) => ({
          timestamp: row.timestamp,
          event: row.action,
          level: row.result,
          message: row.error || row.result,
          raw: JSON.stringify(row)
        }))
      )
      .filter((entry) => String(entry.event || entry.message || "").toUpperCase().includes("SEND_"))
      .slice(0, 20)
  }, [logs.bridge, logs["bridge-error"], audit])

  const caddyPreview = cleanString(status?.caddy?.configPreview || status?.caddyConfigPreview || "")
  const technicalSettings = status?.technicalSettings || {}
  const serverTime = status?.process?.currentTime || status?.system?.currentTime || status?.currentLocalTime || status?.time || status?.serverTime
  const hostname = status?.process?.hostname || status?.system?.hostname || status?.hostname || "—"
  const nodeVersion = status?.process?.nodeVersion || status?.system?.nodeVersion || status?.nodeVersion || "—"
  const workingDirectory = status?.process?.workingDirectory || status?.system?.workingDirectory || status?.workingDirectory || "—"
  const lanIp = status?.network?.lanIp || status?.lanIp || "—"
  const publicIp = status?.network?.publicIp || status?.publicIp || "—"
  const duckdnsIp = status?.network?.duckdnsResolvedIp || status?.duckdns?.resolvedIp || "—"
  const portChecks = status?.network?.ports || status?.ports || {}
  const bridgeUptime = status?.process?.uptimeSeconds || status?.bridge?.uptimeSeconds || status?.uptimeSeconds || 0
  const lastSendSuccess = status?.lastSendSuccess || status?.logs?.lastSendSuccess || null
  const lastError = status?.lastError || status?.logs?.lastError || null

  async function runAction(action: string, payload?: any, title?: string) {
    setActionBusy((current) => ({ ...current, [action]: true }))
    const started = Date.now()
    const before = {
      classification,
      bridgeServiceStatus,
      caddyServiceStatus,
      menaraStatus,
      duckdnsStatus,
      publicHealthStatus
    }

    try {
      setOperation({
        title: title || action,
        status: "running",
        message: "Exécution en cours",
        before: `${before.classification} | Bridge ${before.bridgeServiceStatus} | Caddy ${before.caddyServiceStatus}`,
        after: "En attente de retour du bridge",
        next: recommendation
      })
      const response = await api("/api/email-os/server-control/action", {
        method: "POST",
        body: JSON.stringify({ action, payload: payload || {} })
      })
      const durationMs = Date.now() - started
      setOperation({
        title: title || action,
        status: response.ok ? "ok" : "error",
        message: response.ok ? "Action exécutée avec succès" : response.error || "Échec de l'action",
        durationMs,
        before: `${before.classification} | Bridge ${before.bridgeServiceStatus} | Caddy ${before.caddyServiceStatus}`,
        after: response.ok
          ? `${String(response.data?.classification || classification)} | Bridge ${String(response.data?.bridgeService?.status || response.data?.services?.bridge?.status || bridgeServiceStatus)} | Caddy ${String(response.data?.caddyService?.status || response.data?.services?.caddy?.status || caddyServiceStatus)}`
          : "Aucun changement confirmé",
        next: response.ok ? String(response.data?.recommendedAction || recommendation) : "Relancer le diagnostic complet"
      })
      setMessage(response.ok ? "" : response.error || "Action failed")
      await Promise.all([loadStatus(), loadLogs(), loadAudit()])
      return response
    } finally {
      setActionBusy((current) => ({ ...current, [action]: false }))
    }
  }

  async function runServiceAction(service: "angelcare-email-bridge" | "angelcare-caddy", action: "start" | "stop" | "restart") {
    if (action === "stop") {
      setConfirmModal({
        title: service === "angelcare-caddy" ? "Arrêt Caddy" : "Arrêt du bridge",
        description:
          service === "angelcare-caddy"
            ? "L’arrêt de Caddy peut couper immédiatement l’accès HTTPS public et la supervision opérateur distante."
            : "L’arrêt du bridge coupe le relais de production vers Menara jusqu’au redémarrage du service.",
        confirmText: service === "angelcare-caddy" ? "CONFIRM CADDY STOP" : "CONFIRM SERVICE STOP",
        actionLabel: "Confirmer l’arrêt",
        onConfirm: async () => {
          const started = Date.now()
          try {
            setServiceActionState((current) => ({ ...current, [service]: "running" }))
            setOperation({
              title: `${service} stop`,
              status: "running",
              message: "Arrêt en cours",
              before: `${bridgeServiceStatus} / ${caddyServiceStatus}`,
              after: "En attente de confirmation du service",
              next: recommendation
            })
            const response = await api("/api/email-os/server-control/service", {
              method: "POST",
              body: JSON.stringify({ service, action, confirmation: service === "angelcare-caddy" ? "CONFIRM CADDY STOP" : "CONFIRM SERVICE STOP" })
            })
            const durationMs = Date.now() - started
            setOperation({
              title: `${service} stop`,
              status: response.ok ? "ok" : "error",
              message: response.ok ? "Service arrêté" : response.error || "Arrêt échoué",
              durationMs,
              before: `${bridgeServiceStatus} / ${caddyServiceStatus}`,
              after: response.ok
                ? `${String(response.data?.after?.status || response.data?.status || "unknown")}`
                : "Aucun changement confirmé",
              next: response.ok ? String(response.data?.warning || recommendation) : "Relancer le diagnostic complet"
            })
            await Promise.all([loadStatus(), loadLogs(), loadAudit()])
          } finally {
            setServiceActionState((current) => ({ ...current, [service]: "idle" }))
          }
        }
      })
      setConfirmValue("")
      return
    }

    const started = Date.now()
    try {
      setServiceActionState((current) => ({ ...current, [service]: "running" }))
      setOperation({
        title: `${service} ${action}`,
        status: "running",
        message: "Service en cours de mise à jour",
        before: `${bridgeServiceStatus} / ${caddyServiceStatus}`,
        after: "En attente de confirmation du service",
        next: recommendation
      })
      const response = await api("/api/email-os/server-control/service", {
        method: "POST",
        body: JSON.stringify({ service, action, confirmation: "CONFIRM SERVICE ACTION" })
      })
      const durationMs = Date.now() - started
      setOperation({
        title: `${service} ${action}`,
        status: response.ok ? "ok" : "error",
        message: response.ok ? "Service mis à jour" : response.error || "Action échouée",
        durationMs,
        before: `${bridgeServiceStatus} / ${caddyServiceStatus}`,
        after: response.ok ? String(response.data?.after?.status || "unknown") : "Aucun changement confirmé",
        next: response.ok ? String(response.data?.warning || recommendation) : "Relancer le diagnostic complet"
      })
      await Promise.all([loadStatus(), loadLogs(), loadAudit()])
    } finally {
      setServiceActionState((current) => ({ ...current, [service]: "idle" }))
    }
  }

  async function runFullHealthCheck() {
    const started = Date.now()
    const before = classification
    setOperation({
      title: "Vérification complète",
      status: "running",
      message: "Diagnostics en cours",
      before,
      after: "Interrogation du bridge, du réseau et du SMTP",
      next: recommendation
    })
    const statusResponse = await loadStatus()
    const networkResponse = await api("/api/email-os/server-control/action", {
      method: "POST",
      body: JSON.stringify({ action: "network_test", payload: {} })
    })
    const smtpResponse = await api("/api/email-os/server-control/action", {
      method: "POST",
      body: JSON.stringify({ action: "smtp_test", payload: {} })
    })
    const durationMs = Date.now() - started
    setOperation({
      title: "Vérification complète",
      status: statusResponse.ok && networkResponse.ok && smtpResponse.ok ? "ok" : "error",
      message: [statusResponse.error, networkResponse.error, smtpResponse.error].filter(Boolean).join(" · ") || "Diagnostic complet exécuté",
      durationMs,
      before,
      after: String((statusResponse.data as any)?.classification || classification),
      next: String((statusResponse.data as any)?.recommendedAction || recommendation)
    })
    await Promise.all([loadLogs(), loadAudit()])
  }

  async function runSmtpTest() {
    return runAction("smtp_test", {}, "Test SMTP Menara")
  }

  async function runDeliveryProof() {
    const toEmail = cleanString(testSend.toEmail)
    const subject = cleanString(testSend.subject) || "AngelCare - preuve de livraison Menara"
    const text = cleanString(testSend.text)
    if (!toEmail || !text) {
      setMessage("Le destinataire et le texte du message test sont requis.")
      return
    }
    return runAction(
      "send_test",
      {
        toEmail,
        subject,
        text
      },
      "Envoi de preuve"
    )
  }

  async function runNetworkCheck() {
    return runAction("network_test", {}, "Diagnostic réseau")
  }

  async function runCaddyValidation() {
    return runAction("validate_caddy", {}, "Validation Caddy")
  }

  async function runCaddyReload() {
    return runAction("restart_caddy", {}, "Reload / Restart Caddy")
  }

  async function runDuckDnsRefresh() {
    return runAction("refresh_duckdns", {}, "Mise à jour DuckDNS")
  }

  async function runBridgeRestart() {
    return runServiceAction("angelcare-email-bridge", "restart")
  }

  async function runCaddyRestart() {
    return runServiceAction("angelcare-caddy", "restart")
  }

  async function runPublicRouteCheck() {
    return runAction("network_test", {}, "Contrôle de la route publique")
  }

  async function runLocalRouteCheck() {
    return loadStatus()
  }

  const overviewCards = [
    {
      label: "Chemin production",
      value: "Vercel → Caddy → Bridge → Menara",
      hint: "Flux réel de production utilisé par Email-OS",
      tone: "from-slate-50 to-white",
      icon: ArrowRight
    },
    {
      label: "Bridge public HTTPS",
      value: badgeLabel(publicHealthStatus),
      hint: publicDomain,
      tone: cardTone(publicHealthStatus),
      icon: Globe
    },
    {
      label: "Service Email Bridge",
      value: badgeLabel(bridgeServiceStatus),
      hint: `Uptime ${formatDuration(bridgeUptime * 1000)}`,
      tone: cardTone(bridgeServiceStatus),
      icon: Server
    },
    {
      label: "Service Caddy",
      value: badgeLabel(caddyServiceStatus),
      hint: "Reverse proxy HTTPS Windows",
      tone: cardTone(caddyServiceStatus),
      icon: ShieldCheck
    },
    {
      label: "Menara SMTP",
      value: badgeLabel(menaraStatus),
      hint: "smtp-auth.menara.ma:587",
      tone: cardTone(menaraStatus),
      icon: MailCheck
    },
    {
      label: "DuckDNS",
      value: badgeLabel(duckdnsStatus),
      hint: `${duckdnsIp || "—"} vs ${publicIp || "—"}`,
      tone: cardTone(duckdnsStatus),
      icon: Wifi
    },
    {
      label: "Dernier email envoyé",
      value: lastSendSuccess ? formatDate(lastSendSuccess.timestamp || lastSendSuccess.time || lastSendSuccess.created_at) : "Aucun",
      hint: lastSendSuccess?.message || lastSendSuccess?.event || "Aucun envoi confirmé",
      tone: "from-emerald-50 to-white",
      icon: Mail
    },
    {
      label: "Dernière erreur",
      value: lastError ? formatDate(lastError.timestamp || lastError.time || lastError.created_at) : "Aucune",
      hint: lastError?.message || lastError?.event || "Aucune erreur récente",
      tone: cardTone(lastError?.status || lastError?.level || "unknown"),
      icon: AlertTriangle
    },
    {
      label: "Uptime bridge",
      value: formatDuration(bridgeUptime * 1000),
      hint: `Process ${status?.process?.pid || status?.bridge?.pid || "—"}`,
      tone: "from-slate-50 to-white",
      icon: Clock3
    },
    {
      label: "Domaine public",
      value: cleanString(publicDomain),
      hint: "Accès externe de supervision",
      tone: "from-slate-50 to-white",
      icon: Globe
    },
    {
      label: "Cible locale",
      value: "127.0.0.1:3005",
      hint: "Bridge local derrière Caddy",
      tone: "from-slate-50 to-white",
      icon: Network
    },
    {
      label: "Classification",
      value: badgeLabel(classification),
      hint: recommendation,
      tone: cardTone(classification),
      icon: BadgeCheck
    }
  ]

  const serviceRows = [
    {
      id: "angelcare-email-bridge",
      title: "angelcare-email-bridge",
      status: bridgeServiceStatus,
      startupType: status?.services?.bridge?.startupType || status?.bridgeService?.startupType || "—",
      lastAction: status?.services?.bridge?.lastAction || status?.bridgeService?.lastAction || "—",
      hint: "Processus Node du bridge Menara"
    },
    {
      id: "angelcare-caddy",
      title: "angelcare-caddy",
      status: caddyServiceStatus,
      startupType: status?.services?.caddy?.startupType || status?.caddyService?.startupType || "—",
      lastAction: status?.services?.caddy?.lastAction || status?.caddyService?.lastAction || "—",
      hint: "Proxy HTTPS et terminaison TLS"
    }
  ]

  const auditRows = (audit || []).slice(0, 100)
  const filteredVisibleLogs = currentLogEntries.slice(0, 300)
  const visibleLogText = filteredVisibleLogs.map((entry) => `${entry.timestamp || ""} ${entry.event || ""} ${entry.level || ""} ${entry.message || ""} ${entry.raw || ""}`.trim()).join("\n")

  function openStopConfirmation(service: "angelcare-email-bridge" | "angelcare-caddy") {
    setServiceConfirmation("")
    setConfirmModal({
      title: service === "angelcare-caddy" ? "Arrêt Caddy" : "Arrêt du bridge",
      description:
        service === "angelcare-caddy"
          ? "L’arrêt de Caddy peut couper l’accès HTTPS public et la supervision distante."
          : "L’arrêt du bridge coupe le chemin de livraison vers Menara SMTP.",
      confirmText: service === "angelcare-caddy" ? "CONFIRM CADDY STOP" : "CONFIRM SERVICE STOP",
      actionLabel: "Confirmer l’arrêt",
      onConfirm: async () => {
        try {
          setServiceActionState((current) => ({ ...current, [service]: "running" }))
          await api("/api/email-os/server-control/service", {
            method: "POST",
            body: JSON.stringify({
              service,
              action: "stop",
              confirmation: service === "angelcare-caddy" ? "CONFIRM CADDY STOP" : "CONFIRM SERVICE STOP"
            })
          })
          await Promise.all([loadStatus(), loadLogs(), loadAudit()])
        } finally {
          setServiceActionState((current) => ({ ...current, [service]: "idle" }))
        }
      }
    })
  }

  function openSystemModal(kind: "reboot" | "shutdown") {
    const confirmText = kind === "reboot" ? "CONFIRM SERVER RESTART" : "CONFIRM SERVER SHUTDOWN"
    setConfirmValue("")
    setConfirmModal({
      title: kind === "reboot" ? "Redémarrage sécurisé du serveur" : "Arrêt sécurisé du serveur",
      description:
        kind === "reboot"
          ? "Le serveur Windows va recevoir un shutdown contrôlé avec délai de 30 secondes."
          : "Le serveur Windows va recevoir un arrêt contrôlé avec délai de 30 secondes.",
      confirmText,
      actionLabel: kind === "reboot" ? "Confirmer le redémarrage" : "Confirmer l’arrêt",
      onConfirm: async () => {
        await runAction(kind === "reboot" ? "reboot_server" : "shutdown_server", { confirmation: confirmText }, kind === "reboot" ? "Redémarrage sécurisé" : "Arrêt sécurisé")
      }
    })
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc_0%,_#ffffff_45%,_#f8fbff_100%)] text-slate-900">
      <div className="mx-auto max-w-[1680px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
          <div className="bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_48%,#eff6ff_100%)] px-6 py-6 sm:px-8">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 shadow-sm">
                  <SquareTerminal className="h-3.5 w-3.5" />
                  Operations Center
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">Centre de Contrôle Serveur Email Bridge</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                  Supervision et contrôle du relais Windows Menara utilisé par Email-OS.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black ${badgeClasses(classification)}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${statusDot(classification)}`} />
                    {badgeLabel(classification)}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500">
                    <LockKeyhole className="h-4 w-4" />
                    Accès opérateur authentifié, token admin jamais exposé au navigateur
                  </span>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <ActionButton label="Vérification complète" busy={loading} onClick={() => void runFullHealthCheck()} />
                <ActionButton label="Envoyer email test" busy={actionBusy.send_test} onClick={() => void runDeliveryProof()} />
                <ActionButton label="Redémarrer services" busy={serviceActionState["angelcare-email-bridge"] === "running" || serviceActionState["angelcare-caddy"] === "running"} onClick={() => void Promise.all([runBridgeRestart(), runCaddyRestart()])} />
                <ActionButton label="Voir logs" variant="secondary" onClick={() => document.getElementById("journaux")?.scrollIntoView({ behavior: "smooth", block: "start" })} />
                <ActionButton label="Redémarrage sécurisé" variant="danger" onClick={() => openSystemModal("reboot")} />
              </div>
            </div>
          </div>

          <nav className="sticky top-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {NAV_ITEMS.map(([id, label]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-600 transition hover:border-slate-300 hover:bg-white"
                >
                  {label}
                </a>
              ))}
            </div>
          </nav>
        </header>

        <div className="mt-6 rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Chemin production" value="Vercel → Caddy → Bridge → Menara" hint="Flux réel en production" tone="from-slate-50 to-white" icon={ArrowRight} />
            <MetricCard label="Bridge public HTTPS" value={badgeLabel(publicHealthStatus)} hint={publicDomain} tone={cardTone(publicHealthStatus)} icon={Globe} />
            <MetricCard label="Service Email Bridge" value={badgeLabel(bridgeServiceStatus)} hint={`Uptime ${formatDuration(bridgeUptime * 1000)}`} tone={cardTone(bridgeServiceStatus)} icon={Server} />
            <MetricCard label="Service Caddy" value={badgeLabel(caddyServiceStatus)} hint="Proxy HTTPS Windows" tone={cardTone(caddyServiceStatus)} icon={ShieldCheck} />
            <MetricCard label="Menara SMTP" value={badgeLabel(menaraStatus)} hint="smtp-auth.menara.ma:587" tone={cardTone(menaraStatus)} icon={MailCheck} />
            <MetricCard label="DuckDNS" value={badgeLabel(duckdnsStatus)} hint={`${duckdnsIp || "—"} vs ${publicIp || "—"}`} tone={cardTone(duckdnsStatus)} icon={Wifi} />
            <MetricCard label="Dernier email envoyé" value={lastSendSuccess ? formatDate(lastSendSuccess.timestamp || lastSendSuccess.time || lastSendSuccess.created_at) : "Aucun"} hint={lastSendSuccess?.message || "Aucun envoi confirmé"} tone="from-emerald-50 to-white" icon={Mail} />
            <MetricCard label="Dernière erreur" value={lastError ? formatDate(lastError.timestamp || lastError.time || lastError.created_at) : "Aucune"} hint={lastError?.message || "Aucune erreur récente"} tone={cardTone(lastError?.status || lastError?.level || "unknown")} icon={AlertTriangle} />
            <MetricCard label="Uptime bridge" value={formatDuration(bridgeUptime * 1000)} hint={`Process ${status?.process?.pid || status?.bridge?.pid || "—"}`} tone="from-slate-50 to-white" icon={Clock3} />
            <MetricCard label="Domaine public" value={cleanString(publicDomain)} hint="Accès externe de supervision" tone="from-slate-50 to-white" icon={Globe} />
            <MetricCard label="Cible locale" value="127.0.0.1:3005" hint="Bridge local derrière Caddy" tone="from-slate-50 to-white" icon={Network} />
            <MetricCard label="Classification" value={badgeLabel(classification)} hint={recommendation} tone={cardTone(classification)} icon={BadgeCheck} />
          </div>

          <div className="mt-6 rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Vision du chemin de livraison</div>
                <div className="mt-2 text-lg font-black text-slate-950">Vercel → angelcare-mailbridge.duckdns.org → Caddy :443 → 127.0.0.1:3005 → Menara SMTP</div>
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600">
                {badgeLabel(localBridgeStatus)} local, {badgeLabel(publicHealthStatus)} public
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-5">
              {[
                ["Vercel", "App Email-OS", "bg-slate-950 text-white"],
                ["DuckDNS", "angelcare-mailbridge.duckdns.org", "bg-sky-50 text-sky-700"],
                ["Caddy", ":443", "bg-emerald-50 text-emerald-700"],
                ["Bridge", "127.0.0.1:3005", "bg-amber-50 text-amber-800"],
                ["Menara", "smtp-auth.menara.ma:587", "bg-rose-50 text-rose-700"]
              ].map(([label, value, tone]) => (
                <div key={label as string} className={`rounded-3xl border border-slate-200 p-4 ${tone}`}>
                  <div className="text-xs font-black uppercase tracking-[0.18em] opacity-70">{label}</div>
                  <div className="mt-2 text-sm font-black">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <section id="sante-serveur" className="mt-8">
          <SectionTitle
            id="sante-serveur"
            title="Santé serveur"
            subtitle="Vue technique du nœud Windows qui héberge le bridge de production."
            action={<ActionButton label="Recharger" busy={loading} onClick={() => void refreshAll()} />}
          />
          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <MetricCard label="Hostname" value={badgeLabel(hostname)} hint="Nom du serveur Windows" tone="from-slate-50 to-white" icon={Server} />
            <MetricCard label="Node version" value={badgeLabel(nodeVersion)} hint="Runtime du bridge" tone="from-slate-50 to-white" icon={Database} />
            <MetricCard label="Heure locale" value={formatDate(serverTime)} hint="Fuseau serveur" tone="from-slate-50 to-white" icon={Clock3} />
            <MetricCard label="Répertoire de travail" value={badgeLabel(workingDirectory)} hint="Répertoire de service" tone="from-slate-50 to-white" icon={HardDriveDownload} />
            <MetricCard label="LAN IP" value={badgeLabel(lanIp)} hint="Adresse interne détectée" tone="from-slate-50 to-white" icon={Network} />
            <MetricCard label="Public IP" value={badgeLabel(publicIp)} hint="IP sortante actuelle" tone="from-slate-50 to-white" icon={Globe} />
            <MetricCard label="DuckDNS IP" value={badgeLabel(duckdnsIp)} hint="Résolution DNS publique" tone="from-slate-50 to-white" icon={Wifi} />
            <MetricCard label="Port 80" value={badgeLabel(portChecks?.[80] || portChecks?.http || "unknown")} hint="Contrôle local" tone={cardTone(portChecks?.[80] || portChecks?.http || "unknown")} icon={Network} />
            <MetricCard label="Port 443" value={badgeLabel(portChecks?.[443] || portChecks?.https || "unknown")} hint="Contrôle local HTTPS" tone={cardTone(portChecks?.[443] || portChecks?.https || "unknown")} icon={ShieldCheck} />
            <MetricCard label="Port 3005" value={badgeLabel(portChecks?.[3005] || portChecks?.bridge || "unknown")} hint="Bridge local" tone={cardTone(portChecks?.[3005] || portChecks?.bridge || "unknown")} icon={SquareTerminal} />
            <MetricCard label="Bridge local" value={badgeLabel(localBridgeStatus)} hint="http://127.0.0.1:3005/health" tone={cardTone(localBridgeStatus)} icon={Activity} />
            <MetricCard label="Public health" value={badgeLabel(publicHealthStatus)} hint={`https://${cleanString(publicDomain).replace(/^https?:\/\//, "")}/health`} tone={cardTone(publicHealthStatus)} icon={Globe} />
          </div>
        </section>

        <section id="services-windows" className="mt-8">
          <SectionTitle
            id="services-windows"
            title="Services Windows"
            subtitle="Contrôle NSSM / sc des deux services de production."
            action={<ActionButton label="Restart bridge + Caddy" busy={actionBusy.restart_bridge || actionBusy.restart_caddy} onClick={() => void Promise.all([runBridgeRestart(), runCaddyRestart()])} />}
          />
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {serviceRows.map((service) => (
              <div key={service.id} className={`rounded-[30px] border border-slate-200 bg-gradient-to-br ${cardTone(service.status)} p-5 shadow-[0_16px_48px_rgba(15,23,42,0.05)]`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{service.id}</div>
                    <h3 className="mt-2 text-2xl font-black text-slate-950">{service.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{service.hint}</p>
                  </div>
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-black ${badgeClasses(service.status)}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${statusDot(service.status)}`} />
                    {badgeLabel(service.status)}
                  </span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <MetricCard label="Type de démarrage" value={badgeLabel(service.startupType)} hint="Donné par NSSM / sc" tone="from-white to-slate-50" icon={ShieldCheck} />
                  <MetricCard label="Dernière action" value={badgeLabel(service.lastAction)} hint="Action la plus récente" tone="from-white to-slate-50" icon={History} />
                  <MetricCard label="Journal" value="Logs disponibles" hint="Voir le flux correspondant" tone="from-white to-slate-50" icon={SquareTerminal} />
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <ActionButton label="Start" busy={serviceActionState[service.id] === "running"} onClick={() => void runServiceAction(service.id as any, "start")} />
                  <ActionButton label="Stop" variant="danger" busy={serviceActionState[service.id] === "running"} onClick={() => openStopConfirmation(service.id as any)} />
                  <ActionButton label="Restart" variant="secondary" busy={serviceActionState[service.id] === "running"} onClick={() => void runServiceAction(service.id as any, "restart")} />
                  <ActionButton label="View logs" variant="secondary" onClick={() => {
                    setActiveLogTab(service.id === "angelcare-email-bridge" ? "bridge" : "caddy")
                    document.getElementById("journaux")?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="caddy-https" className="mt-8">
          <SectionTitle
            id="caddy-https"
            title="Caddy & HTTPS"
            subtitle="Vérification du proxy TLS, de la config Caddy et de la disponibilité publique."
            action={<ActionButton label="Validate config" busy={actionBusy.validate_caddy} onClick={() => void runCaddyValidation()} />}
          />
          <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Config Caddy</div>
                  <div className="mt-2 text-lg font-black text-slate-950">Caddyfile preview read-only</div>
                </div>
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-black ${badgeClasses(status?.caddy?.configStatus || status?.caddyConfigStatus || "unknown")}`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${statusDot(status?.caddy?.configStatus || status?.caddyConfigStatus || "unknown")}`} />
                  {badgeLabel(status?.caddy?.configStatus || status?.caddyConfigStatus || "unknown")}
                </span>
              </div>
              <pre className="mt-4 max-h-[420px] overflow-auto rounded-[26px] border border-slate-200 bg-slate-950 p-5 font-mono text-xs leading-6 text-slate-100">
                {caddyPreview || "Caddyfile preview indisponible."}
              </pre>
              <div className="mt-4 flex flex-wrap gap-3">
                <ActionButton label="Validate config" busy={actionBusy.validate_caddy} onClick={() => void runCaddyValidation()} />
                <ActionButton label="Reload / Restart Caddy" busy={actionBusy.restart_caddy} onClick={() => void runCaddyReload()} />
              </div>
            </div>
            <div className="rounded-[30px] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">État HTTPS</div>
              <div className="mt-2 text-lg font-black text-slate-950">Statut public et certificat</div>
              <div className="mt-4 space-y-3">
                <div className={`rounded-3xl border p-4 ${badgeClasses(publicHealthStatus)}`}>
                  <div className="text-xs font-black uppercase tracking-[0.18em] opacity-70">Health public</div>
                  <div className="mt-2 text-xl font-black">{badgeLabel(publicHealthStatus)}</div>
                  <div className="mt-1 text-sm font-medium opacity-80">{status?.network?.publicHealth?.message || status?.publicHealth?.message || "Health check public via DuckDNS."}</div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Certificat</div>
                  <div className="mt-2 text-lg font-black text-slate-950">{badgeLabel(status?.caddy?.certificateStatus?.status || status?.certificateStatus?.status || "unknown")}</div>
                  <div className="mt-1 text-sm text-slate-500">{status?.caddy?.certificateStatus?.message || status?.certificateStatus?.message || "Informations certificate indétectables ou non exposées."}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="duckdns-reseau" className="mt-8">
          <SectionTitle
            id="duckdns-reseau"
            title="DuckDNS & réseau"
            subtitle="Alignement IP publique, résolution DNS et chemin réseau attendu."
            action={<ActionButton label="Refresh DuckDNS" busy={actionBusy.refresh_duckdns} onClick={() => void runDuckDnsRefresh()} />}
          />
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
              <div className="grid gap-4 md:grid-cols-2">
                <MetricCard label="Domaine" value={badgeLabel(publicDomain)} hint="angelcare-mailbridge.duckdns.org" tone="from-white to-slate-50" icon={Globe} />
                <MetricCard label="IP résolue" value={badgeLabel(duckdnsIp)} hint="Résolution actuelle DuckDNS" tone="from-white to-slate-50" icon={Wifi} />
                <MetricCard label="IP publique actuelle" value={badgeLabel(publicIp)} hint="Sortie Internet du serveur" tone="from-white to-slate-50" icon={Network} />
                <MetricCard label="Statut de synchronisation" value={badgeLabel(duckdnsStatus)} hint="Match / mismatch" tone={cardTone(duckdnsStatus)} icon={BadgeCheck} />
              </div>
              <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Fowarding attendu sur routeur</div>
                <div className="mt-3 space-y-2 font-mono text-sm font-bold text-slate-800">
                  <div>80 → 192.168.1.84:80</div>
                  <div>443 → 192.168.1.84:443</div>
                </div>
              </div>
            </div>
            <div className="rounded-[30px] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Diagnostic réseau</div>
              <div className="mt-2 text-lg font-black text-slate-950">Contrôle de résolution et de connectivité</div>
              <div className="mt-4 flex flex-wrap gap-3">
                <ActionButton label="Run network diagnostic" busy={actionBusy.network_test} onClick={() => void runNetworkCheck()} />
                <ActionButton label="Check public route" variant="secondary" onClick={() => void runPublicRouteCheck()} />
                <ActionButton label="Check local route" variant="secondary" onClick={() => void runLocalRouteCheck()} />
              </div>
              <div className="mt-5 space-y-3">
                {status?.network?.diagnosticTree?.map?.((step: any, index: number) => (
                  <div key={`${step.step || "step"}-${index}`} className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm font-black text-slate-950">{step.step || step.label || `Étape ${index + 1}`}</div>
                      <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${badgeClasses(step.status || step.result || "unknown")}`}>
                        {badgeLabel(step.status || step.result || "unknown")}
                      </span>
                    </div>
                    <div className="mt-1 text-sm leading-6 text-slate-500">{step.message || step.detail || step.summary || ""}</div>
                  </div>
                )) || (
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                    Lancez un diagnostic pour afficher l’arbre détaillé.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="menara-smtp" className="mt-8">
          <SectionTitle
            id="menara-smtp"
            title="Menara SMTP"
            subtitle="Contrôle de l’authentification SMTP et des derniers envois de production."
            action={<ActionButton label="Run SMTP test" busy={actionBusy.smtp_test} onClick={() => void runSmtpTest()} />}
          />
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
              <div className="grid gap-4 md:grid-cols-2">
                <MetricCard label="Host" value={badgeLabel(status?.smtp?.host || "smtp-auth.menara.ma")} hint="Transport SMTP" tone="from-white to-slate-50" icon={Mail} />
                <MetricCard label="Port" value={badgeLabel(status?.smtp?.port || "587")} hint="Submission TLS STARTTLS" tone="from-white to-slate-50" icon={Database} />
                <MetricCard label="Auth" value={badgeLabel(status?.smtp?.authStatus || status?.smtp?.status || menaraStatus)} hint="Connexion et authentification" tone={cardTone(status?.smtp?.authStatus || status?.smtp?.status || menaraStatus)} icon={ShieldCheck} />
                <MetricCard label="Dernier test SMTP" value={status?.smtp?.lastTest ? badgeLabel(status?.smtp?.lastTest.status || status?.smtp?.lastTest.result || "unknown") : "Aucun"} hint={status?.smtp?.lastTest ? formatDate(status?.smtp?.lastTest.timestamp || status?.smtp?.lastTest.time) : "Aucun test récent"} tone={cardTone(status?.smtp?.lastTest?.status || status?.smtp?.lastTest?.result || "unknown")} icon={Bolt} />
              </div>
            </div>
            <div className="rounded-[30px] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Preuve de livraison</div>
              <div className="mt-2 text-lg font-black text-slate-950">Envoyer un email test réel via Menara</div>
              <div className="mt-4 grid gap-3">
                <label className="text-sm font-bold text-slate-700">
                  Destinataire
                  <input
                    value={testSend.toEmail}
                    onChange={(event) => setTestSend((current) => ({ ...current, toEmail: event.target.value }))}
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-slate-950"
                    placeholder="destinataire@exemple.com"
                  />
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Sujet
                  <input
                    value={testSend.subject}
                    onChange={(event) => setTestSend((current) => ({ ...current, subject: event.target.value }))}
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-slate-950"
                  />
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Texte
                  <textarea
                    value={testSend.text}
                    onChange={(event) => setTestSend((current) => ({ ...current, text: event.target.value }))}
                    className="mt-2 min-h-32 w-full rounded-2xl border border-slate-200 p-4 text-sm font-semibold leading-6 outline-none focus:border-slate-950"
                  />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <ActionButton label="Send test email" busy={actionBusy.send_test} onClick={() => void runDeliveryProof()} />
                <ActionButton label="Voir logs d’envoi" variant="secondary" onClick={() => {
                  setActiveLogTab("bridge")
                  document.getElementById("journaux")?.scrollIntoView({ behavior: "smooth", block: "start" })
                }} />
              </div>
            </div>
          </div>
        </section>

        <section id="journaux" className="mt-8">
          <SectionTitle
            id="journaux"
            title="Journaux temps réel"
            subtitle="Lecture bornée des sorties bridge, Caddy et audit. Les lignes SEND_OK et SEND_ERROR sont mises en évidence."
            action={
              <div className="flex flex-wrap items-center gap-3">
                <ActionButton label="Refresh logs" busy={loading} onClick={() => void loadLogs()} />
                <button
                  type="button"
                  onClick={() => setAutoRefresh((current) => !current)}
                  className={`inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-black shadow-sm transition ${
                    autoRefresh ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} />
                  Auto-refresh {autoRefresh ? "ON" : "OFF"}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(visibleLogText)
                    setMessage("Journaux visibles copiés dans le presse-papiers.")
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm"
                >
                  <ClipboardCopy className="h-4 w-4" />
                  Copier
                </button>
              </div>
            }
          />
          <div className="mt-4 rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {LOG_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveLogTab(tab.key)}
                    className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${
                      activeLogTab === tab.key ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="h-11 w-[280px] rounded-2xl border border-slate-200 pl-9 pr-4 text-sm font-semibold outline-none focus:border-slate-950"
                    placeholder="Filtrer les journaux"
                  />
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  {filteredVisibleLogs.length} lignes
                </span>
              </div>
            </div>

            <div ref={logScrollRef} className="mt-4 max-h-[520px] overflow-auto rounded-[24px] border border-slate-200 bg-slate-950 p-4 font-mono text-[12px] leading-6 text-slate-100">
              {filteredVisibleLogs.length === 0 ? (
                <div className="text-slate-400">Aucune ligne ne correspond au filtre actif.</div>
              ) : (
                filteredVisibleLogs.map((entry, index) => {
                  const token = `${entry.event || ""} ${entry.message || ""} ${entry.raw || ""}`.toUpperCase()
                  const tone =
                    token.includes("SEND_ERROR") || String(entry.level || "").toLowerCase().includes("error")
                      ? "border-rose-300 bg-rose-500/10 text-rose-100"
                      : token.includes("SEND_OK")
                        ? "border-emerald-300 bg-emerald-500/10 text-emerald-100"
                        : token.includes("SEND_ATTEMPT")
                          ? "border-amber-300 bg-amber-500/10 text-amber-100"
                          : "border-slate-700 bg-white/5 text-slate-100"
                  return (
                    <div key={`${entry.timestamp || "row"}-${index}`} className={`mb-2 rounded-2xl border px-3 py-2 ${tone}`}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-current/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em]">
                            {entry.event || entry.level || "LOG"}
                          </span>
                          <span className="text-[11px] font-bold text-white/75">{formatDate(entry.timestamp)}</span>
                        </div>
                        <div className="text-[11px] font-bold text-white/70">{entry.source || entry.service || entry.kind || ""}</div>
                      </div>
                      <div className="mt-2 whitespace-pre-wrap break-words text-[12px] text-white/90">
                        {entry.message || entry.raw || "—"}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </section>

        <section id="derniers-envois" className="mt-8">
          <SectionTitle id="derniers-envois" title="Derniers envois" subtitle="Extraction des événements SEND_* les plus récents à partir des logs du bridge." />
          <div className="mt-4 rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
            <div className="grid gap-3">
              {sendEvents.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-500">
                  Aucun événement SEND_* récent détecté.
                </div>
              ) : (
                sendEvents.slice(0, 10).map((entry, index) => (
                  <div key={`${entry.timestamp || "send"}-${index}`} className="grid gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-6">
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Timestamp</div>
                      <div className="mt-1 text-sm font-bold text-slate-900">{formatDate(entry.timestamp)}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Mailbox</div>
                      <div className="mt-1 text-sm font-bold text-slate-900">{valueOr(entry.mailbox || entry.source || entry.kind)}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Destinataire</div>
                      <div className="mt-1 text-sm font-bold text-slate-900">{valueOr(entry.to)}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Sujet</div>
                      <div className="mt-1 text-sm font-bold text-slate-900">{valueOr(entry.subject)}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Statut</div>
                      <div className="mt-1 text-sm font-bold text-slate-900">{badgeLabel(entry.event || entry.level || entry.status || "SEND")}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Message / réponse</div>
                      <div className="mt-1 text-sm font-bold text-slate-900">{valueOr(entry.response || entry.message || entry.raw)}</div>
                    </div>
                    <div className="md:col-span-6 grid gap-2 md:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-600">MessageId: <span className="font-bold text-slate-900">{valueOr(entry.messageId)}</span></div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-600">Latence: <span className="font-bold text-slate-900">{formatDuration(entry.latencyMs)}</span></div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-600">Source: <span className="font-bold text-slate-900">{valueOr(entry.source || entry.service)}</span></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section id="reparation" className="mt-8">
          <SectionTitle id="reparation" title="Actions de réparation" subtitle="Boutons opérateur pour réduire le temps moyen de restauration des services." />
          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <ActionButton label="Full health check" busy={loading} onClick={() => void runFullHealthCheck()} />
            <ActionButton label="Restart email bridge" busy={serviceActionState["angelcare-email-bridge"] === "running"} onClick={() => void runBridgeRestart()} />
            <ActionButton label="Restart Caddy" busy={serviceActionState["angelcare-caddy"] === "running"} onClick={() => void runCaddyRestart()} />
            <ActionButton label="Validate Caddy config" busy={actionBusy.validate_caddy} onClick={() => void runCaddyValidation()} />
            <ActionButton label="Refresh DuckDNS" busy={actionBusy.refresh_duckdns} onClick={() => void runDuckDnsRefresh()} />
            <ActionButton label="Run Menara SMTP test" busy={actionBusy.smtp_test} onClick={() => void runSmtpTest()} />
            <ActionButton label="Send delivery proof email" busy={actionBusy.send_test} onClick={() => void runDeliveryProof()} />
            <ActionButton label="Check public route" variant="secondary" onClick={() => void runPublicRouteCheck()} />
            <ActionButton label="Check local route" variant="secondary" onClick={() => void runLocalRouteCheck()} />
          </div>
          <div className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
            <div className="grid gap-4 xl:grid-cols-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Running state</div>
                <div className="mt-2 text-lg font-black text-slate-950">{operation.status === "running" ? "Exécution" : operation.status === "ok" ? "Succès" : operation.status === "error" ? "Erreur" : "Idle"}</div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Résultat</div>
                <div className="mt-2 text-lg font-black text-slate-950">{operation.message || "Aucune opération récente."}</div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Durée</div>
                <div className="mt-2 text-lg font-black text-slate-950">{formatDuration(operation.durationMs)}</div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Prochaine action</div>
                <div className="mt-2 text-lg font-black text-slate-950">{operation.next || recommendation}</div>
              </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Before</div>
                <div className="mt-2 text-sm font-semibold text-slate-700">{operation.before || "—"}</div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">After</div>
                <div className="mt-2 text-sm font-semibold text-slate-700">{operation.after || "—"}</div>
              </div>
            </div>
          </div>
        </section>

        <section id="restart-shutdown" className="mt-8">
          <SectionTitle
            id="restart-shutdown"
            title="Redémarrage / arrêt sécurisé"
            subtitle="Zone à haut risque avec confirmation saisie manuellement avant exécution."
            action={<ActionButton label="Cancel scheduled shutdown" variant="secondary" onClick={() => void runAction("cancel_shutdown", {}, "Annulation arrêt planifié")} />}
          />
          <div className="mt-4 rounded-[30px] border border-rose-200 bg-rose-50 p-5 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
            <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-rose-700">Danger zone</div>
                <div className="mt-2 text-2xl font-black text-slate-950">Pendant l’arrêt, Email-OS ne pourra plus envoyer via Menara.</div>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
                  Utilisez ces commandes uniquement si le redémarrage ou l’arrêt du serveur Windows est planifié et coordonné.
                  Le bridge reste audité avant et après l’action.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <ActionButton label="Restart Windows server" variant="danger" onClick={() => openSystemModal("reboot")} />
                  <ActionButton label="Shutdown Windows server" variant="danger" onClick={() => openSystemModal("shutdown")} />
                </div>
              </div>
              <div className="rounded-[28px] border border-rose-200 bg-white p-4">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-rose-700">Rappel</div>
                <div className="mt-2 text-sm leading-6 text-slate-700">
                  La confirmation typed est obligatoire:
                  <div className="mt-3 space-y-2 font-mono text-sm font-bold">
                    <div>CONFIRM SERVER RESTART</div>
                    <div>CONFIRM SERVER SHUTDOWN</div>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-600">
                  L’arrêt de Caddy peut couper l’accès externe de supervision. L’arrêt du bridge interrompt l’acheminement Menara.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="audit" className="mt-8">
          <SectionTitle id="audit" title="Audit" subtitle="Historique des actions opérateur, résultats, durées et contexte d’exécution." />
          <div className="mt-4 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-4 py-4">Timestamp</th>
                    <th className="px-4 py-4">Actor</th>
                    <th className="px-4 py-4">Action</th>
                    <th className="px-4 py-4">Result</th>
                    <th className="px-4 py-4">Duration</th>
                    <th className="px-4 py-4">Error</th>
                    <th className="px-4 py-4">Source IP</th>
                    <th className="px-4 py-4">Before / After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                        Aucun audit disponible.
                      </td>
                    </tr>
                  ) : (
                    auditRows.map((row, index) => (
                      <tr key={`${row.timestamp || "audit"}-${index}`} className="align-top">
                        <td className="px-4 py-4 text-slate-600">{formatDate(row.timestamp)}</td>
                        <td className="px-4 py-4 font-semibold text-slate-900">{valueOr(row.actor || row.source || "system")}</td>
                        <td className="px-4 py-4 font-semibold text-slate-900">{valueOr(row.action)}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${badgeClasses(row.result || "unknown")}`}>{badgeLabel(row.result || "unknown")}</span>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{formatDuration(row.durationMs)}</td>
                        <td className="px-4 py-4 text-slate-600">{valueOr(row.error)}</td>
                        <td className="px-4 py-4 text-slate-600">{valueOr(row.ip || row.sourceIp)}</td>
                        <td className="px-4 py-4 text-slate-600">
                          <div className="max-w-xl space-y-2">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-700">{JSON.stringify(parseSafeJson(row.before) || row.before || "", null, 2)}</div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-700">{JSON.stringify(parseSafeJson(row.after) || row.after || "", null, 2)}</div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="technique" className="mt-8 pb-10">
          <SectionTitle id="technique" title="Paramètres techniques" subtitle="Valeurs en lecture seule et masquées. Aucun secret brut n’est affiché." />
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {[
              ["EMAIL_OS_BRIDGE_URL", technicalSettings.emailOsBridgeUrl || "—"],
              ["EMAIL_OS_FORCE_BRIDGE", technicalSettings.emailOsForceBridge || "—"],
              ["EMAIL_OS_BRIDGE_TOKEN", technicalSettings.emailOsBridgeToken || "—"],
              ["EMAIL_BRIDGE_ADMIN_TOKEN", technicalSettings.emailBridgeAdminToken || "—"],
              ["Public bridge domain", technicalSettings.publicBridgeDomain || "—"],
              ["Service names", `${technicalSettings.serviceNames?.bridge || "angelcare-email-bridge"} / ${technicalSettings.serviceNames?.caddy || "angelcare-caddy"}`],
              ["Log paths", `${technicalSettings.logPaths?.bridgeOut || ""}\n${technicalSettings.logPaths?.bridgeError || ""}\n${technicalSettings.logPaths?.caddyOut || ""}\n${technicalSettings.logPaths?.caddyError || ""}\n${technicalSettings.logPaths?.audit || ""}`],
              ["Caddyfile path", technicalSettings.caddyfilePath || "—"],
              ["DuckDNS domain", technicalSettings.duckdnsDomain || "—"],
              ["Menara host/port/user", `${technicalSettings.menara?.host || "—"}:${technicalSettings.menara?.port || "—"} / ${technicalSettings.menara?.user || "—"}`]
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label as string}</div>
                <pre className="mt-3 whitespace-pre-wrap break-words rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-6 text-slate-800">
                  {String(value)}
                </pre>
              </div>
            ))}
          </div>
        </section>

        {message ? (
          <div className="fixed bottom-5 right-5 z-[1500] max-w-md rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-2xl">
            {message}
          </div>
        ) : null}
      </div>

      <ConfirmModal modal={confirmModal} value={confirmValue} setValue={setConfirmValue} onClose={() => setConfirmModal(null)} />
    </main>
  )
}
