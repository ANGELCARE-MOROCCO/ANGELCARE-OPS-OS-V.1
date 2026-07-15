export type MarketOSEngineRecord = Record<string, any>
export type AttributionRisk = "low" | "medium" | "high" | "critical" | "clean" | "missing" | "conflict" | "partial" | string
export type AttributionSource = string
export type AttributionStatus = "clean" | "partial" | "missing" | "conflict" | string

export const dataPipelineAttributionEngineData: MarketOSEngineRecord[] = []

export function formatMad(value: number | string = 0) {
  const amount = Number(value || 0)
  return `${amount.toLocaleString("fr-MA")} MAD`
}

export function getEngineSnapshot(records: MarketOSEngineRecord[] = dataPipelineAttributionEngineData) {
  return {
    ok: true,
    source: "data-pipeline-attribution-engine-compat",
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

export default dataPipelineAttributionEngineData

export const attributionRecords: any[] = []

export function sourceLabel(value: any = "") {
  return String(value || "Not configured")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function statusLabel(value: any = "") {
  return String(value || "Not configured")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
