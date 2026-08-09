import type {
  TerritoryGateRequirement,
  TerritoryHealthStatus,
  TerritoryStatus,
} from './types'

export const TERRITORY_BASE_ROUTE = '/angelcare-marketplace/admin/territories'
export const TERRITORY_API_ROUTE = '/api/angelcare-marketplace/territories'

export const TERRITORY_STATUS_TRANSITIONS: Record<TerritoryStatus, TerritoryStatus[]> = {
  draft: ['configuring', 'archived'],
  configuring: ['review', 'archived'],
  review: ['configuring', 'soft_launch', 'live', 'archived'],
  soft_launch: ['configuring', 'live', 'paused'],
  live: ['paused'],
  paused: ['soft_launch', 'live', 'archived'],
  archived: [],
}

export const TERRITORY_STATUS_LABELS: Record<TerritoryStatus, string> = {
  draft: 'Brouillon',
  configuring: 'Configuration',
  review: 'En revue',
  soft_launch: 'Soft launch',
  live: 'En service',
  paused: 'Suspendu',
  archived: 'Archivé',
}

export const TERRITORY_HEALTH_LABELS: Record<TerritoryHealthStatus, string> = {
  healthy: 'Sain',
  attention_required: 'Attention requise',
  at_risk: 'À risque',
  critical: 'Critique',
  paused: 'Suspendu',
  unknown: 'À établir',
}

export interface LaunchGateDefinition {
  key: string
  group: string
  title: string
  description: string
  requirement: TerritoryGateRequirement
  weight: number
  ownerRole: string
  sortOrder: number
  nextAction: string
}

export const TERRITORY_LAUNCH_GATES: LaunchGateDefinition[] = [
  {
    key: 'localization.complete', group: 'Localisation', title: 'Localisation complète',
    description: 'Les langues actives, le contenu sensible et les parcours prioritaires sont validés.',
    requirement: 'mandatory_blocking', weight: 10, ownerRole: 'marketplace_localization_manager', sortOrder: 10,
    nextAction: 'Valider les langues actives et documenter les contenus manquants.',
  },
  {
    key: 'legal.pages.approved', group: 'Juridique', title: 'Pages juridiques approuvées',
    description: 'Les conditions, politiques et mentions territoriales ont un propriétaire et une approbation.',
    requirement: 'mandatory_blocking', weight: 10, ownerRole: 'marketplace_security', sortOrder: 20,
    nextAction: 'Joindre la preuve de revue juridique et la version applicable.',
  },
  {
    key: 'trust.center.approved', group: 'Confiance', title: 'Trust Center approuvé',
    description: 'Les preuves de confiance, limites de service et voies de plainte sont validées.',
    requirement: 'mandatory_blocking', weight: 10, ownerRole: 'marketplace_security', sortOrder: 30,
    nextAction: 'Faire approuver les preuves et les limites de confiance.',
  },
  {
    key: 'catalog.ready', group: 'Catalogue', title: 'Catalogue prêt',
    description: 'La disponibilité territoriale du catalogue est définie sans promesse non opérable.',
    requirement: 'mandatory_blocking', weight: 10, ownerRole: 'marketplace_manager', sortOrder: 40,
    nextAction: 'Définir le catalogue disponible et les indisponibilités explicites.',
  },
  {
    key: 'price_book.ready', group: 'Finance', title: 'Price book prêt',
    description: 'La devise, le mode devis et les règles de prix sont alignés pour le territoire.',
    requirement: 'mandatory_blocking', weight: 10, ownerRole: 'marketplace_finance_reviewer', sortOrder: 50,
    nextAction: 'Configurer et faire réviser les règles de prix territoriales.',
  },
  {
    key: 'operations.zones.ready', group: 'Opérations', title: 'Zones opérationnelles prêtes',
    description: 'Les villes, zones, limites de couverture et responsables opérationnels sont explicites.',
    requirement: 'mandatory_blocking', weight: 10, ownerRole: 'marketplace_manager', sortOrder: 60,
    nextAction: 'Confirmer les zones réellement opérables et les limites de couverture.',
  },
  {
    key: 'support.route.ready', group: 'Support', title: 'Route de support prête',
    description: 'Les contacts public, opérationnel et escalade sont actifs et vérifiés.',
    requirement: 'mandatory_blocking', weight: 10, ownerRole: 'marketplace_manager', sortOrder: 70,
    nextAction: 'Valider les contacts et l’escalade du territoire.',
  },
  {
    key: 'analytics.active', group: 'Analytics', title: 'Analytics actifs',
    description: 'Les événements et indicateurs territoriaux peuvent être distingués et suivis.',
    requirement: 'mandatory_non_blocking', weight: 7, ownerRole: 'marketplace_admin', sortOrder: 80,
    nextAction: 'Activer la mesure territoriale et documenter les limitations.',
  },
  {
    key: 'security.reviewed', group: 'Sécurité', title: 'Sécurité révisée',
    description: 'Les permissions, portées et tests négatifs inter-territoires sont acceptés.',
    requirement: 'mandatory_blocking', weight: 10, ownerRole: 'marketplace_security', sortOrder: 90,
    nextAction: 'Exécuter les tests d’accès autorisé et refusé par territoire.',
  },
  {
    key: 'backup.monitoring.prepared', group: 'Continuité', title: 'Backup et monitoring préparés',
    description: 'Les alertes, responsables et procédures de reprise sont identifiés.',
    requirement: 'mandatory_non_blocking', weight: 6, ownerRole: 'marketplace_security', sortOrder: 100,
    nextAction: 'Joindre les responsables de surveillance et la preuve de reprise.',
  },
  {
    key: 'executive.approval.recorded', group: 'Direction', title: 'Approbation exécutive enregistrée',
    description: 'La décision de lancement est enregistrée avec score, risques et commentaires.',
    requirement: 'mandatory_blocking', weight: 7, ownerRole: 'marketplace_executive', sortOrder: 110,
    nextAction: 'Soumettre le dossier final à la Direction.',
  },
]

export const SOFT_LAUNCH_REQUIRED_GATES = new Set([
  'legal.pages.approved',
  'operations.zones.ready',
  'support.route.ready',
  'security.reviewed',
  'backup.monitoring.prepared',
])

export const TERRITORY_SETTING_DEFINITIONS = [
  ['identity.display_name', 'Identité', 'Nom public du territoire', 'Nom affiché dans les interfaces territorialisées.'],
  ['localization.active_locales', 'Localisation', 'Langues actives', 'Langues autorisées dans ce territoire.'],
  ['localization.default_locale', 'Localisation', 'Langue par défaut', 'Langue de résolution initiale.'],
  ['finance.currency_label', 'Finance', 'Libellé devise', 'Libellé commercial affiché, par exemple Dh.'],
  ['operations.timezone', 'Opérations', 'Fuseau horaire', 'Fuseau utilisé pour les dates opérationnelles.'],
  ['catalog.availability_mode', 'Catalogue', 'Mode de disponibilité', 'Mode de disponibilité du catalogue territorial.'],
  ['pricing.mode', 'Finance', 'Mode de tarification', 'Prix visible, devis uniquement ou mode hybride.'],
  ['support.public_contact', 'Support', 'Contact public', 'Contact affiché aux utilisateurs publics.'],
  ['support.escalation_contact', 'Support', 'Contact escalade', 'Contact de gestion des escalades.'],
  ['trust.legal_version', 'Confiance', 'Version juridique', 'Version des pages juridiques applicables.'],
] as const
