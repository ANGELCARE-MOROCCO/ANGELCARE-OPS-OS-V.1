export type MemoryType = "decision" | "mistake" | "success" | "playbook" | "audit" | "lesson"
export type MemoryRisk = "low" | "medium" | "high" | "critical"
export type MemoryStatus = "new" | "validated" | "converted" | "archived"

export type MemoryItem = {
  id: string
  title: string
  type: MemoryType
  status: MemoryStatus
  risk: MemoryRisk
  sourceModule: string
  owner: string
  createdAt: string
  businessImpactMad: number
  lesson: string
  ruleToRemember: string
  reusablePlaybook: string
  nextAction: string
}

export const memoryItems: MemoryItem[] = [
  {
    id: "mem-001",
    title: "Postpartum campaign cannot launch before trust-proof validation",
    type: "decision",
    status: "validated",
    risk: "high",
    sourceModule: "Investor Command Center",
    owner: "CEO / Marketing Director",
    createdAt: "2026-05-01",
    businessImpactMad: 280000,
    lesson: "High-potential campaigns can still fail if emotional trust and sensitive claims are not validated before launch.",
    ruleToRemember: "Every family-facing health-sensitive campaign must pass brand, trust-proof and compliance review before launch.",
    reusablePlaybook: "Premium Family Trust Campaign Launch Checklist",
    nextAction: "Convert this into mandatory campaign launch rule.",
  },
  {
    id: "mem-002",
    title: "Content overload delayed strategic asset readiness",
    type: "mistake",
    status: "new",
    risk: "medium",
    sourceModule: "Workforce Capacity Command",
    owner: "Marketing Director",
    createdAt: "2026-05-01",
    businessImpactMad: 62000,
    lesson: "Strategic content work becomes delayed when simple production tasks are not separated from high-value brand assets.",
    ruleToRemember: "Separate strategic assets from production variations and assign different SLA priorities.",
    reusablePlaybook: "Content Capacity Protection Playbook",
    nextAction: "Create workload governance rule for content production.",
  },
  {
    id: "mem-003",
    title: "Clinic partnership pipeline works better with authority material",
    type: "success",
    status: "converted",
    risk: "low",
    sourceModule: "Partnership Referral Growth",
    owner: "Partnership Lead",
    createdAt: "2026-05-01",
    businessImpactMad: 180000,
    lesson: "B2B clinic conversations become easier when outreach includes authority proof, clear referral benefits and a low-risk pilot.",
    ruleToRemember: "Every clinic partnership sprint must include prospectus, meeting script and referral benefit matrix.",
    reusablePlaybook: "Clinic Partnership Activation Playbook",
    nextAction: "Reuse playbook for Rabat and Casablanca expansion.",
  }
]

export function typeLabel(type: MemoryType) {
  const map: Record<MemoryType, string> = {
    decision: "Decision",
    mistake: "Mistake",
    success: "Success",
    playbook: "Playbook",
    audit: "Audit",
    lesson: "Lesson",
  }
  return map[type]
}

export function statusLabel(status: MemoryStatus) {
  const map: Record<MemoryStatus, string> = {
    new: "New",
    validated: "Validated",
    converted: "Converted",
    archived: "Archived",
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
