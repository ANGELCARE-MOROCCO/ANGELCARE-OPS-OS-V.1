import type { Data } from '@puckeditor/core'

export type SanilaAdminRow = Record<string, unknown>

export type SanilaAdminSnapshot = {
  config: SanilaAdminRow | null
  grants: SanilaAdminRow[]
  inquiries: SanilaAdminRow[]
  events: SanilaAdminRow[]
  sessions: SanilaAdminRow[]
}

export type SanilaWorldPageState = {
  slug: string
  title: string
  nav: string
  status: 'source' | 'draft' | 'published'
  updatedAt: string | null
  data: Data | null
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
  shell: {
    header: boolean
    footer: boolean
    navigation: boolean
  }
  workflows: {
    demo: boolean
    contact: boolean
    onboarding: boolean
    protectedDemoAccess: boolean
  }
  pages: Record<string, SanilaWorldPageState>
  publishedAt: string | null
  publishedBy: string | null
}
