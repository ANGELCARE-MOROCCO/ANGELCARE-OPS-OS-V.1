"use client"

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  AlertTriangle,
  Archive,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Boxes,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Database,
  Eye,
  FileClock,
  FileSearch,
  FileText,
  Filter,
  Fingerprint,
  Gavel,
  History,
  Info,
  Layers3,
  LayoutDashboard,
  ListChecks,
  Loader2,
  LockKeyhole,
  RefreshCw,
  RotateCcw,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Table2,
  Trash2,
  UserRoundX,
  Users,
  X,
  XCircle,
} from "lucide-react"

type GenericRow = Record<string, any>

type EntityType = "ambassador" | "candidate" | "lead"
type WorkspaceKey = "overview" | "requests" | "bulk" | "audit" | "policies"
type EntityAction = "preview" | "archive" | "restore" | "anonymize" | "request" | "delete"
type RequestAction = "approve" | "reject" | "execute"
type BulkAction = "preflight" | "approve" | "reject" | "execute"
type DrawerKind = "request" | "event" | "job"
type DrawerTab = "overview" | "data" | "dependencies" | "decision" | "evidence"

type DashboardPayload = {
  actor: GenericRow
  inventory: Record<EntityType, GenericRow[]>
  requests: GenericRow[]
  events: GenericRow[]
  bulkJobs: GenericRow[]
  bulkItems: GenericRow[]
  adapters: GenericRow[]
  authorities: GenericRow[]
  capabilities: {
    bulkSchemaReady: boolean
    authoritiesReady: boolean
  }
}

type DependencyPreview = {
  entityType: EntityType
  entityId: string
  entity: GenericRow
  lifecycleState: string
  dependencies: Array<{
    key: string
    label: string
    table: string
    available: boolean
    count: number
    blocking: boolean
  }>
  blockerCount: number
  canPermanentDelete: boolean
  recommendedAction: string
  snapshotHash: string
  generatedAt?: string
}

type ModalState =
  | { kind: "entity"; action: Exclude<EntityAction, "preview"> }
  | { kind: "request"; action: RequestAction; request: GenericRow }
  | { kind: "bulk-create" }
  | { kind: "bulk-action"; action: BulkAction; job: GenericRow }
  | null

type DrawerState =
  | { kind: "request"; record: GenericRow }
  | { kind: "event"; record: GenericRow }
  | { kind: "job"; record: GenericRow }
  | null

const ENTITY_LABELS: Record<EntityType, string> = {
  ambassador: "Ambassadeurs",
  candidate: "Candidats",
  lead: "Leads",
}

const ENTITY_SINGULAR: Record<EntityType, string> = {
  ambassador: "Ambassadeur",
  candidate: "Candidat",
  lead: "Lead",
}

const STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  archived: "Archivé",
  anonymized: "Anonymisé",
  anonymised: "Anonymisé",
  requested: "Demandée",
  approved: "Approuvée",
  rejected: "Rejetée",
  blocked: "Bloquée",
  executing: "En exécution",
  completed: "Terminée",
  failed: "Échec contrôlé",
  pending: "En attente",
  cancelled: "Annulée",
  draft: "Préparation",
  analysis: "Analyse",
  review_required: "Revue requise",
  ready: "Prête",
  partial: "Partiellement terminée",
  skipped: "Ignorée",
}

const EVENT_LABELS: Record<string, string> = {
  deletion_requested: "Demande de suppression créée",
  deletion_approved: "Demande approuvée",
  deletion_rejected: "Demande rejetée",
  deletion_request_superseded: "Demande remplacée",
  deletion_execution_reopened: "Exécution rouverte",
  permanent_deletion_completed: "Suppression permanente terminée",
  bulk_purge_created: "Opération groupée créée",
  bulk_purge_preflight_completed: "Analyse groupée terminée",
  bulk_purge_approved: "Opération groupée approuvée",
  bulk_purge_rejected: "Opération groupée rejetée",
  bulk_purge_execution_completed: "Exécution groupée terminée",
}

const ACTION_COPY: Record<Exclude<EntityAction, "preview">, {
  title: string
  description: string
  commit: string
  success: string
  tone: "navy" | "amber" | "red"
}> = {
  archive: {
    title: "Archiver le dossier",
    description: "Retirer le dossier du flux actif sans effacer son historique gouverné.",
    commit: "Confirmer l’archivage",
    success: "Dossier archivé avec succès.",
    tone: "amber",
  },
  restore: {
    title: "Restaurer le dossier",
    description: "Réintégrer le dossier archivé dans son cycle opérationnel autorisé.",
    commit: "Restaurer le dossier",
    success: "Dossier restauré avec succès.",
    tone: "navy",
  },
  anonymize: {
    title: "Autoriser l’anonymisation",
    description: "Neutraliser les informations d’identité tout en conservant les preuves autorisées.",
    commit: "Exécuter l’anonymisation",
    success: "Dossier anonymisé avec succès.",
    tone: "red",
  },
  request: {
    title: "Demander la suppression permanente",
    description: "Créer une demande gouvernée soumise à l’analyse, la décision et la preuve immuable.",
    commit: "Soumettre la demande",
    success: "Demande de suppression permanente créée.",
    tone: "red",
  },
  delete: {
    title: "Suppression permanente directe",
    description: "Action destructive irréversible réservée aux dossiers sans dépendance bloquante.",
    commit: "Autoriser la suppression",
    success: "Dossier supprimé définitivement.",
    tone: "red",
  },
}

const WORKSPACES: Array<{
  key: WorkspaceKey
  label: string
  eyebrow: string
  icon: typeof LayoutDashboard
}> = [
  { key: "overview", label: "Vue de gouvernance", eyebrow: "Posture", icon: LayoutDashboard },
  { key: "requests", label: "Registre des demandes", eyebrow: "Décisions", icon: Table2 },
  { key: "bulk", label: "Opérations groupées", eyebrow: "Effacement", icon: Boxes },
  { key: "audit", label: "Journal d’audit", eyebrow: "Preuve", icon: History },
  { key: "policies", label: "Politiques et autorités", eyebrow: "Contrôle", icon: Gavel },
]

const REQUEST_STATUSES = [
  "all",
  "requested",
  "approved",
  "executing",
  "completed",
  "rejected",
  "blocked",
]

function text(value: unknown) {
  return String(value ?? "").trim()
}

function lower(value: unknown) {
  return text(value).toLowerCase()
}

function formatDate(value: unknown) {
  const raw = text(value)
  if (!raw) return "—"
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return parsed.toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function statusLabel(value: unknown) {
  const key = lower(value)
  return STATUS_LABELS[key] || (key ? key.replaceAll("_", " ") : "—")
}

function statusClass(value: unknown) {
  const status = lower(value)
  if (["completed", "active", "ready"].includes(status)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }
  if (["approved", "executing", "analysis"].includes(status)) {
    return "border-blue-200 bg-blue-50 text-blue-700"
  }
  if (["blocked", "failed"].includes(status)) {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }
  if (["rejected", "cancelled"].includes(status)) {
    return "border-red-200 bg-red-50 text-red-700"
  }
  if (["archived", "anonymized", "anonymised", "skipped"].includes(status)) {
    return "border-slate-200 bg-slate-100 text-slate-700"
  }
  if (["review_required", "partial"].includes(status)) {
    return "border-orange-200 bg-orange-50 text-orange-700"
  }
  return "border-amber-200 bg-amber-50 text-amber-700"
}

function eventLabel(value: unknown) {
  const key = lower(value)
  return EVENT_LABELS[key] || key.replaceAll("_", " ") || "Événement"
}

function eventCategory(value: unknown) {
  const key = lower(value)
  if (key.includes("bulk")) return "bulk"
  if (key.includes("approved") || key.includes("rejected")) return "decision"
  if (key.includes("completed") || key.includes("execute")) return "execution"
  if (key.includes("requested") || key.includes("created")) return "request"
  return "other"
}

function entityKey(entityType: EntityType, entityId: unknown) {
  return `${entityType}:${text(entityId)}`
}

function bulkConfirmation(job: GenericRow) {
  return text(job.confirmation_code) || `PURGE-BULK-${text(job.id).replaceAll("-", "").slice(-8).toUpperCase()}`
}

function requestConfirmation(request: GenericRow) {
  return `DELETE-${text(request.entity_id).slice(-8).toUpperCase()}`
}

function jsonPreview(value: unknown) {
  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch {
    return text(value) || "{}"
  }
}

function StatusBadge({ value }: { value: unknown }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${statusClass(value)}`}>
      {statusLabel(value)}
    </span>
  )
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "navy",
}: {
  label: string
  value: number | string
  detail: string
  icon: typeof Database
  tone?: "navy" | "blue" | "green" | "red" | "amber"
}) {
  const toneClass = {
    navy: "bg-[#071d3b] text-white",
    blue: "bg-blue-50 text-blue-900",
    green: "bg-emerald-50 text-emerald-900",
    red: "bg-rose-50 text-rose-900",
    amber: "bg-amber-50 text-amber-900",
  }[tone]

  return (
    <article className={`rounded-[22px] border border-slate-200 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.045)] ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-70">{label}</p>
          <p className="mt-2 text-3xl font-black tabular-nums tracking-tight">{value}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-2xl border border-current/10 bg-white/55 text-current">
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 text-xs font-semibold leading-5 opacity-70">{detail}</p>
    </article>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof FileSearch
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="grid min-h-52 place-items-center rounded-[22px] border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
      <div>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-blue-700 shadow-sm">
          <Icon size={22} />
        </span>
        <h3 className="mt-4 text-base font-black text-slate-950">{title}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  )
}

