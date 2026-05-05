import type { CSSProperties } from 'react'
import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { requireAccess } from '@/lib/auth/requireAccess'
import { CARE_DEPARTMENTS, ANGELCARE_POSITIONS, HR_V2_MODULES } from '@/lib/hr-v2/workforce'

type SearchParams = { department?: string; status?: string; q?: string; view?: string }
type AppUser = Record<string, any>
type AttendanceLog = Record<string, any>
type HRRecord = Record<string, any>

const safeArray = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : [])
const todayIso = () => new Date().toISOString().slice(0, 10)

export default async function AngelCareHRV2Page({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  await requireAccess('hr.view')

  const filters = searchParams ? await searchParams : {}
  const departmentFilter = filters?.department || 'all'
  const statusFilter = filters?.status || 'all'
  const q = (filters?.q || '').toLowerCase().trim()

  const supabase = await createClient()
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  const [
    { data: usersRaw },
    { data: logsRaw },
    { data: profilesRaw },
    { data: rostersRaw },
    { data: leaveRaw },
    { data: reviewsRaw },
    { data: certsRaw },
    { data: docsRaw },
    { data: approvalsRaw },
    { data: notesRaw },
    { data: disciplineRaw },
  ] = await Promise.all([
    supabase.from('app_users').select('*').order('full_name', { ascending: true }),
    supabase
      .from('app_attendance_logs')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false }),
    supabase.from('hr_staff_profiles').select('*').limit(500),
    supabase
      .from('hr_rosters')
      .select('*')
      .gte('shift_date', todayIso())
      .order('shift_date', { ascending: true })
      .limit(200),
    supabase.from('hr_leave_requests').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('hr_performance_reviews').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('hr_certifications').select('*').order('expiry_date', { ascending: true }).limit(120),
    supabase.from('hr_staff_documents').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('hr_approval_requests').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('hr_staff_notifications').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('hr_disciplinary_actions').select('*').order('created_at', { ascending: false }).limit(100),
  ])

  const users = safeArray<AppUser>(usersRaw).filter((u) => u.status !== 'inactive')
  const logs = safeArray<AttendanceLog>(logsRaw)
  const profiles = safeArray<HRRecord>(profilesRaw)
  const rosters = safeArray<HRRecord>(rostersRaw)
  const leaveRequests = safeArray<HRRecord>(leaveRaw)
  const reviews = safeArray<HRRecord>(reviewsRaw)
  const certs = safeArray<HRRecord>(certsRaw)
  const docs = safeArray<HRRecord>(docsRaw)
  const approvals = safeArray<HRRecord>(approvalsRaw)
  const notes = safeArray<HRRecord>(notesRaw)
  const discipline = safeArray<HRRecord>(disciplineRaw)

  const logsByUser = new Map<string, AttendanceLog[]>()
  logs.forEach((log) => {
    const userId = String(log.user_id || '')
    if (!logsByUser.has(userId)) logsByUser.set(userId, [])
    logsByUser.get(userId)!.push(log)
  })

  const profileByUser = new Map(profiles.map((p) => [String(p.user_id), p]))

  const enriched = users.map((user) => {
    const p = profileByUser.get(String(user.id)) || {}
    const latest = (logsByUser.get(String(user.id)) || [])[0]
    const action = latest?.action || 'no_activity'
    const position = p.position_title || user.job_title || user.role || 'Unassigned Position'
    const department = p.department || user.department || findPositionDepartment(position) || 'Unassigned'

    return {
      user,
      profile: p,
      latest,
      action,
      statusLabel: statusLabel(action),
      statusTone: statusTone(action),
      position,
      department,
      readiness: Number(
        p.readiness_score ?? calculateReadiness(user, logsByUser.get(String(user.id)) || [], certs, docs)
      ),
      contractType: p.contract_type || 'Not set',
      probation: p.probation_status || 'Not tracked',
    }
  })

  const visibleStaff = enriched.filter((item) => {
    const matchDepartment = departmentFilter === 'all' || item.department === departmentFilter
    const matchStatus = statusFilter === 'all' || item.action === statusFilter
    const body = `${item.user.full_name || ''} ${item.user.username || ''} ${item.position} ${item.department} ${item.contractType}`.toLowerCase()
    return matchDepartment && matchStatus && (!q || body.includes(q))
  })

  const activeCount = enriched.filter((s) => ['shift_in', 'lunch_end'].includes(s.action)).length
  const breakCount = enriched.filter((s) => s.action === 'lunch_start').length
  const outCount = enriched.filter((s) => s.action === 'shift_out').length
  const noActivity = enriched.filter((s) => s.action === 'no_activity').length
  const avgReadiness = enriched.length ? Math.round(enriched.reduce((a, s) => a + s.readiness, 0) / enriched.length) : 0
  const pendingLeave = leaveRequests.filter((r) => ['pending', 'submitted', 'requested'].includes(String(r.status || '').toLowerCase())).length
  const pendingApprovals = approvals.filter((r) => ['pending', 'submitted', 'requested'].includes(String(r.status || '').toLowerCase())).length
  const expiringCerts = certs.filter((c) => isExpiring(c.expiry_date)).length
  const openDiscipline = discipline.filter((d) => !['closed', 'resolved'].includes(String(d.status || '').toLowerCase())).length
  const departments = Array.from(new Set([...safeList(CARE_DEPARTMENTS).map((d: any) => d.name), ...enriched.map((s) => s.department).filter(Boolean)])).sort()
  const days = buildMonthDays(now)

  return (
    <AppShell
      title="AngelCare Workforce Command Center"
      subtitle="Single HR V2 operating desk for positions, staff files, attendance, roster, leave, training, compliance, performance, documents and approvals."
      breadcrumbs={[{ label: 'HR' }, { label: 'Workforce Command Center' }]}
      actions={
        <>
          <PageAction href="/users/new" variant="light">New Staff</PageAction>
          <PageAction href="/pointage">Open Pointage</PageAction>
        </>
      }
    >
      <main style={styles.page}>
        <section style={styles.hero}>
          <div style={styles.heroText}>
            <div style={styles.badge}>HR V2 • ANGELCARE WORKFORCE OPERATING SYSTEM</div>
            <h1 style={styles.title}>One command center for every AngelCare worker, duty, roster, permission and risk signal.</h1>
            <p style={styles.subtitle}>Built to unify office staff, caregivers, sales, marketing, academy and management into one operational HR brain. It reads your existing users/attendance immediately and connects to the new HR tables when you run the SQL migration.</p>
            <div style={styles.heroGrid}>
              <Mini label="Active staff" value={String(activeCount)} tone="#22c55e" />
              <Mini label="Avg readiness" value={`${avgReadiness}%`} tone="#38bdf8" />
              <Mini label="Pending approvals" value={String(pendingApprovals)} tone="#f59e0b" />
              <Mini label="Compliance alerts" value={String(expiringCerts + openDiscipline)} tone="#ef4444" />
            </div>
          </div>

          <div style={styles.commandCard}>
            <strong>Today command briefing</strong>
            <p>{users.length} active staff profiles detected. {logs.length} pointage events today. {rosters.length} upcoming roster rows loaded. {pendingLeave} leave requests need HR review.</p>
            <div style={styles.progress}><span style={{ ...styles.progressFill, width: `${Math.min(avgReadiness, 100)}%` }} /></div>
            <small>Readiness score is calculated from profile, attendance, documents and certifications. It becomes more accurate after the migration is installed.</small>
          </div>
        </section>

        <section style={styles.kpis}>
          <Kpi title="In service" value={activeCount} note="shift in / back from break" tone="#22c55e" />
          <Kpi title="On break" value={breakCount} note="active lunch/break status" tone="#f59e0b" />
          <Kpi title="Shift completed" value={outCount} note="clocked out today" tone="#ef4444" />
          <Kpi title="No activity" value={noActivity} note="no pointage signal today" tone="#94a3b8" />
          <Kpi title="Leave pending" value={pendingLeave} note="requests waiting decision" tone="#8b5cf6" />
          <Kpi title="Expiring certs" value={expiringCerts} note="within 45 days" tone="#0ea5e9" />
        </section>

        <section id="gateways" style={styles.panel}>
          <Header title="Permission-aware HR gateways" text="Direct access to every connected module HR needs to control workforce execution." />
          <div style={styles.gatewayGrid}>
            {safeList(HR_V2_MODULES).map((m: any, moduleIndex: number) => (
              <Link key={`${m.label || 'module'}-${moduleIndex}`} href={m.href || '/hr'} style={styles.gateway}>
                <b>{m.icon} {m.label}</b>
                <span>{m.description}</span>
                <em>{m.permission}</em>
              </Link>
            ))}
          </div>
        </section>

        <section style={styles.filterPanel}>
          <form style={styles.filters}>
            <label style={styles.field}><span>Department</span><select name="department" defaultValue={departmentFilter} style={styles.input}><option value="all">All departments</option>{departments.map((d, departmentIndex) => <option key={`${d}-${departmentIndex}`} value={d}>{d}</option>)}</select></label>
            <label style={styles.field}><span>Status</span><select name="status" defaultValue={statusFilter} style={styles.input}><option value="all">All statuses</option><option value="shift_in">In service</option><option value="lunch_start">On break</option><option value="lunch_end">Back</option><option value="shift_out">Out</option><option value="no_activity">No activity</option></select></label>
            <label style={styles.fieldWide}><span>Search staff / position / contract</span><input name="q" defaultValue={filters?.q || ''} placeholder="Search HR workforce..." style={styles.input} /></label>
            <button style={styles.button}>Apply filters</button>
          </form>
        </section>

        <section id="directory" style={styles.panel}>
          <Header title="Staff command directory" text="Unified staff list with position, department, pointage state, contract type, probation and readiness." />
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead><tr><th>Staff</th><th>Position</th><th>Department</th><th>Today</th><th>Contract</th><th>Probation</th><th>Readiness</th><th>Open</th></tr></thead>
              <tbody>
                {visibleStaff.slice(0, 80).map((s) => (
                  <tr key={`${String(s.user.id || s.user.email || s.user.username || "staff")}-${s.position}-${s.department}`}>
                    <td><b>{s.user.full_name || s.user.username || 'Unnamed'}</b><small>{s.user.email || s.user.username || s.user.role}</small></td>
                    <td>{s.position}</td>
                    <td>{s.department}</td>
                    <td><span style={{ ...styles.pill, background: s.statusTone }}>{s.statusLabel}</span></td>
                    <td>{s.contractType}</td>
                    <td>{s.probation}</td>
                    <td><b>{s.readiness}%</b></td>
                    <td><Link href={`/users/${s.user.id}`} style={styles.linkBtn}>Profile</Link></td>
                  </tr>
                ))}
                {!visibleStaff.length && <tr><td colSpan={8}>No staff found for this filter.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section id="positions" style={styles.panel}>
          <Header title="AngelCare position catalog" text="All logical positions AngelCare needs, grouped by department, with mission, KPIs, default shifts and permission presets." />
          <div style={styles.positionGrid}>{safeList(ANGELCARE_POSITIONS).map((p: any, index: number) => <article key={`${p.department || 'department'}-${p.title || 'position'}-${index}`} style={styles.positionCard}><div><strong>{p.title}</strong><span>{p.department} • {p.level}</span></div><p>{p.mission}</p><div style={styles.tagRow}>{safeList((p as any).kpis).map((k: any, kIndex: number) => <em key={`${p.title || 'position'}-kpi-${String(k)}-${kIndex}`}>{String(k)}</em>)}</div><small>Shift: {p.defaultShift}</small><small>Permissions: {safeTextList((p as any).permissions)}</small></article>)}</div>
        </section>

        <section id="departments" style={styles.panel}>
          <Header title="Departments and workforce structure" text="A proper HR system needs departments as operating entities, not just labels inside users." />
          <div style={styles.deptGrid}>{safeList(CARE_DEPARTMENTS).map((d: any, deptIndex: number) => { const count = enriched.filter((s) => s.department === d.name).length; return <div key={`${d.code || d.name || 'department'}-${deptIndex}`} style={styles.deptCard}><div style={{ ...styles.deptDot, background: d.color }} /><b>{d.name}</b><p>{d.description}</p><strong>{count} detected staff</strong></div> })}</div>
        </section>

        <section id="roster" style={styles.panel}>
          <Header title="Monthly roster board" text="Clickable monthly workforce roster. Shows upcoming duties from hr_rosters after SQL migration; before that, it displays structure-ready cells." />
          <div style={styles.rosterToolbar}><Link href="/hr?view=month#roster" style={styles.linkBtn}>Month view</Link><Link href="/hr?status=no_activity#directory" style={styles.linkBtn}>Uncovered / no activity</Link><Link href="/missions" style={styles.linkBtn}>Open missions</Link></div>
          <div style={styles.monthGrid}>{days.map((day) => { const rows = rosters.filter((r) => String(r.shift_date || '').slice(0, 10) === day.iso); return <Link href={`/hr?date=${day.iso}#roster`} key={day.iso} style={styles.dayCell}><b>{day.day}</b><span>{day.label}</span>{rows.slice(0, 3).map((r, i) => <em key={`${day.iso}-roster-${i}`}>{r.shift_label || r.duty_type || 'Duty'} • {r.shift_start || '--'}-{r.shift_end || '--'}</em>)}{!rows.length && <small>No roster row</small>}</Link> })}</div>
        </section>

        <section style={styles.twoCol}>
          <div id="leave" style={styles.panel}><Header title="Leave / absence control" text="Requests, status and coverage impact." />{leaveRequests.slice(0, 8).map((r, i) => <Row key={`leave-${r.id || r.request_type || i}-${i}`} title={r.request_type || 'Leave request'} meta={`${r.status || 'pending'} • ${r.start_date || ''} ${r.end_date ? '→ ' + r.end_date : ''}`} href="/hr#leave" />)}{!leaveRequests.length && <Empty text="No hr_leave_requests rows yet. Run SQL migration to activate." />}</div>
          <div id="approvals" style={styles.panel}><Header title="HR approvals workflow" text="Central queue for HR decisions, escalations and management validation." />{approvals.slice(0, 8).map((r, i) => <Row key={`approval-${r.id || r.title || i}-${i}`} title={r.title || r.request_type || 'Approval request'} meta={`${r.status || 'pending'} • ${r.priority || 'normal'}`} href="/hr#approvals" />)}{!approvals.length && <Empty text="No hr_approval_requests rows yet." />}</div>
        </section>

        <section style={styles.twoCol}>
          <div id="training" style={styles.panel}><Header title="Training and certification" text="Certifications, training status, expiry and placement readiness." />{certs.slice(0, 8).map((c, i) => <Row key={`cert-${c.id || c.certification_name || i}-${i}`} title={c.certification_name || 'Certification'} meta={`${c.status || 'active'} • expires ${c.expiry_date || 'not set'}`} href="/academy" />)}{!certs.length && <Empty text="No hr_certifications rows yet." />}</div>
          <div id="documents" style={styles.panel}><Header title="Documents and staff file" text="Contracts, IDs, evidence, HR documents and missing file alerts." />{docs.slice(0, 8).map((d, i) => <Row key={`doc-${d.id || d.document_type || i}-${i}`} title={d.document_type || d.title || 'Staff document'} meta={`${d.status || 'stored'} • ${d.expiry_date || 'no expiry'}`} href="/contracts" />)}{!docs.length && <Empty text="No hr_staff_documents rows yet." />}</div>
        </section>

        <section style={styles.twoCol}>
          <div id="performance" style={styles.panel}><Header title="Performance scoring" text="Review score, quality notes, KPI evaluation and manager feedback." />{reviews.slice(0, 8).map((r, i) => <Row key={`review-${r.id || r.review_title || i}-${i}`} title={r.review_title || 'Performance review'} meta={`Score ${r.overall_score ?? '--'} • ${r.status || 'draft'}`} href="/hr#performance" />)}{!reviews.length && <Empty text="No hr_performance_reviews rows yet." />}</div>
          <div id="compliance" style={styles.panel}><Header title="Disciplinary and compliance risk" text="Open warnings, corrective actions, incidents and audit signals." />{discipline.slice(0, 8).map((d, i) => <Row key={`discipline-${d.id || d.action_type || i}-${i}`} title={d.action_type || 'Disciplinary action'} meta={`${d.status || 'open'} • ${d.severity || 'normal'}`} href="/incidents" />)}{!discipline.length && <Empty text="No hr_disciplinary_actions rows yet." />}</div>
        </section>

        <section id="memos" style={styles.panel}>
          <Header title="Management memos and pushed notifications" text="HR messages to staff, reminders, operational broadcasts and management notes." />
          <div style={styles.memoGrid}>{notes.slice(0, 9).map((n, i) => <article key={`memo-${n.id || n.title || i}-${i}`} style={styles.memo}><b>{n.title || 'Staff notification'}</b><p>{n.message || n.body || 'No message body'}</p><small>{n.priority || 'normal'} • {n.created_at ? new Date(n.created_at).toLocaleString() : ''}</small></article>)}{!notes.length && <Empty text="No hr_staff_notifications rows yet. Staff Home can reuse this table for pushed memos." />}</div>
        </section>
      </main>
    </AppShell>
  )
}

