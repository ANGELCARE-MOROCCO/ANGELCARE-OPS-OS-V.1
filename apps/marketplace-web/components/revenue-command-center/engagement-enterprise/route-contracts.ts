import type { EngagementExperienceKey } from "./types"

export type EngagementRouteContract = {
  key: EngagementExperienceKey
  eyebrow: string
  title: string
  mission: string
  primaryAction: string
  primaryHref?: string
  archetype:
    | "command" | "dashboard" | "control" | "queue" | "calendar" | "studio" | "live"
    | "dossier" | "briefing" | "conversion" | "recovery" | "analytics" | "performance"
    | "risk" | "executive" | "escalations" | "high-value" | "reschedules" | "no-shows" | "follow-up"
  accent: "navy" | "blue" | "red" | "amber" | "green" | "violet" | "cyan"
}

export const ENGAGEMENT_ROUTE_CONTRACTS: Record<EngagementExperienceKey, EngagementRouteContract> = {
  "engagement-command": { key:"engagement-command", eyebrow:"ENGAGEMENT COMMERCIAL", title:"Centre de commandement des rendez-vous", mission:"Orchestrer chaque interaction, rendez-vous et engagement jusqu’à un résultat commercial traçable.", primaryAction:"Planifier un rendez-vous", primaryHref:"/revenue-command-center/appointments/new", archetype:"command", accent:"navy" },
  "appointment-dashboard": { key:"appointment-dashboard", eyebrow:"POSTURE DU JOUR", title:"Vue opérationnelle des rendez-vous", mission:"Lire le rythme du jour, la préparation, les confirmations et les risques de conversion.", primaryAction:"Ouvrir le calendrier", primaryHref:"/revenue-command-center/appointments/calendar", archetype:"dashboard", accent:"blue" },
  "appointment-command": { key:"appointment-command", eyebrow:"MISSION CONTROL", title:"Commandement des engagements", mission:"Prioriser les rencontres à forte conséquence et distribuer les interventions avant dérive.", primaryAction:"Lancer une intervention", archetype:"command", accent:"violet" },
  "control-tower": { key:"control-tower", eyebrow:"TOUR DE CONTRÔLE", title:"Contrôle des confirmations et risques", mission:"Détecter les rendez-vous fragiles, les préparations incomplètes et les décisions bloquées.", primaryAction:"Traiter le premier risque", archetype:"control", accent:"red" },
  "appointment-dossier": { key:"appointment-dossier", eyebrow:"DOSSIER DE RENCONTRE", title:"Dossier complet du rendez-vous", mission:"Réunir contexte commercial, participants, préparation, communications, décisions et audit.", primaryAction:"Mettre à jour le dossier", archetype:"dossier", accent:"navy" },
  "briefing-room": { key:"briefing-room", eyebrow:"BRIEFING EXÉCUTIF", title:"Salle de préparation commerciale", mission:"Aligner l’équipe sur le compte, les décideurs, les objections et le résultat recherché.", primaryAction:"Valider la préparation", archetype:"briefing", accent:"cyan" },
  "calendar": { key:"calendar", eyebrow:"CALENDRIER COMMERCIAL", title:"Cadence des rendez-vous", mission:"Contrôler la densité, les conflits, les déplacements, les confirmations et la préparation.", primaryAction:"Ajouter un créneau", primaryHref:"/revenue-command-center/appointments/schedule", archetype:"calendar", accent:"green" },
  "conversion": { key:"conversion", eyebrow:"CONVERSION", title:"Résultats et progression commerciale", mission:"Transformer les conclusions de réunion en étapes, propositions, tâches et engagements.", primaryAction:"Traiter un résultat", archetype:"conversion", accent:"green" },
  "escalations": { key:"escalations", eyebrow:"INTERVENTION EXÉCUTIVE", title:"Escalades rendez-vous et engagements", mission:"Rendre visibles les rendez-vous exposant une relation, une opportunité ou une valeur stratégique.", primaryAction:"Ouvrir la prochaine escalade", archetype:"escalations", accent:"red" },
  "executive": { key:"executive", eyebrow:"DIRECTION REVENUE", title:"Intelligence exécutive des rencontres", mission:"Mesurer le mouvement commercial, les décisions obtenues, les engagements ouverts et la valeur exposée.", primaryAction:"Actualiser la posture", archetype:"executive", accent:"navy" },
  "follow-up": { key:"follow-up", eyebrow:"SUITE COMMERCIALE", title:"Plan de suivi du rendez-vous", mission:"Convertir les engagements en actions datées, responsables et reliées à l’opportunité.", primaryAction:"Créer le suivi", archetype:"follow-up", accent:"blue" },
  "high-value": { key:"high-value", eyebrow:"FORTE VALEUR", title:"Rencontres stratégiques", mission:"Protéger les rendez-vous dont la valeur et l’influence exigent une préparation renforcée.", primaryAction:"Ouvrir le dossier prioritaire", archetype:"high-value", accent:"violet" },
  "live-command": { key:"live-command", eyebrow:"LIVE COMMAND", title:"Rendez-vous en cours et prêts à démarrer", mission:"Contrôler les rencontres actives, la présence, les objectifs et la capture des résultats.", primaryAction:"Démarrer la prochaine réunion", archetype:"live", accent:"red" },
  "live-room": { key:"live-room", eyebrow:"SALLE DE RÉUNION", title:"Exécution commerciale en direct", mission:"Capturer notes, objections, décisions et engagements sans perdre le contexte du compte.", primaryAction:"Clôturer avec résultat", archetype:"live", accent:"navy" },
  "schedule-studio": { key:"schedule-studio", eyebrow:"STUDIO DE PLANIFICATION", title:"Composer un rendez-vous gouverné", mission:"Définir objectif, participants, créneau, confirmation, préparation et résultat attendu.", primaryAction:"Enregistrer le rendez-vous", archetype:"studio", accent:"blue" },
  "new-appointment": { key:"new-appointment", eyebrow:"NOUVEL ENGAGEMENT", title:"Créer une rencontre commerciale", mission:"Transformer une intention de contact en rendez-vous assigné, préparé et mesurable.", primaryAction:"Créer et préparer", archetype:"studio", accent:"green" },
  "no-shows": { key:"no-shows", eyebrow:"ABSENCES", title:"Centre de traitement des non-présentations", mission:"Qualifier la cause, protéger la relation et lancer une récupération immédiate.", primaryAction:"Déclarer une absence", archetype:"no-shows", accent:"red" },
  "outcome-studio": { key:"outcome-studio", eyebrow:"RÉSULTAT COMMERCIAL", title:"Studio de conclusion de réunion", mission:"Enregistrer un résultat complet et propager décisions, engagements, tâches et progression.", primaryAction:"Valider le résultat", archetype:"conversion", accent:"green" },
  "performance": { key:"performance", eyebrow:"PERFORMANCE ÉQUIPE", title:"Discipline et efficacité des rencontres", mission:"Comparer confirmation, préparation, présence, conversion et exécution des engagements.", primaryAction:"Analyser les responsables", archetype:"performance", accent:"violet" },
  "queue": { key:"queue", eyebrow:"FILE OPÉRATIONNELLE", title:"Portefeuille des rendez-vous", mission:"Rechercher, filtrer et traiter chaque rendez-vous selon urgence, étape et valeur.", primaryAction:"Planifier un rendez-vous", primaryHref:"/revenue-command-center/appointments/new", archetype:"queue", accent:"blue" },
  "recovery": { key:"recovery", eyebrow:"RECOVERY COMMAND", title:"Récupération des rendez-vous fragilisés", mission:"Orchestrer relance, replanification et escalade avec une trace complète des tentatives.", primaryAction:"Lancer une récupération", archetype:"recovery", accent:"red" },
  "reschedules": { key:"reschedules", eyebrow:"REPLANIFICATION", title:"Contrôle des changements de créneau", mission:"Sécuriser chaque nouvelle date, reconfirmer les participants et préserver la préparation.", primaryAction:"Replanifier", archetype:"reschedules", accent:"amber" },
  "risk": { key:"risk", eyebrow:"RISQUE DE CONVERSION", title:"Signaux de fragilité des rendez-vous", mission:"Prioriser les absences probables, confirmations manquantes et préparations incomplètes.", primaryAction:"Traiter un risque", archetype:"risk", accent:"red" },
  "analytics": { key:"analytics", eyebrow:"INTELLIGENCE RENDEZ-VOUS", title:"Analyses de cadence et conversion", mission:"Lire les volumes, taux, tendances et écarts sans fabriquer de signaux indisponibles.", primaryAction:"Actualiser les analyses", archetype:"analytics", accent:"cyan" },
}

export const ENGAGEMENT_NAVIGATION = [
  ["Commandement", "/revenue-command-center/appointments"],
  ["File", "/revenue-command-center/appointments/queue"],
  ["Calendrier", "/revenue-command-center/appointments/calendar"],
  ["Préparation", "/revenue-command-center/appointments/control-tower"],
  ["En direct", "/revenue-command-center/appointments/live"],
  ["Conversion", "/revenue-command-center/appointments/conversion"],
  ["Absences", "/revenue-command-center/appointments/no-shows"],
  ["Analyses", "/revenue-command-center/appointments/analytics"],
] as const
