import { createClient } from '@/lib/supabase/server'
import { getServiceCharacteristic } from '@/lib/missions/service-characteristics'
import { recordMissionEvent } from '@/lib/missions/events'

type AnyRow = Record<string, any>

export const CARELINK_MOBILE_TABLES = {
  messages: 'carelink_dispatch_messages',
  notifications: 'carelink_notifications',
  alerts: 'carelink_alerts',
  checklist: 'carelink_mission_checklist_items',
  reports: 'carelink_mission_reports',
  disputes: 'carelink_payment_disputes',
  documents: 'carelink_agent_documents',
} as const

export type CareLinkDispatchMessage = {
  id: string
  missionId: number | null
  caregiverId: number | null
  threadKey: string | null
  senderType: string
  senderId: string | null
  recipientType: string | null
  subject: string | null
  body: string
  priority: string
  status: string
  readAt: string | null
  createdAt: string
  metadata: Record<string, unknown>
}

export type CareLinkDispatchThread = {
  id: string
  missionId: number | null
  title: string
  priority: string
  unreadCount: number
  status: string
  lastMessage: string
  createdAt: string
  messages: CareLinkDispatchMessage[]
}

export type CareLinkNotificationRow = {
  id: string
  caregiverId: number | null
  missionId: number | null
  type: string
  title: string
  body: string
  priority: string
  status: string
  acknowledgedAt: string | null
  dismissedAt: string | null
  createdAt: string
  metadata: Record<string, unknown>
}

export type CareLinkAlertRow = CareLinkNotificationRow & { linkedEntityType: string | null; linkedEntityId: string | null }

