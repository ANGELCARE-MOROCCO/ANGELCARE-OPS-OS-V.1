"use client"

import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react"
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  Filter,
  Flag,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Target,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react"
import type { AmbassadorWorkspaceSnapshot } from "@/lib/market-os/ambassadors/types"

type AnyRow = Record<string, any>
type IconType = ComponentType<{ className?: string; size?: number }>
type GoalState = "achieved" | "ahead" | "on_track" | "attention" | "overdue" | "missed" | "inactive" | "recalculation"

type Props = {
  snapshot: AmbassadorWorkspaceSnapshot
  goals: AnyRow[]
  loading: boolean
  refreshing: boolean
  error?: string | null
  success?: string | null
  onRefresh: () => void
  onExport: () => void
  onCreateGoal: () => void
  onEditGoal: (goal: AnyRow) => void
  onRecalculateGoal: (goal: AnyRow) => void | Promise<void>
  onArchiveGoal: (goal: AnyRow) => void
  onOpenAmbassador: (ambassador: AnyRow) => void
}

const stateLabels: Record<GoalState, string> = {
  achieved: "Objectif atteint",
  ahead: "En avance",
  on_track: "Dans la trajectoire",
  attention: "Intervention requise",
  overdue: "En retard",
  missed: "Objectif manqué",
  inactive: "Inactif",
  recalculation: "Recalcul attendu",
}

const stateTone: Record<GoalState, string> = {
  achieved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  ahead: "border-blue-200 bg-blue-50 text-blue-800",
  on_track: "border-sky-200 bg-sky-50 text-sky-800",
  attention: "border-amber-200 bg-amber-50 text-amber-900",
  overdue: "border-rose-200 bg-rose-50 text-rose-800",
  missed: "border-red-200 bg-red-50 text-red-800",
  inactive: "border-slate-200 bg-slate-100 text-slate-700",
  recalculation: "border-cyan-200 bg-cyan-50 text-cyan-800",
}

function text(...values: unknown[]) {
  for (const value of values) {
    const normalized = String(value ?? "").trim()
    if (normalized) return normalized
  }
  return ""
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value))
}

function formatNumber(value: unknown) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(numberValue(value))
}

function dateObject(value: unknown) {
  const raw = text(value)
  if (!raw) return null
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function humanDate(value: unknown) {
  const parsed = dateObject(value)
  if (!parsed) return "—"
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(parsed)
}

function goalTarget(goal: AnyRow) {
  return numberValue(goal.target_value ?? goal.target ?? goal.objective_value)
}

function goalActual(goal: AnyRow) {
  return numberValue(goal.current_value ?? goal.actual_value ?? goal.actual ?? goal.result_value)
}

function goalProgress(goal: AnyRow) {
  const supplied = Number(goal.completion_rate ?? goal.progress ?? goal.achievement_rate)
  if (Number.isFinite(supplied)) return supplied
  const target = goalTarget(goal)
  return target > 0 ? (goalActual(goal) / target) * 100 : 0
}

function dueDate(goal: AnyRow) {
  return goal.due_date ?? goal.end_date ?? goal.period_end ?? goal.deadline
}

function startDate(goal: AnyRow) {
  return goal.start_date ?? goal.period_start ?? goal.created_at
}

function goalState(goal: AnyRow): GoalState {
  const raw = text(goal.status, "tracking").toLowerCase().replace(/[\s-]+/g, "_")
  const progress = goalProgress(goal)
  const due = dateObject(dueDate(goal))
  const overdue = Boolean(due && due.getTime() < Date.now() && progress < 100)
  if (["inactive", "archived", "paused", "disabled"].includes(raw)) return "inactive"
  if (["awaiting_recalculation", "recalculation_pending", "recalculating"].includes(raw)) return "recalculation"
  if (["achieved", "completed", "complete", "done"].includes(raw) || progress >= 100) return progress > 100 ? "ahead" : "achieved"
  if (["missed", "failed"].includes(raw)) return "missed"
  if (overdue || ["overdue", "late", "delayed"].includes(raw)) return "overdue"
  if (["at_risk", "attention", "blocked", "warning"].includes(raw)) return "attention"
  return "on_track"
}

function ambassadorName(goal: AnyRow, ambassadors: AnyRow[]) {
  const owner = ambassadors.find((item) => String(item.id) === String(goal.ambassador_id || goal.owner_id || ""))
  return text(owner?.full_name, owner?.name, goal.owner_name, "Objectif réseau")
}

function territoryName(goal: AnyRow, snapshot: AmbassadorWorkspaceSnapshot) {
  const territory = (snapshot.territories || []).find((item: AnyRow) => String(item.id) === String(goal.territory_id || ""))
  return text(territory?.name, goal.territory_name, goal.city, goal.region, "—")
}

function daysRemaining(goal: AnyRow) {
  const due = dateObject(dueDate(goal))
  if (!due) return null
  return Math.ceil((due.getTime() - Date.now()) / 86400000)
}

function StatusBadge({ state }: { state: GoalState }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${stateTone[state]}`}>{stateLabels[state]}</span>
}

function ActionButton({ icon: Icon, children, onClick, primary = false, danger = false, disabled = false }: { icon: IconType; children: ReactNode; onClick: () => void; primary?: boolean; danger?: boolean; disabled?: boolean }) {
  const tone = primary
    ? "border-[#164d7d] bg-[#164d7d] text-white hover:bg-[#0f3c65]"
    : danger
      ? "border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
      : "border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50"
  return <button type="button" disabled={disabled} onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-black shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${tone}`}><Icon size={15} />{children}</button>
}

