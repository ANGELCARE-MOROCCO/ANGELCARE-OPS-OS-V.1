export type Angelcare360InventoryNavigationItem = {
  key: string
  label: string
  href: string
  summary: string
  permission: string
  badge?: string
}

export const ANGELCARE360_INVENTORY_NAVIGATION: Angelcare360InventoryNavigationItem[] = [
  {
    key: 'overview',
    label: 'Vue d’ensemble',
    href: '/angelcare-360-command-center/inventaire',
    summary: 'Cockpit inventaire, risques et actions clés.',
    permission: 'inventaire.view',
    badge: 'Centre',
  },
  {
    key: 'categories',
    label: 'Catégories',
    href: '/angelcare-360-command-center/inventaire/categories',
    summary: 'Catégories d’articles et structure de stock.',
    permission: 'inventaire.view',
  },
  {
    key: 'items',
    label: 'Articles',
    href: '/angelcare-360-command-center/inventaire/articles',
    summary: 'Articles, quantités, seuils et responsables.',
    permission: 'inventaire.view',
  },
  {
    key: 'movements',
    label: 'Mouvements',
    href: '/angelcare-360-command-center/inventaire/mouvements',
    summary: 'Entrées, sorties, ajustements et pertes.',
    permission: 'inventaire.view',
  },
  {
    key: 'low-stock',
    label: 'Stock bas',
    href: '/angelcare-360-command-center/inventaire/stock-bas',
    summary: 'Articles sous seuil ou en rupture.',
    permission: 'inventaire.view',
  },
  {
    key: 'responsibles',
    label: 'Responsables',
    href: '/angelcare-360-command-center/inventaire/responsables',
    summary: 'Répartition des articles par responsable.',
    permission: 'inventaire.view',
  },
  {
    key: 'audit',
    label: 'Audit inventaire',
    href: '/angelcare-360-command-center/inventaire/audit',
    summary: 'Journal des opérations et blocages.',
    permission: 'audit.view',
    badge: 'Audit',
  },
]
