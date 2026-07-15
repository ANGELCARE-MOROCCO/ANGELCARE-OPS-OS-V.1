import type { Angelcare360ModuleNavigationItem } from '@/types/angelcare360/module'

export type Angelcare360ReportsNavigationItem = Angelcare360ModuleNavigationItem

export const ANGELCARE360_REPORTS_NAVIGATION: Angelcare360ReportsNavigationItem[] = [
  {
    key: 'overview',
    label: 'Vue d’ensemble',
    href: '/angelcare-360-command-center/rapports',
    summary: 'Cockpit rapports, risques et capacités verrouillées.',
    permission: 'rapports.view',
    badge: 'Centre',
  },
  {
    key: 'catalogue',
    label: 'Catalogue',
    href: '/angelcare-360-command-center/rapports/catalogue',
    summary: 'Référentiel des rapports par domaine.',
    permission: 'rapports.view',
  },
  {
    key: 'modeles',
    label: 'Modèles',
    href: '/angelcare-360-command-center/rapports/modeles',
    summary: 'Modèles de rapport et gouvernance.',
    permission: 'rapports.view',
  },
  {
    key: 'demandes',
    label: 'Demandes',
    href: '/angelcare-360-command-center/rapports/demandes',
    summary: 'Demandes de génération de rapports.',
    permission: 'rapports.view',
  },
  {
    key: 'historique',
    label: 'Historique',
    href: '/angelcare-360-command-center/rapports/historique',
    summary: 'Historique des demandes et des exports liés.',
    permission: 'rapports.view',
  },
  {
    key: 'audit',
    label: 'Audit rapports',
    href: '/angelcare-360-command-center/rapports/audit',
    summary: 'Journal des opérations et blocages de reporting.',
    permission: 'audit.view',
    badge: 'Audit',
  },
]
