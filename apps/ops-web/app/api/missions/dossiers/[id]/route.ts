import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMissionDossier, patchMission } from '@/lib/missions/repository'
import { patchMissionOrder } from '@/lib/missions/mission-order'
import { recordMissionEvent } from '@/lib/missions/events'
import { resolvedSessionCode, stripMissionCodeSuffix } from '@/lib/missions/mission-codes'

export const dynamic = 'force-dynamic'

function parsePositiveIntId(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const text = String(value).trim()
  if (!text || text === 'null' || text === 'undefined' || text === 'NaN') return null
  const number = Number(text)
  return Number.isSafeInteger(number) && number > 0 ? number : null
}

function moneyNumber(value: unknown) {
  const next = Number(String(value ?? '').replace(',', '.'))
  return Number.isFinite(next) ? next : 0
}

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : []
}

function stripMissionSuffix(value: unknown) {
  const text = String(value || '').trim()
  if (!text) return ''
  return stripMissionCodeSuffix(text)
}

function buildDossierCode(parentMission: any, parentMissionId: number) {
  return (
    stripMissionSuffix(parentMission?.dossier_reference) ||
    stripMissionSuffix(parentMission?.mission_reference) ||
    stripMissionSuffix(parentMission?.code) ||
    `CARE-${parentMissionId}`
  )
}

function sessionCode(baseCode: string, index: number, total: number) {
  return resolvedSessionCode(baseCode, index, total)
}

function normalizeSessions(body: any) {
  const rows = asArray(body.sessions)
  if (rows.length) return rows

  return [{
    id: 'single',
    missionDate: body.missionDate || body.mission_date || null,
    startTime: body.startTime || body.start_time || null,
    endTime: body.endTime || body.end_time || null,
    caregiverId: body.caregiverId || body.caregiver_id || null,
    status: body.status || 'assigned',
  }]
}

