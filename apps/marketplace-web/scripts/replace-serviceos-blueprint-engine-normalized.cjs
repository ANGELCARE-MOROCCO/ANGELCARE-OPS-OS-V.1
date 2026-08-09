const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "lib/service-os/blueprint-engine.ts");
if (!fs.existsSync(file)) throw new Error("Missing lib/service-os/blueprint-engine.ts");

const content = `import { angelcareBlueprints, angelcareServiceModules } from "./seed"
import type {
  ServiceBlueprint,
  ServiceModule,
  ServiceReadinessReport,
  ServiceCityDeployment,
  ServiceWorkflowStep,
} from "./types"

type NormalizedBlueprint = ServiceBlueprint & {
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

function text(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function arrayOfStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function workflowArray(value: unknown): ServiceWorkflowStep[] {
  return Array.isArray(value) ? (value as ServiceWorkflowStep[]) : []
}

function workflowNames(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item: ServiceWorkflowStep) =>
      typeof item === "string" ? item : text(item?.label ?? item?.name ?? item?.key ?? item?.id)
    )
    .filter(Boolean)
}

function deployments(value: unknown): ServiceCityDeployment[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item: any) => ({
      id: text(item?.id),
      blueprintCode: text(item?.blueprintCode ?? item?.serviceCode),
      serviceCode: text(item?.serviceCode ?? item?.blueprintCode),
      city: text(item?.city),
      active: Boolean(item?.active),
      capacity: typeof item?.capacity === "number" ? item.capacity : undefined,
      capacityScore: typeof item?.capacityScore === "number" ? item.capacityScore : undefined,
      demandScore: typeof item?.demandScore === "number" ? item.demandScore : undefined,
      riskScore: typeof item?.riskScore === "number" ? item.riskScore : 0,
      launchPriority: item?.launchPriority,
      staffAvailable: typeof item?.staffAvailable === "number" ? item.staffAvailable : undefined,
      notes: text(item?.notes),
    }))
    .filter((item) => item.city.length > 0)
}

export function normalizeServiceBlueprint(input: Partial<ServiceBlueprint> & Record<string, any>): NormalizedBlueprint {
  const id = text(input.id ?? input.code ?? input.serviceCode ?? input.name ?? "service-blueprint")
  const code = text(input.code ?? input.serviceCode ?? id)
  const rawWorkflows = workflowArray(input.workflows)
  const defaultWorkflow = arrayOfStrings(input.defaultWorkflow)

  return {
    ...(input as ServiceBlueprint),
    id,
    code,
    serviceCode: text(input.serviceCode ?? code),
    name: text(input.name ?? input.title ?? code),
    title: text(input.title ?? input.name ?? code),
    description: text(input.description),
    status: input.status ?? "active",
    family: text(input.family ?? input.category),
    category: text(input.category ?? input.family),
    marketSegment: text(input.marketSegment ?? input.category ?? input.family),
    modules: arrayOfStrings(input.modules),
    cities: arrayOfStrings(input.cities),
    workflows: rawWorkflows,
    defaultWorkflow: defaultWorkflow.length ? defaultWorkflow : workflowNames(rawWorkflows),
    rules: arrayOfStrings(input.rules),
    cityDeployments: deployments(input.cityDeployments),
    requiredDocuments: arrayOfStrings(input.requiredDocuments),
    requiredCertifications: arrayOfStrings(input.requiredCertifications),
    addons: arrayOfStrings(input.addons),
    automationRules: arrayOfStrings(input.automationRules),
    riskFlags: arrayOfStrings(input.riskFlags),
    complianceLevel: input.complianceLevel ?? input.riskLevel ?? "medium",
    pricingModel: text(input.pricingModel),
    basePriceMad: typeof input.basePriceMad === "number" ? input.basePriceMad : undefined,
    marginTarget: typeof input.marginTarget === "number" ? input.marginTarget : undefined,
    tags: arrayOfStrings(input.tags),
    ownerRole: text(input.ownerRole),
    updatedAt: text(input.updatedAt),
  }
}

export function listServiceBlueprints(): NormalizedBlueprint[] {
  return (angelcareBlueprints as Array<Partial<ServiceBlueprint> & Record<string, any>>).map(normalizeServiceBlueprint)
}

export function getServiceBlueprint(idOrCode: string): NormalizedBlueprint | undefined {
  const lookup = text(idOrCode).toLowerCase().replace("#", "")
  if (!lookup) return undefined

  return listServiceBlueprints().find((b) => {
    const candidates = [b.id, b.code, b.serviceCode, b.name]
      .map((value) => text(value).toLowerCase().replace("#", ""))
      .filter(Boolean)
    return candidates.includes(lookup)
  })
}

export function getModuleDetails(keys: string[] = []): ServiceModule[] {
  const wanted = new Set(arrayOfStrings(keys))
  return (angelcareServiceModules as Array<Partial<ServiceModule> & Record<string, any>>)
    .map((m) => ({
      id: text(m.id ?? m.key ?? m.code),
      key: text(m.key ?? m.code ?? m.id),
      code: text(m.code ?? m.key ?? m.id),
      name: text(m.name ?? m.label ?? m.key ?? m.code),
      label: text(m.label ?? m.name ?? m.key ?? m.code),
      description: text(m.description),
      category: text(m.category),
      required: Boolean(m.required),
      status: m.status ?? "active",
      tags: arrayOfStrings(m.tags),
    }))
    .filter((m) => m.key && wanted.has(m.key))
}

export function getServiceReadinessReport(idOrCode: string): ServiceReadinessReport {
  const bp = getServiceBlueprint(idOrCode)
  if (!bp) {
    return {
      blueprintId: text(idOrCode),
      blueprintCode: text(idOrCode),
      blueprintName: "Unknown service blueprint",
      readinessScore: 0,
      status: "critical",
      missing: ["blueprint introuvable"],
      risks: ["service non configuré"],
      recommendations: ["Créer ou synchroniser le blueprint avant exploitation."],
    }
  }

  const missing: string[] = []
  const risks: string[] = []
  const recommendations: string[] = []

  if (!bp.modules.length) missing.push("modules configurables")
  if (!bp.defaultWorkflow.length && !bp.workflows.length) missing.push("workflow lifecycle")
  if (!bp.rules.length) missing.push("règles opérationnelles")
  if (!bp.requiredDocuments.length) recommendations.push("Ajouter les documents requis.")
  if (!bp.requiredCertifications.length) recommendations.push("Ajouter les certifications staff requises.")

  const activeDeployments = bp.cityDeployments.filter((c) => c.active)
  if (!activeDeployments.length && !bp.cities.length) missing.push("ville active")

  if (bp.complianceLevel === "critical" && !bp.modules.includes("emergency_protocol")) {
    risks.push("compliance critique sans protocole d'urgence")
  }

  if (bp.cityDeployments.some((c) => (c.riskScore ?? 0) > 45)) {
    risks.push("zone avec risque opérationnel élevé")
  }

  const readinessScore = Math.max(
    0,
    100 -
      missing.length * 18 -
      risks.length * 14 -
      (recommendations.length ? 6 : 0)
  )

  return {
    blueprintId: bp.id,
    blueprintCode: bp.serviceCode ?? bp.code ?? bp.id,
    blueprintName: bp.name,
    readinessScore,
    status: readinessScore >= 85 ? "ready" : readinessScore >= 60 ? "medium" : "critical",
    missing,
    risks,
    recommendations,
  }
}
`;

fs.writeFileSync(file, content, "utf8");
console.log("Replaced lib/service-os/blueprint-engine.ts with normalized optional-array safe version.");
