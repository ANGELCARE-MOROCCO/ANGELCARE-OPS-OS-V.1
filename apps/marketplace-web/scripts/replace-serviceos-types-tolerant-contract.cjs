const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "lib/service-os/types.ts");

const content = `export type ServiceOSRiskLevel = "low" | "medium" | "high" | "critical" | string
export type ServiceOSStatus =
  | "draft"
  | "active"
  | "paused"
  | "archived"
  | "assigned"
  | "live"
  | "incident"
  | "completed"
  | string

export type ServiceCityDeployment = {
  id?: string
  blueprintCode?: string
  serviceCode?: string
  city: string
  active: boolean
  capacity?: number
  capacityScore?: number
  demandScore?: number
  riskScore?: number
  launchPriority?: ServiceOSRiskLevel
  staffAvailable?: number
  staffPool?: number
  notes?: string
  [key: string]: unknown
}

export type CityDeployment = ServiceCityDeployment
export type ServiceDeployment = ServiceCityDeployment

export type ServiceModule = {
  id?: string
  key: string
  code?: string
  name: string
  label?: string
  description?: string
  category?: string
  required?: boolean
  status?: ServiceOSStatus
  tags?: string[]
  [key: string]: unknown
}

export type ServiceRule = {
  id?: string
  key?: string
  code?: string
  name?: string
  label?: string
  condition?: string
  action?: string
  trigger?: string
  type?: string
  status?: ServiceOSStatus
  impact?: ServiceOSRiskLevel
  [key: string]: unknown
}

export type ServiceWorkflowStep =
  | string
  | {
      id?: string
      key?: string
      name?: string
      label?: string
      status?: ServiceOSStatus
      required?: boolean
      slaMinutes?: number
      [key: string]: unknown
    }

export type ServiceBlueprint = {
  id: string
  code?: string
  serviceCode?: string
  name: string
  title?: string
  description?: string
  status?: ServiceOSStatus
  family?: string
  category?: string
  marketSegment?: string
  modules: string[]
  cities: string[]
  workflows: ServiceWorkflowStep[]
  defaultWorkflow: string[]
  rules: string[]
  cityDeployments: ServiceCityDeployment[]
  requiredDocuments: string[]
  requiredCertifications: string[]
  addons: string[]
  automationRules: string[]
  riskFlags: string[]
  complianceLevel?: ServiceOSRiskLevel
  pricingModel?: string
  basePriceMad?: number
  marginTarget?: number
  tags?: string[]
  ownerRole?: string
  updatedAt?: string

  riskLevel?: ServiceOSRiskLevel
  requiredSkills?: string[]
  requiredStaffLevel?: string
  serviceLevel?: string
  operationalComplexity?: ServiceOSRiskLevel
  targetClients?: string[]
  recommendedAddons?: string[]
  slaMinutes?: number
  staffRatio?: string
  contractRequired?: boolean
  insuranceRequired?: boolean
  parentApprovalRequired?: boolean
  schoolCoordinationRequired?: boolean
  medicalValidationRequired?: boolean
  revenuePotential?: ServiceOSRiskLevel
  expansionPriority?: ServiceOSRiskLevel

  [key: string]: unknown
}

export type PricingInput = {
  blueprintCode?: string
  blueprintId?: string
  serviceId?: string
  serviceCode?: string
  city?: string
  basePrice?: number
  basePriceMad?: number
  urgent?: boolean
  urgency?: "standard" | "same_day" | "urgent" | "high" | string
  night?: boolean
  transport?: boolean
  specialNeeds?: boolean
  complexity?: ServiceOSRiskLevel
  subscription?: boolean
  quantity?: number
  hours?: number
  [key: string]: unknown
}

export type CalculatedServicePrice = {
  base?: number
  basePrice?: number
  subtotal?: number
  totalMad: number
  finalPriceMad: number
  amount?: number
  total?: number
  currency?: string
  modifiers: Array<{ label: string; amount: number; type?: string; reason?: string; [key: string]: unknown }>
  margin?: number
  marginMad?: number
  riskLevel?: ServiceOSRiskLevel
  notes?: string[]
  [key: string]: unknown
}

export type PricingResult = CalculatedServicePrice
export type ServicePricingInput = PricingInput
export type ServicePricingResult = PricingResult

export type ServiceReadinessReport = {
  blueprintId: string
  blueprintCode: string
  blueprintName: string
  readinessScore: number
  status: ServiceOSRiskLevel | "ready" | "incomplete"
  missing: string[]
  risks: string[]
  recommendations: string[]
  [key: string]: unknown
}

export type ServiceMission = {
  id: string
  blueprintId?: string
  serviceCode?: string
  clientName?: string
  city?: string
  status?: ServiceOSStatus
  riskScore?: number
  assignedStaff?: string
  scheduledAt?: string
  [key: string]: unknown
}
`;

fs.writeFileSync(file, content, "utf8");
console.log("Replaced lib/service-os/types.ts with tolerant production ServiceOS contract.");
