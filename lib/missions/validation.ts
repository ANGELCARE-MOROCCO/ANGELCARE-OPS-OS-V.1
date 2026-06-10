import { patchMission } from './repository'
import { recordMissionEvent } from './events'

export async function validateMissionReport(missionId: number, note?: string) {
  const mission = await patchMission(missionId, {
    validation_status: 'validated',
    report_status: 'validated',
    lifecycle_stage: 'completed',
    status: 'completed',
    validated_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  })
  await recordMissionEvent({ missionId, eventType: 'mission_validated', content: note || 'Mission validated by operations', source: 'missions_validation' })
  return mission
}
