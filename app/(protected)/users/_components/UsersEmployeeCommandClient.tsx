'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'

export type UserStaffRecord = {
  id: string
  staffId: string | null
  initials: string
  fullName: string
  email: string
  username: string
  role: string
  department: string
  position: string
  city: string
  status: string
  language: string
  startDate: string
  manager: string
  phone: string
  lastLoginAt: string
  createdAt: string
  attendanceStatus: string
  punchInAt: string
  punchOutAt: string
  readiness: number
  risk: number
  coverage: {
    attendance: number
    documents: number
    contracts: number
    training: number
    rosters: number
    payroll: number
    leave: number
  }
  rawUser?: Record<string, any>
  rawStaff?: Record<string, any> | null
}

type EditableStaffFile = Pick<UserStaffRecord, 'fullName' | 'email' | 'username' | 'role' | 'department' | 'position' | 'city' | 'status' | 'language' | 'phone' | 'manager'>

const moduleCards = [
  ['Attendance', 'attendance', '/hr/attendance'],
  ['Leave', 'leave', '/hr/leave'],
  ['Payroll', 'payroll', '/hr/payroll'],
  ['Contracts', 'contracts', '/hr/contracts'],
  ['Documents', 'documents', '/hr/documents'],
  ['Training', 'training', '/hr/training'],
  ['Rosters', 'rosters', '/hr/rosters'],
] as const

const roles = ['ceo', 'manager', 'hr_admin', 'hr_manager', 'operations_manager', 'finance', 'compliance', 'market-officer', 'sca-officer', 'academy', 'agent']
const statuses = ['active', 'pending', 'inactive', 'suspended']

function nice(value?: string | null) {
  if (!value) return '—'
  return String(value).replaceAll('_', ' ').replaceAll('-', ' ').toUpperCase()
}

function date(value?: string | null) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('fr-MA', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
  } catch {
    return '—'
  }
}

function time(value?: string | null) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('fr-MA', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  } catch {
    return '—'
  }
}

function toEdit(user: UserStaffRecord): EditableStaffFile {
  return {
    fullName: user.fullName || '',
    email: user.email || '',
    username: user.username || '',
    role: user.role || 'agent',
    department: user.department || '',
    position: user.position || '',
    city: user.city || '',
    status: user.status || 'active',
    language: user.language || 'fr',
    phone: user.phone || '',
    manager: user.manager || '',
  }
}

function recompute(user: UserStaffRecord): UserStaffRecord {
  let score = 28
  if (user.status === 'active') score += 12
  if (user.email) score += 8
  if (user.department && user.department !== '—') score += 10
  if (user.position && user.position !== '—') score += 8
  if (user.coverage.documents > 0) score += 8
  if (user.coverage.contracts > 0) score += 8
  if (user.coverage.training > 0) score += 6
  if (user.coverage.rosters > 0) score += 5
  if (user.coverage.attendance > 0) score += 7
  const readiness = Math.max(0, Math.min(100, score))
  return { ...user, readiness, risk: Math.max(0, 100 - readiness) }
}

