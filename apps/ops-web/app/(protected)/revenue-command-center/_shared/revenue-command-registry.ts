export type RevenueWorkspaceKey =
  | "overview"
  | "control-tower"
  | "tasks"
  | "prospects"
  | "campaigns"
  | "appointments"
  | "follow-ups"
  | "partnerships"
  | "market-mapping"
  | "automation"
  | "ai-scoring"
  | "management"
  | "daily-desk"
  | "my-work"
  | "executive-briefing"
  | "predictive"
  | "sdr-execution"
  | "overdue-heatmap"
  | "strategy-room"
  | "workload-balancer"
  | "notifications"
  | "growth"
  | "b2c-workflow"
  | "system-activation"
  | "meta-readiness"
  | "team-performance"
  | "elite-command"
  | "cockpit"
  | "master-command"
  | "business-development"
  | "leads-impact"

export type RevenueWorkspaceGroup = "command" | "sales" | "execution" | "intelligence" | "management" | "automation"

export type RevenueWorkspaceConfig = {
  key: RevenueWorkspaceKey
  label: string
  href: string
  group: RevenueWorkspaceGroup
  mission: string
  owner: string
  priority: "critical" | "high" | "medium" | "low"
  engine: "hq" | "final" | "max" | "execution" | "legacy" | "specialized"
  productionRole: string
  validation: string[]
}

