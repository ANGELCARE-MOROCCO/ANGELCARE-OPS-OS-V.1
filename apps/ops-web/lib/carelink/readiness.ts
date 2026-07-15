import type { CareLinkAgent, CareLinkMission, ReadinessResult } from './types'

export function computeReadiness(agent: CareLinkAgent | undefined, mission: CareLinkMission | undefined): ReadinessResult {
  const blockers: string[] = []
  const warnings: string[] = []
  if (!agent) blockers.push('Profil agent introuvable')
  if (!mission) blockers.push('Mission introuvable')
  if (agent?.complianceStatus === 'blocked') blockers.push('Conformité agent bloquante')
  if (agent?.complianceStatus === 'warning') warnings.push('Document ou formation à vérifier')
  if (mission?.readinessStatus === 'blocked') blockers.push('Préparation de mission bloquée')
  if (mission?.readinessStatus === 'warning') warnings.push('Mission avec points de vigilance')
  const required = mission?.checklist.filter((item) => item.required).length || 0
  const completed = mission?.checklist.filter((item) => item.required && item.completed).length || 0
  if (required > 0 && completed < Math.ceil(required / 2)) warnings.push('Checklist préparatoire encore faible')
  const base = Math.round(((agent?.reliabilityScore || 70) + (mission?.readinessScore || 70)) / 2)
  const score = Math.max(0, Math.min(100, base - blockers.length * 35 - warnings.length * 8))
  return {
    score,
    status: blockers.length ? 'blocked' : warnings.length ? 'warning' : 'ready',
    blockers,
    warnings,
    nextAction: blockers[0] || warnings[0] || 'Agent prêt pour exécution terrain',
  }
}
