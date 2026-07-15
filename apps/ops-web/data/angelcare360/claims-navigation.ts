import type { Angelcare360ModuleNavigationItem } from '@/types/angelcare360/module'

export type Angelcare360ClaimsNavigationItem = Angelcare360ModuleNavigationItem

export const ANGELCARE360_CLAIMS_NAVIGATION: Angelcare360ClaimsNavigationItem[] = [
  {
    key: 'overview',
    label: 'Vue d’ensemble',
    href: '/angelcare-360-command-center/reclamations',
    summary: 'Cockpit réclamations, risques et priorités.',
    permission: 'reclamations.view',
    badge: 'Centre',
  },
  {
    key: 'tickets',
    label: 'Tickets',
    href: '/angelcare-360-command-center/reclamations/tickets',
    summary: 'Tickets, demandes et statut de traitement.',
    permission: 'reclamations.view',
  },
  {
    key: 'assignations',
    label: 'Assignations',
    href: '/angelcare-360-command-center/reclamations/assignations',
    summary: 'Tickets affectés et charge de traitement.',
    permission: 'reclamations.view',
  },
  {
    key: 'priorites',
    label: 'Priorités',
    href: '/angelcare-360-command-center/reclamations/priorites',
    summary: 'Répartition par priorité et urgence.',
    permission: 'reclamations.view',
  },
  {
    key: 'audit',
    label: 'Audit réclamations',
    href: '/angelcare-360-command-center/reclamations/audit',
    summary: 'Journal des opérations et blocages des réclamations.',
    permission: 'audit.view',
    badge: 'Audit',
  },
]
