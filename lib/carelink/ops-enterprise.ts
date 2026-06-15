import { createClient } from '@/lib/supabase/server'
import { listMissionControlRecords, getMissionDossier, patchMission } from '@/lib/missions/repository'
import { recordMissionEvent } from '@/lib/missions/events'
import { getServiceCharacteristic, listServiceCharacteristics } from '@/lib/missions/service-characteristics'
import {
  acknowledgeAlert,
  acknowledgeNotification,
  createAlert,
  createDispatchMessage,
  createNotification,
  createPaymentDispute,
  loadAgentDocuments,
  loadAlerts,
  loadDispatchMessages,
  loadMissionChecklist,
  loadMissionReport,
  loadNotifications,
  loadPaymentDisputes,
  requestDocumentReview,
  saveAgentDocument,
  saveMissionReport,
  completeMissionChecklist,
} from './mobile-persistence'

import { resolvedMissionCode } from '@/lib/missions/mission-codes'

function __carelinkMissionVisible(row: any) {
  if (!row) return false
  const status = String(row.status || row.lifecycle_stage || row.lifecycleStage || row.dossier_status || row.dossierStatus || '').toLowerCase()
  if (row.is_archived === true || row.isArchived === true) return false
  if (status.includes('deleted') || status.includes('cancelled') || status.includes('archived')) return false
  return true
}

function __carelinkFilterVisibleMissions<T = any>(rows: T[] | null | undefined): T[] {
  return Array.isArray(rows) ? rows.filter((row: any) => __carelinkMissionVisible(row)) : []
}


function __carelinkMissionIsVisible(row: any) {
  if (!row) return false
  const status = String(row.status || row.lifecycle_stage || row.lifecycleStage || row.dossier_status || row.dossierStatus || '').toLowerCase()
  if (row.is_archived === true || row.isArchived === true) return false
  if (status.includes('deleted') || status.includes('archived') || status.includes('cancelled')) return false
  return true
}


function __carelinkLiveMissionVisible(row: any) {
  const status = String(row?.status || row?.lifecycle_stage || row?.lifecycleStage || row?.dossier_status || '').toLowerCase()
  if (row?.is_archived === true || row?.isArchived === true) return false
  if (status.includes('deleted') || status.includes('cancelled') || status.includes('archived')) return false
  return true
}

type AnyRecord = Record<string, any>

export type OpsEnterpriseSnapshot = {
  ok: boolean
  source: 'live-db' | 'live-empty' | 'error'
  generatedAt: string
  summary: {
    missions: number
    activeMissions: number
    todayMissions: number
    atRiskMissions: number
    unassignedMissions: number
    agents: number
    readyAgents: number
    incidents: number
    reportsPending: number
    checklistPending: number
    notificationsUnread: number
    alertsOpen: number
    messagesUnread: number
    paymentDisputes: number
    complianceBlockers: number
  }
  missions: OpsMissionCard[]
  missionLanes: OpsLane[]
  agents: OpsAgentCard[]
  incidents: OpsIncidentCard[]
  reports: OpsReportCard[]
  messages: OpsMessageThread[]
  notifications: OpsNotificationCard[]
  alerts: OpsAlertCard[]
  history: OpsAuditCard[]
  payments: OpsPaymentSnapshot
  documents: OpsDocumentCard[]
  readiness: OpsReadinessSnapshot
  schedule: OpsScheduleSnapshot
  calendar: OpsCalendarSnapshot
  workforce: OpsWorkforceSnapshot
  quality: OpsQualitySnapshot
  replacements: OpsReplacementSnapshot
  serviceConfig: OpsServiceConfigSnapshot
  settings: OpsSettingsSnapshot
  support: OpsSupportSnapshot
  live: {
    lastCheckinAt: string | null
    lastEventAt: string | null
    lastDispatchMessageAt: string | null
    lastNotificationAt: string | null
    lastAlertAt: string | null
  }
}

export function buildEmptyOpsSnapshot(): OpsEnterpriseSnapshot {
  return {
    ok: true,
    source: 'live-empty',
    generatedAt: nowIso(),
    summary: {
      missions: 0,
      activeMissions: 0,
      todayMissions: 0,
      atRiskMissions: 0,
      unassignedMissions: 0,
      agents: 0,
      readyAgents: 0,
      incidents: 0,
      reportsPending: 0,
      checklistPending: 0,
      notificationsUnread: 0,
      alertsOpen: 0,
      messagesUnread: 0,
      paymentDisputes: 0,
      complianceBlockers: 0,
    },
    missions: [],
    missionLanes: [],
    agents: [],
    incidents: [],
    reports: [],
    messages: [],
    notifications: [],
    alerts: [],
    history: [],
    payments: {
      currency: 'MAD',
      totalEarned: 0,
      pendingValidation: 0,
      paid: 0,
      bonuses: 0,
      transport: 0,
      meal: 0,
      allowances: 0,
      upcomingPayment: 0,
      lines: [],
      disputes: [],
      missionLinked: 0,
    },
    documents: [],
    readiness: {
      score: 0,
      blockers: [],
      warnings: [],
      pendingReviews: 0,
      expiredDocuments: 0,
      serviceEligibility: [],
      byAgent: [],
    },
    schedule: { byDate: [], conflicts: [], today: [], week: [] },
    calendar: { byDate: [], density: 0 },
    workforce: { byCity: [], byZone: [], offline: 0, online: 0, readyNow: 0 },
    quality: { score: 0, incidentRate: 0, reportQuality: 0, checklistCompletion: 0, noShowRate: 0, cancellationRate: 0, byCity: [], byService: [] },
    replacements: { requests: [], candidates: [] },
    serviceConfig: { items: [], defaults: listServiceCharacteristics().map((service) => ({ serviceType: service.serviceType, serviceFamily: service.serviceFamily, requiredSkills: service.requiredSkills, requiredDocuments: service.requiredDocuments, defaultChecklist: service.defaultChecklist, internalProcedure: service.internalProcedure })) },
    settings: { items: [], lifecycleRules: [], alertRules: [], contacts: [] },
    support: buildSupport(),
    live: { lastCheckinAt: null, lastEventAt: null, lastDispatchMessageAt: null, lastNotificationAt: null, lastAlertAt: null },
  }
}

export type OpsMissionCard = {
  id: number
  code: string
  status: string
  lifecycleStage: string
  missionKind: string
  serviceType: string
  serviceFamily: string
  city: string
  zone: string
  dateLabel: string
  timeLabel: string
  familyName: string
  caregiverName: string
  caregiverId: number | null
  riskLevel: string
  readinessStatus: string
  validationStatus: string
  reportStatus: string
  priority: string
  urgency: string
  subMissionCount: number
  completedSubMissionCount: number
  upcomingSubMissionCount: number
  checklistTotal: number
  checklistCompleted: number
  note: string
  recurringLabel: string
}

export type OpsLane = {
  key: string
  label: string
  tone: 'blue' | 'cyan' | 'green' | 'amber' | 'violet' | 'red' | 'slate'
  count: number
  missions: OpsMissionCard[]
}

export type OpsAgentCard = {
  id: number
  fullName: string
  status: string
  city: string
  zone: string
  skills: string[]
  serviceEligibility: string[]
  readinessScore: number
  reliabilityScore: number
  performanceScore: number
  workload: number
  activeMission: string
  nextMission: string
  lastMobileCheckIn: string
  documentsStatus: string
  complianceBlockers: string[]
  availability: string
  online: boolean
}

export type OpsIncidentCard = {
  id: string
  missionId: number | null
  missionCode: string | null
  title: string
  severity: string
  status: string
  city: string
  zone: string
  ownerName: string
  summary: string
  createdAt: string
  linkedCaregiverId: number | null
}

export type OpsReportCard = {
  id: string
  missionId: number
  missionCode: string
  serviceType: string
  status: string
  validationStatus: string
  qualityScore: number
  submittedAt: string
  incidentFlag: boolean
  observations: string
  recommendations: string
  checklistCompletion: string
}

export type OpsMessageThread = {
  id: string
  missionId: number | null
  title: string
  body: string
  priority: string
  unreadCount: number
  lastMessageAt: string
  messages: AnyRecord[]
}

