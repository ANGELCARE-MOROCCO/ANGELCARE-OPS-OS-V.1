'use client'

import AngelCareLogo from "@/components/brand/AngelCareLogo";
import { resolvedMissionCode } from '@/lib/missions/mission-codes'
type AnyRecord = Record<string, any>


function __missionIsLiveVisible(row: any) {
  if (!row) return false
  const status = String(row.status || row.lifecycle_stage || row.lifecycleStage || row.dossier_status || row.dossierStatus || '').toLowerCase()
  if (row.is_archived === true || row.isArchived === true) return false
  if (status.includes('deleted') || status.includes('archived') || status.includes('cancelled')) return false
  return true
}

function __filterLiveVisibleMissions<T = any>(rows: T[] | null | undefined): T[] {
  return Array.isArray(rows) ? rows.filter((row: any) => __missionIsLiveVisible(row)) : []
}


function __carelinkFinalLiveVisible(row: any) {
  if (!row) return false
  const status = String(
    row.status ||
    row.lifecycle_stage ||
    row.lifecycleStage ||
    row.dossier_status ||
    row.dossierStatus ||
    row.dispatchStatus ||
    row.dispatch_status ||
    ''
  ).toLowerCase()

  if (row.is_archived === true || row.isArchived === true) return false
  if (status.includes('deleted') || status.includes('archived') || status.includes('cancelled')) return false
  return true
}

function __carelinkFinalLiveRows<T = any>(rows: T[] | null | undefined): T[] {
  return Array.isArray(rows) ? rows.filter((row: any) => __carelinkFinalLiveVisible(row)) : []
}

function __carelinkText(value: unknown, fallback = '') {
  return value === null || value === undefined || value === '' ? fallback : String(value)
}


function __carelinkMissionIsVisible(row: any) {
  if (!row) return false
  const status = String(
    row.status ||
    row.lifecycle_stage ||
    row.lifecycleStage ||
    row.dossier_status ||
    row.dossierStatus ||
    ''
  ).toLowerCase()

  if (row.is_archived === true || row.isArchived === true) return false
  if (status.includes('deleted')) return false
  if (status.includes('archived')) return false
  if (status.includes('cancelled')) return false
  return true
}

function __carelinkFilterVisibleMissions(rows: any[]) {
  return Array.isArray(rows) ? rows.filter(__carelinkMissionIsVisible) : []
}

function __carelinkStatus(row: AnyRecord) {
  const raw = __carelinkText(row.status || row.lifecycleStage || row.lifecycle_stage || row.dispatchStatus || row.dispatch_status || 'created').toLowerCase()
  if (raw.includes('progress')) return 'in_progress'
  if (raw.includes('route')) return 'en_route'
  if (raw.includes('accepted') || raw.includes('confirm')) return 'accepted'
  if (raw.includes('assign')) return 'assigned'
  if (raw.includes('report')) return 'report_pending'
  if (raw.includes('valid')) return 'validation'
  if (raw.includes('complete') || raw.includes('closed')) return 'completed'
  if (raw.includes('risk') || raw.includes('incident')) return 'at_risk'
  return row.caregiver_id || row.caregiverId ? 'assigned' : 'created'
}