export type CareLinkChecklistItemRow = {
  id: string
  missionId: number
  caregiverId: number | null
  label: string
  description: string | null
  category: string
  required: boolean
  completed: boolean
  completedAt: string | null
  completedBy: string | null
  notes: string | null
  sortOrder: number
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type CareLinkMissionReportRow = {
  id: string
  missionId: number
  caregiverId: number | null
  serviceType: string
  summary: string | null
  observations: string | null
  activities: Record<string, unknown>[]
  checklistSnapshot: Record<string, unknown>[]
  incidentFlag: boolean
  recommendations: string | null
  status: string
  submittedAt: string | null
  validationStatus: string
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type CareLinkPaymentDisputeRow = {
  id: string
  missionId: number | null
  caregiverId: number
  amountClaimed: number | null
  reason: string
  status: string
  createdAt: string
  resolvedAt: string | null
  metadata: Record<string, unknown>
}

export type CareLinkAgentDocumentRow = {
  id: string
  caregiverId: number
  documentType: string
  status: string
  expiresAt: string | null
  fileUrl: string | null
  reviewStatus: string
  createdAt: string
  updatedAt: string
  metadata: Record<string, unknown>
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function asNumber(value: unknown, fallback = 0) {
  const next = Number(value)
  return Number.isFinite(next) ? next : fallback
}

function asRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function normalizeMessage(row: AnyRow): CareLinkDispatchMessage {
  return {
    id: String(row.id),
    missionId: row.mission_id == null ? null : asNumber(row.mission_id),
    caregiverId: row.caregiver_id == null ? null : asNumber(row.caregiver_id),
    threadKey: row.thread_key == null ? null : String(row.thread_key),
    senderType: asString(row.sender_type, 'agent'),
    senderId: row.sender_id == null ? null : String(row.sender_id),
    recipientType: row.recipient_type == null ? null : String(row.recipient_type),
    subject: row.subject == null ? null : String(row.subject),
    body: asString(row.body, ''),
    priority: asString(row.priority, 'normal'),
    status: asString(row.status, 'sent'),
    readAt: row.read_at == null ? null : String(row.read_at),
    createdAt: asString(row.created_at, new Date().toISOString()),
    metadata: asRecord(row.metadata),
  }
}

function normalizeNotification(row: AnyRow): CareLinkNotificationRow {
  return {
    id: String(row.id),
    caregiverId: row.caregiver_id == null ? null : asNumber(row.caregiver_id),
    missionId: row.mission_id == null ? null : asNumber(row.mission_id),
    type: asString(row.type, 'mission_update'),
    title: asString(row.title, 'Notification'),
    body: asString(row.body, ''),
    priority: asString(row.priority, 'normal'),
    status: asString(row.status, 'unread'),
    acknowledgedAt: row.acknowledged_at == null ? null : String(row.acknowledged_at),
    dismissedAt: row.dismissed_at == null ? null : String(row.dismissed_at),
    createdAt: asString(row.created_at, new Date().toISOString()),
    metadata: asRecord(row.metadata),
  }
}

function normalizeAlert(row: AnyRow): CareLinkAlertRow {
  return {
    ...normalizeNotification(row),
    linkedEntityType: row.linked_entity_type == null ? null : String(row.linked_entity_type),
    linkedEntityId: row.linked_entity_id == null ? null : String(row.linked_entity_id),
  }
}

function normalizeChecklist(row: AnyRow): CareLinkChecklistItemRow {
  return {
    id: String(row.id),
    missionId: asNumber(row.mission_id),
    caregiverId: row.caregiver_id == null ? null : asNumber(row.caregiver_id),
    label: asString(row.label, ''),
    description: row.description == null ? null : String(row.description),
    category: asString(row.category, 'general'),
    required: Boolean(row.required),
    completed: Boolean(row.completed),
    completedAt: row.completed_at == null ? null : String(row.completed_at),
    completedBy: row.completed_by == null ? null : String(row.completed_by),
    notes: row.notes == null ? null : String(row.notes),
    sortOrder: asNumber(row.sort_order),
    metadata: asRecord(row.metadata),
    createdAt: asString(row.created_at, new Date().toISOString()),
    updatedAt: asString(row.updated_at, new Date().toISOString()),
  }
}

function normalizeReport(row: AnyRow): CareLinkMissionReportRow {
  return {
    id: String(row.id),
    missionId: asNumber(row.mission_id),
    caregiverId: row.caregiver_id == null ? null : asNumber(row.caregiver_id),
    serviceType: asString(row.service_type, 'Service AngelCare'),
    summary: row.summary == null ? null : String(row.summary),
    observations: row.observations == null ? null : String(row.observations),
    activities: asArray(row.activities).map((item) => asRecord(item)),
    checklistSnapshot: asArray(row.checklist_snapshot).map((item) => asRecord(item)),
    incidentFlag: Boolean(row.incident_flag),
    recommendations: row.recommendations == null ? null : String(row.recommendations),
    status: asString(row.status, 'draft'),
    submittedAt: row.submitted_at == null ? null : String(row.submitted_at),
    validationStatus: asString(row.validation_status, 'pending'),
    metadata: asRecord(row.metadata),
    createdAt: asString(row.created_at, new Date().toISOString()),
    updatedAt: asString(row.updated_at, new Date().toISOString()),
  }
}

function normalizeDispute(row: AnyRow): CareLinkPaymentDisputeRow {
  return {
    id: String(row.id),
    missionId: row.mission_id == null ? null : asNumber(row.mission_id),
    caregiverId: asNumber(row.caregiver_id),
    amountClaimed: row.amount_claimed == null ? null : asNumber(row.amount_claimed),
    reason: asString(row.reason, ''),
    status: asString(row.status, 'pending'),
    createdAt: asString(row.created_at, new Date().toISOString()),
    resolvedAt: row.resolved_at == null ? null : String(row.resolved_at),
    metadata: asRecord(row.metadata),
  }
}

function normalizeDocument(row: AnyRow): CareLinkAgentDocumentRow {
  return {
    id: String(row.id),
    caregiverId: asNumber(row.caregiver_id),
    documentType: asString(row.document_type, ''),
    status: asString(row.status, 'pending'),
    expiresAt: row.expires_at == null ? null : String(row.expires_at),
    fileUrl: row.file_url == null ? null : String(row.file_url),
    reviewStatus: asString(row.review_status, 'pending'),
    createdAt: asString(row.created_at, new Date().toISOString()),
    updatedAt: asString(row.updated_at, new Date().toISOString()),
    metadata: asRecord(row.metadata),
  }
}

async function queryRows(table: string, build: (query: any) => any): Promise<AnyRow[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await build(supabase.from(table))
    if (error || !Array.isArray(data)) return []
    return data as AnyRow[]
  } catch {
    return []
  }
}

async function querySingle(table: string, build: (query: any) => any): Promise<AnyRow | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await build(supabase.from(table))
    if (error || !data) return null
    return data as AnyRow
  } catch {
    return null
  }
}

