import type { ServiceOSBlueprint, ServiceOSCityDeployment } from './types'
export type ServiceOSMatchRequest = { city: string; family?: string; needTags: string[]; institution?: boolean; subscription?: boolean; urgency?: boolean }
export function rankServiceOSBlueprints(request: ServiceOSMatchRequest, blueprints: ServiceOSBlueprint[], deployments: ServiceOSCityDeployment[]) {
  const city = deployments.find(d => d.city.toLowerCase() === request.city.toLowerCase())
  return blueprints.map(bp => {
    let score = 30
    if (bp.cities.includes(request.city)) score += 25
    if (request.family && bp.family === request.family) score += 20
    score += request.needTags.filter(t => bp.aiTags.includes(t) || bp.description.toLowerCase().includes(t.toLowerCase())).length * 12
    if (request.institution && bp.institutionalEligible) score += 15
    if (request.subscription && bp.subscriptionEligible) score += 10
    if (request.urgency && bp.modules.includes('EMERGENCY_RAPID')) score += 12
    if (city) score += Math.round((city.capacityScore - city.riskScore) / 10)
    return { blueprint: bp, score: Math.max(0, Math.min(100, score)), reason: `Fit ${bp.family}; city ${request.city}; tags ${request.needTags.join(', ')}` }
  }).sort((a,b) => b.score - a.score)
}
