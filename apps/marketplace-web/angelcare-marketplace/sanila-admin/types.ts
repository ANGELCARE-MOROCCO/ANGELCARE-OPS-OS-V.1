import type { Data } from '@puckeditor/core'

export type SanilaAdminRow = Record<string, unknown>
export type SanilaAdminSnapshot = {
  config: SanilaAdminRow | null
  grants: SanilaAdminRow[]
  inquiries: SanilaAdminRow[]
  events: SanilaAdminRow[]
  sessions: SanilaAdminRow[]
}
export type SanilaWorldTheme = {
  key: string
  name: string
  layout: 'editorial' | 'bento' | 'institutional' | 'panorama' | 'minimal' | 'kinetic'
  colors: { paper: string; ink: string; accent: string; soft: string }
  system: boolean
  archivedAt: string | null
}
export type SanilaWorldPageState = {
  slug: string
  title: string
  nav: string
  status: 'source' | 'draft' | 'published' | 'trashed'
  updatedAt: string | null
  data: Data | null
  publishedData?: Data | null
  seo?: { title: string; description: string; noindex: boolean }
  themeKey?: string | null
  publishedThemeKey?: string | null
  showInNav?: boolean
  isCustom?: boolean
  deletedAt?: string | null
}
export type SanilaWorldRelease = {
  revision: number
  publishedAt: string
  pages: Record<string, SanilaWorldPageState>
  themes: Record<string, SanilaWorldTheme>
  themeKey: string
  nav: Array<{ slug: string; label: string }>
  shell: { header: boolean; footer: boolean; navigation: boolean }
}
export type SanilaWorldState = {
  version: 1
  worldKey: 'sanila-public-world'
  status: 'source' | 'draft' | 'published'
  revision: number
  sourceFingerprint: string | null
  importedAt: string | null
  importedBy: string | null
  packageName: string | null
  shell: { header: boolean; footer: boolean; navigation: boolean }
  publishedShell?: { header: boolean; footer: boolean; navigation: boolean }
  workflows: { demo: boolean; contact: boolean; onboarding: boolean; protectedDemoAccess: boolean }
  pages: Record<string, SanilaWorldPageState>
  themes?: Record<string, SanilaWorldTheme>
  publishedThemes?: Record<string, SanilaWorldTheme>
  themeKey?: string
  publishedThemeKey?: string
  navigation?: Array<{ slug: string; label: string }>
  publishedNavigation?: Array<{ slug: string; label: string }>
  releases?: SanilaWorldRelease[]
  publishedAt: string | null
  publishedBy: string | null
}
