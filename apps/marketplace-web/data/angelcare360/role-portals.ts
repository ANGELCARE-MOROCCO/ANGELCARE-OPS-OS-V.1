import type { Angelcare360PortalKind } from '@/types/angelcare360/role-portals'

export type RolePortalNavItem = { key: string; label: string; shortLabel: string; href: string; description: string; icon: string; actionHint?: string }

export const TEACHER_PORTAL_NAV: RolePortalNavItem[] = [
  { key:'today', label:'Mon jour', shortLabel:'Aujourd’hui', href:'/angelcare-360-teacher', description:'Priorités pédagogiques, cours, devoirs, présences et actions du jour.', icon:'sun' },
  { key:'classes', label:'Mes classes', shortLabel:'Classes', href:'/angelcare-360-teacher/classes', description:'Classes attribuées, élèves et contexte pédagogique.', icon:'users' },
  { key:'timetable', label:'Mon emploi du temps', shortLabel:'Planning', href:'/angelcare-360-teacher/emploi-du-temps', description:'Séances, matières, salles et continuité pédagogique.', icon:'calendar' },
  { key:'attendance', label:'Présences', shortLabel:'Présences', href:'/angelcare-360-teacher/presences', description:'Présence des classes sous responsabilité et anomalies à traiter.', icon:'check' },
  { key:'teaching', label:'Enseignement', shortLabel:'Cours', href:'/angelcare-360-teacher/enseignement', description:'Cours, progression, séquences et ressources.', icon:'book' },
  { key:'homework', label:'Devoirs', shortLabel:'Devoirs', href:'/angelcare-360-teacher/devoirs', description:'Création, publication, échéances et suivi des devoirs.', icon:'clipboard' },
  { key:'submissions', label:'Soumissions', shortLabel:'Soumissions', href:'/angelcare-360-teacher/soumissions', description:'Travaux reçus, en retard, à corriger ou à restituer.', icon:'inbox' },
  { key:'assessments', label:'Évaluations', shortLabel:'Évaluations', href:'/angelcare-360-teacher/evaluations', description:'Évaluations, sessions et readiness.', icon:'target' },
  { key:'marks', label:'Notes & maîtrise', shortLabel:'Notes', href:'/angelcare-360-teacher/notes', description:'Saisie, vérification et suivi des résultats autorisés.', icon:'chart' },
  { key:'bulletins', label:'Bulletins', shortLabel:'Bulletins', href:'/angelcare-360-teacher/bulletins', description:'Contributions, appréciations et dossiers en préparation.', icon:'file' },
  { key:'families', label:'Relation familles', shortLabel:'Familles', href:'/angelcare-360-teacher/relation-familles', description:'Échanges autorisés, rendez-vous, engagements et suivis.', icon:'heart' },
  { key:'tasks', label:'Mes tâches', shortLabel:'Tâches', href:'/angelcare-360-teacher/taches', description:'Actions personnelles, échéances et workflow.', icon:'list' },
  { key:'work', label:'Mon travail', shortLabel:'Travail', href:'/angelcare-360-teacher/mon-travail', description:'Planning, congés, documents et continuité personnelle.', icon:'briefcase' },
  { key:'notifications', label:'Notifications', shortLabel:'Alertes', href:'/angelcare-360-teacher/notifications', description:'Informations internes et actions nécessitant lecture.', icon:'bell' },
]

