"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Command,
  Eye,
  EyeOff,
  GraduationCap,
  Grid2X2,
  Handshake,
  Headphones,
  HelpCircle,
  History,
  Inbox,
  KeyRound,
  Laptop,
  ListFilter,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  RefreshCw,
  Rows3,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Table2,
  UserRound,
  Users,
  X,
} from "lucide-react"

type Tone = "emerald" | "amber" | "rose" | "blue" | "violet" | "cyan" | "slate"
type FilterKey = "all" | "active" | "attention" | "expired" | "admin" | "recent"
type ViewMode = "comfortable" | "compact" | "table"

type MailboxSummary = {
  id: string
  assignmentId?: string
  assignment_id?: string
  mailboxId: string
  mailboxEmail: string | null
  mailboxName: string | null
  mailbox_id: string
  mailbox?: {
    id: string
    name: string
    address: string
    status: string
    owner?: string | null
    provider?: string | null
  } | null
  role: string
  permissions: Record<string, boolean>
  pinConfigured?: boolean
  pinStatus?: string
  pin_status: string
  assignmentStatus?: string
  status: string
  failed_pin_attempts: number
  locked_until?: string | null
  assigned_by?: string | null
  assigned_at?: string | null
  sessionStatus?: string
  session_status: string
  session?: {
    id: string
    status: string
    unlocked_at?: string | null
    expires_at: string
    last_activity_at?: string | null
  } | null
  last_unlock_at?: string | null
  last_activity_at?: string | null
  row_state: string
  security_status: string
}

type SummaryState = {
  assigned_mailboxes_count: number
  active_sessions_count: number
  locked_assignments_count: number
  last_activity_at?: string | null
  security_status: string
}

type OperatorState = {
  id?: string
  name?: string | null
  email?: string | null
  role?: string | null
  department?: string | null
  title?: string | null
}

type LoadState = {
  operator?: OperatorState | null
  summary: SummaryState
  assignments: MailboxSummary[]
}

type AuditRow = {
  id: string
  mailbox_id?: string | null
  event_type?: string | null
  event_result?: string | null
  severity?: string | null
  ip_address?: string | null
  user_agent?: string | null
  metadata_json?: Record<string, unknown> | null
  created_at?: string | null
}

type ApiResult<T = unknown> = {
  ok: boolean
  status: number
  data: T
  error: string | null
}

type MailboxIdentity = {
  label: string
  shortLabel: string
  purpose: string
  accent: Tone
  icon: typeof Mail
}

const DEFAULT_SUMMARY: SummaryState = {
  assigned_mailboxes_count: 0,
  active_sessions_count: 0,
  locked_assignments_count: 0,
  last_activity_at: null,
  security_status: "Synchronisation en attente",
}

const DEFAULT_STATE: LoadState = {
  operator: null,
  summary: DEFAULT_SUMMARY,
  assignments: [],
}

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Toutes" },
  { key: "active", label: "Sessions actives" },
  { key: "attention", label: "À traiter" },
  { key: "expired", label: "Expirées" },
  { key: "admin", label: "Administration" },
  { key: "recent", label: "Récentes" },
]

const ROLE_LABELS: Record<string, string> = {
  viewer: "Consultation",
  operator: "Opérateur",
  sender: "Émetteur",
  manager: "Responsable",
  admin: "Administrateur",
  ceo: "Direction générale",
  direction: "Direction",
  super_admin: "Super administrateur",
  owner: "Propriétaire",
}

const PERMISSION_LABELS: Record<string, string> = {
  can_read: "Lire les messages",
  can_send: "Envoyer des emails",
  can_reply: "Répondre aux conversations",
  can_archive: "Archiver",
  can_delete: "Supprimer",
  can_manage_templates: "Gérer les modèles",
  can_view_logs: "Consulter les journaux",
  can_manage_mailbox_settings: "Administrer la boîte",
}

const EVENT_LABELS: Record<string, string> = {
  mailbox_unlock_success: "Boîte déverrouillée",
  mailbox_unlock_failed: "Tentative de déverrouillage refusée",
  mailbox_unlock_locked: "Accès temporairement verrouillé",
  mailbox_session_created: "Session sécurisée créée",
  mailbox_session_refreshed: "Session sécurisée prolongée",
  mailbox_session_expired: "Session expirée",
  mailbox_session_revoked: "Session verrouillée",
  mailbox_workspace_opened: "Espace boîte ouvert",
  unauthorized_mailbox_access_blocked: "Accès non autorisé bloqué",
  spoofed_mailbox_payload_blocked: "Identité d’envoi non autorisée bloquée",
  email_sent: "Email envoyé",
  email_read: "Email consulté",
  email_replied: "Réponse envoyée",
  email_archived: "Email archivé",
  email_deleted: "Email supprimé",
  attachment_opened: "Pièce jointe consultée",
}

const MAILBOX_IDENTITIES: Array<{
  needles: string[]
  identity: MailboxIdentity
}> = [
  {
    needles: ["support", "supports"],
    identity: {
      label: "Support Client",
      shortLabel: "SUPPORT",
      purpose: "Assistance client, résolution des demandes et continuité de service.",
      accent: "blue",
      icon: Headphones,
    },
  },
  {
    needles: ["partenaire", "partner"],
    identity: {
      label: "Partenariats",
      shortLabel: "PARTENAIRES",
      purpose: "Relations institutionnelles, partenaires stratégiques et réseau national.",
      accent: "violet",
      icon: Handshake,
    },
  },
  {
    needles: ["ops", "operation"],
    identity: {
      label: "Commandement Opérations",
      shortLabel: "OPÉRATIONS",
      purpose: "Missions, exécution terrain, coordination et continuité opérationnelle.",
      accent: "emerald",
      icon: Activity,
    },
  },
  {
    needles: ["academy", "academie", "formation"],
    identity: {
      label: "AngelCare Academy",
      shortLabel: "ACADEMY",
      purpose: "Formations, certifications, cohortes et partenaires pédagogiques.",
      accent: "violet",
      icon: GraduationCap,
    },
  },
  {
    needles: ["rh", "human", "ressource"],
    identity: {
      label: "Ressources Humaines",
      shortLabel: "RH",
      purpose: "Collaborateurs, recrutement, conformité RH et communication interne.",
      accent: "violet",
      icon: Users,
    },
  },
  {
    needles: ["it.support", "it support", "informatique", "tech"],
    identity: {
      label: "Support Informatique",
      shortLabel: "IT SUPPORT",
      purpose: "Accès, incidents techniques, sécurité et continuité numérique.",
      accent: "cyan",
      icon: Laptop,
    },
  },
  {
    needles: ["b2b", "commercial", "business"],
    identity: {
      label: "Développement B2B",
      shortLabel: "B2B",
      purpose: "Prospection, comptes entreprises, offres et développement commercial.",
      accent: "amber",
      icon: BriefcaseBusiness,
    },
  },
  {
    needles: ["montessori"],
    identity: {
      label: "Montessori",
      shortLabel: "MONTESSORI",
      purpose: "Programmes Montessori, produits spécialisés et accompagnement client.",
      accent: "emerald",
      icon: Sparkles,
    },
  },
  {
    needles: ["home", "domicile"],
    identity: {
      label: "Home Service",
      shortLabel: "HOME SERVICE",
      purpose: "Services à domicile, familles, confirmations et suivi d’intervention.",
      accent: "blue",
      icon: Building2,
    },
  },
  {
    needles: ["event", "excursion"],
    identity: {
      label: "Événements & Excursions",
      shortLabel: "ÉVÉNEMENTS",
      purpose: "Coordination événementielle, excursions, réservations et confirmations.",
      accent: "amber",
      icon: Mail,
    },
  },
]

