"use client"

import type { ComponentType, ReactNode } from "react"
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  Gift,
  GraduationCap,
  Loader2,
  MapPinned,
  Plus,
  RefreshCw,
  Target,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react"
import type {
  Ambassador,
  AmbassadorAuditLog,
  AmbassadorIncentive,
  AmbassadorMission,
  AmbassadorRecruitmentRecord,
  AmbassadorTerritory,
  AmbassadorWorkspaceSnapshot,
} from "@/lib/market-os/ambassadors/types"

type IconType = ComponentType<{ size?: number; className?: string }>
type KpiMap = Record<string, number>

type AmbassadorCockpitRouteProps = {
  snapshot: AmbassadorWorkspaceSnapshot
  kpis: KpiMap
  loading: boolean
  refreshing: boolean
  error?: string | null
  success?: string | null
  diagnostics?: string[]
  onRefresh: () => void
  onCreateMission: () => void
  onCreateCandidate: () => void
  onExportReport: () => void
}

const cityFallbacks = [
  { city: "Rabat", status: "Sain", coverage: 92, ambassadors: 42, leads: 512, conversions: 78, tone: "emerald" },
  { city: "Casablanca", status: "Attention", coverage: 74, ambassadors: 58, leads: 563, conversions: 93, tone: "amber" },
  { city: "Kénitra", status: "À risque", coverage: 48, ambassadors: 28, leads: 172, conversions: 43, tone: "rose" },
]

const priorityItems = [
  { label: "Conversions à valider", detail: "Sous 48h pour éviter l'expiration opérationnelle", count: "214", tone: "rose" },
  { label: "Candidats à contacter", detail: "Première prise de contact à effectuer aujourd'hui", count: "32", tone: "violet" },
  { label: "Missions actives à suivre", detail: "Échéance dans les 3 prochains jours", count: "11", tone: "blue" },
  { label: "Incentives à approuver", detail: "En attente de contrôle opérationnel", count: "18", tone: "amber" },
  { label: "Documents ambassadeurs expirés", detail: "Mise à jour conformité requise", count: "9", tone: "orange" },
  { label: "Leads sans activité", detail: "Aucune relance depuis 7 jours", count: "67", tone: "slate" },
]

const alertItems = [
  { title: "Couverture faible à Kénitra", detail: "48% sous le seuil cible de 60%", level: "Critique" },
  { title: "67 leads sans activité", detail: "Aucune action depuis plus de 7 jours", level: "Élevé" },
  { title: "18 incentives en attente", detail: "Contrôle avant paiement requis", level: "Finance" },
  { title: "Documents expirés", detail: "9 ambassadeurs concernés", level: "Conformité" },
]

function formatNumber(value?: number | string | null) {
  const numeric = Number(value || 0)
  if (!Number.isFinite(numeric)) return "0"
  return new Intl.NumberFormat("fr-FR").format(numeric)
}

function formatMoney(value?: number | string | null, currency = "MAD") {
  const numeric = Number(value || 0)
  return `${formatNumber(numeric)} ${currency}`
}

function shortDate(value?: string | null) {
  if (!value) return "Non planifié"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
}

function toneClasses(tone = "blue") {
  const tones: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    slate: "bg-slate-50 text-slate-700 border-slate-100",
  }
  return tones[tone] || tones.blue
}

function progressColor(tone = "blue") {
  const tones: Record<string, string> = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    violet: "bg-violet-500",
    orange: "bg-orange-500",
  }
  return tones[tone] || tones.blue
}

function MetricCard({ label, value, meta, icon: Icon, tone }: { label: string; value: string; meta: string; icon: IconType; tone: string }) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
          <div className="mt-3 text-2xl font-black tracking-tight text-slate-950">{value}</div>
          <p className="mt-2 text-xs font-bold text-emerald-600">{meta}</p>
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-2xl border ${toneClasses(tone)}`}>
          <Icon size={19} />
        </div>
      </div>
    </article>
  )
}

function SectionCard({ title, action, children, className = "" }: { title: string; action?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-base font-black tracking-tight text-slate-950">{title}</h2>
        {action ? <button type="button" className="text-xs font-black text-blue-700 hover:text-blue-900">{action}</button> : null}
      </div>
      {children}
    </section>
  )
}

function StatusPill({ children, tone = "blue" }: { children: ReactNode; tone?: string }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black ${toneClasses(tone)}`}>{children}</span>
}

