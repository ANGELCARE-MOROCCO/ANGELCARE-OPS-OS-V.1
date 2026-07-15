import { createClient } from '@/lib/supabase/server'
import { patchMission } from './repository'
import { recordMissionEvent } from './events'

type AssignmentScope = 'single' | 'all_sub_missions' | 'this_and_following'

function parsePositiveId(value: unknown) {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

function readJson(value: unknown): Record<string, unknown> {
  if (!value) return {}
  if (typeof value === 'object') return value as Record<string, unknown>
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {}
    } catch {}
  }
  return {}
}

async function resolveAssignmentMissionIds(missionId: number, scope: AssignmentScope) {
  if (scope === 'single') return [missionId]
  const supabase = await createClient()
  const { data: current } = await supabase
    .from('missions')
    .select('id,parent_mission_id,mission_date,start_time')
    .eq('id', missionId)
    .maybeSingle()

  const parentId = parsePositiveId((current as any)?.parent_mission_id) || missionId
  const { data } = await supabase
    .from('missions')
    .select('id,parent_mission_id,mission_date,start_time')
    .or(`id.eq.${parentId},parent_mission_id.eq.${parentId}`)

  const rows = Array.isArray(data) ? data : []
  if (scope === 'this_and_following' && current) {
    const currentKey = `${(current as any).mission_date || ''} ${(current as any).start_time || ''}`.trim()
    const filtered = rows.filter((row: any) => {
      if (Number(row.id) === parentId) return true
      const rowKey = `${row.mission_date || ''} ${row.start_time || ''}`.trim()
      return !currentKey || !rowKey || rowKey >= currentKey
    })
    return Array.from(new Set(filtered.map((row: any) => Number(row.id)).filter(Boolean)))
  }
  return Array.from(new Set(rows.map((row: any) => Number(row.id)).filter(Boolean)))
}

export async function assignMissionCaregiver(
  missionId: number,
  caregiverId: number | null,
  scope: AssignmentScope = 'single',
  backupCaregiverId: number | null = null,
  note = 'Mission caregiver assignment updated',
) {
  const targetIds = await resolveAssignmentMissionIds(missionId, scope)
  const patched = []

  for (const targetId of targetIds.length ? targetIds : [missionId]) {
    const supabase = await createClient()
    const { data: existing } = await supabase
      .from('missions')
      .select('recurrence_rule')
      .eq('id', targetId)
      .maybeSingle()

    const recurrenceRule = {
      ...readJson((existing as any)?.recurrence_rule),
      assignmentScope: scope,
      backupCaregiverId,
      backup_caregiver_id: backupCaregiverId,
      assignmentNote: note,
      assignmentUpdatedAt: new Date().toISOString(),
      assignmentSource: 'carelink_ops_missions_assignment_studio',
    }

    const patch = {
      caregiver_id: caregiverId,
      status: caregiverId ? 'assigned' : 'draft',
      lifecycle_stage: caregiverId ? 'assigned' : 'ready_for_assignment',
      recurrence_rule: recurrenceRule,
    }

    const mission = await patchMission(targetId, patch)
    patched.push(mission)
    await recordMissionEvent({
      missionId: targetId,
      eventType: caregiverId ? 'caregiver_assigned' : 'caregiver_unassigned',
      content: caregiverId ? `Caregiver assigned: #${caregiverId}${backupCaregiverId ? ` · backup #${backupCaregiverId}` : ''}` : 'Caregiver removed',
      metadata: { caregiver_id: caregiverId, backup_caregiver_id: backupCaregiverId, scope, note, source: 'carelink_ops_missions_assignment_studio' },
      source: 'missions_assignment',
    })
  }

  return patched.length === 1 ? patched[0] : { parentMissionId: missionId, scope, updatedMissionIds: targetIds, missions: patched }
}
