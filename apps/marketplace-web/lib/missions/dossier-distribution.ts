import { createClient } from '@/lib/supabase/server'
import { createAlert, createDispatchMessage, createNotification, loadMissionChecklist } from '@/lib/carelink/mobile-persistence'
import { recordOpsAuditEvent } from '@/lib/carelink/ops-enterprise'
import { getServiceCharacteristic } from './service-characteristics'
import { createMissionDossier, generateSubMissions, type CreateDossierInput } from './dossiers'
import { getMissionDossier } from './repository'
import { patchMissionOrder } from './mission-order'
import { recordMissionEvent } from './events'
import { resolvedMissionCode } from './mission-codes'

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function safeUuid(value: unknown) {
  if (isUuid(value)) return value
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return '00000000-0000-4000-8000-' + Math.random().toString(16).slice(2, 14).padEnd(12, '0')
}



export type MissionDossierSessionInput = {
  id?: string | null
  missionDate: string
  startTime?: string | null
  endTime?: string | null
  caregiverId?: number | null
  notes?: string | null
}

export type MissionDossierRouteInput = {
  type?: string | null
  from?: string | null
  fromDetails?: string | null
  to?: string | null
  toDetails?: string | null
  duration?: string | null
  distance?: string | null
  notes?: string | null
  costMad?: string | number | null
}

export type MissionDossierAllowanceInput = {
  type?: string | null
  basis?: 'per_hour' | 'per_mission' | 'per_dossier' | null
  scope?: 'all_sessions' | 'single_session' | 'dossier' | null
  linkedSessionId?: string | null
  missionDate?: string | null
  quantity?: string | number | null
  unitRateMad?: string | number | null
  notes?: string | null
}

export type MissionDossierActivityInput = {
  timeBlock?: string | null
  activity?: string | null
  activityType?: string | null
  objective?: string | null
  instructions?: string | null
  materials?: string | null
  submissionTemplate?: string | null
  linkedSession?: string | null
  notes?: string | null
}

export type MissionDossierDistributionInput = CreateDossierInput & {
  requestId?: string | null
  assignNow?: boolean
  sessions?: MissionDossierSessionInput[]
  routes?: MissionDossierRouteInput[]
  allowances?: MissionDossierAllowanceInput[]
  activities?: MissionDossierActivityInput[]
  parameters?: Record<string, unknown> | null
}

type DistributionRow = Record<string, unknown>

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function asNumber(value: unknown, fallback = 0) {
  const next = Number(value)
  return Number.isFinite(next) ? next : fallback
}

function moneyNumber(value: unknown) {
  return asNumber(value, 0)
}

function calculateAllowanceTotal(rows: MissionDossierAllowanceInput[], sessionCount: number) {
  return rows.reduce((sum, row) => {
    const quantity = moneyNumber(row.quantity)
    const unitRate = moneyNumber(row.unitRateMad)
    const multiplier = row.scope === 'all_sessions' && row.basis !== 'per_dossier' ? Math.max(sessionCount, 1) : 1
    return sum + (quantity * unitRate * multiplier)
  }, 0)
}

function buildDossierReference(groupId: string, missionId: number) {
  return `DOS-${groupId.slice(0, 8).toUpperCase()}-${String(missionId).padStart(5, '0')}`
}

function buildSessionRows(missionId: number, groupId: string, parent: DistributionRow, sessions: MissionDossierSessionInput[]) {
  return sessions.map((session, index) => ({
    parent_mission_id: missionId,
    mission_group_id: groupId,
    mission_kind: 'sub_mission',
    occurrence_index: index + 1,
    family_id: parent.family_id ?? null,
    caregiver_id: session.caregiverId ?? parent.caregiver_id ?? null,
    contract_id: parent.contract_id || null,
    service_type: parent.service_type || null,
    service_family: parent.service_family || null,
    mission_scope: parent.mission_scope || null,
    internal_procedure_level: parent.internal_procedure_level || null,
    mission_date: session.missionDate,
    start_time: session.startTime || parent.start_time || null,
    end_time: session.endTime || parent.end_time || null,
    city: parent.city || null,
    zone: parent.zone || null,
    status: session.caregiverId || parent.caregiver_id ? 'assigned' : 'draft',
    lifecycle_stage: session.caregiverId || parent.caregiver_id ? 'assigned' : 'ready_for_assignment',
    readiness_status: parent.readiness_status || 'pending',
    validation_status: parent.validation_status || 'pending',
    report_status: 'pending',
    notes: session.notes || null,
  }))
}

