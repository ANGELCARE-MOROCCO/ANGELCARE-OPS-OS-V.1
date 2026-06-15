import { createClient } from '@/lib/supabase/server'
import { getMissionDossier, listMissionControlRecords } from '@/lib/missions/repository'
import type { MissionControlRecord, MissionDossier } from '@/lib/missions/types'
import { loadAlerts, loadAgentDocuments, loadDispatchMessages, loadNotifications, loadPaymentDisputes } from './mobile-persistence'

type AnyRecord = Record<string, any>

export type CareLinkMobileAlert = {
  id: string
  title: string
  body: string
  missionId?: string | number | null
  tone: 'red' | 'amber' | 'blue' | 'emerald' | 'slate'
  createdAt: string
}

export type CareLinkMobileNotification = {
  id: string
  title: string
  body: string
  missionId?: string | number | null
  priority: 'normal' | 'high' | 'critical'
  unread: boolean
  createdAt: string
}

export type CareLinkMobilePaymentLine = {
  id: string
  missionId?: string | number | null
  label: string
  amountMad: number
  status: string
  kind: string
  createdAt: string | null
}

export type CareLinkMobileWorkspace = {
  source: 'live-db' | 'live-empty' | 'error'
  generatedAt: string
  agent: AnyRecord | null
  profile: AnyRecord | null
  records: MissionControlRecord[]
  todayMissions: MissionControlRecord[]
  upcomingMissions: MissionControlRecord[]
  activeMission: MissionControlRecord | null
  nextMission: MissionControlRecord | null
  readiness: {
    score: number
    status: 'ready' | 'warning' | 'blocked' | 'pending'
    blockers: string[]
    warnings: string[]
    nextAction: string
  }
  stats: {
    todayMissions: number
    weekHours: number
    reliabilityScore: number
    performanceScore: number
    noShowCount: number
    cancellationCount: number
    completedCount: number
    pendingReports: number
    unreadMessages: number
    criticalAlerts: number
  }
  payments: {
    currency: 'MAD'
    earned: number
    pendingValidation: number
    paid: number
    bonuses: number
    transport: number
    allowances: number
    upcomingPayment: number
    lines: CareLinkMobilePaymentLine[]
  }
  alerts: CareLinkMobileAlert[]
  notifications: CareLinkMobileNotification[]
  messages: Array<{ id: string; title: string; body: string; missionId?: string | number | null; priority: string; unread: boolean; createdAt: string }>
  history: Array<{ id: string; title: string; body: string; missionId?: string | number | null; status: string; createdAt: string }>
  support: Array<{ id: string; title: string; body: string; href?: string }>
  schedule: Array<{ date: string; missions: MissionControlRecord[] }>
  calendar: {
    byDate: Array<{ date: string; count: number; missions: MissionControlRecord[] }>
    density: number
  }
  workspaces: {
    safety: Array<{ label: string; value: string }>
  }
  dispatchThreads?: Array<{ id: string; missionId: number | null; title: string; priority: string; unreadCount: number; status: string; lastMessage: string; createdAt: string }>
  checklistItems?: Array<Record<string, unknown>>
  reports?: Array<Record<string, unknown>>
  paymentDisputes?: Array<Record<string, unknown>>
  documents?: Array<Record<string, unknown>>
}

