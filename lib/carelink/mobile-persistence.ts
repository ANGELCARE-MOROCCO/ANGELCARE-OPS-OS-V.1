import { createClient } from '@/lib/supabase/server'
import { getServiceCharacteristic } from '@/lib/missions/service-characteristics'
import { buildCareLinkDynamicServiceChecklist, checklistItemMetadata } from '@/lib/carelink/mobile-service-checklists'
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
  programActivityLogs: 'carelink_mission_program_activity_logs',
  briefAcknowledgements: 'carelink_mission_brief_acknowledgements',
  routeExecutionLogs: 'carelink_mission_route_execution_logs',
  reportCorrections: 'carelink_mission_report_corrections',
  presenceProofs: 'carelink_mission_presence_proofs',
  sosEvents: 'carelink_mobile_sos_events',
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
  serviceType: string | null
  serviceFamily: string | null
  itemKey: string | null
  checkGroup: string | null
  evidenceRequired: boolean
  severity: string
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
  correctionStatus: string
  correctionRequired: boolean
  correctionRound: number
  correctionNotes: string | null
  opsFeedback: string | null
  validatedAt: string | null
  correctedAt: string | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type CareLinkMissionReportCorrectionRow = {
  id: string
  missionId: number
  caregiverId: number | null
  reportId: string | null
  status: string
  requestedBy: string | null
  requestedAt: string | null
  dueAt: string | null
  resolvedAt: string | null
  requiredChanges: string[]
  opsNote: string | null
  agentResponse: string | null
  resubmittedAt: string | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type CareLinkMissionPresenceProofRow = {
  id: string
  missionId: number
  caregiverId: number
  authUserId: string | null
  action: string
  status: string
  proofType: string
  occurredAt: string
  locationSnapshot: Record<string, unknown>
  deviceSnapshot: Record<string, unknown>
  reason: string | null
  note: string | null
  riskFlag: string | null
  source: string
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type CareLinkPaymentDisputeRow = {
  id: string
  missionId: number | null
  caregiverId: number
  amountClaimed: number | null
  amountExpected: number | null
  amountPaid: number | null
  disputeType: string
  targetLineId: string | null
  targetLineKind: string | null
  evidenceUrl: string | null
  agentNote: string | null
  opsReviewStatus: string
  reviewedBy: string | null
  reviewedAt: string | null
  reviewNote: string | null
  reason: string
  status: string
  createdAt: string
  resolvedAt: string | null
  metadata: Record<string, unknown>
}

export type CareLinkMobileSosEventRow = {
  id: string
  caregiverId: number
  missionId: number | null
  authUserId: string | null
  emergencyType: string
  severity: string
  status: string
  note: string | null
  callbackRequested: boolean
  replacementRequested: boolean
  locationSnapshot: Record<string, unknown>
  deviceSnapshot: Record<string, unknown>
  alertId: string | null
  escalationId: string | null
  dispatchThreadKey: string | null
  source: string
  metadata: Record<string, unknown>
  acknowledgedAt: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
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


export type CareLinkMissionBriefAcknowledgementRow = {
  id: string
  missionId: number
  caregiverId: number
  status: string
  briefVersion: string
  sections: Record<string, unknown>
  briefSnapshot: Record<string, unknown>
  parentInstructionsAcknowledged: boolean
  serviceScopeAcknowledged: boolean
  locationAcknowledged: boolean
  emergencyAcknowledged: boolean
  confidentialityAcknowledged: boolean
  acknowledgedAt: string | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}


export type CareLinkMissionRouteExecutionLogRow = {
  id: string
  missionId: number
  caregiverId: number
  routeId: string
  routeCode: string | null
  action: string
  status: string
  transportMode: string | null
  eta: string | null
  locationSnapshot: Record<string, unknown>
  routeSnapshot: Record<string, unknown>
  allowanceClaim: Record<string, unknown>
  notes: string | null
  issueSeverity: string | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type CareLinkProgramActivityLogRow = {
  id: string
  missionId: number
  caregiverId: number
  activityId: string
  activityLabel: string
  status: string
  notes: string | null
  issueSeverity: string | null
  startedAt: string | null
  completedAt: string | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
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
    serviceType: row.service_type == null ? asString(asRecord(row.metadata).service_type, '') || null : String(row.service_type),
    serviceFamily: row.service_family == null ? asString(asRecord(row.metadata).service_family, '') || null : String(row.service_family),
    itemKey: row.item_key == null ? asString(asRecord(row.metadata).template_key, '') || null : String(row.item_key),
    checkGroup: row.check_group == null ? asString(asRecord(row.metadata).checklist_group, '') || null : String(row.check_group),
    evidenceRequired: Boolean(row.evidence_required ?? asRecord(row.metadata).evidence_required),
    severity: asString(row.severity, asString(asRecord(row.metadata).severity, 'standard')),
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
    correctionStatus: asString(row.correction_status, asString(asRecord(row.metadata).correction_status, 'none')),
    correctionRequired: Boolean(row.correction_required ?? asRecord(row.metadata).correction_required),
    correctionRound: asNumber(row.correction_round ?? asRecord(row.metadata).correction_round),
    correctionNotes: row.correction_notes == null ? null : String(row.correction_notes),
    opsFeedback: row.ops_feedback == null ? null : String(row.ops_feedback),
    validatedAt: row.validated_at == null ? null : String(row.validated_at),
    correctedAt: row.corrected_at == null ? null : String(row.corrected_at),
    metadata: asRecord(row.metadata),
    createdAt: asString(row.created_at, new Date().toISOString()),
    updatedAt: asString(row.updated_at, new Date().toISOString()),
  }
}

function normalizeReportCorrection(row: AnyRow): CareLinkMissionReportCorrectionRow {
  return {
    id: String(row.id),
    missionId: asNumber(row.mission_id),
    caregiverId: row.caregiver_id == null ? null : asNumber(row.caregiver_id),
    reportId: row.report_id == null ? null : String(row.report_id),
    status: asString(row.status, 'correction_requested'),
    requestedBy: row.requested_by == null ? null : String(row.requested_by),
    requestedAt: row.requested_at == null ? null : String(row.requested_at),
    dueAt: row.due_at == null ? null : String(row.due_at),
    resolvedAt: row.resolved_at == null ? null : String(row.resolved_at),
    requiredChanges: asArray(row.required_changes).map((item) => String(item)).filter(Boolean),
    opsNote: row.ops_note == null ? null : String(row.ops_note),
    agentResponse: row.agent_response == null ? null : String(row.agent_response),
    resubmittedAt: row.resubmitted_at == null ? null : String(row.resubmitted_at),
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
    amountExpected: row.amount_expected == null ? null : asNumber(row.amount_expected),
    amountPaid: row.amount_paid == null ? null : asNumber(row.amount_paid),
    disputeType: asString(row.dispute_type, asString(asRecord(row.metadata).dispute_type, 'payment_correction')),
    targetLineId: row.target_line_id == null ? null : String(row.target_line_id),
    targetLineKind: row.target_line_kind == null ? null : String(row.target_line_kind),
    evidenceUrl: row.evidence_url == null ? null : String(row.evidence_url),
    agentNote: row.agent_note == null ? null : String(row.agent_note),
    opsReviewStatus: asString(row.ops_review_status, 'pending_ops_review'),
    reviewedBy: row.reviewed_by == null ? null : String(row.reviewed_by),
    reviewedAt: row.reviewed_at == null ? null : String(row.reviewed_at),
    reviewNote: row.review_note == null ? null : String(row.review_note),
    reason: asString(row.reason, ''),
    status: asString(row.status, 'pending'),
    createdAt: asString(row.created_at, new Date().toISOString()),
    resolvedAt: row.resolved_at == null ? null : String(row.resolved_at),
    metadata: asRecord(row.metadata),
  }
}

function normalizeSosEvent(row: AnyRow): CareLinkMobileSosEventRow {
  return {
    id: String(row.id),
    caregiverId: asNumber(row.caregiver_id),
    missionId: row.mission_id == null ? null : asNumber(row.mission_id),
    authUserId: row.auth_user_id == null ? null : String(row.auth_user_id),
    emergencyType: asString(row.emergency_type, 'sos'),
    severity: asString(row.severity, 'critical'),
    status: asString(row.status, 'open'),
    note: row.note == null ? null : String(row.note),
    callbackRequested: Boolean(row.callback_requested),
    replacementRequested: Boolean(row.replacement_requested),
    locationSnapshot: asRecord(row.location_snapshot),
    deviceSnapshot: asRecord(row.device_snapshot),
    alertId: row.alert_id == null ? null : String(row.alert_id),
    escalationId: row.escalation_id == null ? null : String(row.escalation_id),
    dispatchThreadKey: row.dispatch_thread_key == null ? null : String(row.dispatch_thread_key),
    source: asString(row.source, 'carelink_mobile'),
    metadata: asRecord(row.metadata),
    acknowledgedAt: row.acknowledged_at == null ? null : String(row.acknowledged_at),
    resolvedAt: row.resolved_at == null ? null : String(row.resolved_at),
    createdAt: asString(row.created_at, new Date().toISOString()),
    updatedAt: asString(row.updated_at, new Date().toISOString()),
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


function normalizeBriefAcknowledgement(row: AnyRow): CareLinkMissionBriefAcknowledgementRow {
  return {
    id: String(row.id),
    missionId: asNumber(row.mission_id),
    caregiverId: asNumber(row.caregiver_id),
    status: asString(row.status, 'acknowledged'),
    briefVersion: asString(row.brief_version, 'carelink-mobile-brief-v1'),
    sections: asRecord(row.sections),
    briefSnapshot: asRecord(row.brief_snapshot),
    parentInstructionsAcknowledged: Boolean(row.parent_instructions_acknowledged),
    serviceScopeAcknowledged: Boolean(row.service_scope_acknowledged),
    locationAcknowledged: Boolean(row.location_acknowledged),
    emergencyAcknowledged: Boolean(row.emergency_acknowledged),
    confidentialityAcknowledged: Boolean(row.confidentiality_acknowledged),
    acknowledgedAt: row.acknowledged_at == null ? null : String(row.acknowledged_at),
    metadata: asRecord(row.metadata),
    createdAt: asString(row.created_at, new Date().toISOString()),
    updatedAt: asString(row.updated_at, new Date().toISOString()),
  }
}



function normalizePresenceProof(row: AnyRow): CareLinkMissionPresenceProofRow {
  return {
    id: asString(row.id),
    missionId: asNumber(row.mission_id),
    caregiverId: asNumber(row.caregiver_id),
    authUserId: row.auth_user_id ? asString(row.auth_user_id) : null,
    action: asString(row.action, 'presence_update'),
    status: asString(row.status, 'recorded'),
    proofType: asString(row.proof_type, 'timestamp'),
    occurredAt: asString(row.occurred_at || row.created_at),
    locationSnapshot: asRecord(row.location_snapshot),
    deviceSnapshot: asRecord(row.device_snapshot),
    reason: row.reason ? asString(row.reason) : null,
    note: row.note ? asString(row.note) : null,
    riskFlag: row.risk_flag ? asString(row.risk_flag) : null,
    source: asString(row.source, 'carelink_mobile'),
    metadata: asRecord(row.metadata),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at || row.created_at),
  }
}

function normalizeRouteExecutionLog(row: AnyRow): CareLinkMissionRouteExecutionLogRow {
  return {
    id: String(row.id),
    missionId: asNumber(row.mission_id),
    caregiverId: asNumber(row.caregiver_id),
    routeId: asString(row.route_id, 'primary-route'),
    routeCode: row.route_code == null ? null : String(row.route_code),
    action: asString(row.action, 'route_update'),
    status: asString(row.status, 'recorded'),
    transportMode: row.transport_mode == null ? null : String(row.transport_mode),
    eta: row.eta == null ? null : String(row.eta),
    locationSnapshot: asRecord(row.location_snapshot),
    routeSnapshot: asRecord(row.route_snapshot),
    allowanceClaim: asRecord(row.allowance_claim),
    notes: row.notes == null ? null : String(row.notes),
    issueSeverity: row.issue_severity == null ? null : String(row.issue_severity),
    metadata: asRecord(row.metadata),
    createdAt: asString(row.created_at, new Date().toISOString()),
    updatedAt: asString(row.updated_at, new Date().toISOString()),
  }
}

function normalizeProgramActivityLog(row: AnyRow): CareLinkProgramActivityLogRow {
  return {
    id: String(row.id),
    missionId: asNumber(row.mission_id),
    caregiverId: asNumber(row.caregiver_id),
    activityId: asString(row.activity_id, ''),
    activityLabel: asString(row.activity_label, 'Activité'),
    status: asString(row.status, 'pending'),
    notes: row.notes == null ? null : String(row.notes),
    issueSeverity: row.issue_severity == null ? null : String(row.issue_severity),
    startedAt: row.started_at == null ? null : String(row.started_at),
    completedAt: row.completed_at == null ? null : String(row.completed_at),
    metadata: asRecord(row.metadata),
    createdAt: asString(row.created_at, new Date().toISOString()),
    updatedAt: asString(row.updated_at, new Date().toISOString()),
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

export function buildChecklistTemplate(serviceType: string, caregiverId: number | null, missionId: number, mission?: Record<string, unknown> | null) {
  const service = getServiceCharacteristic(serviceType)
  const definition = buildCareLinkDynamicServiceChecklist({
    serviceType,
    serviceFamily: service.serviceFamily,
    missionScope: String(mission?.mission_scope || mission?.scope || ''),
    riskLevel: String(mission?.risk_level || mission?.riskLevel || ''),
  })

  return definition.items.map((item, index) => ({
    mission_id: missionId,
    caregiver_id: caregiverId,
    label: item.label || humanizeChecklistLabel(item.key),
    description: item.description,
    category: item.category,
    service_type: definition.serviceType,
    service_family: definition.serviceFamily,
    item_key: item.key,
    check_group: item.groupLabel,
    evidence_required: item.evidenceRequired,
    severity: item.severity,
    required: item.required,
    completed: false,
    completed_at: null,
    completed_by: null,
    notes: null,
    sort_order: item.sortOrder || index,
    metadata: checklistItemMetadata(item, definition),
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

export async function loadMissionChecklist(missionId: number, serviceType?: string | null, caregiverId?: number | null, mission?: Record<string, unknown> | null) {
  let rows = await queryRows(CARELINK_MOBILE_TABLES.checklist, (query) => query.select('*').eq('mission_id', missionId).order('sort_order', { ascending: true }).order('created_at', { ascending: true }))
  if (!rows.length && serviceType) {
    const supabase = await createClient()
    const template = buildChecklistTemplate(serviceType, caregiverId ?? null, missionId, mission)
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
  if (patch.metadata !== undefined) {
    payload.metadata = patch.metadata
    const metadata = patch.metadata as Record<string, unknown>
    if (metadata.service_type) payload.service_type = metadata.service_type
    if (metadata.service_family) payload.service_family = metadata.service_family
    if (metadata.template_key) payload.item_key = metadata.template_key
    if (metadata.checklist_group) payload.check_group = metadata.checklist_group
    if (metadata.evidence_required !== undefined) payload.evidence_required = metadata.evidence_required
    if (metadata.severity) payload.severity = metadata.severity
  }
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
      service_type: item.serviceType,
      service_family: item.serviceFamily,
      item_key: item.itemKey,
      check_group: item.checkGroup,
      evidence_required: item.evidenceRequired,
      severity: item.severity,
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
  correctionStatus?: string
  correctionRequired?: boolean
  correctionNotes?: string | null
  opsFeedback?: string | null
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
    correction_status: input.correctionStatus || 'none',
    correction_required: Boolean(input.correctionRequired),
    correction_notes: input.correctionNotes ?? null,
    ops_feedback: input.opsFeedback ?? null,
    corrected_at: input.correctionStatus === 'resubmitted' ? new Date().toISOString() : null,
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

export async function loadMissionReportCorrections(missionId: number, caregiverId?: number | null) {
  const rows = await queryRows(CARELINK_MOBILE_TABLES.reportCorrections, (query) => {
    let next = query.select('*').eq('mission_id', missionId).order('created_at', { ascending: false }).limit(100)
    if (caregiverId != null) next = next.eq('caregiver_id', caregiverId)
    return next
  })
  return rows.map(normalizeReportCorrection)
}

export async function saveMissionReportCorrectionRequest(input: {
  missionId: number
  caregiverId?: number | null
  reportId?: string | null
  requestedBy?: string | null
  requiredChanges?: string[]
  opsNote?: string | null
  dueAt?: string | null
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const payload = {
    mission_id: input.missionId,
    caregiver_id: input.caregiverId ?? null,
    report_id: input.reportId ?? null,
    status: 'correction_requested',
    requested_by: input.requestedBy ?? 'carelink_ops',
    requested_at: now,
    due_at: input.dueAt ?? null,
    required_changes: input.requiredChanges || [],
    ops_note: input.opsNote ?? null,
    metadata: input.metadata || {},
    updated_at: now,
  }
  const { data, error } = await supabase.from(CARELINK_MOBILE_TABLES.reportCorrections).insert([payload]).select('*').maybeSingle()
  if (error) throw new Error(error.message)
  await supabase.from(CARELINK_MOBILE_TABLES.reports).update({
    validation_status: 'correction_requested',
    correction_status: 'correction_requested',
    correction_required: true,
    correction_requested_at: now,
    correction_notes: input.opsNote ?? null,
    ops_feedback: input.opsNote ?? null,
    updated_at: now,
  }).eq('mission_id', input.missionId)
  await recordMissionEvent({
    missionId: input.missionId,
    eventType: 'ops_report_correction_requested',
    content: input.opsNote || 'Correction de rapport demandée par CareLink OPS',
    metadata: { report_id: input.reportId ?? null, required_changes: input.requiredChanges || [], correction_id: data?.id || null, ...input.metadata },
    source: 'carelink_ops',
  })
  return data ? normalizeReportCorrection(data as AnyRow) : null
}

export async function markMissionReportCorrectionResubmitted(input: {
  missionId: number
  caregiverId: number
  reportId?: string | null
  agentResponse?: string | null
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const activeRows = await loadMissionReportCorrections(input.missionId, input.caregiverId)
  const active = activeRows.find((row) => ['correction_requested', 'needs_correction', 'open'].includes(asString(row.status).toLowerCase())) || activeRows[0] || null
  if (active?.id) {
    await supabase.from(CARELINK_MOBILE_TABLES.reportCorrections).update({
      status: 'resubmitted',
      agent_response: input.agentResponse ?? null,
      resubmitted_at: now,
      metadata: { ...(active.metadata || {}), ...(input.metadata || {}) },
      updated_at: now,
    }).eq('id', active.id)
  }
  await supabase.from(CARELINK_MOBILE_TABLES.reports).update({
    validation_status: 'ready',
    correction_status: 'resubmitted',
    correction_required: false,
    corrected_at: now,
    updated_at: now,
  }).eq('mission_id', input.missionId)
  await recordMissionEvent({
    missionId: input.missionId,
    eventType: 'mobile_report_correction_resubmitted',
    content: input.agentResponse || 'Correction de rapport resoumise depuis CareLink mobile',
    metadata: { report_id: input.reportId ?? null, correction_id: active?.id || null, ...input.metadata },
    source: 'carelink_mobile',
  })
  return active ? { ...active, status: 'resubmitted', agentResponse: input.agentResponse ?? null, resubmittedAt: now, updatedAt: now } : null
}

export async function markMissionReportValidated(input: { missionId: number; reportId?: string | null; validatedBy?: string | null; note?: string | null; metadata?: Record<string, unknown> }) {
  const supabase = await createClient()
  const now = new Date().toISOString()
  await supabase.from(CARELINK_MOBILE_TABLES.reportCorrections).update({
    status: 'validated',
    resolved_at: now,
    metadata: input.metadata || {},
    updated_at: now,
  }).eq('mission_id', input.missionId).in('status', ['correction_requested', 'needs_correction', 'resubmitted', 'open'])
  await supabase.from(CARELINK_MOBILE_TABLES.reports).update({
    validation_status: 'validated',
    correction_status: 'validated',
    correction_required: false,
    correction_resolved_at: now,
    validated_at: now,
    validated_by: input.validatedBy ?? 'carelink_ops',
    ops_feedback: input.note ?? null,
    updated_at: now,
  }).eq('mission_id', input.missionId)
}

export function missionReportValidationReadyForCompletion(report: CareLinkMissionReportRow | null, corrections: CareLinkMissionReportCorrectionRow[] = [], mission?: Record<string, any> | null) {
  const validationRequired = Boolean(mission?.report_validation_required || mission?.validation_required || report?.metadata?.validation_required)
  const validationStatus = asString(report?.validationStatus || '', '').toLowerCase()
  const correctionStatus = asString(report?.correctionStatus || '', '').toLowerCase()
  const activeCorrection = corrections.find((row) => ['correction_requested', 'needs_correction', 'open'].includes(asString(row.status).toLowerCase()))
  if (activeCorrection || correctionStatus === 'correction_requested' || report?.correctionRequired) {
    return { ready: false, code: 'carelink_report_correction_required', message: 'Une correction de rapport demandée par OPS doit être resoumise avant la clôture.', activeCorrection }
  }
  if (validationRequired && validationStatus !== 'validated') {
    return { ready: false, code: 'carelink_report_validation_required', message: 'La validation OPS du rapport est requise avant la clôture.', activeCorrection: null }
  }
  return { ready: true, code: 'carelink_report_validation_ready', message: 'Rapport prêt pour clôture.', activeCorrection: null }
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
  amountExpected?: number | null
  amountPaid?: number | null
  disputeType?: string | null
  targetLineId?: string | null
  targetLineKind?: string | null
  evidenceUrl?: string | null
  agentNote?: string | null
  reason: string
  status?: string
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  const payload = {
    mission_id: input.missionId ?? null,
    caregiver_id: input.caregiverId,
    amount_claimed: input.amountClaimed ?? null,
    amount_expected: input.amountExpected ?? null,
    amount_paid: input.amountPaid ?? null,
    dispute_type: input.disputeType || 'payment_correction',
    target_line_id: input.targetLineId || null,
    target_line_kind: input.targetLineKind || null,
    evidence_url: input.evidenceUrl || null,
    agent_note: input.agentNote || null,
    reason: input.reason,
    status: input.status || 'pending',
    ops_review_status: 'pending_ops_review',
    metadata: input.metadata || {},
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from(CARELINK_MOBILE_TABLES.disputes).insert([payload]).select('*').maybeSingle()
  if (error) throw new Error(error.message)
  if (input.missionId) {
    await recordMissionEvent({
      missionId: input.missionId,
      eventType: 'payment_correction_requested',
      content: input.reason,
      metadata: {
        amount_claimed: input.amountClaimed ?? null,
        amount_expected: input.amountExpected ?? null,
        amount_paid: input.amountPaid ?? null,
        dispute_type: input.disputeType || 'payment_correction',
        dispute_status: input.status || 'pending',
      },
      source: 'carelink_mobile',
    })
  }
  return data ? normalizeDispute(data as AnyRow) : null
}

export async function loadMobileSosEvents(filters: { caregiverId?: number | null; missionIds?: number[] } = {}) {
  const rows = await queryRows(CARELINK_MOBILE_TABLES.sosEvents, (query) => query.select('*').order('created_at', { ascending: false }).limit(250))
  return rows
    .filter((row) => {
      if (filters.caregiverId && asNumber(row.caregiver_id) !== filters.caregiverId) return false
      if (filters.missionIds?.length) return row.mission_id == null || filters.missionIds.includes(asNumber(row.mission_id))
      return true
    })
    .map(normalizeSosEvent)
}

export async function saveMobileSosEvent(input: {
  caregiverId: number
  missionId?: number | null
  authUserId?: string | null
  emergencyType: string
  severity?: string
  status?: string
  note?: string | null
  callbackRequested?: boolean
  replacementRequested?: boolean
  locationSnapshot?: Record<string, unknown> | null
  deviceSnapshot?: Record<string, unknown> | null
  alertId?: string | null
  escalationId?: string | null
  dispatchThreadKey?: string | null
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  const payload = {
    caregiver_id: input.caregiverId,
    mission_id: input.missionId ?? null,
    auth_user_id: input.authUserId || null,
    emergency_type: input.emergencyType,
    severity: input.severity || 'critical',
    status: input.status || 'open',
    note: input.note || null,
    callback_requested: Boolean(input.callbackRequested),
    replacement_requested: Boolean(input.replacementRequested),
    location_snapshot: input.locationSnapshot || {},
    device_snapshot: input.deviceSnapshot || {},
    alert_id: input.alertId || null,
    escalation_id: input.escalationId || null,
    dispatch_thread_key: input.dispatchThreadKey || null,
    source: 'carelink_mobile',
    metadata: input.metadata || {},
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from(CARELINK_MOBILE_TABLES.sosEvents).insert([payload]).select('*').maybeSingle()
  if (error) throw new Error(error.message)
  if (input.missionId) {
    await recordMissionEvent({
      missionId: input.missionId,
      eventType: `mobile_sos_${input.emergencyType}`,
      content: input.note || `Alerte ${input.emergencyType} envoyée depuis CareLink mobile`,
      metadata: { severity: payload.severity, callback_requested: payload.callback_requested, replacement_requested: payload.replacement_requested },
      source: 'carelink_mobile',
    })
  }
  return data ? normalizeSosEvent(data as AnyRow) : null
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
  const reportCorrections = missionIds.length ? (await Promise.all(missionIds.map(async (missionId) => loadMissionReportCorrections(missionId).catch(() => [])))).flat() : []
  const presenceProofs = missionIds.length ? (await Promise.all(missionIds.map(async (missionId) => loadMissionPresenceProofs(missionId).catch(() => [])))).flat() : []
  const sosEvents = await loadMobileSosEvents({ missionIds })
  const disputes = await loadPaymentDisputes({ missionIds })
  const documents = await loadAgentDocuments()
  return {
    events,
    messages: messages.messages,
    notifications,
    alerts,
    reports: reports.filter(Boolean),
    reportCorrections,
    presenceProofs,
    sosEvents,
    disputes,
    documents,
    generatedAt: new Date().toISOString(),
    dbConnected: Boolean(supabase),
  }
}




export async function loadMissionPresenceProofs(missionId: number, caregiverId?: number | null) {
  const rows = await queryRows(CARELINK_MOBILE_TABLES.presenceProofs, (query) => {
    let next = query.select('*').eq('mission_id', missionId).order('occurred_at', { ascending: false }).limit(120)
    if (caregiverId != null) next = next.eq('caregiver_id', caregiverId)
    return next
  })
  return rows.map(normalizePresenceProof)
}

export async function saveMissionPresenceProof(input: {
  missionId: number
  caregiverId: number
  authUserId?: string | null
  action: string
  status?: string | null
  proofType?: string | null
  occurredAt?: string | null
  locationSnapshot?: Record<string, unknown> | null
  deviceSnapshot?: Record<string, unknown> | null
  reason?: string | null
  note?: string | null
  riskFlag?: string | null
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const payload = {
    mission_id: input.missionId,
    caregiver_id: input.caregiverId,
    auth_user_id: input.authUserId || null,
    action: asString(input.action, 'presence_update'),
    status: asString(input.status, 'recorded'),
    proof_type: asString(input.proofType, 'timestamp'),
    occurred_at: input.occurredAt || now,
    location_snapshot: input.locationSnapshot || {},
    device_snapshot: input.deviceSnapshot || {},
    reason: input.reason || null,
    note: input.note || null,
    risk_flag: input.riskFlag || null,
    source: 'carelink_mobile',
    metadata: input.metadata || {},
    updated_at: now,
  }

  const { data, error } = await supabase
    .from(CARELINK_MOBILE_TABLES.presenceProofs)
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error

  await recordMissionEvent({
    missionId: input.missionId,
    eventType: `mobile_presence_${payload.action}`,
    content: `Présence mobile · ${payload.action}${input.note ? ` · ${input.note}` : ''}`,
    metadata: {
      caregiver_id: input.caregiverId,
      risk_flag: input.riskFlag || null,
      proof_type: payload.proof_type,
      ...(input.metadata || {}),
    },
    source: 'carelink_mobile',
  })

  return normalizePresenceProof(data)
}

export async function missionPresenceProofReadyForCompletion(missionId: number, caregiverId: number) {
  const proofs = await loadMissionPresenceProofs(missionId, caregiverId)
  const actions = new Set(proofs.map((proof) => proof.action))
  const hasCheckIn = actions.has('mission_check_in') || actions.has('arrival_check_in') || actions.has('day_started')
  const hasCheckOut = actions.has('mission_check_out') || actions.has('day_ended')
  return {
    ready: hasCheckIn && hasCheckOut,
    hasCheckIn,
    hasCheckOut,
    proofs,
  }
}


export async function loadMissionRouteExecutionLogs(missionId: number, caregiverId?: number | null) {
  const rows = await queryRows(CARELINK_MOBILE_TABLES.routeExecutionLogs, (query) => {
    let next = query.select('*').eq('mission_id', missionId).order('created_at', { ascending: false }).limit(120)
    if (caregiverId != null) next = next.eq('caregiver_id', caregiverId)
    return next
  })
  return rows.map(normalizeRouteExecutionLog)
}

export async function saveMissionRouteExecutionLog(input: {
  missionId: number
  caregiverId: number
  routeId?: string | null
  routeCode?: string | null
  action: string
  status?: string | null
  transportMode?: string | null
  eta?: string | null
  locationSnapshot?: Record<string, unknown> | null
  routeSnapshot?: Record<string, unknown> | null
  allowanceClaim?: Record<string, unknown> | null
  notes?: string | null
  issueSeverity?: string | null
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const payload = {
    mission_id: input.missionId,
    caregiver_id: input.caregiverId,
    route_id: input.routeId || 'primary-route',
    route_code: input.routeCode || null,
    action: asString(input.action, 'route_update'),
    status: asString(input.status, 'recorded'),
    transport_mode: input.transportMode || null,
    eta: input.eta || null,
    location_snapshot: input.locationSnapshot || {},
    route_snapshot: input.routeSnapshot || {},
    allowance_claim: input.allowanceClaim || {},
    notes: input.notes || null,
    issue_severity: input.issueSeverity || null,
    metadata: input.metadata || {},
    updated_at: now,
  }

  const { data, error } = await supabase
    .from(CARELINK_MOBILE_TABLES.routeExecutionLogs)
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error

  await recordMissionEvent({
    missionId: input.missionId,
    eventType: `mobile_route_${payload.action}`,
    content: `Route mobile · ${payload.action}${input.notes ? ` · ${input.notes}` : ''}`,
    metadata: {
      caregiver_id: input.caregiverId,
      route_id: payload.route_id,
      route_code: payload.route_code,
      transport_mode: payload.transport_mode,
      eta: payload.eta,
      issue_severity: payload.issue_severity,
      ...(input.metadata || {}),
    },
    source: 'carelink_mobile',
  })

  return normalizeRouteExecutionLog(data)
}

export async function loadMissionProgramActivityLogs(missionId: number, caregiverId?: number | null) {
  const rows = await queryRows(CARELINK_MOBILE_TABLES.programActivityLogs, (query) => {
    let next = query.select('*').eq('mission_id', missionId).order('updated_at', { ascending: false }).limit(200)
    if (caregiverId != null) next = next.eq('caregiver_id', caregiverId)
    return next
  })
  return rows.map(normalizeProgramActivityLog)
}

export async function saveMissionProgramActivityLog(input: {
  missionId: number
  caregiverId: number
  activityId: string
  activityLabel: string
  status: string
  notes?: string | null
  issueSeverity?: string | null
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const status = asString(input.status, 'completed')
  const row = {
    mission_id: input.missionId,
    caregiver_id: input.caregiverId,
    activity_id: input.activityId,
    activity_label: input.activityLabel,
    status,
    notes: input.notes || null,
    issue_severity: input.issueSeverity || null,
    started_at: status === 'started' ? now : null,
    completed_at: ['completed', 'done', 'validated'].includes(status) ? now : null,
    metadata: input.metadata || {},
    updated_at: now,
  }

  const { data, error } = await supabase
    .from(CARELINK_MOBILE_TABLES.programActivityLogs)
    .upsert(row, { onConflict: 'mission_id,caregiver_id,activity_id' })
    .select('*')
    .single()

  if (error) throw error
  return normalizeProgramActivityLog(data)
}


export async function loadMissionBriefAcknowledgement(missionId: number, caregiverId?: number | null) {
  const rows = await queryRows(CARELINK_MOBILE_TABLES.briefAcknowledgements, (query) => {
    let next = query.select('*').eq('mission_id', missionId).order('acknowledged_at', { ascending: false }).order('updated_at', { ascending: false }).limit(10)
    if (caregiverId != null) next = next.eq('caregiver_id', caregiverId)
    return next
  })
  return rows.map(normalizeBriefAcknowledgement)
}

export async function saveMissionBriefAcknowledgement(input: {
  missionId: number
  caregiverId: number
  briefVersion?: string | null
  sections?: Record<string, unknown>
  briefSnapshot?: Record<string, unknown>
  parentInstructionsAcknowledged?: boolean
  serviceScopeAcknowledged?: boolean
  locationAcknowledged?: boolean
  emergencyAcknowledged?: boolean
  confidentialityAcknowledged?: boolean
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const payload = {
    mission_id: input.missionId,
    caregiver_id: input.caregiverId,
    status: 'acknowledged',
    brief_version: input.briefVersion || 'carelink-mobile-brief-v1',
    sections: input.sections || {},
    brief_snapshot: input.briefSnapshot || {},
    parent_instructions_acknowledged: input.parentInstructionsAcknowledged !== false,
    service_scope_acknowledged: input.serviceScopeAcknowledged !== false,
    location_acknowledged: input.locationAcknowledged !== false,
    emergency_acknowledged: input.emergencyAcknowledged !== false,
    confidentiality_acknowledged: input.confidentialityAcknowledged !== false,
    acknowledged_at: now,
    metadata: input.metadata || {},
    updated_at: now,
  }

  const { data, error } = await supabase
    .from(CARELINK_MOBILE_TABLES.briefAcknowledgements)
    .upsert(payload, { onConflict: 'mission_id,caregiver_id' })
    .select('*')
    .single()

  if (error) throw error
  await recordMissionEvent({
    missionId: input.missionId,
    eventType: 'mobile_mission_brief_acknowledged',
    content: 'Brief mission et consignes parent reconnus depuis CareLink mobile',
    metadata: { caregiver_id: input.caregiverId, brief_version: payload.brief_version, sections: payload.sections, ...(input.metadata || {}) },
    source: 'carelink_mobile',
  })
  return normalizeBriefAcknowledgement(data)
}

export async function missionBriefAcknowledgementIsComplete(missionId: number, caregiverId: number) {
  const rows = await loadMissionBriefAcknowledgement(missionId, caregiverId)
  const latest = rows[0]
  return Boolean(
    latest &&
    latest.status === 'acknowledged' &&
    latest.parentInstructionsAcknowledged &&
    latest.serviceScopeAcknowledged &&
    latest.locationAcknowledged &&
    latest.emergencyAcknowledged &&
    latest.confidentialityAcknowledged &&
    latest.acknowledgedAt,
  )
}
