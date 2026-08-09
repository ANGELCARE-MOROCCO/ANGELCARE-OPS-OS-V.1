export type MarketOSEngineRecord = Record<string, any>
export type ExperimentRisk = "low" | "medium" | "high" | "critical" | "won" | "lost" | string
export type ExperimentStage = "live" | "analysis" | "iteration" | "won" | "lost" | string

export const growthExperimentLabData: MarketOSEngineRecord[] = []

export function formatMad(value: number | string = 0) {
  const amount = Number(value || 0)
  return `${amount.toLocaleString("fr-MA")} MAD`
}

export function getEngineSnapshot(records: MarketOSEngineRecord[] = growthExperimentLabData) {
  return {
    ok: true,
    source: "growth-experiment-lab-compat",
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

export default growthExperimentLabData

export const experiments: any[] = []

export function stageLabel(value: any = "") {
  return String(value || "Not configured")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
