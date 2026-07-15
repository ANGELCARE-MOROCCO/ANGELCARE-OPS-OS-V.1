import { createClient } from '@/lib/supabase/server'
import { recordOpsAuditEvent, notifyOpsAgent, createOpsAlert } from './ops-enterprise'

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


type AnyRecord = Record<string, any>

function nowIso() {
  return new Date().toISOString()
}

function text(value: unknown, fallback = '') {
  return value === null || value === undefined || value === '' ? fallback : String(value)
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function positiveId(value: unknown) {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

function array(value: unknown): any[] {
  return Array.isArray(value) ? value : []
}

function compactPatch(input: AnyRecord) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined))
}

async function safeMany<T = AnyRecord>(promise: any): Promise<T[]> {
  try {
    const { data, error } = await promise
    if (error || !Array.isArray(data)) return []
    return data as T[]
  } catch {
    return []
  }
}

async function safeSingle<T = AnyRecord>(promise: any): Promise<T | null> {
  try {
    const { data, error } = await promise
    if (error || !data) return null
    return data as T
  } catch {
    return null
  }
}

function normalizeAgent(row: AnyRecord) {
  const skills = array(row.skill_tags)
  const languages = array(row.language_tags)
  const status = text(row.current_status || row.status, 'available')
  const reliability = number(row.reliability_score ?? row.reliabilityScore, 0)
  const performance = number(row.performance_score ?? row.performanceScore ?? reliability, reliability)
  const readiness = number(row.readiness_score ?? row.readinessScore ?? (status === 'available' ? 72 : 45), status === 'available' ? 72 : 45)

  return {
    id: Number(row.id),
    fullName: text(row.full_name || row.name || row.display_name, `Agent #${row.id}`),
    phone: text(row.phone || row.mobile || row.whatsapp),
    email: text(row.email),
    city: text(row.city, 'Non définie'),
    zone: text(row.zone, 'Non définie'),
    status,
    currentStatus: status,
    availability: status === 'available' ? 'Disponible' : status,
    skills,
    languages,
    skillsSummary: text(row.skills_summary || row.summary || row.notes),
    serviceEligibility: skills,
    readinessScore: readiness,
    reliabilityScore: reliability,
    performanceScore: performance,
    documentsStatus: text(row.documents_status || row.compliance_status || 'pending'),
    academyCertified: Boolean(row.academy_certified),
    specialNeedsCapable: Boolean(row.special_needs_capable),
    isArchived: Boolean(row.is_archived || status === 'archived'),
    raw: row,
  }
}

function buildAgentSummary(agent: ReturnType<typeof normalizeAgent>, linked: {
  missions: AnyRecord[]
  checkins: AnyRecord[]
  incidents: AnyRecord[]
  documents: AnyRecord[]
  alerts: AnyRecord[]
  notifications: AnyRecord[]
  messages: AnyRecord[]
  reports: AnyRecord[]
  disputes: AnyRecord[]
  allowances: AnyRecord[]
}) {
  const activeStatuses = new Set(['assigned', 'accepted', 'agent_accepted', 'en_route', 'checked_in', 'started', 'in_progress'])
  const completedStatuses = new Set(['completed', 'closed', 'validated'])
  const activeMissions = linked.missions.filter((mission) => activeStatuses.has(text(mission.status).toLowerCase()) || activeStatuses.has(text(mission.lifecycle_stage).toLowerCase()))
  const completedMissions = linked.missions.filter((mission) => completedStatuses.has(text(mission.status).toLowerCase()) || completedStatuses.has(text(mission.lifecycle_stage).toLowerCase()))
  const pendingReports = linked.reports.filter((report) => !['validated', 'approved', 'closed'].includes(text(report.status).toLowerCase()))
  const expiredDocuments = linked.documents.filter((document) => {
    const expiresAt = document.expires_at || document.expiresAt
    return expiresAt && new Date(String(expiresAt)).getTime() < Date.now()
  })
  const openDisputes = linked.disputes.filter((item) => !['resolved', 'rejected', 'closed'].includes(text(item.status).toLowerCase()))
  const openAlerts = linked.alerts.filter((item) => !['acknowledged', 'dismissed', 'resolved', 'closed'].includes(text(item.status).toLowerCase()))

  const allowanceTotal = linked.allowances.reduce((sum, row) => {
    const direct = number(row.amount_mad ?? row.amountMad ?? row.amount ?? row.total_mad ?? row.total ?? 0)
    return sum + direct
  }, 0)

  return {
    activeMissions: activeMissions.length,
    completedMissions: completedMissions.length,
    totalMissions: linked.missions.length,
    pendingReports: pendingReports.length,
    incidents: linked.incidents.length,
    documents: linked.documents.length,
    expiredDocuments: expiredDocuments.length,
    openAlerts: openAlerts.length,
    unreadMessages: linked.messages.filter((item) => !item.read_at && text(item.status, 'sent') !== 'read').length,
    unreadNotifications: linked.notifications.filter((item) => !item.acknowledged_at && text(item.status, 'unread') !== 'acknowledged').length,
    paymentDisputes: openDisputes.length,
    allowanceTotal,
    lastCheckinAt: linked.checkins[0]?.event_time || linked.checkins[0]?.created_at || null,
    lastMissionAt: linked.missions[0]?.mission_date || linked.missions[0]?.created_at || null,
    operationalRisk:
      openAlerts.length || linked.incidents.length || expiredDocuments.length
        ? 'watch'
        : agent.readinessScore >= 70
          ? 'ready'
          : 'pending',
  }
}

