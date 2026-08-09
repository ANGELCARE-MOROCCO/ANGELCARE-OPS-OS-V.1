const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "lib/service-os/commercial-engine.ts");

if (!fs.existsSync(file)) {
  throw new Error("Missing lib/service-os/commercial-engine.ts");
}

let src = fs.readFileSync(file, "utf8");

if (!src.includes("export const packages")) {
  src += `

export const packages = serviceMembershipPlans.map((plan) => ({
  id: plan.id,
  name: plan.name,
  priceMad: plan.priceMad,
  includes: plan.includes,
  type: plan.id.includes("institutional") ? "b2b" : "family",
  status: "active",
}))
`;
}

if (!src.includes("export function getRevenueSnapshot")) {
  src += `

export function getRevenueSnapshot() {
  const intelligence = getCommercialIntelligence()
  const opportunities = getSubscriptionOpportunities()
  const packageRevenuePotential = packages.reduce((sum, item) => sum + (typeof item.priceMad === "number" ? item.priceMad : 0), 0)

  return {
    ok: true,
    serviceCount: intelligence.serviceCount,
    targetMargin: intelligence.targetMargin,
    packageCount: packages.length,
    packageRevenuePotential,
    topUpsell: intelligence.topUpsell,
    revenuePriorities: intelligence.revenuePriorities,
    opportunities,
    updatedAt: new Date().toISOString(),
  }
}
`;
}

fs.writeFileSync(file, src, "utf8");
console.log("patched lib/service-os/commercial-engine.ts with legacy API exports: getRevenueSnapshot and packages");
