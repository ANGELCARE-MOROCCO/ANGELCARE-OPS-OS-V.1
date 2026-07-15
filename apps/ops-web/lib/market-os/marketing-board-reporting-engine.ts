export type MarketOSEngineRecord = Record<string, any>
export type ReportRisk = "low" | "medium" | "high" | "critical" | string
export type ReportStatus = "draft" | "review" | "approved" | "exported" | string
export type ReportType = "daily" | "weekly" | "monthly" | "investor" | "campaign" | "risk" | string

export const marketingBoardReportingEngineData: MarketOSEngineRecord[] = []

export function formatMad(value: number | string = 0) {
  const amount = Number(value || 0)
  return `${amount.toLocaleString("fr-MA")} MAD`
}

export function getEngineSnapshot(records: MarketOSEngineRecord[] = marketingBoardReportingEngineData) {
  return {
    ok: true,
    source: "marketing-board-reporting-engine-compat",
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

export default marketingBoardReportingEngineData

export const reports: any[] = []

export function buildReportSummary(input: any = {}, ...args: any[]) {
  return {
    ok: true,
    source: "reports-compat",
    score: Number(input?.score || input?.progress || 0),
    label: input?.label || input?.status || "Not configured",
    tone: input?.tone || "slate",
    progress: Number(input?.progress || 0),
    data: input,
    args,
  }
}

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
