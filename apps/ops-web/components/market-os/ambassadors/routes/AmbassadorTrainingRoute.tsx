"use client"

import { useEffect, useMemo, useState, type ComponentType } from "react"
import {
  AlertTriangle,
  Archive,
  Award,
  BadgeCheck,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRoundCheck,
  Users,
} from "lucide-react"
import type {
  Ambassador,
  AmbassadorTrainingCertification,
  AmbassadorWorkspaceSnapshot,
} from "@/lib/market-os/ambassadors/types"

type Row = Record<string, any>
type IconType = ComponentType<{ size?: number; className?: string }>

type Props = {
  snapshot: AmbassadorWorkspaceSnapshot
  training: AmbassadorTrainingCertification[]
  loading: boolean
  refreshing: boolean
  error?: string | null
  success?: string | null
  query: string
  statusFilter: string
  onQueryChange: (value: string) => void
  onStatusFilterChange: (value: string) => void
  onRefresh: () => void
  onAssignTraining: () => void
  onEditTraining: (record: AmbassadorTrainingCertification) => void
  onArchiveTraining: (record: AmbassadorTrainingCertification) => void
  onExport: () => void
  onOpenAmbassador: (ambassador: Ambassador) => void
}

function text(value: unknown, fallback = "") {
  const normalized = String(value ?? "").trim()
  return normalized || fallback
}

function number(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function dateValue(value: unknown) {
  if (!value) return null
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatDate(value: unknown) {
  const parsed = dateValue(value)
  if (!parsed) return "Non renseignée"
  return parsed.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
}

function daysUntil(value: unknown) {
  const parsed = dateValue(value)
  if (!parsed) return null
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return Math.ceil((parsed.getTime() - start) / 86_400_000)
}

function lower(value: unknown) {
  return text(value).toLowerCase()
}

function nameOf(record: Row, ambassadors: Ambassador[]) {
  return text(
    record.ambassador_name ||
      record.candidate_name ||
      ambassadors.find((ambassador: Row) => text(ambassador.id) === text(record.ambassador_id))?.full_name,
    "Profil à identifier",
  )
}

function recordTitle(record: Row) {
  return text(record.training_name || record.course_name || record.program_name, "Formation à compléter")
}

function certificationTitle(record: Row) {
  return text(record.certification_name || record.certificate_name, "Aucune certification renseignée")
}

function stateOf(record: Row) {
  const certification = lower(record.certification_status)
  const training = lower(record.status)
  const remaining = daysUntil(record.valid_until)

  if (remaining !== null && remaining < 0) {
    return {
      key: "expired",
      label: "Expirée",
      className: "border-rose-200 bg-rose-50 text-rose-800",
      bar: "bg-rose-500",
      icon: AlertTriangle,
    }
  }
  if (certification.includes("certif") || certification.includes("valid") || certification.includes("issued")) {
    return {
      key: "certified",
      label: "Certifiée",
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
      bar: "bg-emerald-500",
      icon: BadgeCheck,
    }
  }
  if (training.includes("fail") || certification.includes("fail") || certification.includes("reject")) {
    return {
      key: "failed",
      label: "À reprendre",
      className: "border-rose-200 bg-rose-50 text-rose-800",
      bar: "bg-rose-500",
      icon: AlertTriangle,
    }
  }
  if (training.includes("complete") || training.includes("pass")) {
    return {
      key: "completed",
      label: "Terminée",
      className: "border-blue-200 bg-blue-50 text-blue-800",
      bar: "bg-blue-600",
      icon: CheckCircle2,
    }
  }
  if (training.includes("progress") || training.includes("started")) {
    return {
      key: "in_progress",
      label: "En cours",
      className: "border-cyan-200 bg-cyan-50 text-cyan-800",
      bar: "bg-cyan-600",
      icon: Clock3,
    }
  }
  return {
    key: "assigned",
    label: "Assignée",
    className: "border-slate-200 bg-slate-50 text-slate-700",
    bar: "bg-slate-500",
    icon: BookOpenCheck,
  }
}

function scoreOf(record: Row) {
  return Math.max(0, Math.min(100, number(record.score ?? record.assessment_score ?? record.progress_percent)))
}

function StatusBadge({ record }: { record: Row }) {
  const state = stateOf(record)
  const Icon = state.icon
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${state.className}`}>
      <Icon size={12} />
      {state.label}
    </span>
  )
}

function Metric({ label, value, helper, icon: Icon, tone }: { label: string; value: string | number; helper: string; icon: IconType; tone: "blue" | "green" | "amber" | "rose" }) {
  const classes = {
    blue: "bg-[#edf4fb] text-[#0b3158]",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
  }
  return (
    <div className="border-r border-slate-200 px-5 py-4 last:border-r-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black tabular-nums text-[#0a2342]">{value}</p>
          <p className="mt-1 text-[11px] font-bold text-slate-500">{helper}</p>
        </div>
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${classes[tone]}`}><Icon size={18} /></span>
      </div>
    </div>
  )
}

