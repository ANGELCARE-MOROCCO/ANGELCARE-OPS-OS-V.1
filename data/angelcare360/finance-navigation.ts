export type Angelcare360FinanceNavigationItem = {
  key: string
  label: string
  href: string
  summary: string
  badge?: string
}

export const ANGELCARE360_FINANCE_NAVIGATION: Angelcare360FinanceNavigationItem[] = [
  {
    key: 'overview',
    label: 'Vue d’ensemble',
    href: '/angelcare-360-command-center/finance',
    summary: 'Cockpit de finance scolaire, risques et actions clés.',
    badge: 'Actif',
  },
  {
    key: 'fees',
    label: 'Frais scolaires',
    href: '/angelcare-360-command-center/finance/frais',
    summary: 'Structures tarifaires, articles et édition de référence.',
  },
  {
    key: 'assignments',
    label: 'Affectations frais',
    href: '/angelcare-360-command-center/finance/affectations-frais',
    summary: 'Affectation des frais aux élèves, classes et sections.',
  },
  {
    key: 'invoices',
    label: 'Factures',
    href: '/angelcare-360-command-center/finance/factures',
    summary: 'Brouillons, émission, annulation et lignes de facture.',
  },
  {
    key: 'payments',
    label: 'Paiements',
    href: '/angelcare-360-command-center/finance/paiements',
    summary: 'Saisie, confirmation, rejet et allocation des paiements.',
  },
  {
    key: 'receipts',
    label: 'Reçus',
    href: '/angelcare-360-command-center/finance/recus',
    summary: 'Reçus liés aux paiements confirmés et verrouillage export.',
  },
  {
    key: 'discounts',
    label: 'Remises',
    href: '/angelcare-360-command-center/finance/remises',
    summary: 'Demandes, approbation et application des remises.',
  },
  {
    key: 'reminders',
    label: 'Relances',
    href: '/angelcare-360-command-center/finance/relances',
    summary: 'Relances planifiées ou bloquées selon le canal disponible.',
  },
  {
    key: 'balances',
    label: 'Soldes élèves',
    href: '/angelcare-360-command-center/finance/soldes-eleves',
    summary: 'Soldes, historique de créances et navigation dossier.',
  },
  {
    key: 'statements',
    label: 'États de compte',
    href: '/angelcare-360-command-center/finance/etats-compte',
    summary: 'Relevés de compte et mouvements financiers.',
  },
  {
    key: 'expenses',
    label: 'Dépenses',
    href: '/angelcare-360-command-center/finance/depenses',
    summary: 'Dépenses opérationnelles si le socle le permet.',
  },
  {
    key: 'audit',
    label: 'Audit finance',
    href: '/angelcare-360-command-center/finance/audit',
    summary: 'Journal des mutations et événements sensibles.',
    badge: 'Audit',
  },
]
