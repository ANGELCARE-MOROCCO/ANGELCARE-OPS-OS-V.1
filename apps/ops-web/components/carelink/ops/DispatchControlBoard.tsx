'use client'

import { useMemo, useState } from 'react'
import { carelinkAgents, carelinkMissions } from '@/lib/carelink/seed'
import { CareLinkOpsShell } from './CareLinkOpsShell'
import { OpsPanel } from './OpsPrimitives'
import { StatusPill } from '@/components/carelink/shared/CareLinkPrimitives'
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

  return {
    ...row,
    id: row.id || row.mission_id || row.missionId || code || index,
    code,
    missionCode: code,
    laneKey: __dispatchLaneKey(row),
    dispatchLane: __dispatchLaneKey(row),
    serviceType: row.serviceType || row.service_type || row.title || row.mission_type || 'Mission AngelCare',
    clientName:
      row.clientName ||
      row.client_name ||
      row.clientLabel ||
      row.familyName ||
      row.family_name ||
      (row.family_id || row.familyId ? `Family #${row.family_id || row.familyId}` : 'Family pending'),
    familyName:
      row.familyName ||
      row.family_name ||
      row.clientLabel ||
      row.clientName ||
      (row.family_id || row.familyId ? `Family #${row.family_id || row.familyId}` : 'Family pending'),
    agentName:
      row.agentName ||
      row.agent_name ||
      row.caregiverName ||
      row.caregiver_name ||
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
    readinessStatus: row.readinessStatus || row.readiness_status || row.status || 'pending',
    readinessScore: Number(row.readinessScore ?? row.readiness_score ?? 0),
    startTime: row.startTime || row.start_time || row.scheduledStartTime || row.scheduled_start_time || '—',
    endTime: row.endTime || row.end_time || row.scheduledEndTime || row.scheduled_end_time || '—',
    missionDate: __dispatchMissionDate(row),
    notes: row.notes || row.instructions || row.description || '',
    latitude: row.latitude || row.lat,
    longitude: row.longitude || row.lng || row.long,
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
      city: row.city || '—',
      zone: row.zone || '—',
      status: 'assigned',
      skills: [],
      missionCount: 0,
    }

    const service = __dispatchLiveText(row.serviceType || row.service_type || row.title, '')
    if (service && !current.skills.includes(service)) current.skills.push(service)
    current.missionCount += 1

    map.set(key, current)
  }

  return Array.from(map.values())
}


type AnyRecord = Record<string, any>

type DispatchControlBoardProps = {
  initialPayload?: any
}

const DISPATCH_LANES = [
  { key: 'unassigned', label: 'Unassigned', icon: '◎', tone: 'slate', helper: 'Needs caregiver assignment' },
  { key: 'assigned', label: 'Assigned', icon: '●', tone: 'blue', helper: 'Caregiver linked' },
  { key: 'accepted', label: 'Accepted', icon: '◆', tone: 'violet', helper: 'Confirmed by field' },
  { key: 'en_route', label: 'En route', icon: '↗', tone: 'cyan', helper: 'Route active' },
  { key: 'in_progress', label: 'In progress', icon: '◉', tone: 'green', helper: 'Mission executing' },
  { key: 'report_pending', label: 'Report pending', icon: '▣', tone: 'amber', helper: 'Needs report' },
  { key: 'closed', label: 'Closed', icon: '✓', tone: 'green', helper: 'Completed/validated' },
  { key: 'at_risk', label: 'At risk', icon: '△', tone: 'red', helper: 'Escalation required' },
]

function text(value: unknown, fallback = '—') {
  return value === null || value === undefined || value === '' ? fallback : String(value)
}

function liveVisible(row: AnyRecord) {
  const status = text(row.status || row.lifecycle_stage || row.lifecycleStage || row.dossier_status || row.dossierStatus, '').toLowerCase()
  if (row.is_archived === true || row.isArchived === true) return false
  if (status.includes('deleted') || status.includes('archived') || status.includes('cancelled')) return false
  return true
}

function laneFor(row: AnyRecord) {
  const raw = text(row.status || row.lifecycleStage || row.lifecycle_stage || row.dispatchStatus || row.dispatch_status || row.readinessStatus || 'created').toLowerCase()

  if (raw.includes('risk') || raw.includes('incident') || raw.includes('blocked')) return 'at_risk'
  if (raw.includes('closed') || raw.includes('complete') || raw.includes('valid')) return 'closed'
  if (raw.includes('report')) return 'report_pending'
  if (raw.includes('progress') || raw.includes('started')) return 'in_progress'
  if (raw.includes('route') || raw.includes('travel')) return 'en_route'
  if (raw.includes('accepted') || raw.includes('confirm')) return 'accepted'
  if (raw.includes('assign') || row.caregiver_id || row.caregiverId || row.assignedAgent || row.caregiverName) return 'assigned'
  return 'unassigned'
}

