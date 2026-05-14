import Link from 'next/link'
import type { ReactNode } from 'react'

export function AttendanceHero({ score }: { score: number }) {
  return <section className="relative overflow-hidden rounded-[34px] border border-slate-800 bg-[#07111f] p-6 text-white shadow-2xl">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,197,94,.22),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,.22),transparent_32%)]" />
    <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-[.22em] text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Live HR Time Control</div>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">Attendance Live Monitor</h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">Real staff identity, live punch status, exception control, timeline lanes, attendance actions, payroll readiness and profile-level attendance access.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/hr/attendance?view=timeline" className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-950">Timeline</Link>
          <Link href="/hr/attendance?view=people" className="rounded-full border border-white/15 px-4 py-2 text-xs font-black text-white">People</Link>
          <Link href="/hr/attendance?view=exceptions" className="rounded-full border border-white/15 px-4 py-2 text-xs font-black text-white">Exceptions</Link>
          <Link href="/hr/rosters" className="rounded-full border border-white/15 px-4 py-2 text-xs font-black text-white">Rosters</Link>
        </div>
      </div>
      <div className="grid min-w-[260px] gap-3 rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
        <div className="text-xs font-black uppercase tracking-[.22em] text-slate-300">Operational score</div>
        <div className="text-5xl font-black text-white">{score}%</div>
        <div className="h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} /></div>
      </div>
    </div>
  </section>
}

export function StatCard({ label, value, detail, tone = 'slate' }: { label: string; value: ReactNode; detail?: string; tone?: 'green'|'blue'|'amber'|'red'|'purple'|'slate' }) {
  const tones = { green:'from-emerald-500/20 to-emerald-400/5 border-emerald-400/20 text-emerald-300', blue:'from-sky-500/20 to-sky-400/5 border-sky-400/20 text-sky-300', amber:'from-amber-500/20 to-amber-400/5 border-amber-400/20 text-amber-300', red:'from-rose-500/20 to-rose-400/5 border-rose-400/20 text-rose-300', purple:'from-violet-500/20 to-violet-400/5 border-violet-400/20 text-violet-300', slate:'from-slate-700/50 to-slate-800/40 border-slate-700 text-slate-300' }
  return <div className={`rounded-[24px] border bg-gradient-to-br p-5 shadow-xl ${tones[tone]}`}><div className="text-xs font-black uppercase tracking-[.2em] opacity-80">{label}</div><div className="mt-3 text-4xl font-black text-white">{value}</div>{detail ? <div className="mt-2 text-xs font-semibold opacity-80">{detail}</div> : null}</div>
}

export function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return <section className="rounded-[28px] border border-slate-800 bg-[#0b1626] p-5 shadow-xl"><div className="mb-4"><h2 className="text-xl font-black text-white">{title}</h2>{subtitle ? <p className="mt-1 text-sm leading-6 text-slate-400">{subtitle}</p> : null}</div>{children}</section>
}

export function Badge({ value }: { value?: string | null }) {
  const v = String(value || 'pending').toLowerCase()
  const cls = v.includes('present') || v.includes('validated') || v.includes('complete') || v.includes('auto') ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : v.includes('late') || v.includes('missing') || v.includes('absent') || v.includes('review') ? 'border-rose-400/30 bg-rose-400/10 text-rose-300' : 'border-amber-400/30 bg-amber-400/10 text-amber-300'
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${cls}`}>{value || 'pending'}</span>
}

export function TimelineBlock({ staff, role, time, status, percent, href }: { staff: string; role?: string; time: string; status: string; percent: number; href: string }) {
  const bad = /late|missing|absent|review/i.test(status)
  const bar = bad ? 'bg-rose-500/60 border-rose-400/50' : 'bg-emerald-500/60 border-emerald-400/50'
  return <div className="grid grid-cols-[240px_110px_1fr_110px] items-center gap-3 border-b border-slate-800 px-3 py-3 text-sm">
    <Link href={href} className="group flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-emerald-400 text-sm font-black text-slate-950">{staff.slice(0,1).toUpperCase()}</div><div><div className="font-black text-white group-hover:underline">{staff}</div><div className="text-xs font-semibold text-slate-500">{role || 'Staff'}</div></div></Link>
    <div className="font-black text-slate-300">{time}</div><div className="relative h-8 rounded-xl border border-slate-800 bg-slate-900"><div className={`absolute inset-y-1 left-1 rounded-lg border ${bar}`} style={{ width: `${Math.max(8, Math.min(100, percent))}%` }} /></div><Badge value={status} />
  </div>
}

export function DataTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return <div className="overflow-hidden rounded-2xl border border-slate-800"><table className="w-full text-left text-sm"><thead className="bg-slate-900 text-xs font-black uppercase tracking-[.16em] text-slate-500"><tr>{headers.map(h => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-800">{rows.length ? rows.map((row,i)=><tr key={i} className="bg-[#0b1626] hover:bg-slate-900/70">{row.map((cell,j)=><td key={j} className="px-4 py-3 align-top text-slate-300">{cell}</td>)}</tr>) : <tr><td colSpan={headers.length} className="px-4 py-8 text-center text-sm font-semibold text-slate-500">No records found</td></tr>}</tbody></table></div>
}
