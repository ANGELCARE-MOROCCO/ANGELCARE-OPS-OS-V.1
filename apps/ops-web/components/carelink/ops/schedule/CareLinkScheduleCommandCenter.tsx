'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

type AnyRecord = Record<string, any>

type ViewKey =
  | 'command'
  | 'day'
  | 'week'
  | 'month'
  | 'agenda'
  | 'capacity'
  | 'city'
  | 'roster'
  | 'routes'
  | 'validation'

const VIEWS: Array<{ key: ViewKey; label: string; detail: string }> = [
  { key: 'command', label: 'Command deck', detail: 'Executive control' },
  { key: 'day', label: 'Day timeline', detail: 'Hour by hour' },
  { key: 'week', label: 'Week grid', detail: '7-day planning' },
  { key: 'month', label: 'Month calendar', detail: 'Monthly projection' },
  { key: 'agenda', label: 'Agenda list', detail: 'Grouped by date' },
  { key: 'capacity', label: 'Capacity projection', detail: 'Load forecast' },
  { key: 'city', label: 'City coverage', detail: 'Geo operations' },
  { key: 'roster', label: 'Agent roster', detail: 'Workforce load' },
  { key: 'routes', label: 'Route & transport', detail: 'Mobility gaps' },
  { key: 'validation', label: 'Risk validation', detail: 'Control board' },
]

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

function isoDate(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`
}

function itemDateKey(item: AnyRecord) {
  const d = toDate(item.start_at)
  return d ? isoDate(d) : ''
}

function itemMonthKey(item: AnyRecord) {
  const d = toDate(item.start_at)
  return d ? monthKey(d) : ''
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfMonth(date: Date) {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

function monthTitle(date: Date) {
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

function fullDayTitle(date: Date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatDay(date: Date) {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
}


function toDatetimeLocal(value: unknown) {
  const date = toDate(value)
  if (!date) return ''
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function formatTime(value: unknown) {
  const d = toDate(value)
  if (!d) return '—'
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function statusTone(status: unknown) {
  const s = text(status, '').toLowerCase()
  if (s.includes('cancel') || s.includes('risk')) return 'rose'
  if (s.includes('active') || s.includes('assigned')) return 'blue'
  if (s.includes('complete')) return 'emerald'
  if (s.includes('valid') || s.includes('review') || s.includes('draft')) return 'amber'
  return 'slate'
}

function toneClasses(tone: string) {
  if (tone === 'rose') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (tone === 'blue') return 'border-blue-200 bg-blue-50 text-blue-700'
  if (tone === 'emerald') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (tone === 'amber') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-slate-200 bg-white text-slate-700'
}

function dotClass(tone: string) {
  if (tone === 'rose') return 'bg-rose-500'
  if (tone === 'blue') return 'bg-blue-500'
  if (tone === 'emerald') return 'bg-emerald-500'
  if (tone === 'amber') return 'bg-amber-500'
  return 'bg-slate-400'
}

function groupBy<T>(rows: T[], getKey: (row: T) => string) {
  return rows.reduce<Record<string, T[]>>((acc, row) => {
    const key = getKey(row)
    acc[key] = acc[key] || []
    acc[key].push(row)
    return acc
  }, {})
}

function StatCard({
  label,
  value,
  detail,
  tone = 'blue',
}: {
  label: string
  value: string | number
  detail: string
  tone?: string
}) {
  return (
    <div className={`rounded-[28px] border p-5 shadow-sm ${toneClasses(tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.24em] opacity-70">{label}</div>
          <div className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950">{value}</div>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{detail}</p>
        </div>
        <span className={`grid h-11 w-11 place-items-center rounded-2xl text-sm font-black ${toneClasses(tone)}`}>
          {tone === 'rose' ? '!' : tone === 'emerald' ? '✓' : tone === 'amber' ? '⌁' : '◉'}
        </span>
      </div>
    </div>
  )
}

function ViewShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="relative z-10 overflow-hidden rounded-[42px] border border-white/80 bg-white/94 p-6 shadow-[0_26px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-700">Schedule workspace</div>
          <h2 className="mt-2 text-4xl font-black tracking-[-0.06em] text-slate-950">{title}</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function MissionCard({ item, open }: { item: AnyRecord; open: (item: AnyRecord) => void }) {
  const tone = statusTone(item.status)

  return (
    <button
      type="button"
      onClick={() => open(item)}
      className="group relative w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white/95 p-4 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_26px_70px_rgba(37,99,235,0.18)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
            {formatTime(item.start_at)} → {formatTime(item.end_at)}
          </div>
          <div className="mt-1 text-sm font-black text-slate-950">{text(item.title, 'Mission')}</div>
          <div className="mt-1 text-xs font-bold text-slate-500">
            {text(item.city)} · {text(item.zone)} · {text(item.caregiver_name, 'Unassigned')}
          </div>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${toneClasses(tone)}`}>
          {text(item.status, 'planned')}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black text-blue-700">{text(item.service_type)}</span>
        <span className="rounded-full bg-slate-50 px-3 py-1 text-[10px] font-black text-slate-600">{text(item.family_name)}</span>
        {item.risk_level === 'high' ? <span className="rounded-full bg-rose-50 px-3 py-1 text-[10px] font-black text-rose-700">High risk</span> : null}
      </div>
    </button>
  )
}

export default function CareLinkScheduleCommandCenter() {
  const [payload, setPayload] = useState<any>({ summary: {}, items: [], caregivers: [], cities: [], statuses: [], conflicts: [], routeGaps: [] })
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewKey>('command')
  const [anchorDate, setAnchorDate] = useState(() => new Date())
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('all')
  const [status, setStatus] = useState('all')
  const [caregiver, setCaregiver] = useState('all')
  const [selected, setSelected] = useState<AnyRecord | null>(null)
  const [quickOpen, setQuickOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [manual, setManual] = useState({
    title: '',
    city: '',
    zone: '',
    caregiver_name: '',
    service_type: 'CareLink operational block',
    start_at: '',
    end_at: '',
    status: 'planned',
    priority: 'normal',
    route_from: '',
    route_to: '',
    transport_mode: '',
    notes: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/carelink/ops/schedule-command', { cache: 'no-store' })
      const json = await res.json()
      setPayload(json || { summary: {}, items: [], caregivers: [], cities: [], statuses: [], conflicts: [], routeGaps: [] })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const timer = window.setInterval(load, 45000)
    return () => window.clearInterval(timer)
  }, [load])

  const items = Array.isArray(payload.items) ? payload.items : []
  const caregivers = Array.isArray(payload.caregivers) ? payload.caregivers : []
  const conflicts = Array.isArray(payload.conflicts) ? payload.conflicts : []
  const routeGaps = Array.isArray(payload.routeGaps) ? payload.routeGaps : []

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    return items.filter((item: AnyRecord) => {
      const haystack = [item.title, item.service_type, item.family_name, item.caregiver_name, item.city, item.zone, item.status]
        .join(' ')
        .toLowerCase()

      if (q && !haystack.includes(q)) return false
      if (city !== 'all' && item.city !== city) return false
      if (status !== 'all' && item.status !== status) return false
      if (caregiver !== 'all' && String(item.caregiver_id || item.caregiver_name) !== caregiver) return false
      return true
    })
  }, [items, query, city, status, caregiver])

  const weekStart = startOfWeek(anchorDate)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const monthStart = startOfMonth(anchorDate)
  const monthGridStart = startOfWeek(monthStart)
  const monthDays = Array.from({ length: 42 }, (_, i) => addDays(monthGridStart, i))

  const todayKey = isoDate(anchorDate)
  const selectedMonthKey = monthKey(anchorDate)

  const dayItems = filtered.filter((item: AnyRecord) => itemDateKey(item) === todayKey)
  const weekItems = filtered.filter((item: AnyRecord) => weekDays.some((day) => isoDate(day) === itemDateKey(item)))
  const selectedMonthItems = filtered
    .filter((item: AnyRecord) => itemMonthKey(item) === selectedMonthKey)
    .sort((a: AnyRecord, b: AnyRecord) => (toDate(a.start_at)?.getTime() || 0) - (toDate(b.start_at)?.getTime() || 0))

  const selectedMonthUndatedItems = filtered.filter((item: AnyRecord) => !itemDateKey(item))
  const selectedMonthAgendaGroups = groupBy(selectedMonthItems, (item: AnyRecord) => itemDateKey(item))
  const selectedMonthAgendaDays = Object.keys(selectedMonthAgendaGroups).sort()
  const cityGroups = groupBy(filtered, (item: AnyRecord) => text(item.city, 'Unassigned city'))
  const caregiverGroups = groupBy(filtered, (item: AnyRecord) => text(item.caregiver_name, 'Unassigned'))
  const validationRows = filtered.filter((item: AnyRecord) => {
    const v = text(item.validation_status, '').toLowerCase()
    return item.risk_level === 'high' || item.status === 'risk' || v.includes('draft') || v.includes('pending') || v.includes('review')
  })

  async function runAction(action: string, item?: AnyRecord | null) {
    setNotice('')

    const res = await fetch('/api/carelink/ops/schedule-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        action,
        entity_type: item?.source_type || 'schedule',
        entity_id: item?.raw_id || item?.id || '',
        source_type: item?.source_type || 'schedule',
        source_id: item?.raw_id || item?.id || '',
        payload: item || {},
        created_by: 'CareLink Ops',
      }),
    })

    const json = await res.json()

    if (json?.ok && json?.workflow && item) {
      const nextItem = {
        ...item,
        workflow: json.workflow,
        status: json.workflow.current_status || item.status,
        validation_status: json.workflow.validation_status || item.validation_status,
        approval_status: json.workflow.approval_status || item.approval_status,
        assignment_review_status: json.workflow.assignment_review_status || item.assignment_review_status,
        route_review_status: json.workflow.route_review_status || item.route_review_status,
      }

      setSelected(nextItem)
      setNotice(`Workflow synced: ${action}`)
    } else {
      setNotice(json?.ok ? `Action logged: ${action}` : json?.error || 'Unable to log action.')
    }

    await load()
  }

  async function updateManualStatus(item: AnyRecord, nextStatus: string) {
    setNotice('')

    const res = await fetch('/api/carelink/ops/schedule-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        action: 'set_status',
        next_status: nextStatus,
        entity_type: item?.source_type || 'schedule',
        entity_id: item?.raw_id || item?.id || '',
        source_type: item?.source_type || 'schedule',
        source_id: item?.raw_id || item?.id || '',
        payload: item || {},
        created_by: 'CareLink Ops',
      }),
    })

    const json = await res.json()

    if (json?.ok && json?.workflow) {
      const nextItem = {
        ...item,
        workflow: json.workflow,
        status: json.workflow.current_status || nextStatus,
        validation_status: json.workflow.validation_status || item.validation_status,
        approval_status: json.workflow.approval_status || item.approval_status,
      }

      setSelected(nextItem)
      setNotice(`Status synced: ${nextStatus}`)
    } else {
      setNotice(json?.error || 'Unable to update schedule status.')
    }

    await load()
  }

  async function createManualBlock() {
    const res = await fetch('/api/carelink/ops/schedule-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        action: 'create_event',
        ...manual,
        created_by: 'CareLink Ops',
      }),
    })

    const json = await res.json()

    if (json?.ok) {
      setNotice('Manual schedule block created and synced.')
      setQuickOpen(false)
      setManual({
        title: '',
        city: '',
        zone: '',
        caregiver_name: '',
        service_type: 'CareLink operational block',
        start_at: '',
        end_at: '',
        status: 'planned',
        priority: 'normal',
        route_from: '',
        route_to: '',
        transport_mode: '',
        notes: '',
      })
      await load()
    } else {
      setNotice(json?.error || 'Unable to create schedule block.')
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#dbeafe_0,transparent_30%),radial-gradient(circle_at_top_right,#dcfce7_0,transparent_26%),linear-gradient(180deg,#f8fafc_0%,#eef4ff_52%,#f8fafc_100%)] px-6 py-6">
      <div className="pointer-events-none fixed left-[-120px] top-[-120px] h-[360px] w-[360px] rounded-full bg-blue-300/30 blur-3xl" />
      <div className="pointer-events-none fixed bottom-[-160px] right-[-120px] h-[420px] w-[420px] rounded-full bg-emerald-300/25 blur-3xl" />
      <div className="pointer-events-none fixed left-[45%] top-[18%] h-[280px] w-[280px] rounded-full bg-cyan-200/20 blur-3xl" />
      <header className="relative overflow-hidden rounded-[46px] border border-white/80 bg-white/92 p-6 shadow-[0_30px_100px_rgba(15,23,42,0.14)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400" />
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="pointer-events-none absolute right-40 bottom-[-120px] h-72 w-72 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em] text-blue-700">
              CareLink Ops · Max Schedule Command
            </div>
            <h1 className="mt-3 max-w-7xl text-5xl font-black tracking-[-0.075em] text-slate-950">
              Enterprise schedule, agenda, roster and projections cockpit
            </h1>
            <p className="mt-3 max-w-6xl text-sm font-semibold leading-6 text-slate-500">
              Live synced command center for missions, caregivers, city coverage, route readiness, validation queues, workload conflicts, accurate month agenda and manual operational blocks.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={load} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm">
              {loading ? 'Syncing...' : 'Refresh live'}
            </button>
            <button onClick={() => setQuickOpen(true)} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg">
              + New schedule block
            </button>
          </div>
        </div>

        {notice ? <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">{notice}</div> : null}

        <div className="mt-6 grid gap-3 md:grid-cols-4 xl:grid-cols-8">
          <StatCard label="Total" value={number(payload.summary?.total)} detail="Synced items" tone="blue" />
          <StatCard label="Month" value={selectedMonthItems.length} detail={monthTitle(anchorDate)} tone="emerald" />
          <StatCard label="Active" value={number(payload.summary?.active)} detail="Live / assigned" tone="blue" />
          <StatCard label="Conflicts" value={conflicts.length} detail="Overlap risks" tone="rose" />
          <StatCard label="Validation" value={validationRows.length} detail="Pending review" tone="amber" />
          <StatCard label="Route gaps" value={routeGaps.length} detail="Transport missing" tone="rose" />
          <StatCard label="Caregivers" value={number(payload.summary?.caregivers)} detail="Workforce pool" tone="emerald" />
          <StatCard label="Undated" value={selectedMonthUndatedItems.length} detail="Needs date fix" tone="amber" />
        </div>
      </header>

      {/* Premium visual cockpit layer */}
      <section className="relative z-10 mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="relative overflow-hidden rounded-[42px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_30px_90px_rgba(2,6,23,0.28)]">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-100px] left-10 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-100">
                  Live schedule intelligence
                </div>
                <h2 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.06em] text-white">
                  Operational schedule radar
                </h2>
                <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-white/65">
                  Real-time control layer for month agenda accuracy, route readiness, validation risks, caregiver load, city coverage and live schedule pressure.
                </p>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 text-right backdrop-blur">
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/50">Schedule health</div>
                <div className="mt-2 text-5xl font-black tracking-[-0.08em] text-white">
                  {Math.max(0, Math.min(100, 100 - conflicts.length * 8 - routeGaps.length * 3 - validationRows.length * 2 - selectedMonthUndatedItems.length * 4))}%
                </div>
                <div className="mt-3 h-2 w-48 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-blue-400"
                    style={{ width: `${Math.max(0, Math.min(100, 100 - conflicts.length * 8 - routeGaps.length * 3 - validationRows.length * 2 - selectedMonthUndatedItems.length * 4))}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-5">
              <div className="rounded-[26px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Selected month</div>
                <div className="mt-2 text-2xl font-black text-white">{selectedMonthItems.length}</div>
                <div className="mt-1 text-xs font-bold text-white/55">{monthTitle(anchorDate)}</div>
              </div>

              <div className="rounded-[26px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Today focus</div>
                <div className="mt-2 text-2xl font-black text-white">{dayItems.length}</div>
                <div className="mt-1 text-xs font-bold text-white/55">{fullDayTitle(anchorDate)}</div>
              </div>

              <div className="rounded-[26px] border border-rose-400/20 bg-rose-400/10 p-4 backdrop-blur">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-100">Conflicts</div>
                <div className="mt-2 text-2xl font-black text-white">{conflicts.length}</div>
                <div className="mt-1 text-xs font-bold text-white/55">Overlap detector</div>
              </div>

              <div className="rounded-[26px] border border-amber-400/20 bg-amber-400/10 p-4 backdrop-blur">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100">Route gaps</div>
                <div className="mt-2 text-2xl font-black text-white">{routeGaps.length}</div>
                <div className="mt-1 text-xs font-bold text-white/55">Transport readiness</div>
              </div>

              <div className="rounded-[26px] border border-emerald-400/20 bg-emerald-400/10 p-4 backdrop-blur">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100">Caregivers</div>
                <div className="mt-2 text-2xl font-black text-white">{caregivers.length}</div>
                <div className="mt-1 text-xs font-bold text-white/55">Workforce pool</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[38px] border border-slate-200 bg-white/90 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-700">Fast command dock</div>
                <h3 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-950">Jump to operational views</h3>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                Live
              </span>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button onClick={() => { setAnchorDate(new Date()); setView('day') }} className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-left text-sm font-black text-blue-700 hover:bg-blue-100">
                Today timeline
              </button>
              <button onClick={() => setView('agenda')} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-black text-slate-800 hover:bg-slate-50">
                Month agenda
              </button>
              <button onClick={() => setView('validation')} className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-left text-sm font-black text-amber-700 hover:bg-amber-100">
                Risk validation
              </button>
              <button onClick={() => setView('routes')} className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-left text-sm font-black text-rose-700 hover:bg-rose-100">
                Route gaps
              </button>
              <button onClick={() => setView('capacity')} className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-left text-sm font-black text-emerald-700 hover:bg-emerald-100">
                Capacity forecast
              </button>
              <button onClick={() => setQuickOpen(true)} className="rounded-2xl bg-slate-950 px-4 py-3 text-left text-sm font-black text-white hover:bg-blue-700">
                + Manual block
              </button>
            </div>
          </div>

          <div className="rounded-[38px] border border-slate-200 bg-white/90 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl">
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Projection signal</div>
            <div className="mt-4 grid gap-3">
              <MiniProjection label="Month density" value={`${selectedMonthItems.length} cards`} pct={Math.min(100, selectedMonthItems.length * 8)} />
              <MiniProjection label="Validation pressure" value={`${validationRows.length} items`} pct={Math.min(100, validationRows.length * 12)} />
              <MiniProjection label="Route readiness gap" value={`${routeGaps.length} gaps`} pct={Math.min(100, routeGaps.length * 10)} />
            </div>
          </div>
        </div>
      </section>


      <section className="relative z-10 mt-5 rounded-[38px] border border-white/80 bg-white/92 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="grid gap-3 xl:grid-cols-[1fr_180px_180px_220px_150px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search mission, family, caregiver, city, zone..."
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none"
          />

          <select value={city} onChange={(event) => setCity(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black">
            <option value="all">All cities</option>
            {(payload.cities || []).map((x: string) => <option key={x} value={x}>{x}</option>)}
          </select>

          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black">
            <option value="all">All statuses</option>
            {(payload.statuses || []).map((x: string) => <option key={x} value={x}>{x}</option>)}
          </select>

          <select value={caregiver} onChange={(event) => setCaregiver(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black">
            <option value="all">All caregivers</option>
            {caregivers.map((x: AnyRecord) => <option key={x.id} value={String(x.id)}>{x.full_name}</option>)}
          </select>

          <button onClick={() => { setQuery(''); setCity('all'); setStatus('all'); setCaregiver('all') }} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
            Reset
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {VIEWS.map((item) => (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={`rounded-2xl px-4 py-3 text-xs font-black transition ${
                view === item.key ? 'bg-blue-600 text-white shadow-lg' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={() => setAnchorDate(addDays(anchorDate, -7))} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black">← Week</button>
          <button onClick={() => setAnchorDate(addDays(anchorDate, -1))} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black">← Day</button>
          <input type="date" value={isoDate(anchorDate)} onChange={(event) => setAnchorDate(new Date(`${event.target.value}T12:00:00`))} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black" />
          <button onClick={() => setAnchorDate(new Date())} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Today</button>
          <button onClick={() => setAnchorDate(addDays(anchorDate, 1))} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black">Day →</button>
          <button onClick={() => setAnchorDate(addDays(anchorDate, 7))} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black">Week →</button>
        </div>
      </section>


      <section className="relative z-10 mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <button onClick={() => setView('validation')} className="group rounded-[30px] border border-amber-100 bg-white/90 p-5 text-left shadow-sm backdrop-blur transition hover:-translate-y-1 hover:border-amber-200 hover:shadow-[0_20px_60px_rgba(245,158,11,0.16)]">
          <div className="flex items-center justify-between">
            <span className="rounded-2xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">Validation</span>
            <span className="text-2xl font-black text-slate-950">{validationRows.length}</span>
          </div>
          <h3 className="mt-4 text-lg font-black tracking-[-0.04em] text-slate-950">Control queue</h3>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-500">Open pending reviews, risks, draft validations and schedule quality gaps.</p>
        </button>

        <button onClick={() => setView('routes')} className="group rounded-[30px] border border-rose-100 bg-white/90 p-5 text-left shadow-sm backdrop-blur transition hover:-translate-y-1 hover:border-rose-200 hover:shadow-[0_20px_60px_rgba(244,63,94,0.16)]">
          <div className="flex items-center justify-between">
            <span className="rounded-2xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">Routes</span>
            <span className="text-2xl font-black text-slate-950">{routeGaps.length}</span>
          </div>
          <h3 className="mt-4 text-lg font-black tracking-[-0.04em] text-slate-950">Transport gaps</h3>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-500">Detect missing route, movement, pickup/dropoff and transport mode configuration.</p>
        </button>

        <button onClick={() => setView('roster')} className="group rounded-[30px] border border-blue-100 bg-white/90 p-5 text-left shadow-sm backdrop-blur transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_60px_rgba(37,99,235,0.16)]">
          <div className="flex items-center justify-between">
            <span className="rounded-2xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">Roster</span>
            <span className="text-2xl font-black text-slate-950">{Object.keys(caregiverGroups).length}</span>
          </div>
          <h3 className="mt-4 text-lg font-black tracking-[-0.04em] text-slate-950">Agent load</h3>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-500">See caregiver assignment pressure, balance, overload and dispatch concentration.</p>
        </button>

        <button onClick={() => setView('month')} className="group rounded-[30px] border border-emerald-100 bg-white/90 p-5 text-left shadow-sm backdrop-blur transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_20px_60px_rgba(16,185,129,0.16)]">
          <div className="flex items-center justify-between">
            <span className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">Month</span>
            <span className="text-2xl font-black text-slate-950">{selectedMonthItems.length}</span>
          </div>
          <h3 className="mt-4 text-lg font-black tracking-[-0.04em] text-slate-950">Calendar radar</h3>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-500">Open the accurate month view with daily density and synced mission cards.</p>
        </button>
      </section>

      <main className="mt-6">
        {view === 'command' ? (
          <ViewShell title="Command deck" subtitle="Executive live operating layer for schedule control, risk pressure, route gaps and next actions.">
            <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="grid gap-3">
                {filtered.slice(0, 12).map((item: AnyRecord) => <MissionCard key={item.id} item={item} open={setSelected} />)}
                {!filtered.length ? <Empty text="No live schedule items loaded yet." /> : null}
              </div>
              <div className="grid gap-4">
                <DeepSignal title="Conflict detector" value={conflicts.length} detail="Caregiver overlap and same-day schedule risks." tone="rose" />
                <DeepSignal title="Route readiness" value={routeGaps.length} detail="Items missing route or transport configuration." tone="amber" />
                <DeepSignal title="Month load" value={selectedMonthItems.length} detail={`Accurate selected month: ${monthTitle(anchorDate)}`} tone="blue" />
                <DeepSignal title="Validation board" value={validationRows.length} detail="Items requiring review, approval or correction." tone="emerald" />
              </div>
            </div>
          </ViewShell>
        ) : null}

        {view === 'day' ? (
          <ViewShell title={`Day timeline · ${fullDayTitle(anchorDate)}`} subtitle="Accurate selected-day schedule with hour-level grouping.">
            <div className="grid gap-3">
              {Array.from({ length: 16 }, (_, i) => i + 6).map((hour) => {
                const rows = dayItems.filter((item: AnyRecord) => {
                  const d = toDate(item.start_at)
                  return d ? d.getHours() === hour : false
                })

                return (
                  <div key={hour} className="grid gap-3 rounded-[28px] border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[110px_1fr]">
                    <div className="text-xl font-black text-slate-950">{String(hour).padStart(2, '0')}:00</div>
                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                      {rows.length ? rows.map((item: AnyRecord) => <MissionCard key={item.id} item={item} open={setSelected} />) : <Empty small text="No block" />}
                    </div>
                  </div>
                )
              })}
            </div>
          </ViewShell>
        ) : null}

        {view === 'week' ? (
          <ViewShell title="Week grid" subtitle="Seven-day planning view with accurate day keys and mission cards.">
            <div className="grid gap-4 xl:grid-cols-7">
              {weekDays.map((day) => {
                const key = isoDate(day)
                const rows = filtered.filter((item: AnyRecord) => itemDateKey(item) === key)

                return (
                  <div key={key} className="min-h-[440px] rounded-[30px] border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-black text-slate-950">{formatDay(day)}</div>
                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{isoDate(day)}</div>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700">{rows.length}</span>
                    </div>
                    <div className="grid gap-2">
                      {rows.map((item: AnyRecord) => <MissionCard key={item.id} item={item} open={setSelected} />)}
                      {!rows.length ? <Empty small text="No schedule" /> : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </ViewShell>
        ) : null}

        {view === 'month' ? (
          <ViewShell title={`Month calendar projection · ${monthTitle(anchorDate)}`} subtitle="Current-month schedule view with accurate weekdays, live mission cards and daily density.">
            <div className="mb-5 grid gap-3 md:grid-cols-4">
              <StatCard label="Month items" value={selectedMonthItems.length} detail="Dated schedule items" tone="blue" />
              <StatCard label="Undated" value={selectedMonthUndatedItems.length} detail="Need date correction" tone="amber" />
              <StatCard label="Risk month" value={selectedMonthItems.filter((x: AnyRecord) => x.risk_level === 'high' || x.status === 'risk').length} detail="Risk or blocked" tone="rose" />
              <StatCard label="Cities" value={Object.keys(groupBy(selectedMonthItems, (x: AnyRecord) => text(x.city, 'Unassigned city'))).length} detail="Cities covered" tone="emerald" />
            </div>

            <div className="mb-3 grid grid-cols-7 gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-xs font-black uppercase tracking-[0.18em] text-white">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-7">
              {monthDays.map((day) => {
                const key = isoDate(day)
                const rows = selectedMonthItems.filter((item: AnyRecord) => itemDateKey(item) === key)
                const isCurrentMonth = monthKey(day) === selectedMonthKey
                const isToday = key === isoDate(new Date())

                return (
                  <div key={key} className={`min-h-[240px] rounded-[28px] border p-3 shadow-sm transition ${isCurrentMonth ? isToday ? 'border-blue-300 bg-blue-50/70' : 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50/60 opacity-60'}`}>
                    <button type="button" onClick={() => { setAnchorDate(day); setView('day') }} className="mb-3 flex w-full items-start justify-between gap-2 text-left">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{day.toLocaleDateString('en-GB', { weekday: 'short' })}</div>
                        <div className="mt-1 text-xl font-black text-slate-950">{day.toLocaleDateString('en-GB', { day: '2-digit' })}</div>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${rows.length ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{rows.length}</span>
                    </button>

                    <div className="grid gap-2">
                      {rows.slice(0, 4).map((item: AnyRecord) => (
                        <button key={item.id} type="button" onClick={() => setSelected(item)} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black text-blue-700">{formatTime(item.start_at)}</span>
                            <span className={`h-2.5 w-2.5 rounded-full ${dotClass(statusTone(item.status))}`} />
                          </div>
                          <div className="mt-1 text-xs font-black leading-4 text-slate-950">{text(item.title)}</div>
                          <div className="mt-1 truncate text-[10px] font-bold text-slate-500">{text(item.caregiver_name)} · {text(item.city)}</div>
                        </button>
                      ))}
                      {rows.length > 4 ? <button type="button" onClick={() => { setAnchorDate(day); setView('day') }} className="rounded-2xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">+ {rows.length - 4} more</button> : null}
                      {!rows.length ? <Empty small text="No mission" /> : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </ViewShell>
        ) : null}

        {view === 'agenda' ? (
          <ViewShell title={`Agenda list · ${monthTitle(anchorDate)}`} subtitle="Current-month agenda grouped by accurate day and date. Every card is synced from live records.">
            <div className="mb-5 grid gap-3 md:grid-cols-4">
              <StatCard label="Month agenda" value={selectedMonthItems.length} detail="Dated cards in month" tone="blue" />
              <StatCard label="Active" value={selectedMonthItems.filter((x: AnyRecord) => ['active', 'assigned'].includes(String(x.status))).length} detail="Live / assigned" tone="emerald" />
              <StatCard label="Validation" value={selectedMonthItems.filter((x: AnyRecord) => String(x.validation_status || '').toLowerCase().includes('draft') || String(x.validation_status || '').toLowerCase().includes('pending')).length} detail="Pending review" tone="amber" />
              <StatCard label="Risk" value={selectedMonthItems.filter((x: AnyRecord) => x.risk_level === 'high' || x.status === 'risk').length} detail="Risk items" tone="rose" />
            </div>

            <div className="grid gap-5">
              {selectedMonthAgendaDays.map((dayKey) => {
                const date = new Date(`${dayKey}T12:00:00`)
                const rows = selectedMonthAgendaGroups[dayKey] || []

                return (
                  <div key={dayKey} className="rounded-[34px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-700">{date.toLocaleDateString('en-GB', { weekday: 'long' })}</div>
                        <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">{fullDayTitle(date)}</h3>
                      </div>
                      <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">{rows.length} card(s)</span>
                    </div>

                    <div className="grid gap-3">
                      {rows.map((item: AnyRecord) => (
                        <button key={item.id} onClick={() => setSelected(item)} className="grid gap-4 rounded-[26px] border border-slate-200 bg-slate-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 lg:grid-cols-[170px_1fr_180px_180px_140px]">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Time window</div>
                            <div className="mt-2 text-lg font-black text-slate-950">{formatTime(item.start_at)}</div>
                            <div className="text-xs font-bold text-slate-500">→ {formatTime(item.end_at)}</div>
                          </div>
                          <div>
                            <div className="text-lg font-black text-slate-950">{text(item.title)}</div>
                            <div className="mt-1 text-xs font-bold text-slate-500">{text(item.service_type)} · {text(item.family_name)}</div>
                            <div className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">{fullDayTitle(date)}</div>
                          </div>
                          <div><div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Caregiver</div><div className="mt-2 text-sm font-black text-slate-700">{text(item.caregiver_name)}</div></div>
                          <div><div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Coverage</div><div className="mt-2 text-sm font-black text-slate-700">{text(item.city)} · {text(item.zone)}</div></div>
                          <span className={`rounded-full border px-3 py-2 text-center text-xs font-black ${toneClasses(statusTone(item.status))}`}>{text(item.status)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
              {!selectedMonthItems.length ? <Empty text={`No dated agenda cards found for ${monthTitle(anchorDate)}.`} /> : null}
            </div>
          </ViewShell>
        ) : null}

        {view === 'capacity' ? (
          <ViewShell title="Capacity projection" subtitle="Daily load projection against the caregiver pool and risk thresholds.">
            <div className="grid gap-4">
              {weekDays.map((day) => {
                const key = isoDate(day)
                const rows = filtered.filter((item: AnyRecord) => itemDateKey(item) === key)
                const capacity = Math.max(caregivers.length, 1)
                const pct = Math.min(100, Math.round((rows.length / capacity) * 100))

                return (
                  <div key={key} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-black text-slate-950">{fullDayTitle(day)}</div>
                        <div className="text-xs font-bold text-slate-500">{rows.length} items · {capacity} caregivers pool</div>
                      </div>
                      <div className="text-3xl font-black text-slate-950">{pct}%</div>
                    </div>
                    <div className="mt-4 h-3 rounded-full bg-slate-100">
                      <div className={`h-3 rounded-full ${pct > 85 ? 'bg-rose-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </ViewShell>
        ) : null}

        {view === 'city' ? (
          <ViewShell title="City coverage" subtitle="Coverage, demand, gaps and risk distribution by operational city.">
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {Object.entries(cityGroups).map(([name, rows]) => (
                <div key={name} className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-black text-slate-950">{name}</div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{rows.length}</span>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {rows.slice(0, 6).map((item: AnyRecord) => <MissionCard key={item.id} item={item} open={setSelected} />)}
                  </div>
                </div>
              ))}
            </div>
          </ViewShell>
        ) : null}

        {view === 'roster' ? (
          <ViewShell title="Agent roster" subtitle="Caregiver-centered schedule distribution, workload and assignment pressure.">
            <div className="grid gap-4 lg:grid-cols-2">
              {Object.entries(caregiverGroups).map(([name, rows]) => (
                <div key={name} className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xl font-black text-slate-950">{name}</div>
                      <div className="text-xs font-bold text-slate-500">{rows.length} assigned item(s)</div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${rows.length > 6 ? 'bg-rose-50 text-rose-700' : rows.length > 3 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {rows.length > 6 ? 'Overload' : rows.length > 3 ? 'Busy' : 'Balanced'}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {rows.slice(0, 7).map((item: AnyRecord) => <MissionCard key={item.id} item={item} open={setSelected} />)}
                  </div>
                </div>
              ))}
            </div>
          </ViewShell>
        ) : null}

        {view === 'routes' ? (
          <ViewShell title="Route & transport planning" subtitle="Mission movement, route gaps, transport mode and city-to-zone readiness.">
            <div className="grid gap-3">
              {filtered.map((item: AnyRecord) => (
                <button key={item.id} onClick={() => setSelected(item)} className="grid gap-4 rounded-[26px] border border-slate-200 bg-white p-4 text-left shadow-sm hover:bg-blue-50 lg:grid-cols-[1fr_180px_180px_180px_140px]">
                  <div><div className="font-black text-slate-950">{text(item.title)}</div><div className="text-xs font-bold text-slate-500">{formatDay(toDate(item.start_at) || new Date())} · {formatTime(item.start_at)}</div></div>
                  <div className="font-black text-slate-700">{text(item.route_from || item.city)}</div>
                  <div className="font-black text-slate-700">→ {text(item.route_to || item.zone)}</div>
                  <div className="font-black text-slate-700">{text(item.transport_mode, 'Transport not set')}</div>
                  <span className={`rounded-full border px-3 py-2 text-center text-xs font-black ${item.route_from && item.route_to && item.transport_mode ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>{item.route_from && item.route_to && item.transport_mode ? 'Ready' : 'Route gap'}</span>
                </button>
              ))}
            </div>
          </ViewShell>
        ) : null}

        {view === 'validation' ? (
          <ViewShell title="Risk and validation board" subtitle="Schedule items needing validation, assignment, route completion, conflict control or review.">
            <div className="grid gap-4">
              {conflicts.length ? (
                <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-5">
                  <div className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-700">Conflict detector</div>
                  <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">{conflicts.length} caregiver overlap risk(s)</h3>
                  <div className="mt-4 grid gap-3">
                    {conflicts.slice(0, 5).map((conflict: AnyRecord, index: number) => (
                      <div key={index} className="rounded-2xl bg-white p-4 text-sm font-black text-slate-700">
                        {text(conflict.caregiver_name)} · {text(conflict.day)} · {text(conflict.first?.title)} overlaps {text(conflict.second?.title)}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {validationRows.map((item: AnyRecord) => (
                <button key={item.id} onClick={() => setSelected(item)} className="grid gap-4 rounded-[26px] border border-amber-200 bg-amber-50/60 p-4 text-left shadow-sm hover:bg-white lg:grid-cols-[1fr_180px_180px_160px]">
                  <div><div className="font-black text-slate-950">{text(item.title)}</div><div className="text-xs font-bold text-slate-500">{text(item.city)} · {text(item.zone)} · {text(item.family_name)}</div></div>
                  <div className="font-black text-slate-700">{text(item.validation_status, 'draft')}</div>
                  <div className="font-black text-slate-700">{text(item.risk_level, 'normal')}</div>
                  <span className="rounded-full bg-slate-950 px-3 py-2 text-center text-xs font-black text-white">Open review</span>
                </button>
              ))}
              {!validationRows.length && !conflicts.length ? <Empty text="No risk, validation, or conflict gaps detected for selected filters." /> : null}
            </div>
          </ViewShell>
        ) : null}
      </main>

      {selected ? (
        <ScheduleDrawer
          selected={selected}
          close={() => setSelected(null)}
          runAction={runAction}
          updateManualStatus={updateManualStatus}
          refresh={load}
        />
      ) : null}

      {quickOpen ? (
        <ManualModal
          manual={manual}
          setManual={setManual}
          close={() => setQuickOpen(false)}
          createManualBlock={createManualBlock}
        />
      ) : null}
    </div>
  )
}

function DeepSignal({ title, value, detail, tone }: { title: string; value: number; detail: string; tone: string }) {
  return (
    <div className={`rounded-[32px] border p-6 shadow-sm ${toneClasses(tone)}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.24em] opacity-70">{title}</div>
      <div className="mt-3 text-5xl font-black tracking-[-0.08em] text-slate-950">{value}</div>
      <p className="mt-3 text-sm font-bold leading-6 text-slate-500">{detail}</p>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-black text-slate-950">{value}</div>
    </div>
  )
}

function Empty({ text, small = false }: { text: string; small?: boolean }) {
  return (
    <div className={`rounded-[24px] border border-dashed border-slate-300 bg-white text-center font-black text-slate-400 ${small ? 'p-4 text-xs' : 'p-10 text-sm'}`}>
      {text}
    </div>
  )
}

function ScheduleDrawer({
  selected,
  close,
  runAction,
  updateManualStatus,
  refresh,
}: {
  selected: AnyRecord
  close: () => void
  runAction: (action: string, item?: AnyRecord | null) => Promise<void>
  updateManualStatus: (item: AnyRecord, status: string) => Promise<void>
  refresh: () => Promise<void>
}) {
  // Full schedule edit drawer state
  const [edit, setEdit] = useState(() => ({
    title: text(selected.title, ''),
    service_type: text(selected.service_type, ''),
    family_name: text(selected.family_name, ''),
    caregiver_id: text(selected.caregiver_id, ''),
    caregiver_name: text(selected.caregiver_name, ''),
    city: text(selected.city, ''),
    zone: text(selected.zone, ''),
    status: text(selected.status, 'planned'),
    start_at: toDatetimeLocal(selected.start_at),
    end_at: toDatetimeLocal(selected.end_at),
    route_from: text(selected.route_from, ''),
    route_to: text(selected.route_to, ''),
    transport_mode: text(selected.transport_mode, ''),
    risk_level: text(selected.risk_level, 'normal'),
    validation_status: text(selected.validation_status, 'draft'),
    validation_notes: text(selected.notes, ''),
  }))
  const [editSaving, setEditSaving] = useState(false)
  const [editNotice, setEditNotice] = useState('')

  function cancelScheduleEdits() {
    setEdit({
      title: text(selected.title, ''),
      service_type: text(selected.service_type, ''),
      family_name: text(selected.family_name, ''),
      caregiver_id: text(selected.caregiver_id, ''),
      caregiver_name: text(selected.caregiver_name, ''),
      city: text(selected.city, ''),
      zone: text(selected.zone, ''),
      status: text(selected.status, 'planned'),
      start_at: toDatetimeLocal(selected.start_at),
      end_at: toDatetimeLocal(selected.end_at),
      route_from: text(selected.route_from, ''),
      route_to: text(selected.route_to, ''),
      transport_mode: text(selected.transport_mode, ''),
      risk_level: text(selected.risk_level, 'normal'),
      validation_status: text(selected.validation_status, 'draft'),
      validation_notes: text(selected.notes, ''),
    })
    setEditNotice('Edits cancelled.')
  }

  async function saveScheduleEdits() {
    setEditSaving(true)
    setEditNotice('')

    try {
      const res = await fetch('/api/carelink/ops/schedule-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          action: 'update_schedule_details',
          entity_type: selected.source_type || 'schedule',
          entity_id: selected.raw_id || selected.id,
          source_type: selected.source_type || 'schedule',
          source_id: selected.raw_id || selected.id,
          updates: {
            ...edit,
            start_at: edit.start_at ? new Date(edit.start_at).toISOString() : null,
            end_at: edit.end_at ? new Date(edit.end_at).toISOString() : null,
          },
          payload: selected,
          created_by: 'CareLink Ops',
        }),
      })

      const json = await res.json()

      if (!json?.ok) {
        throw new Error(json?.error || 'Unable to save schedule edits.')
      }

      setEditNotice(
        json.workflow?.canonical_bridge?.ok
          ? 'Schedule edits saved and canonical source synced.'
          : 'Schedule edits saved as workflow overlay. Canonical source needs schema mapping review.',
      )

      await refresh()
    } catch (error) {
      setEditNotice(error instanceof Error ? error.message : 'Unable to save schedule edits.')
    } finally {
      setEditSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[7000] bg-slate-950/50 p-5 backdrop-blur-sm">
      <div className="ml-auto max-h-[calc(100vh-40px)] max-w-5xl overflow-y-auto rounded-[38px] border border-white bg-white p-6 shadow-[0_40px_100px_rgba(2,6,23,0.35)]">
        <div className="flex items-start justify-between gap-5">
          <div>
            <div className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-blue-700">
              Schedule item command drawer
            </div>
            <h3 className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950">{text(selected.title)}</h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">{text(selected.service_type)} · {text(selected.family_name)}</p>
          </div>
          <button onClick={close} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">Close</button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <StatCard label="Status" value={text(selected.status)} detail="Current lifecycle" tone={statusTone(selected.status)} />
          <StatCard label="City" value={text(selected.city)} detail={text(selected.zone)} tone="blue" />
          <StatCard label="Caregiver" value={text(selected.caregiver_name)} detail={`ID ${text(selected.caregiver_id, '—')}`} tone="emerald" />
        </div>

        <div className="mt-6 rounded-[30px] border border-slate-200 bg-slate-50 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Detail label="Start" value={`${formatDay(toDate(selected.start_at) || new Date())} · ${formatTime(selected.start_at)}`} />
            <Detail label="End" value={`${formatDay(toDate(selected.end_at) || new Date())} · ${formatTime(selected.end_at)}`} />
            <Detail label="Route from" value={text(selected.route_from || selected.city)} />
            <Detail label="Route to" value={text(selected.route_to || selected.zone)} />
            <Detail label="Transport" value={text(selected.transport_mode, 'Not configured')} />
            <Detail label="Validation" value={text(selected.validation_status, 'draft')} />
            <Detail label="Approval state" value={text(selected.workflow?.approval_status || selected.approval_status, 'pending')} />
            <Detail label="Assignment review" value={text(selected.workflow?.assignment_review_status || selected.assignment_review_status, '—')} />
            <Detail label="Route review" value={text(selected.workflow?.route_review_status || selected.route_review_status, '—')} />
            <Detail label="Last workflow action" value={text(selected.workflow?.last_action, 'No action yet')} />
          </div>
          <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-semibold leading-6 text-slate-600">
            {text(selected.notes, 'No notes loaded for this schedule item.')}
          </div>
        </div>

        <div className="mt-6 rounded-[34px] border border-blue-100 bg-blue-50/40 p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-700">Full schedule editor</div>
              <h4 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">Edit date, assignment, route and validation</h4>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                Save writes to workflow state, tries canonical mission/dossier sync, and triggers admin, supervisor and mobile notifications.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={cancelScheduleEdits} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">
                Cancel edits
              </button>
              <button onClick={saveScheduleEdits} disabled={editSaving} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">
                {editSaving ? 'Saving...' : 'Save schedule edits'}
              </button>
            </div>
          </div>

          {editNotice ? (
            <div className="mt-4 rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-black text-blue-700">
              {editNotice}
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <label className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Title</span>
              <input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} className="mt-3 w-full bg-transparent text-sm font-black outline-none" />
            </label>

            <label className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Service type</span>
              <input value={edit.service_type} onChange={(e) => setEdit({ ...edit, service_type: e.target.value })} className="mt-3 w-full bg-transparent text-sm font-black outline-none" />
            </label>

            <label className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Family / client</span>
              <input value={edit.family_name} onChange={(e) => setEdit({ ...edit, family_name: e.target.value })} className="mt-3 w-full bg-transparent text-sm font-black outline-none" />
            </label>

            <label className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Caregiver ID</span>
              <input value={edit.caregiver_id} onChange={(e) => setEdit({ ...edit, caregiver_id: e.target.value })} className="mt-3 w-full bg-transparent text-sm font-black outline-none" />
            </label>

            <label className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Caregiver name</span>
              <input value={edit.caregiver_name} onChange={(e) => setEdit({ ...edit, caregiver_name: e.target.value })} className="mt-3 w-full bg-transparent text-sm font-black outline-none" />
            </label>

            <label className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Status</span>
              <select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })} className="mt-3 w-full bg-transparent text-sm font-black outline-none">
                <option value="planned">planned</option>
                <option value="assigned">assigned</option>
                <option value="active">active</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
            </label>

            <label className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Start date/time</span>
              <input type="datetime-local" value={edit.start_at} onChange={(e) => setEdit({ ...edit, start_at: e.target.value })} className="mt-3 w-full bg-transparent text-sm font-black outline-none" />
            </label>

            <label className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">End date/time</span>
              <input type="datetime-local" value={edit.end_at} onChange={(e) => setEdit({ ...edit, end_at: e.target.value })} className="mt-3 w-full bg-transparent text-sm font-black outline-none" />
            </label>

            <label className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Validation status</span>
              <input value={edit.validation_status} onChange={(e) => setEdit({ ...edit, validation_status: e.target.value })} className="mt-3 w-full bg-transparent text-sm font-black outline-none" />
            </label>

            <label className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">City</span>
              <input value={edit.city} onChange={(e) => setEdit({ ...edit, city: e.target.value })} className="mt-3 w-full bg-transparent text-sm font-black outline-none" />
            </label>

            <label className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Zone</span>
              <input value={edit.zone} onChange={(e) => setEdit({ ...edit, zone: e.target.value })} className="mt-3 w-full bg-transparent text-sm font-black outline-none" />
            </label>

            <label className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Risk level</span>
              <select value={edit.risk_level} onChange={(e) => setEdit({ ...edit, risk_level: e.target.value })} className="mt-3 w-full bg-transparent text-sm font-black outline-none">
                <option value="normal">normal</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </label>

            <label className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Route from</span>
              <input value={edit.route_from} onChange={(e) => setEdit({ ...edit, route_from: e.target.value })} className="mt-3 w-full bg-transparent text-sm font-black outline-none" />
            </label>

            <label className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Route to</span>
              <input value={edit.route_to} onChange={(e) => setEdit({ ...edit, route_to: e.target.value })} className="mt-3 w-full bg-transparent text-sm font-black outline-none" />
            </label>

            <label className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Transport mode</span>
              <input value={edit.transport_mode} onChange={(e) => setEdit({ ...edit, transport_mode: e.target.value })} className="mt-3 w-full bg-transparent text-sm font-black outline-none" />
            </label>
          </div>

          <label className="mt-4 block rounded-2xl border border-slate-200 bg-white p-4">
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Validation notes / operational comments</span>
            <textarea value={edit.validation_notes} onChange={(e) => setEdit({ ...edit, validation_notes: e.target.value })} rows={4} className="mt-3 w-full resize-none bg-transparent text-sm font-bold outline-none" />
          </label>
        </div>

        <div className="mt-6 rounded-[34px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-700">Live workflow actions</div>
              <h4 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">Production synced control</h4>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                Every click writes a workflow state, creates an action log, refreshes this drawer, and updates the schedule board.
              </p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Current workflow</div>
              <div className="mt-2 text-sm font-black text-slate-950">{text(selected.workflow?.last_action, 'No action yet')}</div>
              <div className="mt-1 text-xs font-bold text-slate-500">{text(selected.workflow?.last_action_at, 'Not synced yet')}</div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <button onClick={() => runAction('approve_schedule_item', selected)} className="rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white shadow-sm hover:bg-emerald-700">
              Approve + sync
            </button>
            <button onClick={() => runAction('request_assignment_review', selected)} className="rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-sm hover:bg-blue-700">
              Assignment review
            </button>
            <button onClick={() => runAction('route_validation_required', selected)} className="rounded-2xl bg-amber-500 px-5 py-4 text-sm font-black text-white shadow-sm hover:bg-amber-600">
              Route review
            </button>
            <button onClick={() => updateManualStatus(selected, 'active')} className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-black text-blue-700 hover:bg-blue-100">
              Mark active
            </button>
            <button onClick={() => updateManualStatus(selected, 'completed')} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-700 hover:bg-emerald-100">
              Complete
            </button>
            <button onClick={() => updateManualStatus(selected, 'cancelled')} className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-black text-rose-700 hover:bg-rose-100">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function FormField({
  label,
  value,
  setValue,
  type = 'text',
}: {
  label: string
  value: string
  setValue: (value: string) => void
  type?: string
}) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-white p-4">
      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</span>
      <input type={type} value={value} onChange={(event) => setValue(event.target.value)} className="mt-3 w-full bg-transparent text-sm font-black outline-none" />
    </label>
  )
}

function ManualModal({
  manual,
  setManual,
  close,
  createManualBlock,
}: {
  manual: AnyRecord
  setManual: (value: any) => void
  close: () => void
  createManualBlock: () => Promise<void>
}) {
  return (
    <div className="fixed inset-0 z-[7100] bg-slate-950/50 p-5 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl rounded-[38px] border border-white bg-white p-6 shadow-[0_40px_100px_rgba(2,6,23,0.35)]">
        <div className="flex items-start justify-between gap-5">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-700">Manual schedule block</div>
            <h3 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950">Create synced schedule block</h3>
          </div>
          <button onClick={close} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black">Close</button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <FormField label="Title" value={manual.title} setValue={(value) => setManual({ ...manual, title: value })} />
          <FormField label="Service type" value={manual.service_type} setValue={(value) => setManual({ ...manual, service_type: value })} />
          <FormField label="City" value={manual.city} setValue={(value) => setManual({ ...manual, city: value })} />
          <FormField label="Zone" value={manual.zone} setValue={(value) => setManual({ ...manual, zone: value })} />
          <FormField label="Caregiver name" value={manual.caregiver_name} setValue={(value) => setManual({ ...manual, caregiver_name: value })} />
          <FormField label="Start" type="datetime-local" value={manual.start_at} setValue={(value) => setManual({ ...manual, start_at: value })} />
          <FormField label="End" type="datetime-local" value={manual.end_at} setValue={(value) => setManual({ ...manual, end_at: value })} />
          <FormField label="Status" value={manual.status} setValue={(value) => setManual({ ...manual, status: value })} />
          <FormField label="Route from" value={manual.route_from} setValue={(value) => setManual({ ...manual, route_from: value })} />
          <FormField label="Route to" value={manual.route_to} setValue={(value) => setManual({ ...manual, route_to: value })} />
          <FormField label="Transport mode" value={manual.transport_mode} setValue={(value) => setManual({ ...manual, transport_mode: value })} />
        </div>

        <label className="mt-4 block rounded-2xl border border-slate-200 bg-white p-4">
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Notes</span>
          <textarea value={manual.notes} onChange={(event) => setManual({ ...manual, notes: event.target.value })} rows={4} className="mt-3 w-full resize-none bg-transparent text-sm font-bold outline-none" />
        </label>

        <button onClick={createManualBlock} className="mt-5 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white shadow-lg">
          Create and sync block
        </button>
      </div>
    </div>
  )
}


function MiniProjection({ label, value, pct }: { label: string; value: string; pct: number }) {
  const safePct = Math.max(0, Math.min(100, pct))

  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</div>
          <div className="mt-1 text-sm font-black text-slate-950">{value}</div>
        </div>
        <div className="text-lg font-black text-slate-950">{safePct}%</div>
      </div>
      <div className="mt-3 h-2 rounded-full bg-white">
        <div
          className={`h-2 rounded-full ${safePct > 75 ? 'bg-rose-500' : safePct > 45 ? 'bg-amber-500' : 'bg-emerald-500'}`}
          style={{ width: `${safePct}%` }}
        />
      </div>
    </div>
  )
}