export type OpsNotificationCard = {
  id: string
  missionId: number | null
  caregiverId: number | null
  type: string
  title: string
  body: string
  priority: string
  status: string
  createdAt: string
  acknowledgedAt: string | null
}

export type OpsAlertCard = OpsNotificationCard & {
  linkedEntityType: string | null
  linkedEntityId: string | null
}

export type OpsAuditCard = {
  id: string
  entityType: string
  entityId: string | null
  action: string
  actorName: string | null
  severity: string
  createdAt: string
  payload: AnyRecord
}

export type OpsPaymentLine = {
  id: string
  missionId: number | null
  caregiverId: number | null
  label: string
  amountMad: number
  kind: string
  status: string
  createdAt: string
}

export type OpsPaymentSnapshot = {
  currency: 'MAD'
  totalEarned: number
  pendingValidation: number
  paid: number
  bonuses: number
  transport: number
  meal: number
  allowances: number
  upcomingPayment: number
  lines: OpsPaymentLine[]
  disputes: AnyRecord[]
  missionLinked: number
}

export type OpsDocumentCard = {
  id: string
  caregiverId: number
  caregiverName: string
  documentType: string
  status: string
  reviewStatus: string
  expiresAt: string | null
  fileUrl: string | null
  createdAt: string
  blocker: boolean
}

export type OpsReadinessSnapshot = {
  score: number
  blockers: string[]
  warnings: string[]
  pendingReviews: number
  expiredDocuments: number
  serviceEligibility: Array<{ serviceType: string; ready: number; blocked: number }>
  byAgent: Array<{ caregiverId: number; fullName: string; score: number; status: string; blockers: string[] }>
}

export type OpsScheduleSnapshot = {
  byDate: Array<{ date: string; missions: OpsMissionCard[]; workload: number; conflicts: number }>
  conflicts: Array<{ date: string; title: string; severity: string; missionIds: number[] }>
  today: OpsMissionCard[]
  week: OpsMissionCard[]
}

export type OpsCalendarSnapshot = {
  byDate: Array<{ date: string; count: number; density: number; missions: OpsMissionCard[] }>
  density: number
}

export type OpsWorkforceSnapshot = {
  byCity: Array<{ city: string; agents: number; missions: number; readiness: number }>
  byZone: Array<{ city: string; zone: string; agents: number; missions: number; readiness: number }>
  offline: number
  online: number
  readyNow: number
}

export type OpsQualitySnapshot = {
  score: number
  incidentRate: number
  reportQuality: number
  checklistCompletion: number
  noShowRate: number
  cancellationRate: number
  byCity: Array<{ city: string; missions: number; quality: number; incidents: number }>
  byService: Array<{ serviceType: string; missions: number; quality: number; incidents: number }>
}

export type OpsReplacementSnapshot = {
  requests: AnyRecord[]
  candidates: Array<{ caregiverId: number; fullName: string; city: string; zone: string; score: number; online: boolean; skills: string[] }>
}

export type OpsServiceConfigSnapshot = {
  items: AnyRecord[]
  defaults: Array<{ serviceType: string; serviceFamily: string; requiredSkills: string[]; requiredDocuments: string[]; defaultChecklist: string[]; internalProcedure: string }>
}

export type OpsSettingsSnapshot = {
  items: AnyRecord[]
  lifecycleRules: AnyRecord[]
  alertRules: AnyRecord[]
  contacts: AnyRecord[]
}

export type OpsSupportSnapshot = {
  items: Array<{ id: string; title: string; body: string; href?: string }>
  history: AnyRecord[]
}

function nowIso() {
  return new Date().toISOString()
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function asNumber(value: unknown, fallback = 0) {
  const next = Number(value)
  return Number.isFinite(next) ? next : fallback
}

function asArray<T = AnyRecord>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as AnyRecord) : {}
}

async function safeMany<T = AnyRecord>(promise: any): Promise<T[]> {
  try {
    const { data, error } = await promise
    if (error || !Array.isArray(data)) return []
    return data
  } catch {
    return []
  }
}

async function safeSingle<T = AnyRecord>(promise: any): Promise<T | null> {
  try {
    const { data, error } = await promise
    if (error || !data) return null
    return data
  } catch {
    return null
  }
}

function missionTone(status: string, risk: string) {
  const s = String(status).toLowerCase()
  const r = String(risk).toLowerCase()
  if (['incident', 'cancelled', 'no_show'].includes(s) || ['critical', 'high'].includes(r)) return 'red' as const
  if (['report_pending', 'validation', 'pending', 'draft'].includes(s) || ['watch', 'warning', 'elevated'].includes(r)) return 'amber' as const
  if (['completed', 'closed', 'validated'].includes(s)) return 'green' as const
  if (['in_progress', 'confirmed', 'assigned'].includes(s)) return 'blue' as const
  return 'slate' as const
}

function missionLabel(record: AnyRecord) {
  const serviceType = asString(record.serviceType || record.service_type || 'Mission')
  return record.missionKind === 'dossier' ? `Dossier · ${serviceType}` : serviceType
}

function missionStatus(record: AnyRecord) {
  return asString(record.lifecycleStage || record.lifecycle_stage || record.status || 'draft')
}

function missionRisk(record: AnyRecord) {
  return asString(record.riskLevel || record.risk_level || 'normal')
}

function missionChecklistProgress(checklistItems: AnyRecord[]) {
  const total = checklistItems.length
  const completed = checklistItems.filter((item) => Boolean(item.completed)).length
  return { total, completed }
}

function buildMissionCard(record: AnyRecord, checklistItems: AnyRecord[], dossier?: AnyRecord | null): OpsMissionCard {
  const serviceType = asString(record.serviceType || record.service_type || getServiceCharacteristic(record.serviceType || record.service_type || 'Service AngelCare').serviceType)
  const service = getServiceCharacteristic(serviceType)
  const progress = missionChecklistProgress(checklistItems)
  return {
    id: Number(record.id),
    code: resolvedMissionCode(record),
    status: asString(record.status || 'draft'),
    lifecycleStage: missionStatus(record),
    missionKind: asString(record.missionKind || record.mission_kind || 'single'),
    serviceType,
    serviceFamily: asString(record.serviceFamily || record.service_family || service.serviceFamily),
    city: asString(record.city || 'Ville non définie'),
    zone: asString(record.zone || 'Zone non définie'),
    dateLabel: asString(record.dateLabel || record.mission_date || 'Non planifiée'),
    timeLabel: asString(record.timeLabel || [record.start_time, record.end_time].filter(Boolean).filter(__carelinkLiveMissionVisible).join(' → ') || 'Horaire à définir'),
    familyName: asString(record.familyName || record.client_name || record.clientLabel || dossier?.mission?.familyName || 'Famille non liée'),
    caregiverName: asString(record.caregiverName || record.assigned_agent_name || record.caregiver?.full_name || (record.caregiverId ? `Caregiver #${record.caregiverId}` : 'Non assignée')),
    caregiverId: record.caregiverId == null ? (record.caregiver_id == null ? null : Number(record.caregiver_id)) : Number(record.caregiverId),
    riskLevel: missionRisk(record),
    readinessStatus: asString(record.readinessStatus || record.readiness_status || 'pending'),
    validationStatus: asString(record.validationStatus || record.validation_status || 'pending'),
    reportStatus: asString(record.reportStatus || record.report_status || 'not_required'),
    priority: asString(record.priority || record.ops_priority || 'normal'),
    urgency: asString(record.urgency || 'standard'),
    subMissionCount: asNumber(record.subMissionCount || record.sub_mission_count || dossier?.subMissions?.length || 0),
    completedSubMissionCount: asNumber(record.completedSubMissionCount || record.completed_sub_mission_count || 0),
    upcomingSubMissionCount: asNumber(record.upcomingSubMissionCount || record.upcoming_sub_mission_count || 0),
    checklistTotal: progress.total,
    checklistCompleted: progress.completed,
    note: asString(record.notes || record.note || ''),
    recurringLabel: asString(record.missionKind || record.mission_kind || 'single').replace(/_/g, ' '),
  }
}

function buildLane(key: string, label: string, tone: OpsLane['tone'], missions: OpsMissionCard[]): OpsLane {
  return { key, label, tone, count: missions.length, missions }
}