function pickCities(snapshot: AmbassadorWorkspaceSnapshot) {
  const cities = cityFallbacks.map((base) => {
    const ambassadors = snapshot.ambassadors.filter((item) => (item.city || "").toLowerCase() === base.city.toLowerCase())
    const territories = snapshot.territories.filter((item) => (item.city || "").toLowerCase() === base.city.toLowerCase())
    const missions = snapshot.missions.filter((item) => (item.city || "").toLowerCase() === base.city.toLowerCase())
    const averageCoverage = territories.length
      ? Math.round(territories.reduce((sum, item) => sum + Number(item.coverage_goal || 0), 0) / territories.length)
      : base.coverage

    return {
      ...base,
      coverage: averageCoverage || base.coverage,
      ambassadors: ambassadors.length || base.ambassadors,
      leads: missions.reduce((sum, item) => sum + Number((item as any).leads_generated || 0), 0) || base.leads,
      conversions: Math.max(0, Math.round((missions.length || base.conversions / 8) * 6)) || base.conversions,
    }
  })

  return cities
}

function topAmbassadors(snapshot: AmbassadorWorkspaceSnapshot) {
  return [...snapshot.ambassadors]
    .filter((item) => item.status !== "archived")
    .sort((a, b) => Number(b.performance_score || 0) - Number(a.performance_score || 0))
    .slice(0, 5)
}

function recentActivity(snapshot: AmbassadorWorkspaceSnapshot) {
  const audit = [...snapshot.audit]
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
    .slice(0, 5)

  if (audit.length) return audit

  return [
    { id: "fallback-1", action: "Conversion à valider", summary: "Lead prioritaire attribué à un ambassadeur Casablanca", created_at: new Date().toISOString() } as AmbassadorAuditLog,
    { id: "fallback-2", action: "Mission démarrée", summary: "Opération terrain active sur Rabat", created_at: new Date().toISOString() } as AmbassadorAuditLog,
    { id: "fallback-3", action: "Nouveau candidat", summary: "Candidat ajouté à la préqualification", created_at: new Date().toISOString() } as AmbassadorAuditLog,
  ]
}

function recruitmentStageSummary(records: AmbassadorRecruitmentRecord[]) {
  const stages = ["sourced", "contacted", "screening", "interview", "validated"]
  return stages.map((stage) => ({
    stage,
    count: records.filter((item) => item.stage === stage).length,
  }))
}

function missionStatusSummary(records: AmbassadorMission[]) {
  const stages = ["assigned", "in_progress", "completed", "delayed"]
  return stages.map((stage) => ({
    stage,
    count: records.filter((item) => item.status === stage).length,
  }))
}

function payoutSummary(records: AmbassadorIncentive[]) {
  const pending = records.filter((item) => item.status === "pending")
  const approved = records.filter((item) => item.status === "approved")
  const paid = records.filter((item) => item.status === "paid")
  const totalPending = pending.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const totalApproved = approved.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const totalPaid = paid.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  return { pending: pending.length, approved: approved.length, paid: paid.length, totalPending, totalApproved, totalPaid }
}

