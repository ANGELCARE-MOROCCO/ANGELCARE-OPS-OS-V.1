export type MarketingDeepOperationalSnapshot = {
  ok: boolean
  loadedAt: string
  module: "market-os"
  status: "live"
  sync: Array<{
    label: string
    value: string | number
    tone: "emerald" | "blue" | "amber" | "rose" | "slate" | "violet"
  }>
  metrics: {
    campaigns: number
    activeCampaigns: number
    launchReady: number
    highRisk: number
    tasksDue: number
    approvalsDue: number
    totalBudgetMad: number
    totalSpendMad: number
    leads: number
    roas: number
  }
  alerts: Array<{
    id: string
    title: string
    severity: "low" | "medium" | "high"
    message: string
  }>
}

export async function getMarketingDeepOperationalSnapshot(): Promise<MarketingDeepOperationalSnapshot> {
  const metrics = {
    campaigns: 0,
    activeCampaigns: 0,
    launchReady: 0,
    highRisk: 0,
    tasksDue: 0,
    approvalsDue: 0,
    totalBudgetMad: 0,
    totalSpendMad: 0,
    leads: 0,
    roas: 0,
  }

  return {
    ok: true,
    loadedAt: new Date().toISOString(),
    module: "market-os",
    status: "live",
    metrics,
    sync: [
      { label: "Campaigns", value: metrics.campaigns, tone: "blue" },
      { label: "Active", value: metrics.activeCampaigns, tone: "emerald" },
      { label: "Launch ready", value: metrics.launchReady, tone: "violet" },
      { label: "High risk", value: metrics.highRisk, tone: "slate" },
      { label: "Tasks due", value: metrics.tasksDue, tone: "amber" },
      { label: "Budget MAD", value: metrics.totalBudgetMad, tone: "emerald" },
    ],
    alerts: [],
  }
}
