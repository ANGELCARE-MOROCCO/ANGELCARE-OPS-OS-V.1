export type Angelcare360LibraryNavigationItem = {
  key: string
  label: string
  href: string
  summary: string
  permission: string
  badge?: string
}

export const ANGELCARE360_LIBRARY_NAVIGATION: Angelcare360LibraryNavigationItem[] = [
  {
    key: 'overview',
    label: 'Vue d’ensemble',
    href: '/angelcare-360-command-center/bibliotheque',
    summary: 'Cockpit bibliothèque, prêts et disponibilité.',
    permission: 'bibliotheque.view',
    badge: 'Hub',
  },
  {
    key: 'books',
    label: 'Livres',
    href: '/angelcare-360-command-center/bibliotheque/livres',
    summary: 'Catalogue livres et fiches ouvrage.',
    permission: 'bibliotheque.view',
  },
  {
    key: 'copies',
    label: 'Exemplaires',
    href: '/angelcare-360-command-center/bibliotheque/exemplaires',
    summary: 'Copies physiques, état et disponibilité.',
    permission: 'bibliotheque.view',
  },
  {
    key: 'loans',
    label: 'Prêts',
    href: '/angelcare-360-command-center/bibliotheque/prets',
    summary: 'Prêts actifs, retours et retards.',
    permission: 'bibliotheque.view',
  },
  {
    key: 'returns',
    label: 'Retours',
    href: '/angelcare-360-command-center/bibliotheque/retours',
    summary: 'Retour d’exemplaire et statuts associés.',
    permission: 'bibliotheque.update',
  },
  {
    key: 'overdue',
    label: 'Retards',
    href: '/angelcare-360-command-center/bibliotheque/retards',
    summary: 'Prêts en retard et risques de restitution.',
    permission: 'bibliotheque.view',
  },
  {
    key: 'availability',
    label: 'Disponibilité',
    href: '/angelcare-360-command-center/bibliotheque/disponibilite',
    summary: 'Disponibilité réelle par livre.',
    permission: 'bibliotheque.view',
  },
  {
    key: 'audit',
    label: 'Audit bibliothèque',
    href: '/angelcare-360-command-center/bibliotheque/audit',
    summary: 'Journal des mutations et blocages.',
    permission: 'audit.view',
    badge: 'Audit',
  },
]
