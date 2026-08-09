import type { PartnershipExperienceKey } from "./types"

export type PartnershipRouteContract = {
  key: PartnershipExperienceKey
  eyebrow: string
  title: string
  mission: string
  primaryAction: string
  archetype: "command" | "dossier" | "studio" | "portfolio" | "intelligence" | "queue" | "governance"
  accent: "navy" | "blue" | "red" | "amber" | "green" | "violet"
}

export const PARTNERSHIP_ROUTE_CONTRACTS: Record<PartnershipExperienceKey, PartnershipRouteContract> = {
  "partnership-command": { key:"partnership-command", eyebrow:"PARTNERSHIP REVENUE ECOSYSTEM", title:"Centre de commandement des partenariats stratégiques", mission:"Gouverner qualification, activation, referrals, revenu attribué, performance, renouvellement et expansion dans un cockpit institutionnel unique.", primaryAction:"Créer un partenariat", archetype:"command", accent:"navy" },
  "partner-dossier": { key:"partner-dossier", eyebrow:"PARTNER 360 DOSSIER", title:"Dossier institutionnel du partenaire", mission:"Réunir identité, décideurs, programmes, obligations, referrals, valeur réalisée, risques et prochaine décision sans rupture de contexte.", primaryAction:"Actualiser le dossier", archetype:"dossier", accent:"blue" },
  "partner-decision-map": { key:"partner-decision-map", eyebrow:"STAKEHOLDER AUTHORITY MAP", title:"Carte de décision du partenaire", mission:"Identifier sponsors, décideurs économiques, responsables opérationnels, champions et bloqueurs avec autorité et qualité relationnelle.", primaryAction:"Ajouter un stakeholder", archetype:"intelligence", accent:"violet" },
  "partner-qualification-dossier": { key:"partner-qualification-dossier", eyebrow:"QUALIFICATION DOSSIER", title:"Qualification stratégique du partenaire", mission:"Évaluer alignement, accès audience, potentiel commercial, faisabilité, risque et preuves avant toute mobilisation coûteuse.", primaryAction:"Finaliser la qualification", archetype:"governance", accent:"blue" },
  "partner-recovery-dossier": { key:"partner-recovery-dossier", eyebrow:"RELATIONSHIP RESCUE", title:"Plan de redressement partenarial", mission:"Diagnostiquer la sous-performance, protéger le revenu et imposer engagements, checkpoints, escalades et décision de sortie.", primaryAction:"Lancer le recovery plan", archetype:"governance", accent:"red" },
  "partner-referrals-dossier": { key:"partner-referrals-dossier", eyebrow:"REFERRAL VALUE LINEAGE", title:"Referrals & attribution du partenaire", mission:"Tracer chaque recommandation du signal initial jusqu’au revenu réalisé, avec preuves, conflits et règles d’attribution.", primaryAction:"Enregistrer un referral", archetype:"queue", accent:"green" },
  "decision-map-command": { key:"decision-map-command", eyebrow:"DECISION NETWORK COMMAND", title:"Commandement des stakeholders partenaires", mission:"Repérer les relations sans sponsor, les décideurs non engagés et les points de blocage qui menacent le closing ou le renouvellement.", primaryAction:"Cartographier un décideur", archetype:"intelligence", accent:"violet" },
  "executive-command": { key:"executive-command", eyebrow:"EXECUTIVE PARTNERSHIP AUTHORITY", title:"Autorité exécutive des partenariats", mission:"Arbitrer partenaires à forte valeur, renouvellements critiques, conflits d’attribution, exceptions et décisions de suspension.", primaryAction:"Ouvrir une intervention", archetype:"command", accent:"red" },
  "growth-command": { key:"growth-command", eyebrow:"PARTNERSHIP EXPANSION", title:"Commandement croissance & expansion", mission:"Transformer les partenaires performants en nouveaux programmes, villes, sites, audiences et services avec business case mesurable.", primaryAction:"Créer une expansion", archetype:"studio", accent:"green" },
  "high-value-command": { key:"high-value-command", eyebrow:"STRATEGIC VALUE PORTFOLIO", title:"Portefeuille des partenaires à haute valeur", mission:"Concentrer l’autorité sur les relations ayant le plus fort revenu réalisé, potentiel d’expansion ou exposition stratégique.", primaryAction:"Prioriser le portefeuille", archetype:"portfolio", accent:"navy" },
  "meetings-command": { key:"meetings-command", eyebrow:"PARTNER REVIEW CADENCE", title:"Réunions & revues partenaires", mission:"Contrôler cadence relationnelle, engagements, décisions, revues de performance et préparation des renouvellements.", primaryAction:"Planifier une revue", archetype:"queue", accent:"blue" },
  "create-partnership": { key:"create-partnership", eyebrow:"PARTNERSHIP CREATION STUDIO", title:"Créer un partenariat stratégique", mission:"Établir une identité fiable, un modèle de valeur, une responsabilité, un potentiel et une prochaine étape sans créer de doublon.", primaryAction:"Enregistrer le partenaire", archetype:"studio", accent:"blue" },
  "performance-command": { key:"performance-command", eyebrow:"PARTNER PERFORMANCE", title:"Performance, scorecards & revues périodiques", mission:"Mesurer targets, referrals, conversion, revenu réalisé, obligations et santé relationnelle par période immuable.", primaryAction:"Créer une période", archetype:"intelligence", accent:"green" },
  "pipeline-command": { key:"pipeline-command", eyebrow:"PARTNERSHIP LIFECYCLE", title:"Pipeline partenarial gouverné", mission:"Piloter chaque relation de l’identification à l’activation, la performance, le renouvellement, l’expansion ou la sortie.", primaryAction:"Créer une opportunité", archetype:"portfolio", accent:"blue" },
  "qualification-command": { key:"qualification-command", eyebrow:"PARTNER QUALIFICATION", title:"Commandement qualification partenaires", mission:"Comparer alignement, audience, potentiel, accès décisionnel, faisabilité et réputation avant investissement commercial.", primaryAction:"Qualifier un partenaire", archetype:"queue", accent:"violet" },
  "recovery-command": { key:"recovery-command", eyebrow:"PARTNERSHIP RECOVERY", title:"Recovery & intervention partenariale", mission:"Traiter inactivity, obligations en défaut, baisse de conversion, risques réputationnels et revenu menacé avec deadlines exécutives.", primaryAction:"Créer un plan de redressement", archetype:"governance", accent:"red" },
  "referral-command": { key:"referral-command", eyebrow:"REFERRAL OPERATIONS", title:"Intake, conversion & attribution des referrals", mission:"Accepter, dédupliquer, convertir et attribuer les referrals sans inventer consentement, valeur ou revenu réalisé.", primaryAction:"Enregistrer un referral", archetype:"queue", accent:"green" },
  "risk-command": { key:"risk-command", eyebrow:"PARTNERSHIP RISK", title:"Risques, obligations & protection de valeur", mission:"Exposer les obligations en retard, conflits, inactivity, expiry, payment risk et actions nécessaires avant perte de valeur.", primaryAction:"Déclarer un risque", archetype:"governance", accent:"amber" },
}

export const PARTNERSHIP_NAVIGATION = [
  ["Commandement", "/revenue-command-center/partnerships"],
  ["Pipeline", "/revenue-command-center/partnerships/pipeline"],
  ["Qualification", "/revenue-command-center/partnerships/qualification"],
  ["Referrals", "/revenue-command-center/partnerships/referrals"],
  ["Performance", "/revenue-command-center/partnerships/performance"],
  ["Risques", "/revenue-command-center/partnerships/risk"],
  ["Croissance", "/revenue-command-center/partnerships/growth"],
] as const
