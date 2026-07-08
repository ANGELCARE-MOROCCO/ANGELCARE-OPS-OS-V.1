import type { Angelcare360ModuleNavigationItem } from '@/types/angelcare360/module'

export type Angelcare360ExportsNavigationItem = Angelcare360ModuleNavigationItem

export const ANGELCARE360_EXPORTS_NAVIGATION: Angelcare360ExportsNavigationItem[] = [
  {
    key: 'overview',
    label: 'Vue d’ensemble',
    href: '/angelcare-360-command-center/exports',
    summary: 'Cockpit exports, PDF/A4 et fichiers verrouillés.',
    permission: 'exports.view',
    badge: 'Centre',
  },
  {
    key: 'files',
    label: 'Fichiers',
    href: '/angelcare-360-command-center/exports/files',
    summary: 'Fichiers réels d’export et état de préparation.',
    permission: 'exports.view',
  },
  {
    key: 'pdf-a4',
    label: 'PDF A4',
    href: '/angelcare-360-command-center/exports/pdf-a4',
    summary: 'Préparation PDF/A4 verrouillée.',
    permission: 'exports.view',
  },
  {
    key: 'csv-xlsx',
    label: 'CSV / XLSX',
    href: '/angelcare-360-command-center/exports/csv-xlsx',
    summary: 'Préparation CSV/XLSX verrouillée.',
    permission: 'exports.view',
  },
  {
    key: 'historique',
    label: 'Historique',
    href: '/angelcare-360-command-center/exports/historique',
    summary: 'Historique des exports et fichiers réels.',
    permission: 'exports.view',
  },
  {
    key: 'audit',
    label: 'Audit exports',
    href: '/angelcare-360-command-center/exports/audit',
    summary: 'Journal des blocages et opérations de sortie.',
    permission: 'audit.view',
    badge: 'Audit',
  },
]
