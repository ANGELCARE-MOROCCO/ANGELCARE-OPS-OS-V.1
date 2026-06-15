'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CalendarCheck,
  FileBadge2,
  Gauge,
  GraduationCap,
  Save,
  ShieldCheck,
  Trash2,
  Users,
  WalletCards,
  Workflow,
  X,
} from 'lucide-react'
import Link from 'next/link'

type Row = Record<string, any>

type DepartmentCommand = {
  id: string
  name: string
  manager: string
  count: number
  teams: number
  openRoles: number
  readiness: number
  risk: number
  engagement: number
  performance: number
  turnover: number
  status: string
  employees: Row[]
  cities: { name: string; count: number }[]
  roles: { name: string; count: number }[]
}

function Pill({ children, tone = 'violet' }: { children: React.ReactNode; tone?: 'violet' | 'emerald' | 'rose' | 'cyan' | 'amber' | 'slate' }) {
  const tones = {
    violet: 'border-violet-100 bg-violet-50 text-violet-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    rose: 'border-rose-100 bg-rose-50 text-rose-700',
    cyan: 'border-cyan-100 bg-cyan-50 text-cyan-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-600',
  }

  return <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black ${tones[tone]}`}>{children}</span>
}

function initials(name: string) {
  return name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase() || 'AC'
}

function text(row: Row | null | undefined, keys: string[], fallback = '—') {
  if (!row) return fallback
  for (const key of keys) {
    const value = row?.[key]
    if (value !== null && value !== undefined && String(value).trim()) return String(value).trim()
  }
  return fallback
}

function Progress({ value, tone = 'violet' }: { value: number; tone?: 'violet' | 'emerald' | 'rose' | 'cyan' | 'amber' }) {
  const bg = {
    violet: 'from-violet-600 to-fuchsia-500',
    emerald: 'from-emerald-500 to-cyan-500',
    rose: 'from-rose-500 to-amber-400',
    cyan: 'from-cyan-500 to-blue-500',
    amber: 'from-amber-400 to-orange-500',
  }[tone]

  return (
    <div className="h-2 rounded-full bg-slate-100">
      <div className={`h-full rounded-full bg-gradient-to-r ${bg}`} style={{ width: `${Math.max(3, Math.min(100, Number(value || 0)))}%` }} />
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none ring-violet-100 focus:ring-4"
      />
    </label>
  )
}


function rememberDeletedDepartment(name: string) {
  const normalized = encodeURIComponent(String(name || '').trim())
  if (!normalized) return

  const existing = document.cookie
    .split('; ')
    .find((row) => row.startsWith('angelcare_deleted_departments='))
    ?.split('=')[1] || ''

  const values = new Set(existing.split('|').filter(Boolean))
  values.add(normalized)

  document.cookie = `angelcare_deleted_departments=${Array.from(values).join('|')}; path=/; max-age=31536000; SameSite=Lax`
}

function forgetDeletedDepartment(name: string) {
  const normalized = encodeURIComponent(String(name || '').trim())
  const existing = document.cookie
    .split('; ')
    .find((row) => row.startsWith('angelcare_deleted_departments='))
    ?.split('=')[1] || ''

  const values = existing.split('|').filter(Boolean).filter((item) => item !== normalized)
  document.cookie = `angelcare_deleted_departments=${values.join('|')}; path=/; max-age=31536000; SameSite=Lax`
}

export default function DepartmentFilesManagerClient({ departments }: { departments: DepartmentCommand[] }) {
  const [rows, setRows] = useState<DepartmentCommand[]>(departments)
  const [selected, setSelected] = useState<DepartmentCommand | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [message, setMessage] = useState('')

  const active = selected
  const totalEmployees = useMemo(() => rows.reduce((sum, dept) => sum + Number(dept.count || 0), 0), [rows])

  function open(dept: DepartmentCommand) {
    setSelected(dept)
    setForm({
      name: dept.name || '',
      manager: dept.manager || '',
      status: dept.status || 'active',
      code: '',
      mission: '',
    })
    setConfirmDelete(false)
    setMessage('')
  }

  function patch(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function saveDepartment() {
    if (!active) return

    try {
      setSaving(true)
      setMessage('Saving department changes...')

      const response = await fetch('/api/hr/departments-command', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: active.id,
          oldName: active.name,
          name: form.name,
          manager: form.manager,
          status: form.status,
          code: form.code,
          mission: form.mission,
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || `Save failed (${response.status})`)
      }

      forgetDeletedDepartment(form.name)
      const nextRows = rows.map((dept) =>
        dept.id === active.id || dept.name === active.name
          ? { ...dept, name: form.name, manager: form.manager, status: form.status }
          : dept,
      )

      setRows(nextRows)
      setSelected((current) => current ? { ...current, name: form.name, manager: form.manager, status: form.status } : current)
      setMessage('Department saved. Refreshing synced HR views...')
      window.setTimeout(() => window.location.reload(), 650)
    } catch (error: any) {
      setMessage(error?.message || 'Unable to save department.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteDepartment() {
    if (!active) return

    if (!confirmDelete) {
      setConfirmDelete(true)
      setMessage('Click confirm delete to permanently remove this department and clear linked HR references.')
      return
    }

    try {
      setSaving(true)
      setMessage('Deleting department permanently...')

      const params = new URLSearchParams({
        id: active.id || '',
        name: active.name || '',
      })

      const response = await fetch(`/api/hr/departments-command?${params.toString()}`, {
        method: 'DELETE',
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || `Delete failed (${response.status})`)
      }

      rememberDeletedDepartment(active.name)
      setRows((current) => current.filter((dept) => dept.id !== active.id && dept.name !== active.name))
      setSelected(null)
      setConfirmDelete(false)
      setMessage('Department removed everywhere. Refreshing synced HR dashboard...')
      window.setTimeout(() => window.location.reload(), 350)
    } catch (error: any) {
      setMessage(error?.message || 'Unable to delete department.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <section className="space-y-4">
        <div className="flex flex-col gap-3 rounded-[34px] border border-white/80 bg-white p-5 shadow-xl shadow-slate-200/60 ring-1 ring-slate-100 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-violet-700">Department 360 directory</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Live clickable department files</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">
              Click any department to open its live file, edit it, or permanently delete it from synced HR structure.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill tone="emerald">{rows.length} live records</Pill>
            <Pill tone="cyan">{totalEmployees} mapped employees</Pill>
          </div>
        </div>

        {rows.map((dept, index) => (
          <button
            key={`${dept.id}-${dept.name}`}
            type="button"
            onClick={() => open(dept)}
            className="group block w-full overflow-hidden rounded-[30px] border border-white/80 bg-white text-left shadow-xl shadow-slate-200/60 ring-1 ring-slate-100 transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-2xl"
          >
            <div className="p-5">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-start gap-4">
                  <div className={`grid h-14 w-14 place-items-center rounded-3xl ${['bg-violet-50 text-violet-700','bg-cyan-50 text-cyan-700','bg-emerald-50 text-emerald-700','bg-amber-50 text-amber-700','bg-rose-50 text-rose-700'][index % 5]}`}>
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-black tracking-tight text-slate-950">{dept.name}</p>
                    <p className="mt-1 text-sm font-bold text-slate-500">
                      Lead: {dept.manager || 'Unassigned'} · {dept.count} employees · {dept.cities.length} cities
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Pill tone="emerald">Readiness {dept.readiness}%</Pill>
                      <Pill tone={dept.risk > 35 ? 'rose' : 'cyan'}>Risk {dept.risk}%</Pill>
                      <Pill tone="violet">{dept.openRoles} open roles</Pill>
                      <Pill tone="slate">Click to manage</Pill>
                    </div>
                  </div>
                </div>

                <div className="grid min-w-[420px] gap-3 md:grid-cols-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Performance</p>
                    <p className="mt-1 text-xl font-black text-slate-950">{dept.performance}%</p>
                    <Progress value={dept.performance} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Engagement</p>
                    <p className="mt-1 text-xl font-black text-slate-950">{dept.engagement}%</p>
                    <Progress value={dept.engagement} tone="cyan" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Risk</p>
                    <p className="mt-1 text-xl font-black text-slate-950">{dept.risk}%</p>
                    <Progress value={dept.risk} tone="rose" />
                  </div>
                </div>
              </div>
            </div>
          </button>
        ))}

        {!rows.length ? (
          <div className="rounded-[30px] border border-dashed border-slate-200 bg-white p-10 text-center">
            <Building2 className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-lg font-black text-slate-900">No department files remain.</p>
            <p className="mt-2 text-sm font-bold text-slate-500">Create a new department or map employees to a department.</p>
          </div>
        ) : null}
      </section>

      {active ? (
        <div className="fixed inset-0 z-[99999] bg-slate-950/65 p-4 backdrop-blur-xl">
          <div className="mx-auto flex max-h-[94vh] max-w-[1480px] flex-col overflow-hidden rounded-[38px] border border-white/80 bg-white shadow-[0_60px_220px_rgba(15,23,42,0.45)]">
            <header className="border-b border-slate-900 bg-slate-950 px-6 py-6 text-white">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-950">Department 360</span>
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">Live synced file</span>
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/70">ID {active.id}</span>
                  </div>
                  <h2 className="mt-4 truncate text-5xl font-black tracking-[-0.06em] text-white">{active.name}</h2>
                  <p className="mt-2 text-sm font-black text-white/60">{active.count} employees · {active.teams} teams · {active.cities.length} city zone(s)</p>
                  <div className="mt-4 grid max-w-3xl gap-2 sm:grid-cols-4">
                    <div className="rounded-2xl bg-white/10 px-4 py-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/45">Readiness</p>
                      <p className="mt-1 text-xl font-black text-white">{active.readiness}%</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 px-4 py-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/45">Risk</p>
                      <p className="mt-1 text-xl font-black text-white">{active.risk}%</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 px-4 py-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/45">Employees</p>
                      <p className="mt-1 text-xl font-black text-white">{active.count}</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 px-4 py-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/45">Teams</p>
                      <p className="mt-1 text-xl font-black text-white">{active.teams}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button disabled={saving} onClick={saveDepartment} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg disabled:opacity-50">
                    <Save className="mr-2 inline h-4 w-4" />
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                  <button disabled={saving} onClick={deleteDepartment} className={confirmDelete ? 'rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-rose-950/30' : 'rounded-2xl border border-rose-400/30 bg-rose-500/10 px-5 py-3 text-sm font-black text-rose-100'}>
                    <Trash2 className="mr-2 inline h-4 w-4" />
                    {confirmDelete ? 'Confirm permanent delete' : 'Delete permanently'}
                  </button>
                  <button onClick={() => setSelected(null)} className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-white/10 text-white shadow-sm hover:bg-white/20">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </header>

            {message ? (
              <div className="mx-6 mt-4 rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-sm font-black text-cyan-800">
                {message}
              </div>
            ) : null}

            <main className="overflow-auto bg-slate-50/70 p-6">
              <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-xl font-black text-slate-950">Edit department identity</h3>
                  <p className="mt-1 text-sm font-bold text-slate-500">Changes save to production and cascade department references.</p>

                  <div className="mt-5 grid gap-3">
                    <Field label="Department name" value={form.name || ''} onChange={(v) => patch('name', v)} />
                    <Field label="Manager / owner" value={form.manager || ''} onChange={(v) => patch('manager', v)} />
                    <Field label="Status" value={form.status || ''} onChange={(v) => patch('status', v)} />
                    <Field label="Code" value={form.code || ''} onChange={(v) => patch('code', v)} />
                    <Field label="Mission" value={form.mission || ''} onChange={(v) => patch('mission', v)} />
                  </div>

                  <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
                    Permanent delete removes the department record and clears matching department references from employees/structure records. It does not delete employees.
                  </div>
                </div>

                <div className="grid gap-5">
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-[24px] border border-violet-100 bg-violet-50 p-4 text-violet-800">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em]">Employees</p>
                      <p className="mt-2 text-3xl font-black text-slate-950">{active.count}</p>
                    </div>
                    <div className="rounded-[24px] border border-cyan-100 bg-cyan-50 p-4 text-cyan-800">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em]">Teams</p>
                      <p className="mt-2 text-3xl font-black text-slate-950">{active.teams}</p>
                    </div>
                    <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-4 text-emerald-800">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em]">Readiness</p>
                      <p className="mt-2 text-3xl font-black text-slate-950">{active.readiness}%</p>
                    </div>
                    <div className="rounded-[24px] border border-rose-100 bg-rose-50 p-4 text-rose-800">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em]">Risk</p>
                      <p className="mt-2 text-3xl font-black text-slate-950">{active.risk}%</p>
                    </div>
                  </div>

                  <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-xl font-black text-slate-950">Mapped employees</h3>
                    <div className="mt-4 grid max-h-[330px] gap-2 overflow-auto pr-1">
                      {active.employees.slice(0, 18).map((employee, index) => (
                        <div key={`${text(employee, ['id', 'email', 'full_name'], String(index))}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                          <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 text-xs font-black text-white">
                              {initials(text(employee, ['full_name', 'name', 'email'], 'AC'))}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">{text(employee, ['full_name', 'name', 'email'], 'Employee')}</p>
                              <p className="text-xs font-bold text-slate-500">{text(employee, ['position', 'job_title', 'role'], 'Role')} · {text(employee, ['city', 'location'], 'City')}</p>
                            </div>
                          </div>
                          <Pill tone="slate">{text(employee, ['status', 'employment_status'], 'active')}</Pill>
                        </div>
                      ))}

                      {!active.employees.length ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
                          No live employees are mapped to this department.
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                      <h3 className="text-lg font-black text-slate-950">Cities</h3>
                      <div className="mt-4 space-y-2">
                        {active.cities.slice(0, 8).map((city) => (
                          <div key={city.name} className="rounded-2xl bg-cyan-50 px-4 py-3 text-sm font-black text-cyan-800">
                            {city.name}
                            <span className="float-right">{city.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                      <h3 className="text-lg font-black text-slate-950">Roles</h3>
                      <div className="mt-4 space-y-2">
                        {active.roles.slice(0, 8).map((role) => (
                          <div key={role.name} className="rounded-2xl bg-violet-50 px-4 py-3 text-sm font-black text-violet-800">
                            {role.name}
                            <span className="float-right">{role.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-black text-slate-950">Department operation shortcuts</h3>
                    <div className="mt-4 grid gap-2 md:grid-cols-3">
                      {[
                        ['Attendance', '/hr/attendance', CalendarCheck],
                        ['Payroll', '/hr/payroll', WalletCards],
                        ['Documents', '/hr/documents', FileBadge2],
                        ['Training', '/hr/training', GraduationCap],
                        ['Performance', '/hr/performance-matrix', Gauge],
                        ['Schedules', '/hr/work-schedules', Workflow],
                      ].map(([label, href, Icon]: any) => (
                        <Link key={label} href={href} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:bg-violet-50">
                          <span className="flex items-center gap-2"><Icon className="h-4 w-4 text-violet-600" />{label}</span>
                          <ArrowUpRight className="h-4 w-4 text-slate-400" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </main>
          </div>
        </div>
      ) : null}
    </>
  )
}
