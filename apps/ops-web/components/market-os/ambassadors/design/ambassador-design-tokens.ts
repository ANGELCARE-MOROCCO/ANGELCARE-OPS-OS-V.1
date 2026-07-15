import type { ComponentType } from "react"
import {
  BadgeCheck,
  BarChart3,
  ClipboardCheck,
  FileText,
  Gift,
  GraduationCap,
  MapPinned,
  Settings,
  ShieldCheck,
  Target,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import type { AmbassadorWorkspaceMode } from "@/lib/market-os/ambassadors/types"

export type AmbassadorIcon = ComponentType<{ size?: number; className?: string }>

export type AmbassadorRouteDefinition = {
  mode: AmbassadorWorkspaceMode
  title: string
  description: string
  eyebrow: string
  primary: string
  secondary: string[]
  exportType: string
  icon: AmbassadorIcon
  imageReference: string
  designIntent: string
}

export const ambassadorDesignTokens = {
  canvas: "bg-[#f6f8fb] text-slate-950",
  pageMax: "max-w-[1680px]",
  primaryButton: "bg-[#0b5fff] text-white shadow-[0_18px_35px_-22px_rgba(11,95,255,0.95)] hover:bg-[#084dcc]",
  secondaryButton: "border border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50",
  dangerButton: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
  ghostButton: "text-slate-600 hover:bg-slate-100",
  title: "text-[28px] font-black tracking-[-0.04em] text-[#06143b]",
  subtitle: "text-sm font-medium leading-6 text-slate-500",
  blueIcon: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  greenIcon: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  amberIcon: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  redIcon: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
  purpleIcon: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
  cyanIcon: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100",
}

export const ambassadorRouteDefinitions: Record<string, AmbassadorRouteDefinition> = {
  overview: { mode: "overview", title: "Cockpit de pilotage", description: "Vue d’ensemble des opérations ambassadeurs, performances, priorités et risques à traiter aujourd’hui.", eyebrow: "Command center", primary: "Créer mission", secondary: ["Nouveau candidat", "Nouveau lead", "Exporter rapport"], exportType: "ambassador-cockpit", icon: ShieldCheck, imageReference: "cockpit", designIntent: "Daily command center with KPI rail, city coverage, priority queue, activity timeline, and risk control." },
  directory: { mode: "directory", title: "Ambassadeurs", description: "Gérez votre réseau d’ambassadeurs, suivez les performances, les dossiers et les actions prioritaires.", eyebrow: "Réseau terrain", primary: "Ajouter ambassadeur", secondary: ["Importer", "Affecter territoire", "Créer mission", "Exporter"], exportType: "ambassadors-directory", icon: Users, imageReference: "ambassadors", designIntent: "Ambassador CRM with performance table, risk panels, dossier preview and quick actions." },
  recruitment: { mode: "recruitment", title: "Candidats", description: "Pilotez votre pipeline de recrutement et accélérez la sélection des meilleurs talents terrain.", eyebrow: "Acquisition talents", primary: "Nouveau candidat", secondary: ["Planifier entretien", "Importer CV", "Créer cohorte", "Exporter pipeline"], exportType: "recruitment", icon: UserPlus, imageReference: "candidates", designIntent: "Recruitment board, candidate table, interview queue and missing-document controls." },
  leads: { mode: "leads", title: "Leads & referrals", description: "Gérez les prospects et referrals, suivez leur qualité et pilotez les conversions.", eyebrow: "Pipeline prospects", primary: "Nouveau lead", secondary: ["Importer leads", "Affecter", "Valider source", "Exporter"], exportType: "leads", icon: Target, imageReference: "leads", designIntent: "Lead queue, qualification filters, source performance, funnel and quality controls." },
  conversions: { mode: "conversions", title: "Conversions", description: "Validez, attribuez et suivez la valeur générée par vos ambassadeurs.", eyebrow: "Validation valeur", primary: "Valider conversion", secondary: ["Affecter responsable", "Créer audit", "Exporter"], exportType: "conversions", icon: BadgeCheck, imageReference: "conversions", designIntent: "Conversion validation queue with proof drawer, funnel, attribution and SLA risks." },
  onboarding: { mode: "onboarding", title: "Activation & onboarding des ambassadeurs", description: "Suivez et accélérez l’activation des nouveaux ambassadeurs avec formation, KYC et affectation territoire.", eyebrow: "Activation", primary: "Activer ambassadeur", secondary: ["Checklist", "Formation", "Exporter"], exportType: "onboarding", icon: ClipboardCheck, imageReference: "onboarding", designIntent: "Activation pipeline with onboarding checklist, training, KYC, starter kit and territory readiness." },
  missions: { mode: "missions", title: "Missions terrain", description: "Gestion et exécution des missions sur le terrain, preuves, incidents et priorités du jour.", eyebrow: "Exécution terrain", primary: "Créer mission", secondary: ["Affecter ambassadeur", "Clôturer mission", "Feuille de route", "Exporter"], exportType: "missions", icon: MapPinned, imageReference: "missions", designIntent: "Mission board, dispatch table, territorial coverage, incident queue and daily route sheet." },
  territories: { mode: "territories", title: "Territoires & couverture", description: "Visualisez la couverture terrain, la densité des ambassadeurs et les zones à fort potentiel.", eyebrow: "Couverture réseau", primary: "Affecter territoire", secondary: ["Importer zones", "Exporter"], exportType: "territories", icon: MapPinned, imageReference: "territories", designIntent: "Territory coverage cockpit with city performance, capacity warnings, map panels and assignment drawer." },
  incentives: { mode: "incentives", title: "Incentives & commissions", description: "Définissez, simulez et pilotez des incentives performants pour motiver vos ambassadeurs.", eyebrow: "Règles & simulation", primary: "Créer une règle", secondary: ["Gérer campagnes", "Politiques de commission", "Exporter"], exportType: "incentives", icon: Gift, imageReference: "incentives", designIntent: "Incentive rules, simulation, approval queue, risk alerts and payout forecast." },
  payouts: { mode: "payouts", title: "Incentives & Payouts", description: "Gérez les commissions, incentives et paiements des ambassadeurs avec contrôle finance.", eyebrow: "Finance ops", primary: "Créer incentive", secondary: ["Approuver", "Préparer paiement", "Exporter état", "Rapprocher"], exportType: "payouts", icon: Wallet, imageReference: "payouts", designIntent: "Payment operations, approval workflow, payment batches, exception handling and payout status." },
  reports: { mode: "reports", title: "Rapports & pilotage exécutif", description: "Vue d’ensemble stratégique et performance opérationnelle des ambassadeurs.", eyebrow: "Reporting exécutif", primary: "Exporter PDF", secondary: ["Planifier", "Partager", "Publier"], exportType: "reports", icon: FileText, imageReference: "reports", designIntent: "Executive reporting workspace with charts, scheduled reports, comments, A4 preview and export controls." },
  resources: { mode: "resources", title: "Ressources & playbooks", description: "Centralisez, partagez et activez les bons contenus pour maximiser l’impact terrain.", eyebrow: "Enablement", primary: "Nouvelle ressource", secondary: ["Importer", "Assigner", "Relancer accusés"], exportType: "resources", icon: FileText, imageReference: "resources", designIntent: "Resource library, kit preview, assignments, acknowledgments, copy scripts and versioning." },
  governance: { mode: "governance", title: "Gouvernance, conformité & audit", description: "Assurez la conformité, gérez les risques et supervisez les activités des ambassadeurs.", eyebrow: "Contrôle & audit", primary: "Nouvelle revue", secondary: ["Exporter le rapport", "Journal d’audit", "Plus d’actions"], exportType: "governance", icon: Settings, imageReference: "governance", designIntent: "Compliance dashboard with KYC, contracts, approvals, risk indicators and audit timeline." },
  settings: { mode: "settings", title: "Paramètres & gouvernance", description: "Pilotez les règles, seuils, contrôles, notifications et politiques du programme ambassadeurs.", eyebrow: "Program controls", primary: "Modifier règles", secondary: ["Exporter", "Journal d’audit"], exportType: "settings", icon: Settings, imageReference: "settings", designIntent: "Governance rules, thresholds, program settings, locked infrastructure and audit explanation." },
  training: { mode: "training", title: "Formation & certification", description: "Supervisez la progression formation, les certifications, les expirations et la préparation terrain.", eyebrow: "Readiness academy", primary: "Assigner formation", secondary: ["Certifier", "Exporter"], exportType: "training", icon: GraduationCap, imageReference: "training", designIntent: "Training and certification workspace aligned with onboarding readiness." },
  goals: { mode: "goals", title: "Objectifs & KPIs", description: "Définissez les objectifs, suivez la progression et identifiez les actions correctives.", eyebrow: "Performance goals", primary: "Créer KPI", secondary: ["Recalculer", "Exporter"], exportType: "goals", icon: BarChart3, imageReference: "goals", designIntent: "KPI goal management connected to performance and coaching priorities." },
  performance: { mode: "performance", title: "Performances", description: "Analysez la performance, la qualité, le portefeuille et les axes de coaching.", eyebrow: "Performance intelligence", primary: "Créer KPI", secondary: ["Comparer", "Exporter"], exportType: "performance", icon: BarChart3, imageReference: "performance", designIntent: "Performance intelligence workspace with KPI distribution and coaching actions." },
}

export function getAmbassadorRouteDefinition(mode: AmbassadorWorkspaceMode): AmbassadorRouteDefinition {
  return ambassadorRouteDefinitions[String(mode)] || ambassadorRouteDefinitions.overview
}
