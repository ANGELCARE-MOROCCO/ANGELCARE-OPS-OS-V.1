export type WorkforceRole =
  | "strategy"
  | "content"
  | "ads"
  | "partnership"
  | "seo"
  | "sales_enablement"
  | "academy_marketing"

export type CapacityRisk = "low" | "medium" | "high" | "critical"
export type AgentStatus = "available" | "focused" | "overloaded" | "blocked"

export type WorkforceAgent = {
  id: string
  name: string
  role: WorkforceRole
  status: AgentStatus
  risk: CapacityRisk
  activeTasks: number
  blockedTasks: number
  weeklyCapacityHours: number
  usedHours: number
  productivityScore: number
  qualityScore: number
  strategicFit: number
  currentFocus: string
  overloadReason: string
  recommendedRedistribution: string
  nextManagementAction: string
}

export const workforceAgents: WorkforceAgent[] = [
  {
    id: "agent-001",
    name: "Marketing Director",
    role: "strategy",
    status: "focused",
    risk: "medium",
    activeTasks: 14,
    blockedTasks: 2,
    weeklyCapacityHours: 40,
    usedHours: 34,
    productivityScore: 82,
    qualityScore: 88,
    strategicFit: 91,
    currentFocus: "Postpartum premium strategy and campaign approval",
    overloadReason: "Too many approval dependencies concentrated on one person.",
    recommendedRedistribution: "Delegate content validation to Content Lead and keep only final CEO-level strategy checks.",
    nextManagementAction: "Reduce low-value review tasks and preserve strategic decision capacity.",
  },
  {
    id: "agent-002",
    name: "Content & Branding",
    role: "content",
    status: "overloaded",
    risk: "high",
    activeTasks: 21,
    blockedTasks: 4,
    weeklyCapacityHours: 40,
    usedHours: 46,
    productivityScore: 74,
    qualityScore: 81,
    strategicFit: 79,
    currentFocus: "Landing page copy, partner brochure, Academy recruitment creative",
    overloadReason: "Too many production tasks with brand and compliance review pressure.",
    recommendedRedistribution: "Move simple social variations to junior support and keep core strategic assets here.",
    nextManagementAction: "Create priority queue and block new requests until approval backlog is cleared.",
  },
  {
    id: "agent-003",
    name: "Partnership Lead",
    role: "partnership",
    status: "available",
    risk: "low",
    activeTasks: 9,
    blockedTasks: 1,
    weeklyCapacityHours: 40,
    usedHours: 27,
    productivityScore: 86,
    qualityScore: 84,
    strategicFit: 88,
    currentFocus: "Clinic partnership mapping and outreach",
    overloadReason: "Controlled.",
    recommendedRedistribution: "Can absorb B2B outreach follow-up tasks from strategy backlog.",
    nextManagementAction: "Assign clinic follow-up calendar and meeting confirmation ownership.",
  }
]

export function roleLabel(role: WorkforceRole) {
  const map: Record<WorkforceRole, string> = {
    strategy: "Strategy",
    content: "Content",
    ads: "Ads",
    partnership: "Partnership",
    seo: "SEO",
    sales_enablement: "Sales Enablement",
    academy_marketing: "Academy Marketing",
  }
  return map[role]
}

export function statusLabel(status: AgentStatus) {
  const map: Record<AgentStatus, string> = {
    available: "Available",
    focused: "Focused",
    overloaded: "Overloaded",
    blocked: "Blocked",
  }
  return map[status]
}
