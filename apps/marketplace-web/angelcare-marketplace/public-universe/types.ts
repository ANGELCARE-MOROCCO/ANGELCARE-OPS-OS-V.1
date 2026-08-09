import type { CmsBlock, CmsPage, CmsMenuItem } from '../experience-builder/types'

export interface PublicPageExperience {
  page: CmsPage
  blocks: CmsBlock[]
  navigation: CmsMenuItem[]
}

export interface PublicInquiryInput {
  audience: 'family' | 'school' | 'hotel' | 'clinic' | 'corporate' | 'provider' | 'supplier' | 'academy' | 'partner_os' | 'other'
  sourceRoute: string
  fullName: string
  email?: string | null
  phone?: string | null
  organization?: string | null
  city?: string | null
  message: string
  consent: boolean
  locale: 'fr' | 'en' | 'ar'
  territoryCode?: string | null
  honeypot?: string | null
}

export interface PublicInquiryRecord {
  id: string
  public_reference: string
  audience: string
  source_route: string
  full_name: string
  email: string | null
  phone: string | null
  organization: string | null
  city: string | null
  message: string
  status: 'new' | 'triaged' | 'in_progress' | 'qualified' | 'closed' | 'spam'
  owner_id: string | null
  territory_id: string | null
  locale: string
  created_at: string
}
