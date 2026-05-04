export type OutcomeStatus = "open" | "measuring" | "successful" | "failed" | "repeat" | "improve"
export type OutcomeRisk = "low" | "medium" | "high" | "critical"

export type OutcomeItem = {
  id: string
  title: string
  linkedChain: string
  status: OutcomeStatus
  risk: OutcomeRisk
  owner: string
  beforeMetric: string
  afterMetric: string
  revenueImpactMad: number
  confidence: number
  resultSummary: string
  lessonLearned: string
  decision: string
  nextAction: string
}

export const outcomeItems: OutcomeItem[] = [
  {
    id: "out-001",
    title: "Postpartum Campaign Launch Outcome",
    linkedChain: "Postpartum Campaign Safe Launch Chain",
    status: "measuring",
    risk: "medium",
    owner: "Marketing Director",
    beforeMetric: "CAC 510 MAD / conversion 10.8%",
    afterMetric: "Pending 24h launch measurement",
    revenueImpactMad: 188000,
    confidence: 71,
    resultSummary: "Campaign launched under controlled conditions but still needs 24h CAC and WhatsApp conversion review.",
    lessonLearned: "Premium family-facing campaigns must be launched with trust proof and immediate response SLA.",
    decision: "Keep monitoring before scaling budget.",
    nextAction: "Review CAC, conversion and lead quality after first 24h.",
  },
  {
    id: "out-002",
    title: "Clinic Partner Outreach Outcome",
    linkedChain: "Clinic Partnership Activation Chain",
    status: "successful",
    risk: "low",
    owner: "Partnership Lead",
    beforeMetric: "Low pipeline volume",
    afterMetric: "6 meetings booked / 2 strong partner prospects",
    revenueImpactMad: 64000,
    confidence: 86,
    resultSummary: "Referral-benefit messaging improved meeting booking and partner interest.",
    lessonLearned: "Clinic outreach performs better with benefit matrix and low-risk pilot language.",
    decision: "Repeat with 40-clinic sprint.",
    nextAction: "Convert winning sequence into partnership playbook.",
  },
  {
    id: "out-003",
    title: "Academy Career Promise Test Outcome",
    linkedChain: "Academy Career Promise A/B Chain",
    status: "improve",
    risk: "high",
    owner: "Academy Marketing",
    beforeMetric: "Weak candidate quality",
    afterMetric: "Early lift but low qualification depth",
    revenueImpactMad: 19000,
    confidence: 54,
    resultSummary: "Career promise improved interest but did not yet filter seriousness strongly enough.",
    lessonLearned: "Academy campaigns must combine aspiration with strict qualification criteria.",
    decision: "Improve before scaling.",
    nextAction: "Add seriousness filter and job-access FAQ to intake.",
  }
]

export function statusLabel(status: OutcomeStatus) {
  const map: Record<OutcomeStatus, string> = {
    open: "Open",
    measuring: "Measuring",
    successful: "Successful",
    failed: "Failed",
    repeat: "Repeat",
    improve: "Improve",
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
