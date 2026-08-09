export type ServiceOSTone = 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'slate' | 'cyan'
export type ServiceOSStatus = 'draft' | 'active' | 'paused' | 'retired' | 'at_risk' | 'blocked'
export type ServiceOSPriority = 'low' | 'medium' | 'high' | 'critical'

export type AngelCareServiceFamily =
  | 'home_care'
  | 'special_needs'
  | 'school_support'
  | 'postpartum'
  | 'events'
  | 'education_ludique'
  | 'academy_training'
  | 'mobility_transport'
  | 'corporate_institutional'
  | 'health_wellness'

export type ServiceOSModule = {
  id: string
  code: string
  label: string
  family: AngelCareServiceFamily | 'shared'
  description: string
  riskLevel: ServiceOSPriority
  defaultPriceMad: number
  requiredCertifications: string[]
  operationalChecklist: string[]
  enabledByDefault?: boolean
}

export type ServiceOSRule = {
  id: string
  code: string
  label: string
  appliesToFamilies: AngelCareServiceFamily[]
  condition: string
  action: string
  pricingModifierMad?: number
  pricingMultiplier?: number
  requiredModules?: string[]
  requiredCertifications?: string[]
  escalation?: ServiceOSPriority
  status: ServiceOSStatus
}

export type ServiceOSCityDeployment = {
  city: string
  country: 'MA' | string
  launchStage: 'not_started' | 'pilot' | 'active' | 'scale' | 'franchise_ready'
  demandScore: number
  capacityScore: number
  riskScore: number
  targetMonthlyRevenueMad: number
  requiredHires: number
  premiumDistricts: string[]
  activeFamilies: AngelCareServiceFamily[]
}

export type ServiceOSBlueprint = {
  id: string
  code: string
  title: string
  family: AngelCareServiceFamily
  status: ServiceOSStatus
  commercialTitle: string
  description: string
  targetClients: string[]
  modules: string[]
  rules: string[]
  cities: string[]
  basePriceMad: number
  marginTargetPct: number
  staffRoles: string[]
  requiredDocuments: string[]
  workflowTemplate: string
  defaultSlaMinutes: number
  subscriptionEligible: boolean
  institutionalEligible: boolean
  aiTags: string[]
  createdForHorizon: 'now' | '12_months' | '3_years' | '10_years'
}

export type ServiceOSMission = {
  id: string
  serviceCode: string
  city: string
  clientName: string
  requestedStart: string
  requestedEnd: string
  status: 'requested' | 'qualified' | 'priced' | 'assigned' | 'launched' | 'completed' | 'cancelled'
  assignedStaff?: string
  riskScore: number
  priceMad: number
  marginMad: number
  nextAction: string
}

export type ServiceOSAuditEvent = {
  id: string
  entityType: string
  entityId: string
  action: string
  actor: string
  payload: Record<string, unknown>
  createdAt: string
}
