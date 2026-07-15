"use client"

import { useMemo, useState, type ComponentType, type FormEvent, type ReactNode } from "react"
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  Loader2,
  MapPinned,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react"
import {
  AmbassadorCandidateIntakeModal,
  AmbassadorConversionValidationModal,
  AmbassadorIncentiveApprovalModal,
  AmbassadorLeadQualificationModal,
  AmbassadorMissionBuilderModal,
  AmbassadorReportExportModal,
  buildReportPreview,
  type CockpitModalFeedback,
  type ReportPreview,
} from "@/components/market-os/ambassadors/modals/AmbassadorCockpitActionModals"
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
    id: "prospection-parents",
    title: "Prospection parents",
    mission_type: "lead_generation",
    campaign: "Acquisition familles premium",
    objective: "Créer 12 conversations utiles avec des parents du quartier prioritaire",
    proof: "Journal terrain, contacts qualifiés, objections, notes d’urgence",
    script: "Présenter AngelCare comme solution fiable, puis qualifier besoin, budget, quartier et disponibilité.",
    success: "12 conversations, 5 leads chauds, 2 relances qualifiées",
    route_plan: "Départ bureau, boucle quartier prioritaire, retour point de consolidation à J+1",
    sla_closing: "Qualification et rappel sous 24h",
    risk_note: "Sans ambassadeur assigné, la couverture familles baisse et les leads chauffent mal.",
    workload_warning: "Charge modérée. Garder 1 mission active maximum sur ce créneau.",
    notification_preview: "Bonjour {{ambassador_name}}, une mission parents vous est attribuée sur {{city}}. Brief prêt.",
    channel: "WhatsApp + appel",
    validator: "Manager OPS",
    escalation_rule: "Escalader au manager si aucune affectation sous 12h",
  },
  {
    id: "activation-quartier",
    title: "Activation quartier",
    mission_type: "local_activation",
    campaign: "Présence locale de quartier",
    objective: "Installer une présence visible et collecter des recommandations qualifiées",
    proof: "Photos non sensibles, carnet de terrain, points d’entrée, contacts autorisés",
    script: "Approche courte, rassurante et familiale pour ancrer AngelCare dans le quartier.",
    success: "20 contacts, 8 recommandations, 4 rappels sous 48h",
    route_plan: "Boucle proximité matin, contrôle milieu de journée, debrief fin d’après-midi",
    sla_closing: "Boucler les retours terrain avant 18h",
    risk_note: "Un quartier sans animation perd la mémorisation de marque en 72h.",
    workload_warning: "Mission terrain dense. Éviter d’ajouter un second secteur le même jour.",
    notification_preview: "Mission d’activation quartier prête. Merci de confirmer le point de départ.",
    channel: "WhatsApp",
    validator: "OPS terrain",
    escalation_rule: "Escalader si aucune preuve terrain n’est reçue à l’heure limite",
  },
  {
    id: "relance-leads-chauds",
    title: "Relance leads chauds",
    mission_type: "follow_up",
    campaign: "Relance rapide leads chauds",
    objective: "Réactiver des leads chauds et fixer les prochaines étapes commerciales",
    proof: "Historique relance, statut, note de refus, créneau suivant",
    script: "Rappeler l’intérêt exprimé, rassurer sur la disponibilité et cadrer un prochain échange.",
    success: "10 relances, 3 réponses, 2 rendez-vous de qualification",
    route_plan: "Téléphone d’abord, WhatsApp ensuite, clôture par mise à jour CRM",
    sla_closing: "Contact sous 2h puis suivi sous 24h",
    risk_note: "Sans relance, le lead chaud retombe en cold en moins de 48h.",
    workload_warning: "Tranche courte mais sensible. Prioriser les leads au score le plus haut.",
    notification_preview: "Relance prioritaire lancée sur les leads chauds, réponse attendue rapidement.",
    channel: "Appel + WhatsApp",
    validator: "Manager conversion",
    escalation_rule: "Escalader si aucune réponse après 2 tentatives",
  },
  {
    id: "visite-partenaire",
    title: "Visite partenaire",
    mission_type: "partner_outreach",
    campaign: "Prospection partenaires locaux",
    objective: "Obtenir un rendez-vous utile avec un partenaire ciblé",
    proof: "Carte de visite, nom du décideur, intérêt capturé, prochain rendez-vous",
    script: "Positionner AngelCare comme source de confiance pour familles, événements ou prescriptions.",
    success: "6 contacts décideurs, 2 rendez-vous, 1 dossier ouvert",
    route_plan: "Visites en séquence courte avec pause de consolidation entre partenaires",
    sla_closing: "Retour de compte-rendu sous 12h",
    risk_note: "Sans confirmation du décideur, la visite perd sa valeur commerciale.",
    workload_warning: "Mission relationnelle: garder un seul partenaire prioritaire par créneau.",
    notification_preview: "Nouvelle visite partenaire prête. Brief et objectif envoyés.",
    channel: "Email + WhatsApp",
    validator: "Partnership Lead",
    escalation_rule: "Escalader si le rendez-vous n’est pas confirmé 24h avant",
  },
  {
    id: "evenement-local",
    title: "Événement local",
    mission_type: "community_event",
    campaign: "Activation événementielle locale",
    objective: "Capter des leads sur un événement à forte fréquentation",
    proof: "Liste présence, photos autorisées, contacts recueillis, feedback",
    script: "Accroche courte, présentation de la valeur AngelCare et collecte d’intérêt rapide.",
    success: "40 interactions, 12 leads, 1 partenariat événementiel",
    route_plan: "Préparation amont, présence pendant le pic, consolidation à chaud",
    sla_closing: "Remonter les leads dans les 3 heures",
    risk_note: "Sans couverture sur le créneau de pointe, le trafic utile disparaît.",
    workload_warning: "Mission à forte intensité; pas de chevauchement avec une autre activation.",
    notification_preview: "Événement local confirmé. Vérifiez la logistique et le matériel.",
    channel: "WhatsApp",
    validator: "OPS event",
    escalation_rule: "Escalader si la logistique n’est pas confirmée 48h avant",
  },
  {
    id: "collecte-recommandations",
    title: "Collecte recommandations",
    mission_type: "referral_collection",
    campaign: "Bouche-à-oreille structuré",
    objective: "Obtenir des recommandations de confiance et les qualifier",
    proof: "Liste contacts, source recommandation, notes de confiance, autorisation de rappel",
    script: "Demander des recommandations ciblées en gardant un ton familial et rassurant.",
    success: "15 recommandations, 5 contacts joignables, 2 leads chauds",
    route_plan: "Parcours par cercle de confiance, puis consolidation dans le CRM",
    sla_closing: "Rappel des recommandations sous 24h",
    risk_note: "Sans suivi rapide, la recommandation perd sa chaleur initiale.",
    workload_warning: "Bonne mission de réseau mais nécessite une bonne discipline de saisie.",
    notification_preview: "Objectif recommandation envoyé à l’ambassadeur. Réseau à activer.",
    channel: "WhatsApp",
    validator: "Manager OPS",
    escalation_rule: "Escalader si moins de 3 recommandations sont obtenues à mi-parcours",
  },
  {
    id: "activation-code-promo",
    title: "Activation code promo",
    mission_type: "promotion_activation",
    campaign: "Activation code promo",
    objective: "Réactiver des prospects dormants avec une offre claire",
    proof: "Liste contacts, code transmis, réponses, status d’usage",
    script: "Présenter le bénéfice du code promo, puis pousser une prise de rendez-vous rapide.",
    success: "25 contacts, 8 utilisations, 3 rendez-vous qualifiés",
    route_plan: "Téléphone + WhatsApp, puis relance ciblée sur les non-répondants",
    sla_closing: "Boucler les conversions en 48h",
    risk_note: "Sans assignee, le promo rate le pic de conversion.",
    workload_warning: "Mission commerciale sensible: garder des créneaux de relance dédiés.",
    notification_preview: "Code promo prêt à activer. Brief de conversion envoyé.",
    channel: "WhatsApp + appel",
    validator: "Sales OPS",
    escalation_rule: "Escalader si aucun retour après diffusion du code",
  },
  {
    id: "controle-qualite-terrain",
    title: "Contrôle qualité terrain",
    mission_type: "quality_control",
    campaign: "Qualité terrain & conformité",
    objective: "Vérifier le respect du playbook terrain et la qualité des preuves",
    proof: "Checklist, preuves terrain, écart constaté, note corrective",
    script: "Contrôler les standards, relever les écarts et documenter les correctifs.",
    success: "100% des points clés vérifiés, 0 écart critique non traité",
    route_plan: "Contrôle ciblé, vérification sur site, debrief qualité",
    sla_closing: "Rapport qualité sous 12h",
    risk_note: "Un contrôle non réalisé laisse les écarts s’installer dans les équipes terrain.",
    workload_warning: "Mission de supervision; réserver du temps de rédaction après visite.",
    notification_preview: "Contrôle qualité planifié. Les standards à vérifier ont été envoyés.",
    channel: "Email + WhatsApp",
    validator: "Head of OPS",
    escalation_rule: "Escalader immédiatement tout écart critique",
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
const preferredChannels = ["WhatsApp", "Appel direct", "Email", "Visite terrain", "LinkedIn"]
const availabilityDays = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
const availabilitySlots = ["Matin", "Midi", "Après-midi", "Soir", "Week-end"]
const missionModes = ["solo", "binome", "equipe"]
const reportTypes = ["ambassadors", "missions", "recruitment", "leads", "conversions", "incentives", "territories"]
const reportFormats = ["CSV", "PDF"]
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
  main_city: "Rabat",
  region: "Rabat-Salé-Kénitra",
  district: "",
  approx_address: "",
  zone: "",
  source: "Referral ambassadeur",
  source_campaign: "",
  campaign: "",
  internal_referrer: "",
  preferred_channel: "WhatsApp",
  languages: "Arabe dialectal, Français",
  stage: "screening",
  profile_type: "Ambassadeur terrain familles",
  terrain_mode: "Présentiel",
  commercial_experience: "À préciser",
  field_experience: "À préciser",
  family_knowledge: "À préciser",
  local_network: "Quartier et communauté engagés",
  communication_confidence: "Bonne",
  digital_confidence: "Moyenne",
  whatsapp_crm_capability: "WhatsApp fiable, CRM à confirmer",
  confidence_estimate: "72",
  profile_notes: "",
  network_strength: "Quartier et communauté engagés",
  availability_days: "Lundi",
  availability_slots: "Matin",
  availability: "Temps partiel flexible",
  mobility: "Transport public",
  weekly_capacity: "12 h / semaine",
  action_radius: "3 km",
  accepted_zones: "Centre / quartier prioritaire",
  personal_constraints: "Aucune déclarée",
  risk_notes: "Vérifier disponibilité, mobilité et aisance relationnelle.",
  quality_checklist: "Identité, mobilité, disponibilité, digital, réseau",
  prequal_score: "72",
  compatibility_city: "Bonne",
  compatibility_profile: "Bonne",
  compatibility_availability: "Moyenne",
  evaluation_score: "72",
  pipeline_stage: "screening",
  responsible_owner: "AngelCare OPS",
  interviewer: "Manager OPS",
  next_action: "Appel de préqualification aujourd’hui",
  followup_date: "",
  schedule_interview: "yes",
  documents_to_request: "CNI, justificatif de domicile, références",
  internal_notes: "",
  validation_checklist: "Identité, mobilité, disponibilité, digital, réseau",
  next_step: "Appel de préqualification aujourd’hui",
  notes: "Préqualification à réaliser: disponibilité, aisance communication, connaissance quartier, capacité à qualifier un parent.",
}

const defaultLead = {
  lead_name: "",
  contact_name: "",
  parent_name: "",
  phone: "",
  email: "",
  whatsapp_available: "yes",
  city: "Rabat",
  region: "Rabat-Salé-Kénitra",
  district: "Centre",
  zone: "Centre / quartier prioritaire",
  source: "Referral ambassadeur",
  source_campaign: "",
  ambassador_source: "",
  territory: "",
  lead_type: "Parent / famille",
  status: "qualified",
  temperature: "Préqualifié",
  qualification_score: "82",
  score: "82",
  conversion_probability: "68",
  maturity: "À valider",
  duplicate_risk: "Faible",
  quality_score: "78",
  budget_estimate: "À confirmer",
  owner: "AngelCare OPS",
  ambassador_id: "",
  territory_id: "",
  preferred_language: "Français",
  language: "Français",
  preferred_channel: "WhatsApp",
  next_channel: "WhatsApp",
  need: "Garde enfant à domicile",
  identified_need: "Garde enfant à domicile",
  child_age: "3-6 ans",
  estimated_volume: "",
  frequency: "Régulier",
  urgency: "Sous 7 jours",
  desired_time: "Matin et après-midi",
  establishment_name: "",
  need_type: "",
  potential_volume: "",
  decision_delay: "",
  decision_maker: "",
  probable_budget: "",
  followup_channel: "WhatsApp",
  next_followup_at: "",
  next_action: "Relance WhatsApp",
  whatsapp_message: "",
  structured_note: "",
  quality_checklist: "Contact normalisé, besoin clarifié, attribution, relance datée",
  internal_note: "",
  notes: "Lead à qualifier: besoin, quartier exact, budget indicatif, horaire, urgence, confiance et prochaines disponibilités.",
}

