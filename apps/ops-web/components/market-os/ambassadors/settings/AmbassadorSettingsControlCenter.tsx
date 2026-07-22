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
  { key: "overview", label: "Executive overview", icon: Activity },
  { key: "program", label: "Program identity", icon: BriefcaseBusiness },
  { key: "recruitment", label: "Recruitment & eligibility", icon: Users },
  { key: "onboarding", label: "Onboarding & activation", icon: ClipboardCheck },
  { key: "training", label: "Training & certification", icon: GraduationCap },
  { key: "territories", label: "Territories & capacity", icon: MapPinned },
  { key: "missions", label: "Mission execution", icon: Workflow },
  { key: "attribution", label: "Leads & attribution", icon: Target },
  { key: "rewards", label: "Rewards & payouts", icon: CircleDollarSign },
  { key: "kpis", label: "KPIs & performance", icon: SlidersHorizontal },
  { key: "communications", label: "Communications", icon: BellRing },
  { key: "governance", label: "Security & governance", icon: ShieldCheck },
  { key: "versions", label: "Versions & audit", icon: History },
] as const

type DomainKey = (typeof domains)[number]["key"]
type IconType = ComponentType<{ className?: string; size?: number }>
type ModalState =
  | { kind: "create" }
  | { kind: "decision"; domain: SettingsApprovalDomain }
  | { kind: "publish" }
  | { kind: "rollback"; version: AmbassadorSettingsVersion }
  | null

const statusTone: Record<string, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  approved: "border-blue-200 bg-blue-50 text-blue-700",
  pending_approval: "border-amber-200 bg-amber-50 text-amber-700",
  scheduled: "border-violet-200 bg-violet-50 text-violet-700",
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

function titleCase(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${statusTone[status] || statusTone.draft}`}>
      {status.replaceAll("_", " ")}
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
    primary: "border-violet-600 bg-violet-600 text-white hover:bg-violet-700",
    secondary: "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:text-violet-700",
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
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">{value}</div>
          <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">{detail}</div>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700"><Icon size={18} /></span>
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

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-50 disabled:text-slate-500"

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
    <button type="button" disabled={disabled} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-violet-300 disabled:cursor-not-allowed disabled:bg-slate-50">
      <span>
        <span className="block text-xs font-black text-slate-800">{label}</span>
        {description ? <span className="mt-1 block text-[11px] font-semibold leading-4 text-slate-500">{description}</span> : null}
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-violet-600" : "bg-slate-300"}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${checked ? "left-6" : "left-1"}`} />
      </span>
    </button>
  )
}

function ListField({ value, onChange, disabled, placeholder = "One item per line" }: { value: string[]; onChange: (value: string[]) => void; disabled?: boolean; placeholder?: string }) {
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
    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-violet-700 shadow-sm"><Icon size={19} /></span>
      <div><h3 className="font-black text-slate-950">{title}</h3><p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{description}</p></div>
    </div>
  )
}

