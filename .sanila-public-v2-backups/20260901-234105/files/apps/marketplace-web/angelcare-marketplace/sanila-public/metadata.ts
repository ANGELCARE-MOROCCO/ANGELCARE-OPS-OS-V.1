import type { Metadata } from 'next'
import { getSanilaPublicPage } from './content'

export function getSanilaPublicMetadata(slug: string): Metadata {
  const page = getSanilaPublicPage(slug)
  if (!page) return { title: 'SANILA — Operating System' }
  const canonical = slug === 'accueil'
    ? '/angelcare-marketplace/fr'
    : `/angelcare-marketplace/fr/${slug}`

  return {
    title: `${page.nav === 'Accueil' ? 'SANILA' : `${page.nav} — SANILA`} | Le système d’exploitation complet de votre établissement`,
    description: page.subtitle,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      locale: 'fr_MA',
      title: `${page.nav === 'Accueil' ? 'SANILA' : page.nav} — SANILA`,
      description: page.subtitle,
      url: canonical,
      images: [{ url: '/sanila/sanila-operating-system-logo.png', width: 586, height: 206, alt: 'SANILA Operating System' }],
    },
    robots: { index: true, follow: true },
  }
}
