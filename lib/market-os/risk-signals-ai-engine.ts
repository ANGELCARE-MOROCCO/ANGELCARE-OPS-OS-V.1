export type RiskLevel = "low" | "medium" | "high" | "critical"
export type SignalType = "financial" | "execution" | "brand" | "conversion" | "market" | "team"
export type SignalStatus = "new" | "assigned" | "monitoring" | "resolved"

export type RiskSignal = {
  id: string
  title: string
  source: string
  type: SignalType
  level: RiskLevel
  status: SignalStatus
  owner: string
  confidence: number
  detectedAt: string
  impactMad: number
  diagnosis: string
  recommendedAction: string
  triggerTask: string
}

export const riskSignals: RiskSignal[] = [
  {
    id: "risk-001",
    title: "Postpartum CAC rising above target",
    source: "KPI, ROI & Financial Impact Engine",
    type: "financial",
    level: "high",
    status: "new",
    owner: "Marketing Director",
    confidence: 82,
    detectedAt: "2026-05-01",
    impactMad: 62000,
    diagnosis: "CAC is 21% above target while conversion is under target. Current messaging may be attracting low-intent leads.",
    recommendedAction: "Rebuild campaign angle around premium reassurance, medical confidence and family peace of mind.",
    triggerTask: "Create campaign correction sprint for postpartum premium offer.",
  },
  {
    id: "risk-002",
    title: "Academy recruitment positioning too generic",
    source: "Approval, SLA & Escalation Engine",
    type: "brand",
    level: "medium",
    status: "assigned",
    owner: "Academy Marketing",
    confidence: 74,
    detectedAt: "2026-05-01",
    impactMad: 28000,
    diagnosis: "Current positioning does not clearly communicate professional progression, certification or job access.",
    recommendedAction: "Rewrite Academy promise and connect it to real career outcomes.",
    triggerTask: "Create brand revision task for Academy recruitment angle.",
  },
  {
    id: "risk-003",
    title: "B2B partnership volume under target",
    source: "Strategy Execution Engine",
    type: "market",
    level: "medium",
    status: "monitoring",
    owner: "Partnership Lead",
    confidence: 69,
    detectedAt: "2026-05-01",
    impactMad: 47000,
    diagnosis: "ROI is healthy but pipeline volume is too low to hit the quarterly target.",
    recommendedAction: "Increase clinic targeting and prioritize high-maternity facilities with fast decision cycles.",
    triggerTask: "Create 40-clinic expansion sprint and outreach calendar.",
  },
]

export function riskLabel(level: RiskLevel) {
  const map: Record<RiskLevel, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
  }
  return map[level]
}

export function statusLabel(status: SignalStatus) {
  const map: Record<SignalStatus, string> = {
    new: "New",
    assigned: "Assigned",
    monitoring: "Monitoring",
    resolved: "Resolved",
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
