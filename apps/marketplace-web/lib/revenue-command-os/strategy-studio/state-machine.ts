import type { StudioAction, StudioStatus } from './types'
const actionStatus: Partial<Record<StudioAction, StudioStatus>> = {
  approve: 'ready_for_mz13', reject: 'rejected', amend: 'ready_for_mz13', combine: 'ready_for_mz13',
  request_reanalysis: 'ready_for_mz13', request_evidence: 'ready_for_mz13', change_objective: 'ready_for_mz13',
  change_constraint: 'ready_for_mz13', change_approval_class: 'ready_for_mz13', archive: 'archived', reopen: 'ready_for_mz13',
}
export function nextStudioStatus(current: StudioStatus, action: StudioAction, _conditional = false): StudioStatus {
  return actionStatus[action] || current
}
