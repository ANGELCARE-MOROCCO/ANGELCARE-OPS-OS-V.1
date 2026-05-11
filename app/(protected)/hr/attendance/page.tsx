import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getAttendanceCommandData, minutesToHours, timeOnly, todayCasablanca } from '@/lib/hr-attendance-sync/repository'
import type { AttendanceView } from '@/lib/hr-attendance-sync/types'

const VIEWS: { key: AttendanceView; label: string; desc: string }[] = [
  { key: 'dashboard', label: 'Dashboard', desc: 'Executive KPIs' },
  { key: 'day', label: 'Day View', desc: 'Today clocking' },
  { key: 'week', label: 'Week View', desc: '7-day rhythm' },
  { key: 'agenda', label: 'Agenda', desc: 'Chronological planning' },
  { key: 'people', label: 'People', desc: 'Staff-by-staff' },
  { key: 'exceptions', label: 'Exceptions', desc: 'Missing punches' },
]

export default async function Page({ searchParams }: { searchParams?: Promise<{ view?: AttendanceView; from?: string; to?: string }> }) {
  const params = await searchParams
  const today = todayCasablanca()
  const view = VIEWS.some((v) => v.key === params?.view) ? params?.view || 'dashboard' : 'dashboard'
  const data = await getAttendanceCommandData({ from: params?.from, to: params?.to || today })
  const todayRows = data.records.filter((r) => r.attendance_date === today)
  const exceptionRows = data.records.filter((r) => r.missing_punch || r.status === 'needs_review' || r.anomaly_reason)

  return (
    <AppShell
      title="Enterprise Attendance"
      subtitle="Synchronized HR attendance from Overhead Panel punch-in / punch-out, user profiles, and staff attendance records."
      breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Attendance' }]}
      actions={
        <>
          <PageAction href="/hr">HR Dashboard</PageAction>
          <PageAction href="/hr/attendance/corrections" variant="light">Corrections</PageAction>
          <PageAction href="/hr/reports/export" variant="light">Export</PageAction>
        </>
      }
    >
      <div style={page}>
        <section style={hero}>
          <div>
            <div style={eyebrow}>LIVE HR TIME CONTROL</div>
            <h1 style={h1}>Attendance Command Center</h1>
            <p style={subtitle}>Every punch from the Overhead Panel writes to <b>app_attendance_logs</b> and synchronizes into <b>hr_attendance_records</b> for HR reporting, profiles, corrections, and payroll readiness.</p>
          </div>
          <div style={scoreBox}>
            <span>Readiness</span>
            <strong>{data.metrics.exceptions === 0 ? 'Clean' : 'Review'}</strong>
            <small>{data.metrics.exceptions} exception(s)</small>
          </div>
        </section>

        <section style={kpiGrid}>
          <Kpi label="Records" value={String(data.metrics.records)} detail={`${data.from} → ${data.to}`} />
          <Kpi label="People tracked" value={String(data.metrics.people)} detail="unique staff/users" />
          <Kpi label="In progress" value={String(data.metrics.inProgress)} detail="currently open shifts" />
          <Kpi label="Completed" value={String(data.metrics.completed)} detail="closed shifts" />
          <Kpi label="Total time" value={minutesToHours(data.metrics.totalMinutes)} detail="worked time" />
          <Kpi label="Overtime" value={minutesToHours(data.metrics.overtimeMinutes)} detail="above 8h/day" />
        </section>

        <nav style={viewsBar}>
          {VIEWS.map((item) => (
            <Link key={item.key} href={`/hr/attendance?view=${item.key}&from=${data.from}&to=${data.to}`} style={viewLink(item.key === view)}>
              <strong>{item.label}</strong>
              <small>{item.desc}</small>
            </Link>
          ))}
        </nav>

        <form style={filters}>
          <input type="hidden" name="view" value={view} />
          <label style={field}>From <input name="from" type="date" defaultValue={data.from} style={input} /></label>
          <label style={field}>To <input name="to" type="date" defaultValue={data.to} style={input} /></label>
          <button style={button}>Apply period</button>
        </form>

        {view === 'dashboard' && <RecordsTable title="Latest synchronized records" rows={data.records.slice(0, 80)} />}
        {view === 'day' && <RecordsTable title={`Today • ${today}`} rows={todayRows} />}
        {view === 'week' && <WeekBoard rows={data.records} />}
        {view === 'agenda' && <Agenda rows={data.records} />}
        {view === 'people' && <PeopleBoard rows={data.records} />}
        {view === 'exceptions' && <RecordsTable title="Exceptions requiring HR control" rows={exceptionRows} />}
      </div>
    </AppShell>
  )
}