function groupByDate(missions: OpsMissionCard[]) {
  const grouped = new Map<string, OpsMissionCard[]>()
  missions.forEach((mission) => {
    const key = mission.dateLabel || 'Non planifiée'
    grouped.set(key, [...(grouped.get(key) || []), mission])
  })
  return Array.from(grouped.entries()).map(([date, items]) => ({ date, missions: items }))
}

function queryRangeLabel(date: string) {
  const day = new Date(date)
  if (Number.isNaN(day.getTime())) return date
  return day.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })
}

function buildMessageThreads(messages: AnyRecord[]) {
  const grouped = new Map<string, AnyRecord[]>()
  messages.forEach((message) => {
    const key = String(message.thread_key || message.threadKey || (message.mission_id || message.missionId ? `mission:${message.mission_id || message.missionId}` : `global:${message.recipient_type || message.recipientType || 'dispatch'}`))
    grouped.set(key, [...(grouped.get(key) || []), message])
  })

  return Array.from(grouped.entries()).map(([id, items]) => {
    const sorted = [...items].sort((a, b) => String(b.created_at || b.createdAt || '').localeCompare(String(a.created_at || a.createdAt || '')))
    const last = sorted[0] || {}
    return {
      id,
      missionId: last.mission_id == null ? (last.missionId == null ? null : Number(last.missionId)) : Number(last.mission_id),
      title: asString(last.subject || (last.mission_id || last.missionId ? `Mission ${last.mission_id || last.missionId}` : 'Liaison dispatch')),
      body: asString(last.body || ''),
      priority: asString(last.priority || 'normal'),
      unreadCount: sorted.filter((item) => !item.read_at && !item.readAt && asString(item.status || 'sent').toLowerCase() !== 'read').length,
      lastMessageAt: asString(last.created_at || last.createdAt || nowIso()),
      messages: sorted,
    } as OpsMessageThread
  }).sort((a, b) => String(b.lastMessageAt).localeCompare(a.lastMessageAt))
}

function buildNotifications(rows: AnyRecord[]) {
  return rows.map((row) => ({
    id: String(row.id),
    missionId: row.mission_id == null ? null : Number(row.mission_id),
    caregiverId: row.caregiver_id == null ? null : Number(row.caregiver_id),
    type: asString(row.type, 'mission_update'),
    title: asString(row.title, 'Notification'),
    body: asString(row.body, ''),
    priority: asString(row.priority, 'normal'),
    status: asString(row.status, 'unread'),
    createdAt: asString(row.created_at, nowIso()),
    acknowledgedAt: row.acknowledged_at == null ? null : String(row.acknowledged_at),
  } as OpsNotificationCard))
}

function buildAlerts(rows: AnyRecord[]) {
  return rows.map((row) => ({
    id: String(row.id),
    missionId: row.mission_id == null ? null : Number(row.mission_id),
    caregiverId: row.caregiver_id == null ? null : Number(row.caregiver_id),
    type: asString(row.type, 'general'),
    title: asString(row.title, 'Alert'),
    body: asString(row.body, ''),
    priority: asString(row.priority, 'normal'),
    status: asString(row.status, 'open'),
    createdAt: asString(row.created_at, nowIso()),
    acknowledgedAt: row.acknowledged_at == null ? null : String(row.acknowledged_at),
    linkedEntityType: row.linked_entity_type == null ? null : String(row.linked_entity_type),
    linkedEntityId: row.linked_entity_id == null ? null : String(row.linked_entity_id),
  } as OpsAlertCard))
}

function buildAudit(rows: AnyRecord[]) {
  return rows.map((row) => ({
    id: String(row.id),
    entityType: asString(row.entity_type, 'carelink'),
    entityId: row.entity_id == null ? null : String(row.entity_id),
    action: asString(row.action, 'event'),
    actorName: row.actor_name == null ? null : String(row.actor_name),
    severity: asString(row.severity, 'info'),
    createdAt: asString(row.created_at, nowIso()),
    payload: asRecord(row.payload),
  } as OpsAuditCard))
}

function buildDocuments(rows: AnyRecord[], caregivers: AnyRecord[]) {
  const caregiverMap = new Map(caregivers.map((caregiver) => [String(caregiver.id), caregiver]))
  return rows.map((row) => {
    const caregiver = caregiverMap.get(String(row.caregiver_id))
    const expiresAt = row.expires_at == null ? null : String(row.expires_at)
    return {
      id: String(row.id),
      caregiverId: Number(row.caregiver_id),
      caregiverName: asString(caregiver?.full_name || caregiver?.name || caregiver?.display_name || `Caregiver #${row.caregiver_id}`),
      documentType: asString(row.document_type, 'document'),
      status: asString(row.status, 'pending'),
      reviewStatus: asString(row.review_status, 'pending'),
      expiresAt,
      fileUrl: row.file_url == null ? null : String(row.file_url),
      createdAt: asString(row.created_at, nowIso()),
      blocker: Boolean(expiresAt && new Date(expiresAt).getTime() < Date.now()),
    } as OpsDocumentCard
  })
}

function buildPayments(lines: AnyRecord[], disputes: AnyRecord[]) {
  const parseAmount = (row: AnyRecord) => {
    const direct = asNumber(row.amount_mad ?? row.amountMad ?? row.amount ?? row.value ?? row.total_amount ?? row.total ?? row.total_mad ?? 0)
    if (direct) return direct
    const grade = asNumber(row.grade_fee, 0)
    if (grade) return grade
    const manualNotes = typeof row.manual_notes === 'string' ? row.manual_notes : ''
    if (!manualNotes) return 0
    try {
      const parsed = JSON.parse(manualNotes)
      return asNumber(parsed.totalMad ?? parsed.total_mad ?? parsed.amountMad ?? parsed.amount_mad ?? 0)
    } catch {
      return 0
    }
  }
  const mappedLines: OpsPaymentLine[] = lines.map((row) => ({
    id: String(row.id),
    missionId: row.mission_id == null ? null : Number(row.mission_id),
    caregiverId: row.caregiver_id == null ? null : Number(row.caregiver_id),
    label: asString(row.label || row.name || row.title || row.type || 'Indemnité'),
    amountMad: parseAmount(row),
    kind: asString(row.kind || row.allowance_type || row.category || 'allowance'),
    status: asString(row.status || row.payment_status || row.validation_status || 'pending'),
    createdAt: asString(row.created_at || row.updated_at || nowIso(), nowIso()),
  }))
  const totalEarned = mappedLines.filter((line) => ['paid', 'validated', 'completed'].includes(line.status.toLowerCase())).reduce((sum, line) => sum + line.amountMad, 0)
  const pendingValidation = mappedLines.filter((line) => ['pending', 'validation', 'submitted', 'in_review', 'needs_review'].includes(line.status.toLowerCase())).reduce((sum, line) => sum + line.amountMad, 0)
  const paid = mappedLines.filter((line) => ['paid', 'validated'].includes(line.status.toLowerCase())).reduce((sum, line) => sum + line.amountMad, 0)
  const bonuses = mappedLines.filter((line) => /bonus|prime|reward/i.test(line.kind)).reduce((sum, line) => sum + line.amountMad, 0)
  const transport = mappedLines.filter((line) => /transport|travel|route/i.test(line.kind)).reduce((sum, line) => sum + line.amountMad, 0)
  const meal = mappedLines.filter((line) => /meal|repas|food/i.test(line.kind)).reduce((sum, line) => sum + line.amountMad, 0)
  return {
    currency: 'MAD' as const,
    totalEarned,
    pendingValidation,
    paid,
    bonuses,
    transport,
    meal,
    allowances: mappedLines.reduce((sum, line) => sum + line.amountMad, 0),
    upcomingPayment: pendingValidation,
    lines: mappedLines,
    missionLinked: mappedLines.filter((line) => line.missionId != null).length,
    disputes,
  }
}

