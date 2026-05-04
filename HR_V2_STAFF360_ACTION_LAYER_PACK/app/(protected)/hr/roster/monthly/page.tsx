import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

async function getRoster() {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase.from('hr_rosters').select('*').order('shift_date', { ascending: true }).limit(300)
    return { rows: data || [], error: error?.message || null }
  } catch (e: any) { return { rows: [], error: e?.message || 'Unavailable' } }
}

export default async function Page() {
  const { rows, error } = await getRoster()
  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,#3b82f655,transparent_35%),linear-gradient(135deg,#020617,#0f172a)] px-6 py-8 lg:px-10"><div className="mx-auto max-w-7xl"><p className="mb-3 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-black uppercase tracking-[0.22em]">Monthly Staff Roster</p><h1 className="text-4xl font-black md:text-5xl">Coverage Calendar</h1><p className="mt-3 max-w-3xl text-slate-300">A broad monthly roster board showing duties and shifts for all staff, with filters, coverage visibility and direct navigation to staff records.</p></div></section>
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <div className="mb-6 grid gap-3 md:grid-cols-5">{['Department','Duty type','Status','Location','Staff search'].map(f => <div key={f} className="rounded-2xl border border-slate-800 bg-slate-900 p-3"><p className="text-xs uppercase text-slate-500">Filter</p><p className="mt-1 font-bold">{f}</p></div>)}</div>
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="text-2xl font-black">Monthly Duty Grid</h2><p className="text-sm text-slate-400">{error ? `Fallback: ${error}` : `${rows.length} roster shifts loaded`}</p></div><Link href="/hr/roster" className="rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-950">Roster list</Link></div>
          <div className="grid gap-3 md:grid-cols-7">{days.map(day => {
            const items = rows.filter((r:any) => Number(String(r.shift_date || '').slice(-2)) === day).slice(0,4)
            return <div key={day} className="min-h-[150px] rounded-2xl border border-slate-800 bg-slate-950 p-3"><div className="mb-2 flex items-center justify-between"><span className="font-black">{day}</span><span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] text-slate-400">{items.length}</span></div>{items.length ? <div className="space-y-2">{items.map((r:any) => <Link href={r.user_id ? `/hr/staff/${r.user_id}` : '#'} key={r.id} className="block rounded-xl border border-slate-800 bg-slate-900 p-2 hover:border-blue-400"><p className="truncate text-xs font-bold">{r.role || r.duty_type || 'Shift'}</p><p className="text-[10px] text-slate-500">{r.start_time || '—'} → {r.end_time || '—'}</p><p className="truncate text-[10px] text-slate-400">{r.location || r.status || 'Scheduled'}</p></Link>)}</div> : <p className="mt-8 text-center text-xs text-slate-600">No shifts</p>}</div>
          })}</div>
        </div>
      </section>
    </main>
  )
}
