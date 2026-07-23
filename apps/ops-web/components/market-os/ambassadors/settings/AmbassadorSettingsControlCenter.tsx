"use client"

import { useCallback, useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react"
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Banknote,
  BellRing,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileClock,
  FileText,
  GraduationCap,
  History,
  Loader2,
  MapPinned,
  Network,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  Users,
  Workflow,
  X,
  XCircle,
} from "lucide-react"

import AmbassadorMarketSidebar from "../ambassador-market-sidebar"
import { ambassadorSettingsApi } from "@/lib/market-os/ambassadors/settings/client"
import { DEFAULT_AMBASSADOR_SETTINGS_CONFIGURATION } from "@/lib/market-os/ambassadors/settings/defaults"
import type {
  AmbassadorSettingsApproval,
  AmbassadorSettingsConfiguration,
  AmbassadorSettingsControlCenterSnapshot,
  AmbassadorSettingsVersion,
  SettingsApprovalDomain,
  SettingsApprovalStatus,
} from "@/lib/market-os/ambassadors/settings/contracts"

const domains = [
  { key: "overview", label: "Vue exécutive", icon: Activity },
  { key: "program", label: "Identité du programme", icon: BriefcaseBusiness },
  { key: "recruitment", label: "Recrutement et éligibilité", icon: Users },
  { key: "onboarding", label: "Intégration et activation", icon: ClipboardCheck },
  { key: "training", label: "Formation et certification", icon: GraduationCap },
  { key: "territories", label: "Territoires et capacité", icon: MapPinned },
  { key: "missions", label: "Exécution des missions", icon: Workflow },
  { key: "attribution", label: "Leads et attribution", icon: Target },
  { key: "rewards", label: "Récompenses et paiements", icon: CircleDollarSign },
  { key: "kpis", label: "Objectifs et performance", icon: SlidersHorizontal },
  { key: "communications", label: "Communications", icon: BellRing },
  { key: "governance", label: "Sécurité et gouvernance", icon: ShieldCheck },
  { key: "versions", label: "Versions et audit", icon: History },
] as const

type DomainKey = (typeof domains)[number]["key"]
type IconType = ComponentType<{ className?: string; size?: number }>
type ModalState =
  | { kind: "create" }
  | { kind: "validation" }
  | { kind: "impact" }
  | { kind: "decision"; domain: SettingsApprovalDomain }
  | { kind: "publish" }
  | { kind: "rollback"; version: AmbassadorSettingsVersion }
  | null

const statusTone: Record<string, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  approved: "border-blue-200 bg-blue-50 text-blue-700",
  pending_approval: "border-amber-200 bg-amber-50 text-amber-700",
  scheduled: "border-blue-200 bg-blue-50 text-blue-700",
  draft: "border-slate-200 bg-slate-50 text-slate-700",
  revision_requested: "border-orange-200 bg-orange-50 text-orange-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
  failed: "border-red-200 bg-red-50 text-red-700",
  superseded: "border-slate-200 bg-slate-100 text-slate-600",
  rolled_back: "border-orange-200 bg-orange-50 text-orange-700",
}

function cloneConfiguration(configuration: AmbassadorSettingsConfiguration): AmbassadorSettingsConfiguration {
  return JSON.parse(JSON.stringify(configuration)) as AmbassadorSettingsConfiguration
}

function formatDate(value?: string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

function formatDh(value: number): string {
  return `${new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(value || 0)} Dh`
}

const DISPLAY_LABELS: Record<string, string> = {
  active: "Actif",
  paused: "En pause",
  restricted: "Restreint",
  archived: "Archivé",
  published: "Publiée",
  approved: "Approuvée",
  pending: "En attente",
  pending_approval: "Approbation en attente",
  scheduled: "Planifiée",
  draft: "Projet",
  revision_requested: "Révision demandée",
  rejected: "Rejetée",
  failed: "Échec",
  superseded: "Remplacée",
  rolled_back: "Version de restauration",
  cancelled: "Annulée",
  organization: "Organisation",
  program: "Programme",
  country: "Pays",
  region: "Région",
  city: "Ville",
  territory: "Territoire",
  service_line: "Ligne de service",
  weekly: "Hebdomadaire",
  biweekly: "Bimensuel",
  monthly: "Mensuel",
  email: "Email",
  whatsapp: "WhatsApp",
  sms: "SMS",
  in_app: "Notification interne",
  compliance: "Conformité",
  finance: "Finance",
  system: "Système",
}

function titleCase(value: string): string {
  return DISPLAY_LABELS[value] || value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${statusTone[status] || statusTone.draft}`}>
      {titleCase(status)}
    </span>
  )
}

function Button({
  children,
  icon: Icon,
  onClick,
  disabled,
  variant = "secondary",
  type = "button",
}: {
  children: ReactNode
  icon?: IconType
  onClick?: () => void
  disabled?: boolean
  variant?: "primary" | "secondary" | "danger" | "success"
  type?: "button" | "submit"
}) {
  const classes = {
    primary: "border-blue-600 bg-blue-600 text-white hover:bg-blue-700",
    secondary: "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700",
    danger: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  }[variant]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-black shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${classes}`}
    >
      {Icon ? <Icon size={15} /> : null}
      {children}
    </button>
  )
}

function MetricCard({ icon: Icon, label, value, detail }: { icon: IconType; label: string; value: ReactNode; detail: string }) {
  return (
    <article className="min-w-0 border-l border-white/15 px-4 py-2 first:border-l-0 first:pl-0">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-blue-200"><Icon size={17} /></span>
        <div className="min-w-0">
          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-300">{label}</div>
          <div className="mt-1 text-xl font-black tracking-tight text-white">{value}</div>
          <div className="mt-1 text-[11px] font-semibold leading-4 text-slate-300">{detail}</div>
        </div>
      </div>
    </article>
  )
}

function Panel({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-base font-black text-slate-950">{title}</h2>
          {description ? <p className="mt-1 text-xs font-semibold text-slate-500">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-black text-slate-800">{label}</span>
      {hint ? <span className="ml-2 text-[11px] font-semibold text-slate-400">{hint}</span> : null}
      <div className="mt-2">{children}</div>
    </label>
  )
}

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"

function TextField({ value, onChange, disabled, placeholder = "" }: { value: string; onChange: (value: string) => void; disabled?: boolean; placeholder?: string }) {
  return <input className={inputClass} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} placeholder={placeholder} />
}

function NumberField({ value, onChange, disabled, min, max }: { value: number; onChange: (value: number) => void; disabled?: boolean; min?: number; max?: number }) {
  return <input className={inputClass} type="number" value={Number.isFinite(value) ? value : 0} min={min} max={max} onChange={(event) => onChange(Number(event.target.value || 0))} disabled={disabled} />
}

function SelectField({ value, onChange, disabled, options }: { value: string; onChange: (value: string) => void; disabled?: boolean; options: Array<{ value: string; label: string }> }) {
  return (
    <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  )
}

function Toggle({ checked, onChange, disabled, label, description }: { checked: boolean; onChange: (value: boolean) => void; disabled?: boolean; label: string; description?: string }) {
  return (
    <button type="button" disabled={disabled} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-300 disabled:cursor-not-allowed disabled:bg-slate-50">
      <span>
        <span className="block text-xs font-black text-slate-800">{label}</span>
        {description ? <span className="mt-1 block text-[11px] font-semibold leading-4 text-slate-500">{description}</span> : null}
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-blue-600" : "bg-slate-300"}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${checked ? "left-6" : "left-1"}`} />
      </span>
    </button>
  )
}

function ListField({ value, onChange, disabled, placeholder = "Un élément par ligne" }: { value: string[]; onChange: (value: string[]) => void; disabled?: boolean; placeholder?: string }) {
  return (
    <textarea
      className={`${inputClass} min-h-28 resize-y leading-6`}
      value={value.join("\n")}
      onChange={(event) => onChange(event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))}
      disabled={disabled}
      placeholder={placeholder}
    />
  )
}

function SectionIntro({ icon: Icon, title, description }: { icon: IconType; title: string; description: string }) {
  return (
    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-blue-700 shadow-sm"><Icon size={19} /></span>
      <div><h3 className="font-black text-slate-950">{title}</h3><p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{description}</p></div>
    </div>
  )
}

