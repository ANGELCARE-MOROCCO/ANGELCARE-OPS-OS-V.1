export interface MarketplaceRuntimeConfig {
  baseRoute: string
  apiRoute: string
  defaultLocale: 'fr' | 'en' | 'ar'
  supportedLocales: readonly ['fr', 'en', 'ar']
  environment: 'development' | 'test' | 'production'
  releaseVersion: string
}

function normalizedEnvironment(value: string | undefined): MarketplaceRuntimeConfig['environment'] {
  if (value === 'production' || value === 'test') return value
  return 'development'
}

export function getMarketplaceRuntimeConfig(): MarketplaceRuntimeConfig {
  return {
    baseRoute: '/angelcare-marketplace',
    apiRoute: '/api/angelcare-marketplace/foundation',
    defaultLocale: 'fr',
    supportedLocales: ['fr', 'en', 'ar'] as const,
    environment: normalizedEnvironment(process.env.NODE_ENV),
    releaseVersion: process.env.ANGELCARE_MARKETPLACE_RELEASE_VERSION || 'mega-zip-01',
  }
}