export async function listCareLinkOpsAgents() {
  const supabase = await createClient()

  const caregiverColumns = await getTableColumns('caregivers')
  let caregiversQuery = supabase.from('caregivers').select('*').limit(500)

  if (caregiverColumns.has('is_archived')) {
    caregiversQuery = caregiversQuery.eq('is_archived', false)
  }

  if (caregiverColumns.has('updated_at')) {
    caregiversQuery = caregiversQuery.order('updated_at', { ascending: false })
  } else if (caregiverColumns.has('created_at')) {
    caregiversQuery = caregiversQuery.order('created_at', { ascending: false })
  }

  const caregivers = await safeMany(caregiversQuery)

  const ids = caregivers.map((item) => Number(item.id)).filter(Boolean)

  const [missions, checkins, documents, alerts, notifications, messages, disputes] = await Promise.all([
    ids.length ? safeMany(supabase.from('missions').select('*').neq('is_archived', true).not('status', 'in', '(deleted,cancelled,archived)').not('lifecycle_stage', 'in', '(deleted,cancelled,archived)').not('dossier_status', 'in', '(deleted,cancelled,archived)').in('caregiver_id', ids).order('created_at', { ascending: false }).limit(1000)) : Promise.resolve([]),
    ids.length ? safeMany(supabase.from('caregiver_checkins').select('*').in('caregiver_id', ids).order('created_at', { ascending: false }).limit(500)) : Promise.resolve([]),
    ids.length ? safeMany(supabase.from('carelink_agent_documents').select('*').in('caregiver_id', ids).order('created_at', { ascending: false }).limit(500)) : Promise.resolve([]),
    ids.length ? safeMany(supabase.from('carelink_alerts').select('*').in('caregiver_id', ids).order('created_at', { ascending: false }).limit(500)) : Promise.resolve([]),
    ids.length ? safeMany(supabase.from('carelink_notifications').select('*').in('caregiver_id', ids).order('created_at', { ascending: false }).limit(500)) : Promise.resolve([]),
    ids.length ? safeMany(supabase.from('carelink_dispatch_messages').select('*').in('caregiver_id', ids).order('created_at', { ascending: false }).limit(500)) : Promise.resolve([]),
    ids.length ? safeMany(supabase.from('carelink_payment_disputes').select('*').in('caregiver_id', ids).order('created_at', { ascending: false }).limit(500)) : Promise.resolve([]),
  ])

  const missionIds = missions.map((mission) => Number(mission.id)).filter(Boolean)
  const [reports, allowances, events] = await Promise.all([
    missionIds.length ? safeMany(supabase.from('carelink_mission_reports').select('*').in('mission_id', missionIds).order('created_at', { ascending: false }).limit(1000)) : Promise.resolve([]),
    missionIds.length ? safeMany(supabase.from('mission_allowances').select('*').in('mission_id', missionIds).order('created_at', { ascending: false }).limit(1000)) : Promise.resolve([]),
    missionIds.length ? safeMany(supabase.from('mission_events').select('*').in('mission_id', missionIds).order('created_at', { ascending: false }).limit(1000)) : Promise.resolve([]),
  ])

  const agents = caregivers.map((row) => {
    const agent = normalizeAgent(row)
    const linkedMissions = missions.filter((mission) => Number(mission.caregiver_id) === agent.id)
    const linkedMissionIds = new Set(linkedMissions.map((mission) => Number(mission.id)))
    const linked = {
      missions: linkedMissions,
      checkins: checkins.filter((item) => Number(item.caregiver_id) === agent.id),
      incidents: [],
      documents: documents.filter((item) => Number(item.caregiver_id) === agent.id),
      alerts: alerts.filter((item) => Number(item.caregiver_id) === agent.id),
      notifications: notifications.filter((item) => Number(item.caregiver_id) === agent.id),
      messages: messages.filter((item) => Number(item.caregiver_id) === agent.id),
      disputes: disputes.filter((item) => Number(item.caregiver_id) === agent.id),
      reports: reports.filter((item) => linkedMissionIds.has(Number(item.mission_id))),
      allowances: allowances.filter((item) => linkedMissionIds.has(Number(item.mission_id))),
    }
    return {
      ...agent,
      summary: buildAgentSummary(agent, linked),
    }
  })

  return {
    ok: true,
    source: 'live-db',
    generatedAt: nowIso(),
    summary: {
      total: agents.length,
      available: agents.filter((agent) => ['available', 'ready', 'active'].includes(text(agent.status).toLowerCase())).length,
      blocked: agents.filter((agent) => ['blocked', 'archived', 'suspended'].includes(text(agent.status).toLowerCase())).length,
      inMission: agents.filter((agent) => agent.summary.activeMissions > 0).length,
      documentsExpired: agents.reduce((sum, agent) => sum + agent.summary.expiredDocuments, 0),
      alertsOpen: agents.reduce((sum, agent) => sum + agent.summary.openAlerts, 0),
      disputesOpen: agents.reduce((sum, agent) => sum + agent.summary.paymentDisputes, 0),
      unreadMessages: agents.reduce((sum, agent) => sum + agent.summary.unreadMessages, 0),
    },
    agents,
    records: agents,
    live: {
      lastCheckinAt: checkins[0]?.event_time || checkins[0]?.created_at || null,
      lastMessageAt: messages[0]?.created_at || null,
      lastAlertAt: alerts[0]?.created_at || null,
      lastNotificationAt: notifications[0]?.created_at || null,
      lastEventAt: events[0]?.created_at || null,
    },
  }
}

