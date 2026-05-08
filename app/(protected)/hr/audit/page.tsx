import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { HrV2Hero, HrAction, HrPanel, HrMetric, HrGrid, HrTable, HrStatusPill } from '@/lib/hr-unified-v2/ui'
import { HR_TASK_TYPES } from '@/lib/hr-unified-v2/types'
import { saveHrOpening, saveHrCandidate, saveHrOnboarding, saveHrStaffProfile, saveHrDepartment, saveHrPosition, saveHrRoster, saveHrAttendance, saveHrTask, saveHrDocument } from '@/lib/hr-unified-v2/actions'

const input: React.CSSProperties = { width:'100%', border:'1px solid #dbe3ef', borderRadius:14, padding:'11px 12px', fontWeight:700 }
const textarea: React.CSSProperties = { ...input, minHeight:86, gridColumn:'1 / -1' }
const submit: React.CSSProperties = { border:0, borderRadius:14, padding:'12px 16px', background:'#0f172a', color:'white', fontWeight:900, cursor:'pointer' }
const formGrid: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:12 }
const cardLink: React.CSSProperties = { padding:18,borderRadius:20,border:'1px solid #e5e7eb',background:'#f8fafc',textDecoration:'none',color:'#0f172a',fontWeight:950 }

function pick(row:any) { return row.title || row.full_name || row.name || row.staff_name || row.action || row.document_type || row.id }
function detail(row:any) { return row.stage || row.priority || row.owner || row.city || row.area || row.approval_status || row.entity || row.status || '—' }

export default async function Page() {
  const supabase = await createClient()
  const [rowsRes, openingsRes, candidatesRes, staffRes, tasksRes] = await Promise.all([
    supabase.from('hr_audit_logs').select('*').order('created_at', { ascending:false }).limit(80),
    supabase.from('hr_openings').select('*').limit(30),
    supabase.from('hr_candidates').select('*').limit(30),
    supabase.from('hr_staff_profiles').select('*').limit(30),
    supabase.from('hr_tasks').select('*').limit(60),
  ])
  const rows = Array.isArray(rowsRes.data) ? rowsRes.data : []
  const openings = Array.isArray(openingsRes.data) ? openingsRes.data : []
  const candidates = Array.isArray(candidatesRes.data) ? candidatesRes.data : []
  const staff = Array.isArray(staffRes.data) ? staffRes.data : []
  const tasks = Array.isArray(tasksRes.data) ? tasksRes.data : []
  const openTasks = tasks.filter((t:any)=>!['done','completed','closed'].includes(String(t.status||'').toLowerCase()))

  return <AppShell title="HR Audit Trail" subtitle="Trace sensitive HR actions, changes, deletions and status movements." breadcrumbs={[{label:'HR',href:'/hr'},{label:'HR Audit Trail'}]} actions={<><PageAction href="/hr" variant="light">HR Home</PageAction><PageAction href="/hr/command-center">Command Center</PageAction></>}>
    <HrV2Hero title="HR Audit Trail" subtitle="Trace sensitive HR actions, changes, deletions and status movements." actions={<><HrAction href="/hr/tasks">Create HR task</HrAction><HrAction href="/hr/analytics" variant="light">Analytics</HrAction></>} />
    <HrGrid cols={4}><HrMetric icon="🧩" label="Current records" value={rows.length} detail="This workspace"/><HrMetric icon="📌" label="Openings" value={openings.length} detail="Hiring capacity"/><HrMetric icon="🧑‍💼" label="Candidates" value={candidates.length} detail="Pipeline"/><HrMetric icon="✅" label="Open HR tasks" value={openTasks.length} detail="Execution load"/></HrGrid>
    <HrPanel title="Execution controls" subtitle="Create operational records directly from this workspace."><div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:12}}><Link href="/hr/openings" style={cardLink}>Opening Jobs</Link><Link href="/hr/recruitment" style={cardLink}>Recruitment</Link><Link href="/hr/onboarding" style={cardLink}>Onboarding</Link><Link href="/hr/staff" style={cardLink}>Staff Profiles</Link><Link href="/hr/rosters" style={cardLink}>Rosters</Link><Link href="/hr/attendance" style={cardLink}>Attendance</Link></div></HrPanel>
    <HrPanel title="Live records" subtitle="Latest synced data from Supabase."><HrTable headers={['Record','Status','Detail','Owner/Date']} rows={rows.map((r:any)=>[<strong key="a">{pick(r)}</strong>,<HrStatusPill key="b" status={r.status || r.stage || r.approval_status}/>,<span key="c">{detail(r)}</span>,<span key="d">{r.owner || r.manager || r.created_at || '—'}</span>])} /></HrPanel>
    <HrPanel title="Deep execution shortcuts" subtitle="Fast navigation across the unified HR operating system."><div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:12}}><Link href="/hr/openings" style={cardLink}>Opening Jobs</Link><Link href="/hr/recruitment" style={cardLink}>Recruitment</Link><Link href="/hr/onboarding" style={cardLink}>Onboarding</Link><Link href="/hr/staff" style={cardLink}>Staff Profiles</Link><Link href="/hr/departments" style={cardLink}>Departments</Link><Link href="/hr/departments/positions" style={cardLink}>Positions</Link><Link href="/hr/rosters" style={cardLink}>Rosters</Link><Link href="/hr/attendance" style={cardLink}>Attendance</Link></div></HrPanel>
  </AppShell>
}
