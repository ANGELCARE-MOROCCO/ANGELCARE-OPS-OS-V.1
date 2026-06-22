export type MarketOSEngineRecord = Record<string, any>

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