export default function UsersEmployeeCommandClient({ initialUsers, loadedAt }: { initialUsers: UserStaffRecord[]; loadedAt: string }) {
  const [users, setUsers] = useState(initialUsers)
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('all')
  const [status, setStatus] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<EditableStaffFile | null>(null)
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const selected = users.find((user) => user.id === selectedId) || null
  const departments = useMemo(() => Array.from(new Set(users.map((u) => u.department).filter(Boolean))).sort(), [users])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((user) => {
      const matchesQ = !q || [user.fullName, user.email, user.role, user.department, user.position, user.city].join(' ').toLowerCase().includes(q)
      const matchesDepartment = department === 'all' || user.department === department
      const matchesStatus = status === 'all' || user.status === status
      return matchesQ && matchesDepartment && matchesStatus
    })
  }, [users, query, department, status])

  const totals = useMemo(() => {
    const active = users.filter((u) => u.status === 'active').length
    const departmentsCount = new Set(users.map((u) => u.department).filter(Boolean)).size
    const cities = new Set(users.map((u) => u.city).filter(Boolean)).size
    const synced = users.reduce((total, user) => total + Object.values(user.coverage).reduce((a, b) => a + b, 0), 0)
    const avg = users.length ? Math.round(users.reduce((total, user) => total + user.readiness, 0) / users.length) : 0
    const risk = users.length ? Math.round(users.reduce((total, user) => total + user.risk, 0) / users.length) : 0
    return { active, departmentsCount, cities, synced, avg, risk }
  }, [users])

  function openStaff(user: UserStaffRecord) {
    setSelectedId(user.id)
    setDraft(toEdit(user))
    setEditing(false)
    setMessage('')
  }

  function startEdit() {
    if (!selected) return
    setDraft(toEdit(selected))
    setEditing(true)
    setMessage('')
  }

  function cancelEdit() {
    if (!selected) return
    setDraft(toEdit(selected))
    setEditing(false)
    setMessage('Modifications annulées.')
  }

  function updateDraft(key: keyof EditableStaffFile, value: string) {
    setDraft((current) => current ? { ...current, [key]: value } : current)
  }

  async function saveStaff() {
    if (!selected || !draft) return
    setMessage('')
    startTransition(async () => {
      try {
        const res = await fetch('/api/users/staff-file', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: selected.id, staffId: selected.staffId, patch: draft }),
        })
        const payload = await res.json().catch(() => ({}))
        if (!res.ok || payload?.ok === false) throw new Error(payload?.error || 'Save failed')
        setUsers((current) => current.map((user) => user.id === selected.id ? recompute({
          ...user,
          fullName: draft.fullName,
          email: draft.email,
          username: draft.username,
          role: draft.role,
          department: draft.department,
          position: draft.position,
          city: draft.city,
          status: draft.status,
          language: draft.language,
          phone: draft.phone,
          manager: draft.manager,
        }) : user))
        setEditing(false)
        setMessage('Staff file saved live and synced with Users + HR records.')
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('angelcare:users-staff-saved', { detail: { userId: selected.id } }))
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Unable to save staff file')
      }
    })
  }

  return (
    <main className="min-h-screen bg-[#f3f6fb] px-6 py-8 text-slate-950">
      <section className="rounded-[34px] border border-white/80 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex gap-2 text-xs font-black uppercase tracking-[0.22em]"><span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Real synced data</span><span className="rounded-full bg-violet-100 px-3 py-1 text-violet-700">Loaded {date(loadedAt)}</span></div>
            <h1 className="mt-4 text-5xl font-black tracking-[-0.05em]">Employees Command Center</h1>
            <p className="mt-3 max-w-4xl text-sm font-bold leading-6 text-slate-600">One-page operational workspace for employee control, profile quality, attendance mapping, leave pressure, payroll readiness, documents, contracts, training, rosters and performance.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/users/new" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-xl">+ Add employee</Link>
            <Link href="/hr/sync-center" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black">Sync center</Link>
            <Link href="/hr/reports/export" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black">Export</Link>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 text-sm font-black">
          {['Overview', 'Directory', 'Control', 'Attendance', 'Leave', 'Payroll', 'Docs', 'Performance', 'Actions'].map((item) => <span key={item} className="rounded-full border border-slate-200 bg-white px-4 py-2">{item}</span>)}
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Employees" value={users.length} sub={`${totals.active} active`} />
        <Kpi label="Departments" value={totals.departmentsCount} sub="Live org coverage" />
        <Kpi label="Cities" value={totals.cities} sub="Morocco workforce map" />
        <Kpi label="Readiness" value={`${totals.avg}%`} sub="Profile + records" />
        <Kpi label="Risk" value={`${totals.risk}%`} sub="Incomplete links" />
        <Kpi label="Synced records" value={totals.synced} sub="Related HR objects" />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_410px]">
        <div className="rounded-[34px] border border-white bg-white p-5 shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">Execution directory</p><h2 className="mt-2 text-2xl font-black">Live employee table</h2><p className="text-sm font-bold text-slate-600">Search, filter and open each real staff profile while seeing its synced operating records.</p></div>
            <div className="flex gap-2"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search employee..." className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-sky-400" /><select value={department} onChange={(e) => setDepartment(e.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold"><option value="all">All departments</option>{departments.map((d) => <option key={d} value={d}>{d}</option>)}</select><select value={status} onChange={(e) => setStatus(e.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold"><option value="all">All status</option>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-100">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-950 text-xs uppercase tracking-[0.18em] text-white"><tr><th className="p-4">Employee</th><th>Role</th><th>Dept / City</th><th>Status</th><th>Readiness</th><th>Sync coverage</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map((user) => <tr key={user.id} className="border-t border-slate-100 bg-white hover:bg-slate-50"><td className="p-4"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-sky-400 text-sm font-black text-white">{user.initials}</span><div><button onClick={() => openStaff(user)} className="text-left font-black hover:text-violet-700">{user.fullName}</button><p className="text-xs font-bold text-violet-700">{user.email || 'No email mapped'}</p></div></div></td><td className="font-black text-violet-700">{nice(user.role)}</td><td className="font-black text-violet-700"><div>{nice(user.department)}</div><span className="text-xs text-slate-500">{nice(user.city)}</span></td><td><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{user.status}</span></td><td><div className="flex items-center gap-3"><strong className="text-violet-700">{user.readiness}%</strong><div className="h-2 w-24 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-sky-400" style={{ width: `${user.readiness}%` }} /></div><span className="text-xs font-bold text-slate-500">risk {user.risk}%</span></div></td><td className="text-xs font-black text-violet-700">A:{user.coverage.attendance} L:{user.coverage.leave} P:{user.coverage.payroll} D:{user.coverage.documents}<br />C:{user.coverage.contracts} R:{user.coverage.rosters} T:{user.coverage.training}</td><td><div className="flex gap-2"><button onClick={() => openStaff(user)} className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white">Open</button><Link href={`/users/${user.id}/edit`} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black text-violet-700">Ops</Link></div></td></tr>)}
                {!filtered.length ? <tr><td colSpan={7} className="p-12 text-center font-black text-slate-500">No employee found.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[34px] bg-slate-950 p-6 text-white shadow-[0_22px_70px_rgba(15,23,42,0.18)]"><p className="text-xs font-black uppercase tracking-[0.25em] text-white/50">Control radar</p><h2 className="mt-2 text-2xl font-black">Readiness and risk</h2><p className="mt-1 text-sm font-bold text-white/60">Immediate view of profile and operational completeness.</p><div className="mt-6 space-y-4">{departments.slice(0, 6).map((d) => { const scoped = users.filter((u) => u.department === d); const avg = scoped.length ? Math.round(scoped.reduce((t, u) => t + u.readiness, 0) / scoped.length) : 0; return <div key={d}><div className="mb-2 flex justify-between text-xs font-black"><span>{nice(d)}</span><span>{scoped.length}/{users.length} · {avg}%</span></div><div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${avg}%` }} /></div></div> })}</div></div>
          <div className="rounded-[34px] border border-white bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)]"><p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">Morocco coverage</p><h2 className="mt-2 text-2xl font-black">City distribution</h2><div className="mt-5 space-y-3">{Array.from(new Set(users.map((u) => u.city).filter(Boolean))).slice(0, 8).map((city) => <div key={city} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black"><span>{nice(city)}</span><span>{users.filter((u) => u.city === city).length}</span></div>)}</div></div>
        </aside>
      </section>

      <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {moduleCards.slice(0, 4).map(([label, keyName, href]) => <Link key={label} href={href} className="rounded-[30px] border border-white bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)]"><div className="flex justify-between"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-50">↗</span><span className="font-black">↗</span></div><strong className="mt-6 block text-3xl font-black">{users.reduce((t, u) => t + Number(u.coverage[keyName]), 0)}</strong><p className="mt-1 font-black">{label}</p><p className="mt-2 text-xs font-bold text-slate-600">Open the linked execution space for real operations and validations.</p></Link>)}
      </section>

      {selected ? <StaffFileModal user={selected} draft={draft || toEdit(selected)} editing={editing} message={message} busy={isPending} onClose={() => setSelectedId(null)} onEdit={startEdit} onCancel={cancelEdit} onSave={saveStaff} onDraft={updateDraft} /> : null}
    </main>
  )
}

function Kpi({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return <div className="rounded-[28px] border border-white bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"><p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">{label}</p><strong className="mt-4 block text-3xl font-black">{value}</strong><span className="text-xs font-black text-slate-600">{sub}</span></div>
}

function Field({ label, value, edit, onChange, as = 'input', options }: { label: string; value: string; edit: boolean; onChange: (value: string) => void; as?: 'input' | 'select'; options?: string[] }) {
  return <label className="block"><span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</span>{edit ? (as === 'select' ? <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-violet-200 bg-white px-4 text-sm font-black outline-none focus:border-violet-500">{(options || []).map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-violet-200 bg-white px-4 text-sm font-black outline-none focus:border-violet-500" />) : <strong className="mt-2 block rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black">{value || '—'}</strong>}</label>
}

function StaffFileModal({ user, draft, editing, message, busy, onClose, onEdit, onCancel, onSave, onDraft }: { user: UserStaffRecord; draft: EditableStaffFile; editing: boolean; message: string; busy: boolean; onClose: () => void; onEdit: () => void; onCancel: () => void; onSave: () => void; onDraft: (key: keyof EditableStaffFile, value: string) => void }) {
  return <div className="fixed inset-0 z-[80] bg-slate-950/50 p-5 backdrop-blur-md"><div className="mx-auto flex h-full max-w-[1500px] flex-col overflow-hidden rounded-[36px] border border-white/20 bg-white shadow-[0_40px_120px_rgba(15,23,42,0.35)]"><div className="flex items-center justify-between border-b border-slate-100 px-7 py-5"><div className="flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-3xl bg-gradient-to-br from-violet-600 to-sky-400 text-lg font-black text-white">{user.initials}</span><div><p className="text-xs font-black uppercase tracking-[0.25em] text-violet-600">Live staff file</p><h2 className="text-3xl font-black tracking-[-0.04em]">{editing ? draft.fullName : user.fullName}</h2><p className="text-sm font-bold text-slate-500">Users + HR + attendance + documents + payroll synced cockpit</p></div></div><div className="flex items-center gap-3"><button onClick={onEdit} disabled={editing || busy} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black disabled:opacity-40">Edit</button><button onClick={onSave} disabled={!editing || busy} className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-lg disabled:opacity-40">{busy ? 'Saving…' : 'Save'}</button><button onClick={editing ? onCancel : onClose} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Cancel</button></div></div>
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 overflow-auto xl:grid-cols-[380px_minmax(0,1fr)]"><aside className="border-r border-slate-100 bg-slate-50/70 p-6"><div className="rounded-[30px] bg-slate-950 p-6 text-white"><p className="text-xs font-black uppercase tracking-[0.24em] text-white/50">Readiness</p><strong className="mt-2 block text-5xl font-black">{user.readiness}%</strong><div className="mt-4 h-3 rounded-full bg-white/10"><div className="h-3 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${user.readiness}%` }} /></div><p className="mt-3 text-sm font-bold text-white/60">Risk {user.risk}% · {user.coverage.attendance} attendance records · {user.coverage.documents} docs · {user.coverage.contracts} contracts</p></div><div className="mt-5 grid gap-3">{moduleCards.map(([label, keyName, href]) => <Link key={label} href={href} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-black shadow-sm"><span>{label}</span><span className="rounded-full bg-violet-50 px-3 py-1 text-violet-700">{user.coverage[keyName]}</span></Link>)}</div></aside>
      <section className="space-y-6 p-7"><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"><Field label="Full name" value={draft.fullName} edit={editing} onChange={(v) => onDraft('fullName', v)} /><Field label="Email" value={draft.email} edit={editing} onChange={(v) => onDraft('email', v)} /><Field label="Username" value={draft.username} edit={editing} onChange={(v) => onDraft('username', v)} /><Field label="Role" value={draft.role} edit={editing} onChange={(v) => onDraft('role', v)} as="select" options={roles} /><Field label="Status" value={draft.status} edit={editing} onChange={(v) => onDraft('status', v)} as="select" options={statuses} /><Field label="Language" value={draft.language} edit={editing} onChange={(v) => onDraft('language', v)} as="select" options={['fr', 'en', 'ar']} /><Field label="Department" value={draft.department} edit={editing} onChange={(v) => onDraft('department', v)} /><Field label="Position" value={draft.position} edit={editing} onChange={(v) => onDraft('position', v)} /><Field label="City / location" value={draft.city} edit={editing} onChange={(v) => onDraft('city', v)} /><Field label="Phone" value={draft.phone} edit={editing} onChange={(v) => onDraft('phone', v)} /><Field label="Manager" value={draft.manager} edit={editing} onChange={(v) => onDraft('manager', v)} /><Field label="Staff ID" value={user.staffId || 'Not mapped yet'} edit={false} onChange={() => null} /></div>
        <div className="grid gap-5 xl:grid-cols-3"><InfoCard title="Attendance state" value={nice(user.attendanceStatus)} sub={`In ${time(user.punchInAt)} · Out ${time(user.punchOutAt)}`} href="/hr/attendance" /><InfoCard title="HR profile" value={user.staffId ? 'Mapped' : 'User only'} sub="Linked to HR staff profile when staff ID exists." href="/hr/employees" /><InfoCard title="Start date" value={date(user.startDate)} sub={`Last login ${date(user.lastLoginAt)}`} href={`/users/${user.id}`} /></div>
        <div className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm"><h3 className="text-xl font-black">Operational timeline</h3><div className="mt-4 grid gap-3 text-sm font-bold text-slate-600"><p>• Staff file opened from Users Command Center.</p><p>• Save writes to app_users and linked hr_staff_profiles when mapped.</p><p>• HR sync center, attendance pages, employee profile and readiness counters refresh from the same data source.</p>{message ? <p className="rounded-2xl bg-emerald-50 p-4 font-black text-emerald-700">{message}</p> : null}</div></div>
      </section></div></div></div>
}

function InfoCard({ title, value, sub, href }: { title: string; value: string; sub: string; href: string }) {
  return <Link href={href} className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{title}</p><strong className="mt-3 block text-2xl font-black">{value}</strong><span className="mt-2 block text-xs font-bold text-slate-500">{sub}</span></Link>
}
