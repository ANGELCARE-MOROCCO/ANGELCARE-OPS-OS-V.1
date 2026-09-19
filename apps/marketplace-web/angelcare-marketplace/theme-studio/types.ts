import type { HomepageCampaign, HomepageCategory, HomepageLocale } from '../homepage-flagship/types'
import type { HomepageSectionRecord } from '../commerce-studio/types'
import type { HomepageThemeConfig } from './theme-config'
export type { HomepageThemeConfig } from './theme-config'

export interface HomepageThemeStudioDocument {
  schemaVersion: 1
  locale: HomepageLocale
  theme: HomepageThemeConfig
  sections: HomepageSectionRecord[]
  campaigns: HomepageCampaign[]
  categories: HomepageCategory[]
  savedAt: string
}

export interface ThemeStudioDraftResponse {
  id: string
  version: number
  status: string
  document: HomepageThemeStudioDocument
  created_at?: string
  updated_at?: string
}
