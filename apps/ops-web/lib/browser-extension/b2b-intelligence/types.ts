export type BrowserBusinessContext = {
  contextId?: string
  adapterId: 'generic_web' | 'google_maps' | 'angelcare_saas' | string
  pageType: 'company_website' | 'google_maps_listing' | 'angelcare_record' | 'unknown' | string
  url: string
  origin?: string | null
  title?: string | null
  selectedText?: string | null
  organization?: {
    name?: string | null
    legalName?: string | null
    domain?: string | null
    sector?: string | null
    subSector?: string | null
    city?: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
    website?: string | null
    description?: string | null
    category?: string | null
    googleMapsUrl?: string | null
    placeId?: string | null
    socialLinks?: string[]
    signals?: string[]
  }
  contacts?: Array<{ name?: string | null; role?: string | null; department?: string | null; email?: string | null; phone?: string | null; linkedin?: string | null }>
  evidence?: Array<{ type: string; fieldKey?: string | null; value: string; confidence?: number; sourceUrl?: string | null; metadata?: Record<string, unknown> }>
  metadata?: Record<string, unknown>
}

export type MatchCandidate = {
  prospect: Record<string, any>
  confidence: number
  matchType: 'exact' | 'probable' | 'possible'
  reasons: string[]
}

export type ScoreResult = {
  version: string
  scores: {
    commercialFit: number
    revenuePotential: number
    strategicImportance: number
    buyingReadiness: number
    decisionMakerCoverage: number
    operationalFeasibility: number
    territoryValue: number
    expansionPotential: number
    evidenceConfidence: number
    overall: number
  }
  priority: 'A' | 'B' | 'C' | 'D'
  contributions: Array<{ key: string; label: string; points: number; reason: string }>
  explanation: string
}

export type VerticalEvaluation = {
  key: string
  label: string
  confidence: number
  opportunitySignals: string[]
  qualificationQuestions: string[]
  decisionMakerRoles: Array<{ key: string; label: string }>
  recommendedPrograms: string[]
  commercialAngle: string
  risks: string[]
  missingInformation: string[]
  estimatedAnnualValue: { min: number; max: number }
  recommendedNextAction: string
}

export type B2BIntelligenceCommandDefinition = {
  commandKey: string
  capabilityPermission: string
  requiredSubmodule?: string
  adapterKeys?: string[]
  mutating: boolean
  acceptanceId: string
}