function buildMobileBrief(mission: DistributionRow, dossier: Awaited<ReturnType<typeof getMissionDossier>> | null, checklist: DistributionRow[], sessions: MissionDossierSessionInput[], order: MissionDossierDistributionInput) {
  const service = getServiceCharacteristic(order.serviceType)
  return {
    missionId: mission.id ? Number(mission.id) : null,
    reference: dossier?.mission?.code || resolvedMissionCode(mission as any) || buildDossierReference(String(mission.mission_group_id || ''), Number(mission.id || 0)),
    client: {
      familyId: order.familyId,
      label: dossier?.mission.familyName || 'Famille liée',
      city: order.city || mission.city || null,
      zone: order.zone || mission.zone || null,
    },
    service: {
      serviceType: order.serviceType,
      serviceFamily: service.serviceFamily,
      riskLevel: order.riskLevel || 'normal',
      urgency: order.urgency || 'standard',
      internalProcedureLevel: order.internalProcedureLevel || null,
      transportRequired: order.transportRequired || null,
      language: order.language || null,
      requiredSkills: order.requiredSkills || service.requiredSkills,
      safetyNotes: service.riskRules,
    },
    sessions: sessions.map((session, index) => ({
      index: index + 1,
      missionDate: session.missionDate,
      startTime: session.startTime || null,
      endTime: session.endTime || null,
      caregiverId: session.caregiverId ?? null,
      linkedSubMissionId: dossier?.subMissions[index]?.id ?? null,
    })),
    backupCaregiverId: order.backupCaregiverId ?? null,
    checklist: checklist.map((item) => ({
      id: item.id,
      label: item.label,
      category: item.category,
      required: item.required,
      completed: item.completed,
      sortOrder: item.sortOrder,
    })),
    program: order.activities || [],
    routes: order.routes || [],
    allowances: order.allowances || [],
    reportTemplate: service.reportTemplate,
    mobileVisibility: {
      paymentAllowed: Boolean(order.caregiverId),
      dispatchLinked: true,
      notesVisible: true,
    },
  }
}

async function upsertDraftReport(missionId: number, serviceType: string, caregiverId: number | null, mobileBrief: Record<string, unknown>, activities: MissionDossierActivityInput[], checklist: DistributionRow[]) {
  const supabase = await createClient()
  const payload = {
    mission_id: missionId,
    caregiver_id: caregiverId,
    service_type: serviceType,
    summary: `Dossier distribué pour ${serviceType}`,
    observations: 'Rapport initial en brouillon généré à la création du dossier.',
    activities,
    checklist_snapshot: checklist,
    incident_flag: false,
    recommendations: 'En attente de validation terrain.',
    status: 'draft',
    submitted_at: null,
    validation_status: 'pending',
    metadata: { source: 'mission_dossier_distribution', mobileBrief },
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }

  const { data, error } = await supabase.from('carelink_mission_reports').upsert([payload], { onConflict: 'mission_id' }).select('*').maybeSingle()
  if (error) throw new Error(error.message)
  return data || payload
}

