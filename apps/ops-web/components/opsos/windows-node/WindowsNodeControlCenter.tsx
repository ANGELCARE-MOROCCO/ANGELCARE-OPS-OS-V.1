"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  Activity,
  ArrowRight,
  Ban,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Copy,
  HardDrive,
  HardDriveDownload,
  Info,
  Loader2,
  Lock,
  Mail,
  MailCheck,
  Monitor,
  RefreshCw,
  Server,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  TriangleAlert,
  Upload,
  Wifi,
  X,
} from "lucide-react"
import SenderIdentityControlCenter from "@/components/opsos/windows-node/SenderIdentityControlCenter"
import StorageDataControlCenter from "@/components/opsos/windows-node/StorageDataControlCenter"
import type {
  MaintenanceModeState,
  WindowsAuditEvent,
  WindowsBackupStatus,
  WindowsNodeLogType,
  WindowsNodeStatus,
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

type Feedback = {
  tone: "success" | "error" | "info"
  title: string
  detail?: string
} | null

type ViewMode = "executive" | "operational" | "technical"
type LogSeverity = "all" | "error" | "warning" | "info"
type Tone = "healthy" | "degraded" | "critical"

type ModalState =
  | {
      kind: "service"
      title: string
      action: "start" | "stop" | "restart"
      serviceName: "angelcare-email-bridge" | "angelcare-caddy" | "both"
      reason: string
      confirmation: string
    }
  | { kind: "backup"; title: string; reason: string; confirmation: boolean }
  | {
      kind: "proof"
      title: string
      toEmail: string
      subject: string
      text: string
      reason: string
      confirmation: boolean
    }
  | {
      kind: "maintenance"
      title: string
      mode: "enable" | "disable" | "extend"
      reason: string
      duration: string
      message: string
      confirmation: boolean
    }
  | {
      kind: "system"
      title: string
      mode: "restart" | "shutdown" | "cancel"
      reason: string
      confirmation: string
    }
  | null

const SECTION_TABS = [
  { id: "overview", label: "Vue générale" },
  { id: "services", label: "Services" },
  { id: "diagnostics", label: "Diagnostics" },
  { id: "network", label: "Réseau & DNS" },
  { id: "smtp", label: "SMTP & preuve" },
  { id: "sender-identities", label: "Identités d’expéditeur" },
  { id: "performance", label: "Performances" },
  { id: "storage", label: "Stockage & données" },
  { id: "backups", label: "Sauvegardes" },
  { id: "maintenance", label: "Maintenance" },
  { id: "security", label: "Sécurité" },
  { id: "logs", label: "Journaux" },
  { id: "audit", label: "Audit" },
  { id: "continuity", label: "Continuité & reprise" },
] as const

type SectionId = (typeof SECTION_TABS)[number]["id"]

const SECTION_DESCRIPTIONS: Record<SectionId, string> = {
  overview: "Architecture active, impact métier et décision immédiate.",
  services: "Pilotage gouverné des services Windows de production.",
  diagnostics: "Diagnostic guidé de bout en bout avec preuves d’exécution.",
  network: "Connectivité publique, DNS, DuckDNS, Caddy et certificat TLS.",
  smtp: "Authentification Menara et validation par email de preuve.",
  "sender-identities": "Noms commerciaux externes, preuves Gmail, activation, versions et rollback.",
  performance: "Capacité, disponibilité et seuils opérationnels du nœud.",
  storage: "Inventaire, classification et intelligence de stockage en lecture seule.",
  backups: "Protection, historique et préparation à la restauration.",
  maintenance: "Fenêtres d’intervention et opérations critiques sécurisées.",
  security: "Posture de sécurité, blocages et événements sensibles.",
  logs: "Journaux filtrés, recherche et preuves techniques en direct.",
  audit: "Traçabilité des actions, acteurs, motifs et résultats.",
  continuity: "Runbooks, migration et ordre de reprise après incident.",
}

const LOG_TABS: { id: WindowsNodeLogType; label: string }[] = [
  { id: "bridge", label: "Email Bridge" },
  { id: "bridge-error", label: "Erreurs Bridge" },
  { id: "caddy", label: "Caddy" },
  { id: "caddy-error", label: "Erreurs Caddy" },
  { id: "duckdns", label: "DuckDNS" },
  { id: "audit", label: "Audit" },
  { id: "service", label: "Actions services" },
]

const SERVICE_META = {
  "angelcare-email-bridge": {
    title: "Email Bridge",
    technicalName: "angelcare-email-bridge",
    role: "Relais sécurisé Email OS vers Menara SMTP",
    port: "3005",
    endpoint: "http://127.0.0.1:3005/health",
    logType: "bridge" as WindowsNodeLogType,
    icon: MailCheck,
  },
  "angelcare-caddy": {
    title: "Caddy HTTPS Gateway",
    technicalName: "angelcare-caddy",
    role: "Point d’entrée public, reverse proxy et gestion TLS",
    port: "443",
    endpoint: "https://angelcare-mailbridge.duckdns.org",
    logType: "caddy" as WindowsNodeLogType,
    icon: ShieldCheck,
  },
} as const

const RUNBOOKS = [
  {
    title: "Email Bridge indisponible",
    layer: "Relais de messagerie",
    body: "Vérifier le service Windows, relancer angelcare-email-bridge, confirmer le endpoint local /health puis exécuter un email de preuve.",
  },
  {
    title: "Caddy ou HTTPS public indisponible",
    layer: "Passerelle publique",
    body: "Valider la configuration Caddy, redémarrer le service, vérifier le certificat TLS puis contrôler le endpoint public.",
  },
  {
    title: "DuckDNS désynchronisé",
    layer: "DNS public",
    body: "Comparer l’adresse IP publique au domaine DuckDNS, mettre à jour le mapping puis confirmer la résolution et le routage 443.",
  },
  {
    title: "Authentification SMTP en échec",
    layer: "Livraison Menara",
    body: "Exécuter le test SMTP, contrôler la résolution DNS et le port 587, puis examiner les journaux d’authentification sans exposer les identifiants.",
  },
  {
    title: "Nœud Windows hors ligne",
    layer: "Hôte de production",
    body: "Vérifier alimentation, connectivité, démarrage automatique des services et accessibilité publique avant toute reprise du trafic.",
  },
  {
    title: "Restauration depuis sauvegarde",
    layer: "Reprise",
    body: "Sélectionner la dernière sauvegarde vérifiée, restaurer Bridge et Caddy, redémarrer les services, valider la santé puis envoyer une preuve.",
  },
  {
    title: "Rotation des jetons",
    layer: "Sécurité",
    body: "Mettre à jour les secrets côté Windows et déploiement SaaS, redémarrer le Bridge, redéployer, tester la santé et consigner l’opération.",
  },
  {
    title: "Migration vers une nouvelle machine",
    layer: "Plan de bascule",
    body: "Provisionner Windows, restaurer les répertoires, recréer les services NSSM, reconfigurer Caddy et DuckDNS, puis réaliser la validation de bout en bout.",
  },
] as const

const MIGRATION_CHECKLIST = [
  "Provisionner la machine Windows",
  "Installer Node.js, Git, NSSM et Caddy",
  "Créer l’arborescence C:\\AngelCare",
  "Restaurer le dossier Email Bridge",
  "Restaurer les variables d’environnement",
  "Restaurer le Caddyfile",
  "Recréer les services NSSM",
  "Restaurer la mise à jour DuckDNS",
  "Configurer pare-feu, routeur et NAT",
  "Démarrer les services",
  "Valider la santé locale",
  "Valider la santé publique",
  "Exécuter le test SMTP",
  "Envoyer un email de preuve",
  "Déclarer la bascule terminée",
] as const

function api<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  return fetch(path, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  })
    .then(async (response) => {
      const json = await response.json().catch(() => null)
      return {
        ok: Boolean(response.ok && json?.ok !== false),
        data: json?.data ?? json,
        error:
          json?.error ||
          json?.errorMessage ||
          (!response.ok ? `HTTP ${response.status}` : undefined),
        errorName: json?.errorName,
        errorMessage: json?.errorMessage,
        recommendedAction: json?.recommendedAction,
        cause: json?.cause,
      }
    })
    .catch((error) => ({
      ok: false,
      error: error instanceof Error ? error.message : "Échec de la requête",
    }))
}

function statusTone(status?: unknown): Tone {
  const normalized = String(status || "unknown").toLowerCase()
  if (
    [
      "healthy",
      "running",
      "ok",
      "synced",
      "valid",
      "operational",
      "success",
      "accepted",
      "ready",
      "true",
      "enabled",
      "present",
      "match",
    ].includes(normalized)
  ) {
    return "healthy"
  }
  if (
    [
      "degraded",
      "warning",
      "partial",
      "unknown",
      "pending",
      "maintenance",
      "disabled",
      "not-tested",
      "not_tested",
    ].includes(normalized)
  ) {
    return "degraded"
  }
  return "critical"
}

function toneClasses(status?: unknown) {
  const tone = statusTone(status)
  if (tone === "healthy") return "border-emerald-200 bg-emerald-50 text-emerald-800"
  if (tone === "degraded") return "border-amber-200 bg-amber-50 text-amber-800"
  return "border-rose-200 bg-rose-50 text-rose-800"
}

function toneSurface(status?: unknown) {
  const tone = statusTone(status)
  if (tone === "healthy") {
    return "border-emerald-200 bg-[linear-gradient(145deg,#ecfdf5_0%,#ffffff_78%)]"
  }
  if (tone === "degraded") {
    return "border-amber-200 bg-[linear-gradient(145deg,#fffbeb_0%,#ffffff_78%)]"
  }
  return "border-rose-200 bg-[linear-gradient(145deg,#fff1f2_0%,#ffffff_78%)]"
}

function dotClasses(status?: unknown) {
  const tone = statusTone(status)
  if (tone === "healthy") return "bg-emerald-500"
  if (tone === "degraded") return "bg-amber-500"
  return "bg-rose-500"
}

function statusLabel(status?: unknown) {
  const normalized = String(status || "unknown").toLowerCase()
  const labels: Record<string, string> = {
    operational: "Opérationnel",
    healthy: "Sain",
    running: "En ligne",
    ok: "Validé",
    synced: "Synchronisé",
    valid: "Valide",
    success: "Réussi",
    accepted: "Accepté",
    ready: "Prêt",
    enabled: "Actif",
    disabled: "Inactif",
    degraded: "Dégradé",
    warning: "Attention",
    partial: "Partiel",
    maintenance: "Maintenance",
    critical: "Critique",
    failed: "Échec",
    stopped: "Arrêté",
    offline: "Hors ligne",
    missing: "Manquant",
    mismatch: "Désynchronisé",
    unknown: "Non vérifié",
    true: "Oui",
    false: "Non",
    present: "Présent",
    match: "Conforme",
  }
  return labels[normalized] || String(status || "Non vérifié")
}

function formatDateTime(value?: string) {
  if (!value) return "Non disponible"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date)
}

function formatRelative(value?: string) {
  if (!value) return "Aucune donnée"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const deltaSeconds = Math.round((date.getTime() - Date.now()) / 1000)
  const formatter = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" })
  const absolute = Math.abs(deltaSeconds)
  if (absolute < 60) return formatter.format(deltaSeconds, "second")
  if (absolute < 3600) return formatter.format(Math.round(deltaSeconds / 60), "minute")
  if (absolute < 86400) return formatter.format(Math.round(deltaSeconds / 3600), "hour")
  return formatter.format(Math.round(deltaSeconds / 86400), "day")
}

