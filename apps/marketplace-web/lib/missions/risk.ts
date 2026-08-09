import type { MissionControlRecord } from './types'

export function computeMissionRisk(record: MissionControlRecord): 'normal' | 'watch' | 'elevated' | 'critical' {
  if (record.status === 'incident' || record.riskLevel === 'critical') return 'critical'
  if (!record.caregiverId && record.missionKind !== 'dossier') return 'elevated'
  if (record.reportStatus === 'needs_correction' || record.validationStatus === 'needs_review') return 'watch'
  return (record.riskLevel as 'normal' | 'watch' | 'elevated' | 'critical') || 'normal'
}
