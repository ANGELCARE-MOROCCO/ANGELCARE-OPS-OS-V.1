'use client'

import Link from 'next/link'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { DispatchAgent, DispatchAuditEvent, DispatchIncident, DispatchMessage, DispatchMission, DispatchPayload, DispatchSector } from '@/lib/carelink/ops-dispatch-types'
import { DISPATCH_WORKSPACE_NAV, emptyPayloadFallback, type DispatchWorkspaceView, type WorkspaceActionName } from '@/lib/carelink/ops-dispatch-workspace'

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

type ModalState =
  | { type: 'none' }
  | { type: 'mission'; mode: 'create' | 'edit'; item?: DispatchMission }
  | { type: 'agent'; mode: 'create' | 'edit'; item?: DispatchAgent }
  | { type: 'sector'; mode: 'create' | 'edit'; item?: DispatchSector }
  | { type: 'incident'; mode: 'create' | 'edit'; item?: DispatchIncident }
  | { type: 'message'; mode: 'create' | 'broadcast'; item?: DispatchMessage }
  | { type: 'schedule'; mode: 'create' | 'edit'; item?: any }
  | { type: 'detail'; entity: 'mission' | 'agent' | 'incident' | 'sector' | 'message' | 'audit'; item: any }
  | { type: 'confirm'; title: string; body: string; action: WorkspaceActionName; entityId?: string; missionId?: string; agentId?: string; payload?: Record<string, unknown> }

const viewTitles: Record<DispatchWorkspaceView, { title: string; subtitle: string; badge: string }> = {
  'dispatch-board': { title: 'Dispatch Board', subtitle: 'Control mission queues, assignment lanes, and operational dispatch actions.', badge: 'Mission Distribution' },
  'live-map': { title: 'Live Map', subtitle: 'Monitor Moroccan city sectors, agent coverage, open missions, load and geospatial readiness.', badge: 'Geospatial Control' },
  'matching-engine': { title: 'Matching Engine', subtitle: 'Review eligibility, skills, availability, distance and readiness before assignment.', badge: 'Assignment Intelligence' },
  'agent-pool': { title: 'Agent Pool', subtitle: 'Manage caregivers, childcare specialists, field agent capacity, skills and compliance.', badge: 'Workforce Operations' },
  schedule: { title: 'Schedule', subtitle: 'Plan mission slots, coverage, availability blocks, conflict risks and daily capacity.', badge: 'Planning & Capacity' },
  'sla-escalations': { title: 'SLA & Escalations', subtitle: 'Track SLA breaches, incident severity, escalation owners and resolution workflows.', badge: 'Risk Control' },
  communications: { title: 'Communications', subtitle: 'Coordinate dispatch messages, broadcasts, notes, client updates and handoff logs.', badge: 'Liaison Center' },
  'audit-trail': { title: 'Audit Trail', subtitle: 'Review every operational action, CRUD movement, escalation and assignment decision.', badge: 'Governance' },
}

function cx(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(' ')
}

function fmt(value?: string | null) {
  if (!value) return '—'
  return value.replace('T', ' ').replace(/\.\d{3}Z$/, 'Z')
}

function statusText(value?: string | null) {
  return String(value || 'pending').replaceAll('_', ' ')
}

function initials(name?: string | null) {
  const parts = String(name || 'AC').trim().split(/\s+/).filter(Boolean)
  return `${parts[0]?.[0] || 'A'}${parts[1]?.[0] || 'C'}`.toUpperCase()
}

