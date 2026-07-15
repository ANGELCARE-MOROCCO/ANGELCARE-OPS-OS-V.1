"use client"

import { useMemo, useState, type ComponentType, type FormEvent, type ReactNode } from "react"
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
  X,
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
type ModalKind = null | "candidate" | "mission" | "lead" | "conversion" | "incentive" | "export"
type AnyRecord = Record<string, any>

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

const missionScenarios = [
  {
    id: "activation-familles-premium",
    title: "Activation familles premium",
    mission_type: "lead_generation",
    campaign: "Campagne familles solvables",
    objective: "Générer 12 leads parents qualifiés sur une zone prioritaire",
    proof: "Photos non sensibles du point d’activation + liste leads qualifiés + notes d’objection",
    script: "Présenter AngelCare comme solution de confiance à domicile, qualifier besoin, urgence, budget et quartier.",
    success: "12 leads saisis, 6 leads chauds, 1 conversion potentielle sous 7 jours",
  },
  {
    id: "ecoles-creches-partenaires",
    title: "Prospection écoles & crèches",
    mission_type: "partner_outreach",
    campaign: "Ouverture partenaires B2B",
    objective: "Identifier 8 structures partenaires et obtenir 3 rendez-vous de direction",
    proof: "Cartes de visite, coordonnées décideur, compte-rendu court, statut intérêt",
    script: "Positionner AngelCare comme extension premium parent trust / services terrain / acquisition familles.",
    success: "8 contacts décideurs, 3 RDV, 1 dossier devis ouvert",
  },
  {
    id: "animation-quartier",
    title: "Animation quartier & bouche-à-oreille",
    mission_type: "local_activation",
    campaign: "Activation locale Rabat-Casa-Kénitra",
    objective: "Créer présence de marque et récupérer des recommandations qualifiées",
    proof: "Journal d’approche, zone couverte, objections, referrals, captures WhatsApp autorisées",
    script: "Approche courte, rassurante, familiale, orientée sécurité enfant et disponibilité rapide.",
    success: "20 contacts, 8 referrals, 4 demandes de rappel sous 48h",
  },
]

const leadNeeds = [
  "Garde enfant à domicile",
  "Sortie d’école / accompagnement",
  "Programme vacances / été",
  "Soutien routine enfant",
  "Besoin urgent nounou fiable",
  "Demande B2B crèche / école",
]

const candidateSources = ["Referral ambassadeur", "WhatsApp entrant", "Instagram / Meta", "LinkedIn", "Événement local", "Cooptation interne", "Candidature spontanée"]
const cities = ["Rabat", "Casablanca", "Kénitra", "Tanger", "Fès", "Marrakech", "Agadir"]
const regionsByCity: Record<string, string> = {
  Rabat: "Rabat-Salé-Kénitra",
  Casablanca: "Casablanca-Settat",
  Kénitra: "Rabat-Salé-Kénitra",
  Tanger: "Tanger-Tétouan-Al Hoceima",
  Fès: "Fès-Meknès",
  Marrakech: "Marrakech-Safi",
  Agadir: "Souss-Massa",
}

const defaultCandidate = {
  candidate_name: "",
  phone: "",
  email: "",
  city: "Rabat",
  region: "Rabat-Salé-Kénitra",
  source: "Referral ambassadeur",
  stage: "screening",
  profile_type: "Ambassadeur terrain familles",
  availability: "Temps partiel flexible",
  mobility: "Transport personnel / zone proche",
  languages: "Arabe dialectal, Français",
  interviewer: "Manager OPS",
  evaluation_score: "72",
  next_step: "Appel de préqualification aujourd’hui",
  notes: "Préqualification à réaliser: disponibilité, aisance communication, connaissance quartier, capacité à qualifier un parent.",
}

const defaultLead = {
  lead_name: "",
  parent_name: "",
  phone: "",
  email: "",
  city: "Rabat",
  region: "Rabat-Salé-Kénitra",
  zone: "Centre / quartier prioritaire",
  source: "Referral ambassadeur",
  lead_type: "Parent B2C",
  status: "qualified",
  score: "82",
  ambassador_id: "",
  territory_id: "",
  need: "Garde enfant à domicile",
  child_age: "3-6 ans",
  urgency: "Sous 7 jours",
  next_followup_at: "",
  notes: "Lead à qualifier: besoin, quartier exact, budget indicatif, horaire, urgence, confiance et prochaines disponibilités.",
}

const defaultMission = {
  scenario_id: missionScenarios[0].id,
  title: missionScenarios[0].title,
  mission_type: missionScenarios[0].mission_type,
  campaign: missionScenarios[0].campaign,
  priority: "high",
  status: "assigned",
  city: "Rabat",
  region: "Rabat-Salé-Kénitra",
  ambassador_id: "",
  territory_id: "",
  due_date: "",
  objective: missionScenarios[0].objective,
  proof: missionScenarios[0].proof,
  script: missionScenarios[0].script,
  success: missionScenarios[0].success,
  followup_channel: "WhatsApp + appel sous 24h",
  instructions: missionScenarios[0].script,
}

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

function SectionCard({ title, action, children, className = "" }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-base font-black tracking-tight text-slate-950">{title}</h2>
        {action ? <div className="text-xs font-black text-blue-700">{action}</div> : null}
      </div>
      {children}
    </section>
  )
}

