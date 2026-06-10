'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
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

const navItems = ['Overview', 'Dispatch', 'Missions', 'Agents', 'Schedule', 'Incidents', 'Reports', 'Compliance', 'Settings']

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

export function CareLinkOpsProductionDashboard({ initialPayload }: { initialPayload?: OpsDashboardPayload }) {
  // CARELINK_OPS_MAIN_SIDEBAR_NAV_FIX: make the left CareLink Ops sidebar real navigation on the overview page.
  useEffect(() => {
    const routes: Record<string, string> = {
      overview: '/carelink-ops',
      dispatch: '/carelink-ops/dispatch',
      missions: '/carelink-ops/missions',
      agents: '/carelink-ops/agents',
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
      const match = Object.entries(routes).find(([key]) => label === key || label.includes(key))
      if (!match) return

      const [, href] = match
      if (window.location.pathname === href) return

      event.preventDefault()
      event.stopPropagation()
      window.location.assign(href)
    }

    document.addEventListener('click', handleSidebarClick, true)
    return () => document.removeEventListener('click', handleSidebarClick, true)
  }, [])

  const [payload, setPayload] = useState<OpsDashboardPayload>(() => normalizePayload(initialPayload))
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState('')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const [logs, setLogs] = useState<string[]>([])
  const [expandedFlow, setExpandedFlow] = useState(false)
  const [mapMode, setMapMode] = useState<'cities' | 'zones'>('cities')
  const [selectedCity, setSelectedCity] = useState('')
  const [dayOffset, setDayOffset] = useState(0)

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString('fr-FR'))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/carelink/ops/dashboard', { cache: 'no-store' })
      const json = await res.json()
      setPayload(normalizePayload(json))
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

  const visiblePayload = useMemo(() => normalizePayload(payload), [payload])

  const filteredMissions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return visiblePayload.lanes
      .flatMap((lane) => lane.items.map((item) => ({ ...item, lane: lane.label })))
      .filter((item) => [item.code, item.clientLabel, item.city, item.zone, item.serviceType, item.assignedAgent]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q))
      .slice(0, 8)
  }, [visiblePayload.lanes, query])

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <div className="grid min-h-screen grid-cols-[236px_1fr]">
        <aside className="sticky top-0 h-screen border-r border-slate-200 bg-white px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 text-sm font-black text-white shadow-lg shadow-sky-200">AC</div>
            <div>
              <p className="text-lg font-black tracking-tight">AngelCare</p>
              <p className="text-xs font-bold text-slate-500">CareLink Ops</p>
            </div>
          </div>
          <nav className="mt-8 space-y-1">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => runAction(`open_${item.toLowerCase()}`)}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition ${item === 'Overview' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <span>{item}</span>
                {item === 'Incidents' && visiblePayload.incidents.length ? <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white">{visiblePayload.incidents.length}</span> : null}
              </button>
            ))}
          </nav>
          <div className="absolute bottom-5 left-4 right-4 space-y-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Live system status</p>
              <StatusDot label="Platform" helper="Application shell operational" />
              <StatusDot label="Ops API" helper={visiblePayload.source === 'live-empty' ? 'Waiting for live DB data' : 'Live data connected'} />
              <button onClick={() => setModal({ type: 'command', title: 'System status', detail: 'Review API connectivity, map services, dispatch feed, report validation queue, and compliance synchronization.' })} className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-black hover:bg-slate-50">View status</button>
            </div>
          </div>
        </aside>

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
                <button onClick={() => setModal({ type: 'command', title: 'CareLink Ops Lead', detail: 'User profile, permissions, dispatch authority, and operational accountability panel.' })} className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm"><span className="grid h-8 w-8 place-items-center rounded-full bg-sky-500 text-xs font-black text-white">AC</span><span className="text-left text-xs font-black leading-tight">AngelCare Ops<br /><span className="text-slate-500">Operations Lead</span></span></button>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-3 text-xs font-bold text-slate-500">
              <span suppressHydrationWarning>Last updated: {lastUpdated || '—'}</span>
              <button onClick={load} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-black text-slate-700 hover:bg-slate-50">{loading ? 'Refreshing…' : 'Refresh'}</button>
            </div>
            {query ? <SearchResults items={filteredMissions} open={(item) => setModal({ type: 'mission', item })} /> : null}
          </header>

          <div className="space-y-5 px-8 py-6">
            <section className="grid grid-cols-8 gap-4">
              {visiblePayload.kpis.map((kpi) => <KpiCard key={kpi.key} item={kpi} open={() => setModal({ type: 'kpi', item: kpi })} />)}
            </section>

            <section className="grid grid-cols-[0.76fr_1.44fr] gap-5">
              <OperationsMap cities={visiblePayload.cities} zones={visiblePayload.zones} mode={mapMode} setMode={setMapMode} selectedCity={selectedCity} setSelectedCity={setSelectedCity} open={(item) => setModal({ type: 'zone', item })} />
              <DispatchFlow lanes={visiblePayload.lanes} expanded={expandedFlow} setExpanded={setExpandedFlow} openMission={(item) => setModal({ type: 'mission', item })} openAll={() => setModal({ type: 'command', title: 'Mission operations board', detail: 'Open the complete mission operations board with SLA filters, city filters, agent assignment, batch escalation, lifecycle transitions, and export controls.' })} />
            </section>

            <section className="grid grid-cols-[1fr_1.25fr_0.85fr] gap-5">
              <AgentReadinessPanel agents={visiblePayload.agents} open={(item) => setModal({ type: 'agent', item })} />
              <ScheduleCoveragePanel coverage={visiblePayload.coverage} dayOffset={dayOffset} setDayOffset={setDayOffset} open={(item) => setModal({ type: 'coverage', item })} />
              <IncidentsPanel incidents={visiblePayload.incidents} open={(item) => setModal({ type: 'incident', item })} />
            </section>

            <section className="grid grid-cols-[1.55fr_0.65fr] gap-5 pb-10">
              <ReportsPanel reports={visiblePayload.reports} open={(item) => setModal({ type: 'report', item })} />
              <FollowUpPanel followUps={visiblePayload.followUps} open={(title, detail) => setModal({ type: 'command', title, detail })} />
            </section>
          </div>
        </section>
      </div>

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