function missionDate(row: AnyRecord) {
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
  const str = String(raw)
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str

  const parsed = new Date(str)
  if (Number.isNaN(parsed.getTime())) return str.slice(0, 10)
  return parsed.toISOString().slice(0, 10)
}

function humanDay(key: string) {
  if (!key) return 'All dates'
  const date = new Date(`${key}T12:00:00`)
  if (Number.isNaN(date.getTime())) return key
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

function dayWindow(center: string) {
  const base = new Date(`${center}T12:00:00`)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(base)
    date.setDate(date.getDate() + index - 3)
    const key = date.toISOString().slice(0, 10)
    return {
      key,
      day: date.toLocaleDateString('en-GB', { day: '2-digit' }),
      weekday: date.toLocaleDateString('en-GB', { weekday: 'short' }),
      label: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      today: key === new Date().toISOString().slice(0, 10),
    }
  })
}

function toneClass(tone: string) {
  const tones: Record<string, string> = {
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    red: 'border-rose-200 bg-rose-50 text-rose-700',
  }
  return tones[tone] || tones.slate
}

function collectPayloadMissions(initialPayload: any) {
  const source = initialPayload || {}
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

  const rows: AnyRecord[] = []

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

  return rows
}

function normalizeMission(row: AnyRecord, index: number): AnyRecord {
  const code = resolvedMissionCode(row) || row.code || (row as any).mission_reference || (row as any).dossier_reference || `M-${row.id || index + 1}`

  return {
    ...row,
    id: row.id || row.mission_id || row.missionId || code || index,
    code,
    serviceType: row.serviceType || row.service_type || row.title || 'Mission AngelCare',
    familyName:
      row.familyName ||
      row.clientLabel ||
      row.clientName ||
      row.family_name ||
      row.client_name ||
      (row.family_id || row.familyId ? `Family #${row.family_id || row.familyId}` : 'Family pending'),
    caregiverName:
      row.caregiverName ||
      row.agentName ||
      row.assignedAgent ||
      row.caregiver_name ||
      row.agent_name ||
      (row.caregiver_id || row.caregiverId ? `Agent #${row.caregiver_id || row.caregiverId}` : 'Unassigned'),
    city: row.city || 'City pending',
    zone: row.zone || 'Zone pending',
    riskLevel: row.riskLevel || row.risk_level || 'normal',
    readinessStatus: row.readinessStatus || row.readiness_status || row.status || 'pending',
    readinessScore: Number(row.readinessScore ?? row.readiness_score ?? 0),
    startTime: row.startTime || row.start_time || row.scheduledStartTime || '—',
    endTime: row.endTime || row.end_time || row.scheduledEndTime || '—',
    notes: row.notes || row.instructions || row.description || '',
  }
}