function buildAgents(caregivers: AnyRecord[], missions: OpsMissionCard[], checkins: AnyRecord[], documents: OpsDocumentCard[]): OpsAgentCard[] {
  const checkinsByCaregiver = new Map<string, AnyRecord[]>()
  checkins.forEach((checkin) => {
    const key = String(checkin.caregiver_id || checkin.agent_id || checkin.caregiverId || '')
    if (!key) return
    checkinsByCaregiver.set(key, [...(checkinsByCaregiver.get(key) || []), checkin])
  })
  const documentsByCaregiver = new Map<string, OpsDocumentCard[]>()
  documents.forEach((document) => {
    const key = String(document.caregiverId)
    documentsByCaregiver.set(key, [...(documentsByCaregiver.get(key) || []), document])
  })

  return caregivers.map((caregiver) => {
    const id = Number(caregiver.id)
    const assigned = missions.filter((mission) => mission.caregiverId === id && !['completed', 'cancelled', 'closed'].includes(mission.status.toLowerCase()))
    const completed = missions.filter((mission) => mission.caregiverId === id && ['completed', 'closed'].includes(mission.status.toLowerCase())).length
    const noShows = missions.filter((mission) => mission.caregiverId === id && mission.status.toLowerCase() === 'no_show').length
    const cancellations = missions.filter((mission) => mission.caregiverId === id && mission.status.toLowerCase() === 'cancelled').length
    const latestCheckin = [...(checkinsByCaregiver.get(String(id)) || [])].sort((a, b) => String(b.created_at || b.createdAt || '').localeCompare(String(a.created_at || a.createdAt || '')))[0]
    const docs = documentsByCaregiver.get(String(id)) || []
    const expiredDocs = docs.filter((doc) => doc.blocker).length
    const reviewRequested = docs.filter((doc) => ['review_requested', 'pending'].includes(doc.reviewStatus.toLowerCase())).length
    const blockers = [
      ...(expiredDocs ? [`${expiredDocs} document(s) expiré(s)`] : []),
      ...(reviewRequested ? [`${reviewRequested} document(s) à revoir`] : []),
      ...(noShows ? [`${noShows} no-show`] : []),
    ]
    const readinessScore = asNumber(caregiver.readiness_score ?? caregiver.readinessScore ?? 70)
    const reliabilityScore = asNumber(caregiver.reliability_score ?? caregiver.reliabilityScore ?? Math.max(0, 100 - (cancellations * 10) - (noShows * 15)))
    const performanceScore = asNumber(caregiver.performance_score ?? caregiver.performanceScore ?? Math.max(0, Math.min(100, completed * 8 + assigned.length * 3)))
    const skills = asArray<string>(caregiver.skills)
    const serviceEligibility = asArray<string>(caregiver.service_eligibility || caregiver.serviceEligibility || caregiver.services || skills)
    const availability = asString(caregiver.availability_status || caregiver.availability || caregiver.status || 'unknown')
    return {
      id,
      fullName: asString(caregiver.full_name || caregiver.name || caregiver.display_name || `Caregiver #${id}`),
      status: asString(caregiver.status || 'unknown'),
      city: asString(caregiver.city || 'Ville non définie'),
      zone: asString(caregiver.zone || 'Zone non définie'),
      skills,
      serviceEligibility,
      readinessScore,
      reliabilityScore,
      performanceScore,
      workload: assigned.length,
      activeMission: assigned[0]?.code || 'Aucune mission active',
      nextMission: missions.find((mission) => mission.caregiverId === id && !['completed', 'cancelled', 'closed'].includes(mission.status.toLowerCase()) && mission.status.toLowerCase() !== 'assigned')?.code || 'Aucune mission planifiée',
      lastMobileCheckIn: asString(latestCheckin?.created_at || latestCheckin?.createdAt || caregiver.last_checkin_at || caregiver.updated_at || ''),
      documentsStatus: docs.some((doc) => doc.blocker) ? 'expired' : reviewRequested ? 'review' : 'ready',
      complianceBlockers: blockers,
      availability,
      online: Boolean(latestCheckin && new Date(String(latestCheckin.created_at || latestCheckin.createdAt || nowIso())).getTime() > Date.now() - 1000 * 60 * 60 * 24),
    }
  })
}

function buildIncidents(rows: AnyRecord[], missions: Map<string, OpsMissionCard>) {
  return rows.map((row) => {
    const missionId = row.mission_id == null ? null : Number(row.mission_id)
    const mission = missionId == null ? null : missions.get(String(missionId))
    return {
      id: String(row.id),
      missionId,
      missionCode: row.mission_code == null ? mission?.code || null : String(row.mission_code),
      title: asString(row.incident_type || row.title || 'Incident'),
      severity: asString(row.severity, 'medium'),
      status: asString(row.status, 'open'),
      city: asString(row.city || mission?.city || 'Ville non définie'),
      zone: asString(row.zone || mission?.zone || 'Zone non définie'),
      ownerName: asString(row.owner_name || row.owner || ''),
      summary: asString(row.summary || row.description || ''),
      createdAt: asString(row.created_at, nowIso()),
      linkedCaregiverId: row.caregiver_id == null ? mission?.caregiverId ?? null : Number(row.caregiver_id),
    } as OpsIncidentCard
  })
}

function buildReports(rows: AnyRecord[], missions: Map<string, OpsMissionCard>) {
  return rows.map((row) => {
    const mission = missions.get(String(row.mission_id))
    const checklist = asArray(row.checklist_snapshot || row.checklistSnapshot)
    const completed = checklist.filter((item) => Boolean(item.completed)).length
    const total = checklist.length
    return {
      id: String(row.id),
      missionId: Number(row.mission_id),
      missionCode: mission?.code || asString(row.mission_code, `Mission #${row.mission_id}`),
      serviceType: asString(row.service_type || mission?.serviceType || 'Service AngelCare'),
      status: asString(row.status, 'draft'),
      validationStatus: asString(row.validation_status, 'pending'),
      qualityScore: asNumber(row.quality_score ?? row.metadata?.quality_score ?? 0),
      submittedAt: asString(row.submitted_at, ''),
      incidentFlag: Boolean(row.incident_flag),
      observations: asString(row.observations, ''),
      recommendations: asString(row.recommendations, ''),
      checklistCompletion: `${completed}/${total}`,
    } as OpsReportCard
  })
}

function buildReadinessSnapshot(agents: OpsAgentCard[], missions: OpsMissionCard[], documents: OpsDocumentCard[]): OpsReadinessSnapshot {
  const expiredDocuments = documents.filter((doc) => doc.blocker)
  const pendingReviews = documents.filter((doc) => ['review_requested', 'pending'].includes(doc.reviewStatus.toLowerCase())).length
  const blockers = [
    ...expiredDocuments.slice(0, 8).map((doc) => `Document expiré: ${doc.caregiverName} · ${doc.documentType}`),
    ...missions.filter((mission) => ['incident', 'cancelled', 'no_show'].includes(mission.status.toLowerCase())).slice(0, 8).map((mission) => `Mission bloquante: ${mission.code}`),
  ]
  const warnings = missions.filter((mission) => ['assigned', 'confirmed', 'report_pending', 'validation'].includes(mission.status.toLowerCase())).slice(0, 8).map((mission) => `Mission à surveiller: ${mission.code}`)
  const score = agents.length ? Math.max(0, Math.round(agents.reduce((sum, agent) => sum + agent.readinessScore, 0) / agents.length)) : 0
  const serviceEligibility = listServiceCharacteristics().map((service) => ({
    serviceType: service.serviceType,
    ready: agents.filter((agent) => service.requiredSkills.every((skill) => agent.skills.some((item) => item.toLowerCase().includes(skill.toLowerCase())))).length,
    blocked: agents.filter((agent) => expiredDocuments.some((doc) => doc.caregiverId === agent.id)).length,
  }))
  return {
    score,
    blockers,
    warnings,
    pendingReviews,
    expiredDocuments: expiredDocuments.length,
    serviceEligibility,
    byAgent: agents.map((agent) => ({
      caregiverId: agent.id,
      fullName: agent.fullName,
      score: agent.readinessScore,
      status: agent.documentsStatus === 'expired' ? 'blocked' : agent.documentsStatus === 'review' ? 'warning' : 'ready',
      blockers: agent.complianceBlockers,
    })),
  }
}

