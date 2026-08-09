export type MarketOSEngineRecord = Record<string, any>
export type PrRisk = "low" | "medium" | "high" | "critical" | string
export type PrStage = "draft" | "review" | "approved" | "published" | string
export type PrType = string

export const prReputationAuthorityEngineData: MarketOSEngineRecord[] = []

export function formatMad(value: number | string = 0) {
  const amount = Number(value || 0)
  return `${amount.toLocaleString("fr-MA")} MAD`
}

export function getEngineSnapshot(records: MarketOSEngineRecord[] = prReputationAuthorityEngineData) {
  return {
    ok: true,
    source: "pr-reputation-authority-engine-compat",
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

export default prReputationAuthorityEngineData

export const prOpportunities: any[] = []

export function stageLabel(value: any = "") {
  return String(value || "Not configured")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function typeLabel(value: any = "") {
  return String(value || "Not configured")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
