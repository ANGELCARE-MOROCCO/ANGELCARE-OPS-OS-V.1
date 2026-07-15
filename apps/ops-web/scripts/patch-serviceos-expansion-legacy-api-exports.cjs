const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "lib/service-os/expansion-engine.ts");
if (!fs.existsSync(file)) throw new Error("Missing lib/service-os/expansion-engine.ts");

let src = fs.readFileSync(file, "utf8");

if (!src.includes("export function getExpansionRecommendations")) {
  src += `

export function getExpansionRecommendations() {
  return getExpansionMatrix()
    .sort((a, b) => b.expansionScore - a.expansionScore)
    .slice(0, 12)
    .map((item) => ({
      id: \`expansion-\${item.city}-\${item.serviceCode}\`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      city: item.city,
      serviceCode: item.serviceCode,
      serviceName: item.serviceName,
      score: item.expansionScore,
      readiness: item.readiness,
      demandScore: item.demandScore,
      capacityScore: item.capacityScore,
      riskScore: item.riskScore,
      recommendation: item.recommendation,
      priority:
        item.expansionScore >= 80
          ? "critical"
          : item.expansionScore >= 70
            ? "high"
            : item.expansionScore >= 55
              ? "medium"
              : "low",
    }))
}
`;
}

if (!src.includes("export function getLiveOpsSnapshot")) {
  src += `

export function getLiveOpsSnapshot() {
  return {
    liveOps,
    total: liveOps.length,
    active: liveOps.filter((item) => item.status === "live").length,
    atRisk: liveOps.filter((item) => item.status === "at-risk" || item.alert !== "none").length,
    cities: Array.from(new Set(liveOps.map((item) => item.city).filter(Boolean))),
    updatedAt: new Date().toISOString(),
  }
}
`;
}

fs.writeFileSync(file, src, "utf8");
console.log("patched lib/service-os/expansion-engine.ts with legacy API exports");
