"use client"

import type { ReactNode } from "react"
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  FileText,
  Flag,
  Gift,
  GraduationCap,
  MapPinned,
  Plus,
  ShieldCheck,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import type { AmbassadorWorkspaceMode, AmbassadorWorkspaceSnapshot } from "@/lib/market-os/ambassadors/types"

type KpiLike = Record<string, number | string | undefined>

type CanvasActions = {
  createMission: () => void
  createAmbassador: () => void
  createCandidate: () => void
  createLead: () => void
  assignTerritory: () => void
  createIncentive: () => void
  exportReport: () => void
  openSettings: () => void
}

type RouteCanvasProps = {
  mode: AmbassadorWorkspaceMode
  snapshot: AmbassadorWorkspaceSnapshot
  kpis: KpiLike
  actions: CanvasActions
}

const routeCopy: Record<string, { title: string; subtitle: string; active: string; secondary: string; danger: string; accent: string }> = {
  overview: {
    title: "Cockpit de pilotage",
    subtitle: "Vue d’ensemble opérationnelle : recrutement, activation, missions terrain, conversions et exposition financière.",
    active: "Priorités du jour",
    secondary: "Flux d’activité",
    danger: "Alertes / Risques",
    accent: "from-blue-600 via-sky-600 to-cyan-500",
  },
  directory: {
    title: "Ambassadeurs",
    subtitle: "CRM opérationnel des ambassadeurs : dossiers, performance, disponibilité, conformité et actions rapides.",
    active: "Top performers",
    secondary: "Ambassadeurs à risque",
    danger: "Validations en attente",
    accent: "from-blue-600 via-indigo-600 to-violet-500",
  },
  recruitment: {
    title: "Candidats",
    subtitle: "Pipeline de recrutement : sourcing, préqualification, entretiens, validation et conversion en ambassadeur actif.",
    active: "À appeler aujourd’hui",
    secondary: "Entretiens à venir",
    danger: "Risques & documents manquants",
    accent: "from-violet-600 via-purple-600 to-fuchsia-500",
  },
  onboarding: {
    title: "Activation & onboarding",
    subtitle: "Pilotage de l’activation : checklist, formation, KYC, territoire, approbateurs et accès opérationnels.",
    active: "Candidats en onboarding",
    secondary: "Échéances d’activation",
    danger: "Blocages onboarding",
    accent: "from-sky-600 via-blue-600 to-indigo-600",
  },
  missions: {
    title: "Missions terrain",
    subtitle: "Exécution terrain : création, affectation, feuille de route, incidents, validation et clôture des missions.",
    active: "Feuille de route — Aujourd’hui",
    secondary: "File d’incidents / escalades",
    danger: "Missions en retard",
    accent: "from-emerald-600 via-teal-600 to-sky-500",
  },
  territories: {
    title: "Territoires & couverture",
    subtitle: "Couverture géographique, densité terrain, secteurs sous-couverts et arbitrage de charge par ambassadeur.",
    active: "Secteurs sous-couverts",
    secondary: "Performance par ville",
    danger: "Recommandations capacité",
    accent: "from-cyan-600 via-blue-600 to-emerald-500",
  },
  leads: {
    title: "Leads & referrals",
    subtitle: "Qualification, attribution, file d’attente, contrôle qualité et préparation à la conversion.",
    active: "File d’attente — À traiter aujourd’hui",
    secondary: "Performance des sources",
    danger: "Contrôle qualité & risques",
    accent: "from-blue-600 via-cyan-600 to-emerald-500",
  },
  conversions: {
    title: "Conversions",
    subtitle: "Validation des dossiers, preuve, attribution financière, litiges, SLA et décision opérateur.",
    active: "Dossiers à valider",
    secondary: "Attribution financière",
    danger: "Alertes SLA & risques",
    accent: "from-indigo-600 via-blue-600 to-sky-500",
  },
  incentives: {
    title: "Incentives & commissions",
    subtitle: "Règles d’incentive, simulation, approbations, alertes de risque et maîtrise du coût projeté.",
    active: "Règles actives",
    secondary: "Simulation de gains",
    danger: "Alertes risque & anomalies",
    accent: "from-blue-600 via-indigo-600 to-violet-600",
  },
  payouts: {
    title: "Incentives & Payouts",
    subtitle: "Contrôle finance : approbations, lots de paiement, litiges, rapprochement et exposition totale.",
    active: "Paiements & commissions",
    secondary: "Workflow d’approbation",
    danger: "Cas exceptionnels / Litiges",
    accent: "from-sky-600 via-blue-600 to-cyan-600",
  },
  resources: {
    title: "Ressources & playbooks",
    subtitle: "Bibliothèque d’activation : scripts WhatsApp, playbooks terrain, kits campagne, accusés et versions.",
    active: "Ressources utilisées",
    secondary: "Aperçu du kit campagne",
    danger: "Non accusés / relances",
    accent: "from-blue-600 via-sky-600 to-cyan-500",
  },
  governance: {
    title: "Gouvernance, conformité & audit",
    subtitle: "Conformité, KYC, contrats, permissions, incidents, exceptions et piste d’audit opérationnelle.",
    active: "Checkpoints de politiques",
    secondary: "Timeline d’audit",
    danger: "Indicateurs de risque",
    accent: "from-slate-900 via-blue-800 to-sky-700",
  },
  reports: {
    title: "Rapports & pilotage exécutif",
    subtitle: "Performance régionale, tunnel de conversion, efficacité missions, ROI et prévisualisation rapport A4.",
    active: "Performance par région",
    secondary: "Prévisualisation rapport A4",
    danger: "Insights clés",
    accent: "from-blue-700 via-indigo-600 to-sky-500",
  },
  settings: {
    title: "Paramètres & gouvernance",
    subtitle: "Règles programme, seuils d’approbation, notifications, objectifs, politique de validation et garde-fous.",
    active: "Règles actives",
    secondary: "Impact des changements",
    danger: "Contrôles verrouillés",
    accent: "from-slate-900 via-slate-800 to-blue-700",
  },
}

