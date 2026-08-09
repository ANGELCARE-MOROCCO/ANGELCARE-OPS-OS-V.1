import 'server-only'
import type { EligibleRelease, EligibilityResult, SolutionRequest } from '../types'

function intersects(left: string[], right: string[]) { return !right.length || left.some((value) => right.includes(value)) }
function withinAge(release: EligibleRelease, ages: number[]) {
  if (!ages.length) return true
  return ages.every((age) => (release.ageMinMonths == null || age >= release.ageMinMonths) && (release.ageMaxMonths == null || age <= release.ageMaxMonths))
}

export function evaluateReleaseEligibility(request: SolutionRequest, release: EligibleRelease): EligibilityResult {
  const reasons: string[] = []
  const warnings: string[] = []
  let eligible = true
  const fail = (reason: string) => { eligible = false; reasons.push(reason) }

  if (!['approved', 'released', 'commercially_active'].includes(release.releaseStatus)) fail('Product release is not approved and commercially usable.')
  if (release.commercialStatus === 'ineligible') fail('Release is explicitly commercially ineligible.')
  if (!release.markets.includes(request.universe)) fail(`Release is not authorised for ${request.universe.toUpperCase()}.`)
  if (!withinAge(release, request.profile.learnerAgesMonths)) fail('Learner age falls outside the release suitability range.')
  if (!intersects(release.languages, request.profile.languages)) fail('Required language is unavailable.')
  if (!intersects(release.usageContexts, request.constraints.usageContexts)) fail('Usage context is incompatible.')
  if (!release.formats.includes(request.constraints.deliveryMode) && request.constraints.deliveryMode !== 'hybrid') fail('Required delivery format is unavailable.')
  if (request.constraints.requiredFormats.length && !request.constraints.requiredFormats.some((format) => release.formats.includes(format))) fail('Mandatory format constraint is not met.')
  if (request.constraints.excludedReleaseIds.includes(release.id)) fail('Release was explicitly excluded by the operator.')
  if (release.leadTimeDays > request.constraints.maximumLeadTimeDays) fail('Lead time exceeds the request constraint.')
  if (release.basePriceDh == null || release.basePriceDh <= 0) fail('Active price is missing.')
  if (release.unitCostDh == null || release.unitCostDh < 0) fail('Cost basis is missing.')
  if (release.blockingFindings.length) fail('Open release-blocking quality findings exist.')
  if (release.stockState === 'unknown') warnings.push('Stock state requires manual confirmation.')
  if (release.stockState === 'limited') warnings.push('Stock is limited and must be confirmed before quotation.')
  if (release.stockState === 'production_required') warnings.push('Production lead time must be reconfirmed.')
  if (release.effectiveUntil && new Date(release.effectiveUntil).getTime() < Date.now()) fail('Commercial eligibility has expired.')
  if (release.effectiveFrom && new Date(release.effectiveFrom).getTime() > Date.now()) fail('Commercial eligibility is not yet effective.')

  const requestedCoverage = new Set([...request.constraints.objectiveKeys, ...request.constraints.painPointKeys, ...request.constraints.outcomeKeys])
  const releaseCoverage = new Set([...release.objectiveKeys, ...release.painPointKeys, ...release.outcomeKeys])
  const hits = [...requestedCoverage].filter((key) => releaseCoverage.has(key)).length
  const coverageRatio = requestedCoverage.size ? hits / requestedCoverage.size : 1
  if (eligible) reasons.push('Approved exact release satisfies all mandatory commercial constraints.')
  if (coverageRatio === 0) warnings.push('Release is eligible but does not directly cover a selected objective, pain point or outcome.')
  const score = Math.max(0, Math.min(100, Math.round((eligible ? 55 : 0) + coverageRatio * 40 + (warnings.length ? 0 : 5))))
  return { id: `elig-${request.id}-${release.id}`, requestId: request.id, releaseId: release.id, eligible, reasons, warnings, score, evaluatedAt: new Date().toISOString() }
}

export function evaluateCandidatePool(request: SolutionRequest, releases: EligibleRelease[]) {
  const results = releases.map((release) => evaluateReleaseEligibility(request, release))
  const eligibleIds = new Set(results.filter((item) => item.eligible).map((item) => item.releaseId))
  const requiredMissing = request.constraints.requiredReleaseIds.filter((id) => !eligibleIds.has(id))
  return { results, eligibleReleases: releases.filter((release) => eligibleIds.has(release.id)), requiredMissing }
}
