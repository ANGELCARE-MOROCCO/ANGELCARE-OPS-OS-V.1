export const WEB_PRESENCE_SCOPES = ['GLOBAL_DOMAIN', 'MARKETPLACE'] as const
export const WEB_PRESENCE_LOCALES = ['fr', 'en', 'ar'] as const

export type WebPresenceScope = (typeof WEB_PRESENCE_SCOPES)[number]
export type WebPresenceLocale = (typeof WEB_PRESENCE_LOCALES)[number]
export type WebPresenceLifecycle = 'DRAFT' | 'VALIDATED' | 'PUBLISHED' | 'SUPERSEDED' | 'ROLLED_BACK'
export type IconRenderingMode = 'CONTAIN_TRANSPARENT' | 'CONTAIN_BRAND_BACKGROUND'

export interface LocalizedMetadata {
  defaultTitle: string
  defaultDescription: string
  openGraphTitle: string
  openGraphDescription: string
  socialTitle: string
  socialDescription: string
  socialImageAssetKey: string | null
}

export interface IconReference {
  assetKey: string | null
  renderingMode: IconRenderingMode
  purpose?: 'any' | 'maskable'
}

export interface WebPresenceConfiguration {
  schemaVersion: 1
  identity: {
    publicDomain: string
    canonicalOrigin: string
    siteName: string
    siteShortName: string
    applicationName: string
    defaultLocale: WebPresenceLocale
    supportedLocales: WebPresenceLocale[]
    defaultTitle: string
    titleTemplate: string
    defaultDescription: string
    themeColor: string
    backgroundColor: string
  }
  localizedMetadata: Record<WebPresenceLocale, LocalizedMetadata>
  icons: {
    favicon: IconReference
    highResolution: IconReference
    appleTouch: IconReference
    manifest192: IconReference
    manifest512: IconReference
    monochromeMask: IconReference
    organizationLogo: IconReference
  }
  social: {
    defaultImageAssetKey: string | null
    openGraphSiteName: string
    openGraphType: 'website'
    openGraphLocale: string
    alternateLocales: string[]
    twitterCard: 'summary' | 'summary_large_image'
    twitterSite: string | null
    twitterCreator: string | null
  }
  robots: {
    productionIndex: boolean
    follow: boolean
    imagePreview: 'none' | 'standard' | 'large'
    maxSnippet: number
  }
  sitemap: { enabled: boolean }
  manifest: {
    name: string
    shortName: string
    description: string
    startUrl: string
    scope: string
    display: 'browser' | 'standalone' | 'minimal-ui'
    orientation: 'any' | 'portrait' | 'landscape'
    themeColor: string
    backgroundColor: string
    language: WebPresenceLocale
  }
  structuredData: {
    organization: {
      legalName: string
      brandName: string
      canonicalUrl: string
      description: string
      telephone: string | null
      email: string | null
      address: { street: string; locality: string; region: string; postalCode: string; country: string } | null
      socialProfiles: string[]
      foundingDate: string | null
      contactPoints: Array<{ type: string; telephone: string; email: string; languages: string[] }>
    }
    website: { siteName: string; alternateName: string; url: string; supportedLanguages: WebPresenceLocale[] }
  }
  verification: { google: string | null; bing: string | null }
  sharedMetadata: {
    authorsOrganization: string
    creator: string
    publisher: string
    applicationName: string
    referrer: 'no-referrer' | 'origin' | 'strict-origin-when-cross-origin'
    formatDetection: { telephone: boolean; email: boolean; address: boolean }
    category: string
    classification: string
  }
}

export interface WebPresenceMediaAsset {
  id: string
  assetKey: string
  fileName: string
  mimeType: string
  sizeBytes: number
  width: number | null
  height: number | null
  folder: string | null
  rightsStatus: string
  optimizationStatus: string
  status: string
  publicUrl: string
  metadata: Record<string, unknown>
}

export interface ValidationIssue { code: string; field: string; message: string; severity: 'blocker' | 'warning' }
export interface ValidationResult { valid: boolean; blockers: ValidationIssue[]; warnings: ValidationIssue[]; checkedAt: string }

export interface WebPresenceProfile {
  id: string
  scopeKey: WebPresenceScope
  domain: string
  defaultLocale: WebPresenceLocale
  supportedLocales: WebPresenceLocale[]
  currentPublishedVersionId: string | null
  status: string
}

export interface WebPresenceVersion {
  id: string
  profileId: string
  versionNumber: number
  lifecycleState: WebPresenceLifecycle
  configuration: WebPresenceConfiguration
  configurationChecksum: string
  validationResult: ValidationResult | null
  changeSummary: string | null
  createdBy: string | null
  validatedBy: string | null
  publishedBy: string | null
  createdAt: string
  validatedAt: string | null
  publishedAt: string | null
}

export interface WebPresenceSnapshot {
  profile: WebPresenceProfile
  draft: WebPresenceVersion | null
  published: WebPresenceVersion | null
  mediaAssets: WebPresenceMediaAsset[]
  affectedRoutes: string[]
  persistenceAvailable: boolean
  fallbackActive: boolean
  verification: Record<string, unknown> | null
}
