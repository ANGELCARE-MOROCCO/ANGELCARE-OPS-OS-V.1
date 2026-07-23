"use client"

import { useMemo, type ComponentType } from "react"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  Download,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  ShieldAlert,
  Target,
  Trash2,
  TrendingUp,
  UserRoundCheck,
  Users,
} from "lucide-react"
import type {
  Ambassador,
  AmbassadorKpiGoal,
  AmbassadorWorkspaceSnapshot,
} from "@/lib/market-os/ambassadors/types"

type Row = Record<string, any>
type IconType = ComponentType<{ size?: number; className?: string }>

type Props = {
  snapshot: AmbassadorWorkspaceSnapshot
  kpis: Record<string, number>
  goals: AmbassadorKpiGoal[]
  loading: boolean
  refreshing: boolean
  error?: string | null
  success?: string | null
  onRefresh: () => void
  onExport: () => void
  onCreateGoal: () => void
  onEditGoal: (goal: AmbassadorKpiGoal) => void
  onRecalculateGoal: (goal: AmbassadorKpiGoal) => void
  onArchiveGoal: (goal: AmbassadorKpiGoal) => void
  onOpenAmbassador: (ambassador: Ambassador) => void
}

function number(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatNumber(value: unknown) {
  return new Intl.NumberFormat("fr-FR").format(number(value))
}

function percentage(value: unknown) {
  return `${Math.max(0, Math.min(100, Math.round(number(value))))}%`
}

function text(value: unknown) {
  return String(value ?? "").trim()
}

function scoreOf(ambassador: Row, goals: AmbassadorKpiGoal[]) {
  const explicit = number(
    ambassador.performance_score ??
      ambassador.quality_score ??
      ambassador.score,
  )

  if (explicit > 0) {
    return Math.max(0, Math.min(100, explicit))
  }

  const ambassadorGoals = goals.filter(
    (goal: Row) => goal.ambassador_id === ambassador.id,
  )

  if (!ambassadorGoals.length) return 0

  return Math.round(
    ambassadorGoals.reduce(
      (sum, goal: Row) => sum + number(goal.completion_rate),
      0,
    ) / ambassadorGoals.length,
  )
}

function statusOf(score: number) {
  if (score >= 85) {
    return {
      label: "Performance de référence",
      short: "Référence",
      tone: "emerald",
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    }
  }

  if (score >= 65) {
    return {
      label: "Trajectoire maîtrisée",
      short: "Maîtrisée",
      tone: "blue",
      className: "border-blue-200 bg-blue-50 text-blue-800",
    }
  }

  if (score >= 40) {
    return {
      label: "Intervention recommandée",
      short: "Attention",
      tone: "amber",
      className: "border-amber-200 bg-amber-50 text-amber-800",
    }
  }

  return {
    label: "Intervention prioritaire",
    short: "Prioritaire",
    tone: "rose",
    className: "border-rose-200 bg-rose-50 text-rose-800",
  }
}

function iconTone(tone: string) {
  if (tone === "emerald") return "bg-emerald-50 text-emerald-700"
  if (tone === "amber") return "bg-amber-50 text-amber-700"
  if (tone === "rose") return "bg-rose-50 text-rose-700"
  return "bg-blue-50 text-blue-700"
}

function DistributionBand({
  icon: Icon,
  label,
  count,
  total,
  tone,
}: {
  icon: IconType
  label: string
  count: number
  total: number
  tone: string
}) {
  const width = total > 0 ? Math.round((count / total) * 100) : 0
  const bar =
    tone === "emerald"
      ? "bg-emerald-500"
      : tone === "amber"
        ? "bg-amber-500"
        : tone === "rose"
          ? "bg-rose-500"
          : "bg-blue-600"

  return (
    <article className="border-r border-slate-200 px-5 py-4 last:border-r-0">
      <div className="flex items-center justify-between gap-3">
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${iconTone(tone)}`}>
          <Icon size={17} />
        </span>
        <span className="text-2xl font-black tabular-nums text-[#0a2342]">
          {count}
        </span>
      </div>
      <p className="mt-3 text-xs font-black text-slate-800">{label}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${width}%` }} />
      </div>
      <p className="mt-2 text-[10px] font-bold text-slate-500">{width}% du réseau mesuré</p>
    </article>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid min-h-[260px] place-items-center border border-dashed border-slate-300 bg-slate-50/60 px-8 py-12 text-center">
      <div>
        <BarChart3 className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-4 text-sm font-black text-slate-800">{title}</p>
        <p className="mx-auto mt-2 max-w-md text-xs font-semibold leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  )
}

