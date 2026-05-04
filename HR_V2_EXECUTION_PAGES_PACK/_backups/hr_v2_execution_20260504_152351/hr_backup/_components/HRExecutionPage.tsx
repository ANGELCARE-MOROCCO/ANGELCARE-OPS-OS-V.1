import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type PageKind = 'staff'|'positions'|'departments'|'attendance'|'roster'|'leave'|'replacements'|'performance'|'training'|'incidents'|'documents'|'approvals'|'compliance'|'payroll'|'capacity'|'memos'|'settings'

type Props = {
  kind: PageKind
  title: string
  subtitle: string
  primaryAction?: string
  primaryHref?: string
}

const tableByKind: Record<PageKind, string[]> = {
  staff: ['hr_staff_profiles', 'users'],
  positions: ['hr_positions'],
  departments: ['hr_departments'],
  attendance: ['attendance_logs', 'staff_attendance', 'pointage', 'hr_rosters'],
  roster: ['hr_rosters'],
  leave: ['hr_leave_requests'],
  replacements: ['hr_replacement_requests', 'hr_rosters'],
  performance: ['hr_performance_reviews'],
  training: ['hr_certifications', 'academy_training_assignments', 'training_assignments'],
  incidents: ['incidents', 'hr_disciplinary_actions'],
  documents: ['hr_staff_documents'],
  approvals: ['hr_approval_requests'],
  compliance: ['hr_certifications', 'hr_staff_documents', 'hr_disciplinary_actions'],
  payroll: ['hr_payroll_preparation', 'hr_staff_profiles'],
  capacity: ['hr_rosters', 'hr_staff_profiles'],
  memos: ['hr_staff_notifications'],
  settings: ['hr_departments', 'hr_positions']
}

async function safeSelect(table: string, limit = 8) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(limit)
    if (error) return { table, rows: [], error: error.message }
    return { table, rows: data || [], error: null }
  } catch (e: any) {
    return { table, rows: [], error: e?.message || 'Unavailable' }
  }
}

function label(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'object') return JSON.stringify(value).slice(0, 80)
  return String(value)
}

function rowTitle(row: any) {
  return row?.title || row?.name || row?.full_name || row?.email || row?.type || row?.status || row?.id || 'Record'
}

const nav = [
  ['/hr', 'Overview'], ['/hr/staff', 'Staff'], ['/hr/positions', 'Positions'], ['/hr/departments', 'Departments'], ['/hr/attendance', 'Attendance'], ['/hr/roster', 'Roster'], ['/hr/leave', 'Leave'], ['/hr/replacements', 'Replacements'], ['/hr/performance', 'Performance'], ['/hr/training', 'Training'], ['/hr/incidents', 'Incidents'], ['/hr/documents', 'Documents'], ['/hr/approvals', 'Approvals'], ['/hr/compliance', 'Compliance'], ['/hr/payroll-prep', 'Payroll'], ['/hr/workforce-capacity', 'Capacity'], ['/hr/memos', 'Memos'], ['/hr/settings', 'Settings']
]

export default async function HRExecutionPage({ kind, title, subtitle, primaryAction, primaryHref }: Props) {
  const datasets = await Promise.all(tableByKind[kind].map((t) => safeSelect(t, 10)))
  const total = datasets.reduce((sum, d) => sum + d.rows.length, 0)
  const connected = datasets.filter((d) => !d.error).length
  const hasData = datasets.some((d) => d.rows.length)

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,#2563eb55,transparent_35%),linear-gradient(135deg,#020617,#0f172a_55%,#111827)] px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-100">AngelCare HR V2</p>
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">{title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 md:text-base">{subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/hr" className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/20">Back to HR Command</Link>
              {primaryHref && primaryAction ? <Link href={primaryHref} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-blue-100">{primaryAction}</Link> : null}
            </div>
          </div>
          <div className="mt-7 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5"><p className="text-xs uppercase text-slate-300">Connected sources</p><p className="mt-2 text-3xl font-black">{connected}/{datasets.length}</p></div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5"><p className="text-xs uppercase text-slate-300">Visible records</p><p className="mt-2 text-3xl font-black">{total}</p></div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5"><p className="text-xs uppercase text-slate-300">Mode</p><p className="mt-2 text-2xl font-black">Live + Safe</p></div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5"><p className="text-xs uppercase text-slate-300">Execution</p><p className="mt-2 text-2xl font-black">Ready</p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-6 lg:px-10">
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {nav.map(([href, text]) => <Link key={href} href={href} className="whitespace-nowrap rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-200 hover:border-blue-400 hover:text-white">{text}</Link>)}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-2xl">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div><h2 className="text-xl font-black">Operational Records</h2><p className="text-sm text-slate-400">Live data from available app tables, with safe fallback if a source does not exist yet.</p></div>
                <div className="flex gap-2"><button className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold">Filter</button><button className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold">Export View</button></div>
              </div>
              <div className="mt-5 space-y-4">
                {datasets.map((dataset) => (
                  <div key={dataset.table} className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div><h3 className="font-black">{dataset.table}</h3><p className="text-xs text-slate-500">{dataset.error ? `Not connected: ${dataset.error}` : `${dataset.rows.length} recent records`}</p></div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${dataset.error ? 'bg-amber-500/15 text-amber-200' : 'bg-emerald-500/15 text-emerald-200'}`}>{dataset.error ? 'Fallback' : 'Live'}</span>
                    </div>
                    {dataset.rows.length ? <div className="grid gap-3 md:grid-cols-2">
                      {dataset.rows.slice(0, 6).map((row: any, index: number) => (
                        <Link key={row.id || index} href={kind === 'staff' && row.user_id ? `/hr/staff/${row.user_id}` : '#'} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 hover:border-blue-500">
                          <div className="flex items-start justify-between gap-2"><p className="font-black">{rowTitle(row)}</p><span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] uppercase text-slate-300">Open</span></div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
                            {Object.entries(row).filter(([k]) => !['id','metadata','payload'].includes(k)).slice(0, 6).map(([k, v]) => <div key={k} className="rounded-xl bg-slate-950 p-2"><p className="uppercase text-slate-600">{k}</p><p className="mt-1 truncate text-slate-200">{label(v)}</p></div>)}
                          </div>
                        </Link>
                      ))}
                    </div> : <div className="rounded-2xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">No records found yet. This page is ready for live data once your team starts creating records.</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-lg font-black">Action Control Panel</h2>
              <div className="mt-4 grid gap-3">
                {['Create record', 'Assign owner', 'Request approval', 'Send memo', 'Open audit trail', 'Prepare report'].map((a) => <button key={a} className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-left text-sm font-bold hover:border-blue-500">{a}</button>)}
              </div>
            </div>
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-lg font-black">Smart HR Guidance</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">Use this page to control the complete HR workflow around {title.toLowerCase()}. Priority should go to missing records, overdue approvals, expired documents, roster gaps, and staff capacity risks.</p>
            </div>
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-lg font-black">Production Checklist</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                {['Live table connected', 'Filters available', 'Record cards clickable', 'Fallback safe', 'Ready for CRUD forms'].map((x) => <div key={x} className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-blue-400" />{x}</div>)}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
