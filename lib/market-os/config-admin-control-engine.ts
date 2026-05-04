export type ConfigType = "workflow" | "sla" | "approval" | "risk" | "visibility" | "priority"
export type ConfigStatus = "active" | "draft" | "needs_review"
export type ConfigRisk = "low" | "medium" | "high" | "critical"

export type AdminConfig = {
  id: string
  title: string
  type: ConfigType
  status: ConfigStatus
  risk: ConfigRisk
  module: string
  owner: string
  currentRule: string
  businessReason: string
  impact: string
  nextAction: string
}

export const adminConfigs: AdminConfig[] = [
  {
    id: "cfg-001",
    title: "High-intent lead SLA rule",
    type: "sla",
    status: "active",
    risk: "high",
    module: "Lead Intake Control",
    owner: "Sales Manager",
    currentRule: "Intent score above 80 must be called within 10 minutes.",
    businessReason: "Protects hot leads from losing urgency.",
    impact: "Improves conversion speed and reduces wasted Meta/WhatsApp acquisition cost.",
    nextAction: "Connect rule to real lead intake events and escalation logs.",
  },
  {
    id: "cfg-002",
    title: "Campaign launch approval gates",
    type: "approval",
    status: "active",
    risk: "medium",
    module: "Campaign Lifecycle",
    owner: "Marketing Director",
    currentRule: "Campaign cannot be marked ready without offer, budget, brand and compliance validation.",
    businessReason: "Prevents weak campaigns from launching and damaging brand or budget.",
    impact: "Improves launch discipline and investor-grade governance.",
    nextAction: "Add checklist enforcement to campaign readiness workflow.",
  },
  {
    id: "cfg-003",
    title: "Market-OS module visibility by role",
    type: "visibility",
    status: "draft",
    risk: "medium",
    module: "Master Control Hub",
    owner: "CEO / Admin",
    currentRule: "CEO sees all engines; managers see assigned engines; agents see execution-only pages.",
    businessReason: "Keeps the system powerful without overwhelming staff.",
    impact: "Improves security, focus and user adoption.",
    nextAction: "Map Market-OS routes to existing permission system.",
  }
]

export function typeLabel(type: ConfigType) {
  const map: Record<ConfigType, string> = {
    workflow: "Workflow",
    sla: "SLA",
    approval: "Approval",
    risk: "Risk",
    visibility: "Visibility",
    priority: "Priority",
  }
  return map[type]
}

export function statusLabel(status: ConfigStatus) {
  const map: Record<ConfigStatus, string> = {
    active: "Active",
    draft: "Draft",
    needs_review: "Needs Review",
  }
  return map[status]
}
