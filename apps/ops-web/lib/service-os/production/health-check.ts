import { SERVICE_OS_ROUTES } from './route-registry'
import { getServiceOSCommandState } from './repository'
export async function getServiceOSHealthCheck() {
  const state = await getServiceOSCommandState()
  const blueprintCoverage = state.blueprints.length
  const activeBlueprints = state.blueprints.filter(b => b.status === 'active').length
  const cityCoverage = new Set(state.deployments.map(d => d.city)).size
  const moduleCoverage = state.modules.length
  const ruleCoverage = state.rules.filter(r => r.status === 'active').length
  const score = Math.min(100, Math.round(20 + activeBlueprints * 6 + cityCoverage * 5 + moduleCoverage * 2 + ruleCoverage * 3))
  return { score, routes: SERVICE_OS_ROUTES.length, blueprintCoverage, activeBlueprints, cityCoverage, moduleCoverage, ruleCoverage, productionStatus: score >= 85 ? 'production-ready' : score >= 65 ? 'stabilization' : 'foundation' }
}