function Modal({ title, description, onClose, children }: { title: string; description?: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6">
      <div role="dialog" aria-modal="true" aria-labelledby="ambassador-settings-modal-title" className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 bg-[#071d3b] px-6 py-5 text-white">
          <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">ANGELCARE · Gouvernance des politiques</p><h2 id="ambassador-settings-modal-title" className="mt-2 text-xl font-black tracking-tight">{title}</h2>{description ? <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-300">{description}</p> : null}</div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10 text-white hover:bg-white/15"><X size={17} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}

export default function AmbassadorSettingsControlCenter() {
  const [snapshot, setSnapshot] = useState<AmbassadorSettingsControlCenterSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [domain, setDomain] = useState<DomainKey>("overview")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [configuration, setConfiguration] = useState<AmbassadorSettingsConfiguration>(cloneConfiguration(DEFAULT_AMBASSADOR_SETTINGS_CONFIGURATION))
  const [title, setTitle] = useState("")
  const [changeSummary, setChangeSummary] = useState("")
  const [dirty, setDirty] = useState(false)
  const [modal, setModal] = useState<ModalState>(null)
  const [createForm, setCreateForm] = useState({ title: "", scopeType: "organization", scopeKey: "default", changeSummary: "" })
  const [decisionForm, setDecisionForm] = useState<{ decision: SettingsApprovalStatus; note: string }>({ decision: "approved", note: "" })
  const [publishAt, setPublishAt] = useState("")
  const [rollbackReason, setRollbackReason] = useState("")

  const load = useCallback(async (quiet = false) => {
    quiet ? setRefreshing(true) : setLoading(true)
    setError(null)
    const response = await ambassadorSettingsApi.load()
    if (!response.ok || !response.data) {
      setError(response.error || "Le centre de gouvernance des politiques n’a pas pu être chargé")
      setLoading(false)
      setRefreshing(false)
      return
    }
    setSnapshot(response.data)
    setSelectedId((current) => current && response.data?.versions.some((version) => version.id === current)
      ? current
      : response.data?.drafts[0]?.id || response.data?.effectiveVersion?.id || null)
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { void load() }, [load])

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

  const selectedVersion = useMemo(() => {
    if (!snapshot || !selectedId) return null
    return snapshot.versions.find((version) => version.id === selectedId) || null
  }, [selectedId, snapshot])

  useEffect(() => {
    if (!snapshot) return
    const version = selectedVersion
    const next = version?.configuration || snapshot.effectiveConfiguration
    setConfiguration(cloneConfiguration(next))
    setTitle(version?.title || "Politique Ambassadeurs effective")
    setChangeSummary(version?.change_summary || "")
    setDirty(false)
  }, [selectedVersion, snapshot])

  const editable = Boolean(selectedVersion && ["draft", "revision_requested"].includes(selectedVersion.status) && snapshot?.capabilities.canDraft)
  const approvalsForSelected = useMemo(() => {
    if (!snapshot || !selectedVersion) return []
    const round = Number(selectedVersion.approval_round || 0)
    return snapshot.approvals.filter((approval) => approval.version_id === selectedVersion.id && Number(approval.approval_round || 0) === round)
  }, [selectedVersion, snapshot])
  const validation = selectedVersion?.validation_result || null
  const impact = selectedVersion?.impact_snapshot || null
  const pendingApproval = approvalsForSelected.find((approval) => approval.status === "pending" && snapshot?.capabilities.approvalDomains.includes(approval.approval_domain))

  function mutateDomain<K extends Exclude<DomainKey, "overview" | "versions">>(key: K, patch: Partial<AmbassadorSettingsConfiguration[K]>) {
    setConfiguration((current) => ({ ...current, [key]: { ...current[key], ...patch } }))
    setDirty(true)
  }

  async function runAction(action: () => Promise<{ ok: boolean; error?: string }>, message: string) {
    setSaving(true)
    setError(null)
    setSuccess(null)
    const response = await action()
    if (!response.ok) setError(response.error || "Action refusée")
    else {
      setSuccess(message)
      await load(true)
    }
    setSaving(false)
    return response.ok
  }

  async function saveDraft() {
    if (!selectedVersion) return
    const ok = await runAction(
      () => ambassadorSettingsApi.updateDraft(selectedVersion.id, { title, changeSummary, configuration }),
      "Projet enregistré sans modifier la politique en production.",
    )
    if (ok) setDirty(false)
  }

  async function createDraft() {
    const ok = await runAction(async () => {
      const response = await ambassadorSettingsApi.createDraft(createForm)
      if (response.ok && response.data) setSelectedId(response.data.id)
      return response
    }, "Nouveau projet de politique créé depuis la configuration effective.")
    if (ok) {
      setModal(null)
      setCreateForm({ title: "", scopeType: "organization", scopeKey: "default", changeSummary: "" })
      setDomain("program")
    }
  }

  async function decideApproval(domainValue: SettingsApprovalDomain) {
    if (!selectedVersion) return
    const ok = await runAction(
      () => ambassadorSettingsApi.decideDraft(selectedVersion.id, { domain: domainValue, decision: decisionForm.decision, note: decisionForm.note }),
      `Décision d’approbation ${titleCase(domainValue)} enregistrée.`,
    )
    if (ok) {
      setModal(null)
      setDecisionForm({ decision: "approved", note: "" })
    }
  }

  async function publish() {
    if (!selectedVersion) return
    const normalized = publishAt ? new Date(publishAt).toISOString() : null
    const ok = await runAction(
      () => ambassadorSettingsApi.publishDraft(selectedVersion.id, normalized),
      normalized ? "Publication planifiée avec succès." : "Version publiée et rendue effective.",
    )
    if (ok) {
      setModal(null)
      setPublishAt("")
    }
  }

  async function rollback(version: AmbassadorSettingsVersion) {
    const ok = await runAction(
      () => ambassadorSettingsApi.rollbackVersion(version.id, rollbackReason),
      `Une nouvelle version de restauration effective a été publiée depuis v${version.revision}.`,
    )
    if (ok) {
      setModal(null)
      setRollbackReason("")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#f4f7fb] text-slate-950">
        <AmbassadorMarketSidebar />
        <main className="min-w-0 flex-1 p-5 xl:p-8">
          <div className="animate-pulse space-y-5">
            <section className="h-44 rounded-[28px] border border-slate-200 bg-white" />
            <section className="h-32 rounded-[26px] bg-[#071d3b]" />
            <section className="grid gap-5 2xl:grid-cols-[230px_minmax(0,1fr)_330px]"><div className="h-[620px] rounded-[24px] border border-slate-200 bg-white" /><div className="h-[620px] rounded-[24px] border border-slate-200 bg-white" /><div className="h-[620px] rounded-[24px] border border-slate-200 bg-white" /></section>
            <p className="sr-only">Chargement de la gouvernance des politiques…</p>
          </div>
        </main>
      </div>
    )
  }

  if (!snapshot) {
    return (
      <div className="flex min-h-screen bg-[#f4f7fb] text-slate-950">
        <AmbassadorMarketSidebar />
        <main className="grid min-w-0 flex-1 place-items-center p-8"><div className="max-w-xl rounded-[28px] border border-red-200 bg-white p-8 text-center shadow-sm"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-700"><AlertTriangle size={28} /></span><h1 className="mt-5 text-xl font-black">Politiques indisponibles</h1><p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{error}</p><p className="mt-2 text-xs font-bold text-slate-400">Le dernier contexte de politique n’est pas remplacé par un faux état de réussite.</p><div className="mt-5"><Button icon={RefreshCw} onClick={() => void load()} variant="primary">Réessayer</Button></div></div></main>
      </div>
    )
  }

  const effective = snapshot.effectiveVersion
  const pendingCount = snapshot.approvals.filter((item) => item.status === "pending").length
  const scheduledCount = snapshot.scheduledPublications.filter((item) => item.status === "scheduled").length

  return (
    <div className="flex min-h-screen min-w-0 bg-[#f5f7fb] text-slate-950">
      <AmbassadorMarketSidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <header className="border-b border-slate-200 bg-white px-5 py-6 xl:px-8 xl:py-7">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-800">POLITIQUES · VERSIONNEMENT · EXÉCUTION</span>
                <StatusBadge status={effective?.status || "draft"} />
              </div>
              <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-[-0.035em] text-slate-950 xl:text-[38px]">Politiques et gouvernance du programme Ambassadeurs</h1>
              <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-600">Pilotez le recrutement, l’activation, les territoires, les missions, l’attribution, les récompenses, les communications et la gouvernance au moyen de versions contrôlées, validations, approbations et publications sécurisées.</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                <span className="rounded-full bg-slate-100 px-3 py-1.5">Périmètre : <b className="text-slate-900">{snapshot.actor.organizationId}</b></span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5">Rôle : <b className="text-slate-900">{snapshot.actor.roleKey}</b></span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5">Acteur : <b className="text-slate-900">{snapshot.actor.displayName}</b></span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button icon={RefreshCw} onClick={() => void load(true)} disabled={refreshing}>{refreshing ? "Actualisation…" : "Actualiser"}</Button>
              {snapshot.capabilities.canProcessRuntime && scheduledCount > 0 ? <Button icon={PlayCircle} onClick={() => void runAction(() => ambassadorSettingsApi.processRuntime(), "File des publications arrivées à échéance traitée.")} disabled={saving}>Traiter les publications dues</Button> : null}
              {snapshot.capabilities.canDraft ? <Button icon={FileText} onClick={() => setModal({ kind: "create" })} variant="primary">Créer un projet de politique</Button> : null}
            </div>
          </div>
        </header>

        <div className="space-y-5 p-5 xl:p-8">
          {error ? <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800"><AlertTriangle className="mt-0.5 shrink-0" size={17} /><span>{error}</span><button className="ml-auto" onClick={() => setError(null)}><X size={16} /></button></div> : null}
          {success ? <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800"><CheckCircle2 className="mt-0.5 shrink-0" size={17} /><span>{success}</span><button className="ml-auto" onClick={() => setSuccess(null)}><X size={16} /></button></div> : null}
          {snapshot.diagnostics.map((item, index) => <div key={`${item.message}-${index}`} className={`rounded-2xl border p-4 text-sm font-bold ${item.severity === "error" ? "border-red-200 bg-red-50 text-red-800" : item.severity === "warning" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-blue-200 bg-blue-50 text-blue-800"}`}>{item.message}</div>)}

          <section className="grid gap-4 rounded-[26px] bg-[#071d3b] p-5 shadow-[0_18px_50px_rgba(7,29,59,0.18)] sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard icon={FileCheck2} label="Politique effective" value={effective ? `v${effective.revision}` : "Historique"} detail={effective ? `Publiée le ${formatDate(effective.published_at)}` : "Première publication versionnée attendue"} />
            <MetricCard icon={Network} label="État du programme" value={titleCase(configuration.program.status)} detail={`${configuration.program.activeCities.length} villes actives · ${configuration.program.serviceLines.length} lignes de service`} />
            <MetricCard icon={ShieldCheck} label="Validation" value={validation ? `${validation.score}/100` : "Non exécutée"} detail={validation ? `${validation.issues.length} point(s) de contrôle` : "Validation requise avant soumission"} />
            <MetricCard icon={FileClock} label="Approbations" value={pendingCount} detail={`${snapshot.drafts.length} projet(s) ou diffusion(s) ouverte(s)`} />
            <MetricCard icon={CalendarClock} label="Exécution" value={snapshot.activeScopes.length} detail={`${scheduledCount} publication(s) planifiée(s) · ${snapshot.runtimeEvents.filter((event) => event.status === "failed").length} échec(s)`} />
          </section>

          <section className="grid gap-5 2xl:grid-cols-[230px_minmax(0,1fr)_330px]">
            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm 2xl:sticky 2xl:top-5">
              <div className="px-3 pb-3 pt-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Domaines de gouvernance</div>
              <nav className="space-y-1">
                {domains.map((item) => {
                  const Icon = item.icon
                  const active = domain === item.key
                  return (
                    <button key={item.key} type="button" onClick={() => setDomain(item.key)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-black transition ${active ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}>
                      <Icon size={15} /><span className="min-w-0 flex-1">{item.label}</span>{active ? <ChevronRight size={14} /> : null}
                    </button>
                  )
                })}
              </nav>
            </aside>

            <div className="min-w-0 space-y-5">
              <Panel
                title={title}
                description={selectedVersion ? `Version v${selectedVersion.revision} · ${titleCase(selectedVersion.scope_type)} : ${selectedVersion.scope_key}` : "Configuration effective actuelle"}
                action={<StatusBadge status={selectedVersion?.status || effective?.status || "published"} />}
              >
                <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
                  <Field label="Titre de la version"><TextField value={title} onChange={(value) => { setTitle(value); setDirty(true) }} disabled={!editable} /></Field>
                  <Field label="Synthèse des changements" hint="obligatoire avant soumission"><TextField value={changeSummary} onChange={(value) => { setChangeSummary(value); setDirty(true) }} disabled={!editable} placeholder="Expliquez pourquoi cette évolution de politique est nécessaire" /></Field>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  {editable ? <Button icon={Save} onClick={() => void saveDraft()} disabled={saving || !dirty} variant="primary">Enregistrer le projet</Button> : null}
                  {selectedVersion && ["draft", "revision_requested"].includes(selectedVersion.status) && snapshot.capabilities.canValidate ? <Button icon={ShieldCheck} onClick={() => setModal({ kind: "validation" })} disabled={saving || dirty}>Valider la configuration</Button> : null}
                  {selectedVersion && ["draft", "revision_requested", "pending_approval", "approved"].includes(selectedVersion.status) && snapshot.capabilities.canValidate ? <Button icon={Activity} onClick={() => setModal({ kind: "impact" })} disabled={saving || dirty}>Simuler l’impact</Button> : null}
                  {selectedVersion && ["draft", "revision_requested"].includes(selectedVersion.status) && snapshot.capabilities.canSubmit ? <Button icon={Send} onClick={() => void runAction(() => ambassadorSettingsApi.submitDraft(selectedVersion.id), "Version soumise au circuit d’approbation contrôlé.")} disabled={saving || dirty || !validation?.valid} variant="success">Soumettre à approbation</Button> : null}
                  {selectedVersion?.status === "pending_approval" && snapshot.capabilities.canApprove && pendingApproval ? <Button icon={BadgeCheck} onClick={() => setModal({ kind: "decision", domain: pendingApproval.approval_domain })} variant="success">Décider · {titleCase(pendingApproval.approval_domain)}</Button> : null}
                  {selectedVersion?.status === "approved" && snapshot.capabilities.canPublish ? <Button icon={PlayCircle} onClick={() => setModal({ kind: "publish" })} variant="primary">Publier ou planifier</Button> : null}
                  {dirty ? <span className="ml-auto text-xs font-black text-amber-600">Modifications non enregistrées</span> : null}
                </div>
              </Panel>

              {domain === "overview" ? <Overview configuration={configuration} version={selectedVersion} approvals={approvalsForSelected} /> : null}
              {domain !== "overview" && domain !== "versions" ? (
                <Panel title={domains.find((item) => item.key === domain)?.label || "Domaine de politique"} description={editable ? "Éditeur structuré du projet. Les changements restent isolés jusqu’à leur approbation et publication." : "Consultation en lecture seule de la version effective ou contrôlée."}>
                  <DomainEditor domain={domain} configuration={configuration} mutate={mutateDomain} disabled={!editable} />
                </Panel>
              ) : null}
              {domain === "versions" ? <VersionsPanel snapshot={snapshot} selectedId={selectedId} onSelect={setSelectedId} onRollback={(version) => setModal({ kind: "rollback", version })} /> : null}
            </div>

            <aside className="space-y-5">
              <Panel title="File des versions" description="Projets, approbations et publications planifiées">
                <div className="space-y-2">
                  {snapshot.drafts.length ? snapshot.drafts.map((version) => (
                    <button key={version.id} type="button" onClick={() => setSelectedId(version.id)} className={`w-full rounded-xl border p-3 text-left transition ${selectedId === version.id ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:border-blue-200"}`}>
                      <div className="flex items-center justify-between gap-2"><span className="text-xs font-black text-slate-900">v{version.revision} · {version.title}</span><StatusBadge status={version.status} /></div>
                      <div className="mt-2 text-[11px] font-semibold text-slate-500">Mis à jour le {formatDate(version.updated_at)}</div>
                    </button>
                  )) : <div className="rounded-xl bg-slate-50 p-4 text-xs font-bold text-slate-500">Aucun projet de politique ouvert.</div>}
                </div>
              </Panel>

              <Panel title="Portes d’approbation" description="Dernier cycle pour la version sélectionnée">
                <div className="space-y-2">
                  {approvalsForSelected.length ? approvalsForSelected.map((approval) => <ApprovalRow key={approval.id} approval={approval} />) : <div className="rounded-xl bg-slate-50 p-4 text-xs font-bold text-slate-500">Aucune porte d’approbation créée pour cette version.</div>}
                </div>
              </Panel>

              <Panel title="Preuves de mise en production" description="Dernières preuves de validation et d’impact">
                <div className="space-y-3 text-xs font-semibold text-slate-600">
                  <InfoRow label="Score de validation" value={validation ? `${validation.score}/100` : "Non disponible"} />
                  <InfoRow label="Erreurs bloquantes" value={String(validation?.issues.filter((item) => item.severity === "error").length || 0)} />
                  <InfoRow label="Niveau de risque" value={impact?.riskLevel || "Non simulé"} />
                  <InfoRow label="Ambassadeurs concernés" value={String(impact?.affectedAmbassadors || 0)} />
                  <InfoRow label="Exposition des paiements en attente" value={formatDh(impact?.pendingPayoutsMad || 0)} />
                  <InfoRow label="Écart de commission simulé" value={formatDh(impact?.projectedCommissionDeltaMad || 0)} />
                </div>
                {validation?.issues.length ? <div className="mt-4 space-y-2">{validation.issues.slice(0, 5).map((item) => <div key={`${item.path}-${item.code}`} className={`rounded-xl border p-3 text-[11px] font-bold ${item.severity === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>{item.message}</div>)}</div> : null}
              </Panel>
            </aside>
          </section>
        </div>
      </main>

      {modal?.kind === "create" ? (
        <Modal title="Créer un projet de politique" description="Le projet part de la configuration actuellement effective. La production reste inchangée." onClose={() => setModal(null)}>
          <div className="space-y-4">
            <Field label="Titre du projet"><TextField value={createForm.title} onChange={(value) => setCreateForm((current) => ({ ...current, title: value }))} placeholder="Exemple : Politique nationale Ambassadeurs — T3" /></Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Type de périmètre"><SelectField value={createForm.scopeType} onChange={(value) => setCreateForm((current) => ({ ...current, scopeType: value }))} options={["organization", "program", "country", "region", "city", "territory", "service_line"].map((value) => ({ value, label: titleCase(value) }))} /></Field>
              <Field label="Clé de périmètre"><TextField value={createForm.scopeKey} onChange={(value) => setCreateForm((current) => ({ ...current, scopeKey: value }))} /></Field>
            </div>
            <Field label="Synthèse initiale des changements"><textarea className={`${inputClass} min-h-24`} value={createForm.changeSummary} onChange={(event) => setCreateForm((current) => ({ ...current, changeSummary: event.target.value }))} /></Field>
            <div className="sticky bottom-0 -mx-6 -mb-6 flex justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4"><Button onClick={() => setModal(null)}>Annuler</Button><Button icon={FileText} onClick={() => void createDraft()} disabled={saving || !createForm.title.trim()} variant="primary">Créer le projet isolé</Button></div>
          </div>
        </Modal>
      ) : null}

      {modal?.kind === "validation" && selectedVersion ? (
        <Modal title="Valider la configuration" description="Exécutez les contrôles backend existants sur la version sélectionnée. Le frontend ne recalcule aucun résultat." onClose={() => setModal(null)}>
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Version contrôlée</p><h3 className="mt-1 text-lg font-black text-slate-950">v{selectedVersion.revision} · {selectedVersion.title}</h3><p className="mt-1 text-xs font-semibold text-slate-500">{titleCase(selectedVersion.scope_type)} · {selectedVersion.scope_key}</p></div><StatusBadge status={selectedVersion.status} /></div>
            </section>
            {validation ? (
              <section className={`rounded-2xl border p-4 ${validation.valid ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
                <div className="flex items-start justify-between gap-4"><div><p className={`text-sm font-black ${validation.valid ? "text-emerald-950" : "text-rose-950"}`}>{validation.valid ? "Configuration valide" : "Configuration non valide"}</p><p className={`mt-1 text-xs font-semibold ${validation.valid ? "text-emerald-800" : "text-rose-800"}`}>{validation.issues.length} point(s) de contrôle · score {validation.score}/100</p></div><span className={`text-2xl font-black tabular-nums ${validation.valid ? "text-emerald-700" : "text-rose-700"}`}>{validation.score}</span></div>
                {validation.issues.length ? <div className="mt-4 space-y-2">{validation.issues.map((item) => <div key={`${item.path}-${item.code}`} className="rounded-xl border border-white/70 bg-white/70 p-3"><div className="flex items-start justify-between gap-3"><p className="text-xs font-black text-slate-900">{item.message}</p><span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${item.severity === "error" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>{item.severity === "error" ? "Erreur" : "Avertissement"}</span></div><p className="mt-1 text-[10px] font-semibold text-slate-500">{item.path}</p></div>)}</div> : null}
              </section>
            ) : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">Aucune validation enregistrée pour cette version.</div>}
            <div className="sticky bottom-0 -mx-6 -mb-6 flex justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4"><Button onClick={() => setModal(null)}>Annuler</Button><Button icon={ShieldCheck} onClick={() => void (async () => { const ok = await runAction(() => ambassadorSettingsApi.validateDraft(selectedVersion.id), "Validation exécutée et enregistrée."); if (ok) setModal(null) })()} disabled={saving || dirty} variant="primary">{validation ? "Relancer la validation" : "Exécuter la validation"}</Button></div>
          </div>
        </Modal>
      ) : null}

      {modal?.kind === "impact" && selectedVersion ? (
        <Modal title="Simuler l’impact opérationnel" description="La simulation présentée provient exclusivement du backend existant. Aucun score, risque ou montant n’est inventé par l’interface." onClose={() => setModal(null)}>
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Version analysée</p><h3 className="mt-1 text-lg font-black text-slate-950">v{selectedVersion.revision} · {selectedVersion.title}</h3><p className="mt-1 text-xs font-semibold text-slate-500">{titleCase(selectedVersion.scope_type)} · {selectedVersion.scope_key}</p></div><StatusBadge status={selectedVersion.status} /></div></section>
            {impact ? <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Ambassadeurs concernés", impact.affectedAmbassadors],
                ["Territoires concernés", impact.affectedTerritories],
                ["Missions ouvertes", impact.openMissions],
                ["Candidats en pipeline", impact.candidatesInPipeline],
                ["Conversions en attente", impact.pendingConversions],
                ["Récompenses en attente", impact.pendingRewards],
                ["Paiements en attente", formatDh(impact.pendingPayoutsMad || 0)],
                ["Écart de commission", formatDh(impact.projectedCommissionDeltaMad || 0)],
                ["Niveau de risque", titleCase(impact.riskLevel || "non_simulé")],
              ].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-2 text-xl font-black tabular-nums text-slate-950">{value ?? 0}</p></div>)}
            </section> : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">Aucune simulation enregistrée pour cette version.</div>}
            {impact?.warnings?.length ? <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-amber-800">Avertissements backend</p><div className="mt-3 space-y-2">{impact.warnings.map((warning, index) => <p key={`${warning}-${index}`} className="text-sm font-semibold leading-6 text-amber-900">• {warning}</p>)}</div></section> : null}
            <div className="sticky bottom-0 -mx-6 -mb-6 flex justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4"><Button onClick={() => setModal(null)}>Annuler</Button><Button icon={Activity} onClick={() => void (async () => { const ok = await runAction(() => ambassadorSettingsApi.simulateDraft(selectedVersion.id), "Impact opérationnel et financier simulé."); if (ok) setModal(null) })()} disabled={saving || dirty} variant="primary">{impact ? "Relancer la simulation" : "Exécuter la simulation"}</Button></div>
          </div>
        </Modal>
      ) : null}

      {modal?.kind === "decision" ? (
        <Modal title={`Décision d’approbation · ${titleCase(modal.domain)}`} description="L’acteur authentifié et la note de décision seront conservés dans l’audit immuable." onClose={() => setModal(null)}>
          <div className="space-y-4">
            <Field label="Décision"><SelectField value={decisionForm.decision} onChange={(value) => setDecisionForm((current) => ({ ...current, decision: value as SettingsApprovalStatus }))} options={[{ value: "approved", label: "Approuver" }, { value: "revision_requested", label: "Demander une révision" }, { value: "rejected", label: "Rejeter" }]} /></Field>
            <Field label="Note de décision"><textarea className={`${inputClass} min-h-28`} value={decisionForm.note} onChange={(event) => setDecisionForm((current) => ({ ...current, note: event.target.value }))} placeholder="Consignez la justification et les conditions requises" /></Field>
            <div className="sticky bottom-0 -mx-6 -mb-6 flex justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4"><Button onClick={() => setModal(null)}>Annuler</Button><Button icon={BadgeCheck} onClick={() => void decideApproval(modal.domain)} disabled={saving || !decisionForm.note.trim()} variant={decisionForm.decision === "approved" ? "success" : "danger"}>Enregistrer la décision</Button></div>
          </div>
        </Modal>
      ) : null}

      {modal?.kind === "publish" ? (
        <Modal title="Publier la politique approuvée" description="Publiez immédiatement ou planifiez l’activation. Le pointeur de politique effective est mis à jour transactionnellement par le backend existant." onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800"><CheckCircle2 className="mr-2 inline" size={17} />Toutes les portes d’approbation requises doivent être complètes avant que cette action puisse aboutir.</div>
            <Field label="Activation planifiée" hint="laisser vide pour publier immédiatement"><input className={inputClass} type="datetime-local" value={publishAt} onChange={(event) => setPublishAt(event.target.value)} /></Field>
            <div className="sticky bottom-0 -mx-6 -mb-6 flex justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4"><Button onClick={() => setModal(null)}>Annuler</Button><Button icon={publishAt ? CalendarClock : PlayCircle} onClick={() => void publish()} disabled={saving} variant="primary">{publishAt ? "Planifier la publication" : "Publier maintenant"}</Button></div>
          </div>
        </Modal>
      ) : null}

      {modal?.kind === "rollback" ? (
        <Modal title={`Restaurer la politique depuis v${modal.version.revision}`} description="Une restauration ne réécrit jamais l’historique. Elle publie une nouvelle version copiée depuis la politique historique sélectionnée." onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800"><AlertTriangle className="mr-2 inline" size={17} />Cette action modifie la doctrine d’exploitation effective dès que le contrôle transactionnel aboutit.</div>
            <Field label="Motif obligatoire de restauration"><textarea className={`${inputClass} min-h-28`} value={rollbackReason} onChange={(event) => setRollbackReason(event.target.value)} placeholder="Décrivez l’incident, le risque ou la raison opérationnelle justifiant la restauration" /></Field>
            <div className="sticky bottom-0 -mx-6 -mb-6 flex justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4"><Button onClick={() => setModal(null)}>Annuler</Button><Button icon={RotateCcw} onClick={() => void rollback(modal.version)} disabled={saving || !rollbackReason.trim()} variant="danger">Publier la version de restauration</Button></div>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

function Overview({ configuration, version, approvals }: { configuration: AmbassadorSettingsConfiguration; version: AmbassadorSettingsVersion | null; approvals: AmbassadorSettingsApproval[] }) {
  const controls = [
    ["Périmètre du programme", `${configuration.program.activeCities.length} villes · ${configuration.program.serviceLines.length} lignes de service`, BriefcaseBusiness],
    ["Filtre de recrutement", `Seuil d’entretien ${configuration.recruitment.interviewMinimumScore}/100`, Users],
    ["Certification", `${configuration.training.certificationMinimumScore}/100 · validité ${configuration.training.certificationValidityDays} jours`, GraduationCap],
    ["Capacité mission", `${configuration.missions.maximumConcurrentMissions} simultanée(s) · preuve ${configuration.missions.proofRequired ? "obligatoire" : "facultative"}`, Workflow],
    ["Doctrine de commission", `${configuration.rewards.defaultCommissionRate}% · minimum ${formatDh(configuration.rewards.minimumPayoutMad)}`, Banknote],
    ["Gouvernance", configuration.governance.separationOfDutiesRequired ? "Séparation des responsabilités active" : "Séparation des responsabilités désactivée", ShieldCheck],
  ] as Array<[string, string, IconType]>
  return (
    <div className="space-y-5">
      <Panel title="Doctrine d’exploitation" description="Les règles principales que cette version appliquera après publication.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {controls.map(([label, value, Icon]) => <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"><Icon className="text-blue-700" size={18} /><div className="mt-3 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">{label}</div><div className="mt-1 text-sm font-black text-slate-900">{value}</div></div>)}
        </div>
      </Panel>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Préparation de la version" description="Progression actuelle dans la chaîne de publication contrôlée.">
          <div className="space-y-3">
            {["Projet", "Validée", "Simulée", "Approuvée", "Publiée"].map((step, index) => {
              const complete = index === 0 || Boolean(version?.validation_result) && index <= 1 || Boolean(version?.impact_snapshot) && index <= 2 || ["approved", "scheduled", "published", "superseded"].includes(version?.status || "") && index <= 3 || ["published", "superseded"].includes(version?.status || "") && index <= 4
              return <div key={step} className="flex items-center gap-3"><span className={`grid h-7 w-7 place-items-center rounded-full ${complete ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>{complete ? <Check size={14} /> : index + 1}</span><span className={`text-sm font-black ${complete ? "text-slate-900" : "text-slate-400"}`}>{step}</span></div>
            })}
          </div>
        </Panel>
        <Panel title="Architecture d’approbation" description="Domaines de décision créés pour le cycle d’approbation sélectionné.">
          <div className="space-y-2">{approvals.length ? approvals.map((approval) => <ApprovalRow key={approval.id} approval={approval} />) : <div className="rounded-xl bg-slate-50 p-4 text-xs font-bold text-slate-500">Les portes d’approbation sont créées après validation et soumission réussies.</div>}</div>
        </Panel>
      </div>
    </div>
  )
}

function ApprovalRow({ approval }: { approval: AmbassadorSettingsApproval }) {
  const Icon = approval.status === "approved" ? CheckCircle2 : approval.status === "pending" ? Clock3 : XCircle
  return <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><span className={`grid h-8 w-8 place-items-center rounded-lg ${approval.status === "approved" ? "bg-emerald-50 text-emerald-700" : approval.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}><Icon size={16} /></span><div className="min-w-0 flex-1"><div className="text-xs font-black text-slate-900">{titleCase(approval.approval_domain)}</div><div className="mt-0.5 text-[11px] font-semibold text-slate-500">{approval.decision_note || "Décision autorisée en attente"}</div></div><StatusBadge status={approval.status} /></div>
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2 last:border-0 last:pb-0"><span>{label}</span><b className="text-right text-slate-900">{value}</b></div>
}

function VersionsPanel({ snapshot, selectedId, onSelect, onRollback }: { snapshot: AmbassadorSettingsControlCenterSnapshot; selectedId: string | null; onSelect: (id: string) => void; onRollback: (version: AmbassadorSettingsVersion) => void }) {
  return (
    <div className="space-y-5">
      <Panel title="Périmètres de politique effectifs" description="Pointeurs publiés résolus par le moteur existant du périmètre le plus spécifique au plus général.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {snapshot.activeScopes.length ? snapshot.activeScopes.map((scope) => {
            const version = snapshot.versions.find((item) => item.id === scope.current_version_id)
            return <button key={String(scope.id)} type="button" onClick={() => version && onSelect(version.id)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-blue-300"><div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{titleCase(String(scope.scope_type))} · {String(scope.scope_key)}</div><div className="mt-2 text-sm font-black text-slate-900">{version ? `v${version.revision} · ${version.title}` : "Pointeur publié"}</div><div className="mt-1 text-[11px] font-semibold text-slate-500">Effective depuis le {formatDate(String(scope.published_at || ""))}</div></button>
          }) : <div className="rounded-xl bg-slate-50 p-4 text-xs font-bold text-slate-500">Aucun périmètre versionné n’est encore actif. Les paramètres historiques restent la référence organisationnelle.</div>}
        </div>
      </Panel>
      <Panel title="Historique des versions" description="Chaque configuration demeure traçable. Une publication historique n’est jamais modifiée sur place.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500"><tr><th className="px-4 py-3">Version</th><th>Titre</th><th>Périmètre</th><th>Statut</th><th>Validation</th><th>Publication</th><th>Actions</th></tr></thead>
            <tbody>
              {snapshot.versions.map((version) => (
                <tr key={version.id} className={`border-t border-slate-100 ${selectedId === version.id ? "bg-blue-50/60" : "hover:bg-slate-50"}`}>
                  <td className="px-4 py-4 font-black text-slate-950">v{version.revision}</td>
                  <td><div className="font-black text-slate-900">{version.title}</div><div className="mt-1 max-w-xs truncate font-semibold text-slate-500">{version.change_summary || "Aucune synthèse"}</div></td>
                  <td className="font-bold text-slate-600">{titleCase(version.scope_type)} : {version.scope_key}</td>
                  <td><StatusBadge status={version.status} /></td>
                  <td className="font-black">{version.validation_result ? `${version.validation_result.score}/100` : "—"}</td>
                  <td className="font-semibold text-slate-500">{formatDate(version.published_at)}</td>
                  <td><div className="flex gap-2"><Button onClick={() => onSelect(version.id)}>Ouvrir</Button>{snapshot.capabilities.canRollback && ["published", "superseded", "rolled_back"].includes(version.status) ? <Button icon={RotateCcw} onClick={() => onRollback(version)} variant="danger">Restaurer</Button> : null}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Preuves d’exécution immuables" description="Derniers événements de validation, simulation, publication et restauration.">
        <div className="space-y-2">{snapshot.runtimeEvents.length ? snapshot.runtimeEvents.map((event) => <div key={event.id} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-50 text-blue-700"><Activity size={15} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><b className="text-xs text-slate-900">{titleCase(event.event_type)}</b><StatusBadge status={event.status} /></div><p className="mt-1 text-xs font-semibold text-slate-600">{event.summary}</p><p className="mt-1 text-[10px] font-bold text-slate-400">{formatDate(event.created_at)}</p></div></div>) : <div className="rounded-xl bg-slate-50 p-4 text-xs font-bold text-slate-500">Aucune preuve d’exécution enregistrée.</div>}</div>
      </Panel>
    </div>
  )
}

function DomainEditor({ domain, configuration, mutate, disabled }: { domain: Exclude<DomainKey, "overview" | "versions">; configuration: AmbassadorSettingsConfiguration; mutate: <K extends Exclude<DomainKey, "overview" | "versions">>(key: K, patch: Partial<AmbassadorSettingsConfiguration[K]>) => void; disabled: boolean }) {
  if (domain === "program") {
    const value = configuration.program
    return <div><SectionIntro icon={BriefcaseBusiness} title="Identité du programme et périmètre d’exploitation" description="Définissez le programme national, les villes actives, la couverture de services, les responsables et la capacité sans modifier la production avant publication." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Nom du programme"><TextField value={value.programName} onChange={(programName) => mutate("program", { programName })} disabled={disabled} /></Field>
      <Field label="Code du programme"><TextField value={value.programCode} onChange={(programCode) => mutate("program", { programCode })} disabled={disabled} /></Field>
      <Field label="État du programme"><SelectField value={value.status} onChange={(status) => mutate("program", { status: status as typeof value.status })} disabled={disabled} options={["active", "paused", "restricted", "archived"].map((item) => ({ value: item, label: titleCase(item) }))} /></Field>
      <Field label="Pays"><TextField value={value.country} onChange={(country) => mutate("program", { country })} disabled={disabled} /></Field>
      <Field label="Région par défaut"><TextField value={value.defaultRegion} onChange={(defaultRegion) => mutate("program", { defaultRegion })} disabled={disabled} /></Field>
      <Field label="Fuseau horaire"><TextField value={value.timezone} onChange={(timezone) => mutate("program", { timezone })} disabled={disabled} /></Field>
      <Field label="Objectif de capacité"><NumberField value={value.capacityTarget} onChange={(capacityTarget) => mutate("program", { capacityTarget })} disabled={disabled} min={1} /></Field>
      <Field label="Maximum d’Ambassadeurs actifs"><NumberField value={value.maximumActiveAmbassadors} onChange={(maximumActiveAmbassadors) => mutate("program", { maximumActiveAmbassadors })} disabled={disabled} min={1} /></Field>
      <Field label="Langue par défaut"><SelectField value={value.defaultLanguage} onChange={(defaultLanguage) => mutate("program", { defaultLanguage: defaultLanguage as typeof value.defaultLanguage })} disabled={disabled} options={[{ value: "fr", label: "Français" }, { value: "ar", label: "Arabe" }, { value: "en", label: "Anglais" }]} /></Field>
      <Field label="Responsable du programme"><TextField value={value.programOwner} onChange={(programOwner) => mutate("program", { programOwner })} disabled={disabled} /></Field>
      <Field label="Responsable conformité"><TextField value={value.complianceOwner} onChange={(complianceOwner) => mutate("program", { complianceOwner })} disabled={disabled} /></Field>
      <Field label="Responsable finance"><TextField value={value.financeOwner} onChange={(financeOwner) => mutate("program", { financeOwner })} disabled={disabled} /></Field>
      <div className="md:col-span-2"><Field label="Villes actives"><ListField value={value.activeCities} onChange={(activeCities) => mutate("program", { activeCities })} disabled={disabled} /></Field></div>
      <div><Field label="Lignes de service"><ListField value={value.serviceLines} onChange={(serviceLines) => mutate("program", { serviceLines })} disabled={disabled} /></Field></div>
      <div className="md:col-span-2 xl:col-span-3"><Toggle checked={value.applicationOpen} onChange={(applicationOpen) => mutate("program", { applicationOpen })} disabled={disabled} label="Candidatures publiques ouvertes" description="Lorsque ce paramètre est désactivé, les nouvelles candidatures doivent être bloquées à l’entrée." /></div>
    </div></div>
  }

  if (domain === "recruitment") {
    const value = configuration.recruitment
    return <div><SectionIntro icon={Users} title="Doctrine de recrutement et d’éligibilité" description="Contrôlez les exigences d’identité, la déduplication, les seuils de sélection, les étapes du cycle et l’autorité d’exception." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Âge minimum"><NumberField value={value.minimumAge} onChange={(minimumAge) => mutate("recruitment", { minimumAge })} disabled={disabled} min={18} /></Field>
      <Field label="Seuil minimum d’entretien"><NumberField value={value.interviewMinimumScore} onChange={(interviewMinimumScore) => mutate("recruitment", { interviewMinimumScore })} disabled={disabled} min={0} max={100} /></Field>
      <Field label="Conservation des candidats — jours"><NumberField value={value.candidateRetentionDays} onChange={(candidateRetentionDays) => mutate("recruitment", { candidateRetentionDays })} disabled={disabled} min={1} /></Field>
      <Field label="Politique de doublons"><SelectField value={value.duplicatePolicy} onChange={(duplicatePolicy) => mutate("recruitment", { duplicatePolicy: duplicatePolicy as typeof value.duplicatePolicy })} disabled={disabled} options={[{ value: "email_or_phone", label: "Email or phone" }, { value: "email", label: "Email only" }, { value: "phone", label: "Phone only" }]} /></Field>
      <Field label="Champs obligatoires"><ListField value={value.requiredFields} onChange={(requiredFields) => mutate("recruitment", { requiredFields })} disabled={disabled} /></Field>
      <Field label="Documents obligatoires"><ListField value={value.requiredDocuments} onChange={(requiredDocuments) => mutate("recruitment", { requiredDocuments })} disabled={disabled} /></Field>
      <Field label="Villes acceptées"><ListField value={value.acceptedCities} onChange={(acceptedCities) => mutate("recruitment", { acceptedCities })} disabled={disabled} /></Field>
      <Field label="Langues requises"><ListField value={value.requiredLanguages} onChange={(requiredLanguages) => mutate("recruitment", { requiredLanguages })} disabled={disabled} /></Field>
      <Field label="Étapes contrôlées"><ListField value={value.stages} onChange={(stages) => mutate("recruitment", { stages })} disabled={disabled} /></Field>
      <div className="md:col-span-2 xl:col-span-3 grid gap-3 md:grid-cols-2"><Toggle checked={value.allowManualExceptions} onChange={(allowManualExceptions) => mutate("recruitment", { allowManualExceptions })} disabled={disabled} label="Autoriser les exceptions documentées" /><Toggle checked={value.conversionRequiresApproval} onChange={(conversionRequiresApproval) => mutate("recruitment", { conversionRequiresApproval })} disabled={disabled} label="Conversion du candidat soumise à approbation" /></div>
      <div className="md:col-span-2 xl:col-span-3"><Field label="Motifs de rejet automatique"><ListField value={value.automaticRejectionReasons} onChange={(automaticRejectionReasons) => mutate("recruitment", { automaticRejectionReasons })} disabled={disabled} /></Field></div>
    </div></div>
  }

  if (domain === "onboarding") {
    const value = configuration.onboarding
    return <div><SectionIntro icon={ClipboardCheck} title="Portes d’intégration et d’activation" description="Déterminez précisément ce qui doit être accompli avant qu’un Ambassadeur devienne opérationnel." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Délai de réalisation — jours"><NumberField value={value.completionDeadlineDays} onChange={(completionDeadlineDays) => mutate("onboarding", { completionDeadlineDays })} disabled={disabled} min={1} /></Field>
      <Field label="Intervalle de rappel — heures"><NumberField value={value.automaticReminderHours} onChange={(automaticReminderHours) => mutate("onboarding", { automaticReminderHours })} disabled={disabled} min={1} /></Field>
      <Field label="Escalade après — heures"><NumberField value={value.escalationAfterHours} onChange={(escalationAfterHours) => mutate("onboarding", { escalationAfterHours })} disabled={disabled} min={1} /></Field>
      <div className="md:col-span-2 xl:col-span-3"><Field label="Étapes d’activation obligatoires"><ListField value={value.mandatorySteps} onChange={(mandatorySteps) => mutate("onboarding", { mandatorySteps })} disabled={disabled} /></Field></div>
      <Toggle checked={value.profileVerificationRequired} onChange={(profileVerificationRequired) => mutate("onboarding", { profileVerificationRequired })} disabled={disabled} label="Vérification du profil obligatoire" />
      <Toggle checked={value.contractAcknowledgementRequired} onChange={(contractAcknowledgementRequired) => mutate("onboarding", { contractAcknowledgementRequired })} disabled={disabled} label="Acceptation du contrat obligatoire" />
      <Toggle checked={value.bankDetailsRequired} onChange={(bankDetailsRequired) => mutate("onboarding", { bankDetailsRequired })} disabled={disabled} label="Coordonnées bancaires obligatoires" />
      <Toggle checked={value.territoryConfirmationRequired} onChange={(territoryConfirmationRequired) => mutate("onboarding", { territoryConfirmationRequired })} disabled={disabled} label="Confirmation du territoire obligatoire" />
      <Toggle checked={value.managerApprovalRequired} onChange={(managerApprovalRequired) => mutate("onboarding", { managerApprovalRequired })} disabled={disabled} label="Approbation manager obligatoire" />
      <Toggle checked={value.suspendOnExpiredDocuments} onChange={(suspendOnExpiredDocuments) => mutate("onboarding", { suspendOnExpiredDocuments })} disabled={disabled} label="Suspendre en cas de documents expirés" />
    </div></div>
  }

  if (domain === "training") {
    const value = configuration.training
    return <div><SectionIntro icon={GraduationCap} title="Contrôles de formation et certification" description="Protégez la qualité des missions grâce aux formations obligatoires, seuils de réussite, durées de validité et recertifications." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Seuil minimum de certification"><NumberField value={value.certificationMinimumScore} onChange={(certificationMinimumScore) => mutate("training", { certificationMinimumScore })} disabled={disabled} min={60} max={100} /></Field>
      <Field label="Nombre maximal de tentatives"><NumberField value={value.maximumAttempts} onChange={(maximumAttempts) => mutate("training", { maximumAttempts })} disabled={disabled} min={1} /></Field>
      <Field label="Validité de la certification — jours"><NumberField value={value.certificationValidityDays} onChange={(certificationValidityDays) => mutate("training", { certificationValidityDays })} disabled={disabled} min={30} /></Field>
      <Field label="Rappel de recertification — jours"><NumberField value={value.recertificationReminderDays} onChange={(recertificationReminderDays) => mutate("training", { recertificationReminderDays })} disabled={disabled} min={1} /></Field>
      <div className="md:col-span-2"><Field label="Programmes obligatoires"><ListField value={value.mandatoryPrograms} onChange={(mandatoryPrograms) => mutate("training", { mandatoryPrograms })} disabled={disabled} /></Field></div>
      <Field label="Rôles autorisés à certifier"><ListField value={value.authorizedCertifierRoles} onChange={(authorizedCertifierRoles) => mutate("training", { authorizedCertifierRoles })} disabled={disabled} /></Field>
      <Toggle checked={value.fieldShadowingRequired} onChange={(fieldShadowingRequired) => mutate("training", { fieldShadowingRequired })} disabled={disabled} label="Immersion terrain obligatoire" />
      <Toggle checked={value.suspendOnCertificationExpiry} onChange={(suspendOnCertificationExpiry) => mutate("training", { suspendOnCertificationExpiry })} disabled={disabled} label="Suspendre les certifications expirées" />
      <Toggle checked={value.highRiskMissionCertificationRequired} onChange={(highRiskMissionCertificationRequired) => mutate("training", { highRiskMissionCertificationRequired })} disabled={disabled} label="Certification obligatoire pour missions à risque élevé" />
    </div></div>
  }

  if (domain === "territories") {
    const value = configuration.territories
    return <div><SectionIntro icon={MapPinned} title="Règles de territoire et capacité terrain" description="Configurez la hiérarchie géographique, les affectations principales et de secours, la capacité et l’escalade de couverture." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Maximum d’Ambassadeurs par territoire"><NumberField value={value.maximumAmbassadorsPerTerritory} onChange={(maximumAmbassadorsPerTerritory) => mutate("territories", { maximumAmbassadorsPerTerritory })} disabled={disabled} min={1} /></Field>
      <Field label="Durée d’affectation par défaut — jours"><NumberField value={value.defaultAssignmentDays} onChange={(defaultAssignmentDays) => mutate("territories", { defaultAssignmentDays })} disabled={disabled} min={1} /></Field>
      <Field label="Rayon de déplacement — km"><NumberField value={value.travelRadiusKm} onChange={(travelRadiusKm) => mutate("territories", { travelRadiusKm })} disabled={disabled} min={0} /></Field>
      <Field label="Escalade de couverture — heures"><NumberField value={value.uncoveredTerritoryEscalationHours} onChange={(uncoveredTerritoryEscalationHours) => mutate("territories", { uncoveredTerritoryEscalationHours })} disabled={disabled} min={1} /></Field>
      <div className="md:col-span-2"><Field label="Hiérarchie territoriale"><ListField value={value.hierarchyLevels} onChange={(hierarchyLevels) => mutate("territories", { hierarchyLevels })} disabled={disabled} /></Field></div>
      <Toggle checked={value.exclusivePrimaryAssignment} onChange={(exclusivePrimaryAssignment) => mutate("territories", { exclusivePrimaryAssignment })} disabled={disabled} label="Affectation principale exclusive" />
      <Toggle checked={value.managerApprovalRequired} onChange={(managerApprovalRequired) => mutate("territories", { managerApprovalRequired })} disabled={disabled} label="Approbation manager obligatoire" />
      <Toggle checked={value.allowBackupAssignments} onChange={(allowBackupAssignments) => mutate("territories", { allowBackupAssignments })} disabled={disabled} label="Autoriser les affectations de secours" />
      <Toggle checked={value.allowTemporaryAssignments} onChange={(allowTemporaryAssignments) => mutate("territories", { allowTemporaryAssignments })} disabled={disabled} label="Autoriser les affectations temporaires" />
    </div></div>
  }

  if (domain === "missions") {
    const value = configuration.missions
    return <div><SectionIntro icon={Workflow} title="Politique d’exécution des missions" description="Définissez l’éligibilité, la simultanéité, les preuves, les jalons, les escalades et les portes de clôture pour l’exécution terrain." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Maximum de missions simultanées"><NumberField value={value.maximumConcurrentMissions} onChange={(maximumConcurrentMissions) => mutate("missions", { maximumConcurrentMissions })} disabled={disabled} min={1} /></Field>
      <Field label="Délai d’acceptation — heures"><NumberField value={value.acceptanceDeadlineHours} onChange={(acceptanceDeadlineHours) => mutate("missions", { acceptanceDeadlineHours })} disabled={disabled} min={1} /></Field>
      <Field label="Escalade incident — heures"><NumberField value={value.incidentEscalationHours} onChange={(incidentEscalationHours) => mutate("missions", { incidentEscalationHours })} disabled={disabled} min={1} /></Field>
      <Field label="Types de missions autorisés"><ListField value={value.allowedMissionTypes} onChange={(allowedMissionTypes) => mutate("missions", { allowedMissionTypes })} disabled={disabled} /></Field>
      <div className="md:col-span-2"><Field label="Motifs d’annulation"><ListField value={value.cancellationReasons} onChange={(cancellationReasons) => mutate("missions", { cancellationReasons })} disabled={disabled} /></Field></div>
      <Toggle checked={value.proofRequired} onChange={(proofRequired) => mutate("missions", { proofRequired })} disabled={disabled} label="Preuve obligatoire" />
      <Toggle checked={value.managerReviewRequired} onChange={(managerReviewRequired) => mutate("missions", { managerReviewRequired })} disabled={disabled} label="Revue manager obligatoire" />
      <Toggle checked={value.locationEvidenceRequired} onChange={(locationEvidenceRequired) => mutate("missions", { locationEvidenceRequired })} disabled={disabled} label="Preuve de localisation obligatoire" />
      <Toggle checked={value.checkpointRequired} onChange={(checkpointRequired) => mutate("missions", { checkpointRequired })} disabled={disabled} label="Jalon de contrôle obligatoire" />
      <Toggle checked={value.completionRequiresApprovedProof} onChange={(completionRequiresApprovedProof) => mutate("missions", { completionRequiresApprovedProof })} disabled={disabled} label="Clôture conditionnée par une preuve approuvée" />
    </div></div>
  }

  if (domain === "attribution") {
    const value = configuration.attribution
    return <div><SectionIntro icon={Target} title="Règles de leads, conversion et attribution" description="Protégez l’attribution du revenu par des champs qualifiés, la gestion des doublons, les fenêtres d’attribution, les preuves et les contrôles de litige." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Fenêtre d’attribution — jours"><NumberField value={value.attributionWindowDays} onChange={(attributionWindowDays) => mutate("attribution", { attributionWindowDays })} disabled={disabled} min={1} /></Field>
      <Field label="Fenêtre de litige — jours"><NumberField value={value.disputeWindowDays} onChange={(disputeWindowDays) => mutate("attribution", { disputeWindowDays })} disabled={disabled} min={1} /></Field>
      <Field label="Politique de doublons des leads"><SelectField value={value.duplicateLeadPolicy} onChange={(duplicateLeadPolicy) => mutate("attribution", { duplicateLeadPolicy: duplicateLeadPolicy as typeof value.duplicateLeadPolicy })} disabled={disabled} options={[{ value: "merge", label: "Merge" }, { value: "reject", label: "Rejeter" }, { value: "manual_review", label: "Manual review" }]} /></Field>
      <Field label="Champs obligatoires du lead"><ListField value={value.requiredLeadFields} onChange={(requiredLeadFields) => mutate("attribution", { requiredLeadFields })} disabled={disabled} /></Field>
      <div className="md:col-span-2"><Field label="Rôles autorisés à valider"><ListField value={value.validationAuthorityRoles} onChange={(validationAuthorityRoles) => mutate("attribution", { validationAuthorityRoles })} disabled={disabled} /></Field></div>
      <Toggle checked={value.promoCodeAttributionEnabled} onChange={(promoCodeAttributionEnabled) => mutate("attribution", { promoCodeAttributionEnabled })} disabled={disabled} label="Attribution par code promotionnel" />
      <Toggle checked={value.referralLinkAttributionEnabled} onChange={(referralLinkAttributionEnabled) => mutate("attribution", { referralLinkAttributionEnabled })} disabled={disabled} label="Attribution par lien de recommandation" />
      <Toggle checked={value.manualAttributionRequiresApproval} onChange={(manualAttributionRequiresApproval) => mutate("attribution", { manualAttributionRequiresApproval })} disabled={disabled} label="Approbation de l’attribution manuelle" />
      <Toggle checked={value.conversionProofRequired} onChange={(conversionProofRequired) => mutate("attribution", { conversionProofRequired })} disabled={disabled} label="Preuve de conversion obligatoire" />
      <Toggle checked={value.refundReversesAttribution} onChange={(refundReversesAttribution) => mutate("attribution", { refundReversesAttribution })} disabled={disabled} label="Remboursement annulant l’attribution" />
    </div></div>
  }

  if (domain === "rewards") {
    const value = configuration.rewards
    return <div><SectionIntro icon={CircleDollarSign} title="Doctrine de récompense, commission et paiement" description="Contrôlez la commission de référence, les portes financières, le cycle de paiement, les plafonds, les annulations et les bonus temporaires." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Taux de commission par défaut — %"><NumberField value={value.defaultCommissionRate} onChange={(defaultCommissionRate) => mutate("rewards", { defaultCommissionRate })} disabled={disabled} min={0} max={100} /></Field>
      <Field label="Paiement minimum — Dh"><NumberField value={value.minimumPayoutMad} onChange={(minimumPayoutMad) => mutate("rewards", { minimumPayoutMad })} disabled={disabled} min={0} /></Field>
      <Field label="Récompense maximale — Dh"><NumberField value={value.maximumRewardMad} onChange={(maximumRewardMad) => mutate("rewards", { maximumRewardMad })} disabled={disabled} min={0} /></Field>
      <Field label="Cycle de paiement"><SelectField value={value.payoutCycle} onChange={(payoutCycle) => mutate("rewards", { payoutCycle: payoutCycle as typeof value.payoutCycle })} disabled={disabled} options={["weekly", "biweekly", "monthly"].map((item) => ({ value: item, label: titleCase(item) }))} /></Field>
      <Field label="Taux du bonus temporaire — %"><NumberField value={value.temporaryBonusRate} onChange={(temporaryBonusRate) => mutate("rewards", { temporaryBonusRate })} disabled={disabled || !value.temporaryBonusEnabled} min={0} max={100} /></Field>
      <Field label="Fin du bonus temporaire"><input className={inputClass} type="date" value={value.temporaryBonusEndsAt || ""} onChange={(event) => mutate("rewards", { temporaryBonusEndsAt: event.target.value || null })} disabled={disabled || !value.temporaryBonusEnabled} /></Field>
      <Toggle checked={value.financeApprovalRequired} onChange={(financeApprovalRequired) => mutate("rewards", { financeApprovalRequired })} disabled={disabled} label="Approbation finance obligatoire" />
      <Toggle checked={value.proofRequiredBeforeReward} onChange={(proofRequiredBeforeReward) => mutate("rewards", { proofRequiredBeforeReward })} disabled={disabled} label="Preuve approuvée avant récompense" />
      <Toggle checked={value.paymentReferenceRequired} onChange={(paymentReferenceRequired) => mutate("rewards", { paymentReferenceRequired })} disabled={disabled} label="Référence de paiement obligatoire" />
      <Toggle checked={value.refundReversesReward} onChange={(refundReversesReward) => mutate("rewards", { refundReversesReward })} disabled={disabled} label="Remboursement annulant la récompense" />
      <Toggle checked={value.temporaryBonusEnabled} onChange={(temporaryBonusEnabled) => mutate("rewards", { temporaryBonusEnabled })} disabled={disabled} label="Bonus temporaire activé" />
    </div></div>
  }

  if (domain === "kpis") {
    const value = configuration.kpis
    const weightTotal = Object.values(value.weights).reduce((sum, item) => sum + Number(item || 0), 0)
    return <div><SectionIntro icon={SlidersHorizontal} title="Doctrine des objectifs et de la performance" description="Définissez les objectifs, les seuils d’intervention et la pondération transparente existante." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Contacts quotidiens"><NumberField value={value.dailyContactsTarget} onChange={(dailyContactsTarget) => mutate("kpis", { dailyContactsTarget })} disabled={disabled} min={0} /></Field>
      <Field label="Leads qualifiés quotidiens"><NumberField value={value.dailyQualifiedLeadsTarget} onChange={(dailyQualifiedLeadsTarget) => mutate("kpis", { dailyQualifiedLeadsTarget })} disabled={disabled} min={0} /></Field>
      <Field label="Conversions mensuelles"><NumberField value={value.monthlyConversionsTarget} onChange={(monthlyConversionsTarget) => mutate("kpis", { monthlyConversionsTarget })} disabled={disabled} min={0} /></Field>
      <Field label="Objectif mensuel de chiffre d’affaires — Dh"><NumberField value={value.monthlyRevenueTargetMad} onChange={(monthlyRevenueTargetMad) => mutate("kpis", { monthlyRevenueTargetMad })} disabled={disabled} min={0} /></Field>
      <Field label="Délai SLA de relance — heures"><NumberField value={value.followUpSlaHours} onChange={(followUpSlaHours) => mutate("kpis", { followUpSlaHours })} disabled={disabled} min={1} /></Field>
      <Field label="Seuil d’inactivité — jours"><NumberField value={value.inactivityThresholdDays} onChange={(inactivityThresholdDays) => mutate("kpis", { inactivityThresholdDays })} disabled={disabled} min={1} /></Field>
      <Field label="Seuil de coaching"><NumberField value={value.coachingTriggerScore} onChange={(coachingTriggerScore) => mutate("kpis", { coachingTriggerScore })} disabled={disabled} min={0} max={100} /></Field>
      <Field label="Seuil de suspension"><NumberField value={value.suspensionTriggerScore} onChange={(suspensionTriggerScore) => mutate("kpis", { suspensionTriggerScore })} disabled={disabled} min={0} max={100} /></Field>
      <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between"><h4 className="text-xs font-black text-slate-900">Pondération de la performance</h4><span className={`text-xs font-black ${weightTotal === 100 ? "text-emerald-700" : "text-red-700"}`}>{weightTotal}/100</span></div><div className="mt-4 grid gap-3 md:grid-cols-5">{Object.entries(value.weights).map(([key, weight]) => <Field key={key} label={titleCase(key)}><NumberField value={weight} onChange={(next) => mutate("kpis", { weights: { ...value.weights, [key]: next } })} disabled={disabled} min={0} max={100} /></Field>)}</div></div>
    </div></div>
  }

  if (domain === "communications") {
    const value = configuration.communications
    const channels = ["email", "whatsapp", "sms", "in_app"] as const
    return <div><SectionIntro icon={BellRing} title="Communications et escalade" description="Contrôlez les canaux autorisés, le consentement, les heures calmes, les rappels, les escalades et la résilience de diffusion." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Escalade d’un blocage — heures"><NumberField value={value.blockedEscalationHours} onChange={(blockedEscalationHours) => mutate("communications", { blockedEscalationHours })} disabled={disabled} min={1} /></Field>
      <Field label="Rappel d’expiration formation — jours"><NumberField value={value.trainingExpiryReminderDays} onChange={(trainingExpiryReminderDays) => mutate("communications", { trainingExpiryReminderDays })} disabled={disabled} min={1} /></Field>
      <Field label="Rappel de révision de preuve — heures"><NumberField value={value.proofRevisionReminderHours} onChange={(proofRevisionReminderHours) => mutate("communications", { proofRevisionReminderHours })} disabled={disabled} min={1} /></Field>
      <Field label="Début des heures calmes"><input className={inputClass} type="time" value={value.quietHoursStart} onChange={(event) => mutate("communications", { quietHoursStart: event.target.value })} disabled={disabled} /></Field>
      <Field label="Fin des heures calmes"><input className={inputClass} type="time" value={value.quietHoursEnd} onChange={(event) => mutate("communications", { quietHoursEnd: event.target.value })} disabled={disabled} /></Field>
      <Field label="Maximum de tentatives de diffusion"><NumberField value={value.maximumDeliveryAttempts} onChange={(maximumDeliveryAttempts) => mutate("communications", { maximumDeliveryAttempts })} disabled={disabled} min={1} /></Field>
      <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-slate-200 p-4"><div className="text-xs font-black text-slate-900">Canaux activés</div><div className="mt-3 grid gap-3 md:grid-cols-4">{channels.map((channel) => <Toggle key={channel} checked={value.enabledChannels.includes(channel)} onChange={(checked) => mutate("communications", { enabledChannels: checked ? [...new Set([...value.enabledChannels, channel])] : value.enabledChannels.filter((item) => item !== channel) })} disabled={disabled} label={titleCase(channel)} />)}</div></div>
      <Toggle checked={value.dailyReportRequired} onChange={(dailyReportRequired) => mutate("communications", { dailyReportRequired })} disabled={disabled} label="Rapport quotidien obligatoire" />
      <Toggle checked={value.consentRequired} onChange={(consentRequired) => mutate("communications", { consentRequired })} disabled={disabled} label="Consentement de communication obligatoire" />
    </div></div>
  }

  const value = configuration.governance
  return <div><SectionIntro icon={ShieldCheck} title="Sécurité, rôles et gouvernance" description="Appliquez la séparation des responsabilités, les autorités d’approbation, le contrôle des exports, les sessions, l’accès d’urgence et la gouvernance des restaurations." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    <Field label="Durée maximale de session — heures"><NumberField value={value.sessionMaximumHours} onChange={(sessionMaximumHours) => mutate("governance", { sessionMaximumHours })} disabled={disabled} min={1} /></Field>
    <Field label="Accès d’urgence — minutes"><NumberField value={value.emergencyAccessMaximumMinutes} onChange={(emergencyAccessMaximumMinutes) => mutate("governance", { emergencyAccessMaximumMinutes })} disabled={disabled || !value.emergencyAccessEnabled} min={1} /></Field>
    <div className="md:col-span-2"><Field label="Rôles autorisés à exporter"><ListField value={value.exportAllowedRoles} onChange={(exportAllowedRoles) => mutate("governance", { exportAllowedRoles })} disabled={disabled} /></Field></div>
    <Toggle checked={value.separationOfDutiesRequired} onChange={(separationOfDutiesRequired) => mutate("governance", { separationOfDutiesRequired })} disabled={disabled} label="Séparation des responsabilités obligatoire" />
    <Toggle checked={value.dualApprovalForFinanceChanges} onChange={(dualApprovalForFinanceChanges) => mutate("governance", { dualApprovalForFinanceChanges })} disabled={disabled} label="Double approbation pour les changements financiers" />
    <Toggle checked={value.complianceApprovalForPrivacyChanges} onChange={(complianceApprovalForPrivacyChanges) => mutate("governance", { complianceApprovalForPrivacyChanges })} disabled={disabled} label="Approbation conformité pour les changements de confidentialité" />
    <Toggle checked={value.configurationChangeReasonRequired} onChange={(configurationChangeReasonRequired) => mutate("governance", { configurationChangeReasonRequired })} disabled={disabled} label="Motif de changement obligatoire" />
    <Toggle checked={value.publicationRequiresValidation} onChange={(publicationRequiresValidation) => mutate("governance", { publicationRequiresValidation })} disabled={disabled} label="Validation obligatoire avant publication" />
    <Toggle checked={value.rollbackRequiresDirector} onChange={(rollbackRequiresDirector) => mutate("governance", { rollbackRequiresDirector })} disabled={disabled} label="Restauration soumise à l’autorité de direction" />
    <Toggle checked={value.emergencyAccessEnabled} onChange={(emergencyAccessEnabled) => mutate("governance", { emergencyAccessEnabled })} disabled={disabled} label="Accès d’urgence activé" description="À maintenir désactivé tant qu’une procédure d’urgence approuvée n’est pas opérationnelle." />
  </div></div>
}