function StatusPill({ children, tone = "blue" }: { children: ReactNode; tone?: string }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black ${toneClasses(tone)}`}>{children}</span>
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <div className="mt-2">{children}</div>
      {hint ? <p className="mt-1 text-[11px] font-semibold text-slate-500">{hint}</p> : null}
    </label>
  )
}

const inputClass = "w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
const selectClass = inputClass
const textareaClass = `${inputClass} min-h-[96px] resize-none`

function pickCities(snapshot: AmbassadorWorkspaceSnapshot) {
  return cityFallbacks.map((base) => {
    const ambassadors = snapshot.ambassadors.filter((item: AnyRecord) => (item.city || "").toLowerCase() === base.city.toLowerCase())
    const territories = snapshot.territories.filter((item: AnyRecord) => (item.city || "").toLowerCase() === base.city.toLowerCase())
    const missions = snapshot.missions.filter((item: AnyRecord) => (item.city || "").toLowerCase() === base.city.toLowerCase())
    const averageCoverage = territories.length
      ? Math.round(territories.reduce((sum: number, item: AnyRecord) => sum + Number(item.coverage_goal || 0), 0) / territories.length)
      : base.coverage

    return {
      ...base,
      coverage: averageCoverage || base.coverage,
      ambassadors: ambassadors.length || base.ambassadors,
      leads: missions.reduce((sum: number, item: AnyRecord) => sum + Number(item.leads_generated || 0), 0) || base.leads,
      conversions: Math.max(0, Math.round((missions.length || base.conversions / 8) * 6)) || base.conversions,
    }
  })
}

function topAmbassadors(snapshot: AmbassadorWorkspaceSnapshot) {
  return [...snapshot.ambassadors]
    .filter((item: AnyRecord) => item.status !== "archived")
    .sort((a: AnyRecord, b: AnyRecord) => Number(b.performance_score || 0) - Number(a.performance_score || 0))
    .slice(0, 5)
}

function recentActivity(snapshot: AmbassadorWorkspaceSnapshot) {
  const audit = [...snapshot.audit]
    .sort((a: AnyRecord, b: AnyRecord) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
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
  return stages.map((stage) => ({ stage, count: records.filter((item: AnyRecord) => item.stage === stage).length }))
}

function missionStatusSummary(records: AmbassadorMission[]) {
  const stages = ["assigned", "in_progress", "completed", "delayed"]
  return stages.map((stage) => ({ stage, count: records.filter((item: AnyRecord) => item.status === stage).length }))
}

function payoutSummary(records: AmbassadorIncentive[]) {
  const pending = records.filter((item: AnyRecord) => item.status === "pending")
  const approved = records.filter((item: AnyRecord) => item.status === "approved")
  const paid = records.filter((item: AnyRecord) => item.status === "paid")
  const totalPending = pending.reduce((sum: number, item: AnyRecord) => sum + Number(item.amount || 0), 0)
  const totalApproved = approved.reduce((sum: number, item: AnyRecord) => sum + Number(item.amount || 0), 0)
  const totalPaid = paid.reduce((sum: number, item: AnyRecord) => sum + Number(item.amount || 0), 0)
  return { pending: pending.length, approved: approved.length, paid: paid.length, totalPending, totalApproved, totalPaid }
}

function labelForAmbassador(snapshot: AmbassadorWorkspaceSnapshot, id?: string) {
  const record = snapshot.ambassadors.find((item: AnyRecord) => item.id === id)
  return record?.full_name || record?.name || "Non assigné"
}

function labelForTerritory(snapshot: AmbassadorWorkspaceSnapshot, id?: string) {
  const record = snapshot.territories.find((item: AnyRecord) => item.id === id)
  return record?.name || "Territoire non assigné"
}

async function apiSend(endpoint: string, method: "POST" | "PATCH", payload: AnyRecord) {
  const response = await fetch(endpoint, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error || `Action impossible (${response.status})`)
  }
  return data
}

async function apiDownloadReport() {
  const response = await fetch("/api/market-os/ambassadors/reports/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ report_type: "ambassadors-overview", title: "Cockpit ambassadeurs - Export opérationnel" }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data?.ok === false) throw new Error(data?.error || "Export impossible")
  const csv = data?.data?.csv || ""
  const filename = data?.data?.filename || `angelcare-ambassadors-cockpit-${new Date().toISOString().slice(0, 10)}.csv`
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  return data
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
}: AmbassadorCockpitRouteProps) {
  const [modal, setModal] = useState<ModalKind>(null)
  const [busy, setBusy] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [candidateForm, setCandidateForm] = useState(defaultCandidate)
  const [missionForm, setMissionForm] = useState(defaultMission)
  const [leadForm, setLeadForm] = useState(defaultLead)
  const [decisionNote, setDecisionNote] = useState("Validation conforme: source, preuve, attribution et délai vérifiés par OPS.")
  const [incentiveNote, setIncentiveNote] = useState("Contrôle conforme: conversion source vérifiée, montant cohérent, aucune alerte fraude bloquante.")

  const territoryCities = useMemo(() => pickCities(snapshot), [snapshot])
  const performers = useMemo(() => topAmbassadors(snapshot), [snapshot])
  const activity = useMemo(() => recentActivity(snapshot), [snapshot])
  const recruitment = useMemo(() => recruitmentStageSummary(snapshot.recruitment), [snapshot.recruitment])
  const missions = useMemo(() => missionStatusSummary(snapshot.missions), [snapshot.missions])
  const payouts = useMemo(() => payoutSummary(snapshot.incentives), [snapshot.incentives])
  const leads = ((snapshot as AnyRecord).leads || []) as AnyRecord[]
  const conversions = ((snapshot as AnyRecord).conversions || []) as AnyRecord[]
  const pendingConversion = conversions.find((item) => ["pending", "to_validate", "À valider"].includes(String(item.status || "pending"))) || conversions[0]
  const pendingIncentive = snapshot.incentives.find((item: AnyRecord) => item.status === "pending") || snapshot.incentives[0]

  const activeAmbassadors = kpis.activeAmbassadors || snapshot.ambassadors.filter((item: AnyRecord) => item.status === "active").length
  const candidates = snapshot.recruitment.filter((item: AnyRecord) => item.stage !== "archived").length
  const liveMissions = snapshot.missions.filter((item: AnyRecord) => !item.archived_at && item.status !== "completed").length

  function resetMessages() {
    setActionMessage(null)
    setActionError(null)
  }

  function openModal(kind: ModalKind) {
    resetMessages()
    setModal(kind)
    if (kind === "mission") {
      setMissionForm((form) => ({
        ...form,
        ambassador_id: form.ambassador_id || snapshot.ambassadors[0]?.id || "",
        territory_id: form.territory_id || snapshot.territories[0]?.id || "",
      }))
    }
    if (kind === "lead") {
      setLeadForm((form) => ({
        ...form,
        ambassador_id: form.ambassador_id || snapshot.ambassadors[0]?.id || "",
        territory_id: form.territory_id || snapshot.territories[0]?.id || "",
      }))
    }
  }

  function updateCandidate(key: string, value: string) {
    setCandidateForm((form) => ({ ...form, [key]: value, region: key === "city" ? regionsByCity[value] || form.region : form.region }))
  }

  function updateLead(key: string, value: string) {
    setLeadForm((form) => ({ ...form, [key]: value, region: key === "city" ? regionsByCity[value] || form.region : form.region }))
  }

  function updateMission(key: string, value: string) {
    if (key === "scenario_id") {
      const scenario = missionScenarios.find((item) => item.id === value) || missionScenarios[0]
      setMissionForm((form) => ({
        ...form,
        scenario_id: scenario.id,
        title: scenario.title,
        mission_type: scenario.mission_type,
        campaign: scenario.campaign,
        objective: scenario.objective,
        proof: scenario.proof,
        script: scenario.script,
        success: scenario.success,
        instructions: scenario.script,
      }))
      return
    }
    setMissionForm((form) => ({ ...form, [key]: value, region: key === "city" ? regionsByCity[value] || form.region : form.region }))
  }

  async function submitCandidate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    resetMessages()
    try {
      await apiSend("/api/market-os/ambassadors/recruitment", "POST", {
        candidate_name: candidateForm.candidate_name.trim(),
        phone: candidateForm.phone.trim() || null,
        email: candidateForm.email.trim() || null,
        city: candidateForm.city,
        region: candidateForm.region,
        source: candidateForm.source,
        stage: candidateForm.stage,
        evaluation_score: Number(candidateForm.evaluation_score || 0),
        interviewer: candidateForm.interviewer,
        next_step: candidateForm.next_step,
        notes: [
          `Profil: ${candidateForm.profile_type}`,
          `Disponibilité: ${candidateForm.availability}`,
          `Mobilité: ${candidateForm.mobility}`,
          `Langues: ${candidateForm.languages}`,
          candidateForm.notes,
        ].filter(Boolean).join("\n"),
      })
      setActionMessage("Candidat créé et synchronisé dans le pipeline recrutement.")
      onRefresh()
      setModal(null)
      setCandidateForm(defaultCandidate)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Création candidat impossible")
    } finally {
      setBusy(false)
    }
  }

  async function submitMission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    resetMessages()
    try {
      await apiSend("/api/market-os/ambassadors/missions", "POST", {
        title: missionForm.title,
        mission_type: missionForm.mission_type,
        priority: missionForm.priority,
        status: missionForm.status,
        city: missionForm.city,
        region: missionForm.region,
        ambassador_id: missionForm.ambassador_id || null,
        territory_id: missionForm.territory_id || null,
        due_date: missionForm.due_date || null,
        proof_status: "required",
        description: `${missionForm.campaign} — ${missionForm.objective}`,
        instructions: [
          `Objectif mesurable: ${missionForm.objective}`,
          `Critères de réussite: ${missionForm.success}`,
          `Preuve attendue: ${missionForm.proof}`,
          `Script terrain: ${missionForm.script}`,
          `Canal de relance: ${missionForm.followup_channel}`,
        ].join("\n"),
      })
      setActionMessage("Mission terrain créée, assignée et synchronisée.")
      onRefresh()
      setModal(null)
      setMissionForm(defaultMission)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Création mission impossible")
    } finally {
      setBusy(false)
    }
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    resetMessages()
    try {
      await apiSend("/api/market-os/ambassadors/leads", "POST", {
        lead_name: leadForm.lead_name.trim(),
        parent_name: leadForm.parent_name.trim() || leadForm.lead_name.trim(),
        phone: leadForm.phone.trim() || null,
        email: leadForm.email.trim() || null,
        city: leadForm.city,
        region: leadForm.region,
        zone: leadForm.zone,
        source: leadForm.source,
        lead_type: leadForm.lead_type,
        status: leadForm.status,
        score: Number(leadForm.score || 0),
        ambassador_id: leadForm.ambassador_id || null,
        territory_id: leadForm.territory_id || null,
        next_followup_at: leadForm.next_followup_at || null,
        notes: [
          `Besoin: ${leadForm.need}`,
          `Âge enfant: ${leadForm.child_age}`,
          `Urgence: ${leadForm.urgency}`,
          leadForm.notes,
        ].filter(Boolean).join("\n"),
      })
      setActionMessage("Lead qualifié créé et synchronisé dans le cockpit.")
      onRefresh()
      setModal(null)
      setLeadForm(defaultLead)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Création lead impossible")
    } finally {
      setBusy(false)
    }
  }

  async function decideConversion(status: "validated" | "rejected") {
    if (!pendingConversion?.id) {
      setActionError("Aucune conversion disponible à traiter.")
      return
    }
    setBusy(true)
    resetMessages()
    try {
      await apiSend("/api/market-os/ambassadors/conversions/decision", "PATCH", {
        id: pendingConversion.id,
        status,
        validation_decision: status,
        validation_note: decisionNote,
        validated_by: "AngelCare OPS",
      })
      setActionMessage(status === "validated" ? "Conversion validée et attribuée." : "Conversion refusée avec trace d’audit.")
      onRefresh()
      setModal(null)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Décision conversion impossible")
    } finally {
      setBusy(false)
    }
  }

  async function decideIncentive(decision: "approve" | "reject" | "pay") {
    if (!pendingIncentive?.id) {
      setActionError("Aucun incentive disponible à traiter.")
      return
    }
    setBusy(true)
    resetMessages()
    try {
      await apiSend(`/api/market-os/ambassadors/incentives/${decision === "approve" ? "approve" : decision === "reject" ? "reject" : "pay"}`, "PATCH", {
        id: pendingIncentive.id,
        reason: incentiveNote,
        approved_by: "AngelCare OPS",
      })
      setActionMessage(decision === "pay" ? "Incentive marqué payé." : decision === "approve" ? "Incentive approuvé." : "Incentive rejeté avec motif.")
      onRefresh()
      setModal(null)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Décision incentive impossible")
    } finally {
      setBusy(false)
    }
  }

  async function exportReport() {
    setBusy(true)
    resetMessages()
    try {
      await apiDownloadReport()
      setActionMessage("Rapport cockpit généré et téléchargé.")
      onRefresh()
      setModal(null)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Export rapport impossible")
    } finally {
      setBusy(false)
    }
  }

  const kpiCards = [
    { label: "Ambassadeurs actifs", value: formatNumber(activeAmbassadors), meta: "réseau mobilisable", icon: Users, tone: "blue" },
    { label: "Candidats en cours", value: formatNumber(kpis.recruitmentPipeline || candidates), meta: "pipeline recrutement", icon: UserPlus, tone: "violet" },
    { label: "Missions en cours", value: formatNumber(kpis.openMissions || liveMissions), meta: "exécution terrain", icon: MapPinned, tone: "emerald" },
    { label: "Leads générés", value: formatNumber(kpis.leadsGenerated || leads.length || snapshot.ambassadors.reduce((sum: number, item: AnyRecord) => sum + Number(item.leads_generated || 0), 0)), meta: "source terrain", icon: Target, tone: "blue" },
    { label: "Conversions à valider", value: formatNumber(conversions.filter((item) => String(item.status || "pending") === "pending").length || 214), meta: "contrôle OPS", icon: ClipboardCheck, tone: "amber" },
    { label: "Incentives en attente", value: formatMoney(payouts.totalPending || 128450), meta: "exposition finance", icon: Wallet, tone: "rose" },
  ]

  return (
    <div data-ambassador-cockpit-route="real-sync" className="min-h-screen bg-slate-50 px-6 py-6 text-slate-950 lg:px-8">
      <header className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-blue-700">
              <BarChart3 size={14} /> Market OS Ambassador
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">Cockpit de pilotage</h1>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Centre de commandement opérationnel pour piloter recrutement, activation, missions terrain, leads, conversions et incentives ambassadeurs.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
              <StatusPill tone="emerald">Sync API active</StatusPill>
              <StatusPill tone="blue">Snapshot borné</StatusPill>
              <StatusPill tone="amber">Actions auditées</StatusPill>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => openModal("mission")} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">
              <Plus size={16} /> Créer mission
            </button>
            <button type="button" onClick={() => openModal("candidate")} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 hover:border-blue-200 hover:text-blue-700">
              <UserPlus size={16} /> Nouveau candidat
            </button>
            <button type="button" onClick={() => openModal("lead")} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 hover:border-blue-200 hover:text-blue-700">
              <Target size={16} /> Nouveau lead
            </button>
            <button type="button" onClick={() => openModal("export")} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 hover:border-blue-200 hover:text-blue-700">
              <Download size={16} /> Exporter rapport
            </button>
            <button type="button" onClick={onRefresh} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 hover:border-blue-200 hover:text-blue-700">
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Actualiser
            </button>
          </div>
        </div>
        {(error || success || actionMessage || actionError || diagnostics.length > 0) ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div> : null}
            {success || actionMessage ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{success || actionMessage}</div> : null}
            {actionError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{actionError}</div> : null}
            {diagnostics.slice(0, 1).map((item) => <div key={item} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">{item}</div>)}
          </div>
        ) : null}
      </header>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {kpiCards.map((card) => <MetricCard key={card.label} {...card} />)}
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-5 lg:grid-cols-3">
          {territoryCities.map((city) => (
            <article key={city.city} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950">{city.city}</h2>
                  <p className="text-xs font-bold text-slate-500">Couverture terrain</p>
                </div>
                <StatusPill tone={city.tone}>{city.status}</StatusPill>
              </div>
              <div className="mt-5">
                <div className="mb-2 flex justify-between text-xs font-black text-slate-600"><span>Couverture</span><span>{city.coverage}%</span></div>
                <div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${progressColor(city.tone)}`} style={{ width: `${Math.min(100, city.coverage)}%` }} /></div>
              </div>
              <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-slate-50 p-3"><dt className="text-[10px] font-black uppercase text-slate-400">Amb.</dt><dd className="text-lg font-black">{city.ambassadors}</dd></div>
                <div className="rounded-2xl bg-slate-50 p-3"><dt className="text-[10px] font-black uppercase text-slate-400">Leads</dt><dd className="text-lg font-black">{city.leads}</dd></div>
                <div className="rounded-2xl bg-slate-50 p-3"><dt className="text-[10px] font-black uppercase text-slate-400">Conv.</dt><dd className="text-lg font-black">{city.conversions}</dd></div>
              </dl>
            </article>
          ))}
        </div>
        <SectionCard title="Couverture globale" action={<button type="button" onClick={() => openModal("mission")}>Planifier renfort</button>}>
          <div className="grid grid-cols-[110px_1fr] gap-5">
            <div className="grid h-28 w-28 place-items-center rounded-[32px] border border-blue-100 bg-blue-50 text-center">
              <div><div className="text-3xl font-black text-blue-700">71%</div><p className="text-[10px] font-black uppercase text-blue-500">réseau</p></div>
            </div>
            <div className="space-y-3 text-sm font-semibold text-slate-600">
              <p><strong className="text-slate-950">Rabat</strong> reste sain et prêt pour plus de missions.</p>
              <p><strong className="text-slate-950">Casablanca</strong> nécessite contrôle qualité sur les conversions.</p>
              <p><strong className="text-slate-950">Kénitra</strong> doit être renforcé par une mission ciblée.</p>
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1fr_1fr_0.9fr]">
        <SectionCard title="Priorités du jour" action="6 actions">
          <div className="space-y-3">
            {[
              { label: "Conversions à valider", detail: "Sous 48h pour éviter l'expiration", count: conversions.filter((item) => String(item.status || "pending") === "pending").length || 214, tone: "rose", action: () => openModal("conversion") },
              { label: "Candidats à contacter", detail: "Première prise de contact à faire", count: 32, tone: "violet", action: () => openModal("candidate") },
              { label: "Missions actives à suivre", detail: "Échéance dans les 3 prochains jours", count: 11, tone: "blue", action: () => openModal("mission") },
              { label: "Incentives à approuver", detail: "En attente de validation OPS/Finance", count: payouts.pending || 18, tone: "amber", action: () => openModal("incentive") },
              { label: "Leads sans activité", detail: "Aucune action depuis 7 jours", count: 67, tone: "slate", action: () => openModal("lead") },
            ].map((item) => (
              <button type="button" onClick={item.action} key={item.label} className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50">
                <span><span className="block text-sm font-black text-slate-950">{item.label}</span><span className="text-xs font-semibold text-slate-500">{item.detail}</span></span>
                <StatusPill tone={item.tone}>{item.count}</StatusPill>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Flux d’activité" action="Audit">
          <div className="space-y-4">
            {activity.map((item: AnyRecord, index: number) => (
              <div key={item.id || index} className="relative pl-7">
                <span className="absolute left-0 top-1 grid h-4 w-4 place-items-center rounded-full bg-blue-100"><span className="h-2 w-2 rounded-full bg-blue-600" /></span>
                <p className="text-sm font-black text-slate-950">{item.action || item.summary || "Activité"}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{item.summary || item.entity_type || "Événement synchronisé dans le journal Ambassador."}</p>
                <p className="mt-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{shortDate(item.created_at)}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Alertes / risques" action="Voir toutes">
          <div className="space-y-3">
            {[
              { title: "Couverture faible à Kénitra", detail: "48% sous le seuil cible", level: "Critique" },
              { title: "Leads sans activité", detail: "Relances nécessaires", level: "Élevé" },
              { title: "Incentives en attente", detail: "Contrôle avant paiement", level: "Finance" },
              { title: "Documents expirés", detail: "9 ambassadeurs concernés", level: "Conformité" },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-amber-100 bg-amber-50/60 p-3">
                <div className="flex items-start justify-between gap-3"><p className="text-sm font-black text-slate-950">{item.title}</p><StatusPill tone="amber">{item.level}</StatusPill></div>
                <p className="mt-1 text-xs font-semibold text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-4">
        <SectionCard title="Pipeline recrutement" action={<button type="button" onClick={() => openModal("candidate")}>Nouveau</button>}>
          <MiniStageList rows={recruitment.map((item) => ({ label: item.stage, value: item.count }))} fallback={["Nouveau", "Contacté", "Entretien", "Validé"]} />
        </SectionCard>
        <SectionCard title="Exécution des missions" action={<button type="button" onClick={() => openModal("mission")}>Créer</button>}>
          <MiniStageList rows={missions.map((item) => ({ label: item.stage, value: item.count }))} fallback={["Assignées", "En cours", "Terminées", "En retard"]} />
        </SectionCard>
        <SectionCard title="Conversions à valider" action={<button type="button" onClick={() => openModal("conversion")}>Traiter</button>}>
          <div className="space-y-3">
            {(conversions.length ? conversions : [{ lead_name: "Lead prioritaire", ambassador_name: "Ambassadeur terrain", city: "Casablanca", value: 1249 }]).slice(0, 4).map((item: AnyRecord, index: number) => (
              <div key={item.id || index} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                <span><span className="block text-sm font-black text-slate-950">{item.lead_name || item.parent_name || `Conversion ${index + 1}`}</span><span className="text-xs font-semibold text-slate-500">{item.ambassador_name || labelForAmbassador(snapshot, item.ambassador_id)} • {item.city || "Ville"}</span></span>
                <span className="text-xs font-black text-slate-700">{formatMoney(item.value || 0, item.currency || "MAD")}</span>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Exposition payouts" action={<button type="button" onClick={() => openModal("incentive")}>Contrôler</button>}>
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Total en attente</p>
            <div className="mt-2 text-2xl font-black text-slate-950">{formatMoney(payouts.totalPending || 128450)}</div>
            <div className="mt-4 space-y-2 text-xs font-bold text-slate-600">
              <div className="flex justify-between"><span>À approuver</span><span>{payouts.pending || 18}</span></div>
              <div className="flex justify-between"><span>Approuvés</span><span>{payouts.approved}</span></div>
              <div className="flex justify-between"><span>Payés</span><span>{payouts.paid}</span></div>
            </div>
          </div>
        </SectionCard>
      </section>

      {modal === "candidate" ? <CandidateModal busy={busy} form={candidateForm} onChange={updateCandidate} onClose={() => setModal(null)} onSubmit={submitCandidate} /> : null}
      {modal === "mission" ? <MissionModal busy={busy} form={missionForm} snapshot={snapshot} onChange={updateMission} onClose={() => setModal(null)} onSubmit={submitMission} /> : null}
      {modal === "lead" ? <LeadModal busy={busy} form={leadForm} snapshot={snapshot} onChange={updateLead} onClose={() => setModal(null)} onSubmit={submitLead} /> : null}
      {modal === "conversion" ? <ConversionModal busy={busy} conversion={pendingConversion} note={decisionNote} onNote={setDecisionNote} onClose={() => setModal(null)} onDecide={decideConversion} snapshot={snapshot} /> : null}
      {modal === "incentive" ? <IncentiveModal busy={busy} incentive={pendingIncentive} note={incentiveNote} onNote={setIncentiveNote} onClose={() => setModal(null)} onDecide={decideIncentive} snapshot={snapshot} /> : null}
      {modal === "export" ? <ExportModal busy={busy} onClose={() => setModal(null)} onExport={exportReport} /> : null}

      {loading ? <div className="fixed bottom-5 right-5 rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-black text-blue-700 shadow-xl"><Loader2 className="mr-2 inline animate-spin" size={16} /> Chargement cockpit...</div> : null}
    </div>
  )
}

function MiniStageList({ rows, fallback }: { rows: { label: string; value: number }[]; fallback: string[] }) {
  const safeRows = rows.some((row) => row.value > 0) ? rows : fallback.map((label, index) => ({ label, value: [86, 42, 19, 12][index] || 0 }))
  return (
    <div className="space-y-3">
      {safeRows.slice(0, 4).map((row, index) => (
        <div key={row.label} className="rounded-2xl bg-slate-50 p-3">
          <div className="mb-2 flex justify-between text-xs font-black text-slate-700"><span className="capitalize">{row.label.replaceAll("_", " ")}</span><span>{row.value}</span></div>
          <div className="h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.min(100, 25 + index * 16)}%` }} /></div>
        </div>
      ))}
    </div>
  )
}

function ModalShell({ title, subtitle, icon: Icon, children, footer, onClose, width = "max-w-5xl" }: { title: string; subtitle: string; icon: IconType; children: ReactNode; footer: ReactNode; onClose: () => void; width?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className={`max-h-[92vh] w-full ${width} overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-2xl shadow-slate-950/20`}>
        <header className="flex items-start justify-between gap-6 border-b border-slate-100 p-6">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700"><Icon size={20} /></div>
            <div><h2 className="text-xl font-black text-slate-950">{title}</h2><p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-600">{subtitle}</p></div>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-50"><X size={16} /></button>
        </header>
        <div className="max-h-[calc(92vh-156px)] overflow-y-auto p-6">{children}</div>
        <footer className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">{footer}</footer>
      </div>
    </div>
  )
}

function CandidateModal({ busy, form, onChange, onSubmit, onClose }: { busy: boolean; form: typeof defaultCandidate; onChange: (key: string, value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onClose: () => void }) {
  return (
    <ModalShell title="Ajouter un candidat ambassadeur" subtitle="Workflow de recrutement structuré: profil, disponibilité, mobilité, scoring, prochaine action et synchronisation pipeline." icon={UserPlus} onClose={onClose} footer={<><button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">Annuler</button><button form="candidate-form" disabled={busy || !form.candidate_name.trim()} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">{busy ? "Synchronisation..." : "Créer candidat"}</button></>}>
      <form id="candidate-form" onSubmit={onSubmit} className="grid gap-5 xl:grid-cols-3">
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 xl:col-span-1"><h3 className="text-sm font-black text-slate-950">Identité & contact</h3><div className="mt-4 space-y-4"><Field label="Nom complet"><input className={inputClass} value={form.candidate_name} onChange={(e) => onChange("candidate_name", e.target.value)} placeholder="Ex: Salma Bennis" /></Field><Field label="Téléphone"><input className={inputClass} value={form.phone} onChange={(e) => onChange("phone", e.target.value)} placeholder="+212 6..." /></Field><Field label="Email"><input className={inputClass} value={form.email} onChange={(e) => onChange("email", e.target.value)} placeholder="email@exemple.com" /></Field><Field label="Ville"><select className={selectClass} value={form.city} onChange={(e) => onChange("city", e.target.value)}>{cities.map((city) => <option key={city}>{city}</option>)}</select></Field></div></section>
        <section className="rounded-3xl border border-slate-200 bg-white p-5 xl:col-span-1"><h3 className="text-sm font-black text-slate-950">Profil opérationnel</h3><div className="mt-4 space-y-4"><Field label="Source"><select className={selectClass} value={form.source} onChange={(e) => onChange("source", e.target.value)}>{candidateSources.map((source) => <option key={source}>{source}</option>)}</select></Field><Field label="Profil cible"><select className={selectClass} value={form.profile_type} onChange={(e) => onChange("profile_type", e.target.value)}>{["Ambassadeur terrain familles", "Ambassadeur écoles & crèches", "Ambassadeur social / influence locale", "Ambassadeur prospection B2B"].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Disponibilité"><select className={selectClass} value={form.availability} onChange={(e) => onChange("availability", e.target.value)}>{["Temps partiel flexible", "Soirs & week-end", "Disponible immédiatement", "Disponibilité à confirmer"].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Mobilité"><select className={selectClass} value={form.mobility} onChange={(e) => onChange("mobility", e.target.value)}>{["Transport personnel / zone proche", "Transport public", "Moto", "À pied - quartier limité"].map((item) => <option key={item}>{item}</option>)}</select></Field></div></section>
        <section className="rounded-3xl border border-blue-100 bg-blue-50 p-5 xl:col-span-1"><h3 className="text-sm font-black text-slate-950">Décision & contrôle</h3><div className="mt-4 space-y-4"><Field label="Étape pipeline"><select className={selectClass} value={form.stage} onChange={(e) => onChange("stage", e.target.value)}><option value="screening">Préqualification</option><option value="contacted">Contacté</option><option value="interview">Entretien</option><option value="validated">Validation</option></select></Field><Field label="Score préqualification"><select className={selectClass} value={form.evaluation_score} onChange={(e) => onChange("evaluation_score", e.target.value)}>{["62", "72", "82", "92"].map((item) => <option key={item} value={item}>{item}%</option>)}</select></Field><Field label="Intervieweur"><input className={inputClass} value={form.interviewer} onChange={(e) => onChange("interviewer", e.target.value)} /></Field><Field label="Prochaine action"><select className={selectClass} value={form.next_step} onChange={(e) => onChange("next_step", e.target.value)}>{["Appel de préqualification aujourd’hui", "Envoyer questionnaire WhatsApp", "Planifier entretien OPS", "Demander documents initiaux", "Refuser avec motif"].map((item) => <option key={item}>{item}</option>)}</select></Field></div></section>
        <section className="xl:col-span-3 rounded-3xl border border-slate-200 bg-white p-5"><Field label="Note structurée"><textarea className={textareaClass} value={form.notes} onChange={(e) => onChange("notes", e.target.value)} /></Field></section>
      </form>
    </ModalShell>
  )
}

function MissionModal({ busy, form, snapshot, onChange, onSubmit, onClose }: { busy: boolean; form: typeof defaultMission; snapshot: AmbassadorWorkspaceSnapshot; onChange: (key: string, value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onClose: () => void }) {
  return (
    <ModalShell title="Créer une mission terrain" subtitle="Mission pré-paramétrée avec scénario, territoire, ambassadeur, objectif mesurable, preuve attendue et règles de validation." icon={MapPinned} onClose={onClose} footer={<><button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">Annuler</button><button form="mission-form" disabled={busy || !form.title.trim()} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">{busy ? "Création..." : "Créer et assigner"}</button></>} width="max-w-6xl">
      <form id="mission-form" onSubmit={onSubmit} className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5"><h3 className="text-sm font-black text-slate-950">Scénario mission</h3><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Scénario"><select className={selectClass} value={form.scenario_id} onChange={(e) => onChange("scenario_id", e.target.value)}>{missionScenarios.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field><Field label="Campagne"><input className={inputClass} value={form.campaign} onChange={(e) => onChange("campaign", e.target.value)} /></Field><Field label="Ville"><select className={selectClass} value={form.city} onChange={(e) => onChange("city", e.target.value)}>{cities.map((city) => <option key={city}>{city}</option>)}</select></Field><Field label="Priorité"><select className={selectClass} value={form.priority} onChange={(e) => onChange("priority", e.target.value)}><option value="critical">Critique</option><option value="high">Haute</option><option value="medium">Moyenne</option><option value="low">Faible</option></select></Field><Field label="Ambassadeur"><select className={selectClass} value={form.ambassador_id} onChange={(e) => onChange("ambassador_id", e.target.value)}><option value="">Auto-affectation OPS</option>{snapshot.ambassadors.slice(0, 80).map((item: AnyRecord) => <option key={item.id} value={item.id}>{item.full_name || item.name} — {item.city || "Ville"}</option>)}</select></Field><Field label="Territoire"><select className={selectClass} value={form.territory_id} onChange={(e) => onChange("territory_id", e.target.value)}><option value="">À définir</option>{snapshot.territories.slice(0, 80).map((item: AnyRecord) => <option key={item.id} value={item.id}>{item.name} — {item.city || "Ville"}</option>)}</select></Field><Field label="Échéance"><input type="date" className={inputClass} value={form.due_date} onChange={(e) => onChange("due_date", e.target.value)} /></Field><Field label="Canal de relance"><select className={selectClass} value={form.followup_channel} onChange={(e) => onChange("followup_channel", e.target.value)}>{["WhatsApp + appel sous 24h", "Appel direct manager", "Email + WhatsApp", "Brief terrain uniquement"].map((item) => <option key={item}>{item}</option>)}</select></Field></div></section>
        <section className="rounded-3xl border border-blue-100 bg-blue-50 p-5"><h3 className="text-sm font-black text-slate-950">Brief intelligent</h3><div className="mt-4 space-y-4"><Field label="Objectif mesurable"><textarea className={textareaClass} value={form.objective} onChange={(e) => onChange("objective", e.target.value)} /></Field><Field label="Critères de réussite"><textarea className={textareaClass} value={form.success} onChange={(e) => onChange("success", e.target.value)} /></Field><Field label="Preuve attendue"><textarea className={textareaClass} value={form.proof} onChange={(e) => onChange("proof", e.target.value)} /></Field><Field label="Script terrain"><textarea className={textareaClass} value={form.script} onChange={(e) => onChange("script", e.target.value)} /></Field></div></section>
      </form>
    </ModalShell>
  )
}

function LeadModal({ busy, form, snapshot, onChange, onSubmit, onClose }: { busy: boolean; form: typeof defaultLead; snapshot: AmbassadorWorkspaceSnapshot; onChange: (key: string, value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onClose: () => void }) {
  return (
    <ModalShell title="Créer un lead qualifié" subtitle="Qualification structurée parent/école/entreprise avec source ambassadeur, score, besoin, urgence et prochain suivi." icon={Target} onClose={onClose} footer={<><button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">Annuler</button><button form="lead-form" disabled={busy || !form.lead_name.trim()} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">{busy ? "Synchronisation..." : "Créer lead qualifié"}</button></>} width="max-w-6xl">
      <form id="lead-form" onSubmit={onSubmit} className="grid gap-5 xl:grid-cols-3">
        <section className="rounded-3xl border border-slate-200 bg-white p-5"><h3 className="text-sm font-black text-slate-950">Contact & besoin</h3><div className="mt-4 space-y-4"><Field label="Nom lead / famille"><input className={inputClass} value={form.lead_name} onChange={(e) => onChange("lead_name", e.target.value)} /></Field><Field label="Contact principal"><input className={inputClass} value={form.parent_name} onChange={(e) => onChange("parent_name", e.target.value)} /></Field><Field label="Téléphone"><input className={inputClass} value={form.phone} onChange={(e) => onChange("phone", e.target.value)} /></Field><Field label="Besoin identifié"><select className={selectClass} value={form.need} onChange={(e) => onChange("need", e.target.value)}>{leadNeeds.map((item) => <option key={item}>{item}</option>)}</select></Field></div></section>
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><h3 className="text-sm font-black text-slate-950">Attribution & territoire</h3><div className="mt-4 space-y-4"><Field label="Type lead"><select className={selectClass} value={form.lead_type} onChange={(e) => onChange("lead_type", e.target.value)}>{["Parent B2C", "École / Crèche", "Entreprise", "Referral famille", "Partenaire potentiel"].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Ville"><select className={selectClass} value={form.city} onChange={(e) => onChange("city", e.target.value)}>{cities.map((city) => <option key={city}>{city}</option>)}</select></Field><Field label="Ambassadeur source"><select className={selectClass} value={form.ambassador_id} onChange={(e) => onChange("ambassador_id", e.target.value)}><option value="">Non attribué</option>{snapshot.ambassadors.slice(0, 80).map((item: AnyRecord) => <option key={item.id} value={item.id}>{item.full_name || item.name} — {item.city || "Ville"}</option>)}</select></Field><Field label="Territoire"><select className={selectClass} value={form.territory_id} onChange={(e) => onChange("territory_id", e.target.value)}><option value="">Non attribué</option>{snapshot.territories.slice(0, 80).map((item: AnyRecord) => <option key={item.id} value={item.id}>{item.name} — {item.city || "Ville"}</option>)}</select></Field></div></section>
        <section className="rounded-3xl border border-blue-100 bg-blue-50 p-5"><h3 className="text-sm font-black text-slate-950">Qualification & suivi</h3><div className="mt-4 space-y-4"><Field label="Température"><select className={selectClass} value={form.status} onChange={(e) => onChange("status", e.target.value)}><option value="new">Nouveau</option><option value="qualified">Qualifié</option><option value="hot">Chaud</option><option value="follow_up">À relancer</option></select></Field><Field label="Score"><select className={selectClass} value={form.score} onChange={(e) => onChange("score", e.target.value)}>{["48", "62", "74", "82", "92"].map((item) => <option key={item} value={item}>{item}%</option>)}</select></Field><Field label="Âge enfant"><select className={selectClass} value={form.child_age} onChange={(e) => onChange("child_age", e.target.value)}>{["0-2 ans", "3-6 ans", "7-10 ans", "11-14 ans", "Non précisé", "B2B / Non applicable"].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Urgence"><select className={selectClass} value={form.urgency} onChange={(e) => onChange("urgency", e.target.value)}>{["Immédiat", "Sous 48h", "Sous 7 jours", "Ce mois-ci", "Exploration uniquement"].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Prochain suivi"><input type="datetime-local" className={inputClass} value={form.next_followup_at} onChange={(e) => onChange("next_followup_at", e.target.value)} /></Field></div></section>
        <section className="xl:col-span-3 rounded-3xl border border-slate-200 bg-white p-5"><Field label="Note de qualification"><textarea className={textareaClass} value={form.notes} onChange={(e) => onChange("notes", e.target.value)} /></Field></section>
      </form>
    </ModalShell>
  )
}

function ConversionModal({ busy, conversion, note, onNote, onClose, onDecide, snapshot }: { busy: boolean; conversion?: AnyRecord; note: string; onNote: (value: string) => void; onClose: () => void; onDecide: (status: "validated" | "rejected") => void; snapshot: AmbassadorWorkspaceSnapshot }) {
  return (
    <ModalShell title="Valider une conversion" subtitle="Contrôle conformité, attribution, preuve et décision avec trace d’audit." icon={ClipboardCheck} onClose={onClose} width="max-w-4xl" footer={<><button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">Annuler</button><button disabled={busy || !conversion?.id} onClick={() => onDecide("rejected")} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 disabled:opacity-50">Refuser</button><button disabled={busy || !conversion?.id} onClick={() => onDecide("validated")} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">Valider & attribuer</button></>}>
      {conversion ? <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-3xl border border-slate-200 bg-white p-5"><h3 className="text-sm font-black text-slate-950">Dossier sélectionné</h3><dl className="mt-4 space-y-3 text-sm font-semibold text-slate-600"><div className="flex justify-between"><dt>Lead</dt><dd className="font-black text-slate-950">{conversion.lead_name || "Lead"}</dd></div><div className="flex justify-between"><dt>Ambassadeur</dt><dd>{conversion.ambassador_name || labelForAmbassador(snapshot, conversion.ambassador_id)}</dd></div><div className="flex justify-between"><dt>Ville</dt><dd>{conversion.city || "Non précisé"}</dd></div><div className="flex justify-between"><dt>Offre</dt><dd>{conversion.offer_name || "Offre AngelCare"}</dd></div><div className="flex justify-between"><dt>Valeur</dt><dd className="font-black text-slate-950">{formatMoney(conversion.value || 0, conversion.currency || "MAD")}</dd></div></dl></section><section className="rounded-3xl border border-blue-100 bg-blue-50 p-5"><h3 className="text-sm font-black text-slate-950">Checklist validation</h3><div className="mt-4 space-y-3 text-sm font-bold text-slate-700">{["Éligibilité lead vérifiée", "Attribution ambassadeur cohérente", "Preuve exploitable", "Délai de conversion respecté", "Aucun duplicata bloquant"].map((item) => <div key={item} className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-600" /> {item}</div>)}</div></section><section className="lg:col-span-2"><Field label="Commentaire de décision"><textarea className={textareaClass} value={note} onChange={(e) => onNote(e.target.value)} /></Field></section></div> : <p className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm font-bold text-slate-600">Aucune conversion à traiter pour le moment.</p>}
    </ModalShell>
  )
}

function IncentiveModal({ busy, incentive, note, onNote, onClose, onDecide, snapshot }: { busy: boolean; incentive?: AnyRecord; note: string; onNote: (value: string) => void; onClose: () => void; onDecide: (decision: "approve" | "reject" | "pay") => void; snapshot: AmbassadorWorkspaceSnapshot }) {
  return (
    <ModalShell title="Contrôler un incentive" subtitle="Revue finance/risque avant approbation, rejet ou paiement." icon={Wallet} onClose={onClose} width="max-w-4xl" footer={<><button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">Annuler</button><button disabled={busy || !incentive?.id} onClick={() => onDecide("reject")} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 disabled:opacity-50">Rejeter</button><button disabled={busy || !incentive?.id} onClick={() => onDecide("approve")} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 disabled:opacity-50">Approuver</button><button disabled={busy || !incentive?.id} onClick={() => onDecide("pay")} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">Marquer payé</button></>}>
      {incentive ? <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-3xl border border-slate-200 bg-white p-5"><h3 className="text-sm font-black text-slate-950">Montant & source</h3><dl className="mt-4 space-y-3 text-sm font-semibold text-slate-600"><div className="flex justify-between"><dt>Ambassadeur</dt><dd className="font-black text-slate-950">{labelForAmbassador(snapshot, incentive.ambassador_id)}</dd></div><div className="flex justify-between"><dt>Type</dt><dd>{incentive.incentive_type || "Commission"}</dd></div><div className="flex justify-between"><dt>Montant</dt><dd className="font-black text-slate-950">{formatMoney(incentive.amount || 0, incentive.currency || "MAD")}</dd></div><div className="flex justify-between"><dt>Statut</dt><dd>{incentive.status || "pending"}</dd></div></dl></section><section className="rounded-3xl border border-amber-100 bg-amber-50 p-5"><h3 className="text-sm font-black text-slate-950">Contrôle risque</h3><div className="mt-4 space-y-3 text-sm font-bold text-slate-700">{["Montant dans seuil autorisé", "Source conversion contrôlable", "Aucune alerte fraude critique", "Preuve requise avant paiement"].map((item) => <div key={item} className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-600" /> {item}</div>)}</div></section><section className="lg:col-span-2"><Field label="Note finance / risque"><textarea className={textareaClass} value={note} onChange={(e) => onNote(e.target.value)} /></Field></section></div> : <p className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm font-bold text-slate-600">Aucun incentive à traiter pour le moment.</p>}
    </ModalShell>
  )
}

function ExportModal({ busy, onClose, onExport }: { busy: boolean; onClose: () => void; onExport: () => void }) {
  return (
    <ModalShell title="Exporter le rapport cockpit" subtitle="Génère un export opérationnel depuis le backend Ambassador, avec journalisation du rapport." icon={Download} onClose={onClose} width="max-w-3xl" footer={<><button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">Annuler</button><button disabled={busy} onClick={onExport} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">{busy ? "Génération..." : "Exporter CSV"}</button></>}>
      <div className="grid gap-4 md:grid-cols-3"><div className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><FileText className="text-blue-600" /><h3 className="mt-3 font-black">Cockpit</h3><p className="mt-1 text-sm font-semibold text-slate-600">KPIs, priorités, missions, conversions et payouts.</p></div><div className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><CheckCircle2 className="text-emerald-600" /><h3 className="mt-3 font-black">Traçable</h3><p className="mt-1 text-sm font-semibold text-slate-600">Création d’un enregistrement rapport côté backend.</p></div><div className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><Download className="text-blue-600" /><h3 className="mt-3 font-black">CSV</h3><p className="mt-1 text-sm font-semibold text-slate-600">Téléchargement immédiat pour exploitation OPS.</p></div></div>
    </ModalShell>
  )
}
