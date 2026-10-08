import type { CatalogLocale, StorefrontKey } from '../catalog-discovery/types'
import { PUBLIC_EXPERIENCE_STOREFRONTS } from './registry'

const STOREFRONT_LABELS: Record<CatalogLocale, Record<StorefrontKey, string>> = {
  fr: {
    families: 'Familles',
    'home-services': 'Services à domicile',
    development: 'Développement',
    kits: 'Kits',
    academy: 'Academy',
    establishments: 'Établissements',
    hospitality: 'Hospitality',
    'health-partners': 'Partenaires santé',
    corporates: 'Entreprises',
    'partner-os': 'Partner OS',
    'quality-check': 'Quality Check',
    professionals: 'Professionnels',
  },
  en: {
    families: 'Families',
    'home-services': 'Home Services',
    development: 'Development',
    kits: 'Kits',
    academy: 'Academy',
    establishments: 'Establishments',
    hospitality: 'Hospitality',
    'health-partners': 'Health Partners',
    corporates: 'Corporate',
    'partner-os': 'Partner OS',
    'quality-check': 'Quality Check',
    professionals: 'Professionals',
  },
  ar: {
    families: 'العائلات',
    'home-services': 'الخدمات المنزلية',
    development: 'التطور',
    kits: 'المجموعات',
    academy: 'الأكاديمية',
    establishments: 'المؤسسات',
    hospitality: 'الضيافة',
    'health-partners': 'شركاء الصحة',
    corporates: 'الشركات',
    'partner-os': 'Partner OS',
    'quality-check': 'Quality Check',
    professionals: 'المحترفون',
  },
}

export interface PublicStorefrontNavigationItem {
  key: StorefrontKey
  label: string
  href: string
  accent: 'pink' | 'blue' | 'violet' | 'cyan' | 'amber' | 'emerald'
}

export function getPublicStorefrontNavigation(locale: CatalogLocale): PublicStorefrontNavigationItem[] {
  const items = PUBLIC_EXPERIENCE_STOREFRONTS.map((profile) => ({
    key: profile.key,
    label: STOREFRONT_LABELS[locale][profile.key],
    href: profile.route.replace(':locale', locale),
    accent: profile.accent,
  }))
  if (items.length !== 12) throw new Error(`Storefront navigation expects 12 atomic storefronts, received ${items.length}.`)
  return items
}