export async function getCareLinkOpsAgentDossier(caregiverId: number) {
  const supabase = await createClient()

  const caregiver = await safeSingle(supabase.from('caregivers').select('*').eq('id', caregiverId).maybeSingle())
  if (!caregiver) throw new Error(`Caregiver #${caregiverId} does not exist`)

  const agent = normalizeAgent(caregiver)

  const [missions, checkins, documents, alerts, notifications, messages, disputes] = await Promise.all([
    safeMany(supabase.from('missions').select('*').neq('is_archived', true).not('status', 'in', '(deleted,cancelled,archived)').not('lifecycle_stage', 'in', '(deleted,cancelled,archived)').not('dossier_status', 'in', '(deleted,cancelled,archived)').eq('caregiver_id', caregiverId).order('created_at', { ascending: false }).limit(500)),
    safeMany(supabase.from('caregiver_checkins').select('*').eq('caregiver_id', caregiverId).order('created_at', { ascending: false }).limit(200)),
    safeMany(supabase.from('carelink_agent_documents').select('*').eq('caregiver_id', caregiverId).order('created_at', { ascending: false }).limit(200)),
    safeMany(supabase.from('carelink_alerts').select('*').eq('caregiver_id', caregiverId).order('created_at', { ascending: false }).limit(200)),
    safeMany(supabase.from('carelink_notifications').select('*').eq('caregiver_id', caregiverId).order('created_at', { ascending: false }).limit(200)),
    safeMany(supabase.from('carelink_dispatch_messages').select('*').eq('caregiver_id', caregiverId).order('created_at', { ascending: false }).limit(200)),
    safeMany(supabase.from('carelink_payment_disputes').select('*').eq('caregiver_id', caregiverId).order('created_at', { ascending: false }).limit(200)),
  ])

  const missionIds = missions.map((mission) => Number(mission.id)).filter(Boolean)

  const [reports, checklistItems, allowances, events] = await Promise.all([
    missionIds.length ? safeMany(supabase.from('carelink_mission_reports').select('*').in('mission_id', missionIds).order('created_at', { ascending: false }).limit(500)) : Promise.resolve([]),
    missionIds.length ? safeMany(supabase.from('carelink_mission_checklist_items').select('*').in('mission_id', missionIds).order('created_at', { ascending: false }).limit(500)) : Promise.resolve([]),
    missionIds.length ? safeMany(supabase.from('mission_allowances').select('*').in('mission_id', missionIds).order('created_at', { ascending: false }).limit(500)) : Promise.resolve([]),
    missionIds.length ? safeMany(supabase.from('mission_events').select('*').in('mission_id', missionIds).order('created_at', { ascending: false }).limit(500)) : Promise.resolve([]),
  ])

  const linked = {
    missions,
    checkins,
    incidents: [],
    documents,
    alerts,
    notifications,
    messages,
    reports,
    disputes,
    allowances,
  }

  return {
    ok: true,
    generatedAt: nowIso(),
    agent,
    summary: buildAgentSummary(agent, linked),
    missions,
    checkins,
    documents,
    alerts,
    notifications,
    messages,
    dispatchThreads: messages,
    paymentDisputes: disputes,
    reports,
    checklistItems,
    allowances,
    events,
    payments: {
      currency: 'MAD',
      totalAllowances: allowances.reduce((sum, row) => sum + number(row.amount_mad ?? row.amount ?? row.total_mad ?? row.total, 0), 0),
      disputes,
      lines: allowances,
    },
    compliance: {
      documents,
      expiredDocuments: documents.filter((document) => {
        const expiresAt = document.expires_at || document.expiresAt
        return expiresAt && new Date(String(expiresAt)).getTime() < Date.now()
      }),
      blockers: documents.filter((document) => ['expired', 'rejected', 'blocked'].includes(text(document.status).toLowerCase())),
    },
    mobile: {
      visibleMissions: missions.filter((mission) => Number(mission.caregiver_id) === caregiverId),
      notifications,
      alerts,
      messages,
      lastCheckinAt: checkins[0]?.event_time || checkins[0]?.created_at || null,
    },
  }
}


