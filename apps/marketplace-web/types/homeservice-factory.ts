export type FactoryMode = 'single_mission' | 'multi_mission' | 'commercial_package'
export type FactoryUniverse = 'b2c' | 'b2b'

export interface FactoryDateInput {
  serviceDate: string
  startTime: string
  endTime: string
}

export interface FactoryComposeInput {
  blueprintCode?: string
  blueprintVersion?: number
  presetCode?: string
  structuredSelections?: Record<string, unknown>
  mode: FactoryMode
  universe: FactoryUniverse
  categoryId: string
  customerSegment: string
  ageYears: number
  beneficiaryCount: number
  objectiveCodes: string[]
  contextCodes: string[]
  painPointCodes: string[]
  outcomeCodes: string[]
  dates: FactoryDateInput[]
  includeMeal: boolean
  includeSnack: boolean
  includeRest: boolean
  includeHygiene: boolean
  maxActivitiesPerDay: number
  maxOptions: number
  requestedScenarioCount: number
  notes?: string
}

export interface FactoryActivitySource {
  id: string
  code: string
  name: string
  description: string
  blockType: string
  objectiveCodes: string[]
  categoryCodes: string[]
  ageMinMonths: number | null
  ageMaxMonths: number | null
  minMinutes: number
  maxMinutes: number
  materials: string[]
  competencyCodes: string[]
  riskCodes: string[]
  evidenceCodes: string[]
  repetitionLimit: number
  status: string
}

export interface FactoryOptionSource {
  id: string
  code: string
  name: string
  description: string
  optionType: 'feature' | 'topup' | 'upsell'
  pricingBasis: string
  unitPriceDh: number
  costAmountDh: number
  minimumQuantity: number
  maximumQuantity: number
  status: string
}

export interface FactoryCategorySource {
  id: string
  code: string
  commercialName: string
  operationalName: string
  description: string
  audience: string
  status: string
  versionNumber: number
  familyName: string
  missionFormats: string[]
  beneficiaryProfiles: string[]
  languages: string[]
  cities: string[]
  doctrine: Array<Record<string, unknown>>
  capacity: Record<string, unknown> | null
  activities: FactoryActivitySource[]
  options: FactoryOptionSource[]
  competencies: Array<Record<string, unknown>>
  risks: Array<Record<string, unknown>>
  priceEntries: Array<Record<string, unknown>>
}

export interface FactoryTimelineBlock {
  id: string
  sourceType: 'registered_activity' | 'system_routine'
  sourceId: string | null
  sourceCode: string
  label: string
  startTime: string
  endTime: string
  durationMinutes: number
  objective: string
  rationale: string
  materials: string[]
  competencyCodes: string[]
  riskCodes: string[]
  evidenceCodes: string[]
}

export interface FactoryScenarioDay {
  dayNumber: number
  serviceDate: string
  objective: string
  progressionPhase: string
  startTime: string
  endTime: string
  totalMinutes: number
  timeline: FactoryTimelineBlock[]
}

export interface FactoryPriceTruth {
  priceStatus: 'priced' | 'quote_required'
  pricingBasis: string | null
  baseAmountDh: number | null
  optionsAmountDh: number
  customerTotalDh: number | null
  knownCostDh: number | null
  grossMarginDh: number | null
  marginPercent: number | null
  sourcePriceCode: string | null
  warnings: string[]
}

export interface FactoryScenario {
  blueprintCode?: string
  blueprintVersion?: number
  presetCode?: string
  configurationSnapshot?: Record<string, unknown>
  id: string
  requestId: string
  scenarioNumber: number
  mode: FactoryMode
  universe: FactoryUniverse
  name: string
  promise: string
  positioning: string
  rationale: string
  categoryId: string
  categoryCode: string
  categoryName: string
  selectedActivityIds: string[]
  selectedOptionIds: string[]
  days: FactoryScenarioDay[]
  price: FactoryPriceTruth
  warnings: string[]
  providerRoute: 'openrouter/free'
  actualModel: string | null
  createdAt: string
}

export interface FactoryCataloguePayload {
  categories: FactoryCategorySource[]
  objectives: Array<{ code: string; label: string }>
  contexts: Array<{ code: string; label: string }>
  painPoints: Array<{ code: string; label: string }>
  outcomes: Array<{ code: string; label: string }>
}

export interface DirectImportResult {
  batchId: string
  importType: string
  totalRows: number
  appliedRows: number
  rejectedRows: number
  warnings: string[]
  errors: Array<{ row: number; message: string }>
}
