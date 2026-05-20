import Link from 'next/link'
import AttendancePrintButton from '@/components/hr/attendance/AttendancePrintButton'
import { getAttendanceEnterpriseData } from '@/lib/hr-production/attendance-enterprise'

export const dynamic = 'force-dynamic'

type Row = Record<string, any>
function d(v: any) { return String(v || '').slice(0, 10) || '—' }
function t(v: any) { const s = String(v || ''); if (!s) return '—'; if (s.includes('T')) return s.slice(11, 16); return s.slice(0, 5) }
function isoToday() { return new Date().toISOString().slice(0,10) }
function monthStart(date: string) { const x = new Date(`${date || isoToday()}T12:00:00`); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-01` }
function monthEnd(date: string) { const x = new Date(`${date || isoToday()}T12:00:00`); return new Date(x.getFullYear(), x.getMonth()+1, 0).toISOString().slice(0,10) }
function staffKey(r: Row) { return String(r.identity?.staff_id || r.identity?.user_id || r.identity?.name || r.id || '') }
function workedMinutes(r: Row) {
  if (Number(r.worked_minutes || r.duration_minutes || 0) > 0) return Number(r.worked_minutes || r.duration_minutes || 0)
  const parse = (v: string) => { const m = v.includes('T') ? v.slice(11,16) : v.slice(0,5); const [hh, mm] = m.split(':').map(Number); return Number.isFinite(hh) ? hh * 60 + (mm || 0) : 0 }
  const start = parse(String(r.punch_in_at || '')); const end = parse(String(r.punch_out_at || ''))
  return start && end && end > start ? end - start : 0
}
function minsLabel(mins: number) { const h = Math.floor(Math.max(0, mins) / 60); const m = Math.max(0, mins) % 60; return h ? `${h}h ${m}m` : `${m}m` }
function statusTone(status: any) {
  const s = String(status || '').toLowerCase()
  if (/present|completed|valid|approved|auto/.test(s)) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (/late|review|pending|open/.test(s)) return 'bg-amber-50 text-amber-700 border-amber-200'
  if (/absent|missing|exception|risk/.test(s)) return 'bg-rose-50 text-rose-700 border-rose-200'
  return 'bg-slate-50 text-slate-600 border-slate-200'
}
function Status({ value }: { value: any }) { return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black capitalize ${statusTone(value)}`}>{String(value || 'pending').replaceAll('_',' ')}</span> }

