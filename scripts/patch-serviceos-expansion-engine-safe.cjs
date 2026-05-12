const fs = require("fs");
const path = require("path");

const root = process.cwd();
const file = path.join(root, "lib/service-os/expansion-engine.ts");

if (!fs.existsSync(file)) {
  throw new Error("Missing lib/service-os/expansion-engine.ts");
}

const content = `import { getServiceBlueprints, getCityDeployments } from "./engine"
import type { ServiceBlueprint, ServiceCityDeployment } from "./types"

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value : fallback
}

function codeOf(bp: ServiceBlueprint): string {
  return text(bp.serviceCode ?? bp.code ?? bp.id, "SERVICE")
}

function readinessOf(bp: ServiceBlueprint, deployment?: ServiceCityDeployment): number {
  const moduleScore = Math.min((bp.modules?.length ?? 0) * 10, 30)
  const workflowScore = Math.min(((bp.defaultWorkflow?.length ?? 0) + (bp.workflows?.length ?? 0)) * 5, 25)
  const complianceScore = (bp.requiredDocuments?.length ?? 0) > 0 || (bp.requiredCertifications?.length ?? 0) > 0 ? 15 : 5
  const deploymentScore = deployment?.active ? 20 : 8
  const riskPenalty = Math.round(numberOr(deployment?.riskScore, 25) * 0.25)

  return Math.max(0, Math.min(100, moduleScore + workflowScore + complianceScore + deploymentScore - riskPenalty))
}

export function getExpansionMatrix() {
  const blueprints = getServiceBlueprints()
  const deployments = getCityDeployments()

  return blueprints.flatMap((bp) => {
    const blueprintDeployments =
      deployments.filter((d: ServiceCityDeployment) => {
        const depCode = text(d.blueprintCode ?? d.serviceCode)
        return !depCode || depCode === codeOf(bp)
      })

    const safeDeployments = blueprintDeployments.length
      ? blueprintDeployments
      : (bp.cityDeployments ?? [])

    return safeDeployments.map((deployment) => {
      const demandScore = numberOr(deployment.demandScore, 65)
      const capacity = numberOr(deployment.capacityScore ?? deployment.capacity, 50)
      const riskScore = numberOr(deployment.riskScore, 25)
      const staffPool = numberOr(deployment.staffAvailable, 10)
      const expansionScore = Math.round(
        demandScore * 0.45 +
        capacity * 0.25 +
        (100 - riskScore) * 0.2 +
        staffPool * 0.1
      )

      return {
        blueprintId: bp.id,
        blueprintCode: codeOf(bp),
        serviceCode: codeOf(bp),
        serviceName: bp.name,
        city: deployment.city,
        active: deployment.active,
        demandScore,
        capacity,
        capacityScore: capacity,
        riskScore,
        staffPool,
        staffAvailable: staffPool,
        readiness: readinessOf(bp, deployment),
        marginTarget: numberOr(bp.marginTarget, 35),
        expansionScore,
        recommendation:
          demandScore >= 85 && capacity >= 60
            ? "Launch / scale priority"
            : riskScore >= 45
              ? "Stabilize operations before launch"
              : "Prepare staffing and commercial activation",
      }
    })
  })
}

export const liveOps = [
  {
    id: "LIVE-001",
    city: "Rabat",
    service: "#S.H",
    status: "live",
    staff: "Hybrid Care Team",
    alert: "none",
  },
  {
    id: "LIVE-002",
    city: "Casablanca",
    service: "#S.SN",
    status: "at-risk",
    staff: "Special Needs Team",
    alert: "capacity pressure",
  },
]

export function getExpansionSnapshot() {
  const matrix = getExpansionMatrix()
  const cities = Array.from(new Set(matrix.map((item) => item.city).filter(Boolean)))

  return {
    matrix,
    liveOps,
    kpis: {
      opportunities: matrix.length,
      activeCities: cities.length,
      priorityLaunches: matrix.filter((item) => item.expansionScore >= 75).length,
      riskZones: matrix.filter((item) => item.riskScore >= 45).length,
    },
  }
}

export function getCityExpansionReadiness(city: string) {
  const cityKey = city.toLowerCase()
  const matrix = getExpansionMatrix().filter((item) => item.city.toLowerCase() === cityKey)

  const averageReadiness = matrix.length
    ? Math.round(matrix.reduce((sum, item) => sum + item.readiness, 0) / matrix.length)
    : 0

  return {
    city,
    averageReadiness,
    services: matrix,
    recommendation:
      averageReadiness >= 75
        ? "Ready for structured expansion"
        : averageReadiness >= 50
          ? "Needs capacity preparation"
          : "Not ready for launch",
  }
}
`;

fs.writeFileSync(file, content, "utf8");
console.log("patched lib/service-os/expansion-engine.ts with safe production expansion engine");