export const PARENT_PORTAL_NAV: RolePortalNavItem[] = [
  { key:'home', label:'Ma famille', shortLabel:'Accueil', href:'/angelcare-360-parent', description:'Vue familiale du jour, enfants, actions et informations importantes.', icon:'home' },
  { key:'children', label:'Mes enfants', shortLabel:'Enfants', href:'/angelcare-360-parent/enfants', description:'Profil scolaire, présence, progression et informations autorisées.', icon:'users' },
  { key:'today', label:'Aujourd’hui', shortLabel:'Aujourd’hui', href:'/angelcare-360-parent/aujourdhui', description:'Ce qui se passe aujourd’hui pour votre famille.', icon:'sun' },
  { key:'attendance', label:'Présences', shortLabel:'Présences', href:'/angelcare-360-parent/presences', description:'Arrivées, absences, retards et justificatifs.', icon:'check' },
  { key:'learning', label:'Apprentissages', shortLabel:'Apprentissages', href:'/angelcare-360-parent/apprentissages', description:'Devoirs, évaluations, résultats et bulletins.', icon:'book' },
  { key:'messages', label:'Messages', shortLabel:'Messages', href:'/angelcare-360-parent/messages', description:'Échanges avec l’établissement dans un cadre traçable.', icon:'message' },
  { key:'notifications', label:'Notifications', shortLabel:'Alertes', href:'/angelcare-360-parent/notifications', description:'Avis, rappels et informations nécessitant votre attention.', icon:'bell' },
  { key:'finance', label:'Finance famille', shortLabel:'Finance', href:'/angelcare-360-parent/finance', description:'Factures, paiements, reçus, soldes et demandes financières.', icon:'wallet' },
  { key:'transport', label:'Transport & sortie', shortLabel:'Transport', href:'/angelcare-360-parent/transport', description:'Transport, personnes autorisées et demandes de changement.', icon:'bus' },
  { key:'requests', label:'Mes demandes', shortLabel:'Demandes', href:'/angelcare-360-parent/demandes', description:'Demandes ouvertes, statut, responsable et prochaine étape.', icon:'inbox' },
  { key:'meetings', label:'Rendez-vous', shortLabel:'Rendez-vous', href:'/angelcare-360-parent/rendez-vous', description:'Demandes, confirmations, préparation et suites.', icon:'calendar' },
  { key:'support', label:'Aide & réclamations', shortLabel:'Aide', href:'/angelcare-360-parent/aide', description:'Réclamations, résolution, engagements et suivi.', icon:'life' },
  { key:'documents', label:'Documents', shortLabel:'Documents', href:'/angelcare-360-parent/documents', description:'Documents familiaux et scolaires disponibles.', icon:'file' },
  { key:'satisfaction', label:'Satisfaction & feedback', shortLabel:'Feedback', href:'/angelcare-360-parent/satisfaction', description:'Réponses, retours, suivi et relation durable.', icon:'heart' },
  { key:'account', label:'Mon compte', shortLabel:'Compte', href:'/angelcare-360-parent/compte', description:'Coordonnées, préférences, sécurité et accès.', icon:'settings' },
]

export const PORTAL_ROLE_KEYS: Record<Angelcare360PortalKind, string[]> = {
  teacher: ['teacher','enseignant'],
  parent: ['parent','guardian','responsable'],
  staff: ['staff','administration','reception','finance','rh','transport','bibliotheque','qualite'],
  student: ['student','eleve','élève'],
}

export const PORTAL_DEFAULT_ROUTE: Record<Angelcare360PortalKind, string> = {
  teacher: '/angelcare-360-teacher',
  parent: '/angelcare-360-parent',
  staff: '/angelcare-360-staff',
  student: '/angelcare-360-student',
}