function EmptyTraining({ onAssign }: { onAssign: () => void }) {
  return (
    <div className="grid min-h-[420px] place-items-center border border-dashed border-slate-300 bg-slate-50 px-8 py-12 text-center">
      <div>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#edf4fb] text-[#0b3158]"><GraduationCap size={25} /></span>
        <h3 className="mt-5 text-lg font-black text-slate-950">Aucun parcours de qualification visible</h3>
        <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-600">
          Assignez une formation réelle pour créer le premier dossier de qualification et de certification.
        </p>
        <button type="button" onClick={onAssign} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#0b3158] px-4 text-sm font-black !text-white hover:bg-[#123f6d]">
          <Plus size={16} />
          Assigner une formation
        </button>
      </div>
    </div>
  )
}

export default function AmbassadorTrainingRoute({
  snapshot,
  training,
  loading,
  refreshing,
  error,
  success,
  query,
  statusFilter,
  onQueryChange,
  onStatusFilterChange,
  onRefresh,
  onAssignTraining,
  onEditTraining,
  onArchiveTraining,
  onExport,
  onOpenAmbassador,
}: Props) {
  const activeAmbassadors = useMemo(
    () => snapshot.ambassadors.filter((ambassador: Row) => ambassador.status !== "archived"),
    [snapshot.ambassadors],
  )
  const [selectedId, setSelectedId] = useState("")
  const [view, setView] = useState<"qualification" | "certification">("qualification")

  useEffect(() => {
    if (selectedId && training.some((record: Row) => text(record.id) === selectedId)) return
    setSelectedId(text(training[0]?.id))
  }, [selectedId, training])

  const selected = training.find((record: Row) => text(record.id) === selectedId) || training[0] || null
  const states = useMemo(() => training.map((record: Row) => ({ record, state: stateOf(record) })), [training])
  const certified = states.filter((item) => item.state.key === "certified").length
  const inProgress = states.filter((item) => item.state.key === "in_progress" || item.state.key === "assigned").length
  const expired = states.filter((item) => item.state.key === "expired").length
  const failed = states.filter((item) => item.state.key === "failed").length
  const scored = training.filter((record: Row) => scoreOf(record) > 0)
  const averageScore = scored.length ? Math.round(scored.reduce((sum, record: Row) => sum + scoreOf(record), 0) / scored.length) : 0
  const selectedAmbassador = selected ? activeAmbassadors.find((ambassador: Row) => text(ambassador.id) === text((selected as Row).ambassador_id)) : null
  const remainingDays = selected ? daysUntil((selected as Row).valid_until) : null

  return (
    <div data-ambassador-training-route="qualification-compliance-console" className="min-h-screen bg-[#f3f6f9] text-slate-950">
      <section className="grid min-h-[246px] border-b border-[#cad6e2] bg-white xl:grid-cols-[1.25fr_0.75fr]">
        <div className="relative overflow-hidden px-6 py-8 lg:px-9 lg:py-9">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-[#bb2432]" />
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.19em] text-[#2d5b88]">
              <span>AngelCare Academy</span>
              <span className="h-1 w-1 rounded-full bg-[#bb2432]" />
              <span>Qualification & compliance console</span>
            </div>
            <h1 className="mt-3 text-[34px] font-black tracking-[-0.035em] text-slate-950 lg:text-[40px]">Formation & certification opérationnelle</h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
              Contrôlez les formations assignées, résultats, certifications, échéances et conditions de qualification du réseau ambassadeurs.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" onClick={onAssignTraining} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0b3158] px-4 text-sm font-black !text-white shadow-lg shadow-blue-950/15 hover:bg-[#123f6d]">
                <Plus size={16} />
                Assigner une formation
              </button>
              <button type="button" onClick={onExport} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50">
                <Download size={16} />
                Exporter le registre
              </button>
              <button type="button" onClick={onRefresh} disabled={refreshing} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50 disabled:opacity-50">
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                Actualiser
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#0a2b4e] p-6 lg:p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.17em] !text-[#a9bfd8]">Posture de qualification</p>
              <p className="mt-2 text-lg font-black !text-white">Éligibilité documentée</p>
            </div>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 !text-white"><ShieldCheck size={22} /></span>
          </div>
          <div className="mt-6 flex items-end gap-3">
            <p className="text-6xl font-black tabular-nums !text-white">{averageScore}</p>
            <p className="pb-2 text-sm font-black !text-[#b9cce1]">/ 100<br /><span className="text-[10px] uppercase tracking-[0.12em]">score moyen mesuré</span></p>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${averageScore}%` }} /></div>
          <div className="mt-5 grid grid-cols-3 border-t border-white/15 pt-4 text-center">
            <div><p className="text-2xl font-black !text-white">{certified}</p><p className="mt-1 text-[10px] font-black uppercase !text-[#a9bfd8]">certifiés</p></div>
            <div className="border-l border-white/15"><p className="text-2xl font-black !text-white">{inProgress}</p><p className="mt-1 text-[10px] font-black uppercase !text-[#a9bfd8]">en parcours</p></div>
            <div className="border-l border-white/15"><p className="text-2xl font-black !text-white">{expired + failed}</p><p className="mt-1 text-[10px] font-black uppercase !text-[#a9bfd8]">à reprendre</p></div>
          </div>
        </div>
      </section>

      <div className="space-y-4 p-4 lg:p-6">
        {error ? <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">{error}</div> : null}
        {success ? <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{success}</div> : null}
        {snapshot.diagnostics?.length ? <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">Synchronisation partielle : {snapshot.diagnostics[0]?.reason}</div> : null}

        <section className="grid border border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Certifications actives" value={certified} helper="selon les statuts persistés" icon={BadgeCheck} tone="green" />
          <Metric label="Parcours ouverts" value={inProgress} helper="assignés ou en cours" icon={BookOpenCheck} tone="blue" />
          <Metric label="Certifications expirées" value={expired} helper="échéance dépassée" icon={CalendarClock} tone="rose" />
          <Metric label="Résultats à reprendre" value={failed} helper="échec ou refus enregistré" icon={AlertTriangle} tone="amber" />
        </section>

        <section className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_420px]">
          <main className="min-w-0 border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-4 lg:px-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#2d5b88]">Registre de qualification</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">Parcours, résultats & validités</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{training.length} dossier(s) visible(s) · source opérationnelle réelle</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <button type="button" onClick={() => setView("qualification")} className={`rounded-lg px-3 py-2 text-xs font-black ${view === "qualification" ? "bg-[#0b3158] !text-white" : "text-slate-600"}`}>Qualification</button>
                    <button type="button" onClick={() => setView("certification")} className={`rounded-lg px-3 py-2 text-xs font-black ${view === "certification" ? "bg-[#0b3158] !text-white" : "text-slate-600"}`}>Certification</button>
                  </div>
                  <label className="flex h-10 min-w-[245px] items-center gap-2 border border-slate-200 bg-white px-3">
                    <Search size={15} className="text-slate-400" />
                    <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Ambassadeur, formation, certificat…" className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400" />
                  </label>
                  <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)} className="h-10 border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-blue-400">
                    <option value="all">Tous statuts</option>
                    <option value="assigned">Assignées</option>
                    <option value="in_progress">En cours</option>
                    <option value="completed">Terminées</option>
                    <option value="certified">Certifiées</option>
                    <option value="failed">À reprendre</option>
                    <option value="expired">Expirées</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3 p-5">{[1, 2, 3, 4, 5].map((item) => <div key={item} className="h-20 animate-pulse bg-slate-100" />)}</div>
            ) : training.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] text-left text-sm">
                  <thead className="bg-[#f6f8fb] text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Profil</th>
                      <th className="px-4 py-3">{view === "qualification" ? "Parcours" : "Certification"}</th>
                      <th className="px-4 py-3">État</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Validité</th>
                      <th className="px-4 py-3">Émetteur</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {training.map((record: Row) => {
                      const active = text(record.id) === text(selected?.id)
                      const score = scoreOf(record)
                      const state = stateOf(record)
                      const remaining = daysUntil(record.valid_until)
                      return (
                        <tr key={text(record.id) || `${recordTitle(record)}-${record.ambassador_id}`} className={`transition ${active ? "bg-[#edf4fb]" : "bg-white hover:bg-slate-50"}`}>
                          <td className="px-5 py-4">
                            <button type="button" onClick={() => setSelectedId(text(record.id))} className="flex items-center gap-3 text-left">
                              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f0f8] text-xs font-black text-[#0b3158]">{nameOf(record, activeAmbassadors).split(/\s+/).slice(0, 2).map((item) => item[0]).join("").toUpperCase()}</span>
                              <span><b className="block text-slate-950">{nameOf(record, activeAmbassadors)}</b><span className="mt-0.5 block text-[11px] font-bold text-slate-500">{text(record.city || selectedAmbassador?.city, "Ville non renseignée")}</span></span>
                            </button>
                          </td>
                          <td className="px-4 py-4"><p className="font-black text-slate-900">{view === "qualification" ? recordTitle(record) : certificationTitle(record)}</p><p className="mt-1 text-[11px] font-bold text-slate-500">{view === "qualification" ? certificationTitle(record) : recordTitle(record)}</p></td>
                          <td className="px-4 py-4"><StatusBadge record={record} /></td>
                          <td className="px-4 py-4"><div className="flex items-center gap-2"><span className="w-10 text-sm font-black tabular-nums text-slate-900">{score}%</span><div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${state.bar}`} style={{ width: `${score}%` }} /></div></div></td>
                          <td className="px-4 py-4"><p className="font-black text-slate-800">{formatDate(record.valid_until)}</p><p className={`mt-1 text-[11px] font-bold ${remaining !== null && remaining < 0 ? "text-rose-700" : "text-slate-500"}`}>{remaining === null ? "Aucune échéance" : remaining < 0 ? `Expirée depuis ${Math.abs(remaining)} j` : `${remaining} j restant(s)`}</p></td>
                          <td className="px-4 py-4 font-bold text-slate-700">{text(record.issued_by, "Non renseigné")}</td>
                          <td className="px-4 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => onEditTraining(record)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50"><Pencil size={14} /> Modifier</button><button type="button" onClick={() => onArchiveTraining(record)} className="inline-flex h-9 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 px-2.5 text-rose-700 hover:bg-rose-100" aria-label="Archiver la formation"><Archive size={14} /></button></div></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyTraining onAssign={onAssignTraining} />
            )}
          </main>

          <aside className="space-y-4">
            {selected ? (
              <>
                <section className="border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 bg-[#0b3158] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] !text-[#a9bfd8]">Dossier de qualification</p>
                        <h2 className="mt-2 text-xl font-black !text-white">{nameOf(selected as Row, activeAmbassadors)}</h2>
                        <p className="mt-1 text-xs font-semibold !text-[#c9d7e7]">{recordTitle(selected as Row)}</p>
                      </div>
                      <StatusBadge record={selected as Row} />
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="border border-slate-200 bg-slate-50 p-4"><p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">Score</p><p className="mt-2 text-3xl font-black tabular-nums text-slate-950">{scoreOf(selected as Row)}%</p></div>
                      <div className="border border-slate-200 bg-slate-50 p-4"><p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">Validité</p><p className="mt-2 text-sm font-black text-slate-950">{formatDate((selected as Row).valid_until)}</p><p className="mt-1 text-[10px] font-bold text-slate-500">{remainingDays === null ? "Non définie" : remainingDays < 0 ? "Échéance dépassée" : `${remainingDays} jour(s)`}</p></div>
                    </div>
                    <dl className="mt-5 space-y-3 text-xs">
                      {[
                        ["Formation", recordTitle(selected as Row)],
                        ["Certification", certificationTitle(selected as Row)],
                        ["Statut formation", text((selected as Row).status, "assigned")],
                        ["Statut certification", text((selected as Row).certification_status, "pending")],
                        ["Émetteur", text((selected as Row).issued_by, "Non renseigné")],
                        ["Référence", text((selected as Row).id, "—")],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-start justify-between gap-5 border-b border-slate-100 pb-3 last:border-b-0"><dt className="font-bold text-slate-500">{label}</dt><dd className="max-w-[230px] text-right font-black text-slate-800">{value}</dd></div>
                      ))}
                    </dl>
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => onEditTraining(selected)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0b3158] px-3 text-xs font-black !text-white hover:bg-[#123f6d]"><Pencil size={14} /> Modifier</button>
                      {selectedAmbassador ? <button type="button" onClick={() => onOpenAmbassador(selectedAmbassador)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-800 hover:bg-slate-50"><UserRoundCheck size={14} /> Ouvrir profil</button> : <button type="button" disabled className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 text-xs font-black text-slate-400"><Users size={14} /> Profil absent</button>}
                    </div>
                  </div>
                </section>

                <section className="border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Award size={18} /></span><div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Preuve de qualification</p><p className="mt-1 text-sm font-black text-slate-950">État enregistré</p></div></div>
                  <p className="mt-4 text-xs font-semibold leading-6 text-slate-600">La console expose uniquement le statut, le score, la validité et l’émetteur réellement persistés. Aucune éligibilité supplémentaire n’est inventée par l’interface.</p>
                </section>
              </>
            ) : (
              <div className="grid min-h-[320px] place-items-center border border-dashed border-slate-300 bg-white p-8 text-center"><div><GraduationCap className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-4 text-sm font-black text-slate-800">Sélectionnez un dossier</p></div></div>
            )}
          </aside>
        </section>
      </div>
    </div>
  )
}
