export type SynthesisPriority = "P0" | "P1" | "P2" | "P3"
export type SynthesisStatus = "new" | "assigned" | "executing" | "monitoring" | "resolved"
export type SynthesisRisk = "low" | "medium" | "high" | "critical"

export type AiSynthesis = {
  id: string
  title: string
  priority: SynthesisPriority
  status: SynthesisStatus
  risk: SynthesisRisk
  sourceEngines: string[]
  confidence: number
  expectedImpactMad: number
  diagnosis: string
  reasoningSummary: string
  command: string
  executionOrder: string
  owner: string
  deadline: string
  successMetric: string
}

export const aiSyntheses: AiSynthesis[] = [
  {
    id: "syn-001",
    title: "Protect Premium Postpartum Revenue Window",
    priority: "P0",
    status: "new",
    risk: "critical",
    sourceEngines: ["Campaign Lifecycle", "Brand Governance", "Lead Intake", "KPI ROI"],
    confidence: 86,
    expectedImpactMad: 280000,
    diagnosis: "The postpartum campaign has strong revenue potential but is blocked by approval, trust-proof validation and incomplete objection handling.",
    reasoningSummary: "Campaign readiness is not yet launch-safe. Lead demand exists, but weak trust proof and delayed approval can waste budget and reduce conversion.",
    command: "Approve final safe claims, complete trust-proof block, attach WhatsApp script and launch with 24h CAC monitoring.",
    executionOrder: "1) CEO approval → 2) content correction → 3) script attachment → 4) controlled launch → 5) CAC review.",
    owner: "CEO / Marketing Director",
    deadline: "Today",
    successMetric: "CAC below 520 MAD and qualified WhatsApp conversion above 12%.",
  },
  {
    id: "syn-002",
    title: "Fix Attribution Before Scaling Paid Campaigns",
    priority: "P1",
    status: "assigned",
    risk: "high",
    sourceEngines: ["Data Pipeline", "Lead Intake", "KPI ROI", "Automation Rules"],
    confidence: 79,
    expectedImpactMad: 137000,
    diagnosis: "Meta and WhatsApp lead attribution is incomplete, limiting ROI proof and scaling decisions.",
    reasoningSummary: "Scaling without clean attribution can increase spend while hiding which creatives, scripts and lead sources are actually converting.",
    command: "Force source capture on every lead and connect campaign ID, creative ID and WhatsApp intake source.",
    executionOrder: "1) Add required attribution field → 2) update lead intake → 3) audit existing leads → 4) report CAC by source.",
    owner: "Marketing Ops / Tech",
    deadline: "48h",
    successMetric: "Attribution confidence above 85% across paid and WhatsApp leads.",
  },
  {
    id: "syn-003",
    title: "Recover Content Team Capacity",
    priority: "P1",
    status: "monitoring",
    risk: "high",
    sourceEngines: ["Workforce Capacity", "Content Governance", "Marketing Calendar"],
    confidence: 82,
    expectedImpactMad: 62000,
    diagnosis: "Content & Branding is overloaded, delaying critical campaign and partner assets.",
    reasoningSummary: "Strategic assets should not compete with low-complexity production tasks. Current workload risks launch delays and quality issues.",
    command: "Redistribute simple variations, freeze new low-priority requests and protect brand-critical production blocks.",
    executionOrder: "1) Identify low-complexity tasks → 2) reassign → 3) protect 2 work blocks → 4) review backlog daily.",
    owner: "Marketing Director",
    deadline: "24h",
    successMetric: "Content capacity below 90% and campaign assets approved before launch date.",
  }
]

export function formatMad(value: number) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(value)
}
