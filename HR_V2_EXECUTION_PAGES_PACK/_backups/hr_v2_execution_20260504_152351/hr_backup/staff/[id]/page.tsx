import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

async function safeRows(table: string, column: string, value: string, limit = 8) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from(table).select('*').eq(column, value).limit(limit)
    return { table, rows: error ? [] : data || [], error: error?.message || null }
  } catch (e: any) {
    return { table, rows: [], error: e?.message || 'Unavailable' }
  }
}

function title(row: any) { return row?.title || row?.name || row?.status || row?.type || row?.id || 'Record' }

export default async function Staff360({ params }: { params: { id: string } }) {
  const userId = params.id
  const datasets = await Promise.all([
    safeRows('hr_staff_profiles', 'user_id', userId, 1),
    safeRows('hr_rosters', 'user_id', userId),
    safeRows('hr_leave_requests', 'user_id', userId),
    safeRows('hr_performance_reviews', 'user_id', userId),
    safeRows('hr_certifications', 'user_id', userId),
    safeRows('hr_staff_documents', 'user_id', userId),
    safeRows('hr_staff_notifications', 'user_id', userId),
    safeRows('hr_approval_requests', 'user_id', userId),
    safeRows('hr_disciplinary_actions', 'user_id', userId)
  ])
  const profile = datasets[0].rows[0] as any
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 p-7">
          <Link href="/hr/staff" className="text-sm font-bold text-blue-200">← Back to Staff Directory</Link>
          <h1 className="mt-5 text-4xl font-black">Staff 360 Profile</h1>
          <p className="mt-2 text-slate-300">Unified worker file: roster, attendance signals, leave, performance, documents, certifications, memos, approvals and HR risks.</p>
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs uppercase text-slate-300">User ID</p><p className="mt-1 truncate font-black">{userId}</p></div>
            <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs uppercase text-slate-300">Position</p><p className="mt-1 font-black">{profile?.position || 'Not assigned'}</p></div>
            <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs uppercase text-slate-300">Department</p><p className="mt-1 font-black">{profile?.department || 'Not assigned'}</p></div>
            <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs uppercase text-slate-300">Status</p><p className="mt-1 font-black">{profile?.status || 'Unknown'}</p></div>
          </div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {datasets.slice(1).map((d) => (
            <section key={d.table} className="rounded-[2rem] border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-black">{d.table}</h2><p className="text-xs text-slate-500">{d.error ? `Fallback: ${d.error}` : `${d.rows.length} records`}</p></div><span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-bold text-blue-200">Open</span></div>
              <div className="mt-4 space-y-3">
                {d.rows.length ? d.rows.slice(0,5).map((row: any, i: number) => <div key={row.id || i} className="rounded-2xl bg-slate-950 p-4"><p className="font-bold">{title(row)}</p><p className="mt-1 truncate text-xs text-slate-400">{JSON.stringify(row).slice(0, 160)}</p></div>) : <p className="rounded-2xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">No records yet.</p>}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