export default function AmbassadorPerformanceRoute({
  snapshot,
  kpis,
  goals,
  loading,
  refreshing,
  error,
  success,
  onRefresh,
  onExport,
  onCreateGoal,
  onEditGoal,
  onRecalculateGoal,
  onArchiveGoal,
  onOpenAmbassador,
}: Props) {
  const activeAmbassadors = useMemo(
    () =>
      snapshot.ambassadors.filter(
        (ambassador: Row) => ambassador.status !== "archived",
      ),
    [snapshot.ambassadors],
  )

  const rankings = useMemo(
    () =>
      activeAmbassadors
        .map((ambassador) => ({
          ambassador,
          score: scoreOf(ambassador as Row, goals),
        }))
        .sort((a, b) => b.score - a.score),
    [activeAmbassadors, goals],
  )

  const distribution = useMemo(
    () => ({
      reference: rankings.filter((item) => item.score >= 85).length,
      mastered: rankings.filter((item) => item.score >= 65 && item.score < 85).length,
      attention: rankings.filter((item) => item.score >= 40 && item.score < 65).length,
      priority: rankings.filter((item) => item.score < 40).length,
    }),
    [rankings],
  )

  const networkScore = rankings.length
    ? Math.round(rankings.reduce((sum, item) => sum + item.score, 0) / rankings.length)
    : number(kpis.kpiCompletion)

  const measurable = rankings.filter((item) => item.score > 0).length
  const completedGoals = goals.filter((goal: Row) => number(goal.completion_rate) >= 100).length
  const atRiskGoals = goals.filter(
    (goal: Row) => number(goal.completion_rate) < 50 && goal.status !== "completed",
  ).length

  const interventionCases = rankings.filter((item) => item.score < 65).slice(0, 6)
  const topRankings = rankings.slice(0, 12)

  return (
    <div
      data-ambassador-performance-route="network-intelligence-room"
      className="min-h-screen bg-[#f2f5f8] text-slate-950"
    >
      <section className="border-b border-[#cfd9e5] bg-white">
        <div className="grid min-h-[245px] xl:grid-cols-[1.35fr_0.65fr]">
          <div className="relative overflow-hidden px-6 py-7 lg:px-9 lg:py-9">
            <div className="absolute inset-y-0 left-0 w-1.5 bg-[#bb2432]" />
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.19em] text-[#2d5b88]">
                <span>AngelCare Market OS</span>
                <span className="h-1 w-1 rounded-full bg-[#bb2432]" />
                <span>Intelligence réseau</span>
              </div>

              <h1 className="mt-5 max-w-3xl text-[32px] font-black tracking-[-0.035em] text-[#071c34] lg:text-[42px]">
                Performance du réseau ambassadeurs
              </h1>

              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                Lecture analytique des scores existants, des objectifs, de la contribution terrain et des dossiers nécessitant une intervention managériale.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onCreateGoal}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0b3159] px-4 text-sm font-black !text-white shadow-[0_10px_26px_rgba(11,49,89,0.2)] hover:bg-[#092746]"
                >
                  <Plus size={16} /> Créer un objectif
                </button>
                <button
                  type="button"
                  onClick={onExport}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-[#173a61] hover:bg-slate-50"
                >
                  <Download size={16} /> Exporter
                </button>
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={refreshing}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Actualiser
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-[#cfd9e5] bg-[#0a2545] px-7 py-7 !text-white xl:border-l xl:border-t-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] !text-[#bfdbfe]">
              Indice réseau actuel
            </p>
            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-6xl font-black tabular-nums tracking-[-0.06em]">
                  {Math.round(networkScore)}
                </p>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.15em] !text-[#bfdbfe]">sur 100</p>
              </div>
              <div className="grid h-16 w-16 place-items-center rounded-full border border-white/20 bg-white/10">
                <TrendingUp size={28} />
              </div>
            </div>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-[#72b6ff]" style={{ width: `${Math.max(0, Math.min(100, networkScore))}%` }} />
            </div>
            <p className="mt-4 text-xs font-semibold leading-5 !text-[#dbeafe]">
              {measurable} ambassadeur(s) disposent d’un signal de performance exploitable dans le snapshot courant.
            </p>
          </div>
        </div>

        {(error || success) ? (
          <div className="grid gap-2 border-t border-slate-200 px-6 py-3 lg:px-9 md:grid-cols-2">
            {error ? (
              <div className="border-l-4 border-rose-500 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                {success}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <main className="space-y-5 p-4 lg:p-6">
        <section className="overflow-hidden border border-slate-200 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
          <div className="grid sm:grid-cols-2 xl:grid-cols-4">
            <DistributionBand icon={BadgeCheck} label="Performance de référence" count={distribution.reference} total={rankings.length} tone="emerald" />
            <DistributionBand icon={CheckCircle2} label="Trajectoire maîtrisée" count={distribution.mastered} total={rankings.length} tone="blue" />
            <DistributionBand icon={AlertTriangle} label="Intervention recommandée" count={distribution.attention} total={rankings.length} tone="amber" />
            <DistributionBand icon={ShieldAlert} label="Intervention prioritaire" count={distribution.priority} total={rankings.length} tone="rose" />
          </div>
        </section>

        <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.55fr)]">
          <article className="min-w-0 border border-slate-200 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 px-5 py-5 lg:px-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#2e6194]">
                  Scorecard exécutif
                </p>
                <h2 className="mt-1 text-xl font-black tracking-tight text-[#0a2342]">
                  Classement et contribution du réseau
                </h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Classement basé exclusivement sur les scores et objectifs présents dans les données courantes.
                </p>
              </div>
              <div className="flex gap-6 text-right">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Objectifs atteints</p>
                  <p className="mt-1 text-xl font-black tabular-nums text-[#0a2342]">{completedGoals}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Sous 50%</p>
                  <p className="mt-1 text-xl font-black tabular-nums text-amber-700">{atRiskGoals}</p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="space-y-2 p-5">
                {Array.from({ length: 7 }).map((_, index) => (
                  <div key={index} className="h-[68px] animate-pulse bg-slate-100" />
                ))}
              </div>
            ) : topRankings.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                  <thead className="sticky top-0 bg-[#f5f8fb] text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Rang</th>
                      <th className="px-4 py-3">Ambassadeur</th>
                      <th className="px-4 py-3">Territoire</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">État managérial</th>
                      <th className="px-5 py-3 text-right">Dossier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRankings.map(({ ambassador, score }, index) => {
                      const status = statusOf(score)
                      return (
                        <tr key={ambassador.id} className="border-t border-slate-100 transition hover:bg-[#f7faff]">
                          <td className="px-5 py-4">
                            <span className="text-lg font-black tabular-nums text-[#0b3159]">{String(index + 1).padStart(2, "0")}</span>
                          </td>
                          <td className="px-4 py-4">
                            <button type="button" onClick={() => onOpenAmbassador(ambassador)} className="group text-left">
                              <span className="block text-sm font-black text-[#0a2342] group-hover:text-blue-700">
                                {ambassador.full_name || "Ambassadeur sans nom"}
                              </span>
                              <span className="mt-1 block text-[10px] font-bold text-slate-500">
                                {text((ambassador as Row).reference || (ambassador as Row).code || ambassador.email || ambassador.phone) || "Référence non renseignée"}
                              </span>
                            </button>
                          </td>
                          <td className="px-4 py-4 text-xs font-bold text-slate-600">
                            {ambassador.territory_name || ambassador.city || "Non affecté"}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <span className="w-10 text-sm font-black tabular-nums text-[#0a2342]">{Math.round(score)}</span>
                              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-[#2d70b8]" style={{ width: `${score}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] ${status.className}`}>
                              {status.short}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => onOpenAmbassador(ambassador)}
                              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-black text-[#173a61] hover:border-blue-300 hover:bg-blue-50"
                            >
                              Diagnostic <ArrowRight size={13} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="Aucun score de performance disponible"
                description="Les dossiers apparaîtront ici dès qu’un score ou un objectif mesurable sera disponible dans les données du réseau."
              />
            )}
          </article>

          <aside className="space-y-5">
            <article className="border border-[#d5e1ee] bg-[#0b3159] p-5 !text-white shadow-[0_12px_34px_rgba(11,49,89,0.16)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.17em] !text-[#bfdbfe]">Management attention</p>
                  <h2 className="mt-1 text-lg font-black">Dossiers à reprendre</h2>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10">
                  <Activity size={18} />
                </span>
              </div>

              <div className="mt-5 divide-y divide-white/10">
                {interventionCases.length ? interventionCases.map(({ ambassador, score }) => (
                  <button
                    key={ambassador.id}
                    type="button"
                    onClick={() => onOpenAmbassador(ambassador)}
                    className="flex w-full items-center justify-between gap-4 py-3 text-left first:pt-0 last:pb-0"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-black">{ambassador.full_name || "Ambassadeur sans nom"}</span>
                      <span className="mt-1 block truncate text-[10px] font-semibold !text-[#bfdbfe]">
                        {statusOf(score).label}
                      </span>
                    </span>
                    <span className="shrink-0 text-lg font-black tabular-nums">{Math.round(score)}</span>
                  </button>
                )) : (
                  <div className="py-8 text-center text-xs font-semibold !text-[#dbeafe]">
                    Aucun dossier sous le seuil d’intervention actuel.
                  </div>
                )}
              </div>
            </article>

            <article className="border border-slate-200 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#2e6194]">Contrat de performance</p>
                  <h2 className="mt-1 text-lg font-black text-[#0a2342]">Portefeuille d’objectifs</h2>
                </div>
                <Target size={19} className="text-[#2d70b8]" />
              </div>

              <div className="mt-4 space-y-3">
                {goals.slice(0, 6).map((goal) => {
                  const completion = Math.max(0, Math.min(100, number((goal as Row).completion_rate)))
                  const ambassador = activeAmbassadors.find((item) => item.id === (goal as Row).ambassador_id)
                  return (
                    <div key={goal.id} className="border-l-2 border-[#2d70b8] bg-[#f7f9fc] px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-black text-[#0a2342]">{text(goal.goal_type).replaceAll("_", " ") || "Objectif"}</p>
                          <p className="mt-1 text-[10px] font-semibold text-slate-500">
                            {ambassador?.full_name || "Ambassadeur non affecté"} · {goal.period || "Période non renseignée"}
                          </p>
                        </div>
                        <span className="text-xs font-black tabular-nums text-[#0b3159]">{percentage(completion)}</span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-[#2d70b8]" style={{ width: `${completion}%` }} />
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button type="button" onClick={() => onEditGoal(goal)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[9px] font-black text-slate-700 hover:bg-slate-50">
                          <Pencil size={12} /> Modifier
                        </button>
                        <button type="button" onClick={() => onRecalculateGoal(goal)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 text-[9px] font-black text-blue-700 hover:bg-blue-100">
                          <RefreshCw size={12} /> Recalculer
                        </button>
                        <button type="button" onClick={() => onArchiveGoal(goal)} className="ml-auto grid h-8 w-8 place-items-center rounded-lg border border-rose-200 bg-white text-rose-700 hover:bg-rose-50" aria-label="Archiver l’objectif">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )
                })}

                {!goals.length ? (
                  <div className="border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-xs font-semibold text-slate-500">
                    Aucun objectif enregistré dans la période courante.
                  </div>
                ) : null}
              </div>
            </article>
          </aside>
        </section>
      </main>

      {loading ? (
        <div className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-3 text-xs font-black text-blue-800 shadow-xl">
          <Loader2 size={15} className="animate-spin" /> Actualisation de l’intelligence réseau…
        </div>
      ) : null}
    </div>
  )
}