function buildSchedule(missions: OpsMissionCard[]) {
  const byDate = groupByDate(missions).map(({ date, missions: items }) => {
    const conflicts = items.filter((mission) => ['assigned', 'confirmed', 'in_progress'].includes(mission.status.toLowerCase())).length
    return {
      date,
      missions: items,
      workload: items.length,
      conflicts,
    }
  })
  const conflicts = byDate.filter((day) => day.conflicts > 1).map((day) => ({
    date: day.date,
    title: `${day.conflicts} missions nécessitent arbitrage`,
    severity: day.conflicts > 2 ? 'high' : 'medium',
    missionIds: day.missions.map((mission) => mission.id),
  }))
  return {
    byDate,
    conflicts,
    today: missions.filter((mission) => mission.dateLabel === new Date().toISOString().slice(0, 10)),
    week: missions.filter((mission) => mission.status.toLowerCase() !== 'cancelled').slice(0, 14),
  } satisfies OpsScheduleSnapshot
}

function buildCalendar(missions: OpsMissionCard[]) {
  const grouped = groupByDate(missions)
  const byDate = grouped.map(({ date, missions: items }) => {
    const count = items.length
    return {
      date,
      count,
      density: count ? Math.min(100, Math.round((count / Math.max(1, missions.length)) * 1000)) : 0,
      missions: items,
    }
  })
  const density = missions.length ? Math.round((missions.filter((mission) => ['assigned', 'confirmed', 'in_progress', 'completed'].includes(mission.status.toLowerCase())).length / missions.length) * 100) : 0
  return { byDate, density } satisfies OpsCalendarSnapshot
}

function buildWorkforce(agents: OpsAgentCard[], missions: OpsMissionCard[]) {
  const byCityMap = new Map<string, { city: string; agents: number; missions: number; readiness: number; readinessTotal: number }>()
  const byZoneMap = new Map<string, { city: string; zone: string; agents: number; missions: number; readiness: number; readinessTotal: number }>()
  agents.forEach((agent) => {
    const cityKey = agent.city || 'Ville non définie'
    const zoneKey = `${agent.city || 'Ville non définie'}__${agent.zone || 'Zone non définie'}`
    const cityRow = byCityMap.get(cityKey) || { city: cityKey, agents: 0, missions: 0, readiness: 0, readinessTotal: 0 }
    cityRow.agents += 1
    cityRow.missions += missions.filter((mission) => mission.caregiverId === agent.id).length
    cityRow.readiness += agent.readinessScore
    cityRow.readinessTotal += 1
    byCityMap.set(cityKey, cityRow)

    const zoneRow = byZoneMap.get(zoneKey) || { city: cityKey, zone: agent.zone || 'Zone non définie', agents: 0, missions: 0, readiness: 0, readinessTotal: 0 }
    zoneRow.agents += 1
    zoneRow.missions += missions.filter((mission) => mission.caregiverId === agent.id).length
    zoneRow.readiness += agent.readinessScore
    zoneRow.readinessTotal += 1
    byZoneMap.set(zoneKey, zoneRow)
  })

  const online = agents.filter((agent) => agent.online).length
  const readyNow = agents.filter((agent) => agent.readinessScore >= 80 && agent.documentsStatus === 'ready').length
  return {
    byCity: Array.from(byCityMap.values()).map((row) => ({ city: row.city, agents: row.agents, missions: row.missions, readiness: row.readinessTotal ? Math.round(row.readiness / row.readinessTotal) : 0 })),
    byZone: Array.from(byZoneMap.values()).map((row) => ({ city: row.city, zone: row.zone, agents: row.agents, missions: row.missions, readiness: row.readinessTotal ? Math.round(row.readiness / row.readinessTotal) : 0 })),
    offline: Math.max(0, agents.length - online),
    online,
    readyNow,
  } satisfies OpsWorkforceSnapshot
}

function buildQuality(missions: OpsMissionCard[], reports: OpsReportCard[], incidents: OpsIncidentCard[]) {
  const completed = missions.filter((mission) => ['completed', 'closed'].includes(mission.status.toLowerCase())).length
  const noShow = missions.filter((mission) => mission.status.toLowerCase() === 'no_show').length
  const cancelled = missions.filter((mission) => mission.status.toLowerCase() === 'cancelled').length
  const checklistCompletion = missions.length ? Math.round((missions.filter((mission) => mission.checklistTotal > 0 ? mission.checklistCompleted >= mission.checklistTotal : false).length / missions.length) * 100) : 0
  const quality = reports.length ? Math.round(reports.reduce((sum, report) => sum + report.qualityScore, 0) / reports.length) : 0
  const incidentRate = missions.length ? Math.round((incidents.length / missions.length) * 100) : 0
  const reportQuality = reports.length ? Math.round(reports.filter((report) => ['validated', 'submitted'].includes(report.status.toLowerCase())).length / reports.length * 100) : 0
  const byCity = Array.from(new Map(missions.map((mission) => [mission.city, mission])).keys()).map((city) => {
    const cityMissions = missions.filter((mission) => mission.city === city)
    return {
      city,
      missions: cityMissions.length,
      quality: cityMissions.length ? Math.round(cityMissions.reduce((sum, mission) => sum + (mission.checklistTotal ? Math.round((mission.checklistCompleted / Math.max(1, mission.checklistTotal)) * 100) : 65), 0) / cityMissions.length) : 0,
      incidents: incidents.filter((incident) => incident.city === city).length,
    }
  })
  const byService = Array.from(new Map(missions.map((mission) => [mission.serviceType, mission])).keys()).map((serviceType) => {
    const serviceMissions = missions.filter((mission) => mission.serviceType === serviceType)
    return {
      serviceType,
      missions: serviceMissions.length,
      quality: serviceMissions.length ? Math.round(serviceMissions.reduce((sum, mission) => sum + (mission.checklistTotal ? Math.round((mission.checklistCompleted / Math.max(1, mission.checklistTotal)) * 100) : 65), 0) / serviceMissions.length) : 0,
      incidents: incidents.filter((incident) => incident.missionCode && serviceMissions.some((mission) => mission.code === incident.missionCode)).length,
    }
  })
  return {
    score: Math.max(0, Math.min(100, Math.round((quality + reportQuality + checklistCompletion) / 3 - incidentRate / 5 - noShow * 3 - cancelled * 1.5))),
    incidentRate,
    reportQuality,
    checklistCompletion,
    noShowRate: missions.length ? Math.round((noShow / missions.length) * 100) : 0,
    cancellationRate: missions.length ? Math.round((cancelled / missions.length) * 100) : 0,
    byCity,
    byService,
  } satisfies OpsQualitySnapshot
}

function buildReplacements(missions: OpsMissionCard[], agents: OpsAgentCard[], incidents: OpsIncidentCard[]) {
  const requests = incidents.filter((incident) => ['open', 'escalated', 'in_review'].includes(incident.status.toLowerCase())).map((incident) => ({
    id: incident.id,
    missionId: incident.missionId,
    missionCode: incident.missionCode,
    title: incident.title,
    severity: incident.severity,
    status: incident.status,
    createdAt: incident.createdAt,
  }))
  const candidates = agents.filter((agent) => agent.online || agent.readinessScore >= 80).map((agent) => ({
    caregiverId: agent.id,
    fullName: agent.fullName,
    city: agent.city,
    zone: agent.zone,
    score: Math.round((agent.readinessScore + agent.reliabilityScore + agent.performanceScore) / 3),
    online: agent.online,
    skills: agent.skills,
  }))
  return { requests, candidates } satisfies OpsReplacementSnapshot
}

function buildServiceConfig(rows: AnyRecord[]) {
  const defaults = listServiceCharacteristics().map((service) => ({
    serviceType: service.serviceType,
    serviceFamily: service.serviceFamily,
    requiredSkills: service.requiredSkills,
    requiredDocuments: service.requiredDocuments,
    defaultChecklist: service.defaultChecklist,
    internalProcedure: service.internalProcedure,
  }))
  return { items: rows, defaults } satisfies OpsServiceConfigSnapshot
}

function buildSettings(rows: AnyRecord[]) {
  return {
    items: rows,
    lifecycleRules: rows.filter((row) => asString(row.category, '').includes('lifecycle') || asString(row.key, '').includes('lifecycle')),
    alertRules: rows.filter((row) => asString(row.category, '').includes('alert') || asString(row.key, '').includes('alert')),
    contacts: rows.filter((row) => asString(row.category, '').includes('contact') || asString(row.key, '').includes('contact')),
  } satisfies OpsSettingsSnapshot
}