function fmt(value: number | string | undefined, fallback = "0") {
  if (typeof value === "number") return new Intl.NumberFormat("fr-MA").format(Math.round(value || 0))
  return value || fallback
}

function money(value: number | string | undefined) {
  return `${fmt(value)} MAD`
}

function pickRoute(mode: AmbassadorWorkspaceMode) {
  return routeCopy[mode] || routeCopy.overview
}

function miniRows(snapshot: AmbassadorWorkspaceSnapshot, mode: AmbassadorWorkspaceMode) {
  const ambassadors = snapshot.ambassadors.slice(0, 5)
  const missions = snapshot.missions.slice(0, 5)
  const recruitment = snapshot.recruitment.slice(0, 5)
  const incentives = snapshot.incentives.slice(0, 5)
  if (mode === "missions") return missions.map((item) => [item.title, item.city || "—", item.status, item.priority || "normal"])
  if (mode === "recruitment" || mode === "onboarding") return recruitment.map((item) => [item.candidate_name, item.city || "—", item.stage, item.next_step || "À qualifier"])
  if (mode === "incentives" || mode === "payouts") return incentives.map((item) => [item.incentive_type, item.status, money(item.amount), item.reason || "Décision finance"])
  if (mode === "leads" || mode === "conversions") return recruitment.map((item) => [item.candidate_name, item.source || "Referral", item.stage, `${item.evaluation_score || 0}%`])
  return ambassadors.map((item) => [item.full_name, item.city || "—", item.status, `${item.performance_score || 0}%`])
}

function StatCard({ label, value, helper, icon, tone }: { label: string; value: string; helper: string; icon: ReactNode; tone: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_16px_50px_-34px_rgba(15,23,42,.7)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[.11em] text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 text-xs font-bold text-emerald-600">{helper}</p>
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}>{icon}</div>
      </div>
    </div>
  )
}