export const REVENUE_WORKSPACES: RevenueWorkspaceConfig[] = [
  { key: "overview", label: "HQ", href: "/revenue-command-center", group: "command", mission: "Executive revenue command, cross-module risk, ownership and performance control.", owner: "Revenue Director", priority: "critical", engine: "hq", productionRole: "Global command entry", validation: ["main route loads", "navigation visible", "records can be inspected"] },
  { key: "control-tower", label: "Control Tower", href: "/revenue-command-center/control-tower", group: "command", mission: "Intervention center for SLA, blocked revenue, risk and escalation.", owner: "Revenue Ops Manager", priority: "critical", engine: "max", productionRole: "Risk intervention", validation: ["risk cards visible", "actions execute", "logs do not block"] },
  { key: "tasks", label: "Tasks", href: "/revenue-command-center/tasks", group: "execution", mission: "Owned execution work, deadlines, subtasks, blockers and completion discipline.", owner: "Execution Lead", priority: "critical", engine: "final", productionRole: "Execution accountability", validation: ["create task", "open task detail", "bulk action"] },
  { key: "prospects", label: "Prospects", href: "/revenue-command-center/prospects", group: "sales", mission: "Lead qualification, pipeline movement, decision mapping and follow-up pressure.", owner: "BD Lead", priority: "critical", engine: "final", productionRole: "Sales pipeline", validation: ["pipeline route", "new prospect", "detail route"] },
  { key: "campaigns", label: "Campaigns", href: "/revenue-command-center/campaigns", group: "sales", mission: "Revenue campaigns, launch plans, assets, ROI and handoff control.", owner: "Growth Lead", priority: "high", engine: "final", productionRole: "Revenue campaign execution", validation: ["board", "new campaign", "performance"] },
  { key: "appointments", label: "Appointments", href: "/revenue-command-center/appointments", group: "sales", mission: "Meeting confirmation, no-show prevention, conversion and next-step discipline.", owner: "Sales Coordinator", priority: "high", engine: "final", productionRole: "Conversion desk", validation: ["command route", "meeting status", "follow-up route"] },
  { key: "follow-ups", label: "Follow-ups", href: "/revenue-command-center/follow-ups", group: "execution", mission: "No-lead-left-behind callback and overdue recovery system.", owner: "SDR Lead", priority: "critical", engine: "final", productionRole: "Recovery engine", validation: ["overdue view", "owner queue", "notifications"] },
  { key: "sdr-execution", label: "SDR Execution", href: "/revenue-command-center/sdr-execution", group: "execution", mission: "Daily SDR execution, call discipline, conversion actions and lead movement.", owner: "SDR Lead", priority: "high", engine: "specialized", productionRole: "Frontline sales execution", validation: ["daily desk", "actions", "performance"] },
  { key: "partnerships", label: "Partnerships", href: "/revenue-command-center/partnerships", group: "sales", mission: "Partner pipeline, agreements, activation and referral revenue.", owner: "Partnership Lead", priority: "high", engine: "final", productionRole: "Strategic revenue partnerships", validation: ["pipeline", "new partner", "activation"] },
  { key: "market-mapping", label: "Market Mapping", href: "/revenue-command-center/market-mapping", group: "intelligence", mission: "Territory, opportunity, competitor and coverage intelligence.", owner: "Market Analyst", priority: "medium", engine: "final", productionRole: "Market coverage", validation: ["coverage page", "prospect clusters", "gaps"] },
  { key: "automation", label: "Automation", href: "/revenue-command-center/automation", group: "automation", mission: "Revenue triggers, alerts, routing rules and recovery workflows.", owner: "Ops Automation", priority: "high", engine: "final", productionRole: "Rules and triggers", validation: ["rules", "workflow test", "alerts"] },
  { key: "ai-scoring", label: "AI Scoring", href: "/revenue-command-center/ai-scoring", group: "intelligence", mission: "Risk, priority, recommendations, stale lead detection and next-best action.", owner: "Revenue Analyst", priority: "high", engine: "final", productionRole: "Decision intelligence", validation: ["recommendations", "scores", "risk"] },
  { key: "predictive", label: "Predictive", href: "/revenue-command-center/predictive", group: "intelligence", mission: "Predictive revenue controls, campaign metadata and action planning.", owner: "Revenue Analyst", priority: "medium", engine: "execution", productionRole: "Predictive layer", validation: ["targets", "action plan", "campaign brief"] },
  { key: "management", label: "Management", href: "/revenue-command-center/management", group: "management", mission: "Team workload, permissions, audit, approvals and performance discipline.", owner: "Revenue Manager", priority: "high", engine: "final", productionRole: "People and workload governance", validation: ["team", "workload", "audit"] },
  { key: "executive-briefing", label: "Executive Briefing", href: "/revenue-command-center/executive-briefing", group: "management", mission: "CEO-ready briefing of risks, priorities, revenue movement and decisions needed.", owner: "Executive Office", priority: "high", engine: "specialized", productionRole: "Executive reporting", validation: ["briefing cards", "decision list", "risk list"] },
  { key: "overdue-heatmap", label: "Overdue Heatmap", href: "/revenue-command-center/overdue-heatmap", group: "execution", mission: "Visual pressure map for overdue work and recovery priorities.", owner: "Revenue Ops", priority: "medium", engine: "specialized", productionRole: "Recovery prioritization", validation: ["heatmap", "owner filter", "overdue queue"] },
  { key: "my-work", label: "My Work", href: "/revenue-command-center/my-work", group: "execution", mission: "Personal execution cockpit for assigned revenue work.", owner: "Current User", priority: "medium", engine: "final", productionRole: "Personal queue", validation: ["my tasks", "next actions", "completion"] },
  { key: "notifications", label: "Notifications", href: "/revenue-command-center/notifications", group: "automation", mission: "Alerts, reminders and escalation messages for revenue execution.", owner: "Revenue Ops", priority: "medium", engine: "final", productionRole: "Alert center", validation: ["alerts list", "read state", "route links"] },
  { key: "strategy-room", label: "Strategy Room", href: "/revenue-command-center/strategy-room", group: "command", mission: "Strategic revenue planning and leadership alignment.", owner: "CEO / Revenue Director", priority: "medium", engine: "final", productionRole: "Strategic planning", validation: ["strategic actions", "initiatives", "owners"] },
  { key: "workload-balancer", label: "Workload", href: "/revenue-command-center/workload-balancer", group: "management", mission: "Capacity balancing and owner overload prevention.", owner: "Revenue Manager", priority: "medium", engine: "final", productionRole: "Capacity control", validation: ["owners", "load", "rebalance"] },
  { key: "business-development", label: "Business Dev", href: "/revenue-command-center/business-development", group: "sales", mission: "Strategic outreach and opportunity creation.", owner: "BD Lead", priority: "high", engine: "final", productionRole: "Opportunity creation", validation: ["BD queue", "outreach", "pipeline"] },
  { key: "growth", label: "Growth", href: "/revenue-command-center/growth", group: "sales", mission: "Growth experiments, conversion impact and campaign learning.", owner: "Growth Lead", priority: "medium", engine: "final", productionRole: "Experimentation", validation: ["experiments", "conversion", "ROI"] },
  { key: "b2c-workflow", label: "B2C Workflow", href: "/revenue-command-center/b2c-workflow", group: "sales", mission: "B2C lead journey and conversion workflow.", owner: "Sales Lead", priority: "medium", engine: "final", productionRole: "B2C journey", validation: ["workflow stages", "handoff", "conversion"] },
  { key: "system-activation", label: "Activation", href: "/revenue-command-center/system-activation", group: "automation", mission: "System readiness, activation replay and workflow activation.", owner: "Ops Automation", priority: "medium", engine: "execution", productionRole: "Activation control", validation: ["activation state", "replay", "logs"] },
  { key: "meta-readiness", label: "Meta Readiness", href: "/revenue-command-center/meta-readiness", group: "intelligence", mission: "Meta readiness checks for revenue command execution maturity.", owner: "Revenue Ops", priority: "low", engine: "specialized", productionRole: "Readiness scoring", validation: ["scores", "checks", "next actions"] },
  { key: "team-performance", label: "Team Performance", href: "/revenue-command-center/team-performance", group: "management", mission: "Owner performance, execution reliability and coaching signals.", owner: "Revenue Manager", priority: "medium", engine: "specialized", productionRole: "Team performance", validation: ["scorecards", "owner KPIs", "coaching"] },
  { key: "elite-command", label: "Elite Command", href: "/revenue-command-center/elite-command", group: "command", mission: "High-intensity executive command mode for priority revenue execution.", owner: "Executive Office", priority: "low", engine: "specialized", productionRole: "Elite command", validation: ["priority views", "risk controls", "executive actions"] },
  { key: "cockpit", label: "Cockpit", href: "/revenue-command-center/cockpit", group: "command", mission: "Compact cockpit view for revenue status and next actions.", owner: "Revenue Ops", priority: "low", engine: "specialized", productionRole: "Compact overview", validation: ["status", "actions", "links"] },
  { key: "master-command", label: "Master Command", href: "/revenue-command-center/master-command", group: "command", mission: "Master-level orchestration page for high-level revenue command.", owner: "Executive Office", priority: "low", engine: "specialized", productionRole: "Master orchestration", validation: ["orchestration", "priority", "routing"] },
  { key: "leads-impact", label: "Leads Impact", href: "/revenue-command-center/leads-impact", group: "sales", mission: "Lead source and conversion impact analysis.", owner: "Growth Analyst", priority: "medium", engine: "final", productionRole: "Lead impact", validation: ["sources", "impact", "conversion"] },
  { key: "daily-desk", label: "Daily Desk", href: "/revenue-command-center/daily-desk", group: "execution", mission: "Daily revenue execution planning and accountability.", owner: "Revenue Ops", priority: "medium", engine: "specialized", productionRole: "Daily desk", validation: ["today list", "owners", "actions"] },
]