function asNumber(value: unknown) {
  const amount = Number(value || 0)
  return Number.isFinite(amount) ? amount : 0
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function toneFromStatus(status: string | null | undefined, risk: string | null | undefined) {
  const normalizedStatus = String(status || '').toLowerCase()
  const normalizedRisk = String(risk || '').toLowerCase()
  if (['incident', 'cancelled', 'no_show'].includes(normalizedStatus) || ['critical', 'elevated', 'high'].includes(normalizedRisk)) return 'red' as const
  if (['report_pending', 'draft', 'pending', 'validation'].includes(normalizedStatus) || ['watch', 'warning', 'medium'].includes(normalizedRisk)) return 'amber' as const
  if (['completed', 'closed', 'report_submitted'].includes(normalizedStatus)) return 'emerald' as const
  return 'blue' as const
}

function priorityFromStatus(status: string | null | undefined, risk: string | null | undefined) {
  const normalizedStatus = String(status || '').toLowerCase()
  const normalizedRisk = String(risk || '').toLowerCase()
  if (['incident', 'cancelled', 'no_show'].includes(normalizedStatus) || ['critical', 'high'].includes(normalizedRisk)) return 'critical' as const
  if (['report_pending', 'validation', 'draft', 'assigned'].includes(normalizedStatus) || ['watch', 'elevated', 'medium'].includes(normalizedRisk)) return 'high' as const
  return 'normal' as const
}

function titleCaseLabel(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

async function safeSingle<T = AnyRecord>(promise: any): Promise<T | null> {
  try {
    const { data, error } = await promise
    if (error) return null
    return data
  } catch {
    return null
  }
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

async function resolveAgentProfile(supabase: Awaited<ReturnType<typeof createClient>>) {
  const auth = await supabase.auth.getUser().catch(() => ({ data: { user: null } as any }))
  const user = auth.data?.user || null
  if (!user) return null

  const keys = ['user_id', 'auth_user_id', 'account_user_id', 'supabase_user_id']
  for (const key of keys) {
    const candidate = await safeSingle(supabase.from('caregivers').select('*').eq(key, user.id).maybeSingle())
    if (candidate) return candidate
  }

  if (user.email) {
    const byEmail = await safeSingle(supabase.from('caregivers').select('*').eq('email', user.email).maybeSingle())
    if (byEmail) return byEmail
  }

  const fallbackRows = await safeMany(supabase.from('caregivers').select('*').order('updated_at', { ascending: false }).limit(1))
  return fallbackRows[0] || null
}

function deriveReadiness(records: MissionControlRecord[], agent: AnyRecord | null) {
  const readinessScores = records.map((record) => {
    const progress = record.subMissionCount ? record.completedSubMissionCount / Math.max(1, record.subMissionCount) : 0
    const statusScore = record.status === 'completed' ? 100 : ['in_progress', 'confirmed'].includes(record.status) ? 85 : record.status === 'assigned' ? 70 : record.status === 'incident' ? 20 : 55
    const riskPenalty = ['critical', 'elevated', 'high'].includes(String(record.riskLevel || '').toLowerCase()) ? 15 : 0
    return Math.max(0, Math.min(100, Math.round((statusScore * 0.7) + (progress * 100 * 0.3) - riskPenalty)))
  })

  const blockers = [
    ...records.filter((record) => ['incident', 'cancelled', 'no_show'].includes(record.status)).map((record) => `Mission ${record.code} bloquante`),
    ...records.filter((record) => record.status === 'report_pending' || record.reportStatus === 'pending').map((record) => `Rapport attendu pour ${record.code}`),
  ]

  const warnings = [
    ...records.filter((record) => ['assigned', 'confirmed', 'in_progress'].includes(record.status)).map((record) => `Mission ${record.code} à surveiller`),
    ...records.filter((record) => String(record.validationStatus || '').toLowerCase() === 'pending').map((record) => `Validation en attente pour ${record.code}`),
  ]

  const nextAction = blockers[0] || warnings[0] || 'Agent prêt pour exécution terrain'
  const average = readinessScores.length ? Math.round(readinessScores.reduce((sum, value) => sum + value, 0) / readinessScores.length) : 0
  const profileBoost = agent ? 10 : 0
  const score = Math.max(0, Math.min(100, average + profileBoost))

  const status: 'ready' | 'warning' | 'blocked' | 'pending' = blockers.length ? 'blocked' : warnings.length ? 'warning' : records.length ? 'ready' : 'pending'

  return {
    score,
    status,
    blockers,
    warnings,
    nextAction,
  }
}

function deriveStats(records: MissionControlRecord[]) {
  const weekHours = records.reduce((sum, record) => sum + Math.max(0, Number(record.subMissionCount ? record.subMissionCount : 0) || 0), 0)
  const completedCount = records.filter((record) => ['completed', 'closed'].includes(record.status)).length
  const cancellationCount = records.filter((record) => record.status === 'cancelled').length
  const noShowCount = records.filter((record) => record.status === 'no_show').length
  const pendingReports = records.filter((record) => ['report_pending', 'completion_requested'].includes(record.status) || record.reportStatus === 'pending').length
  const criticalAlerts = records.filter((record) => ['incident', 'cancelled', 'no_show'].includes(record.status) || ['critical', 'high', 'elevated'].includes(String(record.riskLevel || '').toLowerCase())).length
  const reliabilityScore = records.length ? Math.max(0, Math.round(100 - ((cancellationCount * 12) + (noShowCount * 15) + (criticalAlerts * 5)))) : 0
  const performanceScore = records.length ? Math.max(0, Math.round((completedCount / Math.max(1, records.length)) * 100)) : 0

  return {
    todayMissions: records.filter((record) => record.dateLabel === todayKey()).length,
    weekHours,
    reliabilityScore,
    performanceScore,
    noShowCount,
    cancellationCount,
    completedCount,
    pendingReports,
    unreadMessages: 0,
    criticalAlerts,
  }
}

function derivePayments(records: MissionControlRecord[], allowanceRows: AnyRecord[], dossierMap: Map<string, MissionDossier>) {
  const lines: CareLinkMobilePaymentLine[] = []
  const seen = new Set<string>()

  const pushLine = (row: AnyRecord, missionId?: string | number | null) => {
    const key = String(row.id || `${missionId || ''}:${row.label || row.type || row.kind || lines.length}`)
    if (seen.has(key)) return
    seen.add(key)
    const amountMad = (() => {
      const direct = asNumber(row.amount_mad ?? row.amountMad ?? row.amount ?? row.value ?? row.total_amount ?? row.total ?? row.total_mad ?? 0)
      if (direct) return direct
      const grade = asNumber(row.grade_fee)
      if (grade) return grade
      const notes = typeof row.manual_notes === 'string' ? row.manual_notes : ''
      if (!notes) return 0
      try {
        const parsed = JSON.parse(notes)
        return asNumber(parsed.totalMad ?? parsed.total_mad ?? parsed.amountMad ?? parsed.amount_mad ?? 0)
      } catch {
        return 0
      }
    })()
    lines.push({
      id: key,
      missionId: missionId ?? row.mission_id ?? null,
      label: asString(row.label || row.name || row.title || row.type || 'Indemnité'),
      amountMad,
      status: asString(row.status || row.payment_status || row.validation_status || 'pending'),
      kind: asString(row.kind || row.allowance_type || row.category || 'allowance'),
      createdAt: row.created_at || row.updated_at || null,
    })
  }

  allowanceRows.forEach((row) => pushLine(row, row.mission_id))
  for (const record of records) {
    const dossier = dossierMap.get(String(record.id))
    if (!dossier) continue
    const allowance = dossier.allowances || {}
    if (allowance && Object.keys(allowance).length) pushLine(allowance as AnyRecord, record.id)
  }

  const earned = lines.filter((line) => ['paid', 'validated', 'completed'].includes(String(line.status).toLowerCase())).reduce((sum, line) => sum + line.amountMad, 0)
  const pendingValidation = lines.filter((line) => ['pending', 'validation', 'submitted', 'in_review', 'needs_review'].includes(String(line.status).toLowerCase())).reduce((sum, line) => sum + line.amountMad, 0)
  const paid = lines.filter((line) => ['paid', 'validated'].includes(String(line.status).toLowerCase())).reduce((sum, line) => sum + line.amountMad, 0)
  const bonuses = lines.filter((line) => /bonus|prime|reward/i.test(line.kind)).reduce((sum, line) => sum + line.amountMad, 0)
  const transport = lines.filter((line) => /transport|travel|route/i.test(line.kind)).reduce((sum, line) => sum + line.amountMad, 0)
  const allowances = lines.reduce((sum, line) => sum + line.amountMad, 0)
  const upcomingPayment = pendingValidation

  return {
    currency: 'MAD' as const,
    earned,
    pendingValidation,
    paid,
    bonuses,
    transport,
    allowances,
    upcomingPayment,
    lines,
  }
}

function deriveAlerts(records: MissionControlRecord[], events: AnyRecord[], incidents: AnyRecord[]): CareLinkMobileAlert[] {
  const alerts: CareLinkMobileAlert[] = []
  for (const record of records) {
    if (['incident', 'cancelled', 'no_show'].includes(record.status)) {
      alerts.push({
        id: `mission-alert-${record.id}`,
        title: `Mission ${record.code}`,
        body: record.status === 'incident'
          ? 'Incident déclaré, intervention immédiate requise.'
          : record.status === 'no_show'
            ? 'Absence détectée, dispatch à prévenir.'
            : 'Mission annulée ou à replanifier.',
        missionId: record.id,
        tone: 'red',
        createdAt: new Date().toISOString(),
      })
      continue
    }
    if (['report_pending', 'completion_requested'].includes(record.status) || record.reportStatus === 'pending') {
      alerts.push({
        id: `report-${record.id}`,
        title: `Rapport attendu - ${record.code}`,
        body: 'Le rapport de mission doit être soumis ou validé.',
        missionId: record.id,
        tone: 'amber',
        createdAt: new Date().toISOString(),
      })
    }
  }

  events.slice(0, 20).forEach((event) => {
    const type = String(event.event_type || event.action || '').toLowerCase()
    if (!['incident', 'incident_reported', 'report_submitted', 'status_updated', 'mission_completed', 'mission_started'].some((part) => type.includes(part))) return
    alerts.push({
      id: `event-${event.id}`,
      title: event.content || titleCaseLabel(type || 'event'),
      body: event.created_at ? `Événement enregistré le ${new Date(event.created_at).toLocaleString('fr-FR')}` : 'Événement enregistré.',
      missionId: event.mission_id || null,
      tone: type.includes('incident') ? 'red' : 'blue',
      createdAt: event.created_at || new Date().toISOString(),
    })
  })

  incidents.slice(0, 20).forEach((incident) => {
    alerts.push({
      id: `incident-${incident.id}`,
      title: incident.summary || `Incident ${incident.incident_type || ''}`.trim(),
      body: incident.owner_name ? `Responsable: ${incident.owner_name}` : 'Incident à traiter.',
      missionId: incident.mission_id || null,
      tone: incident.severity && ['critical', 'high'].includes(String(incident.severity).toLowerCase()) ? 'red' : 'amber',
      createdAt: incident.created_at || new Date().toISOString(),
    })
  })

  return alerts.slice(0, 24)
}

function deriveNotifications(records: MissionControlRecord[], events: AnyRecord[]): CareLinkMobileNotification[] {
  const notifications: CareLinkMobileNotification[] = []
  for (const record of records.slice(0, 20)) {
    if (record.status === 'assigned') {
      notifications.push({
        id: `assigned-${record.id}`,
        title: 'Mission assignée',
        body: `${record.serviceType} · ${record.dateLabel}`,
        missionId: record.id,
        priority: 'high',
        unread: true,
        createdAt: new Date().toISOString(),
      })
    }
    if (record.reportStatus === 'pending' || record.status === 'report_pending') {
      notifications.push({
        id: `report-${record.id}`,
        title: 'Rapport en attente',
        body: `Merci de soumettre le rapport pour ${record.code}.`,
        missionId: record.id,
        priority: 'high',
        unread: true,
        createdAt: new Date().toISOString(),
      })
    }
  }

  events.slice(0, 30).forEach((event) => {
    notifications.push({
      id: `evt-${event.id}`,
      title: event.content || titleCaseLabel(String(event.event_type || 'notification')),
      body: event.created_at ? `Publié le ${new Date(event.created_at).toLocaleString('fr-FR')}` : 'Publié récemment.',
      missionId: event.mission_id || null,
      priority: String(event.event_type || '').includes('incident') ? 'critical' : 'normal',
      unread: true,
      createdAt: event.created_at || new Date().toISOString(),
    })
  })

  return notifications.slice(0, 30)
}

function deriveMessages(records: MissionControlRecord[], events: AnyRecord[]) {
  const threads = new Map<string, { id: string; title: string; body: string; missionId?: string | number | null; priority: string; unread: boolean; createdAt: string }>()
  records.slice(0, 25).forEach((record) => {
    const key = String(record.id)
    threads.set(key, {
      id: key,
      title: `Mission ${record.code}`,
      body: record.status === 'incident'
        ? 'Incident en attente de prise en charge.'
        : record.reportStatus === 'pending'
          ? 'Rapport en attente de soumission.'
          : `${record.serviceType} · ${record.zone}`,
      missionId: record.id,
      priority: priorityFromStatus(record.status, record.riskLevel),
      unread: ['assigned', 'incident', 'report_pending'].includes(record.status),
      createdAt: new Date().toISOString(),
    })
  })

  events.slice(0, 20).forEach((event) => {
    const key = `event-${event.mission_id || event.id}`
    threads.set(key, {
      id: key,
      title: event.mission_code ? `Mission ${event.mission_code}` : 'Dispatch',
      body: event.content || titleCaseLabel(String(event.event_type || 'message')),
      missionId: event.mission_id || null,
      priority: String(event.event_type || '').includes('incident') ? 'critical' : 'normal',
      unread: true,
      createdAt: event.created_at || new Date().toISOString(),
    })
  })

  return Array.from(threads.values()).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

function deriveHistory(records: MissionControlRecord[], events: AnyRecord[]) {
  const history = [
    ...records.filter((record) => ['completed', 'cancelled', 'no_show', 'incident'].includes(record.status)).map((record) => ({
      id: `history-${record.id}`,
      title: record.serviceType,
      body: `${record.city} · ${record.zone} · ${record.dateLabel}`,
      missionId: record.id,
      status: record.status,
      createdAt: new Date().toISOString(),
    })),
    ...events.slice(0, 30).map((event) => ({
      id: `event-history-${event.id}`,
      title: titleCaseLabel(String(event.event_type || 'Événement')),
      body: event.content || '',
      missionId: event.mission_id || null,
      status: String(event.event_type || ''),
      createdAt: event.created_at || new Date().toISOString(),
    })),
  ]

  return history.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 40)
}

function deriveSchedule(records: MissionControlRecord[]) {
  const grouped = new Map<string, MissionControlRecord[]>()
  records.forEach((record) => {
    const key = record.dateLabel || 'Non planifiée'
    grouped.set(key, [...(grouped.get(key) || []), record])
  })
  return Array.from(grouped.entries()).map(([date, missions]) => ({ date, missions }))
}

function deriveCalendar(records: MissionControlRecord[]) {
  const grouped = new Map<string, MissionControlRecord[]>()
  records.forEach((record) => {
    const key = record.dateLabel || 'Non planifiée'
    grouped.set(key, [...(grouped.get(key) || []), record])
  })
  const byDate = Array.from(grouped.entries()).map(([date, missions]) => ({ date, count: missions.length, missions }))
  return {
    byDate,
    density: records.length ? Math.round((records.filter((record) => ['assigned', 'confirmed', 'in_progress', 'completed'].includes(record.status)).length / records.length) * 100) : 0,
  }
}

function deriveSupport(agent: AnyRecord | null) {
  return [
    { id: 'dispatch', title: 'Contacter le dispatch', body: agent?.phone ? `Appel direct ${agent.phone}` : 'Canal opérationnel standard.', href: '/carelink/messages' },
    { id: 'supervisor', title: 'Contacter le superviseur', body: 'Escalade coordination et validation.', href: '/carelink/alerts' },
    { id: 'finance', title: 'Assistance finance', body: 'Paiements, compensations et corrections.', href: '/carelink/payments' },
    { id: 'tech', title: 'Assistance technique', body: 'Problème mobile, synchronisation ou connexion.', href: '/carelink/support' },
  ]
}

function deriveSafety(records: MissionControlRecord[]) {
  const nextMission = records[0] || null
  return [
    { label: 'Statut sécurité', value: nextMission ? toneFromStatus(nextMission.status, nextMission.riskLevel).toUpperCase() : 'STABLE' },
    { label: 'Prochaine mission', value: nextMission ? nextMission.code : 'Aucune mission active' },
    { label: 'Incident ouvert', value: records.some((record) => record.status === 'incident') ? 'Oui' : 'Non' },
    { label: 'Dispatch', value: nextMission ? nextMission.priority.toUpperCase() : 'N/A' },
  ]
}

export async function loadCarelinkMobileWorkspace(): Promise<CareLinkMobileWorkspace> {
  const supabase = await createClient()
  const agent = await resolveAgentProfile(supabase)
  const allRecords = (await listMissionControlRecords().catch(() => [])) || []
  const agentRecords = agent?.id ? allRecords.filter((record) => String(record.caregiverId || '') === String(agent.id)) : allRecords
  const records = agentRecords.length ? agentRecords : allRecords
  const today = todayKey()
  const todayMissions = records.filter((record) => record.dateLabel === today || String(record.dateLabel || '').includes(today))
  const upcomingMissions = [...records].filter((record) => !['completed', 'cancelled', 'closed'].includes(record.status))
  const activeMission = records.find((record) => ['in_progress', 'confirmed', 'arrival_confirmed', 'assigned'].includes(record.status)) || null
  const nextMission = activeMission || upcomingMissions[0] || records[0] || null

  const missionIds = records.slice(0, 40).map((record) => record.id)
  const dossierEntries = await Promise.all(missionIds.map(async (missionId) => {
    const dossier = await getMissionDossier(Number(missionId)).catch(() => null)
    return [String(missionId), dossier] as const
  }))
  const dossierMap = new Map<string, MissionDossier>(dossierEntries.filter((entry): entry is readonly [string, MissionDossier] => Boolean(entry[1])))

  const events = await safeMany<AnyRecord>(supabase.from('mission_events').select('*').in('mission_id', missionIds.length ? missionIds : [0]).order('created_at', { ascending: false }).limit(120))
  const incidents = await safeMany<AnyRecord>(supabase.from('incidents').select('*').order('created_at', { ascending: false }).limit(80))
  const allowanceRows = await safeMany<AnyRecord>(supabase.from('mission_allowances').select('*').order('created_at', { ascending: false }).limit(120))
  const caregiverId = agent?.id == null ? null : Number(agent.id)
  const dispatchFeed = await loadDispatchMessages({ caregiverId, missionIds }).catch(() => ({ messages: [], threads: [], unreadCount: 0 }))
  const notificationsFeed = await loadNotifications({ caregiverId, missionIds }).catch(() => [])
  const alertsFeed = await loadAlerts({ caregiverId, missionIds }).catch(() => [])
  const disputesFeed = await loadPaymentDisputes({ caregiverId, missionIds }).catch(() => [])
  const documentsFeed = await loadAgentDocuments(caregiverId).catch(() => [])

  const readiness = deriveReadiness(records, agent)
  const stats = deriveStats(records)
  const payments = derivePayments(records, allowanceRows, dossierMap)
  const alerts = alertsFeed.length
    ? alertsFeed.map((alert) => ({
        id: alert.id,
        title: alert.title,
        body: alert.body,
        missionId: alert.missionId,
        tone: (['critical', 'high'].includes(String(alert.priority).toLowerCase()) ? 'red' : ['medium', 'normal'].includes(String(alert.priority).toLowerCase()) ? 'amber' : 'blue') as 'red' | 'amber' | 'blue',
        createdAt: alert.createdAt,
      }))
    : deriveAlerts(records, events, incidents)
  const notifications = notificationsFeed.length
    ? notificationsFeed.map((notification) => ({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        missionId: notification.missionId,
        priority: (['critical', 'high'].includes(String(notification.priority).toLowerCase()) ? 'critical' : ['medium', 'normal'].includes(String(notification.priority).toLowerCase()) ? 'high' : 'normal') as 'normal' | 'high' | 'critical',
        unread: !['acknowledged', 'dismissed'].includes(String(notification.status).toLowerCase()),
        createdAt: notification.createdAt,
      }))
    : deriveNotifications(records, events)
  const messages = dispatchFeed.messages.length
    ? dispatchFeed.messages.map((message) => ({
        id: message.id,
        title: message.subject || (message.missionId ? `Mission ${message.missionId}` : 'Liaison dispatch'),
        body: message.body,
        missionId: message.missionId,
        priority: message.priority,
        unread: !message.readAt && String(message.status).toLowerCase() !== 'read',
        createdAt: message.createdAt,
      }))
    : deriveMessages(records, events)
  const history = deriveHistory(records, events)
    .concat(disputesFeed.map((dispute) => ({
      id: `dispute-${dispute.id}`,
      title: 'Correction paiement demandée',
      body: dispute.reason,
      missionId: dispute.missionId,
      status: dispute.status,
      createdAt: dispute.createdAt,
    })))
    .concat(documentsFeed.map((document) => ({
      id: `document-${document.id}`,
      title: `Document ${document.documentType}`,
      body: `${document.status} · ${document.reviewStatus}`,
      missionId: null,
      status: document.reviewStatus,
      createdAt: document.createdAt,
    })))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  const schedule = deriveSchedule(records)
  const calendar = deriveCalendar(records)
  const support = deriveSupport(agent)
  const workspaces = { safety: deriveSafety(records) }
  const checklistItems = Array.from(dossierMap.values()).flatMap((dossier) => (dossier.checklistItems || []).map((item) => ({
    ...item,
    missionId: dossier.raw.id,
    missionCode: dossier.mission.code,
  })))
  const reports = Array.from(dossierMap.values()).flatMap((dossier) => (dossier.report ? [{
    ...dossier.report,
    missionId: dossier.raw.id,
    missionCode: dossier.mission.code,
  }] : []))
  const expiredDocuments = documentsFeed.filter((document) => document.expiresAt && new Date(document.expiresAt).getTime() < Date.now())
  const reviewRequestedDocuments = documentsFeed.filter((document) => ['review_requested', 'pending'].includes(String(document.reviewStatus).toLowerCase()))
  if (expiredDocuments.length) {
    readiness.blockers.push(...expiredDocuments.map((document) => `Document expiré: ${document.documentType}`))
    readiness.status = 'blocked'
    readiness.nextAction = readiness.nextAction === 'Agent prêt pour exécution terrain' ? `Document ${expiredDocuments[0].documentType} à renouveler` : readiness.nextAction
  }
  if (reviewRequestedDocuments.length && readiness.status !== 'blocked') {
    readiness.warnings.push(...reviewRequestedDocuments.map((document) => `Document à revoir: ${document.documentType}`))
    readiness.status = 'warning'
    readiness.nextAction = readiness.nextAction === 'Agent prêt pour exécution terrain' ? `Revue demandée pour ${reviewRequestedDocuments[0].documentType}` : readiness.nextAction
  }
  stats.unreadMessages = messages.filter((message) => message.unread).length
  stats.criticalAlerts = alerts.filter((alert) => alert.tone === 'red').length

  return {
    source: records.length ? 'live-db' : 'live-empty',
    generatedAt: new Date().toISOString(),
    agent,
    profile: agent,
    records,
    todayMissions,
    upcomingMissions,
    activeMission,
    nextMission,
    readiness,
    stats,
    payments,
    alerts,
    notifications,
    messages,
    history,
    support,
    schedule,
    calendar,
    workspaces,
    dispatchThreads: dispatchFeed.threads,
    checklistItems,
    reports,
    paymentDisputes: disputesFeed.map((item) => ({ ...item })),
    documents: documentsFeed.map((item) => ({ ...item })),
  }
}

export async function loadCarelinkMobileMissionContext(id: string | number) {
  const records = await listMissionControlRecords().catch(() => [])
  const selected = records.find((record) => String(record.id) === String(id) || String(record.code) === String(id)) || null
  const dossier = selected ? await getMissionDossier(Number(selected.id)).catch(() => null) : null
  const workspace = await loadCarelinkMobileWorkspace()
  return { selected, dossier, records, workspace }
}
