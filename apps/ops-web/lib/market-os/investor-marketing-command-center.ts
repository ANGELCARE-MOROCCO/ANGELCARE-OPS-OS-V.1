export type MarketOSEngineRecord = Record<string, any>
export type DecisionStatus = "pending" | "approved" | "rejected" | "review" | string
export type ExecutiveRisk = "low" | "medium" | "high" | "critical" | string

export const investorMarketingCommandCenterData: MarketOSEngineRecord[] = []

export function formatMad(value: number | string = 0) {
  const amount = Number(value || 0)
  return `${amount.toLocaleString("fr-MA")} MAD`
}

export function getEngineSnapshot(records: MarketOSEngineRecord[] = investorMarketingCommandCenterData) {
  return {
    ok: true,
    source: "investor-marketing-command-center-compat",
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

export default investorMarketingCommandCenterData

export function decisionLabel(value: any = "") {
  return String(value || "Not configured")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export const executiveDecisions: any[] = []

export const executiveKpis: any[] = []
