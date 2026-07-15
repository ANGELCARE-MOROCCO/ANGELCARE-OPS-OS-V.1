const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "lib/service-os/types.ts");
if (!fs.existsSync(file)) {
  throw new Error("Missing lib/service-os/types.ts");
}

let src = fs.readFileSync(file, "utf8");

if (!src.includes("export type PricingInput")) {
  src += `

export type PricingInput = {
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
  complexity?: ServiceOSRiskLevel | string
  subscription?: boolean
  quantity?: number
  hours?: number
  [key: string]: unknown
}
`;
}

if (!src.includes("export type PricingResult")) {
  src += `

export type PricingResult = CalculatedServicePrice & {
  totalMad: number
  finalPriceMad: number
  total?: number
  base?: number
  basePrice?: number
  currency?: string
  notes?: string[]
}
`;
}

fs.writeFileSync(file, src, "utf8");
console.log("patched lib/service-os/types.ts with PricingInput and PricingResult exports");
