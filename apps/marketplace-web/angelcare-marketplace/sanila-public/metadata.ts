import type { Metadata } from 'next'
import { getSanilaPublicPage, resolveSanilaPublicSlug } from './content'

export function getSanilaPublicMetadata(routeSlug: string): Metadata {
  const slug = resolveSanilaPublicSlug(routeSlug)
  const page = slug ? getSanilaPublicPage(slug) : null
  if (!page) return { title: 'SANILA — Operating System', robots: { index: false, follow: false } }

  const canonical = slug === 'accueil'
    ? '/angelcare-marketplace/fr/sanila'
    : `/angelcare-marketplace/fr/sanila/${slug}`

  const pageName = page.nav === 'Accueil' ? 'SANILA' : `${page.nav} — SANILA`
  return {
    title: `${pageName} | Le système d’exploitation complet de votre établissement`,
    description: page.subtitle,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      locale: 'fr_MA',
      title: pageName,
      description: page.subtitle,
      url: canonical,
      images: [{ url: '/sanila/sanila-operating-system-logo.png', width: 586, height: 206, alt: 'SANILA Operating System' }],
    },
    robots: { index: true, follow: true },
  }
}
