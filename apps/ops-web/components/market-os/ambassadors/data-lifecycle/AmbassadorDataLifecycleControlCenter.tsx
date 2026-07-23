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
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileClock,
  FileSearch,
  Fingerprint,
  History,
  Info,
  Layers3,
  Loader2,
  LockKeyhole,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserRoundX,
  X,
  XCircle,
} from "lucide-react"

type GenericRow = Record<string, any>

type EntityType = "ambassador" | "candidate" | "lead"

type EntityAction =
  | "preview"
  | "archive"
  | "restore"
  | "anonymize"
  | "request"
  | "delete"

type RequestAction = "approve" | "reject" | "execute"

type DashboardPayload = {
  actor: GenericRow
  inventory: Record<EntityType, GenericRow[]>
  requests: GenericRow[]
  events: GenericRow[]
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
}

type ModalState =
  | { kind: "entity"; action: Exclude<EntityAction, "preview"> }
  | { kind: "preview" }
  | { kind: "request"; action: RequestAction; request: GenericRow }
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
  failed: "Échec",
  pending: "En attente",
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
    description: "Retirer ce dossier du flux actif sans supprimer son historique ni ses dépendances.",
    commit: "Confirmer l’archivage",
    success: "Dossier archivé avec succès.",
    tone: "amber",
  },
  restore: {
    title: "Restaurer le dossier",
    description: "Réintégrer ce dossier archivé dans son cycle de traitement autorisé.",
    commit: "Restaurer le dossier",
    success: "Dossier restauré avec succès.",
    tone: "navy",
  },
  anonymize: {
    title: "Autoriser l’anonymisation",
    description: "Neutraliser les données d’identité selon les règles existantes tout en conservant les traces métier autorisées.",
    commit: "Exécuter l’anonymisation",
    success: "Dossier anonymisé avec succès.",
    tone: "red",
  },
  request: {
    title: "Demander la suppression permanente",
    description: "Créer une demande formelle soumise à la séparation des responsabilités et aux contrôles backend existants.",
    commit: "Soumettre la demande",
    success: "Demande de suppression permanente créée.",
    tone: "red",
  },
  delete: {
    title: "Suppression permanente directe",
    description: "Autorisation destructive irréversible. Cette action ne doit être exécutée qu’après une analyse de dépendances favorable.",
    commit: "Autoriser la suppression permanente",
    success: "Dossier supprimé définitivement.",
    tone: "red",
  },
}

function text(value: unknown) {
  return String(value ?? "").trim()
}

