import { SOFT_LAUNCH_REQUIRED_GATES } from './constants'
import type { TerritoryGateStatus, TerritoryLaunchCheck, TerritoryReadinessSummary } from './types'

export function isTerritoryGatePassed(status: TerritoryGateStatus): boolean {
  return status === 'passed' || status === 'waiver_approved' || status === 'not_applicable'
}

export function calculateTerritoryReadiness(checks: TerritoryLaunchCheck[]): TerritoryReadinessSummary {
  const weightedTotal = checks.reduce((sum, check) => sum + Math.max(0, check.score_weight), 0)
  const weightedScore = checks.reduce((sum, check) => {
    const normalized = isTerritoryGatePassed(check.status) ? 100 : ['in_progress', 'submitted'].includes(check.status) ? 50 : 0
    return sum + normalized * Math.max(0, check.score_weight)
  }, 0)
  const blocking = checks.filter((check) => check.requirement_level === 'mandatory_blocking' && !isTerritoryGatePassed(check.status)).length
  const warnings = checks.filter((check) => check.status === 'failed' && check.requirement_level !== 'mandatory_blocking').length
  const missingOwners = checks.filter((check) => !check.owner_id && !check.owner_role).length
  const now = Date.now()
  const overdue = checks.filter((check) => check.due_at && new Date(check.due_at).getTime() < now && !isTerritoryGatePassed(check.status)).length
  const score = weightedTotal ? Math.round(weightedScore / weightedTotal) : 0
  const softBlocking = checks.filter((check) => SOFT_LAUNCH_REQUIRED_GATES.has(check.gate_key) && !isTerritoryGatePassed(check.status)).length
  return {
    score,
    total: checks.length,
    passed: checks.filter((check) => isTerritoryGatePassed(check.status)).length,
    blocking,
    warnings,
    missingOwners,
    overdue,
    recommendedTransition: blocking === 0 ? 'live' : softBlocking === 0 ? 'soft_launch' : null,
    launchEligible: checks.length > 0 && blocking === 0,
    softLaunchEligible: checks.length > 0 && softBlocking === 0,
  }
}