const TONE_STYLES: Record<Tone, { soft: string; border: string; text: string; solid: string; ring: string }> = {
  emerald: { soft: "#ecfdf5", border: "#bbf7d0", text: "#047857", solid: "#059669", ring: "rgba(16,185,129,.18)" },
  amber: { soft: "#fffbeb", border: "#fde68a", text: "#b45309", solid: "#d97706", ring: "rgba(245,158,11,.18)" },
  rose: { soft: "#fff1f2", border: "#fecdd3", text: "#be123c", solid: "#e11d48", ring: "rgba(244,63,94,.18)" },
  blue: { soft: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", solid: "#2563eb", ring: "rgba(37,99,235,.18)" },
  violet: { soft: "#f5f3ff", border: "#ddd6fe", text: "#6d28d9", solid: "#7c3aed", ring: "rgba(124,58,237,.18)" },
  cyan: { soft: "#ecfeff", border: "#a5f3fc", text: "#0e7490", solid: "#0891b2", ring: "rgba(6,182,212,.18)" },
  slate: { soft: "#f8fafc", border: "#e2e8f0", text: "#475569", solid: "#64748b", ring: "rgba(100,116,139,.14)" },
}

function clean(value: unknown) {
  return String(value ?? "").trim()
}

function cleanLower(value: unknown) {
  return clean(value).toLowerCase()
}

function titleCaseHumanName(value: string) {
  return value
    .replace(/[._-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ")
}

function operatorDisplayName(operator?: OperatorState | null) {
  const explicit = clean(operator?.name)
  if (explicit && !explicit.includes("@")) return titleCaseHumanName(explicit)
  const emailLocalPart = clean(operator?.email).split("@")[0]
  if (emailLocalPart) return titleCaseHumanName(emailLocalPart)
  return "Opérateur AngelCare"
}

function finiteNumber(value: unknown, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function shortDate(value?: string | null) {
  if (!value) return "Aucune activité"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "Indisponible"
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(parsed)
}

function relativeDate(value?: string | null) {
  if (!value) return "Aucune activité récente"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "Date indisponible"
  const diff = Date.now() - parsed.getTime()
  const minutes = Math.max(0, Math.floor(diff / 60000))
  if (minutes < 1) return "À l’instant"
  if (minutes < 60) return `Il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Il y a ${days} j`
  return shortDate(value)
}

function normalizeSummary(value: Record<string, unknown> | null | undefined): SummaryState {
  const row = value || {}
  return {
    assigned_mailboxes_count: finiteNumber(row.assigned_mailboxes_count ?? row.assignedMailboxesCount, 0),
    active_sessions_count: finiteNumber(row.active_sessions_count ?? row.activeSessionsCount, 0),
    locked_assignments_count: finiteNumber(row.locked_assignments_count ?? row.lockedAssignmentsCount, 0),
    last_activity_at: clean(row.last_activity_at ?? row.lastActivityAt) || null,
    security_status: clean(row.security_status ?? row.securityStatus) || "Synchronisation en attente",
  }
}

function normalizeLoadState(value: unknown): LoadState {
  const row = (value && typeof value === "object" ? value : {}) as Record<string, unknown>
  return {
    operator: row.operator && typeof row.operator === "object" ? (row.operator as OperatorState) : null,
    summary: normalizeSummary(row.summary as Record<string, unknown> | null | undefined),
    assignments: Array.isArray(row.assignments) ? (row.assignments as MailboxSummary[]) : [],
  }
}

function mailboxName(assignment: MailboxSummary) {
  return clean(assignment.mailboxName || assignment.mailbox?.name || assignment.mailboxId || assignment.mailbox_id) || "Boîte Email OS"
}

function mailboxEmail(assignment: MailboxSummary) {
  return clean(assignment.mailboxEmail || assignment.mailbox?.address) || "Adresse indisponible"
}

function mailboxIdentity(assignment: MailboxSummary): MailboxIdentity {
  const haystack = `${mailboxName(assignment)} ${mailboxEmail(assignment)} ${assignment.mailboxId} ${assignment.mailbox_id}`.toLowerCase()
  const found = MAILBOX_IDENTITIES.find((item) => item.needles.some((needle) => haystack.includes(needle)))
  if (found) return found.identity
  return {
    label: mailboxName(assignment),
    shortLabel: "EMAIL OS",
    purpose: "Identité de communication AngelCare autorisée pour votre profil.",
    accent: "blue",
    icon: Mail,
  }
}

function assignmentSessionStatus(assignment: MailboxSummary) {
  return cleanLower(assignment.sessionStatus || assignment.session_status)
}

function assignmentPinStatus(assignment: MailboxSummary) {
  return cleanLower(assignment.pinStatus || assignment.pin_status)
}

function assignmentStatus(assignment: MailboxSummary) {
  return cleanLower(assignment.assignmentStatus || assignment.status)
}

function sessionIsActive(assignment: MailboxSummary) {
  if (assignmentSessionStatus(assignment) !== "active") return false
  const expiresAt = clean(assignment.session?.expires_at)
  if (!expiresAt) return false
  const timestamp = new Date(expiresAt).getTime()
  return Number.isFinite(timestamp) && timestamp > Date.now()
}

function isTemporarilyLocked(assignment: MailboxSummary) {
  const value = clean(assignment.locked_until)
  if (!value) return false
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) && timestamp > Date.now()
}

function assignmentNeedsAttention(assignment: MailboxSummary) {
  const pin = assignmentPinStatus(assignment)
  const status = assignmentStatus(assignment)
  return status !== "active" || ["not_configured", "reset_required", "locked", "revoked"].includes(pin) || isTemporarilyLocked(assignment)
}

function assignmentTone(assignment: MailboxSummary): Tone {
  if (sessionIsActive(assignment)) return "emerald"
  if (assignmentNeedsAttention(assignment)) {
    const pin = assignmentPinStatus(assignment)
    if (["locked", "revoked"].includes(pin) || assignmentStatus(assignment) === "revoked") return "rose"
    return "amber"
  }
  if (assignmentSessionStatus(assignment) === "expired") return "amber"
  return "slate"
}

function sessionLabel(assignment: MailboxSummary) {
  if (sessionIsActive(assignment)) return "Session active"
  const status = assignmentSessionStatus(assignment)
  if (status === "expired") return "Session expirée"
  if (status === "revoked") return "Session verrouillée"
  const pin = assignmentPinStatus(assignment)
  if (pin === "not_configured") return "PIN à configurer"
  if (pin === "reset_required") return "Réinitialisation requise"
  if (pin === "locked") return "Accès temporairement verrouillé"
  if (assignmentStatus(assignment) !== "active") return "Accès non actif"
  return "Authentification requise"
}

function roleLabel(role: string) {
  return ROLE_LABELS[cleanLower(role)] || clean(role) || "Accès attribué"
}

function permissionRows(permissions: Record<string, boolean>) {
  return Object.entries(permissions || {})
    .filter(([, enabled]) => Boolean(enabled))
    .map(([key]) => PERMISSION_LABELS[key] || key.replace(/^can_/, "").replaceAll("_", " "))
}

function permissionSummary(assignment: MailboxSummary) {
  const permissions = permissionRows(assignment.permissions)
  if (cleanLower(assignment.role) === "admin") return "Administration complète"
  if (permissions.includes("Envoyer des emails") && permissions.includes("Répondre aux conversations")) return "Communication opérationnelle"
  if (permissions.includes("Lire les messages")) return "Consultation autorisée"
  return "Accès limité"
}

function eventLabel(value?: string | null) {
  const key = clean(value)
  return EVENT_LABELS[key] || key.replaceAll("_", " ") || "Activité Email OS"
}

function securityTone(value: string): Tone {
  const text = cleanLower(value)
  if (text.includes("ready") || text.includes("healthy") || text.includes("pin active") || text.includes("stable")) return "emerald"
  if (text.includes("locked") || text.includes("revoked") || text.includes("critical")) return "rose"
  if (text.includes("needs") || text.includes("attention") || text.includes("pending")) return "amber"
  return "blue"
}

function securityLabel(value: string) {
  const text = cleanLower(value)
  if (text.includes("ready") || text.includes("healthy")) return "Protection active"
  if (text.includes("pin active")) return "Politique PIN active"
  if (text.includes("locked")) return "Accès verrouillé"
  if (text.includes("revoked")) return "Accès révoqué"
  if (text.includes("needs")) return "Configuration requise"
  return clean(value) || "Statut en cours de vérification"
}

function compareAssignments(a: MailboxSummary, b: MailboxSummary) {
  const activeDiff = Number(sessionIsActive(b)) - Number(sessionIsActive(a))
  if (activeDiff) return activeDiff
  const attentionDiff = Number(assignmentNeedsAttention(a)) - Number(assignmentNeedsAttention(b))
  if (attentionDiff) return attentionDiff
  const aTime = new Date(a.last_activity_at || a.last_unlock_at || 0).getTime() || 0
  const bTime = new Date(b.last_activity_at || b.last_unlock_at || 0).getTime() || 0
  if (aTime !== bTime) return bTime - aTime
  return mailboxName(a).localeCompare(mailboxName(b), "fr")
}

async function api<T = unknown>(path: string, options?: RequestInit): Promise<ApiResult<T>> {
  const response = await fetch(path, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  })
  const json = await response.json().catch(() => ({}))
  return {
    ok: response.ok && json?.ok !== false,
    status: response.status,
    data: (json?.data ?? json) as T,
    error: clean(json?.error) || (!response.ok ? `HTTP ${response.status}` : null),
  }
}

export default function EmailOSMailboxGateDispatcher() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const pinInputRef = useRef<HTMLInputElement | null>(null)

  const [state, setState] = useState<LoadState>(DEFAULT_STATE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<FilterKey>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("comfortable")
  const [selectedMailbox, setSelectedMailbox] = useState<MailboxSummary | null>(null)
  const [detailMailbox, setDetailMailbox] = useState<MailboxSummary | null>(null)
  const [auditOpen, setAuditOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [auditRows, setAuditRows] = useState<AuditRow[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditError, setAuditError] = useState<string | null>(null)
  const [pin, setPin] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [busy, setBusy] = useState(false)
  const [lockAllBusy, setLockAllBusy] = useState(false)
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [pinLockedUntil, setPinLockedUntil] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await api<LoadState>("/api/email-os/access/my-mailboxes")
    setLoading(false)
    if (!result.ok) {
      setError(result.error || "Impossible de charger vos identités Email OS.")
      return
    }
    setState(normalizeLoadState(result.data))
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
      if (event.key === "Escape") {
        setSelectedMailbox(null)
        setDetailMailbox(null)
        setAuditOpen(false)
        setHelpOpen(false)
      }
    }
    window.addEventListener("keydown", shortcut)
    return () => window.removeEventListener("keydown", shortcut)
  }, [])

  useEffect(() => {
    if (!selectedMailbox) return
    window.setTimeout(() => pinInputRef.current?.focus(), 80)
  }, [selectedMailbox])

  const assignments = useMemo(() => [...state.assignments].sort(compareAssignments), [state.assignments])
  const activeAssignments = useMemo(() => assignments.filter(sessionIsActive), [assignments])
  const recentAssignments = useMemo(() => assignments.filter((assignment) => assignment.last_activity_at || assignment.last_unlock_at).slice(0, 3), [assignments])
  const redirectReason = searchParams.get("reason")

  const filteredAssignments = useMemo(() => {
    const needle = cleanLower(query)
    return assignments.filter((assignment) => {
      const identity = mailboxIdentity(assignment)
      const searchable = `${mailboxName(assignment)} ${mailboxEmail(assignment)} ${identity.label} ${identity.purpose} ${assignment.role}`.toLowerCase()
      if (needle && !searchable.includes(needle)) return false
      if (filter === "active") return sessionIsActive(assignment)
      if (filter === "attention") return assignmentNeedsAttention(assignment)
      if (filter === "expired") return assignmentSessionStatus(assignment) === "expired"
      if (filter === "admin") return cleanLower(assignment.role) === "admin"
      if (filter === "recent") return Boolean(assignment.last_activity_at || assignment.last_unlock_at)
      return true
    })
  }, [assignments, filter, query])

  const noAccess = !loading && assignments.length === 0
  const postureTone = securityTone(state.summary.security_status)
  const attentionCount = assignments.filter(assignmentNeedsAttention).length
  const latestAssignment = assignments.find((assignment) => assignment.last_activity_at || assignment.last_unlock_at) || null
  const operatorName = operatorDisplayName(state.operator)
  const operatorRole = roleLabel(clean(state.operator?.role) || "operator")
  const operatorTitle = clean(state.operator?.title) || operatorRole
  const operatorDepartment = clean(state.operator?.department) || "ANGELCARE"

  async function loadAudit(mailboxId?: string | null) {
    setAuditLoading(true)
    setAuditError(null)
    const suffix = mailboxId ? `?mailboxId=${encodeURIComponent(mailboxId)}&limit=80` : "?limit=80"
    const result = await api<AuditRow[]>(`/api/email-os/access/audit/my${suffix}`)
    setAuditLoading(false)
    if (!result.ok) {
      setAuditError(result.error || "Impossible de charger l’historique d’accès.")
      setAuditRows([])
      return
    }
    setAuditRows(Array.isArray(result.data) ? result.data : [])
  }

  function openAudit(mailbox?: MailboxSummary | null) {
    setAuditOpen(true)
    void loadAudit(mailbox?.mailboxId || null)
  }

  async function unlockMailbox() {
    if (!selectedMailbox) return
    if (!/^\d{6}$/.test(pin)) {
      setUnlockError("Saisissez exactement les 6 chiffres du PIN sécurisé.")
      return
    }

    setBusy(true)
    setUnlockError(null)
    const target = selectedMailbox
    const result = await api("/api/email-os/access/unlock", {
      method: "POST",
      body: JSON.stringify({ mailboxId: target.mailboxId, pin }),
    })
    setBusy(false)

    if (!result.ok) {
      setUnlockError(result.error || "Déverrouillage refusé.")
      if (result.status === 423) setPinLockedUntil(target.locked_until || null)
      return
    }

    setPin("")
    setSelectedMailbox(null)
    router.push(`/email-os/mailboxes/${encodeURIComponent(target.mailboxId)}`)
  }

  function openMailbox(assignment: MailboxSummary) {
    if (sessionIsActive(assignment)) {
      router.push(`/email-os/mailboxes/${encodeURIComponent(assignment.mailboxId)}`)
      return
    }
    if (assignmentNeedsAttention(assignment) && assignmentPinStatus(assignment) !== "active") {
      setDetailMailbox(assignment)
      return
    }
    setSelectedMailbox(assignment)
    setPin("")
    setShowPin(false)
    setUnlockError(null)
    setPinLockedUntil(assignment.locked_until || null)
  }

  async function lockMailbox(assignment: MailboxSummary) {
    setBusy(true)
    setNotice(null)
    const result = await api("/api/email-os/access/logout-mailbox", {
      method: "POST",
      body: JSON.stringify({ mailboxId: assignment.mailboxId, reason: "user locked mailbox from secure access lobby" }),
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.error || "Impossible de verrouiller la session.")
      return
    }
    setNotice(`${mailboxIdentity(assignment).label} a été verrouillée en toute sécurité.`)
    await load()
  }

  async function lockAllSessions() {
    if (!activeAssignments.length) {
      setNotice("Aucune session active à verrouiller.")
      return
    }
    setLockAllBusy(true)
    setError(null)
    setNotice(null)
    const results = await Promise.all(
      activeAssignments.map((assignment) =>
        api("/api/email-os/access/logout-mailbox", {
          method: "POST",
          body: JSON.stringify({ mailboxId: assignment.mailboxId, reason: "user locked all mailbox sessions from secure access lobby" }),
        }),
      ),
    )
    setLockAllBusy(false)
    const failed = results.filter((result) => !result.ok)
    if (failed.length) {
      setError(`${failed.length} session(s) n’ont pas pu être verrouillées. Actualisez puis réessayez.`)
    } else {
      setNotice(`${activeAssignments.length} session(s) ont été verrouillées en toute sécurité.`)
    }
    await load()
  }

  function appendPinDigit(digit: string) {
    setPin((current) => `${current}${digit}`.slice(0, 6))
    setUnlockError(null)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dff4ff_0,#eef6ff_26%,#f8fafc_58%,#ffffff_100%)] text-slate-950">
      <div className="flex min-h-screen w-full flex-col gap-4 px-4 py-4 lg:px-6 xl:px-8 2xl:px-9">
        <header className="relative overflow-hidden rounded-[34px] border border-white/90 bg-white shadow-[0_28px_90px_rgba(15,23,42,.11)] ring-1 ring-sky-100/90">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_18%,rgba(14,165,233,.11),transparent_27%),radial-gradient(circle_at_78%_22%,rgba(99,102,241,.08),transparent_25%),linear-gradient(135deg,#ffffff_0%,#f5fbff_52%,#f4f6ff_100%)]" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.20]"
            style={{
              backgroundImage: "linear-gradient(rgba(37,99,235,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,.06) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage: "linear-gradient(to bottom, black, transparent 88%)",
            }}
          />

          <div className="relative px-5 py-4 sm:px-6 lg:px-7 2xl:px-8">
            <div className="flex flex-col gap-3 border-b border-slate-200/70 pb-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex shrink-0 items-center rounded-[18px] border border-white bg-white/95 px-2.5 py-2 shadow-[0_10px_28px_rgba(15,23,42,.07)] ring-1 ring-slate-200/70">
                  <img src="/logo.png" alt="AngelCare official logo" className="h-9 w-auto object-contain sm:h-10" />
                </div>
                <div className="min-w-0 border-l border-slate-200 pl-3">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <p className="text-[16px] font-black tracking-[0.11em] text-slate-950 sm:text-[19px]">ANGELCARE EMAIL OS</p>
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,.45)]" />
                    <span className="text-[9px] font-semibold italic tracking-[0.025em] text-slate-500 sm:text-[10px]">Developped and property of ANGELCARE</span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.14em] text-slate-700 shadow-sm">
                      <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-rose-500 text-[8px] font-black text-white">©</span> Copyright protected
                    </span>
                  </div>
                  <p className="mt-1 text-[8px] font-black uppercase tracking-[0.20em] text-slate-500 sm:text-[9px]">Secure Communications Operating System</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/95 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.14em] text-emerald-800 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Système protégé
                </div>
                <StatusPill tone={postureTone} label={securityLabel(state.summary.security_status)} />
                <span className="rounded-full border border-blue-200 bg-white/90 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.13em] text-blue-700 shadow-sm">Production · Live</span>
              </div>
            </div>

            <div className="grid gap-5 py-5 xl:grid-cols-[minmax(0,1fr)_470px] xl:items-stretch 2xl:grid-cols-[minmax(0,1fr)_500px]">
              <div className="flex min-w-0 flex-col justify-center">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50/90 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.17em] text-blue-700 shadow-sm">
                  <ShieldCheck className="h-3.5 w-3.5" /> Accès exécutif sécurisé
                </div>
                <h1 className="mt-3 max-w-[980px] text-[34px] font-black leading-[0.98] tracking-[-0.064em] text-slate-950 sm:text-[42px] lg:text-[50px] 2xl:text-[54px]">
                  Vos identités Email OS.
                  <span className="ml-2 bg-[linear-gradient(90deg,#1d4ed8,#0891b2)] bg-clip-text text-transparent sm:ml-3">Un accès unique, sécurisé.</span>
                </h1>
                <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-600 lg:text-[15px] lg:leading-7">
                  Ouvrez uniquement les boîtes AngelCare autorisées. Chaque identité reste protégée par PIN, session isolée, permissions réelles et audit intégral.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <HeaderAction icon={ArrowRight} label="Accéder à mes identités" onClick={() => document.getElementById("email-os-identities")?.scrollIntoView({ behavior: "smooth", block: "start" })} variant="primary" />
                  <HeaderAction icon={RefreshCw} label="Actualiser" onClick={() => void load()} busy={loading} />
                  <HeaderAction icon={History} label="Activité sécurité" onClick={() => openAudit(null)} />
                  <HeaderAction icon={HelpCircle} label="Aide" onClick={() => setHelpOpen(true)} />
                  {activeAssignments.length ? <HeaderAction icon={LogOut} label="Verrouiller les sessions" onClick={() => void lockAllSessions()} busy={lockAllBusy} variant="danger" /> : null}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-bold text-slate-500">
                  <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Identités strictement attribuées</span>
                  <span className="inline-flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-blue-600" /> Aucun envoi hors périmètre</span>
                  <span className="inline-flex items-center gap-1.5"><History className="h-3.5 w-3.5 text-violet-600" /> Traçabilité complète</span>
                </div>
              </div>

              <AuthenticatedOperatorPassport
                operatorName={operatorName}
                operatorRole={operatorRole}
                operatorTitle={operatorTitle}
                operatorDepartment={operatorDepartment}
                assignedCount={state.summary.assigned_mailboxes_count}
                activeCount={state.summary.active_sessions_count}
                attentionCount={attentionCount}
                lastActivity={relativeDate(state.summary.last_activity_at)}
                securityStatus={securityLabel(state.summary.security_status)}
              />
            </div>

            <SecurityProtocolRibbon securityTone={postureTone} lockedCount={state.summary.locked_assignments_count} />
          </div>
        </header>

        {error ? <InlineNotice tone="rose" icon={ShieldAlert} text={error} actionLabel="Réessayer" onAction={() => void load()} /> : null}
        {notice ? <InlineNotice tone="emerald" icon={CheckCircle2} text={notice} onDismiss={() => setNotice(null)} /> : null}
        {redirectReason ? <InlineNotice tone="amber" icon={AlertTriangle} text={redirectReason} /> : null}

        {loading ? (
          <MailboxGateSkeleton />
        ) : noAccess ? (
          <NoAccessState onRefresh={() => void load()} />
        ) : (
          <main id="email-os-identities" className="scroll-mt-5 grid min-h-[620px] gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
            <div className="min-w-0 space-y-5">
              {(activeAssignments.length || recentAssignments.length) ? (
                <section className="rounded-[28px] border border-white/90 bg-white/94 p-5 shadow-[0_16px_48px_rgba(15,23,42,.07)] ring-1 ring-slate-200/70">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                        <Sparkles className="h-3.5 w-3.5" /> Reprendre votre travail
                      </div>
                      <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">Accès rapides</h2>
                      <p className="mt-1 text-sm font-semibold text-slate-500">Vos identités actives ou récemment utilisées, classées par priorité opérationnelle.</p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">{Math.max(activeAssignments.length, recentAssignments.length)} disponible(s)</span>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                    {(activeAssignments.length ? activeAssignments.slice(0, 3) : recentAssignments).map((assignment) => (
                      <RecentMailboxCard key={`recent-${assignment.id}`} assignment={assignment} onOpen={() => openMailbox(assignment)} onLock={() => void lockMailbox(assignment)} />
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="rounded-[28px] border border-white/90 bg-white/94 p-4 shadow-[0_16px_48px_rgba(15,23,42,.07)] ring-1 ring-slate-200/70 sm:p-5">
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-4">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        <Inbox className="h-3.5 w-3.5" /> Espace des identités autorisées
                      </div>
                      <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">Vos boîtes Email OS</h2>
                    </div>
                    <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1">
                      <ViewButton active={viewMode === "comfortable"} icon={Grid2X2} label="Cartes" onClick={() => setViewMode("comfortable")} />
                      <ViewButton active={viewMode === "compact"} icon={Rows3} label="Compact" onClick={() => setViewMode("compact")} />
                      <ViewButton active={viewMode === "table"} icon={Table2} label="Table" onClick={() => setViewMode("table")} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <label className="relative block min-w-0 flex-1">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        ref={searchInputRef}
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Rechercher une boîte, un service ou une adresse…"
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-20 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black text-slate-500">
                        <Command className="h-3 w-3" /> K
                      </span>
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-1 lg:max-w-[650px] lg:pb-0">
                      {FILTERS.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setFilter(item.key)}
                          className={`whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-black transition ${filter === item.key ? "border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-950/10" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950"}`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold text-slate-500">
                  <span>{filteredAssignments.length} identité(s) affichée(s)</span>
                  <span>Tri intelligent : active · récente · attention</span>
                </div>

                {filteredAssignments.length ? (
                  viewMode === "table" ? (
                    <MailboxTable assignments={filteredAssignments} onOpen={openMailbox} onDetails={setDetailMailbox} />
                  ) : (
                    <div className={`mt-4 grid gap-4 ${viewMode === "compact" ? "md:grid-cols-2 2xl:grid-cols-3" : "md:grid-cols-2 2xl:grid-cols-3"}`}>
                      {filteredAssignments.map((assignment) => (
                        <MailboxIdentityCard
                          key={assignment.id}
                          assignment={assignment}
                          compact={viewMode === "compact"}
                          onOpen={() => openMailbox(assignment)}
                          onDetails={() => setDetailMailbox(assignment)}
                          onAudit={() => openAudit(assignment)}
                        />
                      ))}
                    </div>
                  )
                ) : (
                  <div className="mt-4 grid min-h-[260px] place-items-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
                    <div>
                      <Search className="mx-auto h-8 w-8 text-slate-300" />
                      <h3 className="mt-3 text-lg font-black text-slate-950">Aucune identité ne correspond</h3>
                      <p className="mt-2 text-sm font-semibold text-slate-500">Modifiez la recherche ou revenez au filtre Toutes.</p>
                      <button type="button" onClick={() => { setQuery(""); setFilter("all") }} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white">Réinitialiser</button>
                    </div>
                  </div>
                )}
              </section>
            </div>

            <SecurityIntelligenceRail
              summary={state.summary}
              assignments={assignments}
              activeAssignments={activeAssignments}
              latestAssignment={latestAssignment}
              onLockAll={() => void lockAllSessions()}
              lockAllBusy={lockAllBusy}
              onAudit={() => openAudit(null)}
              onHelp={() => setHelpOpen(true)}
            />
          </main>
        )}
      </div>

      {selectedMailbox ? (
        <UnlockModal
          assignment={selectedMailbox}
          pin={pin}
          showPin={showPin}
          busy={busy}
          error={unlockError}
          lockedUntil={pinLockedUntil}
          inputRef={pinInputRef}
          onPinChange={(value) => { setPin(value.replace(/\D/g, "").slice(0, 6)); setUnlockError(null) }}
          onToggleShow={() => setShowPin((current) => !current)}
          onDigit={appendPinDigit}
          onBackspace={() => setPin((current) => current.slice(0, -1))}
          onClear={() => setPin("")}
          onSubmit={() => void unlockMailbox()}
          onClose={() => { setSelectedMailbox(null); setPin(""); setShowPin(false); setUnlockError(null); setPinLockedUntil(null) }}
        />
      ) : null}

      {detailMailbox ? (
        <AccessDetailsDrawer
          assignment={detailMailbox}
          onClose={() => setDetailMailbox(null)}
          onOpen={() => { setDetailMailbox(null); openMailbox(detailMailbox) }}
          onAudit={() => { const target = detailMailbox; setDetailMailbox(null); openAudit(target) }}
        />
      ) : null}

      {auditOpen ? (
        <AuditDrawer rows={auditRows} loading={auditLoading} error={auditError} onRefresh={() => void loadAudit(null)} onClose={() => setAuditOpen(false)} />
      ) : null}

      {helpOpen ? <HelpDrawer onClose={() => setHelpOpen(false)} /> : null}
    </div>
  )
}

function AuthenticatedOperatorPassport({ operatorName, operatorRole, operatorTitle, operatorDepartment, assignedCount, activeCount, attentionCount, lastActivity, securityStatus }: { operatorName: string; operatorRole: string; operatorTitle: string; operatorDepartment: string; assignedCount: number; activeCount: number; attentionCount: number; lastActivity: string; securityStatus: string }) {
  const initials = operatorName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "AC"
  const metrics = [
    { label: "Identités", value: String(assignedCount), tone: "blue" as Tone },
    { label: "Sessions", value: String(activeCount), tone: activeCount ? "emerald" as Tone : "slate" as Tone },
    { label: "Alertes", value: String(attentionCount), tone: attentionCount ? "amber" as Tone : "emerald" as Tone },
    { label: "Activité", value: lastActivity, tone: "slate" as Tone },
  ]

  return (
    <section className="relative h-full overflow-hidden rounded-[26px] border border-white/90 bg-white/96 p-4 shadow-[0_18px_52px_rgba(15,23,42,.10)] ring-1 ring-slate-200/80">
      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#2563eb,#06b6d4,#10b981,#7c3aed,#ef4444)]" />
      <div className="relative flex h-full flex-col justify-between gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[8px] font-black uppercase tracking-[0.21em] text-blue-700">Authenticated operator</p>
          <div className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-emerald-700"><ShieldCheck className="h-3 w-3" /> Verified</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-[17px] bg-slate-950 text-base font-black text-white shadow-[0_12px_28px_rgba(15,23,42,.20)]">
            {initials}
            <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-[2px] border-white bg-emerald-500 text-white"><Check className="h-2.5 w-2.5" /></span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[17px] font-black tracking-[-0.03em] text-slate-950">{operatorName}</h2>
            <p className="mt-0.5 truncate text-[11px] font-bold text-slate-700">{operatorTitle}</p>
            <p className="mt-0.5 truncate text-[8px] font-black uppercase tracking-[0.12em] text-blue-600">{operatorDepartment} · {operatorRole}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-[18px] border border-blue-100 bg-[linear-gradient(135deg,#eff6ff,#ffffff)] px-3.5 py-3">
          <div className="min-w-0">
            <p className="text-[8px] font-black uppercase tracking-[0.15em] text-blue-700">Security clearance</p>
            <p className="mt-1 truncate text-sm font-black text-slate-950">Accès exécutif Email OS</p>
            <p className="mt-1 flex items-center gap-1.5 truncate text-[9px] font-bold text-slate-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {securityStatus} · Session authentifiée</p>
          </div>
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20"><Shield className="h-4 w-4" /></div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {metrics.map((metric) => {
            const palette = TONE_STYLES[metric.tone]
            return (
              <div key={metric.label} className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-2">
                <p className="text-[7px] font-black uppercase tracking-[0.13em] text-slate-400">{metric.label}</p>
                <p className="mt-1 truncate text-[12px] font-black tracking-[-0.025em]" style={{ color: metric.tone === "slate" ? "#0f172a" : palette.text }}>{metric.value}</p>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white">
          <div className="min-w-0">
            <p className="text-[7px] font-black uppercase tracking-[0.14em] text-cyan-100">Credential status</p>
            <p className="mt-0.5 truncate text-[10px] font-black text-white">Session opérateur scellée</p>
          </div>
          <div className="flex h-6 w-16 shrink-0 items-end justify-center gap-1 rounded-lg border border-white/10 bg-white/[0.05] px-1.5 py-1">
            {[35,58,82,48,72,42,64].map((height, bar) => <span key={`credential-wave-${bar}`} className="w-0.5 rounded-full bg-[linear-gradient(180deg,#22d3ee,#60a5fa,#a78bfa)]" style={{ height: `${height}%`, opacity: .82 }} />)}
          </div>
        </div>
      </div>
    </section>
  )
}

function SecurityProtocolRibbon({ securityTone: tone, lockedCount }: { securityTone: Tone; lockedCount: number }) {
  const protocols = [
    { number: "01", icon: KeyRound, title: "PIN dédié", detail: "Un code par identité", tone: "blue" as Tone },
    { number: "02", icon: ShieldCheck, title: "Session isolée", detail: "Périmètre scellé", tone: "emerald" as Tone },
    { number: "03", icon: UserRound, title: "Permissions réelles", detail: "Actions par rôle", tone: "violet" as Tone },
    { number: "04", icon: History, title: "Audit intégral", detail: "Traçabilité complète", tone: lockedCount ? "amber" as Tone : tone },
  ]
  return (
    <section className="grid overflow-hidden rounded-[18px] border border-white/90 bg-white/92 shadow-[0_10px_32px_rgba(15,23,42,.055)] ring-1 ring-slate-200/70 sm:grid-cols-[170px_repeat(2,minmax(0,1fr))] xl:grid-cols-[170px_repeat(4,minmax(0,1fr))]">
      <div className="flex items-center gap-2 border-b border-slate-100 px-3.5 py-2.5 sm:border-b-0 sm:border-r">
        <Activity className="h-3.5 w-3.5 text-blue-600" />
        <div><p className="text-[8px] font-black uppercase tracking-[0.18em] text-slate-500">Security protocol</p><p className="mt-0.5 text-[9px] font-bold text-slate-700">Protection opérationnelle</p></div>
      </div>
      {protocols.map((protocol) => {
        const palette = TONE_STYLES[protocol.tone]
        const Icon = protocol.icon
        return (
          <div key={protocol.number} className="flex min-w-0 items-center gap-2.5 border-t border-slate-100 px-3.5 py-2.5 sm:border-t-0 sm:border-r last:border-r-0">
            <div className="relative grid h-8 w-8 shrink-0 place-items-center rounded-xl" style={{ color: palette.text, background: palette.soft }}>
              <Icon className="h-3.5 w-3.5" />
              <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full text-[6px] font-black text-white" style={{ background: palette.solid }}>{protocol.number}</span>
            </div>
            <div className="min-w-0"><p className="truncate text-[10px] font-black text-slate-950">{protocol.title}</p><p className="mt-0.5 truncate text-[8px] font-semibold text-slate-500">{protocol.detail}</p></div>
          </div>
        )
      })}
    </section>
  )
}

function HeaderAction({ icon: Icon, label, onClick, busy = false, disabled = false, variant = "secondary" }: { icon: typeof RefreshCw; label: string; onClick: () => void; busy?: boolean; disabled?: boolean; variant?: "primary" | "secondary" | "danger" }) {
  const variants = {
    primary: "border-slate-950 bg-slate-950 text-white shadow-[0_16px_42px_rgba(15,23,42,.22)] hover:border-blue-700 hover:bg-blue-700 hover:shadow-[0_18px_46px_rgba(37,99,235,.25)]",
    secondary: "border-white/90 bg-white/94 text-slate-800 shadow-[0_12px_30px_rgba(15,23,42,.07)] hover:border-slate-300 hover:text-slate-950",
    danger: "border-rose-200 bg-rose-50 text-rose-700 shadow-[0_12px_30px_rgba(225,29,72,.08)] hover:border-rose-300 hover:bg-rose-100",
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className={`inline-flex h-10 items-center gap-2 rounded-[13px] border px-3.5 text-[11px] font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]}`}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  )
}

function StatusPill({ tone, label }: { tone: Tone; label: string }) {
  const palette = TONE_STYLES[tone]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.10em]" style={{ color: palette.text, borderColor: palette.border, background: palette.soft }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: palette.solid }} />
      {label}
    </span>
  )
}

function InlineNotice({ tone, icon: Icon, text, actionLabel, onAction, onDismiss }: { tone: Tone; icon: typeof ShieldAlert; text: string; actionLabel?: string; onAction?: () => void; onDismiss?: () => void }) {
  const palette = TONE_STYLES[tone]
  return (
    <div className="flex items-center gap-3 rounded-[20px] border px-4 py-3 shadow-sm" style={{ borderColor: palette.border, background: palette.soft }}>
      <Icon className="h-5 w-5 shrink-0" style={{ color: palette.text }} />
      <p className="min-w-0 flex-1 text-sm font-bold" style={{ color: palette.text }}>{text}</p>
      {actionLabel && onAction ? <button type="button" onClick={onAction} className="rounded-xl bg-white px-3 py-2 text-xs font-black shadow-sm" style={{ color: palette.text }}> {actionLabel} </button> : null}
      {onDismiss ? <button type="button" onClick={onDismiss} className="grid h-8 w-8 place-items-center rounded-lg bg-white/70" aria-label="Fermer"><X className="h-4 w-4" /></button> : null}
    </div>
  )
}

function RecentMailboxCard({ assignment, onOpen, onLock }: { assignment: MailboxSummary; onOpen: () => void; onLock: () => void }) {
  const identity = mailboxIdentity(assignment)
  const palette = TONE_STYLES[identity.accent]
  const Icon = identity.icon
  const active = sessionIsActive(assignment)
  return (
    <article className="group relative overflow-hidden rounded-[22px] border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,.10)]">
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: palette.solid }} />
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ color: palette.text, background: palette.soft }}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: palette.text }}>{identity.shortLabel}</p>
          <h3 className="mt-1 truncate text-base font-black text-slate-950">{identity.label}</h3>
          <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{mailboxEmail(assignment)}</p>
        </div>
        <StatusPill tone={active ? "emerald" : "amber"} label={active ? "Active" : "À ouvrir"} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Dernière activité</p>
          <p className="mt-1 truncate text-xs font-black text-slate-700">{relativeDate(assignment.last_activity_at || assignment.last_unlock_at)}</p>
        </div>
        <div className="flex gap-2">
          {active ? <button type="button" onClick={onLock} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-rose-600" aria-label="Verrouiller"><LogOut className="h-4 w-4" /></button> : null}
          <button type="button" onClick={onOpen} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-950 px-3 text-xs font-black text-white">
            {active ? "Entrer" : "Déverrouiller"}<ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  )
}

