import type { MissionLifecycleStage } from './types'

export const MISSION_LIFECYCLE: MissionLifecycleStage[] = [
  'draft',
  'intake_review',
  'ready_for_assignment',
  'assigned',
  'family_confirmed',
  'caregiver_confirmed',
  'confirmed',
  'pre_mission_check',
  'en_route',
  'checked_in',
  'in_progress',
  'field_report_pending',
  'report_submitted',
  'ops_validation',
  'completed',
  'incident',
  'cancelled',
  'archived',
]

const transitions: Record<MissionLifecycleStage, MissionLifecycleStage[]> = {
  draft: ['intake_review', 'ready_for_assignment', 'cancelled'],
  intake_review: ['ready_for_assignment', 'cancelled'],
  ready_for_assignment: ['assigned', 'cancelled'],
  assigned: ['family_confirmed', 'caregiver_confirmed', 'confirmed', 'cancelled'],
  family_confirmed: ['caregiver_confirmed', 'confirmed', 'cancelled'],
  caregiver_confirmed: ['family_confirmed', 'confirmed', 'cancelled'],
  confirmed: ['pre_mission_check', 'en_route', 'cancelled'],
  pre_mission_check: ['en_route', 'checked_in', 'incident', 'cancelled'],
  en_route: ['checked_in', 'incident', 'cancelled'],
  checked_in: ['in_progress', 'incident', 'cancelled'],
  in_progress: ['field_report_pending', 'incident', 'cancelled'],
  field_report_pending: ['report_submitted', 'incident'],
  report_submitted: ['ops_validation', 'completed'],
  ops_validation: ['completed', 'report_submitted'],
  completed: ['archived'],
  incident: ['ops_validation', 'cancelled', 'completed'],
  cancelled: ['archived'],
  archived: [],
}

export function normalizeLifecycle(stage?: string | null): MissionLifecycleStage {
  if (stage && MISSION_LIFECYCLE.includes(stage as MissionLifecycleStage)) return stage as MissionLifecycleStage
  return 'draft'
}

export function canTransitionMission(from: string | null | undefined, to: MissionLifecycleStage): boolean {
  const current = normalizeLifecycle(from)
  return transitions[current].includes(to)
}

export function lifecycleToLegacyStatus(stage: MissionLifecycleStage): string {
  if (['draft', 'intake_review', 'ready_for_assignment'].includes(stage)) return 'draft'
  if (['assigned', 'family_confirmed', 'caregiver_confirmed', 'confirmed', 'pre_mission_check', 'en_route', 'checked_in'].includes(stage)) return stage === 'confirmed' ? 'confirmed' : 'assigned'
  if (stage === 'in_progress') return 'in_progress'
  if (['field_report_pending', 'report_submitted', 'ops_validation', 'completed'].includes(stage)) return stage === 'completed' ? 'completed' : 'in_progress'
  if (stage === 'incident') return 'incident'
  if (stage === 'cancelled') return 'cancelled'
  if (stage === 'archived') return 'completed'
  return 'draft'
}

export function timestampPatchForStage(stage: MissionLifecycleStage): Record<string, string> {
  const now = new Date().toISOString()
  if (stage === 'confirmed') return { confirmed_at: now }
  if (stage === 'in_progress') return { started_at: now }
  if (stage === 'completed') return { completed_at: now }
  if (stage === 'incident') return { incident_at: now }
  if (stage === 'cancelled') return { cancelled_at: now }
  return {}
}
