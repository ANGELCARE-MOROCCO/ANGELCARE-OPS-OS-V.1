'use client'


import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CareLinkCreateMissionDossierModal } from '@/components/carelink/ops/missions/CareLinkCreateMissionDossierModal'
import type { DispatchActionRequest, DispatchAgent, DispatchIncident, DispatchLane, DispatchMessage, DispatchMission, DispatchPayload, DispatchSector } from '@/lib/carelink/ops-dispatch-types'

import { resolvedMissionCode } from '@/lib/missions/mission-codes'


type DispatchLiveRecord = Record<string, any>

function __dispatchLiveText(value: unknown, fallback = '') {
  return value === null || value === undefined || value === '' ? fallback : String(value)
}

function __dispatchLiveVisible(row: DispatchLiveRecord) {
  if (!row) return false

  const status = __dispatchLiveText(
    row.status ||
    row.lifecycle_stage ||
    row.lifecycleStage ||
    row.dossier_status ||
    row.dossierStatus ||
    row.dispatchStatus ||
    row.dispatch_status,
    ''
  ).toLowerCase()

  if (row.is_archived === true || row.isArchived === true) return false
  if (status.includes('deleted') || status.includes('archived') || status.includes('cancelled')) return false

  return true
}

function __dispatchLaneKey(row: DispatchLiveRecord) {
  const status = __dispatchLiveText(
    row.status ||
    row.lifecycle_stage ||
    row.lifecycleStage ||
    row.dispatchStatus ||
    row.dispatch_status ||
    row.readinessStatus ||
    'new_request',
    ''
  ).toLowerCase()

  if (status.includes('risk') || status.includes('incident') || status.includes('blocked')) return 'at_risk'
  if (status.includes('escalat')) return 'escalations'
  if (status.includes('site') || status.includes('progress') || status.includes('started')) return 'on_site'
  if (status.includes('route') || status.includes('travel')) return 'en_route'
  if (status.includes('accepted') || status.includes('confirm')) return 'accepted'
  if (status.includes('assign') || row.caregiver_id || row.caregiverId || row.assignedAgent || row.caregiverName) return 'assigned'
  if (status.includes('propos')) return 'proposed'
  if (status.includes('match')) return 'matching'
  if (status.includes('ready')) return 'ready_for_dispatch'
  if (status.includes('qual')) return 'qualification'
  return 'new_requests'
}

function __dispatchMissionDate(row: DispatchLiveRecord) {
  const raw =
    row.mission_date ||
    row.missionDate ||
    row.dateLabel ||
    row.scheduledStart ||
    row.scheduled_start ||
    row.scheduled_at ||
    row.created_at ||
    row.createdAt ||
    ''

  if (!raw) return ''
  const value = String(raw)

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10)

  return parsed.toISOString().slice(0, 10)
}

function __dispatchNormalizeMission(row: DispatchLiveRecord, index: number) {
  const code =
    resolvedMissionCode(row) ||
    row.code ||
    (row as any).mission_reference ||
    row.missionReference ||
    (row as any).dossier_reference ||
    row.dossierReference ||
    `CARE-${row.id || index + 1}`

  const laneKey = __dispatchLaneKey(row)

  return {
    ...row,
    id: row.id || row.mission_id || row.missionId || code || index,
    code,
    mission_code: code,
    missionCode: code,
    laneKey,
    dispatchLane: laneKey,
    workflow_lane: laneKey,
    service_type: row.service_type || row.serviceType || row.title || row.mission_type || 'Mission AngelCare',
    serviceType: row.serviceType || row.service_type || row.title || row.mission_type || 'Mission AngelCare',
    client_name:
      row.client_name ||
      row.clientName ||
      row.clientLabel ||
      row.familyName ||
      row.family_name ||
      (row.family_id || row.familyId ? `Family #${row.family_id || row.familyId}` : 'Family pending'),
    clientName:
      row.clientName ||
      row.client_name ||
      row.clientLabel ||
      row.familyName ||
      row.family_name ||
      (row.family_id || row.familyId ? `Family #${row.family_id || row.familyId}` : 'Family pending'),
    family_name:
      row.family_name ||
      row.familyName ||
      row.clientLabel ||
      row.clientName ||
      (row.family_id || row.familyId ? `Family #${row.family_id || row.familyId}` : 'Family pending'),
    familyName:
      row.familyName ||
      row.family_name ||
      row.clientLabel ||
      row.clientName ||
      (row.family_id || row.familyId ? `Family #${row.family_id || row.familyId}` : 'Family pending'),
    agent_name:
      row.agent_name ||
      row.agentName ||
      row.caregiverName ||
      row.caregiver_name ||
      row.assignedAgent ||
      (row.caregiver_id || row.caregiverId ? `Agent #${row.caregiver_id || row.caregiverId}` : 'Unassigned'),
    agentName:
      row.agentName ||
      row.agent_name ||
      row.caregiverName ||
      row.caregiver_name ||
      row.assignedAgent ||
      (row.caregiver_id || row.caregiverId ? `Agent #${row.caregiver_id || row.caregiverId}` : 'Unassigned'),
    caregiver_name:
      row.caregiver_name ||
      row.caregiverName ||
      row.agentName ||
      row.agent_name ||
      row.assignedAgent ||
      (row.caregiver_id || row.caregiverId ? `Agent #${row.caregiver_id || row.caregiverId}` : 'Unassigned'),
    caregiverName:
      row.caregiverName ||
      row.caregiver_name ||
      row.agentName ||
      row.agent_name ||
      row.assignedAgent ||
      (row.caregiver_id || row.caregiverId ? `Agent #${row.caregiver_id || row.caregiverId}` : 'Unassigned'),
    city: row.city || 'City pending',
    zone: row.zone || 'Zone pending',
    priority: row.priority || row.urgency || row.opsPriority || 'standard',
    readiness: row.readiness || row.readinessStatus || row.readiness_status || row.status || 'pending',
    readiness_status: row.readiness_status || row.readinessStatus || row.status || 'pending',
    readinessStatus: row.readinessStatus || row.readiness_status || row.status || 'pending',
    readiness_score: Number(row.readiness_score ?? row.readinessScore ?? 0),
    readinessScore: Number(row.readinessScore ?? row.readiness_score ?? 0),
    start_time: row.start_time || row.startTime || row.scheduledStartTime || row.scheduled_start_time || '—',
    startTime: row.startTime || row.start_time || row.scheduledStartTime || row.scheduled_start_time || '—',
    end_time: row.end_time || row.endTime || row.scheduledEndTime || row.scheduled_end_time || '—',
    endTime: row.endTime || row.end_time || row.scheduledEndTime || row.scheduled_end_time || '—',
    mission_date: row.mission_date || row.missionDate || __dispatchMissionDate(row),
    missionDate: row.missionDate || row.mission_date || __dispatchMissionDate(row),
    notes: row.notes || row.instructions || row.description || '',
    latitude: row.latitude || row.lat,
    longitude: row.longitude || row.lng || row.long,
    lat: row.lat || row.latitude,
    lng: row.lng || row.longitude || row.long,
  }
}

