export type Angelcare360PeopleNavigationItem = {
  key: string
  label: string
  href: string
  summary: string
  permission: string
  badge?: string
}

export const ANGELCARE360_PEOPLE_NAVIGATION: Angelcare360PeopleNavigationItem[] = [
  {
    key: 'overview',
    label: 'Vue d’ensemble',
    href: '/angelcare-360-command-center/personnes',
    summary: 'Cockpit humain, complétude des dossiers et alertes de cohérence.',
    permission: 'eleves.view',
    badge: 'Hub',
  },
  {
    key: 'eleves',
    label: 'Élèves',
    href: '/angelcare-360-command-center/eleves',
    summary: 'Dossiers élèves, affectations, liens parents et documents.',
    permission: 'eleves.view',
  },
  {
    key: 'parents',
    label: 'Parents',
    href: '/angelcare-360-command-center/parents',
    summary: 'Dossiers familles, enfants liés et informations de contact.',
    permission: 'parents.view',
  },
  {
    key: 'enseignants',
    label: 'Enseignants',
    href: '/angelcare-360-command-center/enseignants',
    summary: 'Profils pédagogiques, affectations et fonctions associées.',
    permission: 'enseignants.view',
  },
  {
    key: 'personnel',
    label: 'Personnel',
    href: '/angelcare-360-command-center/personnel',
    summary: 'Personnel administratif, contrats et répartition des rôles.',
    permission: 'personnel.view',
  },
  {
    key: 'liens-parent-enfant',
    label: 'Liens parent/enfant',
    href: '/angelcare-360-command-center/personnes/liens-parent-enfant',
    summary: 'Gestion des liens parentaux et des contacts autorisés.',
    permission: 'parents.update',
  },
  {
    key: 'contacts-urgence',
    label: 'Contacts d’urgence',
    href: '/angelcare-360-command-center/personnes/contacts-urgence',
    summary: 'Contacts prioritaires liés aux élèves et au personnel.',
    permission: 'eleves.view',
  },
  {
    key: 'documents',
    label: 'Documents',
    href: '/angelcare-360-command-center/personnes/documents',
    summary: 'Références documentaires, statuts et échéances.',
    permission: 'documents.view',
  },
  {
    key: 'affectations-classes',
    label: 'Affectations classes',
    href: '/angelcare-360-command-center/personnes/affectations-classes',
    summary: 'Inscriptions et rattachements classe/section.',
    permission: 'classes.view',
  },
  {
    key: 'audit',
    label: 'Audit personnes',
    href: '/angelcare-360-command-center/personnes/audit',
    summary: 'Historique des mutations humaines sensibles.',
    permission: 'audit.view',
  },
]