export default async function Page({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const params = searchParams ? await searchParams : {}
  const from = String(params.from || monthStart(isoToday()))
  const to = String(params.to || monthEnd(isoToday()))
  const scope = String(params.scope || 'staff')
  const staff = String(params.staff || '')
  const data = await getAttendanceEnterpriseData()
  const all = Array.isArray(data.records) ? data.records : []
  const selected = all.filter((r: Row) => {
    const day = d(r.work_date || r.created_at)
    if (day < from || day > to) return false
    if (scope === 'all') return true
    if (scope === 'department') {
      const ref = all.find((x: Row) => staffKey(x) === staff)
      return String(r.identity?.department || '') === String(ref?.identity?.department || '')
    }
    return staff ? staffKey(r) === staff : true
  })
  const ref = selected[0] || all.find((r: Row) => staffKey(r) === staff) || {}
  const totalMinutes = selected.reduce((sum: number, r: Row) => sum + workedMinutes(r), 0)
  const late = selected.filter((r: Row) => /late/i.test(String(r.status)) || Number(r.late_minutes || 0) > 0).length
  const absent = selected.filter((r: Row) => /absent|missing/i.test(String(r.status))).length
  const overtime = selected.reduce((sum: number, r: Row) => sum + Number(r.overtime_minutes || 0), 0)

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950 print:bg-white print:p-0">
      <div className="mx-auto max-w-7xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,.08)] print:border-0 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[.35em] text-violet-500">Angelcare HR attendance report</p>
            <h1 className="mt-2 text-4xl font-black">Enterprise Attendance Report</h1>
            <p className="mt-2 text-sm font-bold text-slate-500">Referenced automatically from live synced attendance rows, correction sources and profile identity mapping.</p>
          </div>
          <div className="flex gap-2 print:hidden"><Link href="/hr/attendance" className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black">Back</Link><AttendancePrintButton /></div>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          {[['Scope', scope === 'all' ? 'All staff' : scope === 'department' ? `Department: ${ref.identity?.department || 'Selected'}` : ref.identity?.name || 'Selected staff'], ['Period', `${from} → ${to}`], ['Rows', selected.length], ['Total hours', minsLabel(totalMinutes)]].map(([a,b]) => <div key={String(a)} className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><p className="text-xs font-black uppercase tracking-[.18em] text-slate-400">{a}</p><div className="mt-2 text-xl font-black">{b}</div></div>)}
        </section>
        <section className="mt-4 grid gap-4 md:grid-cols-4">
          {[['Late signals', late], ['Absences', absent], ['Overtime', minsLabel(overtime)], ['Quality', `${data.score || 0}%`]].map(([a,b]) => <div key={String(a)} className="rounded-3xl border border-slate-200 bg-white p-5"><p className="text-xs font-black uppercase tracking-[.18em] text-slate-400">{a}</p><div className="mt-2 text-2xl font-black">{b}</div></div>)}
        </section>

        <section className="mt-8 overflow-hidden rounded-[28px] border border-slate-200">
          <div className="bg-gradient-to-r from-violet-50 to-cyan-50 p-5"><h2 className="text-xl font-black">Detailed attendance table</h2><p className="text-sm font-semibold text-slate-500">Includes status, punch timestamps, late/overtime calculation, source reference and payroll-readiness indicators.</p></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-950 text-xs font-black uppercase tracking-[.12em] text-white"><tr><th className="p-4">Date</th><th>Employee</th><th>Department</th><th>Location</th><th>Status</th><th>In</th><th>Out</th><th>Worked</th><th>Late</th><th>Overtime</th><th>Source</th></tr></thead>
              <tbody>{selected.map((r: Row, i: number) => <tr key={`${r.id || staffKey(r)}-${i}`} className="border-t border-slate-100"><td className="p-4 font-black">{d(r.work_date || r.created_at)}</td><td className="font-black">{r.identity?.name || 'Staff'}</td><td className="font-semibold text-slate-500">{r.identity?.department || '—'}</td><td className="font-semibold text-slate-500">{r.identity?.location || '—'}</td><td><Status value={r.status} /></td><td className="font-bold">{t(r.punch_in_at)}</td><td className="font-bold">{t(r.punch_out_at)}</td><td className="font-bold">{minsLabel(workedMinutes(r))}</td><td className="font-bold">{r.late_minutes || 0}m</td><td className="font-bold">{r.overtime_minutes || 0}m</td><td className="text-xs font-bold text-slate-500">{r.source_table || 'synced'}</td></tr>)}</tbody>
            </table>
          </div>
          {!selected.length ? <div className="p-10 text-center font-bold text-slate-500">No attendance rows found for this selected period.</div> : null}
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 p-5"><h3 className="font-black">Payroll reference</h3><p className="mt-2 text-sm font-semibold text-slate-500">Use total hours, overtime and late signals for payroll validation before export.</p></div>
          <div className="rounded-3xl border border-slate-200 p-5"><h3 className="font-black">Compliance reference</h3><p className="mt-2 text-sm font-semibold text-slate-500">Rows preserve source table references for audit follow-up and correction traceability.</p></div>
          <div className="rounded-3xl border border-slate-200 p-5"><h3 className="font-black">Generated</h3><p className="mt-2 text-sm font-semibold text-slate-500">{new Date().toLocaleString()}</p></div>
        </section>
      </div>
    </main>
  )
}
