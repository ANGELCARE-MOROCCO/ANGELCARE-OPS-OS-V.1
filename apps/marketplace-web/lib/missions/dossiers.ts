import { createClient } from '@/lib/supabase/server'
import { recordMissionEvent } from './events'
import type { MissionRow } from './types'

export type CreateDossierInput = {
  requestId?: string | null
  familyId: number | null
  caregiverId?: number | null
  backupCaregiverId?: number | null
  serviceType: string
  missionDate?: string | null
  startTime?: string | null
  endTime?: string | null
  city?: string | null
  zone?: string | null
  notes?: string | null
  riskLevel?: string | null
  urgency?: string | null
  internalProcedureLevel?: string | null
  transportRequired?: string | null
  language?: string | null
  requiredSkills?: string[]
  recurrenceType?: string | null
  recurrenceRule?: Record<string, unknown>
  recurrenceStartDate?: string | null
  recurrenceEndDate?: string | null
}

function dossierBaseCode(idOrGroup: unknown) {
  const text = String(idOrGroup || '').trim()
  if (!text) return `CARE-${Date.now()}`
  if (/^CARE-/i.test(text)) return text.replace(/\*(S|\d+)$/i, '')
  if (/^DOS-/i.test(text)) return text.replace(/^DOS-/i, 'CARE-').replace(/\*(S|\d+)$/i, '')
  return `CARE-${text}`.replace(/\*(S|\d+)$/i, '')
}

function linkedMissionCode(base: string, index: number, total: number) {
  return total <= 1 ? `${base}*S` : `${base}*${index + 1}`
}

export async function createMissionDossier(input: CreateDossierInput): Promise<MissionRow> {
  const supabase = await createClient()
  const groupId = input.requestId || crypto.randomUUID()

  const payload = {
    family_id: input.familyId,
    caregiver_id: input.caregiverId || null,
    service_type: input.serviceType,
    mission_date: input.missionDate || input.recurrenceStartDate || null,
    start_time: input.startTime || null,
    end_time: input.endTime || null,
    status: input.caregiverId ? 'assigned' : 'draft',
    lifecycle_stage: input.caregiverId ? 'assigned' : 'ready_for_assignment',
    mission_kind: 'dossier',
    mission_group_id: groupId,
    recurrence_type: input.recurrenceType || null,
    recurrence_rule: input.recurrenceRule || {},
    recurrence_start_date: input.recurrenceStartDate || input.missionDate || null,
    recurrence_end_date: input.recurrenceEndDate || null,
    dossier_status: 'active',
    dossier_reference: `DOS-${groupId.slice(0, 8).toUpperCase()}`,
    city: input.city || null,
    zone: input.zone || null,
    notes: input.notes || null,
    urgency: input.urgency || 'standard',
    risk_level: input.riskLevel || 'normal',
    internal_procedure_level: input.internalProcedureLevel || null,
    service_family: input.serviceType,
    mission_scope: input.transportRequired || null,
    report_status: input.caregiverId ? 'pending' : 'not_required',
    validation_status: 'pending',
    readiness_status: input.caregiverId ? 'ready' : 'pending',
  }

  const existing = await supabase
    .from('missions')
    .select('*')
    .eq('mission_group_id', groupId)
    .eq('mission_kind', 'dossier')
    .maybeSingle()

  if (existing.error) throw new Error(existing.error.message)

  if (existing.data?.id) {
    const { data, error } = await supabase
      .from('missions')
      .update(payload)
      .eq('id', existing.data.id)
      .select('*')
      .single()

    if (error) throw new Error(error.message)

    await recordMissionEvent({
      missionId: Number(data.id),
      eventType: 'mission_dossier_updated',
      content: 'Mission dossier updated',
      metadata: {
        mission_group_id: groupId,
        backup_caregiver_id: input.backupCaregiverId || null,
      },
      source: 'mission_dossier_engine',
    })

    return data as MissionRow
  }

  const { data, error } = await supabase
    .from('missions')
    .insert([payload])
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  await recordMissionEvent({
    missionId: Number(data.id),
    eventType: 'mission_dossier_created',
    content: 'Mission dossier created',
    metadata: {
      mission_group_id: groupId,
      backup_caregiver_id: input.backupCaregiverId || null,
    },
    source: 'mission_dossier_engine',
  })

  return data as MissionRow
}

