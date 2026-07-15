"use client"

import { useMemo, useState, type ComponentType, type FormEvent, type ReactNode } from "react"
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  Loader2,
  MapPinned,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react"
import type { AmbassadorIncentive, AmbassadorMission, AmbassadorRecruitmentRecord, AmbassadorWorkspaceSnapshot } from "@/lib/market-os/ambassadors/types"

type AnyRecord = Record<string, any>
type IconType = ComponentType<{ size?: number; className?: string }>

export type CockpitModalFeedback = {
  tone: "success" | "error" | "info"
  message: string
}

export type ReportPreview = {
  title: string
  summary: string
  metrics: { label: string; value: string }[]
  lines: string[]
}

export const candidateCities = ["Rabat", "Salé", "Témara", "Casablanca", "Kénitra", "Tanger", "Fès", "Marrakech", "Agadir"]
export const candidateSources = [
  "Recommandation",
  "Terrain",
  "Instagram",
  "WhatsApp",
  "Candidature spontanée",
  "Partenaire",
  "Événement",
]
export const preferredChannels = ["WhatsApp", "Appel", "Email"]
export const availabilityDays = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
export const availabilitySlots = ["Matin", "Après-midi", "Soir", "Week-end"]
export const missionModes = ["Présentiel", "Hybride", "Digital"]
export const reportFormatOptions = [
  { label: "CSV", value: "csv", available: true, reason: "" },
  { label: "PDF A4", value: "pdf", available: false, reason: "Export PDF non disponible dans l'infrastructure actuelle." },
  { label: "Excel", value: "excel", available: false, reason: "Export Excel non disponible dans l'infrastructure actuelle." },
]

export const leadSegments = [
  { label: "Parent / famille", value: "Parent / famille", icon: Users, tone: "blue" },
  { label: "École / crèche", value: "École / crèche", icon: Building2, tone: "emerald" },
  { label: "Entreprise", value: "Entreprise", icon: Users, tone: "slate" },
  { label: "Partenaire local", value: "Partenaire local", icon: Star, tone: "amber" },
  { label: "Hôtel / événementiel", value: "Hôtel / événementiel", icon: Calendar, tone: "rose" },
  { label: "Professionnel santé", value: "Professionnel santé", icon: ShieldCheck, tone: "violet" },
]

export const reportTypes = [
  { label: "Rapport quotidien", value: "daily" },
  { label: "Performance ambassadeurs", value: "performance" },
  { label: "Missions terrain", value: "missions" },
  { label: "Leads & conversions", value: "leads-conversions" },
  { label: "Incentives & payouts", value: "incentives" },
  { label: "Synthèse exécutive", value: "executive" },
]

export const missionScenarioPresets = [
  {
    id: "prospection-parents",
    label: "Prospection parents",
    missionType: "prospection_parents",
    campaign: "Acquisition familles premium",
    objective: "Créer des conversations utiles avec des parents du quartier prioritaire.",
    expectedLeads: "12",
    expectedConversations: "12",
    expectedConversions: "3",
    priorityHint: "Haute",
    proof: "Journal terrain, liste contacts, objections, notes de relance.",
    script: "Présenter AngelCare comme une solution fiable, puis qualifier besoin, budget, quartier et disponibilité.",
    success: "12 conversations, 5 leads chauds, 2 relances qualifiées.",
    sla: "Qualification et rappel sous 24h.",
    channel: "WhatsApp + appel",
    validator: "Manager OPS",
    escalation: "Escalader au manager si aucune affectation sous 12h.",
    warning: "Charge modérée. Garder une seule mission active sur ce créneau.",
  },
  {
    id: "activation-quartier",
    label: "Activation quartier",
    missionType: "activation_quartier",
    campaign: "Présence locale de quartier",
    objective: "Installer une présence visible et collecter des recommandations qualifiées.",
    expectedLeads: "20",
    expectedConversations: "20",
    expectedConversions: "4",
    priorityHint: "Haute",
    proof: "Photos autorisées, carnet de terrain, contacts utiles, points d'entrée.",
    script: "Approche courte, rassurante et familiale pour ancrer AngelCare dans le quartier.",
    success: "20 contacts, 8 recommandations, 4 rappels sous 48h.",
    sla: "Boucler les retours terrain avant 18h.",
    channel: "WhatsApp",
    validator: "OPS terrain",
    escalation: "Escalader si aucune preuve terrain n'est reçue à l'heure limite.",
    warning: "Mission terrain dense. Éviter d'ajouter un second secteur le même jour.",
  },
  {
    id: "dépôt-flyers-premium",
    label: "Dépôt flyers premium",
    missionType: "distribution_support",
    campaign: "Visibilité locale premium",
    objective: "Déposer les supports premium dans les points de contact utiles.",
    expectedLeads: "8",
    expectedConversations: "10",
    expectedConversions: "2",
    priorityHint: "Normale",
    proof: "Liste points de dépôt, photos autorisées, feedback, contacts gardés.",
    script: "Présenter AngelCare rapidement, laisser une trace et relever les personnes intéressées.",
    success: "10 points de dépôt, 8 contacts, 2 rappels qualifiés.",
    sla: "Clôture sous 24h.",
    channel: "Terrain",
    validator: "Manager OPS",
    escalation: "Escalader si aucun point de dépôt n'est confirmé.",
    warning: "Mission logistique. Prévoir temps de saisie après visite.",
  },
  {
    id: "visite-partenaire-ecole",
    label: "Visite partenaire école/crèche",
    missionType: "partner_outreach",
    campaign: "Partenariats locaux",
    objective: "Obtenir un rendez-vous utile avec un partenaire ciblé.",
    expectedLeads: "6",
    expectedConversations: "6",
    expectedConversions: "1",
    priorityHint: "Haute",
    proof: "Nom du décideur, intérêt capturé, prochain rendez-vous.",
    script: "Positionner AngelCare comme une source de confiance pour familles et relais locaux.",
    success: "6 contacts décideurs, 2 rendez-vous, 1 dossier ouvert.",
    sla: "Retour de compte-rendu sous 12h.",
    channel: "Email + WhatsApp",
    validator: "Partnership Lead",
    escalation: "Escalader si le rendez-vous n'est pas confirmé 24h avant.",
    warning: "Mission relationnelle: garder un seul partenaire prioritaire par créneau.",
  },
  {
    id: "relance-leads-chauds",
    label: "Relance leads chauds",
    missionType: "follow_up",
    campaign: "Relance rapide leads chauds",
    objective: "Réactiver des leads chauds et fixer les prochaines étapes commerciales.",
    expectedLeads: "10",
    expectedConversations: "10",
    expectedConversions: "2",
    priorityHint: "Urgente",
    proof: "Historique de relance, statut, note de refus, créneau suivant.",
    script: "Rappeler l'intérêt exprimé, rassurer sur la disponibilité et cadrer un prochain échange.",
    success: "10 relances, 3 réponses, 2 rendez-vous de qualification.",
    sla: "Contact sous 2h puis suivi sous 24h.",
    channel: "Appel + WhatsApp",
    validator: "Manager conversion",
    escalation: "Escalader si aucune réponse après 2 tentatives.",
    warning: "Tranche courte mais sensible. Prioriser les leads au score le plus haut.",
  },
  {
    id: "présence-événement-local",
    label: "Présence événement local",
    missionType: "community_event",
    campaign: "Activation événementielle locale",
    objective: "Capter des leads sur un événement à forte fréquentation.",
    expectedLeads: "40",
    expectedConversations: "40",
    expectedConversions: "6",
    priorityHint: "Urgente",
    proof: "Liste présence, photos autorisées, contacts recueillis, feedback.",
    script: "Accroche courte, valeur AngelCare et collecte d'intérêt rapide.",
    success: "40 interactions, 12 leads, 1 partenariat événementiel.",
    sla: "Remonter les leads dans les 3 heures.",
    channel: "WhatsApp",
    validator: "OPS event",
    escalation: "Escalader si la logistique n'est pas confirmée 48h avant.",
    warning: "Mission à forte intensité; pas de chevauchement avec une autre activation.",
  },
  {
    id: "collecte-recommandations",
    label: "Collecte recommandations",
    missionType: "referral_collection",
    campaign: "Bouche-à-oreille structuré",
    objective: "Obtenir des recommandations de confiance et les qualifier.",
    expectedLeads: "15",
    expectedConversations: "15",
    expectedConversions: "2",
    priorityHint: "Normale",
    proof: "Liste contacts, source recommandation, notes de confiance, autorisation de rappel.",
    script: "Demander des recommandations ciblées avec un ton familial et rassurant.",
    success: "15 recommandations, 5 contacts joignables, 2 leads chauds.",
    sla: "Rappel des recommandations sous 24h.",
    channel: "WhatsApp",
    validator: "Manager OPS",
    escalation: "Escalader si moins de 3 recommandations sont obtenues à mi-parcours.",
    warning: "Bonne mission de réseau mais nécessite une discipline de saisie.",
  },
  {
    id: "activation-code-promo",
    label: "Activation code promo",
    missionType: "promotion_activation",
    campaign: "Activation code promo",
    objective: "Réactiver des prospects dormants avec une offre claire.",
    expectedLeads: "25",
    expectedConversations: "25",
    expectedConversions: "3",
    priorityHint: "Haute",
    proof: "Liste contacts, code transmis, réponses, statut d'usage.",
    script: "Présenter le bénéfice du code promo, puis pousser une prise de rendez-vous rapide.",
    success: "25 contacts, 8 utilisations, 3 rendez-vous qualifiés.",
    sla: "Boucler les conversions en 48h.",
    channel: "WhatsApp + appel",
    validator: "Sales OPS",
    escalation: "Escalader si aucun retour après diffusion du code.",
    warning: "Mission commerciale sensible: garder des créneaux de relance dédiés.",
  },
  {
    id: "contrôle-qualité-terrain",
    label: "Contrôle qualité terrain",
    missionType: "quality_control",
    campaign: "Qualité terrain & conformité",
    objective: "Vérifier le respect du playbook terrain et la qualité des preuves.",
    expectedLeads: "8",
    expectedConversations: "8",
    expectedConversions: "0",
    priorityHint: "Urgente",
    proof: "Checklist, preuves terrain, écart constaté, note corrective.",
    script: "Contrôler les standards, relever les écarts et documenter les correctifs.",
    success: "100% des points clés vérifiés, 0 écart critique non traité.",
    sla: "Rapport qualité sous 12h.",
    channel: "Email + WhatsApp",
    validator: "Head of OPS",
    escalation: "Escalader immédiatement tout écart critique.",
    warning: "Mission de supervision; réserver du temps de rédaction après visite.",
  },
]