function formatDate(value: unknown) {
  const raw = text(value)
  if (!raw) return "—"
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return parsed.toLocaleString("fr-MA", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function statusLabel(value: unknown) {
  const key = text(value).toLowerCase()
  return STATUS_LABELS[key] || (key ? key.replaceAll("_", " ") : "—")
}

function statusClass(status: string) {
  const value = status.toLowerCase()
  if (["completed", "active"].includes(value)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }
  if (value === "approved") {
    return "border-blue-200 bg-blue-50 text-blue-700"
  }
  if (["blocked", "rejected", "failed"].includes(value)) {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }
  if (["archived", "anonymized", "anonymised"].includes(value)) {
    return "border-slate-200 bg-slate-100 text-slate-700"
  }
  return "border-amber-200 bg-amber-50 text-amber-700"
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ambassador-lifecycle-modal-title"
        className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl"
      >
        <header className={`flex items-start justify-between gap-5 px-6 py-5 ${headerTone}`}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-75">
              ANGELCARE · Gouvernance des données
            </p>
            <h2 id="ambassador-lifecycle-modal-title" className="mt-2 text-xl font-black tracking-tight">
              {title}
            </h2>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 opacity-85">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 text-current transition hover:bg-white/20"
          >
            <X size={18} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}

async function lifecycleApi(path: string, body?: GenericRow) {
  const response = await fetch(
    `/api/market-os/ambassadors/data-lifecycle${path}`,
    {
      method: body ? "POST" : "GET",
      credentials: "include",
      cache: "no-store",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    },
  )

  const payload = await response.json().catch(() => ({}))

  if (!response.ok || payload.ok === false) {
    throw new Error(
      text(payload.error || payload.message) || `Erreur HTTP ${response.status}`,
    )
  }

  return payload.data
}

export default function AmbassadorDataLifecycleControlCenter() {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [entityType, setEntityType] = useState<EntityType>("ambassador")
  const [selectedId, setSelectedId] = useState("")
  const [query, setQuery] = useState("")
  const [preview, setPreview] = useState<DependencyPreview | null>(null)
  const [reasonCode, setReasonCode] = useState("administrative_request")
  const [reason, setReason] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [modal, setModal] = useState<ModalState>(null)

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
    if (!modal) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModal(null)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [modal])

  useEffect(() => {
    setSelectedId("")
    setPreview(null)
    setConfirmation("")
    setModal(null)
  }, [entityType])

  const inventory = dashboard?.inventory?.[entityType] || []

  const filteredInventory = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return inventory
    return inventory.filter((item) =>
      [
        item.label,
        item.email,
        item.phone,
        item.city,
        item.reference,
        item.businessStatus,
        item.lifecycleState,
      ]
        .map((value) => text(value).toLowerCase())
        .some((value) => value.includes(normalizedQuery)),
    )
  }, [inventory, query])

  const selected = inventory.find((item) => text(item.id) === selectedId)
  const previewMatchesSelection = Boolean(
    preview && preview.entityType === entityType && preview.entityId === selectedId,
  )

  const requestStatistics = {
    requested: dashboard?.requests.filter((item) => item.status === "requested").length || 0,
    approved: dashboard?.requests.filter((item) => item.status === "approved").length || 0,
    blocked: dashboard?.requests.filter((item) => item.status === "blocked").length || 0,
    completed: dashboard?.requests.filter((item) => item.status === "completed").length || 0,
  }

  const closeModal = () => {
    setModal(null)
    setConfirmation("")
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
      })

      if (action === "preview") {
        setPreview(data)
        setModal({ kind: "preview" })
      } else {
        setSuccess(ACTION_COPY[action].success)
        setPreview(null)
        setConfirmation("")
        setModal(null)
        if (action === "delete") {
          setSelectedId("")
          setReason("")
        }
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

    const deleteConfirmation = `DELETE-${text(request.entity_id).slice(-8).toUpperCase()}`
    if (action === "execute" && confirmation !== deleteConfirmation) {
      setError(`Saisissez exactement ${deleteConfirmation}.`)
      return
    }

    setBusy(`${action}:${requestId}`)
    setError("")
    setSuccess("")

    try {
      await lifecycleApi(`/requests/${requestId}/${action}`, {
        reason,
        confirmation,
      })

      setSuccess(
        action === "execute"
          ? "Purge transactionnelle terminée."
          : action === "approve"
            ? "Demande approuvée."
            : "Demande rejetée.",
      )
      setConfirmation("")
      setModal(null)
      await loadDashboard()
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "Décision refusée.")
    } finally {
      setBusy("")
    }
  }

  if (loading && !dashboard) {
    return (
      <main className="min-w-0 flex-1 bg-[#f4f7fb] p-5 xl:p-7">
        <div className="animate-pulse space-y-5">
          <section className="h-44 rounded-[28px] border border-slate-200 bg-white" />
          <section className="grid gap-5 xl:grid-cols-[0.9fr_1.25fr_0.72fr]">
            <div className="h-[610px] rounded-[28px] border border-slate-200 bg-white" />
            <div className="h-[610px] rounded-[28px] border border-slate-200 bg-white" />
            <div className="h-[610px] rounded-[28px] border border-slate-200 bg-white" />
          </section>
          <p className="sr-only">Chargement de l’inventaire et des contrôles de cycle de vie…</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-w-0 flex-1 overflow-x-hidden bg-[#f4f7fb] p-4 sm:p-5 xl:p-7">
      <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.65fr)]">
          <div className="p-6 xl:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-800">
                <Fingerprint size={13} /> Gouvernance des données
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
                MZ4 · Contrôle final
              </span>
            </div>
            <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-[-0.035em] text-slate-950 xl:text-[38px]">
              Conservation, anonymisation et suppression sous contrôle
            </h1>
            <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-600">
              Un poste de gouvernance pour instruire chaque dossier, analyser ses dépendances,
              respecter la séparation des responsabilités et conserver une preuve immuable de toute décision.
            </p>
            {dashboard?.actor ? (
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                <span className="rounded-full bg-slate-100 px-3 py-1.5">Acteur : {dashboard.actor.displayName}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5">Rôle : {dashboard.actor.roleKey}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5">Organisation : {dashboard.actor.organizationId}</span>
              </div>
            ) : null}
          </div>

          <div className="bg-[#071d3b] p-6 text-white xl:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-200">Posture de gouvernance</p>
                <h2 className="mt-2 text-xl font-black">File de décisions contrôlées</h2>
              </div>
              <button
                type="button"
                onClick={() => void loadDashboard()}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-black text-white hover:bg-white/15"
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                Actualiser
              </button>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-5">
              {[
                ["À instruire", requestStatistics.requested, "text-amber-300"],
                ["Approuvées", requestStatistics.approved, "text-blue-200"],
                ["Bloquées", requestStatistics.blocked, "text-rose-300"],
                ["Purges réalisées", requestStatistics.completed, "text-emerald-300"],
              ].map(([label, value, tone]) => (
                <div key={String(label)} className="border-l border-white/15 pl-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-300">{label}</p>
                  <p className={`mt-1 text-3xl font-black tabular-nums ${tone}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-800">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="ml-auto" aria-label="Fermer l’erreur"><X size={16} /></button>
        </div>
      ) : null}

      {success ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess("")} className="ml-auto" aria-label="Fermer le message"><X size={16} /></button>
        </div>
      ) : null}

      <section className="mt-5 grid gap-5 2xl:grid-cols-[minmax(320px,0.86fr)_minmax(500px,1.3fr)_minmax(300px,0.7fr)]">
        <article className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 px-5 py-5">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">Inventaire gouverné</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">Dossiers par population</h2>
            <div className="mt-4 grid grid-cols-3 rounded-xl bg-slate-100 p-1">
              {(Object.keys(ENTITY_LABELS) as EntityType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setEntityType(type)}
                  className={`rounded-lg px-2 py-2 text-[11px] font-black transition ${entityType === type ? "bg-[#0b4ea2] text-white shadow-sm" : "text-slate-600 hover:text-slate-950"}`}
                >
                  {ENTITY_LABELS[type]} <span className="tabular-nums">{dashboard?.inventory?.[type]?.length || 0}</span>
                </button>
              ))}
            </div>
            <label className="mt-4 flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50">
              <Search size={16} className="text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nom, téléphone, email, ville, référence…"
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none"
              />
            </label>
          </header>

          <div className="max-h-[620px] space-y-2 overflow-y-auto p-3">
            {filteredInventory.map((item) => {
              const active = selectedId === text(item.id)
              return (
                <button
                  key={text(item.id)}
                  type="button"
                  onClick={() => {
                    setSelectedId(text(item.id))
                    setPreview(null)
                    setConfirmation("")
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition ${active ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`truncate font-black ${active ? "text-blue-950" : "text-slate-950"}`}>
                        {text(item.label) || "Dossier sans nom"}
                      </p>
                      <p className={`mt-1 truncate text-xs font-semibold ${active ? "text-blue-700" : "text-slate-500"}`}>
                        {text(item.reference) || text(item.email) || text(item.phone) || text(item.id)}
                      </p>
                      <p className={`mt-2 text-[10px] font-black uppercase tracking-[0.12em] ${active ? "text-blue-700" : "text-slate-400"}`}>
                        {text(item.city) || ENTITY_SINGULAR[entityType]}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${statusClass(text(item.businessStatus || "active"))}`}>
                        {statusLabel(item.businessStatus || "active")}
                      </span>
                      <span className={`text-[10px] font-black uppercase ${active ? "text-blue-800" : "text-slate-500"}`}>
                        {statusLabel(item.lifecycleState || "active")}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}

            {!filteredInventory.length ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <FileSearch className="mx-auto text-slate-300" size={28} />
                <p className="mt-3 text-sm font-black text-slate-700">Aucun dossier correspondant</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">Modifiez la recherche ou changez de population.</p>
              </div>
            ) : null}
          </div>
        </article>

        <article className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
          {selected ? (
            <>
              <header className="border-b border-slate-100 px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">Dossier de cycle de vie</p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{selected.label}</h2>
                    <p className="mt-1 break-all text-xs font-semibold text-slate-500">{selected.id}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase ${statusClass(text(selected.lifecycleState || "active"))}`}>
                    {statusLabel(selected.lifecycleState || "active")}
                  </span>
                </div>
              </header>

              <div className="space-y-5 p-6">
                <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    ["Type", ENTITY_SINGULAR[entityType]],
                    ["Statut métier", statusLabel(selected.businessStatus || "active")],
                    ["Ville", text(selected.city) || "—"],
                    ["Email", text(selected.email) || "—"],
                    ["Téléphone", text(selected.phone) || "—"],
                    ["Référence", text(selected.reference) || "—"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
                      <p className="mt-1 truncate text-sm font-black text-slate-900">{value}</p>
                    </div>
                  ))}
                </section>

                <section className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Analyse des dépendances</p>
                      <h3 className="mt-1 font-black text-slate-950">
                        {previewMatchesSelection
                          ? preview?.canPermanentDelete
                            ? "Aucun blocage déclaré par l’analyse"
                            : `${preview?.blockerCount || 0} dépendance(s) bloquante(s)`
                          : "Analyse obligatoire avant suppression"}
                      </h3>
                    </div>
                    <span className={`grid h-11 w-11 place-items-center rounded-xl ${previewMatchesSelection && preview?.canPermanentDelete ? "bg-emerald-50 text-emerald-700" : previewMatchesSelection ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700"}`}>
                      {previewMatchesSelection && preview?.canPermanentDelete ? <ShieldCheck size={21} /> : <ShieldAlert size={21} />}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void runEntityAction("preview")}
                    disabled={Boolean(busy)}
                    className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-xs font-black text-blue-800 transition hover:bg-blue-100 disabled:opacity-50"
                  >
                    {busy === "preview" ? <Loader2 size={16} className="animate-spin" /> : <FileSearch size={16} />}
                    {previewMatchesSelection ? "Réactualiser l’analyse" : "Analyser les dépendances"}
                  </button>
                </section>

                <section>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Actions autorisées</p>
                      <h3 className="mt-1 font-black text-slate-950">Choisir le traitement approprié</h3>
                    </div>
                    <p className="text-right text-[11px] font-bold text-slate-500">Aucune action ne remplace les contrôles backend.</p>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {text(selected.lifecycleState).toLowerCase() === "archived" ? (
                      <button type="button" onClick={() => setModal({ kind: "entity", action: "restore" })} className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-left hover:bg-blue-100">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-blue-700"><RotateCcw size={18} /></span>
                        <span><b className="block text-sm text-blue-950">Restaurer le dossier</b><span className="mt-1 block text-xs font-semibold text-blue-700">Réintégration contrôlée dans le cycle actif.</span></span>
                      </button>
                    ) : (
                      <button type="button" onClick={() => setModal({ kind: "entity", action: "archive" })} className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left hover:bg-amber-100">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-amber-700"><Archive size={18} /></span>
                        <span><b className="block text-sm text-amber-950">Archiver</b><span className="mt-1 block text-xs font-semibold text-amber-800">Retrait du flux actif sans destruction.</span></span>
                      </button>
                    )}

                    <button type="button" onClick={() => setModal({ kind: "entity", action: "anonymize" })} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700"><UserRoundX size={18} /></span>
                      <span><b className="block text-sm text-slate-950">Anonymiser</b><span className="mt-1 block text-xs font-semibold text-slate-500">Neutralisation de l’identité selon les règles existantes.</span></span>
                    </button>

                    <button type="button" onClick={() => setModal({ kind: "entity", action: "request" })} className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-left hover:bg-rose-100">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-rose-700"><ClipboardCheck size={18} /></span>
                      <span><b className="block text-sm text-rose-950">Demander la suppression</b><span className="mt-1 block text-xs font-semibold text-rose-700">Circuit d’approbation et séparation des rôles.</span></span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModal({ kind: "entity", action: "delete" })}
                      disabled={!previewMatchesSelection || !preview?.canPermanentDelete}
                      className="flex items-center gap-3 rounded-2xl border border-rose-300 bg-rose-700 p-4 text-left text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15"><Trash2 size={18} /></span>
                      <span><b className="block text-sm">Suppression permanente directe</b><span className="mt-1 block text-xs font-semibold opacity-80">Disponible uniquement après analyse favorable.</span></span>
                    </button>
                  </div>
                </section>
              </div>
            </>
          ) : (
            <div className="grid min-h-[620px] place-items-center p-8 text-center">
              <div className="max-w-sm">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-blue-700"><LockKeyhole size={28} /></span>
                <h2 className="mt-5 text-xl font-black text-slate-900">Sélectionnez un dossier gouverné</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">Le dossier détaillé, les dépendances et les seules actions autorisées apparaîtront ici.</p>
              </div>
            </div>
          )}
        </article>

        <aside className="space-y-5">
          <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#071d3b] text-white"><Layers3 size={20} /></span>
              <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Matrice de contrôle</p><h2 className="mt-1 font-black text-slate-950">Dépendances réelles</h2></div>
            </div>
            {previewMatchesSelection && preview ? (
              <div className="mt-4 space-y-2">
                {preview.dependencies.map((dependency) => (
                  <div key={dependency.key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="text-xs font-black text-slate-800">{dependency.label}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">{dependency.available ? "Source analysée" : "Source non disponible"}</p></div>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black tabular-nums ${dependency.blocking && dependency.count ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>{dependency.count}</span>
                    </div>
                  </div>
                ))}
                <div className={`mt-3 rounded-xl border p-3 text-xs font-bold ${preview.canPermanentDelete ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
                  {preview.canPermanentDelete ? "Suppression permanente autorisable selon l’analyse actuelle." : "Suppression bloquée par les dépendances déclarées."}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                <Info className="mx-auto text-slate-300" size={24} />
                <p className="mt-2 text-xs font-bold text-slate-500">Lancez l’analyse sur le dossier sélectionné.</p>
              </div>
            )}
          </section>

          <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700"><BadgeCheck size={20} /></span>
              <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Séparation des responsabilités</p><h2 className="mt-1 font-black text-slate-950">Trois acteurs distincts</h2></div>
            </div>
            <div className="mt-4 space-y-3">
              {[
                ["1", "Demandeur", "Crée et justifie la demande"],
                ["2", "Approbateur", "Examine et décide"],
                ["3", "Exécutant", "Autorise la purge finale"],
              ].map(([step, role, detail]) => (
                <div key={step} className="flex items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-700">{step}</span>
                  <div><p className="text-xs font-black text-slate-800">{role}</p><p className="text-[11px] font-semibold text-slate-500">{detail}</p></div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="mt-5 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-rose-700">Registre de décision</p><h2 className="mt-1 text-xl font-black text-slate-950">Demandes de suppression permanente</h2><p className="mt-1 text-xs font-semibold text-slate-500">Chaque action conserve son acteur, sa date, son motif et son état réel.</p></div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">{dashboard?.requests.length || 0} dossier(s)</span>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
              <tr><th className="px-5 py-3">Dossier</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Demandeur</th><th className="px-4 py-3">Créée</th><th className="px-4 py-3">Décision autorisée</th></tr>
            </thead>
            <tbody>
              {(dashboard?.requests || []).map((request) => (
                <tr key={request.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="px-5 py-4"><p className="font-black text-slate-900">{request.display_label}</p><p className="mt-1 max-w-[320px] truncate text-xs font-semibold text-slate-500">{request.entity_id}</p></td>
                  <td className="px-4 py-4 font-bold text-slate-700">{ENTITY_SINGULAR[request.entity_type as EntityType] || request.entity_type}</td>
                  <td className="px-4 py-4"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${statusClass(text(request.status))}`}>{statusLabel(request.status)}</span></td>
                  <td className="px-4 py-4 font-bold text-slate-700">{request.requested_by_display_name || "—"}</td>
                  <td className="px-4 py-4 text-xs font-semibold text-slate-500">{formatDate(request.created_at)}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {request.status === "requested" ? (
                        <>
                          <button type="button" onClick={() => setModal({ kind: "request", action: "approve", request })} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-black text-white"><CheckCircle2 size={14} />Approuver</button>
                          <button type="button" onClick={() => setModal({ kind: "request", action: "reject", request })} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-black text-rose-700"><XCircle size={14} />Rejeter</button>
                        </>
                      ) : null}
                      {request.status === "approved" || request.status === "blocked" ? (
                        <button type="button" onClick={() => setModal({ kind: "request", action: "execute", request })} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#071d3b] px-3 text-xs font-black text-white"><Trash2 size={14} />Exécuter la purge</button>
                      ) : null}
                      {!['requested', 'approved', 'blocked'].includes(text(request.status)) ? <span className="text-xs font-bold text-slate-400">Aucune action disponible</span> : null}
                    </div>
                  </td>
                </tr>
              ))}
              {!dashboard?.requests?.length ? <tr><td colSpan={6} className="px-4 py-12 text-center font-bold text-slate-500">Aucune demande de suppression permanente.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-5 rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-700">Preuve d’audit</p><h2 className="mt-1 text-xl font-black text-slate-950">Journal immuable</h2><p className="mt-1 text-xs font-semibold text-slate-500">Les événements sont présentés sans altérer leur contenu ni leur résultat.</p></div>
          <History className="text-slate-300" size={24} />
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {(dashboard?.events || []).slice(0, 40).map((event) => (
            <article key={event.id} className="flex items-start gap-4 rounded-2xl border border-slate-200 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700"><Database size={17} /></span>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><p className="font-black text-slate-900">{statusLabel(event.event_type)}</p><span className="text-[10px] font-bold text-slate-400">{formatDate(event.created_at)}</span></div><p className="mt-1 text-xs font-semibold text-slate-500">{event.actor_display_name || "Acteur système"} · {ENTITY_SINGULAR[event.entity_type as EntityType] || event.entity_type}</p>{event.summary ? <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{event.summary}</p> : null}</div>
            </article>
          ))}
          {!dashboard?.events?.length ? <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm font-bold text-slate-500 lg:col-span-2">Aucun événement immuable enregistré.</div> : null}
        </div>
      </section>

      {modal?.kind === "preview" && preview ? (
        <Modal title="Analyse contrôlée des dépendances" description="Résultat backend actuel pour le dossier sélectionné. Cette analyse ne supprime rien." onClose={closeModal}>
          <div className="space-y-5">
            <section className={`rounded-2xl border p-5 ${preview.canPermanentDelete ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
              <div className="flex items-start gap-3">
                {preview.canPermanentDelete ? <ShieldCheck className="text-emerald-700" /> : <ShieldAlert className="text-rose-700" />}
                <div><h3 className={`font-black ${preview.canPermanentDelete ? "text-emerald-950" : "text-rose-950"}`}>{preview.canPermanentDelete ? "Suppression permanente autorisable" : "Suppression permanente bloquée"}</h3><p className={`mt-1 text-sm font-semibold ${preview.canPermanentDelete ? "text-emerald-800" : "text-rose-800"}`}>{preview.blockerCount} dépendance(s) bloquante(s) · {preview.recommendedAction || "Aucune recommandation supplémentaire"}</p></div>
              </div>
            </section>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              {preview.dependencies.map((dependency) => (
                <div key={dependency.key} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-0">
                  <div><p className="text-sm font-black text-slate-900">{dependency.label}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{dependency.available ? "Source disponible" : "Source non disponible"}</p></div>
                  <span className="text-sm font-black tabular-nums text-slate-900">{dependency.count}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${dependency.blocking && dependency.count ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>{dependency.blocking && dependency.count ? "BLOQUANTE" : "CONTRÔLÉE"}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end"><button type="button" onClick={closeModal} className="inline-flex h-11 items-center rounded-xl bg-[#071d3b] px-5 text-sm font-black text-white">Fermer l’analyse</button></div>
          </div>
        </Modal>
      ) : null}

      {modal?.kind === "entity" && selected ? (
        <Modal title={ACTION_COPY[modal.action].title} description={ACTION_COPY[modal.action].description} tone={ACTION_COPY[modal.action].tone} onClose={closeModal}>
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Dossier concerné</p><h3 className="mt-1 text-lg font-black text-slate-950">{selected.label}</h3><p className="mt-1 break-all text-xs font-semibold text-slate-500">{selected.id}</p></div><span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${statusClass(text(selected.lifecycleState || "active"))}`}>{statusLabel(selected.lifecycleState || "active")}</span></div>
            </section>

            {modal.action === "delete" ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold leading-6 text-rose-800">
                <AlertTriangle className="mr-2 inline" size={17} />
                Action irréversible. L’analyse actuelle déclare {preview?.blockerCount || 0} blocage(s). Le backend reste l’autorité finale.
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="text-xs font-black text-slate-800">Catégorie du motif</span><select value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"><option value="administrative_request">Demande administrative</option><option value="duplicate">Doublon vérifié</option><option value="test_data">Donnée de test</option><option value="created_by_error">Création accidentelle</option><option value="privacy_request">Demande de confidentialité</option></select></label>
              {modal.action === "delete" ? <label className="block"><span className="text-xs font-black text-slate-800">Confirmation exacte</span><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder={text(selected.label)} className="mt-2 h-11 w-full rounded-xl border border-rose-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-50" /></label> : <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs font-semibold leading-5 text-blue-800"><Info className="mb-2" size={16} />La justification et l’acteur authentifié seront transmis selon le contrat existant.</div>}
            </div>

            <label className="block"><span className="text-xs font-black text-slate-800">Justification opérationnelle détaillée</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={5} placeholder="Décrivez le contexte, les vérifications réalisées et la raison de cette action…" className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /></label>

            <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-white pt-4"><button type="button" onClick={closeModal} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700">Annuler</button><button type="button" onClick={() => void runEntityAction(modal.action)} disabled={Boolean(busy) || reason.trim().length < 5 || (modal.action === "delete" && confirmation.trim() !== text(selected.label))} className={`inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50 ${modal.action === "archive" ? "bg-amber-600 hover:bg-amber-700" : modal.action === "restore" ? "bg-[#0b4ea2] hover:bg-blue-800" : "bg-rose-700 hover:bg-rose-800"}`}>{busy === modal.action ? <Loader2 size={16} className="animate-spin" /> : modal.action === "archive" ? <Archive size={16} /> : modal.action === "restore" ? <RotateCcw size={16} /> : modal.action === "anonymize" ? <UserRoundX size={16} /> : modal.action === "request" ? <ClipboardCheck size={16} /> : <Trash2 size={16} />}{ACTION_COPY[modal.action].commit}</button></div>
          </div>
        </Modal>
      ) : null}

      {modal?.kind === "request" ? (
        <Modal
          title={modal.action === "approve" ? "Approuver la demande" : modal.action === "reject" ? "Rejeter la demande" : "Exécuter la purge transactionnelle"}
          description={modal.action === "execute" ? "Autorisation finale après approbation. Le code exact et une note d’exécution sont obligatoires." : "La décision, l’acteur et la note seront conservés dans l’audit immuable."}
          tone={modal.action === "approve" ? "navy" : "red"}
          onClose={closeModal}
        >
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Demande concernée</p><div className="mt-2 flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black text-slate-950">{modal.request.display_label}</h3><p className="mt-1 break-all text-xs font-semibold text-slate-500">{modal.request.entity_id}</p></div><span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${statusClass(text(modal.request.status))}`}>{statusLabel(modal.request.status)}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div><p className="text-[10px] font-black uppercase text-slate-500">Demandeur</p><p className="mt-1 text-sm font-bold text-slate-800">{modal.request.requested_by_display_name || "—"}</p></div><div><p className="text-[10px] font-black uppercase text-slate-500">Créée le</p><p className="mt-1 text-sm font-bold text-slate-800">{formatDate(modal.request.created_at)}</p></div></div></section>
            {modal.action === "execute" ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800"><AlertTriangle className="mr-2 inline" size={17} />Saisissez exactement <b>DELETE-{text(modal.request.entity_id).slice(-8).toUpperCase()}</b>. L’exécution ne doit jamais être confondue avec l’approbation.</div> : null}
            <label className="block"><span className="text-xs font-black text-slate-800">Note {modal.action === "execute" ? "d’exécution" : "de décision"}</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={5} placeholder="Consignez les contrôles réalisés, la justification et les conditions de la décision…" className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /></label>
            {modal.action === "execute" ? <label className="block"><span className="text-xs font-black text-slate-800">Code de confirmation</span><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder={`DELETE-${text(modal.request.entity_id).slice(-8).toUpperCase()}`} className="mt-2 h-11 w-full rounded-xl border border-rose-200 px-3 text-sm font-black tracking-wide text-slate-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-50" /></label> : null}
            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-100 bg-white pt-4"><button type="button" onClick={closeModal} className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-700">Annuler</button><button type="button" onClick={() => void decideRequest(modal.request, modal.action)} disabled={Boolean(busy) || reason.trim().length < 5 || (modal.action === "execute" && confirmation !== `DELETE-${text(modal.request.entity_id).slice(-8).toUpperCase()}`)} className={`inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-black text-white disabled:opacity-50 ${modal.action === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-700 hover:bg-rose-800"}`}>{busy === `${modal.action}:${text(modal.request.id)}` ? <Loader2 size={16} className="animate-spin" /> : modal.action === "approve" ? <CheckCircle2 size={16} /> : modal.action === "reject" ? <XCircle size={16} /> : <Trash2 size={16} />}{modal.action === "approve" ? "Approuver" : modal.action === "reject" ? "Rejeter" : "Autoriser la purge"}</button></div>
          </div>
        </Modal>
      ) : null}
    </main>
  )
}