function Modal({
  title,
  description,
  tone = "navy",
  onClose,
  children,
}: {
  title: string
  description: string
  tone?: "navy" | "amber" | "red"
  onClose: () => void
  children: ReactNode
}) {
  const headerTone = {
    navy: "bg-[#071d3b] text-white",
    amber: "bg-amber-500 text-slate-950",
    red: "bg-rose-700 text-white",
  }[tone]

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6">
      <div role="dialog" aria-modal="true" className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        <header className={`flex items-start justify-between gap-5 px-6 py-5 ${headerTone}`}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-75">ANGELCARE · Gouvernance des données</p>
            <h2 className="mt-2 text-xl font-black tracking-tight">{title}</h2>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 opacity-85">{description}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 text-current transition hover:bg-white/20">
            <X size={18} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}

function Drawer({
  title,
  eyebrow,
  onClose,
  children,
}: {
  title: string
  eyebrow: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-[125] bg-slate-950/45 backdrop-blur-[2px]" onMouseDown={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
        className="absolute inset-y-0 right-0 flex w-full max-w-[820px] flex-col overflow-hidden border-l border-slate-200 bg-[#f7f9fc] shadow-[-24px_0_70px_rgba(15,23,42,0.18)]"
      >
        <header className="border-b border-white/10 bg-[#071d3b] px-5 py-5 text-white sm:px-7">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">{eyebrow}</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">{title}</h2>
            </div>
            <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10 hover:bg-white/20" aria-label="Fermer">
              <X size={18} />
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
      </aside>
    </div>
  )
}

