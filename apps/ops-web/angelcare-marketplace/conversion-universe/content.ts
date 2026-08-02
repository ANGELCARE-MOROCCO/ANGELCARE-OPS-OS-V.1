import type { CatalogLocale, DiscoveryItem } from '../catalog-discovery/types'
import type { ConversionJourney } from './types'

const copy = {
  fr: {
    secure: 'Parcours sécurisé ANGELCARE',
    territory: 'Territoire',
    identity: 'Identité',
    configuration: 'Configuration',
    availability: 'Disponibilité',
    consent: 'Consentements',
    review: 'Vérification',
    confirmation: 'Confirmation',
    continue: 'Continuer',
    back: 'Retour',
    save: 'Enregistrer et continuer',
    confirm: 'Confirmer la demande',
    quote: 'Prix confirmé après qualification',
    noPrice: 'Aucun prix ne sera inventé. Une proposition gouvernée sera préparée.',
    evidence: 'Preuves commerciales et opérationnelles',
    expiry: 'La disponibilité et le prix sont revérifiés avant confirmation.',
  },
  en: {
    secure: 'Secure ANGELCARE journey',
    territory: 'Territory',
    identity: 'Identity',
    configuration: 'Configuration',
    availability: 'Availability',
    consent: 'Consents',
    review: 'Review',
    confirmation: 'Confirmation',
    continue: 'Continue',
    back: 'Back',
    save: 'Save and continue',
    confirm: 'Confirm request',
    quote: 'Price confirmed after qualification',
    noPrice: 'No price will be invented. A governed proposal will be prepared.',
    evidence: 'Commercial and operational evidence',
    expiry: 'Availability and pricing are revalidated before confirmation.',
  },
  ar: {
    secure: 'مسار ANGELCARE آمن',
    territory: 'النطاق',
    identity: 'الهوية',
    configuration: 'الإعداد',
    availability: 'التوفر',
    consent: 'الموافقات',
    review: 'المراجعة',
    confirmation: 'التأكيد',
    continue: 'متابعة',
    back: 'رجوع',
    save: 'حفظ ومتابعة',
    confirm: 'تأكيد الطلب',
    quote: 'يتم تأكيد السعر بعد التأهيل',
    noPrice: 'لن يتم اختراع أي سعر. سيتم إعداد عرض محكوم.',
    evidence: 'الأدلة التجارية والتشغيلية',
    expiry: 'تتم إعادة التحقق من التوفر والسعر قبل التأكيد.',
  },
} as const

export function conversionCopy(locale: CatalogLocale) {
  return copy[locale]
}

export function journeyForItem(item: Pick<DiscoveryItem, 'kind' | 'price_mode' | 'category_key'>): ConversionJourney {
  if (item.kind === 'training') return 'academy_enrollment'
  if (item.kind === 'product' || item.kind === 'kit') return 'product_checkout'
  if (item.kind === 'saas_module' || item.category_key === 'partner-os') return 'partner_subscription'
  if (item.kind === 'audit' || item.category_key === 'quality-check') return 'quality_assessment'
  if (['establishments', 'hospitality', 'health-partners', 'corporates'].includes(item.category_key || '')) return 'b2b_quotation'
  return 'service_booking'
}

export function journeyPath(locale: CatalogLocale, item: Pick<DiscoveryItem, 'slug' | 'kind' | 'price_mode' | 'category_key'>) {
  const journey = journeyForItem(item)
  switch (journey) {
    case 'service_booking':
      return `/angelcare-marketplace/${locale}/booking/${item.slug}`
    case 'academy_enrollment':
      return `/angelcare-marketplace/${locale}/enrollment/${item.slug}`
    case 'partner_subscription':
      return `/angelcare-marketplace/${locale}/subscription/${item.slug}`
    case 'quality_assessment':
    case 'b2b_quotation':
      return `/angelcare-marketplace/${locale}/quotation/${item.slug}`
    case 'product_checkout':
      return `/angelcare-marketplace/${locale}/basket?item=${encodeURIComponent(item.slug)}`
  }
}

export function journeyLabel(journey: ConversionJourney, locale: CatalogLocale) {
  const labels: Record<ConversionJourney, Record<CatalogLocale, string>> = {
    service_booking: { fr: 'Réserver un service', en: 'Book a service', ar: 'حجز خدمة' },
    product_checkout: { fr: 'Commander', en: 'Order', ar: 'طلب' },
    academy_enrollment: { fr: 'S’inscrire', en: 'Enroll', ar: 'التسجيل' },
    b2b_quotation: { fr: 'Configurer une proposition', en: 'Configure a proposal', ar: 'إعداد عرض' },
    partner_subscription: { fr: 'Configurer Partner OS', en: 'Configure Partner OS', ar: 'إعداد Partner OS' },
    quality_assessment: { fr: 'Demander une évaluation', en: 'Request an assessment', ar: 'طلب تقييم' },
  }
  return labels[journey][locale]
}
