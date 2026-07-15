export function formatMad(value: number | string = 0) {
  const amount = Number(value || 0)
  return `${amount.toLocaleString("fr-MA")} MAD`
}

export function summarizeHealth(input: any = {}) {
  return {
    score: Number(input.score || input.averageHealth || 0),
    averageHealth: Number(input.averageHealth || input.score || 0),
    active: Number(input.active || 0),
    watchlist: Number(input.watchlist || 0),
    revenueMad: Number(input.revenueMad || input.revenue || 0),
    status: input.status || "not-configured",
    risk: input.risk || "low",
    label: input.label || "Health not configured",
  }
}

export function deriveAmbassadorHealth(input: any = {}) {
  return summarizeHealth(input)
}

export function scoreAmbassadorHealth(input: any = {}) {
  return summarizeHealth(input)
}

export function getCampaignProgress(input: any = {}) {
  const total = Number(input.total || input.target || 0)
  const done = Number(input.done || input.completed || input.progress || 0)
  return total ? Math.round((done / total) * 100) : Number(input.progress || 0)
}

export function getPayoutDecision(input: any = {}) {
  return String(input.decision || input.status || "Review")
}

export function getPayoutDecisionDetail(input: any = {}) {
  return {
    label: input.decision || "Review",
    tone: input.tone || "slate",
    blocked: Boolean(input.blocked),
  }
}

export function deriveCampaignAssignments(input: any[] = []) {
  return Array.isArray(input) ? input : []
}

export function deriveCompliancePayouts(input: any[] = []) {
  return Array.isArray(input) ? input : []
}

export function deriveRegionalExecution(input: any[] = []) {
  return Array.isArray(input) ? input : []
}

export default {
  formatMad,
  summarizeHealth,
  deriveAmbassadorHealth,
  scoreAmbassadorHealth,
  getCampaignProgress,
  getPayoutDecision,
  getPayoutDecisionDetail,
  deriveCampaignAssignments,
  deriveCompliancePayouts,
  deriveRegionalExecution,
}
