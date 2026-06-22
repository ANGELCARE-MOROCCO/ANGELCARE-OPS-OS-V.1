export type MarketOSEngineRecord = Record<string, any>
export type ExpansionMarket = string
export type ExpansionRisk = "low" | "medium" | "high" | "critical" | string
export type ExpansionStage = "research" | "validation" | "pilot" | "launch_ready" | "launched" | "paused" | string

export const marketExpansionCityOpportunityEngineData: MarketOSEngineRecord[] = []

export function formatMad(value: number | string = 0) {
  const amount = Number(value || 0)
  return `${amount.toLocaleString("fr-MA")} MAD`
}

export function getEngineSnapshot(records: MarketOSEngineRecord[] = marketExpansionCityOpportunityEngineData) {
  return {
    ok: true,
    source: "market-expansion-city-opportunity-engine-compat",
    records,
    items: records,
    data: records,
    totals: {
      count: records.length,
      total: records.length,
      active: records.filter((item: any) => String(item.status || "").toLowerCase() === "active").length,
    },
    updatedAt: new Date().toISOString(),
  }
}

export default marketExpansionCityOpportunityEngineData

export const cityOpportunities: any[] = []

export function countryLabel(value: any = "") {
  return String(value || "Not configured")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function stageLabel(value: any = "") {
  return String(value || "Not configured")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
