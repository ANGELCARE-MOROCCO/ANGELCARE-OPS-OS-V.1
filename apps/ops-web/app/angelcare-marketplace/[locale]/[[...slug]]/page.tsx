import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'

import { GlobalPublicShell } from '@/angelcare-marketplace/public-universe/components/GlobalPublicShell'
import { PublicPageRenderer } from '@/angelcare-marketplace/public-universe/components/PublicPageRenderer'
import {
  getPublicPage,
  publicRoutePath,
} from '@/angelcare-marketplace/public-universe/repository'

const locales = new Set(['fr', 'en', 'ar'])

type PublicLocale = 'fr' | 'en' | 'ar'

const legacyRouteAliases: Record<
  PublicLocale,
  Record<string, string>
> = {
  fr: {
    etablissements: 'establishments',
    entreprises: 'corporates',
    confiance: 'trust',
    hotels: 'hospitality',
    cliniques: 'health-partners',
    'cliniques-maternite': 'health-partners',
  },
  en: {},
  ar: {},
}

function canonicalAlias(
  locale: PublicLocale,
  slug: string,
): string | null {
  return legacyRouteAliases[locale][slug] || null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>
}): Promise<Metadata> {
  const current = await params

  if (!locales.has(current.locale)) return {}

  const locale = current.locale as PublicLocale
  const slug = publicRoutePath(current.slug)
  const alias = canonicalAlias(locale, slug)

  if (alias) {
    return {
      title: 'ANGELCARE Marketplace',
      alternates: {
        canonical:
          `/angelcare-marketplace/${locale}/${alias}`,
      },
    }
  }

  const result = await getPublicPage({
    locale,
    slug,
  }).catch(() => null)

  if (!result) {
    return { title: 'ANGELCARE Marketplace' }
  }

  return {
    title: result.page.seo_title || result.page.title,
    description:
      result.page.seo_description
      || result.page.description
      || undefined,
    alternates: {
      canonical: result.page.canonical_url || undefined,
    },
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>
}) {
  const current = await params

  if (!locales.has(current.locale)) notFound()

  const locale = current.locale as PublicLocale
  const slug = publicRoutePath(current.slug)
  const alias = canonicalAlias(locale, slug)

  if (alias) {
    permanentRedirect(
      `/angelcare-marketplace/${locale}/${alias}`,
    )
  }

  const result = await getPublicPage({
    locale,
    slug,
  }).catch(() => null)

  if (!result) notFound()

  return (
    <GlobalPublicShell
      locale={locale}
      navigation={result.navigation}
    >
      <PublicPageRenderer
        experience={result}
        locale={locale}
      />
    </GlobalPublicShell>
  )
}
