export type Angelcare360PayrollNavigationItem = {
  key: string
  label: string
  href: string
  summary: string
  permission: string
  badge?: string
}

export const ANGELCARE360_PAYROLL_NAVIGATION: Angelcare360PayrollNavigationItem[] = [
  {
    key: 'overview',
    label: 'Vue d’ensemble',
    href: '/angelcare-360-command-center/paie',
    summary: 'Cockpit paie, risques et préparation des validations.',
    permission: 'paie.view',
    badge: 'Hub',
  },
  {
    key: 'periods',
    label: 'Périodes de paie',
    href: '/angelcare-360-command-center/paie/periodes',
    summary: 'Périodes ouvertes, calculées, validées ou clôturées.',
    permission: 'paie.view',
  },
  {
    key: 'records',
    label: 'Dossiers de paie',
    href: '/angelcare-360-command-center/paie/dossiers',
    summary: 'Dossiers de paie, base salariale et statuts internes.',
    permission: 'paie.view',
  },
  {
    key: 'items',
    label: 'Éléments de paie',
    href: '/angelcare-360-command-center/paie/elements',
    summary: 'Base salaire, primes, retenues, avances et ajustements.',
    permission: 'paie.view',
  },
  {
    key: 'bonuses',
    label: 'Primes',
    href: '/angelcare-360-command-center/paie/primes',
    summary: 'Lignes de rémunération additionnelle.',
    permission: 'paie.view',
  },
  {
    key: 'deductions',
    label: 'Retenues',
    href: '/angelcare-360-command-center/paie/retenues',
    summary: 'Retenues et déductions sur dossiers de paie.',
    permission: 'paie.view',
  },
  {
    key: 'advances',
    label: 'Avances',
    href: '/angelcare-360-command-center/paie/avances',
    summary: 'Avances de paie suivies côté serveur.',
    permission: 'paie.view',
  },
  {
    key: 'adjustments',
    label: 'Ajustements',
    href: '/angelcare-360-command-center/paie/ajustements',
    summary: 'Ajustements positifs ou négatifs contrôlés.',
    permission: 'paie.view',
  },
  {
    key: 'reimbursements',
    label: 'Remboursements',
    href: '/angelcare-360-command-center/paie/remboursements',
    summary: 'Remboursements liés à la paie préparée.',
    permission: 'paie.view',
  },
  {
    key: 'validation',
    label: 'Validation',
    href: '/angelcare-360-command-center/paie/validation',
    summary: 'Préparation, blocage et validation des dossiers.',
    permission: 'paie.approve',
  },
  {
    key: 'payments',
    label: 'Paiements',
    href: '/angelcare-360-command-center/paie/paiements',
    summary: 'Suivi des confirmations de paiement internes.',
    permission: 'paie.update',
  },
  {
    key: 'history',
    label: 'Historique personnel',
    href: '/angelcare-360-command-center/paie/historique-personnel',
    summary: 'Historique de paie par membre du personnel.',
    permission: 'paie.view',
  },
  {
    key: 'compliance',
    label: 'Conformité',
    href: '/angelcare-360-command-center/paie/conformite',
    summary: 'Règles sociales, fiscales et export verrouillés.',
    permission: 'paie.view',
  },
  {
    key: 'audit',
    label: 'Audit paie',
    href: '/angelcare-360-command-center/paie/audit',
    summary: 'Journal des mutations et blocages de paie.',
    permission: 'audit.view',
    badge: 'Audit',
  },
]