function humanizeChecklistLabel(key: string) {
  const labels: Record<string, string> = {
    confirm_parent_instructions: 'Confirmer les consignes parent',
    check_home_safety: 'Vérifier la sécurité du lieu',
    track_meal_hydration: 'Suivre repas et hydratation',
    record_activities: 'Noter les activités réalisées',
    handover_summary: 'Préparer la remise de fin de mission',
    confirm_feeding_rules: 'Confirmer les règles d’alimentation',
    sanitize_environment: 'Assainir l’environnement',
    track_baby_care: 'Suivre les soins bébé',
    support_mother_instructions: 'Appliquer les consignes de la mère',
    confirm_school_contact: 'Confirmer le contact de l’école',
    arrival_at_school: 'Confirmer l’arrivée à l’école',
    support_child: 'Accompagner l’enfant',
    teacher_handover: 'Effectuer la remise à l’enseignant',
    parent_update: 'Informer la famille',
    prepare_materials: 'Préparer le matériel',
    confirm_activity_sequence: 'Confirmer la séquence d’activité',
    supervise_safety: 'Superviser la sécurité',
    handover_to_parent: 'Remise au parent',
    departure_check: 'Contrôle départ',
    attendance_tracking: 'Suivi de présence',
    transit_supervision: 'Supervision du trajet',
    arrival_confirmation: 'Confirmation d’arrivée',
    return_handover: 'Remise retour',
    confirm_instructions: 'Confirmer les consignes',
    confirm_arrival: 'Confirmer l’arrivée',
    complete_service: 'Compléter le service',
    submit_report: 'Soumettre le rapport',
  }
  return labels[key] || key.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function buildChecklistTemplate(serviceType: string, caregiverId: number | null, missionId: number) {
  const service = getServiceCharacteristic(serviceType)
  return service.defaultChecklist.map((item, index) => ({
    mission_id: missionId,
    caregiver_id: caregiverId,
    label: humanizeChecklistLabel(item),
    description: item,
    category: service.serviceFamily,
    required: true,
    completed: false,
    completed_at: null,
    completed_by: null,
    notes: null,
    sort_order: index,
    metadata: { template_key: item, service_type: serviceType },
  }))
}

export async function loadDispatchMessages(filters: { caregiverId?: number | null; missionIds?: number[] } = {}) {
  const rows = await queryRows(CARELINK_MOBILE_TABLES.messages, (query) => query.select('*').order('created_at', { ascending: false }).limit(500))
  const messages = rows
    .filter((row) => {
      if (filters.caregiverId && row.caregiver_id != null && asNumber(row.caregiver_id) !== filters.caregiverId) return false
      if (filters.caregiverId && row.caregiver_id == null && !filters.missionIds?.length) return true
      if (filters.missionIds?.length) return filters.missionIds.includes(asNumber(row.mission_id))
      return true
    })
    .map(normalizeMessage)

  const grouped = new Map<string, CareLinkDispatchMessage[]>()
  messages.forEach((message) => {
    const key = message.threadKey || (message.missionId ? `mission:${message.missionId}` : `global:${message.recipientType || 'dispatch'}`)
    grouped.set(key, [...(grouped.get(key) || []), message])
  })

  const threads = Array.from(grouped.entries()).map(([id, items]) => {
    const sorted = [...items].sort((a, b) => String(b.createdAt).localeCompare(a.createdAt))
    const last = sorted[0]
    return {
      id,
      missionId: last?.missionId ?? null,
      title: last?.subject || (last?.missionId ? `Mission ${last.missionId}` : 'Liaison dispatch'),
      priority: last?.priority || 'normal',
      unreadCount: sorted.filter((item) => !item.readAt && String(item.status).toLowerCase() !== 'read').length,
      status: last?.status || 'sent',
      lastMessage: last?.body || '',
      createdAt: last?.createdAt || new Date().toISOString(),
      messages: sorted,
    } as CareLinkDispatchThread
  }).sort((a, b) => String(b.createdAt).localeCompare(a.createdAt))

  return {
    messages,
    threads,
    unreadCount: messages.filter((item) => !item.readAt && String(item.status).toLowerCase() !== 'read').length,
  }
}

export async function createDispatchMessage(input: {
  missionId?: number | null
  caregiverId?: number | null
  senderType: string
  senderId?: string | null
  recipientType?: string | null
  subject?: string | null
  body: string
  priority?: string
  status?: string
  threadKey?: string | null
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  const payload = {
    mission_id: input.missionId ?? null,
    caregiver_id: input.caregiverId ?? null,
    sender_type: input.senderType,
    sender_id: input.senderId ?? null,
    recipient_type: input.recipientType ?? null,
    subject: input.subject ?? null,
    body: input.body,
    priority: input.priority || 'normal',
    status: input.status || 'sent',
    thread_key: input.threadKey || (input.missionId ? `mission:${input.missionId}` : null),
    metadata: input.metadata || {},
  }
  const { data, error } = await supabase.from(CARELINK_MOBILE_TABLES.messages).insert([payload]).select('*').maybeSingle()
  if (error) throw new Error(error.message)
  if (input.missionId) {
    await recordMissionEvent({
      missionId: input.missionId,
      eventType: 'mobile_dispatch_message_sent',
      content: input.body,
      metadata: { ...input.metadata, subject: input.subject || null, priority: input.priority || 'normal' },
      source: 'carelink_mobile',
    })
  }
  return normalizeMessage(data as AnyRow)
}

export async function markDispatchMessageRead(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from(CARELINK_MOBILE_TABLES.messages).update({ read_at: new Date().toISOString(), status: 'read' }).eq('id', id).select('*').maybeSingle()
  if (error) throw new Error(error.message)
  return data ? normalizeMessage(data as AnyRow) : null
}

export async function loadNotifications(filters: { caregiverId?: number | null; missionIds?: number[] } = {}) {
  const rows = await queryRows(CARELINK_MOBILE_TABLES.notifications, (query) => query.select('*').order('created_at', { ascending: false }).limit(500))
  return rows
    .filter((row) => {
      if (filters.caregiverId && row.caregiver_id != null && asNumber(row.caregiver_id) !== filters.caregiverId) return false
      if (filters.missionIds?.length) return row.mission_id == null || filters.missionIds.includes(asNumber(row.mission_id))
      return true
    })
    .map(normalizeNotification)
}

export async function acknowledgeNotification(id: string, missionId?: number | null, note?: string | null) {
  const supabase = await createClient()
  const { data, error } = await supabase.from(CARELINK_MOBILE_TABLES.notifications).update({
    status: 'acknowledged',
    acknowledged_at: new Date().toISOString(),
    metadata: note ? { note } : undefined,
  }).eq('id', id).select('*').maybeSingle()
  if (error) throw new Error(error.message)
  if (missionId) {
    await recordMissionEvent({
      missionId,
      eventType: 'notification_acknowledged',
      content: note || `Notification ${id} reconnue depuis CareLink mobile`,
      metadata: { notification_id: id },
      source: 'carelink_mobile',
    })
  }
  return data ? normalizeNotification(data as AnyRow) : null
}

export async function createNotification(input: {
  type: string
  title: string
  body: string
  priority?: string
  missionId?: number | null
  caregiverId?: number | null
  linkedEntityType?: string | null
  linkedEntityId?: string | null
  status?: string
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  const payload = {
    type: input.type,
    title: input.title,
    body: input.body,
    priority: input.priority || 'normal',
    status: input.status || 'unread',
    mission_id: input.missionId ?? null,
    caregiver_id: input.caregiverId ?? null,
    linked_entity_type: input.linkedEntityType ?? null,
    linked_entity_id: input.linkedEntityId ?? null,
    metadata: input.metadata || {},
  }
  const { data, error } = await supabase.from(CARELINK_MOBILE_TABLES.notifications).insert([payload]).select('*').maybeSingle()
  if (error) throw new Error(error.message)
  return data ? normalizeNotification(data as AnyRow) : null
}

export async function loadAlerts(filters: { caregiverId?: number | null; missionIds?: number[] } = {}) {
  const rows = await queryRows(CARELINK_MOBILE_TABLES.alerts, (query) => query.select('*').order('created_at', { ascending: false }).limit(500))
  return rows
    .filter((row) => {
      if (filters.caregiverId && row.caregiver_id != null && asNumber(row.caregiver_id) !== filters.caregiverId) return false
      if (filters.missionIds?.length) return row.mission_id == null || filters.missionIds.includes(asNumber(row.mission_id))
      return true
    })
    .map(normalizeAlert)
}

export async function acknowledgeAlert(id: string, missionId?: number | null, note?: string | null) {
  const supabase = await createClient()
  const { data, error } = await supabase.from(CARELINK_MOBILE_TABLES.alerts).update({
    status: 'acknowledged',
    acknowledged_at: new Date().toISOString(),
    metadata: note ? { note } : undefined,
  }).eq('id', id).select('*').maybeSingle()
  if (error) throw new Error(error.message)
  if (missionId) {
    await recordMissionEvent({
      missionId,
      eventType: 'alert_acknowledged',
      content: note || `Alerte ${id} reconnue depuis CareLink mobile`,
      metadata: { alert_id: id },
      source: 'carelink_mobile',
    })
  }
  return data ? normalizeAlert(data as AnyRow) : null
}

export async function createAlert(input: {
  type: string
  title: string
  body: string
  priority?: string
  missionId?: number | null
  caregiverId?: number | null
  linkedEntityType?: string | null
  linkedEntityId?: string | null
  status?: string
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  const payload = {
    type: input.type,
    title: input.title,
    body: input.body,
    priority: input.priority || 'normal',
    status: input.status || 'open',
    mission_id: input.missionId ?? null,
    caregiver_id: input.caregiverId ?? null,
    linked_entity_type: input.linkedEntityType ?? null,
    linked_entity_id: input.linkedEntityId ?? null,
    metadata: input.metadata || {},
  }
  const { data, error } = await supabase.from(CARELINK_MOBILE_TABLES.alerts).insert([payload]).select('*').maybeSingle()
  if (error) throw new Error(error.message)
  return data ? normalizeAlert(data as AnyRow) : null
}

export async function loadMissionChecklist(missionId: number, serviceType?: string | null, caregiverId?: number | null) {
  let rows = await queryRows(CARELINK_MOBILE_TABLES.checklist, (query) => query.select('*').eq('mission_id', missionId).order('sort_order', { ascending: true }).order('created_at', { ascending: true }))
  if (!rows.length && serviceType) {
    const supabase = await createClient()
    const template = buildChecklistTemplate(serviceType, caregiverId ?? null, missionId)
    const { data, error } = await supabase.from(CARELINK_MOBILE_TABLES.checklist).insert(template).select('*').order('sort_order', { ascending: true })
    if (!error && Array.isArray(data)) rows = data as AnyRow[]
  }
  return rows.map(normalizeChecklist)
}

export async function updateMissionChecklistItem(itemId: string, patch: Partial<Pick<CareLinkChecklistItemRow, 'completed' | 'completedAt' | 'completedBy' | 'notes'>> & { metadata?: Record<string, unknown> }) {
  const supabase = await createClient()
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.completed !== undefined) payload.completed = patch.completed
  if (patch.completedAt !== undefined) payload.completed_at = patch.completedAt
  if (patch.completedBy !== undefined) payload.completed_by = patch.completedBy
  if (patch.notes !== undefined) payload.notes = patch.notes
  if (patch.metadata !== undefined) payload.metadata = patch.metadata
  const { data, error } = await supabase.from(CARELINK_MOBILE_TABLES.checklist).update(payload).eq('id', itemId).select('*').maybeSingle()
  if (error) throw new Error(error.message)
  return data ? normalizeChecklist(data as AnyRow) : null
}

export async function completeMissionChecklist(missionId: number, input: { itemIds?: string[]; notes?: string; caregiverId?: number | null; metadata?: Record<string, unknown> } = {}) {
  const checklist = await loadMissionChecklist(missionId)
  const now = new Date().toISOString()
  const itemIds = new Set((input.itemIds || []).map(String))
  const supabase = await createClient()
  const completedRows = checklist.map((item) => ({
    ...item,
    completed: item.completed || (itemIds.size ? itemIds.has(item.id) : true),
    completedAt: item.completedAt || now,
    completedBy: item.completedBy || String(input.caregiverId || ''),
    notes: input.notes || item.notes || null,
    updatedAt: now,
  }))
  const { error } = await supabase.from(CARELINK_MOBILE_TABLES.checklist).upsert(
    completedRows.map((item) => ({
      id: item.id,
      mission_id: item.missionId,
      caregiver_id: item.caregiverId,
      label: item.label,
      description: item.description,
      category: item.category,
      required: item.required,
      completed: item.completed,
      completed_at: item.completedAt,
      completed_by: item.completedBy,
      notes: item.notes,
      sort_order: item.sortOrder,
      metadata: item.metadata,
      updated_at: now,
    })),
    { onConflict: 'id' },
  )
  if (error) throw new Error(error.message)
  await recordMissionEvent({
    missionId,
    eventType: 'mobile_checklist_completed',
    content: input.notes || 'Checklist mobile complétée',
    metadata: { item_ids: input.itemIds || [], checklist_size: completedRows.length, ...input.metadata },
    source: 'carelink_mobile',
  })
  return completedRows.map(normalizeChecklist)
}

export async function loadMissionReport(missionId: number) {
  const row = await querySingle(CARELINK_MOBILE_TABLES.reports, (query) => query.select('*').eq('mission_id', missionId).maybeSingle())
  return row ? normalizeReport(row) : null
}

export async function saveMissionReport(input: {
  missionId: number
  caregiverId?: number | null
  serviceType: string
  summary?: string | null
  observations?: string | null
  activities?: Record<string, unknown>[]
  checklistSnapshot?: Record<string, unknown>[]
  incidentFlag?: boolean
  recommendations?: string | null
  status?: string
  validationStatus?: string
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  const payload = {
    mission_id: input.missionId,
    caregiver_id: input.caregiverId ?? null,
    service_type: input.serviceType,
    summary: input.summary ?? null,
    observations: input.observations ?? null,
    activities: input.activities || [],
    checklist_snapshot: input.checklistSnapshot || [],
    incident_flag: Boolean(input.incidentFlag),
    recommendations: input.recommendations ?? null,
    status: input.status || 'submitted',
    submitted_at: new Date().toISOString(),
    validation_status: input.validationStatus || 'ready',
    metadata: input.metadata || {},
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from(CARELINK_MOBILE_TABLES.reports).upsert([payload], { onConflict: 'mission_id' }).select('*').maybeSingle()
  if (error) throw new Error(error.message)
  await recordMissionEvent({
    missionId: input.missionId,
    eventType: 'mobile_report_submitted',
    content: input.summary || 'Rapport mission soumis depuis CareLink mobile',
    metadata: { report: payload },
    source: 'carelink_mobile',
  })
  return data ? normalizeReport(data as AnyRow) : null
}

export async function loadPaymentDisputes(filters: { caregiverId?: number | null; missionIds?: number[] } = {}) {
  const rows = await queryRows(CARELINK_MOBILE_TABLES.disputes, (query) => query.select('*').order('created_at', { ascending: false }).limit(500))
  return rows
    .filter((row) => {
      if (filters.caregiverId && asNumber(row.caregiver_id) !== filters.caregiverId) return false
      if (filters.missionIds?.length) return row.mission_id == null || filters.missionIds.includes(asNumber(row.mission_id))
      return true
    })
    .map(normalizeDispute)
}

export async function createPaymentDispute(input: {
  caregiverId: number
  missionId?: number | null
  amountClaimed?: number | null
  reason: string
  status?: string
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  const payload = {
    mission_id: input.missionId ?? null,
    caregiver_id: input.caregiverId,
    amount_claimed: input.amountClaimed ?? null,
    reason: input.reason,
    status: input.status || 'pending',
    metadata: input.metadata || {},
  }
  const { data, error } = await supabase.from(CARELINK_MOBILE_TABLES.disputes).insert([payload]).select('*').maybeSingle()
  if (error) throw new Error(error.message)
  if (input.missionId) {
    await recordMissionEvent({
      missionId: input.missionId,
      eventType: 'payment_correction_requested',
      content: input.reason,
      metadata: { amount_claimed: input.amountClaimed ?? null, dispute_status: input.status || 'pending' },
      source: 'carelink_mobile',
    })
  }
  return data ? normalizeDispute(data as AnyRow) : null
}

export async function loadAgentDocuments(caregiverId?: number | null) {
  const rows = await queryRows(CARELINK_MOBILE_TABLES.documents, (query) => query.select('*').order('created_at', { ascending: false }).limit(250))
  return rows
    .filter((row) => (caregiverId ? asNumber(row.caregiver_id) === caregiverId : true))
    .map(normalizeDocument)
}

export async function saveAgentDocument(input: {
  caregiverId: number
  documentType: string
  status?: string
  expiresAt?: string | null
  fileUrl?: string | null
  reviewStatus?: string
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  const payload = {
    caregiver_id: input.caregiverId,
    document_type: input.documentType,
    status: input.status || 'pending',
    expires_at: input.expiresAt ?? null,
    file_url: input.fileUrl ?? null,
    review_status: input.reviewStatus || 'pending',
    metadata: input.metadata || {},
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from(CARELINK_MOBILE_TABLES.documents).insert([payload]).select('*').maybeSingle()
  if (error) throw new Error(error.message)
  return data ? normalizeDocument(data as AnyRow) : null
}

export async function requestDocumentReview(caregiverId: number, input: { documentType?: string | null; note?: string | null; metadata?: Record<string, unknown> } = {}) {
  const supabase = await createClient()
  const updatePayload: Record<string, unknown> = {
    review_status: 'review_requested',
    updated_at: new Date().toISOString(),
    metadata: { note: input.note || null, ...(input.metadata || {}) },
  }
  const query = supabase.from(CARELINK_MOBILE_TABLES.documents).update(updatePayload).eq('caregiver_id', caregiverId)
  if (input.documentType) query.eq('document_type', input.documentType)
  const { data, error } = await query.select('*').maybeSingle()
  if (error) throw new Error(error.message)
  return data ? normalizeDocument(data as AnyRow) : null
}

export async function loadCareLinkOperationalAudit(missionIds: number[] = []) {
  const supabase = await createClient()
  const events = missionIds.length ? await queryRows('mission_events', (query) => query.select('*').in('mission_id', missionIds).order('created_at', { ascending: false }).limit(250)) : []
  const messages = await loadDispatchMessages({ missionIds })
  const notifications = await loadNotifications({ missionIds })
  const alerts = await loadAlerts({ missionIds })
  const reports = missionIds.length ? await Promise.all(missionIds.map(async (missionId) => loadMissionReport(missionId))) : []
  const disputes = await loadPaymentDisputes({ missionIds })
  const documents = await loadAgentDocuments()
  return {
    events,
    messages: messages.messages,
    notifications,
    alerts,
    reports: reports.filter(Boolean),
    disputes,
    documents,
    generatedAt: new Date().toISOString(),
    dbConnected: Boolean(supabase),
  }
}
