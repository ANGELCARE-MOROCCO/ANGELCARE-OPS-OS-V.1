import type { RevenueTwinSectionDefinition } from '../types'

export const REVENUE_TWIN_RELEASE_CODE = 'AC-REVENUE-OS-MZ02-DIGITAL-TWIN'
export const REVENUE_TWIN_MODULE_VERSION = '2.0.0-phase2'
export const REVENUE_TWIN_MODEL_VERSION = 'AC-REVENUE-TWIN-2026.07-V1'

export const REVENUE_TWIN_SECTIONS: RevenueTwinSectionDefinition[] = [
  { key: 'overview', label: 'Vue d’ensemble', description: 'Lecture exécutive du modèle commercial, de sa complétude et des points qui bloquent les futures stratégies.', href: '/revenue-command-os/digital-twin', icon: 'Gauge', status: 'ready' },
  { key: 'business-units', label: 'Unités commerciales', description: 'Architecture des lignes de revenus AngelCare, de leur rôle et de leur priorité commerciale.', href: '/revenue-command-os/digital-twin/business-units', icon: 'Building2', status: 'ready' },
  { key: 'offers-services', label: 'Offres & services', description: 'Dossiers commerciaux structurés: problème client, valeur, format, disponibilité et exigences de livraison.', href: '/revenue-command-os/digital-twin/offers-services', icon: 'Boxes', status: 'ready' },
  { key: 'bundles-combinations', label: 'Bundles & combinaisons', description: 'Combinaisons autorisées, prérequis, offres d’entrée, premium et rétention.', href: '/revenue-command-os/digital-twin/bundles-combinations', icon: 'PackagePlus', status: 'ready' },
  { key: 'customer-segments', label: 'Segments clients', description: 'Profils acheteurs, douleurs, déclencheurs, objections, potentiel et adéquation offre-marché.', href: '/revenue-command-os/digital-twin/customer-segments', icon: 'UsersRound', status: 'ready' },
  { key: 'decision-makers', label: 'Décideurs', description: 'Autorité, motivations, preuves attendues et stratégie de contact par rôle acheteur.', href: '/revenue-command-os/digital-twin/decision-makers', icon: 'UserRoundCog', status: 'ready' },
  { key: 'markets-territories', label: 'Marchés & territoires', description: 'Zones où AngelCare peut promouvoir, vendre et livrer chaque offre sans surpromesse.', href: '/revenue-command-os/digital-twin/markets-territories', icon: 'MapPinned', status: 'ready' },
  { key: 'channels-journeys', label: 'Canaux & parcours', description: 'Canaux d’acquisition et parcours machine-readable du premier signal jusqu’au renouvellement.', href: '/revenue-command-os/digital-twin/channels-journeys', icon: 'Route', status: 'ready' },
  { key: 'pricing-margins', label: 'Prix & marges', description: 'Prix publics, partenaires, coûts, seuils protégés et autorités de remise.', href: '/revenue-command-os/digital-twin/pricing-margins', icon: 'BadgeDollarSign', status: 'needs-attention' },
  { key: 'capacity-constraints', label: 'Capacités & contraintes', description: 'Capacités commerciales et de livraison qui définissent ce que le moteur pourra vendre sans risque.', href: '/revenue-command-os/digital-twin/capacity-constraints', icon: 'SlidersHorizontal', status: 'needs-attention' },
  { key: 'seasonality', label: 'Saisonnalité', description: 'Fenêtres marché, délais de préparation et coût commercial du retard.', href: '/revenue-command-os/digital-twin/seasonality', icon: 'CalendarRange', status: 'ready' },
  { key: 'expansion-renewal', label: 'Expansion & renouvellement', description: 'Graphes cross-sell, upsell, renouvellement et recommandation.', href: '/revenue-command-os/digital-twin/expansion-renewal', icon: 'TrendingUp', status: 'ready' },
  { key: 'revenue-dependencies', label: 'Dépendances revenus', description: 'Gates de capacité, paiement, approbation, documents, inventaire et territoire.', href: '/revenue-command-os/digital-twin/revenue-dependencies', icon: 'GitBranch', status: 'ready' },
  { key: 'model-validation', label: 'Validation du modèle', description: 'Contradictions, données absentes, risques de survente et actions de correction.', href: '/revenue-command-os/digital-twin/model-validation', icon: 'ShieldCheck', status: 'needs-attention' },
]

export const REVENUE_TWIN_ENTITY_TABLES = {
  'business-unit': 'revenue_os_business_units',
  offer: 'revenue_os_offers',
  bundle: 'revenue_os_offer_bundles',
  'offer-relationship': 'revenue_os_offer_relationships',
  segment: 'revenue_os_customer_segments',
  'decision-maker': 'revenue_os_decision_maker_profiles',
  market: 'revenue_os_markets',
  channel: 'revenue_os_sales_channels',
  journey: 'revenue_os_sales_journeys',
  'price-rule': 'revenue_os_offer_prices',
  capacity: 'revenue_os_capacity_types',
  'seasonal-window': 'revenue_os_seasonal_windows',
  'growth-path': 'revenue_os_growth_paths',
  dependency: 'revenue_os_revenue_dependencies',
} as const
