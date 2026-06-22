export type CampaignLifecycleRecord = Record<string, any>

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