function sourceMissions(initialPayload: any) {
  const liveRows = collectPayloadMissions(initialPayload)
  const fallbackRows = liveRows.length ? [] : (false ? [] : carelinkMissions)

  const seen = new Set<string>()

  return [...liveRows, ...fallbackRows]
    .filter(Boolean)
    .filter(liveVisible)
    .map(normalizeMission)
    .filter((row, index) => {
      const key = String(row.id || row.code || index)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function Metric({ label, value, helper, tone = 'slate' }: { label: string; value: number | string; helper: string; tone?: string }) {
  return (
    <div className={`rounded-[1.35rem] border p-4 ${toneClass(tone)}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70">{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
      <div className="mt-1 text-xs font-bold opacity-75">{helper}</div>
    </div>
  )
}

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-1 text-xs font-black text-slate-800">{value}</div>
    </div>
  )
}

function PremiumMissionCard({
  mission,
  agents,
  density,
}: {
  mission: AnyRecord
  agents: AnyRecord[]
  density: 'premium' | 'compact'
}) {
  const lane = DISPATCH_LANES.find((item) => item.key === laneFor(mission)) || DISPATCH_LANES[0]
  const risky = lane.key === 'at_risk' || text(mission.riskLevel, '').toLowerCase().includes('high')

  return (
    <article className="rounded-[1.55rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Mission</div>
          <h3 className="mt-1 text-lg font-black tracking-tight text-slate-950">{mission.code}</h3>
          <p className="mt-1 text-sm font-black text-slate-700">{mission.serviceType}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{mission.familyName}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${toneClass(risky ? 'red' : lane.tone)}`}>
          {lane.icon} {risky ? 'Risk' : lane.label}
        </span>
      </div>

      <div className={`mt-4 grid gap-2 ${density === 'premium' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <DetailPill label="Caregiver" value={mission.caregiverName} />
        <DetailPill label="Timing" value={`${mission.startTime} → ${mission.endTime}`} />
        <DetailPill label="Location" value={`${mission.city} · ${mission.zone}`} />
        <DetailPill label="Readiness" value={`${mission.readinessScore || 0}% · ${mission.readinessStatus}`} />
      </div>

      {density === 'premium' ? (
        <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Dispatch note</div>
          <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">
            {mission.notes || 'No dispatch note recorded yet.'}
          </p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        <select className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700">
          <option>Assign caregiver</option>
          {agents.map((agent) => (
            <option key={agent.id || agent.fullName}>{agent.fullName || agent.name}</option>
          ))}
        </select>

        <select className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700" defaultValue={lane.key}>
          {DISPATCH_LANES.map((item) => (
            <option key={item.key} value={item.key}>{item.label}</option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Open dossier</button>
        <button className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">Route</button>
        <button className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">Start</button>
        <button className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">Report</button>
        {risky ? <button className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">Escalate</button> : null}
      </div>
    </article>
  )
}

export function DispatchControlBoard({ initialPayload }: DispatchControlBoardProps = {}) {
  const [query, setQuery] = useState('')
  const [activeLane, setActiveLane] = useState('all')
  const [density, setDensity] = useState<'premium' | 'compact'>('premium')
  const [selectedDay, setSelectedDay] = useState(() => new Date().toISOString().slice(0, 10))

  const liveDispatchMissions = useMemo(() => __dispatchCollectLiveRows(initialPayload), [initialPayload])
  const liveDispatchAgents = useMemo(() => __dispatchBuildLiveAgents([]), [[]])
  const hasLiveDispatchRows = [].length > 0

  const missions = useMemo(() => (hasLiveDispatchRows ? liveDispatchMissions : sourceMissions(initialPayload)), [hasLiveDispatchRows, liveDispatchMissions, initialPayload])
  const agents = useMemo(() => (liveDispatchAgents.length ? liveDispatchAgents : carelinkAgents), [liveDispatchAgents])
  const days = useMemo(() => dayWindow(selectedDay), [selectedDay])

  const dayMissions = useMemo(() => {
    return missions.filter((mission) => {
      const key = missionDate(mission)
      return !key || key === selectedDay
    })
  }, [missions, selectedDay])

  const visibleMissions = useMemo(() => {
    const q = query.trim().toLowerCase()

    return dayMissions
      .filter((mission) => activeLane === 'all' || laneFor(mission) === activeLane)
      .filter((mission) => {
        if (!q) return true
        return [
          mission.code,
          mission.serviceType,
          mission.familyName,
          mission.caregiverName,
          mission.city,
          mission.zone,
          mission.readinessStatus,
          mission.riskLevel,
        ].join(' ').toLowerCase().includes(q)
      })
  }, [dayMissions, activeLane, query])

  const lanes = useMemo(() => {
    return DISPATCH_LANES.map((lane) => ({
      ...lane,
      missions: dayMissions.filter((mission) => laneFor(mission) === lane.key),
    }))
  }, [dayMissions])

  const stats = useMemo(() => ({
    total: dayMissions.length,
    assigned: dayMissions.filter((mission) => laneFor(mission) === 'assigned').length,
    active: dayMissions.filter((mission) => ['en_route', 'in_progress'].includes(laneFor(mission))).length,
    risk: dayMissions.filter((mission) => laneFor(mission) === 'at_risk').length,
  }), [dayMissions])


  return (
    <CareLinkOpsShell
      title="Dispatch control board"
      subtitle="Assignation, réassignation, alertes, readiness et intervention temps réel."
    >
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-white">
                  Premium dispatch cockpit
                </div>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-white">Live Mission Dispatch Command</h2>
                <p className="mt-2 max-w-4xl text-sm font-bold leading-6 text-white/75">
                  Multi-lane mission execution cockpit with date navigation, assignment readiness, route control, escalation recognition and operational status movement.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setDensity(density === 'premium' ? 'compact' : 'premium')}
                  className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/15"
                >
                  {density === 'premium' ? 'Compact cards' : 'Premium cards'}
                </button>
                <a
                  href="/carelink-ops/missions"
                  className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500"
                >
                  Open mission registry →
                </a>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-4">
              <Metric label="Visible missions" value={stats.total} helper="Selected operational day" tone="blue" />
              <Metric label="Assigned" value={stats.assigned} helper="Caregiver linked" tone="violet" />
              <Metric label="Active flow" value={stats.active} helper="En route / progress" tone="green" />
              <Metric label="Risk signals" value={stats.risk} helper="Needs attention" tone={stats.risk ? 'red' : 'slate'} />
            </div>
          </div>

          <div className="border-b border-slate-100 bg-white p-5">
            <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
              <div className="grid gap-3 md:grid-cols-[1fr_240px]">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search missions, families, caregivers, zones, risk, readiness..."
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Selected day</div>
                  <div className="mt-1 text-sm font-black text-slate-950">{humanDay(selectedDay)}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const date = new Date(`${selectedDay}T12:00:00`)
                    date.setDate(date.getDate() - 1)
                    setSelectedDay(date.toISOString().slice(0, 10))
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setSelectedDay(new Date().toISOString().slice(0, 10))}
                  className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white shadow-sm"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const date = new Date(`${selectedDay}T12:00:00`)
                    date.setDate(date.getDate() + 1)
                    setSelectedDay(date.toISOString().slice(0, 10))
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
                >
                  Next →
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-7">
              {days.map((day) => {
                const active = day.key === selectedDay
                return (
                  <button
                    key={day.key}
                    onClick={() => setSelectedDay(day.key)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      active
                        ? 'border-blue-500 bg-blue-600 text-white shadow-[0_16px_40px_rgba(37,99,235,0.24)]'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`text-[10px] font-black uppercase tracking-[0.22em] ${active ? 'text-blue-100' : 'text-slate-400'}`}>{day.weekday}</div>
                    <div className="mt-1 text-xl font-black">{day.day}</div>
                    <div className={`mt-1 text-xs font-bold ${active ? 'text-blue-100' : 'text-slate-500'}`}>{day.label}</div>
                    {day.today ? <div className="mt-2 text-[10px] font-black">Today</div> : null}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="border-b border-slate-100 bg-slate-50 p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveLane('all')}
                className={`rounded-2xl px-4 py-2 text-sm font-black ${activeLane === 'all' ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}
              >
                All ({dayMissions.length})
              </button>
              {lanes.map((lane) => (
                <button
                  key={lane.key}
                  onClick={() => setActiveLane(lane.key)}
                  className={`rounded-2xl px-4 py-2 text-sm font-black ${activeLane === lane.key ? 'bg-blue-600 text-white' : `border ${toneClass(lane.tone)}`}`}
                >
                  {lane.icon} {lane.label} ({lane.missions.length})
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
          <aside className="space-y-4">
            <OpsPanel title="Dispatch lane intelligence">
              <div className="space-y-3">
                {lanes.map((lane) => (
                  <button
                    key={lane.key}
                    onClick={() => setActiveLane(lane.key)}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm hover:border-blue-200"
                  >
                    <div>
                      <div className="text-sm font-black text-slate-900">{lane.icon} {lane.label}</div>
                      <div className="mt-1 text-xs font-bold text-slate-500">{lane.helper}</div>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${toneClass(lane.tone)}`}>{lane.missions.length}</span>
                  </button>
                ))}
              </div>
            </OpsPanel>

            <OpsPanel title="Workforce quick assignment">
              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                {agents.map((agent) => (
                  <div key={agent.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <div className="text-sm font-black text-slate-900">{agent.fullName}</div>
                    <div className="mt-1 text-xs font-bold text-slate-500">{agent.city} · {agent.zone || 'All zones'}</div>
                    <div className="mt-2 flex gap-2">
                      <StatusPill tone={agent.status === 'available' ? 'green' : 'amber'}>{agent.status}</StatusPill>
                      <StatusPill tone="blue">{agent.skills?.[0] || 'Ops'}</StatusPill>
                    </div>
                  </div>
                ))}
              </div>
            </OpsPanel>
          </aside>

          <section>
            <div className="mb-4 flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-600">Mission execution cards</div>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                  {activeLane === 'all'
                    ? 'All dispatch missions'
                    : `${DISPATCH_LANES.find((lane) => lane.key === activeLane)?.label || activeLane} missions`}
                </h2>
                <p className="mt-1 text-sm font-bold text-slate-500">
                  Scroll through live mission cards, inspect readiness, assign caregivers, move status and escalate exceptions.
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700">{visibleMissions.length} visible</span>
            </div>

            {visibleMissions.length ? (
              <div className={`max-h-[860px] overflow-y-auto pr-2 grid gap-4 ${density === 'premium' ? 'xl:grid-cols-2 2xl:grid-cols-3' : 'xl:grid-cols-3 2xl:grid-cols-4'}`}>
                {visibleMissions.map((mission) => (
                  <PremiumMissionCard
                    key={String(mission.id || mission.code)}
                    mission={mission}
                    agents={agents}
                    density={density}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-2xl font-black text-slate-400">◇</div>
                <h3 className="mt-4 text-xl font-black text-slate-950">No dispatch missions for this view</h3>
                <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-500">
                  Change the date, lane filter, or search query. New mission dossiers will appear here once live mission rows reach the dispatch payload.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </CareLinkOpsShell>
  )
}
