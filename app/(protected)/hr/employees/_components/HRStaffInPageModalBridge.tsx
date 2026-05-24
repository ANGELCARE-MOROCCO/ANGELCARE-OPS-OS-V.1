'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  DatabaseZap,
  Edit3,
  FileBadge2,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
  WalletCards,
  Workflow,
  X,
} from 'lucide-react'

type StaffRow = Record<string, any>
type TabKey = 'profile' | 'operations' | 'compliance' | 'activity'

function text(value: any, fallback = '') {
  if (value === null || value === undefined) return fallback
  const trimmed = String(value).trim()
  return trimmed.length ? trimmed : fallback
}

function pick(row: StaffRow | null | undefined, keys: string[], fallback = '') {
  if (!row) return fallback
  for (const key of keys) {
    const value = text(row?.[key], '')
    if (value) return value
  }
  return fallback
}

function idKeys(row: StaffRow | null | undefined) {
  return [row?.id, row?.staff_id, row?.employee_id, row?.user_id, row?.profile_id, row?.email]
    .map((x) => text(x).toLowerCase())
    .filter(Boolean)
}

function initials(name: string) {
  const clean = text(name, 'Staff')
  return clean.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'ST'
}

function statusTone(status: string) {
  const s = status.toLowerCase()
  if (s.includes('archiv') || s.includes('inactive') || s.includes('terminated') || s.includes('deleted')) return 'border-slate-200 bg-slate-100 text-slate-700'
  if (s.includes('pending') || s.includes('trial') || s.includes('draft')) return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

function Pill({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black ${className}`}>{children}</span>
}

function Field({ label, value, editing, onChange, type = 'text' }: { label: string; value: string; editing: boolean; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</span>
      {editing ? (
        <input
          type={type}
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-950 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
        />
      ) : (
        <div className="mt-2 min-h-11 break-words text-sm font-black text-slate-950">{value || '—'}</div>
      )}
    </label>
  )
}

function MetricCard({ icon: Icon, title, value, detail }: any) {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-2xl bg-violet-50 p-3 text-violet-700"><Icon className="h-5 w-5" /></div>
        <div className="text-right text-3xl font-black text-slate-950">{Number(value || 0)}</div>
      </div>
      <div className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-slate-400">{title}</div>
      <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{detail}</p>
    </div>
  )
}

function extractStaffIdFromHref(href: string) {
  const match = href.match(/\/hr\/staff\/([^/?#]+)/)
  return match?.[1] ? decodeURIComponent(match[1]) : ''
}

async function safeJson(response: Response) {
  try { return await response.json() } catch { return null }
}

function normalizeApiPayload(id: string, payload: any, fallback?: StaffRow | null) {
  const source = payload?.employee || payload?.staff || payload?.profile || payload?.data || payload?.record || payload || {}
  const profile = source?.profile || source?.employee || source?.staff || source
  return {
    ...(fallback || {}),
    ...(profile || {}),
    id: text(profile?.id || source?.id || fallback?.id || id, id),
    __sync: {
      ...(fallback?.__sync || {}),
      ...(source?.__sync || {}),
      ...(payload?.sync || {}),
    },
    __relations: {
      attendance: source?.attendance || payload?.attendance || [],
      contracts: source?.contracts || payload?.contracts || [],
      documents: source?.documents || payload?.documents || [],
      training: source?.training || payload?.training || [],
      rosters: source?.rosters || payload?.rosters || [],
      payroll: source?.payroll || payload?.payroll || [],
      performance: source?.performance || payload?.performance || [],
      activity: source?.activity || source?.timeline || payload?.activity || payload?.timeline || [],
    },
  }
}

export default function HRStaffInPageModalBridge({ employees = [] }: { employees?: StaffRow[] }) {
  const [selected, setSelected] = useState<StaffRow | null>(null)
  const [draft, setDraft] = useState<StaffRow>({})
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<TabKey>('profile')

  const employeeMap = useMemo(() => {
    const map = new Map<string, StaffRow>()
    ;(employees || []).forEach((employee) => {
      idKeys(employee).forEach((key) => map.set(key, employee))
    })
    return map
  }, [employees])

  const loadStaff = useCallback(async (id: string, row?: StaffRow | null) => {
    const fallback = row || employeeMap.get(id.toLowerCase()) || null
    if (fallback) {
      setSelected(fallback)
      setDraft(fallback)
    } else {
      setSelected({ id })
      setDraft({ id })
    }
    setLoading(true)
    setEditing(false)
    setError('')
    setTab('profile')

    try {
      const lookup = encodeURIComponent(id)
      const response = await fetch(`/api/hr/employees?id=${lookup}`, { cache: 'no-store' })
      const payload = await safeJson(response)
      if (response.ok && payload?.ok !== false) {
        const normalized = normalizeApiPayload(id, payload, fallback)
        setSelected(normalized)
        setDraft(normalized)
      } else if (!fallback) {
        setError(payload?.error || 'The staff profile could not be loaded from the live API.')
      }
    } catch (err: any) {
      if (!fallback) setError(err?.message || 'The staff profile could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [employeeMap])

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const anchor = target?.closest?.('a[href*="/hr/staff/"]') as HTMLAnchorElement | null
      if (!anchor) return
      const href = anchor.getAttribute('href') || ''
      const id = extractStaffIdFromHref(href)
      if (!id) return
      event.preventDefault()
      event.stopPropagation()
      loadStaff(id, employeeMap.get(id.toLowerCase()) || null)
    }
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [employeeMap, loadStaff])

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selected) setSelected(null)
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [selected])

  if (!selected) return null

  const id = pick(selected, ['id', 'staff_id', 'employee_id', 'profile_id'], '')
  const fullName = pick(draft, ['full_name', 'name', 'display_name', 'employee_name', 'email'], 'Unnamed employee')
  const email = pick(draft, ['email', 'work_email', 'primary_email'], '')
  const phone = pick(draft, ['phone', 'mobile', 'phone_number'], '')
  const department = pick(draft, ['department', 'department_name'], '')
  const position = pick(draft, ['position', 'job_title', 'role'], '')
  const city = pick(draft, ['city', 'location', 'work_city', 'work_location'], '')
  const status = pick(draft, ['employment_status', 'status'], 'active')
  const sync = selected.__sync || {}
  const relations = selected.__relations || {}
  const readiness = Number(sync.readiness ?? selected.readiness ?? 0)
  const risk = Number(sync.risk ?? selected.risk ?? 0)

  const update = (key: string, value: string) => setDraft((prev) => ({ ...prev, [key]: value }))

  async function save() {
    if (!id) { setError('No employee id found for this staff record.'); return }
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/hr/employees', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...draft }),
      })
      const payload = await safeJson(response)
      if (!response.ok || payload?.ok === false) throw new Error(payload?.error || `Save failed (${response.status})`)
      const next = normalizeApiPayload(id, payload, { ...selected, ...draft })
      setSelected(next)
      setDraft(next)
      setEditing(false)
      window.dispatchEvent(new CustomEvent('angelcare:hr-employee-updated', { detail: { id } }))
    } catch (err: any) {
      setError(err?.message || 'Unable to save staff file.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteEmployee() {
    if (!id) { setError('No employee id found for deletion.'); return }
    const typed = window.prompt(`This will delete ${fullName} from HR staff records and linked app profile tables where possible. Type DELETE to confirm.`)
    if (typed !== 'DELETE') return
    setDeleting(true)
    setError('')
    try {
      const response = await fetch('/api/hr/employees', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, email, full_delete: true }),
      })
      const payload = await safeJson(response)
      if (!response.ok || payload?.ok === false) throw new Error(payload?.error || `Delete failed (${response.status})`)
      setSelected(null)
      window.location.reload()
    } catch (err: any) {
      setError(err?.message || 'Unable to delete employee.')
    } finally {
      setDeleting(false)
    }
  }

  const metricCards = [
    ['Attendance', sync.attendance ?? relations.attendance?.length, CalendarCheck, 'Punches and presence records'],
    ['Contracts', sync.contracts ?? relations.contracts?.length, ShieldCheck, 'Contract/legal files'],
    ['Documents', sync.documents ?? relations.documents?.length, FileBadge2, 'Compliance documents'],
    ['Training', sync.training ?? relations.training?.length, GraduationCap, 'Learning and certificates'],
    ['Rosters', sync.roster ?? relations.rosters?.length, Workflow, 'Schedule assignments'],
    ['Payroll', sync.payroll ?? relations.payroll?.length, WalletCards, 'Payroll input chain'],
    ['Performance', sync.performance ?? relations.performance?.length, BadgeCheck, 'Reviews and scorecards'],
    ['Activity', sync.activity ?? relations.activity?.length, Activity, 'Audit timeline events'],
  ] as const

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/55 p-3 backdrop-blur-md lg:p-6" role="dialog" aria-modal="true">
      <div className="mx-auto flex h-[calc(100vh-24px)] max-w-[1580px] flex-col overflow-hidden rounded-[38px] border border-white/70 bg-slate-50 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-violet-600 to-cyan-500 text-xl font-black text-white shadow-xl">{initials(fullName)}</div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Pill className="border-emerald-200 bg-emerald-50 text-emerald-700"><DatabaseZap className="mr-1 h-3.5 w-3.5" />Live synced staff file</Pill>
                <Pill className={statusTone(status)}>{status || 'active'}</Pill>
                {loading ? <Pill className="border-cyan-200 bg-cyan-50 text-cyan-700">Loading live data...</Pill> : null}
              </div>
              <h2 className="mt-1 truncate text-2xl font-black tracking-tight text-slate-950 lg:text-4xl">{fullName}</h2>
              <p className="truncate text-sm font-bold text-slate-600">{email || 'No email'} · {department || 'No department'} · {city || 'No location'}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {error ? <span className="max-w-md rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">{error}</span> : null}
            <button onClick={() => { setEditing(true); setError('') }} className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3 text-sm font-black text-violet-700"><Edit3 className="mr-2 inline h-4 w-4" />Edit</button>
            <button disabled={!editing || saving} onClick={save} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40"><Save className="mr-2 inline h-4 w-4" />{saving ? 'Saving...' : 'Save'}</button>
            <button onClick={() => editing ? (setDraft(selected), setEditing(false), setError('')) : setSelected(null)} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">Cancel</button>
            <button disabled={deleting} onClick={deleteEmployee} className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-black text-rose-700 disabled:opacity-50"><Trash2 className="mr-2 inline h-4 w-4" />{deleting ? 'Deleting...' : 'Delete'}</button>
            <button onClick={() => setSelected(null)} className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 hover:text-slate-950"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 lg:p-8">
          <div className="mb-5 flex flex-wrap gap-2">
            {(['profile', 'operations', 'compliance', 'activity'] as TabKey[]).map((item) => (
              <button key={item} onClick={() => setTab(item)} className={`rounded-2xl px-4 py-2 text-sm font-black capitalize ${tab === item ? 'bg-slate-950 text-white shadow-xl' : 'border border-slate-200 bg-white text-slate-700'}`}>{item}</button>
            ))}
          </div>

          {tab === 'profile' ? (
            <div className="grid gap-5 xl:grid-cols-12">
              <section className="rounded-[34px] border border-white bg-white p-5 shadow-xl shadow-slate-200/60 xl:col-span-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><div className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-500">Staff identity</div><h3 className="mt-1 text-2xl font-black text-slate-950">Personal, account and organization profile</h3><p className="mt-1 text-sm font-semibold text-slate-500">These are the real fields attached to this selected employee row and saved through the HR employees API.</p></div>
                  <Pill className="border-cyan-200 bg-cyan-50 text-cyan-700">ID: {id || 'missing'}</Pill>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Field label="Full name" editing={editing} value={pick(draft, ['full_name', 'name', 'display_name', 'employee_name'], '')} onChange={(v) => update('full_name', v)} />
                  <Field label="Email" editing={editing} value={email} onChange={(v) => update('email', v)} />
                  <Field label="Phone" editing={editing} value={phone} onChange={(v) => update('phone', v)} />
                  <Field label="Department" editing={editing} value={department} onChange={(v) => update('department', v)} />
                  <Field label="Position / role" editing={editing} value={position} onChange={(v) => update('position', v)} />
                  <Field label="City / location" editing={editing} value={city} onChange={(v) => { update('city', v); update('location', v) }} />
                  <Field label="Status" editing={editing} value={status} onChange={(v) => { update('employment_status', v); update('status', v) }} />
                  <Field label="Start date" type="date" editing={editing} value={pick(draft, ['start_date', 'hire_date'], '')} onChange={(v) => update('start_date', v)} />
                  <Field label="Manager" editing={editing} value={pick(draft, ['manager', 'reports_to'], '')} onChange={(v) => update('manager', v)} />
                </div>
              </section>

              <aside className="space-y-5 xl:col-span-4">
                <div className="rounded-[34px] border border-slate-950 bg-slate-950 p-5 text-white shadow-xl">
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/50">Readiness cockpit</div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-3xl bg-white/10 p-4"><div className="text-xs font-black text-white/50">Readiness</div><div className="mt-2 text-4xl font-black">{Math.round(readiness)}%</div></div>
                    <div className="rounded-3xl bg-white/10 p-4"><div className="text-xs font-black text-white/50">Risk</div><div className="mt-2 text-4xl font-black">{Math.round(risk)}%</div></div>
                  </div>
                  <div className="mt-4 h-3 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300" style={{ width: `${Math.max(0, Math.min(100, readiness))}%` }} /></div>
                </div>
                <div className="rounded-[34px] border border-white bg-white p-5 shadow-xl shadow-slate-200/60">
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-500">Quick contact</div>
                  <div className="mt-4 space-y-3 text-sm font-bold text-slate-700">
                    <div><Mail className="mr-2 inline h-4 w-4 text-violet-600" />{email || '—'}</div>
                    <div><Phone className="mr-2 inline h-4 w-4 text-violet-600" />{phone || '—'}</div>
                    <div><MapPin className="mr-2 inline h-4 w-4 text-violet-600" />{city || '—'}</div>
                    <div><BriefcaseBusiness className="mr-2 inline h-4 w-4 text-violet-600" />{position || '—'}</div>
                    <div><Building2 className="mr-2 inline h-4 w-4 text-violet-600" />{department || '—'}</div>
                  </div>
                </div>
              </aside>
            </div>
          ) : null}

          {tab === 'operations' ? (
            <section className="rounded-[34px] border border-white bg-white p-5 shadow-xl shadow-slate-200/60">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-500">Synced operating layers</div><h3 className="mt-1 text-2xl font-black text-slate-950">HR, users, attendance, payroll and workforce coverage</h3></div><Pill className="border-emerald-200 bg-emerald-50 text-emerald-700"><DatabaseZap className="mr-1 h-3.5 w-3.5" />Live counts from command data</Pill></div>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{metricCards.map(([title, value, Icon, detail]) => <MetricCard key={title} icon={Icon} title={title} value={value} detail={detail} />)}</div>
            </section>
          ) : null}

          {tab === 'compliance' ? (
            <section className="grid gap-5 lg:grid-cols-3">
              <div className="rounded-[30px] border border-emerald-100 bg-emerald-50 p-5"><div className="text-sm font-black text-emerald-800"><UserRoundCheck className="mr-2 inline h-4 w-4" />Users identity</div><p className="mt-2 text-xs font-bold leading-5 text-emerald-700">The file opens from the selected HR employee row and keeps the app user/staff identity keys attached.</p></div>
              <div className="rounded-[30px] border border-violet-100 bg-violet-50 p-5"><div className="text-sm font-black text-violet-800"><Save className="mr-2 inline h-4 w-4" />Live save</div><p className="mt-2 text-xs font-bold leading-5 text-violet-700">Save writes to the HR employees API with schema fallbacks so strict existing tables do not crash the page.</p></div>
              <div className="rounded-[30px] border border-rose-100 bg-rose-50 p-5"><div className="text-sm font-black text-rose-800"><AlertTriangle className="mr-2 inline h-4 w-4" />Delete control</div><p className="mt-2 text-xs font-bold leading-5 text-rose-700">Delete requires typing DELETE and attempts to remove the employee from HR staff, app users/profiles, and directly linked operational records when the schema allows it.</p></div>
            </section>
          ) : null}

          {tab === 'activity' ? (
            <section className="rounded-[34px] border border-white bg-white p-5 shadow-xl shadow-slate-200/60">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-500">Activity timeline</div>
              <h3 className="mt-1 text-2xl font-black text-slate-950">Latest linked staff events</h3>
              <div className="mt-5 space-y-3">
                {(relations.activity || []).slice(0, 8).map((item: any, index: number) => <div key={item.id || index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-sm font-black text-slate-950">{pick(item, ['title', 'event', 'action', 'status'], 'Activity event')}</div><div className="mt-1 text-xs font-bold text-slate-500">{pick(item, ['description', 'notes', 'created_at'], '')}</div></div>)}
                {!(relations.activity || []).length ? <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-black text-slate-500">No linked activity rows were returned for this employee yet.</div> : null}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}
