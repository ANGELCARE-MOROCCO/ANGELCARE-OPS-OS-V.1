import type { CampaignExperienceKey } from "./types"

export type CampaignRouteContract = {
  key: CampaignExperienceKey
  eyebrow: string
  title: string
  mission: string
  primaryAction: string
  archetype: "command" | "studio" | "board" | "dossier" | "live" | "intelligence" | "execution"
  accent: "navy" | "blue" | "green" | "amber" | "red" | "violet"
}

export const CAMPAIGN_ROUTE_CONTRACTS: Record<CampaignExperienceKey, CampaignRouteContract> = {
  "campaign-command": {
    key: "campaign-command",
    eyebrow: "DEMAND GENERATION COMMAND",
    title: "Commandement campagnes & revenu attribuable",
    mission: "Piloter stratégie, audiences, séquences, délivrabilité, capacité SDR, conversions, coûts et revenu réalisé sans contact non gouverné ni attribution décorative.",
    primaryAction: "Créer une campagne",
    archetype: "command",
    accent: "navy",
  },
  "campaign-create-studio": {
    key: "campaign-create-studio",
    eyebrow: "CAMPAIGN STRATEGY STUDIO",
    title: "Concevoir une campagne prête à convertir",
    mission: "Définir objectif, audience, hypothèse commerciale, canaux, ownership, budget, fréquence, attribution et gates de lancement avant toute activation.",
    primaryAction: "Enregistrer la stratégie",
    archetype: "studio",
    accent: "blue",
  },
  "campaign-board": {
    key: "campaign-board",
    eyebrow: "CAMPAIGN LIFECYCLE BOARD",
    title: "Portefeuille, risques & interventions",
    mission: "Faire progresser les campagnes par états gouvernés, exposer les blocages et donner à la direction une file d’intervention immédiatement exploitable.",
    primaryAction: "Ouvrir une intervention",
    archetype: "board",
    accent: "violet",
  },
  "campaign-dossier": {
    key: "campaign-dossier",
    eyebrow: "CAMPAIGN 360 DOSSIER",
    title: "Dossier campagne 360°",
    mission: "Réunir stratégie, audience, séquence, readiness, exécution, réponses, conversions, attribution, coûts, risques, décisions et audit dans un dossier unique.",
    primaryAction: "Mettre à jour le dossier",
    archetype: "dossier",
    accent: "blue",
  },
  "campaign-assets-studio": {
    key: "campaign-assets-studio",
    eyebrow: "SEQUENCE & CONTENT CONTROL",
    title: "Séquences, templates, expéditeurs & personnalisation",
    mission: "Versionner les cadences, contrôler chaque étape, sécuriser les variables, approuver les contenus et prouver la readiness des canaux et expéditeurs.",
    primaryAction: "Créer une séquence",
    archetype: "studio",
    accent: "amber",
  },
  "campaign-live-room": {
    key: "campaign-live-room",
    eyebrow: "LIVE CAMPAIGN OPERATIONS",
    title: "Live Room — exécution, réponses & sécurité",
    mission: "Superviser les destinataires, étapes planifiées, dispatchs, erreurs provider, réponses, opt-outs, backlog SDR et arrêt d’urgence sans fabriquer d’événement externe.",
    primaryAction: "Évaluer le lancement",
    archetype: "live",
    accent: "green",
  },
  "campaign-performance": {
    key: "campaign-performance",
    eyebrow: "ATTRIBUTION & ECONOMICS",
    title: "Délivrabilité, conversion, attribution & rentabilité",
    mission: "Distinguer acceptation provider, livraison, réponse, meeting, opportunité, contrat, paiement et revenu réalisé, puis rapprocher chaque résultat des coûts confirmés.",
    primaryAction: "Clôturer la période",
    archetype: "intelligence",
    accent: "navy",
  },
  "sdr-command": {
    key: "sdr-command",
    eyebrow: "SDR EXECUTION COMMAND",
    title: "File SDR, workbench destinataire & discipline de contact",
    mission: "Donner à chaque SDR une file priorisée avec contexte compte, historique, étape due, réponse, fréquence, suppression, conversion et prochaine action autorisée.",
    primaryAction: "Traiter la prochaine action",
    archetype: "execution",
    accent: "green",
  },
}

export const CAMPAIGN_NAVIGATION = [
  ["Commandement", "/revenue-command-center/campaigns"],
  ["Nouvelle campagne", "/revenue-command-center/campaigns/new"],
  ["Board", "/revenue-command-center/campaigns/board"],
  ["SDR Execution", "/revenue-command-center/sdr-execution"],
] as const
