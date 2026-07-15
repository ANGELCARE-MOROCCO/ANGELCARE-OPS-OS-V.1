export type Angelcare360AcademicNavigationItem = {
  key: string
  label: string
  href: string
  summary: string
  permission: string
  badge?: string
}

export const ANGELCARE360_ACADEMICS_NAVIGATION: Angelcare360AcademicNavigationItem[] = [
  {
    key: 'overview',
    label: 'Vue d’ensemble',
    href: '/angelcare-360-command-center/academique',
    summary: 'Cockpit académique, risques et points d’exécution.',
    permission: 'academics.view',
    badge: 'Centre',
  },
  {
    key: 'cours',
    label: 'Cours',
    href: '/angelcare-360-command-center/academique/cours',
    summary: 'Cours, contenus pédagogiques et suivi des séances.',
    permission: 'academics.view',
  },
  {
    key: 'devoirs',
    label: 'Devoirs',
    href: '/angelcare-360-command-center/academique/devoirs',
    summary: 'Devoirs, échéances et état de publication.',
    permission: 'academics.view',
  },
  {
    key: 'soumissions',
    label: 'Soumissions',
    href: '/angelcare-360-command-center/academique/soumissions',
    summary: 'Soumissions, statuts et correction.',
    permission: 'academics.update',
  },
  {
    key: 'examens',
    label: 'Examens',
    href: '/angelcare-360-command-center/academique/examens',
    summary: 'Examens, sessions et statut d’exécution.',
    permission: 'examens.view',
  },
  {
    key: 'sessions',
    label: 'Sessions d’examens',
    href: '/angelcare-360-command-center/academique/sessions-examens',
    summary: 'Créneaux, salles et surveillance.',
    permission: 'examens.update',
  },
  {
    key: 'notes',
    label: 'Notes',
    href: '/angelcare-360-command-center/academique/notes',
    summary: 'Saisie unitaire et lot des notes.',
    permission: 'academics.update',
  },
  {
    key: 'moyennes',
    label: 'Moyennes',
    href: '/angelcare-360-command-center/academique/moyennes',
    summary: 'Contrôle de la formule et préparation des moyennes.',
    permission: 'academics.view',
  },
  {
    key: 'bulletins',
    label: 'Bulletins',
    href: '/angelcare-360-command-center/academique/bulletins',
    summary: 'Bulletins, lignes et statuts de publication.',
    permission: 'bulletins.view',
  },
  {
    key: 'appreciations',
    label: 'Appréciations',
    href: '/angelcare-360-command-center/academique/appreciations',
    summary: 'Commentaires enseignants et appréciations.',
    permission: 'academics.update',
  },
  {
    key: 'audit',
    label: 'Audit académique',
    href: '/angelcare-360-command-center/academique/audit',
    summary: 'Journal des opérations académiques et des blocages.',
    permission: 'audit.view',
  },
]