function __carelinkIsoDate(value: unknown) {
  if (!value) return ''
  const raw = String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function __carelinkMissionDateValue(row: AnyRecord) {
  return (
    row?.mission_date ||
    row?.missionDate ||
    row?.scheduled_date ||
    row?.scheduledDate ||
    row?.date ||
    row?.scheduled_start ||
    row?.scheduledStart ||
    row?.scheduled_at ||
    row?.scheduledAt ||
    row?.created_at ||
    row?.createdAt ||
    ''
  )
}

function __carelinkMissionDayKey(row: AnyRecord) {
  return __carelinkIsoDate(__carelinkMissionDateValue(row))
}

function __carelinkMissionMatchesDay(row: AnyRecord, dayKey: string) {
  if (!dayKey) return true
  const missionKey = __carelinkMissionDayKey(row)
  return !missionKey ? true : missionKey === dayKey
}


function __carelinkMissionUniqueKey(row: AnyRecord, index = 0) {
  return String(
    row?.id ||
    row?.mission_id ||
    row?.missionId ||
    row?.mission_reference ||
    row?.missionReference ||
    row?.dossier_reference ||
    row?.dossierReference ||
    row?.code ||
    `mission-${index}`
  )
}

function __carelinkCollectOverviewMissions(payload: any) {
  const sourceBuckets = [
    payload?.missions,
    payload?.missionRows,
    payload?.missionRegistry,
    payload?.missionPoints,
    payload?.mapPoints,
    payload?.markers,
    payload?.points,
    payload?.liveMissions,
    payload?.todayMissions,
    payload?.dispatchMissions,
  ]

  const laneRows = Array.isArray(payload?.lanes)
    ? payload.lanes.flatMap((lane: any) =>
        Array.isArray(lane?.items)
          ? lane.items
          : Array.isArray(lane?.missions)
            ? lane.missions
            : []
      )
    : []

  const rows = [...laneRows]

  for (const bucket of sourceBuckets) {
    if (Array.isArray(bucket)) rows.push(...bucket)
  }

  if (payload?.selectedMission) rows.push(payload.selectedMission)
  if (payload?.activeMission) rows.push(payload.activeMission)
  if (payload?.mission) rows.push(payload.mission)

  const seen = new Set<string>()
  return rows
    .filter(Boolean)
    .filter((row: any, index: number) => {
      const key = __carelinkMissionUniqueKey(row, index)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function __carelinkLaneKeyForMission(row: AnyRecord) {
  const status = __carelinkText(row?.status || row?.lifecycle_stage || row?.lifecycleStage || row?.dispatchStatus || row?.dispatch_status || 'created').toLowerCase()

  if (status.includes('complete') || status.includes('closed')) return 'completed'
  if (status.includes('valid')) return 'validation'
  if (status.includes('report')) return 'report_pending'
  if (status.includes('risk') || status.includes('incident')) return 'at_risk'
  if (status.includes('progress') || status.includes('started')) return 'in_progress'
  if (status.includes('route') || status.includes('travel')) return 'en_route'
  if (status.includes('accepted') || status.includes('confirm')) return 'accepted'
  if (status.includes('assign') || row?.caregiver_id || row?.caregiverId || row?.assignedAgent) return 'assigned'
  return 'unassigned'
}

function __carelinkMergeFallbackLanes(lanes: any[], rows: any[]) {
  const base = Array.isArray(lanes) ? lanes : []
  const known = new Map<string, any>()

  for (const lane of base) {
    const key = String(lane?.key || lane?.id || lane?.label || '').toLowerCase()
    if (!key) continue
    known.set(key, {
      ...lane,
      items: Array.isArray(lane?.items)
        ? [...lane.items]
        : Array.isArray(lane?.missions)
          ? [...lane.missions]
          : [],
    })
  }

  const blueprints = [
    ['unassigned', 'Unassigned'],
    ['assigned', 'Assigned'],
    ['accepted', 'Accepted'],
    ['en_route', 'En route'],
    ['in_progress', 'In progress'],
    ['report_pending', 'Report pending'],
    ['validation', 'Validation'],
    ['at_risk', 'At risk'],
    ['completed', 'Completed'],
  ]

  for (const [key, label] of blueprints) {
    if (!known.has(key)) known.set(key, { key, label, items: [] })
  }

  const existingMissionKeys = new Set<string>()
  for (const lane of known.values()) {
    for (const item of lane.items || []) {
      existingMissionKeys.add(__carelinkMissionUniqueKey(item))
    }
  }

  for (const row of rows) {
    const key = __carelinkMissionUniqueKey(row)
    if (existingMissionKeys.has(key)) continue
    const laneKey = __carelinkLaneKeyForMission(row)
    const lane = known.get(laneKey) || known.get('unassigned')
    lane.items.push(row)
    existingMissionKeys.add(key)
  }

  return Array.from(known.values())
}

function __carelinkFormatHumanDay(dayKey: string) {
  if (!dayKey) return 'All dates'
  const dt = new Date(`${dayKey}T12:00:00`)
  if (Number.isNaN(dt.getTime())) return dayKey
  return dt.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function __carelinkDayWindow(centerKey: string, count = 7) {
  const base = new Date(`${centerKey || new Date().toISOString().slice(0, 10)}T12:00:00`)
  const days = []
  const half = Math.floor(count / 2)
  for (let i = -half; i <= half; i += 1) {
    const copy = new Date(base)
    copy.setDate(copy.getDate() + i)
    const key = copy.toISOString().slice(0, 10)
    days.push({
      key,
      weekday: copy.toLocaleDateString('en-GB', { weekday: 'short' }),
      label: copy.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      dayNumber: copy.toLocaleDateString('en-GB', { day: '2-digit' }),
      isToday: key === new Date().toISOString().slice(0, 10),
    })
  }
  return days
}

function __carelinkExcerpt(value: unknown, max = 96) {
  const text = __carelinkText(value, '')
  if (!text) return 'No operational notes recorded yet.'
  return text.length > max ? `${text.slice(0, max).trim()}…` : text
}

function __carelinkFlattenLiveSource(input: any) {
  const source = input || {}
  const nested =
    source.data ||
    source.payload ||
    source.live ||
    source.dashboard ||
    source.bridge ||
    source.result ||
    {}

  const missions =
    Array.isArray(source.missions) ? source.missions :
    Array.isArray(source.records) ? source.records :
    Array.isArray(source.dossiers) ? source.dossiers :
    Array.isArray(nested.missions) ? nested.missions :
    Array.isArray(nested.records) ? nested.records :
    Array.isArray(nested.dossiers) ? nested.dossiers :
    Array.isArray(nested.items) ? nested.items :
    []

  const lanes =
    Array.isArray(source.lanes) ? source.lanes :
    Array.isArray(source.dispatchLanes) ? source.dispatchLanes :
    Array.isArray(nested.lanes) ? nested.lanes :
    Array.isArray(nested.dispatchLanes) ? nested.dispatchLanes :
    []

  return {
    ...nested,
    ...source,
    missions,
    records: missions,
    dossiers: missions,
    lanes,
    summary: { ...(nested.summary || {}), ...(source.summary || {}) },
    metrics: { ...(nested.metrics || {}), ...(source.metrics || {}) },
  }
}


function __carelinkMissionNumericId(mission: any) {
  const raw = mission?.id ?? mission?.missionId ?? mission?.mission_id ?? mission?.parent_mission_id
  const parsed = Number(raw)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}


function __carelinkDateKey(row: AnyRecord) {
  const raw =
    row.mission_date ||
    row.missionDate ||
    row.scheduledStart ||
    row.scheduled_start ||
    row.scheduled_at ||
    row.createdAt ||
    row.created_at ||
    ''

  if (!raw) return new Date().toISOString().slice(0, 10)
  const parsed = new Date(String(raw))
  if (Number.isNaN(parsed.getTime())) return String(raw).slice(0, 10)
  return parsed.toISOString().slice(0, 10)
}

function __carelinkBlockForStatus(status: unknown) {
  const raw = __carelinkText(status, '').toLowerCase()
  if (raw.includes('risk') || raw.includes('incident')) return 'risk'
  if (raw.includes('route') || raw.includes('progress')) return 'progress'
  if (raw.includes('complete') || raw.includes('closed')) return 'done'
  if (raw.includes('assign') || raw.includes('accepted')) return 'booked'
  if (raw.includes('report') || raw.includes('valid')) return 'gap'
  return 'empty'
}

function __carelinkDerivedAgents(missions: AnyRecord[]) {
  const map = new Map<string, any>()

  for (const mission of missions) {
    const caregiverId = __carelinkText(mission.caregiver_id || mission.caregiverId || mission.agentId || mission.agent_id, '')
    const caregiverName = __carelinkText(
      mission.caregiverName ||
      mission.agentName ||
      mission.assignedAgent ||
      mission.agent_name,
      caregiverId ? `Agent #${caregiverId}` : ''
    )

    if (!caregiverId && !caregiverName) continue

    const key = caregiverId || caregiverName
    const current = map.get(key) || {
      id: key,
      fullName: caregiverName || `Agent #${caregiverId}`,
      city: __carelinkText(mission.city, '—'),
      zone: __carelinkText(mission.zone, '—'),
      status: 'assigned',
      readinessScore: 78,
      skills: [],
      missionCount: 0,
      activeCount: 0,
      riskCount: 0,
    }

    const service = __carelinkText(mission.serviceType || mission.service_type || mission.title, '')
    if (service && !current.skills.includes(service)) current.skills.push(service)

    current.missionCount += 1

    const status = __carelinkText(mission.status || mission.lifecycleStage || mission.lifecycle_stage, '').toLowerCase()
    if (status.includes('route') || status.includes('progress') || status.includes('assigned')) current.activeCount += 1
    if (status.includes('risk') || __carelinkText(mission.riskLevel || mission.risk_level, '').toLowerCase().includes('high')) current.riskCount += 1

    current.readinessScore = Math.max(42, Math.min(98, 84 - current.riskCount * 12 + current.activeCount * 2))
    current.status = current.riskCount ? 'risk review' : current.activeCount ? 'assigned' : 'available'

    map.set(key, current)
  }

  return Array.from(map.values())
}

function __carelinkDerivedCoverage(missions: AnyRecord[]) {
  const map = new Map<string, any>()

  for (const mission of missions) {
    const dateKey = __carelinkDateKey(mission)
    const city = __carelinkText(mission.city, 'Unassigned city')
    const zone = __carelinkText(mission.zone, 'All zones')
    const key = `${dateKey}-${city}-${zone}`

    const current = map.get(key) || {
      id: key,
      label: `${city} · ${zone}`,
      city,
      zone,
      dateKey,
      load: '0 mission(s)',
      missionCount: 0,
      blocks: [],
    }

    current.missionCount += 1
    current.blocks.push(__carelinkBlockForStatus(mission.status || mission.lifecycleStage || mission.lifecycle_stage))

    while (current.blocks.length < 10) current.blocks.push('empty')
    current.blocks = current.blocks.slice(0, 10)
    current.load = `${current.missionCount} mission(s)`

    map.set(key, current)
  }

  return Array.from(map.values())
}

function __carelinkDerivedIncidents(missions: AnyRecord[]) {
  return missions
    .filter((mission) => {
      const status = __carelinkText(mission.status || mission.lifecycleStage || mission.lifecycle_stage, '').toLowerCase()
      const risk = __carelinkText(mission.riskLevel || mission.risk_level || mission.risk, '').toLowerCase()
      const urgency = __carelinkText(mission.urgency || mission.priority || mission.opsPriority || mission.ops_priority, '').toLowerCase()
      return status.includes('risk') || status.includes('incident') || risk.includes('high') || urgency.includes('urgent') || urgency.includes('critical')
    })
    .map((mission, index) => ({
      id: mission.id || `incident-${index}`,
      title: `Mission risk · ${mission.code || mission.mission_reference || mission.dossier_reference || `M-${mission.id}`}`,
      detail: `${mission.serviceType || mission.service_type || 'Mission'} · ${mission.familyName || mission.clientName || `Family #${mission.family_id || mission.familyId || '—'}`} · ${mission.city || 'No city'} ${mission.zone || ''}`,
      severity: __carelinkText(mission.riskLevel || mission.risk_level || mission.urgency || mission.priority, 'risk'),
      status: __carelinkText(mission.status || mission.lifecycleStage || mission.lifecycle_stage, 'open'),
      missionId: mission.id,
    }))
}

function __carelinkDerivedReports(missions: AnyRecord[]) {
  return missions
    .filter((mission) => {
      const status = __carelinkText(mission.status || mission.lifecycleStage || mission.lifecycle_stage || mission.reportStatus || mission.report_status, '').toLowerCase()
      return status.includes('report') || status.includes('valid') || status.includes('pending')
    })
    .map((mission, index) => ({
      id: mission.id || `report-${index}`,
      missionCode: mission.code || mission.mission_reference || mission.dossier_reference || `M-${mission.id}`,
      clientLabel: mission.familyName || mission.clientName || `Family #${mission.family_id || mission.familyId || '—'}`,
      agentLabel: mission.caregiverName || mission.agentName || (mission.caregiver_id || mission.caregiverId ? `Agent #${mission.caregiver_id || mission.caregiverId}` : 'Unassigned'),
      reportType: 'Mission validation',
      status: __carelinkText(mission.status || mission.lifecycleStage || mission.lifecycle_stage, 'pending'),
      missionId: mission.id,
    }))
}

function __carelinkDerivedFollowUps(missions: AnyRecord[]) {
  const items: any[] = []

  for (const mission of missions) {
    const code = mission.code || mission.mission_reference || mission.dossier_reference || `M-${mission.id}`
    const client = mission.familyName || mission.clientName || `Family #${mission.family_id || mission.familyId || '—'}`
    const status = __carelinkText(mission.status || mission.lifecycleStage || mission.lifecycle_stage, '').toLowerCase()
    const hasCaregiver = Boolean(mission.caregiver_id || mission.caregiverId || mission.caregiverName || mission.agentName)
    const risk = __carelinkText(mission.riskLevel || mission.risk_level || mission.risk, '').toLowerCase()

    if (!hasCaregiver) {
      items.push({
        id: `assign-${mission.id || code}`,
        title: `Assign caregiver · ${code}`,
        helper: `${client} needs a confirmed caregiver before dispatch.`,
        status: 'pending assignment',
        priority: 'urgent',
        value: 'Assign',
        missionId: mission.id,
      })
    }

    if (status.includes('report') || status.includes('valid')) {
      items.push({
        id: `report-${mission.id || code}`,
        title: `Validate report · ${code}`,
        helper: `${client} has a mission report requiring supervisor validation.`,
        status: 'pending validation',
        priority: 'review',
        value: 'Review',
        missionId: mission.id,
      })
    }

    if (status.includes('risk') || risk.includes('high')) {
      items.push({
        id: `risk-${mission.id || code}`,
        title: `Escalate risk · ${code}`,
        helper: `${client} has an operational risk signal requiring immediate follow-up.`,
        status: 'risk',
        priority: 'critical',
        value: 'Escalate',
        missionId: mission.id,
      })
    }
  }

  return items
}


function __carelinkHydrateOpsDashboardPayload(payload: any) {
  const source = __carelinkFlattenLiveSource(payload)
  const missions = Array.isArray(source.missions) ? source.missions
    : Array.isArray(source.records) ? source.records
    : Array.isArray(source.dossiers) ? source.dossiers
    : Array.isArray(source.data?.missions) ? source.data.missions
    : []

  const normalized = __carelinkFinalLiveRows(missions).map((row: AnyRecord) => {
    const status = __carelinkStatus(row)
    return {
      ...row,
      id: row.id,
      code: resolvedMissionCode(row),
      title: row.title || row.serviceType || row.service_type || 'Mission dossier',
      serviceType: row.serviceType || row.service_type || row.title || 'Mission dossier',
      familyName: row.familyName || row.clientName || row.client_name || `Family #${row.family_id || row.familyId || '—'}`,
      clientName: row.clientName || row.familyName || row.client_name || `Family #${row.family_id || row.familyId || '—'}`,
      caregiverName: row.caregiverName || row.agentName || row.agent_name || (row.caregiver_id || row.caregiverId ? `Agent #${row.caregiver_id || row.caregiverId}` : 'Unassigned'),
      agentName: row.agentName || row.caregiverName || row.agent_name || (row.caregiver_id || row.caregiverId ? `Agent #${row.caregiver_id || row.caregiverId}` : 'Unassigned'),
      city: row.city || '—',
      zone: row.zone || '—',
      status,
      lifecycleStage: status,
      dispatchStatus: row.dispatchStatus || row.dispatch_status || status,
      riskLevel: row.riskLevel || row.risk_level || 'normal',
      scheduledStart: row.scheduledStart || row.scheduled_start || row.mission_date || row.created_at,
      scheduledEnd: row.scheduledEnd || row.scheduled_end || row.mission_date || row.created_at,
      createdAt: row.createdAt || row.created_at,
    }
  })

  const todayIso = new Date().toISOString().slice(0, 10)
  const today = normalized.filter((m: AnyRecord) => String(m.scheduledStart || '').slice(0, 10) === todayIso)
  const inProgress = normalized.filter((m: AnyRecord) => ['en_route', 'in_progress'].includes(m.status))
  const active = normalized.filter((m: AnyRecord) => ['assigned', 'accepted', 'en_route', 'in_progress'].includes(m.status))
  const atRisk = normalized.filter((m: AnyRecord) => m.status === 'at_risk' || String(m.riskLevel).toLowerCase() === 'high')
  const unassigned = normalized.filter((m: AnyRecord) => !m.caregiver_id && !m.caregiverId)
  const reportsPending = normalized.filter((m: AnyRecord) => ['report_pending', 'validation'].includes(m.status))

  const derivedAgents = __carelinkDerivedAgents(normalized)
  const derivedCoverage = __carelinkDerivedCoverage(normalized)
  const derivedIncidents = __carelinkDerivedIncidents(normalized)
  const derivedReports = __carelinkDerivedReports(normalized)
  const derivedFollowUps = __carelinkDerivedFollowUps(normalized)

  const lanes = [
    ['created', 'Unassigned'],
    ['assigned', 'Assigned'],
    ['accepted', 'Accepted'],
    ['en_route', 'En route'],
    ['in_progress', 'In progress'],
    ['report_pending', 'Report pending'],
    ['validation', 'Validation'],
    ['at_risk', 'At risk'],
    ['completed', 'Completed'],
  ].map(([key, label]) => {
    const items = normalized.filter((m: AnyRecord) => m.status === key)
    return { key, label, count: items.length, items, missions: items }
  })

  return {
    ...source,
    missions: normalized,
    records: normalized,
    dossiers: normalized,
    lanes,
    dispatchLanes: lanes,
    workflow: lanes,
    board: lanes,
    mapMarkers: normalized.filter((m: AnyRecord) => m.city && m.city !== '—'),
    agents: Array.isArray(source.agents) && source.agents.length ? source.agents : derivedAgents,
    coverage: Array.isArray(source.coverage) && source.coverage.length ? source.coverage : derivedCoverage,
    incidents: Array.isArray(source.incidents) && source.incidents.length ? source.incidents : derivedIncidents,
    reports: Array.isArray(source.reports) && source.reports.length ? source.reports : derivedReports,
    followUps: Array.isArray(source.followUps) && source.followUps.length ? source.followUps : derivedFollowUps,
    summary: {
      ...(source.summary || {}),
      total: normalized.length,
      missionsToday: today.length,
      inProgress: inProgress.length,
      active: active.length,
      atRisk: atRisk.length,
      unassigned: unassigned.length,
      assigned: active.length,
      reportsPending: reportsPending.length,
      agentsAvailable: source.summary?.agentsAvailable || derivedAgents.filter((agent: any) => String(agent.status || '').toLowerCase().includes('available')).length || derivedAgents.length,
      incidentsOpen: source.summary?.incidentsOpen || derivedIncidents.length,
      complianceBlockers: source.summary?.complianceBlockers || 0,
    },
    metrics: {
      ...(source.metrics || {}),
      missionsToday: today.length,
      inProgress: inProgress.length,
      atRisk: atRisk.length,
      unassigned: unassigned.length,
      agentsAvailable: source.metrics?.agentsAvailable || derivedAgents.filter((agent: any) => String(agent.status || '').toLowerCase().includes('available')).length || derivedAgents.length,
      incidentsOpen: source.metrics?.incidentsOpen || derivedIncidents.length,
      reportsPending: reportsPending.length,
      complianceBlockers: source.metrics?.complianceBlockers || 0,
    },
  }
}




import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { CareLinkCreateMissionDossierModal } from '@/components/carelink/ops/missions/CareLinkCreateMissionDossierModal'
import { CareLinkOpsMissionRadarMap } from '@/components/carelink/ops/CareLinkOpsMissionRadarMap'
import type { ReactNode } from 'react'
import type {
  CareLinkAgent,
  CareLinkCity,
  CareLinkCoverageRow,
  CareLinkIncident,
  CareLinkKpi,
  CareLinkLane,
  CareLinkMission,
  CareLinkReport,
  CareLinkZone,
  OpsDashboardPayload,
} from '@/lib/carelink/ops-dashboard-data'

type ModalState =
  | { type: 'none' }
  | { type: 'kpi'; item: CareLinkKpi }
  | { type: 'mission'; item: CareLinkMission & { lane?: string } }
  | { type: 'agent'; item: CareLinkAgent }
  | { type: 'incident'; item: CareLinkIncident }
  | { type: 'report'; item: CareLinkReport }
  | { type: 'coverage'; item: CareLinkCoverageRow }
  | { type: 'zone'; item: CareLinkCity | CareLinkZone }
  | { type: 'command'; title: string; detail: string }

const emptyPayload: OpsDashboardPayload = {
  ok: true,
  source: 'live-empty',
  generatedAt: '1970-01-01T00:00:00.000Z',
  kpis: [],
  lanes: [],
  cities: [],
  zones: [],
  agents: [],
  coverage: [],
  incidents: [],
  reports: [],
  followUps: [],
}

const defaultLanes: CareLinkLane[] = [
  { key: 'unassigned', label: 'Unassigned', count: 0, tone: 'slate', items: [] },
  { key: 'assigned', label: 'Assigned', count: 0, tone: 'blue', items: [] },
  { key: 'accepted', label: 'Accepted', count: 0, tone: 'violet', items: [] },
  { key: 'en_route', label: 'En route', count: 0, tone: 'cyan', items: [] },
  { key: 'in_progress', label: 'In progress', count: 0, tone: 'green', items: [] },
  { key: 'report_pending', label: 'Report pending', count: 0, tone: 'amber', items: [] },
  { key: 'validation', label: 'Validation', count: 0, tone: 'violet', items: [] },
  { key: 'at_risk', label: 'At risk', count: 0, tone: 'red', items: [] },
]

const navItems = []
const toneClasses: Record<string, string> = {
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  red: 'border-rose-200 bg-rose-50 text-rose-700',
  violet: 'border-violet-200 bg-violet-50 text-violet-700',
  cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function normalizePayload(payload: Partial<OpsDashboardPayload> | null | undefined): OpsDashboardPayload {
  const source = payload || emptyPayload
  const rawLanes = asArray<CareLinkLane>((source as any).lanes).length
    ? asArray<CareLinkLane>((source as any).lanes)
    : defaultLanes

  return {
    ok: Boolean(source.ok ?? true),
    source: source.source || 'live-empty',
    generatedAt: typeof source.generatedAt === 'string' ? source.generatedAt : '1970-01-01T00:00:00.000Z',
    kpis: asArray<CareLinkKpi>((source as any).kpis),
    lanes: rawLanes.map((lane) => ({
      key: String(lane.key || lane.label || 'lane'),
      label: String(lane.label || lane.key || 'Lane'),
      count: Number.isFinite(Number(lane.count)) ? Number(lane.count) : asArray<CareLinkMission>((lane as any).items).length,
      tone: lane.tone || 'slate',
      items: asArray<CareLinkMission>((lane as any).items),
    })),
    cities: asArray<CareLinkCity>((source as any).cities),
    zones: asArray<CareLinkZone>((source as any).zones),
    agents: asArray<CareLinkAgent>((source as any).agents),
    coverage: asArray<CareLinkCoverageRow>((source as any).coverage),
    incidents: asArray<CareLinkIncident>((source as any).incidents),
    reports: asArray<CareLinkReport>((source as any).reports),
    followUps: asArray((source as any).followUps),
  }
}


type MissionMapBucket = {
  key: string
  city: string
  lat: number
  lng: number
  total: number
  upcoming: number
  active: number
  cancelled: number
  missions: any[]
  color: string
}

const MOROCCO_CITY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  RABAT: { lat: 34.020882, lng: -6.841650 },
  SALE: { lat: 34.0331, lng: -6.7985 },
  TEMARA: { lat: 33.9287, lng: -6.9066 },
  CASABLANCA: { lat: 33.5731, lng: -7.5898 },
  MOHAMMEDIA: { lat: 33.6861, lng: -7.3829 },
  KENITRA: { lat: 34.2610, lng: -6.5802 },
  MARRAKECH: { lat: 31.6295, lng: -7.9811 },
  AGADIR: { lat: 30.4278, lng: -9.5981 },
  TANGER: { lat: 35.7595, lng: -5.8340 },
  TANGIER: { lat: 35.7595, lng: -5.8340 },
  FES: { lat: 34.0331, lng: -5.0003 },
  MEKNES: { lat: 33.8730, lng: -5.5407 },
  "EL JADIDA": { lat: 33.2316, lng: -8.5007 },
  OUJDA: { lat: 34.6814, lng: -1.9086 },
  TETOUAN: { lat: 35.5889, lng: -5.3626 },
  NADOR: { lat: 35.1681, lng: -2.9335 },
}

function __mapDayStart(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function __mapAddDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function __mapWeekStart(date: Date) {
  const d = __mapDayStart(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function __mapWeekEnd(date: Date) {
  return __mapAddDays(__mapWeekStart(date), 6)
}

function __mapIsoDay(date: Date) {
  return __mapDayStart(date).toISOString().slice(0, 10)
}

function __safeMissionDate(mission: any): Date | null {
  const raw =
    mission?.scheduled_date ||
    mission?.date ||
    mission?.start_date ||
    mission?.service_date ||
    mission?.scheduledStart ||
    mission?.scheduled_start ||
    mission?.scheduled_at ||
    mission?.start_at ||
    mission?.starts_at ||
    mission?.created_at

  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

function __safeMissionCity(mission: any): string {
  const raw =
    mission?.city ||
    mission?.family_city ||
    mission?.location_city ||
    mission?.zone_city ||
    mission?.family?.city ||
    mission?.address_city ||
    ""

  return String(raw).trim().toUpperCase()
}

function __safeMissionState(mission: any): "upcoming" | "active" | "cancelled" {
  const bag = [
    mission?.status,
    mission?.lifecycle_stage,
    mission?.lifecycleStage,
    mission?.dispatch_status,
    mission?.dispatchStatus,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  if (
    bag.includes("cancel") ||
    bag.includes("cancelled") ||
    bag.includes("canceled")
  ) {
    return "cancelled"
  }

  if (
    bag.includes("active") ||
    bag.includes("started") ||
    bag.includes("live") ||
    bag.includes("accepted") ||
    bag.includes("en_route") ||
    bag.includes("en route") ||
    bag.includes("in_progress") ||
    bag.includes("in progress") ||
    bag.includes("on_site") ||
    bag.includes("on site")
  ) {
    return "active"
  }

  return "upcoming"
}

function __missionInWindow(mission: any, targetDate: Date, range: "day" | "week") {
  const d = __safeMissionDate(mission)
  if (!d) return false

  if (range === "day") {
    return __mapIsoDay(d) === __mapIsoDay(targetDate)
  }

  const start = __mapWeekStart(targetDate).getTime()
  const end = __mapWeekEnd(targetDate).getTime()
  const val = __mapDayStart(d).getTime()
  return val >= start && val <= end
}

function buildMissionMapBuckets(
  missions: any[],
  targetDate: Date,
  range: "day" | "week"
): MissionMapBucket[] {
  const safeMissions = Array.isArray(missions) ? missions : []
  const buckets = new Map<string, MissionMapBucket>()

  for (const mission of safeMissions) {
    if (!__missionInWindow(mission, targetDate, range)) continue

    const city = __safeMissionCity(mission)
    if (!city) continue

    const centroid = MOROCCO_CITY_CENTROIDS[city]
    if (!centroid) continue

    const state = __safeMissionState(mission)
    const key = city

    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        city,
        lat: centroid.lat,
        lng: centroid.lng,
        total: 0,
        upcoming: 0,
        active: 0,
        cancelled: 0,
        missions: [],
        color: "#eab308",
      })
    }

    const bucket = buckets.get(key)!
    bucket.total += 1
    bucket.missions.push(mission)

    if (state === "active") bucket.active += 1
    if (state === "cancelled") bucket.cancelled += 1
    if (state === "upcoming") bucket.upcoming += 1
  }

  const out = Array.from(buckets.values()).map((bucket) => {
    let color = "#eab308" // yellow default upcoming
    if (bucket.active > 0) color = "#16a34a" // green
    else if (bucket.cancelled > 0 && bucket.upcoming === 0) color = "#dc2626" // red
    return { ...bucket, color }
  })

  return out.sort((a, b) => b.total - a.total)
}


function __moroccoMarkerPosition(lat: number, lng: number) {
  const north = 36.2
  const south = 27.4
  const west = -13.4
  const east = -0.8

  const x = ((lng - west) / (east - west)) * 100
  const y = ((north - lat) / (north - south)) * 100

  return {
    left: `${Math.max(4, Math.min(96, x))}%`,
    top: `${Math.max(4, Math.min(96, y))}%`,
  }
}

function formatMissionMapRangeLabel(date: Date, range: "day" | "week") {
  if (range === "day") {
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    })
  }

  const start = __mapWeekStart(date)
  const end = __mapWeekEnd(date)
  return `${start.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} → ${end.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`
}



function __carelinkMergeOverviewCommandPayload(currentPayload: any, commandPayload: any) {
  const current = __carelinkHydrateOpsDashboardPayload(currentPayload || {})
  const source = commandPayload || {}
  const summary = source.summary || source.metrics || {}
  const records = source.records || {}
  const missions = Array.isArray(records.missions)
    ? records.missions
    : Array.isArray(source.missions)
      ? source.missions
      : Array.isArray(current.missions)
        ? current.missions
        : []

  const activeMissions = Array.isArray(records.activeMissions)
    ? records.activeMissions
    : missions.filter((mission: any) => {
        const status = String(mission?.status || '').toLowerCase()
        const lifecycle = String(mission?.lifecycle_stage || '').toLowerCase()
        const dossierStatus = String(mission?.dossier_status || '').toLowerCase()
        const archived = mission?.is_archived === true
        const invalidDate = String(mission?.mission_date || '').startsWith('0001-')
        return !archived && !invalidDate && !['deleted', 'archived', 'cancelled', 'completed'].includes(status) && lifecycle !== 'deleted' && dossierStatus !== 'deleted'
      })

  const nextSummary = {
    ...(current.summary || {}),
    ...summary,
    missions: Number(summary.missions ?? missions.length ?? current.summary?.missions ?? 0),
    activeMissions: Number(summary.activeMissions ?? activeMissions.length ?? current.summary?.activeMissions ?? 0),
    completedMissions: Number(summary.completedMissions ?? current.summary?.completedMissions ?? 0),
    pendingValidation: Number(summary.pendingValidation ?? current.summary?.pendingValidation ?? 0),
    unassigned: Number(summary.unassigned ?? current.summary?.unassigned ?? 0),
    routeGaps: Number(summary.routeGaps ?? current.summary?.routeGaps ?? 0),
    queuedNotifications: Number(summary.queuedNotifications ?? current.summary?.queuedNotifications ?? 0),
    healthScore: Number(summary.healthScore ?? current.summary?.healthScore ?? 0),
  }

  const nextKpis = Array.isArray(current.kpis)
    ? current.kpis.map((kpi: any) => {
        const key = String(kpi?.key || kpi?.label || '').toLowerCase()
        if (key.includes('mission')) return { ...kpi, value: nextSummary.missions }
        if (key.includes('active')) return { ...kpi, value: nextSummary.activeMissions }
        if (key.includes('validation')) return { ...kpi, value: nextSummary.pendingValidation }
        if (key.includes('route')) return { ...kpi, value: nextSummary.routeGaps }
        return kpi
      })
    : current.kpis

  return __carelinkHydrateOpsDashboardPayload({
    ...current,
    summary: nextSummary,
    metrics: {
      ...(current.metrics || {}),
      ...summary,
    },
    missions: missions.length ? missions : current.missions,
    records: missions.length ? missions : current.records,
    kpis: nextKpis,
    __hardenedOverviewBridge: {
      ok: Boolean(source.ok),
      generatedAt: source.generatedAt || new Date().toISOString(),
      summary: nextSummary,
    },
  })
}


function __carelinkIsVisibleOperationalMission(row: any): boolean {
  const source = row?.raw || row || {}
  const statusText = [
    row?.status,
    row?.lifecycle_stage,
    row?.lifecycleStage,
    row?.dossier_status,
    row?.dossierStatus,
    source?.status,
    source?.lifecycle_stage,
    source?.lifecycleStage,
    source?.dossier_status,
    source?.dossierStatus,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const archived =
    source?.is_archived === true ||
    source?.isArchived === true ||
    row?.is_archived === true ||
    row?.isArchived === true ||
    Boolean(source?.archived_at || source?.archivedAt || row?.archived_at || row?.archivedAt)

  const deleted = /(^|[\s_-])(deleted|archive|archived)([\s_-]|$)/.test(statusText)
  const dateValue = String(row?.mission_date || row?.missionDate || source?.mission_date || source?.missionDate || '')
  const invalidDate = dateValue.startsWith('0001-') || dateValue.startsWith('0000-')

  return !archived && !deleted && !invalidDate
}

function __carelinkCleanVisibleOpsPayload(input: any): any {
  if (!input || typeof input !== 'object') return input

  const cleanRows = (rows: any) => Array.isArray(rows) ? rows.filter(__carelinkIsVisibleOperationalMission) : rows
  const clone: any = { ...input }

  ;['missions', 'records', 'dossiers', 'items', 'queue', 'missionRows', 'liveRows'].forEach((key) => {
    if (Array.isArray(clone[key])) clone[key] = cleanRows(clone[key])
  })

  if (Array.isArray(clone.lanes)) {
    clone.lanes = clone.lanes.map((lane: any) => {
      const next: any = { ...(lane || {}) }
      ;['missions', 'records', 'items', 'queue'].forEach((key) => {
        if (Array.isArray(next[key])) next[key] = cleanRows(next[key])
      })
      if (typeof next.count === 'number') {
        const firstRows = next.missions || next.records || next.items || next.queue
        if (Array.isArray(firstRows)) next.count = firstRows.length
      }
      return next
    })
  }

  const visibleMissions = Array.isArray(clone.missions)
    ? clone.missions
    : Array.isArray(clone.records)
      ? clone.records
      : []

  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const readMission = (row: any, key: string) => row?.[key] ?? row?.raw?.[key] ?? ''
  const missionDateKey = (row: any) => String(readMission(row, 'mission_date') || readMission(row, 'date') || readMission(row, 'start_date') || '').slice(0, 10)
  const statusText = (row: any) =>
    [
      readMission(row, 'status'),
      readMission(row, 'lifecycle_stage'),
      readMission(row, 'dossier_status'),
      readMission(row, 'dispatch_status'),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

  const operationalMissions = visibleMissions.filter((mission: any) => {
    const status = statusText(mission)
    const dateKey = missionDateKey(mission)
    const archived = mission?.is_archived === true || mission?.raw?.is_archived === true

    if (archived) return false
    if (!dateKey || dateKey === '0001-01-01') return false
    if (dateKey < todayKey) return false
    if (/(^|[\\s_-])(deleted|archive|archived|cancelled|canceled|completed|closed)([\\s_-]|$)/.test(status)) return false

    return true
  })

  const todayMissions = operationalMissions.filter((mission: any) => missionDateKey(mission) === todayKey)
  const assignedMissions = operationalMissions.filter((mission: any) => Number(readMission(mission, 'caregiver_id') || readMission(mission, 'staff_id') || 0) > 0)
  const activeMissions = operationalMissions.filter((mission: any) => {
    const status = statusText(mission)
    return /(^|[\\s_-])(active|started|in_progress|assigned)([\\s_-]|$)/.test(status)
  })
  const pendingValidationMissions = operationalMissions.filter((mission: any) => String(readMission(mission, 'validation_status')).toLowerCase().includes('pending'))
  const unassignedMissions = operationalMissions.filter((mission: any) => Number(readMission(mission, 'caregiver_id') || readMission(mission, 'staff_id') || 0) <= 0)

  clone.summary = {
    ...(clone.summary || {}),
    total: operationalMissions.length,
    missions: operationalMissions.length,
    totalMissions: operationalMissions.length,
    visibleOperationalMissions: operationalMissions.length,
    today: todayMissions.length,
    assigned: assignedMissions.length,
    active: activeMissions.length,
    pendingValidation: pendingValidationMissions.length,
    unassigned: unassignedMissions.length,
  }

  clone.metrics = {
    ...(clone.metrics || {}),
    total: operationalMissions.length,
    missions: operationalMissions.length,
    totalMissions: operationalMissions.length,
    today: todayMissions.length,
    assigned: assignedMissions.length,
    active: activeMissions.length,
    pendingValidation: pendingValidationMissions.length,
    unassigned: unassignedMissions.length,
  }

  if (Array.isArray(clone.kpis)) {
    clone.kpis = clone.kpis.map((kpi: any) => {
      const key = String(kpi?.key || kpi?.label || kpi?.title || '').toLowerCase()

      if (key.includes('total') || key.includes('registry')) return { ...kpi, value: operationalMissions.length }
      if (key.includes('today')) return { ...kpi, value: todayMissions.length }
      if (key.includes('assigned') || key.includes('dispatch')) return { ...kpi, value: assignedMissions.length }
      if (key.includes('active') || key.includes('live')) return { ...kpi, value: activeMissions.length }
      if (key.includes('review') || key.includes('validation') || key.includes('pending')) return { ...kpi, value: pendingValidationMissions.length }
      if (key.includes('unassigned')) return { ...kpi, value: unassignedMissions.length }

      return kpi
    })
  }

  return clone
}

export function CareLinkOpsProductionDashboard({ initialPayload }: { initialPayload?: any }) {
  // CARELINK_OPS_MAIN_SIDEBAR_NAV_FIX: make the left CareLink Ops sidebar real navigation on the overview page.
  useEffect(() => {
    const routes: Record<string, string> = {
      overview: '/carelink-ops',
      dispatch: '/carelink-ops/dispatch',
      missions: '/carelink-ops/missions',
      agents: '/caregivers',
      schedule: '/carelink-ops/schedule',
      incidents: '/carelink-ops/incidents',
      reports: '/carelink-ops/reports',
      compliance: '/carelink-ops/compliance',
      settings: '/carelink-ops/settings',
    }

    const normalize = (value: string) =>
      value.toLowerCase().replace(/[^a-z]/g, ' ').replace(/\s+/g, ' ').trim()

    const handleSidebarClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const clickable = target?.closest('a, button, [role="button"]') as HTMLElement | null
      if (!clickable) return

      const sidebar = clickable.closest('aside')
      if (!sidebar) return

      const label = normalize(clickable.textContent || '')

      // CARELINK_OPS_AGENTS_TO_CAREGIVERS_CLICK_FIX
      const clickableTextForAgents = (clickable.textContent || '').trim().toLowerCase()
      if (clickableTextForAgents === 'agents' || clickableTextForAgents.includes('agents')) {
        event.preventDefault()
        window.location.href = '/caregivers'
        return
      }
      const match = Object.entries(routes).find(([key]) => label === key || label.includes(key))
      if (!match) return

      const [, href] = match
      if (window.location.pathname === href) return

      event.preventDefault()
      event.stopPropagation()
      window.location.assign(href)
    }

    document.addEventListener('click', handleSidebarClick, true)
    return () =>
       document.removeEventListener('click', handleSidebarClick, true)
  }, [])

  const [payload, setPayload] = useState<OpsDashboardPayload>(() => __carelinkHydrateOpsDashboardPayload(__carelinkCleanVisibleOpsPayload(initialPayload)))
  

  // overview-command hidden bridge: backend hardening only, no UI replacement.
  useEffect(() => {
    let alive = true
    let timer: number | null = null

    const loadOverviewCommandBridge = async () => {
      try {
        const res = await fetch('/api/carelink/ops/overview-command', {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        })

        if (!res.ok) return

        const json = await res.json()
        if (!alive || !json?.ok) return

        setPayload((current: any) => __carelinkMergeOverviewCommandPayload(current, json))
      } catch {
        // Keep restored UI untouched if the backend bridge is unavailable.
      }
    }

    void loadOverviewCommandBridge()
    timer = window.setInterval(loadOverviewCommandBridge, 60000)

    return () => {
      alive = false
      if (timer) window.clearInterval(timer)
    }
  }, [])
const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState('')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const [canonicalMissionDossierOpen, setCanonicalMissionDossierOpen] = useState(false)
  const [canonicalMissionDossierMission, setCanonicalMissionDossierMission] = useState<any | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [expandedFlow, setExpandedFlow] = useState(false)
  const [mapMode, setMapMode] = useState<'cities' | 'zones'>('cities')
  const [selectedCity, setSelectedCity] = useState('')
  const [dayOffset, setDayOffset] = useState(0)
  const [mapDayOffset, setMapDayOffset] = useState(0)
  const [mapRange, setMapRange] = useState<'day' | 'week'>('day')

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString('fr-FR'))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/carelink/ops/live-missions', { cache: 'no-store' })
      const json = await res.json()
      setPayload(__carelinkHydrateOpsDashboardPayload(__carelinkCleanVisibleOpsPayload(json)))
      setLastUpdated(new Date().toLocaleTimeString('fr-FR'))
    } catch (error) {
      setLogs((current) => [`Dashboard refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`, ...current].slice(0, 5))
    } finally {
      setLoading(false)
    }
  }, [])

  const runAction = useCallback(async (action: string, entityId?: string) => {
    try {
      const res = await fetch('/api/carelink/ops/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, entityId }),
      })
      const json = await res.json()
      setLogs((current) => [`${json.ok ? 'Action recorded' : 'Action failed'} · ${action}${entityId ? ` · ${entityId}` : ''}`, ...current].slice(0, 5))
    } catch (error) {
      setLogs((current) => [`Action failed: ${error instanceof Error ? error.message : 'Unknown error'}`, ...current].slice(0, 5))
    }
  }, [])

  const refreshCanonicalMissionDossier = useCallback(async () => {
    try {
      const response = await fetch('/api/carelink/ops/dashboard', { cache: 'no-store' })
      const json = await response.json()
      setPayload(__carelinkHydrateOpsDashboardPayload(__carelinkCleanVisibleOpsPayload(json)))
      setLastUpdated(new Date().toLocaleTimeString())
    } catch {
      setLastUpdated(new Date().toLocaleTimeString())
    }
  }, [])

  const openCanonicalMissionDossier = useCallback(async (mission?: any) => {
    setModal({ type: 'none' })
    setCanonicalMissionDossierMission(mission || null)
    setCanonicalMissionDossierOpen(true)

    const id = __carelinkMissionNumericId(mission)
    if (!id) return

    try {
      const response = await fetch(`/api/missions/dossiers/${id}`, { cache: 'no-store', headers: { Accept: 'application/json' } })
      const json = await response.json().catch(() => null)
      if (response.ok && json?.ok && json.data) {
        setCanonicalMissionDossierMission(json.data)
      }
    } catch (error) {
      console.warn('[CareLinkOps] Unable to load full mission dossier, using live row fallback', error)
    }
  }, [])

  const visiblePayload = useMemo(() => __carelinkHydrateOpsDashboardPayload(__carelinkCleanVisibleOpsPayload(payload)), [payload])

  const [selectedOpsDay, setSelectedOpsDay] = useState(() => new Date().toISOString().slice(0, 10))

  const opsDayWindow = useMemo(() => __carelinkDayWindow(selectedOpsDay, 7), [selectedOpsDay])

  const overviewMissionRows = useMemo(() => {
    return __carelinkFinalLiveRows(__carelinkCollectOverviewMissions(visiblePayload))
      .filter((row: any) => __carelinkMissionMatchesDay(row, selectedOpsDay))
      .map((row: any) => ({ ...row, code: resolvedMissionCode(row) }))
  }, [visiblePayload, selectedOpsDay])

  const overviewLaneRows = useMemo(() => {
    const lanes = Array.isArray((visiblePayload as any)?.lanes) ? (visiblePayload as any).lanes : []
    const mergedLanes = __carelinkMergeFallbackLanes(lanes, overviewMissionRows)
    return mergedLanes.map((lane: any) => ({
      ...lane,
      items: __carelinkFinalLiveRows(Array.isArray(lane?.items) ? lane.items : [])
        .filter((row: any) => __carelinkMissionMatchesDay(row, selectedOpsDay))
        .map((row: any) => ({ ...row, code: resolvedMissionCode(row) })),
    }))
  }, [visiblePayload, overviewMissionRows, selectedOpsDay])

  const overviewMissionCards = useMemo(() => overviewMissionRows.slice(0, 8), [overviewMissionRows])

  const overviewStats = useMemo(() => {
    const total = overviewMissionRows.length
    const assigned = overviewMissionRows.filter((row: any) => row?.caregiver_id || row?.caregiverId || row?.assignedAgent).length
    const inProgress = overviewMissionRows.filter((row: any) => {
      const status = __carelinkText(row?.status || row?.lifecycle_stage || row?.lifecycleStage, '').toLowerCase()
      return status.includes('progress') || status.includes('route')
    }).length
    const completed = overviewMissionRows.filter((row: any) => {
      const status = __carelinkText(row?.status || row?.lifecycle_stage || row?.lifecycleStage, '').toLowerCase()
      return status.includes('complete') || status.includes('closed') || status.includes('validation')
    }).length
    const unassigned = Math.max(0, total - assigned)
    return { total, assigned, inProgress, completed, unassigned }
  }, [overviewMissionRows])

  const selectedOpsDayLabel = useMemo(() => __carelinkFormatHumanDay(selectedOpsDay), [selectedOpsDay])


  const overviewCommandDeck = useMemo(() => {
    const summary = (visiblePayload as any)?.summary || {}
    const metrics = (visiblePayload as any)?.metrics || {}
    const lanes = asArray<CareLinkLane>((visiblePayload as any)?.lanes)
    const records = asArray<any>((visiblePayload as any)?.records)
    const missions = asArray<any>((visiblePayload as any)?.missions)
    const rows = records.length ? records : missions

    const laneCount = (...keys: string[]) =>
      lanes
        .filter((lane) => keys.includes(String((lane as any)?.key || '').toLowerCase()))
        .reduce((sum, lane) => sum + asArray<any>((lane as any)?.items).length, 0)

    const total = Number(metrics.total ?? summary.total ?? rows.length ?? 0)
    const missionsToday = Number(metrics.missionsToday ?? summary.missionsToday ?? 0)
    const assigned = Number(metrics.assigned ?? summary.assigned ?? laneCount('assigned'))
    const active = Number(metrics.active ?? summary.active ?? laneCount('assigned', 'accepted', 'en_route', 'in_progress'))
    const inProgress = Number(metrics.inProgress ?? summary.inProgress ?? laneCount('in_progress'))
    const reportsPending = Number(metrics.reportsPending ?? summary.reportsPending ?? laneCount('report_pending', 'validation'))
    const atRisk = Number(metrics.atRisk ?? summary.atRisk ?? laneCount('at_risk'))
    const unassigned = Number(metrics.unassigned ?? summary.unassigned ?? laneCount('created', 'unassigned'))
    const completed = Number(metrics.completed ?? summary.completed ?? laneCount('completed'))
    const agentsAvailable = Number(metrics.agentsAvailable ?? summary.agentsAvailable ?? 0)
    const incidentsOpen = Number(metrics.incidentsOpen ?? summary.incidentsOpen ?? 0)
    const complianceBlockers = Number(metrics.complianceBlockers ?? summary.complianceBlockers ?? 0)

    const citySet = new Set(rows.map((item: any) => String(item?.city || '').trim()).filter(Boolean))
    const serviceSet = new Set(rows.map((item: any) => String(item?.serviceType || item?.service_type || item?.title || '').trim()).filter(Boolean))

    return {
      cityCount: citySet.size,
      serviceCount: serviceSet.size,
      cards: [
        { key: 'total', label: 'Total missions', value: total, helper: 'All live dossiers loaded', badge: 'registry', icon: '◎', tone: 'border-blue-200 bg-blue-50/80' },
        { key: 'today', label: 'Today', value: missionsToday, helper: 'Scheduled today', badge: 'today', icon: '◔', tone: 'border-cyan-200 bg-cyan-50/80' },
        { key: 'assigned', label: 'Assigned', value: assigned, helper: 'Agent linked', badge: 'dispatch', icon: '↗', tone: 'border-violet-200 bg-violet-50/80' },
        { key: 'active', label: 'Active', value: active, helper: 'Live operating load', badge: 'live', icon: '◉', tone: 'border-emerald-200 bg-emerald-50/80' },
        { key: 'agents', label: 'Agents available', value: agentsAvailable, helper: 'Ready workforce', badge: 'ops', icon: '◌', tone: 'border-teal-200 bg-teal-50/80' },
        { key: 'reports', label: 'Reports pending', value: reportsPending, helper: 'Validation queue', badge: 'review', icon: '▣', tone: 'border-amber-200 bg-amber-50/80' },
        { key: 'incidents', label: 'Incidents open', value: incidentsOpen, helper: 'Escalations', badge: 'alert', icon: '△', tone: 'border-rose-200 bg-rose-50/80' },
        { key: 'blockers', label: 'Compliance blockers', value: complianceBlockers, helper: 'Readiness friction', badge: 'risk', icon: '⛉', tone: 'border-pink-200 bg-pink-50/80' },
      ],
      strips: [
        { key: 'progress', label: 'In progress', value: inProgress },
        { key: 'completed', label: 'Completed', value: completed },
        { key: 'unassigned', label: 'Unassigned queue', value: unassigned },
        { key: 'risk', label: 'At risk', value: atRisk },
      ],
    }
  }, [visiblePayload])


  const filteredMissions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return (Array.isArray((visiblePayload as any).lanes) ? (visiblePayload as any).lanes : [])
      .flatMap((lane: any) => asArray<any>(lane.items).map((item: any) => ({ ...item, lane: lane.label })))
      .filter((item: any) => [resolvedMissionCode(item), item.code, item.clientLabel, item.city, item.zone, item.serviceType, item.assignedAgent]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q))
      .slice(0, 8)
  }, [(Array.isArray((visiblePayload as any).lanes) ? (visiblePayload as any).lanes : []), query])

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <div className="min-h-screen-cols-[236px_1fr]">
        

        <section className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-8 py-5 backdrop-blur">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h1 className="text-3xl font-black tracking-[-0.04em]">CareLink Operations Control</h1>
                <p className="mt-1 text-sm font-medium text-slate-500">Enterprise dispatch cockpit for scheduled home-care, childcare, field agents, reports, and incidents.</p>
              </div>
              <div className="flex min-w-[520px] items-center justify-end gap-3">
                <div className="relative flex-1">
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search missions, agents, clients, incidents…" className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none ring-blue-200 transition focus:bg-white focus:ring-4" />
                </div>
                <button onClick={() => runAction('open_notifications')} className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-white font-black shadow-sm">◇</button>
                <button onClick={() => setModal({ type: 'command', title: 'CareLink Ops Lead', detail: 'User profile, permissions, dispatch authority, and operational accountability panel.' })} className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm"><span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-white ring-1 ring-slate-100"><AngelCareLogo size="sm" /></span><span className="text-left text-xs font-black leading-tight">AngelCare Ops<br /><span className="text-slate-500">Operations Lead</span></span></button>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-3 text-xs font-bold text-slate-500">
              <span suppressHydrationWarning>Last updated: {lastUpdated || '—'}</span>
              <button onClick={load} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-black text-slate-700 hover:bg-slate-50">{loading ? 'Refreshing…' : 'Refresh'}</button>
            </div>
            {query ? <SearchResults items={filteredMissions} open={(item) => openCanonicalMissionDossier(item)} /> : null}
          </header>

          <div className="space-y-5 px-8 py-6">
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8 gap-4">
              {(Array.isArray((visiblePayload as any).kpis) ? (visiblePayload as any).kpis : []).map((kpi: any) => <KpiCard key={kpi.key} item={kpi} open={() => setModal({ type: 'kpi', item: kpi })} />)}
            </section>

            <section className="grid grid-cols-[0.76fr_1.44fr] gap-5">
              <OperationsMap
                cities={Array.isArray((visiblePayload as any).cities) ? (visiblePayload as any).cities : []}
                zones={Array.isArray((visiblePayload as any).zones) ? (visiblePayload as any).zones : []}
                missions={Array.isArray((visiblePayload as any).missions) ? (visiblePayload as any).missions : (Array.isArray((visiblePayload as any).records) ? (visiblePayload as any).records : [])}
                mode={mapMode}
                setMode={setMapMode}
                selectedCity={selectedCity}
                setSelectedCity={setSelectedCity}
                open={(item) => openCanonicalMissionDossier(item)}
              />

      <section className="order-first col-span-full mb-5 rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">

        <style jsx global>{`
          [data-pulse-kpi="true"],
          [data-pulse-kpi="true"] *,
          [data-pulse-kpi="true"] div,
          [data-pulse-kpi="true"] span {
            color: #172554 !important;
            font-weight: 900 !important;
            text-shadow: none !important;
            -webkit-text-fill-color: #172554 !important;
          }

          [data-pulse-kpi="true"] {
            background: #ffffff !important;
            border: 1px solid #bfdbfe !important;
          }

          [data-pulse-panel="true"] .pulse-title,
          [data-pulse-panel="true"] .pulse-subtitle {
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
            font-weight: 900 !important;
          }
        `}</style>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700">Live operations cockpit</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{loading ? 'Synchronizing live feed…' : 'Live sync active'}</span>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{lastUpdated ? `Updated ${lastUpdated}` : 'Awaiting refresh marker'}</span>
            </div>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950">Overview Command Deck</h2>
            <p className="mt-2 max-w-4xl text-sm font-medium text-slate-500">
              Premium live overview connected to mission registry, dispatch lanes, readiness, reports, incidents, compliance, and Moroccan operational coverage.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => load()} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
              {loading ? 'Refreshing…' : 'Refresh live'}
            </button>
            <a href="/carelink-ops/missions" className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700">Open missions</a>
            <a href="/carelink-ops/dispatch" className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">Dispatch center</a>
            <button onClick={() => setExpandedFlow(!expandedFlow)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
              {expandedFlow ? 'Compact lanes' : 'Expand lanes'}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
          {overviewCommandDeck.cards.map((card) => (
            <div key={card.key} className={`group relative overflow-hidden rounded-[24px] border p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${card.tone}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/85 text-sm font-black text-slate-700 shadow-sm">{card.icon}</div>
                <div className="rounded-full bg-white/75 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">{card.badge}</div>
              </div>
              <div className="mt-5 text-[11px] font-black uppercase tracking-[0.26em] text-slate-500">{card.label}</div>
              <div className="mt-1 text-4xl font-black tracking-[-0.04em] text-slate-950">{card.value}</div>
              <div className="mt-1 text-xs font-semibold text-slate-600">{card.helper}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[1.55fr_1fr]">
          <div className="rounded-[24px] border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4 text-white shadow-lg [&_a]:!text-white [&_button]:!text-white [&_div]:!text-white [&_span]:!text-white [&_p]:!text-white [&_h1]:!text-white [&_h2]:!text-white [&_h3]:!text-white [&_*]:!text-white" style={{ color: '#ffffff' }}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.24em]" style={{ color: "#172554", fontWeight: 900 }}>Operational pulse</div>
                <div className="pulse-subtitle mt-1 text-sm font-semibold">Live summary driven by the same overview payload powering the page.</div>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                {overviewCommandDeck.cityCount} cities · {overviewCommandDeck.serviceCount} service lines
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {overviewCommandDeck.strips.map((item) => (
                <div key={item.key} data-pulse-kpi="true" className="rounded-2xl border border-blue-100 bg-white p-3 shadow-sm">
                  <div className="text-[11px] font-black uppercase tracking-[0.24em]" style={{ color: "#172554", fontWeight: 900 }}>{item.label}</div>
                  <div className="mt-1 text-2xl font-black tracking-[-0.04em]" style={{ color: "#172554", fontWeight: 900 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4 text-white shadow-lg text-white" style={{ color: '#ffffff', background: 'linear-gradient(135deg,#020617,#0f172a,#172554)' }}>
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-black uppercase tracking-[0.26em] text-blue-100"><span style={{ color: "#dbeafe" }}><span className="!text-white" style={{ color: "#ffffff" }}>Quick control</span></span></div>
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_8px_rgba(52,211,153,0.16)]" />
            </div>
            <div className="mt-3 text-2xl font-black tracking-[-0.03em] text-white"><span style={{ color: "#ffffff" }}><span className="!text-white" style={{ color: "#ffffff" }}>Operational shortcuts</span></span></div>
            <p className="mt-1 text-sm font-medium text-slate-200"><span style={{ color: "#e2e8f0" }}><span className="!text-white" style={{ color: "#ffffff" }}>Premium jump actions across the CareLink operational chain.</span></span></p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <a href="/caregivers" className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:border-white/25 hover:bg-white/15"><span className="text-white"><span className="!text-white" style={{ color: "#ffffff" }}>Workforce command</span></span></a>
              <a href="/carelink-ops/schedule" className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:border-white/25 hover:bg-white/15"><span className="text-white"><span className="!text-white" style={{ color: "#ffffff" }}>Schedule & coverage</span></span></a>
              <a href="/carelink-ops/reports" className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:border-white/25 hover:bg-white/15"><span className="text-white"><span className="!text-white" style={{ color: "#ffffff" }}>Reports validation</span></span></a>
              <a href="/carelink-ops/incidents" className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:border-white/25 hover:bg-white/15"><span className="text-white"><span className="!text-white" style={{ color: "#ffffff" }}>Incidents & alerts</span></span></a>
            </div>
          </div>
        </div>
      </section>

                <div className="mb-6 rounded-[32px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="space-y-2">
                      <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-sky-700">
                        Premium overview navigator
                      </div>
                      <div>
                        <h3 className="text-2xl font-black tracking-tight text-slate-950">Operational mission visibility by day</h3>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          Navigate dates accurately and keep the overview board, mission cards and dispatch lanes aligned to the selected operational day.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          const dt = new Date(`${selectedOpsDay}T12:00:00`)
                          dt.setDate(dt.getDate() - 1)
                          setSelectedOpsDay(dt.toISOString().slice(0, 10))
                        }}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
                      >
                        ← Previous day
                      </button>
                      <button
                        onClick={() => setSelectedOpsDay(new Date().toISOString().slice(0, 10))}
                        className="rounded-2xl border border-blue-200 bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-blue-700"
                      >
                        Today
                      </button>
                      <button
                        onClick={() => {
                          const dt = new Date(`${selectedOpsDay}T12:00:00`)
                          dt.setDate(dt.getDate() + 1)
                          setSelectedOpsDay(dt.toISOString().slice(0, 10))
                        }}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
                      >
                        Next day →
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Selected day</div>
                      <div className="mt-1 text-sm font-bold text-slate-900">{selectedOpsDayLabel}</div>
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">Visible missions</div>
                      <div className="mt-1 text-lg font-black text-emerald-900">{overviewStats.total}</div>
                    </div>
                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3">
                      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-indigo-700">Assigned</div>
                      <div className="mt-1 text-lg font-black text-indigo-900">{overviewStats.assigned}</div>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-700">Unassigned</div>
                      <div className="mt-1 text-lg font-black text-amber-900">{overviewStats.unassigned}</div>
                    </div>
                    <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3">
                      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-700">Active now</div>
                      <div className="mt-1 text-lg font-black text-cyan-900">{overviewStats.inProgress}</div>
                    </div>
                    <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3">
                      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-700">Closed / validated</div>
                      <div className="mt-1 text-lg font-black text-violet-900">{overviewStats.completed}</div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-4 xl:grid-cols-7">
                    {opsDayWindow.map((day) => {
                      const active = day.key === selectedOpsDay
                      return (
                        <button
                          key={day.key}
                          onClick={() => setSelectedOpsDay(day.key)}
                          className={`rounded-[24px] border px-4 py-4 text-left transition ${
                            active
                              ? 'border-blue-500 bg-blue-600 text-white shadow-[0_18px_40px_rgba(37,99,235,0.26)]'
                              : 'border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm'
                          }`}
                        >
                          <div className={`text-[11px] font-black uppercase tracking-[0.22em] ${active ? 'text-blue-100' : 'text-slate-400'}`}>
                            {day.weekday}
                          </div>
                          <div className="mt-2 text-lg font-black">{day.dayNumber}</div>
                          <div className={`mt-1 text-xs font-semibold ${active ? 'text-blue-100' : 'text-slate-500'}`}>
                            {day.label}
                          </div>
                          <div className="mt-2 text-[11px] font-bold">
                            {day.isToday ? 'Today' : active ? 'Selected' : 'Review'}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="mb-4 flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                      <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">
                        Premium mission cards
                      </div>
                      <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Executive mission spotlight for {selectedOpsDayLabel}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        Rich operational cards showing mission identity, assignment, service line, timing, notes and field-readiness details.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                    {overviewMissionCards.length ? overviewMissionCards.map((mission: any, index: number) => {
                      const missionCode = mission?.code || resolvedMissionCode(mission)
                      const missionStatus = __carelinkText(mission?.status || mission?.lifecycleStage || mission?.lifecycle_stage, 'created')
                      const clientLabel = __carelinkText(
                        mission?.clientLabel ||
                        mission?.familyLabel ||
                        mission?.family_name ||
                        mission?.customer_name ||
                        mission?.client_name,
                        'Family pending'
                      )
                      const serviceLabel = __carelinkText(mission?.serviceType || mission?.service_type || mission?.title, 'Service pending')
                      const caregiverLabel = __carelinkText(
                        mission?.assignedAgent ||
                        mission?.caregiver_name ||
                        mission?.caregiverLabel,
                        mission?.caregiver_id || mission?.caregiverId ? `Agent #${mission?.caregiver_id || mission?.caregiverId}` : 'Not assigned'
                      )
                      const cityLabel = __carelinkText(mission?.city, 'City pending')
                      const zoneLabel = __carelinkText(mission?.zone, 'Zone pending')
                      const startLabel = __carelinkText(mission?.startTime || mission?.start_time || mission?.scheduledStartTime, '—')
                      const endLabel = __carelinkText(mission?.endTime || mission?.end_time || mission?.scheduledEndTime, '—')
                      const dateLabel = __carelinkFormatHumanDay(__carelinkMissionDayKey(mission) || selectedOpsDay)
                      const noteText = __carelinkExcerpt(mission?.notes || mission?.instructions || mission?.description)
                      const routeLabel = __carelinkText(
                        mission?.routeMode ||
                        mission?.transport_required ||
                        mission?.transportRequired ||
                        mission?.mission_scope,
                        'No transport route declared'
                      )

                      return (
                        <article
                          key={`${mission?.id || missionCode || index}`}
                          className="group overflow-hidden rounded-[30px] border border-slate-200/90 bg-white p-5 shadow-[0_16px_48px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-sky-600">Mission identity</div>
                              <h4 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{missionCode}</h4>
                              <div className="mt-1 text-sm font-semibold text-slate-500">{clientLabel}</div>
                            </div>
                            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-600">
                              {missionStatus}
                            </div>
                          </div>

                          <div className="mt-5 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Service</div>
                              <div className="mt-1 text-sm font-bold text-slate-900">{serviceLabel}</div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Assigned caregiver</div>
                              <div className="mt-1 text-sm font-bold text-slate-900">{caregiverLabel}</div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Operational date</div>
                              <div className="mt-1 text-sm font-bold text-slate-900">{dateLabel}</div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Timing</div>
                              <div className="mt-1 text-sm font-bold text-slate-900">{startLabel} → {endLabel}</div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">City / zone</div>
                              <div className="mt-1 text-sm font-bold text-slate-900">{cityLabel} · {zoneLabel}</div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Transport / route</div>
                              <div className="mt-1 text-sm font-bold text-slate-900">{routeLabel}</div>
                            </div>
                          </div>

                          <div className="mt-4 rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Operational notes</div>
                            <div className="mt-2 text-sm font-semibold leading-6 text-slate-700">{noteText}</div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              onClick={() => openCanonicalMissionDossier(mission)}
                              className="rounded-2xl border border-blue-200 bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                            >
                              Open mission dossier
                            </button>
                            <button
                              onClick={() => openCanonicalMissionDossier(mission)}
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                              Inspect operation
                            </button>
                          </div>
                        </article>
                      )
                    }) : (
                      <div className="col-span-full rounded-[30px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                        <div className="text-lg font-black text-slate-900">No missions scheduled for this day</div>
                        <div className="mt-2 text-sm font-semibold text-slate-500">
                          Select another day above to review available live operations and dispatch activity.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              <DispatchFlow lanes={overviewLaneRows} expanded={expandedFlow} setExpanded={setExpandedFlow} openMission={(item) => openCanonicalMissionDossier(item)} openAll={() => setModal({ type: 'command', title: 'Mission operations board', detail: 'Open the complete mission operations board with SLA filters, city filters, agent assignment, batch escalation, lifecycle transitions, and export controls.' })} />
            </section>

            <section className="grid grid-cols-[1fr_1.25fr_0.85fr] gap-5">
              <AgentReadinessPanel agents={(Array.isArray((visiblePayload as any).agents) ? (visiblePayload as any).agents : [])} open={(item) => setModal({ type: 'agent', item })} />
              <ScheduleCoveragePanel coverage={(Array.isArray((visiblePayload as any).coverage) ? (visiblePayload as any).coverage : [])} dayOffset={dayOffset} setDayOffset={setDayOffset} open={(item) => setModal({ type: 'coverage', item })} />
              <IncidentsPanel incidents={(Array.isArray((visiblePayload as any).incidents) ? (visiblePayload as any).incidents : [])} open={(item) => setModal({ type: 'incident', item })} />
            </section>

                  
<section className="grid grid-cols-[1.55fr_0.65fr] gap-5 pb-10">
              <ReportsPanel reports={(Array.isArray((visiblePayload as any).reports) ? (visiblePayload as any).reports : [])} open={(item) => setModal({ type: 'report', item })} />
              <FollowUpPanel followUps={(Array.isArray((visiblePayload as any).followUps) ? (visiblePayload as any).followUps : [])} open={(title, detail) => setModal({ type: 'command', title, detail })} />
            </section>
          </div>
        </section>
      </div>

      {canonicalMissionDossierOpen && (
        <CareLinkCreateMissionDossierModal
          close={() => { setCanonicalMissionDossierOpen(false); setCanonicalMissionDossierMission(null) }}
          refresh={refreshCanonicalMissionDossier}
          mode={canonicalMissionDossierMission ? 'edit' : 'create'}
          initialMission={canonicalMissionDossierMission}
        />
      )}

      <ActionLog logs={logs} />
      <EnterpriseModal modal={modal} close={() => setModal({ type: 'none' })} runAction={runAction} />
    </main>
  )
}

function StatusDot({ label, helper }: { label: string; helper: string }) {
  return <div className="mt-3 flex gap-2"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" /><div><p className="text-xs font-black text-slate-700">{label}</p><p className="text-xs text-slate-500">{helper}</p></div></div>
}

function KpiCard({ item, open }: { item: CareLinkKpi; open: () => void }) {
  return <button onClick={open} className={`rounded-3xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${toneClasses[item.tone] || toneClasses.slate}`}><p className="text-xs font-black uppercase tracking-[0.16em] opacity-80">{item.label}</p><p className="mt-2 text-3xl font-black tracking-tight">{item.value}</p><p className="mt-1 min-h-[32px] text-xs font-bold opacity-80">{item.helper}</p></button>
}


function OperationsMap({ cities, zones, missions, mode, setMode, selectedCity, setSelectedCity, open }: { cities: any[]; zones: any[]; missions: any[]; mode: 'cities' | 'zones'; setMode: (value: 'cities' | 'zones') => void; selectedCity: string; setSelectedCity: (value: string) => void; open: (item: any) => void }) {
  void zones
  void mode
  void setMode

  return (
    <Panel
      title="Morocco Operations Map"
      subtitle="Live operational radar synced with mission dates, statuses, and Morocco-wide coverage."
    >
      <CareLinkOpsMissionRadarMap
        missions={Array.isArray(missions) ? missions : []}
        cities={Array.isArray(cities) ? cities : []}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        onOpenMission={open}
      />
    </Panel>
  )
}


function DispatchFlow({
  lanes,
  expanded,
  setExpanded,
  openMission,
  openAll,
}: {
  lanes: any[]
  expanded: boolean
  setExpanded: (value: boolean) => void
  openMission: (item: any) => void
  openAll: () => void
}) {
  const [activeLane, setActiveLane] = useState('all')
  const [density, setDensity] = useState<'executive' | 'compact'>('executive')
  const [sortMode, setSortMode] = useState<'priority' | 'time' | 'status'>('priority')
  const [spotlightOnly, setSpotlightOnly] = useState(false)

  const laneBlueprints = [
    { key: 'unassigned', label: 'Unassigned', icon: '◎', accent: 'slate', gradient: 'from-slate-50 to-white', ring: 'border-slate-200', badge: 'bg-slate-100 text-slate-700', helper: 'Needs assignment' },
    { key: 'assigned', label: 'Assigned', icon: '●', accent: 'blue', gradient: 'from-blue-50 to-white', ring: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', helper: 'Agent linked' },
    { key: 'accepted', label: 'Accepted', icon: '◆', accent: 'violet', gradient: 'from-violet-50 to-white', ring: 'border-violet-200', badge: 'bg-violet-100 text-violet-700', helper: 'Confirmed by field' },
    { key: 'en_route', label: 'En route', icon: '↗', accent: 'cyan', gradient: 'from-cyan-50 to-white', ring: 'border-cyan-200', badge: 'bg-cyan-100 text-cyan-700', helper: 'Transport active' },
    { key: 'in_progress', label: 'In progress', icon: '◉', accent: 'emerald', gradient: 'from-emerald-50 to-white', ring: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', helper: 'Mission live' },
    { key: 'report_pending', label: 'Report pending', icon: '▣', accent: 'amber', gradient: 'from-amber-50 to-white', ring: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', helper: 'Field report needed' },
    { key: 'validation', label: 'Validation', icon: '✓', accent: 'purple', gradient: 'from-purple-50 to-white', ring: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', helper: 'Supervisor review' },
    { key: 'at_risk', label: 'At risk', icon: '△', accent: 'rose', gradient: 'from-rose-50 to-white', ring: 'border-rose-200', badge: 'bg-rose-100 text-rose-700', helper: 'Needs intervention' },
    { key: 'completed', label: 'Completed', icon: '◌', accent: 'green', gradient: 'from-green-50 to-white', ring: 'border-green-200', badge: 'bg-green-100 text-green-700', helper: 'Closed operation' },
  ]

  const blueprintByKey = new Map(laneBlueprints.map((lane) => [lane.key, lane]))

  const safeLanes = Array.isArray(lanes) ? lanes : []

  const normalizedLanes = useMemo(() => {
    const fromLive = safeLanes.length
      ? safeLanes.map((lane: any, index: number) => {
          const key = String(lane?.key || lane?.id || lane?.label || `lane-${index}`)
          const blueprint = blueprintByKey.get(key) || laneBlueprints[index] || laneBlueprints[0]
          const rawItems = Array.isArray(lane?.items)
            ? lane.items
            : Array.isArray(lane?.missions)
              ? lane.missions
              : []

          return {
            ...blueprint,
            key,
            label: String(lane?.label || lane?.title || blueprint?.label || key),
            helper: String(lane?.helper || blueprint?.helper || 'Operational lane'),
            items: rawItems,
          }
        })
      : laneBlueprints.map((lane) => ({ ...lane, items: [] }))

    return fromLive.map((lane: any) => ({
      ...lane,
      items: Array.isArray(lane.items) ? lane.items : [],
    }))
  }, [safeLanes])

  const allItems = useMemo(() => {
    return normalizedLanes.flatMap((lane: any) =>
      __filterLiveVisibleMissions(lane.items).map((item: any, index: number) => ({
        ...item,
        __laneKey: lane.key,
        __laneLabel: lane.label,
        __laneIcon: lane.icon,
        __laneBadge: lane.badge,
        __laneAccent: lane.accent,
        __laneOrder: index,
      })),
    )
  }, [normalizedLanes])

  const visibleItems = useMemo(() => {
    let rows = activeLane === 'all'
      ? allItems
      : allItems.filter((item: any) => item.__laneKey === activeLane)

    if (spotlightOnly) {
      rows = rows.filter((item: any) => {
        const status = __carelinkText(item.status || item.lifecycleStage || item.lifecycle_stage, '').toLowerCase()
        const risk = __carelinkText(item.riskLevel || item.risk_level || item.risk, '').toLowerCase()
        const urgent = __carelinkText(item.urgency || item.priority || item.opsPriority || item.ops_priority, '').toLowerCase()
        return status.includes('risk') || risk.includes('high') || urgent.includes('urgent') || urgent.includes('critical')
      })
    }

    const score = (item: any) => {
      const status = __carelinkText(item.status || item.lifecycleStage || item.lifecycle_stage, '').toLowerCase()
      const urgent = __carelinkText(item.urgency || item.priority || item.opsPriority || item.ops_priority, '').toLowerCase()
      const risk = __carelinkText(item.riskLevel || item.risk_level || item.risk, '').toLowerCase()
      let value = 0
      if (urgent.includes('critical')) value += 50
      if (urgent.includes('urgent')) value += 35
      if (risk.includes('high')) value += 30
      if (status.includes('risk')) value += 30
      if (status.includes('progress')) value += 20
      if (status.includes('route')) value += 15
      if (!item.caregiver_id && !item.caregiverId && !item.assignedAgent) value += 10
      return value
    }

    return [...rows].sort((a: any, b: any) => {
      if (sortMode === 'priority') return score(b) - score(a)
      if (sortMode === 'time') {
        const aTime = String(a.startTime || a.start_time || a.scheduledStartTime || a.created_at || '')
        const bTime = String(b.startTime || b.start_time || b.scheduledStartTime || b.created_at || '')
        return aTime.localeCompare(bTime)
      }
      return String(a.__laneLabel || '').localeCompare(String(b.__laneLabel || ''))
    })
  }, [allItems, activeLane, sortMode, spotlightOnly])

  const intelligence = useMemo(() => {
    const total = allItems.length
    const assigned = allItems.filter((item: any) => item.caregiver_id || item.caregiverId || item.assignedAgent).length
    const unassigned = total - assigned
    const active = allItems.filter((item: any) => {
      const status = __carelinkText(item.status || item.lifecycleStage || item.lifecycle_stage, '').toLowerCase()
      return status.includes('route') || status.includes('progress')
    }).length
    const risk = allItems.filter((item: any) => {
      const status = __carelinkText(item.status || item.lifecycleStage || item.lifecycle_stage, '').toLowerCase()
      const riskText = __carelinkText(item.riskLevel || item.risk_level || item.risk, '').toLowerCase()
      return status.includes('risk') || riskText.includes('high')
    }).length

    return { total, assigned, unassigned, active, risk }
  }, [allItems])

  function missionCardDetail(item: any) {
    const missionCode = item?.code || resolvedMissionCode(item)
    const service = __carelinkText(item?.serviceType || item?.service_type || item?.title, 'Service pending')
    const client = __carelinkText(
      item?.clientLabel ||
      item?.familyLabel ||
      item?.familyName ||
      item?.family_name ||
      item?.client_name ||
      item?.customer_name,
      'Family pending',
    )
    const caregiver = __carelinkText(
      item?.assignedAgent ||
      item?.caregiverName ||
      item?.caregiver_name ||
      item?.caregiverLabel,
      item?.caregiver_id || item?.caregiverId ? `Agent #${item?.caregiver_id || item?.caregiverId}` : 'Unassigned',
    )
    const city = __carelinkText(item?.city, 'City pending')
    const zone = __carelinkText(item?.zone, 'Zone pending')
    const start = __carelinkText(item?.startTime || item?.start_time || item?.scheduledStartTime, '—')
    const end = __carelinkText(item?.endTime || item?.end_time || item?.scheduledEndTime, '—')
    const status = __carelinkText(item?.status || item?.lifecycleStage || item?.lifecycle_stage, item.__laneLabel || 'created')
    const urgency = __carelinkText(item?.urgency || item?.priority || item?.opsPriority || item?.ops_priority, 'standard')
    const risk = __carelinkText(item?.riskLevel || item?.risk_level || item?.risk, 'normal')
    const transport = __carelinkText(item?.transportRequired || item?.transport_required || item?.mission_scope || item?.routeMode, 'No route declared')
    const notes = __carelinkExcerpt(item?.notes || item?.instructions || item?.description, 120)

    return { missionCode, service, client, caregiver, city, zone, start, end, status, urgency, risk, transport, notes }
  }

  return (
    <section className="overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-100 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white font-bold [&_*]:!text-white">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-blue-100">
              Dispatch intelligence cockpit
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Dispatch Control — Mission Flow</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-blue-100">
              Multi-navigational operational lanes with real-time mission recognition, assignment visibility, route readiness, risk signals and dossier access.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white backdrop-blur transition hover:bg-white/20"
            >
              {expanded ? 'Compact lanes' : 'Expand lanes'}
            </button>
            <button
              type="button"
              onClick={openAll}
              className="rounded-2xl bg-blue-500 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-400"
            >
              View all missions →
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-5">
          {[
            ['Total flow', intelligence.total, 'All visible mission cards'],
            ['Assigned', intelligence.assigned, 'Agent-linked operations'],
            ['Unassigned', intelligence.unassigned, 'Needs dispatch action'],
            ['Active', intelligence.active, 'Route / in-progress'],
            ['Risk signals', intelligence.risk, 'Needs attention'],
          ].map(([label, value, helper]) => (
            <div key={String(label)} className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-100">{label}</div>
              <div className="mt-2 text-3xl font-black">{value}</div>
              <div className="mt-1 text-xs font-semibold text-blue-100">{helper}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-b border-slate-100 bg-slate-50/80 p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveLane('all')}
              className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                activeLane === 'all'
                  ? 'bg-slate-950 text-white shadow-md'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              All flow ({allItems.length})
            </button>

            {normalizedLanes.map((lane: any) => (
              <button
                key={lane.key}
                type="button"
                onClick={() => setActiveLane(lane.key)}
                className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                  activeLane === lane.key
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="mr-2">{lane.icon}</span>
                {lane.label} ({__filterLiveVisibleMissions(lane.items).length})
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSpotlightOnly(!spotlightOnly)}
              className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                spotlightOnly
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'border border-rose-200 bg-white text-rose-700 hover:bg-rose-50'
              }`}
            >
              Risk spotlight
            </button>

            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as 'priority' | 'time' | 'status')}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm"
            >
              <option value="priority">Sort by priority</option>
              <option value="time">Sort by time</option>
              <option value="status">Sort by status</option>
            </select>

            <button
              type="button"
              onClick={() => setDensity(density === 'executive' ? 'compact' : 'executive')}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
            >
              {density === 'executive' ? 'Compact cards' : 'Executive cards'}
            </button>
          </div>
        </div>
      </div>

      <div className={`grid gap-4 p-5 ${expanded ? 'xl:grid-cols-4 2xl:grid-cols-5' : 'xl:grid-cols-3 2xl:grid-cols-4'}`}>
        {(activeLane === 'all' ? normalizedLanes : normalizedLanes.filter((lane: any) => lane.key === activeLane)).map((lane: any) => {
          const laneItems = visibleItems.filter((item: any) => item.__laneKey === lane.key)
          return (
            <div
              key={lane.key}
              className={`min-h-[260px] rounded-[30px] border bg-gradient-to-br ${lane.gradient} ${lane.ring} p-4 shadow-sm`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ${lane.badge}`}>
                    <span className="mr-2">{lane.icon}</span>
                    {lane.label}
                  </div>
                  <div className="mt-2 text-xs font-bold text-slate-500">{lane.helper}</div>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-full bg-white text-sm font-black text-slate-800 shadow-sm">
                  {laneItems.length}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {laneItems.slice(0, expanded ? 12 : 5).map((item: any, index: number) => {
                  const detail = missionCardDetail(item)
                  const urgent = detail.urgency.toLowerCase().includes('urgent') || detail.urgency.toLowerCase().includes('critical')
                  const risky = detail.risk.toLowerCase().includes('high') || detail.status.toLowerCase().includes('risk')

                  return (
                    <button
                      key={`${lane.key}-${item?.id || detail.missionCode || index}`}
                      type="button"
                      onClick={() => openMission({ ...item, lane: lane.key })}
                      className="group w-full rounded-[24px] border border-white/80 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Mission</div>
                          <div className="mt-1 text-xl font-black tracking-tight text-slate-950">{detail.missionCode}</div>
                          <div className="mt-1 text-sm font-bold text-slate-600">{detail.service}</div>
                        </div>
                        <div className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${
                          risky
                            ? 'bg-rose-100 text-rose-700'
                            : urgent
                              ? 'bg-amber-100 text-amber-700'
                              : lane.badge
                        }`}>
                          {risky ? 'Risk' : urgent ? 'Urgent' : detail.status}
                        </div>
                      </div>

                      <div className={`mt-4 grid gap-2 ${density === 'executive' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Family</div>
                          <div className="mt-1 text-sm font-bold text-slate-800">{detail.client}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Caregiver</div>
                          <div className="mt-1 text-sm font-bold text-slate-800">{detail.caregiver}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Timing</div>
                          <div className="mt-1 text-sm font-bold text-slate-800">{detail.start} → {detail.end}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Location</div>
                          <div className="mt-1 text-sm font-bold text-slate-800">{detail.city} · {detail.zone}</div>
                        </div>
                      </div>

                      {density === 'executive' ? (
                        <>
                          <div className="mt-3 rounded-2xl border border-slate-100 bg-white p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Route / transport</div>
                            <div className="mt-1 text-sm font-bold text-slate-700">{detail.transport}</div>
                          </div>
                          <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-600">
                            {detail.notes}
                          </div>
                        </>
                      ) : null}

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-600">Open dossier</span>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black text-blue-700">Live synced</span>
                        {risky ? <span className="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-black text-rose-700">Supervisor attention</span> : null}
                      </div>
                    </button>
                  )
                })}

                {!laneItems.length ? (
                  <div className="rounded-[24px] border border-dashed border-white/80 bg-white/70 px-4 py-8 text-center">
                    <div className="text-sm font-black text-slate-700">No live items</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">{lane.helper}</div>
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}




function opsValue(value: unknown, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

function opsArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : []
}

function opsTone(value: unknown) {
  const raw = opsValue(value, '').toLowerCase()
  if (raw.includes('risk') || raw.includes('critical') || raw.includes('incident') || raw.includes('late') || raw.includes('blocked')) return 'rose'
  if (raw.includes('pending') || raw.includes('gap') || raw.includes('review') || raw.includes('warning')) return 'amber'
  if (raw.includes('active') || raw.includes('available') || raw.includes('ready') || raw.includes('validated') || raw.includes('completed')) return 'emerald'
  if (raw.includes('route') || raw.includes('progress') || raw.includes('assigned') || raw.includes('booked')) return 'blue'
  if (raw.includes('validation') || raw.includes('audit')) return 'violet'
  return 'slate'
}

function opsToneClass(tone: string) {
  const tones: Record<string, string> = {
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  }
  return tones[tone] || tones.slate
}

function OpsMiniMetric({ label, value, tone = 'slate' }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className={`rounded-2xl border px-3 py-2 ${opsToneClass(tone)}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{label}</div>
      <div className="mt-1 text-lg font-black">{value}</div>
    </div>
  )
}

function OpsSectionShell({
  title,
  subtitle,
  badge,
  tone = 'blue',
  metrics,
  action,
  children,
}: {
  title: string
  subtitle: string
  badge: string
  tone?: string
  metrics?: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
      <div className={`border-b p-5 ${tone === 'dark' ? 'border-slate-800 bg-slate-950 text-white' : 'border-slate-100 bg-gradient-to-br from-white to-slate-50'}`}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] ${tone === 'dark' ? 'border-white/15 bg-white/10 text-white' : opsToneClass(tone)}`}>
              {badge}
            </div>
            <h2 className={`mt-3 text-xl font-black tracking-tight ${tone === 'dark' ? 'text-white' : 'text-slate-950'}`}>{title}</h2>
            <p className={`mt-1 max-w-3xl text-sm font-bold leading-6 ${tone === 'dark' ? 'text-white/75' : 'text-slate-500'}`}>{subtitle}</p>
          </div>
          {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
        </div>
        {metrics ? <div className="mt-4 grid gap-2 md:grid-cols-3 xl:grid-cols-4">{metrics}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function OpsScrollButtons({ targetRef }: { targetRef: React.MutableRefObject<HTMLDivElement | null> }) {
  const scroll = (direction: number) => {
    targetRef.current?.scrollBy({ top: direction * 280, behavior: 'smooth' })
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => scroll(-1)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50"
      >
        ↑ Up
      </button>
      <button
        type="button"
        onClick={() => scroll(1)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50"
      >
        ↓ Down
      </button>
    </div>
  )
}

function OpsEmptyPremium({ title, detail, icon = '◇' }: { title: string; detail: string; icon?: string }) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-white text-xl font-black text-slate-500 shadow-sm">{icon}</div>
      <p className="mt-4 text-sm font-black text-slate-800">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">{detail}</p>
    </div>
  )
}

function AgentReadinessPanel({ agents, open }: { agents: CareLinkAgent[]; open: (item: CareLinkAgent) => void }) {
  const rows = opsArray<CareLinkAgent>(agents)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [view, setView] = useState<'cards' | 'matrix'>('cards')
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const visible = useMemo(() => {
    return rows
      .filter((agent: any) => {
        const haystack = [
          agent.fullName,
          agent.name,
          agent.city,
          agent.zone,
          agent.status,
          ...(Array.isArray(agent.skills) ? agent.skills : []),
        ].join(' ').toLowerCase()

        const matchesQuery = !query || haystack.includes(query.toLowerCase())
        const matchesStatus = statusFilter === 'all' || String(agent.status || '').toLowerCase().includes(statusFilter)
        return matchesQuery && matchesStatus
      })
      .sort((a: any, b: any) => Number(b.readinessScore || 0) - Number(a.readinessScore || 0))
  }, [rows, query, statusFilter])

  const ready = rows.filter((agent: any) => Number(agent.readinessScore || 0) >= 80).length
  const attention = rows.filter((agent: any) => Number(agent.readinessScore || 0) < 60).length
  const available = rows.filter((agent: any) => String(agent.status || '').toLowerCase().includes('available')).length

  return (
    <OpsSectionShell
      title="Agent Readiness"
      subtitle="Live readiness, compliance, skill coverage, availability and field workforce risk signals."
      badge="Workforce readiness cockpit"
      tone="emerald"
      metrics={
        <>
          <OpsMiniMetric label="Live agents" value={rows.length} tone="emerald" />
          <OpsMiniMetric label="Ready" value={ready} tone="blue" />
          <OpsMiniMetric label="Available" value={available} tone="cyan" />
          <OpsMiniMetric label="Needs attention" value={attention} tone={attention ? 'rose' : 'slate'} />
        </>
      }
      action={
        <>
          <button onClick={() => setView(view === 'cards' ? 'matrix' : 'cards')} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50">
            {view === 'cards' ? 'Matrix view' : 'Card view'}
          </button>
          <OpsScrollButtons targetRef={scrollRef} />
        </>
      }
    >
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search agents, skills, zones, compliance..."
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none ring-blue-100 focus:border-blue-300 focus:ring-4"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"
        >
          <option value="all">All statuses</option>
          <option value="available">Available</option>
          <option value="assigned">Assigned</option>
          <option value="offline">Offline</option>
          <option value="risk">At risk</option>
        </select>
      </div>

      <div ref={scrollRef} className="max-h-[520px] overflow-y-auto pr-2">
        {visible.length ? (
          <div className={view === 'cards' ? 'grid gap-3 md:grid-cols-2 xl:grid-cols-3' : 'space-y-2'}>
            {visible.map((agent: any) => {
              const score = Number(agent.readinessScore || 0)
              const tone = score >= 80 ? 'emerald' : score >= 60 ? 'amber' : 'rose'
              const skills = Array.isArray(agent.skills) ? agent.skills : []

              return (
                <button
                  key={agent.id || agent.fullName}
                  onClick={() => open(agent)}
                  className="group rounded-[1.5rem] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Agent profile</div>
                      <h3 className="mt-1 text-lg font-black text-slate-950">{opsValue(agent.fullName || agent.name, 'Unnamed agent')}</h3>
                      <p className="mt-1 text-xs font-bold text-slate-500">{opsValue(agent.city, 'No city')} · {opsValue(agent.zone, 'No zone')}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${opsToneClass(tone)}`}>{score}%</span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Status</div>
                      <div className="mt-1 text-xs font-black text-slate-800">{opsValue(agent.status, 'Unknown')}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Skills</div>
                      <div className="mt-1 text-xs font-black text-slate-800">{skills.length}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Compliance</div>
                      <div className="mt-1 text-xs font-black text-slate-800">{score >= 80 ? 'OK' : 'Review'}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {skills.slice(0, 4).map((skill: string) => (
                      <span key={skill} className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black text-blue-700">{skill}</span>
                    ))}
                    {!skills.length ? <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-700">Skills missing</span> : null}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <span className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Open readiness</span>
                    <span className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600">Assign / compare</span>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <OpsEmptyPremium title="No live agents" detail="Connect the field-agent repository to show readiness, skills, zones, availability, and compliance layers." icon="◎" />
        )}
      </div>
    </OpsSectionShell>
  )
}

function ScheduleCoveragePanel({ coverage, dayOffset, setDayOffset, open }: { coverage: CareLinkCoverageRow[]; dayOffset: number; setDayOffset: (value: number) => void; open: (item: CareLinkCoverageRow) => void }) {
  const rows = opsArray<CareLinkCoverageRow>(coverage)
  const [mode, setMode] = useState<'timeline' | 'capacity'>('timeline')
  const [cityFilter, setCityFilter] = useState('all')
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const day = useMemo(() => {
    const date = new Date()
    date.setDate(date.getDate() + dayOffset)
    return date
  }, [dayOffset])

  const cities = useMemo(() => Array.from(new Set(rows.map((row: any) => opsValue(row.city, 'Unknown')))), [rows])

  const visible = useMemo(() => {
    return rows.filter((row: any) => cityFilter === 'all' || opsValue(row.city, 'Unknown') === cityFilter)
  }, [rows, cityFilter])

  const gapCount = rows.reduce((total: number, row: any) => total + opsArray(row.blocks).filter((block) => block === 'gap').length, 0)
  const riskCount = rows.reduce((total: number, row: any) => total + opsArray(row.blocks).filter((block) => block === 'risk').length, 0)
  const bookedCount = rows.reduce((total: number, row: any) => total + opsArray(row.blocks).filter((block) => block === 'booked' || block === 'progress').length, 0)

  return (
    <OpsSectionShell
      title="Schedule & Coverage"
      subtitle="Daily capacity timeline from live mission demand, field availability, city coverage and route pressure."
      badge="Daily coverage navigator"
      tone="blue"
      metrics={
        <>
          <OpsMiniMetric label="Coverage rows" value={rows.length} tone="blue" />
          <OpsMiniMetric label="Booked blocks" value={bookedCount} tone="emerald" />
          <OpsMiniMetric label="Coverage gaps" value={gapCount} tone={gapCount ? 'amber' : 'slate'} />
          <OpsMiniMetric label="Risk blocks" value={riskCount} tone={riskCount ? 'rose' : 'slate'} />
        </>
      }
      action={
        <>
          <button onClick={() => setDayOffset(dayOffset - 1)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm">‹ Previous</button>
          <button onClick={() => setDayOffset(0)} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white shadow-sm">Today</button>
          <button onClick={() => setDayOffset(dayOffset + 1)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm">Next ›</button>
          <OpsScrollButtons targetRef={scrollRef} />
        </>
      }
    >
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_180px]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Selected day</div>
          <div className="mt-1 text-sm font-black text-slate-900">
            {day.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
          <option value="all">All cities</option>
          {cities.map((city) => <option key={city} value={city}>{city}</option>)}
        </select>
        <button onClick={() => setMode(mode === 'timeline' ? 'capacity' : 'timeline')} className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">
          {mode === 'timeline' ? 'Capacity view' : 'Timeline view'}
        </button>
      </div>

      <div ref={scrollRef} className="max-h-[520px] overflow-y-auto pr-2">
        {visible.length ? (
          <div className="space-y-3">
            {visible.map((row: any) => {
              const blocks = opsArray<string>(row.blocks)
              const gaps = blocks.filter((block) => block === 'gap').length
              const risks = blocks.filter((block) => block === 'risk').length
              const load = opsValue(row.load, 'No load')

              return (
                <button key={row.id || row.label} onClick={() => open(row)} className="w-full rounded-[1.5rem] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-500">Coverage route</div>
                      <h3 className="mt-1 text-lg font-black text-slate-950">{opsValue(row.label, 'Coverage block')}</h3>
                      <p className="mt-1 text-xs font-bold text-slate-500">{opsValue(row.city, 'No city')} · {load}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-black ${opsToneClass(gaps ? 'amber' : 'emerald')}`}>{gaps} gaps</span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-black ${opsToneClass(risks ? 'rose' : 'slate')}`}>{risks} risks</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-10 gap-1">
                    {(blocks.length ? blocks : Array.from({ length: 10 }, () => 'empty')).map((block, index) => (
                      <span
                        key={index}
                        title={block}
                        className={`h-7 rounded-lg ${
                          block === 'gap' ? 'bg-amber-300' :
                          block === 'risk' ? 'bg-rose-300' :
                          block === 'progress' ? 'bg-blue-300' :
                          block === 'done' ? 'bg-slate-300' :
                          block === 'booked' ? 'bg-emerald-300' :
                          'bg-slate-100'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Open coverage</span>
                    <span className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600">Resolve gaps</span>
                    <span className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600">Review capacity</span>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <OpsEmptyPremium title="No coverage loaded" detail="Connect schedule blocks and availability rules to display daily coverage, gaps, overloads, and city-level risk." icon="↔" />
        )}
      </div>
    </OpsSectionShell>
  )
}

function IncidentsPanel({ incidents, open }: { incidents: CareLinkIncident[]; open: (item: CareLinkIncident) => void }) {
  const rows = opsArray<CareLinkIncident>(incidents)
  const [severity, setSeverity] = useState('all')
  const [query, setQuery] = useState('')
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const visible = useMemo(() => {
    return rows.filter((incident: any) => {
      const haystack = [incident.title, incident.detail, incident.severity, incident.status, incident.city].join(' ').toLowerCase()
      const matchesQuery = !query || haystack.includes(query.toLowerCase())
      const matchesSeverity = severity === 'all' || haystack.includes(severity)
      return matchesQuery && matchesSeverity
    })
  }, [rows, severity, query])

  const critical = rows.filter((incident: any) => opsTone(incident.severity || incident.status || incident.title) === 'rose').length
  const review = rows.filter((incident: any) => opsTone(incident.status || incident.detail) === 'amber').length

  return (
    <OpsSectionShell
      title="Incidents & Alerts"
      subtitle="Escalations, SLA-sensitive field alerts, risk triage, and supervisor intervention cockpit."
      badge="Incident command"
      tone="rose"
      metrics={
        <>
          <OpsMiniMetric label="Open alerts" value={rows.length} tone={rows.length ? 'rose' : 'slate'} />
          <OpsMiniMetric label="Critical" value={critical} tone={critical ? 'rose' : 'slate'} />
          <OpsMiniMetric label="Needs review" value={review} tone={review ? 'amber' : 'slate'} />
          <OpsMiniMetric label="Resolved today" value="Live" tone="emerald" />
        </>
      }
      action={<OpsScrollButtons targetRef={scrollRef} />}
    >
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search incidents, alerts, city, mission..." className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100" />
        <select value={severity} onChange={(event) => setSeverity(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
          <option value="all">All severities</option>
          <option value="critical">Critical</option>
          <option value="risk">Risk</option>
          <option value="warning">Warning</option>
          <option value="review">Review</option>
        </select>
      </div>

      <div ref={scrollRef} className="max-h-[520px] overflow-y-auto pr-2">
        {visible.length ? (
          <div className="space-y-3">
            {visible.map((incident: any) => {
              const tone = opsTone(incident.severity || incident.status || incident.title)
              return (
                <button key={incident.id || incident.title} onClick={() => open(incident)} className="w-full rounded-[1.5rem] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">Escalation</div>
                      <h3 className="mt-1 text-lg font-black text-slate-950">{opsValue(incident.title, 'Incident')}</h3>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{opsValue(incident.detail, 'No incident detail provided')}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${opsToneClass(tone)}`}>{opsValue(incident.severity || incident.status, 'Open')}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-black text-white">Open escalation</span>
                    <span className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600">Assign owner</span>
                    <span className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600">SLA audit</span>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <OpsEmptyPremium title="No incidents" detail="Incident feed is empty. Live alerts, risk escalations and SLA exceptions will appear here when connected." icon="△" />
        )}
      </div>
    </OpsSectionShell>
  )
}

function ReportsPanel({ reports, open }: { reports: CareLinkReport[]; open: (item: CareLinkReport) => void }) {
  const rows = opsArray<CareLinkReport>(reports)
  const [queueFilter, setQueueFilter] = useState('all')
  const [view, setView] = useState<'cards' | 'rows'>('cards')
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const visible = useMemo(() => {
    return rows.filter((report: any) => {
      const haystack = [report.status, report.reportType, report.missionCode, report.clientLabel, report.agentLabel].join(' ').toLowerCase()
      return queueFilter === 'all' || haystack.includes(queueFilter)
    })
  }, [rows, queueFilter])

  const pending = rows.filter((report: any) => String(report.status || '').toLowerCase().includes('pending')).length
  const finance = rows.filter((report: any) => String(report.status || report.reportType || '').toLowerCase().includes('finance')).length
  const validation = rows.filter((report: any) => String(report.status || '').toLowerCase().includes('valid')).length

  return (
    <OpsSectionShell
      title="Reports Validation Queue"
      subtitle="Mission reports requiring review, correction, validation, finance handoff and audit readiness."
      badge="Validation command queue"
      tone="violet"
      metrics={
        <>
          <OpsMiniMetric label="Reports" value={rows.length} tone="violet" />
          <OpsMiniMetric label="Pending" value={pending} tone={pending ? 'amber' : 'slate'} />
          <OpsMiniMetric label="Validation" value={validation} tone="blue" />
          <OpsMiniMetric label="Finance handoff" value={finance} tone="emerald" />
        </>
      }
      action={
        <>
          <button onClick={() => setView(view === 'cards' ? 'rows' : 'cards')} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm">
            {view === 'cards' ? 'Row view' : 'Card view'}
          </button>
          <OpsScrollButtons targetRef={scrollRef} />
        </>
      }
    >
      <div className="mb-4">
        <select value={queueFilter} onChange={(event) => setQueueFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
          <option value="all">All report queues</option>
          <option value="pending">Pending</option>
          <option value="validation">Validation</option>
          <option value="finance">Finance</option>
          <option value="correction">Correction</option>
        </select>
      </div>

      <div ref={scrollRef} className="max-h-[520px] overflow-y-auto pr-2">
        {visible.length ? (
          <div className={view === 'cards' ? 'grid gap-3 xl:grid-cols-2' : 'space-y-2'}>
            {visible.map((report: any) => {
              const tone = opsTone(report.status)
              return (
                <button key={report.id || report.missionCode} onClick={() => open(report)} className="w-full rounded-[1.5rem] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-500">Mission report</div>
                      <h3 className="mt-1 text-lg font-black text-slate-950">{opsValue(report.missionCode, 'Mission pending')}</h3>
                      <p className="mt-1 text-sm font-bold text-slate-500">{opsValue(report.clientLabel, 'Client pending')} · {opsValue(report.agentLabel, 'Agent pending')}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${opsToneClass(tone)}`}>{opsValue(report.status, 'Pending')}</span>
                  </div>
                  <div className="mt-4 grid gap-2 md:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Type</div>
                      <div className="mt-1 text-xs font-black text-slate-800">{opsValue(report.reportType, 'Report')}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Validation</div>
                      <div className="mt-1 text-xs font-black text-slate-800">{opsValue(report.status, 'Pending')}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Finance</div>
                      <div className="mt-1 text-xs font-black text-slate-800">Ready check</div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-black text-white">Open report</span>
                    <span className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600">Validate</span>
                    <span className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600">Finance handoff</span>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <OpsEmptyPremium title="No reports pending" detail="Validation queue is empty until live mission reports, corrections, and finance handoffs are connected." icon="▣" />
        )}
      </div>
    </OpsSectionShell>
  )
}

function FollowUpPanel({ followUps, open }: { followUps: any[]; open: (title: string, detail: string) => void }) {
  const rows = opsArray<any>(followUps)
  const [filter, setFilter] = useState('all')
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const visible = useMemo(() => {
    return rows.filter((item: any) => {
      const haystack = [item.title, item.helper, item.status, item.priority, item.type].join(' ').toLowerCase()
      return filter === 'all' || haystack.includes(filter)
    })
  }, [rows, filter])

  const urgent = rows.filter((item: any) => opsTone(item.priority || item.status || item.title) === 'rose').length
  const pending = rows.filter((item: any) => String(item.status || '').toLowerCase().includes('pending')).length
  const completed = rows.filter((item: any) => String(item.status || '').toLowerCase().includes('completed')).length

  return (
    <OpsSectionShell
      title="Operational Follow-up"
      subtitle="Tasks, supervisor follow-ups, unresolved actions, SLA reminders and production handoff tracking."
      badge="Follow-up execution layer"
      tone="amber"
      metrics={
        <>
          <OpsMiniMetric label="Follow-ups" value={rows.length} tone="amber" />
          <OpsMiniMetric label="Pending" value={pending} tone={pending ? 'amber' : 'slate'} />
          <OpsMiniMetric label="Urgent" value={urgent} tone={urgent ? 'rose' : 'slate'} />
          <OpsMiniMetric label="Completed" value={completed} tone="emerald" />
        </>
      }
      action={<OpsScrollButtons targetRef={scrollRef} />}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {['all', 'pending', 'urgent', 'sla', 'finance', 'report', 'completed'].map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`rounded-xl px-3 py-2 text-xs font-black capitalize ${
              filter === item
                ? 'bg-slate-950 text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="max-h-[520px] overflow-y-auto pr-2">
        {visible.length ? (
          <div className="space-y-3">
            {visible.map((item: any) => {
              const tone = opsTone(item.priority || item.status || item.title)
              return (
                <button key={item.id || item.title} onClick={() => open(opsValue(item.title, 'Follow-up'), opsValue(item.helper || item.detail, 'No follow-up detail'))} className="w-full rounded-[1.5rem] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-500">Action item</div>
                      <h3 className="mt-1 text-lg font-black text-slate-950">{opsValue(item.title, 'Follow-up')}</h3>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{opsValue(item.helper || item.detail, 'No follow-up detail')}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${opsToneClass(tone)}`}>{opsValue(item.value || item.status || item.priority, 'Open')}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-black text-white">Open action</span>
                    <span className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600">Assign owner</span>
                    <span className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600">Mark resolved</span>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <OpsEmptyPremium title="No follow-ups" detail="Operational follow-ups will appear when connected to live tasks, reports, mission exceptions and supervisor actions." icon="↻" />
        )}
      </div>
    </OpsSectionShell>
  )
}



function Panel({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) { return <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-start justify-between gap-4"><div><h2 className="text-lg font-black tracking-tight">{title}</h2>{subtitle ? <p className="text-xs font-bold text-slate-500">{subtitle}</p> : null}</div>{action}</div>{children}</section> }
function EmptyMini({ label }: { label: string }) { return <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-3 text-center text-xs font-black text-slate-400">{label}</div> }
function EmptyState({ title, detail }: { title: string; detail: string }) { return <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center"><p className="font-black text-slate-800">{title}</p><p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">{detail}</p></div> }

function SearchResults({ items, open }: { items: Array<CareLinkMission & { lane?: string }>; open: (item: CareLinkMission & { lane?: string }) => void }) { return <div className="absolute right-8 top-[118px] z-50 w-[520px] rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl">{items.length ? items.map((item) => <button key={item.id} onClick={() => open(item)} className="block w-full rounded-2xl p-3 text-left hover:bg-slate-50"><b>{resolvedMissionCode(item)}</b><p className="text-sm text-slate-500">{item.clientLabel} · {item.city} · {item.lane}</p></button>) : <EmptyMini label="No matching live mission" />}</div> }

function EnterpriseModal({ modal, close, runAction }: { modal: ModalState; close: () => void; runAction: (action: string, entityId?: string) => void }) {
  if (modal.type === 'none') return null
  const title = modal.type === 'command' ? modal.title : modal.type === 'kpi' ? modal.item.label : modal.type === 'mission' ? resolvedMissionCode(modal.item) : modal.type === 'agent' ? modal.item.fullName : modal.type === 'incident' ? modal.item.title : modal.type === 'report' ? modal.item.missionCode : modal.type === 'coverage' ? modal.item.label : modal.item.name
  const detail = modal.type === 'command' ? modal.detail : 'Enterprise workflow detail. This modal is live-data safe and contains no fake operational references.'
  const entityId = modal.type !== 'command' && 'id' in modal.item ? String(modal.item.id) : undefined
  return <div className="fixed inset-0 z-[9999] grid place-items-center bg-slate-950/45 p-6 backdrop-blur-sm"><div className="max-h-[88vh] w-full max-w-5xl overflow-auto rounded-[2rem] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between border-b border-slate-100 pb-4"><div><p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">CareLink Ops Enterprise Workflow</p><h3 className="mt-2 text-2xl font-black">{title}</h3><p className="mt-1 text-sm text-slate-500">{detail}</p></div><button onClick={close} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 font-black">×</button></div><div className="mt-5 grid grid-cols-3 gap-4"><InfoBox label="Lifecycle" value="Live workflow required" /><InfoBox label="Readiness" value="Calculated from real data" /><InfoBox label="Audit" value="No fake records written" /></div><div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5"><p className="font-black">Production note</p><p className="mt-2 text-sm leading-6 text-slate-600">This clean rebuild intentionally shows empty states unless your backend returns real missions, agents, incidents, reports, coverage rows, cities, and zones. No static mission references, seeded families, or fake agents are included.</p></div><div className="mt-6 grid grid-cols-4 gap-3"><button onClick={() => runAction('open_board', entityId)} className="rounded-2xl bg-slate-950 px-4 py-3 font-black text-white">Open board</button><button onClick={() => runAction('assign_owner', entityId)} className="rounded-2xl border border-slate-200 px-4 py-3 font-black">Assign owner</button><button onClick={() => runAction('escalate', entityId)} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 font-black text-amber-800">Escalate</button><button onClick={() => runAction('validate', entityId)} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-black text-emerald-800">Validate</button></div></div></div>
}
function InfoBox({ label, value }: { label: string; value: string }) { return <div className="rounded-3xl border border-slate-200 p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p><p className="mt-2 font-black text-slate-800">{value}</p></div> }
function ActionLog({ logs }: { logs: string[] }) { return logs.length ? <div className="fixed bottom-5 right-5 z-[9998] w-80 space-y-2">{logs.map((log, index) => <div key={`${log}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-3 text-sm font-bold shadow-xl">{log}</div>)}</div> : null }

export default CareLinkOpsProductionDashboard
