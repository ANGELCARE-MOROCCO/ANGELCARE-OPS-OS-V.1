import { Campaign, CampaignCommand, calculateCac, calculateRoi, decisionAlerts, formatMad, launchBlockers, readinessScore } from "./campaign-execution-engine"

export type ExecutivePriority = "critical" | "high" | "medium" | "low"
export type CampaignDecisionBrief = {
  campaignId: string
  title: string
  status: string
  readiness: number
  roi: number
  cac: number
  blockers: string[]
  alerts: string[]
  priority: ExecutivePriority
  recommendedCommand: CampaignCommand | "REVIEW"
  executiveSummary: string
  nextFiveMoves: string[]
}

export function campaignPriority(campaign: Campaign): ExecutivePriority {
  const blockers = launchBlockers(campaign).length
  const alerts = decisionAlerts(campaign).filter(a => a.severity === "danger" || a.severity === "warning").length
  const readiness = readinessScore(campaign)
  if (campaign.risk === "critical" || blockers >= 4 || alerts >= 3) return "critical"
  if (campaign.risk === "high" || blockers >= 2 || readiness < 65) return "high"
  if (campaign.status === "active" || campaign.status === "scaling") return "medium"
  return "low"
}

export function recommendedCommand(campaign: Campaign): CampaignCommand | "REVIEW" {
  const blockers = launchBlockers(campaign)
  const roi = calculateRoi(campaign)
  if (["draft", "planning", "ready"].includes(campaign.status) && blockers.length > 0) return "VALIDATE_READINESS"
  if (campaign.status === "ready" && blockers.length === 0) return "LAUNCH"
  if (campaign.status === "active" && roi > 30 && campaign.kpis.qualifiedLeads >= 5) return "SCALE"
  if (["active", "scaling"].includes(campaign.status) && decisionAlerts(campaign).some(a => a.severity === "danger")) return "PAUSE"
  if (campaign.status === "paused" && blockers.length === 0) return "RESUME"
  return "REVIEW"
}

export function buildDecisionBrief(campaign: Campaign): CampaignDecisionBrief {
  const readiness = readinessScore(campaign)
  const roi = calculateRoi(campaign)
  const cac = calculateCac(campaign)
  const blockers = launchBlockers(campaign)
  const alerts = decisionAlerts(campaign).map(a => `${a.title}: ${a.detail}`)
  const command = recommendedCommand(campaign)
  const nextFiveMoves = [
    blockers[0] ? `Close blocker: ${blockers[0]}` : "Confirm launch gates and owner accountability.",
    campaign.tasks.find(t => t.status !== "done") ? `Push task: ${campaign.tasks.find(t => t.status !== "done")?.title}` : "Create next optimization task.",
    `Review CAC ${formatMad(cac)} against target ${formatMad(campaign.kpis.targetCacMad)}.`,
    `Review ROI ${roi}% and decide whether spend should pause, hold, or scale.`,
    `Update executive log with decision: ${command}.`,
  ]
  return {
    campaignId: campaign.id,
    title: campaign.title,
    status: campaign.status,
    readiness,
    roi,
    cac,
    blockers,
    alerts,
    priority: campaignPriority(campaign),
    recommendedCommand: command,
    executiveSummary: `${campaign.title} is ${campaign.status} with ${readiness}% readiness, ${blockers.length} launch blockers, ROI ${roi}%, and CAC ${formatMad(cac)}. Recommended executive move: ${command}.`,
    nextFiveMoves,
  }
}

export function buildAllDecisionBriefs(campaigns: Campaign[]) {
  return campaigns.map(buildDecisionBrief).sort((a,b) => {
    const order: Record<ExecutivePriority, number> = { critical: 4, high: 3, medium: 2, low: 1 }
    return order[b.priority] - order[a.priority]
  })
}

export function safeCampaignSnapshot(campaigns: Campaign[]) {
  return JSON.stringify({ exportedAt: new Date().toISOString(), version: "campaign-final-executive-control-v1", campaigns }, null, 2)
}

export function buildRouteAudit() {
  return [
    "/market-os/campaign-lifecycle",
    "/market-os/campaign-lifecycle/create",
    "/market-os/campaign-lifecycle/executive-control",
    "/market-os/campaign-lifecycle/decision-brief",
    "/market-os/campaign-lifecycle/recovery",
    "/market-os/campaign-lifecycle/camp-postpartum-rabat",
    "/market-os/campaign-lifecycle/camp-postpartum-rabat/launch",
    "/market-os/campaign-lifecycle/camp-postpartum-rabat/tasks",
    "/market-os/campaign-lifecycle/camp-postpartum-rabat/budget",
    "/market-os/campaign-lifecycle/camp-postpartum-rabat/performance",
    "/market-os/campaign-lifecycle/camp-postpartum-rabat/logs",
  ]
}

export function productionAcceptanceChecklist() {
  return [
    "Campaign board loads without white screen or 404.",
    "Create campaign page saves a new campaign into local execution storage.",
    "Launch control refuses launch when required gates or tasks are incomplete.",
    "Task board can add, complete, and block work items.",
    "Budget page updates channel spend and recalculates campaign spend.",
    "Performance page calculates CAC, ROI, alerts, and scale decision logic.",
    "Logs page records operator actions with timestamp and severity.",
    "Executive control page shows priority-ranked campaigns and next moves.",
    "Recovery page can export a snapshot before risky changes.",
    "No route from Content Command, SEO Blog, Ambassadors, HR, Revenue, or Email OS is changed by this package.",
  ]
}
