import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { getAc360CurrentContext } from './runtime'

type JsonRecord = Record<string, unknown>

type OpsCommandOperation =
  | 'day.open'
  | 'day.close'
  | 'site.upsert'
  | 'class.upsert'
  | 'capacity.snapshot'
  | 'routine.template.create'
  | 'routine.event.create'
  | 'routine.complete'
  | 'incident.create'
  | 'incident.status'
  | 'task.create'
  | 'task.status'
  | 'staff.coverage.record'
  | 'transport.event.create'
  | 'quality.check.create'
  | 'report.queue'

export type OperationsCommandInput = {
  orgId?: string
  campusId?: string | null
  siteId?: string | null
  classId?: string | null
  dayId?: string | null
  operation?: OpsCommandOperation | string
  operationalDate?: string
  title?: string
  label?: string
  status?: string
  priority?: string
  category?: string
  severity?: string
  ownerLabel?: string
  responsibleLabel?: string
  dueAt?: string | null
  notes?: string | null
  proofReference?: string | null
  entityId?: string | null
  payload?: JsonRecord
  metadata?: JsonRecord
}

const TABLES = {
  sites: 'ac360_ops_sites',
  days: 'ac360_ops_days',
  classes: 'ac360_ops_classes',
  capacity: 'ac360_ops_class_capacity_snapshots',
  routineTemplates: 'ac360_ops_routine_templates',
  routineEvents: 'ac360_ops_routine_events',
  incidents: 'ac360_ops_incidents',
  tasks: 'ac360_ops_tasks',
  staffCoverage: 'ac360_ops_staff_coverage',
  transportEvents: 'ac360_ops_transport_events',
  qualityChecks: 'ac360_ops_quality_checks',
  dayClosures: 'ac360_ops_day_closures',
  audit: 'ac360_ops_audit_events',
} as const

