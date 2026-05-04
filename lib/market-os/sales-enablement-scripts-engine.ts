export type ScriptStage =
  | "draft"
  | "review"
  | "approved"
  | "assigned"
  | "in_use"
  | "optimization"

export type ScriptRisk = "low" | "medium" | "high" | "critical"

export type ScriptItem = {
  id: string
  title: string
  linkedOffer: string
  scenario: string
  owner: string
  stage: ScriptStage
  risk: ScriptRisk
  channel: string
  assignedAgents: number
  usageCount: number
  conversionRate: number
  objectionCoverage: number
  confidenceScore: number
  weakPoint: string
  topObjection: string
  improvementAction: string
  expectedImpact: string
}

export const scripts: ScriptItem[] = [
  {
    id: "script-001",
    title: "Premium Postpartum Reassurance Call Script",
    linkedOffer: "Premium 7-Day Postpartum Starter Package",
    scenario: "Inbound WhatsApp / first call",
    owner: "Sales Enablement",
    stage: "review",
    risk: "medium",
    channel: "WhatsApp + Phone",
    assignedAgents: 4,
    usageCount: 86,
    conversionRate: 11.4,
    objectionCoverage: 72,
    confidenceScore: 76,
    weakPoint: "Does not yet handle fear of caregiver reliability strongly enough.",
    topObjection: "How can I trust the caregiver with my newborn and family?",
    improvementAction: "Add trust-proof block, replacement guarantee and family reassurance sequence.",
    expectedImpact: "Increase qualified appointment conversion by 3-5%.",
  },
  {
    id: "script-002",
    title: "Clinic Partner Meeting Script",
    linkedOffer: "Clinic Referral Priority Access Program",
    scenario: "B2B partner meeting",
    owner: "Partnership Lead",
    stage: "approved",
    risk: "low",
    channel: "Direct meeting + email follow-up",
    assignedAgents: 2,
    usageCount: 21,
    conversionRate: 18.8,
    objectionCoverage: 81,
    confidenceScore: 84,
    weakPoint: "Needs stronger closing sequence for next meeting booking.",
    topObjection: "What exactly does the clinic gain from referring families?",
    improvementAction: "Add clinic benefit matrix and low-risk pilot proposal.",
    expectedImpact: "Improve partner meeting-to-agreement conversion.",
  },
  {
    id: "script-003",
    title: "Academy Candidate Qualification Script",
    linkedOffer: "Academy Training-to-Career Enrollment Offer",
    scenario: "Candidate screening",
    owner: "Academy Marketing",
    stage: "draft",
    risk: "high",
    channel: "Phone + WhatsApp",
    assignedAgents: 1,
    usageCount: 13,
    conversionRate: 5.9,
    objectionCoverage: 44,
    confidenceScore: 49,
    weakPoint: "Candidate motivation and seriousness are not filtered early enough.",
    topObjection: "Is this just training or will it really help me find work?",
    improvementAction: "Add seriousness filter, career pathway promise and qualification checklist.",
    expectedImpact: "Reduce weak applications and improve trainee quality.",
  }
]

export function stageLabel(stage: ScriptStage) {
  const map: Record<ScriptStage, string> = {
    draft: "Draft",
    review: "Review",
    approved: "Approved",
    assigned: "Assigned",
    in_use: "In Use",
    optimization: "Optimization",
  }
  return map[stage]
}