const defaultMission = {
  scenario_id: missionScenarios[0].id,
  title: missionScenarios[0].title,
  mission_type: missionScenarios[0].mission_type,
  campaign: missionScenarios[0].campaign,
  priority: "haute",
  status: "assigned",
  city: "Rabat",
  region: "Rabat-Salé-Kénitra",
  zone: "Centre / quartier prioritaire",
  mission_mode: "Présentiel",
  deadline: "",
  duration_estimated: "2h",
  ambassador_id: "",
  territory_id: "",
  territory: "",
  due_date: "",
  assignment_notes: "",
  objective: missionScenarios[0].objective,
  objective_secondary: "À préciser",
  leads_expected: "12",
  conversations_expected: "12",
  rendezvous_expected: "2",
  conversions_potential: "3",
  coverage_target: "1 zone",
  minimum_threshold: "3 leads",
  execution_channel: missionScenarios[0].channel,
  channel: missionScenarios[0].channel,
  script_recommended: missionScenarios[0].script,
  objections: "Disponibilité, prix, confiance, délai",
  offer_code: "Code promo AngelCare",
  support_playbook: "Playbook terrain standard",
  playbook: "Playbook terrain standard",
  safety_instructions: "Respecter les règles de sécurité et de confidentialité",
  brand_instructions: "Ton premium, rassurant, familial",
  proof_expected: missionScenarios[0].proof,
  proof: missionScenarios[0].proof,
  script: missionScenarios[0].script,
  success: missionScenarios[0].success,
  success_criteria: missionScenarios[0].success,
  route_plan: missionScenarios[0].route_plan,
  sla_closing: missionScenarios[0].sla_closing,
  risk_note: missionScenarios[0].risk_note,
  workload_warning: missionScenarios[0].workload_warning,
  overloaded_warning: missionScenarios[0].workload_warning,
  validator: missionScenarios[0].validator,
  escalation_rule: missionScenarios[0].escalation_rule,
  followup_channel: missionScenarios[0].channel,
  notification_preview: missionScenarios[0].notification_preview,
  notify_ambassador: "yes",
  rejection_conditions: "Proof missing, route not followed, SLA missed",
  operator_note: "",
  operator_notes: "",
  instructions: missionScenarios[0].script,
}

const defaultReportConfig = {
  report_type: "ambassadors",
  period_start: "",
  period_end: "",
  cities: "Rabat, Casablanca",
  ambassadors: "",
  sections: "KPIs, missions, recruitment, leads, conversions, incentives",
  format: "csv",
  recipients: "OPS, Finance",
  approval_signature: "AngelCare OPS",
  signature_note: "AngelCare OPS",
  export_conditions: "Export CSV backend uniquement ; PDF indisponible tant que l’infrastructure ne le prend pas en charge.",
  export_scope: "Cockpit ambassadeurs",
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

function Field({ label, children, hint, className = "" }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <div className="mt-2">{children}</div>
      {hint ? <p className="mt-1 text-[11px] font-semibold text-slate-500">{hint}</p> : null}
    </label>
  )
}

const inputClass = "w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
const selectClass = inputClass
const textareaClass = `${inputClass} min-h-[96px] resize-none`

function initials(value?: string | null) {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return "AC"
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("")
}

function scoreBand(score: number) {
  if (score >= 85) return { label: "Prêt entretien", tone: "emerald" }
  if (score >= 70) return { label: "Préqualifié", tone: "blue" }
  return { label: "Incomplet", tone: "amber" }
}

function leadBand(score: number) {
  if (score >= 85) return { label: "Commercialement chaud", tone: "emerald" }
  if (score >= 70) return { label: "À suivre", tone: "blue" }
  return { label: "Faible signal", tone: "amber" }
}

function readSubmitMode(event: FormEvent<HTMLFormElement>, fallback: string) {
  const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
  return submitter?.dataset.mode || fallback
}

function selectedMissionScenario(scenarioId: string) {
  return missionScenarios.find((item) => item.id === scenarioId) || missionScenarios[0]
}

function describeMissing(missing: string[]) {
  return missing.length ? `Bloqué: ${missing.join(", ")}` : ""
}

function candidateCreateMissingFields(form: typeof defaultCandidate) {
  const missing: string[] = []
  if (!form.candidate_name.trim()) missing.push("Nom complet")
  if (!form.phone.trim()) missing.push("Téléphone")
  if (!form.email.trim()) missing.push("Email")
  if (!form.city.trim()) missing.push("Ville")
  if (!form.district.trim()) missing.push("Quartier")
  if (!form.approx_address.trim() && !form.zone.trim()) missing.push("Adresse approximative")
  if (!form.source.trim()) missing.push("Source candidat")
  if (!form.source_campaign.trim() && !form.campaign.trim()) missing.push("Code source / campagne")
  if (!form.languages.trim()) missing.push("Langues")
  if (!form.preferred_channel.trim()) missing.push("Canal préféré")
  if (!form.commercial_experience.trim() || form.commercial_experience.includes("À préciser")) missing.push("Expérience commerciale")
  if (!form.field_experience.trim() || form.field_experience.includes("À préciser")) missing.push("Expérience terrain")
  if (!form.availability_days.trim()) missing.push("Jours disponibles")
  if (!form.availability_slots.trim()) missing.push("Créneaux")
  if (!form.mobility.trim()) missing.push("Mobilité")
  if (!form.pipeline_stage.trim()) missing.push("Étape pipeline")
  if (!form.responsible_owner.trim()) missing.push("Responsable")
  if (!form.next_action.trim()) missing.push("Prochaine action")
  if (!form.followup_date.trim()) missing.push("Date de relance")
  return missing
}

function candidateInterviewMissingFields(form: typeof defaultCandidate) {
  const missing = candidateCreateMissingFields(form)
  if (form.schedule_interview !== "yes") missing.push("Planifier entretien = oui")
  if (!form.interviewer.trim()) missing.push("Intervieweur")
  if (!form.documents_to_request.trim()) missing.push("Documents à demander")
  if (!form.validation_checklist.trim() && !form.quality_checklist.trim()) missing.push("Checklist de validation")
  return missing
}

function candidateLiveScore(form: typeof defaultCandidate) {
  const base = Number(form.prequal_score || form.confidence_estimate || 0)
  const bonuses = [
    form.availability.includes("Disponible") ? 8 : form.availability.includes("Temps partiel") ? 4 : 0,
    form.mobility.includes("Transport personnel") || form.mobility.includes("Moto") ? 6 : 2,
    form.communication_confidence === "Bonne" || form.communication_confidence === "Très bonne" ? 6 : form.communication_confidence === "Moyenne" ? 3 : 0,
    form.digital_confidence === "Bonne" || form.digital_confidence === "Très bonne" ? 5 : form.digital_confidence === "Moyenne" ? 2 : 0,
    form.local_network.trim() ? 5 : 0,
  ]
  return Math.max(0, Math.min(100, base + bonuses.reduce((sum, value) => sum + value, 0)))
}

function candidateReadiness(form: typeof defaultCandidate) {
  const score = candidateLiveScore(form)
  const missing = candidateCreateMissingFields(form)
  const band = scoreBand(score)
  if (missing.length) {
    return { score, missing, interviewMissing: candidateInterviewMissingFields(form), status: "Incomplet" as const, tone: "amber", label: "Compléter le dossier" as const, band }
  }
  if (score >= 85) {
    return { score, missing, interviewMissing: candidateInterviewMissingFields(form), status: "Prêt entretien" as const, tone: "emerald", label: "Créer + planifier entretien" as const, band }
  }
  return { score, missing, interviewMissing: candidateInterviewMissingFields(form), status: "Préqualifié" as const, tone: "blue", label: "Créer candidat" as const, band }
}

function candidateChecklist(form: typeof defaultCandidate) {
  return [
    { label: "Identité vérifiée", done: Boolean(form.candidate_name.trim() && form.phone.trim() && form.email.trim()), detail: "Nom, téléphone et email" },
    { label: "Mobilité claire", done: Boolean(form.mobility.trim() && form.action_radius.trim() && form.accepted_zones.trim()), detail: "Zone et transport" },
    { label: "Disponibilité cadrée", done: Boolean(form.availability_days.trim() && form.availability_slots.trim() && form.weekly_capacity.trim()), detail: "Temps et créneaux" },
    { label: "Compétence digitale", done: Boolean(form.digital_confidence === "Bonne" || form.digital_confidence === "Très bonne" || form.whatsapp_crm_capability.includes("opérationnels")), detail: "WhatsApp / CRM" },
    { label: "Risque noté", done: Boolean(form.risk_notes.trim() || form.internal_notes.trim()), detail: "Blocage ou vigilance" },
  ]
}

function leadCreateMissingFields(form: typeof defaultLead) {
  const missing: string[] = []
  if (!form.lead_name.trim() && !form.contact_name.trim()) missing.push("Nom du contact")
  if (!form.phone.trim()) missing.push("Téléphone")
  if (!form.email.trim()) missing.push("Email")
  if (!form.city.trim()) missing.push("Ville")
  if (!form.district.trim()) missing.push("District")
  if (!form.zone.trim()) missing.push("Zone")
  if (!form.lead_type.trim()) missing.push("Type lead")
  if (!form.source.trim()) missing.push("Source lead")
  if (!form.source_campaign.trim() && !form.ambassador_source.trim()) missing.push("Campagne / code promo")
  if (!form.urgency.trim()) missing.push("Urgence")
  if (!form.budget_estimate.trim()) missing.push("Budget")
  if (!form.ambassador_id.trim() && !form.ambassador_source.trim()) missing.push("Ambassadeur source")
  if (!form.territory_id.trim() && !form.territory.trim()) missing.push("Territoire")
  if (!form.owner.trim()) missing.push("Owner")
  return missing
}

function leadLiveScore(form: typeof defaultLead) {
  const base = Number(form.score || form.quality_score || 0)
  const urgencyBonus = form.urgency.includes("Immédiat") || form.urgency.includes("48h") ? 8 : form.urgency.includes("7 jours") ? 4 : 0
  const whatsappBonus = form.whatsapp_available === "yes" ? 5 : 0
  const budgetBonus = /[1-9]/.test(form.budget_estimate) ? 4 : 0
  const attributionBonus = form.ambassador_id && form.territory_id ? 6 : 0
  return Math.max(0, Math.min(100, base + urgencyBonus + whatsappBonus + budgetBonus + attributionBonus))
}

function leadTemperature(form: typeof defaultLead) {
  const score = leadLiveScore(form)
  if (form.status === "hot" || score >= 85) return { label: "Chaud", tone: "emerald" }
  if (form.status === "qualified" || score >= 70) return { label: "Préqualifié", tone: "blue" }
  return { label: "À reprendre", tone: "amber" }
}

function leadChecklist(form: typeof defaultLead) {
  return [
    { label: "Contact normalisé", done: Boolean(form.lead_name.trim() && form.phone.trim()), detail: "Nom et téléphone" },
    { label: "WhatsApp prêt", done: form.whatsapp_available === "yes", detail: "Canal de relance" },
    { label: "Besoin cadré", done: Boolean(form.need.trim() && form.child_age.trim()), detail: "Âge ou volume" },
    { label: "Attribution prête", done: Boolean(form.ambassador_id.trim() && form.territory_id.trim()), detail: "Source et territoire" },
    { label: "Relance datée", done: Boolean(form.next_followup_at.trim()), detail: "SLA suivi" },
  ]
}

function missionMissingFields(form: typeof defaultMission) {
  const missing: string[] = []
  if (!form.title.trim()) missing.push("Titre mission")
  if (!form.campaign.trim()) missing.push("Campagne")
  if (!form.city.trim()) missing.push("Ville")
  if (!form.zone.trim()) missing.push("Zone")
  if (!form.territory_id.trim() && !form.territory.trim()) missing.push("Territoire")
  if (!form.ambassador_id.trim()) missing.push("Ambassadeur")
  if (!form.due_date.trim() && !form.deadline.trim()) missing.push("Échéance")
  if (!form.duration_estimated.trim()) missing.push("Durée estimée")
  if (!form.execution_channel.trim() && !form.channel.trim()) missing.push("Canal d'exécution")
  if (!form.mission_mode.trim()) missing.push("Mode mission")
  if (!form.objective.trim()) missing.push("Objectif")
  if (!form.leads_expected.trim()) missing.push("Leads attendus")
  if (!form.conversations_expected.trim()) missing.push("Conversations attendues")
  if (!form.proof.trim()) missing.push("Preuve attendue")
  if (!form.validator.trim()) missing.push("Responsable validation")
  if (!form.sla_closing.trim()) missing.push("SLA de clôture")
  if (!form.escalation_rule.trim()) missing.push("Escalade")
  return missing
}

function reportMissingFields(form: typeof defaultReportConfig) {
  const missing: string[] = []
  if (!form.report_type.trim()) missing.push("Type de rapport")
  if (!form.period_start.trim()) missing.push("Début de période")
  if (!form.period_end.trim()) missing.push("Fin de période")
  if (!form.sections.trim()) missing.push("Sections incluses")
  if (!form.format.trim()) missing.push("Format")
  if (!form.recipients.trim()) missing.push("Destinataires")
  if (!form.approval_signature.trim() && !form.signature_note.trim()) missing.push("Signature d'approbation")
  return missing
}

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

