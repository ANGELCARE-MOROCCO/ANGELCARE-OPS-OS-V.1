import type { Angelcare360OperatorNavigationSection } from '@/types/angelcare360/operator'

export type SovereignTowerKey = 'direction' | 'growth' | 'tenants' | 'revenue' | 'service' | 'platform'

export type SovereignTowerDefinition = {
  key: SovereignTowerKey
  index: string
  label: string
  shortLabel: string
  href: string
  summary: string
  signal: string
  accent: string
  accentDeep: string
  navigation: Array<{ label: string; href: string; match?: string[] }>
}

export const SOVEREIGN_TOWERS: SovereignTowerDefinition[] = [
  {
    key: 'direction', index: '01', label: 'Direction, Stratégie & Expansion', shortLabel: 'Direction Générale',
    href: '/angelcare-360-operator/direction',
    summary: 'Commandement exécutif, Board, scénarios, décisions, performance et expansion mondiale.',
    signal: 'Décisions & horizon', accent: '#dc2626', accentDeep: '#7f1d1d',
    navigation: [
      { label: 'Commandement', href: '/angelcare-360-operator/direction' },
      { label: 'Board', href: '/angelcare-360-operator/executive/board' },
      { label: 'Performance', href: '/angelcare-360-operator/executive' },
      { label: 'Scénarios', href: '/angelcare-360-operator/direction?view=scenarios' },
      { label: 'Décisions', href: '/angelcare-360-operator/executive/decisions' },
      { label: 'Risques', href: '/angelcare-360-operator/executive/customers' },
      { label: 'Horizon', href: '/angelcare-360-operator/executive/horizon' },
      { label: 'Responsabilité', href: '/angelcare-360-operator/executive/accountability' },
    ],
  },
  {
    key: 'growth', index: '02', label: 'Croissance, Commerce & Portefeuille', shortLabel: 'Clients & Croissance',
    href: '/angelcare-360-operator/growth',
    summary: 'Marchés, acquisition, comptes stratégiques, contrats, renouvellements, expansion et rétention.',
    signal: 'Pipeline & valeur client', accent: '#4f46e5', accentDeep: '#312e81',
    navigation: [
      { label: 'Revenue Command', href: '/angelcare-360-operator/growth?view=command' },
      { label: 'Marchés & comptes', href: '/angelcare-360-operator/growth?view=markets' },
      { label: 'Pipeline & deals', href: '/angelcare-360-operator/growth?view=pipeline' },
      { label: 'Offres & négociation', href: '/angelcare-360-operator/growth?view=offers' },
      { label: 'Contrats & activation', href: '/angelcare-360-operator/growth?view=contracts' },
      { label: 'Portefeuille clients', href: '/angelcare-360-operator/growth?view=portfolio' },
      { label: 'Rétention & recovery', href: '/angelcare-360-operator/growth?view=health' },
      { label: 'Performance revenu', href: '/angelcare-360-operator/growth?view=performance' },
    ],
  },
  {
    key: 'tenants', index: '03', label: 'Tenants, Produit & Infrastructure', shortLabel: 'Tenants & Produit',
    href: '/angelcare-360-operator/tenants-product',
    summary: 'Digital twins, provisioning, modules, entitlements, usage, capacité, accès, versions et intégrations.',
    signal: 'Flotte & capacité', accent: '#0891b2', accentDeep: '#164e63',
    navigation: [
      { label: 'Catalogue vivant', href: '/angelcare-360-operator/tenants-product?view=catalogue' },
      { label: 'Module Factory', href: '/angelcare-360-operator/tenants-product?view=modules' },
      { label: 'Feature Lab', href: '/angelcare-360-operator/tenants-product?view=features' },
      { label: 'Add-ons', href: '/angelcare-360-operator/tenants-product?view=addons' },
      { label: 'Capacités & Top-ups', href: '/angelcare-360-operator/tenants-product?view=meters' },
      { label: 'Package Composer', href: '/angelcare-360-operator/tenants-product?view=packages' },
      { label: 'Tarification', href: '/angelcare-360-operator/tenants-product?view=pricing' },
      { label: 'Compatibilité', href: '/angelcare-360-operator/tenants-product?view=compatibility' },
      { label: 'Déploiements tenants', href: '/angelcare-360-operator/tenants-product?view=deployments' },
      { label: 'Scanner & Diagnostic', href: '/angelcare-360-operator/tenants-product?view=scanner' },
      { label: 'Versions', href: '/angelcare-360-operator/tenants-product?view=versions' },
    ],
  },
  {
    key: 'revenue', index: '04', label: 'Revenus, Contrats & Rentabilité', shortLabel: 'Revenus & Contrats',
    href: '/angelcare-360-operator/revenue',
    summary: 'Pricing, subscriptions, facturation, cash, recouvrement, prévision, rentabilité et exceptions.',
    signal: 'Cash & exposition', accent: '#059669', accentDeep: '#064e3b',
    navigation: [
      { label: 'Revenue Command', href: '/angelcare-360-operator/revenue?view=command' },
      { label: 'Pricing Authority', href: '/angelcare-360-operator/revenue?view=pricing' },
      { label: 'Contract Authority', href: '/angelcare-360-operator/revenue?view=contracts' },
      { label: 'Subscription Economics', href: '/angelcare-360-operator/revenue?view=subscriptions' },
      { label: 'Billing Production', href: '/angelcare-360-operator/revenue?view=billing' },
      { label: 'Cash & Reconciliation', href: '/angelcare-360-operator/revenue?view=cash' },
      { label: 'Collections & Exposure', href: '/angelcare-360-operator/revenue?view=collections' },
      { label: 'Forecast & Profitability', href: '/angelcare-360-operator/revenue?view=forecast' },
    ],
  },
  {
    key: 'service', index: '05', label: 'Déploiement, Expérience & Service', shortLabel: 'Déploiement & Service',
    href: '/angelcare-360-operator/service',
    summary: 'Activation, onboarding, implémentation, adoption, support, SLA, incidents, qualité et communication.',
    signal: 'SLA & missions client', accent: '#0284c7', accentDeep: '#0c4a6e',
    navigation: [
      { label: 'Service Command', href: '/angelcare-360-operator/service?view=command' },
      { label: 'Activation & Go-Live', href: '/angelcare-360-operator/service?view=activation' },
      { label: 'Implementation Factory', href: '/angelcare-360-operator/service?view=implementation' },
      { label: 'Adoption & Value', href: '/angelcare-360-operator/service?view=adoption' },
      { label: 'Support Operations', href: '/angelcare-360-operator/service?view=support' },
      { label: 'Incidents & SLA', href: '/angelcare-360-operator/service?view=incidents' },
      { label: 'Field Service', href: '/angelcare-360-operator/service?view=field' },
      { label: 'Quality & Experience', href: '/angelcare-360-operator/service?view=quality' },
    ],
  },
  {
    key: 'platform', index: '06', label: 'Plateforme, Confiance & Gouvernance', shortLabel: 'Plateforme & Contrôle',
    href: '/angelcare-360-operator/platform',
    summary: 'Product industrialization, sellables, packages, entitlement compilation, population, capacity, runtime, economics and policy.',
    signal: 'Product fabric & runtime truth', accent: '#334155', accentDeep: '#0f172a',
    navigation: [
      { label: 'Platform Command', href: '/angelcare-360-operator/platform?view=command' },
      { label: 'Product Architecture', href: '/angelcare-360-operator/platform?view=architecture' },
      { label: 'Sellable Engineering', href: '/angelcare-360-operator/platform?view=commercialization' },
      { label: 'Package Governance', href: '/angelcare-360-operator/platform?view=packages' },
      { label: 'Entitlement Compiler', href: '/angelcare-360-operator/platform?view=entitlements' },
      { label: 'Population & Capacity', href: '/angelcare-360-operator/platform?view=population' },
      { label: 'Runtime & Release', href: '/angelcare-360-operator/platform?view=runtime' },
      { label: 'Economics & Policy', href: '/angelcare-360-operator/platform?view=governance' },
      { label: 'Ten-Year Autonomy Kernel', href: '/angelcare-360-operator/platform/autonomy-kernel' },

    ],
  },
]