const nowIso = () => new Date().toISOString()
const todayIso = () => new Date().toISOString().slice(0, 10)
const proofRef = (prefix = 'AC360-OPS') => `${prefix}-${todayIso().replace(/-/g, '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
const codeRef = (prefix: string) => `${prefix}-${todayIso().replace(/-/g, '')}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`

function asText(value: unknown, fallback = '') {
  const text = typeof value === 'string' ? value.trim() : ''
  return text || fallback
}

function asNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.,-]/g, '').replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return ['true', '1', 'yes', 'oui'].includes(value.toLowerCase())
  return fallback
}

function cleanJson(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return JSON.parse(JSON.stringify(value)) as JsonRecord
}

function compact<T extends Record<string, unknown>>(value: T): T {
  const copy: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value)) {
    if (item !== undefined) copy[key] = item
  }
  return copy as T
}

function normalizeDbError(error: any) {
  const message = error?.message || String(error || 'Erreur inconnue')
  const code = error?.code || ''
  const missingTable = code === '42P01' || message.includes('does not exist') || message.includes('schema cache')
  return { message, code, missingTable }
}

async function currentActorId() {
  const user = await getCurrentUser().catch(() => null) as any
  return user?.id || null
}

async function resolveOperationsContext(orgId?: string) {
  const context = await getAc360CurrentContext(orgId)
  const resolvedOrgId = context.context?.org?.id || orgId || null
  if (!context.ok || !resolvedOrgId) {
    return {
      ok: false as const,
      status: 409,
      error: 'Compte à finaliser : nous devons terminer la liaison de votre établissement avant d’enregistrer les opérations. La consultation reste disponible.',
      clientReason: 'account_setup_required',
      context,
      orgId: null,
      ac360: {
        blocked: true,
        recovery: ['Vérifier le compte', 'Contacter AngelCare Success', 'Réessayer après activation'],
      },
    }
  }
  return { ok: true as const, context, orgId: resolvedOrgId }
}

async function selectRows(db: any, table: string, orgId: string, options: { limit?: number; dateColumn?: string; date?: string; orderColumn?: string } = {}) {
  let query = db.from(table).select('*').eq('org_id', orgId)
  if (options.dateColumn && options.date) query = query.eq(options.dateColumn, options.date)
  query = query.order(options.orderColumn || 'created_at', { ascending: false }).limit(options.limit || 50)
  const { data, error } = await query as any
  if (error) {
    const normalized = normalizeDbError(error)
    return { rows: [], error: normalized, databaseReady: !normalized.missingTable }
  }
  return { rows: data || [], error: null, databaseReady: true }
}

async function auditEvent(db: any, input: { orgId: string; campusId?: string | null; siteId?: string | null; dayId?: string | null; eventType: string; entityType?: string; entityId?: string | null; actorId?: string | null; proofReference: string; eventJson?: JsonRecord }) {
  const { error } = await db.from(TABLES.audit).insert({
    org_id: input.orgId,
    campus_id: input.campusId || null,
    site_id: input.siteId || null,
    day_id: input.dayId || null,
    event_code: codeRef('OPS-AUDIT'),
    event_type: input.eventType,
    source_workspace: 'operations',
    entity_type: input.entityType || null,
    entity_id: input.entityId || null,
    actor_app_user_id: input.actorId || null,
    proof_reference: input.proofReference,
    event_json: input.eventJson || {},
  }) as any
  if (error) return normalizeDbError(error)
  return null
}

function deriveClientReadiness(records: any, databaseReady: boolean, context: any, summary: JsonRecord) {
  const restrictions = context?.context?.restrictions || []
  const incidentsCritical = Number(summary.incidentsCritical || 0)
  const tasksLate = Number(summary.tasksLate || 0)
  const daysOpen = Number(summary.daysOpen || 0)
  const routineCompletionRate = Number(summary.routineCompletionRate || 0)
  const score = Math.max(40, Math.min(98, 70 + (databaseReady ? 12 : -20) + (daysOpen > 0 ? 5 : -5) + Math.round(routineCompletionRate / 10) - incidentsCritical * 4 - tasksLate * 2 - restrictions.length * 4))
  return {
    score,
    databaseReady,
    sourceOfTruthReady: databaseReady,
    commercialStatus: databaseReady ? 'Espace opérations prêt pour données réelles' : 'Configuration opérations à finaliser',
    daysOpen,
    activeSites: Number(summary.sitesActive || records.sites.length || 0),
    classesActive: Number(summary.classesActive || records.classes.length || 0),
    incidentsOpen: Number(summary.incidentsOpen || records.incidents.length || 0),
    tasksOpen: Number(summary.tasksOpen || records.tasks.length || 0),
    routinesCompleted: Number(summary.routinesCompleted || 0),
    routineCompletionRate,
    restrictions: restrictions.length,
  }
}

async function runtimeSummary(db: any, orgId: string, operationalDate: string) {
  const { data, error } = await db.rpc('ac360_ops_runtime_summary', { p_org_id: orgId, p_operational_date: operationalDate } as any) as any
  if (error) return { summary: {}, error: normalizeDbError(error), databaseReady: false }
  return { summary: data || {}, error: null, databaseReady: true }
}

export async function getAc360OperationsSourceDashboard(input: { orgId?: string; operationalDate?: string; view?: string } = {}) {
  const resolved = await resolveOperationsContext(input.orgId)
  if (!resolved.ok) return resolved

  const db = await createClient()
  const orgId = resolved.orgId
  const operationalDate = input.operationalDate || todayIso()

  const [summaryRes, sitesRes, daysRes, classesRes, capacityRes, routinesRes, incidentsRes, tasksRes, staffRes, transportRes, qualityRes, closuresRes, auditRes] = await Promise.all([
    runtimeSummary(db, orgId, operationalDate),
    selectRows(db, TABLES.sites, orgId, { limit: 80, orderColumn: 'site_name' }),
    selectRows(db, TABLES.days, orgId, { limit: 30, dateColumn: 'operational_date', date: operationalDate }),
    selectRows(db, TABLES.classes, orgId, { limit: 120, orderColumn: 'class_name' }),
    selectRows(db, TABLES.capacity, orgId, { limit: 120, dateColumn: 'snapshot_date', date: operationalDate }),
    selectRows(db, TABLES.routineEvents, orgId, { limit: 120, orderColumn: 'scheduled_at' }),
    selectRows(db, TABLES.incidents, orgId, { limit: 80, orderColumn: 'occurred_at' }),
    selectRows(db, TABLES.tasks, orgId, { limit: 100, orderColumn: 'due_at' }),
    selectRows(db, TABLES.staffCoverage, orgId, { limit: 80, dateColumn: 'coverage_date', date: operationalDate }),
    selectRows(db, TABLES.transportEvents, orgId, { limit: 80, orderColumn: 'event_at' }),
    selectRows(db, TABLES.qualityChecks, orgId, { limit: 80 }),
    selectRows(db, TABLES.dayClosures, orgId, { limit: 30, dateColumn: 'operational_date', date: operationalDate }),
    selectRows(db, TABLES.audit, orgId, { limit: 80 }),
  ])

  const databaseReady = [summaryRes, sitesRes, daysRes, classesRes, capacityRes, routinesRes, incidentsRes, tasksRes, staffRes, transportRes, qualityRes, closuresRes, auditRes].every((res: any) => res.databaseReady)
  const errors = [summaryRes, sitesRes, daysRes, classesRes, capacityRes, routinesRes, incidentsRes, tasksRes, staffRes, transportRes, qualityRes, closuresRes, auditRes].map((res: any) => res.error).filter(Boolean)

  const records = {
    sites: sitesRes.rows,
    days: daysRes.rows,
    classes: classesRes.rows,
    capacitySnapshots: capacityRes.rows,
    routineEvents: routinesRes.rows,
    incidents: incidentsRes.rows,
    tasks: tasksRes.rows,
    staffCoverage: staffRes.rows,
    transportEvents: transportRes.rows,
    qualityChecks: qualityRes.rows,
    dayClosures: closuresRes.rows,
    auditEvents: auditRes.rows,
  }

  return {
    ok: true as const,
    context: resolved.context.context,
    view: input.view || 'operations',
    operationalDate,
    loadedAt: nowIso(),
    databaseReady,
    setupRequired: !databaseReady,
    errors,
    summary: summaryRes.summary || {},
    readiness: deriveClientReadiness(records, databaseReady, resolved.context, summaryRes.summary || {}),
    records,
    sourceOwnership: {
      presence: 'Présence & opérations / journée opérationnelle',
      absences: 'Présence staff + présence enfants',
      routines: 'Routines école',
      incidents: 'Registre incidents opérations',
      transport: 'Événements transport',
      closure: 'Clôture journée',
    },
  }
}

function basePayload(input: OperationsCommandInput, orgId: string, actorId: string | null) {
  return {
    org_id: orgId,
    campus_id: input.campusId || null,
    created_by: actorId,
    updated_by: actorId,
  }
}

async function getOrCreateDay(db: any, input: OperationsCommandInput, orgId: string, actorId: string | null) {
  if (input.dayId) return { id: input.dayId }
  const operationalDate = input.operationalDate || todayIso()
  const scopeKey = input.siteId ? `site:${input.siteId}` : 'network'
  const { data: existing, error: existingError } = await db
    .from(TABLES.days)
    .select('*')
    .eq('org_id', orgId)
    .eq('scope_key', scopeKey)
    .eq('operational_date', operationalDate)
    .maybeSingle() as any
  if (existingError) throw new Error(existingError.message)
  if (existing?.id) return existing
  const ref = proofRef('AC360-OPS-DAY')
  const { data, error } = await db.from(TABLES.days).insert({
    ...basePayload(input, orgId, actorId),
    site_id: input.siteId || null,
    scope_key: scopeKey,
    operational_date: operationalDate,
    day_code: codeRef('OPS-DAY'),
    status: 'open',
    opened_at: nowIso(),
    opened_by: actorId,
    proof_reference: ref,
    readiness_json: cleanJson(input.payload),
    metadata_json: cleanJson(input.metadata),
  }).select('*').single() as any
  if (error) throw new Error(error.message)
  await auditEvent(db, { orgId, campusId: input.campusId, siteId: input.siteId, dayId: data.id, eventType: 'day.open', entityType: 'ops_day', entityId: data.id, actorId, proofReference: ref, eventJson: { source: 'get_or_create_day' } })
  return data
}

async function insertAndAudit(db: any, input: OperationsCommandInput, orgId: string, actorId: string | null, table: string, payload: JsonRecord, eventType: string, entityType: string) {
  const ref = asText(input.proofReference, proofRef('AC360-OPS'))
  const { data, error } = await db.from(table).insert({ ...payload, proof_reference: ref }).select('*').single() as any
  if (error) throw new Error(error.message)
  const auditError = await auditEvent(db, { orgId, campusId: input.campusId, siteId: input.siteId, dayId: input.dayId, eventType, entityType, entityId: data.id, actorId, proofReference: ref, eventJson: { operation: input.operation, payload: cleanJson(input.payload), metadata: cleanJson(input.metadata) } })
  if (auditError) return { data, auditError }
  return { data, auditError: null }
}

export async function executeAc360OperationsCommand(input: OperationsCommandInput = {}) {
  const resolved = await resolveOperationsContext(input.orgId)
  if (!resolved.ok) return resolved

  const db = await createClient()
  const actorId = await currentActorId()
  const orgId = resolved.orgId
  const operation = asText(input.operation, 'task.create') as OpsCommandOperation

  try {
    const common = basePayload(input, orgId, actorId)
    let result: any = null

    if (operation === 'day.open') {
      const ref = proofRef('AC360-OPS-DAY')
      const operationalDate = input.operationalDate || todayIso()
      const scopeKey = input.siteId ? `site:${input.siteId}` : 'network'
      const { data, error } = await db.from(TABLES.days).upsert({
        ...common,
        site_id: input.siteId || null,
        scope_key: scopeKey,
        operational_date: operationalDate,
        day_code: codeRef('OPS-DAY'),
        status: 'open',
        opened_at: nowIso(),
        opened_by: actorId,
        proof_reference: ref,
        readiness_json: cleanJson(input.payload),
        metadata_json: cleanJson(input.metadata),
      }, { onConflict: 'org_id,scope_key,operational_date' }).select('*').single() as any
      if (error) throw new Error(error.message)
      await auditEvent(db, { orgId, campusId: input.campusId, siteId: input.siteId, dayId: data.id, eventType: operation, entityType: 'ops_day', entityId: data.id, actorId, proofReference: ref })
      result = data
    } else if (operation === 'day.close') {
      const day = await getOrCreateDay(db, input, orgId, actorId)
      const ref = proofRef('AC360-OPS-CLOSE')
      const { data, error } = await db.from(TABLES.dayClosures).upsert({
        ...common,
        site_id: input.siteId || null,
        day_id: day.id,
        closure_code: codeRef('OPS-CLOSE'),
        operational_date: input.operationalDate || todayIso(),
        status: 'closed',
        presence_validated: asBoolean(input.payload?.presenceValidated, true),
        incidents_reviewed: asBoolean(input.payload?.incidentsReviewed, true),
        routines_completed: asBoolean(input.payload?.routinesCompleted, true),
        transport_closed: asBoolean(input.payload?.transportClosed, true),
        critical_tasks_closed: asBoolean(input.payload?.criticalTasksClosed, false),
        direction_summary: asText(input.notes || input.payload?.summary, 'Clôture opérationnelle validée.'),
        proof_reference: ref,
        closed_by: actorId,
        closed_at: nowIso(),
        payload_json: cleanJson(input.payload),
        result_json: { closedFrom: 'operations_api' },
      }, { onConflict: 'org_id,day_id' }).select('*').single() as any
      if (error) throw new Error(error.message)
      await db.from(TABLES.days).update({ status: 'closed', closed_at: nowIso(), closed_by: actorId, closure_json: { closureId: data.id }, updated_by: actorId }).eq('id', day.id) as any
      await auditEvent(db, { orgId, campusId: input.campusId, siteId: input.siteId, dayId: day.id, eventType: operation, entityType: 'ops_day_closure', entityId: data.id, actorId, proofReference: ref })
      result = data
    } else if (operation === 'site.upsert') {
      const siteCode = asText(input.payload?.siteCode || input.payload?.site_code, codeRef('OPS-SITE'))
      const { data, error } = await db.from(TABLES.sites).upsert({
        ...common,
        site_code: siteCode,
        site_name: asText(input.title || input.payload?.siteName || input.payload?.site_name, 'Site opérationnel'),
        city: input.payload?.city || null,
        address_text: input.payload?.addressText || input.payload?.address_text || null,
        responsible_label: asText(input.responsibleLabel || input.ownerLabel || input.payload?.responsibleLabel, ''),
        capacity_children: asNumber(input.payload?.capacityChildren || input.payload?.capacity_children, 0),
        status: asText(input.status, 'active'),
        operational_rules: cleanJson(input.payload?.operationalRules),
        metadata_json: cleanJson(input.metadata),
      }, { onConflict: 'org_id,site_code' }).select('*').single() as any
      if (error) throw new Error(error.message)
      result = data
    } else if (operation === 'class.upsert') {
      const classCode = asText(input.payload?.classCode || input.payload?.class_code, codeRef('OPS-CLASS'))
      const { data, error } = await db.from(TABLES.classes).upsert({
        ...common,
        site_id: input.siteId || null,
        class_code: classCode,
        class_name: asText(input.title || input.payload?.className || input.payload?.class_name, 'Classe opérationnelle'),
        age_group: input.payload?.ageGroup || input.payload?.age_group || null,
        room_label: input.payload?.roomLabel || input.payload?.room_label || null,
        capacity_max: asNumber(input.payload?.capacityMax || input.payload?.capacity_max, 0),
        staff_required: asNumber(input.payload?.staffRequired || input.payload?.staff_required, 1),
        responsible_label: asText(input.responsibleLabel || input.ownerLabel || input.payload?.responsibleLabel, ''),
        status: asText(input.status, 'active'),
        metadata_json: cleanJson(input.metadata),
      }, { onConflict: 'org_id,class_code' }).select('*').single() as any
      if (error) throw new Error(error.message)
      result = data
    } else if (operation === 'capacity.snapshot') {
      const childrenExpected = asNumber(input.payload?.childrenExpected || input.payload?.children_expected, 0)
      const childrenPresent = asNumber(input.payload?.childrenPresent || input.payload?.children_present, 0)
      const staffExpected = asNumber(input.payload?.staffExpected || input.payload?.staff_expected, 0)
      const staffPresent = asNumber(input.payload?.staffPresent || input.payload?.staff_present, 0)
      const occupancyRate = childrenExpected > 0 ? Number(((childrenPresent / childrenExpected) * 100).toFixed(2)) : 0
      const staffCoverageRate = staffExpected > 0 ? Number(((staffPresent / staffExpected) * 100).toFixed(2)) : 0
      const { data, error } = await db.from(TABLES.capacity).upsert({
        org_id: orgId,
        campus_id: input.campusId || null,
        site_id: input.siteId || null,
        class_id: input.classId || null,
        day_id: input.dayId || null,
        snapshot_date: input.operationalDate || todayIso(),
        children_expected: childrenExpected,
        children_present: childrenPresent,
        staff_expected: staffExpected,
        staff_present: staffPresent,
        occupancy_rate: occupancyRate,
        staff_coverage_rate: staffCoverageRate,
        ratio_label: input.payload?.ratioLabel || input.payload?.ratio_label || null,
        pressure_status: asText(input.status || input.payload?.pressureStatus, occupancyRate > 100 ? 'over_capacity' : staffCoverageRate < 85 ? 'under_staffed' : 'normal'),
        notes: input.notes || null,
        proof_reference: asText(input.proofReference, proofRef('AC360-OPS-CAP')),
        metadata_json: cleanJson(input.metadata),
        created_by: actorId,
      }, { onConflict: 'org_id,class_id,snapshot_date' }).select('*').single() as any
      if (error) throw new Error(error.message)
      result = data
    } else if (operation === 'routine.template.create') {
      const templateCode = asText(input.payload?.templateCode || input.payload?.template_code, codeRef('OPS-RT'))
      const { data, error } = await db.from(TABLES.routineTemplates).upsert({
        ...common,
        template_code: templateCode,
        label: asText(input.title || input.label, 'Routine école'),
        category: asText(input.category, 'routine'),
        default_time: input.payload?.defaultTime || input.payload?.default_time || null,
        proof_required: asBoolean(input.payload?.proofRequired || input.payload?.proof_required, false),
        escalation_minutes: asNumber(input.payload?.escalationMinutes || input.payload?.escalation_minutes, 30),
        status: asText(input.status, 'active'),
        instructions: input.notes || null,
        metadata_json: cleanJson(input.metadata),
      }, { onConflict: 'org_id,template_code' }).select('*').single() as any
      if (error) throw new Error(error.message)
      result = data
    } else if (operation === 'routine.event.create') {
      const day = input.dayId ? { id: input.dayId } : await getOrCreateDay(db, input, orgId, actorId)
      const payload = {
        ...common,
        site_id: input.siteId || null,
        class_id: input.classId || null,
        day_id: day.id,
        template_id: input.entityId || null,
        event_code: codeRef('OPS-ROUTINE'),
        label: asText(input.title || input.label, 'Routine opérationnelle'),
        category: asText(input.category, 'routine'),
        status: asText(input.status, 'planned'),
        scheduled_at: input.payload?.scheduledAt || input.payload?.scheduled_at || null,
        owner_label: asText(input.ownerLabel, ''),
        proof_reference: asText(input.proofReference, proofRef('AC360-OPS-RT')), 
        notes: input.notes || null,
        payload_json: cleanJson(input.payload),
        result_json: {},
      }
      const { data, error } = await db.from(TABLES.routineEvents).insert(payload).select('*').single() as any
      if (error) throw new Error(error.message)
      result = data
    } else if (operation === 'routine.complete') {
      const id = input.entityId
      if (!id) throw new Error('Routine introuvable : sélectionnez une routine à clôturer.')
      const ref = asText(input.proofReference, proofRef('AC360-OPS-RTDONE'))
      const { data, error } = await db.from(TABLES.routineEvents).update({ status: 'completed', completed_at: nowIso(), proof_reference: ref, notes: input.notes || null, result_json: cleanJson(input.payload), updated_by: actorId }).eq('id', id).eq('org_id', orgId).select('*').single() as any
      if (error) throw new Error(error.message)
      result = data
    } else if (operation === 'incident.create') {
      const day = input.dayId ? { id: input.dayId } : await getOrCreateDay(db, input, orgId, actorId)
      const insert = {
        ...common,
        site_id: input.siteId || null,
        class_id: input.classId || null,
        day_id: day.id,
        incident_code: codeRef('OPS-INC'),
        title: asText(input.title, 'Incident opérationnel'),
        category: asText(input.category, 'operational'),
        severity: asText(input.severity, 'medium'),
        status: asText(input.status, 'open'),
        child_label: input.payload?.childLabel || input.payload?.child_label || null,
        owner_label: asText(input.ownerLabel, ''),
        immediate_action: input.payload?.immediateAction || input.payload?.immediate_action || null,
        parent_notification_required: asBoolean(input.payload?.parentNotificationRequired || input.payload?.parent_notification_required, false),
        escalated_to_direction: asBoolean(input.payload?.escalatedToDirection || input.payload?.escalated_to_direction, false),
        description: input.notes || input.payload?.description || null,
        payload_json: cleanJson(input.payload),
        result_json: {},
      }
      result = (await insertAndAudit(db, input, orgId, actorId, TABLES.incidents, insert, operation, 'ops_incident')).data
    } else if (operation === 'incident.status') {
      if (!input.entityId) throw new Error('Incident introuvable : sélectionnez un incident à mettre à jour.')
      const status = asText(input.status, 'in_progress')
      const update: JsonRecord = { status, updated_by: actorId, result_json: cleanJson(input.payload) }
      if (['resolved','closed'].includes(status)) update.resolved_at = nowIso()
      if (status === 'closed') update.closed_at = nowIso()
      const { data, error } = await db.from(TABLES.incidents).update(update).eq('id', input.entityId).eq('org_id', orgId).select('*').single() as any
      if (error) throw new Error(error.message)
      result = data
    } else if (operation === 'task.create') {
      const day = input.dayId ? { id: input.dayId } : await getOrCreateDay(db, input, orgId, actorId)
      const insert = {
        ...common,
        site_id: input.siteId || null,
        class_id: input.classId || null,
        day_id: day.id,
        task_code: codeRef('OPS-TASK'),
        title: asText(input.title, 'Tâche opérationnelle'),
        task_type: asText(input.category, 'operational'),
        priority: asText(input.priority, 'normal'),
        status: asText(input.status, 'todo'),
        owner_label: asText(input.ownerLabel, ''),
        due_at: input.dueAt || null,
        source_entity_type: input.payload?.sourceEntityType || null,
        source_entity_id: input.payload?.sourceEntityId || null,
        proof_required: asBoolean(input.payload?.proofRequired, false),
        notes: input.notes || null,
        payload_json: cleanJson(input.payload),
        result_json: {},
      }
      result = (await insertAndAudit(db, input, orgId, actorId, TABLES.tasks, insert, operation, 'ops_task')).data
    } else if (operation === 'task.status') {
      if (!input.entityId) throw new Error('Tâche introuvable : sélectionnez une tâche à mettre à jour.')
      const { data, error } = await db.from(TABLES.tasks).update({ status: asText(input.status, 'in_progress'), notes: input.notes || null, result_json: cleanJson(input.payload), updated_by: actorId }).eq('id', input.entityId).eq('org_id', orgId).select('*').single() as any
      if (error) throw new Error(error.message)
      result = data
    } else if (operation === 'staff.coverage.record') {
      const staffExpected = asNumber(input.payload?.staffExpected || input.payload?.staff_expected, 0)
      const staffPresent = asNumber(input.payload?.staffPresent || input.payload?.staff_present, 0)
      const staffAbsent = Math.max(0, staffExpected - staffPresent)
      const { data, error } = await db.from(TABLES.staffCoverage).upsert({
        ...common,
        site_id: input.siteId || null,
        class_id: input.classId || null,
        day_id: input.dayId || null,
        coverage_date: input.operationalDate || todayIso(),
        role_label: asText(input.payload?.roleLabel || input.payload?.role_label, 'Équipe terrain'),
        staff_expected: staffExpected,
        staff_present: staffPresent,
        staff_absent: staffAbsent,
        replacements_needed: asNumber(input.payload?.replacementsNeeded || input.payload?.replacements_needed, staffAbsent),
        overtime_hours: asNumber(input.payload?.overtimeHours || input.payload?.overtime_hours, 0),
        coverage_status: asText(input.status, staffPresent < staffExpected ? 'under_covered' : 'normal'),
        owner_label: asText(input.ownerLabel, ''),
        proof_reference: asText(input.proofReference, proofRef('AC360-OPS-STAFF')),
        notes: input.notes || null,
        metadata_json: cleanJson(input.metadata),
      }, { onConflict: 'org_id,site_id,class_id,role_label,coverage_date' }).select('*').single() as any
      if (error) throw new Error(error.message)
      result = data
    } else if (operation === 'transport.event.create') {
      const insert = {
        ...common,
        site_id: input.siteId || null,
        day_id: input.dayId || null,
        transport_code: codeRef('OPS-TR'),
        route_label: asText(input.title || input.payload?.routeLabel || input.payload?.route_label, 'Circuit transport'),
        event_type: asText(input.category || input.payload?.eventType, 'status'),
        status: asText(input.status, 'open'),
        delay_minutes: asNumber(input.payload?.delayMinutes || input.payload?.delay_minutes, 0),
        children_count: asNumber(input.payload?.childrenCount || input.payload?.children_count, 0),
        vehicle_label: input.payload?.vehicleLabel || input.payload?.vehicle_label || null,
        driver_label: input.payload?.driverLabel || input.payload?.driver_label || null,
        assistant_label: input.payload?.assistantLabel || input.payload?.assistant_label || null,
        parent_notification_required: asBoolean(input.payload?.parentNotificationRequired || input.payload?.parent_notification_required, false),
        event_at: input.payload?.eventAt || input.payload?.event_at || nowIso(),
        notes: input.notes || null,
        payload_json: cleanJson(input.payload),
        result_json: {},
      }
      result = (await insertAndAudit(db, input, orgId, actorId, TABLES.transportEvents, insert, operation, 'ops_transport_event')).data
    } else if (operation === 'quality.check.create') {
      const insert = {
        ...common,
        site_id: input.siteId || null,
        class_id: input.classId || null,
        day_id: input.dayId || null,
        check_code: codeRef('OPS-QA'),
        check_type: asText(input.category, 'field_quality'),
        title: asText(input.title, 'Contrôle qualité terrain'),
        status: asText(input.status, 'planned'),
        score: asNumber(input.payload?.score, 0),
        owner_label: asText(input.ownerLabel, ''),
        checked_at: input.payload?.checkedAt || input.payload?.checked_at || null,
        non_conformities: asNumber(input.payload?.nonConformities || input.payload?.non_conformities, 0),
        action_plan_required: asBoolean(input.payload?.actionPlanRequired || input.payload?.action_plan_required, false),
        notes: input.notes || null,
        checklist_json: Array.isArray(input.payload?.checklist) ? input.payload?.checklist : [],
        payload_json: cleanJson(input.payload),
        result_json: {},
      }
      result = (await insertAndAudit(db, input, orgId, actorId, TABLES.qualityChecks, insert, operation, 'ops_quality_check')).data
    } else if (operation === 'report.queue') {
      const taskInput = { ...input, operation: 'task.create', title: input.title || 'Préparer rapport opérations', category: 'reporting', payload: { ...(input.payload || {}), reportQueued: true } }
      return executeAc360OperationsCommand(taskInput)
    } else {
      throw new Error('Action opérations non reconnue.')
    }

    const refreshed = await getAc360OperationsSourceDashboard({ orgId, operationalDate: input.operationalDate || todayIso() })
    return {
      ok: true as const,
      operation,
      result,
      proofReference: result?.proof_reference || input.proofReference || null,
      refreshed,
    }
  } catch (error: any) {
    const normalized = normalizeDbError(error)
    if (normalized.missingTable) {
      return {
        ok: false as const,
        status: 409,
        setupRequired: true,
        error: 'Configuration opérations à finaliser : appliquez la migration Operations Source-of-Truth Step 1 avant d’enregistrer cette action.',
        details: normalized,
      }
    }
    return {
      ok: false as const,
      status: 500,
      error: normalized.message || 'Impossible d’exécuter cette action opérations.',
      details: normalized,
    }
  }
}
