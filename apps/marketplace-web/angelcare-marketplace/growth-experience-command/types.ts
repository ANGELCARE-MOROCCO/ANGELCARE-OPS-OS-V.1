import type {ExecutiveAuthoritySummary} from '../final-authority/types'
import type {ConversionAdminSummary} from '../conversion-universe/types'

export type GrowthExperienceMode =
  | 'command'
  | 'acquisition'
  | 'campaigns'
  | 'audiences'
  | 'merchandising'
  | 'homepage'
  | 'discovery'
  | 'search'
  | 'conversion'
  | 'retention'
  | 'recovery'
  | 'experiments'
  | 'localization'
  | 'public-experience'
  | 'performance'

export interface GrowthExperienceSnapshot {
  authority: ExecutiveAuthoritySummary
  conversion: ConversionAdminSummary
  frontend: {
    surfaces: number
    published: number
    products: number
    categories: number
    pages: number
    openInquiries: number
  }
  localization: {
    totalCandidates: number
    missing: number
    stale: number
    sensitiveBlockers: number
    truthfulCoverage: number | null | undefined
  }
}