function ProgressLine({ value, state }: { value: number; state: GoalState }) {
  const fill = state === "achieved" || state === "ahead" ? "bg-emerald-500" : state === "attention" ? "bg-amber-500" : state === "overdue" || state === "missed" ? "bg-rose-500" : "bg-blue-600"
  return <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${fill}`} style={{ width: `${clamp(value)}%` }} /></div>
}

function Skeleton() {
  return <div className="space-y-5 animate-pulse" aria-label="Chargement du portefeuille d’objectifs"><div className="h-44 rounded-[30px] bg-slate-200" /><div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]"><div className="space-y-3 rounded-[28px] border border-slate-200 bg-white p-5">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-24 rounded-2xl bg-slate-100" />)}</div><div className="h-[520px] rounded-[28px] bg-slate-200" /></div></div>
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return <section className="rounded-[30px] border border-dashed border-blue-200 bg-white px-6 py-16 text-center shadow-sm"><div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-blue-50 text-blue-700"><Target size={30} /></div><h2 className="mt-5 text-2xl font-black text-slate-950">Aucun contrat d’objectif actif</h2><p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">Créez le premier objectif depuis le workflow existant afin de suivre la cible, le résultat réel, l’écart et l’échéance.</p><div className="mt-6 flex justify-center"><ActionButton icon={Plus} primary onClick={onCreate}>Créer un objectif</ActionButton></div></section>
}

function GoalRow({ goal, snapshot, onOpen, onEdit, onRecalculate }: { goal: AnyRow; snapshot: AmbassadorWorkspaceSnapshot; onOpen: () => void; onEdit: () => void; onRecalculate: () => void }) {
  const state = goalState(goal)
  const target = goalTarget(goal)
  const actual = goalActual(goal)
  const progress = goalProgress(goal)
  const variance = actual - target
  const remaining = daysRemaining(goal)
  return <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition hover:border-blue-200 hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-center gap-2"><StatusBadge state={state} />{goal.priority ? <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-slate-600"><Flag size={11} />{text(goal.priority)}</span> : null}</div>
        <h3 className="mt-3 truncate text-base font-black text-slate-950">{text(goal.goal_type, goal.metric, goal.title, "Objectif sans intitulé")}</h3>
        <p className="mt-1 truncate text-xs font-semibold text-slate-500">{ambassadorName(goal, snapshot.ambassadors || [])} · {territoryName(goal, snapshot)} · {text(goal.period, "Période non renseignée")}</p>
      </button>
      <div className="grid flex-[1.3] grid-cols-2 gap-3 sm:grid-cols-4">
        <div><div className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-500">Cible</div><div className="mt-1 font-black tabular-nums text-slate-950">{formatNumber(target)}</div></div>
        <div><div className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-500">Réalisé</div><div className="mt-1 font-black tabular-nums text-slate-950">{formatNumber(actual)}</div></div>
        <div><div className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-500">Écart</div><div className={`mt-1 font-black tabular-nums ${variance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{variance > 0 ? "+" : ""}{formatNumber(variance)}</div></div>
        <div><div className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-500">Échéance</div><div className={`mt-1 font-black tabular-nums ${remaining !== null && remaining < 0 ? "text-rose-700" : "text-slate-950"}`}>{remaining === null ? "—" : remaining < 0 ? `${Math.abs(remaining)} j retard` : `${remaining} j`}</div></div>
      </div>
      <div className="w-full lg:w-[180px]"><div className="mb-2 flex items-center justify-between text-xs font-black"><span>Accomplissement</span><span className="tabular-nums">{formatNumber(progress)}%</span></div><ProgressLine value={progress} state={state} /></div>
      <div className="flex shrink-0 gap-2"><button type="button" onClick={onOpen} aria-label="Ouvrir le contrat" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-blue-50"><Eye size={16} /></button><button type="button" onClick={onEdit} aria-label="Modifier l’objectif" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-blue-50"><Pencil size={16} /></button><button type="button" onClick={onRecalculate} aria-label="Recalculer l’objectif" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-blue-50"><RefreshCw size={16} /></button></div>
    </div>
  </article>
}

function DetailLine({ label, value }: { label: string; value: ReactNode }) {
  return <div className="flex items-start justify-between gap-5 border-b border-slate-100 py-3 last:border-0"><span className="text-xs font-bold text-slate-500">{label}</span><span className="text-right text-sm font-black text-slate-900">{value || "—"}</span></div>
}

function GoalDossier({ goal, snapshot, onClose, onEdit, onRecalculate, onArchive, onOpenAmbassador }: { goal: AnyRow; snapshot: AmbassadorWorkspaceSnapshot; onClose: () => void; onEdit: () => void; onRecalculate: () => void; onArchive: () => void; onOpenAmbassador: () => void }) {
  const state = goalState(goal)
  const target = goalTarget(goal)
  const actual = goalActual(goal)
  const variance = actual - target
  const progress = goalProgress(goal)
  const ambassador = (snapshot.ambassadors || []).find((item: AnyRow) => String(item.id) === String(goal.ambassador_id || goal.owner_id || ""))
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKey) }
  }, [onClose])
  return <div className="fixed inset-x-0 bottom-0 z-[10055] bg-slate-950/30 backdrop-blur-[2px]" style={{ top: "var(--angelcare-overhead-height, 96px)" }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><aside role="dialog" aria-modal="true" aria-labelledby="goal-dossier-title" className="ml-auto flex h-full w-full max-w-[760px] flex-col border-l border-slate-200 bg-[#f5f8fb] shadow-2xl"><header className="border-b border-slate-200 bg-[#082b4d] px-6 py-5"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#a9cce9]">Contrat de performance</p><h2 id="goal-dossier-title" className="mt-2 text-2xl font-black text-white">{text(goal.goal_type, goal.metric, goal.title, "Objectif")}</h2><p className="mt-2 text-sm font-semibold text-[#d9e7f3]">{ambassadorName(goal, snapshot.ambassadors || [])} · {text(goal.period, "Période non renseignée")}</p><div className="mt-3"><StatusBadge state={state} /></div></div><button type="button" onClick={onClose} aria-label="Fermer le dossier" className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20"><X size={18} /></button></div></header><div className="flex-1 overflow-y-auto p-5"><section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm"><div className="grid gap-4 sm:grid-cols-3"><div><p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">Cible contractuelle</p><p className="mt-2 text-3xl font-black tabular-nums text-slate-950">{formatNumber(target)}</p></div><div><p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">Résultat réel</p><p className="mt-2 text-3xl font-black tabular-nums text-slate-950">{formatNumber(actual)}</p></div><div><p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">Écart</p><p className={`mt-2 text-3xl font-black tabular-nums ${variance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{variance > 0 ? "+" : ""}{formatNumber(variance)}</p></div></div><div className="mt-5"><div className="mb-2 flex justify-between text-xs font-black"><span>Taux d’accomplissement</span><span>{formatNumber(progress)}%</span></div><ProgressLine value={progress} state={state} /></div></section><div className="mt-4 grid gap-4 md:grid-cols-2"><section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="flex items-center gap-2 text-sm font-black text-slate-950"><UserRound size={16} className="text-blue-700" /> Responsabilité</h3><div className="mt-3"><DetailLine label="Ambassadeur" value={ambassadorName(goal, snapshot.ambassadors || [])} /><DetailLine label="Territoire" value={territoryName(goal, snapshot)} /><DetailLine label="Priorité" value={text(goal.priority, goal.weighting, "—")} /><DetailLine label="Propriétaire" value={text(goal.owner_name, goal.manager_name, "—")} /></div>{ambassador ? <button type="button" onClick={onOpenAmbassador} className="mt-3 inline-flex items-center gap-2 text-xs font-black text-blue-700">Ouvrir le profil ambassadeur <ArrowRight size={14} /></button> : null}</section><section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="flex items-center gap-2 text-sm font-black text-slate-950"><CalendarClock size={16} className="text-blue-700" /> Période & échéance</h3><div className="mt-3"><DetailLine label="Période" value={text(goal.period, "—")} /><DetailLine label="Début" value={humanDate(startDate(goal))} /><DetailLine label="Échéance" value={humanDate(dueDate(goal))} /><DetailLine label="Temps restant" value={daysRemaining(goal) === null ? "—" : daysRemaining(goal)! < 0 ? `${Math.abs(daysRemaining(goal)!)} jour(s) de retard` : `${daysRemaining(goal)} jour(s)`} /></div></section></div><section className="mt-4 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="flex items-center gap-2 text-sm font-black text-slate-950"><FileCheck2 size={16} className="text-blue-700" /> Preuves, notes et recalcul</h3><div className="mt-3"><DetailLine label="Preuve" value={text(goal.evidence, goal.evidence_url, goal.proof_reference, "—")} /><DetailLine label="Statut du recalcul" value={text(goal.recalculation_status, goal.calculation_status, "—")} /><DetailLine label="Dernier recalcul" value={humanDate(goal.recalculated_at || goal.calculated_at)} /></div><div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700">{text(goal.manager_notes, goal.notes, "Aucune note opérationnelle disponible.")}</div></section></div><footer className="border-t border-slate-200 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-3"><ActionButton icon={Flag} danger onClick={onArchive}>Archiver</ActionButton><div className="flex flex-wrap gap-2"><ActionButton icon={Pencil} onClick={onEdit}>Modifier</ActionButton><ActionButton icon={RefreshCw} primary onClick={onRecalculate}>Recalculer</ActionButton></div></div></footer></aside></div>
}

