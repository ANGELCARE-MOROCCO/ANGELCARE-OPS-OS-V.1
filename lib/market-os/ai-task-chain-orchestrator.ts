export type ChainStatus = "draft" | "ready" | "running" | "blocked" | "completed"
export type ChainRisk = "low" | "medium" | "high" | "critical"

export type TaskChain = {
  id: string
  title: string
  linkedSynthesis: string
  status: ChainStatus
  risk: ChainRisk
  owner: string
  progress: number
  sla: string
  expectedImpactMad: number
  dependency: string
  step1: string
  step2: string
  step3: string
  blocker: string
  successMetric: string
  nextAction: string
}

export const taskChains: TaskChain[] = [
  {
    id: "chain-001",
    title: "Postpartum Campaign Safe Launch Chain",
    linkedSynthesis: "Protect Premium Postpartum Revenue Window",
    status: "ready",
    risk: "critical",
    owner: "CEO / Marketing Director",
    progress: 62,
    sla: "24h",
    expectedImpactMad: 280000,
    dependency: "CEO approval and compliance-safe copy validation.",
    step1: "Approve campaign promise and trust-proof section.",
    step2: "Attach sales objection script and launch checklist.",
    step3: "Launch controlled campaign and monitor CAC after 24h.",
    blocker: "Final medical-sensitive wording still pending.",
    successMetric: "CAC below 520 MAD and qualified WhatsApp conversion above 12%.",
    nextAction: "Complete final wording review and move chain to running.",
  },
  {
    id: "chain-002",
    title: "Attribution Repair Chain",
    linkedSynthesis: "Fix Attribution Before Scaling Paid Campaigns",
    status: "running",
    risk: "high",
    owner: "Marketing Ops / Tech",
    progress: 41,
    sla: "48h",
    expectedImpactMad: 137000,
    dependency: "Lead intake source field and campaign ID mapping.",
    step1: "Force required source capture on all lead forms.",
    step2: "Map WhatsApp leads to campaign and creative ID.",
    step3: "Generate attribution confidence report.",
    blocker: "WhatsApp source field still optional.",
    successMetric: "Attribution confidence above 85%.",
    nextAction: "Make source capture required and audit recent leads.",
  },
  {
    id: "chain-003",
    title: "Content Capacity Recovery Chain",
    linkedSynthesis: "Recover Content Team Capacity",
    status: "blocked",
    risk: "high",
    owner: "Marketing Director",
    progress: 28,
    sla: "24h",
    expectedImpactMad: 62000,
    dependency: "Manager approval to redistribute low-complexity tasks.",
    step1: "Identify tasks safe to reassign.",
    step2: "Move simple variations to junior execution support.",
    step3: "Protect brand-critical production blocks.",
    blocker: "No redistribution decision approved yet.",
    successMetric: "Content capacity below 90% and launch assets approved.",
    nextAction: "Approve redistribution and freeze low-priority requests.",
  }
]

export function statusLabel(status: ChainStatus) {
  const map: Record<ChainStatus, string> = {
    draft: "Draft",
    ready: "Ready",
    running: "Running",
    blocked: "Blocked",
    completed: "Completed",
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