function tone(t?: string | null) {
  const key = String(t || '').toLowerCase()
  if (['critical', 'high', 'at_risk', 'escalation', 'red'].includes(key)) return 'border-rose-200 bg-rose-50 text-rose-700'
  if (['medium', 'warning', 'amber', 'orange'].includes(key)) return 'border-amber-200 bg-amber-50 text-amber-700'
  if (['ready', 'available', 'low', 'green', 'completed', 'closed'].includes(key)) return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (['en_route', 'blue', 'assigned'].includes(key)) return 'border-blue-200 bg-blue-50 text-blue-700'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

export function CareLinkDispatchWorkspacePage({ view, initialPayload }: { view: DispatchWorkspaceView; initialPayload?: DispatchPayload }) {
  const [payload, setPayload] = useState<DispatchPayload>(() => emptyPayloadFallback(initialPayload))
  const [query, setQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')

  const data = useMemo(() => emptyPayloadFallback(payload), [payload])
  const title = viewTitles[view]

  const missions = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.missions.filter((mission) => {
      const searchable = [mission.mission_code, mission.service_type, mission.client_name, mission.beneficiary_name, mission.city, mission.zone, mission.assigned_agent_name].filter(Boolean).join(' ').toLowerCase()
      return (!q || searchable.includes(q)) && (!selectedCity || mission.city === selectedCity) && (!selectedStatus || mission.status === selectedStatus)
    })
  }, [data.missions, query, selectedCity, selectedStatus])

  const cities = useMemo(() => Array.from(new Set([...data.missions.map((m) => m.city || ''), ...data.sectors.map((s) => s.city_name || '')].filter(Boolean))).sort(), [data.missions, data.sectors])
  const statuses = useMemo(() => Array.from(new Set(data.missions.map((m) => String(m.status || '')).filter(Boolean))).sort(), [data.missions])

  const refresh = useCallback(async () => {
    setBusy(true)
    try {
      const endpoint = view === 'dispatch-board' ? '/api/carelink/ops/dispatch' : `/api/carelink/ops/dispatch/${view}`
      const res = await fetch(endpoint, { headers: { Accept: 'application/json' }, cache: 'no-store' })
      const type = res.headers.get('content-type') || ''
      if (!type.includes('application/json')) throw new Error(`API returned non-JSON for ${endpoint}`)
      const json = await res.json()
      setPayload(emptyPayloadFallback(json))
      setToast('Workspace refreshed from live API.')
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Refresh failed.')
    } finally {
      setBusy(false)
    }
  }, [view])

  const runAction = useCallback(async (body: Record<string, unknown>) => {
    setBusy(true)
    try {
      const res = await fetch('/api/carelink/ops/dispatch/workspace-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      })
      const type = res.headers.get('content-type') || ''
      if (!type.includes('application/json')) throw new Error('Action API returned non-JSON response.')
      const json = await res.json()
      if (!res.ok || json?.ok === false) throw new Error(json?.error || json?.message || 'Action failed.')
      setToast(json.message || 'Action completed.')
      setModal({ type: 'none' })
      await refresh()
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Action failed.')
    } finally {
      setBusy(false)
    }
  }, [refresh])

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="grid min-h-screen grid-cols-[240px_1fr]">
        <CareLinkOpsSidebar />
        <section className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex items-start justify-between gap-5 px-8 py-5">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-600">{title.badge}</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight">DISPATCH CONTROL CENTER</h1>
                <p className="mt-1 text-sm font-semibold text-slate-500">{title.subtitle}</p>
              </div>
              <div className="flex min-w-[520px] items-center gap-3">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search missions, agents, clients, zones..." className="h-11 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100" />
                <button onClick={refresh} disabled={busy} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60">{busy ? 'Syncing…' : 'Refresh'}</button>
              </div>
            </div>
            <nav className="flex gap-2 overflow-x-auto border-t border-slate-100 px-8 pt-2">
              {DISPATCH_WORKSPACE_NAV.map((item) => (
                <Link key={item.key} href={item.href} className={cx('whitespace-nowrap border-b-4 px-4 py-3 text-sm font-black transition', item.key === view ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-600 hover:text-slate-950')}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-8 py-3">
              <button onClick={() => setModal({ type: 'mission', mode: 'create' })} className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-blue-700">+ Create Mission</button>
              <button onClick={() => setModal({ type: 'message', mode: 'broadcast' })} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black hover:bg-slate-50">Broadcast</button>
              <button onClick={() => setModal({ type: 'agent', mode: 'create' })} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black hover:bg-slate-50">Add Agent</button>
              <button onClick={() => setModal({ type: 'sector', mode: 'create' })} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black hover:bg-slate-50">Add Sector</button>
              <button onClick={() => setModal({ type: 'incident', mode: 'create' })} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-black text-rose-700 hover:bg-rose-100">Create Escalation</button>
              <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold"><option value="">All cities</option>{cities.map((city) => <option key={city} value={city}>{city}</option>)}</select>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold"><option value="">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{statusText(status)}</option>)}</select>
            </div>
          </header>

          <div className="space-y-5 p-8">
            <StatusBanner payload={data} />
            {view === 'dispatch-board' && <DispatchBoard data={data} missions={missions} open={(mission) => setModal({ type: 'detail', entity: 'mission', item: mission })} runAction={runAction} />}
            {view === 'live-map' && <LiveMapPage data={data} openSector={(sector) => setModal({ type: 'detail', entity: 'sector', item: sector })} openMission={(mission) => setModal({ type: 'detail', entity: 'mission', item: mission })} />}
            {view === 'matching-engine' && <MatchingEnginePage data={data} missions={missions} openMission={(mission) => setModal({ type: 'detail', entity: 'mission', item: mission })} runAction={runAction} />}
            {view === 'agent-pool' && <AgentPoolPage data={data} open={(agent) => setModal({ type: 'detail', entity: 'agent', item: agent })} edit={(agent) => setModal({ type: 'agent', mode: 'edit', item: agent })} runAction={runAction} />}
            {view === 'schedule' && <SchedulePage data={data} openMission={(mission) => setModal({ type: 'detail', entity: 'mission', item: mission })} create={() => setModal({ type: 'schedule', mode: 'create' })} />}
            {view === 'sla-escalations' && <SlaEscalationsPage data={data} open={(incident) => setModal({ type: 'detail', entity: 'incident', item: incident })} edit={(incident) => setModal({ type: 'incident', mode: 'edit', item: incident })} runAction={runAction} />}
            {view === 'communications' && <CommunicationsPage data={data} open={(message) => setModal({ type: 'detail', entity: 'message', item: message })} create={() => setModal({ type: 'message', mode: 'create' })} runAction={runAction} />}
            {view === 'audit-trail' && <AuditTrailPage data={data} open={(event) => setModal({ type: 'detail', entity: 'audit', item: event })} />}
          </div>
        </section>
      </div>
      {toast ? <div className="fixed bottom-5 right-5 z-[90] max-w-md rounded-3xl border border-slate-200 bg-white p-4 text-sm font-black shadow-2xl">{toast}<button onClick={() => setToast('')} className="ml-4 text-blue-600">Dismiss</button></div> : null}
      <WorkspaceModal modal={modal} setModal={setModal} runAction={runAction} busy={busy} />
    </main>
  )
}

function CareLinkOpsSidebar() {
  return (
    <aside className="sticky top-0 h-screen border-r border-slate-200 bg-white p-5">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 font-black text-white">AC</div>
        <div><p className="font-black">AngelCare</p><p className="text-xs font-bold text-slate-500">CareLink Ops</p></div>
      </div>
      <nav className="space-y-1">
        {CARELINK_OPS_SIDE_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cx('flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-black transition', item.href === '/carelink-ops/dispatch' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-50')}
          >
            <span>{item.label}</span>
            {item.label === 'Incidents' ? <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white">!</span> : null}
          </Link>
        ))}
      </nav>
      <div className="absolute bottom-5 left-5 right-5 rounded-3xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-widest text-slate-500">Live System</p><p className="mt-2 text-sm font-bold text-slate-700">Production data only</p><p className="mt-1 text-xs text-slate-500">No demo, seed, or static operational records.</p></div>
    </aside>
  )
}

function StatusBanner({ payload }: { payload: DispatchPayload }) {
  const empty = !payload.missions.length && !payload.agents.length && !payload.sectors.length
  return <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-blue-600">Live Data Readiness</p><h2 className="mt-1 text-xl font-black">{empty ? 'Awaiting live CareLink Ops records' : 'Live dispatch data connected'}</h2><p className="mt-1 text-sm font-semibold text-slate-500">Source: {payload.source}. {payload.metadata.warnings[0] || 'All loaded values come from API/database payloads.'}</p></div><div className="grid grid-cols-4 gap-3 text-center"><Metric label="Missions" value={payload.missions.length} /><Metric label="Agents" value={payload.agents.length} /><Metric label="Sectors" value={payload.sectors.length} /><Metric label="Incidents" value={payload.incidents.length} /></div></div></section>
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3"><p className="text-2xl font-black">{value}</p><p className="text-xs font-bold text-slate-500">{label}</p></div> }

function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) { return <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center"><h3 className="text-lg font-black text-slate-700">{title}</h3><p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-500">{body}</p>{action ? <div className="mt-5">{action}</div> : null}</div> }

function DispatchBoard({ data, missions, open, runAction }: { data: DispatchPayload; missions: DispatchMission[]; open: (m: DispatchMission) => void; runAction: (body: Record<string, unknown>) => Promise<void> }) {
  if (!missions.length) return <EmptyState title="No dispatch missions loaded" body="Create or import real mission requests to activate dispatch lanes. The board will not fabricate operations data." />
  const lanes = data.lanes.map((lane) => ({ ...lane, missions: missions.filter((mission) => mission.status === lane.key) }))
  return <section className="grid gap-5"><div className="grid grid-cols-6 gap-4">{data.kpis.map((kpi) => <Metric key={kpi.key} label={kpi.label} value={kpi.value} />)}</div><div className="overflow-x-auto rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm"><div className="flex min-w-max gap-3">{lanes.map((lane) => <div key={lane.key} className="w-72 rounded-3xl border border-slate-200 bg-slate-50 p-3"><div className="mb-3 flex items-center justify-between"><p className="font-black">{lane.label}</p><span className="rounded-full bg-white px-2 py-1 text-xs font-black">{lane.missions.length}</span></div><div className="space-y-3">{lane.missions.map((mission) => <MissionCard key={mission.id} mission={mission} open={open} runAction={runAction} />)}</div></div>)}</div></div></section>
}

function MissionCard({ mission, open, runAction }: { mission: DispatchMission; open: (m: DispatchMission) => void; runAction: (body: Record<string, unknown>) => Promise<void> }) { return <button onClick={() => open(mission)} className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-blue-200 hover:shadow-md"><div className="flex justify-between gap-3"><p className="font-black">{mission.mission_code || 'Mission'}</p><span className={cx('rounded-full border px-2 py-1 text-[10px] font-black uppercase', tone(mission.priority || mission.risk_level))}>{mission.priority || 'normal'}</span></div><p className="mt-1 text-sm font-bold text-slate-600">{mission.service_type || 'Service not set'}</p><p className="mt-2 text-xs font-semibold text-slate-500">{[mission.city, mission.zone].filter(Boolean).join(' · ') || 'Location pending'}</p><div className="mt-3 flex items-center justify-between"><span className="text-xs font-bold text-slate-500">Ready {mission.readiness_score ?? 0}%</span><span className="text-xs font-black text-blue-600">{fmt(mission.scheduled_start)}</span></div><div className="mt-3 flex gap-2"><span onClick={(e) => { e.stopPropagation(); void runAction({ action: 'set_status', missionId: mission.id, payload: { status: 'ready_for_dispatch' } }) }} className="rounded-xl bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700">Advance</span><span onClick={(e) => { e.stopPropagation(); void runAction({ action: 'escalate_mission', missionId: mission.id, payload: { blockers: ['Dispatcher escalation requested'] } }) }} className="rounded-xl bg-rose-50 px-2 py-1 text-[10px] font-black text-rose-700">Escalate</span></div></button> }

function LiveMapPage({ data, openSector, openMission }: { data: DispatchPayload; openSector: (s: DispatchSector) => void; openMission: (m: DispatchMission) => void }) {
  return <div className="grid grid-cols-[1.45fr_.85fr] gap-5"><section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="text-xl font-black">Morocco Live Dispatch Map</h2><p className="text-sm font-semibold text-slate-500">Free OpenStreetMap viewport. Markers appear only from real sector and mission coordinates.</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{data.sectors.length} sectors</span></div><div className="relative h-[560px] bg-slate-100"><iframe title="Morocco operations map" src="https://www.openstreetmap.org/export/embed.html?bbox=-10.9,27.5,-0.8,36.5&layer=mapnik" className="h-full w-full border-0" loading="lazy" /><div className="absolute left-4 top-4 rounded-2xl border border-white/80 bg-white/90 p-3 shadow-lg"><p className="text-xs font-black uppercase tracking-widest text-slate-500">Live overlays</p><p className="mt-1 text-sm font-black">{data.missions.filter((m) => m.latitude && m.longitude).length} mission coordinates</p><p className="text-sm font-black">{data.agents.filter((a) => a.latitude && a.longitude).length} agent coordinates</p></div></div></section><section className="space-y-4"><Panel title="City / Sector Registry" subtitle="CRUD-ready live sectors and zones.">{data.sectors.length ? data.sectors.map((s) => <RowButton key={s.id} title={`${s.city_name} · ${s.sector_name}`} body={`${s.region || 'Region pending'} · ${s.active_missions_count || 0} missions · ${s.open_agents_count || 0} agents`} onClick={() => openSector(s)} />) : <EmptyState title="No sectors loaded" body="Add real Moroccan city sectors using Add Sector. No static city markers are displayed." />}</Panel><Panel title="Geocoded Missions" subtitle="Click a live mission coordinate for details.">{data.missions.filter((m) => m.latitude && m.longitude).map((m) => <RowButton key={m.id} title={m.mission_code || m.id} body={`${m.city || 'City'} · ${m.zone || 'Zone'} · ${m.service_type || 'Service'}`} onClick={() => openMission(m)} />)}</Panel></section></div>
}

function MatchingEnginePage({ data, missions, openMission, runAction }: { data: DispatchPayload; missions: DispatchMission[]; openMission: (m: DispatchMission) => void; runAction: (body: Record<string, unknown>) => Promise<void> }) {
  const unassigned = missions.filter((m) => !m.assigned_agent_id)
  return <div className="grid grid-cols-[1fr_1fr] gap-5"><Panel title="Mission Matching Queue" subtitle="Unassigned demand waiting for eligibility decisions.">{unassigned.length ? unassigned.map((m) => <RowButton key={m.id} title={m.mission_code || m.id} body={`${m.service_type || 'Service'} · ${m.city || 'City pending'} · ready ${m.readiness_score ?? 0}%`} onClick={() => openMission(m)} />) : <EmptyState title="No missions waiting for matching" body="Matching queue is empty. Real mission requests will appear here after creation/import." />}</Panel><Panel title="Recommended Agent Pool" subtitle="Choose agent and assign only to real mission IDs.">{data.agents.length ? data.agents.map((a) => <div key={a.id} className="rounded-3xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><div><p className="font-black">{a.full_name}</p><p className="text-sm font-semibold text-slate-500">{a.city || 'City'} · {a.zone || 'Zone'} · {a.skills.join(', ') || 'No skills'}</p></div><span className={cx('rounded-full border px-3 py-1 text-xs font-black', tone(a.status))}>{a.status || 'offline'}</span></div>{unassigned[0] ? <button onClick={() => runAction({ action: 'assign_mission', missionId: unassigned[0].id, agentId: a.id })} className="mt-3 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-black text-white">Assign first queued mission</button> : null}</div>) : <EmptyState title="No agents loaded" body="Create real agent records to activate matching recommendations." />}</Panel></div>
}

function AgentPoolPage({ data, open, edit, runAction }: { data: DispatchPayload; open: (a: DispatchAgent) => void; edit: (a: DispatchAgent) => void; runAction: (body: Record<string, unknown>) => Promise<void> }) {
  return <Panel title="Enterprise Agent Pool" subtitle="Caregiver and field-agent CRUD, readiness, skills, and active capacity.">{data.agents.length ? <div className="grid grid-cols-3 gap-4">{data.agents.map((a) => <div key={a.id} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 font-black text-blue-700">{initials(a.full_name)}</div><div><p className="font-black">{a.full_name}</p><p className="text-xs font-bold text-slate-500">{a.agent_code || 'No code'}</p></div></div><div className="mt-4 flex flex-wrap gap-2">{a.skills.map((s) => <span key={s} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black">{s}</span>)}</div><p className="mt-4 text-sm font-semibold text-slate-500">{a.city || 'City pending'} · {a.zone || 'Zone pending'}</p><div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => open(a)} className="rounded-xl border border-slate-200 py-2 text-xs font-black">Open</button><button onClick={() => edit(a)} className="rounded-xl border border-blue-200 bg-blue-50 py-2 text-xs font-black text-blue-700">Edit</button><button onClick={() => runAction({ action: 'update_agent', entityId: a.id, payload: { status: 'available' } })} className="rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-xs font-black text-emerald-700">Set available</button><button onClick={() => runAction({ action: 'delete_agent', entityId: a.id })} className="rounded-xl border border-rose-200 bg-rose-50 py-2 text-xs font-black text-rose-700">Delete</button></div></div>)}</div> : <EmptyState title="No agents loaded" body="Use Add Agent to create live operational staff records. This page does not ship demo agents." />}</Panel>
}

function SchedulePage({ data, openMission, create }: { data: DispatchPayload; openMission: (m: DispatchMission) => void; create: () => void }) {
  const scheduled = data.missions.filter((m) => m.scheduled_start || m.scheduled_end)
  return <div className="grid grid-cols-[1fr_.75fr] gap-5"><Panel title="Operational Schedule Timeline" subtitle="Scheduled missions, real assignment times and capacity gaps."><button onClick={create} className="mb-4 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-black text-white">Create schedule block</button>{scheduled.length ? scheduled.map((m) => <RowButton key={m.id} title={`${fmt(m.scheduled_start)} → ${fmt(m.scheduled_end)}`} body={`${m.mission_code || m.id} · ${m.city || 'City'} · ${m.assigned_agent_name || 'No agent'}`} onClick={() => openMission(m)} />) : <EmptyState title="No scheduled operations" body="Create live missions or schedule blocks to populate the planning timeline." />}</Panel><Panel title="Coverage Readiness" subtitle="Capacity summary by city and active sectors.">{data.sectors.length ? data.sectors.map((s) => <RowButton key={s.id} title={`${s.city_name} / ${s.sector_name}`} body={`${s.active_missions_count || 0} active missions · ${s.open_agents_count || 0} open agents`} onClick={() => null} />) : <EmptyState title="No coverage matrix" body="Add city sectors and availability records to calculate coverage." />}</Panel></div>
}

function SlaEscalationsPage({ data, open, edit, runAction }: { data: DispatchPayload; open: (i: DispatchIncident) => void; edit: (i: DispatchIncident) => void; runAction: (body: Record<string, unknown>) => Promise<void> }) {
  const risky = data.missions.filter((m) => (m.sla_minutes_remaining ?? 9999) < 0 || m.status === 'at_risk' || m.status === 'escalation')
  return <div className="grid grid-cols-[1fr_1fr] gap-5"><Panel title="SLA Mission Risk" subtitle="Live breaches and at-risk missions from operational tables.">{risky.length ? risky.map((m) => <RowButton key={m.id} title={m.mission_code || m.id} body={`${m.service_type || 'Service'} · SLA ${m.sla_minutes_remaining ?? '—'} min · ${m.city || 'City'}`} onClick={() => runAction({ action: 'escalate_mission', missionId: m.id })} />) : <EmptyState title="No SLA risk loaded" body="No live SLA breaches are currently available in the dispatch data." />}</Panel><Panel title="Incident Escalation Workflows" subtitle="Open, triage, close, or delete real incident records.">{data.incidents.length ? data.incidents.map((i) => <div key={i.id} className="rounded-3xl border border-slate-200 bg-white p-4"><button onClick={() => open(i)} className="text-left"><p className="font-black">{i.incident_type}</p><p className="text-sm font-semibold text-slate-500">{i.summary || 'No summary'} · {i.city || 'City'}</p></button><div className="mt-3 flex gap-2"><button onClick={() => edit(i)} className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-black">Edit</button><button onClick={() => runAction({ action: 'close_incident', entityId: i.id })} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Close</button><button onClick={() => runAction({ action: 'delete_incident', entityId: i.id })} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-black text-rose-700">Delete</button></div></div>) : <EmptyState title="No incidents" body="Create Escalation to start a real incident workflow." />}</Panel></div>
}

function CommunicationsPage({ data, open, create, runAction }: { data: DispatchPayload; open: (m: DispatchMessage) => void; create: () => void; runAction: (body: Record<string, unknown>) => Promise<void> }) {
  return <div className="grid grid-cols-[1fr_.8fr] gap-5"><Panel title="Dispatch Communications" subtitle="Mission notes, broadcasts, client/agent handoff messages."><button onClick={create} className="mb-4 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-black text-white">New message</button>{data.communications.length ? data.communications.map((m) => <RowButton key={m.id} title={`${m.message_type || 'message'} · ${m.sender_name || 'Unknown sender'}`} body={m.body || 'No body'} onClick={() => open(m)} />) : <EmptyState title="No communications loaded" body="Use Broadcast or New message to write live communication records." />}</Panel><Panel title="Broadcast Actions" subtitle="Send operational broadcast records to the live communications table."><button onClick={() => runAction({ action: 'broadcast_message', payload: { body: 'Operational broadcast text required before sending.', priority: 'normal' } })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black">Create blank broadcast draft</button></Panel></div>
}

function AuditTrailPage({ data, open }: { data: DispatchPayload; open: (event: DispatchAuditEvent) => void }) {
  return <Panel title="Operational Audit Trail" subtitle="Immutable operational actions, assignments, deletes, edits and escalations.">{data.auditTrail.length ? <div className="overflow-hidden rounded-3xl border border-slate-200"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Time</th><th className="p-3">Action</th><th className="p-3">Entity</th><th className="p-3">Actor</th><th className="p-3">Open</th></tr></thead><tbody>{data.auditTrail.map((e) => <tr key={e.id} className="border-t border-slate-100"><td className="p-3 font-bold">{fmt(e.created_at)}</td><td className="p-3 font-black">{e.action}</td><td className="p-3">{e.entity_type}</td><td className="p-3">{e.actor_name || 'System'}</td><td className="p-3"><button onClick={() => open(e)} className="text-blue-600 font-black">Open</button></td></tr>)}</tbody></table></div> : <EmptyState title="No audit events loaded" body="Live CRUD and dispatch actions will appear here after real operational writes." />}</Panel>
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) { return <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4"><h2 className="text-xl font-black">{title}</h2><p className="text-sm font-semibold text-slate-500">{subtitle}</p></div>{children}</section> }
function RowButton({ title, body, onClick }: { title: string; body: string; onClick: () => void }) { return <button onClick={onClick} className="mb-3 w-full rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-blue-200"><p className="font-black">{title}</p><p className="mt-1 text-sm font-semibold text-slate-500">{body}</p></button> }

function WorkspaceModal({ modal, setModal, runAction, busy }: { modal: ModalState; setModal: (m: ModalState) => void; runAction: (body: Record<string, unknown>) => Promise<void>; busy: boolean }) {
  const [form, setForm] = useState<Record<string, string>>({})
  if (modal.type === 'none') return null
  const close = () => { setForm({}); setModal({ type: 'none' }) }
  if (modal.type === 'detail') return <div className="fixed inset-0 z-[100] bg-slate-950/30 p-8 backdrop-blur-sm"><div className="ml-auto h-full max-w-3xl overflow-auto rounded-[2rem] bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h3 className="text-2xl font-black">{modal.entity} detail</h3><button onClick={close} className="rounded-full border px-3 py-1 font-black">×</button></div><pre className="mt-5 whitespace-pre-wrap rounded-3xl bg-slate-950 p-5 text-xs text-slate-100">{JSON.stringify(modal.item, null, 2)}</pre></div></div>
  const submit = async () => {
    if (modal.type === 'confirm') return runAction({ action: modal.action, entityId: modal.entityId, missionId: modal.missionId, agentId: modal.agentId, payload: modal.payload || {} })
    if (modal.type === 'mission') return runAction({ action: modal.mode === 'create' ? 'create_mission' : 'update_mission', entityId: modal.item?.id, missionId: modal.item?.id, payload: form })
    if (modal.type === 'agent') return runAction({ action: modal.mode === 'create' ? 'create_agent' : 'update_agent', entityId: modal.item?.id, agentId: modal.item?.id, payload: form })
    if (modal.type === 'sector') return runAction({ action: modal.mode === 'create' ? 'create_sector' : 'update_sector', entityId: modal.item?.id, payload: form })
    if (modal.type === 'incident') return runAction({ action: modal.mode === 'create' ? 'create_incident' : 'update_incident', entityId: modal.item?.id, payload: form })
    if (modal.type === 'message') return runAction({ action: modal.mode === 'broadcast' ? 'broadcast_message' : 'create_communication', payload: form })
    if (modal.type === 'schedule') return runAction({ action: modal.mode === 'create' ? 'create_schedule_block' : 'update_schedule_block', entityId: modal.item?.id, payload: form })
  }
  const fields = modal.type === 'mission' ? ['mission_code','service_type','client_name','beneficiary_name','city','zone','address','scheduled_start','scheduled_end','priority','required_skills','notes'] : modal.type === 'agent' ? ['agent_code','full_name','status','city','zone','skills','readiness_score','reliability_score','next_available_at'] : modal.type === 'sector' ? ['city_name','sector_name','region','lat','lng','load_level','active_missions_count','open_agents_count'] : modal.type === 'incident' ? ['mission_code','incident_type','severity','status','city','zone','summary','owner_name','sla_due_at'] : modal.type === 'schedule' ? ['agent_id','mission_id','city','zone','block_type','status','starts_at','ends_at','notes'] : ['mission_code','channel','sender_name','message_type','body','priority']
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/30 p-8 backdrop-blur-sm"><div className="w-full max-w-3xl rounded-[2rem] bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-blue-600">CareLink Ops Workflow</p><h3 className="mt-1 text-2xl font-black capitalize">{modal.type} {modal.type !== 'confirm' && 'mode' in modal ? modal.mode : ''}</h3></div><button onClick={close} className="rounded-full border px-3 py-1 font-black">×</button></div>{modal.type === 'confirm' ? <p className="mt-5 text-sm font-semibold text-slate-600">{modal.body}</p> : <div className="mt-5 grid grid-cols-2 gap-3">{fields.map((field) => <label key={field} className="text-xs font-black uppercase tracking-widest text-slate-500">{field}<input defaultValue={(modal as any).item?.[field] || ''} onChange={(e) => setForm((current) => ({ ...current, [field]: e.target.value }))} className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm normal-case tracking-normal outline-none focus:border-blue-300" /></label>)}</div>}<div className="mt-6 flex justify-end gap-3"><button onClick={close} className="rounded-2xl border border-slate-200 px-4 py-2 font-black">Cancel</button><button onClick={submit} disabled={busy} className="rounded-2xl bg-blue-600 px-4 py-2 font-black text-white disabled:opacity-60">{busy ? 'Saving…' : 'Confirm'}</button></div></div></div>
}

export default CareLinkDispatchWorkspacePage