function OperationsMap({ cities, zones, mode, setMode, selectedCity, setSelectedCity, open }: { cities: CareLinkCity[]; zones: CareLinkZone[]; mode: 'cities' | 'zones'; setMode: (mode: 'cities' | 'zones') => void; selectedCity: string; setSelectedCity: (id: string) => void; open: (item: CareLinkCity | CareLinkZone) => void }) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const frameRef = useRef<HTMLIFrameElement | null>(null)
  const safeCities = asArray<CareLinkCity>(cities)
  const safeZones = asArray<CareLinkZone>(zones)
  const selected = safeCities.find((city) => city.id === selectedCity) || safeCities[0]
  const visibleZones = mode === 'zones' && selected ? safeZones.filter((zone) => zone.cityId === selected.id) : []
  const markers = mode === 'cities' ? safeCities : visibleZones

  useEffect(() => {
    if (!selectedCity && safeCities[0]?.id) setSelectedCity(safeCities[0].id)
  }, [selectedCity, safeCities, setSelectedCity])

  return <Panel title="Morocco Operations Map" subtitle="Free OpenStreetMap view. Markers appear only from live operations data.">
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <button onClick={() => setMode('cities')} className={`rounded-2xl px-4 py-2 text-sm font-black ${mode === 'cities' ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white'}`}>Cities</button>
      <button onClick={() => setMode('zones')} className={`rounded-2xl px-4 py-2 text-sm font-black ${mode === 'zones' ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white'}`}>Zones by city</button>
      <select value={selected?.id || ''} onChange={(event) => setSelectedCity(event.target.value)} className="ml-auto rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold">
        <option value="">No city selected</option>
        {safeCities.map((city) => <option key={city.id} value={city.id}>{city.name} · {city.region}</option>)}
      </select>
    </div>
    <div ref={mapRef} className="relative h-[324px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
      <iframe ref={frameRef} title="OpenStreetMap Morocco" src="https://www.openstreetmap.org/export/embed.html?bbox=-13.5%2C27.2%2C-0.8%2C36.1&layer=mapnik" className="h-full w-full border-0" />
      {!markers.length ? <div className="pointer-events-none absolute inset-0 grid place-items-center bg-white/50 backdrop-blur-[1px]"><div className="rounded-3xl border border-dashed border-slate-300 bg-white/90 p-5 text-center shadow-sm"><p className="text-sm font-black text-slate-800">No live map markers yet</p><p className="mt-1 max-w-xs text-xs text-slate-500">Connect CareLink Ops city, zone, mission, and agent feeds to render live Moroccan operational coverage.</p></div></div> : null}
      {markers.map((marker, index) => <button key={marker.id} onClick={() => open(marker as any)} style={{ left: `${18 + (index * 17) % 62}%`, top: `${22 + (index * 19) % 48}%` }} className="absolute z-10 rounded-2xl border border-white bg-white px-3 py-2 text-xs font-black text-slate-900 shadow-lg"><span className="text-blue-600">{marker.name}</span><br /><span className="font-bold text-slate-500">{marker.missions} missions · {marker.agents} agents</span></button>)}
    </div>
    <div className="grid grid-cols-4 gap-2 border-t border-slate-100 pt-3 text-xs font-bold text-slate-600"><Legend color="bg-blue-500" label="Low load" /><Legend color="bg-emerald-500" label="Normal" /><Legend color="bg-amber-500" label="Gap" /><Legend color="bg-rose-500" label="At risk" /></div>
  </Panel>
}

