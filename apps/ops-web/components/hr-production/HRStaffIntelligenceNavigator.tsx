'use client'

import { useMemo, useState } from 'react'
import { Building2, MapPin, Search, UserCog, Users, ShieldCheck } from 'lucide-react'

type StaffItem = {
  id: string
  name: string
  department: string
  city: string
  role: string
  status: string
  risk: boolean
  pending: boolean
  active: boolean
}

type Mode = 'department' | 'city' | 'role' | 'status'

const modeMeta: Record<Mode, { label: string; icon: any; accent: string }> = {
  department: { label: 'Departments', icon: Building2, accent: 'from-violet-500 to-fuchsia-500' },
  city: { label: 'Cities', icon: MapPin, accent: 'from-cyan-500 to-blue-500' },
  role: { label: 'Roles', icon: UserCog, accent: 'from-emerald-500 to-teal-500' },
  status: { label: 'Status', icon: ShieldCheck, accent: 'from-amber-500 to-orange-500' },
}

const palette = [
  '#7c3aed',
  '#2563eb',
  '#06b6d4',
  '#14b8a6',
  '#22c55e',
  '#f59e0b',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#64748b',
]

function hash(value: string) {
  let h = 0
  for (let i = 0; i < value.length; i += 1) {
    h = value.charCodeAt(i) + ((h << 5) - h)
    h |= 0
  }
  return Math.abs(h)
}

function colorFor(value: string) {
  return palette[hash(value || 'unknown') % palette.length]
}

function groupKey(staff: StaffItem, mode: Mode) {
  if (mode === 'department') return staff.department || 'Unassigned department'
  if (mode === 'city') return staff.city || 'Location missing'
  if (mode === 'role') return staff.role || 'Role not specified'
  return staff.status || 'Unknown status'
}

function statusTone(staff: StaffItem) {
  if (staff.risk) return 'bg-rose-50 text-rose-700 border-rose-100'
  if (staff.pending) return 'bg-amber-50 text-amber-700 border-amber-100'
  if (staff.active) return 'bg-emerald-50 text-emerald-700 border-emerald-100'
  return 'bg-slate-50 text-slate-600 border-slate-100'
}

