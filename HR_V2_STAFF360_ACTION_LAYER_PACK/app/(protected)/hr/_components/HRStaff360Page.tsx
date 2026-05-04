import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Props = { staffId: string }

async function readTable(table: string, filters: Record<string, string>, limit = 12) {
  try {
    const supabase = await createClient()
    let query = supabase.from(table).select('*').limit(limit)
    Object.entries(filters).forEach(([key, value]) => { query = query.eq(key, value) })
    const { data, error } = await query
    return { table, rows: data || [], error: error?.message || null }
  } catch (e: any) {
    return { table, rows: [], error: e?.message || 'Unavailable' }
  }
}

function v(value: any) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'object') return JSON.stringify(value).slice(0, 120)
  return String(value)
}

function title(row: any) {
  return row?.title || row?.name || row?.type || row?.status || row?.shift_date || row?.created_at || row?.id || 'Record'
}

const links = [
  ['/hr/staff','Staff'], ['/hr/roster','Roster'], ['/hr/attendance','Attendance'], ['/hr/leave','Leave'], ['/hr/performance','Performance'], ['/hr/training','Training'], ['/hr/incidents','Incidents'], ['/hr/documents','Documents'], ['/hr/approvals','Approvals']
]

export default async function HRStaff360Page({ staffId }: Props) {
  const datasets = await Promise.all([
    readTable('hr_staff_profiles', { user_id: staffId }, 1),
    readTable('hr_rosters', { user_id: staffId }, 12),
    readTable('hr_leave_requests', { user_id: staffId }, 8),
    readTable('hr_performance_reviews', { user_id: staffId }, 8),
    readTable('hr_certifications', { user_id: staffId }, 8),
    readTable('hr_staff_documents', { user_id: staffId }, 8),
    readTable('hr_disciplinary_actions', { user_id: staffId }, 8),
    readTable('hr_approval_requests', { user_id: staffId }, 8),
    readTable('hr_staff_notifications', { user_id: staffId }, 8)
  ])
  const profile = datasets[0]?.rows?.[0]
  const liveCount = datasets.filter(d => !d.error).length
  const recordCount = datasets.reduce((a, d) => a + d.rows.length, 0)

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,#22c55e44,transparent_35%),linear-gradient(135deg,#020617,#111827)] px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-black uppercase tracking-[0.22em] text-emerald-100">Staff 360 Profile</p>
              <h1 className="text-3xl font-black md:text-5xl">{profile?.position || profile?.full_name || 'Worker Profile'} Command File</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">Unified HR view for profile, roster, leave, performance, certifications, documents, incidents, approvals and memos connected to one staff user.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/hr/staff" className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold hover:bg-white/20">Back to Staff</Link>
              <Link href={`/hr/actions?user=${staffId}`} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950">Open Action Desk</Link>
            </div>
          </div>
          <div className="mt-7 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5"><p className="text-xs uppercase text-slate-300">User ID</p><p className="mt-2 truncate text-xl font-black">{staffId}</p></div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5"><p className="text-xs uppercase text-slate-300">Live sources</p><p className="mt-2 text-3xl font-black">{liveCount}/9</p></div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5"><p className="text-xs uppercase text-slate-300">Records</p><p className="mt-2 text-3xl font-black">{recordCount}</p></div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5"><p className="text-xs uppercase text-slate-300">Status</p><p className="mt-2 text-3xl font-black">{profile?.status || 'Live'}</p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-6 lg:px-10">
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">{links.map(([href, label]) => <Link key={href} href={href} className="whitespace-nowrap rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-200 hover:border-emerald-400">{label}</Link>)}</div>
        <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-xl font-black">Identity & Contract</h2>
              <div className="mt-4 grid gap-3 text-sm">
                {['position','department','contract_type','manager_user_id','start_date','probation_end_date','salary_base','payroll_code','notes'].map(k => <div key={k} className="rounded-2xl bg-slate-950 p-3"><p className="text-xs uppercase text-slate-500">{k}</p><p className="mt-1 font-bold text-slate-100">{v(profile?.[k])}</p></div>)}
              </div>
            </div>
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-xl font-black">Quick Actions</h2>
              <div className="mt-4 grid gap-3">
                {['Assign Shift','Request Replacement','Approve Leave','Upload Document','Add Certification','Log Performance Review','Send Memo','Create HR Approval'].map(a => <Link href={`/hr/actions?user=${staffId}&action=${encodeURIComponent(a)}`} key={a} className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-bold hover:border-emerald-400">{a}</Link>)}
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            {datasets.slice(1).map(dataset => (
              <section key={dataset.table} className="rounded-[2rem] border border-slate-800 bg-slate-900 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div><h2 className="text-xl font-black">{dataset.table}</h2><p className="text-xs text-slate-500">{dataset.error ? `Fallback: ${dataset.error}` : `${dataset.rows.length} connected records`}</p></div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${dataset.error ? 'bg-amber-500/15 text-amber-200' : 'bg-emerald-500/15 text-emerald-200'}`}>{dataset.error ? 'Not connected' : 'Live'}</span>
                </div>
                {dataset.rows.length ? <div className="grid gap-3 md:grid-cols-2">{dataset.rows.map((row: any, i: number) => <div key={row.id || i} className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><p className="font-black">{title(row)}</p><div className="mt-3 grid grid-cols-2 gap-2 text-xs">{Object.entries(row).filter(([k]) => !['id','payload','metadata'].includes(k)).slice(0,6).map(([k,val]) => <div className="rounded-xl bg-slate-900 p-2" key={k}><p className="uppercase text-slate-600">{k}</p><p className="mt-1 truncate text-slate-200">{v(val)}</p></div>)}</div></div>)}</div> : <div className="rounded-2xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">No records yet for this staff user.</div>}
              </section>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
