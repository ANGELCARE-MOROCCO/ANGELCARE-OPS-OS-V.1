export type ApprovalStatus = "pending" | "approved" | "rejected" | "needs_revision"
export type EscalationLevel = "none" | "manager" | "ceo" | "critical"
export type SlaState = "on_time" | "warning" | "late" | "breached"

export type ControlItem = {
  id: string
  relatedTask: string
  objective: string
  owner: string
  approvalStatus: ApprovalStatus
  slaState: SlaState
  escalationLevel: EscalationLevel
  deadline: string
  hoursRemaining: number
  proofStatus: "missing" | "submitted" | "validated"
  managerDecision: string
  requiredAction: string
  businessRisk: string
}

export const controlItems: ControlItem[] = [
  {
    id: "ctrl-001",
    relatedTask: "Finalize premium postpartum campaign brief",
    objective: "Postpartum Growth System",
    owner: "Marketing Director",
    approvalStatus: "pending",
    slaState: "warning",
    escalationLevel: "manager",
    deadline: "2026-05-06",
    hoursRemaining: 9,
    proofStatus: "submitted",
    managerDecision: "Waiting for service promise validation",
    requiredAction: "CEO must validate final offer promise before launch.",
    businessRisk: "Campaign launch may be delayed and revenue window may be missed.",
  },
  {
    id: "ctrl-002",
    relatedTask: "Prepare Academy recruitment angle and content plan",
    objective: "Caregiver Supply Brand Authority",
    owner: "Academy Marketing",
    approvalStatus: "needs_revision",
    slaState: "late",
    escalationLevel: "ceo",
    deadline: "2026-05-04",
    hoursRemaining: -14,
    proofStatus: "submitted",
    managerDecision: "Brand tone too generic. Needs stronger professional progression angle.",
    requiredAction: "Rewrite positioning and resubmit before next content sprint.",
    businessRisk: "Weak recruitment message can reduce caregiver acquisition quality.",
  },
  {
    id: "ctrl-003",
    relatedTask: "Build 20-clinic target list and partner qualification grid",
    objective: "B2B Clinic Partnership Pipeline",
    owner: "Partnership Lead",
    approvalStatus: "approved",
    slaState: "on_time",
    escalationLevel: "none",
    deadline: "2026-05-09",
    hoursRemaining: 42,
    proofStatus: "validated",
    managerDecision: "Approved for outreach preparation.",
    requiredAction: "Start outreach script and partner prospectus preparation.",
    businessRisk: "Controlled.",
  },
]

export function approvalLabel(status: ApprovalStatus) {
  const map: Record<ApprovalStatus, string> = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    needs_revision: "Needs Revision",
  }
  return map[status]
}

export function slaLabel(state: SlaState) {
  const map: Record<SlaState, string> = {
    on_time: "On Time",
    warning: "Warning",
    late: "Late",
    breached: "Breached",
  }
  return map[state]
}

export function escalationLabel(level: EscalationLevel) {
  const map: Record<EscalationLevel, string> = {
    none: "No Escalation",
    manager: "Manager",
    ceo: "CEO",
    critical: "Critical",
  }
  return map[level]
}
