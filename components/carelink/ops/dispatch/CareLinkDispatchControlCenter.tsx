'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DispatchActionRequest, DispatchAgent, DispatchIncident, DispatchLane, DispatchMessage, DispatchMission, DispatchPayload, DispatchSector } from '@/lib/carelink/ops-dispatch-types'

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

function initials(name?: string | null) {
  const parts = String(name || 'AC').trim().split(/\s+/).filter(Boolean)
  return (parts[0]?.[0] || 'A') + (parts[1]?.[0] || 'C')
}

export function CareLinkDispatchControlCenter({ initialPayload }: { initialPayload?: DispatchPayload }) {
  const [payload, setPayload] = useState<DispatchPayload>(() => normalizePayload(initialPayload))
  const [query, setQuery] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [readinessFilter, setReadinessFilter] = useState('')
  const [selectedMissionIds, setSelectedMissionIds] = useState<string[]>([])
  const [selectedMission, setSelectedMission] = useState<DispatchMission | null>(() => initialPayload?.missions?.[0] || null)
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
      const res = await fetch('/api/carelink/ops/dispatch', { method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store' })
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
      const res = await fetch('/api/carelink/ops/dispatch/actions', {
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

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="grid min-h-screen grid-cols-[220px_minmax(0,1fr)_360px]">
        <CareLinkOpsSidebar />

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

            <DispatchBoard lanes={lanes} selectedMissionIds={selectedMissionIds} toggleMission={toggleMission} openMission={(mission) => { setSelectedMission(mission); setModal({ type: 'mission', mission }) }} />

            <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)] gap-4">
              <LiveOperationsMap sectors={safePayload.sectors} missions={safePayload.missions} agents={safePayload.agents} openSector={(sector) => setModal({ type: 'sector', sector })} />
              <CommunicationsPanel communications={safePayload.communications} log={log} openBroadcast={() => setModal({ type: 'broadcast' })} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <DispatchQueue missions={filteredMissions} selectedMissionIds={selectedMissionIds} toggleMission={toggleMission} openMission={(mission) => { setSelectedMission(mission); setModal({ type: 'mission', mission }) }} />
              <AgentAvailability agents={safePayload.agents} openAgent={(agent) => setModal({ type: 'agent', agent })} />
              <SlaAndIncidents incidents={safePayload.incidents} missions={filteredMissions} openIncident={(incident) => setModal({ type: 'incident', incident })} />
            </div>
          </section>
        </section>

        <MissionDetailsPanel mission={selectedMissionLive} agents={safePayload.agents} incidents={safePayload.incidents} runAction={runAction} openModal={setModal} actionBusy={actionBusy} />
      </div>

      <WorkflowModal modal={modal} close={() => setModal({ type: 'none' })} agents={safePayload.agents} selectedMissionIds={selectedMissionIds} selectedMission={selectedMissionLive} runAction={runAction} actionBusy={actionBusy} />
    </main>
  )
}

export default CareLinkDispatchControlCenter

function CareLinkOpsSidebar() {
  return (
    <aside className="sticky top-0 h-screen border-r border-slate-200 bg-white px-4 py-5">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-sm font-black text-white shadow-lg shadow-blue-100">AC</div>
        <div><p className="text-lg font-black">AngelCare</p><p className="text-xs font-bold text-slate-500">CareLink Ops</p></div>
      </div>
      <nav className="space-y-1">
        {CARELINK_OPS_SIDE_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-black transition ${item.href === '/carelink-ops/dispatch' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <span>{item.label}</span>
            {item.label === 'Incidents' ? <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white">!</span> : null}
          </Link>
        ))}
      </nav>
      <div className="absolute bottom-5 left-4 right-4 space-y-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-black uppercase tracking-[.2em] text-slate-500">Live System Status</p><p className="mt-3 text-sm font-bold text-emerald-700">● Dispatch shell ready</p><p className="mt-1 text-xs font-semibold text-slate-500">No demo data loaded.</p></div>
      </div>
    </aside>
  )
}

function ActionButton({ label, onClick, primary }: { label: string; onClick: () => void; primary?: boolean }) {
  return <button onClick={onClick} className={`rounded-xl px-4 py-2 text-sm font-black shadow-sm transition ${primary ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>{primary ? '+ ' : ''}{label}</button>
}

function SystemBanner({ payload }: { payload: DispatchPayload }) {
  if (payload.source === 'live-db' && !payload.metadata.warnings.length) return null
  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
      <span className="font-black">Production data status:</span> {payload.message || payload.metadata.warnings[0] || 'Dispatch module is live-ready. Apply the migration and connect real CareLink Ops tables to populate this screen.'}
    </div>
  )
}

function KpiStrip({ payload }: { payload: DispatchPayload }) {
  return (
    <div className="grid grid-cols-6 gap-3">
      {payload.kpis.map((kpi) => <div key={kpi.key} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-black uppercase tracking-[.12em] text-slate-400">{kpi.label}</p><p className="mt-2 text-3xl font-black">{kpi.value}</p><p className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-black ring-1 ${toneClass(kpi.tone)}`}>{kpi.helper}</p></div>)}
      {!payload.kpis.length ? <EmptyBlock className="col-span-6" title="No KPI payload loaded" text="The dispatch KPIs will populate from live CareLink Ops mission, agent, incident, and SLA tables." /> : null}
    </div>
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