export default function HRStaffIntelligenceNavigator({ employees }: { employees: StaffItem[] }) {
  const [mode, setMode] = useState<Mode>('department')
  const [query, setQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [sort, setSort] = useState<'count' | 'az' | 'risk'>('count')

  const cleanEmployees = useMemo(
    () => employees.filter((employee) => employee && employee.id),
    [employees],
  )

  const filteredEmployees = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cleanEmployees.filter((employee) => {
      const key = groupKey(employee, mode)
      const matchGroup = selectedGroup === 'all' || key === selectedGroup
      const matchQuery = !q || [
        employee.name,
        employee.department,
        employee.city,
        employee.role,
        employee.status,
      ].some((value) => String(value || '').toLowerCase().includes(q))
      return matchGroup && matchQuery
    })
  }, [cleanEmployees, mode, query, selectedGroup])

  const groups = useMemo(() => {
    const map = new Map<string, StaffItem[]>()

    for (const employee of cleanEmployees) {
      const key = groupKey(employee, mode)
      map.set(key, [...(map.get(key) || []), employee])
    }

    let rows = [...map.entries()].map(([label, items]) => ({
      label,
      count: items.length,
      active: items.filter((item) => item.active).length,
      pending: items.filter((item) => item.pending).length,
      risk: items.filter((item) => item.risk).length,
      items,
    }))

    if (sort === 'count') rows = rows.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    if (sort === 'az') rows = rows.sort((a, b) => a.label.localeCompare(b.label))
    if (sort === 'risk') rows = rows.sort((a, b) => b.risk - a.risk || b.count - a.count)

    return rows
  }, [cleanEmployees, mode, sort])

  const selectedEmployees = selectedGroup === 'all'
    ? filteredEmployees
    : filteredEmployees.filter((employee) => groupKey(employee, mode) === selectedGroup)

  const activeCount = cleanEmployees.filter((employee) => employee.active).length
  const pendingCount = cleanEmployees.filter((employee) => employee.pending).length
  const riskCount = cleanEmployees.filter((employee) => employee.risk).length
  const coverage = cleanEmployees.length ? Math.round((activeCount / cleanEmployees.length) * 100) : 0
  const MetaIcon = modeMeta[mode].icon

  function changeMode(nextMode: Mode) {
    setMode(nextMode)
    setSelectedGroup('all')
  }

  return (
    <section className="col-span-12 overflow-hidden rounded-[30px] border border-white/80 bg-white/95 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 backdrop-blur-xl">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700">
            <Users className="h-3.5 w-3.5" />
            Live Staff Navigation
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-950">Staff Intelligence Navigator</h2>
          <p className="mt-1 text-sm font-bold text-slate-400">
            Sort and monitor live employee records by department, city, role and operational status.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
            Active<br /><span className="text-lg text-slate-950">{activeCount}</span>
          </div>
          <div className="rounded-2xl bg-amber-50 px-4 py-2 text-xs font-black text-amber-700">
            Pending<br /><span className="text-lg text-slate-950">{pendingCount}</span>
          </div>
          <div className="rounded-2xl bg-rose-50 px-4 py-2 text-xs font-black text-rose-700">
            Risk<br /><span className="text-lg text-slate-950">{riskCount}</span>
          </div>
        </div>
      </div>

      <div className="mb-5 grid gap-3 xl:grid-cols-[1fr_300px_180px]">
        <div className="flex flex-wrap gap-2 rounded-[22px] border border-slate-100 bg-slate-50 p-2">
          {(Object.keys(modeMeta) as Mode[]).map((key) => {
            const Icon = modeMeta[key].icon
            return (
              <button
                key={key}
                onClick={() => changeMode(key)}
                className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-black transition ${
                  mode === key
                    ? `bg-gradient-to-r ${modeMeta[key].accent} text-white shadow-lg`
                    : 'bg-white text-slate-600 hover:bg-violet-50 hover:text-violet-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {modeMeta[key].label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2 rounded-[22px] border border-slate-100 bg-white px-4 py-3 shadow-sm">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search staff, city, role..."
            className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>

        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as 'count' | 'az' | 'risk')}
          className="rounded-[22px] border border-slate-100 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm outline-none"
        >
          <option value="count">Sort by count</option>
          <option value="az">Sort A-Z</option>
          <option value="risk">Sort by risk</option>
        </select>
      </div>

      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <div className="rounded-[26px] border border-slate-100 bg-slate-50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Current lens</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-black text-slate-950">
                <MetaIcon className="h-4 w-4 text-violet-600" />
                {modeMeta[mode].label}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm">
              Coverage · {coverage}%
            </div>
          </div>

          <div className="max-h-[360px] space-y-2 overflow-auto pr-1">
            <button
              onClick={() => setSelectedGroup('all')}
              className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-black transition ${
                selectedGroup === 'all'
                  ? 'bg-slate-950 text-white shadow-xl'
                  : 'bg-white text-slate-700 shadow-sm hover:bg-violet-50 hover:text-violet-700'
              }`}
            >
              All employees
              <span className="float-right">{cleanEmployees.length}</span>
            </button>

            {groups.map((group) => {
              const color = colorFor(group.label)
              return (
                <button
                  key={group.label}
                  onClick={() => setSelectedGroup(group.label)}
                  className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                    selectedGroup === group.label
                      ? 'bg-white shadow-xl ring-2 ring-violet-200'
                      : 'bg-white shadow-sm hover:bg-violet-50'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm font-black text-slate-800">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: color }} />
                      <span className="truncate">{group.label}</span>
                    </span>
                    <span>{group.count}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10px] font-black">
                    <span className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700">A {group.active}</span>
                    <span className="rounded-lg bg-amber-50 px-2 py-1 text-amber-700">P {group.pending}</span>
                    <span className="rounded-lg bg-rose-50 px-2 py-1 text-rose-700">R {group.risk}</span>
                  </div>
                </button>
              )
            })}

            {!groups.length ? (
              <div className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-400">
                No employee groups available yet.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-[26px] border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Live employee table</p>
              <h3 className="text-lg font-black text-slate-950">
                {selectedGroup === 'all' ? 'All employees' : selectedGroup}
              </h3>
            </div>
            <div className="rounded-2xl bg-violet-50 px-3 py-2 text-xs font-black text-violet-700">
              {selectedEmployees.length} visible
            </div>
          </div>

          <div className="max-h-[360px] overflow-auto rounded-2xl border border-slate-100">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {selectedEmployees.map((employee) => (
                  <tr key={employee.id} className="border-t border-slate-100 hover:bg-violet-50/50">
                    <td className="px-4 py-3 font-black text-slate-900">{employee.name}</td>
                    <td className="px-4 py-3 font-bold text-slate-600">{employee.department}</td>
                    <td className="px-4 py-3 font-bold text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: colorFor(employee.city) }} />
                        {employee.city}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-600">{employee.role}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${statusTone(employee)}`}>
                        {employee.risk ? 'Risk' : employee.pending ? 'Pending' : employee.active ? 'Active' : employee.status || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}

                {!selectedEmployees.length ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm font-bold text-slate-400">
                      No employees match this filter yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
