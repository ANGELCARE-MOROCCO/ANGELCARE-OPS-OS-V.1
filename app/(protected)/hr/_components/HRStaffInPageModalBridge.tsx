'use client'

import { useEffect, useMemo, useState } from 'react'
import { X, Edit3, Save, Mail, Phone, MapPin, BriefcaseBusiness, Building2, CalendarCheck, FileBadge2, GraduationCap, WalletCards, Workflow, BadgeCheck, Activity, ShieldCheck, AlertTriangle, DatabaseZap } from 'lucide-react'

type StaffRow = Record<string, any>

function pick(row: StaffRow | null | undefined, keys: string[], fallback = '—') {
  if (!row) return fallback
  for (const key of keys) {
    const value = row?.[key]
    if (value !== null && value !== undefined && String(value).trim()) return String(value)
  }
  return fallback
}
function statusTone(status: string) {
  const s = status.toLowerCase()
  if (s.includes('archiv') || s.includes('inactive') || s.includes('terminated')) return 'border-slate-200 bg-slate-100 text-slate-600'
  if (s.includes('pending') || s.includes('trial') || s.includes('draft')) return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}
function Pill({ children, className = '' }: { children: any; className?: string }) {
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black ${className}`}>{children}</span>
}
function Field({ label, value, onChange, editing, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; editing: boolean; type?: string }) {
  return <label className="block rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
    <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</span>
    {editing ? <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} className="mt-2 h-10 w-full bg-transparent text-sm font-black text-slate-950 outline-none" /> : <div className="mt-2 min-h-10 text-sm font-black text-slate-950">{value || '—'}</div>}
  </label>
}
function MetricCard({ icon: Icon, label, value, detail }: any) {
  return <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between"><div className="rounded-2xl bg-violet-50 p-2 text-violet-700"><Icon className="h-5 w-5" /></div><div className="text-2xl font-black text-slate-950">{value ?? 0}</div></div>
    <div className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</div>
    <div className="mt-1 text-xs font-bold text-slate-500">{detail}</div>
  </div>
}

export default function HRStaffInPageModalBridge({ employees }: { employees: StaffRow[] }) {
  const [selected, setSelected] = useState<StaffRow | null>(null)
  const [draft, setDraft] = useState<StaffRow>({})
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const byId = useMemo(() => {
    const map = new Map<string, StaffRow>()
    ;(employees || []).forEach((employee) => {
      const id = pick(employee, ['id'], '')
      if (id && id !== '—') map.set(String(id), employee)
    })
    return map
  }, [employees])

  useEffect(() => {
    function handler(event: MouseEvent) {
      const target = event.target as HTMLElement | null
      const anchor = target?.closest?.('a[href^="/hr/staff/"]') as HTMLAnchorElement | null
      if (!anchor) return
      const href = anchor.getAttribute('href') || ''
      const match = href.match(/^\/hr\/staff\/([^/?#]+)/)
      const staffId = match?.[1]
      if (!staffId) return
      const staff = byId.get(staffId)
      if (!staff) return
      event.preventDefault()
      event.stopPropagation()
      setSelected(staff)
      setDraft(staff)
      setEditing(false)
      setError('')
    }
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [byId])

  useEffect(() => {
    function closeOnEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', closeOnEsc)
    return () => window.removeEventListener('keydown', closeOnEsc)
  }, [])

  if (!selected) return null

  const id = pick(selected, ['id'], '')
  const fullName = pick(draft, ['full_name', 'name', 'email'], 'Unnamed employee')
  const initials = fullName.slice(0, 2).toUpperCase()
  const readiness = Number(selected.__sync?.readiness || 0)
  const risk = Number(selected.__sync?.risk || 0)
  const update = (key: string, value: string) => setDraft((prev) => ({ ...prev, [key]: value }))

  async function save() {
    if (!id || id === '—') { setError('No employee id was found for this row.'); return }
    setSaving(true); setError('')
    try {
      const response = await fetch('/api/hr/employees', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...draft }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) throw new Error(payload?.error || `Save failed (${response.status})`)
      setSelected((prev) => ({ ...(prev || {}), ...draft }))
      setEditing(false)
      window.dispatchEvent(new CustomEvent('angelcare:hr-employee-updated', { detail: { id } }))
    } catch (err: any) {
      setError(err?.message || 'Unable to save this staff file')
    } finally {
      setSaving(false)
    }
  }

  const sync = selected.__sync || {}
  const cards = [
    ['Attendance', sync.attendance || 0, CalendarCheck, 'Punch records'],
    ['Documents', sync.documents || 0, FileBadge2, 'Compliance files'],
    ['Contracts', sync.contracts || 0, ShieldCheck, 'Legal chain'],
    ['Payroll', sync.payroll || 0, WalletCards, 'Payroll readiness'],
    ['Rosters', sync.roster || 0, Workflow, 'Schedule coverage'],
    ['Training', sync.training || 0, GraduationCap, 'Academy learning'],
    ['Performance', sync.performance || 0, BadgeCheck, 'Review history'],
    ['Activity', sync.activity || 0, Activity, 'Timeline events'],
  ] as const

  return <div className="fixed inset-0 z-[9999] bg-slate-950/55 p-3 backdrop-blur-md lg:p-6" role="dialog" aria-modal="true">
    <div className="mx-auto flex h-[calc(100vh-24px)] max-w-[1540px] flex-col overflow-hidden rounded-[36px] border border-white/60 bg-slate-50 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-violet-600 to-cyan-500 text-xl font-black text-white shadow-xl">{initials}</div>
          <div>
            <div className="flex flex-wrap items-center gap-2"><Pill className="border-emerald-200 bg-emerald-50 text-emerald-700">Live staff file</Pill><Pill className="border-violet-200 bg-violet-50 text-violet-700">HR + Users synced</Pill><Pill className={statusTone(pick(selected, ['employment_status','status'], 'active'))}>{pick(selected, ['employment_status','status'], 'active')}</Pill></div>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 lg:text-4xl">{fullName}</h2>
            <p className="text-sm font-bold text-slate-500">{pick(selected, ['email','phone'], 'No contact')} · {pick(selected, ['department'], 'No department')} · {pick(selected, ['city','location'], 'No location')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {error ? <span className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">{error}</span> : null}
          <button onClick={() => { setEditing(true); setError('') }} className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3 text-sm font-black text-violet-700"><Edit3 className="mr-2 inline h-4 w-4" />Edit</button>
          <button disabled={!editing || saving} onClick={save} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40"><Save className="mr-2 inline h-4 w-4" />{saving ? 'Saving...' : 'Save'}</button>
          <button onClick={() => editing ? (setDraft(selected), setEditing(false), setError('')) : setSelected(null)} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">Cancel</button>
          <button onClick={() => setSelected(null)} className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 hover:text-slate-950"><X className="h-5 w-5" /></button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5 lg:p-8">
        <div className="grid gap-5 xl:grid-cols-12">
          <section className="xl:col-span-8 rounded-[32px] border border-white bg-white p-5 shadow-xl shadow-slate-200/60">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-500">Staff identity</div><h3 className="mt-1 text-2xl font-black text-slate-950">Personal, account and organization file</h3><p className="mt-1 text-sm font-semibold text-slate-500">Edit/save updates the HR employee record through the live employees API.</p></div><Pill className="border-cyan-200 bg-cyan-50 text-cyan-700">In-page modal active</Pill></div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Full name" editing={editing} value={pick(draft, ['full_name','name'], '')} onChange={(v) => update('full_name', v)} />
              <Field label="Email" editing={editing} value={pick(draft, ['email'], '')} onChange={(v) => update('email', v)} />
              <Field label="Phone" editing={editing} value={pick(draft, ['phone'], '')} onChange={(v) => update('phone', v)} />
              <Field label="Department" editing={editing} value={pick(draft, ['department'], '')} onChange={(v) => update('department', v)} />
              <Field label="Position" editing={editing} value={pick(draft, ['position','job_title','role'], '')} onChange={(v) => update('position', v)} />
              <Field label="City / Location" editing={editing} value={pick(draft, ['city','location'], '')} onChange={(v) => update('city', v)} />
              <Field label="Status" editing={editing} value={pick(draft, ['employment_status','status'], 'active')} onChange={(v) => update('employment_status', v)} />
              <Field label="Start date" editing={editing} type="date" value={pick(draft, ['start_date','hire_date'], '')} onChange={(v) => update('start_date', v)} />
              <Field label="Manager" editing={editing} value={pick(draft, ['manager','reports_to'], '')} onChange={(v) => update('manager', v)} />
            </div>
          </section>

          <aside className="xl:col-span-4 space-y-5">
            <div className="rounded-[32px] border border-slate-950 bg-slate-950 p-5 text-white shadow-xl">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/50">Readiness cockpit</div>
              <div className="mt-3 grid grid-cols-2 gap-3"><div className="rounded-3xl bg-white/10 p-4"><div className="text-xs font-black text-white/50">Readiness</div><div className="mt-2 text-4xl font-black">{Math.round(readiness)}%</div></div><div className="rounded-3xl bg-white/10 p-4"><div className="text-xs font-black text-white/50">Risk</div><div className="mt-2 text-4xl font-black">{Math.round(risk)}%</div></div></div>
              <div className="mt-4 h-3 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300" style={{ width: `${Math.max(5, Math.min(100, readiness))}%` }} /></div>
            </div>
            <div className="rounded-[32px] border border-white bg-white p-5 shadow-xl shadow-slate-200/60">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-500">Quick contact</div>
              <div className="mt-4 space-y-3 text-sm font-bold text-slate-600"><div><Mail className="mr-2 inline h-4 w-4 text-violet-600" />{pick(selected, ['email'], '—')}</div><div><Phone className="mr-2 inline h-4 w-4 text-violet-600" />{pick(selected, ['phone'], '—')}</div><div><MapPin className="mr-2 inline h-4 w-4 text-violet-600" />{pick(selected, ['city','location'], '—')}</div><div><BriefcaseBusiness className="mr-2 inline h-4 w-4 text-violet-600" />{pick(selected, ['position','job_title','role'], '—')}</div><div><Building2 className="mr-2 inline h-4 w-4 text-violet-600" />{pick(selected, ['department'], '—')}</div></div>
            </div>
          </aside>
        </div>

        <section className="mt-5 rounded-[32px] border border-white bg-white p-5 shadow-xl shadow-slate-200/60">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-500">Synced operating layers</div><h3 className="mt-1 text-2xl font-black text-slate-950">HR, users, attendance, payroll and compliance coverage</h3></div><Pill className="border-emerald-200 bg-emerald-50 text-emerald-700"><DatabaseZap className="mr-1 h-3.5 w-3.5" />Live synced</Pill></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map(([label, val, Icon, detail]) => <MetricCard key={label} icon={Icon} label={label} value={val} detail={detail} />)}</div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-3">
          <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-5"><div className="text-sm font-black text-emerald-800">Linked identity</div><p className="mt-2 text-xs font-bold leading-5 text-emerald-700">This modal is attached to the existing HR employees page through click interception, so both the staff name link and black Open button launch the same in-page staff file.</p></div>
          <div className="rounded-[28px] border border-violet-100 bg-violet-50 p-5"><div className="text-sm font-black text-violet-800">Live save</div><p className="mt-2 text-xs font-bold leading-5 text-violet-700">Save calls PATCH /api/hr/employees and keeps the record aligned with HR production tables when your schema accepts the fields.</p></div>
          <div className="rounded-[28px] border border-amber-100 bg-amber-50 p-5"><div className="text-sm font-black text-amber-800"><AlertTriangle className="mr-2 inline h-4 w-4" />Production note</div><p className="mt-2 text-xs font-bold leading-5 text-amber-700">If a field does not exist in your current table, the API will fall back to the compatible subset instead of crashing.</p></div>
        </section>
      </div>
    </div>
  </div>
}
