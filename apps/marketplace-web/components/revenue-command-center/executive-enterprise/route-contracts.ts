import type { ExecutiveExperience, ExecutiveTone } from "./types"

export type ExecutiveRouteContract = {
  experience: ExecutiveExperience
  eyebrow: string
  title: string
  mission: string
  primaryAction: string
  primaryCommand: string
  tone: ExecutiveTone
  archetype:
    | "boardroom"
    | "intervention"
    | "briefing"
    | "forecast"
    | "scenario"
    | "analytics"
    | "team"
    | "heatmap"
    | "capacity"
    | "decision"
}

export const EXECUTIVE_ROUTE_CONTRACTS: Record<ExecutiveExperience, ExecutiveRouteContract> = {
  "executive-overview": {
    experience: "executive-overview",
    eyebrow: "DIRECTION REVENUE",
    title: "Poste de commandement exécutif",
    mission: "Réunir la vérité commerciale, les mouvements de prévision, les risques de conversion et les décisions qui exigent une autorité de direction.",
    primaryAction: "Générer un snapshot",
    primaryCommand: "generate-forecast-snapshot",
    tone: "navy",
    archetype: "boardroom",
  },
  "control-tower": {
    experience: "control-tower",
    eyebrow: "TOUR DE CONTRÔLE",
    title: "Fuites de revenu & interventions",
    mission: "Détecter les valeurs bloquées, les promesses rompues, les signatures retardées et les réponses commerciales sans traitement.",
    primaryAction: "Créer une intervention",
    primaryCommand: "create-intervention",
    tone: "red",
    archetype: "intervention",
  },
  "executive-briefing": {
    experience: "executive-briefing",
    eyebrow: "BRIEFING EXÉCUTIF",
    title: "Briefing Direction — décisions et mouvement",
    mission: "Transformer les événements vérifiés en lecture quotidienne, hebdomadaire et mensuelle prête pour la Direction.",
    primaryAction: "Générer le briefing",
    primaryCommand: "generate-briefing",
    tone: "blue",
    archetype: "briefing",
  },
  "forecast-command": {
    experience: "forecast-command",
    eyebrow: "FORECAST COMMAND",
    title: "Prévisions explicables & engagement",
    mission: "Séparer pipeline, upside, best case, commit, contracté, encaissable, confirmé, réalisé et reversé sans double comptage.",
    primaryAction: "Générer la prévision",
    primaryCommand: "generate-forecast-snapshot",
    tone: "cyan",
    archetype: "forecast",
  },
  "strategy-room": {
    experience: "strategy-room",
    eyebrow: "STRATEGY ROOM",
    title: "Scénarios, arbitrages & allocation",
    mission: "Comparer les hypothèses de croissance, de retard d'encaissement, de sous-performance et d'expansion sans modifier les données réelles.",
    primaryAction: "Créer un scénario",
    primaryCommand: "create-scenario",
    tone: "violet",
    archetype: "scenario",
  },
  "revenue-analytics": {
    experience: "revenue-analytics",
    eyebrow: "REVENUE ANALYTICS",
    title: "Valeur, sources & exactitude",
    mission: "Auditer la contribution B2B, B2C, partenaires et campagnes, puis confronter prévision et réalisation avec une lignée complète.",
    primaryAction: "Actualiser l'intelligence",
    primaryCommand: "generate-forecast-snapshot",
    tone: "green",
    archetype: "analytics",
  },
  "team-intelligence": {
    experience: "team-intelligence",
    eyebrow: "TEAM INTELLIGENCE",
    title: "Performance commerciale & fiabilité",
    mission: "Mesurer valeur, qualité d'exécution, exactitude des engagements et capacité de résolution — jamais le volume d'activité seul.",
    primaryAction: "Ouvrir une intervention",
    primaryCommand: "create-intervention",
    tone: "blue",
    archetype: "team",
  },
  "overdue-heatmap": {
    experience: "overdue-heatmap",
    eyebrow: "REVENUE PRESSURE MAP",
    title: "Carte de pression & retards",
    mission: "Visualiser les échéances dépassées et leur valeur exposée par gravité, âge, propriétaire et source commerciale.",
    primaryAction: "Escalader le risque",
    primaryCommand: "create-intervention",
    tone: "amber",
    archetype: "heatmap",
  },
  "workload-command": {
    experience: "workload-command",
    eyebrow: "CAPACITY COMMAND",
    title: "Charge, capacité & redistribution",
    mission: "Détecter surcharge, files non traitées et dépendances critiques avant qu'elles ne deviennent une perte de revenu.",
    primaryAction: "Créer une action",
    primaryCommand: "create-canonical-task",
    tone: "cyan",
    archetype: "capacity",
  },
  "management-decision-room": {
    experience: "management-decision-room",
    eyebrow: "EXECUTIVE DECISION ROOM",
    title: "Décisions, conditions & clôture",
    mission: "Présenter contexte, alternatives, conséquence de l'inaction, autorité et résultat mesurable dans une salle de décision gouvernée.",
    primaryAction: "Demander une décision",
    primaryCommand: "request-decision",
    tone: "navy",
    archetype: "decision",
  },
}