function DispatchBoard({ lanes, selectedMissionIds, toggleMission, openMission }: { lanes: DispatchLane[]; selectedMissionIds: string[]; toggleMission: (id: string) => void; openMission: (mission: DispatchMission) => void }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-black">Mission Dispatch Workflow</h2><p className="text-sm font-semibold text-slate-500">In-page board for mission request, qualification, matching, assignment, SLA, and escalation flow.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{selectedMissionIds.length} selected</span></div>
      {lanes.length ? <div className="flex gap-3 overflow-x-auto pb-2">{lanes.map((lane) => <Lane key={lane.key} lane={lane} selectedMissionIds={selectedMissionIds} toggleMission={toggleMission} openMission={openMission} />)}</div> : <EmptyBlock title="No dispatch lanes loaded" text="Run the migration and add live missions. The board will not generate demo missions." />}
    </section>
  )
}

function Lane({ lane, selectedMissionIds, toggleMission, openMission }: { lane: DispatchLane; selectedMissionIds: string[]; toggleMission: (id: string) => void; openMission: (mission: DispatchMission) => void }) {
  return (
    <div className={`min-w-[205px] rounded-2xl p-2 ring-1 ${toneClass(lane.tone)}`}>
      <div className="mb-2 flex items-center justify-between px-1"><p className="text-xs font-black uppercase tracking-[.08em]">{lane.label}</p><span className="rounded-full bg-white px-2 py-0.5 text-xs font-black shadow-sm">{lane.count}</span></div>
      <div className="space-y-2">
        {lane.missions.slice(0, 8).map((mission) => <MissionCard key={mission.id} mission={mission} selected={selectedMissionIds.includes(mission.id)} toggle={() => toggleMission(mission.id)} open={() => openMission(mission)} />)}
        {!lane.missions.length ? <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 p-4 text-center text-xs font-bold text-slate-400">No live missions</div> : null}
        {lane.missions.length > 8 ? <button className="w-full rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm">+{lane.missions.length - 8} more</button> : null}
      </div>
    </div>
  )
}

function MissionCard({ mission, selected, toggle, open }: { mission: DispatchMission; selected: boolean; toggle: () => void; open: () => void }) {
  const readiness = mission.readiness_score ?? 0
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md">
      <div className="flex items-start justify-between gap-2"><button onClick={open} className="min-w-0 text-left"><p className="truncate text-sm font-black">{mission.mission_code || 'Mission'}</p><p className="truncate text-xs font-bold text-slate-500">{mission.service_type || 'Service not set'}</p></button><input aria-label="Select mission" type="checkbox" checked={selected} onChange={toggle} /></div>
      <p className="mt-2 truncate text-sm font-bold text-slate-700">{mission.client_name || mission.beneficiary_name || 'Client not assigned'}</p>
      <p className="truncate text-xs font-semibold text-slate-500">{[mission.city, mission.zone].filter(Boolean).join(' · ') || 'Location pending'}</p>
      <div className="mt-3 flex items-center justify-between gap-2 text-[11px] font-black"><span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{fmtTime(mission.scheduled_start)}</span><span className={readiness < 50 ? 'text-rose-600' : readiness < 80 ? 'text-amber-600' : 'text-emerald-600'}>{readiness || '—'}%</span></div>
    </article>
  )
}

