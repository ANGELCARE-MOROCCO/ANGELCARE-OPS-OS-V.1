import Link from 'next/link'
import type { ReactNode } from 'react'

export type Tone = 'green'|'blue'|'amber'|'red'|'purple'|'slate'|'cyan'

export function AttendanceEnterpriseShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#050b14] text-slate-100">{children}</div>
}

export function AttendanceTopbar() {
  return (
    <div className="sticky top-0 z-40 border-b border-slate-800 bg-[#050b14]/95 px-5 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/hr" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/30">⬢</div>
          <div><div className="text-lg font-black tracking-[.16em] text-white">ANGELCARE</div><div className="text-[10px] font-black uppercase tracking-[.28em] text-emerald-300">Enterprise HR</div></div>
        </Link>
        <form className="flex min-w-[320px] flex-1 justify-center">
          <input name="q" placeholder="Search staff, department, location, status..." className="w-full max-w-xl rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white outline-none" />
        </form>
        <div className="flex items-center gap-3 text-sm font-black">
          <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs text-slate-950">LIVE</span>
          <Link href="/hr/reports" className="rounded-xl bg-violet-600 px-4 py-2 text-xs text-white">Export Report</Link>
        </div>
      </div>
    </div>
  )
}

export function AttendanceSidebar() {
  const items = [
    ['Dashboard','/hr'],
    ['Staff Management','/hr/staff'],
    ['Attendance Live','/hr/attendance'],
    ['Attendance Actions','/hr/attendance/actions'],
    ['Corrections','/hr/attendance/corrections'],
    ['Roster & Shifts','/hr/rosters'],
    ['Leave','/hr/leave'],
    ['Payroll','/hr/payroll'],
    ['Documents','/hr/documents'],
    ['Reports','/hr/reports'],
    ['Sync Center','/hr/sync-center'],
  ]
  return (
    <aside className="hidden w-[260px] shrink-0 border-r border-slate-800 bg-[#091524] p-4 xl:block">
      <div className="mb-6 text-xs font-black uppercase tracking-[.22em] text-slate-500">Attendance Ops</div>
      <div className="space-y-1">
        {items.map(([label, href]) => (
          <Link key={href} href={href} className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold ${label.includes('Attendance Live') ? 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/20' : 'text-slate-300 hover:bg-slate-800/70'}`}>
            <span>{label}</span>{label.includes('Attendance') ? <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] text-slate-950">LIVE</span> : null}
          </Link>
        ))}
      </div>
    </aside>
  )
}

export function MetricCard({ label, value, detail, tone='slate' }: { label: string; value: ReactNode; detail?: string; tone?: Tone }) {
  const tones: Record<Tone,string> = {
    green:'from-emerald-500/20 to-emerald-500/5 border-emerald-400/20 text-emerald-300',
    blue:'from-sky-500/20 to-sky-500/5 border-sky-400/20 text-sky-300',
    amber:'from-amber-500/20 to-amber-500/5 border-amber-400/20 text-amber-300',
    red:'from-rose-500/20 to-rose-500/5 border-rose-400/20 text-rose-300',
    purple:'from-violet-500/20 to-violet-500/5 border-violet-400/20 text-violet-300',
    cyan:'from-cyan-500/20 to-cyan-500/5 border-cyan-400/20 text-cyan-300',
    slate:'from-slate-700/50 to-slate-800/40 border-slate-700 text-slate-300',
  }
  return <div className={`rounded-2xl border bg-gradient-to-br p-5 shadow-xl ${tones[tone]}`}><div className="text-xs font-black uppercase tracking-[.18em]">{label}</div><div className="mt-3 text-4xl font-black text-white">{value}</div>{detail ? <div className="mt-2 text-xs font-semibold opacity-80">{detail}</div> : null}</div>
}

export function StatusBadge({ value }: { value?: string | null }) {
  const v = String(value || 'pending').toLowerCase()
  const cls = v.includes('present') || v.includes('valid') || v.includes('complete') || v.includes('auto') || v.includes('approved')
    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
    : v.includes('late') ? 'bg-amber-500/15 text-amber-300 border-amber-400/30'
    : v.includes('absent') || v.includes('missing') || v.includes('review') || v.includes('exception')
      ? 'bg-rose-500/15 text-rose-300 border-rose-400/30'
      : v.includes('overtime') ? 'bg-violet-500/15 text-violet-300 border-violet-400/30'
      : 'bg-slate-700/40 text-slate-300 border-slate-600'
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase ${cls}`}>{value || 'pending'}</span>
}

export function Panel({ title, subtitle, children, action }: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode }) {
  return <section className="rounded-2xl border border-slate-800 bg-[#0b1626] p-4 shadow-xl"><div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-lg font-black text-white">{title}</h2>{subtitle ? <p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p> : null}</div>{action}</div>{children}</section>
}

export function TimelineRow({ name, role, schedule, status, startPct, widthPct, href }: { name: string; role: string; schedule: string; status: string; startPct: number; widthPct: number; href: string }) {
  const s = status.toLowerCase()
  const bar = s.includes('late') ? 'bg-amber-500/45 border-amber-400/60 text-amber-200' : s.includes('absent') || s.includes('missing') || s.includes('review') ? 'bg-rose-500/35 border-rose-400/60 text-rose-200' : s.includes('overtime') ? 'bg-violet-500/45 border-violet-400/60 text-violet-200' : 'bg-emerald-500/45 border-emerald-400/60 text-emerald-200'
  return (
    <div className="grid grid-cols-[42px_240px_110px_1fr_130px] items-center border-b border-slate-800 text-sm">
      <div className="px-3"><input type="checkbox" className="rounded border-slate-700 bg-slate-950" /></div>
      <Link href={href} className="flex items-center gap-3 px-3 py-3 hover:underline">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 font-black text-slate-950">{name.slice(0,1).toUpperCase()}</div>
        <div><div className="font-black text-white">{name}</div><div className="text-xs font-semibold text-slate-500">{role}</div></div>
      </Link>
      <div className="font-bold text-slate-300">{schedule}</div>
      <div className="relative h-10 border-x border-slate-800 bg-slate-950/40">
        <div className={`absolute top-2 h-6 rounded-lg border px-2 text-right text-xs font-black leading-6 ${bar}`} style={{ left: `${startPct}%`, width: `${widthPct}%` }}>{status}</div>
      </div>
      <div className="px-3"><StatusBadge value={status} /></div>
    </div>
  )
}

export function MiniTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return <div className="overflow-hidden rounded-xl border border-slate-800"><table className="w-full text-left text-xs"><thead className="bg-slate-900 text-slate-500"><tr>{headers.map(h=><th key={h} className="px-3 py-2 font-black uppercase tracking-[.14em]">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-800">{rows.length ? rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j} className="px-3 py-2 text-slate-300">{c}</td>)}</tr>) : <tr><td colSpan={headers.length} className="px-3 py-5 text-center text-slate-500">No data</td></tr>}</tbody></table></div>
}
