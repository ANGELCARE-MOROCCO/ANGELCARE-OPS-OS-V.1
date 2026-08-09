export type CampaignLifecycleRecord = Record<string, any>
export type CampaignStage = "planning" | "production" | "approval" | "launch-ready" | "live" | "optimization" | string
export type CampaignRisk = "low" | "medium" | "high" | "critical" | string

export const campaignLifecycleEngineData: CampaignLifecycleRecord[] = []

export function deriveCampaignLifecycleSnapshot(campaigns: CampaignLifecycleRecord[] = []) {
  return {
    ok: true,
    campaigns,
    active: campaigns.filter((campaign: any) => String(campaign.status || "").toLowerCase() === "active").length,
    budget: campaigns.reduce((sum: number, campaign: any) => sum + Number(campaign.budget || 0), 0),
    leads: campaigns.reduce((sum: number, campaign: any) => sum + Number(campaign.leads || 0), 0),
    risks: campaigns.filter((campaign: any) => String(campaign.risk || "").toLowerCase() === "high"),
  }
}

export default {
  campaignLifecycleEngineData,
  deriveCampaignLifecycleSnapshot,
}

export const campaigns: any[] = []

export function formatMad(value: number | string = 0) {
  const amount = Number(value || 0)
  return `${amount.toLocaleString("fr-MA")} MAD`
}

export function stageLabel(value: any = "") {
  return String(value || "Not configured")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
