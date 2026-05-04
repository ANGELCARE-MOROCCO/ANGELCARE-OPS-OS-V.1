export type ReportType = "daily" | "weekly" | "monthly" | "investor" | "campaign" | "risk"
export type ReportStatus = "draft" | "review" | "approved" | "exported"
export type ReportRisk = "low" | "medium" | "high" | "critical"

export type MarketingReport = {
  id: string
  title: string
  type: ReportType
  status: ReportStatus
  risk: ReportRisk
  owner: string
  period: string
  revenueImpactMad: number
  kpiHealth: number
  executionHealth: number
  investorReadiness: number
  summary: string
  keyRisks: string
  decisionsNeeded: string
  nextAction: string
}

export const reports: MarketingReport[] = [
  {
    id: "rep-001",
    title: "Weekly Market-OS Executive Review",
    type: "weekly",
    status: "review",
    risk: "medium",
    owner: "Marketing Director",
    period: "Week 18 / 2026",
    revenueImpactMad: 693000,
    kpiHealth: 76,
    executionHealth: 71,
    investorReadiness: 74,
    summary: "Marketing execution is active with strong strategic structure, but launch approval and content capacity remain bottlenecks.",
    keyRisks: "Postpartum CAC above target, content production overload, Academy positioning not yet strong enough.",
    decisionsNeeded: "Approve campaign launch conditions and redistribute content workload.",
    nextAction: "Finalize executive decision log and export board-ready summary.",
  },
  {
    id: "rep-002",
    title: "Premium Postpartum Campaign Readiness Report",
    type: "campaign",
    status: "draft",
    risk: "high",
    owner: "Campaign Owner",
    period: "May 2026",
    revenueImpactMad: 280000,
    kpiHealth: 68,
    executionHealth: 72,
    investorReadiness: 66,
    summary: "Campaign has strong upside but cannot be considered launch-ready without trust-proof validation and compliance-safe wording.",
    keyRisks: "Medical-sensitive claims, incomplete WhatsApp objection script, unresolved offer approval.",
    decisionsNeeded: "CEO approval with conditions.",
    nextAction: "Complete checklist and move report to review.",
  },
  {
    id: "rep-003",
    title: "Expansion Opportunity Snapshot",
    type: "investor",
    status: "approved",
    risk: "medium",
    owner: "CEO",
    period: "Q2 2026",
    revenueImpactMad: 2050000,
    kpiHealth: 79,
    executionHealth: 69,
    investorReadiness: 81,
    summary: "Casablanca and Rabat show the strongest near-term expansion readiness. UAE requires legal validation before commitment.",
    keyRisks: "Supply readiness and local compliance in foreign markets.",
    decisionsNeeded: "Prioritize Morocco pilot before international expansion.",
    nextAction: "Export investor expansion appendix.",
  }
]

export function typeLabel(type: ReportType) {
  const map: Record<ReportType, string> = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    investor: "Investor",
    campaign: "Campaign",
    risk: "Risk",
  }
  return map[type]
}

export function statusLabel(status: ReportStatus) {
  const map: Record<ReportStatus, string> = {
    draft: "Draft",
    review: "Review",
    approved: "Approved",
    exported: "Exported",
  }
  return map[status]
}

export function formatMad(value: number) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(value)
}