async function apiDownloadReport(payload: AnyRecord) {
  const response = await fetch("/api/market-os/ambassadors/reports/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      report_type: payload.report_type || "ambassadors",
      title: payload.title || "Cockpit ambassadeurs - Export opérationnel",
      period_start: payload.period_start || null,
      period_end: payload.period_end || null,
      generated_by: payload.generated_by || "AngelCare OPS",
      filters: payload.filters || {},
    }),
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
  const [reportForm, setReportForm] = useState(defaultReportConfig)
  const [decisionNote, setDecisionNote] = useState("Validation conforme: source, preuve, attribution et délai vérifiés par OPS.")
  const [incentiveNote, setIncentiveNote] = useState("Contrôle conforme: conversion source vérifiée, montant cohérent, aucune alerte fraude bloquante.")
  const [reportRevision, setReportRevision] = useState(0)

  const territoryCities = useMemo(() => pickCities(snapshot), [snapshot])
  const performers = useMemo(() => topAmbassadors(snapshot), [snapshot])
  const activity = useMemo(() => recentActivity(snapshot), [snapshot])
  const recruitment = useMemo(() => recruitmentStageSummary(snapshot.recruitment), [snapshot.recruitment])
  const missions = useMemo(() => missionStatusSummary(snapshot.missions), [snapshot.missions])
  const payouts = useMemo(() => payoutSummary(snapshot.incentives), [snapshot.incentives])
  const reportPreview = useMemo(() => buildReportPreview(snapshot, reportForm), [snapshot, reportForm, reportRevision])
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

  function closeModal() {
    setModal(null)
    resetMessages()
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
    if (kind === "export") {
      setReportForm(defaultReportConfig)
      setReportRevision((value) => value + 1)
    }
  }

  function updateCandidate(key: string, value: string) {
    setCandidateForm((form) => {
      const next: AnyRecord = { ...form, [key]: value, region: key === "city" ? regionsByCity[value] || form.region : form.region }
      if (key === "campaign") next.source_campaign = value
      if (key === "zone") next.accepted_zones = value
      if (key === "internal_referrer") next.profile_notes = value
      if (key === "terrain_mode") next.availability = value
      if (key === "quality_checklist") next.validation_checklist = value
      return next as typeof defaultCandidate
    })
  }

  function updateLead(key: string, value: string) {
    setLeadForm((form) => {
      const next: AnyRecord = { ...form, [key]: value, region: key === "city" ? regionsByCity[value] || form.region : form.region }
      if (key === "contact_name" || key === "lead_name") {
        next.lead_name = value
        next.contact_name = value
      }
      if (key === "qualification_score") {
        next.score = value
        next.quality_score = value
      }
      if (key === "language") next.preferred_language = value
      if (key === "next_channel") next.followup_channel = value
      if (key === "identified_need") next.need = value
      if (key === "estimated_volume") next.potential_volume = value
      if (key === "probable_budget") next.budget_estimate = value
      if (key === "ambassador_source") next.ambassador_id = value
      if (key === "territory") next.territory_id = value
      if (key === "structured_note") next.internal_note = value
      if (key === "quality_checklist") next.notes = value
      if (key === "lead_type") {
        const isB2B = ["Entreprise", "Partenaire local", "Hôtel / événementiel", "Professionnel santé", "Santé / orthophoniste / pédiatre", "École / crèche", "École / Crèche"].includes(value)
        next.child_age = isB2B ? "20-50 salariés" : "3-6 ans"
      }
      return next as typeof defaultLead
    })
  }

  function updateMission(key: string, value: string) {
    if (key === "scenario_id") {
      const scenario = selectedMissionScenario(value)
      setMissionForm((form) => ({
        ...form,
        scenario_id: scenario.id,
        title: scenario.title,
        mission_type: scenario.mission_type,
        campaign: scenario.campaign,
        status: form.status || "assigned",
        objective: scenario.objective,
        proof: scenario.proof,
        script: scenario.script,
        success: scenario.success,
        route_plan: scenario.route_plan,
        sla_closing: scenario.sla_closing,
        risk_note: scenario.risk_note,
        workload_warning: scenario.workload_warning,
        validator: scenario.validator,
        escalation_rule: scenario.escalation_rule,
        followup_channel: scenario.channel,
        notification_preview: scenario.notification_preview,
        instructions: scenario.script,
      }))
      return
    }
    setMissionForm((form) => {
      const next: AnyRecord = { ...form, [key]: value, region: key === "city" ? regionsByCity[value] || form.region : form.region }
      if (key === "deadline") next.due_date = value
      if (key === "territory") next.territory_id = value
      if (key === "channel") next.execution_channel = value
      if (key === "playbook") next.support_playbook = value
      if (key === "operator_notes") next.operator_note = value
      if (key === "overloaded_warning") next.workload_warning = value
      if (key === "success_criteria") next.success = value
      return next as typeof defaultMission
    })
  }

  function updateReport(key: string, value: string) {
    setReportForm((form) => {
      const next: AnyRecord = { ...form, [key]: value }
      if (key === "signature_note") next.approval_signature = value
      if (key === "export_scope") next.export_conditions = value
      if (key === "format") next.format = value.toLowerCase()
      return next as typeof defaultReportConfig
    })
  }

  async function submitCandidate(mode: "draft" | "create" | "interview") {
    setBusy(true)
    resetMessages()
    try {
      const readiness = candidateReadiness(candidateForm)
      const createMissing = candidateCreateMissingFields(candidateForm)
      const interviewMissing = candidateInterviewMissingFields(candidateForm)
      if (mode === "create" && createMissing.length) {
        throw new Error(`Dossier incomplet: ${createMissing.slice(0, 3).join(", ")}`)
      }
      if (mode === "interview" && interviewMissing.length) {
        throw new Error(`Dossier incomplet: ${interviewMissing.slice(0, 3).join(", ")}`)
      }
      const pipelineStage = mode === "draft" ? "sourced" : mode === "interview" ? "interview" : readiness.status === "Prêt entretien" ? "interview" : "screening"
      const nextStep = mode === "draft" ? "Brouillon recrutement OPS" : mode === "interview" ? "Créer + planifier entretien OPS" : candidateForm.next_action
      const workflowNotes = [
        `Mode: ${mode}`,
        `Pipeline stage: ${pipelineStage}`,
        `Score live: ${readiness.score} | Readiness: ${readiness.status}`,
        `Identité: ${candidateForm.candidate_name} | ${candidateForm.phone} | ${candidateForm.email}`,
        `Localisation: ${candidateForm.city} / ${candidateForm.district} / ${candidateForm.approx_address}`,
        `Source: ${candidateForm.source} | Campagne: ${candidateForm.source_campaign} | Canal: ${candidateForm.preferred_channel}`,
        `Profil terrain: ${candidateForm.commercial_experience} | ${candidateForm.field_experience} | ${candidateForm.family_knowledge}`,
        `Réseau & digital: ${candidateForm.local_network} | WhatsApp/CRM: ${candidateForm.whatsapp_crm_capability} | ${candidateForm.digital_confidence}`,
        `Disponibilité: ${candidateForm.availability_days} | ${candidateForm.availability_slots} | ${candidateForm.weekly_capacity}`,
        `Mobilité: ${candidateForm.mobility} | Rayon: ${candidateForm.action_radius} | Zones: ${candidateForm.accepted_zones}`,
        `Préqualification: ${candidateForm.prequal_score}% | Ville: ${candidateForm.compatibility_city} | Profil: ${candidateForm.compatibility_profile} | Dispo: ${candidateForm.compatibility_availability}`,
        `Workflow RH/OPS: ${candidateForm.pipeline_stage} | Responsable: ${candidateForm.responsible_owner} | Intervieweur: ${candidateForm.interviewer} | Relance: ${candidateForm.followup_date}`,
        `Plan entretien: ${candidateForm.schedule_interview} | Documents: ${candidateForm.documents_to_request}`,
        `Checklist: ${candidateForm.validation_checklist}`,
        `Risque: ${candidateForm.risk_notes}`,
        `Note interne: ${candidateForm.internal_notes || candidateForm.profile_notes}`,
      ].filter(Boolean)
      await apiSend("/api/market-os/ambassadors/recruitment", "POST", {
        candidate_name: candidateForm.candidate_name.trim() || (mode === "draft" ? "Brouillon candidat" : candidateForm.candidate_name.trim()),
        phone: candidateForm.phone.trim() || null,
        email: candidateForm.email.trim() || null,
        city: candidateForm.city,
        region: candidateForm.region,
        source: candidateForm.source,
        stage: pipelineStage,
        evaluation_score: readiness.score,
        interviewer: candidateForm.interviewer,
        next_step: nextStep,
        notes: [...workflowNotes, candidateForm.notes].filter(Boolean).join("\n"),
      })
      setActionMessage(mode === "draft" ? "Brouillon candidat enregistré." : mode === "interview" ? "Candidat créé et entretien préparé." : "Candidat créé et synchronisé dans le pipeline recrutement.")
      onRefresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Création candidat impossible")
    } finally {
      setBusy(false)
    }
  }

  async function submitMission(mode: "draft" | "create" | "notify") {
    setBusy(true)
    resetMessages()
    try {
      const requiredMissionFields = missionMissingFields(missionForm)
      if (mode !== "draft" && requiredMissionFields.length) {
        throw new Error(`Mission incomplète: ${requiredMissionFields.slice(0, 3).join(", ")}`)
      }
      const scenario = selectedMissionScenario(missionForm.scenario_id)
      await apiSend("/api/market-os/ambassadors/missions", "POST", {
        title: missionForm.title,
        mission_type: missionForm.mission_type,
        priority: missionForm.priority,
        status: mode === "draft" ? "draft" : missionForm.status,
        city: missionForm.city,
        region: missionForm.region,
        ambassador_id: missionForm.ambassador_id || null,
        territory_id: missionForm.territory_id || null,
        due_date: missionForm.due_date || null,
        proof_status: "required",
        description: `${missionForm.campaign} — ${missionForm.objective}`,
        instructions: [
          `Scénario: ${scenario.title}`,
          `Mode mission: ${missionForm.mission_mode}`,
          `Durée estimée: ${missionForm.duration_estimated}`,
          `Canal d'exécution: ${missionForm.execution_channel}`,
          `Objectif mesurable: ${missionForm.objective}`,
          `Objectif secondaire: ${missionForm.objective_secondary}`,
          `Objectifs quantifiés: leads ${missionForm.leads_expected}, conversations ${missionForm.conversations_expected}, rendez-vous ${missionForm.rendezvous_expected}, conversions ${missionForm.conversions_potential}`,
          `Couverture zone: ${missionForm.coverage_target} | Seuil minimum: ${missionForm.minimum_threshold}`,
          `Critères de réussite: ${missionForm.success_criteria || missionForm.success}`,
          `Preuve attendue: ${missionForm.proof_expected || missionForm.proof}`,
          `Script terrain: ${missionForm.script}`,
          `Script recommandé: ${missionForm.script_recommended}`,
          `Objections fréquentes: ${missionForm.objections}`,
          `Offre / code promo: ${missionForm.offer_code}`,
          `Playbook associé: ${missionForm.support_playbook}`,
          `Sécurité: ${missionForm.safety_instructions}`,
          `Branding: ${missionForm.brand_instructions}`,
          `Plan de route: ${missionForm.route_plan}`,
          `SLA de clôture: ${missionForm.sla_closing}`,
          `Validator: ${missionForm.validator}`,
          `Escalade: ${missionForm.escalation_rule}`,
          `Conditions de rejet: ${missionForm.rejection_conditions}`,
          `Note opérateur: ${missionForm.operator_note}`,
          `Risque: ${missionForm.risk_note}`,
          `Charge: ${missionForm.workload_warning}`,
          `Canal de relance: ${missionForm.followup_channel}`,
          `Notification: ${mode === "notify" ? missionForm.notification_preview : "Non demandée"}`,
        ].join("\n"),
      })
      setActionMessage(mode === "draft" ? "Brouillon de mission enregistré." : mode === "notify" ? "Mission créée; notification ambassadeur demandée." : "Mission terrain créée, assignée et synchronisée.")
      onRefresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Création mission impossible")
    } finally {
      setBusy(false)
    }
  }

  async function submitLead(mode: "create" | "qualify" | "followup") {
    setBusy(true)
    resetMessages()
    try {
      const requiredLeadFields = leadCreateMissingFields(leadForm)
      if ((mode === "create" || mode === "qualify") && requiredLeadFields.length) {
        throw new Error(`Lead incomplet: ${requiredLeadFields.slice(0, 3).join(", ")}`)
      }
      if (mode === "followup" && (requiredLeadFields.length || !leadForm.next_followup_at.trim())) {
        const followupIssues = [...requiredLeadFields, ...(leadForm.next_followup_at.trim() ? [] : ["Prochain suivi"])]
        throw new Error(`Relance incomplète: ${followupIssues.slice(0, 3).join(", ")}`)
      }
      const temperature = leadTemperature(leadForm)
      const liveScore = leadLiveScore(leadForm)
      const leadNotes = [
        `Type: ${leadForm.lead_type} | Température: ${temperature.label} | Score: ${liveScore}`,
        `Contact: ${leadForm.lead_name} | Parent: ${leadForm.parent_name || leadForm.lead_name}`,
        `Canaux: WhatsApp=${leadForm.whatsapp_available} | Préférence=${leadForm.preferred_channel} | Langue=${leadForm.preferred_language}`,
        `Localisation: ${leadForm.city} / ${leadForm.district} / ${leadForm.zone}`,
        `Source: ${leadForm.source} | Campagne: ${leadForm.source_campaign}`,
        `Besoin: ${leadForm.need} | Contexte: ${leadForm.child_age} | Fréquence: ${leadForm.frequency} | Horaire: ${leadForm.desired_time}`,
        `B2B: ${leadForm.establishment_name || "N/A"} | Type besoin: ${leadForm.need_type || "N/A"} | Volume: ${leadForm.potential_volume || "N/A"}`,
        `Décision: ${leadForm.decision_maker || "N/A"} | Délai: ${leadForm.decision_delay || "N/A"} | Budget: ${leadForm.probable_budget || leadForm.budget_estimate}`,
        `Commercial: probabilité ${leadForm.conversion_probability}% | maturité ${leadForm.maturity} | qualité ${leadForm.quality_score} | doublon ${leadForm.duplicate_risk}`,
        `Attribution: ambassadeur=${labelForAmbassador(snapshot, leadForm.ambassador_id)} | territoire=${labelForTerritory(snapshot, leadForm.territory_id)}`,
        `Suivi: ${leadForm.followup_channel} | ${leadForm.next_followup_at || "Non planifié"} | Owner: ${leadForm.owner} | Next action: ${leadForm.next_action}`,
        `Message WhatsApp: ${leadForm.whatsapp_message || `Bonjour ${leadForm.lead_name || "contact"}, AngelCare vous recontacte au sujet de ${leadForm.need.toLowerCase()}.`}`,
        `Note interne: ${leadForm.internal_note}`,
      ].filter(Boolean)
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
        status: mode === "followup" ? "follow_up" : mode === "qualify" ? "qualified" : leadForm.status,
        score: liveScore,
        ambassador_id: leadForm.ambassador_id || null,
        territory_id: leadForm.territory_id || null,
        next_followup_at: mode === "followup" ? leadForm.next_followup_at || null : leadForm.next_followup_at || null,
        notes: [...leadNotes, leadForm.notes].filter(Boolean).join("\n"),
      })
      setActionMessage(mode === "followup" ? "Lead créé et relance planifiée." : mode === "qualify" ? "Lead créé et qualification synchronisée." : "Lead créé dans le cockpit.")
      onRefresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Création lead impossible")
    } finally {
      setBusy(false)
    }
  }

  async function decideConversion(status: "validated" | "rejected" | "proof_requested" | "escalated") {
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
      setActionMessage(status === "validated" ? "Conversion validée et attribuée." : status === "proof_requested" ? "Preuve demandée avec trace d’audit." : status === "escalated" ? "Conversion escaladée avec trace d’audit." : "Conversion refusée avec trace d’audit.")
      onRefresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Décision conversion impossible")
    } finally {
      setBusy(false)
    }
  }

  async function decideIncentive(decision: "approve" | "reject" | "pay" | "block") {
    if (!pendingIncentive?.id) {
      setActionError("Aucun incentive disponible à traiter.")
      return
    }
    setBusy(true)
    resetMessages()
    try {
      await apiSend(`/api/market-os/ambassadors/incentives/${decision === "approve" ? "approve" : decision === "pay" ? "pay" : "reject"}`, "PATCH", {
        id: pendingIncentive.id,
        reason: decision === "block" ? `BLOQUÉ: ${incentiveNote}` : incentiveNote,
        approved_by: "AngelCare OPS",
      })
      setActionMessage(decision === "pay" ? "Incentive marqué payé." : decision === "approve" ? "Incentive approuvé." : decision === "block" ? "Incentive bloqué avec trace d’audit." : "Incentive rejeté avec motif.")
      onRefresh()
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
      if (reportMissingFields(reportForm).length) {
        throw new Error(`Rapport incomplet: ${reportMissingFields(reportForm).slice(0, 3).join(", ")}`)
      }
      await apiDownloadReport({
        report_type: reportForm.report_type,
        title: `Cockpit ambassadeurs - ${reportForm.report_type}`,
        period_start: reportForm.period_start,
        period_end: reportForm.period_end,
        filters: {
          cities: reportForm.cities,
          ambassadors: reportForm.ambassadors,
          sections: reportForm.sections,
          format: reportForm.format,
          recipients: reportForm.recipients,
          approval_signature: reportForm.approval_signature || reportForm.signature_note,
          export_conditions: reportForm.export_conditions || reportForm.export_scope,
        },
      })
      setActionMessage("Rapport cockpit généré et téléchargé.")
      onRefresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Export rapport impossible")
    } finally {
      setBusy(false)
    }
  }

  function previewReport() {
    resetMessages()
    setReportRevision((value) => value + 1)
    setActionMessage("Prévisualisation actualisée à partir du snapshot courant.")
  }

  const modalFeedback: CockpitModalFeedback | null = actionError
    ? { tone: "error", message: actionError }
    : actionMessage
      ? { tone: "success", message: actionMessage }
      : null

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

      {modal === "candidate" ? <AmbassadorCandidateIntakeModal busy={busy} form={candidateForm} snapshot={snapshot} onChange={updateCandidate} onClose={closeModal} onSubmit={submitCandidate} feedback={modalFeedback} /> : null}
      {modal === "mission" ? <AmbassadorMissionBuilderModal busy={busy} form={missionForm} snapshot={snapshot} onChange={updateMission} onClose={closeModal} onSubmit={submitMission} feedback={modalFeedback} /> : null}
      {modal === "lead" ? <AmbassadorLeadQualificationModal busy={busy} form={leadForm} snapshot={snapshot} onChange={updateLead} onClose={closeModal} onSubmit={submitLead} feedback={modalFeedback} /> : null}
      {modal === "conversion" ? <AmbassadorConversionValidationModal busy={busy} conversion={pendingConversion} note={decisionNote} onNote={setDecisionNote} onClose={closeModal} onDecide={decideConversion} snapshot={snapshot} feedback={modalFeedback} /> : null}
      {modal === "incentive" ? <AmbassadorIncentiveApprovalModal busy={busy} incentive={pendingIncentive} note={incentiveNote} onNote={setIncentiveNote} onClose={closeModal} onDecide={decideIncentive} snapshot={snapshot} feedback={modalFeedback} /> : null}
      {modal === "export" ? <AmbassadorReportExportModal busy={busy} form={reportForm} onChange={updateReport} onClose={closeModal} onPreview={previewReport} onExportCsv={exportReport} onExportPdf={() => setActionError("Export PDF non disponible dans l'infrastructure actuelle.")} onSchedule={() => setActionError("Planification non disponible dans l'infrastructure actuelle.")} preview={reportPreview} feedback={modalFeedback} /> : null}

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

