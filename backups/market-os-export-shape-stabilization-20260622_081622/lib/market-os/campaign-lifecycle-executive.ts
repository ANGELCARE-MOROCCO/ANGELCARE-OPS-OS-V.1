export type CampaignLifecycleExecutiveRecord = Record<string, any>

export const executiveCampaigns: CampaignLifecycleExecutiveRecord[] = []
export const executiveWarnings: CampaignLifecycleExecutiveRecord[] = []
export const executiveTasks: CampaignLifecycleExecutiveRecord[] = []
export const executiveAssets: CampaignLifecycleExecutiveRecord[] = []
export const executiveExperiments: CampaignLifecycleExecutiveRecord[] = []

export function deriveCampaignLifecycleExecutiveSnapshot() {
  return {
    ok: true,
    campaigns: executiveCampaigns,
    warnings: executiveWarnings,
    tasks: executiveTasks,
    assets: executiveAssets,
    experiments: executiveExperiments,
  }
}

export default {
  executiveCampaigns,
  executiveWarnings,
  executiveTasks,
  executiveAssets,
  executiveExperiments,
  deriveCampaignLifecycleExecutiveSnapshot,
}
