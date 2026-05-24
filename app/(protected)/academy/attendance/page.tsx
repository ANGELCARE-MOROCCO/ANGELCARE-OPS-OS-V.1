import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAccess } from '@/lib/auth/requireAccess'

export const dynamic = 'force-dynamic'

type AnyRow = Record<string, any>

type SidebarItem = { label: string; href: string; icon: string; group: 'academy' | 'system' }

const sidebarItems: SidebarItem[] = [
  { label: 'Command Center', href: '/academy', icon: '⌂', group: 'academy' },
  { label: 'Trainees', href: '/academy/trainees', icon: '👥', group: 'academy' },
  { label: 'Enrollments', href: '/academy/enrollments', icon: '▣', group: 'academy' },
  { label: 'Attendance', href: '/academy/attendance', icon: '☑', group: 'academy' },
  { label: 'Payments', href: '/academy/payments', icon: '▤', group: 'academy' },
  { label: 'Certificates', href: '/academy/certificates', icon: '◎', group: 'academy' },
  { label: 'Trainers', href: '/academy/trainers', icon: '♙', group: 'academy' },
  { label: 'Programs', href: '/academy/courses', icon: '▦', group: 'academy' },
  { label: 'Job Placement', href: '/academy/job-placement', icon: '▱', group: 'academy' },
  { label: 'Partners & Employers', href: '/academy/partners', icon: '♧', group: 'academy' },
  { label: 'Announcements', href: '/academy/alerts-sales', icon: '◁', group: 'academy' },
  { label: 'Reports & Analytics', href: '/academy/reports', icon: '⌁', group: 'academy' },
  { label: 'Integrations', href: '/academy/integrations', icon: '⚙', group: 'system' },
  { label: 'Automation', href: '/academy/automation', icon: '◇', group: 'system' },
  { label: 'Settings', href: '/academy/settings', icon: '⚙', group: 'system' },
]

const attendanceStatuses = ['present', 'late', 'absent', 'excused', 'makeup_required', 'validated']
const presentStatuses = new Set(['present', 'validated'])
const riskStatuses = new Set(['absent', 'late', 'makeup_required'])

function text(value: unknown, fallback = '—') {
  const s = String(value ?? '').trim()
  return s || fallback
}

