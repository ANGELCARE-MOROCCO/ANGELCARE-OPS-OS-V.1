import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getAttendanceCommandData, minutesToHours, timeOnly } from '@/lib/hr-attendance-sync/repository'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getAttendanceCommandData({ userId: id })
  return <AppShell title="Staff Attendance" subtitle="Staff attendance synchronized from punch-in / punch-out engine." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Staff',href:'/hr/staff'},{label:'Attendance'}]} actions={<><PageAction href="/hr/staff" variant="light">Staff</PageAction><PageAction href="/hr/attendance">Enterprise Attendance</PageAction></>}>
    <div style={{display:'grid',gap:16}}>
      <section style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:12}}><Kpi label="Records" value={String(data.metrics.records)} /><Kpi label="Completed" value={String(data.metrics.completed)} /><Kpi label="Exceptions" value={String(data.metrics.exceptions)} /><Kpi label="Worked" value={minutesToHours(data.metrics.totalMinutes)} /></section>
      <section style={{padding:18,border:'1px solid #e2e8f0',borderRadius:24,background:'white'}}><h2>Staff attendance records</h2><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'separate',borderSpacing:0}}><thead><tr>{['Date','IN','OUT','Worked','Status','Issue'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{data.records.length ? data.records.map(r=><tr key={r.id}><td style={td}>{r.attendance_date}</td><td style={td}>{timeOnly(r.check_in)}</td><td style={td}>{timeOnly(r.check_out)}</td><td style={td}>{minutesToHours(r.total_minutes)}</td><td style={td}>{r.status}</td><td style={td}>{r.anomaly_reason || '—'}</td></tr>) : <tr><td colSpan={6} style={td}>No attendance records.</td></tr>}</tbody></table></div></section>
    </div>
  </AppShell>
}
function Kpi({label,value}:{label:string;value:string}){return <div style={{padding:16,border:'1px solid #e2e8f0',borderRadius:20,background:'white'}}><span style={{color:'#64748b'}}>{label}</span><br/><strong style={{fontSize:24}}>{value}</strong></div>}
const th:React.CSSProperties={textAlign:'left',padding:12,background:'#f8fafc',fontSize:12,color:'#475569'}; const td:React.CSSProperties={padding:12,borderTop:'1px solid #e2e8f0'}