function buildSupport() {
  return {
    items: [
      { id: 'dispatch', title: 'Contacter le dispatch', body: 'Missions, remplacements, accélérations de planning.' , href: '/carelink-ops/messages' },
      { id: 'finance', title: 'Support finance', body: 'Compensations, disputes et validation paiements.', href: '/carelink-ops/payments' },
      { id: 'compliance', title: 'Support conformité', body: 'Documents, expiring reviews, readiness blockers.', href: '/carelink-ops/compliance' },
      { id: 'safety', title: 'Escalade sécurité', body: 'SOS, incidents, environnement non sûr, transfert.', href: '/carelink-ops/incidents' },
    ],
    history: [],
  } satisfies OpsSupportSnapshot
}

function buildMissionLanes(missions: OpsMissionCard[]) {
  const today = new Date().toISOString().slice(0, 10)
  return [
    buildLane('today', 'Aujourd’hui', 'blue', missions.filter((mission) => mission.dateLabel === today || mission.dateLabel.includes(today))),
    buildLane('upcoming', 'À venir', 'violet', missions.filter((mission) => !['completed', 'closed', 'cancelled'].includes(mission.status.toLowerCase()) && mission.dateLabel >= today)),
    buildLane('active', 'Actives', 'green', missions.filter((mission) => ['assigned', 'confirmed', 'in_progress'].includes(mission.status.toLowerCase()))),
    buildLane('at_risk', 'À risque', 'red', missions.filter((mission) => ['incident', 'cancelled', 'no_show'].includes(mission.status.toLowerCase()) || ['critical', 'high', 'elevated'].includes(mission.riskLevel.toLowerCase()))),
    buildLane('report_pending', 'Rapports', 'amber', missions.filter((mission) => mission.reportStatus.toLowerCase() === 'pending' || mission.status.toLowerCase() === 'report_pending')),
    buildLane('checklist_pending', 'Checklists', 'cyan', missions.filter((mission) => mission.checklistTotal > 0 && mission.checklistCompleted < mission.checklistTotal)),
    buildLane('validation_pending', 'Validation', 'violet', missions.filter((mission) => mission.validationStatus.toLowerCase() !== 'validated')),
    buildLane('dispatch_pending', 'Dispatch', 'slate', missions.filter((mission) => ['draft', 'ready_for_assignment', 'assigned'].includes(mission.lifecycleStage.toLowerCase()) || !mission.caregiverId)),
  ]
}

function buildSummary(missions: OpsMissionCard[], agents: OpsAgentCard[], incidents: OpsIncidentCard[], reports: OpsReportCard[], messages: OpsMessageThread[], notifications: OpsNotificationCard[], alerts: OpsAlertCard[], disputes: AnyRecord[], documents: OpsDocumentCard[]) {
  return {
    missions: missions.length,
    activeMissions: missions.filter((mission) => !['completed', 'closed', 'cancelled'].includes(mission.status.toLowerCase())).length,
    todayMissions: missions.filter((mission) => mission.dateLabel === new Date().toISOString().slice(0, 10)).length,
    atRiskMissions: missions.filter((mission) => ['incident', 'cancelled', 'no_show'].includes(mission.status.toLowerCase()) || ['critical', 'high', 'elevated'].includes(mission.riskLevel.toLowerCase())).length,
    unassignedMissions: missions.filter((mission) => !mission.caregiverId).length,
    agents: agents.length,
    readyAgents: agents.filter((agent) => agent.readinessScore >= 80 && agent.documentsStatus === 'ready').length,
    incidents: incidents.length,
    reportsPending: reports.filter((report) => ['pending', 'draft', 'submitted'].includes(report.status.toLowerCase())).length,
    checklistPending: missions.filter((mission) => mission.checklistTotal > 0 && mission.checklistCompleted < mission.checklistTotal).length,
    notificationsUnread: notifications.filter((item) => item.status.toLowerCase() === 'unread').length,
    alertsOpen: alerts.filter((item) => !['acknowledged', 'dismissed', 'closed'].includes(item.status.toLowerCase())).length,
    messagesUnread: messages.reduce((sum, thread) => sum + thread.unreadCount, 0),
    paymentDisputes: disputes.length,
    complianceBlockers: documents.filter((document) => document.blocker || ['review_requested', 'pending'].includes(document.reviewStatus.toLowerCase())).length,
  }
}

function buildLiveTimestamps(checkins: AnyRecord[], events: AnyRecord[], messages: OpsMessageThread[], notifications: OpsNotificationCard[], alerts: OpsAlertCard[]) {
  return {
    lastCheckinAt: [...checkins].sort((a, b) => String(b.created_at || b.createdAt || '').localeCompare(String(a.created_at || a.createdAt || '')))[0]?.created_at || null,
    lastEventAt: [...events].sort((a, b) => String(b.created_at || b.createdAt || '').localeCompare(String(a.created_at || a.createdAt || '')))[0]?.created_at || null,
    lastDispatchMessageAt: messages[0]?.lastMessageAt || null,
    lastNotificationAt: notifications[0]?.createdAt || null,
    lastAlertAt: alerts[0]?.createdAt || null,
  }
}

export async function loadCareLinkOpsSnapshot() : Promise<OpsEnterpriseSnapshot> {
  const supabase = await createClient()
  try {
    const [missions, caregivers, families, events, incidentRows, reportsRows, messageRows, notificationRows, alertRows, disputeRows, documentRows, checkins, allowanceRows, settingsRows, serviceConfigRows, auditRows] = await Promise.all([
      listMissionControlRecords().catch(() => []),
      safeMany(supabase.from('caregivers').select('*').order('updated_at', { ascending: false }).limit(500)),
      safeMany(supabase.from('families').select('*').limit(500)),
      safeMany(supabase.from('mission_events').select('*').order('created_at', { ascending: false }).limit(300)),
      safeMany(supabase.from('incidents').select('*').order('created_at', { ascending: false }).limit(200)),
      safeMany(supabase.from('carelink_mission_reports').select('*').order('submitted_at', { ascending: false }).limit(200)),
      safeMany(supabase.from('carelink_dispatch_messages').select('*').order('created_at', { ascending: false }).limit(500)),
      safeMany(supabase.from('carelink_notifications').select('*').order('created_at', { ascending: false }).limit(500)),
      safeMany(supabase.from('carelink_alerts').select('*').order('created_at', { ascending: false }).limit(500)),
      safeMany(supabase.from('carelink_payment_disputes').select('*').order('created_at', { ascending: false }).limit(200)),
      safeMany(supabase.from('carelink_agent_documents').select('*').order('created_at', { ascending: false }).limit(300)),
      safeMany(supabase.from('caregiver_checkins').select('*').order('created_at', { ascending: false }).limit(300)),
      safeMany(supabase.from('mission_allowances').select('*').order('created_at', { ascending: false }).limit(300)),
      safeMany(supabase.from('carelink_ops_settings').select('*').order('updated_at', { ascending: false }).limit(200)),
      safeMany(supabase.from('carelink_ops_service_configs').select('*').order('updated_at', { ascending: false }).limit(200)),
      safeMany(supabase.from('carelink_ops_audit_events').select('*').order('created_at', { ascending: false }).limit(300)),
    ])

    const checklistRows = await Promise.all(missions.slice(0, 30).map(async (mission) => {
      const items = await loadMissionChecklist(mission.id, mission.serviceType, mission.caregiverId).catch(() => [])
      return { missionId: mission.id, items }
    }))
    const checklistMap = new Map(checklistRows.map((row) => [String(row.missionId), row.items]))
    const payments = buildPayments(allowanceRows, disputeRows)
    const missionsWithChecklist = missions.map((mission) => buildMissionCard(mission as AnyRecord, checklistMap.get(String(mission.id)) || [], null))
    const missionCardMap = new Map(missionsWithChecklist.map((mission) => [String(mission.id), mission]))
    const lanes = buildMissionLanes(missionsWithChecklist)
    const familyMap = new Map(families.map((family) => [String(family.id), family]))
    const missionsWithFamilyCaregiver = missionsWithChecklist.map((mission) => ({
      ...mission,
      familyName: mission.familyName || asString(familyMap.get(String((missions.find((item) => item.id === mission.id) as AnyRecord)?.familyId || ''))?.full_name || familyMap.get(String((missions.find((item) => item.id === mission.id) as AnyRecord)?.familyId || ''))?.name || ''),
    }))
    const threads = buildMessageThreads(messageRows)
    const notifications = buildNotifications(notificationRows)
    const alerts = buildAlerts(alertRows)
    const audit = buildAudit(auditRows)
    const documents = buildDocuments(documentRows, caregivers)
    const agents = buildAgents(caregivers, missionsWithChecklist, checkins, documents)
    const readiness = buildReadinessSnapshot(agents, missionsWithChecklist, documents)
    const schedule = buildSchedule(missionsWithChecklist)
    const calendar = buildCalendar(missionsWithChecklist)
    const workforce = buildWorkforce(agents, missionsWithChecklist)
    const incidentCards = buildIncidents(incidentRows, missionCardMap)
    const reports = buildReports(reportsRows, missionCardMap)
    const quality = buildQuality(missionsWithChecklist, reports, incidentCards)
    const replacements = buildReplacements(missionsWithChecklist, agents, incidentCards)
    const serviceConfig = buildServiceConfig(serviceConfigRows.length ? serviceConfigRows : listServiceCharacteristics().map((service) => ({
      service_type: service.serviceType,
      service_family: service.serviceFamily,
      version: 1,
      status: 'active',
      config: service,
    })))
    const settings = buildSettings(settingsRows)
    const support = buildSupport()
    const summary = buildSummary(missionsWithChecklist, agents, incidentCards, reports, threads, notifications, alerts, disputeRows, documents)
    const checklistPending = missionsWithChecklist.filter((mission) => mission.checklistTotal > 0 && mission.checklistCompleted < mission.checklistTotal).length

    const live = buildLiveTimestamps(checkins, events, threads, notifications, alerts)

    return {
      ok: true,
      source: missionsWithChecklist.length ? 'live-db' : 'live-empty',
      generatedAt: nowIso(),
      summary: {
        ...summary,
        checklistPending,
      },
      missions: missionsWithChecklist,
      missionLanes: lanes,
      agents,
      incidents: incidentCards,
      reports,
      messages: threads,
      notifications,
      alerts,
      history: audit.concat(events.map((event) => ({
        id: String(event.id),
        entityType: 'mission_event',
        entityId: event.mission_id == null ? null : String(event.mission_id),
        action: asString(event.event_type || event.action || 'event'),
        actorName: event.created_by == null ? null : String(event.created_by),
        severity: 'info',
        createdAt: asString(event.created_at, nowIso()),
        payload: asRecord(event.payload),
  } as OpsAuditCard))).sort((a, b) => String(b.createdAt).localeCompare(a.createdAt)),
      payments,
      documents,
      readiness,
      schedule,
      calendar,
      workforce,
      quality,
      replacements,
      serviceConfig,
      settings,
      support,
      live,
    }
  } catch {
    return buildEmptyOpsSnapshot()
  }
}