async function syncLinkedSubMissions(params: {
  parentMissionId: number
  parentMission: any
  requestedId: number
  body: any
  sessions: any[]
  familyId: number | null
  caregiverId: number | null
  baseCode: string
}) {
  const supabase = await createClient()
  const { parentMissionId, parentMission, requestedId, body, sessions, familyId, caregiverId, baseCode } = params
  const now = new Date().toISOString()
  const total = sessions.length

  const { data: existingChildren, error: childrenError } = await supabase
    .from('missions')
    .select('*')
    .eq('parent_mission_id', parentMissionId)
    .order('mission_date', { ascending: true, nullsFirst: false })
    .order('start_time', { ascending: true, nullsFirst: false })

  if (childrenError) throw new Error(childrenError.message)

  const children = Array.isArray(existingChildren) ? existingChildren : []

  const common = {
    family_id: familyId,
    service_type: body.serviceType || body.service_type || parentMission?.service_type || null,
    service_family: parentMission?.service_family || null,
    city: body.city || parentMission?.city || null,
    zone: body.zone || parentMission?.zone || null,
    risk_level: body.riskLevel || body.risk_level || parentMission?.risk_level || null,
    urgency: body.urgency || parentMission?.urgency || 'standard',
    ops_priority: body.urgency || parentMission?.ops_priority || parentMission?.urgency || 'standard',
    internal_procedure_level: body.internalProcedureLevel || body.internal_procedure_level || parentMission?.internal_procedure_level || null,
    mission_scope: body.transportRequired || body.transport_required || parentMission?.mission_scope || null,
    recurrence_type: body.recurrenceType || body.recurrence_type || parentMission?.recurrence_type || null,
    validation_status: parentMission?.validation_status || 'pending',
    readiness_status: parentMission?.readiness_status || 'pending',
    report_status: parentMission?.report_status || 'not_required',
    updated_at: now,
  }

  const linkedMissionRows: any[] = []

  if (total <= 1) {
    const row = sessions[0] || {}
    const code = sessionCode(baseCode, 0, total)

    const { data, error } = await supabase
      .from('missions')
      .update({
        ...common,
        caregiver_id: parsePositiveIntId(row.caregiverId ?? row.caregiver_id) || caregiverId,
        parent_mission_id: null,
        mission_kind: 'single',
        dossier_reference: baseCode,
        mission_reference: code,
        mission_date: row.missionDate || row.mission_date || body.missionDate || body.mission_date || parentMission?.mission_date || null,
        start_time: row.startTime || row.start_time || body.startTime || body.start_time || parentMission?.start_time || null,
        end_time: row.endTime || row.end_time || body.endTime || body.end_time || parentMission?.end_time || null,
        status: row.status || parentMission?.status || 'assigned',
        lifecycle_stage: row.status || parentMission?.lifecycle_stage || parentMission?.status || 'assigned',
        notes: body.notes || parentMission?.notes || null,
        recurrence_rule: {
          ...(typeof parentMission?.recurrence_rule === 'object' && parentMission.recurrence_rule ? parentMission.recurrence_rule : {}),
          singleMissionCode: code,
          linkedMissionCodes: [code],
          linkedMissionCount: 1,
          liveCodeSyncAt: now,
        },
      })
      .eq('id', parentMissionId)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    linkedMissionRows.push(data)

    if (children.length) {
      await supabase
        .from('missions')
        .update({ is_archived: true, status: 'cancelled', lifecycle_stage: 'cancelled', updated_at: now })
        .eq('parent_mission_id', parentMissionId)
    }

    return linkedMissionRows
  }

  await supabase
    .from('missions')
    .update({
      ...common,
      mission_kind: 'dossier',
      dossier_reference: baseCode,
      mission_reference: baseCode,
      status: parentMission?.status || 'active',
      lifecycle_stage: parentMission?.lifecycle_stage || parentMission?.status || 'active',
      notes: body.notes || parentMission?.notes || null,
      recurrence_rule: {
        ...(typeof parentMission?.recurrence_rule === 'object' && parentMission.recurrence_rule ? parentMission.recurrence_rule : {}),
        linkedMissionCodes: sessions.map((_, index) => sessionCode(baseCode, index, total)),
        linkedMissionCount: total,
        liveCodeSyncAt: now,
      },
    })
    .eq('id', parentMissionId)

  for (const [index, row] of sessions.entries()) {
    const code = sessionCode(baseCode, index, total)
    const explicitId = parsePositiveIntId(row.subMissionId ?? row.sub_mission_id ?? row.linkedSubMissionId)
    const existing = explicitId
      ? children.find((child: any) => Number(child.id) === explicitId)
      : children[index]

    const payload = {
      ...common,
      parent_mission_id: parentMissionId,
      mission_kind: 'sub_mission',
      dossier_reference: baseCode,
      mission_reference: code,
      family_id: familyId,
      caregiver_id: parsePositiveIntId(row.caregiverId ?? row.caregiver_id) || caregiverId,
      mission_date: row.missionDate || row.mission_date || null,
      start_time: row.startTime || row.start_time || null,
      end_time: row.endTime || row.end_time || null,
      status: row.status || 'assigned',
      lifecycle_stage: row.status || 'assigned',
      notes: body.notes || null,
      recurrence_rule: {
        source: 'carelink_ops_linked_submission',
        parentMissionId,
        dossierCode: baseCode,
        missionCode: code,
        occurrenceIndex: index + 1,
        occurrenceTotal: total,
        syncedAt: now,
      },
    }

    if (existing?.id) {
      const { data, error } = await supabase
        .from('missions')
        .update(payload)
        .eq('id', Number(existing.id))
        .select('*')
        .single()

      if (error) throw new Error(error.message)
      linkedMissionRows.push(data)
    } else {
      const { data, error } = await supabase
        .from('missions')
        .insert([payload])
        .select('*')
        .single()

      if (error) throw new Error(error.message)
      linkedMissionRows.push(data)
    }
  }

  const keepIds = linkedMissionRows.map((row) => Number(row.id)).filter(Number.isFinite)
  const staleIds = children.map((row: any) => Number(row.id)).filter((id) => Number.isFinite(id) && !keepIds.includes(id))

  if (staleIds.length) {
    await supabase
      .from('missions')
      .update({ is_archived: true, status: 'cancelled', lifecycle_stage: 'cancelled', updated_at: now })
      .in('id', staleIds)
  }

  return linkedMissionRows
}

