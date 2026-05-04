export type DoctrineArea =
  | "strategy"
  | "execution"
  | "governance"
  | "ai"
  | "growth"
  | "reporting"

export type DoctrineStatus = "draft" | "active" | "review" | "locked"
export type DoctrineRisk = "low" | "medium" | "high" | "critical"

export type DoctrineRule = {
  id: string
  title: string
  area: DoctrineArea
  status: DoctrineStatus
  risk: DoctrineRisk
  owner: string
  rule: string
  reason: string
  enforcement: string
  successCondition: string
  nextAction: string
}

export const doctrineRules: DoctrineRule[] = [
  {
    id: "doc-001",
    title: "No Campaign Launch Without Proof",
    area: "governance",
    status: "active",
    risk: "high",
    owner: "Marketing Director",
    rule: "No campaign can launch without validated offer, audience, proof block, script, SLA owner and KPI target.",
    reason: "Prevents weak launches, wasted budget and brand damage.",
    enforcement: "Campaign Lifecycle + Content Governance + Approval SLA.",
    successCondition: "Every launch has readiness above 85% and clear owner accountability.",
    nextAction: "Apply this rule to all active campaigns.",
  },
  {
    id: "doc-002",
    title: "AI Commands Must Become Task Chains",
    area: "ai",
    status: "active",
    risk: "medium",
    owner: "CEO / AI Director",
    rule: "Every P0/P1 AI command must be converted into an executable task chain with SLA and outcome closure.",
    reason: "AI diagnosis has no value unless it becomes accountable execution.",
    enforcement: "AI Synthesis + Task Chain Orchestrator + Outcome Closure.",
    successCondition: "100% of P0 commands have owners, SLA and measurable results.",
    nextAction: "Audit current AI commands and convert missing chains.",
  },
  {
    id: "doc-003",
    title: "Every Strategic Decision Must Produce Learning",
    area: "reporting",
    status: "review",
    risk: "medium",
    owner: "Operations / Marketing",
    rule: "Every major campaign, offer, experiment or expansion action must close with result, lesson and reusable playbook.",
    reason: "Prevents repeated mistakes and builds investor-grade institutional memory.",
    enforcement: "Outcome Closure + Audit Playbook Memory.",
    successCondition: "Every closed initiative creates a decision log or playbook item.",
    nextAction: "Lock this into weekly board reporting.",
  }
]

export function areaLabel(area: DoctrineArea) {
  const map: Record<DoctrineArea, string> = {
    strategy: "Strategy",
    execution: "Execution",
    governance: "Governance",
    ai: "AI",
    growth: "Growth",
    reporting: "Reporting",
  }
  return map[area]
}

export function statusLabel(status: DoctrineStatus) {
  const map: Record<DoctrineStatus, string> = {
    draft: "Draft",
    active: "Active",
    review: "Review",
    locked: "Locked",
  }
  return map[status]
}
