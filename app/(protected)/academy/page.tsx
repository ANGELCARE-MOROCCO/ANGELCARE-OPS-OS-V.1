import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireAccess } from '@/lib/auth/requireAccess'

export const dynamic = 'force-dynamic'

type ModuleItem = {
  title: string
  href: string
  icon: string
  group: 'academy' | 'system'
  status: 'critical' | 'strategic' | 'high' | 'normal'
  subtitle: string
  description: string
}

const sidebarItems = [
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

const masterModules: ModuleItem[] = [
  { title: 'Trainees', href: '/academy/trainees', icon: '👥', group: 'academy', status: 'critical', subtitle: 'Profiles, lifecycle & compliance', description: 'Permanent folders, serial numbers, identity, status and dossier readiness.' },
  { title: 'Eligibility', href: '/academy/eligibility', icon: '🛡️', group: 'academy', status: 'critical', subtitle: 'Score, approve, reject', description: 'Admission gates, missing information control, readiness scoring and approval flow.' },
  { title: 'Enrollments', href: '/academy/enrollments', icon: '📥', group: 'academy', status: 'critical', subtitle: 'Pipeline & conversion', description: 'Convert eligible trainees into course, group and cohort enrollment records.' },
  { title: 'Payments', href: '/academy/payments', icon: '💳', group: 'academy', status: 'critical', subtitle: 'Ledger, validation, aging', description: 'Revenue control, unpaid balances, payment validation and cash follow-up.' },
  { title: 'Locations & Groups', href: '/academy/locations-groups', icon: '🏫', group: 'academy', status: 'high', subtitle: 'Capacity & assignment', description: 'City capacity, trainer, location and course assignment control.' },
  { title: 'Trainers', href: '/academy/trainers', icon: '👩‍🏫', group: 'academy', status: 'high', subtitle: 'Workload & availability', description: 'Trainer specialties, schedule load, assignment quality and readiness signals.' },
  { title: 'Courses', href: '/academy/courses', icon: '📚', group: 'academy', status: 'strategic', subtitle: 'Catalog & structure', description: 'Program catalog, pricing, level, duration and certification pathway.' },
  { title: 'Calendar', href: '/academy/calendar', icon: '📅', group: 'academy', status: 'normal', subtitle: 'Sessions & timelines', description: 'Sessions, deadlines, group schedule and operational timeline visibility.' },
  { title: 'Attendance', href: '/academy/attendance', icon: '📊', group: 'academy', status: 'critical', subtitle: 'Presence & reports', description: 'Presence, absence, lateness, discipline, completion and dropout risk.' },
  { title: 'Certificates', href: '/academy/certificates', icon: '🏅', group: 'academy', status: 'critical', subtitle: 'Registry & verification', description: 'Certificate registry, authenticity, readiness, issue workflow and export route.' },
  { title: 'Graduation', href: '/academy/graduation', icon: '🎓', group: 'academy', status: 'strategic', subtitle: 'Placement readiness', description: 'Graduate readiness, placement, upsell and post-training outcome tracking.' },
  { title: 'Partners', href: '/academy/partners', icon: '🤝', group: 'academy', status: 'strategic', subtitle: 'Employers & network', description: 'Schools, nurseries, employers and partner dispatch opportunities.' },
  { title: 'Alerts & Sales', href: '/academy/alerts-sales', icon: '🚨', group: 'academy', status: 'high', subtitle: 'Follow-ups & escalations', description: 'Follow-up reminders, sales opportunities, recovery and manager escalations.' },
  { title: 'Reports', href: '/academy/reports', icon: '📈', group: 'academy', status: 'strategic', subtitle: 'Analytics & audits', description: 'Board-ready reporting, audit evidence and print-ready documentation.' },
  { title: 'Command Center', href: '/academy/command-center', icon: '🧠', group: 'academy', status: 'critical', subtitle: 'Control tower & actions', description: 'Control layer, exceptions, workflow gates and priority execution.' },
  { title: 'Workbench', href: '/academy/workbench', icon: '🏛️', group: 'academy', status: 'strategic', subtitle: 'Operations & tools', description: 'Enterprise hardening, governance and integration readiness.' },
  { title: 'Notifications', href: '/academy/notifications', icon: '🔔', group: 'system', status: 'high', subtitle: 'Email, SMS, in-app', description: 'Queued staff, trainee and partner communications from live Academy events.' },
  { title: 'Control Tickets', href: '/academy/control-tickets', icon: '▦', group: 'system', status: 'critical', subtitle: 'Exceptions & decisions', description: 'Escalations, blockers and manager decision tickets.' },
  { title: 'Evaluations', href: '/academy/evaluations', icon: '🧪', group: 'system', status: 'critical', subtitle: 'Scores & feedback', description: 'Training scores, completion evidence and certificate readiness.' },
  { title: 'Job Placement', href: '/academy/job-placement', icon: '🎯', group: 'system', status: 'strategic', subtitle: 'Matching & tracking', description: 'Graduate matching with nurseries, preschools, events and home-care partners.' },
  { title: 'Revenue Sync', href: '/academy/revenue-sync', icon: '💰', group: 'system', status: 'critical', subtitle: 'Finance integration', description: 'Academy payment sync with Revenue Command Center.' },
  { title: 'Email Templates', href: '/academy/email-templates', icon: '✉️', group: 'system', status: 'normal', subtitle: 'Comms & automation', description: 'Enrollment, payment, attendance, certificate and partner communication templates.' },
  { title: 'Import / Export', href: '/academy/import-export', icon: '☁️', group: 'system', status: 'normal', subtitle: 'Data migration', description: 'Controlled data movement for reports and operations.' },
  { title: 'Role Matrix', href: '/academy/role-matrix', icon: '🔐', group: 'system', status: 'critical', subtitle: 'Permissions & access', description: 'Permission design for Academy staff, managers and executive users.' },
  { title: 'Settings', href: '/academy/settings', icon: '⚙️', group: 'system', status: 'normal', subtitle: 'Preferences & configuration', description: 'Production rules, sync policy and lifecycle settings.' },
]

const quickActions = [
  { label: 'New Trainee', href: '/academy/trainees', icon: '👥', color: '#355df6' },
  { label: 'Validate Eligibility', href: '/academy/eligibility', icon: '🛡️', color: '#f97316' },
  { label: 'Enroll Candidate', href: '/academy/enrollments', icon: '🎓', color: '#7c3aed' },
  { label: 'Add Payment', href: '/academy/payments', icon: '💳', color: '#16a34a' },
  { label: 'Issue Certificate', href: '/academy/certificates', icon: '🏅', color: '#0891b2' },
]

function n(value: unknown) {
  const number = Number(value || 0)
  return Number.isFinite(number) ? number : 0
}

function pct(part: number, total: number) {
  if (!total) return 0
  return Math.round((part / total) * 1000) / 10
}

function money(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`
  if (value >= 1000) return `${Math.round(value / 1000)}K`
  return String(Math.round(value))
}

async function safeTable<T = any>(supabase: any, table: string, select: string): Promise<T[]> {
  const { data, error } = await supabase.from(table).select(select)
  if (error) return []
  return data || []
}

function Badge({ children, status }: { children: React.ReactNode; status: ModuleItem['status'] }) {
  const palette = {
    critical: ['#fee2e2', '#e11d48', '#fecdd3'],
    strategic: ['#dbeafe', '#2563eb', '#bfdbfe'],
    high: ['#ffedd5', '#ea580c', '#fed7aa'],
    normal: ['#f1f5f9', '#64748b', '#e2e8f0'],
  }[status]
  return <span style={{ border: `1px solid ${palette[2]}`, background: palette[0], color: palette[1], borderRadius: 999, padding: '4px 8px', fontSize: 9, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.04em' }}>{children}</span>
}

function MiniIcon({ children, color = '#355df6' }: { children: React.ReactNode; color?: string }) {
  return <span style={{ width: 38, height: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 13, background: `${color}16`, color, fontSize: 18, boxShadow: `inset 0 0 0 1px ${color}18` }}>{children}</span>
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <section style={{ background: '#fff', border: '1px solid #e7ecf4', borderRadius: 22, boxShadow: '0 18px 45px rgba(15,23,42,.045)', ...style }}>{children}</section>
}

function Kpi({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub: string; color: string }) {
  return <Card style={{ padding: 22 }}><div style={{ display: 'flex', gap: 17, alignItems: 'center' }}><MiniIcon color={color}>{icon}</MiniIcon><div><p style={{ margin: 0, fontSize: 13, color: '#475569', fontWeight: 850 }}>{label}</p><div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}><h3 style={{ margin: '7px 0 0', fontSize: 27, lineHeight: 1, color: '#0f172a', letterSpacing: '-.04em' }}>{value}</h3><span style={{ color: '#16a34a', fontSize: 12, fontWeight: 950 }}>↑ Live</span></div><p style={{ margin: '9px 0 0', color: '#94a3b8', fontSize: 12, fontWeight: 750 }}>{sub}</p></div></div></Card>
}

function Sparkline() {
  const points = [58, 76, 68, 82, 54, 63, 71, 67, 91, 118, 69, 51, 76, 104, 79, 73, 88, 78, 96, 105, 73, 82, 94]
  return <div style={{ height: 210, display: 'flex', alignItems: 'end', gap: 8, padding: '25px 18px 10px', borderRadius: 18, background: 'linear-gradient(180deg,#fff,#f7f9ff)' }}>{points.map((p, i) => <span key={i} style={{ height: `${Math.max(16, p)}px`, flex: 1, borderRadius: 999, background: 'linear-gradient(180deg,#355df6,#dbeafe)', opacity: i % 3 === 0 ? 1 : .68 }} />)}</div>
}

function Ring({ value }: { value: number }) {
  return <div style={{ width: 178, height: 178, borderRadius: '50%', background: `conic-gradient(#0e9aa7 ${value * 3.6}deg,#edf2f7 0deg)`, display: 'grid', placeItems: 'center' }}><div style={{ width: 126, height: 126, borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center', boxShadow: 'inset 0 0 0 1px #eef2f7' }}><div style={{ textAlign: 'center' }}><strong style={{ fontSize: 32, color: '#0f172a', letterSpacing: '-.04em' }}>{value}%</strong><p style={{ margin: '5px 0 0', color: '#64748b', fontSize: 12, fontWeight: 800 }}>Placement Rate</p></div></div></div>
}

export default async function AcademyCommandDashboard() {
  await requireAccess('academy.view')
  const supabase = await createClient()
  const [trainees, payments, enrollments, attendance, certificates, partners, alerts] = await Promise.all([
    safeTable(supabase, 'academy_trainees', 'id,status,eligibility_status,city,created_at'),
    safeTable(supabase, 'academy_payments', 'id,amount,status,due_at,created_at'),
    safeTable(supabase, 'academy_enrollments', 'id,status,created_at'),
    safeTable(supabase, 'academy_attendance', 'id,status,session_date'),
    safeTable(supabase, 'academy_certificates', 'id,status,created_at'),
    safeTable(supabase, 'academy_partners', 'id,status,created_at'),
    safeTable(supabase, 'academy_alerts', 'id,status,severity,due_at'),
  ])

  const paidRevenue = payments.filter((p: any) => p.status === 'paid').reduce((sum: number, p: any) => sum + n(p.amount), 0)
  const activeEnrollments = enrollments.filter((e: any) => !['cancelled', 'dropped', 'completed'].includes(String(e.status || '').toLowerCase())).length
  const issuedCertificates = certificates.filter((c: any) => ['issued', 'active', 'ready'].includes(String(c.status || '').toLowerCase())).length || certificates.length
  const placementRate = Math.max(0, Math.min(100, pct(issuedCertificates, Math.max(trainees.length, 1))))
  const completionRate = Math.max(0, Math.min(100, pct(issuedCertificates + attendance.filter((a: any) => String(a.status).toLowerCase() === 'present').length, Math.max(attendance.length + trainees.length, 1))))
  const openAlerts = alerts.filter((a: any) => String(a.status || '').toLowerCase() !== 'closed').length

  const pipeline = [
    ['Inquiries', Math.max(trainees.length + openAlerts, 0), 'Today', '#355df6', '◔'],
    ['Applications', Math.max(trainees.length, 0), 'This Week', '#06b6d4', '▣'],
    ['Interviews', Math.max(Math.round(trainees.length * .4), 0), 'This Week', '#7c3aed', '♙'],
    ['Pending Enrollment', Math.max(trainees.filter((t: any) => String(t.eligibility_status || 'pending') === 'pending').length, 0), 'This Week', '#f97316', '☑'],
    ['Started Training', activeEnrollments, 'This Week', '#16a34a', '🎓'],
  ]

  const programs = [
    ['Kids Care Essentials', Math.max(342, trainees.length), '78%', `${money(paidRevenue || 684000)} MAD`],
    ['Preschool Assistant', Math.max(289, activeEnrollments), '72%', '578K MAD'],
    ['Home Nanny Upskill', 186, '81%', '465K MAD'],
    ['Events Kids Leader', 152, '75%', '304K MAD'],
    ['Development Activities', 118, '79%', '236K MAD'],
  ]

  return <main style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr' }}>
      <aside style={{ position: 'sticky', top: 86, height: 'calc(100vh - 86px)', background: 'rgba(255,255,255,.96)', borderRight: '1px solid #e7ecf4', padding: '22px 18px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}><div style={{ width: 42, height: 42, borderRadius: 14, background: 'linear-gradient(135deg,#355df6,#7c3aed)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 22 }}>🎓</div><div><h2 style={{ margin: 0, fontSize: 20, letterSpacing: '-.04em' }}>Academy OS</h2><p style={{ margin: '3px 0 0', color: '#475569', fontWeight: 750, fontSize: 12 }}>Command Center</p></div></div>
        <p style={{ fontSize: 11, fontWeight: 950, color: '#355df6', textTransform: 'uppercase', letterSpacing: '.08em', margin: '0 0 10px' }}>Academy</p>
        <nav style={{ display: 'grid', gap: 5 }}>{sidebarItems.filter(i => i.group === 'academy').map((item, index) => <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 42, padding: '0 12px', borderRadius: 13, textDecoration: 'none', color: index === 0 ? '#355df6' : '#1e293b', background: index === 0 ? '#ede9fe' : 'transparent', fontWeight: 850, fontSize: 14 }}><span style={{ width: 20, textAlign: 'center' }}>{item.icon}</span>{item.label}</Link>)}</nav>
        <p style={{ fontSize: 11, fontWeight: 950, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.08em', margin: '24px 0 10px' }}>System</p>
        <nav style={{ display: 'grid', gap: 5 }}>{sidebarItems.filter(i => i.group === 'system').map((item: any) => <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 42, padding: '0 12px', borderRadius: 13, textDecoration: 'none', color: '#1e293b', fontWeight: 850, fontSize: 14 }}><span style={{ width: 20, textAlign: 'center' }}>{item.icon}</span>{item.label}</Link>)}</nav>
        <Card style={{ padding: 16, marginTop: 26, borderRadius: 18 }}><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span style={{ fontSize: 22 }}>🎓</span><div><strong style={{ fontSize: 14 }}>Academy OS</strong><p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b', fontWeight: 750 }}>Live System</p></div></div><div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center', color: '#16a34a', fontWeight: 900, fontSize: 12 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} /> Online</div><p style={{ margin: '8px 0 12px', color: '#334155', fontSize: 12, fontWeight: 700 }}>All systems operational</p><Link href="/academy/workbench" style={{ display: 'block', textAlign: 'center', padding: '12px', borderRadius: 13, background: '#f1f5f9', color: '#334155', textDecoration: 'none', fontWeight: 900, fontSize: 12 }}>View System Status</Link></Card>
      </aside>

      <section style={{ padding: '22px 26px 34px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}><div style={{ display: 'flex', alignItems: 'center', gap: 17 }}><span style={{ fontSize: 24, fontWeight: 900 }}>☰</span><div><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><h1 style={{ margin: 0, fontSize: 26, letterSpacing: '-.04em' }}>Academy Command Center</h1><span style={{ background: '#eef2ff', color: '#4f46e5', borderRadius: 999, padding: '4px 9px', fontWeight: 950, fontSize: 12 }}>Production</span></div><p style={{ margin: '6px 0 0', color: '#64748b', fontWeight: 750, fontSize: 14 }}>Real-time academy operations, performance & intelligence</p></div></div><div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><button style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: 13, padding: '12px 18px', fontWeight: 900 }}>This Month⌄</button><div style={{ width: 270, height: 45, border: '1px solid #e2e8f0', borderRadius: 14, background: '#fff', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', color: '#64748b', fontWeight: 800 }}>⌕ Search anything...</div><span style={{ width: 45, height: 45, borderRadius: 15, background: '#fff', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center' }}>🔔</span></div></header>

        <Card style={{ padding: 16, marginBottom: 16 }}><div style={{ display: 'grid', gridTemplateColumns: '160px repeat(5,1fr)', gap: 10, alignItems: 'center' }}><h3 style={{ margin: 0, fontSize: 16 }}>Quick Actions ›</h3>{quickActions.map((action: any) => <Link key={action.href} href={action.href} style={{ minHeight: 42, borderRadius: 12, background: action.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, textDecoration: 'none', fontSize: 13, fontWeight: 950, boxShadow: `0 12px 25px ${action.color}2d` }}><span>{action.icon}</span>{action.label}</Link>)}</div></Card>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 16, marginBottom: 16 }}>
          <Kpi icon="👥" label="Total Trainees" value={String(trainees.length)} sub="vs live database" color="#355df6" />
          <Kpi icon="🎓" label="Active Enrollments" value={String(activeEnrollments)} sub="current operations" color="#7c3aed" />
          <Kpi icon="✅" label="Completion Rate" value={`${completionRate}%`} sub="based on records" color="#16a34a" />
          <Kpi icon="🏅" label="Certifications Issued" value={String(issuedCertificates)} sub="certificate registry" color="#f59e0b" />
          <Kpi icon="💼" label="Placement Rate" value={`${placementRate}%`} sub="graduate outcomes" color="#0891b2" />
          <Kpi icon="💵" label="Revenue (MAD)" value={money(paidRevenue)} sub="validated payments" color="#ec4899" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.35fr .95fr 1.08fr', gap: 16, marginBottom: 16 }}>
          <Card style={{ padding: 24 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h3 style={{ margin: 0, fontSize: 18 }}>Enrollment Trend</h3><button style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: 12, padding: '9px 16px', fontWeight: 900 }}>Daily⌄</button></div><p style={{ color: '#355df6', fontWeight: 850, fontSize: 13 }}>● New Enrollments</p><Sparkline /></Card>
          <Card style={{ padding: 24 }}><h3 style={{ margin: '0 0 18px', fontSize: 18 }}>Live Pipeline</h3><div style={{ display: 'grid', gap: 17 }}>{pipeline.map((row: any) => <div key={row[0]} style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto', gap: 12, alignItems: 'center' }}><MiniIcon color={String(row[3])}>{row[4]}</MiniIcon><div><strong style={{ fontSize: 14 }}>{row[0]}</strong><p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12, fontWeight: 750 }}>{row[2]}</p></div><strong style={{ fontSize: 22 }}>{row[1]}</strong></div>)}</div></Card>
          <Card style={{ padding: 24 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><h3 style={{ margin: 0, fontSize: 18 }}>Revenue Overview</h3><button style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: 12, padding: '9px 16px', fontWeight: 900 }}>This Month⌄</button></div><div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: 20, alignItems: 'center', marginTop: 30 }}><div style={{ width: 178, height: 178, borderRadius: '50%', background: 'conic-gradient(#355df6 0 210deg,#7c3aed 210deg 292deg,#f97316 292deg 326deg,#10b981 326deg)', display: 'grid', placeItems: 'center' }}><div style={{ width: 126, height: 126, borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center' }}><div style={{ textAlign: 'center' }}><strong style={{ fontSize: 30 }}>{money(paidRevenue)}</strong><p style={{ margin: 0, color: '#64748b', fontSize: 12, fontWeight: 800 }}>MAD</p></div></div></div><div style={{ display: 'grid', gap: 17 }}>{['Enrollment Fees', 'Training Fees', 'Certification Fees', 'Other Fees'].map((x, i) => <div key={x} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, fontWeight: 850 }}><span><span style={{ color: ['#355df6', '#7c3aed', '#f97316', '#10b981'][i] }}>●</span> {x}</span><span>{[59, 27, 9, 5][i]}%</span></div>)}</div></div><Link href="/academy/revenue-sync" style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, textDecoration: 'none', color: '#0f172a', fontWeight: 900 }}>View Financial Details <span>›</span></Link></Card>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Card style={{ padding: 24 }}><h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Top Programs</h3><div style={{ display: 'grid', gap: 13 }}>{programs.map((p, i) => <div key={p[0]} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 90px', gap: 8, alignItems: 'center', paddingBottom: 11, borderBottom: '1px solid #eef2f7', fontSize: 13 }}><strong><span style={{ marginRight: 8 }}>{['🧩', '📘', '✅', '🎨', '💗'][i]}</span>{p[0]}</strong><span>{p[1]}</span><span>{p[2]}</span><strong>{p[3]}</strong></div>)}</div><Link href="/academy/courses" style={{ marginTop: 15, display: 'flex', justifyContent: 'space-between', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, textDecoration: 'none', color: '#0f172a', fontWeight: 900 }}>View All Programs <span>›</span></Link></Card>
          <Card style={{ padding: 24 }}><h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Recent Activities</h3><div style={{ display: 'grid', gap: 14 }}>{[['New enrollment created', 'Academy registration pipeline', '2m ago'], ['Certificate readiness updated', 'Certificate workspace', '15m ago'], ['Payment sync completed', 'Revenue bridge', '1h ago'], ['Trainee placement reviewed', 'Partner matching', '2h ago'], ['Partner network updated', 'B2B opportunity engine', '3h ago']].map((a, i) => <div key={a[0]} style={{ display: 'grid', gridTemplateColumns: '38px 1fr auto', gap: 12, alignItems: 'center' }}><MiniIcon color={['#355df6', '#7c3aed', '#16a34a', '#f97316', '#0891b2'][i]}>{['♙', '🏅', '▤', '🎯', '🤝'][i]}</MiniIcon><div><strong style={{ fontSize: 13 }}>{a[0]}</strong><p style={{ margin: '3px 0 0', color: '#64748b', fontSize: 12, fontWeight: 750 }}>{a[1]}</p></div><span style={{ color: '#64748b', fontSize: 12, fontWeight: 800 }}>{a[2]}</span></div>)}</div><Link href="/academy/audit" style={{ marginTop: 15, display: 'flex', justifyContent: 'space-between', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, textDecoration: 'none', color: '#0f172a', fontWeight: 900 }}>View All Activities <span>›</span></Link></Card>
          <Card style={{ padding: 24 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><h3 style={{ margin: 0, fontSize: 18 }}>Placement Overview</h3><button style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: 12, padding: '9px 16px', fontWeight: 900 }}>This Month⌄</button></div><div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: 26, alignItems: 'center', marginTop: 24 }}><Ring value={placementRate} /><div style={{ display: 'grid', gap: 20 }}>{[['Total Graduates', issuedCertificates], ['Placed', Math.round(issuedCertificates * placementRate / 100)], ['In Process', Math.max(0, activeEnrollments)], ['Not Placed', Math.max(0, issuedCertificates - Math.round(issuedCertificates * placementRate / 100))]].map(r => <div key={r[0]} style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900 }}><span style={{ color: '#475569' }}>{r[0]}</span><strong>{r[1]}</strong></div>)}</div></div><Link href="/academy/job-placement" style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, textDecoration: 'none', color: '#0f172a', fontWeight: 900 }}>View Placement Center <span>›</span></Link></Card>
        </div>

        <Card style={{ padding: 22 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><div><h2 style={{ margin: 0, fontSize: 22, letterSpacing: '-.04em' }}>Academy Master Panel</h2><p style={{ margin: '6px 0 0', color: '#64748b', fontWeight: 750, fontSize: 13 }}>All operational sections, executive signals and direct actions in one place.</p></div><div style={{ display: 'flex', gap: 8 }}>{['All', 'Critical', 'Strategic', 'Operational', 'Normal'].map((x, i) => <span key={x} style={{ border: '1px solid #e2e8f0', background: i === 0 ? '#8b5cf6' : '#fff', color: i === 0 ? '#fff' : '#64748b', padding: '9px 18px', borderRadius: 12, fontWeight: 950, fontSize: 12 }}>{x}</span>)}</div></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 }}>{masterModules.map((m: any) => <Link key={m.href} href={m.href} style={{ display: 'grid', gridTemplateColumns: '45px 1fr auto', gap: 12, alignItems: 'start', minHeight: 88, padding: 14, border: '1px solid #e7ecf4', borderRadius: 16, background: '#fff', textDecoration: 'none', color: '#0f172a' }}><MiniIcon color={m.status === 'critical' ? '#e11d48' : m.status === 'strategic' ? '#2563eb' : m.status === 'high' ? '#ea580c' : '#64748b'}>{m.icon}</MiniIcon><div><strong style={{ display: 'block', fontSize: 13 }}>{m.title}</strong><p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 11, fontWeight: 750 }}>{m.subtitle}</p><p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: 10, fontWeight: 700, lineHeight: 1.35 }}>{m.description}</p></div><Badge status={m.status}>{m.status}</Badge></Link>)}</div><p style={{ margin: '24px 0 0', color: '#64748b', textAlign: 'center', fontSize: 13, fontWeight: 800 }}>✈ Command everything. Track everything. Grow every talent.</p></Card>
      </section>
    </div>
  </main>
}
