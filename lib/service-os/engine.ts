import {
  angelCareServiceBlueprints,
  angelCareServiceModules,
  angelCareServiceRules,
  angelCareCityDeployments,
} from "./compat"
import type { PricingInput, PricingResult, ServiceBlueprint, ServiceMission, ServiceWorkflowStep, ServiceCityDeployment } from "./types"

type NormalizedServiceBlueprint = ServiceBlueprint & {
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
}

function asText(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function normalizeCode(value: unknown): string {
  return asText(value).toLowerCase().replace("#", "").trim()
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function asWorkflowArray(value: unknown): ServiceWorkflowStep[] {
  return Array.isArray(value) ? value as ServiceWorkflowStep[] : []
}

function asDeploymentArray(value: unknown): ServiceCityDeployment[] {
  return Array.isArray(value) ? value as ServiceCityDeployment[] : []
}

function normalizeBlueprint(bp: ServiceBlueprint): NormalizedServiceBlueprint {
  return {
    ...bp,
    modules: asStringArray(bp.modules),
    cities: asStringArray(bp.cities),
    workflows: asWorkflowArray(bp.workflows),
    defaultWorkflow: asStringArray(bp.defaultWorkflow),
    rules: asStringArray(bp.rules),
    cityDeployments: asDeploymentArray(bp.cityDeployments),
    requiredDocuments: asStringArray(bp.requiredDocuments),
    requiredCertifications: asStringArray(bp.requiredCertifications),
    addons: asStringArray(bp.addons),
    automationRules: asStringArray(bp.automationRules),
    riskFlags: asStringArray(bp.riskFlags),
  }
}

function blueprintCodeOf(bp: Partial<ServiceBlueprint> | undefined): string {
  return asText(bp?.serviceCode ?? bp?.code ?? bp?.id ?? bp?.name)
}

export function getServiceBlueprints(): NormalizedServiceBlueprint[] {
  return (angelCareServiceBlueprints as ServiceBlueprint[]).map(normalizeBlueprint)
}

export function getServiceModules() {
  return angelCareServiceModules
}

export function getServiceRules() {
  return angelCareServiceRules
}

export function getCityDeployments() {
  return angelCareCityDeployments
}

export function findBlueprint(codeOrId?: string): ServiceBlueprint | undefined {
  const lookup = normalizeCode(codeOrId)
  const blueprints = getServiceBlueprints()

  if (!lookup) return blueprints[0]

  return blueprints.find((bp) => {
    const candidates = [bp.id, bp.code, bp.serviceCode, bp.name]
      .map(normalizeCode)
      .filter(Boolean)

    return candidates.includes(lookup)
  })
}

export function calculateServicePrice(input: PricingInput = {}): PricingResult {
  const requestedCode =
    asText(input.blueprintCode) ||
    asText(input.blueprintId) ||
    asText(input.serviceCode) ||
    asText(input.serviceId)

  const bp = findBlueprint(requestedCode) || getServiceBlueprints()[0]

  const baseFromInput =
    asNumber(input.basePrice, 0) ||
    asNumber(input.basePriceMad, 0)

  const base =
    baseFromInput ||
    asNumber(bp?.basePriceMad, 450)

  const modifiers: PricingResult["modifiers"] = []

  if (input.urgent || input.urgency === "urgent" || input.urgency === "same_day" || input.urgency === "high") {
    modifiers.push({ label: "Urgence", amount: 100 })
  }

  if (input.night) {
    modifiers.push({ label: "Nuit", amount: 90 })
  }

  if (input.transport) {
    modifiers.push({ label: "Transport", amount: 70 })
  }

  if (input.specialNeeds) {
    modifiers.push({ label: "Besoins spécifiques", amount: 150 })
  }

  if (input.complexity === "high") {
    modifiers.push({ label: "Complexité élevée", amount: 100 })
  }

  if (input.complexity === "critical") {
    modifiers.push({ label: "Complexité critique", amount: 220 })
  }

  if (input.subscription) {
    modifiers.push({ label: "Avantage abonnement", amount: -60 })
  }

  const quantityMultiplier = Math.max(1, asNumber(input.quantity, 1))
  const hoursMultiplier = Math.max(1, asNumber(input.hours, 1))

  const modifierTotal = modifiers.reduce((sum, item) => sum + asNumber(item.amount, 0), 0)
  const totalMad = Math.max(0, Math.round((base + modifierTotal) * quantityMultiplier * hoursMultiplier))
  const marginTarget = asNumber(bp?.marginTarget, 35)
  const marginMad = Math.round(totalMad * (marginTarget / 100))

  return {
    base,
    basePrice: base,
    subtotal: base + modifierTotal,
    total: totalMad,
    totalMad,
    finalPriceMad: totalMad,
    amount: totalMad,
    currency: "MAD",
    modifiers,
    margin: marginTarget,
    marginMad,
    riskLevel: input.complexity === "critical" ? "critical" : input.complexity === "high" ? "high" : "medium",
  }
}

export function getServiceMissions(): ServiceMission[] {
  const blueprints = getServiceBlueprints()

  return [
    {
      id: "mission-rabat-premium-001",
      serviceCode: blueprintCodeOf(blueprints[0]),
      clientName: "Famille Premium Rabat",
      city: "Rabat",
      status: "assigned",
      riskScore: 18,
      assignedStaff: "Care Team A",
    },
    {
      id: "mission-casa-special-002",
      serviceCode: blueprintCodeOf(blueprints[1] ?? blueprints[0]),
      clientName: "Client Casablanca",
      city: "Casablanca",
      status: "live",
      riskScore: 32,
      assignedStaff: "Care Team B",
    },
  ]
}

export function recommendServiceForNeed(input: string | {
  city?: string
  specialNeeds?: boolean
  urgency?: string
  segment?: string
  query?: string
} = {}) {
  const normalizedInput =
    typeof input === "string"
      ? { query: input, specialNeeds: /special|spécial|besoin|handicap|autism|autisme/i.test(input) }
      : input

  const blueprints = getServiceBlueprints()
  const city = normalizeCode(normalizedInput.city)
  const segment = normalizeCode(normalizedInput.segment ?? normalizedInput.query)

  return blueprints
    .map((blueprint) => {
      let score = 62

      if (city && blueprint.cities?.map(normalizeCode).includes(city)) score += 14
      if (normalizedInput.specialNeeds && blueprint.modules?.includes("special_needs")) score += 16
      if (normalizedInput.urgency && blueprint.modules?.includes("emergency_protocol")) score += 10
      if (segment && normalizeCode(blueprint.marketSegment).includes(segment)) score += 8
      if (segment && normalizeCode(blueprint.name).includes(segment)) score += 6
      if (segment && normalizeCode(blueprint.description).includes(segment)) score += 4

      return {
        score: Math.min(score, 99),
        blueprint,
        price: calculateServicePrice({
          blueprintCode: blueprint.serviceCode ?? blueprint.code ?? blueprint.id,
          city: normalizedInput.city,
          urgent: normalizedInput.urgency === "urgent" || normalizedInput.urgency === "same_day",
          specialNeeds: normalizedInput.specialNeeds,
        }),
      }
    })
    .sort((a, b) => b.score - a.score)
}

export function getServiceOSSnapshot() {
  const blueprints = getServiceBlueprints()
  const modules = getServiceModules()
  const rules = getServiceRules()
  const deployments = getCityDeployments()
  const missions = getServiceMissions()

  return {
    blueprints,
    modules,
    rules,
    deployments,
    missions,
    recommendations: recommendServiceForNeed({ city: "Rabat", specialNeeds: true }).slice(0, 3),
    kpis: {
      blueprints: blueprints.length,
      modules: modules.length,
      rules: rules.length,
      deployments: deployments.length,
      activeMissions: missions.filter((m) => ["assigned", "live", "incident"].includes(m.status ?? "")).length,
    },
  }
}