export const defaultCandidate = {
  candidate_name: "",
  phone: "",
  email: "",
  city: "Rabat",
  main_city: "Rabat",
  district: "",
  zone: "",
  languages: "Arabe, Français",
  preferred_channel: "WhatsApp",
  source: "Recommandation",
  internal_referrer: "",
  campaign: "",
  availability: "Temps partiel",
  availability_days: "Lundi, Mardi, Mercredi",
  availability_slots: "Matin, Après-midi",
  terrain_mode: "Présentiel",
  mobility: "Transport public",
  action_radius: "5 km",
  weekly_capacity: "12 h / semaine",
  commercial_experience: "1-2 ans",
  field_experience: "Première expérience",
  family_knowledge: "Bonne",
  communication_confidence: "Bonne",
  digital_confidence: "Moyenne",
  prequal_score: "72",
  pipeline_stage: "screening",
  responsible_owner: "AngelCare OPS",
  interviewer: "Manager OPS",
  next_action: "Appel de préqualification aujourd'hui",
  followup_date: "",
  internal_notes: "",
  quality_checklist: "Identité, mobilité, disponibilité, digital, réseau",
  notes: "Préqualification à réaliser sur la disponibilité, l'aisance relationnelle, la mobilité et l'ancrage local.",
}

export const defaultMission = {
  scenario_id: missionScenarioPresets[0].id,
  title: missionScenarioPresets[0].label,
  mission_type: missionScenarioPresets[0].missionType,
  campaign: missionScenarioPresets[0].campaign,
  objective: missionScenarioPresets[0].objective,
  objective_secondary: "À préciser",
  leads_expected: missionScenarioPresets[0].expectedLeads,
  conversations_expected: missionScenarioPresets[0].expectedConversations,
  conversions_potential: missionScenarioPresets[0].expectedConversions,
  priority: "haute",
  deadline: "",
  sla_closing: missionScenarioPresets[0].sla,
  city: "Rabat",
  zone: "Centre / quartier prioritaire",
  territory: "",
  ambassador_id: "",
  overloaded_warning: missionScenarioPresets[0].warning,
  channel: missionScenarioPresets[0].channel,
  script: missionScenarioPresets[0].script,
  playbook: "Playbook terrain standard",
  proof_expected: missionScenarioPresets[0].proof,
  success_criteria: missionScenarioPresets[0].success,
  validator: missionScenarioPresets[0].validator,
  escalation_rule: missionScenarioPresets[0].escalation,
  operator_notes: "",
  assignment_notes: "",
  notify_ambassador: "oui",
}

export const defaultLead = {
  lead_type: "Parent / famille",
  contact_name: "",
  phone: "",
  whatsapp_available: "oui",
  email: "",
  city: "Rabat",
  zone: "",
  language: "Français",
  identified_need: "Garde enfant à domicile",
  child_age: "3-6 ans",
  estimated_volume: "",
  temperature: "tiède",
  qualification_score: "72",
  probable_budget: "",
  decision_delay: "",
  source: "Recommandation",
  ambassador_source: "",
  territory: "",
  duplicate_risk: "Faible",
  next_channel: "WhatsApp",
  next_followup_at: "",
  owner: "AngelCare OPS",
  structured_note: "",
  quality_checklist: "Contact normalisé, besoin clarifié, attribution, relance datée",
}

export const defaultReportConfig = {
  report_type: "daily",
  period_start: "",
  period_end: "",
  cities: "Rabat, Casablanca",
  ambassadors: "",
  sections: "KPIs, missions, recrutement, leads, conversions, incentives",
  recipients: "OPS, Finance, Direction",
  format: "csv",
  signature_note: "AngelCare OPS",
  export_scope: "Cockpit ambassadeurs",
}

function formatNumber(value?: number | string | null) {
  const numeric = Number(value || 0)
  if (!Number.isFinite(numeric)) return "0"
  return new Intl.NumberFormat("fr-FR").format(numeric)
}

function formatMoney(value?: number | string | null, currency = "MAD") {
  return `${formatNumber(value)} ${currency}`
}

function toneClasses(tone = "blue") {
  const tones: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    slate: "bg-slate-50 text-slate-700 border-slate-100",
    navy: "bg-slate-900 text-white border-slate-900",
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
    slate: "bg-slate-500",
    navy: "bg-slate-900",
  }
  return tones[tone] || tones.blue
}

function shortDate(value?: string | null) {
  if (!value) return "Non planifié"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
}

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
  if (score >= 85) return { label: "Très chaud", tone: "emerald" }
  if (score >= 70) return { label: "À suivre", tone: "blue" }
  return { label: "Signal faible", tone: "amber" }
}

function describeMissing(missing: string[]) {
  return missing.length ? `Bloqué: ${missing.join(", ")}` : ""
}

function readSubmitMode(event: FormEvent<HTMLFormElement>, fallback: string) {
  const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
  return submitter?.dataset.mode || fallback
}

function selectedMissionScenario(scenarioId: string) {
  return missionScenarioPresets.find((item) => item.id === scenarioId) || missionScenarioPresets[0]
}