export const STAFF_PORTAL_NAV: RolePortalNavItem[] = [
  {key:'today',label:'Mon jour',shortLabel:'Aujourd’hui',href:'/angelcare-360-staff',description:'Planning, responsabilités, tâches et signaux du jour.',icon:'sun'},
  {key:'schedule',label:'Mon planning',shortLabel:'Planning',href:'/angelcare-360-staff/planning',description:'Shifts et affectations publiés pour votre profil.',icon:'calendar'},
  {key:'leave',label:'Mes congés',shortLabel:'Congés',href:'/angelcare-360-staff/conges',description:'Demandes, décisions et périodes de congé.',icon:'umbrella'},
  {key:'tasks',label:'Mes tâches',shortLabel:'Tâches',href:'/angelcare-360-staff/taches',description:'Actions qui vous sont réellement attribuées.',icon:'list'},
  {key:'approvals',label:'Approbations',shortLabel:'Approbations',href:'/angelcare-360-staff/approbations',description:'Demandes qui nécessitent votre attention.',icon:'check'},
  {key:'workflows',label:'Mes workflows',shortLabel:'Workflows',href:'/angelcare-360-staff/workflows',description:'Processus auxquels vous êtes rattaché.',icon:'route'},
  {key:'tickets',label:'Mes signalements',shortLabel:'Tickets',href:'/angelcare-360-staff/tickets',description:'Blocages et anomalies opérationnelles traçables.',icon:'alert'},
  {key:'documents',label:'Mes documents',shortLabel:'Documents',href:'/angelcare-360-staff/documents',description:'Documents professionnels visibles dans votre périmètre.',icon:'file'},
  {key:'messages',label:'Messages',shortLabel:'Messages',href:'/angelcare-360-staff/messages',description:'Échanges internes rattachés à votre identité.',icon:'message'},
  {key:'notifications',label:'Notifications',shortLabel:'Alertes',href:'/angelcare-360-staff/notifications',description:'Informations et actions adressées à votre compte.',icon:'bell'},
  {key:'team',label:'Mon équipe',shortLabel:'Équipe',href:'/angelcare-360-staff/equipe',description:'Contexte d’équipe minimal selon vos permissions.',icon:'users'},
  {key:'history',label:'Mon historique',shortLabel:'Historique',href:'/angelcare-360-staff/historique',description:'Actions et continuité professionnelles visibles.',icon:'clock'},
  {key:'profile',label:'Mon profil',shortLabel:'Profil',href:'/angelcare-360-staff/profil',description:'Identité professionnelle et sécurité.',icon:'user'},
]

export const STUDENT_PORTAL_NAV: RolePortalNavItem[] = [
  {key:'today',label:'Mon jour',shortLabel:'Aujourd’hui',href:'/angelcare-360-student',description:'Cours, devoirs, échéances et informations utiles.',icon:'sun'},
  {key:'timetable',label:'Mon emploi du temps',shortLabel:'Planning',href:'/angelcare-360-student/emploi-du-temps',description:'Séances publiées pour votre classe.',icon:'calendar'},
  {key:'subjects',label:'Mes matières',shortLabel:'Matières',href:'/angelcare-360-student/matieres',description:'Matières de votre classe et année scolaire.',icon:'book'},
  {key:'lessons',label:'Mes cours',shortLabel:'Cours',href:'/angelcare-360-student/cours',description:'Cours et progression publiés.',icon:'book-open'},
  {key:'homework',label:'Mes devoirs',shortLabel:'Devoirs',href:'/angelcare-360-student/devoirs',description:'Devoirs, échéances et état de remise.',icon:'clipboard'},
  {key:'submissions',label:'Mes remises',shortLabel:'Remises',href:'/angelcare-360-student/soumissions',description:'Remises enregistrées et feedback enseignant.',icon:'inbox'},
  {key:'assessments',label:'Évaluations',shortLabel:'Évaluations',href:'/angelcare-360-student/evaluations',description:'Évaluations publiées et calendrier.',icon:'target'},
  {key:'results',label:'Mes résultats',shortLabel:'Résultats',href:'/angelcare-360-student/resultats',description:'Notes et résultats réellement publiés.',icon:'chart'},
  {key:'reportCards',label:'Mes bulletins',shortLabel:'Bulletins',href:'/angelcare-360-student/bulletins',description:'Bulletins disponibles pour votre dossier.',icon:'file'},
  {key:'attendance',label:'Mes présences',shortLabel:'Présences',href:'/angelcare-360-student/presences',description:'Présence, absences et retards enregistrés.',icon:'check'},
  {key:'library',label:'Bibliothèque',shortLabel:'Bibliothèque',href:'/angelcare-360-student/bibliotheque',description:'Mes emprunts et échéances de retour.',icon:'library'},
  {key:'messages',label:'Messages',shortLabel:'Messages',href:'/angelcare-360-student/messages',description:'Échanges internes autorisés.',icon:'message'},
  {key:'notifications',label:'Notifications',shortLabel:'Alertes',href:'/angelcare-360-student/notifications',description:'Informations adressées à votre compte.',icon:'bell'},
  {key:'documents',label:'Mes documents',shortLabel:'Documents',href:'/angelcare-360-student/documents',description:'Documents scolaires visibles pour votre dossier.',icon:'file'},
  {key:'profile',label:'Mon profil',shortLabel:'Profil',href:'/angelcare-360-student/profil',description:'Identité scolaire et accès.',icon:'user'},
]