function formatBytes(value?: number) {
  const bytes = Number(value || 0)
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 o"
  const units = ["o", "Ko", "Mo", "Go", "To"]
  let current = bytes
  let index = 0
  while (current >= 1024 && index < units.length - 1) {
    current /= 1024
    index += 1
  }
  return `${current.toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function formatUptime(seconds?: number) {
  const value = Math.max(0, Number(seconds || 0))
  if (!value) return "Non disponible"
  const days = Math.floor(value / 86400)
  const hours = Math.floor((value % 86400) / 3600)
  const minutes = Math.floor((value % 3600) / 60)
  if (days > 0) return `${days} j ${hours} h`
  if (hours > 0) return `${hours} h ${minutes} min`
  return `${minutes} min`
}

function shortValue(value?: unknown, fallback = "Non disponible") {
  if (value === null || value === undefined || value === "") return fallback
  return String(value)
}

function recordField(record: Record<string, unknown> | null | undefined, ...keys: string[]) {
  if (!record) return undefined
  for (const key of keys) {
    const value = record[key]
    if (value !== null && value !== undefined && value !== "") return value
  }
  return undefined
}

function sanitizeLogText(text: string) {
  return text
    .replace(/([A-Fa-f0-9]{24,})/g, "***REDACTED***")
    .replace(/(eyJ[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+){1,2})/g, "***REDACTED***")
    .replace(/\b([A-Za-z0-9_\-]{32,})\b/g, "***REDACTED***")
    .replace(/([?&](?:token|secret|password|pass|key)=)[^&\s]+/gi, "$1***REDACTED***")
}

function logEntryText(entry: Record<string, unknown>) {
  return sanitizeLogText(
    [
      entry.timestamp,
      entry.event,
      entry.level,
      entry.message,
      entry.action,
      entry.target,
      entry.subject,
      entry.response,
      entry.raw,
    ]
      .filter(Boolean)
      .map(String)
      .join(" "),
  )
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

function StatusBadge({ status, label }: { status?: unknown; label?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] ${toneClasses(status)}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotClasses(status)}`} />
      {label || statusLabel(status)}
    </span>
  )
}

function SectionShell({
  id,
  eyebrow,
  title,
  description,
  subtitle,
  actions,
  action,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  description?: string
  subtitle?: string
  actions?: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  const supportingText = subtitle || description
  const commandArea = action || actions
  return (
    <section
      id={id}
      className="scroll-mt-32 overflow-hidden rounded-[30px] border border-slate-200/90 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.055)]"
    >
      <div className="flex flex-col gap-4 border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] px-5 py-5 sm:px-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-sky-700">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.045em] text-slate-950 sm:text-[28px]">
            {title}
          </h2>
          {supportingText ? (
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">{supportingText}</p>
          ) : null}
        </div>
        {commandArea ? <div className="flex flex-wrap items-center gap-2">{commandArea}</div> : null}
      </div>
      <div className="p-5 sm:p-7">{children}</div>
    </section>
  )
}

function HealthStripItem({
  label,
  value,
  status,
  detail,
  onClick,
}: {
  label: string
  value: string
  status?: unknown
  detail: string
  onClick?: () => void
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
        <span className={`h-2 w-2 rounded-full ${dotClasses(status)}`} />
      </div>
      <p className="mt-2 truncate text-sm font-black text-slate-950">{value}</p>
      <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">{detail}</p>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="min-w-[174px] flex-1 rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
      >
        {content}
      </button>
    )
  }

  return (
    <div className="min-w-[174px] flex-1 rounded-[18px] border border-slate-200 bg-white px-4 py-3">
      {content}
    </div>
  )
}

function TopologyNode({
  number,
  icon,
  title,
  subtitle,
  status,
  detail,
  latency,
}: {
  number: string
  icon: ReactNode
  title: string
  subtitle: string
  status?: unknown
  detail: string
  latency?: number
}) {
  return (
    <div className={`relative min-w-0 rounded-[22px] border p-4 ${toneSurface(status)}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/90 bg-white text-slate-800 shadow-sm">
            {icon}
          </span>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Étape {number}</p>
            <h3 className="mt-1 text-sm font-black text-slate-950">{title}</h3>
          </div>
        </div>
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${dotClasses(status)}`} />
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-600">{subtitle}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="min-w-0 truncate text-[11px] text-slate-500">{detail}</p>
        {typeof latency === "number" ? (
          <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-black text-slate-600">
            {latency} ms
          </span>
        ) : null}
      </div>
    </div>
  )
}

function DataPair({ label, value, mono = false }: { label: string; value?: unknown; mono?: boolean }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-b-0">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <span
        className={`max-w-[65%] break-words text-right text-xs font-black text-slate-900 ${mono ? "font-mono" : ""}`}
      >
        {shortValue(value)}
      </span>
    </div>
  )
}