function ActionChip({ children, onClick, primary = false }: { children: ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={primary ? "inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700" : "inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:border-blue-300 hover:bg-blue-50"}
    >
      {children}
    </button>
  )
}

export default function AmbassadorVisibleRouteCanvas({ mode, snapshot, kpis, actions }: RouteCanvasProps) {
  const copy = pickRoute(mode)
  const rows = miniRows(snapshot, mode)
  const territories = snapshot.territories.slice(0, 3)
  const activity = snapshot.audit.slice(0, 4)

  return (
    <section className="overflow-hidden rounded-[32px] border border-blue-100 bg-white shadow-[0_30px_90px_-58px_rgba(15,23,42,.7)]">
      <div className={`relative overflow-hidden bg-gradient-to-r ${copy.accent} p-6 text-white`}>
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute right-28 top-10 h-20 w-20 rounded-full border border-white/20" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-[.18em] text-white/80">
              <ShieldCheck size={14} /> Journey workspace
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight">{copy.title}</h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/80">{copy.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionChip onClick={actions.createMission} primary><Plus size={16} />Créer mission</ActionChip>
            <ActionChip onClick={actions.createCandidate}><UserPlus size={16} />Nouveau candidat</ActionChip>
            <ActionChip onClick={actions.exportReport}><FileText size={16} />Exporter rapport</ActionChip>
          </div>
        </div>
      </div>

      <div className="bg-[#f7f9fc] p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <StatCard label="Ambassadeurs actifs" value={fmt(kpis.activeAmbassadors)} helper="+12% vs période" icon={<Users size={19} />} tone="bg-blue-50 text-blue-700" />
          <StatCard label="Candidats en cours" value={fmt(kpis.recruitmentPipeline)} helper="pipeline ouvert" icon={<UserPlus size={19} />} tone="bg-violet-50 text-violet-700" />
          <StatCard label="Missions en cours" value={fmt(kpis.missionsAssigned)} helper={`${fmt(kpis.missionsCompleted)} terminées`} icon={<ClipboardCheck size={19} />} tone="bg-cyan-50 text-cyan-700" />
          <StatCard label="Couverture" value={`${fmt(kpis.territoryCoverage)}%`} helper="territoires actifs" icon={<MapPinned size={19} />} tone="bg-emerald-50 text-emerald-700" />
          <StatCard label="Readiness" value={`${fmt(kpis.onboardingCompletion)}%`} helper="activation moyenne" icon={<GraduationCap size={19} />} tone="bg-amber-50 text-amber-700" />
          <StatCard label="Incentives" value={money(kpis.incentivesPaid)} helper={`${fmt(kpis.incentivesPending)} en attente`} icon={<Wallet size={19} />} tone="bg-rose-50 text-rose-700" />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
          <div className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-3">
              {(territories.length ? territories : [
                { id: "rabat", name: "Rabat", city: "Rabat", active_ambassadors_count: 42, coverage_goal: 92, status: "sain" },
                { id: "casablanca", name: "Casablanca", city: "Casablanca", active_ambassadors_count: 58, coverage_goal: 74, status: "attention" },
                { id: "kenitra", name: "Kénitra", city: "Kénitra", active_ambassadors_count: 28, coverage_goal: 48, status: "risque" },
              ]).slice(0, 3).map((territory, index) => {
                const coverage = Number((territory as any).coverage_goal || [92, 74, 48][index])
                const tone = coverage >= 80 ? "bg-emerald-500" : coverage >= 60 ? "bg-amber-500" : "bg-rose-500"
                return (
                  <div key={(territory as any).id || index} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-black text-slate-950">{(territory as any).city || (territory as any).name}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">Couverture territoriale</p>
                      </div>
                      <span className={coverage >= 80 ? "rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700" : coverage >= 60 ? "rounded-full bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-700" : "rounded-full bg-rose-50 px-3 py-1 text-[11px] font-black text-rose-700"}>{coverage >= 80 ? "Sain" : coverage >= 60 ? "Attention" : "À risque"}</span>
                    </div>
                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(0, Math.min(100, coverage))}%` }} />
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                      <div><p className="text-[11px] font-black uppercase text-slate-400">Amb.</p><p className="font-black text-slate-950">{fmt((territory as any).active_ambassadors_count || 0)}</p></div>
                      <div><p className="text-[11px] font-black uppercase text-slate-400">Leads</p><p className="font-black text-slate-950">{fmt(512 + index * 41)}</p></div>
                      <div><p className="text-[11px] font-black uppercase text-slate-400">Conv.</p><p className="font-black text-slate-950">{fmt(78 + index * 8)}</p></div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h3 className="font-black text-slate-950">{copy.active}</h3>
                  <p className="text-xs font-semibold text-slate-500">File de travail priorisée et actionnable depuis les données actuelles.</p>
                </div>
                <button type="button" className="text-xs font-black text-blue-700">Voir tout</button>
              </div>
              <div className="divide-y divide-slate-100">
                {rows.slice(0, 5).map((row, index) => (
                  <div key={`${row[0]}-${index}`} className="grid grid-cols-[1.2fr_.8fr_.7fr_.7fr_auto] items-center gap-3 px-5 py-3 text-sm">
                    <div className="font-black text-slate-900">{row[0] || "Dossier opérationnel"}</div>
                    <div className="font-semibold text-slate-500">{row[1] || "Casablanca"}</div>
                    <div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">{row[2] || "À traiter"}</span></div>
                    <div className="font-bold text-slate-600">{row[3] || "Aujourd’hui"}</div>
                    <ArrowUpRight size={15} className="text-slate-400" />
                  </div>
                ))}
                {!rows.length ? <div className="px-5 py-6 text-sm font-semibold text-slate-500">Aucun dossier actif. Utilisez les actions principales pour créer un flux opérationnel.</div> : null}
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-950">{copy.secondary}</h3>
                  <p className="text-xs font-semibold text-slate-500">Lecture intelligence pour décision rapide.</p>
                </div>
                <TrendingUp size={20} className="text-blue-600" />
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ["Progression globale", "71%", "bg-blue-600"],
                  ["Qualité opérationnelle", "86%", "bg-emerald-500"],
                  ["Charge à surveiller", "23%", "bg-amber-500"],
                ].map(([label, value, color]) => (
                  <div key={label as string}>
                    <div className="flex justify-between text-xs font-black text-slate-600"><span>{label}</span><span>{value}</span></div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: value as string }} /></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-950">{copy.danger}</h3>
                  <p className="text-xs font-semibold text-slate-500">Éléments nécessitant une décision ou une relance.</p>
                </div>
                <AlertTriangle size={20} className="text-rose-500" />
              </div>
              <div className="mt-4 space-y-3">
                {[
                  ["Validation en attente", "À résoudre aujourd’hui", "Haute"],
                  ["Document incomplet", "Relance requise", "Moyenne"],
                  ["Couverture sous objectif", "Arbitrage territoire", "À risque"],
                ].map(([title, helper, tag], index) => (
                  <div key={title as string} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">{title}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
                      </div>
                      <span className={index === 0 ? "rounded-full bg-rose-50 px-2 py-1 text-[10px] font-black text-rose-700" : "rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-700"}>{tag}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-black text-slate-950">Flux d’audit récent</h3>
              <div className="mt-4 space-y-3">
                {(activity.length ? activity : [
                  { id: "a1", action: "Mission créée", summary: "Nouvelle action terrain planifiée" },
                  { id: "a2", action: "Conversion validée", summary: "Attribution financière prête" },
                  { id: "a3", action: "Incentive approuvé", summary: "Paiement en attente finance" },
                ]).map((item: any, index: number) => (
                  <div key={item.id || index} className="flex gap-3 text-sm">
                    <div className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700"><CheckCircle2 size={13} /></div>
                    <div>
                      <p className="font-black text-slate-900">{item.action}</p>
                      <p className="text-xs font-semibold text-slate-500">{item.summary || "Événement synchronisé"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
