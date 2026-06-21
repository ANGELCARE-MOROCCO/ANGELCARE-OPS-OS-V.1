import { patchMission } from './repository'
import { recordMissionEvent } from './events'

export async function assignMissionCaregiver(missionId: number, caregiverId: number | null, scope: 'single' | 'all_sub_missions' | 'this_and_following' = 'single') {
  const patch = {
    caregiver_id: caregiverId,
    status: caregiverId ? 'assigned' : 'draft',
    lifecycle_stage: caregiverId ? 'assigned' : 'ready_for_assignment',
  }
  const mission = await patchMission(missionId, patch)
  await recordMissionEvent({
    missionId,
    eventType: caregiverId ? 'caregiver_assigned' : 'caregiver_unassigned',
    content: caregiverId ? `Caregiver assigned: #${caregiverId}` : 'Caregiver removed',
    metadata: { caregiver_id: caregiverId, scope },
    source: 'missions_assignment',
  })
  return mission
}
