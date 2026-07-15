import { patchMission } from './repository'
import { recordMissionEvent } from './events'

export async function submitMissionReport(missionId: number, report: Record<string, unknown>) {
  const mission = await patchMission(missionId, {
    report_status: 'submitted',
    validation_status: 'ready',
    lifecycle_stage: 'report_submitted',
    report_submitted_at: new Date().toISOString(),
  })
  await recordMissionEvent({ missionId, eventType: 'mission_report_submitted', content: 'Mission report submitted', metadata: { report }, source: 'missions_reports' })
  return mission
}
