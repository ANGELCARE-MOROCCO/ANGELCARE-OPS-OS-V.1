import type { ExecutionExperienceKey } from "./types"

export type ExecutionRouteContract = {
  key: ExecutionExperienceKey
  eyebrow: string
  title: string
  mission: string
  primaryAction: string
  primaryHref?: string
  archetype: "command" | "queue" | "board" | "calendar" | "governance" | "recovery" | "analytics" | "dossier" | "studio" | "capacity" | "timeline"
  accent: "navy" | "blue" | "red" | "amber" | "green" | "violet"
  filters?: string[]
}

export const EXECUTION_ROUTE_CONTRACTS: Record<ExecutionExperienceKey, ExecutionRouteContract> = {
  "daily-desk": { key:"daily-desk", eyebrow:"POSTE PERSONNEL", title:"Bureau d’exécution du jour", mission:"Ordonner les engagements commerciaux du jour par urgence, valeur et dépendance.", primaryAction:"Créer une action", primaryHref:"/revenue-command-center/daily-tasks/new", archetype:"command", accent:"navy" },
  "daily-command": { key:"daily-command", eyebrow:"EXÉCUTION QUOTIDIENNE", title:"Centre de commandement des missions", mission:"Piloter la production commerciale, les blocages, les validations et la clôture de journée.", primaryAction:"Nouvelle mission", primaryHref:"/revenue-command-center/daily-tasks/new", archetype:"command", accent:"blue" },
  "daily-task-dossier": { key:"daily-task-dossier", eyebrow:"DOSSIER DE MISSION", title:"Dossier d’exécution quotidien", mission:"Réunir objectif, responsabilité, preuves, dépendances et décisions dans un dossier traçable.", primaryAction:"Mettre à jour", archetype:"dossier", accent:"navy" },
  "team-command": { key:"team-command", eyebrow:"COMMANDE ÉQUIPE", title:"Orchestration des responsables", mission:"Répartir la charge, détecter les surcharges et intervenir avant qu’un engagement commercial ne dérive.", primaryAction:"Réaffecter une mission", archetype:"capacity", accent:"violet" },
  "execution-analytics": { key:"execution-analytics", eyebrow:"INTELLIGENCE D’EXÉCUTION", title:"Performance et discipline opérationnelle", mission:"Mesurer le débit, les retards, les blocages et la crédibilité des clôtures.", primaryAction:"Exporter la lecture", archetype:"analytics", accent:"blue" },
  "daily-approvals": { key:"daily-approvals", eyebrow:"GOUVERNANCE DU JOUR", title:"Décisions et validations quotidiennes", mission:"Décider avec le contexte, les preuves et les conséquences commerciales visibles.", primaryAction:"Ouvrir la prochaine décision", archetype:"governance", accent:"amber" },
  "daily-blocked": { key:"daily-blocked", eyebrow:"INTERVENTION IMMÉDIATE", title:"Récupération des missions bloquées", mission:"Identifier le verrou, désigner le responsable de résolution et protéger la valeur commerciale exposée.", primaryAction:"Déclarer un blocage", archetype:"recovery", accent:"red" },
  "daily-board": { key:"daily-board", eyebrow:"FLUX DU JOUR", title:"Tableau de progression quotidienne", mission:"Visualiser le mouvement réel des missions et contrôler chaque transition.", primaryAction:"Ajouter une mission", primaryHref:"/revenue-command-center/daily-tasks/new", archetype:"board", accent:"blue" },
  "execution-calendar": { key:"execution-calendar", eyebrow:"PLANIFICATION", title:"Calendrier d’exécution commerciale", mission:"Répartir les échéances, éviter les congestions et sécuriser les engagements à venir.", primaryAction:"Planifier une mission", primaryHref:"/revenue-command-center/daily-tasks/new", archetype:"calendar", accent:"green" },
  "focus-mode": { key:"focus-mode", eyebrow:"MODE CONCENTRATION", title:"Mission prioritaire en cours", mission:"Isoler une mission critique et guider son exécution jusqu’à une clôture crédible.", primaryAction:"Démarrer la mission", archetype:"queue", accent:"navy" },
  "daily-registry": { key:"daily-registry", eyebrow:"REGISTRE QUOTIDIEN", title:"Inventaire contrôlé des missions", mission:"Rechercher, filtrer et administrer chaque engagement quotidien sans perte de contexte.", primaryAction:"Créer une mission", primaryHref:"/revenue-command-center/daily-tasks/new", archetype:"queue", accent:"blue" },
  "daily-create": { key:"daily-create", eyebrow:"STUDIO DE MISSION", title:"Composer une mission quotidienne", mission:"Définir le résultat attendu, le responsable, l’échéance, les preuves et les dépendances avant lancement.", primaryAction:"Enregistrer la mission", archetype:"studio", accent:"green" },
  "my-work": { key:"my-work", eyebrow:"MON ESPACE", title:"Mes engagements commerciaux", mission:"Concentrer les missions dont je suis responsable, collaborateur ou approbateur.", primaryAction:"Créer une action personnelle", primaryHref:"/revenue-command-center/tasks/new", archetype:"queue", accent:"navy" },
  "task-dossier": { key:"task-dossier", eyebrow:"DOSSIER D’ACTION", title:"Dossier opérationnel de la tâche", mission:"Disposer d’une vérité unique sur le travail, ses relations commerciales et sa preuve de réalisation.", primaryAction:"Mettre à jour la tâche", archetype:"dossier", accent:"navy" },
  "task-approvals": { key:"task-approvals", eyebrow:"CONSEIL DE VALIDATION", title:"Bureau des approbations", mission:"Arbitrer les demandes, examiner les preuves et conserver une décision auditable.", primaryAction:"Examiner la prochaine demande", archetype:"governance", accent:"amber" },
  "task-blocked": { key:"task-blocked", eyebrow:"REVENU À PROTÉGER", title:"Centre de résolution des blocages", mission:"Rendre visibles les dépendances empêchant l’exécution et imposer un plan de récupération.", primaryAction:"Ouvrir un dossier critique", archetype:"recovery", accent:"red" },
  "task-board": { key:"task-board", eyebrow:"CHAÎNE D’EXÉCUTION", title:"Flux contrôlé des tâches", mission:"Déplacer le travail uniquement lorsque les conditions, preuves et autorisations sont satisfaites.", primaryAction:"Créer une tâche", primaryHref:"/revenue-command-center/tasks/new", archetype:"board", accent:"violet" },
  "task-create": { key:"task-create", eyebrow:"STUDIO D’ACTION", title:"Créer une tâche gouvernée", mission:"Transformer un objectif commercial en action assignée, mesurable et vérifiable.", primaryAction:"Créer la tâche", archetype:"studio", accent:"green" },
  "task-command": { key:"task-command", eyebrow:"CONTROL PLANE", title:"Centre de commandement des tâches", mission:"Contrôler le portefeuille complet de travail, les responsabilités, les risques et les résultats.", primaryAction:"Nouvelle tâche", primaryHref:"/revenue-command-center/tasks/new", archetype:"command", accent:"navy" },
  "workload-balancer": { key:"workload-balancer", eyebrow:"CAPACITÉ ET CHARGE", title:"Équilibrage des ressources commerciales", mission:"Comparer capacité, charge, urgence et valeur avant toute réaffectation.", primaryAction:"Préparer une réaffectation", archetype:"capacity", accent:"violet" },
  "activity-timeline": { key:"activity-timeline", eyebrow:"TRAÇABILITÉ", title:"Chronologie immuable de l’exécution", mission:"Comprendre qui a fait quoi, quand, sous quelle autorité et avec quel résultat.", primaryAction:"Actualiser la chronologie", archetype:"timeline", accent:"blue" },
}

export const EXECUTION_NAVIGATION = [
  ["Bureau du jour", "/revenue-command-center/daily-desk"],
  ["Mes engagements", "/revenue-command-center/my-work"],
  ["Commandement", "/revenue-command-center/tasks"],
  ["Tableau", "/revenue-command-center/tasks/board"],
  ["Approbations", "/revenue-command-center/tasks/approvals"],
  ["Blocages", "/revenue-command-center/tasks/blocked"],
  ["Capacité", "/revenue-command-center/workload-balancer"],
  ["Chronologie", "/revenue-command-center/activity-timeline"],
] as const
