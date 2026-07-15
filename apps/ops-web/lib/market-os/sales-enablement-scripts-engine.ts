export type MarketOSEngineRecord = Record<string, any>
export type ScriptRisk = "low" | "medium" | "high" | "critical" | string
export type ScriptStage = "draft" | "review" | "approved" | "published" | string

export const salesEnablementScriptsEngineData: MarketOSEngineRecord[] = []

export function formatMad(value: number | string = 0) {
  const amount = Number(value || 0)
  return `${amount.toLocaleString("fr-MA")} MAD`
}

export function getEngineSnapshot(records: MarketOSEngineRecord[] = salesEnablementScriptsEngineData) {
  return {
    ok: true,
    source: "sales-enablement-scripts-engine-compat",
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

export default salesEnablementScriptsEngineData

export const scripts: any[] = []

export function stageLabel(value: any = "") {
  return String(value || "Not configured")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
