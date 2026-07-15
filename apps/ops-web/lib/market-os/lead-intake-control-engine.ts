export type MarketOSEngineRecord = Record<string, any>
export type LeadRisk = "low" | "medium" | "high" | "critical" | string
export type LeadSource = string
export type LeadStage = "new" | "contacted" | "qualified" | "appointment" | "converted" | "assigned" | string

export const leadIntakeControlEngineData: MarketOSEngineRecord[] = []

export function formatMad(value: number | string = 0) {
  const amount = Number(value || 0)
  return `${amount.toLocaleString("fr-MA")} MAD`
}

export function getEngineSnapshot(records: MarketOSEngineRecord[] = leadIntakeControlEngineData) {
  return {
    ok: true,
    source: "lead-intake-control-engine-compat",
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

export default leadIntakeControlEngineData

export const marketLeads: any[] = []

export function sourceLabel(value: any = "") {
  return String(value || "Not configured")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function stageLabel(value: any = "") {
  return String(value || "Not configured")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
