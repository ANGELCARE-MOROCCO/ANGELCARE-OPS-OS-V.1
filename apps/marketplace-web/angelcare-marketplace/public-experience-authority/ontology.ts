import type {PublicExperienceMasterDomain} from './types'

export const PUBLIC_EXPERIENCE_RESOLUTION_PRECEDENCE=['exact_item','placement','collection','experience_schema','category','business_family','doctrine','master_domain','family','marketplace_default'] as const
export const PUBLIC_EXPERIENCE_CLASSES=['offer_detail','storefront','transaction','content','portal'] as const
export const PUBLIC_EXPERIENCE_MASTER_DOMAIN_LABELS:Record<PublicExperienceMasterDomain,string>={
  b2c_service_family:'B2C Service / Famille',
  b2c_product_digital:'B2C Produit / Digital',
  academy_admission:'Academy / Admission',
  b2b_institutional:'B2B / Institutionnel',
}
export const PUBLIC_EXPERIENCE_TRANSACTIONAL_ROUTE_FAMILIES=['booking','quotation','enrollment','subscription','basket','quote-basket','checkout'] as const
export const PUBLIC_EXPERIENCE_RUNTIME_INVARIANTS=[
  'canonical-route-owned','canonical-business-truth','published-revision-only','native-fallback','server-revalidation','public-safe-projection','no-shadow-authority','targeted-invalidation','attribution-preserved','mobile-native'
] as const
