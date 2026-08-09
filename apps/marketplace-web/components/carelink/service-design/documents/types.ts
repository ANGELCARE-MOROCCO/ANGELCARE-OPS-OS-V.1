export type ServiceDocumentSourceKind = 'plan' | 'sellable' | 'handoff' | 'executive' | 'custom'
export type ServiceDocumentOrientation = 'portrait' | 'landscape'
export type ServiceDocumentDensity = 'compact' | 'standard' | 'detailed'
export type ServiceDocumentAudience = 'customer' | 'operations' | 'commercial' | 'executive'
export type ServiceDocumentConfidentiality = 'public' | 'internal' | 'confidential' | 'restricted'

export type ServiceDocumentTemplateId =
  | 'mission-technical-passport'
  | 'single-day-programme'
  | 'multi-day-programme'
  | 'detailed-daily-sheet'
  | 'carelink-field-brief'
  | 'event-run-of-show'
  | 'route-safety-plan'
  | 'postpartum-baby-programme'
  | 'adapted-support-plan'
  | 'b2c-service-presentation'
  | 'b2b-deployment-dossier'
  | 'package-options-sheet'
  | 'economics-margin-sheet'
  | 'complete-service-dossier'

export type ServiceDocumentSectionKey =
  | 'executive_summary'
  | 'identity'
  | 'customer_beneficiary'
  | 'objectives_outcomes'
  | 'timeline'
  | 'multi_day_progression'
  | 'activities_materials'
  | 'staffing_competencies'
  | 'safety_risks'
  | 'checklists_reporting'
  | 'route_transport'
  | 'commercial_package'
  | 'pricing_economics'
  | 'deployment_sites'
  | 'quality_readiness'
  | 'lineage_approvals'
  | 'notes_annexes'

export interface ServiceDocumentTimelineBlock {
  id?: string
  start?: string
  end?: string
  title: string
  detail?: string
  activityCode?: string
  type?: string
  evidence?: string[]
}

export interface ServiceDocumentDay {
  id?: string
  date?: string
  label?: string
  phase?: string
  objective?: string
  start?: string
  end?: string
  blocks: ServiceDocumentTimelineBlock[]
}

export interface ServiceDocumentPriceLine {
  id?: string
  label: string
  quantity?: number
  unitPrice?: number | null
  total?: number | null
  taxRate?: number | null
  note?: string
}

export interface ServiceDocumentSite {
  id?: string
  code?: string
  name: string
  city?: string
  beneficiaries?: number | null
  serviceWindow?: string
  staffing?: string
  status?: string
}

export interface ServiceDocumentSource {
  sourceKind: ServiceDocumentSourceKind
  sourceId?: string
  sourceTable?: string
  code?: string
  reference?: string
  title: string
  subtitle?: string
  version?: string
  status?: string
  category?: string
  family?: string
  universe?: 'b2c' | 'b2b' | 'both' | string
  customerName?: string
  customerType?: string
  beneficiaryName?: string
  beneficiaryProfile?: string
  location?: string
  dateFrom?: string
  dateTo?: string
  generatedAt?: string
  owner?: string
  approver?: string
  executiveSummary?: string
  promise?: string
  objectives: string[]
  outcomes: string[]
  painPoints: string[]
  contexts: string[]
  routines: string[]
  activities: string[]
  materials: string[]
  competencies: string[]
  staffing: string[]
  safeguards: string[]
  risks: string[]
  checklists: string[]
  reporting: string[]
  routes: string[]
  days: ServiceDocumentDay[]
  priceLines: ServiceDocumentPriceLine[]
  currency?: string
  subtotal?: number | null
  tax?: number | null
  total?: number | null
  cost?: number | null
  margin?: number | null
  sites: ServiceDocumentSite[]
  metrics: Array<{ label: string; value: string; detail?: string }>
  lineage: Array<{ label: string; value: string }>
  approvals: Array<{ authority?: string; decision?: string; date?: string; note?: string }>
  notes: string[]
  warnings: string[]
  raw?: Record<string, unknown>
}

export interface ServiceDocumentTemplate {
  id: ServiceDocumentTemplateId
  code: string
  name: string
  family: 'technical' | 'field' | 'event' | 'route' | 'care' | 'commercial' | 'enterprise' | 'economics' | 'complete'
  description: string
  orientation: ServiceDocumentOrientation
  audiences: ServiceDocumentAudience[]
  density: ServiceDocumentDensity
  accent: string
  accentSoft: string
  defaultSections: ServiceDocumentSectionKey[]
  requiredSections: ServiceDocumentSectionKey[]
  flexible: boolean
  categoryHints: string[]
}

export interface ServiceDocumentSettings {
  templateId: ServiceDocumentTemplateId
  orientation: ServiceDocumentOrientation
  density: ServiceDocumentDensity
  audience: ServiceDocumentAudience
  confidentiality: ServiceDocumentConfidentiality
  sectionOrder: ServiceDocumentSectionKey[]
  hiddenSections: ServiceDocumentSectionKey[]
  showLogo: boolean
  showLegalFooter: boolean
  showSourceReferences: boolean
  showBlankApprovalFields: boolean
  documentTitle?: string
  documentReference?: string
}

export interface ServiceDocumentRenderPayload {
  source: ServiceDocumentSource
  settings: ServiceDocumentSettings
}
