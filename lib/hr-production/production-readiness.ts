import { diagnoseHRSync } from './sync-repair'
import { getHRDashboardData } from './repository'

export async function getHRProductionReadiness() {
  const data = await getHRDashboardData()
  const sync = await diagnoseHRSync()
  const counts = {
    staff: data.staff?.length || 0,
    candidates: data.candidates?.length || 0,
    onboarding: data.onboarding?.length || 0,
    attendance: data.attendance?.length || 0,
    rosters: data.rosters?.length || 0,
    documents: data.documents?.length || 0,
    contracts: data.contracts?.length || 0,
    training: data.training?.length || 0,
    payroll: data.payroll?.length || 0,
  }
  const critical = sync.issues.filter(i => i.severity === 'critical').length
  const missingCore = Object.entries(counts).filter(([k, v]) => ['staff','documents','contracts','onboarding'].includes(k) && v === 0).length
  const score = Math.max(0, Math.min(100, 100 - critical * 8 - missingCore * 10 - Object.keys(data.errors || {}).length * 5))
  return { ok: true, score, status: score >= 90 ? 'production_ready' : score >= 70 ? 'needs_hardening' : 'not_ready', counts, criticalIssues: critical, errors: data.errors, issues: sync.issues.slice(0, 25), loadedAt: new Date().toISOString() }
}