function Kpi({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div style={card}><span style={muted}>{label}</span><strong style={kpiValue}>{value}</strong><small style={muted}>{detail}</small></div>
}

function RecordsTable({ title, rows }: { title: string; rows: any[] }) {
  return <section style={panel}><Header title={title} subtitle="Enterprise template: staff, date, punch pairs, status, worked time, source, anomaly." />
    <div style={{ overflowX: 'auto' }}><table style={table}><thead><tr>{['Staff','Date','IN','Lunch','Back','OUT','Worked','Status','Source','Issue'].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead><tbody>
      {rows.length ? rows.map((r) => <tr key={r.id} style={tr}>
        <td style={td}><strong>{r.staff_name || 'Staff member'}</strong><br/><small>{r.user_id || r.staff_profile_id || 'no-id'}</small></td>
        <td style={td}>{r.attendance_date}</td><td style={td}>{timeOnly(r.check_in)}</td><td style={td}>{timeOnly(r.lunch_start)}</td><td style={td}>{timeOnly(r.lunch_end)}</td><td style={td}>{timeOnly(r.check_out)}</td>
        <td style={td}>{minutesToHours(r.total_minutes)}</td><td style={td}><Badge value={r.status || 'pending'} /></td><td style={td}>{r.source || '—'}</td><td style={td}>{r.anomaly_reason || (r.missing_punch ? 'missing punch' : '—')}</td>
      </tr>) : <tr><td colSpan={10} style={empty}>No attendance records for this view.</td></tr>}
    </tbody></table></div></section>
}

function WeekBoard({ rows }: { rows: any[] }) {
  const days = Array.from(new Set(rows.map((r) => r.attendance_date))).sort().reverse()
  return <section style={grid2}>{days.map((day) => <div key={day} style={panel}><Header title={day} subtitle={`${rows.filter((r) => r.attendance_date === day).length} record(s)`} />{rows.filter((r) => r.attendance_date === day).slice(0, 12).map((r) => <Mini key={r.id} r={r} />)}</div>)}</section>
}

function Agenda({ rows }: { rows: any[] }) {
  return <section style={panel}><Header title="Agenda timeline" subtitle="Chronological HR attendance view." />{rows.map((r) => <div key={r.id} style={agendaRow}><div><strong>{r.attendance_date}</strong><br/><small>{timeOnly(r.check_in)} → {timeOnly(r.check_out)}</small></div><div><strong>{r.staff_name || 'Staff member'}</strong><br/><small>{minutesToHours(r.total_minutes)} • {r.status}</small></div><Badge value={r.anomaly_reason ? 'review' : r.status || 'pending'} /></div>)}</section>
}

function PeopleBoard({ rows }: { rows: any[] }) {
  const names = Array.from(new Set(rows.map((r) => r.staff_name || r.user_id || 'Staff member')))
  return <section style={grid2}>{names.map((name) => { const mine = rows.filter((r) => (r.staff_name || r.user_id || 'Staff member') === name); return <div key={name} style={panel}><Header title={name} subtitle={`${mine.length} attendance record(s)`} /><Kpi label="Worked" value={minutesToHours(mine.reduce((s, r) => s + Number(r.total_minutes || 0), 0))} detail="period total" />{mine.slice(0, 8).map((r) => <Mini key={r.id} r={r} />)}</div> })}</section>
}

function Mini({ r }: { r: any }) { return <div style={mini}><span>{r.attendance_date}</span><strong>{timeOnly(r.check_in)} → {timeOnly(r.check_out)}</strong><Badge value={r.status || 'pending'} /></div> }
function Header({ title, subtitle }: { title: string; subtitle: string }) { return <div style={{ marginBottom: 14 }}><h2 style={h2}>{title}</h2><p style={muted}>{subtitle}</p></div> }
function Badge({ value }: { value: string }) { return <span style={badge}>{value}</span> }

const page: React.CSSProperties = { display: 'grid', gap: 18 }
const hero: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 18, padding: 24, borderRadius: 28, background: 'linear-gradient(135deg,#07111f,#0f766e)', color: 'white', boxShadow: '0 22px 50px rgba(15,23,42,.18)' }
const eyebrow: React.CSSProperties = { fontSize: 12, fontWeight: 900, letterSpacing: 1.4, color: '#99f6e4' }
const h1: React.CSSProperties = { fontSize: 34, margin: '8px 0', letterSpacing: -1 }
const subtitle: React.CSSProperties = { maxWidth: 900, color: '#dbeafe', lineHeight: 1.65, margin: 0 }
const scoreBox: React.CSSProperties = { minWidth: 170, border: '1px solid rgba(255,255,255,.24)', borderRadius: 22, padding: 18, background: 'rgba(255,255,255,.1)' }
const kpiGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 12 }
const card: React.CSSProperties = { padding: 16, borderRadius: 22, background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 10px 24px rgba(15,23,42,.06)', display: 'grid', gap: 6 }
const kpiValue: React.CSSProperties = { fontSize: 25, color: '#0f172a' }
const muted: React.CSSProperties = { color: '#64748b', lineHeight: 1.45 }
const viewsBar: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 10 }
const viewLink = (active: boolean): React.CSSProperties => ({ textDecoration: 'none', padding: 14, borderRadius: 18, display: 'grid', gap: 4, border: active ? '1px solid #0f766e' : '1px solid #e2e8f0', background: active ? '#ecfdf5' : 'white', color: '#0f172a' })
const filters: React.CSSProperties = { display: 'flex', gap: 12, alignItems: 'end', padding: 14, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0' }
const field: React.CSSProperties = { display: 'grid', gap: 6, color: '#334155', fontWeight: 800 }
const input: React.CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 12, padding: '10px 12px', background: 'white' }
const button: React.CSSProperties = { border: 0, borderRadius: 12, padding: '11px 16px', background: '#0f766e', color: 'white', fontWeight: 900 }
const panel: React.CSSProperties = { padding: 18, borderRadius: 24, background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 10px 28px rgba(15,23,42,.05)' }
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }
const h2: React.CSSProperties = { margin: 0, fontSize: 20, color: '#0f172a' }
const table: React.CSSProperties = { width: '100%', borderCollapse: 'separate', borderSpacing: 0 }
const th: React.CSSProperties = { textAlign: 'left', padding: 12, background: '#f8fafc', color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: .5 }
const tr: React.CSSProperties = { verticalAlign: 'top' }
const td: React.CSSProperties = { padding: 12, borderTop: '1px solid #e2e8f0', color: '#0f172a' }
const empty: React.CSSProperties = { padding: 24, textAlign: 'center', color: '#64748b' }
const badge: React.CSSProperties = { display: 'inline-flex', width: 'fit-content', padding: '5px 9px', borderRadius: 999, background: '#f1f5f9', color: '#0f172a', fontSize: 12, fontWeight: 900 }
const mini: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 10, borderTop: '1px solid #e2e8f0' }
const agendaRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: '170px 1fr auto', gap: 14, alignItems: 'center', padding: 12, borderTop: '1px solid #e2e8f0' }