function Modal({ title, description, onClose, children }: { title: string; description?: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-5">
          <div><h2 className="text-xl font-black text-slate-950">{title}</h2>{description ? <p className="mt-1 text-sm font-semibold text-slate-500">{description}</p> : null}</div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"><X size={17} /></button>
        </div>
        <div className="p-6">{children}</div>
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
      setError(response.error || "Settings control center could not be loaded")
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

  const selectedVersion = useMemo(() => {
    if (!snapshot || !selectedId) return null
    return snapshot.versions.find((version) => version.id === selectedId) || null
  }, [selectedId, snapshot])

  useEffect(() => {
    if (!snapshot) return
    const version = selectedVersion
    const next = version?.configuration || snapshot.effectiveConfiguration
    setConfiguration(cloneConfiguration(next))
    setTitle(version?.title || "Effective Ambassador policy")
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
    if (!response.ok) setError(response.error || "Action failed")
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
      "Draft saved without changing the live policy.",
    )
    if (ok) setDirty(false)
  }

  async function createDraft() {
    const ok = await runAction(async () => {
      const response = await ambassadorSettingsApi.createDraft(createForm)
      if (response.ok && response.data) setSelectedId(response.data.id)
      return response
    }, "New policy draft created from the effective configuration.")
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
      `${titleCase(domainValue)} approval decision recorded.`,
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
      normalized ? "Publication scheduled successfully." : "Policy version published and made effective.",
    )
    if (ok) {
      setModal(null)
      setPublishAt("")
    }
  }

  async function rollback(version: AmbassadorSettingsVersion) {
    const ok = await runAction(
      () => ambassadorSettingsApi.rollbackVersion(version.id, rollbackReason),
      `A new effective rollback version was published from v${version.revision}.`,
    )
    if (ok) {
      setModal(null)
      setRollbackReason("")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#f5f7fb] text-slate-950">
        <AmbassadorMarketSidebar />
        <main className="grid min-w-0 flex-1 place-items-center"><div className="text-center"><Loader2 className="mx-auto animate-spin text-violet-600" size={28} /><p className="mt-3 text-sm font-black text-slate-600">Loading policy control center…</p></div></main>
      </div>
    )
  }

  if (!snapshot) {
    return (
      <div className="flex min-h-screen bg-[#f5f7fb] text-slate-950">
        <AmbassadorMarketSidebar />
        <main className="grid min-w-0 flex-1 place-items-center p-8"><div className="max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm"><AlertTriangle className="mx-auto text-red-600" size={30} /><h1 className="mt-4 text-xl font-black">Settings unavailable</h1><p className="mt-2 text-sm font-semibold text-slate-600">{error}</p><div className="mt-5"><Button icon={RefreshCw} onClick={() => void load()} variant="primary">Retry</Button></div></div></main>
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
        <header className="border-b border-slate-200 bg-white px-6 py-5 xl:px-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700">Policy & Runtime Control</span>
                <StatusBadge status={effective?.status || "draft"} />
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 xl:text-3xl">Ambassador Program Settings</h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">Control how recruitment, activation, territories, missions, attribution, rewards, communications and governance operate—through versioned drafts, validation, approvals and safe publication.</p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs font-bold text-slate-500">
                <span>Scope: <b className="text-slate-800">{snapshot.actor.organizationId}</b></span>
                <span>Role: <b className="text-slate-800">{snapshot.actor.roleKey}</b></span>
                <span>Actor: <b className="text-slate-800">{snapshot.actor.displayName}</b></span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button icon={RefreshCw} onClick={() => void load(true)} disabled={refreshing}>{refreshing ? "Refreshing…" : "Refresh"}</Button>
              {snapshot.capabilities.canProcessRuntime && scheduledCount > 0 ? <Button icon={PlayCircle} onClick={() => void runAction(() => ambassadorSettingsApi.processRuntime(), "Due publication queue processed.")} disabled={saving}>Process due publications</Button> : null}
              {snapshot.capabilities.canDraft ? <Button icon={FileText} onClick={() => setModal({ kind: "create" })} variant="primary">Create policy draft</Button> : null}
            </div>
          </div>
        </header>

        <div className="space-y-5 p-5 xl:p-8">
          {error ? <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800"><AlertTriangle className="mt-0.5 shrink-0" size={17} /><span>{error}</span><button className="ml-auto" onClick={() => setError(null)}><X size={16} /></button></div> : null}
          {success ? <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800"><CheckCircle2 className="mt-0.5 shrink-0" size={17} /><span>{success}</span><button className="ml-auto" onClick={() => setSuccess(null)}><X size={16} /></button></div> : null}
          {snapshot.diagnostics.map((item, index) => <div key={`${item.message}-${index}`} className={`rounded-2xl border p-4 text-sm font-bold ${item.severity === "error" ? "border-red-200 bg-red-50 text-red-800" : item.severity === "warning" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-blue-200 bg-blue-50 text-blue-800"}`}>{item.message}</div>)}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard icon={FileCheck2} label="Organization baseline" value={effective ? `v${effective.revision}` : "Legacy"} detail={effective ? `Published ${formatDate(effective.published_at)}` : "Awaiting first versioned publication"} />
            <MetricCard icon={Network} label="Program status" value={configuration.program.status} detail={`${configuration.program.activeCities.length} active cities · ${configuration.program.serviceLines.length} service lines`} />
            <MetricCard icon={ShieldCheck} label="Validation" value={validation ? `${validation.score}/100` : "Not run"} detail={validation ? `${validation.issues.length} identified control points` : "Validate the selected draft before submission"} />
            <MetricCard icon={FileClock} label="Pending approvals" value={pendingCount} detail={`${snapshot.drafts.length} open draft or release records`} />
            <MetricCard icon={CalendarClock} label="Active scopes" value={snapshot.activeScopes.length} detail={`${scheduledCount} scheduled · ${snapshot.runtimeEvents.filter((event) => event.status === "failed").length} runtime failures`} />
          </section>

          <section className="grid gap-5 2xl:grid-cols-[230px_minmax(0,1fr)_330px]">
            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm 2xl:sticky 2xl:top-5">
              <div className="px-3 pb-3 pt-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Control domains</div>
              <nav className="space-y-1">
                {domains.map((item) => {
                  const Icon = item.icon
                  const active = domain === item.key
                  return (
                    <button key={item.key} type="button" onClick={() => setDomain(item.key)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-black transition ${active ? "bg-violet-100 text-violet-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}>
                      <Icon size={15} /><span className="min-w-0 flex-1">{item.label}</span>{active ? <ChevronRight size={14} /> : null}
                    </button>
                  )
                })}
              </nav>
            </aside>

            <div className="min-w-0 space-y-5">
              <Panel
                title={title}
                description={selectedVersion ? `Version v${selectedVersion.revision} · ${selectedVersion.scope_type}:${selectedVersion.scope_key}` : "Current effective configuration"}
                action={<StatusBadge status={selectedVersion?.status || effective?.status || "published"} />}
              >
                <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
                  <Field label="Version title"><TextField value={title} onChange={(value) => { setTitle(value); setDirty(true) }} disabled={!editable} /></Field>
                  <Field label="Change summary" hint="mandatory before submission"><TextField value={changeSummary} onChange={(value) => { setChangeSummary(value); setDirty(true) }} disabled={!editable} placeholder="Explain why this policy change is required" /></Field>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  {editable ? <Button icon={Save} onClick={() => void saveDraft()} disabled={saving || !dirty} variant="primary">Save draft</Button> : null}
                  {selectedVersion && ["draft", "revision_requested"].includes(selectedVersion.status) && snapshot.capabilities.canValidate ? <Button icon={ShieldCheck} onClick={() => void runAction(() => ambassadorSettingsApi.validateDraft(selectedVersion.id), "Validation completed and recorded.")} disabled={saving || dirty}>Validate</Button> : null}
                  {selectedVersion && ["draft", "revision_requested", "pending_approval", "approved"].includes(selectedVersion.status) && snapshot.capabilities.canValidate ? <Button icon={Activity} onClick={() => void runAction(() => ambassadorSettingsApi.simulateDraft(selectedVersion.id), "Operational and financial impact simulated.")} disabled={saving || dirty}>Simulate impact</Button> : null}
                  {selectedVersion && ["draft", "revision_requested"].includes(selectedVersion.status) && snapshot.capabilities.canSubmit ? <Button icon={Send} onClick={() => void runAction(() => ambassadorSettingsApi.submitDraft(selectedVersion.id), "Version submitted for controlled approval.")} disabled={saving || dirty || !validation?.valid} variant="success">Submit for approval</Button> : null}
                  {selectedVersion?.status === "pending_approval" && snapshot.capabilities.canApprove && pendingApproval ? <Button icon={BadgeCheck} onClick={() => setModal({ kind: "decision", domain: pendingApproval.approval_domain })} variant="success">Decide {pendingApproval.approval_domain}</Button> : null}
                  {selectedVersion?.status === "approved" && snapshot.capabilities.canPublish ? <Button icon={PlayCircle} onClick={() => setModal({ kind: "publish" })} variant="primary">Publish or schedule</Button> : null}
                  {dirty ? <span className="ml-auto text-xs font-black text-amber-600">Unsaved changes</span> : null}
                </div>
              </Panel>

              {domain === "overview" ? <Overview configuration={configuration} version={selectedVersion} approvals={approvalsForSelected} /> : null}
              {domain !== "overview" && domain !== "versions" ? (
                <Panel title={domains.find((item) => item.key === domain)?.label || "Policy domain"} description={editable ? "Structured draft editor. Changes remain isolated until approved and published." : "Read-only effective or controlled version view."}>
                  <DomainEditor domain={domain} configuration={configuration} mutate={mutateDomain} disabled={!editable} />
                </Panel>
              ) : null}
              {domain === "versions" ? <VersionsPanel snapshot={snapshot} selectedId={selectedId} onSelect={setSelectedId} onRollback={(version) => setModal({ kind: "rollback", version })} /> : null}
            </div>

            <aside className="space-y-5">
              <Panel title="Version queue" description="Drafts, approvals and scheduled releases">
                <div className="space-y-2">
                  {snapshot.drafts.length ? snapshot.drafts.map((version) => (
                    <button key={version.id} type="button" onClick={() => setSelectedId(version.id)} className={`w-full rounded-xl border p-3 text-left transition ${selectedId === version.id ? "border-violet-300 bg-violet-50" : "border-slate-200 hover:border-violet-200"}`}>
                      <div className="flex items-center justify-between gap-2"><span className="text-xs font-black text-slate-900">v{version.revision} · {version.title}</span><StatusBadge status={version.status} /></div>
                      <div className="mt-2 text-[11px] font-semibold text-slate-500">Updated {formatDate(version.updated_at)}</div>
                    </button>
                  )) : <div className="rounded-xl bg-slate-50 p-4 text-xs font-bold text-slate-500">No open policy drafts.</div>}
                </div>
              </Panel>

              <Panel title="Approval gates" description="Latest round for the selected version">
                <div className="space-y-2">
                  {approvalsForSelected.length ? approvalsForSelected.map((approval) => <ApprovalRow key={approval.id} approval={approval} />) : <div className="rounded-xl bg-slate-50 p-4 text-xs font-bold text-slate-500">No approval gates created for this version.</div>}
                </div>
              </Panel>

              <Panel title="Release intelligence" description="Latest validation and impact evidence">
                <div className="space-y-3 text-xs font-semibold text-slate-600">
                  <InfoRow label="Validation score" value={validation ? `${validation.score}/100` : "Not available"} />
                  <InfoRow label="Blocking errors" value={String(validation?.issues.filter((item) => item.severity === "error").length || 0)} />
                  <InfoRow label="Risk level" value={impact?.riskLevel || "Not simulated"} />
                  <InfoRow label="Affected Ambassadors" value={String(impact?.affectedAmbassadors || 0)} />
                  <InfoRow label="Pending payout exposure" value={formatDh(impact?.pendingPayoutsMad || 0)} />
                  <InfoRow label="Projected commission delta" value={formatDh(impact?.projectedCommissionDeltaMad || 0)} />
                </div>
                {validation?.issues.length ? <div className="mt-4 space-y-2">{validation.issues.slice(0, 5).map((item) => <div key={`${item.path}-${item.code}`} className={`rounded-xl border p-3 text-[11px] font-bold ${item.severity === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>{item.message}</div>)}</div> : null}
              </Panel>
            </aside>
          </section>
        </div>
      </main>

      {modal?.kind === "create" ? (
        <Modal title="Create policy draft" description="Start from the currently effective configuration. Production remains unchanged." onClose={() => setModal(null)}>
          <div className="space-y-4">
            <Field label="Draft title"><TextField value={createForm.title} onChange={(value) => setCreateForm((current) => ({ ...current, title: value }))} placeholder="Example: Q3 national Ambassador policy" /></Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Scope type"><SelectField value={createForm.scopeType} onChange={(value) => setCreateForm((current) => ({ ...current, scopeType: value }))} options={["organization", "program", "country", "region", "city", "territory", "service_line"].map((value) => ({ value, label: titleCase(value) }))} /></Field>
              <Field label="Scope key"><TextField value={createForm.scopeKey} onChange={(value) => setCreateForm((current) => ({ ...current, scopeKey: value }))} /></Field>
            </div>
            <Field label="Initial change summary"><textarea className={`${inputClass} min-h-24`} value={createForm.changeSummary} onChange={(event) => setCreateForm((current) => ({ ...current, changeSummary: event.target.value }))} /></Field>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><Button onClick={() => setModal(null)}>Cancel</Button><Button icon={FileText} onClick={() => void createDraft()} disabled={saving || !createForm.title.trim()} variant="primary">Create isolated draft</Button></div>
          </div>
        </Modal>
      ) : null}

      {modal?.kind === "decision" ? (
        <Modal title={`${titleCase(modal.domain)} approval decision`} description="The authenticated actor and decision note will be preserved in immutable audit." onClose={() => setModal(null)}>
          <div className="space-y-4">
            <Field label="Decision"><SelectField value={decisionForm.decision} onChange={(value) => setDecisionForm((current) => ({ ...current, decision: value as SettingsApprovalStatus }))} options={[{ value: "approved", label: "Approve" }, { value: "revision_requested", label: "Request revision" }, { value: "rejected", label: "Reject" }]} /></Field>
            <Field label="Decision note"><textarea className={`${inputClass} min-h-28`} value={decisionForm.note} onChange={(event) => setDecisionForm((current) => ({ ...current, note: event.target.value }))} placeholder="Record the rationale and any required conditions" /></Field>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><Button onClick={() => setModal(null)}>Cancel</Button><Button icon={BadgeCheck} onClick={() => void decideApproval(modal.domain)} disabled={saving || !decisionForm.note.trim()} variant={decisionForm.decision === "approved" ? "success" : "danger"}>Record decision</Button></div>
          </div>
        </Modal>
      ) : null}

      {modal?.kind === "publish" ? (
        <Modal title="Publish approved policy" description="Publish now or schedule activation. Publication updates the effective policy pointer and legacy compatibility projection transactionally." onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800"><CheckCircle2 className="mr-2 inline" size={17} />All required approval gates must be complete before this action succeeds.</div>
            <Field label="Scheduled activation" hint="leave blank to publish immediately"><input className={inputClass} type="datetime-local" value={publishAt} onChange={(event) => setPublishAt(event.target.value)} /></Field>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><Button onClick={() => setModal(null)}>Cancel</Button><Button icon={publishAt ? CalendarClock : PlayCircle} onClick={() => void publish()} disabled={saving} variant="primary">{publishAt ? "Schedule publication" : "Publish now"}</Button></div>
          </div>
        </Modal>
      ) : null}

      {modal?.kind === "rollback" ? (
        <Modal title={`Restore policy from v${modal.version.revision}`} description="A rollback never rewrites history. It publishes a new version copied from the selected historical policy." onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800"><AlertTriangle className="mr-2 inline" size={17} />This changes the effective operating doctrine immediately after the transactional gate succeeds.</div>
            <Field label="Mandatory rollback reason"><textarea className={`${inputClass} min-h-28`} value={rollbackReason} onChange={(event) => setRollbackReason(event.target.value)} placeholder="Describe the incident, risk or operational reason requiring restoration" /></Field>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><Button onClick={() => setModal(null)}>Cancel</Button><Button icon={RotateCcw} onClick={() => void rollback(modal.version)} disabled={saving || !rollbackReason.trim()} variant="danger">Publish rollback version</Button></div>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

function Overview({ configuration, version, approvals }: { configuration: AmbassadorSettingsConfiguration; version: AmbassadorSettingsVersion | null; approvals: AmbassadorSettingsApproval[] }) {
  const controls = [
    ["Program perimeter", `${configuration.program.activeCities.length} cities · ${configuration.program.serviceLines.length} service lines`, BriefcaseBusiness],
    ["Recruitment gate", `Minimum score ${configuration.recruitment.interviewMinimumScore}/100`, Users],
    ["Certification", `${configuration.training.certificationMinimumScore}/100 · ${configuration.training.certificationValidityDays} days`, GraduationCap],
    ["Mission capacity", `${configuration.missions.maximumConcurrentMissions} concurrent · proof ${configuration.missions.proofRequired ? "required" : "optional"}`, Workflow],
    ["Commission doctrine", `${configuration.rewards.defaultCommissionRate}% · minimum ${formatDh(configuration.rewards.minimumPayoutMad)}`, Banknote],
    ["Governance", configuration.governance.separationOfDutiesRequired ? "Separation of duties active" : "Separation of duties disabled", ShieldCheck],
  ] as Array<[string, string, IconType]>
  return (
    <div className="space-y-5">
      <Panel title="Operating doctrine at a glance" description="The core rules this version will enforce after publication.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {controls.map(([label, value, Icon]) => <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"><Icon className="text-violet-700" size={18} /><div className="mt-3 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">{label}</div><div className="mt-1 text-sm font-black text-slate-900">{value}</div></div>)}
        </div>
      </Panel>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Lifecycle readiness" description="Current progress through the controlled release chain.">
          <div className="space-y-3">
            {["Draft", "Validated", "Simulated", "Approved", "Published"].map((step, index) => {
              const complete = index === 0 || Boolean(version?.validation_result) && index <= 1 || Boolean(version?.impact_snapshot) && index <= 2 || ["approved", "scheduled", "published", "superseded"].includes(version?.status || "") && index <= 3 || ["published", "superseded"].includes(version?.status || "") && index <= 4
              return <div key={step} className="flex items-center gap-3"><span className={`grid h-7 w-7 place-items-center rounded-full ${complete ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>{complete ? <Check size={14} /> : index + 1}</span><span className={`text-sm font-black ${complete ? "text-slate-900" : "text-slate-400"}`}>{step}</span></div>
            })}
          </div>
        </Panel>
        <Panel title="Approval architecture" description="Domain gates created for the selected approval round.">
          <div className="space-y-2">{approvals.length ? approvals.map((approval) => <ApprovalRow key={approval.id} approval={approval} />) : <div className="rounded-xl bg-slate-50 p-4 text-xs font-bold text-slate-500">Approval gates are created after successful validation and submission.</div>}</div>
        </Panel>
      </div>
    </div>
  )
}

function ApprovalRow({ approval }: { approval: AmbassadorSettingsApproval }) {
  const Icon = approval.status === "approved" ? CheckCircle2 : approval.status === "pending" ? Clock3 : XCircle
  return <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><span className={`grid h-8 w-8 place-items-center rounded-lg ${approval.status === "approved" ? "bg-emerald-50 text-emerald-700" : approval.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}><Icon size={16} /></span><div className="min-w-0 flex-1"><div className="text-xs font-black text-slate-900">{titleCase(approval.approval_domain)}</div><div className="mt-0.5 text-[11px] font-semibold text-slate-500">{approval.decision_note || "Awaiting authorized decision"}</div></div><StatusBadge status={approval.status} /></div>
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2 last:border-0 last:pb-0"><span>{label}</span><b className="text-right text-slate-900">{value}</b></div>
}

function VersionsPanel({ snapshot, selectedId, onSelect, onRollback }: { snapshot: AmbassadorSettingsControlCenterSnapshot; selectedId: string | null; onSelect: (id: string) => void; onRollback: (version: AmbassadorSettingsVersion) => void }) {
  return (
    <div className="space-y-5">
      <Panel title="Effective policy scopes" description="Canonical published pointers resolved by the runtime from the most specific matching scope.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {snapshot.activeScopes.length ? snapshot.activeScopes.map((scope) => {
            const version = snapshot.versions.find((item) => item.id === scope.current_version_id)
            return <button key={String(scope.id)} type="button" onClick={() => version && onSelect(version.id)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-violet-300"><div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{String(scope.scope_type)} · {String(scope.scope_key)}</div><div className="mt-2 text-sm font-black text-slate-900">{version ? `v${version.revision} · ${version.title}` : "Published pointer"}</div><div className="mt-1 text-[11px] font-semibold text-slate-500">Effective since {formatDate(String(scope.published_at || ""))}</div></button>
          }) : <div className="rounded-xl bg-slate-50 p-4 text-xs font-bold text-slate-500">No versioned scope is active yet. The scoped legacy settings remain the organization baseline.</div>}
        </div>
      </Panel>
      <Panel title="Version history" description="Every configuration remains traceable. Published history is never edited in place.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500"><tr><th className="px-4 py-3">Version</th><th>Title</th><th>Scope</th><th>Status</th><th>Validation</th><th>Published</th><th>Actions</th></tr></thead>
            <tbody>
              {snapshot.versions.map((version) => (
                <tr key={version.id} className={`border-t border-slate-100 ${selectedId === version.id ? "bg-violet-50/60" : "hover:bg-slate-50"}`}>
                  <td className="px-4 py-4 font-black text-slate-950">v{version.revision}</td>
                  <td><div className="font-black text-slate-900">{version.title}</div><div className="mt-1 max-w-xs truncate font-semibold text-slate-500">{version.change_summary || "No summary"}</div></td>
                  <td className="font-bold text-slate-600">{version.scope_type}:{version.scope_key}</td>
                  <td><StatusBadge status={version.status} /></td>
                  <td className="font-black">{version.validation_result ? `${version.validation_result.score}/100` : "—"}</td>
                  <td className="font-semibold text-slate-500">{formatDate(version.published_at)}</td>
                  <td><div className="flex gap-2"><Button onClick={() => onSelect(version.id)}>Open</Button>{snapshot.capabilities.canRollback && ["published", "superseded", "rolled_back"].includes(version.status) ? <Button icon={RotateCcw} onClick={() => onRollback(version)} variant="danger">Restore</Button> : null}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Immutable runtime evidence" description="Recent validation, simulation, publication and rollback events.">
        <div className="space-y-2">{snapshot.runtimeEvents.length ? snapshot.runtimeEvents.map((event) => <div key={event.id} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-50 text-violet-700"><Activity size={15} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><b className="text-xs text-slate-900">{titleCase(event.event_type)}</b><StatusBadge status={event.status} /></div><p className="mt-1 text-xs font-semibold text-slate-600">{event.summary}</p><p className="mt-1 text-[10px] font-bold text-slate-400">{formatDate(event.created_at)}</p></div></div>) : <div className="rounded-xl bg-slate-50 p-4 text-xs font-bold text-slate-500">No runtime evidence recorded yet.</div>}</div>
      </Panel>
    </div>
  )
}

function DomainEditor({ domain, configuration, mutate, disabled }: { domain: Exclude<DomainKey, "overview" | "versions">; configuration: AmbassadorSettingsConfiguration; mutate: <K extends Exclude<DomainKey, "overview" | "versions">>(key: K, patch: Partial<AmbassadorSettingsConfiguration[K]>) => void; disabled: boolean }) {
  if (domain === "program") {
    const value = configuration.program
    return <div><SectionIntro icon={BriefcaseBusiness} title="Program identity and operating perimeter" description="Define the national program, active cities, service coverage, ownership and capacity without changing live operations until publication." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Program name"><TextField value={value.programName} onChange={(programName) => mutate("program", { programName })} disabled={disabled} /></Field>
      <Field label="Program code"><TextField value={value.programCode} onChange={(programCode) => mutate("program", { programCode })} disabled={disabled} /></Field>
      <Field label="Program status"><SelectField value={value.status} onChange={(status) => mutate("program", { status: status as typeof value.status })} disabled={disabled} options={["active", "paused", "restricted", "archived"].map((item) => ({ value: item, label: titleCase(item) }))} /></Field>
      <Field label="Country"><TextField value={value.country} onChange={(country) => mutate("program", { country })} disabled={disabled} /></Field>
      <Field label="Default region"><TextField value={value.defaultRegion} onChange={(defaultRegion) => mutate("program", { defaultRegion })} disabled={disabled} /></Field>
      <Field label="Timezone"><TextField value={value.timezone} onChange={(timezone) => mutate("program", { timezone })} disabled={disabled} /></Field>
      <Field label="Capacity target"><NumberField value={value.capacityTarget} onChange={(capacityTarget) => mutate("program", { capacityTarget })} disabled={disabled} min={1} /></Field>
      <Field label="Maximum active Ambassadors"><NumberField value={value.maximumActiveAmbassadors} onChange={(maximumActiveAmbassadors) => mutate("program", { maximumActiveAmbassadors })} disabled={disabled} min={1} /></Field>
      <Field label="Default language"><SelectField value={value.defaultLanguage} onChange={(defaultLanguage) => mutate("program", { defaultLanguage: defaultLanguage as typeof value.defaultLanguage })} disabled={disabled} options={[{ value: "fr", label: "French" }, { value: "ar", label: "Arabic" }, { value: "en", label: "English" }]} /></Field>
      <Field label="Program owner"><TextField value={value.programOwner} onChange={(programOwner) => mutate("program", { programOwner })} disabled={disabled} /></Field>
      <Field label="Compliance owner"><TextField value={value.complianceOwner} onChange={(complianceOwner) => mutate("program", { complianceOwner })} disabled={disabled} /></Field>
      <Field label="Finance owner"><TextField value={value.financeOwner} onChange={(financeOwner) => mutate("program", { financeOwner })} disabled={disabled} /></Field>
      <div className="md:col-span-2"><Field label="Active cities"><ListField value={value.activeCities} onChange={(activeCities) => mutate("program", { activeCities })} disabled={disabled} /></Field></div>
      <div><Field label="Service lines"><ListField value={value.serviceLines} onChange={(serviceLines) => mutate("program", { serviceLines })} disabled={disabled} /></Field></div>
      <div className="md:col-span-2 xl:col-span-3"><Toggle checked={value.applicationOpen} onChange={(applicationOpen) => mutate("program", { applicationOpen })} disabled={disabled} label="Public applications open" description="When disabled, new Ambassador applications must be blocked at intake." /></div>
    </div></div>
  }

  if (domain === "recruitment") {
    const value = configuration.recruitment
    return <div><SectionIntro icon={Users} title="Recruitment and eligibility doctrine" description="Control identity requirements, deduplication, selection thresholds, lifecycle stages and exception authority." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Minimum age"><NumberField value={value.minimumAge} onChange={(minimumAge) => mutate("recruitment", { minimumAge })} disabled={disabled} min={18} /></Field>
      <Field label="Interview minimum score"><NumberField value={value.interviewMinimumScore} onChange={(interviewMinimumScore) => mutate("recruitment", { interviewMinimumScore })} disabled={disabled} min={0} max={100} /></Field>
      <Field label="Candidate retention days"><NumberField value={value.candidateRetentionDays} onChange={(candidateRetentionDays) => mutate("recruitment", { candidateRetentionDays })} disabled={disabled} min={1} /></Field>
      <Field label="Duplicate policy"><SelectField value={value.duplicatePolicy} onChange={(duplicatePolicy) => mutate("recruitment", { duplicatePolicy: duplicatePolicy as typeof value.duplicatePolicy })} disabled={disabled} options={[{ value: "email_or_phone", label: "Email or phone" }, { value: "email", label: "Email only" }, { value: "phone", label: "Phone only" }]} /></Field>
      <Field label="Required fields"><ListField value={value.requiredFields} onChange={(requiredFields) => mutate("recruitment", { requiredFields })} disabled={disabled} /></Field>
      <Field label="Required documents"><ListField value={value.requiredDocuments} onChange={(requiredDocuments) => mutate("recruitment", { requiredDocuments })} disabled={disabled} /></Field>
      <Field label="Accepted cities"><ListField value={value.acceptedCities} onChange={(acceptedCities) => mutate("recruitment", { acceptedCities })} disabled={disabled} /></Field>
      <Field label="Required languages"><ListField value={value.requiredLanguages} onChange={(requiredLanguages) => mutate("recruitment", { requiredLanguages })} disabled={disabled} /></Field>
      <Field label="Controlled stages"><ListField value={value.stages} onChange={(stages) => mutate("recruitment", { stages })} disabled={disabled} /></Field>
      <div className="md:col-span-2 xl:col-span-3 grid gap-3 md:grid-cols-2"><Toggle checked={value.allowManualExceptions} onChange={(allowManualExceptions) => mutate("recruitment", { allowManualExceptions })} disabled={disabled} label="Allow documented exceptions" /><Toggle checked={value.conversionRequiresApproval} onChange={(conversionRequiresApproval) => mutate("recruitment", { conversionRequiresApproval })} disabled={disabled} label="Candidate conversion requires approval" /></div>
      <div className="md:col-span-2 xl:col-span-3"><Field label="Automatic rejection reasons"><ListField value={value.automaticRejectionReasons} onChange={(automaticRejectionReasons) => mutate("recruitment", { automaticRejectionReasons })} disabled={disabled} /></Field></div>
    </div></div>
  }

  if (domain === "onboarding") {
    const value = configuration.onboarding
    return <div><SectionIntro icon={ClipboardCheck} title="Onboarding and activation gates" description="Determine exactly what must be completed before an Ambassador becomes operational." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Completion deadline days"><NumberField value={value.completionDeadlineDays} onChange={(completionDeadlineDays) => mutate("onboarding", { completionDeadlineDays })} disabled={disabled} min={1} /></Field>
      <Field label="Reminder interval hours"><NumberField value={value.automaticReminderHours} onChange={(automaticReminderHours) => mutate("onboarding", { automaticReminderHours })} disabled={disabled} min={1} /></Field>
      <Field label="Escalation after hours"><NumberField value={value.escalationAfterHours} onChange={(escalationAfterHours) => mutate("onboarding", { escalationAfterHours })} disabled={disabled} min={1} /></Field>
      <div className="md:col-span-2 xl:col-span-3"><Field label="Mandatory activation steps"><ListField value={value.mandatorySteps} onChange={(mandatorySteps) => mutate("onboarding", { mandatorySteps })} disabled={disabled} /></Field></div>
      <Toggle checked={value.profileVerificationRequired} onChange={(profileVerificationRequired) => mutate("onboarding", { profileVerificationRequired })} disabled={disabled} label="Profile verification required" />
      <Toggle checked={value.contractAcknowledgementRequired} onChange={(contractAcknowledgementRequired) => mutate("onboarding", { contractAcknowledgementRequired })} disabled={disabled} label="Contract acknowledgement required" />
      <Toggle checked={value.bankDetailsRequired} onChange={(bankDetailsRequired) => mutate("onboarding", { bankDetailsRequired })} disabled={disabled} label="Bank details required" />
      <Toggle checked={value.territoryConfirmationRequired} onChange={(territoryConfirmationRequired) => mutate("onboarding", { territoryConfirmationRequired })} disabled={disabled} label="Territory confirmation required" />
      <Toggle checked={value.managerApprovalRequired} onChange={(managerApprovalRequired) => mutate("onboarding", { managerApprovalRequired })} disabled={disabled} label="Manager approval required" />
      <Toggle checked={value.suspendOnExpiredDocuments} onChange={(suspendOnExpiredDocuments) => mutate("onboarding", { suspendOnExpiredDocuments })} disabled={disabled} label="Suspend on expired documents" />
    </div></div>
  }

  if (domain === "training") {
    const value = configuration.training
    return <div><SectionIntro icon={GraduationCap} title="Training and certification controls" description="Protect mission quality through mandatory learning, passing scores, validity and recertification gates." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Certification minimum score"><NumberField value={value.certificationMinimumScore} onChange={(certificationMinimumScore) => mutate("training", { certificationMinimumScore })} disabled={disabled} min={60} max={100} /></Field>
      <Field label="Maximum attempts"><NumberField value={value.maximumAttempts} onChange={(maximumAttempts) => mutate("training", { maximumAttempts })} disabled={disabled} min={1} /></Field>
      <Field label="Certification validity days"><NumberField value={value.certificationValidityDays} onChange={(certificationValidityDays) => mutate("training", { certificationValidityDays })} disabled={disabled} min={30} /></Field>
      <Field label="Recertification reminder days"><NumberField value={value.recertificationReminderDays} onChange={(recertificationReminderDays) => mutate("training", { recertificationReminderDays })} disabled={disabled} min={1} /></Field>
      <div className="md:col-span-2"><Field label="Mandatory programs"><ListField value={value.mandatoryPrograms} onChange={(mandatoryPrograms) => mutate("training", { mandatoryPrograms })} disabled={disabled} /></Field></div>
      <Field label="Authorized certifier roles"><ListField value={value.authorizedCertifierRoles} onChange={(authorizedCertifierRoles) => mutate("training", { authorizedCertifierRoles })} disabled={disabled} /></Field>
      <Toggle checked={value.fieldShadowingRequired} onChange={(fieldShadowingRequired) => mutate("training", { fieldShadowingRequired })} disabled={disabled} label="Field shadowing required" />
      <Toggle checked={value.suspendOnCertificationExpiry} onChange={(suspendOnCertificationExpiry) => mutate("training", { suspendOnCertificationExpiry })} disabled={disabled} label="Suspend expired certifications" />
      <Toggle checked={value.highRiskMissionCertificationRequired} onChange={(highRiskMissionCertificationRequired) => mutate("training", { highRiskMissionCertificationRequired })} disabled={disabled} label="High-risk mission certification gate" />
    </div></div>
  }

  if (domain === "territories") {
    const value = configuration.territories
    return <div><SectionIntro icon={MapPinned} title="Territory and field capacity rules" description="Configure geographic hierarchy, primary/backup assignment doctrine, capacity and coverage escalation." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Maximum Ambassadors per territory"><NumberField value={value.maximumAmbassadorsPerTerritory} onChange={(maximumAmbassadorsPerTerritory) => mutate("territories", { maximumAmbassadorsPerTerritory })} disabled={disabled} min={1} /></Field>
      <Field label="Default assignment days"><NumberField value={value.defaultAssignmentDays} onChange={(defaultAssignmentDays) => mutate("territories", { defaultAssignmentDays })} disabled={disabled} min={1} /></Field>
      <Field label="Travel radius km"><NumberField value={value.travelRadiusKm} onChange={(travelRadiusKm) => mutate("territories", { travelRadiusKm })} disabled={disabled} min={0} /></Field>
      <Field label="Coverage escalation hours"><NumberField value={value.uncoveredTerritoryEscalationHours} onChange={(uncoveredTerritoryEscalationHours) => mutate("territories", { uncoveredTerritoryEscalationHours })} disabled={disabled} min={1} /></Field>
      <div className="md:col-span-2"><Field label="Territory hierarchy"><ListField value={value.hierarchyLevels} onChange={(hierarchyLevels) => mutate("territories", { hierarchyLevels })} disabled={disabled} /></Field></div>
      <Toggle checked={value.exclusivePrimaryAssignment} onChange={(exclusivePrimaryAssignment) => mutate("territories", { exclusivePrimaryAssignment })} disabled={disabled} label="Exclusive primary assignment" />
      <Toggle checked={value.managerApprovalRequired} onChange={(managerApprovalRequired) => mutate("territories", { managerApprovalRequired })} disabled={disabled} label="Manager approval required" />
      <Toggle checked={value.allowBackupAssignments} onChange={(allowBackupAssignments) => mutate("territories", { allowBackupAssignments })} disabled={disabled} label="Allow backup assignments" />
      <Toggle checked={value.allowTemporaryAssignments} onChange={(allowTemporaryAssignments) => mutate("territories", { allowTemporaryAssignments })} disabled={disabled} label="Allow temporary assignments" />
    </div></div>
  }

  if (domain === "missions") {
    const value = configuration.missions
    return <div><SectionIntro icon={Workflow} title="Mission execution policy" description="Define eligibility, concurrency, evidence, checkpoints, escalation and completion gates for field execution." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Maximum concurrent missions"><NumberField value={value.maximumConcurrentMissions} onChange={(maximumConcurrentMissions) => mutate("missions", { maximumConcurrentMissions })} disabled={disabled} min={1} /></Field>
      <Field label="Acceptance deadline hours"><NumberField value={value.acceptanceDeadlineHours} onChange={(acceptanceDeadlineHours) => mutate("missions", { acceptanceDeadlineHours })} disabled={disabled} min={1} /></Field>
      <Field label="Incident escalation hours"><NumberField value={value.incidentEscalationHours} onChange={(incidentEscalationHours) => mutate("missions", { incidentEscalationHours })} disabled={disabled} min={1} /></Field>
      <Field label="Allowed mission types"><ListField value={value.allowedMissionTypes} onChange={(allowedMissionTypes) => mutate("missions", { allowedMissionTypes })} disabled={disabled} /></Field>
      <div className="md:col-span-2"><Field label="Cancellation reasons"><ListField value={value.cancellationReasons} onChange={(cancellationReasons) => mutate("missions", { cancellationReasons })} disabled={disabled} /></Field></div>
      <Toggle checked={value.proofRequired} onChange={(proofRequired) => mutate("missions", { proofRequired })} disabled={disabled} label="Proof required" />
      <Toggle checked={value.managerReviewRequired} onChange={(managerReviewRequired) => mutate("missions", { managerReviewRequired })} disabled={disabled} label="Manager review required" />
      <Toggle checked={value.locationEvidenceRequired} onChange={(locationEvidenceRequired) => mutate("missions", { locationEvidenceRequired })} disabled={disabled} label="Location evidence required" />
      <Toggle checked={value.checkpointRequired} onChange={(checkpointRequired) => mutate("missions", { checkpointRequired })} disabled={disabled} label="Checkpoint required" />
      <Toggle checked={value.completionRequiresApprovedProof} onChange={(completionRequiresApprovedProof) => mutate("missions", { completionRequiresApprovedProof })} disabled={disabled} label="Completion requires approved proof" />
    </div></div>
  }

  if (domain === "attribution") {
    const value = configuration.attribution
    return <div><SectionIntro icon={Target} title="Lead, conversion and attribution rules" description="Protect revenue credit through qualified fields, duplicate handling, attribution windows, proof and dispute controls." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Attribution window days"><NumberField value={value.attributionWindowDays} onChange={(attributionWindowDays) => mutate("attribution", { attributionWindowDays })} disabled={disabled} min={1} /></Field>
      <Field label="Dispute window days"><NumberField value={value.disputeWindowDays} onChange={(disputeWindowDays) => mutate("attribution", { disputeWindowDays })} disabled={disabled} min={1} /></Field>
      <Field label="Duplicate lead policy"><SelectField value={value.duplicateLeadPolicy} onChange={(duplicateLeadPolicy) => mutate("attribution", { duplicateLeadPolicy: duplicateLeadPolicy as typeof value.duplicateLeadPolicy })} disabled={disabled} options={[{ value: "merge", label: "Merge" }, { value: "reject", label: "Reject" }, { value: "manual_review", label: "Manual review" }]} /></Field>
      <Field label="Required lead fields"><ListField value={value.requiredLeadFields} onChange={(requiredLeadFields) => mutate("attribution", { requiredLeadFields })} disabled={disabled} /></Field>
      <div className="md:col-span-2"><Field label="Validation authority roles"><ListField value={value.validationAuthorityRoles} onChange={(validationAuthorityRoles) => mutate("attribution", { validationAuthorityRoles })} disabled={disabled} /></Field></div>
      <Toggle checked={value.promoCodeAttributionEnabled} onChange={(promoCodeAttributionEnabled) => mutate("attribution", { promoCodeAttributionEnabled })} disabled={disabled} label="Promo-code attribution" />
      <Toggle checked={value.referralLinkAttributionEnabled} onChange={(referralLinkAttributionEnabled) => mutate("attribution", { referralLinkAttributionEnabled })} disabled={disabled} label="Referral-link attribution" />
      <Toggle checked={value.manualAttributionRequiresApproval} onChange={(manualAttributionRequiresApproval) => mutate("attribution", { manualAttributionRequiresApproval })} disabled={disabled} label="Manual attribution approval" />
      <Toggle checked={value.conversionProofRequired} onChange={(conversionProofRequired) => mutate("attribution", { conversionProofRequired })} disabled={disabled} label="Conversion proof required" />
      <Toggle checked={value.refundReversesAttribution} onChange={(refundReversesAttribution) => mutate("attribution", { refundReversesAttribution })} disabled={disabled} label="Refund reverses attribution" />
    </div></div>
  }

  if (domain === "rewards") {
    const value = configuration.rewards
    return <div><SectionIntro icon={CircleDollarSign} title="Reward, commission and payout doctrine" description="Control the 10% commission baseline, financial gates, payout cycle, limits, reversals and temporary incentives." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Default commission rate %"><NumberField value={value.defaultCommissionRate} onChange={(defaultCommissionRate) => mutate("rewards", { defaultCommissionRate })} disabled={disabled} min={0} max={100} /></Field>
      <Field label="Minimum payout"><NumberField value={value.minimumPayoutMad} onChange={(minimumPayoutMad) => mutate("rewards", { minimumPayoutMad })} disabled={disabled} min={0} /></Field>
      <Field label="Maximum reward"><NumberField value={value.maximumRewardMad} onChange={(maximumRewardMad) => mutate("rewards", { maximumRewardMad })} disabled={disabled} min={0} /></Field>
      <Field label="Payout cycle"><SelectField value={value.payoutCycle} onChange={(payoutCycle) => mutate("rewards", { payoutCycle: payoutCycle as typeof value.payoutCycle })} disabled={disabled} options={["weekly", "biweekly", "monthly"].map((item) => ({ value: item, label: titleCase(item) }))} /></Field>
      <Field label="Temporary bonus rate %"><NumberField value={value.temporaryBonusRate} onChange={(temporaryBonusRate) => mutate("rewards", { temporaryBonusRate })} disabled={disabled || !value.temporaryBonusEnabled} min={0} max={100} /></Field>
      <Field label="Temporary bonus end"><input className={inputClass} type="date" value={value.temporaryBonusEndsAt || ""} onChange={(event) => mutate("rewards", { temporaryBonusEndsAt: event.target.value || null })} disabled={disabled || !value.temporaryBonusEnabled} /></Field>
      <Toggle checked={value.financeApprovalRequired} onChange={(financeApprovalRequired) => mutate("rewards", { financeApprovalRequired })} disabled={disabled} label="Finance approval required" />
      <Toggle checked={value.proofRequiredBeforeReward} onChange={(proofRequiredBeforeReward) => mutate("rewards", { proofRequiredBeforeReward })} disabled={disabled} label="Approved proof before reward" />
      <Toggle checked={value.paymentReferenceRequired} onChange={(paymentReferenceRequired) => mutate("rewards", { paymentReferenceRequired })} disabled={disabled} label="Payment reference required" />
      <Toggle checked={value.refundReversesReward} onChange={(refundReversesReward) => mutate("rewards", { refundReversesReward })} disabled={disabled} label="Refund reverses reward" />
      <Toggle checked={value.temporaryBonusEnabled} onChange={(temporaryBonusEnabled) => mutate("rewards", { temporaryBonusEnabled })} disabled={disabled} label="Temporary bonus enabled" />
    </div></div>
  }

  if (domain === "kpis") {
    const value = configuration.kpis
    const weightTotal = Object.values(value.weights).reduce((sum, item) => sum + Number(item || 0), 0)
    return <div><SectionIntro icon={SlidersHorizontal} title="KPI and performance doctrine" description="Set targets, performance triggers and a transparent 100-point scoring model." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Daily contacts"><NumberField value={value.dailyContactsTarget} onChange={(dailyContactsTarget) => mutate("kpis", { dailyContactsTarget })} disabled={disabled} min={0} /></Field>
      <Field label="Daily qualified leads"><NumberField value={value.dailyQualifiedLeadsTarget} onChange={(dailyQualifiedLeadsTarget) => mutate("kpis", { dailyQualifiedLeadsTarget })} disabled={disabled} min={0} /></Field>
      <Field label="Monthly conversions"><NumberField value={value.monthlyConversionsTarget} onChange={(monthlyConversionsTarget) => mutate("kpis", { monthlyConversionsTarget })} disabled={disabled} min={0} /></Field>
      <Field label="Monthly revenue target"><NumberField value={value.monthlyRevenueTargetMad} onChange={(monthlyRevenueTargetMad) => mutate("kpis", { monthlyRevenueTargetMad })} disabled={disabled} min={0} /></Field>
      <Field label="Follow-up SLA hours"><NumberField value={value.followUpSlaHours} onChange={(followUpSlaHours) => mutate("kpis", { followUpSlaHours })} disabled={disabled} min={1} /></Field>
      <Field label="Inactivity threshold days"><NumberField value={value.inactivityThresholdDays} onChange={(inactivityThresholdDays) => mutate("kpis", { inactivityThresholdDays })} disabled={disabled} min={1} /></Field>
      <Field label="Coaching trigger"><NumberField value={value.coachingTriggerScore} onChange={(coachingTriggerScore) => mutate("kpis", { coachingTriggerScore })} disabled={disabled} min={0} max={100} /></Field>
      <Field label="Suspension trigger"><NumberField value={value.suspensionTriggerScore} onChange={(suspensionTriggerScore) => mutate("kpis", { suspensionTriggerScore })} disabled={disabled} min={0} max={100} /></Field>
      <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between"><h4 className="text-xs font-black text-slate-900">Score weighting</h4><span className={`text-xs font-black ${weightTotal === 100 ? "text-emerald-700" : "text-red-700"}`}>{weightTotal}/100</span></div><div className="mt-4 grid gap-3 md:grid-cols-5">{Object.entries(value.weights).map(([key, weight]) => <Field key={key} label={titleCase(key)}><NumberField value={weight} onChange={(next) => mutate("kpis", { weights: { ...value.weights, [key]: next } })} disabled={disabled} min={0} max={100} /></Field>)}</div></div>
    </div></div>
  }

  if (domain === "communications") {
    const value = configuration.communications
    const channels = ["email", "whatsapp", "sms", "in_app"] as const
    return <div><SectionIntro icon={BellRing} title="Communications and escalation" description="Control approved channels, consent, quiet hours, reminders, escalation and delivery resilience." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Blocked escalation hours"><NumberField value={value.blockedEscalationHours} onChange={(blockedEscalationHours) => mutate("communications", { blockedEscalationHours })} disabled={disabled} min={1} /></Field>
      <Field label="Training expiry reminder days"><NumberField value={value.trainingExpiryReminderDays} onChange={(trainingExpiryReminderDays) => mutate("communications", { trainingExpiryReminderDays })} disabled={disabled} min={1} /></Field>
      <Field label="Proof revision reminder hours"><NumberField value={value.proofRevisionReminderHours} onChange={(proofRevisionReminderHours) => mutate("communications", { proofRevisionReminderHours })} disabled={disabled} min={1} /></Field>
      <Field label="Quiet hours start"><input className={inputClass} type="time" value={value.quietHoursStart} onChange={(event) => mutate("communications", { quietHoursStart: event.target.value })} disabled={disabled} /></Field>
      <Field label="Quiet hours end"><input className={inputClass} type="time" value={value.quietHoursEnd} onChange={(event) => mutate("communications", { quietHoursEnd: event.target.value })} disabled={disabled} /></Field>
      <Field label="Maximum delivery attempts"><NumberField value={value.maximumDeliveryAttempts} onChange={(maximumDeliveryAttempts) => mutate("communications", { maximumDeliveryAttempts })} disabled={disabled} min={1} /></Field>
      <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-slate-200 p-4"><div className="text-xs font-black text-slate-900">Enabled channels</div><div className="mt-3 grid gap-3 md:grid-cols-4">{channels.map((channel) => <Toggle key={channel} checked={value.enabledChannels.includes(channel)} onChange={(checked) => mutate("communications", { enabledChannels: checked ? [...new Set([...value.enabledChannels, channel])] : value.enabledChannels.filter((item) => item !== channel) })} disabled={disabled} label={titleCase(channel)} />)}</div></div>
      <Toggle checked={value.dailyReportRequired} onChange={(dailyReportRequired) => mutate("communications", { dailyReportRequired })} disabled={disabled} label="Daily report required" />
      <Toggle checked={value.consentRequired} onChange={(consentRequired) => mutate("communications", { consentRequired })} disabled={disabled} label="Communication consent required" />
    </div></div>
  }

  const value = configuration.governance
  return <div><SectionIntro icon={ShieldCheck} title="Security, roles and governance" description="Enforce separation of duties, approval authority, export control, sessions, emergency access and rollback governance." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    <Field label="Session maximum hours"><NumberField value={value.sessionMaximumHours} onChange={(sessionMaximumHours) => mutate("governance", { sessionMaximumHours })} disabled={disabled} min={1} /></Field>
    <Field label="Emergency access minutes"><NumberField value={value.emergencyAccessMaximumMinutes} onChange={(emergencyAccessMaximumMinutes) => mutate("governance", { emergencyAccessMaximumMinutes })} disabled={disabled || !value.emergencyAccessEnabled} min={1} /></Field>
    <div className="md:col-span-2"><Field label="Export-authorized roles"><ListField value={value.exportAllowedRoles} onChange={(exportAllowedRoles) => mutate("governance", { exportAllowedRoles })} disabled={disabled} /></Field></div>
    <Toggle checked={value.separationOfDutiesRequired} onChange={(separationOfDutiesRequired) => mutate("governance", { separationOfDutiesRequired })} disabled={disabled} label="Separation of duties required" />
    <Toggle checked={value.dualApprovalForFinanceChanges} onChange={(dualApprovalForFinanceChanges) => mutate("governance", { dualApprovalForFinanceChanges })} disabled={disabled} label="Finance changes require dual approval" />
    <Toggle checked={value.complianceApprovalForPrivacyChanges} onChange={(complianceApprovalForPrivacyChanges) => mutate("governance", { complianceApprovalForPrivacyChanges })} disabled={disabled} label="Compliance approval for privacy changes" />
    <Toggle checked={value.configurationChangeReasonRequired} onChange={(configurationChangeReasonRequired) => mutate("governance", { configurationChangeReasonRequired })} disabled={disabled} label="Change reason required" />
    <Toggle checked={value.publicationRequiresValidation} onChange={(publicationRequiresValidation) => mutate("governance", { publicationRequiresValidation })} disabled={disabled} label="Validation required before publication" />
    <Toggle checked={value.rollbackRequiresDirector} onChange={(rollbackRequiresDirector) => mutate("governance", { rollbackRequiresDirector })} disabled={disabled} label="Rollback requires director authority" />
    <Toggle checked={value.emergencyAccessEnabled} onChange={(emergencyAccessEnabled) => mutate("governance", { emergencyAccessEnabled })} disabled={disabled} label="Emergency access enabled" description="Keep disabled unless an approved break-glass procedure is operational." />
  </div></div>
}