function __dispatchCollectLiveRows(payload: any) {
  const source = payload || {}
  const nested = source.data || source.payload || source.live || source.dashboard || source.bridge || {}

  const buckets = [
    source.missions,
    source.records,
    source.dossiers,
    source.items,
    source.mapMarkers,
    source.mapPoints,
    source.markers,
    nested.missions,
    nested.records,
    nested.dossiers,
    nested.items,
    nested.mapMarkers,
    nested.mapPoints,
    nested.markers,
  ]

  const laneBuckets = [
    source.lanes,
    source.dispatchLanes,
    nested.lanes,
    nested.dispatchLanes,
  ]

  const rows: DispatchLiveRecord[] = []

  for (const bucket of buckets) {
    if (Array.isArray(bucket)) rows.push(...bucket)
  }

  for (const lanes of laneBuckets) {
    if (!Array.isArray(lanes)) continue
    for (const lane of lanes) {
      if (Array.isArray(lane?.items)) rows.push(...lane.items)
      if (Array.isArray(lane?.missions)) rows.push(...lane.missions)
    }
  }

  const seen = new Set<string>()

  return rows
    .filter(Boolean)
    .filter(__dispatchLiveVisible)
    .map(__dispatchNormalizeMission)
    .filter((row, index) => {
      const key = String(row.id || row.code || (row as any).mission_reference || (row as any).dossier_reference || index)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function __dispatchBuildLiveAgents(rows: DispatchLiveRecord[]) {
  const map = new Map<string, any>()

  for (const row of rows) {
    const id = __dispatchLiveText(row.caregiver_id || row.caregiverId || row.agentId || row.agent_id, '')
    const name = __dispatchLiveText(row.caregiverName || row.agentName || row.assignedAgent, id ? `Agent #${id}` : '')

    if (!id && !name) continue

    const key = id || name
    const current = map.get(key) || {
      id: key,
      fullName: name || `Agent #${id}`,
      name: name || `Agent #${id}`,
      city: row.city || '—',
      zone: row.zone || '—',
      status: 'assigned',
      skills: [],
      missionCount: 0,
      readinessScore: 82,
      latitude: row.agentLatitude || row.caregiverLatitude,
      longitude: row.agentLongitude || row.caregiverLongitude,
      lat: row.agentLatitude || row.caregiverLatitude,
      lng: row.agentLongitude || row.caregiverLongitude,
    }

    const service = __dispatchLiveText(row.serviceType || row.service_type || row.title, '')
    if (service && !current.skills.includes(service)) current.skills.push(service)
    current.missionCount += 1

    map.set(key, current)
  }

  return Array.from(map.values())
}

function __dispatchBuildLiveKpis(rows: DispatchLiveRecord[], agents: DispatchLiveRecord[]) {
  const lane = (key: string) => rows.filter((row) => __dispatchLaneKey(row) === key).length

  return {
    unassignedMissions: lane('new_requests') + lane('qualification') + lane('ready_for_dispatch'),
    dispatchBacklog: rows.length,
    agentsReady: agents.length,
    missionsAtRisk: lane('at_risk'),
    escalationsOpen: lane('escalations') + lane('at_risk'),
    slaBreaches: rows.filter((row) => {
      const priority = __dispatchLiveText(row.priority || row.urgency || row.opsPriority, '').toLowerCase()
      return priority.includes('late') || priority.includes('breach') || priority.includes('critical')
    }).length,
  }
}

function __dispatchBuildLiveCommunications(rows: DispatchLiveRecord[]) {
  return rows
    .filter((row) => row.notes || row.instructions || row.description)
    .slice(0, 12)
    .map((row) => ({
      id: `note-${row.id || row.code}`,
      title: row.code || row.missionCode || row.mission_code,
      body: row.notes || row.instructions || row.description,
      channel: 'Dispatch note',
      created_at: row.updated_at || row.created_at || row.createdAt,
    }))
}

function __dispatchBuildLiveIncidents(rows: DispatchLiveRecord[]) {
  return rows
    .filter((row) => ['at_risk', 'escalations'].includes(__dispatchLaneKey(row)))
    .map((row) => ({
      id: `incident-${row.id || row.code}`,
      title: `Risk signal · ${row.code || row.missionCode || row.mission_code}`,
      mission_code: row.code || row.missionCode || row.mission_code,
      severity: row.priority || row.urgency || row.riskLevel || 'risk',
      status: row.status || row.lifecycle_stage || 'open',
      city: row.city,
      zone: row.zone,
      mission_id: row.id,
    }))
}

function __dispatchBuildLiveQueue(rows: DispatchLiveRecord[]) {
  return rows.map((row) => ({
    ...row,
    mission: row.code || row.missionCode || row.mission_code,
    priority: row.priority || 'standard',
    ready: row.readinessScore || row.readiness_score || 0,
  }))
}


declare global {
  interface Window {
    L?: any
  }
}

type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'import' }
  | { type: 'broadcast' }
  | { type: 'batch' }
  | { type: 'mission'; mission: DispatchMission }
  | { type: 'agent'; agent: DispatchAgent }
  | { type: 'incident'; incident: DispatchIncident }
  | { type: 'sector'; sector: DispatchSector }
  | { type: 'action'; title: string; body: string }

const CARELINK_OPS_SIDE_NAV = [
  { label: 'Overview', href: '/carelink-ops' },
  { label: 'Dispatch', href: '/carelink-ops/dispatch' },
  { label: 'Missions', href: '/carelink-ops/missions' },
  { label: 'Agents', href: '/carelink-ops/agents' },
  { label: 'Schedule', href: '/carelink-ops/schedule' },
  { label: 'Incidents', href: '/carelink-ops/incidents' },
  { label: 'Reports', href: '/carelink-ops/reports' },
  { label: 'Compliance', href: '/carelink-ops/compliance' },
  { label: 'Settings', href: '/carelink-ops/settings' },
] as const

const NAV = [
  { label: 'Dispatch Board', href: '/carelink-ops/dispatch' },
  { label: 'Live Map', href: '/carelink-ops/dispatch/live-map' },
  { label: 'Matching Engine', href: '/carelink-ops/dispatch/matching-engine' },
  { label: 'Agent Pool', href: '/carelink-ops/dispatch/agent-pool' },
  { label: 'Schedule', href: '/carelink-ops/dispatch/schedule' },
  { label: 'SLA & Escalations', href: '/carelink-ops/dispatch/sla-escalations' },
  { label: 'Communications', href: '/carelink-ops/dispatch/communications' },
  { label: 'Audit Trail', href: '/carelink-ops/dispatch/audit-trail' },
] as const

const EMPTY_PAYLOAD: DispatchPayload = {
  ok: true,
  source: 'live-empty',
  generatedAt: '—',
  kpis: [],
  lanes: [],
  missions: [],
  agents: [],
  sectors: [],
  incidents: [],
  communications: [],
  auditTrail: [],
  metadata: { dbConnected: false, schemaReady: false, tablesChecked: [], warnings: [] },
}

function normalizePayload(payload?: Partial<DispatchPayload> | null): DispatchPayload {
  return {
    ...EMPTY_PAYLOAD,
    ...(payload || {}),
    kpis: Array.isArray(payload?.kpis) ? payload.kpis : [],
    lanes: Array.isArray(payload?.lanes) ? payload.lanes : [],
    missions: Array.isArray(payload?.missions) ? payload.missions : [],
    agents: Array.isArray(payload?.agents) ? payload.agents : [],
    sectors: Array.isArray(payload?.sectors) ? payload.sectors : [],
    incidents: Array.isArray(payload?.incidents) ? payload.incidents : [],
    communications: Array.isArray(payload?.communications) ? payload.communications : [],
    auditTrail: Array.isArray(payload?.auditTrail) ? payload.auditTrail : [],
    metadata: {
      ...EMPTY_PAYLOAD.metadata,
      ...(payload?.metadata || {}),
      tablesChecked: Array.isArray(payload?.metadata?.tablesChecked) ? payload.metadata.tablesChecked : [],
      warnings: Array.isArray(payload?.metadata?.warnings) ? payload.metadata.warnings : [],
    },
  }
}

function fmtTime(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function toneClass(tone?: string) {
  const map: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    orange: 'bg-orange-50 text-orange-700 ring-orange-100',
    red: 'bg-rose-50 text-rose-700 ring-rose-100',
    violet: 'bg-violet-50 text-violet-700 ring-violet-100',
    slate: 'bg-slate-50 text-slate-700 ring-slate-100',
  }
  return map[tone || 'slate'] || map.slate
}

function statusLabel(status?: string | null) {
  return String(status || 'new_request').replaceAll('_', ' ')
}


function missionNumericId(mission?: DispatchMission | null) {
  const raw = mission?.id
  const parsed = Number(raw)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

function initials(name?: string | null) {
  const parts = String(name || 'AC').trim().split(/\s+/).filter(Boolean)
  return (parts[0]?.[0] || 'A') + (parts[1]?.[0] || 'C')
}

export function CareLinkDispatchControlCenter({ initialPayload }: { initialPayload?: any }) {
  const [payload, setPayload] = useState<DispatchPayload>
      (() => normalizePayload(initialPayload))
  const [query, setQuery] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [readinessFilter, setReadinessFilter] = useState('')
  const [selectedMissionIds, setSelectedMissionIds] = useState<string[]>([])
  const [selectedMission, setSelectedMission] = useState<DispatchMission | null>(() => initialPayload?.missions?.[0] || null)
  const [dossierPreviewMission, setDossierPreviewMission] = useState<any | null>(null)
  const [dossierPreviewLoading, setDossierPreviewLoading] = useState(false)
  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const [loading, setLoading] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)
  const [log, setLog] = useState<string[]>([])

  const safePayload = useMemo(() => normalizePayload(payload), [payload])

  const filteredMissions = useMemo(() => {
    const q = query.trim().toLowerCase()
    return safePayload.missions.filter((mission) => {
      const text = [mission.mission_code, mission.service_type, mission.client_name, mission.beneficiary_name, mission.city, mission.zone, mission.assigned_agent_name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      const readiness = mission.readiness_score ?? 0
      return (
        (!q || text.includes(q)) &&
        (!cityFilter || mission.city === cityFilter) &&
        (!serviceFilter || mission.service_type === serviceFilter) &&
        (!priorityFilter || mission.priority === priorityFilter) &&
        (!readinessFilter || (readinessFilter === 'blocked' ? readiness < 50 : readinessFilter === 'warning' ? readiness >= 50 && readiness < 80 : readiness >= 80))
      )
    })
  }, [safePayload.missions, query, cityFilter, serviceFilter, priorityFilter, readinessFilter])

  const lanes = useMemo<DispatchLane[]>(() => {
    return safePayload.lanes.map((lane) => ({
      ...lane,
      missions: filteredMissions.filter((mission) => mission.status === lane.key),
      count: filteredMissions.filter((mission) => mission.status === lane.key).length,
    }))
  }, [filteredMissions, safePayload.lanes])

  const cities = useMemo(() => Array.from(new Set(safePayload.sectors.map((s) => s.city_name).concat(safePayload.missions.map((m) => m.city || '')).filter(Boolean))).sort(), [safePayload.sectors, safePayload.missions])
  const services = useMemo(() => Array.from(new Set(safePayload.missions.map((m) => m.service_type || '').filter(Boolean))).sort(), [safePayload.missions])
  const priorities = useMemo(() => Array.from(new Set(safePayload.missions.map((m) => m.priority || '').filter(Boolean))).sort(), [safePayload.missions])

  const selectedMissionLive = useMemo(() => {
    if (!selectedMission) return safePayload.missions[0] || null
    return safePayload.missions.find((mission) => mission.id === selectedMission.id) || selectedMission
  }, [safePayload.missions, selectedMission])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/carelink/ops/live-missions', { method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store' })
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        const text = await res.text()
        throw new Error(`Dispatch API returned non-JSON: ${text.slice(0, 160)}`)
      }
      const json = normalizePayload(await res.json())
      setPayload(json)
      setSelectedMission((current) => (current ? json.missions.find((mission) => mission.id === current.id) || current : json.missions[0] || null))
      setLog((current) => [`Dispatch board refreshed from live API.`, ...current].slice(0, 8))
    } catch (error) {
      setLog((current) => [`Refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`, ...current].slice(0, 8))
    } finally {
      setLoading(false)
    }
  }, [])

  const runAction = useCallback(async (input: DispatchActionRequest) => {
    setActionBusy(true)
    try {
      const res = await fetch('/api/carelink/ops/live-missions/actions', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || json.message || 'Dispatch action failed')
      setLog((current) => [`${json.message}`, ...current].slice(0, 8))
      await refresh()
      setModal({ type: 'none' })
      return true
    } catch (error) {
      setLog((current) => [`Action failed: ${error instanceof Error ? error.message : 'Unknown error'}`, ...current].slice(0, 8))
      return false
    } finally {
      setActionBusy(false)
    }
  }, [refresh])

  const toggleMission = (id: string) => setSelectedMissionIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]))

  async function openMissionDossier(mission: DispatchMission) {
    setSelectedMission(mission)
    setDossierPreviewMission(mission)

    const id = missionNumericId(mission)
    if (!id) return

    setDossierPreviewLoading(true)
    try {
      const response = await fetch(`/api/missions/dossiers/${id}`, { cache: 'no-store', headers: { Accept: 'application/json' } })
      const json = await response.json().catch(() => null)
      if (response.ok && json?.ok && json.data) setDossierPreviewMission(json.data)
    } catch (error) {
      console.warn('[CareLinkDispatch] Unable to load full mission dossier, using dispatch row fallback', error)
    } finally {
      setDossierPreviewLoading(false)
    }
  }

  const liveDispatchRows = useMemo(() => __dispatchCollectLiveRows(initialPayload), [initialPayload])
  const liveDispatchAgents = useMemo(() => __dispatchBuildLiveAgents(liveDispatchRows), [liveDispatchRows])
  const liveDispatchKpis = useMemo(() => __dispatchBuildLiveKpis(liveDispatchRows, liveDispatchAgents), [liveDispatchRows, liveDispatchAgents])
  const liveDispatchCommunications = useMemo(() => __dispatchBuildLiveCommunications(liveDispatchRows), [liveDispatchRows])
  const liveDispatchIncidents = useMemo(() => __dispatchBuildLiveIncidents(liveDispatchRows), [liveDispatchRows])
  const liveDispatchQueue = useMemo(() => __dispatchBuildLiveQueue(liveDispatchRows), [liveDispatchRows])
  const hasLiveDispatchRows = liveDispatchRows.length > 0


  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="min-h-screen">
        

        <section className="min-w-0 border-x border-slate-200 bg-white/80">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight">DISPATCH CONTROL CENTER</h1>
                <p className="text-sm font-semibold text-slate-500">Real-time mission distribution, matching & agent management.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">{new Date(safePayload.generatedAt === '—' ? 0 : safePayload.generatedAt).getTime() ? fmtTime(safePayload.generatedAt) : 'Live dispatch'}</div>
                <div className="flex w-[360px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <span className="text-slate-400">⌕</span>
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search missions, clients, agents, locations..." className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400" />
                  <kbd className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-black text-slate-500">⌘ K</kbd>
                </div>
                <button onClick={refresh} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50">{loading ? 'Refreshing…' : 'Refresh'}</button>
                <button onClick={() => setModal({ type: 'action', title: 'Filters', body: 'Use the filter row below the command bar. Advanced saved filters can be connected to user preferences and dispatch roles.' })} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm">Filters</button>
                <div className="grid h-11 w-11 place-items-center rounded-full bg-blue-600 text-sm font-black text-white">AC</div>
              </div>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-5">
              {NAV.map((tab) => (
                <Link key={tab.href} href={tab.href} className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-black transition ${tab.href === '/carelink-ops/dispatch' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
                  {tab.label}
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-5 py-3">
              <ActionButton primary label="Create Mission" onClick={() => setModal({ type: 'create' })} />
              <ActionButton label="Import Requests" onClick={() => setModal({ type: 'import' })} />
              <ActionButton label="Batch Assign" onClick={() => setModal({ type: 'batch' })} />
              <ActionButton label="Reassign" onClick={() => selectedMissionLive ? setModal({ type: 'mission', mission: selectedMissionLive }) : setModal({ type: 'action', title: 'Reassign', body: 'Select a mission before using reassignment.' })} />
              <ActionButton label="Broadcast" onClick={() => setModal({ type: 'broadcast' })} />
              <ActionButton label="Escalate" onClick={() => selectedMissionLive ? runAction({ action: 'escalate_mission', missionId: selectedMissionLive.id, payload: { blockers: ['Dispatcher escalation requested'] } }) : setModal({ type: 'action', title: 'Escalate', body: 'Select a mission before escalation.' })} />
              <ActionButton label="Optimize Routes" onClick={() => runAction({ action: 'optimize_routes' })} />
              <ActionButton label="Open Command Center" onClick={() => setModal({ type: 'action', title: 'Command Center', body: 'This action is wired. Connect it to a full-screen route or drawer when your broader operations command module is ready.' })} />
            </div>
          </header>

          <section className="space-y-4 p-5">
            <SystemBanner payload={safePayload} />
            <KpiStrip payload={safePayload} />

            <FilterBar cities={cities} services={services} priorities={priorities} cityFilter={cityFilter} serviceFilter={serviceFilter} priorityFilter={priorityFilter} readinessFilter={readinessFilter} setCityFilter={setCityFilter} setServiceFilter={setServiceFilter} setPriorityFilter={setPriorityFilter} setReadinessFilter={setReadinessFilter} />

            <DispatchBoard lanes={lanes} selectedMissionIds={selectedMissionIds} toggleMission={toggleMission} openMission={openMissionDossier} />

            <div className="grid gap-4">
              <LiveOperationsMap sectors={safePayload.sectors} missions={safePayload.missions} agents={safePayload.agents} openSector={(sector: any) => setModal({ type: 'sector', sector })} />
              <CommunicationsPanel
                payload={safePayload}
                communications={safePayload.communications}
                log={log}
                selectedMissionIds={selectedMissionIds}
                openBroadcast={() => setModal({ type: 'broadcast' })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <DispatchQueue missions={filteredMissions} selectedMissionIds={selectedMissionIds} toggleMission={toggleMission} openMission={openMissionDossier} />
              <AgentAvailability agents={safePayload.agents} openAgent={(agent) => setModal({ type: 'agent', agent })} />
              <SlaAndIncidents incidents={safePayload.incidents} missions={filteredMissions} openIncident={(incident) => setModal({ type: 'incident', incident })} />
            </div>
          </section>
        </section>

        <MissionDetailsPanel mission={selectedMissionLive} agents={safePayload.agents} incidents={safePayload.incidents} runAction={runAction} openModal={setModal} actionBusy={actionBusy} />
      </div>

      {dossierPreviewMission ? (
        <>
          {dossierPreviewLoading ? (
            <div className="fixed right-6 top-6 z-[10001] rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-black text-blue-700 shadow-xl">Loading full dossier…</div>
          ) : null}
          <CareLinkCreateMissionDossierModal
            mode="edit"
            initialMission={dossierPreviewMission}
            close={() => setDossierPreviewMission(null)}
            refresh={async () => {
              await refresh()
            }}
          />
        </>
      ) : null}

      <WorkflowModal modal={modal} close={() => setModal({ type: 'none' })} agents={safePayload.agents} selectedMissionIds={selectedMissionIds} selectedMission={selectedMissionLive} runAction={runAction} actionBusy={actionBusy} />
    </main>
  )
}

export default CareLinkDispatchControlCenter

function CareLinkOpsSidebar() {
  return null
}

function ActionButton({ label, onClick, primary }: { label: string; onClick: () => void; primary?: boolean }) {
  return <button onClick={onClick} className={`rounded-xl px-4 py-2 text-sm font-black shadow-sm transition ${primary ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>{primary ? '+ ' : ''}{label}</button>
}

function SystemBanner({ payload }: { payload: DispatchPayload }) {
  return null
}




function KpiStrip({ payload }: { payload: DispatchPayload }) {
  const missions = Array.isArray(payload.missions) ? payload.missions : []
  const agents = Array.isArray(payload.agents) ? payload.agents : []
  const incidents = Array.isArray(payload.incidents) ? payload.incidents : []

  const statusOf = (mission: any) =>
    String(
      mission.status ||
      mission.lifecycle_stage ||
      mission.lifecycleStage ||
      mission.dispatch_status ||
      mission.dispatchStatus ||
      '',
    ).toLowerCase()

  const priorityOf = (mission: any) =>
    String(mission.priority || mission.urgency || mission.risk_level || mission.riskLevel || '').toLowerCase()

  const hasAgent = (mission: any) =>
    Boolean(
      mission.assigned_agent_id ||
      mission.assignedAgentId ||
      mission.assigned_agent_name ||
      mission.assignedAgentName ||
      mission.agent_id ||
      mission.agentId ||
      mission.caregiver_id ||
      mission.caregiverId ||
      mission.caregiver_name ||
      mission.caregiverName,
    )

  const isActive = (mission: any) => {
    const status = statusOf(mission)
    return (
      status.includes('route') ||
      status.includes('on_site') ||
      status.includes('on site') ||
      status.includes('progress') ||
      status.includes('active') ||
      status.includes('started')
    )
  }

  const isValidation = (mission: any) => {
    const status = statusOf(mission)
    return status.includes('report') || status.includes('validation') || status.includes('review')
  }

  const isRisk = (mission: any) => {
    const status = statusOf(mission)
    const priority = priorityOf(mission)
    return (
      status.includes('risk') ||
      status.includes('incident') ||
      status.includes('escalat') ||
      priority.includes('high') ||
      priority.includes('critical') ||
      priority.includes('urgent')
    )
  }

  const isCompleted = (mission: any) => {
    const status = statusOf(mission)
    return (
      status.includes('complete') ||
      status.includes('closed') ||
      status.includes('done') ||
      status.includes('validated')
    )
  }

  const isBacklog = (mission: any) => {
    const status = statusOf(mission)
    return (
      status.includes('new') ||
      status.includes('request') ||
      status.includes('qualification') ||
      status.includes('matching') ||
      status.includes('proposed') ||
      status.includes('ready')
    )
  }

  const availableAgents = agents.length
    ? agents.filter((agent: any) => {
        const status = String(agent.status || agent.availability || agent.state || '').toLowerCase()
        return (
          !status ||
          status.includes('available') ||
          status.includes('ready') ||
          status.includes('online') ||
          status.includes('idle') ||
          status.includes('assigned')
        )
      }).length
    : new Set(
        missions
          .map((mission: any) =>
            mission.agent_id ||
            mission.agentId ||
            mission.caregiver_id ||
            mission.caregiverId ||
            mission.assigned_agent_id ||
            mission.assignedAgentId,
          )
          .filter(Boolean),
      ).size

  const cityCoverage = new Set(
    missions
      .map((mission: any) => mission.city || mission.client_city || mission.family_city)
      .filter(Boolean),
  ).size

  const cards = [
    {
      key: 'load',
      label: 'Live dispatch load',
      value: missions.length,
      helper: 'All live mission records',
      icon: '📡',
      tone: 'blue',
    },
    {
      key: 'assigned',
      label: 'Assigned missions',
      value: missions.filter(hasAgent).length,
      helper: 'Agent-linked operations',
      icon: '👥',
      tone: 'violet',
    },
    {
      key: 'active',
      label: 'Active in field',
      value: missions.filter(isActive).length,
      helper: 'Route / on-site / progress',
      icon: '🧭',
      tone: 'emerald',
    },
    {
      key: 'validation',
      label: 'Reports & validation',
      value: missions.filter(isValidation).length,
      helper: 'Review queue',
      icon: '✅',
      tone: 'amber',
    },
    {
      key: 'risk',
      label: 'Risk & incidents',
      value: missions.filter(isRisk).length + incidents.length,
      helper: 'Needs dispatcher attention',
      icon: '🚨',
      tone: 'rose',
    },
    {
      key: 'backlog',
      label: 'Dispatch backlog',
      value: missions.filter(isBacklog).length,
      helper: 'Open intake flow',
      icon: '⏱',
      tone: 'cyan',
    },
    {
      key: 'agents',
      label: 'Agents available',
      value: availableAgents,
      helper: 'Ready workforce',
      icon: '🟢',
      tone: 'slate',
    },
    {
      key: 'coverage',
      label: 'Cities covered',
      value: cityCoverage,
      helper: 'Geo footprint',
      icon: '📍',
      tone: 'blue',
    },
    {
      key: 'closed',
      label: 'Completed / closed',
      value: missions.filter(isCompleted).length,
      helper: 'Closed loop',
      icon: '🏁',
      tone: 'emerald',
    },
  ]

  const heroCards = cards.slice(0, 5)
  const supportCards = cards.slice(5)

  const toneClasses: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50 text-blue-950',
    violet: 'border-violet-200 bg-violet-50 text-violet-950',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    amber: 'border-amber-200 bg-amber-50 text-amber-950',
    rose: 'border-rose-200 bg-rose-50 text-rose-950',
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-950',
    slate: 'border-slate-200 bg-slate-50 text-slate-950',
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
      <div
        className="relative overflow-hidden rounded-[1.75rem] border border-slate-800 p-5 text-white shadow-[0_20px_70px_rgba(15,23,42,0.28)] [&_*]:!text-white"
        style={{
          background: 'linear-gradient(135deg, #020617 0%, #0f172a 35%, #172554 100%)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(circle at top left, rgba(59,130,246,0.35), transparent 28%), radial-gradient(circle at bottom right, rgba(99,102,241,0.25), transparent 30%)',
          }}
        />

        <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] !text-white">
              Dispatch intelligence cockpit
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight !text-white">
              Live Dispatch KPI Dashboard
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 !text-white">
              Real-time dispatcher performance, mission pressure, field activation,
              workforce readiness, validation load and escalation visibility.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5 xl:min-w-[820px]">
            {heroCards.map((card) => (
              <div
                key={card.key}
                className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm [&_*]:!text-white"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.24em] !text-white">
                    {card.label}
                  </div>
                  <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/10 text-base !text-white">
                    {card.icon}
                  </div>
                </div>
                <div className="text-4xl font-black leading-none !text-white">
                  {card.value}
                </div>
                <div className="mt-2 text-xs font-bold !text-white">
                  {card.helper}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {supportCards.map((card) => (
          <div
            key={card.key}
            className={`rounded-[1.5rem] border p-5 shadow-sm ${toneClasses[card.tone] || toneClasses.slate}`}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.24em] opacity-70">
                  {card.label}
                </div>
                <div className="mt-1 text-xs font-bold opacity-80">
                  {card.helper}
                </div>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-black/5 bg-white text-base shadow-sm">
                {card.icon}
              </div>
            </div>
            <div className="text-4xl font-black leading-none">
              {card.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}



function FilterBar(props: { cities: string[]; services: string[]; priorities: string[]; cityFilter: string; serviceFilter: string; priorityFilter: string; readinessFilter: string; setCityFilter: (v: string) => void; setServiceFilter: (v: string) => void; setPriorityFilter: (v: string) => void; setReadinessFilter: (v: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
      <Select label="City" value={props.cityFilter} setValue={props.setCityFilter} options={props.cities} empty="All Cities" />
      <Select label="Service Type" value={props.serviceFilter} setValue={props.setServiceFilter} options={props.services} empty="All Services" />
      <Select label="Priority" value={props.priorityFilter} setValue={props.setPriorityFilter} options={props.priorities} empty="All Priorities" />
      <Select label="Readiness" value={props.readinessFilter} setValue={props.setReadinessFilter} options={['ready', 'warning', 'blocked']} empty="All Levels" />
    </div>
  )
}

function Select({ label, value, setValue, options, empty }: { label: string; value: string; setValue: (v: string) => void; options: string[]; empty: string }) {
  return <label className="flex items-center gap-2 text-xs font-black text-slate-500"><span>{label}</span><select value={value} onChange={(event) => setValue(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none"><option value="">{empty}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
}


function DispatchBoard({
  lanes,
  selectedMissionIds,
  toggleMission,
  openMission,
}: {
  lanes: any[]
  selectedMissionIds: any
  toggleMission: (id: string) => void
  openMission: (mission: any) => void
}) {
  const [query, setQuery] = useState('')
  const [cityFilter, setCityFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [readinessFilter, setReadinessFilter] = useState('all')
  const [laneFilter, setLaneFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [density, setDensity] = useState<'premium' | 'compact'>('premium')

  const selectedCount = Array.isArray(selectedMissionIds)
    ? selectedMissionIds.length
    : selectedMissionIds?.size || 0

  const isSelected = (id: string) =>
    Array.isArray(selectedMissionIds)
      ? selectedMissionIds.includes(id)
      : Boolean(selectedMissionIds?.has?.(id))

  const laneTitle = (lane: any) =>
    String(lane.label || lane.title || lane.name || lane.key || 'Lane')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase())

  const laneKey = (lane: any) =>
    String(lane.key || lane.id || laneTitle(lane).toLowerCase().replace(/\s+/g, '_'))

  const laneItems = (lane: any) =>
    Array.isArray(lane.missions)
      ? lane.missions
      : Array.isArray(lane.items)
        ? lane.items
        : Array.isArray(lane.records)
          ? lane.records
          : []

  const missionCode = (mission: any) =>
    String(
      mission.code ||
        mission.missionCode ||
        mission.mission_code ||
        (mission as any).mission_reference ||
        (mission as any).dossier_reference ||
        `M-${mission.id || 'LIVE'}`,
    )

  const missionService = (mission: any) =>
    String(mission.serviceType || mission.service_type || mission.title || mission.mission_type || 'Mission')

  const missionClient = (mission: any) =>
    String(
      mission.clientName ||
        mission.client_name ||
        mission.clientLabel ||
        mission.familyName ||
        mission.family_name ||
        (mission.family_id || mission.familyId ? `Family #${mission.family_id || mission.familyId}` : 'Client not assigned'),
    )

  const missionAgent = (mission: any) =>
    String(
      mission.agentName ||
        mission.agent_name ||
        mission.caregiverName ||
        mission.caregiver_name ||
        mission.assignedAgent ||
        (mission.caregiver_id || mission.caregiverId ? `Agent #${mission.caregiver_id || mission.caregiverId}` : 'Unassigned'),
    )

  const missionCity = (mission: any) =>
    String(mission.city || mission.client_city || mission.family_city || 'City pending')

  const missionZone = (mission: any) =>
    String(mission.zone || mission.area || mission.sector || 'Zone pending')

  const missionPriority = (mission: any) =>
    String(mission.priority || mission.urgency || mission.risk_level || mission.riskLevel || 'standard').toLowerCase()

  const missionReadiness = (mission: any) =>
    Number(mission.readinessScore ?? mission.readiness_score ?? mission.ready ?? mission.readiness ?? 0)

  const missionStatus = (mission: any) =>
    String(
      mission.status ||
        mission.lifecycle_stage ||
        mission.lifecycleStage ||
        mission.dispatch_status ||
        mission.dispatchStatus ||
        mission.readinessStatus ||
        '',
    ).toLowerCase()

  const missionDateKey = (mission: any) => {
    const raw =
      mission.mission_date ||
      mission.missionDate ||
      mission.dateLabel ||
      mission.scheduledStart ||
      mission.scheduled_start ||
      mission.scheduled_at ||
      mission.created_at ||
      mission.createdAt ||
      ''

    if (!raw) return ''
    const value = String(raw)
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value.slice(0, 10)
    return parsed.toISOString().slice(0, 10)
  }

  const missionTime = (mission: any) => {
    const start = mission.startTime || mission.start_time || mission.scheduledStartTime || mission.scheduled_start_time || ''
    const end = mission.endTime || mission.end_time || mission.scheduledEndTime || mission.scheduled_end_time || ''
    if (start || end) return `${start || '—'} → ${end || '—'}`
    const date = missionDateKey(mission)
    return date ? `${date.slice(5)} · time pending` : 'No schedule'
  }

  const todayKey = new Date().toISOString().slice(0, 10)
  const tomorrowKey = (() => {
    const date = new Date()
    date.setDate(date.getDate() + 1)
    return date.toISOString().slice(0, 10)
  })()

  const allMissions = useMemo(() => {
    return lanes.flatMap((lane) =>
      laneItems(lane).map((mission: any) => ({
        ...mission,
        __laneKey: laneKey(lane),
        __laneTitle: laneTitle(lane),
        __laneTone: lane.tone || lane.color || 'slate',
      })),
    )
  }, [lanes])

  const cities = useMemo(() => {
    return Array.from(new Set(allMissions.map(missionCity).filter(Boolean))).sort()
  }, [allMissions])

  const filteredMissions = useMemo(() => {
    const q = query.trim().toLowerCase()

    return allMissions.filter((mission: any) => {
      const status = missionStatus(mission)
      const priority = missionPriority(mission)
      const readiness = missionReadiness(mission)
      const dateKey = missionDateKey(mission)

      const matchesQuery =
        !q ||
        [
          missionCode(mission),
          missionService(mission),
          missionClient(mission),
          missionAgent(mission),
          missionCity(mission),
          missionZone(mission),
          priority,
          status,
          mission.__laneTitle,
        ]
          .join(' ')
          .toLowerCase()
          .includes(q)

      const matchesCity = cityFilter === 'all' || missionCity(mission) === cityFilter
      const matchesLane = laneFilter === 'all' || String(mission.__laneKey) === laneFilter
      const matchesPriority =
        priorityFilter === 'all' ||
        priority.includes(priorityFilter) ||
        (priorityFilter === 'critical' && (priority.includes('urgent') || priority.includes('high'))) ||
        (priorityFilter === 'standard' && (!priority || priority.includes('standard') || priority.includes('normal')))

      const matchesReadiness =
        readinessFilter === 'all' ||
        (readinessFilter === 'ready' && readiness >= 70) ||
        (readinessFilter === 'review' && readiness > 0 && readiness < 70) ||
        (readinessFilter === 'missing' && readiness <= 0)

      const matchesDate =
        dateFilter === 'all' ||
        (dateFilter === 'today' && dateKey === todayKey) ||
        (dateFilter === 'tomorrow' && dateKey === tomorrowKey) ||
        (dateFilter === 'unscheduled' && !dateKey)

      return matchesQuery && matchesCity && matchesLane && matchesPriority && matchesReadiness && matchesDate
    })
  }, [allMissions, query, cityFilter, laneFilter, priorityFilter, readinessFilter, dateFilter, todayKey, tomorrowKey])

  const filteredByLane = useMemo(() => {
    const map = new Map<string, any[]>()

    for (const lane of lanes) {
      map.set(laneKey(lane), [])
    }

    for (const mission of filteredMissions) {
      const key = String(mission.__laneKey)
      map.set(key, [...(map.get(key) || []), mission])
    }

    return map
  }, [filteredMissions, lanes])

  const maxLaneCount = Math.max(
    1,
    ...lanes.map((lane) => filteredByLane.get(laneKey(lane))?.length || 0),
  )

  const riskCount = filteredMissions.filter((mission: any) => {
    const status = missionStatus(mission)
    const priority = missionPriority(mission)
    return status.includes('risk') || status.includes('incident') || priority.includes('high') || priority.includes('urgent') || priority.includes('critical')
  }).length

  const assignedCount = filteredMissions.filter((mission: any) => missionAgent(mission) !== 'Unassigned').length

  const readinessAvg = filteredMissions.length
    ? Math.round(filteredMissions.reduce((sum: number, mission: any) => sum + missionReadiness(mission), 0) / filteredMissions.length)
    : 0

  const toneClass = (tone: string) => {
    const map: Record<string, string> = {
      slate: 'border-slate-200 bg-slate-50 text-slate-800',
      blue: 'border-blue-200 bg-blue-50 text-blue-800',
      cyan: 'border-cyan-200 bg-cyan-50 text-cyan-800',
      emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      violet: 'border-violet-200 bg-violet-50 text-violet-800',
      purple: 'border-purple-200 bg-purple-50 text-purple-800',
      amber: 'border-amber-200 bg-amber-50 text-amber-800',
      rose: 'border-rose-200 bg-rose-50 text-rose-800',
      red: 'border-rose-200 bg-rose-50 text-rose-800',
    }
    return map[tone] || map.slate
  }

  const laneIcon = (lane: any) => {
    const key = String(lane.key || '').toLowerCase()
    if (key.includes('new')) return '🆕'
    if (key.includes('assign')) return '👥'
    if (key.includes('accept')) return '🤝'
    if (key.includes('route')) return '🧭'
    if (key.includes('progress') || key.includes('site')) return '🏠'
    if (key.includes('report')) return '📝'
    if (key.includes('valid')) return '✅'
    if (key.includes('risk') || key.includes('escal')) return '🚨'
    if (key.includes('complete') || key.includes('closed')) return '🏁'
    return '◇'
  }

  const cardTone = (mission: any) => {
    const status = missionStatus(mission)
    const priority = missionPriority(mission)
    if (status.includes('risk') || status.includes('incident') || priority.includes('urgent') || priority.includes('critical') || priority.includes('high')) return 'rose'
    if (status.includes('route') || status.includes('progress') || status.includes('site')) return 'emerald'
    if (status.includes('report') || status.includes('valid')) return 'amber'
    if (status.includes('assign') || missionAgent(mission) !== 'Unassigned') return 'blue'
    return 'slate'
  }

  const actionButtons = [
    { label: 'Assign', tone: 'blue' },
    { label: 'Route', tone: 'emerald' },
    { label: 'Escalate', tone: 'rose' },
    { label: 'Validate', tone: 'amber' },
  ]

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-blue-700">
            Premium live dispatch workflow
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Mission Dispatch Workflow</h2>
          <p className="mt-1 max-w-3xl text-sm font-bold leading-6 text-slate-500">
            Smart dispatch board for intake, qualification, matching, assignment, routing, reports, escalation and completion.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-4 xl:min-w-[620px]">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-blue-900">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70">Visible</div>
            <div className="mt-1 text-2xl font-black">{filteredMissions.length}</div>
          </div>
          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-3 text-violet-900">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70">Assigned</div>
            <div className="mt-1 text-2xl font-black">{assignedCount}</div>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-rose-900">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70">Risk</div>
            <div className="mt-1 text-2xl font-black">{riskCount}</div>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70">Ready avg</div>
            <div className="mt-1 text-2xl font-black">{readinessAvg}%</div>
          </div>
        </div>
      </div>

      <div className="mb-5 grid gap-3 xl:grid-cols-[1.4fr_repeat(5,minmax(130px,170px))_120px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search code, client, caregiver, city, zone, service, status..."
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
        />

        <select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-black text-slate-700">
          <option value="all">All cities</option>
          {cities.map((city) => <option key={city} value={city}>{city}</option>)}
        </select>

        <select value={laneFilter} onChange={(event) => setLaneFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-black text-slate-700">
          <option value="all">All lanes</option>
          {lanes.map((lane) => {
            const key = laneKey(lane)
            return <option key={key} value={key}>{laneTitle(lane)}</option>
          })}
        </select>

        <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-black text-slate-700">
          <option value="all">All priority</option>
          <option value="standard">Standard</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
          <option value="critical">Critical</option>
        </select>

        <select value={readinessFilter} onChange={(event) => setReadinessFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-black text-slate-700">
          <option value="all">All readiness</option>
          <option value="ready">Ready 70%+</option>
          <option value="review">Needs review</option>
          <option value="missing">Missing score</option>
        </select>

        <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-black text-slate-700">
          <option value="all">All dates</option>
          <option value="today">Today</option>
          <option value="tomorrow">Tomorrow</option>
          <option value="unscheduled">Unscheduled</option>
        </select>

        <button
          type="button"
          onClick={() => setDensity(density === 'premium' ? 'compact' : 'premium')}
          className="rounded-2xl border border-slate-200 bg-slate-950 px-3 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800"
        >
          {density === 'premium' ? 'Compact' : 'Premium'}
        </button>
      </div>

      <div className="mb-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Live workflow graph</div>
            <p className="mt-1 text-sm font-bold text-slate-600">Lane distribution updates with every filter and live payload change.</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm">{selectedCount} selected</span>
        </div>

        <div className="grid gap-2 xl:grid-cols-9">
          {lanes.map((lane) => {
            const key = laneKey(lane)
            const count = filteredByLane.get(key)?.length || 0
            const height = Math.max(10, Math.round((count / maxLaneCount) * 100))

            return (
              <button
                key={key}
                type="button"
                onClick={() => setLaneFilter(laneFilter === key ? 'all' : key)}
                className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${laneFilter === key ? 'border-blue-400 bg-blue-50 ring-4 ring-blue-100' : 'border-slate-200 bg-white'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{laneIcon(lane)}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">{count}</span>
                </div>
                <div className="mt-3 flex h-16 items-end rounded-xl bg-slate-100 p-1">
                  <div className="w-full rounded-lg bg-blue-500 transition-all" style={{ height: `${height}%` }} />
                </div>
                <div className="mt-2 line-clamp-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{laneTitle(lane)}</div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {lanes.map((lane) => {
          const key = laneKey(lane)
          const missions = filteredByLane.get(key) || []
          const tone = lane.tone || lane.color || 'slate'

          return (
            <div key={key} className={`min-w-[315px] rounded-[1.5rem] border p-3 ${toneClass(tone)}`}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{laneIcon(lane)}</span>
                    <h3 className="text-sm font-black uppercase tracking-[0.16em]">{laneTitle(lane)}</h3>
                  </div>
                  <p className="mt-1 text-xs font-bold opacity-70">{missions.length} live ticket(s)</p>
                </div>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black shadow-sm">{missions.length}</span>
              </div>

              <div className="max-h-[680px] space-y-3 overflow-y-auto pr-1">
                {missions.length ? missions.map((mission: any) => {
                  const id = String(mission.id || missionCode(mission))
                  const selected = isSelected(id)
                  const tone = cardTone(mission)
                  const readiness = missionReadiness(mission)

                  return (
                    <article
                      key={id}
                      className={`rounded-[1.4rem] border bg-white p-4 text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl ${selected ? 'border-blue-400 ring-4 ring-blue-100' : 'border-slate-200'}`}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <button type="button" onClick={() => openMission(mission)} className="text-left">
                          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Ticket</div>
                          <h4 className="mt-1 text-lg font-black tracking-tight text-slate-950">{missionCode(mission)}</h4>
                          <p className="mt-1 text-sm font-black text-slate-700">{missionService(mission)}</p>
                        </button>

                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleMission(id)}
                          className="mt-1 h-4 w-4 rounded border-slate-300"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${toneClass(tone)}`}>{missionPriority(mission)}</span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-700">{missionCity(mission)}</span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-700">{missionZone(mission)}</span>
                      </div>

                      <div className={`mt-3 grid gap-2 ${density === 'premium' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Client</div>
                          <div className="mt-1 text-xs font-black text-slate-800">{missionClient(mission)}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Caregiver</div>
                          <div className="mt-1 text-xs font-black text-slate-800">{missionAgent(mission)}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Schedule</div>
                          <div className="mt-1 text-xs font-black text-slate-800">{missionTime(mission)}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Readiness</div>
                          <div className="mt-1 text-xs font-black text-slate-800">{readiness || 0}%</div>
                        </div>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${readiness >= 70 ? 'bg-emerald-500' : readiness > 0 ? 'bg-amber-500' : 'bg-slate-300'}`}
                          style={{ width: `${Math.max(0, Math.min(100, readiness))}%` }}
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {actionButtons.map((action) => (
                          <button
                            key={action.label}
                            type="button"
                            onClick={() => openMission(mission)}
                            className={`rounded-xl border px-3 py-2 text-xs font-black ${toneClass(action.tone)}`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </article>
                  )
                }) : (
                  <div className="rounded-2xl bg-white/75 p-5 text-center">
                    <p className="text-sm font-black text-slate-800">No live tickets</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">No mission matches current filters.</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}


function LiveOperationsMap(props: any = {}) {
  const payload = props?.payload || {}
  const openMission = typeof props?.openMission === 'function' ? props.openMission : undefined

  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletMapRef = useRef<any>(null)
  const markerLayerRef = useRef<any>(null)

  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [cityFilter, setCityFilter] = useState('all')
  const [selectedMission, setSelectedMission] = useState<any | null>(null)

  const cityCoordinates: Record<string, [number, number]> = {
    casablanca: [33.5731, -7.5898],
    rabat: [34.0209, -6.8416],
    temara: [33.9287, -6.9066],
    sale: [34.0331, -6.7985],
    salé: [34.0331, -6.7985],
    marrakech: [31.6295, -7.9811],
    tangier: [35.7595, -5.8340],
    tanger: [35.7595, -5.8340],
    agadir: [30.4278, -9.5981],
    fes: [34.0181, -5.0078],
    fès: [34.0181, -5.0078],
    kenitra: [34.2610, -6.5802],
    kénitra: [34.2610, -6.5802],
    mohammedia: [33.6861, -7.3829],
  }

  const value = (input: unknown, fallback = '—') =>
    input === null || input === undefined || input === '' ? fallback : String(input)

  const normalizeDate = (input: unknown) => {
    if (!input) return ''
    const raw = String(input)
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
    const parsed = new Date(raw)
    if (Number.isNaN(parsed.getTime())) return raw.slice(0, 10)
    return parsed.toISOString().slice(0, 10)
  }

  const missionDate = (mission: any) =>
    normalizeDate(mission.mission_date || mission.missionDate || mission.scheduledStart || mission.scheduled_start || mission.scheduled_at || mission.created_at || mission.createdAt)

  const missionCode = (mission: any) =>
    value(mission.code || mission.missionCode || mission.mission_code || (mission as any).mission_reference || (mission as any).dossier_reference || `M-${mission.id || 'LIVE'}`, 'Mission')

  const missionService = (mission: any) =>
    value(mission.serviceType || mission.service_type || mission.title || mission.mission_type, 'Mission AngelCare')

  const missionClient = (mission: any) =>
    value(mission.clientName || mission.client_name || mission.clientLabel || mission.familyName || mission.family_name || (mission.family_id || mission.familyId ? `Family #${mission.family_id || mission.familyId}` : ''), 'Client not assigned')

  const missionAgent = (mission: any) =>
    value(mission.agentName || mission.agent_name || mission.caregiverName || mission.caregiver_name || mission.assignedAgent || (mission.caregiver_id || mission.caregiverId ? `Agent #${mission.caregiver_id || mission.caregiverId}` : ''), 'Unassigned')

  const missionCity = (mission: any) =>
    value(mission.city || mission.client_city || mission.family_city, 'City pending')

  const missionZone = (mission: any) =>
    value(mission.zone || mission.area || mission.sector, 'Zone pending')

  const missionStatus = (mission: any) =>
    value(mission.status || mission.lifecycle_stage || mission.lifecycleStage || mission.dispatch_status || mission.dispatchStatus || mission.readinessStatus, 'new_request').toLowerCase()

  const missionStart = (mission: any) =>
    value(mission.startTime || mission.start_time || mission.scheduledStartTime || mission.scheduled_start_time, '—')

  const missionEnd = (mission: any) =>
    value(mission.endTime || mission.end_time || mission.scheduledEndTime || mission.scheduled_end_time, '—')

  const coordinatesFor = (mission: any, index: number): [number, number] => {
    const lat = Number(mission.latitude || mission.lat || mission.client_latitude || mission.family_latitude)
    const lng = Number(mission.longitude || mission.lng || mission.long || mission.client_longitude || mission.family_longitude)
    if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng]

    const cityKey = missionCity(mission).toLowerCase().trim()
    const base =
      cityCoordinates[cityKey] ||
      cityCoordinates[cityKey.replace(/\s+/g, '_')] ||
      cityCoordinates.casablanca

    const offset = ((index % 9) - 4) * 0.012
    const ring = Math.floor(index / 9) * 0.01
    return [base[0] + offset + ring, base[1] - offset + ring]
  }

  const collectRows = (source: any) => {
    const nested = source.data || source.payload || source.live || source.dashboard || source.bridge || {}

    const buckets = [
      source.missions,
      source.records,
      source.dossiers,
      source.items,
      source.mapMarkers,
      source.mapPoints,
      source.markers,
      nested.missions,
      nested.records,
      nested.dossiers,
      nested.items,
      nested.mapMarkers,
      nested.mapPoints,
      nested.markers,
    ]

    const laneBuckets = [source.lanes, source.dispatchLanes, nested.lanes, nested.dispatchLanes]
    const rows: any[] = []

    for (const bucket of buckets) {
      if (Array.isArray(bucket)) rows.push(...bucket)
    }

    for (const lanes of laneBuckets) {
      if (!Array.isArray(lanes)) continue
      for (const lane of lanes) {
        if (Array.isArray(lane?.items)) rows.push(...lane.items)
        if (Array.isArray(lane?.missions)) rows.push(...lane.missions)
      }
    }

    const seen = new Set<string>()

    return rows
      .filter(Boolean)
      .filter((mission) => {
        const status = missionStatus(mission)
        if (mission.is_archived === true || mission.isArchived === true) return false
        if (status.includes('deleted') || status.includes('archived') || status.includes('cancelled')) return false
        return true
      })
      .filter((mission, index) => {
        const key = String(mission.id || missionCode(mission) || index)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .map((mission, index) => {
        const [lat, lng] = coordinatesFor(mission, index)
        return {
          ...mission,
          __lat: lat,
          __lng: lng,
          __date: missionDate(mission),
          __code: missionCode(mission),
          __city: missionCity(mission),
          __zone: missionZone(mission),
          __status: missionStatus(mission),
        }
      })
  }

  const allMissions = useMemo(() => collectRows(payload), [payload])

  const cities = useMemo(() => (
    Array.from(new Set(allMissions.map((mission: any) => mission.__city).filter(Boolean))).sort()
  ), [allMissions])

  const selectedWindow = useMemo(() => {
    const base = new Date(`${selectedDate}T12:00:00`)
    if (Number.isNaN(base.getTime())) return new Set([selectedDate])
    if (viewMode === 'day') return new Set([selectedDate])

    const start = new Date(base)
    start.setDate(base.getDate() - base.getDay() + 1)

    return new Set(Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      return date.toISOString().slice(0, 10)
    }))
  }, [selectedDate, viewMode])

  const visibleMissions = useMemo(() => (
    allMissions.filter((mission: any) => {
      const matchesCity = cityFilter === 'all' || mission.__city === cityFilter
      const matchesDate = !mission.__date || selectedWindow.has(mission.__date)
      return matchesCity && matchesDate
    })
  ), [allMissions, cityFilter, selectedWindow])

  const activeMissions = visibleMissions.filter((mission: any) => {
    const status = mission.__status
    return status.includes('route') || status.includes('progress') || status.includes('site') || status.includes('active')
  })

  const cancelledMissions = visibleMissions.filter((mission: any) => mission.__status.includes('cancel'))

  const upcomingMissions = visibleMissions.filter((mission: any) => {
    const status = mission.__status
    return !status.includes('route') && !status.includes('progress') && !status.includes('site') && !status.includes('active') && !status.includes('cancel')
  })

  const citiesCovered = new Set(visibleMissions.map((mission: any) => mission.__city).filter(Boolean)).size

  const selectedDateLabel = (() => {
    const date = new Date(`${selectedDate}T12:00:00`)
    if (Number.isNaN(date.getTime())) return selectedDate
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
  })()

  const moveDate = (direction: number) => {
    const date = new Date(`${selectedDate}T12:00:00`)
    date.setDate(date.getDate() + direction)
    setSelectedDate(date.toISOString().slice(0, 10))
  }

  const markerColor = (mission: any) => {
    const status = mission.__status
    if (status.includes('cancel')) return '#dc2626'
    if (status.includes('route') || status.includes('progress') || status.includes('site') || status.includes('active')) return '#16a34a'
    return '#f59e0b'
  }

  useEffect(() => {
    let cancelled = false

    async function ensureLeaflet() {
      if (typeof window === 'undefined' || !mapRef.current) return

      if (!(window as any).L) {
        if (!document.querySelector('link[data-carelink-leaflet-css="true"]')) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          link.setAttribute('data-carelink-leaflet-css', 'true')
          document.head.appendChild(link)
        }

        if (!document.querySelector('script[data-carelink-leaflet-js="true"]')) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
            script.async = true
            script.setAttribute('data-carelink-leaflet-js', 'true')
            script.onload = () => resolve()
            script.onerror = () => reject(new Error('Leaflet failed to load'))
            document.body.appendChild(script)
          })
        }
      }

      if (cancelled || !mapRef.current || !(window as any).L) return

      const L = (window as any).L

      if (!leafletMapRef.current) {
        leafletMapRef.current = L.map(mapRef.current, {
          scrollWheelZoom: true,
          zoomControl: true,
          attributionControl: true,
        }).setView([31.7917, -7.0926], 6)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(leafletMapRef.current)

        markerLayerRef.current = L.layerGroup().addTo(leafletMapRef.current)
      }

      markerLayerRef.current?.clearLayers()

      const bounds: any[] = []

      visibleMissions.forEach((mission: any) => {
        const color = markerColor(mission)

        const marker = L.circleMarker([mission.__lat, mission.__lng], {
          radius: 10,
          color,
          weight: 3,
          fillColor: color,
          fillOpacity: 0.88,
        })

        marker.on('click', () => {
          setSelectedMission(mission)
          if (openMission) openMission(mission)
        })

        marker.bindPopup(`
          <div style="min-width:220px">
            <strong>${mission.__code}</strong><br/>
            ${missionService(mission)}<br/>
            ${missionClient(mission)}<br/>
            ${mission.__city} · ${mission.__zone}
          </div>
        `)

        marker.addTo(markerLayerRef.current)
        bounds.push([mission.__lat, mission.__lng])
      })

      if (bounds.length) {
        leafletMapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 })
      } else {
        leafletMapRef.current.setView([31.7917, -7.0926], 6)
      }

      setTimeout(() => leafletMapRef.current?.invalidateSize?.(), 80)
    }

    ensureLeaflet().catch(() => {})

    return () => {
      cancelled = true
    }
  }, [visibleMissions, openMission])

  return (
    <section className="w-full rounded-[2.25rem] border border-slate-200 bg-white p-5 shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
      <div className="mb-5">
        <h2 className="text-2xl font-black tracking-tight text-slate-950">Morocco Operations Map</h2>
        <p className="mt-1 text-sm font-bold text-slate-500">
          Live operational radar synced with dispatch mission dates, statuses, cities, routes and Morocco-wide coverage.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-[11px] font-black uppercase tracking-[0.32em] text-slate-950">Live mission radar</div>
          <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{selectedDateLabel}</h3>
          <p className="mt-3 text-base font-black leading-6 text-slate-800">
            Click any mission point to open its synced premium mission card.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => setViewMode('day')} className={`rounded-2xl px-5 py-3 text-sm font-black ${viewMode === 'day' ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>Day</button>
            <button type="button" onClick={() => setViewMode('week')} className={`rounded-2xl px-5 py-3 text-sm font-black ${viewMode === 'week' ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>Week</button>
            <button type="button" onClick={() => moveDate(-1)} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">Previous</button>
            <button type="button" onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-100">Today</button>
            <button type="button" onClick={() => moveDate(1)} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">Next</button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-5">
            <SignalCard label="Visible missions" value={visibleMissions.length} tone="blue" />
            <SignalCard label="Upcoming" value={upcomingMissions.length} tone="amber" />
            <SignalCard label="Active live" value={activeMissions.length} tone="emerald" />
            <SignalCard label="Cancelled" value={cancelledMissions.length} tone="rose" />
            <SignalCard label="Cities covered" value={citiesCovered} tone="violet" />
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <div className="text-[11px] font-black uppercase tracking-[0.32em] text-slate-950">Filters & legend</div>

          <label className="mt-5 block text-[11px] font-black uppercase tracking-[0.24em] text-slate-700">City</label>
          <select
            value={cityFilter}
            onChange={(event) => setCityFilter(event.target.value)}
            className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          >
            <option value="all">All cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <div className="mt-5 space-y-3">
            <LegendItem color="bg-amber-500" label="Upcoming today / not started" />
            <LegendItem color="bg-emerald-600" label="Active live started mission" />
            <LegendItem color="bg-red-600" label="Cancelled mission" />
          </div>

          {selectedMission ? (
            <div className="mt-5 rounded-[1.5rem] border border-blue-200 bg-white p-4 shadow-sm">
              <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-blue-700">
                Premium mission preview
              </div>
              <h3 className="mt-3 text-xl font-black text-slate-950">{missionCode(selectedMission)}</h3>
              <p className="mt-1 text-sm font-black text-slate-700">{missionService(selectedMission)}</p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <PreviewItem label="Client" value={missionClient(selectedMission)} />
                <PreviewItem label="Caregiver" value={missionAgent(selectedMission)} />
                <PreviewItem label="Location" value={`${missionCity(selectedMission)} · ${missionZone(selectedMission)}`} />
                <PreviewItem label="Schedule" value={`${missionStart(selectedMission)} → ${missionEnd(selectedMission)}`} />
              </div>

              <button
                type="button"
                onClick={() => openMission?.(selectedMission)}
                className="mt-4 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-100"
              >
                Open synced mission card
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100">
        <div ref={mapRef} className="h-[680px] w-full" />
        <div className="flex items-center justify-between gap-3 bg-white px-5 py-4">
          <p className="text-sm font-black text-slate-800">
            Scroll to zoom. Click any colored mission point to open the synced live card.
          </p>
          <span className="rounded-full bg-slate-50 px-4 py-2 text-sm font-black text-slate-900 shadow-sm">
            {visibleMissions.length} clickable point(s)
          </span>
        </div>
      </div>
    </section>
  )
}

function SignalCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  const toneClass: Record<string, string> = {
    blue: 'border-blue-100 bg-blue-50 text-blue-950',
    amber: 'border-amber-100 bg-amber-50 text-amber-950',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-950',
    rose: 'border-rose-100 bg-rose-50 text-rose-950',
    violet: 'border-violet-100 bg-violet-50 text-violet-950',
  }

  return (
    <div className={`rounded-2xl border p-4 ${toneClass[tone] || toneClass.blue}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.24em]">{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <span className={`h-5 w-5 rounded-full ${color}`} />
      <span className="text-sm font-black text-slate-800">{label}</span>
    </div>
  )
}

function PreviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-1 text-xs font-black text-slate-800">{value}</div>
    </div>
  )
}


function CommunicationsPanel(props: any = {}) {
  const payload = props.payload || {}
  const communications = Array.isArray(props.communications) ? props.communications : []
  const log = Array.isArray(props.log) ? props.log : []
  const openBroadcast = props.openBroadcast
  const openMission = typeof props.openMission === 'function' ? props.openMission : undefined

  const storageKey = 'carelink_dispatch_communications_event_log_v2'

  const textValue = (value: unknown, fallback = '—') =>
    value === null || value === undefined || value === '' ? fallback : String(value)

  const collectMissions = (source: any) => {
    const nested = source.data || source.payload || source.live || source.dashboard || source.bridge || {}

    const buckets = [
      source.missions,
      source.records,
      source.dossiers,
      source.items,
      nested.missions,
      nested.records,
      nested.dossiers,
      nested.items,
    ]

    const laneBuckets = [
      source.lanes,
      source.dispatchLanes,
      nested.lanes,
      nested.dispatchLanes,
    ]

    const rows: any[] = []

    for (const bucket of buckets) {
      if (Array.isArray(bucket)) rows.push(...bucket)
    }

    for (const lanes of laneBuckets) {
      if (!Array.isArray(lanes)) continue
      for (const lane of lanes) {
        if (Array.isArray(lane?.missions)) rows.push(...lane.missions)
        if (Array.isArray(lane?.items)) rows.push(...lane.items)
        if (Array.isArray(lane?.records)) rows.push(...lane.records)
      }
    }

    const seen = new Set<string>()

    return rows
      .filter(Boolean)
      .filter((mission) => {
        const status = String(
          mission.status ||
            mission.lifecycle_stage ||
            mission.lifecycleStage ||
            mission.dispatch_status ||
            mission.dispatchStatus ||
            '',
        ).toLowerCase()

        if (mission.is_archived === true || mission.isArchived === true) return false
        if (status.includes('deleted') || status.includes('archived') || status.includes('cancelled')) return false

        return true
      })
      .filter((mission, index) => {
        const key = String(mission.id || mission.code || mission.missionCode || (mission as any).mission_reference || index)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
  }

  const missions = useMemo(() => collectMissions(payload), [payload])

  const missionId = (mission: any) =>
    String(mission.id || mission.mission_id || mission.missionId || mission.code || mission.missionCode || (mission as any).mission_reference || 'mission')

  const missionCode = (mission: any) =>
    textValue(
      mission.code ||
        mission.missionCode ||
        mission.mission_code ||
        (mission as any).mission_reference ||
        (mission as any).dossier_reference ||
        `M-${mission.id || 'LIVE'}`,
      'Mission',
    )

  const missionService = (mission: any) =>
    textValue(mission.serviceType || mission.service_type || mission.title || mission.mission_type, 'Mission AngelCare')

  const missionClient = (mission: any) =>
    textValue(
      mission.clientName ||
        mission.client_name ||
        mission.clientLabel ||
        mission.familyName ||
        mission.family_name ||
        (mission.family_id || mission.familyId ? `Family #${mission.family_id || mission.familyId}` : ''),
      'Client not assigned',
    )

  const missionCaregiver = (mission: any) =>
    textValue(
      mission.caregiverName ||
        mission.caregiver_name ||
        mission.agentName ||
        mission.agent_name ||
        mission.assignedAgent ||
        mission.assigned_agent ||
        (mission.caregiver_id || mission.caregiverId ? `Agent #${mission.caregiver_id || mission.caregiverId}` : ''),
      'Unassigned caregiver',
    )

  const missionCaregiverTarget = (mission: any) =>
    textValue(
      mission.caregiver_phone ||
        mission.caregiverPhone ||
        mission.agentPhone ||
        mission.agent_phone ||
        mission.caregiver_email ||
        mission.caregiverEmail ||
        mission.agent_email ||
        mission.agentEmail ||
        missionCaregiver(mission),
      'Caregiver target pending',
    )

  const missionCity = (mission: any) =>
    textValue(mission.city || mission.client_city || mission.family_city, 'City pending')

  const missionZone = (mission: any) =>
    textValue(mission.zone || mission.area || mission.sector, 'Zone pending')

  const missionTime = (mission: any) => {
    const start = textValue(mission.startTime || mission.start_time || mission.scheduledStartTime || mission.scheduled_start_time, '')
    const end = textValue(mission.endTime || mission.end_time || mission.scheduledEndTime || mission.scheduled_end_time, '')

    if (start || end) return `${start || '—'} → ${end || '—'}`

    return textValue(mission.scheduled_at || mission.scheduledStart || mission.scheduled_start || mission.created_at, 'Schedule pending')
  }

  const missionStatus = (mission: any) =>
    textValue(
      mission.status ||
        mission.lifecycle_stage ||
        mission.lifecycleStage ||
        mission.dispatch_status ||
        mission.dispatchStatus ||
        mission.readinessStatus,
      'new_request',
    )

  const [query, setQuery] = useState('')
  const [selectedMissionId, setSelectedMissionId] = useState(() => missions[0] ? missionId(missions[0]) : '')
  const [categoryKey, setCategoryKey] = useState('assignment')
  const [templateKey, setTemplateKey] = useState('assignment_confirm')
  const [channel, setChannel] = useState<'whatsapp' | 'sms' | 'email' | 'internal'>('whatsapp')
  const [sendMode, setSendMode] = useState<'single' | 'selected' | 'broadcast'>('single')
  const [editableMessage, setEditableMessage] = useState('')
  const [sendProgress, setSendProgress] = useState(0)
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const [eventLog, setEventLog] = useState<any[]>(() => {
    if (typeof window === 'undefined') return []

    try {
      const raw = window.localStorage.getItem(storageKey)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const selectedMission = useMemo(() => {
    return missions.find((mission: any) => missionId(mission) === selectedMissionId) || missions[0] || null
  }, [missions, selectedMissionId])

  const selectedMissionSet = useMemo(() => {
    const selected = props.selectedMissionIds
    if (Array.isArray(selected)) return new Set(selected.map(String))
    if (selected?.size) return new Set(Array.from(selected).map(String))
    return new Set<string>()
  }, [props.selectedMissionIds])

  const categories = [
    {
      key: 'assignment',
      icon: '👥',
      label: 'Affectation',
      helper: 'Affectation, confirmation, remplacement et préparation.',
      templates: [
        ['assignment_confirm', 'Confirmer l’affectation', 'Bonjour {caregiver}, vous êtes affecté(e) à la mission {code} pour {client}. Service : {service}. Lieu : {city} · {zone}. Horaire : {time}. Merci de confirmer immédiatement votre disponibilité.'],
        ['assignment_identity', 'Confirmation identité', 'Bonjour {caregiver}, avant de démarrer la mission {code}, merci de confirmer votre identité, votre disponibilité et votre niveau de préparation dans CareLink.'],
        ['assignment_reassign', 'Notification de réaffectation', 'La mission {code} vient de vous être réaffectée. Client : {client}. Service : {service}. Merci de consulter la fiche mission et confirmer votre prise en charge.'],
        ['assignment_backup', 'Demande de renfort', 'Un renfort peut être nécessaire pour la mission {code}. Merci de confirmer si vous êtes disponible pour soutenir cette opération.'],
        ['assignment_documents', 'Vérification du dossier', 'Merci de vérifier le dossier de la mission {code} : informations client, périmètre du service, horaire, localisation et consignes particulières.'],
        ['assignment_uniform', 'Tenue et présentation', 'Rappel pour la mission {code} : tenue professionnelle, badge, téléphone chargé et ponctualité sont obligatoires.'],
        ['assignment_arrival_window', 'Fenêtre d’arrivée', 'Merci de confirmer votre heure estimée d’arrivée pour la mission {code}. Créneau prévu : {time}.'],
        ['assignment_client_intro', 'Présentation client', 'Pour la mission {code}, préparez une présentation professionnelle auprès du client et confirmez votre arrivée via CareLink.'],
        ['assignment_tools', 'Matériel requis', 'Pour la mission {code}, merci de confirmer que vous disposez de tout le matériel nécessaire pour le service suivant : {service}.'],
        ['assignment_final_check', 'Contrôle final avant départ', 'Contrôle final avant dispatch pour la mission {code} : affectation, itinéraire, téléphone, adresse, consignes et disponibilité.'],
      ],
    },
    {
      key: 'route',
      icon: '🧭',
      label: 'Trajet',
      helper: 'Départ, ETA, arrivée, accès et blocages terrain.',
      templates: [
        ['route_departure', 'Confirmation de départ', 'Merci de confirmer votre départ pour la mission {code}. Destination : {city} · {zone}. Client : {client}.'],
        ['route_eta', 'Demande ETA', 'Merci d’envoyer votre heure estimée d’arrivée pour la mission {code}. Créneau prévu : {time}.'],
        ['route_delay', 'Alerte retard', 'Risque de retard détecté pour la mission {code}. Merci de transmettre immédiatement votre ETA actualisée et la raison du retard.'],
        ['route_nearby', 'Arrivée à proximité', 'Lorsque vous êtes proche du lieu de la mission {code}, merci d’informer le dispatch avant de contacter le client.'],
        ['route_on_site', 'Confirmation sur site', 'Merci de confirmer votre présence sur site pour la mission {code}. Client : {client}.'],
        ['route_address', 'Vérification adresse', 'Merci de vérifier l’adresse et la zone de la mission {code} : {city} · {zone}. Signalez toute incohérence au dispatch.'],
        ['route_transport', 'Problème transport', 'En cas de problème de transport ou de navigation pour la mission {code}, merci de signaler le blocage et l’ETA immédiatement.'],
        ['route_access', 'Accès et stationnement', 'Pour la mission {code}, merci de confirmer les conditions d’accès, le stationnement et la possibilité d’entrée sur site.'],
        ['route_client_call', 'Appel client avant arrivée', 'Avant votre arrivée pour la mission {code}, contactez le client si nécessaire et tenez le dispatch informé.'],
        ['route_safety', 'Sécurité trajet', 'Contrôle sécurité pour la mission {code} : statut du trajet, batterie téléphone, disponibilité et possibilité d’urgence.'],
      ],
    },
    {
      key: 'execution',
      icon: '🏠',
      label: 'Exécution',
      helper: 'Début mission, conduite sur site, qualité et suivi client.',
      templates: [
        ['execution_start', 'Démarrer la mission', 'Merci de démarrer la mission {code} dans le workflow dès le début du service. Client : {client}. Service : {service}.'],
        ['execution_scope', 'Rappel périmètre', 'Périmètre de la mission {code} : {service}. Merci de signaler toute demande client hors périmètre avant exécution.'],
        ['execution_satisfaction', 'Satisfaction client', 'Pendant la mission {code}, surveillez la satisfaction client et signalez toute difficulté au dispatch dès les premiers signes.'],
        ['execution_special', 'Consignes particulières', 'Merci de relire les consignes particulières de la mission {code} avant de poursuivre le service.'],
        ['execution_pause', 'Pause ou interruption', 'Si une pause est nécessaire pendant la mission {code}, merci d’informer le dispatch avec la raison et l’heure de reprise prévue.'],
        ['execution_extension', 'Demande de prolongation', 'Si le client demande une prolongation pour la mission {code}, merci d’obtenir la validation du dispatch avant toute extension.'],
        ['execution_quality', 'Rappel qualité', 'Mission {code} : merci de respecter les standards AngelCare — conduite professionnelle, ponctualité, communication, sécurité et qualité de service.'],
        ['execution_incident', 'Signal incident', 'Si un incident apparaît pendant la mission {code}, signalez-le immédiatement avec une description courte, le niveau d’urgence et l’impact client.'],
        ['execution_family', 'Communication famille/client', 'Pour la mission {code}, gardez une communication professionnelle avec le client ou la famille, strictement dans le périmètre validé.'],
        ['execution_close_prep', 'Préparer la clôture', 'Mission {code} : préparez la clôture du service, le dernier contrôle client, les notes de rapport et la confirmation de fin.'],
      ],
    },
    {
      key: 'risk',
      icon: '🚨',
      label: 'Risque',
      helper: 'Incident, retard, absence, tension client et escalade.',
      templates: [
        ['risk_no_show', 'Risque absence', 'Urgent : risque d’absence détecté pour la mission {code}. Merci de confirmer immédiatement votre statut.'],
        ['risk_complaint', 'Réclamation client', 'Une préoccupation client est signalée sur la mission {code}. Restez professionnel(le) et envoyez une mise à jour factuelle immédiatement.'],
        ['risk_safety', 'Alerte sécurité', 'Alerte sécurité sur la mission {code}. Merci de suspendre toute action sensible et d’informer immédiatement le dispatch.'],
        ['risk_late', 'Retard critique', 'Mission {code} : risque de retard. Merci d’envoyer votre position actuelle, votre ETA et la raison du retard maintenant.'],
        ['risk_replacement', 'Remplacement nécessaire', 'Mission {code} : un remplacement peut être nécessaire. Merci de confirmer si vous pouvez continuer ou si le dispatch doit activer un backup.'],
        ['risk_sensitive', 'Situation sensible', 'Mission {code} : en cas de situation médicale, sécurité ou famille sensible, merci d’escalader immédiatement selon le protocole validé.'],
        ['risk_unreachable', 'Client injoignable', 'Mission {code} : client injoignable. Merci d’appliquer les étapes de contact autorisées et de transmettre le résultat au dispatch.'],
        ['risk_address', 'Problème adresse/accès', 'Mission {code} : problème d’adresse ou d’accès. Merci d’envoyer le blocage exact, votre localisation et l’action nécessaire.'],
        ['risk_conduct', 'Rappel conduite', 'Mission {code} : gardez une communication calme et respectueuse. Ne vous engagez pas dans un conflit ; escaladez au dispatch si la tension continue.'],
        ['risk_manager_call', 'Appel manager requis', 'Mission {code} : revue manager requise. Merci de rester joignable pour un appel immédiat.'],
      ],
    },
    {
      key: 'reporting',
      icon: '✅',
      label: 'Rapport',
      helper: 'Rapports, validation, clôture et transmission opérationnelle.',
      templates: [
        ['report_submit', 'Soumettre le rapport', 'Merci de soumettre le rapport de la mission {code} : résumé du service, horaires, retour client et tout incident éventuel.'],
        ['report_missing', 'Rapport manquant', 'Le rapport de la mission {code} est toujours en attente. Merci de le compléter maintenant pour validation.'],
        ['report_evidence', 'Preuve ou pièce jointe', 'Si requis pour la mission {code}, merci d’ajouter les preuves autorisées conformément aux règles de confidentialité.'],
        ['report_feedback', 'Retour client', 'Merci de collecter le retour client pour la mission {code} avant la clôture du service.'],
        ['report_completion', 'Confirmation de fin', 'Merci de confirmer la fin de la mission {code}. Ajoutez l’heure réelle de fin et tout suivi nécessaire.'],
        ['report_finance', 'Transmission finance', 'Mission {code} : merci de confirmer toute note liée à la facturation, temps supplémentaire ou demande client.'],
        ['report_correction', 'Correction rapport', 'Le rapport de la mission {code} nécessite une correction. Merci de vérifier les champs manquants et de le soumettre à nouveau.'],
        ['report_followup', 'Suivi nécessaire', 'Mission {code} : merci d’indiquer si un suivi est nécessaire et de préciser l’action recommandée.'],
        ['report_quality', 'Revue qualité', 'Mission {code} en revue qualité. Merci de vérifier que les notes sont exactes, factuelles et complètes.'],
        ['report_closed', 'Confirmation clôture', 'La mission {code} peut être clôturée lorsque le rapport, les horaires et le statut client sont validés. Merci.'],
      ],
    },
  ]

  const activeCategory = categories.find((category) => category.key === categoryKey) || categories[0]
  const activeTemplate = activeCategory.templates.find(([key]) => key === templateKey) || activeCategory.templates[0]

  const renderTemplate = (raw: string, mission: any) =>
    raw
      .replaceAll('{code}', missionCode(mission))
      .replaceAll('{client}', missionClient(mission))
      .replaceAll('{caregiver}', missionCaregiver(mission))
      .replaceAll('{service}', missionService(mission))
      .replaceAll('{city}', missionCity(mission))
      .replaceAll('{zone}', missionZone(mission))
      .replaceAll('{time}', missionTime(mission))
      .replaceAll('{status}', missionStatus(mission))

  const draftMessage = selectedMission ? renderTemplate(activeTemplate?.[2] || '', selectedMission) : ''

  useEffect(() => {
    setEditableMessage(draftMessage)
  }, [selectedMissionId, categoryKey, templateKey])

  useEffect(() => {
    if (!missions.length) return
    if (!selectedMissionId || !missions.some((mission: any) => missionId(mission) === selectedMissionId)) {
      setSelectedMissionId(missionId(missions[0]))
    }
  }, [missions, selectedMissionId])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(eventLog.slice(0, 250)))
    } catch {}
  }, [eventLog])

  const filteredMissions = useMemo(() => {
    const q = query.trim().toLowerCase()

    return missions.filter((mission: any) => {
      if (!q) return true

      return [
        missionCode(mission),
        missionService(mission),
        missionClient(mission),
        missionCaregiver(mission),
        missionCity(mission),
        missionZone(mission),
        missionStatus(mission),
      ].join(' ').toLowerCase().includes(q)
    })
  }, [missions, query])

  const missionHistory = useMemo(() => {
    if (!selectedMission) return []
    const id = missionId(selectedMission)
    const code = missionCode(selectedMission)

    return eventLog.filter((event) => String(event.missionId) === id || String(event.missionCode) === code)
  }, [eventLog, selectedMission])

  const channelLabel: Record<string, string> = {
    whatsapp: 'WhatsApp',
    sms: 'SMS',
    email: 'Email',
    internal: 'Internal note',
  }

  const targetMissions = () => {
    if (sendMode === 'broadcast') return filteredMissions

    if (sendMode === 'selected') {
      const selected = filteredMissions.filter((mission: any) =>
        selectedMissionSet.has(missionId(mission)) || selectedMissionSet.has(missionCode(mission)),
      )

      return selected.length ? selected : selectedMission ? [selectedMission] : []
    }

    return selectedMission ? [selectedMission] : []
  }

  async function sendMessages() {
    const targets = targetMissions()
    if (!targets.length || !editableMessage.trim()) return

    setSendStatus('sending')
    setSendProgress(8)

    const events = targets.map((mission: any, index: number) => ({
      id: `comm-${Date.now()}-${index}`,
      missionId: missionId(mission),
      missionCode: missionCode(mission),
      missionService: missionService(mission),
      caregiver: missionCaregiver(mission),
      target: missionCaregiverTarget(mission),
      channel,
      channelLabel: channelLabel[channel],
      categoryKey,
      categoryLabel: activeCategory.label,
      templateKey,
      templateLabel: activeTemplate?.[1] || 'Template',
      body: renderTemplate(editableMessage, mission),
      status: 'sent',
      createdAt: new Date().toISOString(),
    }))

    for (let i = 0; i < events.length; i += 1) {
      setSendProgress(Math.round(((i + 1) / events.length) * 86) + 8)
      await new Promise((resolve) => setTimeout(resolve, 75))
    }

    setEventLog((current) => [...events, ...current].slice(0, 250))
    setSendProgress(100)
    setSendStatus('sent')

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('carelink-dispatch-communication-sent', { detail: { events } }))
    }

    setTimeout(() => {
      setSendStatus('idle')
      setSendProgress(0)
    }, 1400)
  }

  const liveTargets = targetMissions().length
  const assignedTargets = filteredMissions.filter((mission: any) => missionCaregiver(mission) !== 'Unassigned caregiver').length

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-blue-700">
            Live dispatch communications
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Communications Command Center</h2>
          <p className="mt-1 max-w-4xl text-sm font-bold leading-6 text-slate-500">
            Send operational messages to assigned caregivers, use synced mission data in templates, and keep each communication attached to mission history.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-4 xl:min-w-[660px]">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-blue-900">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70">Live missions</div>
            <div className="mt-1 text-2xl font-black">{filteredMissions.length}</div>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70">Assigned</div>
            <div className="mt-1 text-2xl font-black">{assignedTargets}</div>
          </div>
          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-3 text-violet-900">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70">Targets</div>
            <div className="mt-1 text-2xl font-black">{liveTargets}</div>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70">History</div>
            <div className="mt-1 text-2xl font-black" suppressHydrationWarning>{eventLog.length}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_1fr_420px]">
        <aside className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-950">Mission cards</h3>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">{filteredMissions.length}</span>
          </div>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search mission, caregiver, city..."
            className="mb-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          />

          <div className="max-h-[620px] space-y-3 overflow-y-auto pr-1">
            {filteredMissions.length ? filteredMissions.map((mission: any) => {
              const id = missionId(mission)
              const active = selectedMission && missionId(selectedMission) === id
              const hasCaregiver = missionCaregiver(mission) !== 'Unassigned caregiver'

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedMissionId(id)}
                  className={`w-full rounded-[1.35rem] border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
                    active ? 'border-blue-400 ring-4 ring-blue-100' : 'border-slate-200'
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Mission</div>
                      <div className="mt-1 text-base font-black text-slate-950">{missionCode(mission)}</div>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${hasCaregiver ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                      {hasCaregiver ? 'Assigned' : 'No caregiver'}
                    </span>
                  </div>

                  <div className="text-sm font-black text-slate-700">{missionService(mission)}</div>
                  <div className="mt-1 text-xs font-bold text-slate-500">{missionClient(mission)}</div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-slate-50 p-2">
                      <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Caregiver</div>
                      <div className="mt-1 line-clamp-1 text-xs font-black text-slate-700">{missionCaregiver(mission)}</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2">
                      <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Location</div>
                      <div className="mt-1 line-clamp-1 text-xs font-black text-slate-700">{missionCity(mission)} · {missionZone(mission)}</div>
                    </div>
                  </div>
                </button>
              )
            }) : (
              <div className="rounded-2xl bg-white p-6 text-center">
                <p className="text-sm font-black text-slate-800">No mission cards</p>
                <p className="mt-1 text-xs font-bold text-slate-500">Live missions will appear here.</p>
              </div>
            )}
          </div>
        </aside>

        <main className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-600">Message workflow</div>
              <h3 className="mt-2 text-xl font-black text-slate-950">
                {selectedMission ? missionCode(selectedMission) : 'Select a mission'}
              </h3>
              <p className="mt-1 text-sm font-bold text-slate-500">
                Target: {selectedMission ? missionCaregiverTarget(selectedMission) : 'No target selected'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => selectedMission && openMission?.(selectedMission)}
              disabled={!selectedMission}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 disabled:opacity-50"
            >
              Open mission card
            </button>
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-5">
            {categories.map((category) => (
              <button
                key={category.key}
                type="button"
                onClick={() => {
                  setCategoryKey(category.key)
                  setTemplateKey(category.templates[0][0])
                }}
                className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                  categoryKey === category.key ? 'border-blue-400 bg-blue-50 ring-4 ring-blue-100' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="text-xl">{category.icon}</div>
                <div className="mt-2 text-xs font-black text-slate-950">{category.label}</div>
                <div className="mt-1 text-[11px] font-bold leading-4 text-slate-500">{category.helper}</div>
              </button>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[330px_1fr]">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-950">{activeCategory.icon} Templates</h4>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-600">10</span>
              </div>

              <div className="max-h-[490px] space-y-2 overflow-y-auto pr-1">
                {activeCategory.templates.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTemplateKey(key)}
                    className={`w-full rounded-2xl border px-3 py-3 text-left text-sm font-black transition ${
                      templateKey === key ? 'border-blue-300 bg-blue-600 text-white shadow-lg shadow-blue-100' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 grid gap-3 md:grid-cols-3">
                <select value={channel} onChange={(event) => setChannel(event.target.value as any)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                  <option value="internal">Internal note</option>
                </select>

                <select value={sendMode} onChange={(event) => setSendMode(event.target.value as any)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
                  <option value="single">Selected mission only</option>
                  <option value="selected">Selected checkboxes</option>
                  <option value="broadcast">Broadcast visible missions</option>
                </select>

                <button
                  type="button"
                  onClick={() => setEditableMessage(draftMessage)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"
                >
                  Reload template
                </button>
              </div>

              <textarea
                value={editableMessage}
                onChange={(event) => setEditableMessage(event.target.value)}
                rows={12}
                className="w-full rounded-[1.4rem] border border-slate-200 bg-white p-4 text-sm font-bold leading-7 text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              />

              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Send status</div>
                    <div className="mt-1 text-sm font-black text-slate-800">
                      {sendStatus === 'sending' ? 'Sending messages…' : sendStatus === 'sent' ? 'Messages sent and linked to history' : 'Ready to send'}
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
                    {liveTargets} target(s)
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${sendProgress}%` }} />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={sendMessages}
                  disabled={!selectedMission || !editableMessage.trim() || sendStatus === 'sending'}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 disabled:opacity-50"
                >
                  {sendStatus === 'sending' ? 'Sending…' : 'Send & link to mission history'}
                </button>
                <button
                  type="button"
                  onClick={() => openBroadcast?.()}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700"
                >
                  Open broadcast modal
                </button>
              </div>
            </div>
          </div>
        </main>

        <aside className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-950">Mission communication history</h3>
              <p className="mt-1 text-xs font-bold text-slate-500">Linked event log for selected mission.</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">{missionHistory.length}</span>
          </div>

          <div className="max-h-[720px] space-y-3 overflow-y-auto pr-1">
            {missionHistory.length ? missionHistory.map((event) => (
              <div key={event.id} className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{event.channelLabel}</div>
                    <div className="mt-1 text-sm font-black text-slate-950">{event.templateLabel}</div>
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">{event.status}</span>
                </div>
                <p className="text-xs font-bold leading-5 text-slate-600">{event.body}</p>
                <div className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  {new Date(event.createdAt).toLocaleString()} · {event.caregiver}
                </div>
              </div>
            )) : (
              <div className="rounded-2xl bg-white p-6 text-center">
                <p className="text-sm font-black text-slate-800">No linked messages yet</p>
                <p className="mt-1 text-xs font-bold text-slate-500">Sent communications will appear here by mission.</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}

function DispatchQueue({ missions, selectedMissionIds, toggleMission, openMission }: { missions: DispatchMission[]; selectedMissionIds: string[]; toggleMission: (id: string) => void; openMission: (mission: DispatchMission) => void }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="font-black">Dispatch Queue</h2><p className="text-xs font-bold text-slate-500">Bulk operations and workflow control.</p><div className="mt-3 overflow-auto"><table className="w-full text-left text-xs"><thead className="text-slate-400"><tr><th className="py-2">✓</th><th>Mission</th><th>Priority</th><th>Ready</th></tr></thead><tbody>{missions.slice(0, 8).map((m) => <tr key={m.id} className="border-t border-slate-100"><td className="py-2"><input type="checkbox" checked={selectedMissionIds.includes(m.id)} onChange={() => toggleMission(m.id)} /></td><td><button onClick={() => openMission(m)} className="font-black text-blue-700">{m.mission_code}</button><p className="font-semibold text-slate-500">{m.service_type || 'Service'}</p></td><td>{m.priority || '—'}</td><td>{m.readiness_score ?? '—'}%</td></tr>)}</tbody></table>{!missions.length ? <EmptyBlock title="No queue loaded" text="Live missions will populate the dispatch queue." /> : null}</div></section>
}

function AgentAvailability({ agents, openAgent }: { agents: DispatchAgent[]; openAgent: (agent: DispatchAgent) => void }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="font-black">Agent Availability</h2><p className="text-xs font-bold text-slate-500">Live field capacity and status.</p><div className="mt-3 space-y-2">{agents.slice(0, 7).map((a) => <button key={a.id} onClick={() => openAgent(a)} className="flex w-full items-center justify-between rounded-2xl border border-slate-100 p-3 text-left hover:bg-slate-50"><div className="flex items-center gap-3"><div className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-xs font-black">{initials(a.full_name)}</div><div><p className="text-sm font-black">{a.full_name}</p><p className="text-xs font-bold text-slate-500">{[a.city, a.zone].filter(Boolean).join(' · ') || 'Location pending'}</p></div></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">{a.status || 'unknown'}</span></button>)}{!agents.length ? <EmptyBlock title="No agents loaded" text="Connected field agents will appear here from live records." /> : null}</div></section>
}

function SlaAndIncidents({ incidents, missions, openIncident }: { incidents: DispatchIncident[]; missions: DispatchMission[]; openIncident: (incident: DispatchIncident) => void }) {
  const risk = missions.filter((m) => (m.sla_minutes_remaining ?? 9999) <= 30 || m.status === 'at_risk' || m.status === 'escalation')
  return <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="font-black">SLA & Escalations</h2><p className="text-xs font-bold text-slate-500">SLA risk, incidents, escalation center.</p><div className="mt-3 grid grid-cols-2 gap-2"><MiniStat label="Risk missions" value={risk.length} /><MiniStat label="Incidents" value={incidents.length} /></div><div className="mt-3 space-y-2">{incidents.slice(0, 5).map((i) => <button key={i.id} onClick={() => openIncident(i)} className="w-full rounded-2xl border border-rose-100 bg-rose-50 p-3 text-left"><p className="text-sm font-black text-rose-800">{i.incident_type}</p><p className="text-xs font-bold text-rose-600">{i.summary || 'No summary'} · {i.status || 'open'}</p></button>)}{!incidents.length ? <EmptyBlock title="No incidents" text="Incident alerts and SLA escalations will appear from live incident tables." /> : null}</div></section>
}

function MiniStat({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs font-black text-slate-500">{label}</p><p className="text-2xl font-black">{value}</p></div> }
function EmptyBlock({ title, text, className = '' }: { title: string; text: string; className?: string }) { return <div className={`rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center ${className}`}><p className="font-black text-slate-700">{title}</p><p className="mt-2 text-sm font-semibold text-slate-500">{text}</p></div> }

function MissionDetailsPanel({ mission, agents, incidents, runAction, openModal, actionBusy }: { mission: DispatchMission | null; agents: DispatchAgent[]; incidents: DispatchIncident[]; runAction: (input: DispatchActionRequest) => Promise<boolean>; openModal: (modal: ModalState) => void; actionBusy: boolean }) {
  const relatedIncidents = mission ? incidents.filter((i) => i.mission_id === mission.id || i.mission_code === mission.mission_code) : []
  return (
    <aside className="sticky top-0 h-screen overflow-y-auto bg-white p-5">
      <div className="mb-4 flex items-center justify-between"><p className="text-xs font-black uppercase tracking-[.18em] text-slate-500">Mission Details</p><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">Live</span></div>
      {!mission ? <EmptyBlock title="No mission selected" text="Select a live mission from the dispatch board to view its operational control panel." /> : <div className="space-y-5"><div className="rounded-3xl border border-slate-200 p-4"><div className="flex items-start justify-between"><div><h2 className="text-2xl font-black">{mission.mission_code}</h2><p className="font-bold text-slate-500">{mission.service_type || 'Service not set'}</p></div><span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${toneClass(mission.status === 'at_risk' || mission.status === 'escalation' ? 'red' : 'blue')}`}>{statusLabel(mission.status)}</span></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><Info label="Client" value={mission.client_name || mission.beneficiary_name || '—'} /><Info label="Location" value={[mission.city, mission.zone].filter(Boolean).join(' · ') || '—'} /><Info label="Schedule" value={`${fmtTime(mission.scheduled_start)} → ${fmtTime(mission.scheduled_end)}`} /><Info label="Priority" value={mission.priority || '—'} /></div></div><div className="rounded-3xl border border-slate-200 p-4"><h3 className="font-black">Assignment</h3><p className="mt-2 text-sm font-bold text-slate-500">Assigned agent: {mission.assigned_agent_name || 'Not assigned'}</p><div className="mt-3 grid grid-cols-2 gap-2"><button disabled={actionBusy || !agents[0]} onClick={() => agents[0] && runAction({ action: 'assign_mission', missionId: mission.id, agentId: agents[0].id })} className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-black text-white disabled:opacity-50">Assign best available</button><button onClick={() => openModal({ type: 'mission', mission })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-black">Edit workflow</button></div></div><div className="rounded-3xl border border-slate-200 p-4"><h3 className="font-black">Recommended Agents</h3><div className="mt-3 space-y-2">{agents.slice(0, 5).map((a) => <div key={a.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"><div><p className="text-sm font-black">{a.full_name}</p><p className="text-xs font-bold text-slate-500">{[a.city, a.zone].filter(Boolean).join(' · ') || 'No location'} · {a.status || 'unknown'}</p></div><button onClick={() => runAction({ action: 'assign_mission', missionId: mission.id, agentId: a.id })} className="rounded-xl bg-white px-3 py-1.5 text-xs font-black text-blue-700 shadow-sm">Assign</button></div>)}{!agents.length ? <EmptyBlock title="No agent pool" text="Create/live-sync agent records to activate assignment recommendations." /> : null}</div></div><div className="rounded-3xl border border-slate-200 p-4"><h3 className="font-black">Escalation Controls</h3><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => runAction({ action: 'escalate_mission', missionId: mission.id, payload: { blockers: mission.blockers } })} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-black text-rose-700">Escalate</button><button onClick={() => runAction({ action: 'set_status', missionId: mission.id, payload: { status: 'at_risk' } })} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-black text-amber-700">Mark At Risk</button></div></div><div className="rounded-3xl border border-slate-200 p-4"><h3 className="font-black">Related Incidents</h3>{relatedIncidents.length ? relatedIncidents.map((i) => <p key={i.id} className="mt-2 text-sm font-bold text-rose-700">{i.incident_type}: {i.summary}</p>) : <p className="mt-2 text-sm font-semibold text-slate-500">No linked incidents.</p>}</div><button onClick={() => runAction({ action: 'delete_mission', missionId: mission.id })} className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-black text-rose-700">Delete Mission Permanently</button></div>}
    </aside>
  )
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs font-black uppercase tracking-[.1em] text-slate-400">{label}</p><p className="mt-1 font-bold text-slate-700">{value}</p></div> }

function WorkflowModal({ modal, close, agents, selectedMissionIds, selectedMission, runAction, actionBusy }: { modal: ModalState; close: () => void; agents: DispatchAgent[]; selectedMissionIds: string[]; selectedMission: DispatchMission | null; runAction: (input: DispatchActionRequest) => Promise<boolean>; actionBusy: boolean }) {
  const [form, setForm] = useState<Record<string, string>>({})
  useEffect(() => { setForm({}) }, [modal.type])
  if (modal.type === 'none') return null
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-slate-950/40 p-6 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-[.25em] text-blue-600">CareLink Dispatch Workflow</p><h2 className="mt-2 text-2xl font-black">{modal.type === 'create' ? 'Create Mission' : modal.type === 'import' ? 'Import Requests' : modal.type === 'broadcast' ? 'Broadcast Message' : modal.type === 'batch' ? 'Batch Assignment' : modal.type === 'mission' ? modal.mission.mission_code : modal.type === 'agent' ? modal.agent.full_name : modal.type === 'incident' ? modal.incident.incident_type : modal.type === 'sector' ? `${modal.sector.city_name} · ${modal.sector.sector_name}` : modal.title}</h2></div><button onClick={close} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 font-black">×</button></div>
        {modal.type === 'create' ? <MissionCreateForm form={form} setForm={setForm} submit={() => runAction({ action: 'create_mission', payload: form })} busy={actionBusy} /> : null}
        {modal.type === 'import' ? <ImportForm form={form} setForm={setForm} submit={() => { try { const rows = JSON.parse(form.rows || '[]'); return runAction({ action: 'import_requests', payload: { rows } }) } catch { return Promise.resolve(false) } }} busy={actionBusy} /> : null}
        {modal.type === 'broadcast' ? <BroadcastForm form={form} setForm={setForm} submit={() => runAction({ action: 'broadcast_message', payload: form })} busy={actionBusy} /> : null}
        {modal.type === 'batch' ? <BatchForm agents={agents} missionIds={selectedMissionIds} form={form} setForm={setForm} submit={() => runAction({ action: 'batch_assign', missionIds: selectedMissionIds, agentId: form.agentId })} busy={actionBusy} /> : null}
        {modal.type === 'mission' ? <MissionEditForm mission={modal.mission} agents={agents} form={form} setForm={setForm} runAction={runAction} busy={actionBusy} /> : null}
        {modal.type === 'agent' ? <JsonDetails data={modal.agent} /> : null}
        {modal.type === 'incident' ? <JsonDetails data={modal.incident} /> : null}
        {modal.type === 'sector' ? <JsonDetails data={modal.sector} /> : null}
        {modal.type === 'action' ? <p className="text-sm font-semibold leading-7 text-slate-600">{modal.body}</p> : null}
      </div>
    </div>
  )
}

function Field({ label, name, form, setForm, type = 'text' }: { label: string; name: string; form: Record<string, string>; setForm: (v: Record<string, string>) => void; type?: string }) { return <label className="block"><span className="text-xs font-black uppercase tracking-[.12em] text-slate-500">{label}</span><input type={type} value={form[name] || ''} onChange={(e) => setForm({ ...form, [name]: e.target.value })} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500" /></label> }
function MissionCreateForm({ form, setForm, submit, busy }: { form: Record<string, string>; setForm: (v: Record<string, string>) => void; submit: () => void; busy: boolean }) { return <div className="grid grid-cols-2 gap-4"><Field label="Mission Code" name="mission_code" form={form} setForm={setForm} /><Field label="Service Type" name="service_type" form={form} setForm={setForm} /><Field label="Client Name" name="client_name" form={form} setForm={setForm} /><Field label="Beneficiary Name" name="beneficiary_name" form={form} setForm={setForm} /><Field label="City" name="city" form={form} setForm={setForm} /><Field label="Zone" name="zone" form={form} setForm={setForm} /><Field label="Scheduled Start" name="scheduled_start" type="datetime-local" form={form} setForm={setForm} /><Field label="Scheduled End" name="scheduled_end" type="datetime-local" form={form} setForm={setForm} /><button disabled={busy} onClick={submit} className="col-span-2 rounded-2xl bg-blue-600 px-5 py-3 font-black text-white disabled:opacity-50">Create Live Mission</button></div> }
function ImportForm({ form, setForm, submit, busy }: { form: Record<string, string>; setForm: (v: Record<string, string>) => void; submit: () => void; busy: boolean }) { return <div><p className="mb-3 text-sm font-semibold text-slate-600">Paste a JSON array of mission objects. No sample data is provided or injected.</p><textarea value={form.rows || ''} onChange={(e) => setForm({ ...form, rows: e.target.value })} className="h-64 w-full rounded-2xl border border-slate-200 p-4 font-mono text-sm outline-none" placeholder='[{"mission_code":"...","service_type":"..."}]' /><button disabled={busy} onClick={submit} className="mt-4 rounded-2xl bg-blue-600 px-5 py-3 font-black text-white disabled:opacity-50">Import Live Requests</button></div> }
function BroadcastForm({ form, setForm, submit, busy }: { form: Record<string, string>; setForm: (v: Record<string, string>) => void; submit: () => void; busy: boolean }) { return <div className="space-y-4"><Field label="Channel" name="channel" form={form} setForm={setForm} /><label className="block"><span className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Message</span><textarea value={form.body || ''} onChange={(e) => setForm({ ...form, body: e.target.value })} className="mt-1 h-36 w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold outline-none" /></label><button disabled={busy} onClick={submit} className="rounded-2xl bg-blue-600 px-5 py-3 font-black text-white disabled:opacity-50">Send Broadcast</button></div> }
function BatchForm({ agents, missionIds, form, setForm, submit, busy }: { agents: DispatchAgent[]; missionIds: string[]; form: Record<string, string>; setForm: (v: Record<string, string>) => void; submit: () => void; busy: boolean }) { return <div><p className="text-sm font-semibold text-slate-600">Selected missions: <b>{missionIds.length}</b></p><select value={form.agentId || ''} onChange={(e) => setForm({ ...form, agentId: e.target.value })} className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold"><option value="">Select live agent</option>{agents.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}</select><button disabled={busy || !missionIds.length || !form.agentId} onClick={submit} className="mt-4 rounded-2xl bg-blue-600 px-5 py-3 font-black text-white disabled:opacity-50">Batch Assign</button></div> }
function MissionEditForm({ mission, agents, form, setForm, runAction, busy }: { mission: DispatchMission; agents: DispatchAgent[]; form: Record<string, string>; setForm: (v: Record<string, string>) => void; runAction: (input: DispatchActionRequest) => Promise<boolean>; busy: boolean }) { return <div className="space-y-4"><select value={form.status || mission.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold"><option value="new_request">New Request</option><option value="qualification">Qualification</option><option value="ready_for_dispatch">Ready for Dispatch</option><option value="matching">Matching</option><option value="proposed">Proposed</option><option value="assigned">Assigned</option><option value="accepted">Accepted</option><option value="en_route">En Route</option><option value="on_site">On Site</option><option value="at_risk">At Risk</option><option value="escalation">Escalation</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><select value={form.agentId || ''} onChange={(e) => setForm({ ...form, agentId: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold"><option value="">Assign/reassign agent</option>{agents.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}</select><div className="grid grid-cols-2 gap-3"><button disabled={busy} onClick={() => runAction({ action: 'set_status', missionId: mission.id, payload: { status: form.status || mission.status } })} className="rounded-2xl bg-blue-600 px-5 py-3 font-black text-white disabled:opacity-50">Update Status</button><button disabled={busy || !form.agentId} onClick={() => runAction({ action: 'reassign_mission', missionId: mission.id, agentId: form.agentId })} className="rounded-2xl border border-slate-200 px-5 py-3 font-black disabled:opacity-50">Assign Agent</button></div></div> }
function JsonDetails({ data }: { data: unknown }) { return <pre className="max-h-[60vh] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs font-bold text-slate-100">{JSON.stringify(data, null, 2)}</pre> }
