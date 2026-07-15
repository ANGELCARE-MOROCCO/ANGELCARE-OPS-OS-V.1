'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

type AnyRecord = Record<string, any>

function text(value: unknown, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

function number(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function toDate(value: unknown) {
  const d = new Date(text(value, ''))
  return Number.isNaN(d.getTime()) ? null : d
}

function toDatetimeLocal(value: unknown) {
  const d = toDate(value)
  if (!d) return ''
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function formatDateTime(value: unknown) {
  const d = toDate(value)
  if (!d) return 'Not scheduled'
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }) + ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function tone(status: unknown) {
  const s = text(status, '').toLowerCase()
  if (s.includes('cancel') || s.includes('escal') || s.includes('risk')) return 'rose'
  if (s.includes('complete')) return 'emerald'
  if (s.includes('active') || s.includes('assign') || s.includes('ready')) return 'blue'
  if (s.includes('draft') || s.includes('pending')) return 'amber'
  return 'slate'
}

function toneClasses(t: string) {
  if (t === 'rose') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (t === 'emerald') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (t === 'blue') return 'border-blue-200 bg-blue-50 text-blue-700'
  if (t === 'amber') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-slate-200 bg-white text-slate-700'
}

function Stat({ label, value, detail, t = 'blue' }: { label: string; value: string | number; detail: string; t?: string }) {
  return (
    <div className={`rounded-[28px] border p-5 shadow-sm ${toneClasses(t)}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.24em] opacity-70">{label}</div>
      <div className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950">{value}</div>
      <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{detail}</p>
    </div>
  )
}

function MissionCard({ mission, open }: { mission: AnyRecord; open: (mission: AnyRecord) => void }) {
  const currentTone = tone(mission.dispatch_status)

  return (
    <button
      type="button"
      onClick={() => open(mission)}
      className="group relative w-full overflow-hidden rounded-[30px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_26px_70px_rgba(37,99,235,0.16)]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400 opacity-0 transition group-hover:opacity-100" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{text(mission.mission_code, text(mission.raw_id))}</div>
          <h3 className="mt-1 text-xl font-black tracking-[-0.04em] text-slate-950">{text(mission.title)}</h3>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{text(mission.service_type)} · {text(mission.family_name)}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${toneClasses(currentTone)}`}>{text(mission.dispatch_status)}</span>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        <Mini label="Caregiver" value={text(mission.caregiver_name, 'Unassigned')} />
        <Mini label="When" value={formatDateTime(mission.scheduled_start_at)} />
        <Mini label="Coverage" value={`${text(mission.city)} · ${text(mission.zone)}`} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {!mission.route_from || !mission.route_to || !mission.transport_mode ? <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">Route gap</span> : <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Route ready</span>}
        {mission.risk_level === 'high' ? <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-700">High risk</span> : null}
        {mission.assignment?.canonical_bridge_status ? <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{mission.assignment.canonical_bridge_status}</span> : null}
      </div>
    </button>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-1 truncate text-xs font-black text-slate-950">{value}</div>
    </div>
  )
}

export default function CareLinkDispatchProductionCommandCenter() {
  const [payload, setPayload] = useState<any>({ summary: {}, missions: [], caregivers: [], cities: [], statuses: [] })
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('all')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<AnyRecord | null>(null)
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/carelink/ops/dispatch-command', { cache: 'no-store' })
      const json = await res.json()
      setPayload(json || { summary: {}, missions: [], caregivers: [], cities: [], statuses: [] })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const timer = window.setInterval(load, 45000)
    return () => window.clearInterval(timer)
  }, [load])

  const missions = Array.isArray(payload.missions) ? payload.missions : []
  const caregivers = Array.isArray(payload.caregivers) ? payload.caregivers : []

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return missions.filter((m: AnyRecord) => {
      const haystack = [m.title, m.service_type, m.family_name, m.caregiver_name, m.city, m.zone, m.dispatch_status].join(' ').toLowerCase()
      if (q && !haystack.includes(q)) return false
      if (city !== 'all' && m.city !== city) return false
      if (status !== 'all' && m.dispatch_status !== status) return false
      return true
    })
  }, [missions, query, city, status])

  async function runDispatchAction(action: string, mission: AnyRecord, updates: AnyRecord = {}) {
    setNotice('')
    const body = {
      action,
      source_type: mission.source_type,
      source_id: mission.raw_id,
      raw_id: mission.raw_id,
      title: mission.title,
      mission_title: mission.title,
      mission_code: mission.mission_code,
      caregiver_id: updates.caregiver_id ?? mission.caregiver_id,
      caregiver_name: updates.caregiver_name ?? mission.caregiver_name,
      backup_caregiver_id: updates.backup_caregiver_id ?? mission.backup_caregiver_id,
      backup_caregiver_name: updates.backup_caregiver_name ?? mission.backup_caregiver_name,
      route_from: updates.route_from ?? mission.route_from,
      route_to: updates.route_to ?? mission.route_to,
      transport_mode: updates.transport_mode ?? mission.transport_mode,
      scheduled_start_at: updates.scheduled_start_at ?? mission.scheduled_start_at,
      scheduled_end_at: updates.scheduled_end_at ?? mission.scheduled_end_at,
      city: updates.city ?? mission.city,
      zone: updates.zone ?? mission.zone,
      priority: updates.priority ?? mission.priority,
      risk_level: updates.risk_level ?? mission.risk_level,
      validation_notes: updates.validation_notes ?? mission.validation_notes,
      created_by: 'CareLink Dispatch',
    }

    const res = await fetch('/api/carelink/ops/dispatch-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    setNotice(json?.ok ? `Dispatch synced: ${action}` : json?.error || 'Dispatch sync failed')
    await load()
    if (json?.ok && json.assignment) setSelected({ ...mission, ...json.assignment, assignment: json.assignment })
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0,transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef4ff_50%,#f8fafc_100%)] px-6 py-6">
      <header className="relative overflow-hidden rounded-[44px] border border-white/80 bg-white/95 p-6 shadow-[0_30px_100px_rgba(15,23,42,0.14)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400" />
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em] text-blue-700">CareLink Ops · Dispatch Production Command</div>
            <h1 className="mt-3 max-w-7xl text-5xl font-black tracking-[-0.075em] text-slate-950">Mission assignment, route, caregiver and mobile dispatch cockpit</h1>
            <p className="mt-3 max-w-6xl text-sm font-semibold leading-6 text-slate-500">Live synced dispatch command center with canonical source bridge, caregiver assignment drawer, route updates, mobile/admin notifications and audit logs.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/api/carelink/ops/dispatch-audit" target="_blank" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm">Audit schema</a>
            <button onClick={load} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg">{loading ? 'Syncing...' : 'Refresh live'}</button>
          </div>
        </div>
        {notice ? <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">{notice}</div> : null}
        <div className="mt-6 grid gap-3 md:grid-cols-4 xl:grid-cols-8">
          <Stat label="Missions" value={number(payload.summary?.missions)} detail="Live source rows" t="blue" />
          <Stat label="Assigned" value={number(payload.summary?.assigned)} detail="Caregiver linked" t="emerald" />
          <Stat label="Unassigned" value={number(payload.summary?.unassigned)} detail="Needs dispatch" t="rose" />
          <Stat label="Route gaps" value={number(payload.summary?.routeGaps)} detail="Transport missing" t="amber" />
          <Stat label="Escalated" value={number(payload.summary?.escalated)} detail="High risk" t="rose" />
          <Stat label="Active" value={number(payload.summary?.active)} detail="Ready/live" t="blue" />
          <Stat label="Completed" value={number(payload.summary?.completed)} detail="Closed" t="emerald" />
          <Stat label="Caregivers" value={number(payload.summary?.caregivers)} detail="Pool" t="slate" />
        </div>
      </header>

      <section className="mt-5 rounded-[34px] border border-white/80 bg-white/95 p-4 shadow-sm backdrop-blur-xl">
        <div className="grid gap-3 xl:grid-cols-[1fr_180px_180px_140px]">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search mission, family, caregiver, city, zone..." className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none" />
          <select value={city} onChange={(e) => setCity(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black">
            <option value="all">All cities</option>
            {(payload.cities || []).map((x: string) => <option key={x} value={x}>{x}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black">
            <option value="all">All statuses</option>
            {(payload.statuses || []).map((x: string) => <option key={x} value={x}>{x}</option>)}
          </select>
          <button onClick={() => { setQuery(''); setCity('all'); setStatus('all') }} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Reset</button>
        </div>
      </section>

      <main className="mt-6 grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="grid gap-4 xl:grid-cols-2">
          {filtered.map((mission: AnyRecord) => <MissionCard key={mission.id} mission={mission} open={setSelected} />)}
          {!filtered.length ? <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-12 text-center text-sm font-black text-slate-400">No dispatch missions loaded for selected filters.</div> : null}
        </section>

        <aside className="space-y-4">
          <div className="rounded-[34px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_24px_80px_rgba(2,6,23,0.24)]">
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-white/45">Agent pool</div>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-white">Caregiver readiness</h2>
            <div className="mt-5 grid gap-3">
              {caregivers.slice(0, 8).map((agent: AnyRecord) => (
                <div key={agent.id} className="rounded-2xl border border-white/10 bg-white/10 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div><div className="text-sm font-black text-white">{text(agent.full_name)}</div><div className="text-xs font-bold text-white/50">{text(agent.city)} · {text(agent.zone)}</div></div>
                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-100">{number(agent.readiness)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      {selected ? <DispatchDrawer mission={selected} caregivers={caregivers} close={() => setSelected(null)} runDispatchAction={runDispatchAction} /> : null}
    </div>
  )
}

function DispatchDrawer({ mission, caregivers, close, runDispatchAction }: { mission: AnyRecord; caregivers: AnyRecord[]; close: () => void; runDispatchAction: (action: string, mission: AnyRecord, updates?: AnyRecord) => Promise<void> }) {
  const [edit, setEdit] = useState(() => ({
    caregiver_id: text(mission.caregiver_id, ''),
    caregiver_name: text(mission.caregiver_name, ''),
    backup_caregiver_id: text(mission.backup_caregiver_id, ''),
    backup_caregiver_name: text(mission.backup_caregiver_name, ''),
    route_from: text(mission.route_from, ''),
    route_to: text(mission.route_to, ''),
    transport_mode: text(mission.transport_mode, ''),
    scheduled_start_at: toDatetimeLocal(mission.scheduled_start_at),
    scheduled_end_at: toDatetimeLocal(mission.scheduled_end_at),
    city: text(mission.city, ''),
    zone: text(mission.zone, ''),
    priority: text(mission.priority, 'normal'),
    risk_level: text(mission.risk_level, 'normal'),
    validation_notes: text(mission.validation_notes, ''),
  }))

  function chooseCaregiver(id: string) {
    const agent = caregivers.find((x) => String(x.id) === String(id))
    setEdit({ ...edit, caregiver_id: id, caregiver_name: text(agent?.full_name, '') })
  }

  function chooseBackup(id: string) {
    const agent = caregivers.find((x) => String(x.id) === String(id))
    setEdit({ ...edit, backup_caregiver_id: id, backup_caregiver_name: text(agent?.full_name, '') })
  }

  const updates = {
    ...edit,
    scheduled_start_at: edit.scheduled_start_at ? new Date(edit.scheduled_start_at).toISOString() : null,
    scheduled_end_at: edit.scheduled_end_at ? new Date(edit.scheduled_end_at).toISOString() : null,
  }

  return (
    <div className="fixed inset-0 z-[7000] bg-slate-950/50 p-5 backdrop-blur-sm">
      <div className="ml-auto max-h-[calc(100vh-40px)] max-w-6xl overflow-y-auto rounded-[40px] border border-white bg-white p-6 shadow-[0_40px_100px_rgba(2,6,23,0.35)]">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-blue-700">Dispatch assignment drawer</div>
            <h3 className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950">{text(mission.title)}</h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">{text(mission.service_type)} · {text(mission.family_name)} · {text(mission.source_type)} #{text(mission.raw_id)}</p>
          </div>
          <button onClick={close} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">Close</button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Stat label="Dispatch" value={text(mission.dispatch_status)} detail="Current status" t={tone(mission.dispatch_status)} />
          <Stat label="Caregiver" value={text(mission.caregiver_name, 'Unassigned')} detail="Primary assignment" t="blue" />
          <Stat label="Bridge" value={text(mission.assignment?.canonical_bridge_status, 'not synced yet')} detail="Canonical source update" t="amber" />
        </div>

        <div className="mt-6 rounded-[34px] border border-blue-100 bg-blue-50/50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><div className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-700">Full assignment editor</div><h4 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">Assign, route, validate and sync</h4></div>
            <button onClick={() => runDispatchAction('update_dispatch_details', mission, updates)} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">Save details</button>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <Label label="Primary caregiver"><select value={edit.caregiver_id} onChange={(e) => chooseCaregiver(e.target.value)} className="mt-3 w-full bg-transparent text-sm font-black outline-none"><option value="">Unassigned</option>{caregivers.map((a) => <option key={a.id} value={String(a.id)}>{a.full_name}</option>)}</select></Label>
            <Label label="Backup caregiver"><select value={edit.backup_caregiver_id} onChange={(e) => chooseBackup(e.target.value)} className="mt-3 w-full bg-transparent text-sm font-black outline-none"><option value="">No backup</option>{caregivers.map((a) => <option key={a.id} value={String(a.id)}>{a.full_name}</option>)}</select></Label>
            <Field label="City" value={edit.city} setValue={(v) => setEdit({ ...edit, city: v })} />
            <Field label="Zone" value={edit.zone} setValue={(v) => setEdit({ ...edit, zone: v })} />
            <Field label="Route from" value={edit.route_from} setValue={(v) => setEdit({ ...edit, route_from: v })} />
            <Field label="Route to" value={edit.route_to} setValue={(v) => setEdit({ ...edit, route_to: v })} />
            <Field label="Transport mode" value={edit.transport_mode} setValue={(v) => setEdit({ ...edit, transport_mode: v })} />
            <Field label="Start" type="datetime-local" value={edit.scheduled_start_at} setValue={(v) => setEdit({ ...edit, scheduled_start_at: v })} />
            <Field label="End" type="datetime-local" value={edit.scheduled_end_at} setValue={(v) => setEdit({ ...edit, scheduled_end_at: v })} />
            <Field label="Priority" value={edit.priority} setValue={(v) => setEdit({ ...edit, priority: v })} />
            <Field label="Risk level" value={edit.risk_level} setValue={(v) => setEdit({ ...edit, risk_level: v })} />
          </div>
          <label className="mt-4 block rounded-2xl border border-slate-200 bg-white p-4"><span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Validation notes</span><textarea value={edit.validation_notes} onChange={(e) => setEdit({ ...edit, validation_notes: e.target.value })} rows={4} className="mt-3 w-full resize-none bg-transparent text-sm font-bold outline-none" /></label>
        </div>

        <div className="mt-6 rounded-[34px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-700">Production workflow actions</div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <button onClick={() => runDispatchAction('assign_mission', mission, updates)} className="rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white">Assign / Reassign</button>
            <button onClick={() => runDispatchAction('set_backup', mission, updates)} className="rounded-2xl bg-cyan-600 px-5 py-4 text-sm font-black text-white">Set backup</button>
            <button onClick={() => runDispatchAction('route_update', mission, updates)} className="rounded-2xl bg-amber-500 px-5 py-4 text-sm font-black text-white">Sync route</button>
            <button onClick={() => runDispatchAction('activate_dispatch', mission, updates)} className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-black text-blue-700">Activate</button>
            <button onClick={() => runDispatchAction('complete_dispatch', mission, updates)} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-700">Complete</button>
            <button onClick={() => runDispatchAction('cancel_dispatch', mission, updates)} className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-black text-rose-700">Cancel</button>
            <button onClick={() => runDispatchAction('escalate_dispatch', mission, updates)} className="rounded-2xl bg-rose-600 px-5 py-4 text-sm font-black text-white">Escalate</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Label({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block rounded-2xl border border-slate-200 bg-white p-4"><span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</span>{children}</label>
}

function Field({ label, value, setValue, type = 'text' }: { label: string; value: string; setValue: (value: string) => void; type?: string }) {
  return <label className="block rounded-2xl border border-slate-200 bg-white p-4"><span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</span><input type={type} value={value} onChange={(e) => setValue(e.target.value)} className="mt-3 w-full bg-transparent text-sm font-black outline-none" /></label>
}