function Header({ title, text }: { title: string; text: string }) { return <div style={styles.header}><h2>{title}</h2><p>{text}</p></div> }
function Mini({ label, value, tone }: { label: string; value: string; tone: string }) { return <div style={styles.mini}><span>{label}</span><b style={{ color: tone }}>{value}</b></div> }
function Kpi({ title, value, note, tone }: { title: string; value: number; note: string; tone: string }) { return <div style={styles.kpi}><span style={{ background: tone }} /><b>{value}</b><strong>{title}</strong><small>{note}</small></div> }
function Row({ title, meta, href }: { title: string; meta: string; href: string }) { return <Link href={href} style={styles.row}><b>{title}</b><span>{meta}</span><em>Open →</em></Link> }
function Empty({ text }: { text: string }) { return <p style={styles.empty}>{text}</p> }

function safeList(value: unknown): any[] {
  return Array.isArray(value) ? value : []
}

function safeTextList(value: unknown) {
  return safeList(value).filter(Boolean).map(String).join(', ') || '—'
}

function statusLabel(action: string) {
  return ({ shift_in: 'In service', lunch_start: 'On break', lunch_end: 'Back', shift_out: 'Out', no_activity: 'No activity' } as Record<string, string>)[action] || action || 'No activity'
}
function statusTone(action: string) {
  return ({ shift_in: '#16a34a', lunch_start: '#f59e0b', lunch_end: '#0284c7', shift_out: '#ef4444', no_activity: '#64748b' } as Record<string, string>)[action] || '#64748b'
}
function findPositionDepartment(position: string) { return safeList(ANGELCARE_POSITIONS).find((p: any) => String(p.title || '').toLowerCase() === String(position).toLowerCase())?.department }
function isExpiring(value: any) { if (!value) return false; const days = (new Date(value).getTime() - Date.now()) / 86400000; return days >= 0 && days <= 45 }
function calculateReadiness(user: any, logs: any[], certs: any[], docs: any[]) { let score = 45; if (user.full_name) score += 10; if (user.job_title || user.role) score += 10; if (user.department) score += 10; if (logs.length) score += 10; if (certs.some((c) => String(c.user_id) === String(user.id))) score += 8; if (docs.some((d) => String(d.user_id) === String(user.id))) score += 7; return Math.min(score, 100) }
function buildMonthDays(now: Date) { const year = now.getFullYear(); const month = now.getMonth(); const last = new Date(year, month + 1, 0).getDate(); return Array.from({ length: last }, (_, i) => { const d = new Date(year, month, i + 1); return { day: i + 1, iso: d.toISOString().slice(0, 10), label: d.toLocaleDateString('en-US', { weekday: 'short' }) } }) }

