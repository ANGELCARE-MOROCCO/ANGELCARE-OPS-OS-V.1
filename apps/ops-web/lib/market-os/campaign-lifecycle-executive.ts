export type CampaignLifecycleExecutiveRecord = Record<string, any>
export type CampaignRisk = "low" | "medium" | "high" | "critical" | string
export type CampaignStage = "planning" | "production" | "approval" | "launch-ready" | "live" | "optimization" | string
export type ExecutiveCampaign = CampaignLifecycleExecutiveRecord

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

export function calculateBudgetBurn(input: any = {}, ...args: any[]) {
  const spent = Number(input?.spentMad || input?.spent || 0)
  const budget = Number(input?.budgetMad || input?.budget || 0)
  if (!budget) return 0
  return Math.max(0, Math.min(100, Math.round((spent / budget) * 100)))
}

export function calculateTaskCompletion(input: any = {}, ...args: any[]) {
  const complete = Number(input?.tasksCompleted || input?.completedTasks || input?.done || 0)
  const total = Number(input?.tasksTotal || input?.totalTasks || input?.tasks || 0)
  if (!total) return Number(input?.completion || input?.progress || 0)
  return Math.max(0, Math.min(100, Math.round((complete / total) * 100)))
}

export const campaignChannels: any[] = []

export function campaignExecutiveScore(input: any = {}, ...args: any[]) {
  const readiness = Number(input?.readiness || 0)
  const taskCompletion = calculateTaskCompletion(input)
  const burn = calculateBudgetBurn(input)
  return Math.max(0, Math.min(100, Math.round((readiness + taskCompletion + (100 - burn)) / 3)))
}

export function campaignReadinessWarnings(input: any = {}, ...args: any[]) {
  const warnings: string[] = []
  if (Number(input?.readiness || 0) < 60) warnings.push("Readiness below threshold")
  if (Number(input?.budgetMad || 0) > 0 && calculateBudgetBurn(input) > 70) warnings.push("Budget burn above guardrail")
  if (String(input?.risk || "").toLowerCase() === "high" || String(input?.risk || "").toLowerCase() === "critical") warnings.push("Risk requires review")
  return warnings
}

export const campaignRisks: CampaignRisk[] = ["low", "medium", "high", "critical"]

export const campaignStages: CampaignStage[] = ["planning", "production", "approval", "launch-ready", "live", "optimization"]

export function formatMad(value: number | string = 0) {
  const amount = Number(value || 0)
  return `${amount.toLocaleString("fr-MA")} MAD`
}

export function stageLabel(value: any = "") {
  return String(value || "Not configured")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