export async function loadCareLinkOpsMissionDetail(missionId: string | number) {
  const id = Number(missionId)
  const [dossier, checklist, report, dispatch, notifications, alerts, disputes, documents, events, missionSettings] = await Promise.all([
    getMissionDossier(id).catch(() => null),
    loadMissionChecklist(id).catch(() => []),
    loadMissionReport(id).catch(() => null),
    loadDispatchMessages({ missionIds: [id] }).catch(() => ({ messages: [], threads: [], unreadCount: 0 })),
    loadNotifications({ missionIds: [id] }).catch(() => []),
    loadAlerts({ missionIds: [id] }).catch(() => []),
    loadPaymentDisputes({ missionIds: [id] }).catch(() => []),
    loadAgentDocuments().catch(() => []),
    safeMany((await createClient()).from('mission_events').select('*').eq('mission_id', id).order('created_at', { ascending: false }).limit(200)),
    safeSingle((await createClient()).from('missions').select('*').eq('id', id).maybeSingle()),
  ])
  const mission = dossier?.mission || null
  return {
    mission,
    dossier,
    checklist,
    report,
    dispatch,
    notifications,
    alerts,
    disputes,
    documents,
    events,
    missionSettings,
  }
}

export async function recordOpsAuditEvent(input: {
  entityType: string
  entityId?: string | null
  action: string
  actorName?: string | null
  payload?: Record<string, unknown>
  severity?: string
  source?: string
}) {
  const supabase = await createClient()
  const row = {
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    action: input.action,
    actor_name: input.actorName ?? null,
    severity: input.severity || 'info',
    source: input.source || 'carelink_ops',
    payload: input.payload || {},
  }
  const { data, error } = await supabase.from('carelink_ops_audit_events').insert([row]).select('*').maybeSingle()
  if (error) throw new Error(error.message)
  return data || row
}

export async function assignOpsMission(missionId: number, caregiverId: number | null, metadata: Record<string, unknown> = {}) {
  const patch = {
    caregiver_id: caregiverId,
    status: caregiverId ? 'assigned' : 'draft',
    lifecycle_stage: caregiverId ? 'assigned' : 'ready_for_assignment',
  }
  const mission = await patchMission(missionId, patch)
  await recordMissionEvent({
    missionId,
    eventType: caregiverId ? 'ops_mission_assigned' : 'ops_mission_unassigned',
    content: caregiverId ? `Caregiver assigned: #${caregiverId}` : 'Caregiver removed by CareLink Ops',
    metadata: { caregiver_id: caregiverId, ...metadata },
    source: 'carelink_ops',
  })
  await recordOpsAuditEvent({
    entityType: 'mission',
    entityId: String(missionId),
    action: caregiverId ? 'mission.assigned' : 'mission.unassigned',
    payload: { caregiver_id: caregiverId, ...metadata },
  })
  return mission
}

export async function notifyOpsAgent(args: { caregiverId: number; missionId?: number | null; subject: string; body: string; priority?: string; metadata?: Record<string, unknown> }) {
  const message = await createDispatchMessage({
    caregiverId: args.caregiverId,
    missionId: args.missionId ?? null,
    senderType: 'ops',
    senderId: null,
    recipientType: 'agent',
    subject: args.subject,
    body: args.body,
    priority: args.priority || 'normal',
    status: 'sent',
    metadata: args.metadata || {},
  })
  if (args.missionId) {
    await recordMissionEvent({
      missionId: args.missionId,
      eventType: 'dispatch_message_sent',
      content: args.body,
      metadata: { caregiver_id: args.caregiverId, subject: args.subject, priority: args.priority || 'normal', ...args.metadata },
      source: 'carelink_ops',
    })
  }
  await recordOpsAuditEvent({
    entityType: 'agent',
    entityId: String(args.caregiverId),
    action: 'agent.notified',
    payload: { mission_id: args.missionId ?? null, subject: args.subject, body: args.body, priority: args.priority || 'normal' },
  })
  return message
}

export async function createOpsAlert(args: { missionId?: number | null; caregiverId?: number | null; type: string; title: string; body: string; priority?: string; metadata?: Record<string, unknown> }) {
  const alert = await createAlert({
    missionId: args.missionId ?? null,
    caregiverId: args.caregiverId ?? null,
    type: args.type,
    title: args.title,
    body: args.body,
    priority: args.priority || 'normal',
    status: 'open',
    metadata: args.metadata || {},
  })
  if (args.missionId) {
    await recordMissionEvent({
      missionId: args.missionId,
      eventType: 'ops_alert_created',
      content: args.title,
      metadata: { caregiver_id: args.caregiverId ?? null, priority: args.priority || 'normal', type: args.type, ...args.metadata },
      source: 'carelink_ops',
    })
  }
  await recordOpsAuditEvent({
    entityType: 'alert',
    entityId: alert?.id || null,
    action: 'alert.created',
    payload: { mission_id: args.missionId ?? null, caregiver_id: args.caregiverId ?? null, type: args.type, priority: args.priority || 'normal' },
  })
  return alert
}

export async function acknowledgeOpsNotification(id: string, missionId?: number | null, note?: string | null) {
  const notification = await acknowledgeNotification(id, missionId, note)
  await recordOpsAuditEvent({
    entityType: 'notification',
    entityId: id,
    action: 'notification.acknowledged',
    payload: { mission_id: missionId ?? null, note },
  })
  return notification
}

export async function acknowledgeOpsAlert(id: string, missionId?: number | null, note?: string | null) {
  const alert = await acknowledgeAlert(id, missionId, note)
  await recordOpsAuditEvent({
    entityType: 'alert',
    entityId: id,
    action: 'alert.acknowledged',
    payload: { mission_id: missionId ?? null, note },
  })
  return alert
}

