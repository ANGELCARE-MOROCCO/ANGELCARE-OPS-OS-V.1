export type ExecutiveRisk = "low" | "medium" | "high" | "critical"
export type DecisionStatus = "pending" | "approved" | "rejected" | "monitoring"

export type ExecutiveKpi = {
  id: string
  label: string
  value: string
  trend: string
  risk: ExecutiveRisk
  interpretation: string
}

export type ExecutiveDecision = {
  id: string
  title: string
  source: string
  status: DecisionStatus
  risk: ExecutiveRisk
  owner: string
  financialImpactMad: number
  deadline: string
  diagnosis: string
  recommendedDecision: string
  nextAction: string
}

export const executiveKpis: ExecutiveKpi[] = [
  {
    id: "kpi-001",
    label: "Marketing Revenue Influence",
    value: "693,000 MAD",
    trend: "+18% projected",
    risk: "medium",
    interpretation: "Revenue influence is growing, but CAC and campaign readiness must be controlled.",
  },
  {
    id: "kpi-002",
    label: "Execution Confidence",
    value: "76%",
    trend: "stable",
    risk: "medium",
    interpretation: "Execution is active but approval bottlenecks and content overload reduce speed.",
  },
  {
    id: "kpi-003",
    label: "Strategic Risk Exposure",
    value: "137,000 MAD",
    trend: "needs attention",
    risk: "high",
    interpretation: "Main exposure comes from postpartum CAC, Academy positioning and B2B under-volume.",
  },
  {
    id: "kpi-004",
    label: "Investor Readiness",
    value: "71%",
    trend: "improving",
    risk: "medium",
    interpretation: "System shows strong structure, but needs more persistence, audit logs and real data connection.",
  }
]

export const executiveDecisions: ExecutiveDecision[] = [
  {
    id: "dec-001",
    title: "Approve Premium Postpartum Campaign Launch",
    source: "Campaign Lifecycle + Offer Pricing + Content Governance",
    status: "pending",
    risk: "high",
    owner: "CEO / Marketing Director",
    financialImpactMad: 280000,
    deadline: "2026-05-08",
    diagnosis: "Campaign has strong potential but cannot launch safely before offer promise and compliance-sensitive claims are validated.",
    recommendedDecision: "Approve with conditions: final offer promise, medical-safe wording, trust-proof block and WhatsApp objection script.",
    nextAction: "CEO validates final promise and assigns content correction task today.",
  },
  {
    id: "dec-002",
    title: "Redistribute Content Team Workload",
    source: "Workforce Capacity Command",
    status: "pending",
    risk: "high",
    owner: "Marketing Director",
    financialImpactMad: 62000,
    deadline: "2026-05-05",
    diagnosis: "Content & Branding is overloaded, creating delay risk for campaign launch and brand governance.",
    recommendedDecision: "Move low-complexity variations away from Content Lead and keep strategic assets under brand control.",
    nextAction: "Reassign 6 low-complexity production tasks and freeze new requests until backlog clears.",
  },
  {
    id: "dec-003",
    title: "Activate Rabat Clinic Partnership Sprint",
    source: "Partnership Growth + Research Intelligence + PR Pipeline",
    status: "monitoring",
    risk: "medium",
    owner: "Partnership Lead",
    financialImpactMad: 180000,
    deadline: "2026-05-13",
    diagnosis: "ROI looks promising but pipeline volume is insufficient to hit quarterly targets.",
    recommendedDecision: "Approve 40-clinic mapping sprint with partner prospectus and meeting script.",
    nextAction: "Launch clinic shortlisting, outreach calendar and partner authority material.",
  }
]

export function formatMad(value: number) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(value)
}

export function decisionLabel(status: DecisionStatus) {
  const map: Record<DecisionStatus, string> = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    monitoring: "Monitoring",
  }
  return map[status]
}
