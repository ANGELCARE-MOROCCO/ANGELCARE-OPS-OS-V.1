import type { WebPresenceConfiguration, WebPresenceScope } from './types'

const localized = {
  fr: { defaultTitle: 'ANGELCARE', defaultDescription: 'L’écosystème ANGELCARE au service des familles et des organisations.', openGraphTitle: 'ANGELCARE', openGraphDescription: 'L’écosystème ANGELCARE au service des familles et des organisations.', socialTitle: 'ANGELCARE', socialDescription: 'L’écosystème ANGELCARE au service des familles et des organisations.', socialImageAssetKey: null },
  en: { defaultTitle: 'ANGELCARE', defaultDescription: 'The ANGELCARE ecosystem for families and organizations.', openGraphTitle: 'ANGELCARE', openGraphDescription: 'The ANGELCARE ecosystem for families and organizations.', socialTitle: 'ANGELCARE', socialDescription: 'The ANGELCARE ecosystem for families and organizations.', socialImageAssetKey: null },
  ar: { defaultTitle: 'ANGELCARE', defaultDescription: 'منظومة ANGELCARE لخدمة الأسر والمؤسسات.', openGraphTitle: 'ANGELCARE', openGraphDescription: 'منظومة ANGELCARE لخدمة الأسر والمؤسسات.', socialTitle: 'ANGELCARE', socialDescription: 'منظومة ANGELCARE لخدمة الأسر والمؤسسات.', socialImageAssetKey: null },
}

export function compiledWebPresence(scope: WebPresenceScope): WebPresenceConfiguration {
  const marketplace = scope === 'MARKETPLACE'
  const siteName = marketplace ? 'ANGELCARE Marketplace 360' : 'ANGELCARE'
  const description = marketplace
    ? 'Marketplace ANGELCARE gouvernée pour les familles, les professionnels et les organisations.'
    : localized.fr.defaultDescription
  const icon = { assetKey: null, renderingMode: 'CONTAIN_TRANSPARENT' as const }
  return {
    schemaVersion: 1,
    identity: { publicDomain: 'my.angelcarehub.com', canonicalOrigin: 'https://my.angelcarehub.com', siteName, siteShortName: marketplace ? 'Marketplace' : 'ANGELCARE', applicationName: siteName, defaultLocale: 'fr', supportedLocales: ['fr', 'en', 'ar'], defaultTitle: siteName, titleTemplate: marketplace ? '%s · ANGELCARE Marketplace 360' : '%s · ANGELCARE', defaultDescription: description, themeColor: '#102847', backgroundColor: '#ffffff' },
    localizedMetadata: marketplace ? {
      fr: { ...localized.fr, defaultTitle: siteName, openGraphTitle: siteName, socialTitle: siteName, defaultDescription: description, openGraphDescription: description, socialDescription: description },
      en: { ...localized.en, defaultTitle: siteName, openGraphTitle: siteName, socialTitle: siteName },
      ar: { ...localized.ar, defaultTitle: siteName, openGraphTitle: siteName, socialTitle: siteName },
    } : localized,
    icons: { favicon: { ...icon }, highResolution: { ...icon }, appleTouch: { ...icon }, manifest192: { ...icon, purpose: 'any' }, manifest512: { ...icon, purpose: 'any' }, monochromeMask: { ...icon, purpose: 'maskable' }, organizationLogo: { ...icon } },
    social: { defaultImageAssetKey: null, openGraphSiteName: siteName, openGraphType: 'website', openGraphLocale: 'fr_MA', alternateLocales: ['en_US', 'ar_MA'], twitterCard: 'summary_large_image', twitterSite: null, twitterCreator: null },
    robots: { productionIndex: false, follow: true, imagePreview: 'large', maxSnippet: -1 },
    sitemap: { enabled: true },
    manifest: { name: siteName, shortName: marketplace ? 'Marketplace' : 'ANGELCARE', description, startUrl: marketplace ? '/angelcare-marketplace/fr' : '/', scope: marketplace ? '/angelcare-marketplace/' : '/', display: 'browser', orientation: 'any', themeColor: '#102847', backgroundColor: '#ffffff', language: 'fr' },
    structuredData: { organization: { legalName: '', brandName: 'ANGELCARE', canonicalUrl: 'https://my.angelcarehub.com', description: localized.fr.defaultDescription, telephone: null, email: null, address: null, socialProfiles: [], foundingDate: null, contactPoints: [] }, website: { siteName, alternateName: marketplace ? 'ANGELCARE Marketplace' : 'AngelCare Hub', url: 'https://my.angelcarehub.com', supportedLanguages: ['fr', 'en', 'ar'] } },
    verification: { google: null, bing: null },
    sharedMetadata: { authorsOrganization: 'ANGELCARE', creator: 'ANGELCARE', publisher: 'ANGELCARE', applicationName: siteName, referrer: 'strict-origin-when-cross-origin', formatDetection: { telephone: false, email: false, address: false }, category: 'services', classification: 'Family and organization services' },
  }
}

export const WEB_PRESENCE_CACHE_TAG = 'angelcare-marketplace-web-presence'
export const WEB_PRESENCE_ROUTES: Record<WebPresenceScope, string[]> = {
  GLOBAL_DOMAIN: ['/', '/robots.txt', '/sitemap.xml', '/manifest.webmanifest'],
  MARKETPLACE: ['/angelcare-marketplace', '/angelcare-marketplace/fr', '/angelcare-marketplace/en', '/angelcare-marketplace/ar'],
}