function calculateAllowanceTotal(rows: any[], sessionCount: number) {
  return rows.reduce((sum, row) => {
    const quantity = moneyNumber(row?.quantity)
    const unitRate = moneyNumber(row?.unitRateMad ?? row?.unit_rate_mad)
    const multiplier = row?.scope === 'all_sessions' && row?.basis !== 'per_dossier'
      ? Math.max(sessionCount, 1)
      : 1
    return sum + quantity * unitRate * multiplier
  }, 0)
}

function mapRoutes(rows: any[]) {
  return rows.map((row, index) => ({
    sort_order: index,
    route_type: row.route_type || row.type || 'caregiver_travel',
    operation_label: row.operation_label || row.type || 'Caregiver Travel',
    outbound_departure: row.outbound_departure || row.from || null,
    outbound_arrival: row.outbound_arrival || row.to || null,
    return_departure: row.return_departure || row.fromDetails || null,
    return_arrival: row.return_arrival || row.toDetails || null,
    duration_label: row.duration_label || row.duration || null,
    distance_label: row.distance_label || row.distance || null,
    cost_mad: moneyNumber(row.cost_mad ?? row.costMad),
    notes: row.notes || null,
  }))
}

function mapParameterDays(rows: any[], fallbackCaregiverId: number | null) {
  return rows.map((row, index) => ({
    sort_order: index,
    session_date: row.session_date || row.missionDate || row.mission_date || null,
    session_time: row.session_time || [row.startTime || row.start_time, row.endTime || row.end_time].filter(Boolean).join(' - ') || null,
    module_theme: row.module_theme || `Session ${index + 1}`,
    status: row.status || (row.caregiverId || row.caregiver_id || fallbackCaregiverId ? 'assigned' : 'draft'),
    caregiver_id: parsePositiveIntId(row.caregiverId ?? row.caregiver_id) || fallbackCaregiverId,
    sub_mission_id: parsePositiveIntId(row.subMissionId ?? row.sub_mission_id ?? row.linkedSubMissionId),
  }))
}

function mapProgramLines(rows: any[]) {
  return rows.map((row, index) => ({
    sort_order: index,
    session_label: row.session_label || row.timeBlock || `Block ${index + 1}`,
    session_datetime_label: row.session_datetime_label || row.timeBlock || null,
    theme_module: row.theme_module || row.activity || 'Program',
    ct_label: row.ct_label || row.activityType || 'Core',
    m1: row.m1 || row.objective || null,
    m2: row.m2 || row.instructions || null,
    m3: row.m3 || row.materials || null,
    short_break: row.short_break || null,
    meal_break: row.meal_break || null,
    code_atelier: row.code_atelier || row.submissionTemplate || null,
    notes: [row.linkedSession || null, row.notes || null].filter(Boolean).join('\n') || null,
  }))
}

function buildParameters(body: any, parentMissionId: number) {
  const parameters = typeof body.parameters === 'object' && body.parameters ? body.parameters : {}
  return {
    mission_id: parentMissionId,
    forfait: parameters.forfait ?? 'dossier',
    hourly_option: parameters.hourly_option ?? body.allowanceMode ?? null,
    type_service: parameters.type_service ?? body.serviceType ?? null,
    children_range: parameters.children_range ?? String(Math.max(asArray(body.sessions).length, 1)),
    participant_profile: parameters.participant_profile ?? null,
    client_type: parameters.client_type ?? null,
    client_profile: parameters.client_profile ?? null,
    dossier_number: parameters.dossier_number ?? null,
    designation: parameters.designation ?? `Dossier ${body.serviceType || ''}`.trim(),
    client_name: parameters.client_name ?? null,
    client_address: parameters.client_address ?? ([body.city, body.zone].filter(Boolean).join(' · ') || null),
    client_city: parameters.client_city ?? (body.city ?? null),
    mission_reason: parameters.mission_reason ?? (body.notes ?? null),
    updated_at: new Date().toISOString(),
  }
}