const styles: Record<string, CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 },
  hero: { display: 'grid', gridTemplateColumns: '1.8fr .9fr', gap: 22, padding: 28, borderRadius: 30, background: 'linear-gradient(135deg,#06111f,#12345a 55%,#0f766e)', color: 'white', boxShadow: '0 30px 80px rgba(15,23,42,.25)' },
  heroText: { display: 'flex', flexDirection: 'column', gap: 16 },
  badge: { width: 'fit-content', padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,.14)', fontSize: 12, fontWeight: 900, letterSpacing: 0.8 },
  title: { fontSize: 42, lineHeight: 1.05, margin: 0, maxWidth: 950 },
  subtitle: { fontSize: 16, lineHeight: 1.7, maxWidth: 930, opacity: 0.9 },
  heroGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 },
  mini: { padding: 14, borderRadius: 18, background: 'rgba(255,255,255,.12)', display: 'flex', flexDirection: 'column', gap: 6 },
  commandCard: { padding: 20, borderRadius: 24, background: 'rgba(255,255,255,.13)', border: '1px solid rgba(255,255,255,.18)', display: 'flex', flexDirection: 'column', gap: 13 },
  progress: { height: 10, borderRadius: 999, background: 'rgba(255,255,255,.2)', overflow: 'hidden' },
  progressFill: { display: 'block', height: '100%', borderRadius: 999, background: 'white' },
  kpis: { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14 },
  kpi: { padding: 18, borderRadius: 22, background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 12px 32px rgba(15,23,42,.07)', display: 'flex', flexDirection: 'column', gap: 5 },
  panel: { padding: 22, borderRadius: 28, background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 16px 45px rgba(15,23,42,.06)' },
  header: { marginBottom: 16 },
  gatewayGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 },
  gateway: { padding: 16, borderRadius: 20, textDecoration: 'none', color: '#0f172a', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 8 },
  filterPanel: { padding: 16, borderRadius: 22, background: '#0f172a' },
  filters: { display: 'grid', gridTemplateColumns: '220px 200px 1fr 140px', gap: 12, alignItems: 'end' },
  field: { display: 'flex', flexDirection: 'column', gap: 6, color: 'white', fontSize: 12, fontWeight: 800 },
  fieldWide: { display: 'flex', flexDirection: 'column', gap: 6, color: 'white', fontSize: 12, fontWeight: 800 },
  input: { border: '1px solid #cbd5e1', borderRadius: 14, padding: '12px 13px', fontSize: 14 },
  button: { border: 0, borderRadius: 14, padding: '13px 16px', fontWeight: 900, background: '#38bdf8', color: '#082f49' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' },
  pill: { color: 'white', borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 900 },
  linkBtn: { textDecoration: 'none', borderRadius: 12, padding: '9px 12px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 900, display: 'inline-flex' },
  positionGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14, maxHeight: 760, overflow: 'auto', paddingRight: 4 },
  positionCard: { padding: 16, borderRadius: 20, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 9 },
  tagRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  deptGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 },
  deptCard: { padding: 18, borderRadius: 20, background: '#f8fafc', border: '1px solid #e2e8f0' },
  deptDot: { width: 14, height: 14, borderRadius: 99, marginBottom: 8 },
  rosterToolbar: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 },
  monthGrid: { display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 10 },
  dayCell: { minHeight: 118, padding: 12, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', textDecoration: 'none', color: '#0f172a', display: 'flex', flexDirection: 'column', gap: 5 },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 },
  row: { padding: 13, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', textDecoration: 'none', color: '#0f172a', display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 10 },
  empty: { padding: 16, borderRadius: 16, background: '#f8fafc', color: '#64748b' },
  memoGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 },
  memo: { padding: 16, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0' },
}