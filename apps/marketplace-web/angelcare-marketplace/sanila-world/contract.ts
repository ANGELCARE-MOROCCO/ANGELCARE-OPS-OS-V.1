import { SANILA_PAGE_BLUEPRINTS } from '@/angelcare-marketplace/sanila-public/pageBlueprints'

export const SANILA_WORLD_KEY = 'sanila-public-world' as const
export const SANILA_WORLD_CONFIG_KEY = 'sanila.world.sovereign.v1'
export const SANILA_PUBLIC_ROUTE_PREFIX = '/angelcare-marketplace/fr/sanila'

export const SANILA_WORLD_SECTIONS = [
  'command', 'demo', 'requests', 'access', 'sessions', 'prospects',
  'public-world', 'studio', 'pages', 'shell', 'navigation', 'forms',
  'media', 'seo', 'publication', 'audit', 'health',
] as const

export type SanilaWorldSection = typeof SANILA_WORLD_SECTIONS[number]

export const SANILA_WORLD_ROUTES = SANILA_PAGE_BLUEPRINTS.map((page) => ({
  slug: page.slug,
  nav: page.nav,
  title: page.title,
  kind: page.kind,
  mode: page.mode,
  href: page.slug === 'accueil' ? SANILA_PUBLIC_ROUTE_PREFIX : `${SANILA_PUBLIC_ROUTE_PREFIX}/${page.slug}`,
  workflow: page.slug === 'demonstration' ? 'sanila.demo' : page.slug === 'contact' ? 'sanila.contact' : page.slug === 'creer-mon-etablissement' ? 'sanila.onboarding' : null,
  desktopReference: `${page.slug.replaceAll('/', '__')}__desktop.png`,
  mobileReference: `${page.slug.replaceAll('/', '__')}__mobile.png`,
}))

export const SANILA_REQUIRED_SOURCE_PATHS = [
  'angelcare-marketplace/sanila-public/SanilaPublicUniverse.tsx',
  'angelcare-marketplace/sanila-public/components/SanilaShell.tsx',
  'angelcare-marketplace/sanila-public/pageBlueprints.ts',
  'angelcare-marketplace/sanila-public/pageRegistry.tsx',
  'angelcare-marketplace/sanila-public/SanilaDemoForm.tsx',
  'angelcare-marketplace/sanila-public/SanilaContactForm.tsx',
  'angelcare-marketplace/sanila-public/SanilaOnboardingForm.tsx',
]
