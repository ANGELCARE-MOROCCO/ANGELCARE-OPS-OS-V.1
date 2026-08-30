import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'

import { HomepageFlagship } from '@/angelcare-marketplace/homepage-flagship/components/HomepageFlagship'
import { getHomepageExperience } from '@/angelcare-marketplace/homepage-flagship/repository'
import type { HomepageLocale } from '@/angelcare-marketplace/homepage-flagship/types'
import { MarketplaceIndex } from '@/angelcare-marketplace/catalog-discovery/components/MarketplaceIndex'
import { searchDiscovery } from '@/angelcare-marketplace/catalog-discovery/repository'
import type { CatalogLocale } from '@/angelcare-marketplace/catalog-discovery/types'
import { GlobalPublicShell } from '@/angelcare-marketplace/public-universe/components/GlobalPublicShell'
import { PublicPageRenderer } from '@/angelcare-marketplace/public-universe/components/PublicPageRenderer'
import { getPublicPage, publicRoutePath } from '@/angelcare-marketplace/public-universe/repository'
import { resolvePublishedDictionary } from '@/angelcare-marketplace/localization-intelligence/runtime'

const locales = new Set(['fr', 'en', 'ar'])
type PublicLocale = HomepageLocale

const legacyRouteAliases: Record<PublicLocale, Record<string, string>> = {
  fr: { etablissements: 'establishments', entreprises: 'corporates', confiance: 'trust', hotels: 'hospitality', cliniques: 'health-partners', 'cliniques-maternite': 'health-partners' },
  en: {}, ar: {},
}

function canonicalAlias(locale: PublicLocale, slug: string): string | null { return legacyRouteAliases[locale][slug] || null }

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug?: string[] }> }): Promise<Metadata> {
  const current = await params
  if (!locales.has(current.locale)) return {}
  const locale = current.locale as PublicLocale
  const dictionary = locale === 'fr' ? null : await resolvePublishedDictionary(locale, 'public').catch(() => null)
  const translated = (value: string | null | undefined) => value ? dictionary?.bySource[value] || value : undefined
  const slug = current.slug?.length ? publicRoutePath(current.slug) : 'accueil'
  const alias = canonicalAlias(locale, slug)
  if (alias) return { title: 'ANGELCARE Marketplace', alternates: { canonical: `/angelcare-marketplace/${locale}/${alias}` } }
  if (slug === 'accueil') {
    const homepage = await getHomepageExperience({ locale }).catch(() => null)
    const campaign = homepage?.campaigns[0]
    if (campaign) return { title: translated(campaign.title), description: translated(campaign.subtitle), alternates: { canonical: `/angelcare-marketplace/${locale}` } }
  }
  const result = await getPublicPage({ locale, slug }).catch(() => null)
  if (!result) return { title: 'ANGELCARE Marketplace' }
  return { title: translated(result.page.seo_title || result.page.title), description: translated(result.page.seo_description || result.page.description), alternates: { canonical: result.page.canonical_url || undefined } }
}

export default async function Page({ params }: { params: Promise<{ locale: string; slug?: string[] }> }) {
  const current = await params
  if (!locales.has(current.locale)) notFound()
  const locale = current.locale as PublicLocale
  const slug = current.slug?.length ? publicRoutePath(current.slug) : 'accueil'
  const alias = canonicalAlias(locale, slug)
  if (alias) permanentRedirect(`/angelcare-marketplace/${locale}/${alias}`)
  if (slug === 'accueil') {
    // MARKETPLACE_LOCALE_ROOT_FAIL_OPEN
    //
    // The canonical public entrypoint must remain commercially available
    // even when optional Homepage Flagship / CMS configuration is unavailable.
    //
    // Priority:
    // 1. Homepage Flagship
    // 2. Existing Marketplace catalogue experience
    // 3. Static continuity surface
    //
    // A valid locale root must never degrade into Next.js notFound().
    const homepage = await getHomepageExperience({ locale }).catch(() => null)

    if (homepage) {
      return (
        <GlobalPublicShell
          locale={locale}
          navigation={homepage.navigation}
          variant="marketplace"
        >
          <HomepageFlagship experience={homepage} />
        </GlobalPublicShell>
      )
    }

    const discovery = await searchDiscovery({
      locale: locale as CatalogLocale,
      limit: 80,
    }).catch(() => null)

    if (discovery) {
      return <MarketplaceIndex data={discovery} />
    }

    const continuityCopy = locale === 'fr'
      ? {
          eyebrow: 'ANGELCARE MARKETPLACE',
          title: 'Bienvenue dans votre univers AngelCare',
          body: 'Notre Marketplace reste disponible pendant la synchronisation de ses contenus dynamiques.',
        }
      : locale === 'ar'
        ? {
            eyebrow: 'ANGELCARE MARKETPLACE',
            title: 'مرحباً بكم في عالم AngelCare',
            body: 'يظل Marketplace متاحاً أثناء مزامنة المحتوى الديناميكي.',
          }
        : {
            eyebrow: 'ANGELCARE MARKETPLACE',
            title: 'Welcome to your AngelCare universe',
            body: 'Our Marketplace remains available while dynamic content is synchronizing.',
          }

    return (
      <main
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
        style={{
          minHeight: '100vh',
          background: '#ffffff',
          color: '#102847',
          display: 'grid',
          placeItems: 'center',
          padding: '48px 24px',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <section
          style={{
            width: '100%',
            maxWidth: 920,
            border: '1px solid #e6ebf1',
            borderRadius: 24,
            padding: '56px 48px',
            boxShadow: '0 20px 60px rgba(16, 40, 71, 0.08)',
            background: '#ffffff',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.18em',
            }}
          >
            {continuityCopy.eyebrow}
          </p>

          <h1
            style={{
              margin: '18px 0 14px',
              fontSize: 'clamp(34px, 6vw, 68px)',
              lineHeight: 1.02,
              letterSpacing: '-0.04em',
            }}
          >
            {continuityCopy.title}
          </h1>

          <p
            style={{
              margin: 0,
              maxWidth: 680,
              fontSize: 18,
              lineHeight: 1.7,
              color: '#53657a',
            }}
          >
            {continuityCopy.body}
          </p>
        </section>
      </main>
    )
  }

  const result = await getPublicPage({ locale, slug }).catch(() => null)
  if (!result) notFound()
  return <GlobalPublicShell locale={locale} navigation={result.navigation}><PublicPageRenderer experience={result} locale={locale}/></GlobalPublicShell>
}