async function lifecycleApi(path: string, body?: GenericRow) {
  const response = await fetch(`/api/market-os/ambassadors/data-lifecycle${path}`, {
    method: body ? "POST" : "GET",
    credentials: "include",
    cache: "no-store",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok || payload.ok === false) {
    throw new Error(text(payload.error || payload.message) || `Erreur HTTP ${response.status}`)
  }

  return payload.data
}

export default function AmbassadorDataLifecycleControlCenter() {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null)
  const [workspace, setWorkspace] = useState<WorkspaceKey>("overview")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [entityType, setEntityType] = useState<EntityType>("ambassador")
  const [selectedId, setSelectedId] = useState("")
  const [inventoryQuery, setInventoryQuery] = useState("")
  const [preview, setPreview] = useState<DependencyPreview | null>(null)
  const [drawerPreview, setDrawerPreview] = useState<DependencyPreview | null>(null)
  const [drawerPreviewLoading, setDrawerPreviewLoading] = useState(false)

  const [requestQuery, setRequestQuery] = useState("")
  const [requestStatus, setRequestStatus] = useState("all")
  const [requestEntityType, setRequestEntityType] = useState("all")
  const [eventQuery, setEventQuery] = useState("")
  const [eventCategoryFilter, setEventCategoryFilter] = useState("all")
  const [eventEntityFilter, setEventEntityFilter] = useState("all")

  const [reasonCode, setReasonCode] = useState("administrative_request")
  const [reason, setReason] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [bulkTitle, setBulkTitle] = useState("Suppression groupée gouvernée")
  const [bulkSelection, setBulkSelection] = useState<string[]>([])

  const [modal, setModal] = useState<ModalState>(null)
  const [drawer, setDrawer] = useState<DrawerState>(null)
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("overview")

  const loadDashboard = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await lifecycleApi("")
      setDashboard(data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Chargement impossible.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboard()
  }, [])

  useEffect(() => {
    if (!modal && !drawer) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModal(null)
        setDrawer(null)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [modal, drawer])

  useEffect(() => {
    setSelectedId("")
    setPreview(null)
  }, [entityType])

  const inventory = dashboard?.inventory?.[entityType] || []

  const filteredInventory = useMemo(() => {
    const query = lower(inventoryQuery)
    if (!query) return inventory
    return inventory.filter((item) =>
      [
        item.label,
        item.email,
        item.phone,
        item.city,
        item.reference,
        item.businessStatus,
        item.lifecycleState,
        item.id,
      ]
        .map(lower)
        .some((value) => value.includes(query)),
    )
  }, [inventory, inventoryQuery])

  const selected = inventory.find((item) => text(item.id) === selectedId)
  const previewMatchesSelection = Boolean(preview && preview.entityType === entityType && preview.entityId === selectedId)

  const allInventory = useMemo(() => {
    const rows: Array<GenericRow & { entityType: EntityType }> = []
    for (const type of ["ambassador", "candidate", "lead"] as EntityType[]) {
      for (const item of dashboard?.inventory?.[type] || []) {
        rows.push({ ...item, entityType: type })
      }
    }
    return rows
  }, [dashboard])

  const selectedBulkRecords = useMemo(() => {
    const selectedKeys = new Set(bulkSelection)
    return allInventory.filter((item) => selectedKeys.has(entityKey(item.entityType, item.id)))
  }, [allInventory, bulkSelection])

  const duplicateCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const request of dashboard?.requests || []) {
      const key = entityKey(lower(request.entity_type) as EntityType, request.entity_id)
      counts.set(key, (counts.get(key) || 0) + 1)
    }
    return counts
  }, [dashboard])

  const filteredRequests = useMemo(() => {
    const query = lower(requestQuery)
    return (dashboard?.requests || []).filter((request) => {
      const matchesStatus = requestStatus === "all" || lower(request.status) === requestStatus
      const matchesType = requestEntityType === "all" || lower(request.entity_type) === requestEntityType
      const matchesQuery = !query || [
        request.display_label,
        request.entity_id,
        request.id,
        request.requested_by_display_name,
        request.approved_by_display_name,
        request.executed_by_display_name,
        request.reason_code,
        request.reason_detail,
        request.status,
      ].map(lower).some((value) => value.includes(query))
      return matchesStatus && matchesType && matchesQuery
    })
  }, [dashboard, requestQuery, requestStatus, requestEntityType])

  const filteredEvents = useMemo(() => {
    const query = lower(eventQuery)
    return (dashboard?.events || []).filter((event) => {
      const category = eventCategory(event.event_type)
      const matchesCategory = eventCategoryFilter === "all" || category === eventCategoryFilter
      const matchesEntity = eventEntityFilter === "all" || lower(event.entity_type) === eventEntityFilter
      const matchesQuery = !query || [
        event.event_type,
        eventLabel(event.event_type),
        event.actor_display_name,
        event.entity_id,
        event.request_id,
        jsonPreview(event.details),
      ].map(lower).some((value) => value.includes(query))
      return matchesCategory && matchesEntity && matchesQuery
    })
  }, [dashboard, eventQuery, eventCategoryFilter, eventEntityFilter])

  const requestStatistics = useMemo(() => {
    const requests = dashboard?.requests || []
    return {
      requested: requests.filter((item) => lower(item.status) === "requested").length,
      approved: requests.filter((item) => lower(item.status) === "approved").length,
      blocked: requests.filter((item) => lower(item.status) === "blocked").length,
      completed: requests.filter((item) => lower(item.status) === "completed").length,
      rejected: requests.filter((item) => lower(item.status) === "rejected").length,
    }
  }, [dashboard])

  const jobItems = (jobId: unknown) => (dashboard?.bulkItems || []).filter((item) => text(item.job_id) === text(jobId))

  const resetActionFields = () => {
    setReason("")
    setConfirmation("")
  }

  const closeModal = () => {
    setModal(null)
    resetActionFields()
  }

  const closeDrawer = () => {
    setDrawer(null)
    setDrawerPreview(null)
    setDrawerTab("overview")
  }

  const toggleBulkSelection = (type: EntityType, item: GenericRow) => {
    const key = entityKey(type, item.id)
    setBulkSelection((current) => current.includes(key) ? current.filter((value) => value !== key) : [...current, key])
  }

  const openRequestDrawer = async (request: GenericRow) => {
    setDrawer({ kind: "request", record: request })
    setDrawerTab("overview")
    setDrawerPreview(null)
    setDrawerPreviewLoading(true)
    try {
      const data = await lifecycleApi("/preview", {
        entityType: request.entity_type,
        entityId: request.entity_id,
      })
      setDrawerPreview(data)
    } catch {
      setDrawerPreview(null)
    } finally {
      setDrawerPreviewLoading(false)
    }
  }

  const runEntityAction = async (action: EntityAction) => {
    if (!selectedId) {
      setError("Sélectionnez d’abord un dossier.")
      return
    }

    if (action !== "preview" && reason.trim().length < 5) {
      setError("Saisissez une justification opérationnelle claire.")
      return
    }

    const exactRecordName = text(selected?.label)
    if (action === "delete" && confirmation.trim() !== exactRecordName) {
      setError(`Saisissez exactement le nom : ${exactRecordName}`)
      return
    }

    setBusy(action)
    setError("")
    setSuccess("")

    try {
      const data = await lifecycleApi(`/${action}`, {
        entityType,
        entityId: selectedId,
        reasonCode,
        reason: action === "preview" ? "Controlled dependency preview" : reason,
        idempotencyKey: crypto.randomUUID(),
        confirmation,
      })

      if (action === "preview") {
        setPreview(data)
      } else {
        setSuccess(ACTION_COPY[action].success)
        setPreview(null)
        setModal(null)
        resetActionFields()
        if (action === "delete") setSelectedId("")
        await loadDashboard()
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Action refusée.")
    } finally {
      setBusy("")
    }
  }

  const decideRequest = async (request: GenericRow, action: RequestAction) => {
    const requestId = text(request.id)
    if (!requestId) return

    if (reason.trim().length < 5) {
      setError("Saisissez une note de décision ou d’exécution.")
      return
    }

    const expectedConfirmation = requestConfirmation(request)
    if (action === "execute" && confirmation !== expectedConfirmation) {
      setError(`Saisissez exactement ${expectedConfirmation}.`)
      return
    }

    setBusy(`${action}:${requestId}`)
    setError("")
    setSuccess("")

    try {
      await lifecycleApi(`/requests/${requestId}/${action}`, { reason, confirmation })
      setSuccess(action === "execute" ? "Purge transactionnelle terminée." : action === "approve" ? "Demande approuvée." : "Demande rejetée.")
      setModal(null)
      closeDrawer()
      resetActionFields()
      await loadDashboard()
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "Décision refusée.")
    } finally {
      setBusy("")
    }
  }

  const createBulkJob = async () => {
    if (selectedBulkRecords.length < 1) {
      setError("Sélectionnez au moins un dossier gouverné.")
      return
    }
    if (reason.trim().length < 5) {
      setError("Saisissez une justification claire pour l’opération groupée.")
      return
    }

    setBusy("bulk-create")
    setError("")
    setSuccess("")
    try {
      await lifecycleApi("/bulk/jobs", {
        title: bulkTitle,
        reasonCode,
        reason,
        selection: selectedBulkRecords.map((item) => ({
          entityType: item.entityType,
          entityId: text(item.id),
          displayLabel: text(item.label),
        })),
      })
      setSuccess("Opération groupée créée. Lancez maintenant l’analyse de dépendances.")
      setBulkSelection([])
      setModal(null)
      resetActionFields()
      setWorkspace("bulk")
      await loadDashboard()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Création groupée refusée.")
    } finally {
      setBusy("")
    }
  }

  const runBulkAction = async (job: GenericRow, action: BulkAction) => {
    if (action !== "preflight" && reason.trim().length < 5) {
      setError("Saisissez une note de décision ou d’exécution.")
      return
    }

    const expectedConfirmation = bulkConfirmation(job)
    if (action === "execute" && confirmation.trim().toUpperCase() !== expectedConfirmation.toUpperCase()) {
      setError(`Saisissez exactement ${expectedConfirmation}.`)
      return
    }

    setBusy(`bulk-${action}:${text(job.id)}`)
    setError("")
    setSuccess("")
    try {
      await lifecycleApi(`/bulk/jobs/${text(job.id)}/${action}`, {
        reason: action === "preflight" ? "Analyse de dépendances et des adaptateurs enregistrés." : reason,
        confirmation,
      })
      setSuccess(
        action === "preflight" ? "Analyse groupée terminée." :
          action === "approve" ? "Opération groupée approuvée." :
            action === "reject" ? "Opération groupée rejetée." :
              "Exécution groupée terminée avec résultat contrôlé.",
      )
      setModal(null)
      closeDrawer()
      resetActionFields()
      await loadDashboard()
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : "Action groupée refusée.")
    } finally {
      setBusy("")
    }
  }

  if (loading && !dashboard) {
    return (
      <main className="min-w-0 flex-1 bg-[#f4f7fb] p-5 xl:p-7">
        <div className="animate-pulse space-y-5">
          <section className="h-52 rounded-[30px] border border-slate-200 bg-white" />
          <section className="grid gap-5 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-36 rounded-[24px] border border-slate-200 bg-white" />)}
          </section>
          <section className="h-[620px] rounded-[30px] border border-slate-200 bg-white" />
        </div>
      </main>
    )
  }

  const bulkSchemaReady = Boolean(dashboard?.capabilities?.bulkSchemaReady)
  const selectedCount = selectedBulkRecords.length

  return (
    <main className="min-w-0 flex-1 overflow-x-hidden bg-[#f4f7fb] p-4 sm:p-5 xl:p-7">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.07)]">
        <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
          <div className="relative overflow-hidden p-6 xl:p-8">
            <div className="absolute -right-14 -top-16 h-56 w-56 rounded-full bg-blue-100/70 blur-3xl" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-800">
                  <Fingerprint size={13} /> Data Lifecycle Command
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
                  Gouvernance · Effacement · Preuve
                </span>
              </div>
              <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-[-0.04em] text-slate-950 xl:text-[40px]">
                Centre de gouvernance, d’effacement et de preuve
              </h1>
              <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-600">
                Instruisez chaque dossier, classez les décisions, analysez les dépendances et pilotez les suppressions unitaires ou groupées avec une preuve durable et lisible.
              </p>
              {dashboard?.actor ? (
                <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                  <span className="rounded-full bg-slate-100 px-3 py-1.5">Acteur : {dashboard.actor.displayName}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5">Rôle : {dashboard.actor.roleKey}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5">Organisation : {dashboard.actor.organizationId}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="bg-[#071d3b] p-6 text-white xl:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-200">Posture de gouvernance</p>
                <h2 className="mt-2 text-xl font-black">Décisions et exécutions contrôlées</h2>
              </div>
              <button type="button" onClick={() => void loadDashboard()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-black text-white hover:bg-white/15">
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Actualiser
              </button>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {[
                ["À instruire", requestStatistics.requested, "text-amber-300"],
                ["Approuvées", requestStatistics.approved, "text-blue-200"],
                ["Bloquées", requestStatistics.blocked, "text-rose-300"],
                ["Terminées", requestStatistics.completed, "text-emerald-300"],
              ].map(([label, value, tone]) => (
                <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3.5">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-300">{label}</p>
                  <p className={`mt-1 text-3xl font-black tabular-nums ${tone}`}>{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-xs font-semibold text-slate-200">
              <ShieldCheck size={17} className="text-emerald-300" />
              {bulkSchemaReady ? "Orchestration groupée disponible" : "Migration d’orchestration groupée à appliquer"}
            </div>
          </div>
        </div>
      </section>

      <nav className="sticky top-0 z-30 mt-4 overflow-x-auto rounded-[22px] border border-slate-200 bg-white/95 p-2 shadow-[0_12px_34px_rgba(15,23,42,0.06)] backdrop-blur">
        <div className="flex min-w-max gap-1.5">
          {WORKSPACES.map(({ key, label, eyebrow, icon: Icon }) => {
            const active = workspace === key
            return (
              <button key={key} type="button" onClick={() => setWorkspace(key)} className={`group flex min-w-[180px] items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${active ? "bg-[#071d3b] text-white shadow-lg" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}>
                <span className={`grid h-9 w-9 place-items-center rounded-xl ${active ? "bg-white/12 text-blue-200" : "bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700"}`}>
                  <Icon size={17} />
                </span>
                <span>
                  <span className={`block text-[9px] font-black uppercase tracking-[0.16em] ${active ? "text-blue-200" : "text-slate-400"}`}>{eyebrow}</span>
                  <span className="mt-0.5 block text-xs font-black">{label}</span>
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      {error ? (
        <div className="mt-4 flex items-start justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
          <span className="flex items-start gap-2"><AlertTriangle size={17} className="mt-0.5 shrink-0" />{error}</span>
          <button type="button" onClick={() => setError("")}><X size={16} /></button>
        </div>
      ) : null}

      {success ? (
        <div className="mt-4 flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          <span className="flex items-start gap-2"><CheckCircle2 size={17} className="mt-0.5 shrink-0" />{success}</span>
          <button type="button" onClick={() => setSuccess("")}><X size={16} /></button>
        </div>
      ) : null}

      {workspace === "overview" ? (
        <div className="mt-5 space-y-5">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Dossiers gouvernés" value={allInventory.length} detail="Ambassadeurs, candidats et leads actuellement visibles dans le périmètre." icon={Database} />
            <MetricCard label="Décisions ouvertes" value={requestStatistics.requested + requestStatistics.approved} detail="Demandes à instruire ou autorisées avant exécution." icon={Gavel} tone="blue" />
            <MetricCard label="Rejets documentés" value={requestStatistics.rejected} detail="Décisions closes avec motif et acteur conservés." icon={XCircle} tone="amber" />
            <MetricCard label="Purges prouvées" value={requestStatistics.completed} detail="Suppressions terminées avec trace et registre de preuve." icon={BadgeCheck} tone="green" />
          </section>

          <section className="grid gap-5 2xl:grid-cols-[minmax(320px,0.72fr)_minmax(0,1.25fr)_minmax(300px,0.68fr)]">
            <article className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">Inventaire gouverné</p>
                    <h2 className="mt-1 text-lg font-black text-slate-950">Dossiers par population</h2>
                  </div>
                  {selectedCount ? <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700">{selectedCount} sélectionné(s)</span> : null}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
                  {(["ambassador", "candidate", "lead"] as EntityType[]).map((type) => (
                    <button key={type} type="button" onClick={() => setEntityType(type)} className={`rounded-lg px-2 py-2 text-[10px] font-black transition ${entityType === type ? "bg-blue-700 text-white shadow" : "text-slate-600 hover:bg-white"}`}>
                      {ENTITY_LABELS[type]} {dashboard?.inventory?.[type]?.length || 0}
                    </button>
                  ))}
                </div>
                <label className="mt-3 flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
                  <Search size={15} className="text-slate-400" />
                  <input value={inventoryQuery} onChange={(event) => setInventoryQuery(event.target.value)} placeholder="Nom, téléphone, email, ville, référence…" className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400" />
                </label>
              </header>
              <div className="max-h-[590px] space-y-2 overflow-y-auto p-3">
                {filteredInventory.map((item) => {
                  const active = selectedId === text(item.id)
                  const checked = bulkSelection.includes(entityKey(entityType, item.id))
                  return (
                    <div key={text(item.id)} className={`rounded-2xl border p-3 transition ${active ? "border-blue-300 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                      <div className="flex items-start gap-3">
                        <button type="button" onClick={() => toggleBulkSelection(entityType, item)} aria-label="Sélectionner pour une opération groupée" className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${checked ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-transparent"}`}>
                          <Check size={13} />
                        </button>
                        <button type="button" onClick={() => setSelectedId(text(item.id))} className="min-w-0 flex-1 text-left">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-slate-950">{item.label}</p>
                              <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">{item.email || item.phone || item.reference || "Aucune coordonnée exposée"}</p>
                            </div>
                            <StatusBadge value={item.lifecycleState || "active"} />
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                            <span>{item.city || "Zone non renseignée"}</span>
                            <span>{statusLabel(item.businessStatus || "active")}</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )
                })}
                {!filteredInventory.length ? <EmptyState icon={FileSearch} title="Aucun dossier correspondant" description="Modifiez la recherche ou changez de population." /> : null}
              </div>
            </article>

            <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
              {selected ? (
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">Dossier gouverné sélectionné</p>
                      <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{selected.label}</h2>
                      <p className="mt-1 break-all text-xs font-semibold text-slate-500">{selected.id}</p>
                    </div>
                    <StatusBadge value={selected.lifecycleState || "active"} />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {[
                      ["Type", ENTITY_SINGULAR[entityType]],
                      ["Statut métier", statusLabel(selected.businessStatus || "active")],
                      ["Ville", text(selected.city) || "—"],
                      ["Email", text(selected.email) || "—"],
                      ["Téléphone", text(selected.phone) || "—"],
                      ["Référence", text(selected.reference) || "—"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
                        <p className="mt-1 break-words text-sm font-bold text-slate-900">{value}</p>
                      </div>
                    ))}
                  </div>

                  <section className="mt-5 rounded-[22px] border border-blue-100 bg-blue-50/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-700">Matrice de dépendances</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">Analyse avant toute action irréversible</p>
                      </div>
                      <button type="button" onClick={() => void runEntityAction("preview")} disabled={busy === "preview"} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#071d3b] px-4 text-xs font-black text-white disabled:opacity-50">
                        {busy === "preview" ? <Loader2 size={15} className="animate-spin" /> : <FileSearch size={15} />} Analyser
                      </button>
                    </div>

                    {previewMatchesSelection && preview ? (
                      <div className="mt-4">
                        <div className={`rounded-2xl border p-3 text-sm font-bold ${preview.canPermanentDelete ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
                          {preview.canPermanentDelete ? "Dossier éligible à une suppression gouvernée." : `${preview.blockerCount} dépendance(s) bloquante(s) détectée(s).`}
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {preview.dependencies.map((dependency) => (
                            <div key={dependency.key} className="rounded-xl border border-slate-200 bg-white p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-xs font-black text-slate-900">{dependency.label}</p>
                                  <p className="mt-1 text-[10px] font-semibold text-slate-500">{dependency.table}</p>
                                </div>
                                <span className={`text-sm font-black tabular-nums ${dependency.blocking ? "text-rose-700" : "text-emerald-700"}`}>{dependency.count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs font-semibold leading-5 text-blue-800">L’analyse charge les dépendances réelles et confirme si une suppression permanente est recevable.</p>
                    )}
                  </section>

                  <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {lower(selected.lifecycleState) === "archived" ? (
                      <button type="button" onClick={() => setModal({ kind: "entity", action: "restore" })} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-black text-white"><RotateCcw size={16} />Restaurer</button>
                    ) : (
                      <button type="button" onClick={() => setModal({ kind: "entity", action: "archive" })} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-black text-slate-950"><Archive size={16} />Archiver</button>
                    )}
                    <button type="button" onClick={() => setModal({ kind: "entity", action: "anonymize" })} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-700"><UserRoundX size={16} />Anonymiser</button>
                    <button type="button" onClick={() => setModal({ kind: "entity", action: "request" })} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-black text-white"><ClipboardCheck size={16} />Demander suppression</button>
                  </div>
                </div>
              ) : (
                <EmptyState icon={LockKeyhole} title="Sélectionnez un dossier gouverné" description="Le dossier détaillé, ses dépendances et les seules actions autorisées apparaîtront ici." />
              )}
            </article>

            <aside className="space-y-4">
              <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-700"><Layers3 size={18} /></span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Sélection groupée</p>
                    <p className="mt-1 text-2xl font-black text-slate-950">{selectedCount}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Dossiers prêts à être préparés dans une opération groupée.</p>
                  </div>
                </div>
                <button type="button" disabled={!selectedCount || !bulkSchemaReady} onClick={() => setModal({ kind: "bulk-create" })} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#071d3b] px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-45">
                  <Boxes size={16} /> Préparer la suppression groupée
                </button>
                {!bulkSchemaReady ? <p className="mt-2 text-[11px] font-semibold leading-5 text-amber-700">Appliquez la migration Data Lifecycle Command Center pour activer cette fonction.</p> : null}
              </article>

              <article className="rounded-[24px] bg-[#0b315e] p-4 text-white shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-200">Attention management</p>
                <h3 className="mt-2 text-lg font-black">Décisions à engager</h3>
                <div className="mt-4 space-y-2">
                  {[
                    ["Demandées", requestStatistics.requested, "text-amber-300"],
                    ["Approuvées", requestStatistics.approved, "text-blue-200"],
                    ["Bloquées", requestStatistics.blocked, "text-rose-300"],
                  ].map(([label, value, tone]) => (
                    <button key={String(label)} type="button" onClick={() => { setWorkspace("requests"); setRequestStatus(String(label) === "Demandées" ? "requested" : String(label) === "Approuvées" ? "approved" : "blocked") }} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-left">
                      <span className="text-xs font-bold text-slate-200">{label}</span>
                      <span className={`text-lg font-black ${tone}`}>{value}</span>
                    </button>
                  ))}
                </div>
              </article>

              <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Séparation des responsabilités</p>
                <div className="mt-3 space-y-3">
                  {[
                    ["1", "Demandeur", "Crée et justifie la demande"],
                    ["2", "Approbateur", "Examine et décide"],
                    ["3", "Exécutant", "Autorise la purge finale"],
                  ].map(([step, title, detail]) => (
                    <div key={step} className="flex items-start gap-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-black text-slate-700">{step}</span>
                      <div><p className="text-xs font-black text-slate-900">{title}</p><p className="mt-0.5 text-[11px] font-semibold text-slate-500">{detail}</p></div>
                    </div>
                  ))}
                </div>
              </article>
            </aside>
          </section>
        </div>
      ) : null}

      {workspace === "requests" ? (
        <section className="mt-5 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">Registre de décision</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Demandes de suppression permanente</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">Chaque action conserve son acteur, sa date, son motif et son état réel.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">{filteredRequests.length} visible(s)</span>
                <button type="button" onClick={() => void loadDashboard()} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"><RefreshCw size={16} /></button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {REQUEST_STATUSES.map((status) => (
                <button key={status} type="button" onClick={() => setRequestStatus(status)} className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.08em] transition ${requestStatus === status ? "border-[#071d3b] bg-[#071d3b] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                  {status === "all" ? "Tous" : statusLabel(status)}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(260px,1fr)_220px_220px]">
              <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
                <Search size={16} className="text-slate-400" />
                <input value={requestQuery} onChange={(event) => setRequestQuery(event.target.value)} placeholder="Dossier, demande, acteur, motif, identifiant…" className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none" />
              </label>
              <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
                <Filter size={15} className="text-slate-400" />
                <select value={requestEntityType} onChange={(event) => setRequestEntityType(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-700 outline-none">
                  <option value="all">Tous les types</option>
                  <option value="ambassador">Ambassadeurs</option>
                  <option value="candidate">Candidats</option>
                  <option value="lead">Leads</option>
                </select>
              </label>
              <div className="flex h-11 items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-600">
                <span>Terminées</span><span className="text-lg font-black text-emerald-700">{requestStatistics.completed}</span>
              </div>
            </div>
          </header>

          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full border-collapse">
              <thead className="bg-slate-50 text-left text-[9px] font-black uppercase tracking-[0.13em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">Dossier</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Demandeur</th>
                  <th className="px-4 py-3">Créée</th>
                  <th className="px-4 py-3">Décision autorisée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((request) => {
                  const status = lower(request.status)
                  const duplicates = duplicateCounts.get(entityKey(lower(request.entity_type) as EntityType, request.entity_id)) || 0
                  return (
                    <tr key={text(request.id)} className="group hover:bg-blue-50/35">
                      <td className="px-5 py-4">
                        <button type="button" onClick={() => void openRequestDrawer(request)} className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 group-hover:text-blue-800">{request.display_label}</span>
                            {duplicates > 1 ? <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[9px] font-black text-orange-700">{duplicates} demandes liées</span> : null}
                          </div>
                          <p className="mt-1 break-all text-[11px] font-semibold text-slate-500">{request.entity_id}</p>
                        </button>
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-700">{ENTITY_SINGULAR[lower(request.entity_type) as EntityType] || request.entity_type}</td>
                      <td className="px-4 py-4"><StatusBadge value={request.status} /></td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-700">{request.requested_by_display_name || "—"}</td>
                      <td className="px-4 py-4 text-xs font-semibold text-slate-600">{formatDate(request.created_at)}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {status === "requested" ? (
                            <>
                              <button type="button" onClick={() => setModal({ kind: "request", action: "approve", request })} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-black text-white"><CheckCircle2 size={14} />Approuver</button>
                              <button type="button" onClick={() => setModal({ kind: "request", action: "reject", request })} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-black text-rose-700"><XCircle size={14} />Rejeter</button>
                            </>
                          ) : null}
                          {status === "approved" ? (
                            <button type="button" onClick={() => setModal({ kind: "request", action: "execute", request })} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#071d3b] px-3 text-xs font-black text-white"><Trash2 size={14} />Exécuter la purge</button>
                          ) : null}
                          {["completed", "rejected", "cancelled"].includes(status) ? <span className="text-xs font-bold text-slate-500">Aucune action disponible</span> : null}
                          <button type="button" onClick={() => void openRequestDrawer(request)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700"><Eye size={14} />Dossier</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {!filteredRequests.length ? <tr><td colSpan={6} className="px-5 py-16"><EmptyState icon={FileSearch} title="Aucune demande dans cette vue" description="Ajustez les filtres ou revenez à l’ensemble du registre." /></td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {workspace === "bulk" ? (
        <div className="mt-5 space-y-5">
          {!bulkSchemaReady ? (
            <section className="rounded-[26px] border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-amber-700 shadow-sm"><ShieldAlert size={22} /></span>
                <div>
                  <h2 className="text-lg font-black text-amber-950">Orchestration groupée non installée dans la base active</h2>
                  <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-amber-800">Appliquez la migration <code className="rounded bg-white px-1.5 py-0.5">20260730_market_os_ambassador_data_lifecycle_command_center.sql</code>. La page restera opérationnelle pour les suppressions unitaires tant que cette migration n’est pas appliquée.</p>
                </div>
              </div>
            </section>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Opérations" value={dashboard?.bulkJobs?.length || 0} detail="Lots gouvernés créés dans le périmètre actif." icon={Boxes} />
            <MetricCard label="Prêtes" value={(dashboard?.bulkJobs || []).filter((job) => lower(job.status) === "ready").length} detail="Opérations sans blocage nécessitant une décision." icon={ListChecks} tone="blue" />
            <MetricCard label="En exécution" value={(dashboard?.bulkJobs || []).filter((job) => lower(job.status) === "executing").length} detail="Lots actuellement traités par l’orchestrateur." icon={RefreshCw} tone="amber" />
            <MetricCard label="Terminées" value={(dashboard?.bulkJobs || []).filter((job) => lower(job.status) === "completed").length} detail="Opérations avec résultat et preuve consolidés." icon={BadgeCheck} tone="green" />
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">Bulk Erasure Command</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Opérations groupées gouvernées</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">Préflight par dossier, stratégie par adaptateur, décision, exécution et résultat individuel.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setWorkspace("overview")} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700"><Users size={16} />Sélectionner des dossiers</button>
                <button type="button" disabled={!selectedCount || !bulkSchemaReady} onClick={() => setModal({ kind: "bulk-create" })} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#071d3b] px-4 text-sm font-black text-white disabled:opacity-45"><Boxes size={16} />Créer avec {selectedCount} dossier(s)</button>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-[1080px] w-full border-collapse">
                <thead className="bg-slate-50 text-left text-[9px] font-black uppercase tracking-[0.13em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Opération</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Sélection</th>
                    <th className="px-4 py-3">Prêts</th>
                    <th className="px-4 py-3">Bloqués</th>
                    <th className="px-4 py-3">Terminés</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(dashboard?.bulkJobs || []).map((job) => {
                    const status = lower(job.status)
                    return (
                      <tr key={text(job.id)} className="hover:bg-blue-50/30">
                        <td className="px-4 py-4">
                          <button type="button" onClick={() => setDrawer({ kind: "job", record: job })} className="text-left">
                            <p className="font-black text-slate-900">{job.title}</p>
                            <p className="mt-1 text-[11px] font-semibold text-slate-500">{formatDate(job.created_at)} · {job.requested_by_display_name}</p>
                          </button>
                        </td>
                        <td className="px-4 py-4"><StatusBadge value={job.status} /></td>
                        <td className="px-4 py-4 text-lg font-black tabular-nums text-slate-900">{job.total_count || 0}</td>
                        <td className="px-4 py-4 text-lg font-black tabular-nums text-emerald-700">{job.ready_count || 0}</td>
                        <td className="px-4 py-4 text-lg font-black tabular-nums text-rose-700">{job.blocked_count || 0}</td>
                        <td className="px-4 py-4 text-lg font-black tabular-nums text-blue-700">{job.completed_count || 0}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {["draft", "review_required", "blocked"].includes(status) ? <button type="button" onClick={() => void runBulkAction(job, "preflight")} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-700 px-3 text-xs font-black text-white"><FileSearch size={14} />Analyser</button> : null}
                            {["ready", "review_required"].includes(status) ? <button type="button" onClick={() => setModal({ kind: "bulk-action", action: "approve", job })} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-black text-white"><CheckCircle2 size={14} />Approuver</button> : null}
                            {["ready", "review_required", "blocked"].includes(status) ? <button type="button" onClick={() => setModal({ kind: "bulk-action", action: "reject", job })} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-black text-rose-700"><XCircle size={14} />Rejeter</button> : null}
                            {["approved", "partial", "failed"].includes(status) ? <button type="button" onClick={() => setModal({ kind: "bulk-action", action: "execute", job })} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#071d3b] px-3 text-xs font-black text-white"><Trash2 size={14} />Exécuter</button> : null}
                            <button type="button" onClick={() => setDrawer({ kind: "job", record: job })} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700"><Eye size={14} />Inspecter</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {!dashboard?.bulkJobs?.length ? <tr><td colSpan={7} className="p-5"><EmptyState icon={Boxes} title="Aucune opération groupée" description="Sélectionnez plusieurs dossiers dans la Vue de gouvernance, puis préparez une opération contrôlée." /></td></tr> : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}

      {workspace === "audit" ? (
        <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">Preuve d’audit</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Journal immuable classifié</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Les événements sont traduits en langage opérationnel sans altérer leur payload ni leur résultat.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">{filteredEvents.length} événement(s)</span>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(260px,1fr)_220px_220px]">
            <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
              <Search size={16} className="text-slate-400" />
              <input value={eventQuery} onChange={(event) => setEventQuery(event.target.value)} placeholder="Événement, acteur, demande, dossier…" className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none" />
            </label>
            <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
              <SlidersHorizontal size={15} className="text-slate-400" />
              <select value={eventCategoryFilter} onChange={(event) => setEventCategoryFilter(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-700 outline-none">
                <option value="all">Toutes les catégories</option>
                <option value="request">Demandes</option>
                <option value="decision">Décisions</option>
                <option value="execution">Exécutions</option>
                <option value="bulk">Opérations groupées</option>
                <option value="other">Autres</option>
              </select>
            </label>
            <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
              <Filter size={15} className="text-slate-400" />
              <select value={eventEntityFilter} onChange={(event) => setEventEntityFilter(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-700 outline-none">
                <option value="all">Tous les objets</option>
                <option value="ambassador">Ambassadeur</option>
                <option value="candidate">Candidat</option>
                <option value="lead">Lead</option>
                <option value="bulk_job">Opération groupée</option>
              </select>
            </label>
          </div>

          <div className="mt-5 grid gap-3 xl:grid-cols-2">
            {filteredEvents.map((event) => (
              <button key={text(event.id)} type="button" onClick={() => setDrawer({ kind: "event", record: event })} className="group rounded-[20px] border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-800">
                    {eventCategory(event.event_type) === "execution" ? <Database size={18} /> : eventCategory(event.event_type) === "decision" ? <Gavel size={18} /> : eventCategory(event.event_type) === "bulk" ? <Boxes size={18} /> : <FileClock size={18} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-900">{eventLabel(event.event_type)}</p>
                        <p className="mt-1 text-xs font-bold text-slate-600">{event.actor_display_name || "Acteur non exposé"} · {ENTITY_SINGULAR[lower(event.entity_type) as EntityType] || statusLabel(event.entity_type)}</p>
                      </div>
                      <p className="shrink-0 text-[10px] font-bold text-slate-500">{formatDate(event.created_at)}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <code className="truncate text-[10px] font-semibold text-slate-400">{event.event_type}</code>
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-700">Inspecter <ChevronRight size={13} /></span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
            {!filteredEvents.length ? <div className="xl:col-span-2"><EmptyState icon={History} title="Aucun événement dans cette vue" description="Ajustez la recherche ou les classifications du journal." /></div> : null}
          </div>
        </section>
      ) : null}

      {workspace === "policies" ? (
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">Autorités opérationnelles</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">Droits de décision et d’exécution</h2>
              </div>
              <ShieldCheck size={22} className="text-blue-700" />
            </div>
            <div className="mt-5 space-y-3">
              {(dashboard?.authorities || []).map((authority) => (
                <article key={text(authority.actor_app_user_id)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-900">{authority.actor_display_name}</p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-700">{authority.authority_code}</p>
                    </div>
                    <StatusBadge value={authority.active ? "active" : "archived"} />
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl bg-white p-3"><p className="text-[9px] font-black uppercase text-slate-500">Auto-décision</p><p className="mt-1 text-sm font-black text-slate-900">{authority.may_self_decide ? "Autorisée" : "Interdite"}</p></div>
                    <div className="rounded-xl bg-white p-3"><p className="text-[9px] font-black uppercase text-slate-500">Auto-exécution</p><p className="mt-1 text-sm font-black text-slate-900">{authority.may_self_execute ? "Autorisée" : "Interdite"}</p></div>
                  </div>
                </article>
              ))}
              {!dashboard?.authorities?.length ? <EmptyState icon={Gavel} title="Aucune autorité exposée" description="La table d’autorité n’est pas installée ou aucune autorité active n’est enregistrée." /> : null}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">Registre des adaptateurs</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">Couverture des systèmes et stratégies</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">Chaque adaptateur annonce ce qu’il supprime, détache, bloque ou vérifie.</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">{dashboard?.adapters?.length || 0} adaptateur(s)</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(dashboard?.adapters || []).map((adapter) => (
                <article key={text(adapter.adapter_key)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-blue-700 shadow-sm">
                      {adapter.system_key === "primary_database" ? <Database size={17} /> : <Layers3 size={17} />}
                    </span>
                    <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${adapter.strategy === "delete" ? "bg-rose-100 text-rose-700" : adapter.strategy === "detach" ? "bg-blue-100 text-blue-700" : adapter.strategy === "block" ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-700"}`}>{adapter.strategy}</span>
                  </div>
                  <h3 className="mt-3 text-sm font-black text-slate-950">{adapter.display_label}</h3>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{adapter.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
                    <span className="rounded-full bg-white px-2 py-1">{adapter.entity_type}</span>
                    <span className="rounded-full bg-white px-2 py-1">{adapter.retention_class}</span>
                    <span className="rounded-full bg-white px-2 py-1">{adapter.system_key}</span>
                  </div>
                </article>
              ))}
              {!dashboard?.adapters?.length ? <div className="sm:col-span-2"><EmptyState icon={Layers3} title="Registre d’adaptateurs indisponible" description="Appliquez la migration du Command Center pour exposer la couverture d’effacement." /></div> : null}
            </div>
          </section>

          <section className="xl:col-span-2 rounded-[28px] border border-slate-200 bg-[#071d3b] p-5 text-white shadow-sm">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.7fr)]">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-200">Doctrine de suppression</p>
                <h2 className="mt-2 text-2xl font-black">Puissante, explicable et impossible à confondre</h2>
                <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-300">La suppression groupée ne promet pas d’effacer un système non enregistré. Elle exécute les adaptateurs actifs, conserve les écritures soumises à rétention par détachement, bloque les dépendances critiques et expose les vérifications externes restantes.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  ["Supprimer", "Données nominatives sans obligation de conservation"],
                  ["Détacher", "Références commerciales ou financières conservées"],
                  ["Bloquer", "Dépendances qui empêchent une suppression légitime"],
                  ["Vérifier", "Stockage, index, cache ou mémoire externe"],
                ].map(([title, detail]) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                    <p className="text-xs font-black text-white">{title}</p>
                    <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-300">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {drawer?.kind === "request" ? (() => {
        const request = drawer.record
        const relatedEvents = (dashboard?.events || []).filter((event) => text(event.request_id) === text(request.id) || (text(event.entity_id) === text(request.entity_id) && lower(event.entity_type) === lower(request.entity_type)))
        const relatedRequests = (dashboard?.requests || []).filter((item) => text(item.entity_id) === text(request.entity_id) && lower(item.entity_type) === lower(request.entity_type))
        return (
          <Drawer title={request.display_label || "Demande de suppression"} eyebrow="Dossier de décision" onClose={closeDrawer}>
            <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black text-slate-900">{ENTITY_SINGULAR[lower(request.entity_type) as EntityType] || request.entity_type}</p>
                  <p className="mt-1 break-all text-[11px] font-semibold text-slate-500">Demande {request.id}</p>
                </div>
                <StatusBadge value={request.status} />
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-black uppercase text-slate-500">Demandeur</p><p className="mt-1 text-xs font-black text-slate-900">{request.requested_by_display_name || "—"}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-black uppercase text-slate-500">Créée</p><p className="mt-1 text-xs font-black text-slate-900">{formatDate(request.created_at)}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-black uppercase text-slate-500">Demandes liées</p><p className="mt-1 text-xs font-black text-slate-900">{relatedRequests.length}</p></div>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1">
              <div className="flex min-w-max gap-1">
                {([
                  ["overview", "Vue générale"],
                  ["data", "Données concernées"],
                  ["dependencies", "Dépendances"],
                  ["decision", "Chaîne de décision"],
                  ["evidence", "Preuve et audit"],
                ] as Array<[DrawerTab, string]>).map(([key, label]) => (
                  <button key={key} type="button" onClick={() => setDrawerTab(key)} className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.07em] ${drawerTab === key ? "bg-[#071d3b] text-white" : "text-slate-600 hover:bg-slate-50"}`}>{label}</button>
                ))}
              </div>
            </div>

            {drawerTab === "overview" ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[
                  ["Dossier", request.display_label],
                  ["Identifiant entité", request.entity_id],
                  ["Code motif", request.reason_code],
                  ["Motif détaillé", request.reason_detail],
                  ["Statut", statusLabel(request.status)],
                  ["Dernière mise à jour", formatDate(request.updated_at)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
                    <p className="mt-2 break-words text-sm font-bold leading-6 text-slate-900">{value || "—"}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {drawerTab === "data" ? (
              <div className="mt-4 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase text-blue-700">Snapshot du dossier</p><h3 className="mt-1 font-black text-slate-950">Données exposées au moment du contrôle</h3></div><Database size={19} className="text-blue-700" /></div>
                {drawerPreviewLoading ? <div className="mt-5 flex items-center gap-2 text-sm font-bold text-slate-500"><Loader2 size={16} className="animate-spin" />Chargement du snapshot…</div> : drawerPreview ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {Object.entries(drawerPreview.entity || {}).slice(0, 18).map(([key, value]) => (
                      <div key={key} className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">{key.replaceAll("_", " ")}</p><p className="mt-1 break-words text-xs font-bold text-slate-900">{text(value) || "—"}</p></div>
                    ))}
                  </div>
                ) : <EmptyState icon={FileSearch} title="Snapshot indisponible" description="Le dossier peut déjà avoir été supprimé ou ne plus être présent dans le périmètre courant." />}
              </div>
            ) : null}

            {drawerTab === "dependencies" ? (
              <div className="mt-4 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                {drawerPreviewLoading ? <div className="flex items-center gap-2 text-sm font-bold text-slate-500"><Loader2 size={16} className="animate-spin" />Analyse des dépendances…</div> : drawerPreview ? (
                  <>
                    <div className={`rounded-2xl border p-4 ${drawerPreview.canPermanentDelete ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
                      <p className={`text-sm font-black ${drawerPreview.canPermanentDelete ? "text-emerald-800" : "text-rose-800"}`}>{drawerPreview.canPermanentDelete ? "Aucune dépendance bloquante détectée." : `${drawerPreview.blockerCount} dépendance(s) bloquante(s).`}</p>
                    </div>
                    <div className="mt-4 space-y-2">
                      {drawerPreview.dependencies.map((dependency) => (
                        <div key={dependency.key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div><p className="text-xs font-black text-slate-900">{dependency.label}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">{dependency.table}</p></div>
                          <span className={`text-lg font-black ${dependency.blocking ? "text-rose-700" : "text-emerald-700"}`}>{dependency.count}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : <EmptyState icon={Layers3} title="Analyse non disponible" description="Le dossier source n’est plus présent ou le contrôle ne peut pas être recalculé." />}
              </div>
            ) : null}

            {drawerTab === "decision" ? (
              <div className="mt-4 space-y-3">
                {[
                  ["Demande créée", request.requested_by_display_name, request.created_at, request.reason_detail],
                  ["Décision d’approbation", request.approved_by_display_name, request.approved_at, request.approval_note],
                  ["Décision de rejet", request.rejected_by_display_name, request.rejected_at, request.rejection_note],
                  ["Exécution", request.executed_by_display_name, request.executed_at, request.execution_error || "Exécution sans erreur enregistrée"],
                ].map(([title, actor, date, note], index) => (
                  <article key={title} className="flex gap-3 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-black ${actor ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-400"}`}>{index + 1}</span>
                    <div><p className="font-black text-slate-900">{title}</p><p className="mt-1 text-xs font-bold text-slate-600">{actor || "Non engagé"} · {formatDate(date)}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{note || "Aucune note enregistrée."}</p></div>
                  </article>
                ))}
              </div>
            ) : null}

            {drawerTab === "evidence" ? (
              <div className="mt-4 space-y-4">
                <article className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-blue-700">Empreintes et preuve</p>
                  <div className="mt-4 space-y-3">
                    {["entity_hash", "entity_snapshot_hash", "idempotency_key"].map((key) => <div key={key}><p className="text-[9px] font-black uppercase text-slate-500">{key.replaceAll("_", " ")}</p><code className="mt-1 block break-all rounded-xl bg-slate-950 p-3 text-[10px] font-semibold text-slate-200">{text(request[key]) || "—"}</code></div>)}
                  </div>
                </article>
                <article className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-blue-700">Événements reliés</p>
                  <div className="mt-3 space-y-2">
                    {relatedEvents.map((event) => <button key={text(event.id)} type="button" onClick={() => setDrawer({ kind: "event", record: event })} className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-left"><span><span className="block text-xs font-black text-slate-900">{eventLabel(event.event_type)}</span><span className="mt-1 block text-[10px] font-semibold text-slate-500">{formatDate(event.created_at)}</span></span><ChevronRight size={15} className="text-slate-400" /></button>)}
                    {!relatedEvents.length ? <p className="text-sm font-semibold text-slate-500">Aucun événement relié.</p> : null}
                  </div>
                </article>
              </div>
            ) : null}

            <div className="sticky bottom-0 mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-[#f7f9fc]/95 pt-4 backdrop-blur">
              {lower(request.status) === "requested" ? <><button type="button" onClick={() => setModal({ kind: "request", action: "reject", request })} className="h-11 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-700">Rejeter</button><button type="button" onClick={() => setModal({ kind: "request", action: "approve", request })} className="h-11 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white">Approuver</button></> : null}
              {lower(request.status) === "approved" ? <button type="button" onClick={() => setModal({ kind: "request", action: "execute", request })} className="inline-flex h-11 items-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-black text-white"><Trash2 size={16} />Exécuter la purge</button> : null}
            </div>
          </Drawer>
        )
      })() : null}

      {drawer?.kind === "event" ? (
        <Drawer title={eventLabel(drawer.record.event_type)} eyebrow="Événement immuable" onClose={closeDrawer}>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Acteur", drawer.record.actor_display_name],
              ["Date", formatDate(drawer.record.created_at)],
              ["Type d’objet", drawer.record.entity_type],
              ["Identifiant objet", drawer.record.entity_id],
              ["Demande reliée", drawer.record.request_id],
              ["Code technique", drawer.record.event_type],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">{label}</p><p className="mt-2 break-all text-sm font-bold text-slate-900">{value || "—"}</p></div>
            ))}
          </div>
          <article className="mt-4 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-blue-700">Payload immuable</p>
            <pre className="mt-3 max-h-[520px] overflow-auto rounded-2xl bg-slate-950 p-4 text-[11px] leading-6 text-slate-200">{jsonPreview(drawer.record.details)}</pre>
          </article>
        </Drawer>
      ) : null}

      {drawer?.kind === "job" ? (() => {
        const job = drawer.record
        const items = jobItems(job.id)
        const status = lower(job.status)
        return (
          <Drawer title={job.title || "Opération groupée"} eyebrow="Bulk Erasure Command" onClose={closeDrawer}>
            <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black text-slate-900">Job {job.id}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">Créé par {job.requested_by_display_name} · {formatDate(job.created_at)}</p></div><StatusBadge value={job.status} /></div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {[
                  ["Total", job.total_count],
                  ["Prêts", job.ready_count],
                  ["Bloqués", job.blocked_count],
                  ["Terminés", job.completed_count],
                  ["Échecs", job.failed_count],
                ].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3 text-center"><p className="text-[9px] font-black uppercase text-slate-500">{label}</p><p className="mt-1 text-xl font-black text-slate-900">{value || 0}</p></div>)}
              </div>
            </div>

            <article className="mt-4 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-blue-700">Résultat par dossier</p><h3 className="mt-1 font-black text-slate-950">Matrice d’exécution</h3></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-700">{items.length} item(s)</span></div>
              <div className="mt-4 space-y-2">
                {items.map((item) => (
                  <div key={text(item.id)} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><p className="text-sm font-black text-slate-900">{item.display_label}</p><p className="mt-1 break-all text-[10px] font-semibold text-slate-500">{item.entity_type} · {item.entity_id}</p></div><StatusBadge value={item.status} />
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-xl bg-white p-2.5"><p className="text-[9px] font-black uppercase text-slate-500">Blocages</p><p className="mt-1 text-sm font-black text-rose-700">{item.blocker_count || 0}</p></div>
                      <div className="rounded-xl bg-white p-2.5"><p className="text-[9px] font-black uppercase text-slate-500">Demande</p><p className="mt-1 truncate text-[10px] font-bold text-slate-700">{item.request_id || "—"}</p></div>
                      <div className="rounded-xl bg-white p-2.5"><p className="text-[9px] font-black uppercase text-slate-500">Exécuté</p><p className="mt-1 text-[10px] font-bold text-slate-700">{formatDate(item.executed_at)}</p></div>
                    </div>
                    {item.execution_error ? <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold leading-5 text-rose-800">{item.execution_error}</p> : null}
                  </div>
                ))}
                {!items.length ? <EmptyState icon={ListChecks} title="Aucun item chargé" description="L’opération n’a pas encore exposé ses dossiers ou la migration n’est pas active." /> : null}
              </div>
            </article>

            <article className="mt-4 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-blue-700">Code de confirmation du lot</p>
              <code className="mt-3 block rounded-2xl bg-slate-950 p-4 text-center text-lg font-black tracking-[0.12em] text-white">{bulkConfirmation(job)}</code>
              <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">Ce code est propre au lot. Il ne remplace jamais les contrôles individuels exécutés par l’orchestrateur.</p>
            </article>

            <div className="sticky bottom-0 mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-[#f7f9fc]/95 pt-4 backdrop-blur">
              {["draft", "review_required", "blocked"].includes(status) ? <button type="button" onClick={() => void runBulkAction(job, "preflight")} className="h-11 rounded-xl bg-blue-700 px-4 text-sm font-black text-white">Relancer l’analyse</button> : null}
              {["ready", "review_required"].includes(status) ? <><button type="button" onClick={() => setModal({ kind: "bulk-action", action: "reject", job })} className="h-11 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-700">Rejeter</button><button type="button" onClick={() => setModal({ kind: "bulk-action", action: "approve", job })} className="h-11 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white">Approuver</button></> : null}
              {["approved", "partial", "failed"].includes(status) ? <button type="button" onClick={() => setModal({ kind: "bulk-action", action: "execute", job })} className="inline-flex h-11 items-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-black text-white"><Trash2 size={16} />Exécuter le lot</button> : null}
            </div>
          </Drawer>
        )
      })() : null}

      {modal?.kind === "entity" && selected ? (
        <Modal title={ACTION_COPY[modal.action].title} description={ACTION_COPY[modal.action].description} tone={ACTION_COPY[modal.action].tone} onClose={closeModal}>
          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Dossier concerné</p><h3 className="mt-1 text-lg font-black text-slate-950">{selected.label}</h3><p className="mt-1 break-all text-xs font-semibold text-slate-500">{selected.id}</p></div><StatusBadge value={selected.lifecycleState || "active"} /></div>
            </section>
            <label className="block"><span className="text-xs font-black text-slate-800">Code motif</span><select value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none"><option value="administrative_request">Demande administrative</option><option value="data_subject_request">Droit de la personne</option><option value="duplicate_record">Dossier dupliqué</option><option value="contract_termination">Fin de relation</option><option value="quality_remediation">Remédiation qualité</option></select></label>
            <label className="block"><span className="text-xs font-black text-slate-800">Justification</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={5} placeholder="Consignez le motif, la base de décision et les contrôles réalisés…" className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /></label>
            {modal.action === "delete" ? <label className="block"><span className="text-xs font-black text-slate-800">Saisissez exactement le nom du dossier</span><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder={text(selected.label)} className="mt-2 h-11 w-full rounded-xl border border-rose-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none" /></label> : <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs font-semibold leading-5 text-blue-800"><Info className="mb-2" size={16} />L’acteur authentifié et la justification seront transmis au contrat de gouvernance existant.</div>}
            <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-white pt-4"><button type="button" onClick={closeModal} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700">Annuler</button><button type="button" onClick={() => void runEntityAction(modal.action)} disabled={Boolean(busy) || reason.trim().length < 5 || (modal.action === "delete" && confirmation.trim() !== text(selected.label))} className={`inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50 ${modal.action === "archive" ? "bg-amber-600" : modal.action === "restore" ? "bg-blue-700" : "bg-rose-700"}`}>{busy === modal.action ? <Loader2 size={16} className="animate-spin" /> : modal.action === "archive" ? <Archive size={16} /> : modal.action === "restore" ? <RotateCcw size={16} /> : modal.action === "anonymize" ? <UserRoundX size={16} /> : modal.action === "request" ? <ClipboardCheck size={16} /> : <Trash2 size={16} />}{ACTION_COPY[modal.action].commit}</button></div>
          </div>
        </Modal>
      ) : null}

      {modal?.kind === "request" ? (
        <Modal title={modal.action === "approve" ? "Approuver la demande" : modal.action === "reject" ? "Rejeter la demande" : "Exécuter la purge transactionnelle"} description={modal.action === "execute" ? "Autorisation finale après approbation. Le code exact et une note d’exécution sont obligatoires." : "La décision, l’acteur et la note seront conservés dans l’audit immuable."} tone={modal.action === "approve" ? "navy" : "red"} onClose={closeModal}>
          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Demande concernée</p><div className="mt-2 flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black text-slate-950">{modal.request.display_label}</h3><p className="mt-1 break-all text-xs font-semibold text-slate-500">{modal.request.entity_id}</p></div><StatusBadge value={modal.request.status} /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div><p className="text-[10px] font-black uppercase text-slate-500">Demandeur</p><p className="mt-1 text-sm font-bold text-slate-800">{modal.request.requested_by_display_name || "—"}</p></div><div><p className="text-[10px] font-black uppercase text-slate-500">Créée le</p><p className="mt-1 text-sm font-bold text-slate-800">{formatDate(modal.request.created_at)}</p></div></div></section>
            {modal.action === "execute" ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800"><AlertTriangle className="mr-2 inline" size={17} />Saisissez exactement <b>{requestConfirmation(modal.request)}</b>.</div> : null}
            <label className="block"><span className="text-xs font-black text-slate-800">Note {modal.action === "execute" ? "d’exécution" : "de décision"}</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={5} placeholder="Consignez les contrôles, la justification et les conditions de la décision…" className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /></label>
            {modal.action === "execute" ? <label className="block"><span className="text-xs font-black text-slate-800">Code de confirmation</span><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder={requestConfirmation(modal.request)} className="mt-2 h-11 w-full rounded-xl border border-rose-200 px-3 text-sm font-black tracking-wide text-slate-900 outline-none" /></label> : null}
            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-100 bg-white pt-4"><button type="button" onClick={closeModal} className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-700">Annuler</button><button type="button" onClick={() => void decideRequest(modal.request, modal.action)} disabled={Boolean(busy) || reason.trim().length < 5 || (modal.action === "execute" && confirmation !== requestConfirmation(modal.request))} className={`inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-black text-white disabled:opacity-50 ${modal.action === "approve" ? "bg-emerald-600" : "bg-rose-700"}`}>{busy === `${modal.action}:${text(modal.request.id)}` ? <Loader2 size={16} className="animate-spin" /> : modal.action === "approve" ? <CheckCircle2 size={16} /> : modal.action === "reject" ? <XCircle size={16} /> : <Trash2 size={16} />}{modal.action === "approve" ? "Approuver" : modal.action === "reject" ? "Rejeter" : "Autoriser la purge"}</button></div>
          </div>
        </Modal>
      ) : null}

      {modal?.kind === "bulk-create" ? (
        <Modal title="Préparer une suppression groupée" description="Créez un lot gouverné. Aucun dossier ne sera supprimé avant l’analyse, la décision et l’exécution confirmée." tone="red" onClose={closeModal}>
          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Sélection</p><h3 className="mt-1 text-lg font-black text-slate-950">{selectedBulkRecords.length} dossier(s)</h3></div><Boxes size={22} className="text-blue-700" /></div>
              <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                {selectedBulkRecords.map((item) => <div key={entityKey(item.entityType, item.id)} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3"><span><span className="block text-xs font-black text-slate-900">{item.label}</span><span className="mt-1 block text-[10px] font-semibold text-slate-500">{ENTITY_SINGULAR[item.entityType]} · {item.id}</span></span><button type="button" onClick={() => toggleBulkSelection(item.entityType, item)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500"><X size={14} /></button></div>)}
              </div>
            </section>
            <label className="block"><span className="text-xs font-black text-slate-800">Nom de l’opération</span><input value={bulkTitle} onChange={(event) => setBulkTitle(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-900 outline-none" /></label>
            <label className="block"><span className="text-xs font-black text-slate-800">Code motif</span><select value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none"><option value="administrative_request">Demande administrative</option><option value="data_subject_request">Droit de la personne</option><option value="duplicate_record">Dossiers dupliqués</option><option value="contract_termination">Fin de relation</option><option value="quality_remediation">Remédiation qualité</option></select></label>
            <label className="block"><span className="text-xs font-black text-slate-800">Justification de l’opération</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={5} placeholder="Expliquez le périmètre, la base de décision et le résultat attendu…" className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-900 outline-none" /></label>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs font-semibold leading-5 text-blue-800"><Sparkles className="mr-2 inline" size={16} />La création ne supprime rien. Elle prépare un lot qui devra être analysé, approuvé et exécuté avec son propre code de confirmation.</div>
            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-100 bg-white pt-4"><button type="button" onClick={closeModal} className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-700">Annuler</button><button type="button" onClick={() => void createBulkJob()} disabled={busy === "bulk-create" || selectedBulkRecords.length < 1 || reason.trim().length < 5} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#071d3b] px-5 text-sm font-black text-white disabled:opacity-50">{busy === "bulk-create" ? <Loader2 size={16} className="animate-spin" /> : <Boxes size={16} />}Créer l’opération</button></div>
          </div>
        </Modal>
      ) : null}

      {modal?.kind === "bulk-action" ? (
        <Modal title={modal.action === "approve" ? "Approuver l’opération groupée" : modal.action === "reject" ? "Rejeter l’opération groupée" : modal.action === "execute" ? "Exécuter la suppression groupée" : "Analyser l’opération groupée"} description={modal.action === "execute" ? "Le code exact du lot, la note et l’autorité d’exécution sont obligatoires." : "La décision sera enregistrée sur le lot et dans le journal immuable."} tone={modal.action === "approve" ? "navy" : "red"} onClose={closeModal}>
          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase text-slate-500">Opération</p><h3 className="mt-1 font-black text-slate-950">{modal.job.title}</h3><p className="mt-1 break-all text-[11px] font-semibold text-slate-500">{modal.job.id}</p></div><StatusBadge value={modal.job.status} /></div><div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-xl bg-white p-3 text-center"><p className="text-[9px] font-black uppercase text-slate-500">Total</p><p className="mt-1 text-xl font-black">{modal.job.total_count || 0}</p></div><div className="rounded-xl bg-white p-3 text-center"><p className="text-[9px] font-black uppercase text-slate-500">Prêts</p><p className="mt-1 text-xl font-black text-emerald-700">{modal.job.ready_count || 0}</p></div><div className="rounded-xl bg-white p-3 text-center"><p className="text-[9px] font-black uppercase text-slate-500">Bloqués</p><p className="mt-1 text-xl font-black text-rose-700">{modal.job.blocked_count || 0}</p></div></div></section>
            {modal.action === "execute" ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800"><AlertTriangle className="mr-2 inline" size={17} />Saisissez exactement <b>{bulkConfirmation(modal.job)}</b>. Chaque dossier sera traité et journalisé séparément.</div> : null}
            <label className="block"><span className="text-xs font-black text-slate-800">Note {modal.action === "execute" ? "d’exécution" : "de décision"}</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={5} placeholder="Consignez les contrôles, le périmètre et les conditions de cette action…" className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-900 outline-none" /></label>
            {modal.action === "execute" ? <label className="block"><span className="text-xs font-black text-slate-800">Code de confirmation du lot</span><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder={bulkConfirmation(modal.job)} className="mt-2 h-11 w-full rounded-xl border border-rose-200 px-3 text-sm font-black tracking-wide text-slate-900 outline-none" /></label> : null}
            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-100 bg-white pt-4"><button type="button" onClick={closeModal} className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-700">Annuler</button><button type="button" onClick={() => void runBulkAction(modal.job, modal.action)} disabled={Boolean(busy) || reason.trim().length < 5 || (modal.action === "execute" && confirmation.toUpperCase() !== bulkConfirmation(modal.job).toUpperCase())} className={`inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-black text-white disabled:opacity-50 ${modal.action === "approve" ? "bg-emerald-600" : "bg-rose-700"}`}>{busy === `bulk-${modal.action}:${text(modal.job.id)}` ? <Loader2 size={16} className="animate-spin" /> : modal.action === "approve" ? <CheckCircle2 size={16} /> : modal.action === "reject" ? <XCircle size={16} /> : <Trash2 size={16} />}{modal.action === "approve" ? "Approuver" : modal.action === "reject" ? "Rejeter" : "Autoriser l’exécution"}</button></div>
          </div>
        </Modal>
      ) : null}
    </main>
  )
}