async function getTableColumns(table: string) {
  // Keep this conservative and schema-safe. Do not use a custom RPC because it
  // may not exist in the user's Supabase project.
  if (table === 'caregivers') {
    return new Set([
      'id',
      'full_name',
      'name',
      'phone',
      'mobile',
      'city',
      'zone',
      'status',
      'current_status',
      'skills_summary',
      'skill_tags',
      'language_tags',
      'is_archived',
      'created_at',
      'updated_at',
    ])
  }

  return new Set(['id', 'created_at', 'updated_at'])
}

function filterPatchByColumns(patch: AnyRecord, columns: Set<string>) {
  return Object.fromEntries(Object.entries(patch).filter(([key]) => columns.has(key)))
}

export async function createCareLinkOpsAgent(body: AnyRecord) {
  const supabase = await createClient()

  const fullName = text(body.fullName || body.full_name || body.name).trim()
  if (!fullName) throw new Error('Agent fullName is required')

  const patch = compactPatch({
    full_name: fullName,
    phone: text(body.phone || body.mobile),
    email: text(body.email),
    city: text(body.city),
    zone: text(body.zone),
    skills_summary: text(body.skillsSummary || body.skills_summary),
    current_status: text(body.currentStatus || body.current_status || body.status, 'available'),
    status: text(body.status || body.currentStatus || body.current_status || 'available'),
    language_tags: array(body.languageTags || body.language_tags),
    skill_tags: array(body.skillTags || body.skill_tags || body.skills),
    is_archived: false,
  })

  const columns = await getTableColumns('caregivers')
  const safePatch = filterPatchByColumns(patch, columns)

  if (!safePatch.full_name && columns.has('name')) {
    safePatch.name = fullName
  }

  const { data, error } = await supabase.from('caregivers').insert([safePatch]).select('*').maybeSingle()
  if (error) throw new Error(error.message)

  await recordOpsAuditEvent({
    entityType: 'caregiver',
    entityId: String(data.id),
    action: 'agent.created',
    payload: { full_name: fullName, city: safePatch.city || null, zone: safePatch.zone || null },
  })

  return getCareLinkOpsAgentDossier(Number(data.id))
}