function ResourceBar({
  label,
  value,
  percent,
  detail,
  status,
  icon,
}: {
  label: string
  value: string
  percent: number
  detail: string
  status?: unknown
  icon?: ReactNode
}) {
  const effectiveStatus = status || (percent >= 90 ? "critical" : percent >= 75 ? "degraded" : "healthy")
  const tone = statusTone(effectiveStatus)
  const bar =
    tone === "healthy" ? "bg-emerald-500" : tone === "degraded" ? "bg-amber-500" : "bg-rose-500"
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon ? (
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              {icon}
            </span>
          ) : null}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
            <p className="mt-1 text-lg font-black tracking-[-0.03em] text-slate-950">{value}</p>
          </div>
        </div>
        <StatusBadge status={effectiveStatus} />
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${clampPercent(percent)}%` }} />
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-500">{detail}</p>
    </div>
  )
}

function DiagnosticStep({
  index,
  title,
  message,
  status,
  fix,
}: {
  index: number
  title: string
  message: string
  status?: unknown
  fix?: string
}) {
  return (
    <div className="relative grid grid-cols-[34px_1fr] gap-3 pb-5 last:pb-0">
      <div className="relative flex justify-center">
        <span
          className={`z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black ${toneClasses(status)}`}
        >
          {statusTone(status) === "healthy" ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
        </span>
        <span className="absolute bottom-[-20px] top-8 w-px bg-slate-200 last:hidden" />
      </div>
      <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-slate-950">{title}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{message}</p>
          </div>
          <StatusBadge status={status} />
        </div>
        {fix ? (
          <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            Action recommandée : {fix}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function LogLine({ entry }: { entry: Record<string, unknown> }) {
  const level = String(entry.level || entry.status || entry.event || "unknown")
  const text = logEntryText(entry)
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-black text-slate-950">{formatDateTime(String(entry.timestamp || ""))}</span>
        <StatusBadge status={level} label={shortValue(entry.event || entry.action || entry.level)} />
        <span className="text-xs font-semibold text-slate-500">
          {shortValue(entry.target || entry.kind, "")}
        </span>
      </div>
      <p className="mt-2 break-words text-xs leading-5 text-slate-700">{text}</p>
      <details className="mt-2">
        <summary className="cursor-pointer text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
          Preuve technique assainie
        </summary>
        <pre className="mt-2 max-h-48 overflow-auto rounded-xl bg-slate-950 p-3 text-[10px] leading-5 text-slate-200">
          {sanitizeLogText(JSON.stringify(entry, null, 2))}
        </pre>
      </details>
    </div>
  )
}

function FeedbackBanner({ feedback, onClose }: { feedback: Feedback; onClose: () => void }) {
  if (!feedback) return null
  const styles =
    feedback.tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : feedback.tone === "error"
        ? "border-rose-200 bg-rose-50 text-rose-900"
        : "border-sky-200 bg-sky-50 text-sky-900"
  const Icon =
    feedback.tone === "success" ? CheckCircle2 : feedback.tone === "error" ? ShieldX : Info
  return (
    <div className={`flex items-start justify-between gap-4 rounded-[20px] border px-4 py-3 ${styles}`}>
      <div className="flex min-w-0 items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="text-sm font-black">{feedback.title}</p>
          {feedback.detail ? <p className="mt-1 text-xs leading-5 opacity-80">{feedback.detail}</p> : null}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-1 opacity-60 hover:bg-white/50 hover:opacity-100"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

function ActionProgress({ action }: { action: string }) {
  if (!action) return null
  return (
    <div className="rounded-[20px] border border-sky-200 bg-sky-50 px-4 py-3 text-sky-950">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin" />
        <div>
          <p className="text-sm font-black">Exécution sécurisée en cours</p>
          <p className="mt-1 text-xs font-semibold text-sky-700">
            Autorisation validée · Commande {action} · Vérification du résultat en cours
          </p>
        </div>
      </div>
    </div>
  )
}

function ConfirmModal({
  modal,
  busyAction,
  onChange,
  onClose,
  onSubmit,
}: {
  modal: Exclude<ModalState, null>
  busyAction: string
  onChange: (next: Exclude<ModalState, null>) => void
  onClose: () => void
  onSubmit: () => void
}) {
  const isService = modal.kind === "service"
  const isSystem = modal.kind === "system"
  const requiredConfirmation = isService
    ? `CONFIRMER ${modal.action.toUpperCase()}`
    : isSystem
      ? modal.mode === "restart"
        ? "REDÉMARRER WINDOWS"
        : modal.mode === "shutdown"
          ? "ARRÊTER WINDOWS"
          : "ANNULER ARRÊT"
      : ""
  const confirmed =
    modal.kind === "backup" || modal.kind === "proof" || modal.kind === "maintenance"
      ? modal.confirmation
      : modal.confirmation.trim() === requiredConfirmation

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-white/70 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.28)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-700">
              Opération gouvernée
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">{modal.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              L’action est attribuée à l’opérateur connecté, journalisée et vérifiée après exécution.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {modal.kind === "service" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <DataPair label="Service" value={modal.serviceName} />
                <DataPair label="Commande" value={modal.action} />
                <DataPair
                  label="Impact prévu"
                  value={modal.action === "restart" ? "Interruption courte" : modal.action === "stop" ? "Service indisponible" : "Remise en ligne"}
                />
              </div>
              <label className="block">
                <span className="text-xs font-black text-slate-700">Raison opérationnelle obligatoire</span>
                <textarea
                  value={modal.reason}
                  onChange={(event) => onChange({ ...modal, reason: event.target.value })}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none ring-sky-200 focus:ring-4"
                  placeholder="Ex. Intervention corrective après diagnostic du service..."
                />
              </label>
              <label className="block">
                <span className="text-xs font-black text-slate-700">
                  Saisissez « {requiredConfirmation} »
                </span>
                <input
                  value={modal.confirmation}
                  onChange={(event) => onChange({ ...modal, confirmation: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none ring-sky-200 focus:ring-4"
                />
              </label>
            </>
          ) : null}

          {modal.kind === "backup" ? (
            <>
              <div className="rounded-[20px] border border-sky-200 bg-sky-50 p-4">
                <p className="text-sm font-black text-sky-950">Sauvegarde de production contrôlée</p>
                <p className="mt-1 text-xs leading-5 text-sky-800">
                  La configuration Bridge, Caddy, les manifestes et actifs protégés seront capturés selon le périmètre existant.
                </p>
              </div>
              <label className="block">
                <span className="text-xs font-black text-slate-700">Motif de la sauvegarde</span>
                <textarea
                  value={modal.reason}
                  onChange={(event) => onChange({ ...modal, reason: event.target.value })}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ring-sky-200 focus:ring-4"
                />
              </label>
              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
                <input
                  type="checkbox"
                  checked={modal.confirmation}
                  onChange={(event) => onChange({ ...modal, confirmation: event.target.checked })}
                  className="mt-0.5 h-4 w-4"
                />
                <span className="text-sm font-semibold text-slate-700">
                  Je confirme la création d’une sauvegarde de production et son inscription dans l’audit.
                </span>
              </label>
            </>
          ) : null}

          {modal.kind === "proof" ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-black text-slate-700">Destinataire</span>
                  <input
                    type="email"
                    value={modal.toEmail}
                    onChange={(event) => onChange({ ...modal, toEmail: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-sky-200 focus:ring-4"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-black text-slate-700">Objet</span>
                  <input
                    value={modal.subject}
                    onChange={(event) => onChange({ ...modal, subject: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-sky-200 focus:ring-4"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-black text-slate-700">Contenu de preuve</span>
                <textarea
                  value={modal.text}
                  onChange={(event) => onChange({ ...modal, text: event.target.value })}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ring-sky-200 focus:ring-4"
                />
              </label>
              <label className="block">
                <span className="text-xs font-black text-slate-700">Motif</span>
                <input
                  value={modal.reason}
                  onChange={(event) => onChange({ ...modal, reason: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-sky-200 focus:ring-4"
                />
              </label>
              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
                <input
                  type="checkbox"
                  checked={modal.confirmation}
                  onChange={(event) => onChange({ ...modal, confirmation: event.target.checked })}
                  className="mt-0.5 h-4 w-4"
                />
                <span className="text-sm font-semibold text-slate-700">
                  Je confirme qu’il s’agit d’un test de production autorisé.
                </span>
              </label>
            </>
          ) : null}

          {modal.kind === "maintenance" ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-black text-slate-700">Durée attendue</span>
                  <input
                    value={modal.duration}
                    onChange={(event) => onChange({ ...modal, duration: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-sky-200 focus:ring-4"
                    placeholder="Ex. 60 minutes"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-black text-slate-700">Message opérateur</span>
                  <input
                    value={modal.message}
                    onChange={(event) => onChange({ ...modal, message: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-sky-200 focus:ring-4"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-black text-slate-700">Raison</span>
                <textarea
                  value={modal.reason}
                  onChange={(event) => onChange({ ...modal, reason: event.target.value })}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ring-sky-200 focus:ring-4"
                />
              </label>
              <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <input
                  type="checkbox"
                  checked={modal.confirmation}
                  onChange={(event) => onChange({ ...modal, confirmation: event.target.checked })}
                  className="mt-0.5 h-4 w-4"
                />
                <span className="text-sm font-semibold text-amber-900">
                  Je confirme l’impact opérationnel et l’inscription de cette maintenance dans l’audit.
                </span>
              </label>
            </>
          ) : null}

          {modal.kind === "system" ? (
            <>
              <div className="rounded-[20px] border border-rose-200 bg-rose-50 p-4">
                <p className="flex items-center gap-2 text-sm font-black text-rose-950">
                  <ShieldAlert className="h-5 w-5" />
                  Opération système critique
                </p>
                <p className="mt-2 text-xs leading-5 text-rose-800">
                  Cette commande peut interrompre le relais Email OS, la passerelle publique et les opérations en cours.
                </p>
              </div>
              <label className="block">
                <span className="text-xs font-black text-slate-700">Justification obligatoire</span>
                <textarea
                  value={modal.reason}
                  onChange={(event) => onChange({ ...modal, reason: event.target.value })}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ring-rose-200 focus:ring-4"
                />
              </label>
              <label className="block">
                <span className="text-xs font-black text-slate-700">
                  Saisissez « {requiredConfirmation} »
                </span>
                <input
                  value={modal.confirmation}
                  onChange={(event) => onChange({ ...modal, confirmation: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-rose-200 px-4 py-3 text-sm font-black text-rose-950 outline-none ring-rose-200 focus:ring-4"
                />
              </label>
            </>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700">
            Annuler
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={Boolean(busyAction) || !confirmed || ("reason" in modal && !modal.reason.trim())}
            className={`rounded-xl px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40 ${
              modal.kind === "system" ? "bg-rose-700" : "bg-slate-950"
            }`}
          >
            {busyAction ? "Exécution…" : "Confirmer l’opération"}
          </button>
        </div>
      </div>
    </div>
  )
}

function LoadingControlCenter() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef5fb_48%,#f8fafc_100%)] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1720px] animate-pulse space-y-5">
        <div className="h-44 rounded-[32px] border border-slate-200 bg-white" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-7">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="h-24 rounded-[22px] border border-slate-200 bg-white" />
          ))}
        </div>
        <div className="grid gap-5 xl:grid-cols-[1.45fr_.8fr]">
          <div className="h-[430px] rounded-[30px] border border-slate-200 bg-white" />
          <div className="h-[430px] rounded-[30px] border border-slate-200 bg-white" />
        </div>
        <div className="flex items-center gap-3 rounded-[22px] border border-sky-200 bg-sky-50 px-5 py-4 text-sky-950">
          <Loader2 className="h-5 w-5 animate-spin" />
          <div>
            <p className="text-sm font-black">Connexion au nœud Windows…</p>
            <p className="mt-1 text-xs font-semibold text-sky-700">Vérification des services, de la passerelle publique et de la livraison SMTP.</p>
          </div>
        </div>
      </div>
    </main>
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
  const [logSeverity, setLogSeverity] = useState<LogSeverity>("all")
  const [logLines, setLogLines] = useState<50 | 100 | 300>(100)
  const [logUpdatedAt, setLogUpdatedAt] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [busyAction, setBusyAction] = useState("")
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [modal, setModal] = useState<ModalState>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("executive")
  const [activeSection, setActiveSection] = useState<SectionId>("overview")
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [liveLogs, setLiveLogs] = useState(false)
  const [criticalMenuOpen, setCriticalMenuOpen] = useState(false)

  function navigateToSection(sectionId: SectionId, options: { focusTab?: boolean; updateHash?: boolean } = {}) {
    setActiveSection(sectionId)

    if (typeof window === "undefined") return

    if (options.updateHash !== false) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${sectionId}`)
    }

    window.requestAnimationFrame(() => {
      const navigation = document.getElementById("windows-node-section-navigation")
      if (navigation) {
        const top = navigation.getBoundingClientRect().top + window.scrollY - 12
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" })
      }
      if (options.focusTab) document.getElementById(`windows-node-tab-${sectionId}`)?.focus()
    })
  }

  async function loadStatus(options: { silent?: boolean } = {}) {
    if (!options.silent) setRefreshing(true)
    const [statusRes, backupRes, maintenanceRes, auditRes] = await Promise.all([
      api<WindowsNodeStatus>("/api/opsos/windows-node/status"),
      api<WindowsBackupStatus>("/api/opsos/windows-node/backup/status"),
      api<MaintenanceModeState>("/api/opsos/windows-node/maintenance-mode"),
      api<{ lines: WindowsAuditEvent[] }>("/api/opsos/windows-node/audit?lines=100"),
    ])

    if (statusRes.ok && statusRes.data) setStatus(statusRes.data)
    if (backupRes.ok && backupRes.data) setBackupStatus(backupRes.data)
    else if (statusRes.ok && statusRes.data?.backups) setBackupStatus(statusRes.data.backups)
    if (maintenanceRes.ok && maintenanceRes.data) setMaintenance(maintenanceRes.data)
    else if (statusRes.ok && statusRes.data?.maintenanceMode) setMaintenance(statusRes.data.maintenanceMode)
    if (auditRes.ok && auditRes.data?.lines) setAuditRows(auditRes.data.lines)

    if (!options.silent) {
      setFeedback(
        statusRes.ok
          ? { tone: "success", title: "État de production actualisé", detail: "Les services, la connectivité, SMTP et la gouvernance ont été resynchronisés." }
          : { tone: "error", title: "Actualisation impossible", detail: statusRes.error || "Le nœud Windows ne répond pas." },
      )
    }

    setLoading(false)
    setRefreshing(false)
  }

  async function loadLogs(type: WindowsNodeLogType, lines = logLines, options: { silent?: boolean } = {}) {
    const response = await api<LogPayload>(`/api/opsos/windows-node/logs?type=${encodeURIComponent(type)}&lines=${lines}`)
    if (response.ok && response.data) {
      setLogPayload(response.data)
      setLogUpdatedAt(new Date().toISOString())
      if (!options.silent) {
        setFeedback({ tone: "success", title: "Journaux synchronisés", detail: `${response.data.returnedLines || response.data.lines?.length || 0} événements chargés.` })
      }
    } else if (!options.silent) {
      setFeedback({ tone: "error", title: "Journaux indisponibles", detail: response.error || `Impossible de charger ${type}.` })
    }
  }

  async function runQuickAction(action: string, payload: Record<string, unknown> = {}) {
    setBusyAction(action)
    setFeedback({ tone: "info", title: "Commande autorisée", detail: `Exécution de ${action} puis vérification automatique de l’état.` })
    const response = await api<Record<string, unknown>>("/api/opsos/windows-node/action", {
      method: "POST",
      body: JSON.stringify({ action, ...payload }),
    })
    if (response.ok) {
      setFeedback({ tone: "success", title: "Opération terminée", detail: `La commande ${action} a été exécutée et inscrite dans l’audit.` })
      await loadStatus({ silent: true })
    } else {
      setFeedback({ tone: "error", title: "Opération échouée", detail: response.error || `La commande ${action} n’a pas abouti.` })
    }
    setBusyAction("")
  }

  async function createBackup(reason: string) {
    setBusyAction("backup")
    const response = await api<Record<string, unknown>>("/api/opsos/windows-node/backup", {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
    if (response.ok) {
      setFeedback({ tone: "success", title: "Sauvegarde créée", detail: "Le périmètre de production a été capturé et le manifeste est disponible." })
      setModal(null)
      await loadStatus({ silent: true })
    } else {
      setFeedback({ tone: "error", title: "Sauvegarde échouée", detail: response.error || "Le nœud n’a pas pu créer la sauvegarde." })
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
      setFeedback({ tone: "success", title: "Preuve de livraison acceptée", detail: "Le relais Windows et Menara SMTP ont confirmé l’opération." })
      setModal(null)
      await loadStatus({ silent: true })
    } else {
      setFeedback({ tone: "error", title: "Preuve d’envoi échouée", detail: response.error || "La chaîne de livraison n’a pas confirmé l’envoi." })
    }
    setBusyAction("")
  }

  async function submitMaintenance(
    mode: "enable" | "disable" | "extend",
    payload: { reason: string; duration?: string; message?: string },
  ) {
    setBusyAction(`maintenance-${mode}`)
    const response = await api<MaintenanceModeState>("/api/opsos/windows-node/maintenance-mode", {
      method: "POST",
      body: JSON.stringify({ mode, reason: payload.reason, duration: payload.duration, message: payload.message }),
    })
    if (response.ok && response.data) {
      setMaintenance(response.data)
      setFeedback({ tone: "success", title: "Maintenance mise à jour", detail: `Le mode ${mode} est confirmé et audité.` })
      setModal(null)
      await loadStatus({ silent: true })
    } else {
      setFeedback({ tone: "error", title: "Maintenance non appliquée", detail: response.error || `La commande ${mode} a échoué.` })
    }
    setBusyAction("")
  }

  async function runServiceAction(
    serviceName: string,
    action: "start" | "stop" | "restart",
    reason: string,
    confirmation: string,
  ) {
    setBusyAction(`${serviceName}-${action}`)
    const response = await api<Record<string, unknown>>("/api/opsos/windows-node/service", {
      method: "POST",
      body: JSON.stringify({ serviceName, action, reason, confirmation }),
    })
    if (response.ok) {
      setFeedback({ tone: "success", title: "Service contrôlé", detail: `${serviceName} : commande ${action} terminée et santé resynchronisée.` })
      setModal(null)
      await loadStatus({ silent: true })
    } else {
      setFeedback({ tone: "error", title: "Action service échouée", detail: response.error || "Le service n’a pas confirmé la commande." })
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
      setFeedback({ tone: "success", title: "Commande système enregistrée", detail: `La commande ${mode} a été acceptée. Consultez l’audit pour la preuve d’exécution.` })
      setModal(null)
      await loadStatus({ silent: true })
    } else {
      setFeedback({ tone: "error", title: "Commande système refusée", detail: response.error || "La commande critique n’a pas été exécutée." })
    }
    setBusyAction("")
  }

  async function copySanitizedLogs() {
    const text = (logPayload?.lines || []).map((line) => sanitizeLogText(JSON.stringify(line))).join("\n")
    await navigator.clipboard.writeText(text)
    setFeedback({ tone: "success", title: "Preuves copiées", detail: "Les secrets et jetons potentiels ont été masqués." })
  }

  async function submitModal() {
    if (!modal) return
    if (modal.kind === "service") {
      await runServiceAction(modal.serviceName, modal.action, modal.reason, modal.confirmation)
      return
    }
    if (modal.kind === "backup") {
      await createBackup(modal.reason)
      return
    }
    if (modal.kind === "proof") {
      await submitProofSend({ toEmail: modal.toEmail, subject: modal.subject, text: modal.text, reason: modal.reason })
      return
    }
    if (modal.kind === "maintenance") {
      await submitMaintenance(modal.mode, { reason: modal.reason, duration: modal.duration, message: modal.message })
      return
    }
    await runSystemAction(modal.mode, modal.reason, modal.confirmation)
  }

  useEffect(() => {
    const syncSectionFromHash = () => {
      const hash = window.location.hash.replace(/^#/, "")
      if (SECTION_TABS.some((tab) => tab.id === hash)) setActiveSection(hash as SectionId)
    }

    syncSectionFromHash()
    window.addEventListener("hashchange", syncSectionFromHash)
    return () => window.removeEventListener("hashchange", syncSectionFromHash)
  }, [])

  useEffect(() => {
    void loadStatus()
  }, [])

  useEffect(() => {
    void loadLogs(activeLogType, logLines, { silent: true })
  }, [activeLogType, logLines])

  useEffect(() => {
    if (!autoRefresh) return
    const timer = window.setInterval(() => void loadStatus({ silent: true }), 30_000)
    return () => window.clearInterval(timer)
  }, [autoRefresh])

  useEffect(() => {
    if (!liveLogs || activeSection !== "logs") return
    const timer = window.setInterval(() => void loadLogs(activeLogType, logLines, { silent: true }), 10_000)
    return () => window.clearInterval(timer)
  }, [liveLogs, activeLogType, logLines, activeSection])

  const selectedLogs = useMemo(() => {
    const search = logSearch.trim().toLowerCase()
    return (logPayload?.lines || []).filter((line) => {
      const text = logEntryText(line).toLowerCase()
      const level = String(line.level || line.status || line.event || "").toLowerCase()
      const matchesSearch = !search || text.includes(search)
      const matchesSeverity =
        logSeverity === "all" ||
        (logSeverity === "error" && /(error|critical|failed|denied)/.test(level + text)) ||
        (logSeverity === "warning" && /(warn|degraded|unknown|timeout)/.test(level + text)) ||
        (logSeverity === "info" && !/(error|critical|failed|denied|warn|degraded)/.test(level + text))
      return matchesSearch && matchesSeverity
    })
  }, [logPayload, logSearch, logSeverity])

  const auditFiltered = useMemo(() => {
    const search = logSearch.trim().toLowerCase()
    if (!search) return auditRows
    return auditRows.filter((row) =>
      logEntryText(row as unknown as Record<string, unknown>).toLowerCase().includes(search),
    )
  }, [auditRows, logSearch])

  if (loading) return <LoadingControlCenter />

  const activeSectionIndex = Math.max(0, SECTION_TABS.findIndex((tab) => tab.id === activeSection))
  const activeSectionMeta = SECTION_TABS[activeSectionIndex]
  const previousSection = activeSectionIndex > 0 ? SECTION_TABS[activeSectionIndex - 1] : null
  const nextSection = activeSectionIndex < SECTION_TABS.length - 1 ? SECTION_TABS[activeSectionIndex + 1] : null

  const bridgeService = status?.services?.bridge || status?.bridgeService
  const caddyService = status?.services?.caddy || status?.caddyService
  const network = status?.network
  const smtp = status?.smtp
  const duckdns = status?.duckdns
  const security = status?.security
  const effectiveBackup = backupStatus || status?.backups
  const effectiveMaintenance = maintenance || status?.maintenanceMode
  const overallStatus = status?.classification || status?.status || "unknown"
  const isMaintenanceEnabled = Boolean(effectiveMaintenance?.enabled)
  const memoryPercent = status?.memory?.systemTotal
    ? clampPercent((status.memory.systemUsed / status.memory.systemTotal) * 100)
    : 0
  const diskPercent = clampPercent(status?.disk?.usedPercent || 0)
  const backupTone: Tone =
    effectiveBackup?.latestBackupAt
      ? Date.now() - new Date(effectiveBackup.latestBackupAt).getTime() < 24 * 60 * 60 * 1000
        ? "healthy"
        : "degraded"
      : "critical"
  const securityTone: Tone =
    (security?.recentUnauthorizedAttempts || 0) > 0 || (security?.recentTokenMismatchSuspicion || 0) > 0
      ? "critical"
      : (security?.recentFailedApiCalls || 0) > 0 || (security?.recentFailedSmtpAuth || 0) > 0
        ? "degraded"
        : "healthy"

  const topologyNodes = [
    {
      title: "AngelCare SaaS",
      subtitle: "OPS OS / Email OS",
      status: status ? "healthy" : "critical",
      detail: "Centre de commande autorisé",
      Icon: Monitor,
    },
    {
      title: "Endpoint public",
      subtitle: status?.publicDomain || "angelcare-mailbridge.duckdns.org",
      status: network?.publicHealth?.status || status?.publicHealth || "unknown",
      detail: network?.publicHealth?.latencyMs ? `${network.publicHealth.latencyMs} ms` : "HTTPS / 443",
      Icon: Wifi,
    },
    {
      title: "Caddy Gateway",
      subtitle: "Reverse proxy & TLS",
      status: caddyService?.status || status?.caddy?.configStatus || "unknown",
      detail: status?.caddy?.certificateStatus?.message || "Certificat public",
      Icon: ShieldCheck,
    },
    {
      title: "Windows Bridge",
      subtitle: bridgeService?.serviceName || "angelcare-email-bridge",
      status: bridgeService?.status || status?.localHealth || "unknown",
      detail: bridgeService?.processStatus || `PID ${status?.processId || "—"}`,
      Icon: Server,
    },
    {
      title: "Menara SMTP",
      subtitle: smtp ? `${smtp.host}:${smtp.port}` : "smtp-auth.menara.ma:587",
      status: smtp?.authStatus?.status || "unknown",
      detail: smtp?.authStatus?.latencyMs ? `${smtp.authStatus.latencyMs} ms` : "Authentification",
      Icon: MailCheck,
    },
    {
      title: "Destinataires",
      subtitle: "Serveurs de réception",
      status: status?.lastSendSuccess ? "healthy" : "unknown",
      detail: status?.lastSendSuccess ? "Dernier envoi accepté" : "Aucune preuve récente",
      Icon: Mail,
    },
  ]

  const diagnosticSteps = network?.diagnosticTree?.length
    ? network.diagnosticTree
    : [
        { step: "Hôte Windows", status: status?.status || "unknown", message: status?.hostname || "Nœud non identifié" },
        { step: "Service Email Bridge", status: bridgeService?.status || "unknown", message: bridgeService?.detail || "État non disponible" },
        { step: "Passerelle publique", status: network?.publicHealth?.status || "unknown", message: network?.publicHealth?.message || "État non disponible" },
        { step: "SMTP Menara", status: smtp?.authStatus?.status || "unknown", message: smtp?.authStatus?.message || "État non disponible" },
      ]

  const incidentTone = statusTone(overallStatus)
  const incidentTitle =
    incidentTone === "healthy"
      ? "Infrastructure stable"
      : incidentTone === "degraded"
        ? "Attention opérationnelle requise"
        : "Incident critique en cours"
  const incidentImpact =
    incidentTone === "healthy"
      ? "L’envoi Email OS, l’accès HTTPS et le relais SMTP sont disponibles."
      : incidentTone === "degraded"
        ? "Une partie de la chaîne est dégradée. La livraison peut être ralentie ou partiellement indisponible."
        : "La chaîne de production ne garantit plus l’envoi des communications Email OS."
  const recommendedAction =
    status?.recommendedAction ||
    network?.recommendedAction ||
    smtp?.recommendedAction ||
    bridgeService?.recommendedAction ||
    "Exécuter un diagnostic complet avant toute intervention."

  const serviceRows = [
    { meta: SERVICE_META["angelcare-email-bridge"], service: bridgeService },
    { meta: SERVICE_META["angelcare-caddy"], service: caddyService },
  ]

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#edf5fb_45%,#f8fafc_100%)] p-3 text-slate-950 sm:p-5 lg:p-7">
      <div className="mx-auto max-w-[1760px] space-y-5">
        <header className="overflow-hidden rounded-[34px] border border-white/90 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
          <div className="relative px-5 py-6 sm:px-7 lg:px-9">
            <div className="pointer-events-none absolute inset-y-0 right-0 w-[44%] bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_68%)]" />
            <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-start">
              <div className="max-w-4xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-sky-800">
                    <Lock className="h-3.5 w-3.5" />
                    Infrastructure · Production
                  </span>
                  <StatusBadge status={overallStatus} />
                  {isMaintenanceEnabled ? <StatusBadge status="degraded" label="Maintenance active" /> : null}
                </div>
                <p className="mt-5 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                  OPSOS Runtime Control Plane
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-[-0.055em] text-slate-950 sm:text-4xl lg:text-5xl">
                  Centre de contrôle infrastructure
                </h1>
                <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-500 sm:text-base">
                  Nœud Windows de production · Email OS. Décision, intervention, preuve et reprise réunies dans un seul cockpit gouverné.
                </p>
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-slate-500">
                  <span>Hôte : <strong className="text-slate-900">{status?.hostname || "Indisponible"}</strong></span>
                  <span>Actualisé : <strong className="text-slate-900">{formatRelative(status?.localTime)}</strong></span>
                  <span>Surveillance : <strong className="text-emerald-700">{autoRefresh ? "Active · 30 s" : "En pause"}</strong></span>
                  <span>Autorité : <strong className="text-slate-900">Administrateur infrastructure</strong></span>
                </div>
              </div>

              <div className="flex max-w-xl flex-col gap-3">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => void loadStatus()}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    Actualiser
                  </button>
                  <button
                    type="button"
                    onClick={() => void runQuickAction("full_diagnostic")}
                    disabled={Boolean(busyAction)}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white shadow-[0_12px_28px_rgba(15,23,42,0.2)] disabled:opacity-50"
                  >
                    <Activity className="h-4 w-4" />
                    Diagnostic complet
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setModal({
                        kind: "backup",
                        title: "Créer une sauvegarde de production",
                        reason: "",
                        confirmation: false,
                      })
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-black text-sky-900"
                  >
                    <HardDriveDownload className="h-4 w-4" />
                    Sauvegarder
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setModal({
                        kind: "maintenance",
                        title: isMaintenanceEnabled ? "Terminer la maintenance" : "Activer la maintenance",
                        mode: isMaintenanceEnabled ? "disable" : "enable",
                        reason: "",
                        duration: "60 minutes",
                        message: "Intervention infrastructure planifiée.",
                        confirmation: false,
                      })
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-black text-amber-900"
                  >
                    <Settings2 className="h-4 w-4" />
                    Maintenance
                  </button>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setCriticalMenuOpen((current) => !current)}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-black text-rose-900"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      Actions critiques
                    </button>
                    {criticalMenuOpen ? (
                      <div className="absolute right-0 z-40 mt-2 w-72 rounded-[20px] border border-rose-200 bg-white p-2 shadow-[0_24px_70px_rgba(15,23,42,0.2)]">
                        <button
                          type="button"
                          onClick={() => {
                            setCriticalMenuOpen(false)
                            setModal({ kind: "system", title: "Redémarrer Windows", mode: "restart", reason: "", confirmation: "" })
                          }}
                          className="w-full rounded-xl px-3 py-3 text-left text-sm font-black text-slate-900 hover:bg-rose-50"
                        >
                          Redémarrer Windows
                          <span className="mt-1 block text-xs font-semibold text-slate-500">Interruption complète temporaire.</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCriticalMenuOpen(false)
                            setModal({ kind: "system", title: "Arrêter Windows", mode: "shutdown", reason: "", confirmation: "" })
                          }}
                          className="w-full rounded-xl px-3 py-3 text-left text-sm font-black text-rose-800 hover:bg-rose-50"
                        >
                          Arrêter Windows
                          <span className="mt-1 block text-xs font-semibold text-rose-600">Le nœud restera indisponible.</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCriticalMenuOpen(false)
                            setModal({ kind: "system", title: "Annuler l’arrêt planifié", mode: "cancel", reason: "", confirmation: "" })
                          }}
                          className="w-full rounded-xl px-3 py-3 text-left text-sm font-black text-slate-700 hover:bg-slate-50"
                        >
                          Annuler un arrêt
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-2">
                  {([
                    ["executive", "Vue exécutive"],
                    ["operational", "Vue opérationnelle"],
                    ["technical", "Vue technique"],
                  ] as const).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setViewMode(id)}
                      className={`rounded-xl px-3 py-2 text-xs font-black ${
                        viewMode === id ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  <label className="ml-1 flex items-center gap-2 px-2 text-xs font-black text-slate-600">
                    <input type="checkbox" checked={autoRefresh} onChange={(event) => setAutoRefresh(event.target.checked)} />
                    Auto
                  </label>
                </div>
              </div>
            </div>
          </div>
        </header>

        {feedback ? <FeedbackBanner feedback={feedback} onClose={() => setFeedback(null)} /> : null}
        <ActionProgress action={busyAction} />

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          <HealthStripItem label="État global" status={overallStatus} value={statusLabel(overallStatus)} detail={status?.recommendedAction || "Décision consolidée"} />
          <HealthStripItem label="Email Bridge" status={bridgeService?.status} value={statusLabel(bridgeService?.status)} detail={bridgeService?.lastCheckedAt ? formatRelative(bridgeService.lastCheckedAt) : "Non vérifié"} />
          <HealthStripItem label="Caddy / HTTPS" status={caddyService?.status} value={statusLabel(caddyService?.status)} detail={status?.caddy?.certificateStatus?.message || "TLS"} />
          <HealthStripItem label="SMTP Menara" status={smtp?.authStatus?.status} value={statusLabel(smtp?.authStatus?.status)} detail={smtp?.authStatus?.latencyMs ? `${smtp.authStatus.latencyMs} ms` : "Authentification"} />
          <HealthStripItem label="DuckDNS" status={duckdns?.status} value={duckdns?.syncStatus || statusLabel(duckdns?.status)} detail={duckdns?.resolvedIp || "Non résolu"} />
          <HealthStripItem label="Sauvegarde" status={backupTone} value={effectiveBackup?.latestBackupAt ? formatRelative(effectiveBackup.latestBackupAt) : "Absente"} detail={`${effectiveBackup?.backupCount || 0} sauvegarde(s)`} />
          <HealthStripItem label="Sécurité" status={securityTone} value={statusLabel(securityTone)} detail={`${security?.recentUnauthorizedAttempts || 0} tentative(s) bloquée(s)`} />
        </section>

        {isMaintenanceEnabled ? (
          <section className="flex flex-col justify-between gap-4 rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <Settings2 className="mt-0.5 h-5 w-5 text-amber-700" />
              <div>
                <p className="text-sm font-black text-amber-950">Maintenance active</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-amber-800">
                  Depuis {formatDateTime(effectiveMaintenance?.startedAt)} par {effectiveMaintenance?.startedBy || "opérateur autorisé"} · {effectiveMaintenance?.reason || "Raison non renseignée"}
                </p>
                <p className="mt-1 text-xs text-amber-700">{effectiveMaintenance?.message}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setModal({
                    kind: "maintenance",
                    title: "Prolonger la maintenance",
                    mode: "extend",
                    reason: effectiveMaintenance?.reason || "",
                    duration: effectiveMaintenance?.expectedDuration || "60 minutes",
                    message: effectiveMaintenance?.message || "",
                    confirmation: false,
                  })
                }
                className="rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-black text-amber-900"
              >
                Prolonger
              </button>
              <button
                type="button"
                onClick={() =>
                  setModal({
                    kind: "maintenance",
                    title: "Terminer la maintenance",
                    mode: "disable",
                    reason: "Fin d’intervention et retour au fonctionnement normal.",
                    duration: "",
                    message: "",
                    confirmation: false,
                  })
                }
                className="rounded-xl bg-amber-900 px-3 py-2 text-xs font-black text-white"
              >
                Terminer
              </button>
            </div>
          </section>
        ) : null}

        <nav
          id="windows-node-section-navigation"
          aria-label="Navigation du centre de contrôle infrastructure"
          className="sticky top-2 z-30 overflow-x-auto rounded-[20px] border border-white/80 bg-white/95 p-2 shadow-[0_12px_40px_rgba(15,23,42,0.10)] backdrop-blur-xl"
        >
          <div role="tablist" aria-label="Sections infrastructure" className="flex min-w-max gap-1">
            {SECTION_TABS.map((tab, tabIndex) => (
              <button
                key={tab.id}
                id={`windows-node-tab-${tab.id}`}
                role="tab"
                aria-selected={activeSection === tab.id}
                aria-controls={`windows-node-panel-${tab.id}`}
                tabIndex={activeSection === tab.id ? 0 : -1}
                type="button"
                onClick={() => navigateToSection(tab.id)}
                onKeyDown={(event) => {
                  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return
                  event.preventDefault()
                  const targetIndex =
                    event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? SECTION_TABS.length - 1
                        : event.key === "ArrowRight"
                          ? (tabIndex + 1) % SECTION_TABS.length
                          : (tabIndex - 1 + SECTION_TABS.length) % SECTION_TABS.length
                  navigateToSection(SECTION_TABS[targetIndex].id, { focusTab: true })
                }}
                className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                  activeSection === tab.id
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="flex flex-col justify-between gap-4 rounded-[22px] border border-slate-200 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">
              Section {String(activeSectionIndex + 1).padStart(2, "0")} / {String(SECTION_TABS.length).padStart(2, "0")}
            </p>
            <h2 className="mt-1 text-lg font-black tracking-[-0.03em] text-slate-950">{activeSectionMeta.label}</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">{SECTION_DESCRIPTIONS[activeSection]}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!previousSection}
              onClick={() => previousSection && navigateToSection(previousSection.id)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
            >
              Précédent
            </button>
            <button
              type="button"
              disabled={!nextSection}
              onClick={() => nextSection && navigateToSection(nextSection.id)}
              className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-35"
            >
              Suivant
            </button>
          </div>
        </div>

        <div id="windows-node-section-workspace" className="min-h-[640px]">
          {activeSection === "overview" ? (
            <div id="windows-node-panel-overview" role="tabpanel" aria-labelledby="windows-node-tab-overview">
              <SectionShell
                id="overview"
          eyebrow="Décision immédiate"
          title="Vue générale de production"
          subtitle="La chaîne complète, son impact métier et la première action recommandée."
          action={
            <span className={`rounded-full border px-3 py-1.5 text-xs font-black ${toneClasses(overallStatus)}`}>
              Disponibilité : {statusLabel(overallStatus)}
            </span>
          }
        >
          <div className="grid gap-5 xl:grid-cols-[1.45fr_.8fr]">
            <div className="rounded-[26px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f1f8fd_100%)] p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-700">Architecture de production en direct</p>
                  <h3 className="mt-2 text-xl font-black tracking-[-0.035em] text-slate-950">Email OS → Windows → Menara SMTP</h3>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600">
                  {status?.publicDomain || "Domaine public non disponible"}
                </span>
              </div>
              <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {topologyNodes.map((node, index) => (
                  <div key={node.title} className="relative">
                    <TopologyNode
                      number={String(index + 1)}
                      icon={<node.Icon className="h-4 w-4" />}
                      title={node.title}
                      subtitle={node.subtitle}
                      status={node.status}
                      detail={node.detail}
                      latency={index === 1 ? network?.publicHealth?.latencyMs : index === 3 ? network?.localHealth?.latencyMs : index === 4 ? smtp?.authStatus?.latencyMs : undefined}
                    />
                    {index < topologyNodes.length - 1 ? (
                      <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-sky-300 xl:block" />
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-[22px] border border-slate-200 bg-white p-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <DataPair label="Hôte" value={status?.hostname} />
                  <DataPair label="Uptime" value={formatUptime(status?.uptimeSeconds)} />
                  <DataPair label="Node.js" value={status?.nodeVersion} />
                  <DataPair label="Dernier envoi" value={status?.lastSendSuccess ? formatRelative(String(recordField(status.lastSendSuccess, "timestamp", "sentAt", "createdAt"))) : "Aucune preuve récente"} />
                </div>
              </div>
            </div>

            <div className={`rounded-[26px] border p-5 sm:p-6 ${toneSurface(overallStatus)}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Centre d’incident</p>
                  <h3 className="mt-2 text-2xl font-black tracking-[-0.04em]">{incidentTitle}</h3>
                </div>
                {incidentTone === "healthy" ? <CheckCircle2 className="h-8 w-8" /> : incidentTone === "degraded" ? <TriangleAlert className="h-8 w-8" /> : <ShieldX className="h-8 w-8" />}
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 opacity-85">{incidentImpact}</p>
              <div className="mt-5 rounded-[20px] border border-current/15 bg-white/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">Action recommandée</p>
                <p className="mt-2 text-sm font-black leading-6">{recommendedAction}</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void runQuickAction("full_diagnostic")}
                  className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white"
                >
                  Exécuter le diagnostic
                </button>
                <button
                  type="button"
                  onClick={() => navigateToSection("logs")}
                  className="rounded-xl border border-current/20 bg-white px-4 py-2.5 text-xs font-black"
                >
                  Voir les preuves
                </button>
              </div>
              {status?.lastError ? (
                <details className="mt-5 rounded-[18px] border border-current/15 bg-white/50 p-3">
                  <summary className="cursor-pointer text-xs font-black">Dernière erreur enregistrée</summary>
                  <p className="mt-2 break-words text-xs leading-5 opacity-75">{sanitizeLogText(JSON.stringify(status.lastError))}</p>
                </details>
              ) : null}
            </div>
          </div>
              </SectionShell>
            </div>
          ) : null}

          {activeSection === "services" ? (
            <div id="windows-node-panel-services" role="tabpanel" aria-labelledby="windows-node-tab-services">
              <SectionShell
                id="services"
          eyebrow="Exécution contrôlée"
          title="Services de production"
          subtitle="Pilotage des services Windows avec raison obligatoire, confirmation et preuve post-action."
        >
          <div className="space-y-4">
            {serviceRows.map(({ meta, service }) => {
              const Icon = meta.icon
              return (
                <article key={meta.technicalName} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)]">
                  <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
                    <div className="flex min-w-0 items-start gap-4">
                      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${toneClasses(service?.status)}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black tracking-[-0.03em] text-slate-950">{meta.title}</h3>
                          <StatusBadge status={service?.status} />
                        </div>
                        <p className="mt-1 text-sm font-semibold text-slate-500">{meta.role}</p>
                        <p className="mt-2 text-xs leading-5 text-slate-500">{service?.detail || "Aucun détail retourné."}</p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
                      <DataPair label="État service" value={service?.serviceState} />
                      <DataPair label="Processus" value={service?.processStatus} />
                      <DataPair label="Démarrage" value={service?.startupType} />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col justify-between gap-4 border-t border-slate-100 pt-4 lg:flex-row lg:items-center">
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
                      <span>Port <strong className="text-slate-900">{service?.port || meta.port}</strong></span>
                      <span>Endpoint <strong className="text-slate-900">{service?.endpoint || meta.endpoint}</strong></span>
                      <span>Dernier contrôle <strong className="text-slate-900">{formatRelative(service?.lastCheckedAt)}</strong></span>
                      <span>Dernière action <strong className="text-slate-900">{service?.lastAction || "Aucune"}</strong></span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(["start", "restart", "stop"] as const).map((action) => (
                        <button
                          key={action}
                          type="button"
                          onClick={() =>
                            setModal({
                              kind: "service",
                              title: `${action === "start" ? "Démarrer" : action === "restart" ? "Redémarrer" : "Arrêter"} ${meta.title}`,
                              action,
                              serviceName: meta.technicalName,
                              reason: "",
                              confirmation: "",
                            })
                          }
                          className={`rounded-xl border px-3 py-2 text-xs font-black ${
                            action === "stop"
                              ? "border-rose-200 bg-rose-50 text-rose-800"
                              : action === "restart"
                                ? "border-amber-200 bg-amber-50 text-amber-900"
                                : "border-emerald-200 bg-emerald-50 text-emerald-800"
                          }`}
                        >
                          {action === "start" ? "Démarrer" : action === "restart" ? "Redémarrer" : "Arrêter"}
                        </button>
                      ))}
                      {meta.technicalName === "angelcare-caddy" ? (
                        <>
                          <button type="button" onClick={() => void runQuickAction("validate_caddy")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700">
                            Valider config
                          </button>
                          <button type="button" onClick={() => void runQuickAction("reload_caddy")} className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-black text-sky-800">
                            Recharger
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {viewMode !== "executive" && status?.updateReadiness ? (
            <div className="mt-5 rounded-[26px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start gap-3">
                <Upload className="h-5 w-5 text-sky-700" />
                <div>
                  <p className="text-sm font-black text-slate-950">Préparation aux mises à jour</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">État technique du Bridge avant une intervention contrôlée.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DataPair label="Version Bridge" value={status.updateReadiness.bridgeVersion} />
                <DataPair label="Dépendances npm" value={status.updateReadiness.npmDependenciesStatus} />
                <DataPair label="Dernier contrôle syntaxe" value={status.updateReadiness.lastSyntaxCheck} />
                <DataPair label="Dernier redémarrage" value={status.updateReadiness.lastRestartAfterUpdate} />
              </div>
            </div>
          ) : null}
              </SectionShell>
            </div>
          ) : null}

          {activeSection === "diagnostics" ? (
            <div id="windows-node-panel-diagnostics" role="tabpanel" aria-labelledby="windows-node-tab-diagnostics">
              <SectionShell
                id="diagnostics"
          eyebrow="Diagnostic guidé"
          title="Diagnostic de bout en bout"
          subtitle="Chaque étape est traduite en résultat, preuve et réponse recommandée."
          action={
            <button type="button" onClick={() => void runQuickAction("full_diagnostic")} className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white">
              Relancer tout le diagnostic
            </button>
          }
        >
          <div className="grid gap-5 xl:grid-cols-[1fr_.78fr]">
            <div className="space-y-3">
              {diagnosticSteps.map((step, index) => (
                <DiagnosticStep
                  key={`${step.step}-${index}`}
                  index={index}
                  title={step.step}
                  status={step.status}
                  message={step.message}
                  fix={"recommendedFix" in step ? step.recommendedFix : undefined}
                />
              ))}
            </div>
            <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Commandes ciblées</p>
              <h3 className="mt-2 text-lg font-black tracking-[-0.03em] text-slate-950">Isoler rapidement la couche défaillante</h3>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => void runQuickAction("network_diagnostic")} className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-sky-300">
                  <Wifi className="h-5 w-5 text-sky-700" />
                  <span className="mt-3 block text-sm font-black text-slate-950">Réseau complet</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">LAN, IP publique, ports, endpoint local et public.</span>
                </button>
                <button type="button" onClick={() => void runQuickAction("duckdns_status")} className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-sky-300">
                  <Monitor className="h-5 w-5 text-sky-700" />
                  <span className="mt-3 block text-sm font-black text-slate-950">DuckDNS</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">Résolution du domaine et correspondance de l’IP publique.</span>
                </button>
                <button type="button" onClick={() => void runQuickAction("validate_caddy")} className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-sky-300">
                  <ShieldCheck className="h-5 w-5 text-sky-700" />
                  <span className="mt-3 block text-sm font-black text-slate-950">Caddy & TLS</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">Validation de la configuration et du certificat public.</span>
                </button>
                <button type="button" onClick={() => void runQuickAction("smtp_test")} className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-sky-300">
                  <MailCheck className="h-5 w-5 text-sky-700" />
                  <span className="mt-3 block text-sm font-black text-slate-950">SMTP Menara</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">DNS, TCP 587 et authentification de production.</span>
                </button>
              </div>
              <div className="mt-5 rounded-[20px] border border-sky-200 bg-sky-50 p-4">
                <p className="text-xs font-black text-sky-950">Conclusion opérationnelle</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-sky-800">{recommendedAction}</p>
              </div>
            </div>
          </div>
              </SectionShell>
            </div>
          ) : null}

          {activeSection === "network" ? (
            <div id="windows-node-panel-network" role="tabpanel" aria-labelledby="windows-node-tab-network">
              <SectionShell
                id="network"
          eyebrow="Accès public"
          title="Réseau, DNS et passerelle HTTPS"
          subtitle="Lecture consolidée de la connectivité depuis le nœud Windows jusqu’au domaine public."
          action={
            <button type="button" onClick={() => void runQuickAction("network_diagnostic")} className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-xs font-black text-sky-900">
              Tester la connectivité
            </button>
          }
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-[26px] border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">Adressage et résolution</p>
                  <p className="mt-1 text-xs text-slate-500">Correspondance entre réseau local, IP publique et DuckDNS.</p>
                </div>
                <StatusBadge status={duckdns?.status || network?.status} />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <DataPair label="IP LAN" value={network?.lanIp} />
                <DataPair label="IP publique" value={network?.publicIp || duckdns?.currentPublicIp} />
                <DataPair label="IP DuckDNS" value={network?.duckDnsResolvedIp || duckdns?.resolvedIp} />
                <DataPair label="Correspondance" value={network?.duckDnsMatch ? "Confirmée" : "Non confirmée"} />
                <DataPair label="Domaine" value={duckdns?.domain || status?.publicDomain} />
                <DataPair label="Dernière mise à jour" value={formatDateTime(duckdns?.lastUpdatedAt)} />
              </div>
              <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Routage attendu</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-700">{network?.routerNatExpectedForwarding || "Port 443 public vers Caddy sur le nœud Windows."}</p>
              </div>
            </div>

            <div className="rounded-[26px] border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">Ports et endpoints</p>
                  <p className="mt-1 text-xs text-slate-500">État des points d’entrée nécessaires à Email OS.</p>
                </div>
                <StatusBadge status={network?.classification || network?.status} />
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ["Port 80", network?.ports?.["80"] || "Non vérifié", "Redirection HTTP / certificat"],
                  ["Port 443", network?.ports?.["443"] || "Non vérifié", "Entrée HTTPS publique"],
                  ["Endpoint local", network?.localHealth?.message || statusLabel(network?.localHealth?.status), network?.localHealth?.latencyMs ? `${network.localHealth.latencyMs} ms` : "Bridge /health"],
                  ["Endpoint public", network?.publicHealth?.message || statusLabel(network?.publicHealth?.status), network?.publicHealth?.latencyMs ? `${network.publicHealth.latencyMs} ms` : "Caddy /health"],
                ].map(([label, value, detail]) => (
                  <div key={label} className="flex items-center justify-between gap-4 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-xs font-black text-slate-900">{label}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{detail}</p>
                    </div>
                    <span className="max-w-[58%] text-right text-xs font-black text-slate-700">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {viewMode === "technical" ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <DataPair label="Caddy local HTTP" value={network?.caddyLocalHttp?.message || statusLabel(network?.caddyLocalHttp?.status)} />
              <DataPair label="Résolution SMTP" value={network?.smtpHostResolution || statusLabel(network?.smtpHostResolutionStatus)} />
              <DataPair label="Port SMTP" value={statusLabel(network?.smtpPortStatus)} />
            </div>
          ) : null}
              </SectionShell>
            </div>
          ) : null}

          {activeSection === "smtp" ? (
            <div id="windows-node-panel-smtp" role="tabpanel" aria-labelledby="windows-node-tab-smtp">
              <SectionShell
                id="smtp"
          eyebrow="Validation de livraison"
          title="SMTP Menara et preuve d’envoi"
          subtitle="Contrôle de la résolution, du port, de l’authentification et d’une livraison réelle autorisée."
          action={
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void runQuickAction("smtp_test")} className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-xs font-black text-sky-900">
                Tester SMTP
              </button>
              <button
                type="button"
                onClick={() =>
                  setModal({
                    kind: "proof",
                    title: "Envoyer un email de preuve",
                    toEmail: "",
                    subject: "Preuve infrastructure Email OS",
                    text: "Bonjour,\n\nCeci est un email de preuve envoyé depuis le centre de contrôle infrastructure AngelCare.\n\nCordialement,",
                    reason: "Validation contrôlée de la chaîne de livraison Email OS.",
                    confirmation: false,
                  })
                }
                className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white"
              >
                Envoyer une preuve
              </button>
            </div>
          }
        >
          <div className="grid gap-5 xl:grid-cols-[1fr_.8fr]">
            <div className="rounded-[26px] border border-slate-200 bg-white p-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DataPair label="Serveur" value={smtp?.host} />
                <DataPair label="Port" value={smtp?.port ? String(smtp.port) : "—"} />
                <DataPair label="Sécurité transport" value={smtp?.secure ? "TLS direct" : "STARTTLS / contrôle serveur"} />
                <DataPair label="Utilisateur" value={smtp?.user} />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <HealthStripItem label="Résolution DNS" status={smtp?.dnsResolutionStatus} value={statusLabel(smtp?.dnsResolutionStatus)} detail={smtp?.host || "Menara"} />
                <HealthStripItem label="Connectivité TCP" status={smtp?.tcpConnectivityStatus} value={statusLabel(smtp?.tcpConnectivityStatus)} detail={`Port ${smtp?.port || 587}`} />
                <HealthStripItem label="Authentification" status={smtp?.authStatus?.status} value={statusLabel(smtp?.authStatus?.status)} detail={smtp?.authStatus?.latencyMs ? `${smtp.authStatus.latencyMs} ms` : smtp?.authStatus?.message || "Non testée"} />
              </div>
              {smtp?.lastError ? (
                <div className="mt-5 rounded-[20px] border border-rose-200 bg-rose-50 p-4">
                  <p className="text-xs font-black text-rose-950">Dernière erreur SMTP</p>
                  <p className="mt-2 break-words text-xs leading-5 text-rose-800">{smtp.lastError}</p>
                </div>
              ) : null}
            </div>

            <div className="rounded-[26px] border border-slate-200 bg-[linear-gradient(145deg,#f0f9ff_0%,#ffffff_75%)] p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-200 bg-white text-sky-700">
                  <MailCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-black text-slate-950">Dernière preuve opérationnelle</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Confirmation de la chaîne Bridge → Menara → destinataire.</p>
                </div>
              </div>
              {status?.lastProofEmail || smtp?.lastProofEmail ? (
                <div className="mt-5 space-y-3">
                  <DataPair label="Horodatage" value={formatDateTime(String(recordField(status?.lastProofEmail || smtp?.lastProofEmail, "timestamp", "sentAt", "createdAt")))} />
                  <DataPair label="Destinataire" value={shortValue(recordField(status?.lastProofEmail || smtp?.lastProofEmail, "to", "toEmail", "recipient"))} />
                  <DataPair label="Résultat" value={shortValue(recordField(status?.lastProofEmail || smtp?.lastProofEmail, "response", "status", "message"))} />
                </div>
              ) : (
                <div className="mt-5 rounded-[20px] border border-dashed border-sky-300 bg-white/80 p-5 text-center">
                  <Mail className="mx-auto h-7 w-7 text-sky-400" />
                  <p className="mt-3 text-sm font-black text-slate-800">Aucune preuve récente</p>
                  <p className="mt-1 text-xs text-slate-500">Envoyez une preuve après maintenance ou changement d’infrastructure.</p>
                </div>
              )}
            </div>
          </div>
              </SectionShell>
            </div>
          ) : null}

          {activeSection === "sender-identities" ? (
            <div id="windows-node-panel-sender-identities" role="tabpanel" aria-labelledby="windows-node-tab-sender-identities">
              <SenderIdentityControlCenter />
            </div>
          ) : null}

          {activeSection === "performance" ? (
            <div id="windows-node-panel-performance" role="tabpanel" aria-labelledby="windows-node-tab-performance">
              <SectionShell
                id="performance"
          eyebrow="Capacité"
          title="Performances et marge opérationnelle"
          subtitle="Les ressources essentielles sont comparées à des seuils compréhensibles, sans surcharge technique."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ResourceBar
              label="Mémoire système"
              value={`${formatBytes(status?.memory?.systemUsed)} / ${formatBytes(status?.memory?.systemTotal)}`}
              percent={memoryPercent}
              detail={memoryPercent >= 85 ? "Seuil critique : risque de pression mémoire." : memoryPercent >= 70 ? "Surveillance recommandée." : "Capacité disponible suffisante."}
            />
            <ResourceBar
              label="Disque"
              value={`${formatBytes(status?.disk?.usedBytes)} / ${formatBytes(status?.disk?.totalBytes)}`}
              percent={diskPercent}
              detail={diskPercent >= 90 ? "Espace critique : sauvegardes et journaux menacés." : diskPercent >= 80 ? "Planifier un nettoyage contrôlé." : `Volume ${status?.disk?.rootPath || "principal"} stable.`}
            />
            <div className="rounded-[22px] border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Processus Bridge</p>
              <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">{formatBytes(status?.memory?.rss)}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">RSS · Heap {formatBytes(status?.memory?.heapUsed)} / {formatBytes(status?.memory?.heapTotal)}</p>
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">CPU & uptime</p>
              <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">{status?.cpuSnapshot?.cores || 0} cœurs</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">Uptime {formatUptime(status?.uptimeSeconds)} · Charge {status?.cpuSnapshot?.loadAverage || "n/a"}</p>
            </div>
          </div>
          {viewMode === "technical" ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <DataPair label="Modèle CPU" value={status?.cpuSnapshot?.model} />
              <DataPair label="CPU user" value={`${status?.cpuSnapshot?.processCpuUserMs || 0} ms`} />
              <DataPair label="CPU système" value={`${status?.cpuSnapshot?.processCpuSystemMs || 0} ms`} />
              <DataPair label="Mémoire externe" value={formatBytes(status?.memory?.external)} />
            </div>
          ) : null}
              </SectionShell>
            </div>
          ) : null}

          {activeSection === "storage" ? (
            <div id="windows-node-panel-storage" role="tabpanel" aria-labelledby="windows-node-tab-storage">
              <StorageDataControlCenter />
            </div>
          ) : null}

          {activeSection === "backups" ? (
            <div id="windows-node-panel-backups" role="tabpanel" aria-labelledby="windows-node-tab-backups">
              <SectionShell
                id="backups"
          eyebrow="Protection & reprise"
          title="Sauvegardes de production"
          subtitle="Dernière protection, actifs couverts, alertes et préparation à la restauration."
          action={
            <button
              type="button"
              onClick={() => setModal({ kind: "backup", title: "Créer une sauvegarde de production", reason: "", confirmation: false })}
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white"
            >
              Créer une sauvegarde
            </button>
          }
        >
          <div className="grid gap-5 xl:grid-cols-[1fr_.8fr]">
            <div className="rounded-[26px] border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-slate-950">État de protection</p>
                  <p className="mt-1 text-xs text-slate-500">Manifestes et actifs produits par le mécanisme existant du nœud.</p>
                </div>
                <StatusBadge status={backupTone} label={backupTone === "healthy" ? "Protection récente" : backupTone === "degraded" ? "Sauvegarde à renouveler" : "Protection absente"} />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DataPair label="Dernière sauvegarde" value={formatDateTime(effectiveBackup?.latestBackupAt)} />
                <DataPair label="Nom" value={effectiveBackup?.latestBackupName} />
                <DataPair label="Volume total" value={formatBytes(effectiveBackup?.folderSizeBytes)} />
                <DataPair label="Rétention disponible" value={`${effectiveBackup?.backupCount || 0} sauvegarde(s)`} />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {(effectiveBackup?.protectedAssets || []).map((asset, assetIndex) => (
                  <div
                    key={`${asset.path || asset.name || "protected-asset"}-${assetIndex}`}
                    className="flex items-center justify-between gap-4 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-xs font-black text-slate-900">{asset.name}</p>
                      <p className="mt-1 break-all text-[10px] text-slate-500">{asset.path}</p>
                    </div>
                    <StatusBadge status={asset.present ? "healthy" : "critical"} label={asset.present ? "Protégé" : "Absent"} />
                  </div>
                ))}
              </div>
              {(effectiveBackup?.warnings || []).length ? (
                <div className="mt-5 rounded-[20px] border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-black text-amber-950">Points d’attention</p>
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-800">
                    {(effectiveBackup?.warnings || []).map((warning, warningIndex) => (
                      <li key={`${warning}-${warningIndex}`}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start gap-3">
                <HardDrive className="h-5 w-5 text-sky-700" />
                <div>
                  <p className="text-sm font-black text-slate-950">Préparation à la reprise</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Indicateurs de capacité de restauration sans simuler une action non câblée.</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ["Répertoire de sauvegarde", effectiveBackup?.directoryExists ? "Prêt" : "Indisponible", effectiveBackup?.directoryExists ? "healthy" : "critical"],
                  ["Dernier manifeste", effectiveBackup?.latestManifestPath ? "Disponible" : "Absent", effectiveBackup?.latestManifestPath ? "healthy" : "critical"],
                  ["Actifs protégés", (effectiveBackup?.protectedAssets || []).every((asset) => asset.present) ? "Complets" : "Partiels", (effectiveBackup?.protectedAssets || []).every((asset) => asset.present) ? "healthy" : "degraded"],
                  ["Checklist de restauration", "Disponible dans Continuité & reprise", "healthy"],
                ].map(([label, value, tone]) => (
                  <div key={label} className="flex items-center justify-between gap-3 rounded-[18px] border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs font-black text-slate-800">{label}</p>
                    <StatusBadge status={tone} label={value} />
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-[20px] border border-sky-200 bg-sky-50 p-4">
                <p className="text-xs font-black text-sky-950">Résumé du dernier manifeste</p>
                <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-sky-800">{effectiveBackup?.latestManifestSummary || "Aucun résumé disponible."}</p>
              </div>
            </div>
          </div>
              </SectionShell>
            </div>
          ) : null}

          {activeSection === "maintenance" ? (
            <div id="windows-node-panel-maintenance" role="tabpanel" aria-labelledby="windows-node-tab-maintenance">
              <SectionShell
                id="maintenance"
          eyebrow="Changement gouverné"
          title="Maintenance et opérations critiques"
          subtitle="Planifier, prolonger ou terminer une intervention. Les commandes système restent isolées dans un coffre critique."
        >
          <div className="grid gap-5 xl:grid-cols-[1fr_.8fr]">
            <div className={`rounded-[26px] border p-5 ${isMaintenanceEnabled ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Settings2 className={`mt-0.5 h-5 w-5 ${isMaintenanceEnabled ? "text-amber-700" : "text-sky-700"}`} />
                  <div>
                    <p className="text-sm font-black text-slate-950">Mode maintenance</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {isMaintenanceEnabled ? "Les opérations normales peuvent être affectées selon le périmètre annoncé." : "Le système accepte les opérations normales."}
                    </p>
                  </div>
                </div>
                <StatusBadge status={isMaintenanceEnabled ? "degraded" : "healthy"} label={isMaintenanceEnabled ? "Actif" : "Inactif"} />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <DataPair label="Démarré le" value={formatDateTime(effectiveMaintenance?.startedAt)} />
                <DataPair label="Par" value={effectiveMaintenance?.startedBy} />
                <DataPair label="Durée attendue" value={effectiveMaintenance?.expectedDuration} />
                <DataPair label="Motif" value={effectiveMaintenance?.reason} />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {!isMaintenanceEnabled ? (
                  <button
                    type="button"
                    onClick={() =>
                      setModal({
                        kind: "maintenance",
                        title: "Activer le mode maintenance",
                        mode: "enable",
                        reason: "",
                        duration: "60 minutes",
                        message: "Intervention infrastructure planifiée.",
                        confirmation: false,
                      })
                    }
                    className="rounded-xl bg-amber-900 px-4 py-2.5 text-xs font-black text-white"
                  >
                    Activer la maintenance
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setModal({
                          kind: "maintenance",
                          title: "Prolonger la maintenance",
                          mode: "extend",
                          reason: effectiveMaintenance?.reason || "",
                          duration: effectiveMaintenance?.expectedDuration || "60 minutes",
                          message: effectiveMaintenance?.message || "",
                          confirmation: false,
                        })
                      }
                      className="rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-xs font-black text-amber-900"
                    >
                      Prolonger
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setModal({
                          kind: "maintenance",
                          title: "Terminer la maintenance",
                          mode: "disable",
                          reason: "Intervention terminée et contrôles post-maintenance réalisés.",
                          duration: "",
                          message: "",
                          confirmation: false,
                        })
                      }
                      className="rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white"
                    >
                      Terminer
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-[26px] border border-rose-200 bg-[linear-gradient(145deg,#fff7f7_0%,#ffffff_72%)] p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-200 bg-white text-rose-700">
                  <Ban className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-black text-rose-950">Coffre des opérations critiques</p>
                  <p className="mt-1 text-xs leading-5 text-rose-700">Actions à impact global, confirmation textuelle et justification obligatoires.</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={() => setModal({ kind: "system", title: "Redémarrer Windows", mode: "restart", reason: "", confirmation: "" })}
                  className="flex w-full items-center justify-between rounded-[18px] border border-rose-200 bg-white px-4 py-3 text-left"
                >
                  <span>
                    <span className="block text-xs font-black text-slate-950">Redémarrer Windows</span>
                    <span className="mt-1 block text-[11px] text-slate-500">Interruption contrôlée de tous les services.</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-rose-600" />
                </button>
                <button
                  type="button"
                  onClick={() => setModal({ kind: "system", title: "Arrêter Windows", mode: "shutdown", reason: "", confirmation: "" })}
                  className="flex w-full items-center justify-between rounded-[18px] border border-rose-200 bg-white px-4 py-3 text-left"
                >
                  <span>
                    <span className="block text-xs font-black text-rose-800">Arrêter Windows</span>
                    <span className="mt-1 block text-[11px] text-rose-600">Le nœud restera indisponible jusqu’au redémarrage physique.</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-rose-600" />
                </button>
                <button
                  type="button"
                  onClick={() => setModal({ kind: "system", title: "Annuler l’arrêt planifié", mode: "cancel", reason: "", confirmation: "" })}
                  className="flex w-full items-center justify-between rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-left"
                >
                  <span>
                    <span className="block text-xs font-black text-slate-800">Annuler un arrêt planifié</span>
                    <span className="mt-1 block text-[11px] text-slate-500">Maintenir le nœud en fonctionnement.</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                </button>
              </div>
            </div>
          </div>
              </SectionShell>
            </div>
          ) : null}

          {activeSection === "security" ? (
            <div id="windows-node-panel-security" role="tabpanel" aria-labelledby="windows-node-tab-security">
              <SectionShell
                id="security"
          eyebrow="Protection"
          title="Posture de sécurité"
          subtitle="Accès administratifs, authentification Bridge, exposition publique et événements suspects."
          action={<StatusBadge status={securityTone} label={securityTone === "healthy" ? "Posture stable" : securityTone === "degraded" ? "Surveillance requise" : "Risque critique"} />}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Jeton administrateur", security?.adminTokenConfigured ? "Configuré" : "Absent", security?.adminTokenConfigured ? "healthy" : "critical", "Autorise le contrôle de l’infrastructure"],
              ["Jeton Bridge", security?.bridgeTokenConfigured ? "Configuré" : "Absent", security?.bridgeTokenConfigured ? "healthy" : "critical", "Protège les commandes vers Windows"],
              ["Secrets masqués", security?.maskedSecrets ? "Confirmé" : "À vérifier", security?.maskedSecrets ? "healthy" : "degraded", "Les journaux publics restent assainis"],
              ["Environnement", security?.envPresent ? "Présent" : "Absent", security?.envPresent ? "healthy" : "critical", "Configuration runtime du Bridge"],
            ].map(([label, value, tone, detail]) => (
              <article key={label} className="rounded-[22px] border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-black text-slate-900">{label}</p>
                  <span className={`h-2.5 w-2.5 rounded-full ${dotClasses(tone)}`} />
                </div>
                <p className="mt-3 text-xl font-black tracking-[-0.03em] text-slate-950">{value}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
              </article>
            ))}
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_.8fr]">
            <div className="rounded-[26px] border border-slate-200 bg-white p-5">
              <p className="text-sm font-black text-slate-950">Signaux de sécurité récents</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  ["Requêtes non autorisées", security?.recentUnauthorizedAttempts || 0, "critical"],
                  ["Suspicion de jeton", security?.recentTokenMismatchSuspicion || 0, "critical"],
                  ["Échecs SMTP auth", security?.recentFailedSmtpAuth || 0, "degraded"],
                  ["Échecs API", security?.recentFailedApiCalls || 0, "degraded"],
                ].map(([label, value, tone]) => (
                  <div key={label} className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-black text-slate-700">{label}</p>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${Number(value) === 0 ? toneClasses("healthy") : toneClasses(String(tone))}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className={`rounded-[26px] border p-5 ${toneSurface(securityTone)}`}>
              <ShieldCheck className="h-6 w-6" />
              <p className="mt-4 text-lg font-black tracking-[-0.03em]">Conclusion sécurité</p>
              <p className="mt-2 text-sm font-semibold leading-6 opacity-80">
                {securityTone === "healthy"
                  ? "Aucun signal critique récent. Les contrôles d’accès et le masquage des secrets sont opérationnels."
                  : securityTone === "degraded"
                    ? "Des échecs récents nécessitent une lecture de l’audit et des journaux avant toute action sensible."
                    : "Un signal critique a été détecté. Les opérations système doivent être suspendues jusqu’à analyse."}
              </p>
              <p className="mt-4 text-xs font-black">Dernière action admin : {security?.lastAdminAction || "Aucune action récente"}</p>
            </div>
          </div>
              </SectionShell>
            </div>
          ) : null}

          {activeSection === "logs" ? (
            <div id="windows-node-panel-logs" role="tabpanel" aria-labelledby="windows-node-tab-logs">
              <SectionShell
                id="logs"
          eyebrow="Preuves techniques"
          title="Journaux de production"
          subtitle="Flux assaini, filtrable et limité aux sources autorisées du nœud Windows."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600">
                <input type="checkbox" checked={liveLogs} onChange={(event) => setLiveLogs(event.target.checked)} />
                Temps réel
              </label>
              <button type="button" onClick={() => void loadLogs(activeLogType, logLines)} className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-black text-sky-900">
                Actualiser
              </button>
              <button type="button" onClick={() => void copySanitizedLogs()} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">
                <Copy className="h-3.5 w-3.5" />
                Copier
              </button>
            </div>
          }
        >
          <div className="grid gap-5 xl:grid-cols-[240px_1fr]">
            <aside className="space-y-2 rounded-[24px] border border-slate-200 bg-slate-50 p-3">
              {LOG_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveLogType(tab.id)}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-xs font-black ${
                    activeLogType === tab.id ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:bg-white/70"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <div className="border-t border-slate-200 pt-3">
                <p className="px-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Dernière synchro</p>
                <p className="mt-1 px-2 text-xs font-semibold text-slate-600">{formatRelative(logUpdatedAt)}</p>
              </div>
            </aside>

            <div>
              <div className="grid gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_auto_auto]">
                <input
                  value={logSearch}
                  onChange={(event) => setLogSearch(event.target.value)}
                  placeholder="Rechercher événement, service, résultat…"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none ring-sky-200 focus:ring-4"
                />
                <select
                  value={logSeverity}
                  onChange={(event) => setLogSeverity(event.target.value as LogSeverity)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-700"
                >
                  <option value="all">Toutes sévérités</option>
                  <option value="error">Erreurs</option>
                  <option value="warning">Alertes</option>
                  <option value="info">Informations</option>
                </select>
                <select
                  value={logLines}
                  onChange={(event) => setLogLines(Number(event.target.value) as 50 | 100 | 300)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-700"
                >
                  <option value={50}>50 lignes</option>
                  <option value={100}>100 lignes</option>
                  <option value={300}>300 lignes</option>
                </select>
              </div>

              <div className="mt-4 space-y-3">
                {selectedLogs.length ? selectedLogs.map((entry, index) => <LogLine key={`${String(entry.timestamp || "log")}-${index}`} entry={entry} />) : (
                  <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-8 text-center">
                    <ClipboardList className="mx-auto h-7 w-7 text-slate-300" />
                    <p className="mt-3 text-sm font-black text-slate-700">Aucun événement correspondant</p>
                    <p className="mt-1 text-xs text-slate-500">Modifiez les filtres ou actualisez les journaux.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
              </SectionShell>
            </div>
          ) : null}

          {activeSection === "audit" ? (
            <div id="windows-node-panel-audit" role="tabpanel" aria-labelledby="windows-node-tab-audit">
              <SectionShell
                id="audit"
          eyebrow="Traçabilité"
          title="Audit de gouvernance"
          subtitle="Chronologie des diagnostics, interventions, sauvegardes, maintenances et actions système."
          action={
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">
              <BarChart3 className="h-4 w-4" />
              {status?.auditSummary?.totalEvents || auditRows.length} événement(s)
            </div>
          }
        >
          <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
            <div className="space-y-3">
              {auditFiltered.length ? auditFiltered.map((row, index) => (
                <article key={`${row.timestamp}-${row.action}-${index}`} className="grid gap-4 rounded-[22px] border border-slate-200 bg-white p-4 sm:grid-cols-[130px_1fr_auto] sm:items-start">
                  <div>
                    <p className="text-xs font-black text-slate-900">{formatDateTime(row.timestamp)}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{row.actor || "Système"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-950">{row.action}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{row.target}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-600">{row.reason || row.metadataSummary || "Aucune justification fournie."}</p>
                  </div>
                  <StatusBadge status={row.result || row.severity} label={row.result || row.severity} />
                </article>
              )) : (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-8 text-center">
                  <p className="text-sm font-black text-slate-700">Aucun événement d’audit disponible</p>
                </div>
              )}
            </div>
            <aside className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-black text-slate-950">Résumé de gouvernance</p>
              <div className="mt-4 space-y-3">
                <DataPair label="Événements récents" value={String(status?.auditSummary?.recentEvents || 0)} />
                <DataPair label="Accès non autorisés" value={String(status?.auditSummary?.unauthorizedAttempts || 0)} />
                <DataPair label="Dernier événement" value={formatRelative(status?.auditSummary?.lastEventAt)} />
                <DataPair label="Dernière action" value={status?.auditSummary?.lastEventAction} />
              </div>
            </aside>
          </div>
              </SectionShell>
            </div>
          ) : null}

          {activeSection === "continuity" ? (
            <div id="windows-node-panel-continuity" role="tabpanel" aria-labelledby="windows-node-tab-continuity">
              <SectionShell
                id="continuity"
          eyebrow="Résilience"
          title="Continuité et reprise"
          subtitle="Runbooks exécutables humainement, préparation de migration et ordre de reprise après incident."
        >
          <div className="grid gap-5 xl:grid-cols-[1fr_.78fr]">
            <div className="grid gap-3 sm:grid-cols-2">
              {RUNBOOKS.map((runbook, index) => (
                <article key={runbook.title} className="rounded-[22px] border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-xs font-black text-sky-800">{index + 1}</span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{runbook.layer}</span>
                  </div>
                  <h3 className="mt-4 text-sm font-black text-slate-950">{runbook.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{runbook.body}</p>
                </article>
              ))}
            </div>
            <div className="rounded-[26px] border border-slate-200 bg-[linear-gradient(145deg,#f0f9ff_0%,#ffffff_75%)] p-5">
              <div className="flex items-start gap-3">
                <ClipboardList className="h-5 w-5 text-sky-700" />
                <div>
                  <p className="text-sm font-black text-slate-950">Checklist de migration vers un nouveau nœud</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Ordre recommandé sans exécuter automatiquement une restauration non câblée.</p>
                </div>
              </div>
              <ol className="mt-5 space-y-3">
                {MIGRATION_CHECKLIST.map((item, index) => (
                  <li key={item} className="flex gap-3 rounded-[18px] border border-slate-200 bg-white px-4 py-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-[10px] font-black text-white">{index + 1}</span>
                    <p className="text-xs font-semibold leading-5 text-slate-700">{item}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-5 rounded-[20px] border border-sky-200 bg-sky-50 p-4">
                <p className="text-xs font-black text-sky-950">Ordre de validation final</p>
                <p className="mt-2 text-xs leading-5 text-sky-800">Bridge local → Caddy public → DuckDNS → SMTP → email de preuve → reprise du trafic Email OS.</p>
              </div>
            </div>
          </div>
              </SectionShell>
            </div>
          ) : null}
        </div>

        <footer className="flex flex-col justify-between gap-3 rounded-[22px] border border-white/80 bg-white px-5 py-4 text-xs font-semibold text-slate-500 shadow-sm sm:flex-row sm:items-center">
          <span>OPSOS Windows Node Control Center · Production gouvernée</span>
          <span>Dernière donnée connue : {formatDateTime(status?.localTime)} · {status?.version || "version non disponible"}</span>
        </footer>
      </div>

      {modal ? (
        <ConfirmModal
          modal={modal}
          busyAction={busyAction}
          onChange={(next) => setModal(next)}
          onClose={() => setModal(null)}
          onSubmit={() => void submitModal()}
        />
      ) : null}
    </main>
  )
}
