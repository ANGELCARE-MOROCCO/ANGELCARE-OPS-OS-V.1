export type Phase3Tone = "slate" | "emerald" | "amber" | "rose" | "blue"

export type Phase3ScoreInput = {
  readiness: number
  complianceScore: number
  leadScore: number
  revenueMAD: number
  missionsApproved: number
  missionsTotal: number
  openRisks: number
}

export type Phase3Score = {
  health: number
  risk: "Low" | "Medium" | "High" | "Critical"
  tone: Phase3Tone
  recommendation: string
}

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function phase3Percent(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return 0
  return clampScore((numerator / denominator) * 100)
}

export function scoreAmbassador(input: Phase3ScoreInput): Phase3Score {
  const missionScore = phase3Percent(input.missionsApproved, input.missionsTotal)
  const revenueScore = clampScore(input.revenueMAD / 1200)
  const riskPenalty = Math.min(40, input.openRisks * 14)
  const health = clampScore(input.readiness * 0.28 + input.complianceScore * 0.28 + input.leadScore * 0.18 + missionScore * 0.16 + revenueScore * 0.10 - riskPenalty)

  if (input.openRisks >= 3 || health < 45) {
    return { health, risk: "Critical", tone: "rose", recommendation: "Freeze sensitive missions, assign coaching, and resolve risk before payout escalation." }
  }
  if (input.openRisks > 0 || health < 65) {
    return { health, risk: "High", tone: "amber", recommendation: "Keep active, but route through manager validation and require proof review." }
  }
  if (health < 82) {
    return { health, risk: "Medium", tone: "blue", recommendation: "Assign standard missions and push one training or lead conversion objective." }
  }
  return { health, risk: "Low", tone: "emerald", recommendation: "Prioritize for high-value campaigns, territory expansion, and elite rewards." }
}

export function formatMadShort(value: number): string {
  if (!Number.isFinite(value)) return "0 MAD"
  if (Math.abs(value) >= 1000000) return `${Math.round(value / 100000) / 10}M MAD`
  if (Math.abs(value) >= 1000) return `${Math.round(value / 100) / 10}K MAD`
  return `${Math.round(value)} MAD`
}

export function buildPhase3ActionId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}