export const REVENUE_GROUPS: Record<RevenueWorkspaceGroup, { label: string; description: string }> = {
  command: { label: "Command", description: "Executive control, risk, priorities and strategic routing." },
  sales: { label: "Sales", description: "Pipeline, prospects, campaigns, partnerships and conversion." },
  execution: { label: "Execution", description: "Tasks, follow-ups, SDR actions, overdue pressure and personal work." },
  intelligence: { label: "Intelligence", description: "Scoring, predictive controls, market mapping and readiness." },
  management: { label: "Management", description: "Team performance, workload, approvals and governance." },
  automation: { label: "Automation", description: "Rules, alerts, activation and workflow control." },
}

export function getRevenueWorkspaceByHref(pathname: string) {
  return REVENUE_WORKSPACES.find((workspace) => pathname === workspace.href || pathname.startsWith(`${workspace.href}/`)) || REVENUE_WORKSPACES[0]
}

export function getRevenueWorkspaceByKey(key: string) {
  return REVENUE_WORKSPACES.find((workspace) => workspace.key === key) || REVENUE_WORKSPACES[0]
}

export function getRevenueWorkspacesByGroup(group: RevenueWorkspaceGroup) {
  return REVENUE_WORKSPACES.filter((workspace) => workspace.group === group)
}
