export type SanilaExperienceModuleId =
  | 'cockpit-direction'
  | 'people'
  | 'admissions'
  | 'presences'
  | 'academique'
  | 'finance'
  | 'paie'
  | 'transport'
  | 'bibliotheque'
  | 'inventaire'
  | 'messagerie'
  | 'reclamations'
  | 'rapports'
  | 'administration'

export type SanilaExperienceModule = {
  id: SanilaExperienceModuleId
  label: string
  shortLabel: string
  family: 'Pilotage' | 'Scolarité' | 'Gestion' | 'Services' | 'Gouvernance'
  href: string
  promise: string
  proof: string
  durationMinutes: number
  accent: 'navy' | 'blue' | 'gold' | 'green' | 'violet' | 'rose' | 'cyan' | 'orange'
}

export const SANILA_EXPERIENCE_MODULES: SanilaExperienceModule[] = [
  { id: 'cockpit-direction', label: 'Cockpit de Direction', shortLabel: 'Direction', family: 'Pilotage', href: '/angelcare-360-command-center/direction', promise: 'Prenez le pouls de l’établissement et concentrez-vous sur ce qui exige une décision.', proof: 'Risques, décisions, engagements et priorités dans un même cockpit.', durationMinutes: 4, accent: 'navy' },
  { id: 'people', label: 'Personnes & Communauté', shortLabel: 'Personnes', family: 'Scolarité', href: '/angelcare-360-command-center/personnes', promise: 'Retrouvez élèves, familles, enseignants et collaborateurs dans des dossiers structurés.', proof: 'Identités, relations, affectations et continuité des dossiers.', durationMinutes: 4, accent: 'violet' },
  { id: 'admissions', label: 'Admissions & Inscriptions', shortLabel: 'Admissions', family: 'Scolarité', href: '/angelcare-360-command-center/admissions', promise: 'Suivez chaque famille depuis la demande initiale jusqu’à l’inscription.', proof: 'Pipeline, dossiers, décisions, documents et conversion.', durationMinutes: 5, accent: 'blue' },
  { id: 'presences', label: 'Présences & Vie quotidienne', shortLabel: 'Présences', family: 'Scolarité', href: '/angelcare-360-command-center/presences', promise: 'Voyez instantanément qui est présent, absent, en retard ou à justifier.', proof: 'Suivi quotidien, classes, retards, absences et justifications.', durationMinutes: 5, accent: 'green' },
  { id: 'academique', label: 'Gestion Académique', shortLabel: 'Académique', family: 'Scolarité', href: '/angelcare-360-command-center/academique', promise: 'Reliez cours, devoirs, examens, notes et bulletins dans une continuité pédagogique.', proof: 'Emploi du temps, évaluations, notes, bulletins et progression.', durationMinutes: 7, accent: 'cyan' },
  { id: 'finance', label: 'Finance Scolaire', shortLabel: 'Finance', family: 'Gestion', href: '/angelcare-360-command-center/finance', promise: 'Transformez facturation, encaissements et relances en visibilité financière.', proof: 'Factures, paiements, reçus, remises, soldes et recouvrement.', durationMinutes: 7, accent: 'gold' },
  { id: 'paie', label: 'Personnel & Paie', shortLabel: 'Paie', family: 'Gestion', href: '/angelcare-360-command-center/paie', promise: 'Pilotez les équipes jusqu’aux périodes et dossiers de paie.', proof: 'Personnel, variables, validation, paiements et conformité.', durationMinutes: 6, accent: 'orange' },
  { id: 'transport', label: 'Transport & Sécurité', shortLabel: 'Transport', family: 'Services', href: '/angelcare-360-command-center/transport', promise: 'Suivez la mobilité scolaire avec une logique de sécurité opérationnelle.', proof: 'Circuits, véhicules, exécution, retards, incidents et sécurité.', durationMinutes: 6, accent: 'blue' },
  { id: 'bibliotheque', label: 'Bibliothèque', shortLabel: 'Bibliothèque', family: 'Services', href: '/angelcare-360-command-center/bibliotheque', promise: 'Gardez une circulation claire des ouvrages et des exemplaires.', proof: 'Catalogue, prêts en cours, retards et historique de circulation.', durationMinutes: 3, accent: 'violet' },
  { id: 'inventaire', label: 'Inventaire & Actifs', shortLabel: 'Inventaire', family: 'Services', href: '/angelcare-360-command-center/inventaire', promise: 'Gardez le contrôle des stocks, mouvements et responsabilités.', proof: 'Articles, seuils, mouvements, responsables et anomalies.', durationMinutes: 4, accent: 'green' },
  { id: 'messagerie', label: 'Communication & Engagement', shortLabel: 'Communication', family: 'Services', href: '/angelcare-360-command-center/messagerie', promise: 'Centralisez l’information utile et l’engagement de la communauté scolaire.', proof: 'Conversations, annonces, audiences et historique des échanges.', durationMinutes: 4, accent: 'rose' },
  { id: 'reclamations', label: 'Réclamations & Qualité', shortLabel: 'Qualité', family: 'Services', href: '/angelcare-360-command-center/reclamations', promise: 'Transformez les irritants en actions suivies et résolues.', proof: 'Réclamations, priorités, assignations, suivi et résolution.', durationMinutes: 4, accent: 'orange' },
  { id: 'rapports', label: 'Intelligence & Documents', shortLabel: 'Intelligence', family: 'Services', href: '/angelcare-360-command-center/rapports', promise: 'Passez de l’activité quotidienne à une lecture consolidée et exploitable.', proof: 'Rapports, documents, exports et vues de pilotage.', durationMinutes: 5, accent: 'navy' },
  { id: 'administration', label: 'Fondation & Administration', shortLabel: 'Fondation', family: 'Gouvernance', href: '/angelcare-360-command-center/administration', promise: 'Maîtrisez la structure institutionnelle qui alimente tout le système.', proof: 'Années, classes, rôles, paramètres et gouvernance.', durationMinutes: 5, accent: 'gold' },
]

