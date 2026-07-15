export type MarketplaceStatus = 'draft' | 'published' | 'archived'

export type MarketplaceAccent = 'navy' | 'blue' | 'gold' | 'green' | 'orange' | 'rose' | 'purple'

export type MarketplaceGateway = {
  id: string
  title: string
  slug: string
  subtitle: string
  icon: string
  tags: string[]
  ctaLabel: string
  secondaryCtaLabel: string
  href: string
  featuredBadge?: string
  order: number
  status: MarketplaceStatus
  accent: MarketplaceAccent
}

export type MarketplaceCategory = {
  id: string
  title: string
  slug: string
  gatewaySlug: string
  shortDescription: string
  promise: string
  useCases: string[]
  tags: string[]
  heroNote: string
  layoutTemplate: 'premium-editorial' | 'dense-wholesale' | 'pack-first' | 'training-linked'
  status: MarketplaceStatus
  catalogueCategory?: string
  sourcePage?: number
  sourceImage?: string
}

export type MarketplaceProduct = {
  id: string
  reference: string
  title: string
  slug: string
  categorySlug: string
  setName: string
  shortDescription: string
  longDescription: string
  startingPriceMad: number
  priceNote: string
  tags: string[]
  bestFor: string[]
  schoolArea: string
  eventType: string
  format: string
  leadTime: string
  personalizable: boolean
  wholesaleAvailable: boolean
  minQuantity: number
  relatedTrainingSlugs: string[]
  relatedPackSlugs: string[]
  status: MarketplaceStatus
  catalogueCategory?: string
  sourcePage?: number
  sourceImage?: string
}

export type AcademyModule = {
  id: string
  reference: string
  title: string
  slug: string
  category: string
  categorySlug: string
  shortDescription: string
  objectives: string[]
  duration: string
  participants: string
  format: string
  startingPriceMad: number
  includesCertificate: boolean
  includesElearning: boolean
  relatedProductRefs: string[]
  relatedPackSlugs: string[]
  status: MarketplaceStatus
  sourcePage?: number
  sourceImage?: string
}

export type MarketplacePack = {
  id: string
  title: string
  slug: string
  objective: string
  shortDescription: string
  startingPriceMad: number
  bestFor: string[]
  includedProductRefs: string[]
  includedTrainingSlugs: string[]
  variants: Array<{ name: string; priceMad: number; note: string }>
  customizable: boolean
  status: MarketplaceStatus
}

export type MarketplaceThemeSettings = {
  id: string
  name: string
  primaryColor: string
  accentColor: string
  backgroundStyle: string
  cardRadius: string
  buttonStyle: string
  heroStyle: string
  productCardStyle: string
  gridDensity: 'comfortable' | 'compact' | 'dense'
  marketplaceMode: 'premium' | 'editorial' | 'wholesale' | 'classic'
  logoUrl?: string
  logoAlt?: string
  logoWidthPx?: number
  logoHeightPx?: number
  logoDisplayMode?: 'symbol-and-wordmark' | 'symbol-only' | 'wordmark-only'
  customerLogoMaxWidthPx?: number
  announcementEnabled?: boolean
  announcementText?: string
  announcementCtaLabel?: string
  announcementCtaHref?: string
  announcementBackground?: string
  announcementTextColor?: string
  headerLayout?: 'centered' | 'split' | 'compact'
  menuStyle?: 'pill' | 'underline' | 'mega'
  stickyQuoteEnabled?: boolean
}

export type MarketplaceHomeSection = {
  id: string
  type: 'hero' | 'search' | 'gateways' | 'featured-products' | 'featured-packs' | 'academy-highlight' | 'wholesale-cta' | 'final-cta' | string
  title: string
  subtitle: string
  ctaLabel?: string
  ctaHref?: string
  visible: boolean
  order: number
  layoutStyle: string
  settings?: Record<string, unknown>
}

export type MarketplaceNavigationItem = {
  id: string
  label: string
  href: string
  location: 'main-horizontal' | 'mobile-horizontal' | 'footer-quick' | 'footer-commercial' | string
  order: number
  status: MarketplaceStatus
  parentId?: string | null
  badge?: string
  isPrimary?: boolean
}

export type MarketplaceHomePayload = {
  theme: MarketplaceThemeSettings
  sections: MarketplaceHomeSection[]
  gateways: MarketplaceGateway[]
  categories: MarketplaceCategory[]
  featuredProducts: MarketplaceProduct[]
  featuredPacks: MarketplacePack[]
  academyModules: AcademyModule[]
  navigation: MarketplaceNavigationItem[]
}

export type QuoteCartLine = {
  lineId: string
  itemType: 'product' | 'training' | 'pack'
  reference: string
  title: string
  quantity: number
  estimatedUnitPriceMad: number
  personalizationNotes?: string
}

export type QuoteRequestPayload = {
  schoolName: string
  contactName: string
  phone: string
  email: string
  city: string
  message?: string
  lines: QuoteCartLine[]
}
