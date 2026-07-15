'use client'

import { useMemo, useState } from 'react'
import { Activity, Briefcase, CheckCircle2, Clock3, FileCheck2, Filter, Search, ShieldAlert, UserRound, Users2 } from 'lucide-react'

type ActivityItem = {
  id: string
  title: string
  subtitle: string
  category: string
  categoryKey: 'all' | 'recruitment' | 'workforce' | 'compliance' | 'approvals'
  status: string
  priority: string
  owner: string
  department: string
  created_at: string
}

const tabs = [
  { key: 'all', label: 'All activity', icon: Activity },
  { key: 'recruitment', label: 'Recruitment', icon: Briefcase },
  { key: 'workforce', label: 'Workforce', icon: Users2 },
  { key: 'compliance', label: 'Compliance', icon: FileCheck2 },
  { key: 'approvals', label: 'Approvals', icon: CheckCircle2 },
] as const

function fmtTime(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'Recent'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function statusTone(status: string) {
  const s = String(status || '').toLowerCase()
  if (['done', 'completed', 'approved', 'closed', 'resolved'].some((k) => s.includes(k))) return 'bg-emerald-50 text-emerald-700 border-emerald-100'
  if (['review', 'pending', 'waiting', 'draft'].some((k) => s.includes(k))) return 'bg-amber-50 text-amber-700 border-amber-100'
  if (['blocked', 'risk', 'rejected', 'overdue'].some((k) => s.includes(k))) return 'bg-rose-50 text-rose-700 border-rose-100'
  return 'bg-violet-50 text-violet-700 border-violet-100'
}

function priorityTone(priority: string) {
  const p = String(priority || '').toLowerCase()
  if (['critical', 'urgent'].some((k) => p.includes(k))) return 'bg-rose-600'
  if (['high'].some((k) => p.includes(k))) return 'bg-orange-500'
  if (['medium', 'normal'].some((k) => p.includes(k))) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function categoryBadge(categoryKey: ActivityItem['categoryKey']) {
  if (categoryKey === 'recruitment') return 'bg-fuchsia-50 text-fuchsia-700'
  if (categoryKey === 'workforce') return 'bg-cyan-50 text-cyan-700'
  if (categoryKey === 'compliance') return 'bg-emerald-50 text-emerald-700'
  if (categoryKey === 'approvals') return 'bg-amber-50 text-amber-700'
  return 'bg-slate-100 text-slate-700'
}

export default function HRRecentActivityCommand({ items }: { items: ActivityItem[] }) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['key']>('all')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const counts = useMemo(() => {
    const total = items.length
    const open = items.filter((item) => ['open', 'pending', 'review', 'waiting', 'draft', 'in progress'].some((k) => String(item.status || '').toLowerCase().includes(k))).length
    const high = items.filter((item) => ['high', 'critical', 'urgent'].some((k) => String(item.priority || '').toLowerCase().includes(k))).length
    const flagged = items.filter((item) => ['blocked', 'risk', 'rejected', 'overdue'].some((k) => String(item.status || '').toLowerCase().includes(k))).length
    return { total, open, high, flagged }
  }, [items])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      const tabMatch = activeTab === 'all' || item.categoryKey === activeTab
      const statusMatch = statusFilter === 'all' || String(item.status || '').toLowerCase().includes(statusFilter)
      const queryMatch = !q || [item.title, item.subtitle, item.owner, item.department, item.category, item.status, item.priority].join(' ').toLowerCase().includes(q)
      return tabMatch && statusMatch && queryMatch
    })
  }, [items, activeTab, statusFilter, query])

  return (
    <section className="col-span-12 overflow-hidden rounded-[30px] border border-white/80 bg-white/95 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 backdrop-blur-xl">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700">
            <Activity className="h-3.5 w-3.5" />
            HR activity command
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-950">Recent Activity Intelligence</h2>
          <p className="mt-1 text-sm font-bold text-slate-400">Multi-navigation activity hub for workforce actions, recruitment execution, approvals and compliance movements.</p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs font-black text-slate-500">Total<div className="mt-1 text-2xl text-slate-950">{counts.total}</div></div>
          <div className="rounded-2xl bg-violet-50 px-4 py-3 text-xs font-black text-violet-700">Open<div className="mt-1 text-2xl text-slate-950">{counts.open}</div></div>
          <div className="rounded-2xl bg-orange-50 px-4 py-3 text-xs font-black text-orange-700">High priority<div className="mt-1 text-2xl text-slate-950">{counts.high}</div></div>
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-xs font-black text-rose-700">Flagged<div className="mt-1 text-2xl text-slate-950">{counts.flagged}</div></div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2 rounded-[24px] border border-slate-100 bg-slate-50 p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.key
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-black transition ${active ? 'bg-slate-950 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-violet-50 hover:text-violet-700'}`}>
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="mb-5 grid gap-3 xl:grid-cols-[1fr_220px]">
        <div className="flex items-center gap-2 rounded-[22px] border border-slate-100 bg-white px-4 py-3 shadow-sm">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search titles, people, departments, activity type..." className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400" />
        </div>
        <div className="flex items-center gap-2 rounded-[22px] border border-slate-100 bg-white px-4 py-3 shadow-sm">
          <Filter className="h-4 w-4 text-slate-400" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-transparent text-sm font-black text-slate-700 outline-none">
            <option value="all">All statuses</option>
            <option value="open">Open / in progress</option>
            <option value="pending">Pending</option>
            <option value="review">Review</option>
            <option value="approved">Approved / completed</option>
            <option value="blocked">Blocked / risk</option>
          </select>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
        <div className="rounded-[26px] border border-slate-100 bg-slate-50 p-4">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Navigation lanes</p>
          <div className="space-y-3">
            {tabs.map((tab, idx) => {
              const tabCount = tab.key === 'all' ? items.length : items.filter((item) => item.categoryKey === tab.key).length
              const Icon = tab.icon
              const active = activeTab === tab.key
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`w-full rounded-2xl px-4 py-4 text-left transition ${active ? 'bg-white shadow-xl ring-2 ring-violet-200' : 'bg-white shadow-sm hover:bg-violet-50'}`}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-white"><Icon className="h-4 w-4" /></span>
                      <span>
                        <span className="block text-sm font-black text-slate-900">{tab.label}</span>
                        <span className="block text-xs font-bold text-slate-400">Smart lane {idx + 1}</span>
                      </span>
                    </span>
                    <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">{tabCount}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-[26px] border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Live activity stream</p>
              <h3 className="text-lg font-black text-slate-950">{filtered.length} visible activities</h3>
            </div>
            <div className="rounded-2xl bg-violet-50 px-3 py-2 text-xs font-black text-violet-700">Operational feed</div>
          </div>

          <div className="max-h-[520px] space-y-3 overflow-auto pr-1">
            {filtered.map((item, index) => (
              <div key={item.id} className="rounded-[24px] border border-slate-100 bg-gradient-to-r from-white to-slate-50 p-4 shadow-sm transition hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-white">{index + 1}</div>
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${categoryBadge(item.categoryKey)}`}>{item.category}</span>
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${statusTone(item.status)}`}>{item.status || 'open'}</span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-500 ring-1 ring-slate-100">
                          <span className={`h-2.5 w-2.5 rounded-full ${priorityTone(item.priority)}`} />
                          {item.priority || 'normal'}
                        </span>
                      </div>
                      <h4 className="truncate text-2xl font-black tracking-tight text-slate-900">{item.title}</h4>
                      <p className="mt-1 text-sm font-bold text-slate-500">{item.subtitle}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-black text-slate-500">
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1"><UserRound className="h-3.5 w-3.5" />{item.owner}</span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1"><Briefcase className="h-3.5 w-3.5" />{item.department}</span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1"><Clock3 className="h-3.5 w-3.5" />{fmtTime(item.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {!filtered.length ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                <ShieldAlert className="mx-auto mb-3 h-7 w-7 text-slate-300" />
                <p className="text-sm font-black text-slate-500">No activities match the current filters.</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