export const SANILA_GUIDED_JOURNEYS = [
  { id: 'direction', label: 'Je dirige l’établissement', description: 'Comprendre en quelques minutes comment SANILA aide une direction à piloter, décider et agir.', durationMinutes: 18, modules: ['cockpit-direction', 'admissions', 'presences', 'finance', 'paie', 'rapports'] as SanilaExperienceModuleId[] },
  { id: 'pedagogie', label: 'Je pilote la pédagogie', description: 'Explorer la continuité pédagogique depuis la classe jusqu’aux évaluations et bulletins.', durationMinutes: 16, modules: ['academique', 'presences', 'people', 'messagerie', 'rapports'] as SanilaExperienceModuleId[] },
  { id: 'operations', label: 'Je pilote les opérations', description: 'Voir comment la journée scolaire, les équipes, les incidents et les ressources restent sous contrôle.', durationMinutes: 17, modules: ['presences', 'transport', 'paie', 'inventaire', 'reclamations', 'cockpit-direction'] as SanilaExperienceModuleId[] },
  { id: 'finance', label: 'Je pilote finance & administration', description: 'Suivre les admissions, la facturation, les encaissements et les équipes administratives.', durationMinutes: 15, modules: ['admissions', 'finance', 'paie', 'administration', 'rapports'] as SanilaExperienceModuleId[] },
  { id: 'complete', label: 'Je veux tout évaluer', description: 'Un parcours complet de l’écosystème SANILA, sans raccourci.', durationMinutes: 42, modules: SANILA_EXPERIENCE_MODULES.map((module) => module.id) },
] as const

export const SANILA_PRIORITY_OPTIONS = [
  'Centraliser la gestion de l’établissement',
  'Réduire les impayés',
  'Fiabiliser les présences',
  'Fluidifier les admissions',
  'Renforcer la pédagogie',
  'Piloter les équipes & la paie',
  'Sécuriser le transport',
  'Améliorer la relation parents',
  'Structurer qualité & incidents',
  'Disposer de rapports de direction fiables',
] as const

export function sanilaModuleFromPath(pathname: string) {
  return SANILA_EXPERIENCE_MODULES
    .filter((module) => pathname === module.href || pathname.startsWith(`${module.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0] || null
}
