import { createClient } from '@supabase/supabase-js'

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

function env(name: string) {
  return process.env[name]
}

async function getSupabase() {
  const url = env('NEXT_PUBLIC_SUPABASE_URL')
  const key = env('SUPABASE_SERVICE_ROLE_KEY') || env('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (!url || !key) throw new Error('Supabase env missing')
  return createClient(url, key, { auth: { persistSession: false } })
}

function text(value: unknown, fallback = '') {
  return value === null || value === undefined || value === '' ? fallback : String(value)
}

function statusOf(row: AnyRecord) {
  const raw = text(row.lifecycle_stage || row.status || row.dispatch_status || 'created').toLowerCase()
  if (raw.includes('progress')) return 'in_progress'
  if (raw.includes('route')) return 'en_route'
  if (raw.includes('accepted') || raw.includes('confirm')) return 'accepted'
  if (raw.includes('assign')) return 'assigned'
  if (raw.includes('report')) return 'report_pending'
  if (raw.includes('valid')) return 'validation'
  if (raw.includes('complete') || raw.includes('closed')) return 'completed'
  if (raw.includes('risk') || raw.includes('incident')) return 'at_risk'
  return row.caregiver_id ? 'assigned' : 'created'
}

function riskOf(row: AnyRecord) {
  const raw = text(row.risk_level || row.urgency || 'normal').toLowerCase()
  if (raw.includes('high') || raw.includes('urgent') || raw.includes('critical')) return 'high'
  if (raw.includes('medium') || raw.includes('warning')) return 'medium'
  return 'normal'
}

function missionCode(row: AnyRecord) {
  return resolvedMissionCode(row)
}

function normalizeMission(row: AnyRecord) {
  const family = row.families || row.family || {}
  const caregiver = row.caregivers || row.caregiver || {}
  const status = statusOf(row)
  const risk = riskOf(row)
  const scheduledStart = row.scheduled_start || row.mission_date || row.created_at

  return {
    ...row,
    id: row.id,
    missionId: row.id,
    mission_id: row.id,
    code: missionCode(row),
    missionCode: missionCode(row),
    mission_code: missionCode(row),
    mission_reference: missionCode(row),
    reference: missionCode(row),
    title: row.service_type || row.designation || 'Mission dossier',
    serviceType: row.service_type || row.designation || 'Mission dossier',
    service_type: row.service_type || row.designation || 'Mission dossier',
    familyId: row.family_id,
    familyName: family.full_name || family.name || row.client_name || `Family #${row.family_id || '—'}`,
    clientName: family.full_name || family.name || row.client_name || `Family #${row.family_id || '—'}`,
    caregiverId: row.caregiver_id,
    agentId: row.caregiver_id,
    caregiverName: caregiver.full_name || caregiver.name || row.agent_name || (row.caregiver_id ? `Agent #${row.caregiver_id}` : 'Unassigned'),
    agentName: caregiver.full_name || caregiver.name || row.agent_name || (row.caregiver_id ? `Agent #${row.caregiver_id}` : 'Unassigned'),
    city: row.city || family.city || '—',
    zone: row.zone || family.zone || '—',
    status,
    lifecycleStage: status,
    lifecycle_stage: status,
    dispatchStatus: row.dispatch_status || status,
    dispatch_status: row.dispatch_status || status,
    riskLevel: risk,
    risk_level: risk,
    scheduledStart,
    scheduled_start: scheduledStart,
    scheduledEnd: row.scheduled_end || scheduledStart,
    createdAt: row.created_at,
    created_at: row.created_at,
  }
}

function buildLanes(missions: AnyRecord[]) {
  const keys = [
    ['created', 'New requests'],
    ['assigned', 'Assigned'],
    ['accepted', 'Accepted'],
    ['en_route', 'En route'],
    ['in_progress', 'In progress'],
    ['report_pending', 'Report pending'],
    ['validation', 'Validation'],
    ['at_risk', 'At risk'],
    ['completed', 'Completed'],
  ]

  return keys.map(([key, label]) => {
    const items = missions.filter((mission) => mission.status === key || mission.lifecycleStage === key)
    return { key, label, count: items.length, items }
  })
}

export async function getCareLinkOpsLiveMissionBridge() {
  const supabase = await getSupabase()

  const { data, error } = await supabase
    .from('missions')
    .select(`
      *,
      families:family_id(*),
      caregivers:caregiver_id(*)
    `)
    .order('created_at', { ascending: false })
    .limit(500)

  let rows = data || []

  if (error) {
    const fallback = await supabase
      .from('missions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)

    if (fallback.error) throw fallback.error
    rows = fallback.data || []
  }

  const missions = rows.map(normalizeMission)
  const todayIso = new Date().toISOString().slice(0, 10)
  const today = missions.filter((mission) => String(mission.scheduledStart || '').slice(0, 10) === todayIso)
  const active = missions.filter((mission) => ['assigned', 'accepted', 'en_route', 'in_progress'].includes(mission.status))
  const inProgress = missions.filter((mission) => ['en_route', 'in_progress'].includes(mission.status))
  const atRisk = missions.filter((mission) => mission.status === 'at_risk' || mission.riskLevel === 'high')
  const unassigned = missions.filter((mission) => !mission.caregiverId)
  const reportsPending = missions.filter((mission) => ['report_pending', 'validation'].includes(mission.status))
  const completed = missions.filter((mission) => mission.status === 'completed')

  const lanes = buildLanes(missions)

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    missions,
    records: missions,
    dossiers: missions,
    lanes,
    dispatchLanes: lanes,
    workflow: lanes,
    board: lanes,
    queue: missions,
    mapMarkers: missions
      .filter((mission) => mission.city && mission.city !== '—')
      .map((mission) => ({
        id: mission.id,
        label: mission.code,
        city: mission.city,
        zone: mission.zone,
        status: mission.status,
        riskLevel: mission.riskLevel,
        mission,
      })),
    summary: {
      total: missions.length,
      missionsToday: today.length,
      inProgress: inProgress.length,
      active: active.length,
      atRisk: atRisk.length,
      unassigned: unassigned.length,
      assigned: active.length,
      agentsAvailable: 0,
      incidentsOpen: 0,
      reportsPending: reportsPending.length,
      complianceBlockers: 0,
      completed: completed.length,
    },
    metrics: {
      missionsToday: today.length,
      inProgress: inProgress.length,
      atRisk: atRisk.length,
      unassigned: unassigned.length,
      agentsAvailable: 0,
      incidentsOpen: 0,
      reportsPending: reportsPending.length,
      complianceBlockers: 0,
    },
  }
}
