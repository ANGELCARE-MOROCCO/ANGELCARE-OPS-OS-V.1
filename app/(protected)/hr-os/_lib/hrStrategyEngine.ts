export type HrTalentProfile = {
  ready?: boolean | null
  compliant?: boolean | null
  performanceScore?: number | null
}

export type TalentClassification =
  | 'deployable'
  | 'blocked_compliance'
  | 'training_required'
  | 'unknown'

export type RetentionRisk = 'high' | 'medium' | 'low'

export function computeWorkforceGap(current: number, required: number): number {
  return required - current
}

export function classifyTalent(profile: HrTalentProfile): TalentClassification {
  if (profile.ready && profile.compliant) return 'deployable'
  if (!profile.compliant) return 'blocked_compliance'
  if (!profile.ready) return 'training_required'
  return 'unknown'
}

export function retentionRisk(score: number): RetentionRisk {
  if (score < 40) return 'high'
  if (score < 70) return 'medium'
  return 'low'
}