export async function updateCareLinkOpsAgent(caregiverId: number, body: AnyRecord) {
  const supabase = await createClient()

  const patch = compactPatch({
    full_name: body.fullName === undefined && body.full_name === undefined ? undefined : text(body.fullName || body.full_name),
    phone: body.phone === undefined ? undefined : text(body.phone),
    email: body.email === undefined ? undefined : text(body.email),
    city: body.city === undefined ? undefined : text(body.city),
    zone: body.zone === undefined ? undefined : text(body.zone),
    skills_summary: body.skillsSummary === undefined && body.skills_summary === undefined ? undefined : text(body.skillsSummary || body.skills_summary),
    current_status: body.currentStatus === undefined && body.current_status === undefined ? undefined : text(body.currentStatus || body.current_status),
    status: body.status === undefined ? undefined : text(body.status),
    language_tags: body.languageTags === undefined && body.language_tags === undefined ? undefined : array(body.languageTags || body.language_tags),
    skill_tags: body.skillTags === undefined && body.skill_tags === undefined && body.skills === undefined ? undefined : array(body.skillTags || body.skill_tags || body.skills),
  })

  const columns = await getTableColumns('caregivers')
  const safePatch = filterPatchByColumns(patch, columns)

  if (!Object.keys(safePatch).length) return getCareLinkOpsAgentDossier(caregiverId)

  const { error } = await supabase.from('caregivers').update(safePatch).eq('id', caregiverId)
  if (error) throw new Error(error.message)

  await recordOpsAuditEvent({
    entityType: 'caregiver',
    entityId: String(caregiverId),
    action: 'agent.updated',
    payload: safePatch,
  })

  return getCareLinkOpsAgentDossier(caregiverId)
}

export async function archiveCareLinkOpsAgent(caregiverId: number, reason?: string | null) {
  const supabase = await createClient()

  const columns = await getTableColumns('caregivers')
  const archivePatch = filterPatchByColumns({
    is_archived: true,
    current_status: 'archived',
    status: 'archived',
  }, columns)

  const { error } = await supabase
    .from('caregivers')
    .update(archivePatch)
    .eq('id', caregiverId)

  if (error) throw new Error(error.message)

  await recordOpsAuditEvent({
    entityType: 'caregiver',
    entityId: String(caregiverId),
    action: 'agent.archived',
    severity: 'warning',
    payload: { reason: reason || null },
  })

  return { ok: true, caregiverId, archived: true }
}

export async function createAgentAlert(caregiverId: number, body: AnyRecord) {
  return createOpsAlert({
    caregiverId,
    missionId: body.missionId == null ? null : positiveId(body.missionId),
    type: text(body.type, 'agent_alert'),
    title: text(body.title, 'Alerte agent'),
    body: text(body.body || body.message, 'Alerte opérationnelle agent.'),
    priority: text(body.priority, 'normal'),
    metadata: typeof body.metadata === 'object' && body.metadata ? body.metadata : {},
  })
}

export async function sendAgentDispatchMessage(caregiverId: number, body: AnyRecord) {
  return notifyOpsAgent({
    caregiverId,
    missionId: body.missionId == null ? null : positiveId(body.missionId),
    subject: text(body.subject, 'CareLink Ops'),
    body: text(body.body || body.message, 'Message de coordination CareLink Ops.'),
    priority: text(body.priority, 'normal'),
    metadata: typeof body.metadata === 'object' && body.metadata ? body.metadata : {},
  })
}