export const ANGELCARE360_OPERATOR_NAVIGATION: Angelcare360OperatorNavigationSection[] = [
  {
    group: 'Sovereign Operator OS',
    label: 'Six univers souverains',
    summary: 'Six responsabilités exécutives couvrant toute la machine SaaS AngelCare.',
    items: SOVEREIGN_TOWERS.map((tower) => ({
      key: tower.key,
      label: tower.shortLabel,
      href: tower.href,
      summary: tower.summary,
      badge: tower.index,
    })),
  },
]

export function resolveSovereignTower(pathname: string): SovereignTowerDefinition {
  const direct = SOVEREIGN_TOWERS.find((tower) => pathname === tower.href || pathname.startsWith(`${tower.href}/`))
  if (direct) return direct
  if (/\/executive(?:\/|$)/.test(pathname)) return SOVEREIGN_TOWERS[0]
  if (/\/(clients|contracts|renewals|customer-health)(?:\/|$)/.test(pathname)) return SOVEREIGN_TOWERS[1]
  if (/\/(tenants|plans|packages|subscriptions|modules|features|usage-limits|client-access)(?:\/|$)/.test(pathname)) return SOVEREIGN_TOWERS[2]
  if (/\/billing(?:\/|$)/.test(pathname)) return SOVEREIGN_TOWERS[3]
  if (/\/(onboarding|implementation|support|service-operations|service-requests|incidents|tasks|notes)(?:\/|$)/.test(pathname)) return SOVEREIGN_TOWERS[4]
  if (/\/(audit|settings|operator-roles|email-command|brand-governance)(?:\/|$)/.test(pathname)) return SOVEREIGN_TOWERS[5]
  return SOVEREIGN_TOWERS[0]
}
