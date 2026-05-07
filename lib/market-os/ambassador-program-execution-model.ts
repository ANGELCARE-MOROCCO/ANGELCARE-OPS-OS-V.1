export type AmbassadorStatus = "candidate" | "onboarding" | "active" | "watchlist" | "paused" | "graduated" | "removed"
export type MissionStatus = "draft" | "assigned" | "in_progress" | "proof_pending" | "approved" | "rejected" | "paid"
export type ProgramType = "referral" | "community" | "clinic" | "campus" | "creator" | "affiliate"

export type AmbassadorProgramRecord = {
  id: string
  name: string
  city: string
  territory: string
  status: AmbassadorStatus
  program: ProgramType
  tier: "starter" | "trusted" | "elite" | "strategic"
  owner: string
  score: number
  leads: number
  qualifiedLeads: number
  conversions: number
  revenueMad: number
  pendingPayoutMad: number
  complianceScore: number
  contentScore: number
  missionCompletion: number
  nextAction: string
  risk: "low" | "medium" | "high"
}

export const ambassadorPrograms: AmbassadorProgramRecord[] = [
  { id: "amb-001", name: "Rabat Mothers Circle", city: "Rabat", territory: "Rabat-Sale-Kenitra", status: "active", program: "community", tier: "elite", owner: "Growth Lead", score: 92, leads: 188, qualifiedLeads: 96, conversions: 37, revenueMad: 148000, pendingPayoutMad: 9400, complianceScore: 96, contentScore: 89, missionCompletion: 91, nextAction: "Scale Ramadan family-care referral sprint", risk: "low" },
  { id: "amb-002", name: "Casablanca Clinic Partners", city: "Casablanca", territory: "Grand Casablanca", status: "active", program: "clinic", tier: "strategic", owner: "Partnership Manager", score: 88, leads: 264, qualifiedLeads: 143, conversions: 51, revenueMad: 219000, pendingPayoutMad: 12600, complianceScore: 93, contentScore: 81, missionCompletion: 84, nextAction: "Approve clinic proof batch and release payout", risk: "medium" },
  { id: "amb-003", name: "Academy Student Advocates", city: "Temara", territory: "Rabat Suburbs", status: "onboarding", program: "campus", tier: "starter", owner: "Academy Coordinator", score: 71, leads: 77, qualifiedLeads: 31, conversions: 11, revenueMad: 42000, pendingPayoutMad: 3100, complianceScore: 89, contentScore: 76, missionCompletion: 66, nextAction: "Complete certification and assign first mission", risk: "medium" },
  { id: "amb-004", name: "Marrakech Home Care Creators", city: "Marrakech", territory: "Marrakech-Safi", status: "watchlist", program: "creator", tier: "trusted", owner: "Brand Manager", score: 64, leads: 92, qualifiedLeads: 44, conversions: 13, revenueMad: 57000, pendingPayoutMad: 2200, complianceScore: 72, contentScore: 84, missionCompletion: 57, nextAction: "Review claims language before next content wave", risk: "high" },
]

export const ambassadorOperatingModes = ["Executive", "Recruitment", "Missions", "Rewards", "Compliance", "Analytics"] as const

export function formatMad(value: number) {
  return new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(value)
}

export function getAmbassadorDecision(record: AmbassadorProgramRecord) {
  if (record.risk === "high" || record.complianceScore < 80) return "Protect brand before scaling"
  if (record.score >= 88 && record.conversions >= 30) return "Scale this ambassador network"
  if (record.missionCompletion < 70) return "Coach and simplify mission plan"
  if (record.pendingPayoutMad > 9000) return "Clear payout batch to preserve trust"
  return "Maintain controlled execution cadence"
}

export function getAmbassadorReadiness(record: AmbassadorProgramRecord) {
  return Math.round((record.score + record.complianceScore + record.contentScore + record.missionCompletion) / 4)
}
