import { createClient } from '@/lib/supabase/server'
import { recordMissionEvent } from './events'
import type { MissionRow } from './types'

export type CreateDossierInput = {
  familyId: number | null
  caregiverId?: number | null
  serviceType: string
  missionDate?: string | null
  startTime?: string | null
  endTime?: string | null
  city?: string | null
  zone?: string | null
  notes?: string | null
  recurrenceType?: string | null
  recurrenceRule?: Record<string, unknown>
  recurrenceStartDate?: string | null
  recurrenceEndDate?: string | null
}

export async function createMissionDossier(input: CreateDossierInput): Promise<MissionRow> {
  const supabase = await createClient()
  const groupId = crypto.randomUUID()
  const { data, error } = await supabase
    .from('missions')
    .insert([
      {
        family_id: input.familyId,
        caregiver_id: input.caregiverId || null,
        service_type: input.serviceType,
        mission_date: input.missionDate || input.recurrenceStartDate || null,
        start_time: input.startTime || null,
        end_time: input.endTime || null,
        status: 'draft',
        lifecycle_stage: 'intake_review',
        mission_kind: 'dossier',
        mission_group_id: groupId,
        recurrence_type: input.recurrenceType || null,
        recurrence_rule: input.recurrenceRule || {},
        recurrence_start_date: input.recurrenceStartDate || input.missionDate || null,
        recurrence_end_date: input.recurrenceEndDate || null,
        dossier_status: 'active',
        city: input.city || null,
        zone: input.zone || null,
        notes: input.notes || null,
      },
    ])
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  await recordMissionEvent({ missionId: Number(data.id), eventType: 'mission_dossier_created', content: 'Mission dossier created', metadata: { mission_group_id: groupId } })
  return data as MissionRow
}

export async function generateSubMissions(parentId: number, occurrences: Array<{ missionDate: string; startTime?: string | null; endTime?: string | null; caregiverId?: number | null; notes?: string | null }>): Promise<MissionRow[]> {
  const supabase = await createClient()
  const { data: parent, error: parentError } = await supabase.from('missions').select('*').eq('id', parentId).maybeSingle()
  if (parentError) throw new Error(parentError.message)
  if (!parent) throw new Error('Parent mission dossier not found')
  const rows = occurrences.map((item, index) => ({
    parent_mission_id: parentId,
    mission_group_id: parent.mission_group_id || crypto.randomUUID(),
    mission_kind: 'sub_mission',
    occurrence_index: index + 1,
    family_id: parent.family_id,
    caregiver_id: item.caregiverId ?? parent.caregiver_id ?? null,
    contract_id: parent.contract_id || null,
    service_type: parent.service_type,
    service_family: parent.service_family || null,
    mission_scope: parent.mission_scope || null,
    internal_procedure_level: parent.internal_procedure_level || null,
    mission_date: item.missionDate,
    start_time: item.startTime || parent.start_time || null,
    end_time: item.endTime || parent.end_time || null,
    city: parent.city || null,
    zone: parent.zone || null,
    status: item.caregiverId || parent.caregiver_id ? 'assigned' : 'draft',
    lifecycle_stage: item.caregiverId || parent.caregiver_id ? 'assigned' : 'ready_for_assignment',
    readiness_status: 'pending',
    validation_status: 'pending',
    report_status: 'pending',
    notes: item.notes || null,
  }))
  if (!rows.length) return []
  const { data, error } = await supabase.from('missions').insert(rows).select('*')
  if (error) throw new Error(error.message)
  await recordMissionEvent({ missionId: parentId, eventType: 'sub_missions_generated', content: `${rows.length} sub-missions generated`, metadata: { count: rows.length } })
  return (data || []) as MissionRow[]
}
