import type { BrowserBusinessContext } from '../b2b-intelligence/types'

export type ScannerMode = 'quick' | 'deep' | 'strategic'
export type ScannerStatus = 'prepared' | 'collecting' | 'researching' | 'resolving' | 'review_required' | 'completed' | 'partial' | 'failed' | 'cancelled'

export type ScannerSourcePage = {
  url: string
  title: string | null
  pageType: string
  status: 'fetched' | 'skipped' | 'failed'
  httpStatus?: number | null
  contentType?: string | null
  textLength?: number
  errorCode?: string | null
  metadata?: Record<string, unknown>
}

export type ScannerFact = {
  fieldKey: string
  value: string
  normalizedValue?: string | null
  sourceUrl: string
  sourceTitle?: string | null
  evidenceExcerpt?: string | null
  extractionMethod: string
  confidence: number
  validationState: 'detected' | 'inferred' | 'user_confirmed' | 'verified' | 'rejected' | 'conflicting' | 'outdated'
  metadata?: Record<string, unknown>
}

export type ScannerContact = {
  name: string | null
  role: string | null
  department: string | null
  email: string | null
  phone: string | null
  sourceUrl: string
  confidence: number
  buyingRoleHypothesis?: string | null
  metadata?: Record<string, unknown>
}

export type ScannerSignal = {
  signalType: 'growth' | 'need' | 'buying' | 'risk' | 'positioning' | 'operational'
  signalKey: string
  label: string
  evidence: string
  sourceUrl: string
  confidence: number
  commercialInterpretation: string
  metadata?: Record<string, unknown>
}

export type ScannerOpportunityHypothesis = {
  programKey: string
  title: string
  rationale: string
  evidence: string[]
  potentialModel: string
  confidence: number
  missingInformation: string[]
  estimatedAnnualValueMin: number
  estimatedAnnualValueMax: number
}

export type ScannerPageExtraction = {
  page: ScannerSourcePage
  organization: Record<string, unknown>
  facts: ScannerFact[]
  contacts: ScannerContact[]
  signals: ScannerSignal[]
  services: string[]
  internalLinks: Array<{ url: string; label: string; category: string; score: number }>
  branches: Array<{ name?: string | null; city?: string | null; address?: string | null; sourceUrl: string }>
  textSummary: string
}

export type ScannerQuality = {
  identityConfidence: number
  evidenceCompleteness: number
  contactCoverage: number
  branchConfidence: number
  verticalConfidence: number
  opportunityConfidence: number
  freshness: number
  sourceDiversity: number
  duplicateRisk: number
  overallResearchCompleteness: number
}

export type ScannerResult = {
  session: Record<string, any>
  mode: ScannerMode
  status: ScannerStatus
  context: BrowserBusinessContext
  pages: ScannerSourcePage[]
  facts: ScannerFact[]
  contacts: ScannerContact[]
  signals: ScannerSignal[]
  services: string[]
  branches: Array<Record<string, unknown>>
  matches: Array<Record<string, any>>
  vertical: Record<string, any>
  score: Record<string, any>
  opportunityHypotheses: ScannerOpportunityHypothesis[]
  missingInformation: string[]
  quality: ScannerQuality
  recommendedActions: Array<{ key: string; label: string; reason: string; priority: 'critical' | 'high' | 'medium' | 'low' }>
  ai: { configured: boolean; used: boolean; provider: string | null; model: string | null; warning?: string | null }
  diagnostics: Array<{ code: string; message: string; sourceUrl?: string | null }>
}