async function syncDraftReport(parentMissionId: number, body: any, mobileBrief: Record<string, unknown>) {
  const supabase = await createClient()
  const activities = asArray(body.activities)
  const payload = {
    mission_id: parentMissionId,
    caregiver_id: parsePositiveIntId(body.caregiverId ?? body.caregiver_id),
    service_type: body.serviceType || body.service_type || 'Mission dossier',
    summary: `Dossier mis à jour pour ${body.serviceType || 'Mission dossier'}`,
    observations: 'Rapport brouillon synchronisé après édition du dossier existant.',
    activities,
    checklist_snapshot: [],
    incident_flag: false,
    recommendations: 'Synchronisation live après modification Ops.',
    status: 'draft',
    submitted_at: null,
    validation_status: 'pending',
    metadata: {
      source: 'mission_dossier_live_edit',
      mobileBrief,
    },
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('carelink_mission_reports')
    .upsert([payload], { onConflict: 'mission_id' })
    .select('*')
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data || payload
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const data = await getMissionDossier(Number(id))
    return NextResponse.json({ ok: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Dossier loading failed' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({}))
    const requestedId = Number(id)

    const currentDossier: any = await getMissionDossier(requestedId)
    const parentMissionId = Number(
      currentDossier?.raw?.id ||
      currentDossier?.parent?.id ||
      currentDossier?.mission?.id ||
      requestedId
    )

    const familyId = parsePositiveIntId(body.familyId ?? body.family_id)
    const caregiverId = parsePositiveIntId(body.caregiverId ?? body.caregiver_id)
    const backupCaregiverId = parsePositiveIntId(body.backupCaregiverId ?? body.backup_caregiver_id)
    const sessions = normalizeSessions(body)
    const routes = asArray(body.routes)
    const allowances = asArray(body.allowances)
    const activities = asArray(body.activities)
    const baseCode = buildDossierCode(currentDossier?.raw || currentDossier?.parent || currentDossier?.mission, parentMissionId)

    const linkedMissions = await syncLinkedSubMissions({
      parentMissionId,
      parentMission: currentDossier?.raw || currentDossier?.parent || currentDossier?.mission || {},
      requestedId,
      body,
      sessions,
      familyId,
      caregiverId,
      baseCode,
    })

    const sessionsWithCodes = sessions.map((session, index) => {
      const linkedMission = linkedMissions[index]
      const code = sessionCode(baseCode, index, sessions.length)
      return {
        ...session,
        code,
        missionCode: code,
        mission_reference: code,
        subMissionId: linkedMission?.id || session.subMissionId || session.sub_mission_id || null,
        sub_mission_id: linkedMission?.id || session.subMissionId || session.sub_mission_id || null,
      }
    })

    const allowanceTotal = calculateAllowanceTotal(allowances, sessions.length)

    const liveEditSnapshot = {
      source: 'carelink_ops_existing_dossier_live_edit',
      editedAt: new Date().toISOString(),
      parentMissionId,
      requestedId,
      familyId,
      caregiverId,
      backupCaregiverId,
      serviceType: body.serviceType || body.service_type || null,
      missionDate: body.missionDate || body.mission_date || sessions[0]?.missionDate || null,
      startTime: body.startTime || body.start_time || sessions[0]?.startTime || null,
      endTime: body.endTime || body.end_time || sessions[0]?.endTime || null,
      city: body.city || null,
      zone: body.zone || null,
      notes: body.notes || null,
      riskLevel: body.riskLevel || body.risk_level || null,
      urgency: body.urgency || null,
      internalProcedureLevel: body.internalProcedureLevel || body.internal_procedure_level || null,
      transportRequired: body.transportRequired || body.transport_required || null,
      language: body.language || null,
      requiredSkills: Array.isArray(body.requiredSkills) ? body.requiredSkills : [],
      allowanceMode: body.allowanceMode || body.parameters?.hourly_option || 'bulk',
      sessions: sessionsWithCodes,
      routes,
      allowances,
      activities,
      programLines: activities,
      allowanceRows: allowances,
      mobileBrief: {
        sessions: sessionsWithCodes,
        routes,
        allowances,
        program: activities,
        programLines: activities,
        allowanceRows: allowances,
      },
    }

    const missionPatch: Record<string, unknown> = {
      family_id: familyId,
      caregiver_id: caregiverId,
      service_type: body.serviceType || body.service_type || null,
      mission_date: body.missionDate || body.mission_date || sessions[0]?.missionDate || null,
      start_time: body.startTime || body.start_time || sessions[0]?.startTime || null,
      end_time: body.endTime || body.end_time || sessions[0]?.endTime || null,
      city: body.city || null,
      zone: body.zone || null,
      notes: body.notes || null,
      risk_level: body.riskLevel || body.risk_level || null,
      urgency: body.urgency || null,
      internal_procedure_level: body.internalProcedureLevel || body.internal_procedure_level || null,
      mission_scope: body.transportRequired || body.transport_required || null,
      recurrence_type: body.recurrenceType || body.recurrence_type || null,
      recurrence_rule: {
        ...(typeof body.recurrenceRule === 'object' && body.recurrenceRule ? body.recurrenceRule : {}),
        source: 'carelink_ops_existing_dossier_live_edit',
        backupCaregiverId,
        skills: Array.isArray(body.requiredSkills) ? body.requiredSkills : [],
        allowanceMode: body.allowanceMode || body.parameters?.hourly_option || 'bulk',
        sessions: sessionsWithCodes.length,
        editedAt: new Date().toISOString(),
        liveEditSnapshot: { ...liveEditSnapshot, sessions: sessionsWithCodes, mobileBrief: { ...liveEditSnapshot.mobileBrief, sessions: sessionsWithCodes } },
      },
      updated_at: new Date().toISOString(),
    }

    const updatedMission = await patchMission(parentMissionId, missionPatch)

    const allowanceSummary = {
      direct_collection: false,
      monthly_collection: false,
      hourly_fee: Boolean(allowances.find((row) => row?.basis === 'per_hour')),
      per_mission: true,
      grade_fee: allowanceTotal ? allowanceTotal.toFixed(2) : null,
      meal_allowance: Boolean(allowances.find((row) => /meal|repas/i.test(String(row?.type || '')))),
      lodging_reimbursed: false,
      lodging_not_reimbursed: false,
      manual_notes: JSON.stringify({
        source: 'mission_dossier_live_edit',
        totalMad: allowanceTotal,
        rows: allowances,
      }),
    }

    const order = await patchMissionOrder(parentMissionId, {
      routes: mapRoutes(routes),
      parameterDays: mapParameterDays(sessionsWithCodes, caregiverId),
      programLines: mapProgramLines(activities),
      allowances: allowanceSummary,
      parameters: buildParameters(body, parentMissionId),
      transport: {
        transport_by: body.transportRequired === 'yes' ? 'AngelCare transport' : 'Client transport / self',
        taxi: body.transportRequired === 'yes',
        private_driver: body.transportRequired === 'yes',
        train: false,
        airplane: false,
        bus: false,
        taxi_info: body.transportRequired === 'yes' ? 'Mission transport required' : null,
        train_info: null,
        ticket_to_order: false,
        ticket_to_reimburse: false,
        notes: body.transportRequired === 'yes' ? 'Transport brief updated from live dossier edit.' : null,
      },
    })

    const mobileBrief = {
      source: 'mission_dossier_live_edit',
      missionId: parentMissionId,
      editedAt: new Date().toISOString(),
      client: {
        familyId,
        city: body.city || null,
        zone: body.zone || null,
      },
      service: {
        serviceType: body.serviceType || null,
        riskLevel: body.riskLevel || null,
        urgency: body.urgency || null,
        internalProcedureLevel: body.internalProcedureLevel || null,
        transportRequired: body.transportRequired || null,
        language: body.language || null,
        requiredSkills: Array.isArray(body.requiredSkills) ? body.requiredSkills : [],
      },
      sessions: sessionsWithCodes,
      routes,
      allowances,
      program: activities,
      liveEditSnapshot,
      backupCaregiverId,
      mobileVisibility: {
        paymentAllowed: Boolean(caregiverId),
        dispatchLinked: true,
        notesVisible: true,
      },
    }

    const reportDraft = await syncDraftReport(parentMissionId, body, mobileBrief)

    await recordMissionEvent({
      missionId: parentMissionId,
      eventType: 'mission_dossier_live_edited',
      content: 'Existing mission dossier edited and redistributed from Ops modal',
      metadata: {
        requestedId,
        parentMissionId,
        sessions: sessionsWithCodes.length,
        routes: routes.length,
        allowances: allowances.length,
        programLines: activities.length,
        allowanceTotal,
        mobileBrief,
      },
      source: 'carelink_ops_existing_dossier_modal',
    })

    const finalDossier = await getMissionDossier(parentMissionId).catch(() => null)

    return NextResponse.json(
      {
        ok: true,
        data: finalDossier || updatedMission,
        order,
        reportDraft,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Dossier update failed' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const requestedId = Number(id)

    if (!Number.isFinite(requestedId) || requestedId <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Invalid mission dossier id' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const supabase = await createClient()
    const currentDossier: any = await getMissionDossier(requestedId)

    const parentMissionId = Number(
      currentDossier?.raw?.id ||
      currentDossier?.parent?.id ||
      currentDossier?.mission?.id ||
      requestedId
    )

    const linkedIds = [
      parentMissionId,
      requestedId,
      ...(Array.isArray(currentDossier?.subMissions) ? currentDossier.subMissions.map((row: any) => Number(row?.id)) : []),
      ...(Array.isArray(currentDossier?.submissions) ? currentDossier.submissions.map((row: any) => Number(row?.id)) : []),
    ].filter((value, index, array) => Number.isFinite(value) && value > 0 && array.indexOf(value) === index)

    const now = new Date().toISOString()

    const deletePatch = {
      status: 'deleted',
      lifecycle_stage: 'deleted',
      dossier_status: 'deleted',
      is_archived: true,
      updated_at: now,
    }

    const { data: archivedMissions, error: archiveError } = await supabase
      .from('missions')
      .update(deletePatch)
      .in('id', linkedIds)
      .select('*')

    if (archiveError) throw new Error(archiveError.message)

    const { data: childArchived, error: childArchiveError } = await supabase
      .from('missions')
      .update(deletePatch)
      .eq('parent_mission_id', parentMissionId)
      .select('*')

    if (childArchiveError) throw new Error(childArchiveError.message)

    const parentGroupId =
      currentDossier?.raw?.mission_group_id ||
      currentDossier?.parent?.mission_group_id ||
      currentDossier?.mission?.mission_group_id ||
      null

    let groupArchived: any[] = []
    if (parentGroupId) {
      const { data: groupRows, error: groupArchiveError } = await supabase
        .from('missions')
        .update(deletePatch)
        .eq('mission_group_id', parentGroupId)
        .select('*')

      if (groupArchiveError) throw new Error(groupArchiveError.message)
      groupArchived = Array.isArray(groupRows) ? groupRows : []
    }

    const allArchivedMissionIds = Array.from(new Set([
      ...linkedIds,
      ...(Array.isArray(childArchived) ? childArchived.map((row: any) => Number(row?.id)) : []),
      ...groupArchived.map((row: any) => Number(row?.id)),
    ].filter((value) => Number.isFinite(value) && value > 0)))

    await recordMissionEvent({
      missionId: parentMissionId,
      eventType: 'mission_dossier_deleted',
      content: 'Mission dossier archived/deleted from CareLink Ops',
      metadata: {
        requestedId,
        parentMissionId,
        linkedMissionIds: allArchivedMissionIds,
        deletedAt: now,
        mode: 'soft_delete_archive',
      },
      source: 'carelink_ops_existing_dossier_modal',
    })

    return NextResponse.json(
      {
        ok: true,
        data: {
          parentMissionId,
          linkedMissionIds: allArchivedMissionIds,
          archivedCount: allArchivedMissionIds.length,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Dossier deletion failed' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}