function pickCities(snapshot: AmbassadorWorkspaceSnapshot) {
  const baseline = [
    { city: "Rabat", status: "Sain", coverage: 92, ambassadors: 42, leads: 512, conversions: 78, tone: "emerald" },
    { city: "Casablanca", status: "Attention", coverage: 74, ambassadors: 58, leads: 563, conversions: 93, tone: "amber" },
    { city: "Kénitra", status: "À risque", coverage: 48, ambassadors: 28, leads: 172, conversions: 43, tone: "rose" },
  ]

  return baseline.map((base) => {
    const ambassadors = snapshot.ambassadors.filter((item: AnyRecord) => String(item.city || "").toLowerCase() === base.city.toLowerCase())
    const territories = snapshot.territories.filter((item: AnyRecord) => String(item.city || "").toLowerCase() === base.city.toLowerCase())
    const missions = snapshot.missions.filter((item: AnyRecord) => String(item.city || "").toLowerCase() === base.city.toLowerCase())
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

function labelForAmbassador(snapshot: AmbassadorWorkspaceSnapshot, id?: string) {
  const record = snapshot.ambassadors.find((item: AnyRecord) => item.id === id)
  return record?.full_name || record?.name || "Non assigné"
}

function labelForTerritory(snapshot: AmbassadorWorkspaceSnapshot, id?: string) {
  const record = snapshot.territories.find((item: AnyRecord) => item.id === id)
  return record?.name || "Territoire non assigné"
}

function candidateCreateMissingFields(form: typeof defaultCandidate) {
  const missing: string[] = []
  if (!form.candidate_name.trim()) missing.push("Nom complet")
  if (!form.phone.trim()) missing.push("Téléphone")
  if (!form.email.trim()) missing.push("Email")
  if (!form.city.trim()) missing.push("Ville principale")
  if (!form.district.trim()) missing.push("Quartier / zone")
  if (!form.source.trim()) missing.push("Source")
  if (!form.languages.trim()) missing.push("Langues")
  if (!form.preferred_channel.trim()) missing.push("Canal préféré")
  if (!form.commercial_experience.trim()) missing.push("Expérience commerciale")
  if (!form.field_experience.trim()) missing.push("Expérience terrain")
  if (!form.family_knowledge.trim()) missing.push("Connaissance parentalité / enfance")
  if (!form.communication_confidence.trim()) missing.push("Aisance communication")
  if (!form.digital_confidence.trim()) missing.push("Niveau digital")
  if (!form.pipeline_stage.trim()) missing.push("Étape pipeline")
  if (!form.responsible_owner.trim()) missing.push("Responsable / interviewer")
  if (!form.next_action.trim()) missing.push("Prochaine action")
  if (!form.followup_date.trim()) missing.push("Date de relance")
  return missing
}

function candidateInterviewMissingFields(form: typeof defaultCandidate) {
  const missing = candidateCreateMissingFields(form)
  if (!form.interviewer.trim()) missing.push("Intervieweur")
  if (!form.quality_checklist.trim()) missing.push("Checklist qualité")
  return missing
}

function candidateLiveScore(form: typeof defaultCandidate) {
  const base = Number(form.prequal_score || 0)
  const bonuses = [
    form.availability.includes("Temps partiel") || form.availability.includes("Disponible") ? 5 : 0,
    form.mobility.includes("Transport") || form.mobility.includes("Moto") || form.mobility.includes("Voiture") ? 6 : 2,
    ["Bonne", "Très bonne"].includes(form.communication_confidence) ? 6 : form.communication_confidence === "Moyenne" ? 3 : 0,
    ["Bonne", "Très bonne"].includes(form.digital_confidence) ? 5 : form.digital_confidence === "Moyenne" ? 2 : 0,
    form.internal_notes.trim() ? 2 : 0,
  ]
  return Math.max(0, Math.min(100, base + bonuses.reduce((sum, value) => sum + value, 0)))
}

function candidateReadiness(form: typeof defaultCandidate) {
  const score = candidateLiveScore(form)
  const missing = candidateCreateMissingFields(form)
  const interviewMissing = candidateInterviewMissingFields(form)
  const band = scoreBand(score)
  if (missing.length) return { score, missing, interviewMissing, status: "Incomplet" as const, tone: "amber" as const, label: "Compléter le dossier" as const, band }
  if (score >= 85) return { score, missing, interviewMissing, status: "Prêt entretien" as const, tone: "emerald" as const, label: "Créer + planifier entretien" as const, band }
  return { score, missing, interviewMissing, status: "Préqualifié" as const, tone: "blue" as const, label: "Créer candidat" as const, band }
}

function candidateChecklist(form: typeof defaultCandidate) {
  return [
    { label: "Identité vérifiée", done: Boolean(form.candidate_name.trim() && form.phone.trim() && form.email.trim()), detail: "Nom, téléphone, email" },
    { label: "Mobilité claire", done: Boolean(form.mobility.trim() && form.action_radius.trim()), detail: "Transport et rayon d'action" },
    { label: "Disponibilité cadrée", done: Boolean(form.availability_days.trim() && form.availability_slots.trim() && form.weekly_capacity.trim()), detail: "Temps et créneaux" },
    { label: "Compétence digitale", done: ["Bonne", "Très bonne"].includes(form.digital_confidence), detail: "WhatsApp et CRM" },
    { label: "Risque noté", done: Boolean(form.internal_notes.trim()), detail: "Blocage ou vigilance" },
  ]
}

function leadCreateMissingFields(form: typeof defaultLead) {
  const missing: string[] = []
  if (!form.contact_name.trim()) missing.push("Nom du contact")
  if (!form.phone.trim()) missing.push("Téléphone")
  if (!form.email.trim()) missing.push("Email")
  if (!form.city.trim()) missing.push("Ville")
  if (!form.zone.trim()) missing.push("Quartier / zone")
  if (!form.lead_type.trim()) missing.push("Type de lead")
  if (!form.source.trim()) missing.push("Source")
  if (!form.ambassador_source.trim()) missing.push("Ambassadeur source")
  if (!form.territory.trim()) missing.push("Territoire")
  if (!form.next_channel.trim()) missing.push("Prochain canal")
  if (!form.next_followup_at.trim()) missing.push("Date de relance")
  if (!form.owner.trim()) missing.push("Responsable suivi")
  return missing
}

function leadLiveScore(form: typeof defaultLead) {
  const base = Number(form.qualification_score || 0)
  const whatsappBonus = form.whatsapp_available === "oui" ? 5 : 0
  const scoringBonus = Number(form.probable_budget ? 4 : 0)
  const attributionBonus = form.ambassador_source && form.territory ? 6 : 0
  return Math.max(0, Math.min(100, base + whatsappBonus + scoringBonus + attributionBonus))
}

function leadTemperature(form: typeof defaultLead) {
  const score = leadLiveScore(form)
  if (form.temperature === "chaud" || score >= 85) return { label: "Chaud", tone: "emerald" }
  if (form.temperature === "tiède" || score >= 70) return { label: "Tiède", tone: "blue" }
  return { label: "Froid", tone: "amber" }
}

function leadChecklist(form: typeof defaultLead) {
  return [
    { label: "Contact normalisé", done: Boolean(form.contact_name.trim() && form.phone.trim()), detail: "Nom et téléphone" },
    { label: "Besoin cadré", done: Boolean(form.identified_need.trim()), detail: "Signal commercial" },
    { label: "Attribution prête", done: Boolean(form.ambassador_source.trim() && form.territory.trim()), detail: "Source et territoire" },
    { label: "Relance datée", done: Boolean(form.next_followup_at.trim()), detail: "SLA de suivi" },
  ]
}

function missionMissingFields(form: typeof defaultMission) {
  const missing: string[] = []
  if (!form.title.trim()) missing.push("Titre de mission")
  if (!form.campaign.trim()) missing.push("Campagne")
  if (!form.objective.trim()) missing.push("Objectif principal")
  if (!form.leads_expected.trim()) missing.push("Leads attendus")
  if (!form.conversations_expected.trim()) missing.push("Conversations attendues")
  if (!form.conversions_potential.trim()) missing.push("Conversions potentielles")
  if (!form.priority.trim()) missing.push("Priorité")
  if (!form.deadline.trim()) missing.push("Deadline")
  if (!form.sla_closing.trim()) missing.push("SLA de clôture")
  if (!form.city.trim()) missing.push("Ville")
  if (!form.zone.trim()) missing.push("Zone")
  if (!form.territory.trim()) missing.push("Territoire")
  if (!form.ambassador_id.trim()) missing.push("Ambassadeur assigné")
  if (!form.channel.trim()) missing.push("Canal")
  if (!form.script.trim()) missing.push("Script conseillé")
  if (!form.playbook.trim()) missing.push("Playbook")
  if (!form.proof_expected.trim()) missing.push("Preuve attendue")
  if (!form.success_criteria.trim()) missing.push("Critères de réussite")
  if (!form.validator.trim()) missing.push("Responsable validation")
  if (!form.escalation_rule.trim()) missing.push("Escalade")
  return missing
}

function missionSummary(form: typeof defaultMission, snapshot: AmbassadorWorkspaceSnapshot) {
  const territoryName = labelForTerritory(snapshot, form.territory)
  const ambassadorName = labelForAmbassador(snapshot, form.ambassador_id)
  return [
    { label: "Ambassadeur", value: ambassadorName },
    { label: "Territoire", value: territoryName },
    { label: "Ville", value: form.city || "Non précisée" },
    { label: "Canal", value: form.channel },
    { label: "SLA", value: form.sla_closing },
  ]
}

function reportMissingFields(form: typeof defaultReportConfig) {
  const missing: string[] = []
  if (!form.report_type.trim()) missing.push("Type de rapport")
  if (!form.period_start.trim()) missing.push("Début de période")
  if (!form.period_end.trim()) missing.push("Fin de période")
  if (!form.sections.trim()) missing.push("Sections incluses")
  if (!form.recipients.trim()) missing.push("Destinataires")
  if (!form.signature_note.trim()) missing.push("Note de signature")
  return missing
}

export function buildReportPreview(snapshot: AmbassadorWorkspaceSnapshot, form: typeof defaultReportConfig): ReportPreview {
  const totalMissions = snapshot.missions.length
  const totalLeads = ((snapshot as AnyRecord).leads || []).length
  const totalConversions = ((snapshot as AnyRecord).conversions || []).length
  const totalIncentives = snapshot.incentives.length
  const metricMap: Record<string, { label: string; value: string }[]> = {
    daily: [
      { label: "Ambassadeurs actifs", value: formatNumber(snapshot.ambassadors.filter((item: AnyRecord) => item.status !== "archived").length) },
      { label: "Missions ouvertes", value: formatNumber(snapshot.missions.filter((item: AnyRecord) => item.status !== "completed").length) },
      { label: "Leads", value: formatNumber(totalLeads) },
    ],
    performance: [
      { label: "Ambassadeurs", value: formatNumber(snapshot.ambassadors.length) },
      { label: "Missions", value: formatNumber(totalMissions) },
      { label: "Conversions", value: formatNumber(totalConversions) },
    ],
    missions: [
      { label: "Missions", value: formatNumber(totalMissions) },
      { label: "En cours", value: formatNumber(snapshot.missions.filter((item: AnyRecord) => item.status !== "completed").length) },
      { label: "Terminées", value: formatNumber(snapshot.missions.filter((item: AnyRecord) => item.status === "completed").length) },
    ],
    "leads-conversions": [
      { label: "Leads", value: formatNumber(totalLeads) },
      { label: "Conversions", value: formatNumber(totalConversions) },
      { label: "Taux de validation", value: `${totalLeads ? Math.round((totalConversions / totalLeads) * 100) : 0}%` },
    ],
    incentives: [
      { label: "Incentives", value: formatNumber(totalIncentives) },
      { label: "En attente", value: formatNumber(snapshot.incentives.filter((item: AnyRecord) => item.status === "pending").length) },
      { label: "Payés", value: formatNumber(snapshot.incentives.filter((item: AnyRecord) => item.status === "paid").length) },
    ],
    executive: [
      { label: "Réseau", value: formatNumber(snapshot.ambassadors.length) },
      { label: "Territoires", value: formatNumber(snapshot.territories.length) },
      { label: "Audit", value: formatNumber(snapshot.audit.length) },
    ],
  }
  const lines = [
    `Périmètre: ${form.export_scope}`,
    `Villes: ${form.cities}`,
    `Ambassadeurs: ${form.ambassadors || "Tous"}`,
    `Sections: ${form.sections}`,
    `Destinataires: ${form.recipients}`,
    `Signature: ${form.signature_note}`,
    `Fenêtre: ${form.period_start || "N/D"} → ${form.period_end || "N/D"}`,
  ]
  return {
    title: reportTypes.find((item) => item.value === form.report_type)?.label || "Rapport",
    summary: "Prévisualisation opérationnelle générée à partir du snapshot ambassadeurs courant.",
    metrics: metricMap[form.report_type] || metricMap.daily,
    lines,
  }
}

function feedbackToneClasses(tone?: CockpitModalFeedback["tone"]) {
  if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-800"
  if (tone === "error") return "border-rose-200 bg-rose-50 text-rose-800"
  return "border-blue-200 bg-blue-50 text-blue-800"
}

function ModalFrame({
  title,
  subtitle,
  icon: Icon,
  width,
  feedback,
  onClose,
  footer,
  children,
  chrome = "blue",
}: {
  title: string
  subtitle: string
  icon: IconType
  width: string
  feedback?: CockpitModalFeedback | null
  onClose: () => void
  footer: ReactNode
  children: ReactNode
  chrome?: "blue" | "navy" | "amber" | "rose" | "slate"
}) {
  const topOffset = "var(--angelcare-overhead-height, 96px)"
  const chromeClasses: Record<string, string> = {
    blue: "bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)]",
    navy: "bg-[linear-gradient(180deg,#f5f8ff_0%,#eef3ff_100%)]",
    amber: "bg-[linear-gradient(180deg,#fffdf7_0%,#fff7e8_100%)]",
    rose: "bg-[linear-gradient(180deg,#fff9fa_0%,#fff1f4_100%)]",
    slate: "bg-[linear-gradient(180deg,#fbfcfe_0%,#f5f7fb_100%)]",
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] flex items-center justify-center bg-slate-950/28 px-4 py-3 backdrop-blur-sm" style={{ top: topOffset }}>
      <div className={`flex h-[calc(100dvh-var(--angelcare-overhead-height,96px)-24px)] flex-col overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 ${width}`}>
        <header className="sticky top-0 z-20 border-b border-slate-100 bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className={`grid h-12 w-12 place-items-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700 ${chrome === "amber" ? "bg-amber-50 text-amber-700 border-amber-100" : chrome === "rose" ? "bg-rose-50 text-rose-700 border-rose-100" : chrome === "navy" ? "bg-slate-900 text-white border-slate-900" : ""}`}>
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
          {feedback?.message ? (
            <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-bold ${feedbackToneClasses(feedback.tone)}`}>
              {feedback.message}
            </div>
          ) : null}
        </header>
        <div className={`flex-1 overflow-y-auto overscroll-contain px-6 py-6 ${chromeClasses[chrome]}`}>{children}</div>
        <footer className="sticky bottom-0 z-20 border-t border-slate-100 bg-white/95 px-6 py-4 backdrop-blur">{footer}</footer>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
  hint,
  className = "",
}: {
  label: string
  children: ReactNode
  hint?: string
  className?: string
}) {
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

function StatusPill({ children, tone = "blue" }: { children: ReactNode; tone?: string }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black ${toneClasses(tone)}`}>{children}</span>
}

function Checklist({ items, tone = "slate" }: { items: { label: string; done: boolean; detail?: string }[]; tone?: string }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <span className={`mt-0.5 grid h-5 w-5 place-items-center rounded-full ${item.done ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
            <CheckCircle2 size={13} />
          </span>
          <div>
            <p className="text-sm font-black text-slate-950">{item.label}</p>
            {item.detail ? <p className="text-xs font-semibold text-slate-500">{item.detail}</p> : null}
          </div>
        </div>
      ))}
    </div>
  )
}

function ScenarioCards({
  selectedId,
  onSelect,
}: {
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {missionScenarioPresets.map((item) => {
        const selected = item.id === selectedId
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`rounded-[24px] border p-4 text-left transition ${
              selected ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-200/70" : "border-slate-200 bg-white/90 hover:border-blue-200 hover:bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className={`grid h-9 w-9 place-items-center rounded-2xl ${selected ? "bg-white/10 text-white" : "bg-blue-50 text-blue-700"}`}>
                <MapPinned size={16} />
              </div>
              <StatusPill tone={selected ? "slate" : "blue"}>{item.priorityHint}</StatusPill>
            </div>
            <p className="mt-3 text-sm font-black tracking-tight">{item.label}</p>
            <p className={`mt-2 text-xs font-semibold leading-5 ${selected ? "text-slate-200" : "text-slate-500"}`}>{item.objective}</p>
          </button>
        )
      })}
    </div>
  )
}

export function AmbassadorCandidateIntakeModal({
  busy,
  form,
  snapshot,
  onChange,
  onSubmit,
  onClose,
  feedback,
}: {
  busy: boolean
  form: typeof defaultCandidate
  snapshot: AmbassadorWorkspaceSnapshot
  onChange: (key: string, value: string) => void
  onSubmit: (mode: "draft" | "create" | "interview") => void
  onClose: () => void
  feedback?: CockpitModalFeedback | null
}) {
  const readiness = useMemo(() => candidateReadiness(form), [form])
  const checklist = useMemo(() => candidateChecklist(form), [form])
  const cities = useMemo(() => pickCities(snapshot), [snapshot])
  const cityContext = cities.find((city) => city.city === form.city) || cities[0]
  const createReason = busy ? "Synchronisation en cours." : readiness.missing.length ? describeMissing(readiness.missing) : "Dossier prêt pour création."
  const interviewReason = busy ? "Synchronisation en cours." : readiness.interviewMissing.length ? describeMissing(readiness.interviewMissing) : "Dossier prêt pour création et entretien."
  const draftReason = busy ? "Synchronisation en cours." : "Le brouillon restera exploitable dans le pipeline recrutement."

  return (
    <ModalFrame
      title="Nouveau candidat"
      subtitle="Intake de recrutement premium pour préqualification, capacité terrain, qualité du dossier et planification d'entretien."
      icon={UserPlus}
      width="w-[calc(100vw-32px)] lg:w-[90vw] lg:max-w-[1120px]"
      feedback={feedback}
      onClose={onClose}
      chrome="blue"
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
            <button type="submit" form="candidate-form" data-mode="draft" disabled={busy} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
              Enregistrer brouillon
            </button>
            <button type="submit" form="candidate-form" data-mode="create" disabled={busy || readiness.missing.length > 0} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">
              {busy ? "Création..." : "Créer candidat"}
            </button>
            <button type="submit" form="candidate-form" data-mode="interview" disabled={busy || readiness.interviewMissing.length > 0} className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
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
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">Dossier de recrutement</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">Identité et ancrage local</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone={readiness.tone}>{readiness.status}</StatusPill>
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
              <Field label="Ville principale">
                <select className={selectClass} value={form.city} onChange={(e) => onChange("city", e.target.value)}>
                  {candidateCities.map((city) => <option key={city}>{city}</option>)}
                </select>
              </Field>
              <Field label="Quartier / zone">
                <input className={inputClass} value={form.district} onChange={(e) => onChange("district", e.target.value)} placeholder="Agdal, Centre..." />
              </Field>
              <Field label="Zone secondaire">
                <input className={inputClass} value={form.zone} onChange={(e) => onChange("zone", e.target.value)} placeholder="Rabat centre / périphérie" />
              </Field>
              <Field label="Langues">
                <input className={inputClass} value={form.languages} onChange={(e) => onChange("languages", e.target.value)} placeholder="Arabe, Français" />
              </Field>
              <Field label="Canal préféré">
                <select className={selectClass} value={form.preferred_channel} onChange={(e) => onChange("preferred_channel", e.target.value)}>
                  {preferredChannels.map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Source">
                <select className={selectClass} value={form.source} onChange={(e) => onChange("source", e.target.value)}>
                  {candidateSources.map((source) => <option key={source}>{source}</option>)}
                </select>
              </Field>
              <Field label="Parrain / source interne">
                <input className={inputClass} value={form.internal_referrer} onChange={(e) => onChange("internal_referrer", e.target.value)} placeholder="Nom du parrain ou du référent" />
              </Field>
              <Field label="Campagne associée" className="md:col-span-2">
                <input className={inputClass} value={form.campaign} onChange={(e) => onChange("campaign", e.target.value)} placeholder="Campagne ou code source" />
              </Field>
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black tracking-tight text-slate-950">Disponibilité & mobilité</h3>
                <StatusPill tone="emerald">Capacité</StatusPill>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Disponibilité">
                  <input className={inputClass} value={form.availability} onChange={(e) => onChange("availability", e.target.value)} placeholder="Temps partiel, week-end..." />
                </Field>
                <Field label="Jours disponibles">
                  <select className={selectClass} value={form.availability_days} onChange={(e) => onChange("availability_days", e.target.value)}>
                    {availabilityDays.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Créneaux">
                  <select className={selectClass} value={form.availability_slots} onChange={(e) => onChange("availability_slots", e.target.value)}>
                    {availabilitySlots.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Mode terrain">
                  <select className={selectClass} value={form.terrain_mode} onChange={(e) => onChange("terrain_mode", e.target.value)}>
                    {missionModes.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Mobilité">
                  <select className={selectClass} value={form.mobility} onChange={(e) => onChange("mobility", e.target.value)}>
                    {["À pied", "Transport public", "Moto", "Voiture"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Rayon d'action">
                  <select className={selectClass} value={form.action_radius} onChange={(e) => onChange("action_radius", e.target.value)}>
                    {["3 km", "5 km", "10 km", "Ville complète"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Capacité hebdomadaire">
                  <select className={selectClass} value={form.weekly_capacity} onChange={(e) => onChange("weekly_capacity", e.target.value)}>
                    {["8 h / semaine", "12 h / semaine", "16 h / semaine", "20 h / semaine", "Temps plein"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Notes internes" className="md:col-span-2">
                  <textarea className={textareaClass} value={form.internal_notes} onChange={(e) => onChange("internal_notes", e.target.value)} placeholder="Contraintes, vigilance, précisions opérationnelles..." />
                </Field>
              </div>
            </section>

            <section className="rounded-[30px] border border-blue-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-sm shadow-blue-100/60">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black tracking-tight text-slate-950">Profil & préqualification</h3>
                <StatusPill tone={readiness.tone}>{readiness.score}%</StatusPill>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Expérience commerciale">
                  <select className={selectClass} value={form.commercial_experience} onChange={(e) => onChange("commercial_experience", e.target.value)}>
                    {["Débutant", "1-2 ans", "3-5 ans", "5+ ans"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Expérience terrain">
                  <select className={selectClass} value={form.field_experience} onChange={(e) => onChange("field_experience", e.target.value)}>
                    {["Première expérience", "Habitué terrain", "Très expérimenté"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Connaissance parentalité / enfance">
                  <select className={selectClass} value={form.family_knowledge} onChange={(e) => onChange("family_knowledge", e.target.value)}>
                    {["Faible", "Moyenne", "Bonne", "Très bonne"].map((item) => <option key={item}>{item}</option>)}
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
                <Field label="Score préqualification">
                  <select className={selectClass} value={form.prequal_score} onChange={(e) => onChange("prequal_score", e.target.value)}>
                    {["52", "62", "72", "82", "92"].map((item) => <option key={item} value={item}>{item}%</option>)}
                  </select>
                </Field>
                <Field label="Étape pipeline">
                  <select className={selectClass} value={form.pipeline_stage} onChange={(e) => onChange("pipeline_stage", e.target.value)}>
                    {["screening", "interview", "validated", "on_hold"].map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Responsable / interviewer">
                  <input className={inputClass} value={form.responsible_owner} onChange={(e) => onChange("responsible_owner", e.target.value)} />
                </Field>
                <Field label="Prochaine action" className="md:col-span-2">
                  <input className={inputClass} value={form.next_action} onChange={(e) => onChange("next_action", e.target.value)} />
                </Field>
                <Field label="Date de relance">
                  <input type="datetime-local" className={inputClass} value={form.followup_date} onChange={(e) => onChange("followup_date", e.target.value)} />
                </Field>
                <Field label="Checklist qualité" className="md:col-span-2">
                  <textarea className={textareaClass} value={form.quality_checklist} onChange={(e) => onChange("quality_checklist", e.target.value)} />
                </Field>
              </div>
            </section>
          </div>
        </div>

        <aside className="space-y-5">
          <section className="rounded-[30px] border border-blue-100 bg-[linear-gradient(180deg,#ffffff_0%,#f6faff_100%)] p-5 shadow-sm shadow-blue-100/60">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">Score de readiness</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">{readiness.status}</h3>
              </div>
              <StatusPill tone={readiness.tone}>{readiness.score}%</StatusPill>
            </div>
            <div className="mt-4 h-2 rounded-full bg-slate-100">
              <div className={`h-2 rounded-full ${progressColor(readiness.band.tone)}`} style={{ width: `${readiness.score}%` }} />
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{readiness.band.label}. Le score évolue avec la disponibilité, la mobilité, le niveau digital et le réseau local.</p>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Checklist qualité</h3>
              <StatusPill tone="emerald">{checklist.filter((item) => item.done).length}/{checklist.length}</StatusPill>
            </div>
            <div className="mt-4">
              <Checklist items={checklist} />
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Affectation cible</h3>
              <StatusPill tone="blue">OPS</StatusPill>
            </div>
            <div className="mt-4 rounded-3xl border border-blue-100 bg-[linear-gradient(180deg,#f7fbff_0%,#eef5ff_100%)] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Responsable</p>
              <p className="mt-2 text-sm font-semibold text-slate-600">{form.responsible_owner} · {form.interviewer || "Intervieweur à définir"}</p>
              <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">Le dossier reste auditable: prochaine action, date de relance et checklist qualité sont conservées.</p>
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-slate-50/80 p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Champs manquants</h3>
              <StatusPill tone={readiness.missing.length ? "amber" : "emerald"}>{readiness.missing.length}</StatusPill>
            </div>
            <div className="mt-4 space-y-2">
              {readiness.missing.length ? readiness.missing.map((item) => <div key={item} className="flex items-start gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"><AlertTriangle size={14} className="mt-0.5 shrink-0" />{item}</div>) : <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">Dossier complet pour création.</div>}
            </div>
          </section>
        </aside>
      </form>
    </ModalFrame>
  )
}

export function AmbassadorMissionBuilderModal({
  busy,
  form,
  snapshot,
  onChange,
  onSubmit,
  onClose,
  feedback,
}: {
  busy: boolean
  form: typeof defaultMission
  snapshot: AmbassadorWorkspaceSnapshot
  onChange: (key: string, value: string) => void
  onSubmit: (mode: "draft" | "create" | "notify") => void
  onClose: () => void
  feedback?: CockpitModalFeedback | null
}) {
  const scenario = useMemo(() => selectedMissionScenario(form.scenario_id), [form.scenario_id])
  const missing = useMemo(() => missionMissingFields(form), [form])
  const draftReason = busy ? "Création en cours." : "Le brouillon peut être conservé même si certains champs restent incomplets."
  const createReason = busy ? "Création en cours." : missing.length ? describeMissing(missing) : "Mission prête à être créée."
  const notifyReason = busy ? "Notification en cours." : missing.length ? describeMissing(missing) : "Mission prête à être créée et notifiée."
  const applyScenario = (id: string) => {
    const preset = selectedMissionScenario(id)
    onChange("scenario_id", preset.id)
    onChange("title", preset.label)
    onChange("mission_type", preset.missionType)
    onChange("campaign", preset.campaign)
    onChange("objective", preset.objective)
    onChange("leads_expected", preset.expectedLeads)
    onChange("conversations_expected", preset.expectedConversations)
    onChange("conversions_potential", preset.expectedConversions)
    onChange("proof_expected", preset.proof)
    onChange("proof", preset.proof)
    onChange("script", preset.script)
    onChange("script_recommended", preset.script)
    onChange("success", preset.success)
    onChange("success_criteria", preset.success)
    onChange("sla_closing", preset.sla)
    onChange("channel", preset.channel)
    onChange("execution_channel", preset.channel)
    onChange("validator", preset.validator)
    onChange("escalation_rule", preset.escalation)
    onChange("overloaded_warning", preset.warning)
    onChange("workload_warning", preset.warning)
    onChange("notification_preview", `${preset.label} · ${preset.channel}`)
  }

  return (
    <ModalFrame
      title="Créer mission"
      subtitle="Planificateur opérationnel pour scénarios terrain, affectation ambassadeur, SLA de clôture et preuve attendue."
      icon={MapPinned}
      width="w-[calc(100vw-32px)] lg:w-[92vw] lg:max-w-[1120px]"
      feedback={feedback}
      onClose={onClose}
      chrome="navy"
      footer={
        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1 text-xs font-semibold text-slate-500">
            <p className="font-black text-slate-900">{scenario.label} · {form.priority}</p>
            <p>{draftReason}</p>
            <p>{createReason}</p>
            <p>{notifyReason}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
              Annuler
            </button>
            <button type="submit" form="mission-form" data-mode="draft" disabled={busy} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
              Enregistrer brouillon
            </button>
            <button type="submit" form="mission-form" data-mode="create" disabled={busy || missing.length > 0} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">
              {busy ? "Création..." : "Créer mission"}
            </button>
            <button type="submit" form="mission-form" data-mode="notify" disabled={busy || missing.length > 0} className="rounded-2xl border border-slate-900 bg-slate-50 px-5 py-3 text-sm font-black text-slate-900 disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? "Notification..." : "Créer mission + notifier ambassadeur"}
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
        className="grid gap-5 xl:grid-cols-[1.04fr_0.96fr]"
      >
        <div className="space-y-5">
          <section className="rounded-[30px] border border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eef5ff_48%,#ffffff_100%)] p-5 shadow-sm shadow-blue-100/60">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-900">Sélection du scénario</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">Choisir le contexte mission</h3>
              </div>
              <StatusPill tone="navy">{scenario.label}</StatusPill>
            </div>
            <div className="mt-4">
              <ScenarioCards selectedId={form.scenario_id} onSelect={applyScenario} />
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black tracking-tight text-slate-950">Planification et affectation</h3>
                <StatusPill tone="blue">Dispatch</StatusPill>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Type de mission preset">
                  <input className={inputClass} value={scenario.label} readOnly />
                </Field>
                <Field label="Campagne associée">
                  <input className={inputClass} value={form.campaign} onChange={(e) => onChange("campaign", e.target.value)} />
                </Field>
                <Field label="Ville">
                  <select className={selectClass} value={form.city} onChange={(e) => onChange("city", e.target.value)}>
                    {candidateCities.map((city) => <option key={city}>{city}</option>)}
                  </select>
                </Field>
                <Field label="Zone / quartier">
                  <input className={inputClass} value={form.zone} onChange={(e) => onChange("zone", e.target.value)} />
                </Field>
                <Field label="Territoire existant">
                  <select className={selectClass} value={form.territory} onChange={(e) => onChange("territory", e.target.value)}>
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
                    <option value="normale">Normale</option>
                    <option value="haute">Haute</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </Field>
                <Field label="Deadline">
                  <input type="datetime-local" className={inputClass} value={form.deadline} onChange={(e) => onChange("deadline", e.target.value)} />
                </Field>
              </div>
            </section>

            <section className="rounded-[30px] border border-blue-100 bg-[linear-gradient(180deg,#f9fcff_0%,#eef5ff_100%)] p-5 shadow-sm shadow-blue-100/60">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black tracking-tight text-slate-950">Objectifs mesurables</h3>
                <StatusPill tone="emerald">SLA</StatusPill>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Leads attendus">
                  <input className={inputClass} value={form.leads_expected} onChange={(e) => onChange("leads_expected", e.target.value)} />
                </Field>
                <Field label="Conversations attendues">
                  <input className={inputClass} value={form.conversations_expected} onChange={(e) => onChange("conversations_expected", e.target.value)} />
                </Field>
                <Field label="Conversions potentielles">
                  <input className={inputClass} value={form.conversions_potential} onChange={(e) => onChange("conversions_potential", e.target.value)} />
                </Field>
                <Field label="SLA de clôture">
                  <input className={inputClass} value={form.sla_closing} onChange={(e) => onChange("sla_closing", e.target.value)} />
                </Field>
                <Field label="Objectif principal" className="md:col-span-2">
                  <textarea className={textareaClass} value={form.objective} onChange={(e) => onChange("objective", e.target.value)} />
                </Field>
                <Field label="Objectif secondaire" className="md:col-span-2">
                  <textarea className={textareaClass} value={form.objective_secondary} onChange={(e) => onChange("objective_secondary", e.target.value)} />
                </Field>
                <Field label="Critères de réussite" className="md:col-span-2">
                  <textarea className={textareaClass} value={form.success_criteria} onChange={(e) => onChange("success_criteria", e.target.value)} />
                </Field>
              </div>
            </section>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black tracking-tight text-slate-950">Exécution terrain</h3>
                <StatusPill tone="blue">{form.channel}</StatusPill>
              </div>
              <div className="mt-4 grid gap-4">
                <Field label="Script conseillé">
                  <textarea className={textareaClass} value={form.script} onChange={(e) => onChange("script", e.target.value)} />
                </Field>
                <Field label="Playbook à utiliser">
                  <input className={inputClass} value={form.playbook} onChange={(e) => onChange("playbook", e.target.value)} />
                </Field>
                <Field label="Preuve attendue">
                  <textarea className={textareaClass} value={form.proof_expected} onChange={(e) => onChange("proof_expected", e.target.value)} />
                </Field>
                <Field label="Escalade si retard">
                  <input className={inputClass} value={form.escalation_rule} onChange={(e) => onChange("escalation_rule", e.target.value)} />
                </Field>
                <Field label="Notes opérateur">
                  <textarea className={textareaClass} value={form.operator_notes} onChange={(e) => onChange("operator_notes", e.target.value)} />
                </Field>
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-slate-50/80 p-5 shadow-sm shadow-slate-200/60">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black tracking-tight text-slate-950">Résumé mission</h3>
                <StatusPill tone="emerald">{missionSummary(form, snapshot).length}</StatusPill>
              </div>
              <div className="mt-4 space-y-3">
                {missionSummary(form, snapshot).map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white bg-white p-3 shadow-sm">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-3xl border border-white bg-white p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Notification ambassadeur</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {form.notify_ambassador === "oui" ? `Notification opérationnelle prévue pour ${scenario.channel}.` : "Notification non demandée."}
                </p>
              </div>
            </section>
          </div>
        </div>

        <aside className="space-y-5">
          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-900">Surcharge d'affectation</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">Alerte capacité</h3>
              </div>
              <StatusPill tone="amber">Ops</StatusPill>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{form.overloaded_warning}</p>
          </section>

          <section className="rounded-[30px] border border-blue-100 bg-[linear-gradient(180deg,#ffffff_0%,#f6faff_100%)] p-5 shadow-sm shadow-blue-100/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Planificateur SLA</h3>
              <StatusPill tone="blue">{scenario.sla}</StatusPill>
            </div>
            <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-slate-600">
              <p>{scenario.success}</p>
              <p>{scenario.proof}</p>
              <p>{scenario.escalation}</p>
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Checklist de preuve</h3>
              <StatusPill tone="emerald">{form.proof_expected ? 1 : 0}/1</StatusPill>
            </div>
            <div className="mt-4">
              <Checklist
                items={[
                  { label: "Preuve définie", done: Boolean(form.proof_expected.trim()), detail: "Photo, liste, screenshot ou note partenaire" },
                  { label: "Responsable validateur", done: Boolean(form.validator.trim()), detail: "Ops ou manager" },
                  { label: "Canal d'exécution cadré", done: Boolean(form.channel.trim()), detail: "Terrain, WhatsApp, appel ou partenaire" },
                  { label: "Deadline renseignée", done: Boolean(form.deadline.trim()), detail: "SLA de clôture" },
                ]}
              />
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-slate-50/80 p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Champs manquants</h3>
              <StatusPill tone={missing.length ? "amber" : "emerald"}>{missing.length}</StatusPill>
            </div>
            <div className="mt-4 space-y-2">
              {missing.length ? missing.map((item) => <div key={item} className="flex items-start gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"><AlertTriangle size={14} className="mt-0.5 shrink-0" />{item}</div>) : <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">Mission complète pour création.</div>}
            </div>
          </section>
        </aside>
      </form>
    </ModalFrame>
  )
}

export function AmbassadorLeadQualificationModal({
  busy,
  form,
  snapshot,
  onChange,
  onSubmit,
  onClose,
  feedback,
}: {
  busy: boolean
  form: typeof defaultLead
  snapshot: AmbassadorWorkspaceSnapshot
  onChange: (key: string, value: string) => void
  onSubmit: (mode: "create" | "qualify" | "followup") => void
  onClose: () => void
  feedback?: CockpitModalFeedback | null
}) {
  const leadTemp = useMemo(() => leadTemperature(form), [form])
  const liveScore = useMemo(() => leadLiveScore(form), [form])
  const missingBase = useMemo(() => leadCreateMissingFields(form), [form])
  const followupMissing = useMemo(() => [...leadCreateMissingFields(form), ...(form.next_followup_at.trim() ? [] : ["Date de relance"])], [form])
  const checklist = useMemo(() => leadChecklist(form), [form])
  const isB2B = ["Entreprise", "Partenaire local", "Hôtel / événementiel", "Professionnel santé"].includes(form.lead_type)
  const contextOptions = isB2B ? ["1-5 salariés", "6-20 salariés", "20-50 salariés", "50+ salariés", "Non précisé"] : ["0-2 ans", "3-6 ans", "7-10 ans", "11-14 ans", "Non précisé"]
  const contextLabel = isB2B ? "Volume estimé" : "Âge de l'enfant"
  const baseReason = busy ? "Synchronisation en cours." : missingBase.length ? describeMissing(missingBase) : "Lead prêt pour création et qualification."
  const followupReason = busy ? "Synchronisation en cours." : followupMissing.length ? describeMissing(followupMissing) : "Relance planifiable immédiatement."

  return (
    <ModalFrame
      title="Nouveau lead"
      subtitle="CRM de qualification premium avec segments, duplication, suivi et signal commercial exploitable."
      icon={Target}
      width="w-[calc(100vw-32px)] lg:w-[90vw] lg:max-w-[1100px]"
      feedback={feedback}
      onClose={onClose}
      chrome="rose"
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
            <button type="submit" form="lead-form" data-mode="create" disabled={busy || missingBase.length > 0} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
              Créer lead
            </button>
            <button type="submit" form="lead-form" data-mode="qualify" disabled={busy || missingBase.length > 0} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">
              {busy ? "Qualification..." : "Créer + qualifier"}
            </button>
            <button type="submit" form="lead-form" data-mode="followup" disabled={busy || followupMissing.length > 0} className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
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
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">Segments de lead</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">Choisir le segment commercial</h3>
              </div>
              <StatusPill tone={leadTemp.tone}>{leadTemp.label}</StatusPill>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {leadSegments.map((item) => {
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
                <input className={inputClass} value={form.contact_name} onChange={(e) => onChange("contact_name", e.target.value)} placeholder="Nom du parent, responsable ou contact" />
              </Field>
              <Field label="Téléphone">
                <input className={inputClass} value={form.phone} onChange={(e) => onChange("phone", e.target.value)} placeholder="+212 6..." />
              </Field>
              <Field label="WhatsApp disponible">
                <select className={selectClass} value={form.whatsapp_available} onChange={(e) => onChange("whatsapp_available", e.target.value)}>
                  <option value="oui">Oui</option>
                  <option value="non">Non</option>
                </select>
              </Field>
              <Field label="Email">
                <input className={inputClass} value={form.email} onChange={(e) => onChange("email", e.target.value)} placeholder="email@exemple.com" />
              </Field>
              <Field label="Ville">
                <select className={selectClass} value={form.city} onChange={(e) => onChange("city", e.target.value)}>
                  {candidateCities.map((city) => <option key={city} value={city}>{city}</option>)}
                </select>
              </Field>
              <Field label="Quartier / zone">
                <input className={inputClass} value={form.zone} onChange={(e) => onChange("zone", e.target.value)} />
              </Field>
              <Field label="Langue préférée">
                <select className={selectClass} value={form.language} onChange={(e) => onChange("language", e.target.value)}>
                  {["Français", "Arabe", "Bilingue"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Source">
                <select className={selectClass} value={form.source} onChange={(e) => onChange("source", e.target.value)}>
                  {candidateSources.map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Ambassadeur source">
                <select className={selectClass} value={form.ambassador_source} onChange={(e) => onChange("ambassador_source", e.target.value)}>
                  <option value="">Non attribué</option>
                  {snapshot.ambassadors.slice(0, 80).map((item: AnyRecord) => <option key={item.id} value={item.id}>{item.full_name || item.name} — {item.city || "Ville"}</option>)}
                </select>
              </Field>
              <Field label="Territoire">
                <select className={selectClass} value={form.territory} onChange={(e) => onChange("territory", e.target.value)}>
                  <option value="">Non attribué</option>
                  {snapshot.territories.slice(0, 80).map((item: AnyRecord) => <option key={item.id} value={item.id}>{item.name} — {item.city || "Ville"}</option>)}
                </select>
              </Field>
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black tracking-tight text-slate-950">Besoin & contexte</h3>
                <StatusPill tone="blue">{isB2B ? "B2B" : "Famille"}</StatusPill>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Besoin identifié">
                  <input className={inputClass} value={form.identified_need} onChange={(e) => onChange("identified_need", e.target.value)} />
                </Field>
                <Field label={contextLabel}>
                  <select className={selectClass} value={isB2B ? form.estimated_volume : form.child_age} onChange={(e) => onChange(isB2B ? "estimated_volume" : "child_age", e.target.value)}>
                    {contextOptions.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Température">
                  <select className={selectClass} value={form.temperature} onChange={(e) => onChange("temperature", e.target.value)}>
                    {["froid", "tiède", "chaud", "urgent"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Score qualification">
                  <select className={selectClass} value={form.qualification_score} onChange={(e) => onChange("qualification_score", e.target.value)}>
                    {["52", "62", "72", "82", "92"].map((item) => <option key={item} value={item}>{item}%</option>)}
                  </select>
                </Field>
                <Field label="Budget probable">
                  <input className={inputClass} value={form.probable_budget} onChange={(e) => onChange("probable_budget", e.target.value)} />
                </Field>
                <Field label="Délai de décision">
                  <input className={inputClass} value={form.decision_delay} onChange={(e) => onChange("decision_delay", e.target.value)} />
                </Field>
              </div>
            </section>

            <section className="rounded-[30px] border border-blue-100 bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] p-5 shadow-sm shadow-blue-100/60">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black tracking-tight text-slate-950">Suivi commercial</h3>
                <StatusPill tone={leadTemp.tone}>{liveScore}%</StatusPill>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Risque doublon">
                  <select className={selectClass} value={form.duplicate_risk} onChange={(e) => onChange("duplicate_risk", e.target.value)}>
                    {["Faible", "Moyen", "Élevé"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Canal suivant">
                  <select className={selectClass} value={form.next_channel} onChange={(e) => onChange("next_channel", e.target.value)}>
                    {["WhatsApp", "Appel", "Email", "Visite"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Date de relance">
                  <input type="datetime-local" className={inputClass} value={form.next_followup_at} onChange={(e) => onChange("next_followup_at", e.target.value)} />
                </Field>
                <Field label="Responsable suivi">
                  <input className={inputClass} value={form.owner} onChange={(e) => onChange("owner", e.target.value)} />
                </Field>
                <Field label="Note structurée" className="md:col-span-2">
                  <textarea className={textareaClass} value={form.structured_note} onChange={(e) => onChange("structured_note", e.target.value)} />
                </Field>
                <Field label="Checklist qualité" className="md:col-span-2">
                  <textarea className={textareaClass} value={form.quality_checklist} onChange={(e) => onChange("quality_checklist", e.target.value)} />
                </Field>
              </div>
            </section>
          </div>
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
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Température</p>
                <p className="mt-2 text-sm font-black text-slate-950">{leadTemp.label}</p>
              </div>
              <div className="rounded-3xl border border-white bg-white p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Risque doublon</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{form.duplicate_risk}</p>
              </div>
              <div className="rounded-3xl border border-white bg-white p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Probabilité</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{form.qualification_score}%</p>
              </div>
              <div className="rounded-3xl border border-white bg-white p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Budget</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{form.probable_budget || "À confirmer"}</p>
              </div>
            </div>
            <div className="mt-4 rounded-3xl border border-white bg-white p-4 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Prochain canal</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{form.next_channel} · {form.next_followup_at || "Non planifié"}</p>
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Checklist qualification</h3>
              <StatusPill tone="emerald">{checklist.filter((item) => item.done).length}/{checklist.length}</StatusPill>
            </div>
            <div className="mt-4">
              <Checklist items={checklist} />
            </div>
          </section>

          <section className="rounded-[30px] border border-amber-100 bg-amber-50/70 p-5 shadow-sm shadow-amber-100/50">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Risque doublon / qualité</h3>
              <StatusPill tone="amber">{form.duplicate_risk}</StatusPill>
            </div>
            <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-slate-700">
              <p>Lead source: {form.source}</p>
              <p>Territoire: {labelForTerritory(snapshot, form.territory)}</p>
              <p>Note structurée: {form.structured_note || "À compléter avant le suivi."}</p>
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-slate-50/80 p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Champs manquants</h3>
              <StatusPill tone={missingBase.length ? "amber" : "emerald"}>{missingBase.length}</StatusPill>
            </div>
            <div className="mt-4 space-y-2">
              {missingBase.length ? missingBase.map((item) => <div key={item} className="flex items-start gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"><AlertTriangle size={14} className="mt-0.5 shrink-0" />{item}</div>) : <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">Lead prêt pour création.</div>}
            </div>
          </section>
        </aside>
      </form>
    </ModalFrame>
  )
}

export function AmbassadorConversionValidationModal({
  busy,
  conversion,
  note,
  onNote,
  onClose,
  onDecide,
  snapshot,
  feedback,
}: {
  busy: boolean
  conversion?: AnyRecord
  note: string
  onNote: (value: string) => void
  onClose: () => void
  onDecide: (status: "validated" | "rejected" | "proof_requested" | "escalated") => void
  snapshot: AmbassadorWorkspaceSnapshot
  feedback?: CockpitModalFeedback | null
}) {
  const queue = useMemo(() => ((snapshot as AnyRecord).conversions || []) as AnyRecord[], [snapshot])
  const [selectedId, setSelectedId] = useState(String(conversion?.id || queue[0]?.id || ""))
  const selected = queue.find((item) => item.id === selectedId) || conversion || queue[0]
  const queueSlice = queue.slice(0, 8)
  const proofChecklist = [
    { label: "Attribution source cohérente", done: Boolean(selected?.lead_id || selected?.lead_name), detail: "Lead ou dossier lié" },
    { label: "Ambassadeur identifié", done: Boolean(selected?.ambassador_id || selected?.ambassador_name), detail: "Affectation opérationnelle" },
    { label: "Offre / valeur lisible", done: Boolean(selected?.offer_name || selected?.value), detail: "Montant et offre" },
    { label: "Aucun doublon bloquant", done: String(selected?.status || "pending") !== "duplicate", detail: "Risque contrôlé" },
    { label: "Preuve exploitable", done: Boolean(selected?.proof_url || selected?.validation_note), detail: "Trace d'audit" },
  ]

  return (
    <ModalFrame
      title="Conversions à valider"
      subtitle="Queue de validation conformité avec attribution, preuve, risque et décision auditable."
      icon={ClipboardCheck}
      width="w-[calc(100vw-32px)] lg:w-[92vw] lg:max-w-[1240px]"
      feedback={feedback}
      onClose={onClose}
      chrome="rose"
      footer={
        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1 text-xs font-semibold text-slate-500">
            <p className="font-black text-slate-900">{selected?.lead_name || "Aucune conversion sélectionnée"}</p>
            <p>{selected ? `Statut actuel: ${String(selected.status || "pending")}` : "Aucune conversion à traiter."}</p>
            <p>{note || "Renseigner une note de décision avant validation."}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
              Annuler
            </button>
            <button type="button" disabled={busy || !selected?.id} onClick={() => onDecide("proof_requested")} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-700 disabled:opacity-50">
              Demander justificatif
            </button>
            <button type="button" disabled={busy || !selected?.id} onClick={() => onDecide("escalated")} className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 disabled:opacity-50">
              Escalader
            </button>
            <button type="button" disabled={busy || !selected?.id} onClick={() => onDecide("rejected")} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 disabled:opacity-50">
              Refuser avec motif
            </button>
            <button type="button" disabled={busy || !selected?.id} onClick={() => onDecide("validated")} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white disabled:opacity-50">
              Valider conversion
            </button>
          </div>
        </div>
      }
    >
      {selected ? (
        <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">File d'attente</h3>
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
                      isSelected ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-100/60" : "border-slate-200 bg-slate-50/80 hover:border-blue-200 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black">{item.lead_name || "Conversion"}</p>
                        <p className={`mt-1 text-xs font-semibold ${isSelected ? "text-slate-200" : "text-slate-500"}`}>{item.source || "Source"} · {item.city || "Ville"}</p>
                      </div>
                      <StatusPill tone={String(item.status || "pending") === "validated" ? "emerald" : String(item.status || "pending") === "rejected" ? "rose" : "amber"}>
                        {String(item.status || "pending")}
                      </StatusPill>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs font-bold">
                      <span>{item.ambassador_name || labelForAmbassador(snapshot, item.ambassador_id)}</span>
                      <span>{formatMoney(item.value || 0, item.currency || "MAD")}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <div className="space-y-5">
            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-900">Détail sélectionné</p>
                  <h3 className="mt-1 text-lg font-black text-slate-950">{selected.lead_name || "Conversion"}</h3>
                </div>
                <StatusPill tone="blue">{selected.city || "Ville"}</StatusPill>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Source lead</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{selected.source || "Non renseignée"}</p>
                </div>
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Ambassadeur</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{selected.ambassador_name || labelForAmbassador(snapshot, selected.ambassador_id)}</p>
                </div>
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Valeur</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{selected.offer_name || "Offre AngelCare"} · {formatMoney(selected.value || 0, selected.currency || "MAD")}</p>
                </div>
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Âge du dossier</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{selected.created_at ? shortDate(selected.created_at) : "Non documenté"}</p>
                </div>
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-black tracking-tight text-slate-950">Checklist de preuve</h3>
                  <StatusPill tone="emerald">{proofChecklist.filter((item) => item.done).length}/{proofChecklist.length}</StatusPill>
                </div>
                <div className="mt-4">
                  <Checklist items={proofChecklist} />
                </div>
              </section>

              <section className="rounded-[30px] border border-amber-100 bg-amber-50/70 p-5 shadow-sm shadow-amber-100/50">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-black tracking-tight text-slate-950">Risques et éligibilité</h3>
                  <StatusPill tone="amber">{String(selected.status || "pending")}</StatusPill>
                </div>
                <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-slate-700">
                  <p>Duplicata potentiel: {selected.duplicate_risk || "à vérifier par téléphone, email et source"}</p>
                  <p>Attribution: {selected.attribution_rule || "ambassadeur source + territoire + preuve"}</p>
                  <p>Note de validation: {selected.validation_note || "Aucune note de validation fournie"}</p>
                  <p>Décision: {note || "Renseigner le motif avant validation."}</p>
                </div>
              </section>
            </div>

            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
              <Field label="Note de validation / justification">
                <textarea className={textareaClass} value={note} onChange={(e) => onNote(e.target.value)} />
              </Field>
            </section>
          </div>
        </div>
      ) : (
        <p className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm font-bold text-slate-600">Aucune conversion à traiter pour le moment.</p>
      )}
    </ModalFrame>
  )
}

export function AmbassadorIncentiveApprovalModal({
  busy,
  incentive,
  note,
  onNote,
  onClose,
  onDecide,
  snapshot,
  feedback,
}: {
  busy: boolean
  incentive?: AnyRecord
  note: string
  onNote: (value: string) => void
  onClose: () => void
  onDecide: (decision: "approve" | "reject" | "pay" | "block") => void
  snapshot: AmbassadorWorkspaceSnapshot
  feedback?: CockpitModalFeedback | null
}) {
  const pendingQueue = useMemo(() => snapshot.incentives.filter((item: AnyRecord) => item.status === "pending"), [snapshot.incentives])
  const [selectedId, setSelectedId] = useState(String(incentive?.id || pendingQueue[0]?.id || ""))
  const selected = pendingQueue.find((item: AnyRecord) => item.id === selectedId) || incentive || pendingQueue[0]
  const ambassador = selected ? snapshot.ambassadors.find((item: AnyRecord) => item.id === selected.ambassador_id) : null
  const eligibleRules = [
    { label: "Source traçable", done: Boolean(selected?.ambassador_id), detail: "Ambassadeur lié" },
    { label: "Montant cohérent", done: Number(selected?.amount || 0) > 0, detail: "Montant positif" },
    { label: "Preuve / conversion consultable", done: Boolean(selected?.reason || selected?.approved_at || selected?.paid_at), detail: "Trace ou motif" },
    { label: "Alerte fraude critique absente", done: String(selected?.status || "pending") !== "flagged", detail: "Aucun blocage fort" },
  ]
  const payoutCycle = selected?.paid_at ? "Payé" : selected?.approved_at ? "En attente de paiement" : "En revue finance"
  const rule10 = String(selected?.incentive_type || "").toLowerCase().includes("commission") || String(selected?.reason || "").includes("10%")
  const blockReason = "Infrastructure de paiement non disponible pour cette action."

  return (
    <ModalFrame
      title="Incentives en attente"
      subtitle="Workflow finance et risque pour contrôles, approbation, paiement et revue d'éligibilité."
      icon={Wallet}
      width="w-[calc(100vw-32px)] lg:w-[92vw] lg:max-w-[1200px]"
      feedback={feedback}
      onClose={onClose}
      chrome="amber"
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
            <button type="button" disabled title={blockReason} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-400 disabled:opacity-100">
              Bloquer pour revue
            </button>
            <button type="button" disabled={busy || !selected?.id} onClick={() => onDecide("reject")} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 disabled:opacity-50">
              Rejeter
            </button>
            <button type="button" disabled={busy || !selected?.id} onClick={() => onDecide("approve")} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 disabled:opacity-50">
              Approuver
            </button>
            <button type="button" disabled={busy || !selected?.id} onClick={() => onDecide("pay")} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white disabled:opacity-50">
              Marquer comme payé
            </button>
          </div>
        </div>
      }
    >
      {selected ? (
        <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">File d'attente paiements</h3>
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
                      isSelected ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-100/60" : "border-slate-200 bg-slate-50/80 hover:border-blue-200 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black">{labelForAmbassador(snapshot, item.ambassador_id)}</p>
                        <p className={`mt-1 text-xs font-semibold ${isSelected ? "text-slate-200" : "text-slate-500"}`}>{item.incentive_type || "Commission"} · {item.status || "pending"}</p>
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
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">Détail sélectionné</p>
                  <h3 className="mt-1 text-lg font-black text-slate-950">{labelForAmbassador(snapshot, selected.ambassador_id)}</h3>
                </div>
                <StatusPill tone="blue">{payoutCycle}</StatusPill>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-white bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Mini profil</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{ambassador?.city || selected.city || "Ville"} · {ambassador?.region || "Région"} · Performance {ambassador?.performance_score || "N/A"}</p>
                </div>
                <div className="rounded-3xl border border-white bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Source de mission / conversion</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{selected.source_mission || selected.reason || "Mission ou conversion source"}</p>
                </div>
                <div className="rounded-3xl border border-white bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Base commission</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{selected.incentive_type || "Commission"} · {formatMoney(selected.amount || 0, selected.currency || "MAD")}</p>
                </div>
                <div className="rounded-3xl border border-white bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Règle 10%</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{rule10 ? "Règle 10% visible pour cette ligne." : "Aucune règle 10% explicite détectée."}</p>
                </div>
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-black tracking-tight text-slate-950">Éligibilité</h3>
                  <StatusPill tone={eligibleRules.filter((item) => item.done).length === eligibleRules.length ? "emerald" : "amber"}>{eligibleRules.filter((item) => item.done).length}/{eligibleRules.length}</StatusPill>
                </div>
                <div className="mt-4">
                  <Checklist items={eligibleRules} />
                </div>
              </section>

              <section className="rounded-[30px] border border-amber-100 bg-amber-50/70 p-5 shadow-sm shadow-amber-100/50">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-black tracking-tight text-slate-950">Risques</h3>
                  <StatusPill tone="amber">{String(selected.status || "pending")}</StatusPill>
                </div>
                <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-slate-700">
                  <p>Cycle: {payoutCycle}</p>
                  <p>Éligibilité: {selected.eligibility_note || "à vérifier avant validation"}</p>
                  <p>Note finance: {note || "renseigner la note finance / risque"}</p>
                  <p>Motif de blocage: {selected.reason || "non renseigné"}</p>
                </div>
              </section>
            </div>

            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
              <Field label="Note finance">
                <textarea className={textareaClass} value={note} onChange={(e) => onNote(e.target.value)} />
              </Field>
            </section>
          </div>
        </div>
      ) : (
        <p className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm font-bold text-slate-600">Aucun incentive à traiter pour le moment.</p>
      )}
    </ModalFrame>
  )
}

export function AmbassadorReportExportModal({
  busy,
  onClose,
  onPreview,
  onExportCsv,
  onExportPdf,
  onSchedule,
  form,
  onChange,
  preview,
  feedback,
  pdfDisabledReason = "Export PDF non disponible dans l'infrastructure actuelle.",
  scheduleDisabledReason = "Planification non disponible dans l'infrastructure actuelle.",
}: {
  busy: boolean
  onClose: () => void
  onPreview: () => void
  onExportCsv: () => void
  onExportPdf: () => void
  onSchedule: () => void
  form: typeof defaultReportConfig
  onChange: (key: string, value: string) => void
  preview: ReportPreview
  feedback?: CockpitModalFeedback | null
  pdfDisabledReason?: string
  scheduleDisabledReason?: string
}) {
  const missing = useMemo(() => reportMissingFields(form), [form])
  const selectedFormat = reportFormatOptions.find((item) => item.value === form.format)

  return (
    <ModalFrame
      title="Exporter rapport"
      subtitle="Prévisualisation A4, export CSV réel et validation de diffusion pour la direction, la finance et les opérations."
      icon={FileText}
      width="w-[calc(100vw-32px)] lg:w-[93vw] lg:max-w-[1260px]"
      feedback={feedback}
      onClose={onClose}
      chrome="slate"
      footer={
        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1 text-xs font-semibold text-slate-500">
            <p className="font-black text-slate-900">{preview.title}</p>
            <p>{missing.length ? describeMissing(missing) : "Export prêt."}</p>
            <p>{selectedFormat?.reason || "Export CSV backend actif."}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
              Annuler
            </button>
            <button type="button" disabled={busy || missing.length > 0} onClick={onPreview} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
              Prévisualiser
            </button>
            <button type="button" disabled title={pdfDisabledReason} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-400 disabled:opacity-100">
              Exporter PDF
            </button>
            <button type="button" disabled={busy || missing.length > 0} onClick={onExportCsv} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white disabled:opacity-50">
              {busy ? "Génération..." : "Exporter CSV"}
            </button>
            <button type="button" disabled title={scheduleDisabledReason} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-400 disabled:opacity-100">
              Planifier envoi
            </button>
          </div>
        </div>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[0.88fr_1.1fr_0.9fr]">
        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-black tracking-tight text-slate-950">Configuration du rapport</h3>
            <StatusPill tone="blue">Export backend</StatusPill>
          </div>
          <div className="mt-4 grid gap-4">
            <Field label="Type de rapport">
              <select className={selectClass} value={form.report_type} onChange={(e) => onChange("report_type", e.target.value)}>
                {reportTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </Field>
            <Field label="Période début">
              <input type="date" className={inputClass} value={form.period_start} onChange={(e) => onChange("period_start", e.target.value)} />
            </Field>
            <Field label="Période fin">
              <input type="date" className={inputClass} value={form.period_end} onChange={(e) => onChange("period_end", e.target.value)} />
            </Field>
            <Field label="Villes">
              <textarea className={textareaClass} value={form.cities} onChange={(e) => onChange("cities", e.target.value)} />
            </Field>
            <Field label="Ambassadeurs">
              <textarea className={textareaClass} value={form.ambassadors} onChange={(e) => onChange("ambassadors", e.target.value)} />
            </Field>
            <Field label="Sections incluses">
              <textarea className={textareaClass} value={form.sections} onChange={(e) => onChange("sections", e.target.value)} />
            </Field>
            <Field label="Destinataires">
              <input className={inputClass} value={form.recipients} onChange={(e) => onChange("recipients", e.target.value)} />
            </Field>
            <Field label="Note d'approbation / signature">
              <input className={inputClass} value={form.signature_note} onChange={(e) => onChange("signature_note", e.target.value)} />
            </Field>
            <Field label="Périmètre d'export">
              <input className={inputClass} value={form.export_scope} onChange={(e) => onChange("export_scope", e.target.value)} />
            </Field>
          </div>
        </section>

        <section className="rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-sm shadow-slate-200/60">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-black tracking-tight text-slate-950">Prévisualisation</h3>
            <StatusPill tone="emerald">{preview.metrics.length} métriques</StatusPill>
          </div>
          <div className="mt-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Aperçu A4</p>
            <h4 className="mt-2 text-2xl font-black text-slate-950">{preview.title}</h4>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{preview.summary}</p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {preview.metrics.map((metric) => (
                <div key={metric.label} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{metric.label}</p>
                  <p className="mt-2 text-xl font-black text-slate-950">{metric.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Détail de la diffusion</p>
              <div className="mt-3 space-y-2 text-sm font-semibold leading-6 text-slate-600">
                {preview.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Formats disponibles</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {reportFormatOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  disabled={!item.available}
                  onClick={() => item.available && onChange("format", item.value)}
                  className={`rounded-2xl border p-3 text-left transition ${
                    form.format === item.value
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-700 disabled:opacity-50"
                  }`}
                  title={item.reason}
                >
                  <p className="text-sm font-black">{item.label}</p>
                  <p className={`mt-1 text-xs font-semibold ${form.format === item.value ? "text-slate-200" : "text-slate-500"}`}>
                    {item.available ? "Disponible" : item.reason}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="rounded-[30px] border border-blue-100 bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] p-5 shadow-sm shadow-blue-100/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Statut de l'export</h3>
              <StatusPill tone={missing.length ? "amber" : "emerald"}>{missing.length}</StatusPill>
            </div>
            <div className="mt-4 space-y-2">
              {missing.length ? missing.map((item) => <div key={item} className="flex items-start gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"><AlertTriangle size={14} className="mt-0.5 shrink-0" />{item}</div>) : <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">Export prêt pour le CSV backend.</div>}
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <h3 className="text-sm font-black tracking-tight text-slate-950">Destinataires et approbation</h3>
            <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-slate-600">
              <p>Destinataires : {form.recipients || "N/A"}</p>
              <p>Signature : {form.signature_note || "N/A"}</p>
              <p>Format actif : {form.format.toUpperCase()}</p>
              <p>CSV backend : réel et tracé via l'API.</p>
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">Rappel d'infrastructure</h3>
              <StatusPill tone="amber">Avertissement</StatusPill>
            </div>
            <div className="mt-4 space-y-2 text-sm font-semibold leading-6 text-slate-600">
              <p>{reportFormatOptions.find((item) => item.value === "pdf")?.reason}</p>
              <p>{reportFormatOptions.find((item) => item.value === "excel")?.reason}</p>
              <p>{scheduleDisabledReason}</p>
            </div>
          </div>
        </section>
      </div>
    </ModalFrame>
  )
}

export default {
  AmbassadorCandidateIntakeModal,
  AmbassadorMissionBuilderModal,
  AmbassadorLeadQualificationModal,
  AmbassadorConversionValidationModal,
  AmbassadorIncentiveApprovalModal,
  AmbassadorReportExportModal,
}
