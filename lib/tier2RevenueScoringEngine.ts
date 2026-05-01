export type ProspectScore = {
  total_score: number
  fit_score: number
  urgency_score: number
  risk_score: number
  revenue_score: number
  next_best_action: string
  rationale: Record<string, any>
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)))
}

function hoursSince(date?: string | null) {
  if (!date) return 9999
  return (Date.now() - new Date(date).getTime()) / 36e5
}

function stageScore(stage?: string | null) {
  const normalized = String(stage || '').toLowerCase()
  const map: Record<string, number> = {
    new: 25,
    prospecting: 35,
    contacted: 45,
    qualified: 65,
    proposal: 78,
    negotiation: 88,
    won: 100,
    lost: 0,
  }
  return map[normalized] ?? 35
}

export function scoreProspect(prospect: any): ProspectScore {
  const value = Number(prospect.estimated_value || 0)
  const probability = Number(prospect.probability || 0)
  const strategic = Number(prospect.strategic_value || 0)
  const hasNextAction = Boolean(prospect.next_action || prospect.next_action_at)
  const inactivityHours = hoursSince(prospect.last_interaction_at || prospect.updated_at || prospect.created_at)
  const stage = String(prospect.stage || prospect.status || 'prospecting').toLowerCase()

  const revenue_score = clamp(
    Math.min(value / 1000, 50) + probability * 0.35 + strategic * 0.15
  )

  const fit_score = clamp(
    strategic * 0.55 + stageScore(stage) * 0.25 + (value >= 5000 ? 15 : 5)
  )

  const urgency_score = clamp(
    (hasNextAction ? 20 : 55) +
    (inactivityHours >= 72 ? 25 : inactivityHours >= 48 ? 18 : inactivityHours >= 24 ? 10 : 0) +
    (value >= 10000 ? 18 : value >= 5000 ? 10 : 3)
  )

  const risk_score = clamp(
    (!hasNextAction ? 35 : 5) +
    (inactivityHours >= 72 ? 30 : inactivityHours >= 48 ? 20 : inactivityHours >= 24 ? 10 : 0) +
    (stage === 'lost' ? 40 : 0) +
    (value >= 10000 && !hasNextAction ? 15 : 0)
  )

  const total_score = clamp(
    revenue_score * 0.35 +
    fit_score * 0.25 +
    urgency_score * 0.25 +
    (100 - risk_score) * 0.15
  )

  let next_best_action = 'Maintain normal follow-up cadence.'
  if (!hasNextAction) next_best_action = 'Define a next action and deadline immediately.'
  else if (risk_score >= 70) next_best_action = 'Manager intervention required: recover stalled prospect.'
  else if (urgency_score >= 75) next_best_action = 'Call or WhatsApp today and log outcome.'
  else if (revenue_score >= 75) next_best_action = 'Prepare offer path and push toward appointment/proposal.'
  else if (fit_score >= 75) next_best_action = 'Deepen qualification and identify decision maker.'

  return {
    total_score,
    fit_score,
    urgency_score,
    risk_score,
    revenue_score,
    next_best_action,
    rationale: {
      value,
      probability,
      strategic,
      has_next_action: hasNextAction,
      inactivity_hours: Math.round(inactivityHours),
      stage,
      scoring_version: 'tier2-pack1-v1',
    },
  }
}

export function summarizeScores(scores: ProspectScore[]) {
  if (!scores.length) {
    return { avg_score: 0, high_priority_count: 0, high_risk_count: 0 }
  }

  const avg_score = scores.reduce((sum, s) => sum + s.total_score, 0) / scores.length
  const high_priority_count = scores.filter((s) => s.total_score >= 75 || s.urgency_score >= 75).length
  const high_risk_count = scores.filter((s) => s.risk_score >= 65).length

  return {
    avg_score: Math.round(avg_score),
    high_priority_count,
    high_risk_count,
  }
}
