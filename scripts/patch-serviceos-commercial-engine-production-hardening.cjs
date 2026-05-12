const fs = require("fs");
const path = require("path");

const root = process.cwd();

function writeFile(rel, content) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
  console.log("patched", rel);
}

const commercialEngine = `import { listServiceBlueprints } from "./blueprint-engine"
import type { ServiceBlueprint } from "./types"

type PricingContext = {
  basePrice?: number
  city?: string
  urgency?: "standard" | "same_day" | "urgent" | "high" | string
  urgent?: boolean
  night?: boolean
  transport?: boolean
  specialNeeds?: boolean
  complexity?: "low" | "medium" | "high" | "critical" | string
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function safeBlueprints(): ServiceBlueprint[] {
  return listServiceBlueprints()
}

export function calculateDynamicServicePrice(ctx: PricingContext = {}) {
  const notes: string[] = []
  let price = numberOr(ctx.basePrice, 450)

  if (ctx.urgency === "same_day" || ctx.urgency === "urgent" || ctx.urgency === "high" || ctx.urgent) {
    price *= 1.2
    notes.push("same-day / urgent +20%")
  }

  if (ctx.night) {
    price += 120
    notes.push("night shift +120 MAD")
  }

  if (ctx.transport) {
    price += 80
    notes.push("transport coordination +80 MAD")
  }

  if (ctx.specialNeeds) {
    price += 180
    notes.push("special needs complexity +180 MAD")
  }

  if (ctx.complexity === "high") {
    price += 100
    notes.push("high complexity +100 MAD")
  }

  if (ctx.complexity === "critical") {
    price += 220
    notes.push("critical complexity +220 MAD")
  }

  const totalMad = Math.round(price)
  return {
    base: numberOr(ctx.basePrice, 450),
    total: totalMad,
    totalMad,
    finalPriceMad: totalMad,
    modifiers: notes.map((label) => ({ label, amount: 0 })),
    notes,
    currency: "MAD",
  }
}

export const serviceMembershipPlans = [
  {
    id: "family-premium",
    name: "AngelCare Premium Family",
    priceMad: 2900,
    includes: ["priority booking", "20h care credit", "emergency hotline", "monthly quality review"],
  },
  {
    id: "institutional-care",
    name: "Institutional Care Partner",
    priceMad: 12000,
    includes: ["dedicated SLA", "staff pool planning", "monthly executive reporting", "incident governance"],
  },
]

export function getCommercialIntelligence() {
  const b = safeBlueprints()
  const targets = b.map((x) => numberOr(x.marginTarget, 35))
  const targetMargin = targets.length
    ? Math.round(targets.reduce((sum, value) => sum + value, 0) / targets.length)
    : 35

  return {
    serviceCount: b.length,
    targetMargin,
    topUpsell: ["bilingual support", "transport coordination", "emergency protocol", "premium reporting"],
    recommendedPlans: serviceMembershipPlans,
    revenuePriorities: [
      "Convert high-frequency families into Premium Family plans",
      "Package special needs services with reporting and transport",
      "Prioritize B2B institutional contracts in Rabat and Casablanca",
    ],
  }
}

export function getSubscriptionOpportunities() {
  const blueprints = safeBlueprints()
  return blueprints.map((bp) => ({
    blueprintId: bp.id,
    serviceCode: bp.serviceCode ?? bp.code ?? bp.id,
    name: bp.name,
    recommendedPlan: bp.marketSegment?.toLowerCase().includes("institution")
      ? "Institutional Care Partner"
      : "AngelCare Premium Family",
    targetMargin: numberOr(bp.marginTarget, 35),
  }))
}
`;

writeFile("lib/service-os/commercial-engine.ts", commercialEngine);
console.log("ServiceOS Fix 26 applied: commercial-engine.ts replaced with production-hardened version.");