export async function distributeMissionDossier(input: MissionDossierDistributionInput) {
  const parent = await createMissionDossier(input)
  const missionId = Number(parent.id)
  const dossier = await getMissionDossier(missionId).catch(() => null)
  const service = getServiceCharacteristic(input.serviceType)
  const groupId = String(parent.mission_group_id || input.requestId || crypto.randomUUID())
  const sessions = (input.sessions || []).length
    ? input.sessions!
    : [{
      id: `${missionId}-session-1`,
      missionDate: input.missionDate || input.recurrenceStartDate || new Date().toISOString().slice(0, 10),
      startTime: input.startTime || null,
      endTime: input.endTime || null,
      caregiverId: input.caregiverId ?? null,
      notes: input.notes || null,
    }]

  const subMissions = await generateSubMissions(missionId, sessions.map((session) => ({
    missionDate: session.missionDate,
    startTime: session.startTime || null,
    endTime: session.endTime || null,
    caregiverId: session.caregiverId ?? input.caregiverId ?? null,
    notes: session.notes || null,
  })))

  const syncedDossier = await getMissionDossier(missionId).catch(() => dossier)
  const syncedMission = (syncedDossier?.raw || syncedDossier?.mission || parent) as DistributionRow
  const missionDisplayCode = syncedDossier?.mission?.code || resolvedMissionCode(syncedMission as any)

  const routeRows = (input.routes || []).map((row, index) => ({
    sort_order: index,
    route_type: row.type || 'caregiver_travel',
    operation_label: row.type || 'Caregiver Travel',
    outbound_departure: row.from || null,
    outbound_arrival: row.to || null,
    return_departure: row.fromDetails || null,
    return_arrival: row.toDetails || null,
    duration_label: row.duration || null,
    distance_label: row.distance || null,
    cost_mad: moneyNumber(row.costMad),
    notes: row.notes || null,
  }))

  const parameterDays = sessions.map((session, index) => ({
    sort_order: index,
    session_date: session.missionDate,
    session_time: [session.startTime, session.endTime].filter(Boolean).join(' - ') || null,
    module_theme: `Session ${index + 1}`,
    status: session.caregiverId || input.caregiverId ? 'assigned' : 'draft',
    caregiver_id: session.caregiverId || input.caregiverId || null,
    sub_mission_id: subMissions[index]?.id || null,
  }))

  const programLines = (input.activities || []).map((activity, index) => ({
    sort_order: index,
    session_label: activity.timeBlock || `Block ${index + 1}`,
    session_datetime_label: activity.timeBlock || null,
    theme_module: activity.activity || service.reportTemplate[index] || 'Program',
    ct_label: activity.activityType || 'Core',
    m1: activity.objective || null,
    m2: activity.instructions || null,
    m3: activity.materials || null,
    short_break: null,
    meal_break: null,
    code_atelier: activity.submissionTemplate || null,
    notes: [activity.linkedSession || null, activity.notes || null].filter(Boolean).join('\n') || null,
  }))

  const allowanceTotal = calculateAllowanceTotal(input.allowances || [], sessions.length)
  const allowanceSummary = {
    direct_collection: false,
    monthly_collection: false,
    hourly_fee: Boolean((input.allowances || []).find((row) => row.basis === 'per_hour')),
    per_mission: true,
    grade_fee: allowanceTotal ? allowanceTotal.toFixed(2) : null,
    meal_allowance: Boolean((input.allowances || []).find((row) => /meal|repas/i.test(String(row.type || '')))),
    lodging_reimbursed: false,
    lodging_not_reimbursed: false,
    manual_notes: JSON.stringify({
      source: 'mission_dossier_distribution',
      totalMad: allowanceTotal,
      rows: input.allowances || [],
    }),
  }

  const clientAddress = (input.parameters?.client_address ?? `${input.city || ''} ${input.zone || ''}`.trim()) || null
  const parameterPayload = {
    mission_id: missionId,
    forfait: input.parameters?.forfait ?? 'dossier',
    hourly_option: input.parameters?.hourly_option ?? null,
    type_service: input.parameters?.type_service ?? input.serviceType,
    children_range: input.parameters?.children_range ?? null,
    participant_profile: input.parameters?.participant_profile ?? null,
    client_type: input.parameters?.client_type ?? null,
    client_profile: input.parameters?.client_profile ?? null,
    dossier_number: input.parameters?.dossier_number ?? null,
    designation: input.parameters?.designation ?? input.serviceType,
    client_name: input.parameters?.client_name ?? syncedDossier?.mission?.familyName ?? dossier?.mission.familyName ?? null,
    client_address: clientAddress,
    client_city: input.parameters?.client_city ?? input.city ?? null,
    mission_reason: input.parameters?.mission_reason ?? input.notes ?? `Dossier distributé pour ${input.serviceType}`,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }

  const missionOrderPatch = {
    routes: routeRows,
    parameterDays,
    programLines,
    transport: {
      transport_by: input.transportRequired === 'yes' ? 'AngelCare transport' : 'Client transport / self',
      train: false,
      airplane: false,
      taxi: input.transportRequired === 'yes',
      private_driver: input.transportRequired === 'yes',
      bus: false,
      taxi_info: input.transportRequired === 'yes' ? 'Mission transport required' : null,
      train_info: null,
      ticket_to_order: false,
      ticket_to_reimburse: false,
      notes: input.transportRequired === 'yes' ? 'Transport brief generated from dossier intake.' : null,
    },
    allowances: allowanceSummary,
    parameters: parameterPayload,
  }

  const order = await patchMissionOrder(missionId, missionOrderPatch)

  const checklistItems = await loadMissionChecklist(missionId, input.serviceType, input.caregiverId ?? null)
  const mobileBrief = buildMobileBrief(syncedMission, syncedDossier || dossier, checklistItems, sessions, input)
  const reportDraft = await upsertDraftReport(missionId, input.serviceType, input.caregiverId ?? null, mobileBrief, input.activities || [], checklistItems)

  const createdNotifications = []
  if (input.caregiverId) {
    const existingNotification = await createClient().then((supabase) => supabase.from('carelink_notifications').select('id').eq('mission_id', missionId).eq('type', 'mission_assigned').maybeSingle()).catch(() => ({ data: null }))
    if (!(existingNotification as any).data?.id) {
      const notification = await createNotification({
        type: 'mission_assigned',
        title: `Nouvelle mission · ${missionDisplayCode || `Mission #${missionId}`}`,
        body: `Le dossier a été distribué pour ${input.serviceType}.`,
        priority: input.riskLevel && ['high', 'critical'].includes(String(input.riskLevel).toLowerCase()) ? 'critical' : 'high',
        missionId,
        caregiverId: input.caregiverId,
        metadata: { requestId: input.requestId || null, backupCaregiverId: input.backupCaregiverId || null, mobileBrief },
      })
      if (notification) createdNotifications.push(notification)
    }
  }

  const createdAlerts = []
  const needsAlert = ['high', 'critical'].includes(String(input.riskLevel || '').toLowerCase()) || (!input.backupCaregiverId && Boolean(input.caregiverId))
  if (needsAlert) {
    const existingAlert = await createClient().then((supabase) => supabase.from('carelink_alerts').select('id').eq('mission_id', missionId).eq('type', 'mission_risk').maybeSingle()).catch(() => ({ data: null }))
    if (!(existingAlert as any).data?.id) {
      const alert = await createAlert({
        type: 'mission_risk',
        title: `Risque dossier · ${missionDisplayCode || `Mission #${missionId}`}`,
        body: input.backupCaregiverId ? 'Le dossier comporte une alerte de risque à suivre.' : 'Aucun caregiver de secours n’a été défini.',
        priority: 'critical',
        missionId,
        caregiverId: input.caregiverId ?? null,
        linkedEntityType: 'mission',
        linkedEntityId: String(missionId),
        metadata: { requestId: input.requestId || null, riskLevel: input.riskLevel || 'normal', backupCaregiverId: input.backupCaregiverId || null },
      })
      if (alert) createdAlerts.push(alert)
    }
  }

  const createdMessages = []
  if (input.caregiverId) {
    const existingThread = await createClient().then((supabase) => supabase.from('carelink_dispatch_messages').select('id').eq('mission_id', missionId).eq('thread_key', `mission:${missionId}`).maybeSingle()).catch(() => ({ data: null }))
    if (!(existingThread as any).data?.id) {
      const message = await createDispatchMessage({
        missionId,
        caregiverId: input.caregiverId,
        senderType: 'ops',
        senderId: 'carelink_ops',
        recipientType: 'caregiver',
        subject: `Mission assignée · ${missionDisplayCode || `Mission #${missionId}`}`,
        body: `Le dossier a été distribué. Consultez le détail, la liste de contrôle et le programme de mission.`,
        priority: 'high',
        status: 'sent',
        threadKey: `mission:${missionId}`,
        metadata: { requestId: input.requestId || null, backupCaregiverId: input.backupCaregiverId || null, mobileBrief },
      })
      if (message) createdMessages.push(message)
    }
  }

  await recordMissionEvent({
    missionId,
    eventType: 'mission_dossier_distributed',
    content: 'Mission dossier distributed across Ops, Dispatch, Mobile and reporting layers',
    metadata: {
      requestId: input.requestId || null,
      sessions: sessions.length,
      routes: routeRows.length,
      allowances: (input.allowances || []).length,
      programLines: programLines.length,
      checklistItems: checklistItems.length,
      assigned: Boolean(input.caregiverId),
      riskLevel: input.riskLevel || 'normal',
      backupCaregiverId: input.backupCaregiverId ?? null,
      allowanceTotal,
      mobileBrief,
    },
    source: 'mission_dossier_engine',
  })

  await recordOpsAuditEvent({
    entityType: 'mission_dossier',
    entityId: String(missionId),
    action: 'mission_dossier.distributed',
    payload: {
      requestId: input.requestId || null,
      missionId,
      caregiverId: input.caregiverId ?? null,
      backupCaregiverId: input.backupCaregiverId ?? null,
      sessions: sessions.length,
      routes: routeRows.length,
      allowances: (input.allowances || []).length,
      allowanceTotal,
      programLines: programLines.length,
      checklistItems: checklistItems.length,
      assigned: Boolean(input.caregiverId),
      mobileBrief,
    },
  })

  const finalDossier = await getMissionDossier(missionId).catch(() => null)

  return {
    mission: finalDossier?.mission || null,
    parent: syncedMission,
    dossier: finalDossier,
    subMissions,
    order,
    reportDraft,
    checklistItems,
    notifications: createdNotifications,
    alerts: createdAlerts,
    messages: createdMessages,
    mobileBrief,
    groupId,
    allowanceTotal,
  }
}
