export type MarketOSEngineRecord = Record<string, any>
export type ExecutionStatus = "todo" | "doing" | "review" | "approved" | "blocked" | "done" | string

export const strategyExecutionEngineData: MarketOSEngineRecord[] = []

export function formatMad(value: number | string = 0) {
  const amount = Number(value || 0)
  return `${amount.toLocaleString("fr-MA")} MAD`
}

export function getEngineSnapshot(records: MarketOSEngineRecord[] = strategyExecutionEngineData) {
  return {
    ok: true,
    source: "strategy-execution-engine-compat",
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

export default strategyExecutionEngineData

export const executionTasks: any[] = []

export function getSlaRisk(input: any = {}, ...args: any[]) {
  const score = Number(input?.score || input?.progress || 0)
  if (typeof input === "string") return input
  if (score >= 75) return "critical"
  if (score >= 50) return "high"
  if (score >= 25) return "medium"
  return "low"
}

export function statusLabel(value: any = "") {
  return String(value || "Not configured")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