export async function validateOpsReport(missionId: number, payload: Record<string, unknown> = {}) {
  const supabase = await createClient()
  const now = nowIso()
  const { data, error } = await supabase.from('carelink_mission_reports').upsert([{
    mission_id: missionId,
    service_type: asString(payload.service_type || payload.serviceType || 'Service AngelCare'),
    summary: asString(payload.summary || ''),
    observations: asString(payload.observations || ''),
    activities: asArray(payload.activities),
    checklist_snapshot: asArray(payload.checklistSnapshot || payload.checklist_snapshot),
    incident_flag: Boolean(payload.incidentFlag || payload.incident_flag),
    recommendations: asString(payload.recommendations || ''),
    status: asString(payload.status || 'validated'),
    submitted_at: payload.submitted_at || now,
    validation_status: asString(payload.validation_status || payload.validationStatus || 'validated'),
    updated_at: now,
    metadata: asRecord(payload.metadata),
  }], { onConflict: 'mission_id' }).select('*').maybeSingle()
  if (error) throw new Error(error.message)
  await patchMission(missionId, {
    report_status: 'validated',
    validation_status: 'validated',
    lifecycle_stage: 'completed',
    status: 'completed',
    completed_at: now,
  })
  await recordMissionEvent({
    missionId,
    eventType: 'ops_report_validated',
    content: asString(payload.note || payload.summary || 'Mission report validated'),
    metadata: { ...payload },
    source: 'carelink_ops',
  })
  await recordOpsAuditEvent({
    entityType: 'mission',
    entityId: String(missionId),
    action: 'report.validated',
    payload,
  })
  return data
}

export async function requestMissionCorrectionDispute(input: {
  caregiverId: number
  missionId?: number | null
  amountClaimed?: number | null
  reason: string
  metadata?: Record<string, unknown>
}) {
  const dispute = await createPaymentDispute({
    caregiverId: input.caregiverId,
    missionId: input.missionId ?? null,
    amountClaimed: input.amountClaimed ?? null,
    reason: input.reason,
    status: 'pending',
    metadata: input.metadata || {},
  })
  await recordOpsAuditEvent({
    entityType: 'payment_dispute',
    entityId: dispute?.id || null,
    action: 'payment.dispute_requested',
    payload: input,
  })
  return dispute
}

export async function requestOpsDocument(caregiverId: number, payload: { documentType?: string | null; note?: string | null; status?: string; metadata?: Record<string, unknown> }) {
  const document = await requestDocumentReview(caregiverId, payload)
  await recordOpsAuditEvent({
    entityType: 'document',
    entityId: document?.id || null,
    action: 'document.review_requested',
    payload: { caregiver_id: caregiverId, ...payload },
  })
  return document
}

export async function saveOpsDocument(input: { caregiverId: number; documentType: string; status?: string; expiresAt?: string | null; fileUrl?: string | null; reviewStatus?: string; metadata?: Record<string, unknown> }) {
  const document = await saveAgentDocument(input)
  await recordOpsAuditEvent({
    entityType: 'document',
    entityId: document?.id || null,
    action: 'document.saved',
    payload: input,
  })
  return document
}

export async function saveOpsMessage(input: { missionId?: number | null; caregiverId?: number | null; subject?: string | null; body: string; priority?: string; metadata?: Record<string, unknown> }) {
  const message = await createDispatchMessage({
    missionId: input.missionId ?? null,
    caregiverId: input.caregiverId ?? null,
    senderType: 'ops',
    senderId: null,
    recipientType: input.caregiverId ? 'agent' : 'dispatch',
    subject: input.subject ?? null,
    body: input.body,
    priority: input.priority || 'normal',
    status: 'sent',
    metadata: input.metadata || {},
  })
  if (input.missionId) {
    await recordMissionEvent({
      missionId: input.missionId,
      eventType: 'dispatch_message_sent',
      content: input.body,
      metadata: input.metadata || {},
      source: 'carelink_ops',
    })
  }
  await recordOpsAuditEvent({
    entityType: 'message',
    entityId: message.id,
    action: 'message.created',
    payload: input,
  })
  return message
}

export async function saveOpsNotification(input: { missionId?: number | null; caregiverId?: number | null; type: string; title: string; body: string; priority?: string; metadata?: Record<string, unknown> }) {
  const notification = await createNotification({
    missionId: input.missionId ?? null,
    caregiverId: input.caregiverId ?? null,
    type: input.type,
    title: input.title,
    body: input.body,
    priority: input.priority || 'normal',
    status: 'unread',
    metadata: input.metadata || {},
  })
  if (input.missionId) {
    await recordMissionEvent({
      missionId: input.missionId,
      eventType: 'ops_notification_created',
      content: input.title,
      metadata: input.metadata || {},
      source: 'carelink_ops',
    })
  }
  await recordOpsAuditEvent({
    entityType: 'notification',
    entityId: notification?.id || null,
    action: 'notification.created',
    payload: input,
  })
  return notification
}

export async function saveOpsServiceConfig(input: { serviceType: string; serviceFamily: string; config: AnyRecord; status?: string; updatedBy?: string | null }) {
  const supabase = await createClient()
  const now = nowIso()
  const { data, error } = await supabase.from('carelink_ops_service_configs').upsert([{
    service_type: input.serviceType,
    service_family: input.serviceFamily,
    version: 1,
    status: input.status || 'active',
    config: input.config,
    updated_by: input.updatedBy ?? null,
    updated_at: now,
    metadata: input.config.metadata || {},
  }], { onConflict: 'service_type,version' }).select('*').maybeSingle()
  if (error) throw new Error(error.message)
  await recordOpsAuditEvent({
    entityType: 'service_config',
    entityId: data?.id || null,
    action: 'service_config.updated',
    payload: input,
  })
  return data
}

export async function saveOpsSetting(input: { key: string; label: string; category: string; value: AnyRecord; status?: string; updatedBy?: string | null }) {
  const supabase = await createClient()
  const now = nowIso()
  const { data, error } = await supabase.from('carelink_ops_settings').upsert([{
    key: input.key,
    label: input.label,
    category: input.category,
    value: input.value,
    status: input.status || 'active',
    updated_by: input.updatedBy ?? null,
    updated_at: now,
    metadata: input.value.metadata || {},
  }], { onConflict: 'key' }).select('*').maybeSingle()
  if (error) throw new Error(error.message)
  await recordOpsAuditEvent({
    entityType: 'setting',
    entityId: data?.id || null,
    action: 'setting.updated',
    payload: input,
  })
  return data
}

export async function escalateOpsIncident(input: { incidentId: string; status?: string; note?: string; metadata?: Record<string, unknown> }) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('incidents').update({
    status: input.status || 'escalated',
    metadata: { note: input.note || null, ...(input.metadata || {}) },
  }).eq('id', input.incidentId).select('*').maybeSingle()
  if (error) throw new Error(error.message)
  await recordOpsAuditEvent({
    entityType: 'incident',
    entityId: input.incidentId,
    action: 'incident.escalated',
    payload: input,
    severity: 'warning',
  })
  return data
}

export async function resolveOpsIncident(input: { incidentId: string; note?: string; metadata?: Record<string, unknown> }) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('incidents').update({
    status: 'resolved',
    metadata: { note: input.note || null, ...(input.metadata || {}) },
  }).eq('id', input.incidentId).select('*').maybeSingle()
  if (error) throw new Error(error.message)
  await recordOpsAuditEvent({
    entityType: 'incident',
    entityId: input.incidentId,
    action: 'incident.resolved',
    payload: input,
    severity: 'info',
  })
  return data
}

export async function reviewOpsDispute(disputeId: string, status: string, note?: string | null) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('carelink_payment_disputes').update({
    status,
    resolved_at: ['resolved', 'approved', 'rejected'].includes(status) ? nowIso() : null,
    metadata: note ? { note } : {},
  }).eq('id', disputeId).select('*').maybeSingle()
  if (error) throw new Error(error.message)
  await recordOpsAuditEvent({
    entityType: 'payment_dispute',
    entityId: disputeId,
    action: `payment.dispute.${status}`,
    payload: { note },
  })
  return data
}
