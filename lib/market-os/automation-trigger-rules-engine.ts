export type RuleStatus = "active" | "paused" | "draft"
export type RuleRisk = "low" | "medium" | "high" | "critical"
export type RuleAction = "create_task" | "send_alert" | "escalate" | "request_approval" | "create_report"

export type AutomationRule = {
  id: string
  title: string
  sourceEngine: string
  status: RuleStatus
  risk: RuleRisk
  action: RuleAction
  owner: string
  triggerCondition: string
  generatedAction: string
  sla: string
  businessReason: string
  lastTriggered: string
  triggerCount: number
}

export const automationRules: AutomationRule[] = [
  {
    id: "rule-001",
    title: "High-intent lead SLA protection",
    sourceEngine: "Lead Intake Control",
    status: "active",
    risk: "high",
    action: "escalate",
    owner: "Sales Manager",
    triggerCondition: "If lead intent score is above 80 and SLA remaining is below 10 minutes.",
    generatedAction: "Escalate to Sales Manager and create urgent call task.",
    sla: "10 minutes",
    businessReason: "Prevents high-value leads from cooling down before first contact.",
    lastTriggered: "2026-05-01",
    triggerCount: 7,
  },
  {
    id: "rule-002",
    title: "Campaign launch blocker rule",
    sourceEngine: "Campaign Lifecycle",
    status: "active",
    risk: "medium",
    action: "request_approval",
    owner: "Marketing Director",
    triggerCondition: "If campaign readiness is below 80% and stage is approval.",
    generatedAction: "Create approval correction task and prevent launch readiness validation.",
    sla: "24 hours",
    businessReason: "Prevents weak or incomplete campaign launches.",
    lastTriggered: "2026-05-01",
    triggerCount: 3,
  },
  {
    id: "rule-003",
    title: "Content overload redistribution rule",
    sourceEngine: "Workforce Capacity Command",
    status: "draft",
    risk: "medium",
    action: "create_task",
    owner: "Manager",
    triggerCondition: "If agent used hours exceed 110% and active tasks exceed 18.",
    generatedAction: "Create redistribution task and mark capacity risk as high.",
    sla: "12 hours",
    businessReason: "Protects strategic assets from production overload.",
    lastTriggered: "Not yet triggered",
    triggerCount: 0,
  }
]

export function actionLabel(action: RuleAction) {
  const map: Record<RuleAction, string> = {
    create_task: "Create Task",
    send_alert: "Send Alert",
    escalate: "Escalate",
    request_approval: "Request Approval",
    create_report: "Create Report",
  }
  return map[action]
}

export function statusLabel(status: RuleStatus) {
  const map: Record<RuleStatus, string> = {
    active: "Active",
    paused: "Paused",
    draft: "Draft",
  }
  return map[status]
}
