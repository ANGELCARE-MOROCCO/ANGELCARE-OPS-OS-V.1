export type MarketOSEngineRecord = Record<string, any>
export type OpportunityLevel = "low" | "medium" | "high" | "critical" | string
export type ResearchStatus = "draft" | "review" | "approved" | "published" | string
export type ResearchType = string

export const researchCompetitiveIntelligenceEngineData: MarketOSEngineRecord[] = []

export function formatMad(value: number | string = 0) {
  const amount = Number(value || 0)
  return `${amount.toLocaleString("fr-MA")} MAD`
}

export function getEngineSnapshot(records: MarketOSEngineRecord[] = researchCompetitiveIntelligenceEngineData) {
  return {
    ok: true,
    source: "research-competitive-intelligence-engine-compat",
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

export default researchCompetitiveIntelligenceEngineData

export const researchSignals: any[] = []

export function statusLabel(value: any = "") {
  return String(value || "Not configured")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function typeLabel(value: any = "") {
  return String(value || "Not configured")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