function LiveOperationsMap({ sectors, missions, agents, openSector }: { sectors: DispatchSector[]; missions: DispatchMission[]; agents: DispatchAgent[]; openSector: (sector: DispatchSector) => void }) {
  const mapEl = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    let cancelled = false
    async function ensureLeaflet() {
      if (typeof window === 'undefined') return
      if (!document.querySelector('link[data-carelink-leaflet]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        link.setAttribute('data-carelink-leaflet', 'true')
        document.head.appendChild(link)
      }
      if (!window.L) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
          script.async = true
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Leaflet failed to load'))
          document.body.appendChild(script)
        })
      }
      if (cancelled || !mapEl.current || !window.L) return
      if (!mapRef.current) {
        mapRef.current = window.L.map(mapEl.current, { zoomControl: true }).setView([31.7917, -7.0926], 5)
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(mapRef.current)
      }
      mapRef.current.eachLayer((layer: any) => { if (layer?.options?.carelinkLayer) mapRef.current.removeLayer(layer) })
      const points: Array<{ lat: number; lng: number; label: string; count?: number; kind: string; sector?: DispatchSector }> = []
      sectors.forEach((s) => { if (typeof s.lat === 'number' && typeof s.lng === 'number') points.push({ lat: s.lat, lng: s.lng, label: `${s.city_name} · ${s.sector_name}`, count: s.active_missions_count || 0, kind: 'sector', sector: s }) })
      missions.forEach((m) => { if (typeof m.latitude === 'number' && typeof m.longitude === 'number') points.push({ lat: m.latitude, lng: m.longitude, label: `${m.mission_code} · ${m.service_type || 'Mission'}`, kind: 'mission' }) })
      agents.forEach((a) => { if (typeof a.latitude === 'number' && typeof a.longitude === 'number') points.push({ lat: a.latitude, lng: a.longitude, label: `${a.full_name} · ${a.status || 'Agent'}`, kind: 'agent' }) })
      points.forEach((p) => {
        const marker = window.L.circleMarker([p.lat, p.lng], { carelinkLayer: true, radius: p.kind === 'sector' ? 12 : 8, color: p.kind === 'agent' ? '#2563eb' : p.kind === 'mission' ? '#f97316' : '#10b981', fillOpacity: 0.72 })
        marker.bindPopup(p.label)
        if (p.sector) marker.on('click', () => openSector(p.sector as DispatchSector))
        marker.addTo(mapRef.current)
      })
      if (points.length) mapRef.current.fitBounds(points.map((p) => [p.lat, p.lng]), { padding: [30, 30], maxZoom: 12 })
    }
    ensureLeaflet().catch(() => {})
    return () => { cancelled = true }
  }, [sectors, missions, agents, openSector])

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><h2 className="font-black">Live Operations Map</h2><p className="text-xs font-bold text-slate-500">Free OpenStreetMap, synced only with live CareLink Ops sectors, missions, and agents.</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">Live map shell</span></div>
      <div className="relative h-[300px]"><div ref={mapEl} className="h-full w-full" />{!sectors.length && !missions.some((m) => typeof m.latitude === 'number') && !agents.some((a) => typeof a.latitude === 'number') ? <div className="absolute inset-4 grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/80 p-6 text-center backdrop-blur"><div><p className="font-black text-slate-700">No live map entities loaded</p><p className="mt-2 max-w-md text-sm font-semibold text-slate-500">Add city sectors, mission coordinates, or agent coordinates to CareLink Ops tables. This map will not invent static Moroccan zones.</p></div></div> : null}</div>
    </section>
  )
}

function CommunicationsPanel({ communications, log, openBroadcast }: { communications: DispatchMessage[]; log: string[]; openBroadcast: () => void }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-black">Communications</h2><button onClick={openBroadcast} className="text-xs font-black text-blue-700">Broadcast</button></div><div className="mt-3 space-y-2">{communications.slice(0, 6).map((m) => <div key={m.id} className="rounded-2xl border border-slate-100 p-3"><p className="text-sm font-black">{m.message_type || 'Message'} · {m.sender_name || 'Dispatch'}</p><p className="text-xs font-semibold text-slate-500">{m.body || 'No body'}</p></div>)}{!communications.length ? <EmptyBlock title="No communications" text="Mission notes, broadcasts, and dispatch messages will appear here from live data." /> : null}</div>{log.length ? <div className="mt-4 rounded-2xl bg-slate-50 p-3"><p className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Action log</p>{log.map((line, index) => <p key={`${line}-${index}`} className="mt-1 text-xs font-bold text-slate-600">{line}</p>)}</div> : null}</section>
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