/*
function ModalShell({
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  onClose,
  width = "w-[calc(100vw-32px)] lg:w-[85vw] lg:max-w-[1560px]",
}: {
  title: string
  subtitle: string
  icon: IconType
  children: ReactNode
  footer: ReactNode
  onClose: () => void
  width?: string
}) {
  const topOffset = "var(--angelcare-overhead-height, 96px)"

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[80] flex items-center justify-center bg-slate-950/28 px-4 py-3 backdrop-blur-sm"
      style={{ top: topOffset }}
    >
      <div
        className={`flex h-[calc(100dvh-var(--angelcare-overhead-height,96px)-24px)] flex-col overflow-y-auto overscroll-contain rounded-[34px] border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 ${width}`}
      >
        <header className="sticky top-0 z-20 border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] px-6 py-5">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700">
                <Icon size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-950">{title}</h2>
                <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-600">{subtitle}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-50">
              <X size={16} />
            </button>
          </div>
        </header>
        <div className="bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_16%,#ffffff_100%)] px-6 py-6">{children}</div>
        <footer className="sticky bottom-0 z-20 border-t border-slate-100 bg-white/95 px-6 py-4 backdrop-blur">{footer}</footer>
      </div>
    </div>
  )
}

function CandidateModal({
  busy,
  form,
  onChange,
  onSubmit,
  onClose,
  snapshot,
}: {
  busy: boolean
  form: typeof defaultCandidate
  onChange: (key: string, value: string) => void
  onSubmit: (mode: "draft" | "create" | "interview") => void
  onClose: () => void
  snapshot: AmbassadorWorkspaceSnapshot
}) {
  const readiness = useMemo(() => candidateReadiness(form), [form])
  const checklist = useMemo(
    () => [
      { label: "Identité complète", done: Boolean(form.candidate_name.trim() && form.phone.trim() && form.email.trim()), detail: "Nom, téléphone, email" },
      { label: "Terrain cadré", done: Boolean(form.city.trim() && form.district.trim() && form.approx_address.trim()), detail: "Ville, quartier, adresse" },
      { label: "Mobilité claire", done: Boolean(form.availability_days.trim() && form.availability_slots.trim() && form.action_radius.trim()), detail: "Jours, créneaux, rayon" },
      { label: "Scoring exploitable", done: Boolean(form.prequal_score.trim() && form.compatibility_city.trim() && form.compatibility_profile.trim()), detail: "Préqualification et compatibilité" },
      { label: "Workflow OPS", done: Boolean(form.pipeline_stage.trim() && form.responsible_owner.trim() && form.next_action.trim()), detail: "Owner et prochaine action" },
    ],
    [form]
  )
  const citiesList = useMemo(() => pickCities(snapshot), [snapshot])
  const cityContext = citiesList.find((item) => item.city === form.city) || citiesList[0]
  const createMissing = readiness.missing
  const interviewMissing = readiness.interviewMissing
  const createReason = busy ? "Synchronisation en cours." : createMissing.length ? describeMissing(createMissing) : "Dossier prêt pour création."
  const interviewReason = busy ? "Synchronisation en cours." : interviewMissing.length ? describeMissing(interviewMissing) : "Dossier prêt pour création + entretien."
  const draftReason = busy ? "Synchronisation en cours." : "Le brouillon restera exploitable dans le pipeline recrutement."

  return (
    <ModalShell
      title="Nouveau candidat ambassadeur"
      subtitle="Dossier de recrutement opérationnel: identité, potentiel terrain, disponibilité, préqualification et routage RH / OPS."
      icon={UserPlus}
      onClose={onClose}
      footer={
        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1 text-xs font-semibold text-slate-500">
            <p className="font-black text-slate-900">{readiness.status} · {readiness.score}%</p>
            <p>{draftReason}</p>
            <p>{createReason}</p>
            <p>{interviewReason}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
              Annuler
            </button>
            <button
              type="submit"
              form="candidate-form"
              data-mode="draft"
              disabled={busy}
              title={draftReason}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Enregistrer brouillon
            </button>
            <button
              type="submit"
              form="candidate-form"
              data-mode="create"
              disabled={busy || createMissing.length > 0}
              title={createReason}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {busy ? "Création..." : "Créer candidat"}
            </button>
            <button
              type="submit"
              form="candidate-form"
              data-mode="interview"
              disabled={busy || interviewMissing.length > 0}
              title={interviewReason}
              className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Planification..." : "Créer + planifier entretien"}
            </button>
          </div>
        </div>
      }
    >
      <form
        id="candidate-form"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(readSubmitMode(event, "create") as "draft" | "create" | "interview")
        }}
        className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]"
      >
        <div className="space-y-5">
          <section className="rounded-[30px] border border-blue-100 bg-[linear-gradient(135deg,#ffffff_0%,#f4f9ff_56%,#ecf4ff_100%)] p-5 shadow-sm shadow-blue-100/60">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">Recruitment dossier</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">Identité complète</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone={readiness.status === "Prêt entretien" ? "emerald" : readiness.status === "Préqualifié" ? "blue" : "amber"}>{readiness.status}</StatusPill>
                <StatusPill tone="slate">{form.city || "Ville"}</StatusPill>
                <StatusPill tone="blue">{cityContext?.status || "Couverture"}</StatusPill>
              </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Nom complet">
                <input className={inputClass} value={form.candidate_name} onChange={(e) => onChange("candidate_name", e.target.value)} placeholder="Ex: Salma Bennis" />
              </Field>
              <Field label="Téléphone">
                <input className={inputClass} value={form.phone} onChange={(e) => onChange("phone", e.target.value)} placeholder="+212 6..." />
              </Field>
              <Field label="Email">
                <input className={inputClass} value={form.email} onChange={(e) => onChange("email", e.target.value)} placeholder="email@exemple.com" />
              </Field>
              <Field label="Ville">
                <select className={selectClass} value={form.city} onChange={(e) => onChange("city", e.target.value)}>
                  {citiesList.map((city) => <option key={city.city} value={city.city}>{city.city}</option>)}
                </select>
              </Field>
              <Field label="Quartier">
                <input className={inputClass} value={form.district} onChange={(e) => onChange("district", e.target.value)} placeholder="Centre, Agdal..." />
              </Field>
              <Field label="Adresse approximative">
                <input className={inputClass} value={form.approx_address} onChange={(e) => onChange("approx_address", e.target.value)} placeholder="Rue, repère, quartier" />
              </Field>
              <Field label="Langues">
                <input className={inputClass} value={form.languages} onChange={(e) => onChange("languages", e.target.value)} placeholder="Arabe dialectal, Français" />
              </Field>
              <Field label="Canal préféré">
                <select className={selectClass} value={form.preferred_channel} onChange={(e) => onChange("preferred_channel", e.target.value)}>
                  {preferredChannels.map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Source du candidat">
                <select className={selectClass} value={form.source} onChange={(e) => onChange("source", e.target.value)}>
                  {candidateSources.map((source) => <option key={source}>{source}</option>)}
                </select>
              </Field>
              <Field label="Code source / campagne">
                <input className={inputClass} value={form.source_campaign} onChange={(e) => onChange("source_campaign", e.target.value)} placeholder="IG-OPS-RABAT-07" />
              </Field>
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black tracking-tight text-slate-950">Profil & potentiel terrain</h3>
                <StatusPill tone="blue">Signal terrain</StatusPill>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Expérience commerciale">
                  <select className={selectClass} value={form.commercial_experience} onChange={(e) => onChange("commercial_experience", e.target.value)}>
                    {["À préciser", "Débutant", "1-2 ans", "3-5 ans", "5+ ans"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Expérience terrain">
                  <select className={selectClass} value={form.field_experience} onChange={(e) => onChange("field_experience", e.target.value)}>
                    {["À préciser", "Première expérience", "Habitué terrain", "Très expérimenté"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Connaissance familles / parents">
                  <select className={selectClass} value={form.family_knowledge} onChange={(e) => onChange("family_knowledge", e.target.value)}>
                    {["À préciser", "Faible", "Moyenne", "Bonne", "Très bonne"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Réseau local">
                  <select className={selectClass} value={form.local_network} onChange={(e) => onChange("local_network", e.target.value)}>
                    {["Faible", "Quartier et communauté engagés", "Fort réseau de confiance", "Très fort réseau local"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Aisance communication">
                  <select className={selectClass} value={form.communication_confidence} onChange={(e) => onChange("communication_confidence", e.target.value)}>
                    {["Faible", "Moyenne", "Bonne", "Très bonne"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Niveau digital">
                  <select className={selectClass} value={form.digital_confidence} onChange={(e) => onChange("digital_confidence", e.target.value)}>
                    {["Faible", "Moyenne", "Bonne", "Très bonne"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="WhatsApp / CRM">
                  <select className={selectClass} value={form.whatsapp_crm_capability} onChange={(e) => onChange("whatsapp_crm_capability", e.target.value)}>
                    {["WhatsApp fiable, CRM à confirmer", "WhatsApp OK, CRM limité", "WhatsApp + CRM opérationnels", "Autonome sur WhatsApp et CRM"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Niveau de confiance estimé">
                  <select className={selectClass} value={form.confidence_estimate} onChange={(e) => onChange("confidence_estimate", e.target.value)}>
                    {["52", "62", "72", "82", "92"].map((item) => <option key={item} value={item}>{item}%</option>)}
                  </select>
                </Field>
                <Field label="Notes de profil" className="md:col-span-2">
                  <textarea className={textareaClass} value={form.profile_notes} onChange={(e) => onChange("profile_notes", e.target.value)} placeholder="Angle commercial, posture, objections, contexte familial, autres observations." />
                </Field>
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-sm shadow-slate-200/60">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black tracking-tight text-slate-950">Disponibilité & mobilité</h3>
                <StatusPill tone="emerald">Capacité</StatusPill>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Disponibilité">
                  <select className={selectClass} value={form.availability} onChange={(e) => onChange("availability", e.target.value)}>
                    {["Temps partiel flexible", "Soirs & week-end", "Disponible immédiatement", "Disponibilité à confirmer"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Jours disponibles">
                  <input className={inputClass} value={form.availability_days} onChange={(e) => onChange("availability_days", e.target.value)} placeholder="Lundi, Mardi, Mercredi" />
                </Field>
                <Field label="Créneaux">
                  <input className={inputClass} value={form.availability_slots} onChange={(e) => onChange("availability_slots", e.target.value)} placeholder="Matin, Après-midi" />
                </Field>
                <Field label="Capacité hebdomadaire">
                  <select className={selectClass} value={form.weekly_capacity} onChange={(e) => onChange("weekly_capacity", e.target.value)}>
                    {["8 h / semaine", "12 h / semaine", "16 h / semaine", "20 h / semaine", "Temps plein"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Mobilité">
                  <select className={selectClass} value={form.mobility} onChange={(e) => onChange("mobility", e.target.value)}>
                    {["Transport personnel / zone proche", "Transport public", "Moto", "À pied - quartier limité"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Rayon d’action">
                  <input className={inputClass} value={form.action_radius} onChange={(e) => onChange("action_radius", e.target.value)} placeholder="3 km" />
                </Field>
                <Field label="Zones acceptées">
                  <input className={inputClass} value={form.accepted_zones} onChange={(e) => onChange("accepted_zones", e.target.value)} placeholder="Centre, Agdal, Rabat..." />
                </Field>
                <Field label="Contraintes personnelles / logistiques" className="md:col-span-2">
                  <textarea className={textareaClass} value={form.personal_constraints} onChange={(e) => onChange("personal_constraints", e.target.value)} placeholder="Garde enfant, transport, horaires, jours bloqués, autres contraintes." />
                </Field>
              </div>
            </section>
          </div>

          <section className="rounded-[30px] border border-blue-100 bg-[linear-gradient(180deg,#f9fbff_0%,#eef5ff_100%)] p-5 shadow-sm shadow-blue-100/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Préqualification & scoring</h3>
              <StatusPill tone={readiness.status === "Prêt entretien" ? "emerald" : readiness.status === "Préqualifié" ? "blue" : "amber"}>{readiness.score}%</StatusPill>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Score préqualification">
                <select className={selectClass} value={form.prequal_score} onChange={(e) => onChange("prequal_score", e.target.value)}>
                  {["52", "62", "72", "82", "92"].map((item) => <option key={item} value={item}>{item}%</option>)}
                </select>
              </Field>
              <Field label="Compatibilité ville prioritaire">
                <select className={selectClass} value={form.compatibility_city} onChange={(e) => onChange("compatibility_city", e.target.value)}>
                  {["Faible", "Moyenne", "Bonne", "Très bonne"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Compatibilité profil">
                <select className={selectClass} value={form.compatibility_profile} onChange={(e) => onChange("compatibility_profile", e.target.value)}>
                  {["Faible", "Moyenne", "Bonne", "Très bonne"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Compatibilité disponibilité">
                <select className={selectClass} value={form.compatibility_availability} onChange={(e) => onChange("compatibility_availability", e.target.value)}>
                  {["Faible", "Moyenne", "Bonne", "Très bonne"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Risques">
                <input className={inputClass} value={form.risk_notes} onChange={(e) => onChange("risk_notes", e.target.value)} placeholder="Mobilité, temps, confiance, disponibilité..." />
              </Field>
              <Field label="Étape pipeline">
                <select className={selectClass} value={form.pipeline_stage} onChange={(e) => onChange("pipeline_stage", e.target.value)}>
                  {["screening", "interview", "validated", "on_hold"].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Responsable">
                <input className={inputClass} value={form.responsible_owner} onChange={(e) => onChange("responsible_owner", e.target.value)} />
              </Field>
              <Field label="Décision recommandée">
                <input className={inputClass} readOnly value={readiness.status === "Prêt entretien" ? "Créer + planifier entretien" : readiness.status === "Préqualifié" ? "Créer candidat" : "Compléter le dossier"} />
              </Field>
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Workflow RH / OPS</h3>
              <StatusPill tone="slate">{form.schedule_interview === "yes" ? "Entretien prévu" : "Sans entretien"}</StatusPill>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Intervieweur">
                <input className={inputClass} value={form.interviewer} onChange={(e) => onChange("interviewer", e.target.value)} />
              </Field>
              <Field label="Prochaine action">
                <select className={selectClass} value={form.next_action} onChange={(e) => onChange("next_action", e.target.value)}>
                  {["Appel de préqualification aujourd’hui", "Envoyer questionnaire WhatsApp", "Planifier entretien OPS", "Demander documents initiaux", "Refuser avec motif"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Date de relance">
                <input type="datetime-local" className={inputClass} value={form.followup_date} onChange={(e) => onChange("followup_date", e.target.value)} />
              </Field>
              <Field label="Planifier entretien">
                <select className={selectClass} value={form.schedule_interview} onChange={(e) => onChange("schedule_interview", e.target.value)}>
                  <option value="yes">Oui</option>
                  <option value="no">Non</option>
                </select>
              </Field>
              <Field label="Documents à demander" className="md:col-span-2">
                <textarea className={textareaClass} value={form.documents_to_request} onChange={(e) => onChange("documents_to_request", e.target.value)} placeholder="CNI, justificatif, références, autorisations..." />
              </Field>
              <Field label="Checklist de validation" className="md:col-span-2">
                <textarea className={textareaClass} value={form.validation_checklist} onChange={(e) => onChange("validation_checklist", e.target.value)} placeholder="Identité, mobilité, disponibilité, digital, réseau..." />
              </Field>
              <Field label="Notes internes" className="md:col-span-2">
                <textarea className={textareaClass} value={form.internal_notes} onChange={(e) => onChange("internal_notes", e.target.value)} placeholder="Trace d'audit, recommandation manager, éléments à vérifier." />
              </Field>
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-[30px] border border-blue-100 bg-[linear-gradient(180deg,#ffffff_0%,#f6faff_100%)] p-5 shadow-sm shadow-blue-100/60">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">Score live</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">{readiness.status}</h3>
              </div>
              <StatusPill tone={readiness.status === "Prêt entretien" ? "emerald" : readiness.status === "Préqualifié" ? "blue" : "amber"}>{readiness.score}%</StatusPill>
            </div>
            <div className="mt-4 h-2 rounded-full bg-slate-100">
              <div className={`h-2 rounded-full ${progressColor(readiness.band.tone)}`} style={{ width: `${readiness.score}%` }} />
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{readiness.band.label}. Le score évolue avec la disponibilité, la mobilité, le niveau digital et le réseau local.</p>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Champs manquants</h3>
              <StatusPill tone={createMissing.length ? "amber" : "emerald"}>{createMissing.length}</StatusPill>
            </div>
            <div className="mt-4 space-y-2">
              {createMissing.length ? createMissing.map((item) => <div key={item} className="flex items-start gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"><AlertTriangle size={14} className="mt-0.5 shrink-0" />{item}</div>) : <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">Dossier complet pour création.</div>}
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-slate-50/80 p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Checklist dossier</h3>
              <StatusPill tone="emerald">{checklist.filter((item) => item.done).length}/{checklist.length}</StatusPill>
            </div>
            <div className="mt-4 space-y-3">
              {checklist.map((item) => (
                <div key={item.label} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3">
                  <span className={`mt-0.5 grid h-5 w-5 place-items-center rounded-full ${item.done ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                    <CheckCircle2 size={13} />
                  </span>
                  <div>
                    <p className="text-sm font-black text-slate-950">{item.label}</p>
                    <p className="text-xs font-semibold text-slate-500">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Affectation cible</h3>
              <StatusPill tone="blue">OPS</StatusPill>
            </div>
            <div className="mt-4 rounded-3xl border border-blue-100 bg-[linear-gradient(180deg,#f7fbff_0%,#eef5ff_100%)] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Manager / interview</p>
              <p className="mt-2 text-sm font-semibold text-slate-600">{form.responsible_owner} · {form.interviewer || "Intervieweur à définir"}</p>
              <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">Le dossier reste auditable: la prochaine action, la date de relance et la demande documentaire sont tous conservés.</p>
            </div>
          </section>
        </aside>
      </form>
    </ModalShell>
  )
}

function MissionModal({
  busy,
  form,
  snapshot,
  onChange,
  onSubmit,
  onClose,
}: {
  busy: boolean
  form: typeof defaultMission
  snapshot: AmbassadorWorkspaceSnapshot
  onChange: (key: string, value: string) => void
  onSubmit: (mode: "draft" | "create" | "notify") => void
  onClose: () => void
}) {
  const scenario = useMemo(() => selectedMissionScenario(form.scenario_id), [form.scenario_id])
  const missing = useMemo(() => missionMissingFields(form), [form])
  const draftReason = busy ? "Création en cours." : "Le brouillon reste enregistrable même si certains champs sont encore incomplets."
  const createReason = busy ? "Création en cours." : missing.length ? describeMissing(missing) : "Mission prête à être créée."
  const notifyReason = busy ? "Notification en cours." : missing.length ? describeMissing(missing) : "Mission prête à être créée et notifiée."

  return (
    <ModalShell
      title="Créer mission terrain"
      subtitle="Workspace de dispatch opérationnel pour cadrer le scénario, l’exécution terrain, les objectifs mesurables et la clôture."
      icon={MapPinned}
      onClose={onClose}
      footer={
        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1 text-xs font-semibold text-slate-500">
            <p className="font-black text-slate-900">{scenario.title} · {form.priority}</p>
            <p>{draftReason}</p>
            <p>{createReason}</p>
            <p>{notifyReason}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
              Annuler
            </button>
            <button type="submit" form="mission-form" data-mode="draft" disabled={busy} title={draftReason} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
              Enregistrer brouillon
            </button>
            <button
              type="submit"
              form="mission-form"
              data-mode="create"
              disabled={busy || missing.length > 0}
              title={createReason}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {busy ? "Création..." : "Créer mission"}
            </button>
            <button
              type="submit"
              form="mission-form"
              data-mode="notify"
              disabled={busy || missing.length > 0}
              title={notifyReason}
              className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Notification..." : "Créer + notifier ambassadeur"}
            </button>
          </div>
        </div>
      }
    >
      <form
        id="mission-form"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(readSubmitMode(event, "create") as "draft" | "create" | "notify")
        }}
        className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]"
      >
        <div className="space-y-5">
          <section className="rounded-[30px] border border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eef5ff_52%,#ffffff_100%)] p-5 shadow-sm shadow-blue-100/60">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">Scenario selector</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">Choisir le scénario mission</h3>
              </div>
              <StatusPill tone="blue">{scenario.title}</StatusPill>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {missionScenarios.map((item) => {
                const selected = item.id === form.scenario_id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChange("scenario_id", item.id)}
                    className={`rounded-[24px] border p-4 text-left transition ${
                      selected ? "border-blue-300 bg-white shadow-lg shadow-blue-100/70" : "border-slate-200 bg-white/80 hover:border-blue-200 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <StatusPill tone={selected ? "blue" : "slate"}>Scénario</StatusPill>
                      {selected ? <CheckCircle2 size={16} className="text-blue-600" /> : <Sparkles size={16} className="text-slate-400" />}
                    </div>
                    <p className="mt-3 text-sm font-black tracking-tight text-slate-950">{item.title}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{item.campaign}</p>
                    <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">{item.objective}</p>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Paramètres opérationnels</h3>
              <StatusPill tone="emerald">{form.priority}</StatusPill>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Titre mission">
                <input className={inputClass} value={form.title} onChange={(e) => onChange("title", e.target.value)} />
              </Field>
              <Field label="Campagne">
                <input className={inputClass} value={form.campaign} onChange={(e) => onChange("campaign", e.target.value)} />
              </Field>
              <Field label="Ville">
                <select className={selectClass} value={form.city} onChange={(e) => onChange("city", e.target.value)}>
                  {cities.map((city) => <option key={city}>{city}</option>)}
                </select>
              </Field>
              <Field label="Quartier / zone">
                <input className={inputClass} value={form.zone} onChange={(e) => onChange("zone", e.target.value)} />
              </Field>
              <Field label="Territoire">
                <select className={selectClass} value={form.territory_id} onChange={(e) => onChange("territory_id", e.target.value)}>
                  <option value="">À définir</option>
                  {snapshot.territories.slice(0, 80).map((item: AnyRecord) => <option key={item.id} value={item.id}>{item.name} — {item.city || "Ville"}</option>)}
                </select>
              </Field>
              <Field label="Ambassadeur assigné">
                <select className={selectClass} value={form.ambassador_id} onChange={(e) => onChange("ambassador_id", e.target.value)}>
                  <option value="">Auto-affectation OPS</option>
                  {snapshot.ambassadors.slice(0, 80).map((item: AnyRecord) => <option key={item.id} value={item.id}>{item.full_name || item.name} — {item.city || "Ville"}</option>)}
                </select>
              </Field>
              <Field label="Priorité">
                <select className={selectClass} value={form.priority} onChange={(e) => onChange("priority", e.target.value)}>
                  <option value="critical">Critique</option>
                  <option value="high">Haute</option>
                  <option value="medium">Moyenne</option>
                  <option value="low">Faible</option>
                </select>
              </Field>
              <Field label="Échéance">
                <input type="date" className={inputClass} value={form.due_date} onChange={(e) => onChange("due_date", e.target.value)} />
              </Field>
              <Field label="Durée estimée">
                <input className={inputClass} value={form.duration_estimated} onChange={(e) => onChange("duration_estimated", e.target.value)} placeholder="2h, 1 demi-journée..." />
              </Field>
              <Field label="Canal d’exécution">
                <select className={selectClass} value={form.execution_channel} onChange={(e) => onChange("execution_channel", e.target.value)}>
                  {["WhatsApp + appel", "WhatsApp", "Appel direct manager", "Email + WhatsApp", "Brief terrain uniquement"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Mode mission">
                <select className={selectClass} value={form.mission_mode} onChange={(e) => onChange("mission_mode", e.target.value)}>
                  {missionModes.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </Field>
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black tracking-tight text-slate-950">Objectifs mesurables</h3>
                <StatusPill tone="blue">Targets</StatusPill>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Leads attendus">
                  <input className={inputClass} value={form.leads_expected} onChange={(e) => onChange("leads_expected", e.target.value)} />
                </Field>
                <Field label="Conversations attendues">
                  <input className={inputClass} value={form.conversations_expected} onChange={(e) => onChange("conversations_expected", e.target.value)} />
                </Field>
                <Field label="Rendez-vous attendus">
                  <input className={inputClass} value={form.rendezvous_expected} onChange={(e) => onChange("rendezvous_expected", e.target.value)} />
                </Field>
                <Field label="Conversions potentielles">
                  <input className={inputClass} value={form.conversions_potential} onChange={(e) => onChange("conversions_potential", e.target.value)} />
                </Field>
                <Field label="Couverture de zone">
                  <input className={inputClass} value={form.coverage_target} onChange={(e) => onChange("coverage_target", e.target.value)} />
                </Field>
                <Field label="Seuil minimum acceptable">
                  <input className={inputClass} value={form.minimum_threshold} onChange={(e) => onChange("minimum_threshold", e.target.value)} />
                </Field>
                <Field label="Objectif secondaire" className="md:col-span-2">
                  <textarea className={textareaClass} value={form.objective_secondary} onChange={(e) => onChange("objective_secondary", e.target.value)} />
                </Field>
                <Field label="Objectif principal" className="md:col-span-2">
                  <textarea className={textareaClass} value={form.objective} onChange={(e) => onChange("objective", e.target.value)} />
                </Field>
              </div>
            </section>

            <section className="rounded-[30px] border border-blue-100 bg-[linear-gradient(180deg,#f9fcff_0%,#eef5ff_100%)] p-5 shadow-sm shadow-blue-100/60">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black tracking-tight text-slate-950">Exécution terrain</h3>
                <StatusPill tone="emerald">{form.followup_channel}</StatusPill>
              </div>
              <div className="mt-4 grid gap-4">
                <Field label="Script recommandé">
                  <textarea className={textareaClass} value={form.script_recommended} onChange={(e) => onChange("script_recommended", e.target.value)} />
                </Field>
                <Field label="Objections fréquentes">
                  <textarea className={textareaClass} value={form.objections} onChange={(e) => onChange("objections", e.target.value)} />
                </Field>
                <Field label="Offre / code promo">
                  <input className={inputClass} value={form.offer_code} onChange={(e) => onChange("offer_code", e.target.value)} />
                </Field>
                <Field label="Support / playbook">
                  <input className={inputClass} value={form.support_playbook} onChange={(e) => onChange("support_playbook", e.target.value)} />
                </Field>
                <Field label="Consignes de sécurité">
                  <textarea className={textareaClass} value={form.safety_instructions} onChange={(e) => onChange("safety_instructions", e.target.value)} />
                </Field>
                <Field label="Consignes image de marque">
                  <textarea className={textareaClass} value={form.brand_instructions} onChange={(e) => onChange("brand_instructions", e.target.value)} />
                </Field>
                <Field label="Preuve attendue">
                  <textarea className={textareaClass} value={form.proof_expected} onChange={(e) => onChange("proof_expected", e.target.value)} />
                </Field>
              </div>
            </section>
          </div>

          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Validation & clôture</h3>
              <StatusPill tone="amber">Audit</StatusPill>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Critères de réussite">
                <textarea className={textareaClass} value={form.success_criteria} onChange={(e) => onChange("success_criteria", e.target.value)} />
              </Field>
              <Field label="Responsable validation">
                <input className={inputClass} value={form.validator} onChange={(e) => onChange("validator", e.target.value)} />
              </Field>
              <Field label="SLA de clôture">
                <input className={inputClass} value={form.sla_closing} onChange={(e) => onChange("sla_closing", e.target.value)} />
              </Field>
              <Field label="Escalade en cas de retard">
                <input className={inputClass} value={form.escalation_rule} onChange={(e) => onChange("escalation_rule", e.target.value)} />
              </Field>
              <Field label="Conditions de rejet">
                <textarea className={textareaClass} value={form.rejection_conditions} onChange={(e) => onChange("rejection_conditions", e.target.value)} />
              </Field>
              <Field label="Note opérateur">
                <textarea className={textareaClass} value={form.operator_note} onChange={(e) => onChange("operator_note", e.target.value)} />
              </Field>
              <Field label="Notification ambassadeur" className="md:col-span-2">
                <textarea className={textareaClass} value={form.notification_preview} onChange={(e) => onChange("notification_preview", e.target.value)} />
              </Field>
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-[30px] border border-blue-100 bg-[linear-gradient(180deg,#ffffff_0%,#f6faff_100%)] p-5 shadow-sm shadow-blue-100/60">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">Mission readiness</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">Couverture du brief</h3>
              </div>
              <StatusPill tone={missing.length ? "amber" : "emerald"}>{missing.length}</StatusPill>
            </div>
            <div className="mt-4 space-y-2">
              {missing.length ? missing.map((item) => <div key={item} className="flex items-start gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"><AlertTriangle size={14} className="mt-0.5 shrink-0" />{item}</div>) : <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">Mission complète pour création.</div>}
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Checklist d’exécution</h3>
              <StatusPill tone="emerald">{form.ambassador_id && form.territory_id ? "Prêt" : "À affecter"}</StatusPill>
            </div>
            <div className="mt-4 space-y-3">
              {[
                { label: "Scénario sélectionné", done: Boolean(form.scenario_id) },
                { label: "Attribution complète", done: Boolean(form.ambassador_id && form.territory_id) },
                { label: "Objectifs mesurables", done: Boolean(form.leads_expected.trim() && form.conversations_expected.trim()) },
                { label: "Preuve / playbook", done: Boolean(form.proof_expected.trim() && form.support_playbook.trim()) },
                { label: "Validation / escalade", done: Boolean(form.validator.trim() && form.escalation_rule.trim()) },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <span className={`mt-0.5 grid h-5 w-5 place-items-center rounded-full ${item.done ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                    <CheckCircle2 size={13} />
                  </span>
                  <div>
                    <p className="text-sm font-black text-slate-950">{item.label}</p>
                    <p className="text-xs font-semibold text-slate-500">{item.done ? "Vérifié" : "En attente"}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-slate-50/80 p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Route cible</h3>
              <StatusPill tone="blue">{form.followup_channel}</StatusPill>
            </div>
            <div className="mt-4 rounded-3xl border border-white bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Plan terrain</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{form.route_plan || scenario.route_plan}</p>
              <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">Le cockpit garde la mission comme workspace de dispatch, avec l’essentiel dans les champs structurés plutôt que des dashboards décoratifs.</p>
            </div>
          </section>
        </aside>
      </form>
    </ModalShell>
  )
}

function LeadModal({
  busy,
  form,
  snapshot,
  onChange,
  onSubmit,
  onClose,
}: {
  busy: boolean
  form: typeof defaultLead
  snapshot: AmbassadorWorkspaceSnapshot
  onChange: (key: string, value: string) => void
  onSubmit: (mode: "create" | "qualify" | "followup") => void
  onClose: () => void
}) {
  const leadTemp = useMemo(() => leadTemperature(form), [form])
  const liveScore = useMemo(() => leadLiveScore(form), [form])
  const missingBase = useMemo(() => leadCreateMissingFields(form), [form])
  const followupMissing = useMemo(() => [...leadCreateMissingFields(form), ...(form.next_followup_at.trim() ? [] : ["Prochain suivi"])], [form])
  const checklist = useMemo(() => leadChecklist(form), [form])
  const citiesList = useMemo(() => pickCities(snapshot), [snapshot])
  const isB2B = ["Entreprise", "Partenaire local", "Hôtel / événementiel", "Santé / orthophoniste / pédiatre", "École / Crèche"].includes(form.lead_type)
  const contextOptions = isB2B
    ? ["1-5 salariés", "6-20 salariés", "20-50 salariés", "50+ salariés", "Non précisé"]
    : ["0-2 ans", "3-6 ans", "7-10 ans", "11-14 ans", "Non précisé"]
  const contextLabel = isB2B ? "Volume organisation" : "Âge enfant"
  const baseReason = busy ? "Synchronisation en cours." : missingBase.length ? describeMissing(missingBase) : "Lead prêt pour création et qualification."
  const followupReason = busy ? "Synchronisation en cours." : followupMissing.length ? describeMissing(followupMissing) : "Relance planifiable immédiatement."

  return (
    <ModalShell
      title="Nouveau lead qualifié"
      subtitle="Workspace CRM de qualification avec typologie du signal, contact, besoin, attribution et suivi commercial."
      icon={Target}
      onClose={onClose}
      footer={
        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1 text-xs font-semibold text-slate-500">
            <p className="font-black text-slate-900">{leadTemp.label} · {liveScore}%</p>
            <p>{baseReason}</p>
            <p>{followupReason}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
              Annuler
            </button>
            <button type="submit" form="lead-form" data-mode="create" disabled={busy || missingBase.length > 0} title={baseReason} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
              Créer lead
            </button>
            <button type="submit" form="lead-form" data-mode="qualify" disabled={busy || missingBase.length > 0} title={baseReason} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">
              {busy ? "Qualification..." : "Créer + qualifier"}
            </button>
            <button type="submit" form="lead-form" data-mode="followup" disabled={busy || followupMissing.length > 0} title={followupReason} className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? "Relance..." : "Créer + planifier relance"}
            </button>
          </div>
        </div>
      }
    >
      <form
        id="lead-form"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(readSubmitMode(event, "qualify") as "create" | "qualify" | "followup")
        }}
        className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]"
      >
        <div className="space-y-5">
          <section className="rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#f9fcff_0%,#eef5ff_48%,#ffffff_100%)] p-5 shadow-sm shadow-blue-100/60">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">Lead type selector</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">Choisir le signal CRM</h3>
              </div>
              <StatusPill tone={leadTemp.tone}>{leadTemp.label}</StatusPill>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              {[
                { label: "Parent / Famille", value: "Parent B2C", icon: Users },
                { label: "École / Crèche", value: "École / Crèche", icon: Building2 },
                { label: "Entreprise", value: "Entreprise", icon: Users },
                { label: "Partenaire local", value: "Partenaire local", icon: Star },
                { label: "Hôtel / événementiel", value: "Hôtel / événementiel", icon: Calendar },
                { label: "Santé / orthophoniste / pédiatre", value: "Santé / orthophoniste / pédiatre", icon: ShieldCheck },
              ].map((item) => {
                const selected = form.lead_type === item.value
                const Icon = item.icon
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => onChange("lead_type", item.value)}
                    className={`rounded-[24px] border p-4 text-left transition ${
                      selected ? "border-blue-300 bg-white shadow-lg shadow-blue-100/70" : "border-slate-200 bg-white/80 hover:border-blue-200 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className={`grid h-9 w-9 place-items-center rounded-2xl ${selected ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                        <Icon size={16} />
                      </div>
                      {selected ? <CheckCircle2 size={16} className="text-blue-600" /> : <Sparkles size={16} className="text-slate-400" />}
                    </div>
                    <p className="mt-3 text-sm font-black tracking-tight text-slate-950">{item.label}</p>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Contact</h3>
              <StatusPill tone="emerald">{form.city}</StatusPill>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Nom contact">
                <input className={inputClass} value={form.lead_name} onChange={(e) => onChange("lead_name", e.target.value)} placeholder="Nom du parent, responsable ou contact" />
              </Field>
              <Field label="Nom parent / référent">
                <input className={inputClass} value={form.parent_name} onChange={(e) => onChange("parent_name", e.target.value)} placeholder="Nom du parent ou du référent" />
              </Field>
              <Field label="Téléphone">
                <input className={inputClass} value={form.phone} onChange={(e) => onChange("phone", e.target.value)} placeholder="+212 6..." />
              </Field>
              <Field label="WhatsApp disponible">
                <select className={selectClass} value={form.whatsapp_available} onChange={(e) => onChange("whatsapp_available", e.target.value)}>
                  <option value="yes">Oui</option>
                  <option value="no">Non</option>
                </select>
              </Field>
              <Field label="Email">
                <input className={inputClass} value={form.email} onChange={(e) => onChange("email", e.target.value)} placeholder="email@exemple.com" />
              </Field>
              <Field label="Ville">
                <select className={selectClass} value={form.city} onChange={(e) => onChange("city", e.target.value)}>
                  {citiesList.map((city) => <option key={city.city} value={city.city}>{city.city}</option>)}
                </select>
              </Field>
              <Field label="Quartier">
                <input className={inputClass} value={form.district} onChange={(e) => onChange("district", e.target.value)} />
              </Field>
              <Field label="Zone">
                <input className={inputClass} value={form.zone} onChange={(e) => onChange("zone", e.target.value)} />
              </Field>
              <Field label="Langue préférée">
                <select className={selectClass} value={form.preferred_language} onChange={(e) => onChange("preferred_language", e.target.value)}>
                  {["Français", "Arabe dialectal", "Bilingue"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Canal préféré">
                <select className={selectClass} value={form.preferred_channel} onChange={(e) => onChange("preferred_channel", e.target.value)}>
                  {preferredChannels.map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Source lead">
                <select className={selectClass} value={form.source} onChange={(e) => onChange("source", e.target.value)}>
                  {candidateSources.map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Ambassadeur source">
                <select className={selectClass} value={form.ambassador_id} onChange={(e) => onChange("ambassador_id", e.target.value)}>
                  <option value="">Non attribué</option>
                  {snapshot.ambassadors.slice(0, 80).map((item: AnyRecord) => <option key={item.id} value={item.id}>{item.full_name || item.name} — {item.city || "Ville"}</option>)}
                </select>
              </Field>
              <Field label="Campagne / code promo" className="md:col-span-2">
                <input className={inputClass} value={form.source_campaign} onChange={(e) => onChange("source_campaign", e.target.value)} placeholder="IG-OPS-RABAT-07 / code promotionnel" />
              </Field>
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Besoin & contexte</h3>
              <StatusPill tone="blue">{isB2B ? "B2B" : "Parent"}</StatusPill>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {isB2B ? (
                <>
                  <Field label="Établissement / organisation">
                    <input className={inputClass} value={form.establishment_name} onChange={(e) => onChange("establishment_name", e.target.value)} />
                  </Field>
                  <Field label="Type de besoin">
                    <input className={inputClass} value={form.need_type} onChange={(e) => onChange("need_type", e.target.value)} />
                  </Field>
                  <Field label="Volume potentiel">
                    <input className={inputClass} value={form.potential_volume} onChange={(e) => onChange("potential_volume", e.target.value)} />
                  </Field>
                  <Field label="Délai de décision">
                    <input className={inputClass} value={form.decision_delay} onChange={(e) => onChange("decision_delay", e.target.value)} />
                  </Field>
                  <Field label="Décideur identifié">
                    <input className={inputClass} value={form.decision_maker} onChange={(e) => onChange("decision_maker", e.target.value)} />
                  </Field>
                  <Field label="Budget probable">
                    <input className={inputClass} value={form.probable_budget} onChange={(e) => onChange("probable_budget", e.target.value)} />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Âge enfant">
                    <select className={selectClass} value={form.child_age} onChange={(e) => onChange("child_age", e.target.value)}>
                      {contextOptions.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </Field>
                  <Field label="Besoin garde">
                    <select className={selectClass} value={form.need} onChange={(e) => onChange("need", e.target.value)}>
                      {leadNeeds.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </Field>
                  <Field label="Fréquence">
                    <input className={inputClass} value={form.frequency} onChange={(e) => onChange("frequency", e.target.value)} />
                  </Field>
                  <Field label="Urgence">
                    <select className={selectClass} value={form.urgency} onChange={(e) => onChange("urgency", e.target.value)}>
                      {["Immédiat", "Sous 48h", "Sous 7 jours", "Ce mois-ci", "Exploration uniquement"].map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </Field>
                  <Field label="Horaire souhaité">
                    <input className={inputClass} value={form.desired_time} onChange={(e) => onChange("desired_time", e.target.value)} />
                  </Field>
                  <Field label="Budget estimé">
                    <input className={inputClass} value={form.budget_estimate} onChange={(e) => onChange("budget_estimate", e.target.value)} />
                  </Field>
                </>
              )}
            </div>
          </section>

          <section className="rounded-[30px] border border-blue-100 bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] p-5 shadow-sm shadow-blue-100/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Qualification commerciale</h3>
              <StatusPill tone={leadTemp.tone}>{liveScore}%</StatusPill>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Température">
                <input className={inputClass} readOnly value={leadTemp.label} />
              </Field>
              <Field label="Score">
                <select className={selectClass} value={form.score} onChange={(e) => onChange("score", e.target.value)}>
                  {["52", "62", "72", "82", "92"].map((item) => <option key={item} value={item}>{item}%</option>)}
                </select>
              </Field>
              <Field label="Probabilité conversion">
                <select className={selectClass} value={form.conversion_probability} onChange={(e) => onChange("conversion_probability", e.target.value)}>
                  {["28", "48", "68", "82", "92"].map((item) => <option key={item} value={item}>{item}%</option>)}
                </select>
              </Field>
              <Field label="Maturité">
                <select className={selectClass} value={form.maturity} onChange={(e) => onChange("maturity", e.target.value)}>
                  {["À valider", "En réflexion", "Préqualifié", "Prêt à closer"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Risque doublon">
                <select className={selectClass} value={form.duplicate_risk} onChange={(e) => onChange("duplicate_risk", e.target.value)}>
                  {["Faible", "Moyen", "Élevé"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Qualité contact">
                <select className={selectClass} value={form.quality_score} onChange={(e) => onChange("quality_score", e.target.value)}>
                  {["52", "62", "72", "78", "88"].map((item) => <option key={item} value={item}>{item}%</option>)}
                </select>
              </Field>
              <Field label="Statut CRM">
                <select className={selectClass} value={form.status} onChange={(e) => onChange("status", e.target.value)}>
                  {["new", "qualified", "hot", "follow_up"].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Owner">
                <input className={inputClass} value={form.owner} onChange={(e) => onChange("owner", e.target.value)} />
              </Field>
              <Field label="Note interne" className="md:col-span-2 xl:col-span-3">
                <textarea className={textareaClass} value={form.internal_note} onChange={(e) => onChange("internal_note", e.target.value)} />
              </Field>
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Suivi & attribution</h3>
              <StatusPill tone="emerald">{form.followup_channel}</StatusPill>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Territoire">
                <select className={selectClass} value={form.territory_id} onChange={(e) => onChange("territory_id", e.target.value)}>
                  <option value="">Non attribué</option>
                  {snapshot.territories.slice(0, 80).map((item: AnyRecord) => <option key={item.id} value={item.id}>{item.name} — {item.city || "Ville"}</option>)}
                </select>
              </Field>
              <Field label="Responsable suivi">
                <input className={inputClass} value={form.owner} onChange={(e) => onChange("owner", e.target.value)} />
              </Field>
              <Field label="Prochaine action">
                <select className={selectClass} value={form.next_action} onChange={(e) => onChange("next_action", e.target.value)}>
                  {["Relance WhatsApp", "Appel de qualification", "Email de rappel", "Planifier visite", "Transfert manager"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Date de relance">
                <input type="datetime-local" className={inputClass} value={form.next_followup_at} onChange={(e) => onChange("next_followup_at", e.target.value)} />
              </Field>
              <Field label="Canal de relance">
                <select className={selectClass} value={form.followup_channel} onChange={(e) => onChange("followup_channel", e.target.value)}>
                  {["WhatsApp", "Appel direct", "Email", "WhatsApp + appel"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Message WhatsApp suggéré" className="md:col-span-2">
                <textarea className={textareaClass} value={form.whatsapp_message || `Bonjour ${form.lead_name || "contact"}, AngelCare vous recontacte pour ${isB2B ? form.need_type || "votre besoin" : form.need.toLowerCase()}.`} onChange={(e) => onChange("whatsapp_message", e.target.value)} />
              </Field>
              <Field label="Checklist qualification" className="md:col-span-2">
                <textarea className={textareaClass} value={form.notes} onChange={(e) => onChange("notes", e.target.value)} />
              </Field>
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-[30px] border border-blue-100 bg-[linear-gradient(180deg,#ffffff_0%,#f6faff_100%)] p-5 shadow-sm shadow-blue-100/60">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">Qualification cockpit</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">{leadTemp.label}</h3>
              </div>
              <StatusPill tone={leadTemp.tone}>{liveScore}%</StatusPill>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-3xl border border-white bg-white p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Temperature</p>
                <p className="mt-2 text-sm font-black text-slate-950">{leadTemp.label}</p>
              </div>
              <div className="rounded-3xl border border-white bg-white p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Risk duplicate</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{form.duplicate_risk}</p>
              </div>
              <div className="rounded-3xl border border-white bg-white p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Probability</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{form.conversion_probability}%</p>
              </div>
              <div className="rounded-3xl border border-white bg-white p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Quality</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{form.quality_score}%</p>
              </div>
            </div>
            <div className="mt-4 rounded-3xl border border-white bg-white p-4 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Suggested next action</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{form.next_action} · {form.followup_channel}</p>
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Champs manquants</h3>
              <StatusPill tone={missingBase.length ? "amber" : "emerald"}>{missingBase.length}</StatusPill>
            </div>
            <div className="mt-4 space-y-2">
              {missingBase.length ? missingBase.map((item) => <div key={item} className="flex items-start gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"><AlertTriangle size={14} className="mt-0.5 shrink-0" />{item}</div>) : <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">Lead prêt pour création.</div>}
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Checklist qualification</h3>
              <StatusPill tone="emerald">{checklist.filter((item) => item.done).length}/{checklist.length}</StatusPill>
            </div>
            <div className="mt-4 space-y-3">
              {checklist.map((item) => (
                <div key={item.label} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <span className={`mt-0.5 grid h-5 w-5 place-items-center rounded-full ${item.done ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                    <CheckCircle2 size={13} />
                  </span>
                  <div>
                    <p className="text-sm font-black text-slate-950">{item.label}</p>
                    <p className="text-xs font-semibold text-slate-500">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[30px] border border-blue-100 bg-[linear-gradient(180deg,#f7fbff_0%,#eef5ff_100%)] p-5 shadow-sm shadow-blue-100/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Attribution</h3>
              <StatusPill tone="blue">CRM</StatusPill>
            </div>
            <div className="mt-4 rounded-3xl border border-white bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Territory / ambassador</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{labelForTerritory(snapshot, form.territory_id)} · {labelForAmbassador(snapshot, form.ambassador_id)}</p>
              <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">La qualification reste centrée sur la donnée utile et l’attribution opérationnelle, pas sur des panneaux décoratifs.</p>
            </div>
          </section>
        </aside>
      </form>
    </ModalShell>
  )
}

function ConversionModal({
  busy,
  conversion,
  note,
  onNote,
  onClose,
  onDecide,
  snapshot,
}: {
  busy: boolean
  conversion?: AnyRecord
  note: string
  onNote: (value: string) => void
  onClose: () => void
  onDecide: (status: "validated" | "rejected" | "proof_requested" | "escalated") => void
  snapshot: AmbassadorWorkspaceSnapshot
}) {
  const queue = useMemo(() => ((snapshot as AnyRecord).conversions || []) as AnyRecord[], [snapshot])
  const [selectedId, setSelectedId] = useState(String(conversion?.id || queue[0]?.id || ""))
  const selected = queue.find((item) => item.id === selectedId) || conversion || queue[0]
  const queueSlice = queue.slice(0, 8)

  const proofChecklist = [
    { label: "Attribution source cohérente", done: Boolean(selected?.lead_id || selected?.lead_name) },
    { label: "Ambassadeur identifié", done: Boolean(selected?.ambassador_id || selected?.ambassador_name) },
    { label: "Offre / valeur lisible", done: Boolean(selected?.offer_name || selected?.value) },
    { label: "Aucun doublon bloquant", done: String(selected?.status || "pending") !== "duplicate" },
    { label: "Preuve exploitable", done: Boolean(selected?.proof_url || selected?.validation_note) },
  ]
  const decisionReason = busy ? "Traitement en cours." : selected?.id ? `Décision sur ${selected.lead_name || "conversion"}` : "Aucune conversion à traiter."

  return (
    <ModalShell
      title="Conversions à valider"
      subtitle="Workspace de validation pour la queue, la logique d’attribution, la preuve, le risque de doublon et la décision d’audit."
      icon={ClipboardCheck}
      onClose={onClose}
      width="w-[calc(100vw-32px)] lg:w-[85vw] lg:max-w-[1560px]"
      footer={
        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1 text-xs font-semibold text-slate-500">
            <p className="font-black text-slate-900">{selected?.lead_name || "Aucune conversion sélectionnée"}</p>
            <p>{decisionReason}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
              Annuler
            </button>
            <button type="button" disabled={busy || !selected?.id} onClick={() => onDecide("proof_requested")} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-700 disabled:opacity-50">
              Demander preuve
            </button>
            <button type="button" disabled={busy || !selected?.id} onClick={() => onDecide("escalated")} className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 disabled:opacity-50">
              Escalader
            </button>
            <button type="button" disabled={busy || !selected?.id} onClick={() => onDecide("rejected")} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 disabled:opacity-50">
              Rejeter
            </button>
            <button type="button" disabled={busy || !selected?.id} onClick={() => onDecide("validated")} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">
              Valider & attribuer
            </button>
          </div>
        </div>
      }
    >
      {selected ? (
        <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Queue conversions</h3>
              <StatusPill tone="amber">{queueSlice.length}</StatusPill>
            </div>
            <div className="mt-4 space-y-3">
              {(queueSlice.length ? queueSlice : [selected]).map((item: AnyRecord) => {
                const isSelected = item.id === selectedId || (!selectedId && item.id === selected?.id)
                return (
                  <button
                    key={item.id || item.lead_name}
                    type="button"
                    onClick={() => setSelectedId(String(item.id || ""))}
                    className={`w-full rounded-3xl border p-4 text-left transition ${
                      isSelected ? "border-blue-300 bg-blue-50 shadow-lg shadow-blue-100/60" : "border-slate-200 bg-slate-50/80 hover:border-blue-200 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-950">{item.lead_name || "Conversion"}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{item.source || "Source lead"} · {item.city || "Ville"}</p>
                      </div>
                      <StatusPill tone={String(item.status || "pending") === "validated" ? "emerald" : String(item.status || "pending") === "rejected" ? "rose" : "amber"}>
                        {String(item.status || "pending")}
                      </StatusPill>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-600">
                      <span>{item.ambassador_name || labelForAmbassador(snapshot, item.ambassador_id)}</span>
                      <span>{formatMoney(item.value || 0, item.currency || "MAD")}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <div className="space-y-5">
            <section className="rounded-[30px] border border-blue-100 bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] p-5 shadow-sm shadow-blue-100/60">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">Selected conversion</p>
                  <h3 className="mt-1 text-lg font-black text-slate-950">{selected.lead_name || "Conversion"}</h3>
                </div>
                <StatusPill tone="blue">{selected.city || "Ville"}</StatusPill>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-white bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Lead source</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{selected.source || "Non renseignée"}</p>
                </div>
                <div className="rounded-3xl border border-white bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Ambassador</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{selected.ambassador_name || labelForAmbassador(snapshot, selected.ambassador_id)}</p>
                </div>
                <div className="rounded-3xl border border-white bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Attribution logic</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Source, territoire, score et validité de preuve servent d’arbitrage.</p>
                </div>
                <div className="rounded-3xl border border-white bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Offer / value</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{selected.offer_name || "Offre AngelCare"} · {formatMoney(selected.value || 0, selected.currency || "MAD")}</p>
                </div>
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-black tracking-tight text-slate-950">Proof checklist</h3>
                  <StatusPill tone="emerald">{proofChecklist.filter((item) => item.done).length}/{proofChecklist.length}</StatusPill>
                </div>
                <div className="mt-4 space-y-3">
                  {proofChecklist.map((item) => (
                    <div key={item.label} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <span className={`mt-0.5 grid h-5 w-5 place-items-center rounded-full ${item.done ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                        <CheckCircle2 size={13} />
                      </span>
                      <p className="text-sm font-black text-slate-950">{item.label}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[30px] border border-amber-100 bg-amber-50/70 p-5 shadow-sm shadow-amber-100/50">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-black tracking-tight text-slate-950">Risk flags</h3>
                  <StatusPill tone="amber">{String(selected.status || "pending")}</StatusPill>
                </div>
                <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-slate-700">
                  <p>Duplicata potentiel: {selected.duplicate_risk || "à vérifier par téléphone, email et source"}</p>
                  <p>Attribution: {selected.attribution_rule || "ambassadeur source + territoire + preuve"}</p>
                  <p>Audit note: {selected.validation_note || "Aucune note de validation fournie"}</p>
                  <p>Decision reason: {note || "Renseigner le motif d’audit avant validation."}</p>
                </div>
              </section>
            </div>

            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
              <Field label="Audit note / decision reason">
                <textarea className={textareaClass} value={note} onChange={(e) => onNote(e.target.value)} />
              </Field>
            </section>
          </div>
        </div>
      ) : (
        <p className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm font-bold text-slate-600">Aucune conversion à traiter pour le moment.</p>
      )}
    </ModalShell>
  )
}

function IncentiveModal({
  busy,
  incentive,
  note,
  onNote,
  onClose,
  onDecide,
  snapshot,
}: {
  busy: boolean
  incentive?: AnyRecord
  note: string
  onNote: (value: string) => void
  onClose: () => void
  onDecide: (decision: "approve" | "reject" | "pay" | "block") => void
  snapshot: AmbassadorWorkspaceSnapshot
}) {
  const pendingQueue = useMemo(() => snapshot.incentives.filter((item: AnyRecord) => item.status === "pending"), [snapshot.incentives])
  const [selectedId, setSelectedId] = useState(String(incentive?.id || pendingQueue[0]?.id || ""))
  const selected = pendingQueue.find((item: AnyRecord) => item.id === selectedId) || incentive || pendingQueue[0]
  const ambassador = selected ? snapshot.ambassadors.find((item: AnyRecord) => item.id === selected.ambassador_id) : null
  const eligibleRules = [
    { label: "Source traçable", done: Boolean(selected?.ambassador_id) },
    { label: "Montant cohérent", done: Number(selected?.amount || 0) > 0 },
    { label: "Preuve / conversion consultable", done: Boolean(selected?.reason || selected?.approved_at || selected?.paid_at) },
    { label: "Aucune alerte fraude critique", done: String(selected?.status || "pending") !== "flagged" },
  ]
  const payoutCycle = selected?.paid_at ? "Payé" : selected?.approved_at ? "En attente paiement" : "En revue finance"
  const rule10 = String(selected?.incentive_type || "").toLowerCase().includes("commission") || String(selected?.reason || "").includes("10%")

  return (
    <ModalShell
      title="Incentives en attente"
      subtitle="Espace finance / risque pour contrôler les montants, la règle de commission, l’éligibilité et le cycle de paiement."
      icon={Wallet}
      onClose={onClose}
      footer={
        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1 text-xs font-semibold text-slate-500">
            <p className="font-black text-slate-900">{selected ? labelForAmbassador(snapshot, selected.ambassador_id) : "Aucun incentive sélectionné"}</p>
            <p>{selected ? `Cycle: ${payoutCycle}` : "Aucune ligne en attente."}</p>
            <p>{note || "Renseigner une note finance avant décision."}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
              Annuler
            </button>
            <button type="button" disabled={busy || !selected?.id} onClick={() => onDecide("block")} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 disabled:opacity-50">
              Bloquer
            </button>
            <button type="button" disabled={busy || !selected?.id} onClick={() => onDecide("reject")} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 disabled:opacity-50">
              Rejeter
            </button>
            <button type="button" disabled={busy || !selected?.id} onClick={() => onDecide("approve")} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 disabled:opacity-50">
              Approuver
            </button>
            <button type="button" disabled={busy || !selected?.id} onClick={() => onDecide("pay")} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">
              Marquer payé
            </button>
          </div>
        </div>
      }
    >
      {selected ? (
        <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Pending incentives</h3>
              <StatusPill tone="amber">{pendingQueue.length}</StatusPill>
            </div>
            <div className="mt-4 space-y-3">
              {(pendingQueue.length ? pendingQueue : [selected]).map((item: AnyRecord) => {
                const isSelected = item.id === selectedId
                return (
                  <button
                    key={item.id || item.ambassador_id}
                    type="button"
                    onClick={() => setSelectedId(String(item.id || ""))}
                    className={`w-full rounded-3xl border p-4 text-left transition ${
                      isSelected ? "border-blue-300 bg-blue-50 shadow-lg shadow-blue-100/60" : "border-slate-200 bg-slate-50/80 hover:border-blue-200 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-950">{labelForAmbassador(snapshot, item.ambassador_id)}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{item.incentive_type || "Commission"} · {item.status || "pending"}</p>
                      </div>
                      <StatusPill tone="blue">{formatMoney(item.amount || 0, item.currency || "MAD")}</StatusPill>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <div className="space-y-5">
            <section className="rounded-[30px] border border-blue-100 bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] p-5 shadow-sm shadow-blue-100/60">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">Selected incentive</p>
                  <h3 className="mt-1 text-lg font-black text-slate-950">{labelForAmbassador(snapshot, selected.ambassador_id)}</h3>
                </div>
                <StatusPill tone="blue">{payoutCycle}</StatusPill>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-white bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Mini profile</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{ambassador?.city || selected.city || "Ville"} · {ambassador?.region || "Région"} · Performance {ambassador?.performance_score || "N/A"}</p>
                </div>
                <div className="rounded-3xl border border-white bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Source mission / conversion</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{selected.source_mission || selected.reason || "Mission ou conversion source"}</p>
                </div>
                <div className="rounded-3xl border border-white bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Commission basis</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{selected.incentive_type || "Commission"} · {formatMoney(selected.amount || 0, selected.currency || "MAD")}</p>
                </div>
                <div className="rounded-3xl border border-white bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">10% rule</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{rule10 ? "Règle 10% visible pour cette ligne." : "Aucune règle 10% explicite détectée."}</p>
                </div>
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-black tracking-tight text-slate-950">Eligibility conditions</h3>
                  <StatusPill tone={eligibleRules.filter((item) => item.done).length === eligibleRules.length ? "emerald" : "amber"}>{eligibleRules.filter((item) => item.done).length}/{eligibleRules.length}</StatusPill>
                </div>
                <div className="mt-4 space-y-3">
                  {eligibleRules.map((item) => (
                    <div key={item.label} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <span className={`mt-0.5 grid h-5 w-5 place-items-center rounded-full ${item.done ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                        <CheckCircle2 size={13} />
                      </span>
                      <div>
                        <p className="text-sm font-black text-slate-950">{item.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[30px] border border-amber-100 bg-amber-50/70 p-5 shadow-sm shadow-amber-100/50">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-black tracking-tight text-slate-950">Risk flags</h3>
                  <StatusPill tone="amber">{String(selected.status || "pending")}</StatusPill>
                </div>
                <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-slate-700">
                  <p>Payout cycle: {payoutCycle}</p>
                  <p>Eligibility: {selected.eligibility_note || "à vérifier avant validation"}</p>
                  <p>Finance note: {note || "renseigner la note finance / risque"}</p>
                  <p>Hold reason: {selected.reason || "non renseigné"}</p>
                </div>
              </section>
            </div>

            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
              <Field label="Finance note">
                <textarea className={textareaClass} value={note} onChange={(e) => onNote(e.target.value)} />
              </Field>
            </section>
          </div>
        </div>
      ) : (
        <p className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm font-bold text-slate-600">Aucun incentive à traiter pour le moment.</p>
      )}
    </ModalShell>
  )
}

function ExportModal({
  busy,
  onClose,
  onExport,
  form,
  onChange,
}: {
  busy: boolean
  onClose: () => void
  onExport: () => void
  form: typeof defaultReportConfig
  onChange: (key: string, value: string) => void
}) {
  const missing = useMemo(() => reportMissingFields(form), [form])
  const pdfUnavailableReason = "PDF unavailable: this backend endpoint generates CSV exports only."

  return (
    <ModalShell
      title="Exporter le rapport"
      subtitle="Configuration d’export opérationnel avec période, périmètre, destinataires, sections incluses et conditions d’approbation."
      icon={Download}
      onClose={onClose}
      footer={
        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1 text-xs font-semibold text-slate-500">
            <p className="font-black text-slate-900">{form.report_type}</p>
            <p>{missing.length ? describeMissing(missing) : "Export prêt."}</p>
            <p>{form.format === "PDF" ? pdfUnavailableReason : "CSV backend export reste actif."}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
              Annuler
            </button>
            <button type="button" disabled className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-400 disabled:opacity-100" title={pdfUnavailableReason}>
              PDF indisponible
            </button>
            <button type="button" disabled={busy || missing.length > 0} onClick={onExport} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">
              {busy ? "Génération..." : "Exporter CSV"}
            </button>
          </div>
        </div>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-black tracking-tight text-slate-950">Report configuration</h3>
            <StatusPill tone="blue">Backend export</StatusPill>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Report type">
              <select className={selectClass} value={form.report_type} onChange={(e) => onChange("report_type", e.target.value)}>
                {reportTypes.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Format">
              <select className={selectClass} value={form.format} onChange={(e) => onChange("format", e.target.value)}>
                {reportFormats.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Period start">
              <input type="date" className={inputClass} value={form.period_start} onChange={(e) => onChange("period_start", e.target.value)} />
            </Field>
            <Field label="Period end">
              <input type="date" className={inputClass} value={form.period_end} onChange={(e) => onChange("period_end", e.target.value)} />
            </Field>
            <Field label="Cities" className="md:col-span-2">
              <textarea className={textareaClass} value={form.cities} onChange={(e) => onChange("cities", e.target.value)} placeholder="Rabat, Casablanca..." />
            </Field>
            <Field label="Ambassadors" className="md:col-span-2">
              <textarea className={textareaClass} value={form.ambassadors} onChange={(e) => onChange("ambassadors", e.target.value)} placeholder="IDs, noms, ou sélecteur externe" />
            </Field>
            <Field label="Sections included" className="md:col-span-2">
              <textarea className={textareaClass} value={form.sections} onChange={(e) => onChange("sections", e.target.value)} placeholder="KPIs, missions, conversions..." />
            </Field>
            <Field label="Recipients" className="md:col-span-2">
              <input className={inputClass} value={form.recipients} onChange={(e) => onChange("recipients", e.target.value)} placeholder="OPS, Finance, Direction" />
            </Field>
            <Field label="Approval / signature" className="md:col-span-2">
              <input className={inputClass} value={form.approval_signature} onChange={(e) => onChange("approval_signature", e.target.value)} placeholder="AngelCare OPS" />
            </Field>
            <Field label="Export conditions" className="md:col-span-2">
              <textarea className={textareaClass} value={form.export_conditions} onChange={(e) => onChange("export_conditions", e.target.value)} />
            </Field>
          </div>
        </section>

        <section className="space-y-5">
          <div className="rounded-[30px] border border-blue-100 bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] p-5 shadow-sm shadow-blue-100/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Export status</h3>
              <StatusPill tone={missing.length ? "amber" : "emerald"}>{missing.length}</StatusPill>
            </div>
            <div className="mt-4 space-y-2">
              {missing.length ? missing.map((item) => <div key={item} className="flex items-start gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"><AlertTriangle size={14} className="mt-0.5 shrink-0" />{item}</div>) : <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">Export prêt pour CSV backend.</div>}
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <h3 className="text-sm font-black tracking-tight text-slate-950">Delivery controls</h3>
            <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-slate-600">
              <p>CSV backend export: réel et tracé via l’API.</p>
              <p>PDF unavailable: {pdfUnavailableReason}</p>
              <p>Approval/signature: {form.approval_signature || "N/A"}</p>
              <p>Recipients: {form.recipients || "N/A"}</p>
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <h3 className="text-sm font-black tracking-tight text-slate-950">Sections preview</h3>
            <div className="mt-4 rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Included</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{form.sections || "KPIs, missions, recrutement, leads, conversions, incentives"}</p>
            </div>
          </div>
        </section>
      </div>
    </ModalShell>
  )
}
*/