function MailboxIdentityCard({ assignment, compact, onOpen, onDetails, onAudit }: { assignment: MailboxSummary; compact: boolean; onOpen: () => void; onDetails: () => void; onAudit: () => void }) {
  const identity = mailboxIdentity(assignment)
  const palette = TONE_STYLES[identity.accent]
  const tone = assignmentTone(assignment)
  const Icon = identity.icon
  const active = sessionIsActive(assignment)
  const attention = assignmentNeedsAttention(assignment)

  return (
    <article className={`group relative overflow-hidden rounded-[25px] border border-slate-200 bg-white transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_22px_58px_rgba(15,23,42,.11)] ${compact ? "p-4" : "p-5"}`}>
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: palette.solid }} />
      <div className="flex items-start gap-3.5">
        <div className={`${compact ? "h-10 w-10" : "h-12 w-12"} grid shrink-0 place-items-center rounded-2xl`} style={{ color: palette.text, background: palette.soft, boxShadow: `0 0 0 6px ${palette.ring}` }}>
          <Icon className={compact ? "h-4.5 w-4.5" : "h-5 w-5"} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: palette.text }}>{identity.shortLabel}</p>
            <StatusPill tone={tone} label={sessionLabel(assignment)} />
          </div>
          <h3 className={`${compact ? "mt-1.5 text-lg" : "mt-2 text-xl"} truncate font-black tracking-[-0.035em] text-slate-950`}>{identity.label}</h3>
          <p className="mt-1 truncate text-xs font-semibold text-slate-500">{mailboxEmail(assignment)}</p>
        </div>
      </div>

      {!compact ? <p className="mt-4 min-h-[44px] text-sm font-semibold leading-6 text-slate-600">{identity.purpose}</p> : null}

      <div className={`${compact ? "mt-3" : "mt-4"} grid grid-cols-2 gap-2`}>
        <CompactMeta label="Niveau d’accès" value={roleLabel(assignment.role)} />
        <CompactMeta label="Permissions" value={permissionSummary(assignment)} />
        {!compact ? <CompactMeta label="Dernière activité" value={relativeDate(assignment.last_activity_at || assignment.last_unlock_at)} /> : null}
        {!compact ? <CompactMeta label="Tentatives" value={`${assignment.failed_pin_attempts || 0} / 5`} tone={(assignment.failed_pin_attempts || 0) > 0 ? "amber" : "slate"} /> : null}
      </div>

      {attention ? (
        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-bold leading-5 text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {assignmentPinStatus(assignment) === "not_configured" ? "Un administrateur doit configurer le PIN avant tout accès." : assignmentPinStatus(assignment) === "reset_required" ? "Le PIN doit être réinitialisé avant la prochaine session." : assignmentPinStatus(assignment) === "locked" ? "L’accès est temporairement verrouillé après plusieurs tentatives." : "Cette identité nécessite une vérification d’accès."}
        </div>
      ) : null}

      <div className={`${compact ? "mt-3" : "mt-4"} flex items-center gap-2`}>
        <button type="button" onClick={onOpen} className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-xs font-black text-white transition ${active ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-950 hover:bg-blue-700"}`}>
          {active ? "Entrer dans la boîte" : attention && assignmentPinStatus(assignment) !== "active" ? "Vérifier l’accès" : "Déverrouiller"}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onDetails} className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-950" aria-label="Détails d’accès"><Shield className="h-4 w-4" /></button>
        <button type="button" onClick={onAudit} className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-950" aria-label="Historique"><History className="h-4 w-4" /></button>
      </div>
    </article>
  )
}