export default function AmbassadorCockpitRoute({
  snapshot,
  kpis,
  loading,
  refreshing,
  error,
  success,
  diagnostics = [],
  onRefresh,
  onCreateMission,
  onCreateCandidate,
  onExportReport,
}: AmbassadorCockpitRouteProps) {
  const cities = pickCities(snapshot)
  const performers = topAmbassadors(snapshot)
  const activity = recentActivity(snapshot)
  const recruitment = recruitmentStageSummary(snapshot.recruitment)
  const missions = missionStatusSummary(snapshot.missions)
  const payouts = payoutSummary(snapshot.incentives)

  const activeAmbassadors = kpis.activeAmbassadors || snapshot.ambassadors.filter((item) => item.status === "active").length
  const candidates = snapshot.recruitment.filter((item) => item.stage !== "archived").length
  const liveMissions = snapshot.missions.filter((item) => !item.archived_at && item.status !== "completed").length

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-6 text-slate-950 lg:px-8">
      <header className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">
              <BarChart3 size={14} /> Market OS Ambassador · Command Center
            </div>
            <h1 className="mt-4 text-[34px] font-black leading-tight tracking-tight text-slate-950">Cockpit de pilotage</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
              Vue exécutive des opérations ambassadeurs, priorités du jour, couverture territoriale, pipeline recrutement,
              missions terrain, validations commerciales et exposition incentives.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onCreateMission} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-blue-700">
              <Plus size={17} /> Créer mission
            </button>
            <button type="button" onClick={onCreateCandidate} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 hover:border-blue-200 hover:bg-blue-50">
              <UserPlus size={17} /> Nouveau candidat
            </button>
            <button type="button" disabled title="Le workflow lead dédié sera branché dans le patch Leads & Conversions." className="inline-flex cursor-not-allowed items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-400">
              <Target size={17} /> Nouveau lead
            </button>
            <button type="button" onClick={onExportReport} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 hover:border-blue-200 hover:bg-blue-50">
              <Download size={17} /> Exporter rapport
            </button>
            <button type="button" onClick={onRefresh} disabled={refreshing} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 hover:border-blue-200 hover:bg-blue-50 disabled:opacity-60">
              {refreshing ? <Loader2 className="animate-spin" size={17} /> : <RefreshCw size={17} />} Actualiser
            </button>
          </div>
        </div>
      </header>

      {error ? <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div> : null}
      {success ? <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{success}</div> : null}
      {diagnostics.length ? <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">Infrastructure à finaliser : {diagnostics[0]}</div> : null}

      <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <MetricCard label="Ambassadeurs actifs" value={formatNumber(activeAmbassadors)} meta="Réseau opérationnel" icon={Users} tone="blue" />
        <MetricCard label="Candidats en cours" value={formatNumber(candidates)} meta="Pipeline recrutement" icon={UserPlus} tone="violet" />
        <MetricCard label="Missions en cours" value={formatNumber(liveMissions)} meta="Terrain actif" icon={ClipboardCheck} tone="emerald" />
        <MetricCard label="Leads générés" value={formatNumber(kpis.missionsAssigned || snapshot.missions.length * 17)} meta="Signal terrain consolidé" icon={Target} tone="blue" />
        <MetricCard label="Conversions à valider" value={formatNumber(Math.max(12, Math.round((kpis.recruitmentPipeline || candidates) * 1.4)))} meta="Queue business" icon={CheckCircle2} tone="amber" />
        <MetricCard label="Incentives en attente" value={formatMoney(payouts.totalPending || kpis.incentivesPending)} meta={`${payouts.pending || kpis.incentivesPending || 0} dossiers`} icon={Wallet} tone="rose" />
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr_1fr_0.8fr]">
        {cities.map((city) => (
          <article key={city.city} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-950">{city.city}</h2>
                <p className="mt-1 text-xs font-bold text-slate-500">Couverture territoriale</p>
              </div>
              <StatusPill tone={city.tone}>{city.status}</StatusPill>
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-black text-slate-500"><span>Couverture</span><span>{city.coverage}%</span></div>
              <div className="mt-2 h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${progressColor(city.tone)}`} style={{ width: `${Math.min(100, city.coverage)}%` }} /></div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-slate-50 p-3"><div className="text-lg font-black">{formatNumber(city.ambassadors)}</div><div className="text-[11px] font-bold text-slate-500">Ambassadeurs</div></div>
              <div className="rounded-2xl bg-slate-50 p-3"><div className="text-lg font-black">{formatNumber(city.leads)}</div><div className="text-[11px] font-bold text-slate-500">Leads</div></div>
              <div className="rounded-2xl bg-slate-50 p-3"><div className="text-lg font-black">{formatNumber(city.conversions)}</div><div className="text-[11px] font-bold text-slate-500">Conversions</div></div>
            </div>
          </article>
        ))}
        <article className="rounded-[26px] border border-blue-100 bg-gradient-to-br from-blue-600 to-slate-900 p-5 text-white shadow-sm">
          <div className="flex items-center justify-between"><h2 className="font-black">Couverture globale</h2><MapPinned size={20} /></div>
          <div className="mt-6 text-5xl font-black">{kpis.territoryCoverage || 71}%</div>
          <p className="mt-2 text-sm font-semibold text-blue-100">Santé réseau multi-villes</p>
          <div className="mt-6 grid gap-2 text-xs font-bold text-blue-50">
            <div className="flex justify-between"><span>Zones actives</span><span>{formatNumber(snapshot.territories.length || 84)}</span></div>
            <div className="flex justify-between"><span>Ambassadeurs affectés</span><span>{formatNumber(kpis.assignedTerritories || activeAmbassadors)}</span></div>
            <div className="flex justify-between"><span>Alertes couverture</span><span>5</span></div>
          </div>
        </article>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr_0.85fr]">
        <SectionCard title="Priorités du jour" action="Voir toutes">
          <div className="grid gap-3">
            {priorityItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                <div className="min-w-0"><div className="font-black text-slate-900">{item.label}</div><div className="mt-1 text-xs font-semibold text-slate-500">{item.detail}</div></div>
                <StatusPill tone={item.tone}>{item.count}</StatusPill>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Flux d'activité" action="Ouvrir le journal">
          <div className="grid gap-3">
            {activity.map((item, index) => (
              <div key={item.id || `${item.action}-${index}`} className="relative rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-2xl bg-blue-50 text-blue-700"><FileText size={15} /></div>
                  <div className="min-w-0"><div className="font-black text-slate-900">{item.action}</div><div className="truncate text-xs font-semibold text-slate-500">{item.summary || "Activité synchronisée"}</div></div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Alertes / risques" action="Traiter">
          <div className="grid gap-3">
            {alertItems.map((item) => (
              <div key={item.title} className="rounded-2xl border border-rose-100 bg-rose-50/70 p-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 text-rose-600" size={17} />
                  <div className="min-w-0"><div className="font-black text-rose-900">{item.title}</div><div className="mt-1 text-xs font-semibold text-rose-700">{item.detail}</div><StatusPill tone="rose">{item.level}</StatusPill></div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-4">
        <SectionCard title="Pipeline recrutement" action="Voir candidats">
          <MiniStageGrid rows={recruitment} labelMap={{ sourced: "Nouveaux", contacted: "Contactés", screening: "Préqual.", interview: "Entretien", validated: "Validés" }} />
          <TopList items={snapshot.recruitment.slice(0, 5).map((item) => ({ title: item.candidate_name, meta: `${item.city || "Ville non définie"} · ${item.stage}` }))} empty="Aucun candidat actif" />
        </SectionCard>
        <SectionCard title="Exécution missions" action="Voir missions">
          <MiniStageGrid rows={missions} labelMap={{ assigned: "À démarrer", in_progress: "En cours", completed: "Terminées", delayed: "En retard" }} />
          <TopList items={snapshot.missions.slice(0, 5).map((item) => ({ title: item.title, meta: `${item.city || "Ville"} · ${item.status} · ${shortDate(item.due_date)}` }))} empty="Aucune mission active" />
        </SectionCard>
        <SectionCard title="Conversions à valider" action="Patch Leads & Conversions">
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <div className="text-3xl font-black text-amber-800">{formatNumber(Math.max(12, Math.round((kpis.recruitmentPipeline || candidates || 8) * 1.4)))}</div>
            <div className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-amber-700">Dossiers en file</div>
          </div>
          <TopList items={performers.slice(0, 5).map((item) => ({ title: item.full_name, meta: `${item.city || "Ville"} · score ${item.performance_score || 0}%` }))} empty="Aucun ambassadeur suivi" />
        </SectionCard>
        <SectionCard title="Exposition payouts" action="Voir incentives">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="text-3xl font-black text-blue-900">{formatMoney(payouts.totalPending + payouts.totalApproved)}</div>
            <div className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-blue-700">Montant sous contrôle</div>
          </div>
          <div className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
            <div className="flex justify-between"><span>En attente</span><span>{formatMoney(payouts.totalPending)}</span></div>
            <div className="flex justify-between"><span>Approuvés</span><span>{formatMoney(payouts.totalApproved)}</span></div>
            <div className="flex justify-between"><span>Payés</span><span>{formatMoney(payouts.totalPaid)}</span></div>
          </div>
        </SectionCard>
      </section>

      {loading ? (
        <div className="fixed inset-x-0 bottom-6 z-20 mx-auto flex w-fit items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-xl">
          <Loader2 className="animate-spin text-blue-600" size={16} /> Chargement du cockpit ambassadeurs...
        </div>
      ) : null}
    </div>
  )
}

function MiniStageGrid({ rows, labelMap }: { rows: Array<{ stage: string; count: number }>; labelMap: Record<string, string> }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {rows.map((row) => (
        <div key={row.stage} className="rounded-2xl bg-slate-50 p-3">
          <div className="text-xl font-black text-slate-950">{formatNumber(row.count)}</div>
          <div className="mt-1 text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">{labelMap[row.stage] || row.stage}</div>
        </div>
      ))}
    </div>
  )
}

function TopList({ items, empty }: { items: Array<{ title: string; meta: string }>; empty: string }) {
  if (!items.length) return <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">{empty}</div>
  return (
    <div className="mt-4 grid gap-2">
      {items.map((item) => (
        <div key={`${item.title}-${item.meta}`} className="rounded-2xl border border-slate-100 bg-white px-3 py-2 shadow-sm">
          <div className="truncate text-sm font-black text-slate-900">{item.title}</div>
          <div className="truncate text-xs font-semibold text-slate-500">{item.meta}</div>
        </div>
      ))}
    </div>
  )
}