function RecalculateConfirm({ goal, onClose, onConfirm }: { goal: AnyRow; onClose: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])
  return <div className="fixed inset-0 z-[10070] grid place-items-center bg-slate-950/35 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section role="alertdialog" aria-modal="true" aria-labelledby="recalculate-title" className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700"><RefreshCw size={21} /></span><div><h2 id="recalculate-title" className="text-xl font-black text-slate-950">Recalculer le contrat d’objectif</h2><p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Le moteur existant recalculera l’objectif « {text(goal.goal_type, goal.metric, goal.title, "sélectionné")} ». Aucun calcul ni payload n’est modifié par cette interface.</p></div></div><div className="mt-6 flex justify-end gap-2"><ActionButton icon={X} onClick={onClose}>Annuler</ActionButton><ActionButton icon={RefreshCw} primary onClick={onConfirm}>Lancer le recalcul</ActionButton></div></section></div>
}

export default function AmbassadorGoalsKpisRoute({ snapshot, goals, loading, refreshing, error, success, onRefresh, onExport, onCreateGoal, onEditGoal, onRecalculateGoal, onArchiveGoal, onOpenAmbassador }: Props) {
  const ambassadors = useMemo(() => Array.isArray(snapshot.ambassadors) ? snapshot.ambassadors : [], [snapshot.ambassadors])
  const [query, setQuery] = useState("")
  const [stateFilter, setStateFilter] = useState<GoalState | "all">("all")
  const [ownerFilter, setOwnerFilter] = useState("all")
  const [periodFilter, setPeriodFilter] = useState("all")
  const [selectedGoal, setSelectedGoal] = useState<AnyRow | null>(null)
  const [recalculateGoal, setRecalculateGoal] = useState<AnyRow | null>(null)

  const periods = useMemo(() => Array.from(new Set(goals.map((goal) => text(goal.period)).filter(Boolean))).sort().reverse(), [goals])
  const filtered = useMemo(() => goals.filter((goal) => {
    const haystack = `${text(goal.goal_type, goal.metric, goal.title)} ${ambassadorName(goal, ambassadors)} ${territoryName(goal, snapshot)} ${text(goal.period)} ${text(goal.manager_notes, goal.notes)}`.toLowerCase()
    return (!query || haystack.includes(query.toLowerCase())) && (stateFilter === "all" || goalState(goal) === stateFilter) && (ownerFilter === "all" || String(goal.ambassador_id || goal.owner_id || "network") === ownerFilter) && (periodFilter === "all" || text(goal.period) === periodFilter)
  }), [goals, query, stateFilter, ownerFilter, periodFilter, ambassadors, snapshot])

  const stateCounts = useMemo(() => Object.keys(stateLabels).reduce((acc, key) => ({ ...acc, [key]: goals.filter((goal) => goalState(goal) === key).length }), {} as Record<GoalState, number>), [goals])
  const intervention = goals.filter((goal) => ["attention", "overdue", "missed", "recalculation"].includes(goalState(goal))).sort((a, b) => (daysRemaining(a) ?? 9999) - (daysRemaining(b) ?? 9999))
  const totalTarget = goals.reduce((sum, goal) => sum + goalTarget(goal), 0)
  const totalActual = goals.reduce((sum, goal) => sum + goalActual(goal), 0)
  const portfolioRate = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0

  const requestRecalculation = (goal: AnyRow) => setRecalculateGoal(goal)
  const confirmRecalculation = () => {
    if (!recalculateGoal) return
    void onRecalculateGoal(recalculateGoal)
    setRecalculateGoal(null)
  }

  if (loading) return <div className="min-h-screen bg-[#f2f5f8] px-5 py-5 text-slate-950 xl:px-7"><Skeleton /></div>

  return <div className="min-h-screen bg-[#f2f5f8] px-5 py-5 text-slate-950 xl:px-7"><div className="mx-auto w-full max-w-none space-y-5"><section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm"><div className="grid xl:grid-cols-[1.35fr_0.65fr]"><div className="p-6 xl:p-7"><div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.17em] text-blue-800"><ShieldCheck size={13} /> Performance Contract & Objective Control</div><h1 className="mt-4 text-3xl font-black tracking-[-0.035em] text-slate-950 xl:text-[38px]">Goals & KPIs</h1><p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">Gouvernez les engagements mesurables, la cible, le résultat réel, l’écart, l’échéance et les interventions nécessaires sans altérer les calculs existants.</p><div className="mt-5 flex flex-wrap gap-2"><ActionButton icon={Plus} primary onClick={onCreateGoal}>Créer un objectif</ActionButton><ActionButton icon={Download} onClick={onExport}>Exporter</ActionButton><ActionButton icon={RefreshCw} disabled={refreshing} onClick={onRefresh}>{refreshing ? "Actualisation…" : "Actualiser"}</ActionButton></div>{error || success ? <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-black ${error ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{error || success}</div> : null}</div><aside className="bg-[#082b4d] p-6 text-white xl:p-7"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#a9cce9]">Posture du portefeuille</p><div className="mt-5 grid grid-cols-2 gap-4"><div><p className="text-xs font-bold text-[#cfe0ee]">Objectifs actifs</p><p className="mt-1 text-3xl font-black tabular-nums text-white">{goals.filter((goal) => goalState(goal) !== "inactive").length}</p></div><div><p className="text-xs font-bold text-[#cfe0ee]">Taux agrégé</p><p className="mt-1 text-3xl font-black tabular-nums text-white">{formatNumber(portfolioRate)}%</p></div><div><p className="text-xs font-bold text-[#cfe0ee]">Cible cumulée</p><p className="mt-1 text-xl font-black tabular-nums text-white">{formatNumber(totalTarget)}</p></div><div><p className="text-xs font-bold text-[#cfe0ee]">Résultat cumulé</p><p className="mt-1 text-xl font-black tabular-nums text-white">{formatNumber(totalActual)}</p></div></div><div className="mt-5 border-t border-white/15 pt-4"><div className="flex items-center justify-between text-xs font-black text-[#d9e7f3]"><span>Accomplissement consolidé</span><span>{formatNumber(portfolioRate)}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#72b7ef]" style={{ width: `${clamp(portfolioRate)}%` }} /></div></div></aside></div></section>

    {goals.length === 0 ? <EmptyState onCreate={onCreateGoal} /> : <><section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm"><div className="grid gap-3 xl:grid-cols-[1fr_auto]"><div className="flex flex-wrap gap-2">{(["all", "achieved", "ahead", "on_track", "attention", "overdue", "missed", "recalculation"] as const).map((state) => <button key={state} type="button" onClick={() => setStateFilter(state)} className={`rounded-xl border px-3 py-2 text-xs font-black transition ${stateFilter === state ? "border-[#164d7d] bg-[#164d7d] text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>{state === "all" ? `Tous · ${goals.length}` : `${stateLabels[state]} · ${stateCounts[state]}`}</button>)}</div><div className="flex flex-wrap gap-2"><label className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Objectif, ambassadeur, territoire…" className="w-[280px] rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs font-bold outline-none focus:border-blue-400" /></label><select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold"><option value="all">Tous les responsables</option><option value="network">Objectifs réseau</option>{ambassadors.map((item: AnyRow) => <option key={item.id} value={item.id}>{text(item.full_name, item.name)}</option>)}</select><select value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold"><option value="all">Toutes les périodes</option>{periods.map((period) => <option key={period} value={period}>{period}</option>)}</select></div></div></section>

    <div className="grid gap-5 xl:grid-cols-[1fr_340px]"><section className="space-y-3"><div className="flex items-center justify-between px-1"><div><h2 className="text-lg font-black text-slate-950">Portefeuille des contrats</h2><p className="mt-1 text-xs font-semibold text-slate-500">{filtered.length} objectif(s) dans le périmètre courant</p></div><Filter size={18} className="text-slate-400" /></div>{filtered.map((goal) => <GoalRow key={String(goal.id)} goal={goal} snapshot={snapshot} onOpen={() => setSelectedGoal(goal)} onEdit={() => onEditGoal(goal)} onRecalculate={() => requestRecalculation(goal)} />)}{filtered.length === 0 ? <div className="rounded-[24px] border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-500">Aucun objectif ne correspond aux filtres actuels.</div> : null}</section><aside className="space-y-4"><section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-rose-700">Intervention immédiate</p><h2 className="mt-1 text-lg font-black text-slate-950">Registre d’attention</h2></div><span className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-50 text-rose-700"><AlertTriangle size={18} /></span></div><div className="mt-4 space-y-3">{intervention.slice(0, 7).map((goal) => <button key={String(goal.id)} type="button" onClick={() => setSelectedGoal(goal)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-rose-200 hover:bg-rose-50"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-black text-slate-900">{text(goal.goal_type, goal.metric, goal.title, "Objectif")}</p><p className="mt-1 truncate text-[10px] font-semibold text-slate-500">{ambassadorName(goal, ambassadors)}</p></div><StatusBadge state={goalState(goal)} /></div><div className="mt-3 flex items-center justify-between text-[10px] font-black text-slate-600"><span>{formatNumber(goalProgress(goal))}%</span><span>{humanDate(dueDate(goal))}</span></div></button>)}{intervention.length === 0 ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800"><CheckCircle2 size={18} className="mb-2" />Aucune intervention signalée par les données actuelles.</div> : null}</div></section><section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="flex items-center gap-2 text-sm font-black text-slate-950"><Clock3 size={16} className="text-blue-700" /> Gouvernance des échéances</h3><div className="mt-4 space-y-3">{[{ label: "Atteints", value: stateCounts.achieved + stateCounts.ahead, tone: "text-emerald-700" }, { label: "Dans la trajectoire", value: stateCounts.on_track, tone: "text-blue-700" }, { label: "Attention", value: stateCounts.attention, tone: "text-amber-700" }, { label: "En retard / manqués", value: stateCounts.overdue + stateCounts.missed, tone: "text-rose-700" }].map((item) => <div key={item.label} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"><span className="text-xs font-bold text-slate-600">{item.label}</span><span className={`text-lg font-black tabular-nums ${item.tone}`}>{item.value}</span></div>)}</div></section></aside></div></>}
  </div>{selectedGoal ? <GoalDossier goal={selectedGoal} snapshot={snapshot} onClose={() => setSelectedGoal(null)} onEdit={() => { setSelectedGoal(null); onEditGoal(selectedGoal) }} onRecalculate={() => { setSelectedGoal(null); requestRecalculation(selectedGoal) }} onArchive={() => { setSelectedGoal(null); onArchiveGoal(selectedGoal) }} onOpenAmbassador={() => { const ambassador = ambassadors.find((item: AnyRow) => String(item.id) === String(selectedGoal.ambassador_id || selectedGoal.owner_id || "")); if (ambassador) onOpenAmbassador(ambassador) }} /> : null}{recalculateGoal ? <RecalculateConfirm goal={recalculateGoal} onClose={() => setRecalculateGoal(null)} onConfirm={confirmRecalculation} /> : null}</div>
}