function CompactMeta({ label, value, tone = "slate" }: { label: string; value: string; tone?: Tone }) {
  const palette = TONE_STYLES[tone]
  return (
    <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
      <p className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400">{label}</p>
      <p className="mt-1 truncate text-[11px] font-black" style={{ color: tone === "slate" ? "#334155" : palette.text }}>{value}</p>
    </div>
  )
}

function ViewButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Grid2X2; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} title={label} className={`grid h-9 w-9 place-items-center rounded-xl transition ${active ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200" : "text-slate-400 hover:text-slate-700"}`}>
      <Icon className="h-4 w-4" />
    </button>
  )
}

function MailboxTable({ assignments, onOpen, onDetails }: { assignments: MailboxSummary[]; onOpen: (assignment: MailboxSummary) => void; onDetails: (assignment: MailboxSummary) => void }) {
  return (
    <div className="mt-4 overflow-hidden rounded-[22px] border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-left">
          <thead className="bg-slate-50">
            <tr className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
              <th className="px-4 py-3">Identité</th>
              <th className="px-4 py-3">Adresse</th>
              <th className="px-4 py-3">Accès</th>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Dernière activité</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment) => {
              const identity = mailboxIdentity(assignment)
              const palette = TONE_STYLES[identity.accent]
              const Icon = identity.icon
              const active = sessionIsActive(assignment)
              return (
                <tr key={`table-${assignment.id}`} className="border-t border-slate-100 text-sm transition hover:bg-slate-50/70">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-xl" style={{ color: palette.text, background: palette.soft }}><Icon className="h-4 w-4" /></div>
                      <div><p className="font-black text-slate-950">{identity.label}</p><p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: palette.text }}>{identity.shortLabel}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-slate-500">{mailboxEmail(assignment)}</td>
                  <td className="px-4 py-3.5 text-xs font-black text-slate-700">{roleLabel(assignment.role)}</td>
                  <td className="px-4 py-3.5"><StatusPill tone={assignmentTone(assignment)} label={sessionLabel(assignment)} /></td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-slate-500">{relativeDate(assignment.last_activity_at || assignment.last_unlock_at)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => onDetails(assignment)} className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600">Détails</button>
                      <button type="button" onClick={() => onOpen(assignment)} className={`h-9 rounded-xl px-3 text-xs font-black text-white ${active ? "bg-emerald-600" : "bg-slate-950"}`}>{active ? "Entrer" : "Déverrouiller"}</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SecurityIntelligenceRail({ summary, assignments, activeAssignments, latestAssignment, onLockAll, lockAllBusy, onAudit, onHelp }: { summary: SummaryState; assignments: MailboxSummary[]; activeAssignments: MailboxSummary[]; latestAssignment: MailboxSummary | null; onLockAll: () => void; lockAllBusy: boolean; onAudit: () => void; onHelp: () => void }) {
  const tone = securityTone(summary.security_status)
  const palette = TONE_STYLES[tone]
  return (
    <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
      <section className="rounded-[26px] border border-white/90 bg-white/95 p-5 shadow-[0_16px_48px_rgba(15,23,42,.08)] ring-1 ring-slate-200/70">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Intelligence sécurité</p>
            <h2 className="mt-2 text-xl font-black tracking-[-0.035em] text-slate-950">Posture d’accès</h2>
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-2xl" style={{ color: palette.text, background: palette.soft }}><ShieldCheck className="h-5 w-5" /></div>
        </div>
        <div className="mt-4 rounded-[20px] border p-4" style={{ borderColor: palette.border, background: palette.soft }}>
          <p className="text-xs font-black" style={{ color: palette.text }}>{securityLabel(summary.security_status)}</p>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
            {summary.locked_assignments_count ? `${summary.locked_assignments_count} identité(s) nécessitent une vérification.` : "Aucun signal critique détecté sur vos accès Email OS."}
          </p>
        </div>
        <div className="mt-4 grid gap-2">
          <RailMetric label="Boîtes attribuées" value={String(assignments.length)} />
          <RailMetric label="Sessions actives" value={String(activeAssignments.length)} tone={activeAssignments.length ? "emerald" : "slate"} />
          <RailMetric label="Dernière activité" value={relativeDate(summary.last_activity_at)} />
        </div>
      </section>

      <section className="rounded-[26px] border border-white/90 bg-white/95 p-5 shadow-[0_16px_48px_rgba(15,23,42,.08)] ring-1 ring-slate-200/70">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-blue-600" />
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Session actuelle</p>
        </div>
        {activeAssignments.length ? (
          <div className="mt-4 space-y-2.5">
            {activeAssignments.slice(0, 3).map((assignment) => {
              const identity = mailboxIdentity(assignment)
              return (
                <div key={`active-rail-${assignment.id}`} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                  <div className="flex items-center justify-between gap-2"><p className="truncate text-xs font-black text-emerald-900">{identity.label}</p><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_7px_rgba(16,185,129,.5)]" /></div>
                  <p className="mt-1 truncate text-[10px] font-semibold text-emerald-700">Expire {shortDate(assignment.session?.expires_at)}</p>
                </div>
              )
            })}
            <button type="button" onClick={onLockAll} disabled={lockAllBusy} className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 text-xs font-black text-rose-700 disabled:opacity-50">
              {lockAllBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />} Verrouiller toutes les sessions
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
            <LockKeyhole className="mx-auto h-5 w-5 text-slate-400" />
            <p className="mt-2 text-xs font-black text-slate-700">Aucune session active</p>
            <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">Déverrouillez une identité pour commencer.</p>
          </div>
        )}
      </section>

      <section className="rounded-[26px] border border-white/90 bg-white/95 p-5 shadow-[0_16px_48px_rgba(15,23,42,.08)] ring-1 ring-slate-200/70">
        <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-violet-600" /><p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Dernière activité</p></div>
        {latestAssignment ? (
          <div className="mt-4">
            <p className="text-sm font-black text-slate-950">{mailboxIdentity(latestAssignment).label}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{shortDate(latestAssignment.last_activity_at || latestAssignment.last_unlock_at)}</p>
            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-semibold leading-5 text-slate-600">{sessionLabel(latestAssignment)} · {roleLabel(latestAssignment.role)}</p>
          </div>
        ) : <p className="mt-4 text-xs font-semibold leading-5 text-slate-500">Aucune activité Email OS enregistrée pour le moment.</p>}
      </section>

      <section className="rounded-[26px] border border-slate-900 bg-[linear-gradient(180deg,#020617_0%,#0f172a_100%)] p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,.28)]">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-100/90">Actions rapides</p>
        <div className="mt-3 grid gap-2">
          <RailAction icon={History} label="Voir l’historique d’accès" onClick={onAudit} />
          <RailAction icon={HelpCircle} label="Comprendre la sécurité PIN" onClick={onHelp} />
        </div>
      </section>
    </aside>
  )
}