export async function generateSubMissions(
  parentId: number,
  occurrences: Array<{
    missionDate: string
    startTime?: string | null
    endTime?: string | null
    caregiverId?: number | null
    notes?: string | null
  }>
): Promise<MissionRow[]> {
  const supabase = await createClient()

  const { data: parent, error: parentError } = await supabase
    .from('missions')
    .select('*')
    .eq('id', parentId)
    .maybeSingle()

  if (parentError) throw new Error(parentError.message)
  if (!parent) throw new Error('Parent mission dossier not found')

  const missionGroupId = parent.mission_group_id || crypto.randomUUID()
  const baseCode = dossierBaseCode(parent.dossier_reference || parent.mission_reference || parent.id)
  const total = occurrences.length

  const { data: existingRows, error: existingError } = await supabase
    .from('missions')
    .select('*')
    .eq('parent_mission_id', parentId)

  if (existingError) throw new Error(existingError.message)

  const existingByIndex = new Map<number, MissionRow>()

  ;((existingRows || []) as MissionRow[]).forEach((row) => {
    const index = Number((row as any).occurrence_index || 0)
    if (index) existingByIndex.set(index, row)
  })

  const created: MissionRow[] = []

  if (total <= 1) {
    const item = occurrences[0]
    const code = linkedMissionCode(baseCode, 0, 1)

    const { data, error } = await supabase
      .from('missions')
      .update({
        mission_group_id: missionGroupId,
        mission_kind: 'single',
        occurrence_index: null,
        dossier_reference: baseCode,
        mission_reference: code,
        caregiver_id: item?.caregiverId ?? parent.caregiver_id ?? null,
        mission_date: item?.missionDate || parent.mission_date || null,
        start_time: item?.startTime || parent.start_time || null,
        end_time: item?.endTime || parent.end_time || null,
        status: item?.caregiverId || parent.caregiver_id ? 'assigned' : parent.status || 'draft',
        lifecycle_stage: item?.caregiverId || parent.caregiver_id ? 'assigned' : parent.lifecycle_stage || 'ready_for_assignment',
        notes: item?.notes || parent.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parentId)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    created.push(data as MissionRow)

    if ((existingRows || []).length) {
      const { error: archiveError } = await supabase
        .from('missions')
        .update({
          status: 'cancelled',
          lifecycle_stage: 'cancelled',
          is_archived: true,
          updated_at: new Date().toISOString(),
        })
        .eq('parent_mission_id', parentId)

      if (archiveError) throw new Error(archiveError.message)
    }

    await recordMissionEvent({
      missionId: parentId,
      eventType: 'sub_missions_synced',
      content: 'Single mission synced',
      metadata: { count: 1, baseCode, codes: [code] },
      source: 'mission_dossier_engine',
    })

    return created
  }

  const { error: parentUpdateError } = await supabase
    .from('missions')
    .update({
      mission_group_id: missionGroupId,
      mission_kind: 'dossier',
      dossier_reference: baseCode,
      mission_reference: baseCode,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parentId)

  if (parentUpdateError) throw new Error(parentUpdateError.message)

  for (const [index, item] of occurrences.entries()) {
    const code = linkedMissionCode(baseCode, index, total)

    const payload = {
      parent_mission_id: parentId,
      mission_group_id: missionGroupId,
      mission_kind: 'sub_mission',
      occurrence_index: index + 1,
      dossier_reference: baseCode,
      mission_reference: code,
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
      updated_at: new Date().toISOString(),
    }

    const existing = existingByIndex.get(index + 1)

    if (existing?.id) {
      const { data, error } = await supabase
        .from('missions')
        .update(payload)
        .eq('id', existing.id)
        .select('*')
        .single()

      if (error) throw new Error(error.message)
      created.push(data as MissionRow)
      continue
    }

    const { data, error } = await supabase
      .from('missions')
      .insert([payload])
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    created.push(data as MissionRow)
  }

  const staleRows = Array.from(existingByIndex.entries())
    .filter(([index]) => index > total)
    .map(([, row]) => row)

  if (staleRows.length) {
    const { error } = await supabase
      .from('missions')
      .update({
        status: 'cancelled',
        lifecycle_stage: 'cancelled',
        is_archived: true,
        updated_at: new Date().toISOString(),
      })
      .in('id', staleRows.map((row) => row.id))

    if (error) throw new Error(error.message)
  }

  await recordMissionEvent({
    missionId: parentId,
    eventType: 'sub_missions_synced',
    content: `${created.length} sub-missions synced`,
    metadata: {
      count: created.length,
      baseCode,
      codes: created.map((row: any) => row.mission_reference || row.code),
    },
    source: 'mission_dossier_engine',
  })

  return created
}
