export type MarketOSEngineRecord = Record<string, any>
export type RiskLevel = "low" | "medium" | "high" | "critical" | string
export type SignalStatus = "open" | "monitoring" | "resolved" | string
export type SignalType = string

export const riskSignalsAiEngineData: MarketOSEngineRecord[] = []

export function formatMad(value: number | string = 0) {
  const amount = Number(value || 0)
  return `${amount.toLocaleString("fr-MA")} MAD`
}

export function getEngineSnapshot(records: MarketOSEngineRecord[] = riskSignalsAiEngineData) {
  return {
    ok: true,
    source: "risk-signals-ai-engine-compat",
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

export default riskSignalsAiEngineData

export function riskLabel(value: any = "") {
  return String(value || "Not configured")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export const riskSignals: any[] = []

export function statusLabel(value: any = "") {
  return String(value || "Not configured")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
