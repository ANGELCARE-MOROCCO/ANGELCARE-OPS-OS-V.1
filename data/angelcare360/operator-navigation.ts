import type { Angelcare360OperatorNavigationSection } from '@/types/angelcare360/operator'

export const ANGELCARE360_OPERATOR_NAVIGATION: Angelcare360OperatorNavigationSection[] = [
  {
    group: 'Pilotage SaaS',
    label: 'Pilotage SaaS',
    summary: 'Vue d’ensemble, santé clients, service et audit interne du portefeuille.',
    items: [
      { key: 'overview', label: 'Vue d’ensemble', href: '/angelcare-360-operator', summary: 'Cockpit opérationnel principal.' },
      { key: 'health', label: 'Santé clients', href: '/angelcare-360-operator/customer-health', summary: 'Score indicatif et facteurs de risque.' },
      { key: 'service', label: 'Alertes service', href: '/angelcare-360-operator/service-operations', summary: 'Incidents, demandes et tâches internes.' },
      { key: 'audit', label: 'Audit', href: '/angelcare-360-operator/audit', summary: 'Journal interne horodaté.' },
    ],
  },
  {
    group: 'Clients & tenants',
    label: 'Clients & tenants',
    summary: 'Dossiers clients, comptes SaaS et état des accès.',
    items: [
      { key: 'clients', label: 'Clients écoles/crèches', href: '/angelcare-360-operator/clients', summary: 'Compte commercial et source de vérité client.' },
      { key: 'tenants', label: 'Tenants', href: '/angelcare-360-operator/tenants', summary: 'Espaces client et mise en service.' },
      { key: 'access', label: 'Accès client', href: '/angelcare-360-operator/client-access', summary: 'Disponibilité et liens d’accès.' },
    ],
  },
  {
    group: 'Offre & monétisation',
    label: 'Offre & monétisation',
    summary: 'Plans, packages, abonnements, modules et limites contractuelles.',
    items: [
      { key: 'plans', label: 'Plans', href: '/angelcare-360-operator/plans', summary: 'Offres commerciales et tarification MAD.' },
      { key: 'packages', label: 'Packages', href: '/angelcare-360-operator/packages', summary: 'Bundles modules et fonctionnalités.' },
      { key: 'subscriptions', label: 'Abonnements', href: '/angelcare-360-operator/subscriptions', summary: 'Cycle de facturation et état de souscription.' },
      { key: 'modules', label: 'Modules', href: '/angelcare-360-operator/modules', summary: 'Matrice d’activation client.' },
      { key: 'features', label: 'Feature flags', href: '/angelcare-360-operator/features', summary: 'Activation, verrouillage et configuration.' },
      { key: 'usage', label: 'Limites d’usage', href: '/angelcare-360-operator/usage-limits', summary: 'Seuils et consommation observée.' },
    ],
  },
  {
    group: 'Facturation AngelCare',
    label: 'Facturation AngelCare',
    summary: 'Comptes de facturation, factures, paiements et suivi des impayés.',
    items: [
      { key: 'billing', label: 'Cockpit facturation', href: '/angelcare-360-operator/billing', summary: 'Encours, émissions et collection.' },
      { key: 'billing-accounts', label: 'Comptes de facturation', href: '/angelcare-360-operator/billing/accounts', summary: 'Identité et coordonnées de facturation.' },
      { key: 'invoices', label: 'Factures SaaS', href: '/angelcare-360-operator/billing/invoices', summary: 'Factures clients AngelCare.' },
      { key: 'payments', label: 'Paiements clients', href: '/angelcare-360-operator/billing/payments', summary: 'Paiements manuels et rapprochement.' },
      { key: 'balances', label: 'Soldes & impayés', href: '/angelcare-360-operator/billing/balances', summary: 'Encours et risque de collection.' },
      { key: 'dunning', label: 'Relances internes', href: '/angelcare-360-operator/billing/dunning', summary: 'Suivi interne du recouvrement.' },
    ],
  },
  {
    group: 'Onboarding & réussite client',
    label: 'Onboarding & réussite client',
    summary: 'Implémentation, support, contrats, renouvellement et suivi client.',
    items: [
      { key: 'onboarding', label: 'Onboarding', href: '/angelcare-360-operator/onboarding', summary: 'Tâches d’implémentation et blocages.' },
      { key: 'implementation', label: 'Implémentation', href: '/angelcare-360-operator/implementation', summary: 'Plan de déploiement par client.' },
      { key: 'support', label: 'Support', href: '/angelcare-360-operator/support', summary: 'Tickets, triage et résolution.' },
      { key: 'contracts', label: 'Contrats', href: '/angelcare-360-operator/contracts', summary: 'Métadonnées contractuelles.' },
      { key: 'renewals', label: 'Renouvellements', href: '/angelcare-360-operator/renewals', summary: 'Pipeline de renouvellement.' },
      { key: 'health-panel', label: 'Santé client', href: '/angelcare-360-operator/customer-health', summary: 'Lecture transparente du risque.' },
    ],
  },
  {
    group: 'Service operations',
    label: 'Service operations',
    summary: 'Opérations, incidents, tâches et notes internes.',
    items: [
      { key: 'service-ops', label: 'Opérations service', href: '/angelcare-360-operator/service-operations', summary: 'Événements et actions de service.' },
      { key: 'requests', label: 'Demandes service', href: '/angelcare-360-operator/service-requests', summary: 'Assistance et configuration.' },
      { key: 'incidents', label: 'Incidents', href: '/angelcare-360-operator/incidents', summary: 'Suivi des incidents client.' },
      { key: 'tasks', label: 'Tâches', href: '/angelcare-360-operator/tasks', summary: 'Travaux internes en cours.' },
      { key: 'notes', label: 'Notes internes', href: '/angelcare-360-operator/notes', summary: 'Notes opérateur confidentielles.' },
    ],
  },
  {
    group: 'Paramètres opérateur',
    label: 'Paramètres opérateur',
    summary: 'Paramètres métier, rôles et gouvernance.',
    items: [
      { key: 'settings', label: 'Paramètres', href: '/angelcare-360-operator/settings', summary: 'Réglages internes et verrouillages.' },
      { key: 'roles', label: 'Rôles opérateur', href: '/angelcare-360-operator/operator-roles', summary: 'Rôles internes AngelCare.' },
    ],
  },
]