function RailMetric({ label, value, tone = "slate" }: { label: string; value: string; tone?: Tone }) {
  const palette = TONE_STYLES[tone]
  return <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"><span className="text-[10px] font-bold text-slate-500">{label}</span><span className="text-xs font-black" style={{ color: tone === "slate" ? "#0f172a" : palette.text }}>{value}</span></div>
}

function RailAction({ icon: Icon, label, onClick }: { icon: typeof History; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex h-11 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 text-left text-xs font-black !text-white transition hover:bg-white/10"><Icon className="h-4 w-4 text-blue-200" /><span className="flex-1 text-white">{label}</span><ChevronRight className="h-3.5 w-3.5 text-white/70" /></button>
}

function UnlockModal({ assignment, pin, showPin, busy, error, lockedUntil, inputRef, onPinChange, onToggleShow, onDigit, onBackspace, onClear, onSubmit, onClose }: { assignment: MailboxSummary; pin: string; showPin: boolean; busy: boolean; error: string | null; lockedUntil: string | null; inputRef: React.RefObject<HTMLInputElement | null>; onPinChange: (value: string) => void; onToggleShow: () => void; onDigit: (digit: string) => void; onBackspace: () => void; onClear: () => void; onSubmit: () => void; onClose: () => void }) {
  const identity = mailboxIdentity(assignment)
  const palette = TONE_STYLES[identity.accent]
  const Icon = identity.icon
  const digits = Array.from({ length: 6 }, (_, index) => pin[index] || "")
  const lockedTimestamp = lockedUntil ? new Date(lockedUntil).getTime() : 0
  const locked = (Number.isFinite(lockedTimestamp) && lockedTimestamp > Date.now()) || assignmentPinStatus(assignment) === "locked"

  return (
    <div className="fixed inset-0 z-[1200] grid place-items-center bg-slate-950/65 p-3" role="dialog" aria-modal="true" aria-label={`Déverrouiller ${identity.label}`}>
      <div className="max-h-[95vh] w-full max-w-[620px] overflow-y-auto rounded-[32px] border border-white/20 bg-white shadow-[0_40px_140px_rgba(15,23,42,.38)]">
        <div className="relative overflow-hidden border-b border-slate-100 bg-[linear-gradient(135deg,#ffffff,#f5f9ff_55%,#eef4ff)] px-6 py-6 sm:px-7">
          <div className="absolute right-0 top-0 h-36 w-36 rounded-full blur-3xl" style={{ background: palette.ring }} />
          <button type="button" onClick={onClose} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm" aria-label="Fermer"><X className="h-4 w-4" /></button>
          <div className="relative flex items-start gap-4 pr-12">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl" style={{ color: palette.text, background: palette.soft, boxShadow: `0 0 0 7px ${palette.ring}` }}><Icon className="h-6 w-6" /></div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: palette.text }}>Authentification sécurisée</p>
              <h2 className="mt-2 text-[32px] font-black tracking-[-0.05em] !text-slate-950">Déverrouiller {identity.label}</h2>
              <p className="mt-1 truncate text-sm font-bold text-slate-700">{mailboxEmail(assignment)}</p>
            </div>
          </div>
          <p className="relative mt-5 text-[15px] font-semibold leading-7 text-slate-700">{identity.purpose}</p>
        </div>

        <div className="grid gap-5 px-6 py-6 sm:grid-cols-[minmax(0,1fr)_210px] sm:px-7">
          <div>
            {locked ? <InlinePanel tone="rose" icon={ShieldAlert} title="Accès temporairement verrouillé" text="Plusieurs tentatives ont été refusées. Attendez la fin du verrouillage ou contactez un administrateur Email OS." /> : null}
            {error ? <div className="mb-4"><InlinePanel tone="rose" icon={AlertTriangle} title="Déverrouillage refusé" text={error} /></div> : null}

            <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="email-os-pin" className="text-[10px] font-black uppercase tracking-[0.17em] text-slate-500">PIN sécurisé à 6 chiffres</label>
                <button type="button" onClick={onToggleShow} className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-500 hover:text-slate-950">{showPin ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}{showPin ? "Masquer" : "Afficher"}</button>
              </div>
              <input
                ref={inputRef}
                id="email-os-pin"
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={pin}
                onChange={(event) => onPinChange(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter" && pin.length === 6 && !busy && !locked) onSubmit() }}
                className="sr-only"
              />
              <button type="button" onClick={() => inputRef.current?.focus()} className="mt-4 grid w-full grid-cols-6 gap-2" aria-label="Saisir le PIN">
                {digits.map((digit, index) => (
                  <span key={`pin-digit-${index}`} className={`grid h-13 place-items-center rounded-xl border text-xl font-black transition ${digit ? "border-blue-300 bg-white text-slate-950 shadow-sm" : "border-slate-200 bg-white/70 text-slate-300"}`}>
                    {digit ? (showPin ? digit : "•") : ""}
                  </span>
                ))}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 sm:hidden">
              {["1","2","3","4","5","6","7","8","9","0"].map((digit) => <button key={digit} type="button" onClick={() => onDigit(digit)} className="h-12 rounded-xl border border-slate-200 bg-white text-base font-black text-slate-950 shadow-sm">{digit}</button>)}
              <button type="button" onClick={onClear} className="h-12 rounded-xl border border-slate-200 bg-slate-50 text-xs font-black text-slate-600">Effacer</button>
              <button type="button" onClick={onBackspace} className="h-12 rounded-xl border border-slate-200 bg-slate-50 text-base font-black text-slate-600">⌫</button>
            </div>

            <button type="button" onClick={onSubmit} disabled={busy || locked || pin.length !== 6} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
              {busy ? "Création de la session…" : "Déverrouiller en toute sécurité"}
            </button>
          </div>

          <aside className="space-y-3">
            <PolicyCard icon={Clock3} label="Durée de session" value="4 heures d’inactivité" />
            <PolicyCard icon={ShieldCheck} label="Niveau d’accès" value={roleLabel(assignment.role)} />
            <PolicyCard icon={KeyRound} label="Tentatives" value={`${assignment.failed_pin_attempts || 0} sur 5`} tone={(assignment.failed_pin_attempts || 0) ? "amber" : "emerald"} />
            <div className="rounded-[20px] border border-blue-200 bg-blue-50 p-3 text-[11px] font-semibold leading-5 text-blue-800">
              Le PIN n’est jamais affiché, conservé dans le navigateur ou envoyé par email.
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function PolicyCard({ icon: Icon, label, value, tone = "blue" }: { icon: typeof Clock3; label: string; value: string; tone?: Tone }) {
  const palette = TONE_STYLES[tone]
  return <div className="rounded-[18px] border border-slate-200 bg-white p-3"><div className="flex items-center gap-2"><Icon className="h-3.5 w-3.5" style={{ color: palette.text }} /><p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p></div><p className="mt-2 text-xs font-black text-slate-800">{value}</p></div>
}

function InlinePanel({ tone, icon: Icon, title, text }: { tone: Tone; icon: typeof AlertTriangle; title: string; text: string }) {
  const palette = TONE_STYLES[tone]
  return <div className="mb-4 rounded-[18px] border p-3" style={{ borderColor: palette.border, background: palette.soft }}><div className="flex items-start gap-2.5"><Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: palette.text }} /><div><p className="text-xs font-black" style={{ color: palette.text }}>{title}</p><p className="mt-1 text-[11px] font-semibold leading-5 text-slate-600">{text}</p></div></div></div>
}

function AccessDetailsDrawer({ assignment, onClose, onOpen, onAudit }: { assignment: MailboxSummary; onClose: () => void; onOpen: () => void; onAudit: () => void }) {
  const identity = mailboxIdentity(assignment)
  const palette = TONE_STYLES[identity.accent]
  const Icon = identity.icon
  const permissions = permissionRows(assignment.permissions)
  return (
    <DrawerShell title="Dossier d’accès Email OS" subtitle={identity.label} onClose={onClose}>
      <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff,#f7fbff)] p-5">
        <div className="flex items-start gap-4">
          <div className="grid h-13 w-13 shrink-0 place-items-center rounded-2xl" style={{ color: palette.text, background: palette.soft }}><Icon className="h-5 w-5" /></div>
          <div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: palette.text }}>{identity.shortLabel}</p><h3 className="mt-1 text-xl font-black text-slate-950">{identity.label}</h3><p className="mt-1 truncate text-xs font-semibold text-slate-500">{mailboxEmail(assignment)}</p></div>
        </div>
        <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">{identity.purpose}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <DetailMetric label="Rôle" value={roleLabel(assignment.role)} />
        <DetailMetric label="État session" value={sessionLabel(assignment)} tone={assignmentTone(assignment)} />
        <DetailMetric label="PIN" value={assignmentPinStatus(assignment).replaceAll("_", " ") || "indisponible"} />
        <DetailMetric label="Tentatives" value={`${assignment.failed_pin_attempts || 0} / 5`} tone={(assignment.failed_pin_attempts || 0) ? "amber" : "slate"} />
        <DetailMetric label="Attribuée le" value={shortDate(assignment.assigned_at)} />
        <DetailMetric label="Dernière activité" value={shortDate(assignment.last_activity_at || assignment.last_unlock_at)} />
      </div>

      <section className="mt-5">
        <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-black text-slate-950">Permissions autorisées</h3><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500">{permissions.length}</span></div>
        <div className="mt-3 grid gap-2">
          {permissions.length ? permissions.map((permission) => <div key={permission} className="flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2.5 text-xs font-bold text-emerald-800"><Check className="h-3.5 w-3.5" />{permission}</div>) : <p className="rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-500">Aucune permission active.</p>}
        </div>
      </section>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={onAudit} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700"><History className="h-4 w-4" />Historique sécurité</button>
        <button type="button" onClick={onOpen} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 text-xs font-black text-white">{sessionIsActive(assignment) ? "Entrer dans la boîte" : assignmentPinStatus(assignment) === "active" ? "Déverrouiller" : "Vérifier l’accès"}<ArrowRight className="h-4 w-4" /></button>
      </div>
    </DrawerShell>
  )
}

function DetailMetric({ label, value, tone = "slate" }: { label: string; value: string; tone?: Tone }) {
  const palette = TONE_STYLES[tone]
  return <div className="rounded-[18px] border border-slate-200 bg-white p-3"><p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">{label}</p><p className="mt-1.5 text-xs font-black" style={{ color: tone === "slate" ? "#0f172a" : palette.text }}>{value}</p></div>
}

function AuditDrawer({ rows, loading, error, onRefresh, onClose }: { rows: AuditRow[]; loading: boolean; error: string | null; onRefresh: () => void; onClose: () => void }) {
  return (
    <DrawerShell title="Historique de sécurité" subtitle="Accès et sessions Email OS" onClose={onClose} wide>
      <div className="flex items-center justify-between gap-3 rounded-[20px] border border-blue-200 bg-blue-50 p-4">
        <div><p className="text-xs font-black text-blue-900">Traçabilité personnelle</p><p className="mt-1 text-[11px] font-semibold leading-5 text-blue-700">Seuls les événements liés à votre profil sont affichés.</p></div>
        <button type="button" onClick={onRefresh} className="grid h-9 w-9 place-items-center rounded-xl bg-white text-blue-700 shadow-sm"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
      </div>
      {error ? <div className="mt-4"><InlinePanel tone="rose" icon={AlertTriangle} title="Historique indisponible" text={error} /></div> : null}
      <div className="mt-4 space-y-2.5">
        {loading ? Array.from({ length: 6 }, (_, index) => <div key={`audit-skeleton-${index}`} className="h-20 animate-pulse rounded-2xl bg-slate-100" />) : rows.length ? rows.map((row) => <AuditRowCard key={row.id} row={row} />) : <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><History className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-3 text-sm font-black text-slate-700">Aucun événement récent</p></div>}
      </div>
    </DrawerShell>
  )
}

function AuditRowCard({ row }: { row: AuditRow }) {
  const severity = cleanLower(row.severity)
  const tone: Tone = severity === "critical" ? "rose" : severity === "warning" ? "amber" : cleanLower(row.event_result) === "success" ? "emerald" : "blue"
  const palette = TONE_STYLES[tone]
  return (
    <article className="rounded-[20px] border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: palette.solid, boxShadow: `0 0 0 5px ${palette.ring}` }} />
        <div className="min-w-0 flex-1"><p className="text-sm font-black text-slate-950">{eventLabel(row.event_type)}</p><p className="mt-1 text-xs font-semibold text-slate-500">{shortDate(row.created_at)}</p></div>
        <StatusPill tone={tone} label={clean(row.event_result) || "enregistré"} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
        {row.mailbox_id ? <span className="rounded-lg bg-slate-50 px-2 py-1">Boîte : {row.mailbox_id}</span> : null}
        {row.ip_address ? <span className="rounded-lg bg-slate-50 px-2 py-1">IP : {row.ip_address}</span> : null}
      </div>
    </article>
  )
}

function HelpDrawer({ onClose }: { onClose: () => void }) {
  return (
    <DrawerShell title="Comprendre la passerelle sécurisée" subtitle="Principes d’accès Email OS" onClose={onClose}>
      <div className="space-y-3">
        <HelpStep number="01" icon={UserRound} title="Identité attribuée" text="Vous ne voyez que les boîtes explicitement assignées à votre profil et à votre rôle." />
        <HelpStep number="02" icon={KeyRound} title="PIN dédié" text="Chaque boîte possède son propre PIN de sécurité à six chiffres. Le PIN ne doit jamais être partagé." />
        <HelpStep number="03" icon={ShieldCheck} title="Session isolée" text="Après déverrouillage, toutes les actions restent strictement limitées à cette identité de communication." />
        <HelpStep number="04" icon={Clock3} title="Expiration automatique" text="La session expire après quatre heures d’inactivité afin de protéger les postes partagés." />
        <HelpStep number="05" icon={History} title="Traçabilité" text="Les ouvertures, tentatives, verrouillages et actions sensibles sont enregistrés dans l’audit Email OS." />
      </div>
      <div className="mt-5 rounded-[22px] border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><p className="text-sm font-black text-amber-900">Bon réflexe de sécurité</p><p className="mt-1 text-xs font-semibold leading-5 text-amber-800">Avant de quitter votre poste, utilisez « Verrouiller toutes les sessions ».</p></div></div>
      </div>
    </DrawerShell>
  )
}

function HelpStep({ number, icon: Icon, title, text }: { number: string; icon: typeof UserRound; title: string; text: string }) {
  return <div className="rounded-[20px] border border-slate-200 bg-white p-4"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700"><Icon className="h-4 w-4" /></div><div><div className="flex items-center gap-2"><span className="text-[9px] font-black tracking-[0.16em] text-blue-600">{number}</span><h3 className="text-sm font-black text-slate-950">{title}</h3></div><p className="mt-1.5 text-xs font-semibold leading-5 text-slate-600">{text}</p></div></div></div>
}

function DrawerShell({ title, subtitle, onClose, children, wide = false }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-[1150] flex justify-end bg-slate-950/55-sm" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Fermer" />
      <aside className={`relative h-full w-full overflow-y-auto border-l border-white/20 bg-slate-50 shadow-[-30px_0_100px_rgba(15,23,42,.28)] ${wide ? "max-w-[620px]" : "max-w-[520px]"}`}>
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 py-5">
          <div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">Email OS · Accès sécurisé</p><h2 className="mt-2 text-xl font-black tracking-[-0.035em] text-slate-950">{title}</h2><p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p></div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm"><X className="h-4 w-4" /></button>
        </header>
        <div className="p-5">{children}</div>
      </aside>
    </div>
  )
}

function MailboxGateSkeleton() {
  return (
    <main className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
      <div className="space-y-5">
        <div className="h-52 animate-pulse rounded-[28px] border border-white bg-white/80" />
        <div className="rounded-[28px] border border-white bg-white/90 p-5"><div className="h-12 animate-pulse rounded-2xl bg-slate-100" /><div className="mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={`mailbox-skeleton-${index}`} className="h-72 animate-pulse rounded-[25px] bg-slate-100" />)}</div></div>
      </div>
      <div className="h-[540px] animate-pulse rounded-[28px] border border-white bg-white/80" />
    </main>
  )
}

function NoAccessState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <section className="grid min-h-[520px] place-items-center rounded-[32px] border border-white/90 bg-white/95 p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,.08)] ring-1 ring-slate-200/70">
      <div className="max-w-xl"><div className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-slate-950 text-white shadow-xl shadow-slate-950/20"><LockKeyhole className="h-7 w-7" /></div><h2 className="mt-5 text-3xl font-black tracking-[-0.045em] text-slate-950">Aucune identité Email OS attribuée</h2><p className="mt-3 text-sm font-semibold leading-7 text-slate-600">Votre profil est authentifié, mais aucune boîte de communication n’est encore assignée. Un administrateur Email OS doit vous attribuer une identité et configurer son accès PIN.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/dashboard" className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-xs font-black text-white">Retour au tableau de bord</Link><button type="button" onClick={onRefresh} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-xs font-black text-slate-700"><RefreshCw className="h-4 w-4" />Actualiser</button></div></div>
    </section>
  )
}