function Legend({ color, label }: { color: string; label: string }) { return <span className="flex items-center gap-2"><i className={`h-2.5 w-2.5 rounded-full ${color}`} />{label}</span> }

function DispatchFlow({ lanes, expanded, setExpanded, openMission, openAll }: { lanes: CareLinkLane[]; expanded: boolean; setExpanded: (value: boolean) => void; openMission: (item: CareLinkMission & { lane: string }) => void; openAll: () => void }) {
  const safeLanes = asArray<CareLinkLane>(lanes)
  return <Panel title="Dispatch Control — Mission Flow" subtitle="Expandable enterprise flow lanes with SLA, risk, and readiness indicators." action={<div className="flex gap-2"><button onClick={() => setExpanded(!expanded)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black">{expanded ? 'Retract lanes' : 'Expand lanes'}</button><button onClick={openAll} className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-black text-white">View all missions →</button></div>}>
    <div className={`grid gap-3 overflow-x-auto ${expanded ? 'max-h-[660px]' : 'max-h-[360px]'} grid-flow-col auto-cols-[156px] pr-2 transition-all`}>
      {safeLanes.map((lane) => <div key={lane.key} className={`rounded-3xl border p-3 ${toneClasses[lane.tone] || toneClasses.slate}`}><div className="flex items-center justify-between"><p className="text-xs font-black">{lane.label}</p><span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-black">{lane.count}</span></div><div className="mt-3 space-y-2">{lane.items.slice(0, expanded ? lane.items.length : 2).map((mission) => <button key={mission.id} onClick={() => openMission({ ...mission, lane: lane.label })} className="w-full rounded-2xl border border-white/80 bg-white p-3 text-left text-xs shadow-sm"><div className="flex justify-between gap-2"><b className="truncate text-slate-950">{mission.code}</b><span>{mission.scheduledStart || '—'}</span></div><p className="mt-1 line-clamp-2 font-black text-slate-800">{mission.clientLabel}</p><p className="mt-1 line-clamp-2 text-slate-600">{mission.city}{mission.zone ? ` · ${mission.zone}` : ''} · {mission.serviceType}</p><p className="mt-2 text-[10px] font-black text-blue-700">Ready {mission.readinessScore ?? 0}%</p></button>)}{!lane.items.length ? <EmptyMini label="No live items" /> : null}{lane.items.length > 2 && !expanded ? <button onClick={() => setExpanded(true)} className="text-sm font-black text-slate-700">+{lane.items.length - 2} more</button> : null}</div></div>)}
    </div>
  </Panel>
}

function AgentReadinessPanel({ agents, open }: { agents: CareLinkAgent[]; open: (item: CareLinkAgent) => void }) { return <Panel title="Agent Readiness" subtitle="Live readiness and compliance.">{asArray<CareLinkAgent>(agents).length ? asArray<CareLinkAgent>(agents).map((agent) => <button key={agent.id} onClick={() => open(agent)} className="mb-2 grid w-full grid-cols-[1fr_70px_90px] items-center gap-3 rounded-2xl border border-slate-100 p-3 text-left hover:bg-slate-50"><div><p className="font-black">{agent.fullName}</p><p className="text-xs text-slate-500">{agent.city} · {agent.skills.join(', ')}</p></div><b>{agent.readinessScore}%</b><span className="rounded-full bg-emerald-50 px-2 py-1 text-center text-xs font-black text-emerald-700">{agent.status}</span></button>) : <EmptyState title="No live agents" detail="Connect the field-agent repository to show readiness, skills, zones, and compliance." />}</Panel> }

function ScheduleCoveragePanel({ coverage, dayOffset, setDayOffset, open }: { coverage: CareLinkCoverageRow[]; dayOffset: number; setDayOffset: (value: number) => void; open: (item: CareLinkCoverageRow) => void }) { return <Panel title="Schedule & Coverage" subtitle="Daily capacity timeline from live mission and agent availability data." action={<div className="flex gap-2"><button onClick={() => setDayOffset(dayOffset - 1)} className="rounded-xl border px-3 py-1.5 text-sm font-black">‹ Previous</button><button onClick={() => setDayOffset(0)} className="rounded-xl bg-slate-950 px-3 py-1.5 text-sm font-black text-white">Today</button><button onClick={() => setDayOffset(dayOffset + 1)} className="rounded-xl border px-3 py-1.5 text-sm font-black">Next ›</button></div>}>{asArray<CareLinkCoverageRow>(coverage).length ? asArray<CareLinkCoverageRow>(coverage).map((row) => <button key={row.id} onClick={() => open(row)} className="mb-2 grid w-full grid-cols-[150px_1fr] gap-3 rounded-2xl border border-slate-100 p-3 text-left"><div><p className="font-black">{row.label}</p><p className="text-xs text-slate-500">{row.city} · {row.load}</p></div><div className="grid grid-cols-10 gap-1">{row.blocks.map((block, i) => <span key={i} className={`h-5 rounded ${block === 'gap' ? 'bg-amber-200' : block === 'risk' ? 'bg-rose-200' : block === 'progress' ? 'bg-blue-200' : block === 'done' ? 'bg-slate-200' : block === 'booked' ? 'bg-emerald-200' : 'bg-slate-100'}`} />)}</div></button>) : <EmptyState title="No coverage loaded" detail="Connect schedule blocks and availability rules to display daily coverage, gaps, and risks." />}</Panel> }

function IncidentsPanel({ incidents, open }: { incidents: CareLinkIncident[]; open: (item: CareLinkIncident) => void }) { return <Panel title="Incidents & Alerts" subtitle="Escalations and SLA-sensitive field alerts.">{asArray<CareLinkIncident>(incidents).length ? asArray<CareLinkIncident>(incidents).map((incident) => <button key={incident.id} onClick={() => open(incident)} className="mb-2 w-full rounded-2xl border border-slate-100 p-3 text-left hover:bg-slate-50"><p className="font-black">{incident.title}</p><p className="text-xs text-slate-500">{incident.detail}</p></button>) : <EmptyState title="No incidents" detail="Incident feed is empty. Live alerts will appear here when connected." />}</Panel> }

function ReportsPanel({ reports, open }: { reports: CareLinkReport[]; open: (item: CareLinkReport) => void }) { return <Panel title="Reports Validation Queue" subtitle="Mission reports requiring review, correction, validation, and finance handoff.">{asArray<CareLinkReport>(reports).length ? asArray<CareLinkReport>(reports).map((report) => <button key={report.id} onClick={() => open(report)} className="mb-2 grid w-full grid-cols-[120px_1fr_120px_120px] rounded-2xl border border-slate-100 p-3 text-left hover:bg-slate-50"><b>{report.missionCode}</b><span>{report.clientLabel} · {report.agentLabel}</span><span>{report.reportType}</span><span className="font-black text-blue-700">{report.status}</span></button>) : <EmptyState title="No reports pending" detail="Validation queue is empty until live mission reports are connected." />}</Panel> }

function FollowUpPanel({ followUps, open }: { followUps: any[]; open: (title: string, detail: string) => void }) { return <Panel title="Operational Follow-up" subtitle="Tasks and follow-up actions.">{asArray<any>(followUps).length ? asArray<any>(followUps).map((item) => <button key={item.id} onClick={() => open(item.title, item.helper)} className="mb-2 flex w-full justify-between rounded-2xl border border-slate-100 p-3 text-left"><b>{item.title}</b><span>{item.value}</span></button>) : <EmptyState title="No follow-ups" detail="Operational follow-ups will appear when connected to live tasks." />}</Panel> }

function Panel({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) { return <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-start justify-between gap-4"><div><h2 className="text-lg font-black tracking-tight">{title}</h2>{subtitle ? <p className="text-xs font-bold text-slate-500">{subtitle}</p> : null}</div>{action}</div>{children}</section> }
function EmptyMini({ label }: { label: string }) { return <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-3 text-center text-xs font-black text-slate-400">{label}</div> }
function EmptyState({ title, detail }: { title: string; detail: string }) { return <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center"><p className="font-black text-slate-800">{title}</p><p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">{detail}</p></div> }

function SearchResults({ items, open }: { items: Array<CareLinkMission & { lane?: string }>; open: (item: CareLinkMission & { lane?: string }) => void }) { return <div className="absolute right-8 top-[118px] z-50 w-[520px] rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl">{items.length ? items.map((item) => <button key={item.id} onClick={() => open(item)} className="block w-full rounded-2xl p-3 text-left hover:bg-slate-50"><b>{item.code}</b><p className="text-sm text-slate-500">{item.clientLabel} · {item.city} · {item.lane}</p></button>) : <EmptyMini label="No matching live mission" />}</div> }

function EnterpriseModal({ modal, close, runAction }: { modal: ModalState; close: () => void; runAction: (action: string, entityId?: string) => void }) {
  if (modal.type === 'none') return null
  const title = modal.type === 'command' ? modal.title : modal.type === 'kpi' ? modal.item.label : modal.type === 'mission' ? modal.item.code : modal.type === 'agent' ? modal.item.fullName : modal.type === 'incident' ? modal.item.title : modal.type === 'report' ? modal.item.missionCode : modal.type === 'coverage' ? modal.item.label : modal.item.name
  const detail = modal.type === 'command' ? modal.detail : 'Enterprise workflow detail. This modal is live-data safe and contains no fake operational references.'
  const entityId = modal.type !== 'command' && 'id' in modal.item ? String(modal.item.id) : undefined
  return <div className="fixed inset-0 z-[9999] grid place-items-center bg-slate-950/45 p-6 backdrop-blur-sm"><div className="max-h-[88vh] w-full max-w-5xl overflow-auto rounded-[2rem] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between border-b border-slate-100 pb-4"><div><p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">CareLink Ops Enterprise Workflow</p><h3 className="mt-2 text-2xl font-black">{title}</h3><p className="mt-1 text-sm text-slate-500">{detail}</p></div><button onClick={close} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 font-black">×</button></div><div className="mt-5 grid grid-cols-3 gap-4"><InfoBox label="Lifecycle" value="Live workflow required" /><InfoBox label="Readiness" value="Calculated from real data" /><InfoBox label="Audit" value="No fake records written" /></div><div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5"><p className="font-black">Production note</p><p className="mt-2 text-sm leading-6 text-slate-600">This clean rebuild intentionally shows empty states unless your backend returns real missions, agents, incidents, reports, coverage rows, cities, and zones. No static mission references, seeded families, or fake agents are included.</p></div><div className="mt-6 grid grid-cols-4 gap-3"><button onClick={() => runAction('open_board', entityId)} className="rounded-2xl bg-slate-950 px-4 py-3 font-black text-white">Open board</button><button onClick={() => runAction('assign_owner', entityId)} className="rounded-2xl border border-slate-200 px-4 py-3 font-black">Assign owner</button><button onClick={() => runAction('escalate', entityId)} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 font-black text-amber-800">Escalate</button><button onClick={() => runAction('validate', entityId)} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-black text-emerald-800">Validate</button></div></div></div>
}
function InfoBox({ label, value }: { label: string; value: string }) { return <div className="rounded-3xl border border-slate-200 p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p><p className="mt-2 font-black text-slate-800">{value}</p></div> }
function ActionLog({ logs }: { logs: string[] }) { return logs.length ? <div className="fixed bottom-5 right-5 z-[9998] w-80 space-y-2">{logs.map((log, index) => <div key={`${log}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-3 text-sm font-bold shadow-xl">{log}</div>)}</div> : null }

export default CareLinkOpsProductionDashboard