function number(value: unknown) {
  const n = Number(value || 0)
  return Number.isFinite(n) ? n : 0
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function statusTone(status: string) {
  const s = status.toLowerCase()
  if (['present', 'validated', 'complete', 'completed'].includes(s)) return { bg: '#dcfce7', fg: '#16a34a', bd: '#bbf7d0' }
  if (['late', 'makeup_required', 'pending'].includes(s)) return { bg: '#ffedd5', fg: '#ea580c', bd: '#fed7aa' }
  if (['absent', 'critical', 'blocked'].includes(s)) return { bg: '#fee2e2', fg: '#e11d48', bd: '#fecdd3' }
  if (['excused', 'on_hold'].includes(s)) return { bg: '#f3e8ff', fg: '#7c3aed', bd: '#e9d5ff' }
  return { bg: '#f1f5f9', fg: '#475569', bd: '#e2e8f0' }
}

function nameOf(list: AnyRow[], id?: string | null, fallback = '—') {
  if (!id) return fallback
  const row = list.find((x) => x.id === id)
  return row?.full_name || row?.name || row?.title || fallback
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('') || 'AC'
}

async function safeTable(supabase: any, table: string) {
  const { data } = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(300)
  return data || []
}

async function audit(table: string, entityId: string | null, message: string) {
  const supabase = await createClient()
  await supabase.from('academy_audit_logs').insert({ action: message, entity: table, entity_id: entityId, notes: message })
}

export async function saveAttendanceAction(fd: FormData) {
  'use server'
  await requireAccess('academy.manage')
  const supabase = await createClient()
  const traineeId = String(fd.get('trainee_id') || '').trim()
  const groupId = String(fd.get('group_id') || '').trim() || null
  const sessionDate = String(fd.get('session_date') || todayISO()).trim()
  const status = String(fd.get('status') || 'present').trim()
  const note = String(fd.get('note') || '').trim() || null

  if (!traineeId) throw new Error('Trainee is required')

  let lookup = supabase.from('academy_attendance').select('id').eq('trainee_id', traineeId).eq('session_date', sessionDate).limit(1)
  lookup = groupId ? lookup.eq('group_id', groupId) : lookup.is('group_id', null)
  const { data: existing, error: lookupError } = await lookup.maybeSingle()
  if (lookupError) throw new Error(lookupError.message)

  if (existing?.id) {
    const { error } = await supabase.from('academy_attendance').update({ status, note, group_id: groupId, updated_at: new Date().toISOString() }).eq('id', existing.id)
    if (error) throw new Error(error.message)
    await audit('academy_attendance', existing.id, `attendance_updated_${status}`)
  } else {
    const { data, error } = await supabase.from('academy_attendance').insert({ trainee_id: traineeId, group_id: groupId, session_date: sessionDate, status, note }).select('id').single()
    if (error) throw new Error(error.message)
    await audit('academy_attendance', data?.id || null, `attendance_created_${status}`)
  }

  revalidatePath('/academy/attendance')
  revalidatePath('/academy/trainees')
  revalidatePath('/academy/enrollments')
}

export async function bulkTodayAttendanceAction(fd: FormData) {
  'use server'
  await requireAccess('academy.manage')
  const supabase = await createClient()
  const groupId = String(fd.get('group_id') || '').trim()
  const status = String(fd.get('status') || 'present').trim()
  const sessionDate = String(fd.get('session_date') || todayISO()).trim()
  if (!groupId) throw new Error('Group is required')

  const { data: enrollments, error: enrollError } = await supabase.from('academy_enrollments').select('trainee_id').eq('group_id', groupId).in('status', ['enrolled', 'active', 'ongoing'])
  if (enrollError) throw new Error(enrollError.message)

  const traineeIds = Array.from(new Set((enrollments || []).map((x: AnyRow) => x.trainee_id).filter(Boolean)))
  for (const traineeId of traineeIds) {
    const { data: existing } = await supabase.from('academy_attendance').select('id').eq('trainee_id', traineeId).eq('group_id', groupId).eq('session_date', sessionDate).maybeSingle()
    if (existing?.id) {
      await supabase.from('academy_attendance').update({ status, updated_at: new Date().toISOString() }).eq('id', existing.id)
    } else {
      await supabase.from('academy_attendance').insert({ trainee_id: traineeId, group_id: groupId, session_date: sessionDate, status })
    }
  }

  await audit('academy_attendance', groupId, `bulk_attendance_${status}_${traineeIds.length}`)
  revalidatePath('/academy/attendance')
  revalidatePath('/academy/enrollments')
}

function AcademySidebar() {
  return <aside style={{ position: 'sticky', top: 0, alignSelf: 'start', minHeight: '100vh', width: 292, background: '#fff', borderRight: '1px solid #e7ecf4', padding: '28px 18px', boxShadow: '18px 0 45px rgba(15,23,42,.035)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 30 }}><div style={{ width: 54, height: 54, borderRadius: 18, background: 'linear-gradient(135deg,#355df6,#7c3aed)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 27 }}>🎓</div><div><h2 style={{ margin: 0, fontSize: 21, letterSpacing: '-.04em' }}>Academy OS</h2><p style={{ margin: '6px 0 0', color: '#64748b', fontWeight: 800 }}>Attendance Command</p></div></div>
    <p style={{ margin: '0 0 12px', color: '#355df6', fontSize: 12, fontWeight: 950, letterSpacing: '.24em' }}>ACADEMY</p>
    <nav style={{ display: 'grid', gap: 6 }}>{sidebarItems.filter((i: SidebarItem) => i.group === 'academy').map((item: SidebarItem) => <Link key={item.href} href={item.href} style={{ minHeight: 46, display: 'flex', alignItems: 'center', gap: 13, padding: '0 14px', borderRadius: 14, background: item.href === '/academy/attendance' ? '#eef2ff' : 'transparent', color: item.href === '/academy/attendance' ? '#355df6' : '#334155', textDecoration: 'none', fontWeight: 950, fontSize: 15 }}><span style={{ width: 23, textAlign: 'center', fontSize: 14 }}>{item.icon}</span>{item.label}</Link>)}</nav>
    <p style={{ margin: '30px 0 12px', color: '#64748b', fontSize: 12, fontWeight: 950, letterSpacing: '.24em' }}>SYSTEM</p>
    <nav style={{ display: 'grid', gap: 6 }}>{sidebarItems.filter((i: SidebarItem) => i.group === 'system').map((item: SidebarItem) => <Link key={item.href} href={item.href} style={{ minHeight: 46, display: 'flex', alignItems: 'center', gap: 13, padding: '0 14px', borderRadius: 14, color: '#334155', textDecoration: 'none', fontWeight: 950, fontSize: 15 }}><span style={{ width: 23, textAlign: 'center', fontSize: 14 }}>{item.icon}</span>{item.label}</Link>)}</nav>
    <div style={{ marginTop: 30, border: '1px solid #e7ecf4', borderRadius: 20, padding: 18 }}><strong style={{ display: 'block' }}>Academy OS</strong><span style={{ display: 'block', marginTop: 8, color: '#16a34a', fontWeight: 900 }}>● Online</span><p style={{ margin: '8px 0 0', color: '#64748b', fontWeight: 800, fontSize: 13 }}>Live attendance, groups and trainee sync.</p></div>
  </aside>
}

function Card({ children, style, id }: { children: React.ReactNode; style?: React.CSSProperties; id?: string }) {
  return <section id={id} style={{ background: '#fff', border: '1px solid #e7ecf4', borderRadius: 26, boxShadow: '0 18px 45px rgba(15,23,42,.045)', ...style }}>{children}</section>
}

function Kpi({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub: string; color: string }) {
  return <Card style={{ padding: 22 }}><div style={{ display: 'flex', gap: 16, alignItems: 'center' }}><span style={{ width: 48, height: 48, borderRadius: 15, background: `${color}14`, color, display: 'grid', placeItems: 'center', fontSize: 22, boxShadow: `inset 0 0 0 1px ${color}25` }}>{icon}</span><div><p style={{ margin: 0, color: '#64748b', fontSize: 12, fontWeight: 950 }}>{label}</p><strong style={{ display: 'block', marginTop: 5, fontSize: 29, letterSpacing: '-.05em' }}>{value}</strong><p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: 11, fontWeight: 850 }}>{sub}</p></div></div></Card>
}

function Badge({ children, value }: { children: React.ReactNode; value: string }) {
  const t = statusTone(value)
  return <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 32, border: `1px solid ${t.bd}`, background: t.bg, color: t.fg, borderRadius: 999, padding: '0 14px', fontSize: 12, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.08em' }}>{children}</span>
}

function Progress({ value, color = '#355df6' }: { value: number; color?: string }) {
  return <div style={{ height: 10, background: '#eef2f7', borderRadius: 999, overflow: 'hidden' }}><div style={{ width: `${Math.min(100, Math.max(0, value))}%`, height: '100%', background: color, borderRadius: 999 }} /></div>
}

function Ring({ value, label, color = '#355df6' }: { value: number; label: string; color?: string }) {
  return <div style={{ width: 150, height: 150, borderRadius: '50%', background: `conic-gradient(${color} ${value * 3.6}deg,#edf2f7 0deg)`, display: 'grid', placeItems: 'center' }}><div style={{ width: 108, height: 108, borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center', textAlign: 'center' }}><strong style={{ fontSize: 28 }}>{value}%</strong><span style={{ color: '#64748b', fontWeight: 850, fontSize: 11 }}>{label}</span></div></div>
}

export default async function AcademyAttendancePage() {
  await requireAccess('academy.view')
  const supabase = await createClient()
  const [trainees, groups, enrollments, attendance, courses, trainers, payments, certificates, auditLogs] = await Promise.all([
    safeTable(supabase, 'academy_trainees'),
    safeTable(supabase, 'academy_groups'),
    safeTable(supabase, 'academy_enrollments'),
    safeTable(supabase, 'academy_attendance'),
    safeTable(supabase, 'academy_courses'),
    safeTable(supabase, 'academy_trainers'),
    safeTable(supabase, 'academy_payments'),
    safeTable(supabase, 'academy_certificates'),
    safeTable(supabase, 'academy_audit_logs'),
  ])

  const today = todayISO()
  const activeEnrollments = enrollments.filter((e: AnyRow) => ['enrolled', 'active', 'ongoing'].includes(String(e.status || '').toLowerCase()))
  const activeTraineeIds = new Set(activeEnrollments.map((e: AnyRow) => e.trainee_id).filter(Boolean))
  const activeTrainees = trainees.filter((t: AnyRow) => activeTraineeIds.has(t.id) || ['enrolled', 'active', 'training'].includes(String(t.status || '').toLowerCase()))
  const todayLogs = attendance.filter((a: AnyRow) => String(a.session_date || '').slice(0, 10) === today)
  const presentToday = todayLogs.filter((a: AnyRow) => presentStatuses.has(String(a.status || '').toLowerCase())).length
  const lateToday = todayLogs.filter((a: AnyRow) => String(a.status || '').toLowerCase() === 'late').length
  const absentToday = todayLogs.filter((a: AnyRow) => String(a.status || '').toLowerCase() === 'absent').length
  const attendanceRate = activeTrainees.length ? Math.round((presentToday / activeTrainees.length) * 100) : 0
  const missingToday = Math.max(0, activeTrainees.length - todayLogs.length)
  const paidRevenue = payments.filter((p: AnyRow) => ['paid', 'validated', 'complete'].includes(String(p.status || '').toLowerCase())).reduce((s: number, p: AnyRow) => s + number(p.amount), 0)

  const traineeRisk = activeTrainees.map((t: AnyRow) => {
    const logs = attendance.filter((a: AnyRow) => a.trainee_id === t.id)
    const risk = logs.filter((a: AnyRow) => riskStatuses.has(String(a.status || '').toLowerCase())).length
    const present = logs.filter((a: AnyRow) => presentStatuses.has(String(a.status || '').toLowerCase())).length
    const rate = logs.length ? Math.round((present / logs.length) * 100) : 0
    return { trainee: t, logs, risk, rate, level: risk >= 3 || rate < 65 ? 'critical' : risk >= 1 || rate < 85 ? 'watch' : 'healthy' }
  }).sort((a: { risk: number; rate: number }, b: { risk: number; rate: number }) => b.risk - a.risk || a.rate - b.rate)

  const groupStats = groups.slice(0, 8).map((g: AnyRow) => {
    const enrolled = activeEnrollments.filter((e: AnyRow) => e.group_id === g.id)
    const groupLogs = todayLogs.filter((a: AnyRow) => a.group_id === g.id)
    const present = groupLogs.filter((a: AnyRow) => presentStatuses.has(String(a.status || '').toLowerCase())).length
    return { group: g, enrolled: enrolled.length, present, rate: enrolled.length ? Math.round((present / enrolled.length) * 100) : 0 }
  })

  const recentLogs = attendance.slice(0, 12)
  const latestAudit = auditLogs.filter((a: AnyRow) => String(a.entity || '').includes('attendance') || String(a.action || '').includes('attendance')).slice(0, 8)

  return <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#f8fbff 0%,#eef3fb 100%)', color: '#0f172a', fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '292px minmax(0,1fr)' }}>
      <AcademySidebar />
      <section style={{ padding: '34px 36px 54px', overflow: 'hidden' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, marginBottom: 20 }}>
          <div><p style={{ margin: 0, color: '#355df6', fontSize: 12, letterSpacing: '.22em', fontWeight: 950 }}>LIVE ACADEMY ATTENDANCE</p><h1 style={{ margin: '8px 0 0', fontSize: 38, letterSpacing: '-.06em' }}>Trainee Attendance Command Center <span style={{ padding: '6px 12px', borderRadius: 999, background: '#eef2ff', color: '#355df6', fontSize: 13, verticalAlign: 'middle' }}>LIVE</span></h1><p style={{ margin: '10px 0 0', color: '#64748b', fontSize: 17, fontWeight: 800 }}>Presence, absence, lateness, risk, group capacity, certificate readiness and enrollment sync in one operational control page.</p></div>
          <div style={{ display: 'flex', gap: 10 }}><Link href="/academy/enrollments" style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', textDecoration: 'none', borderRadius: 15, padding: '14px 18px', fontWeight: 950 }}>Enrollments</Link><Link href="/academy/certificates" style={{ background: '#0f172a', color: '#fff', textDecoration: 'none', borderRadius: 15, padding: '14px 18px', fontWeight: 950 }}>Certificate bridge</Link></div>
        </header>

        <Card style={{ padding: 16, marginBottom: 18 }}><div style={{ display: 'grid', gridTemplateColumns: '160px repeat(5,1fr)', gap: 10, alignItems: 'center' }}><h3 style={{ margin: 0, fontSize: 16 }}>Smart Actions ›</h3>{[
          ['Mark Session', '#355df6', '#mark'], ['Bulk Group Present', '#16a34a', '#bulk'], ['Open Enrollments', '#7c3aed', '/academy/enrollments'], ['Payment Risks', '#f97316', '/academy/payments'], ['Issue Certificates', '#0891b2', '/academy/certificates']
        ].map((item: string[]) => { const [label, color, href] = item; return <Link key={label} href={href} style={{ minHeight: 45, borderRadius: 14, background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: 13, fontWeight: 950, boxShadow: `0 14px 28px ${color}25` }}>{label}</Link> })}</div></Card>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 16, marginBottom: 18 }}>
          <Kpi icon="☑" label="Today Attendance" value={`${attendanceRate}%`} sub={`${presentToday}/${activeTrainees.length} present`} color="#355df6" />
          <Kpi icon="👥" label="Active Trainees" value={String(activeTrainees.length)} sub="enrolled or training" color="#7c3aed" />
          <Kpi icon="⚠" label="Missing Today" value={String(missingToday)} sub="not marked yet" color="#f97316" />
          <Kpi icon="⏱" label="Late Today" value={String(lateToday)} sub="discipline signal" color="#f59e0b" />
          <Kpi icon="⛔" label="Absent Today" value={String(absentToday)} sub="dropout risk" color="#e11d48" />
          <Kpi icon="💳" label="Paid Revenue" value={`${Math.round(paidRevenue)} MAD`} sub="payment bridge" color="#16a34a" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr 1fr', gap: 18, marginBottom: 18 }}>
          <Card id="mark" style={{ padding: 28 }}><p style={{ margin: 0, color: '#355df6', fontSize: 12, fontWeight: 950, letterSpacing: '.22em' }}>SECTION 01</p><h2 style={{ margin: '8px 0 6px', fontSize: 28, letterSpacing: '-.05em' }}>Live Session Marking</h2><p style={{ margin: '0 0 22px', color: '#64748b', fontWeight: 800 }}>Create or update one attendance record per trainee, group and session date. This prevents duplicate session marks.</p><form action={saveAttendanceAction} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}><label style={fieldStyle}>Trainee<select name="trainee_id" required style={inputStyle}><option value="">Select trainee</option>{activeTrainees.map((t: AnyRow) => <option key={t.id} value={t.id}>{t.full_name || t.name || t.id}</option>)}</select></label><label style={fieldStyle}>Group / Cohort<select name="group_id" style={inputStyle}><option value="">No group</option>{groups.map((g: AnyRow) => <option key={g.id} value={g.id}>{g.name || g.title || g.id}</option>)}</select></label><label style={fieldStyle}>Session date<input name="session_date" type="date" defaultValue={today} style={inputStyle} /></label><label style={fieldStyle}>Status<select name="status" defaultValue="present" style={inputStyle}>{attendanceStatuses.map((s: string) => <option key={s} value={s}>{s}</option>)}</select></label><label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>Operational note<textarea name="note" rows={4} placeholder="Late reason, absence justification, makeup session, trainer observation..." style={{ ...inputStyle, height: 112, resize: 'vertical' }} /></label><button style={{ gridColumn: '1 / -1', border: 0, borderRadius: 18, padding: 18, background: 'linear-gradient(135deg,#355df6,#7c3aed)', color: '#fff', fontSize: 16, fontWeight: 950 }}>Save attendance + sync Academy</button></form></Card>

          <Card style={{ padding: 28 }}><p style={{ margin: 0, color: '#355df6', fontSize: 12, fontWeight: 950, letterSpacing: '.22em' }}>SECTION 02</p><h2 style={{ margin: '8px 0 18px', fontSize: 28, letterSpacing: '-.05em' }}>Presence Intelligence</h2><div style={{ display: 'grid', placeItems: 'center', marginBottom: 18 }}><Ring value={attendanceRate} label="today rate" color="#355df6" /></div><div style={{ display: 'grid', gap: 12 }}>{[['Present', presentToday, '#16a34a'], ['Late', lateToday, '#f59e0b'], ['Absent', absentToday, '#e11d48'], ['Not marked', missingToday, '#64748b']].map((item: Array<string | number>) => { const label = String(item[0]); const value = Number(item[1] || 0); const color = String(item[2]); return <div key={label} style={{ border: '1px solid #e7ecf4', borderRadius: 16, padding: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 950 }}><span>{label}</span><span style={{ color: String(color) }}>{value}</span></div><div style={{ marginTop: 10 }}><Progress value={activeTrainees.length ? Math.round((Number(value) / activeTrainees.length) * 100) : 0} color={color} /></div></div> })}</div></Card>

          <Card id="bulk" style={{ padding: 28 }}><p style={{ margin: 0, color: '#355df6', fontSize: 12, fontWeight: 950, letterSpacing: '.22em' }}>SECTION 03</p><h2 style={{ margin: '8px 0 6px', fontSize: 28, letterSpacing: '-.05em' }}>Bulk Group Control</h2><p style={{ margin: '0 0 22px', color: '#64748b', fontWeight: 800 }}>Mark all active enrollees in one group for a session, with update-not-duplicate protection.</p><form action={bulkTodayAttendanceAction} style={{ display: 'grid', gap: 14 }}><label style={fieldStyle}>Group / Cohort<select name="group_id" required style={inputStyle}><option value="">Select group</option>{groups.map((g: AnyRow) => <option key={g.id} value={g.id}>{g.name || g.title || g.id}</option>)}</select></label><label style={fieldStyle}>Session date<input name="session_date" type="date" defaultValue={today} style={inputStyle} /></label><label style={fieldStyle}>Bulk status<select name="status" defaultValue="present" style={inputStyle}>{attendanceStatuses.map((s: string) => <option key={s} value={s}>{s}</option>)}</select></label><button style={{ border: 0, borderRadius: 18, padding: 18, background: 'linear-gradient(135deg,#16a34a,#0891b2)', color: '#fff', fontSize: 16, fontWeight: 950 }}>Apply to group + sync</button></form></Card>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.35fr .85fr', gap: 18, marginBottom: 18 }}>
          <Card style={{ padding: 28 }}><p style={{ margin: 0, color: '#355df6', fontSize: 12, fontWeight: 950, letterSpacing: '.22em' }}>SECTION 04</p><h2 style={{ margin: '8px 0 6px', fontSize: 28, letterSpacing: '-.05em' }}>Live Attendance Registry</h2><p style={{ margin: '0 0 20px', color: '#64748b', fontWeight: 800 }}>Latest live attendance records connected to trainees, groups, enrollments and certification readiness.</p><div style={{ border: '1px solid #e7ecf4', borderRadius: 20, overflow: 'hidden' }}><div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr .8fr .8fr .8fr', background: '#f8fafc', padding: '14px 18px', color: '#64748b', fontWeight: 950, fontSize: 12, letterSpacing: '.18em' }}><span>TRAINEE</span><span>GROUP</span><span>DATE</span><span>STATUS</span><span>ACTION</span></div>{recentLogs.length ? recentLogs.map((a: AnyRow) => { const tName = nameOf(trainees, a.trainee_id); return <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr .8fr .8fr .8fr', gap: 12, padding: '18px', borderTop: '1px solid #edf2f7', alignItems: 'center' }}><div style={{ display: 'flex', alignItems: 'center', gap: 13 }}><span style={{ width: 44, height: 44, borderRadius: 15, background: '#eef2ff', color: '#355df6', display: 'grid', placeItems: 'center', fontWeight: 950 }}>{initials(tName)}</span><div><strong>{tName}</strong><p style={{ margin: '4px 0 0', color: '#64748b', fontWeight: 800, fontSize: 12 }}>{text(a.note, 'No note')}</p></div></div><strong>{nameOf(groups, a.group_id)}</strong><span style={{ color: '#64748b', fontWeight: 850 }}>{text(a.session_date)}</span><Badge value={String(a.status || '')}>{text(a.status)}</Badge><Link href={`/academy/trainees?open=${a.trainee_id}`} style={{ justifySelf: 'start', border: '1px solid #e2e8f0', borderRadius: 14, padding: '11px 16px', textDecoration: 'none', color: '#355df6', fontWeight: 950 }}>Open</Link></div> }) : <p style={{ padding: 28, margin: 0, color: '#64748b', fontWeight: 850 }}>No attendance records yet.</p>}</div></Card>

          <Card style={{ padding: 28 }}><p style={{ margin: 0, color: '#355df6', fontSize: 12, fontWeight: 950, letterSpacing: '.22em' }}>SECTION 05</p><h2 style={{ margin: '8px 0 18px', fontSize: 28, letterSpacing: '-.05em' }}>Risk & Exception Tower</h2><div style={{ display: 'grid', gap: 13 }}>{traineeRisk.slice(0, 7).map((r: { trainee: AnyRow; logs: AnyRow[]; risk: number; rate: number; level: string }) => <div key={r.trainee.id} style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto', gap: 12, alignItems: 'center', border: '1px solid #e7ecf4', borderRadius: 18, padding: 14 }}><span style={{ width: 44, height: 44, borderRadius: 15, background: r.level === 'critical' ? '#fee2e2' : r.level === 'watch' ? '#ffedd5' : '#dcfce7', color: r.level === 'critical' ? '#e11d48' : r.level === 'watch' ? '#ea580c' : '#16a34a', display: 'grid', placeItems: 'center', fontWeight: 950 }}>{r.risk}</span><div><strong>{r.trainee.full_name || r.trainee.name}</strong><p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12, fontWeight: 800 }}>{r.logs.length} records • {r.rate}% presence</p></div><Link href={`/academy/trainees?open=${r.trainee.id}`} style={{ color: '#355df6', textDecoration: 'none', fontWeight: 950 }}>Open ›</Link></div>)}</div></Card>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18, marginBottom: 18 }}>
          <Card style={{ padding: 28 }}><p style={{ margin: 0, color: '#355df6', fontSize: 12, fontWeight: 950, letterSpacing: '.22em' }}>SECTION 06</p><h2 style={{ margin: '8px 0 18px', fontSize: 25, letterSpacing: '-.05em' }}>Group Capacity Monitor</h2><div style={{ display: 'grid', gap: 14 }}>{groupStats.map((g: { group: AnyRow; enrolled: number; present: number; rate: number }) => <div key={g.group.id}><div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 950, marginBottom: 8 }}><span>{g.group.name || g.group.title}</span><span>{g.present}/{g.enrolled}</span></div><Progress value={g.rate} color={g.rate >= 80 ? '#16a34a' : g.rate >= 50 ? '#f97316' : '#e11d48'} /></div>)}</div></Card>
          <Card style={{ padding: 28 }}><p style={{ margin: 0, color: '#355df6', fontSize: 12, fontWeight: 950, letterSpacing: '.22em' }}>SECTION 07</p><h2 style={{ margin: '8px 0 18px', fontSize: 25, letterSpacing: '-.05em' }}>Sync Bridges</h2>{[['Enrollments', activeEnrollments.length, '/academy/enrollments'], ['Payments', payments.length, '/academy/payments'], ['Certificates', certificates.length, '/academy/certificates'], ['Courses', courses.length, '/academy/courses'], ['Trainers', trainers.length, '/academy/trainers']].map((x: Array<string | number>) => <Link key={String(x[0])} href={String(x[2])} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e7ecf4', borderRadius: 16, padding: 14, textDecoration: 'none', color: '#0f172a', fontWeight: 950, marginBottom: 10 }}><span>{x[0]}</span><span style={{ color: '#355df6' }}>{x[1]} ›</span></Link>)}</Card>
          <Card style={{ padding: 28 }}><p style={{ margin: 0, color: '#355df6', fontSize: 12, fontWeight: 950, letterSpacing: '.22em' }}>SECTION 08</p><h2 style={{ margin: '8px 0 18px', fontSize: 25, letterSpacing: '-.05em' }}>Attendance Audit Stream</h2><div style={{ display: 'grid', gap: 12 }}>{latestAudit.length ? latestAudit.map((a: AnyRow) => <div key={a.id} style={{ border: '1px solid #e7ecf4', borderRadius: 16, padding: 14 }}><strong>{text(a.action || a.title, 'Attendance event')}</strong><p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12, fontWeight: 800 }}>{text(a.created_at).slice(0, 19)}</p></div>) : <p style={{ color: '#64748b', fontWeight: 850 }}>No attendance audit events yet.</p>}</div></Card>
        </div>
      </section>
    </div>
  </main>
}

const fieldStyle: React.CSSProperties = { display: 'grid', gap: 8, color: '#64748b', fontWeight: 950, fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase' }
const inputStyle: React.CSSProperties = { width: '100%', border: '1px solid #dfe7f2', background: '#fff', borderRadius: 18, minHeight: 58, padding: '0 18px', color: '#0f172a', fontWeight: 900, fontSize: 15, outline: 'none' }
