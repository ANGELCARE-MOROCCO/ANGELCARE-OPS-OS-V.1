import Link from 'next/link'
import type React from 'react'

type AcademyData = {
  trainees?: any[]
  enrollments?: any[]
  payments?: any[]
  groups?: any[]
  courses?: any[]
  trainers?: any[]
  attendance?: any[]
  certificates?: any[]
  partners?: any[]
  alerts?: any[]
}

const modules = [
  { label: 'Trainees', href: '/academy/trainees', icon: '👥', desc: 'Permanent folders, serials, lifecycle control', tone: '#2563eb', action: 'Create / classify / move' },
  { label: 'Eligibility', href: '/academy/eligibility', icon: '✅', desc: 'Admission scoring, approval gate, rejection notes', tone: '#16a34a', action: 'Validate / reject' },
  { label: 'Enrollments', href: '/academy/enrollments', icon: '📥', desc: 'Conversion engine from candidate to active trainee', tone: '#7c3aed', action: 'Enroll / assign' },
  { label: 'Payments', href: '/academy/payments', icon: '💰', desc: 'Revenue, collection, aging and overdue control', tone: '#ea580c', action: 'Add / validate payment' },
  { label: 'Groups & Locations', href: '/academy/locations-groups', icon: '📍', desc: 'Cohort capacity, dispatch and training site planning', tone: '#0f766e', action: 'Plan / allocate' },
  { label: 'Trainers', href: '/academy/trainers', icon: '👩‍🏫', desc: 'Trainer allocation, specialties and workload control', tone: '#db2777', action: 'Assign / monitor' },
  { label: 'Courses', href: '/academy/courses', icon: '📚', desc: 'Product catalog, duration, price and certification path', tone: '#4f46e5', action: 'Build / price' },
  { label: 'Calendar', href: '/academy/calendar', icon: '📅', desc: 'Sessions, operational schedule and conflicts', tone: '#0891b2', action: 'Schedule / review' },
  { label: 'Attendance', href: '/academy/attendance', icon: '📊', desc: 'Presence, absence, lateness and dropout signals', tone: '#65a30d', action: 'Mark / detect risk' },
  { label: 'Certificates', href: '/academy/certificates', icon: '📜', desc: 'Authenticity registry, readiness and issuance', tone: '#ca8a04', action: 'Issue / verify' },
  { label: 'Graduation', href: '/academy/graduation', icon: '🎓', desc: 'Completion, upsell and post-training pipeline', tone: '#9333ea', action: 'Graduate / follow up' },
  { label: 'Partners', href: '/academy/partners', icon: '🤝', desc: 'Schools, nurseries and professional placement channels', tone: '#0284c7', action: 'Create / place' },
  { label: 'Alerts & Sales', href: '/academy/alerts-sales', icon: '🚨', desc: 'Reminders, sales follow-up and lost opportunity control', tone: '#dc2626', action: 'Escalate / convert' },
  { label: 'Reports', href: '/academy/reports', icon: '📈', desc: 'Board-ready reporting, PDF-ready views and audit evidence', tone: '#0f172a', action: 'Export / document' },
]

const commandLinks = [
  { label: 'Command Center', href: '/academy/command-center', tag: 'CONTROL' },
  { label: 'Executive View', href: '/academy/executive', tag: 'BOARD' },
  { label: 'Workbench', href: '/academy/workbench', tag: 'OPS' },
  { label: 'Automation', href: '/academy/automation', tag: 'AI OPS' },
  { label: 'Quality', href: '/academy/quality', tag: 'QA' },
  { label: 'Placement Intelligence', href: '/academy/placement-intelligence', tag: 'B2B' },
  { label: 'Governance', href: '/academy/governance', tag: 'ISO' },
  { label: 'Data Quality', href: '/academy/data-quality', tag: 'DATA' },
]

function money(n: number) {
  return `${Math.round(n).toLocaleString('fr-FR')} MAD`
}

function pct(n: number) {
  if (!Number.isFinite(n)) return '0%'
  return `${Math.round(n)}%`
}

export function AcademyExecutiveSuite({ data }: { data: AcademyData }) {
  const trainees = data.trainees || []
  const enrollments = data.enrollments || []
  const payments = data.payments || []
  const groups = data.groups || []
  const courses = data.courses || []
  const trainers = data.trainers || []
  const attendance = data.attendance || []
  const certificates = data.certificates || []
  const partners = data.partners || []
  const alerts = data.alerts || []

  const paid = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount || 0), 0)
  const openPayments = payments.filter((p) => p.status !== 'paid')
  const unpaid = openPayments.reduce((s, p) => s + Number(p.amount || 0), 0)
  const pendingEligibility = trainees.filter((t) => (t.eligibility_status || 'pending') === 'pending')
  const approvedEligibility = trainees.filter((t) => t.eligibility_status === 'approved').length
  const absentCount = attendance.filter((a) => a.status === 'absent').length
  const attendanceRisk = attendance.length ? (absentCount / attendance.length) * 100 : 0
  const activeAlerts = alerts.filter((a) => a.status !== 'closed')
  const certified = certificates.length
  const conversion = trainees.length ? (enrollments.length / trainees.length) * 100 : 0
  const certificationYield = enrollments.length ? (certified / enrollments.length) * 100 : 0
  const capacitySignal = groups.length ? Math.round((enrollments.length / Math.max(groups.length * 20, 1)) * 100) : 0

  const priorities = [
    ...pendingEligibility.slice(0, 3).map((t) => ({ title: `Validate eligibility: ${t.full_name}`, href: '/academy/eligibility', tone: '#16a34a', meta: t.city || 'City missing' })),
    ...openPayments.slice(0, 3).map((p) => ({ title: 'Payment follow-up required', href: '/academy/payments', tone: '#ea580c', meta: `${p.status || 'pending'} · ${money(Number(p.amount || 0))}` })),
    ...activeAlerts.slice(0, 3).map((a) => ({ title: a.title || 'Open Academy alert', href: '/academy/alerts-sales', tone: '#dc2626', meta: a.severity || 'normal' })),
  ].slice(0, 7)

  return (
    <div style={page}>
      <section style={hero}>
        <div style={heroOverlay} />
        <div style={heroLeft}>
          <div style={badge}>ANGELCARE ACADEMY · ENTERPRISE OPERATING COCKPIT</div>
          <h1 style={h1}>Academy Command System</h1>
          <p style={lead}>A centralized control room for intake, eligibility, enrollment, delivery, certification, placement, revenue, risks and compliance evidence.</p>
          <div style={heroActions}>
            <Link href="/academy/trainees" style={primaryAction}>＋ New trainee</Link>
            <Link href="/academy/enrollments" style={secondaryAction}>Enroll candidate</Link>
            <Link href="/academy/command-center" style={secondaryAction}>Open command center</Link>
            <Link href="/academy/reports" style={secondaryAction}>Board reports</Link>
          </div>
        </div>
        <div style={missionPanel}>
          <div style={liveRow}><span style={pulse} /> LIVE MANAGEMENT SIGNAL</div>
          <div style={missionGrid}>
            <Signal label="Pipeline" value={`${trainees.length} trainees`} />
            <Signal label="Revenue" value={money(paid)} />
            <Signal label="Risk" value={`${activeAlerts.length + openPayments.length}`} />
            <Signal label="Capacity" value={pct(capacitySignal)} />
          </div>
        </div>
      </section>

      <section style={executiveGrid}>
        <Metric title="Total trainees" value={trainees.length} sub="Permanent Academy folders" tone="#2563eb" />
        <Metric title="Eligibility pending" value={pendingEligibility.length} sub="Admission gate workload" tone="#16a34a" />
        <Metric title="Enrollments" value={enrollments.length} sub={`${pct(conversion)} trainee conversion`} tone="#7c3aed" />
        <Metric title="Collected revenue" value={money(paid)} sub={`${money(unpaid)} still open`} tone="#ea580c" />
        <Metric title="Certificates" value={certified} sub={`${pct(certificationYield)} certification yield`} tone="#ca8a04" />
        <Metric title="Attendance risk" value={pct(attendanceRisk)} sub="Absence pressure index" tone="#dc2626" />
      </section>

      <section style={mainGrid}>
        <div style={panel}>
          <PanelHeader title="Master Academy Navigation" subtitle="All Academy sections with their management purpose, action layer and control signal." />
          <div style={moduleGrid}>
            {modules.map((m) => (
              <Link key={m.href} href={m.href} style={moduleCard(m.tone)}>
                <div style={moduleTop}>
                  <span style={moduleIcon(m.tone)}>{m.icon}</span>
                  <span style={moduleAction}>{m.action}</span>
                </div>
                <strong style={moduleTitle}>{m.label}</strong>
                <p style={moduleDesc}>{m.desc}</p>
                <span style={openLink}>Open section →</span>
              </Link>
            ))}
          </div>
        </div>

        <aside style={sideStack}>
          <div style={panelDark}>
            <PanelHeader dark title="Manager Command Priorities" subtitle="System-driven actions managers should handle first." />
            <div style={priorityList}>
              {priorities.length ? priorities.map((p, i) => (
                <Link key={`${p.title}-${i}`} href={p.href} style={priority(p.tone)}>
                  <span style={priorityRank}>{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>{p.title}</strong>
                    <small>{p.meta}</small>
                  </div>
                </Link>
              )) : <div style={emptyDark}>No critical priorities detected. Maintain standard monitoring.</div>}
            </div>
          </div>

          <div style={panel}>
            <PanelHeader title="Quick Actions" subtitle="Direct execution shortcuts for managers and agents." />
            <div style={quickGrid}>
              <Quick href="/academy/trainees" label="Create trainee" />
              <Quick href="/academy/eligibility" label="Validate eligibility" />
              <Quick href="/academy/enrollments" label="Enroll to group" />
              <Quick href="/academy/payments" label="Add payment" />
              <Quick href="/academy/attendance" label="Mark attendance" />
              <Quick href="/academy/certificates" label="Issue certificate" />
            </div>
          </div>
        </aside>
      </section>

      <section style={bottomGrid}>
        <div style={panel}>
          <PanelHeader title="Operating Model Pipeline" subtitle="End-to-end Academy lifecycle from acquisition to placement and upsell." />
          <div style={pipeline}>
            {[
              ['Lead', trainees.length, '#2563eb'],
              ['Eligible', approvedEligibility, '#16a34a'],
              ['Enrolled', enrollments.length, '#7c3aed'],
              ['Active Groups', groups.length, '#0f766e'],
              ['Certified', certified, '#ca8a04'],
              ['Partners', partners.length, '#0284c7'],
            ].map(([label, value, tone]: any) => <Pipe key={label} label={label} value={value} tone={tone} />)}
          </div>
        </div>

        <div style={panel}>
          <PanelHeader title="Enterprise Control Layer" subtitle="Advanced operating tools added through V5 phases." />
          <div style={commandGrid}>
            {commandLinks.map((l) => (
              <Link key={l.href} href={l.href} style={commandCard}>
                <span>{l.tag}</span>
                <strong>{l.label}</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section style={boardGrid}>
        <BoardCard title="Financial control" value={money(paid)} detail={`Outstanding: ${money(unpaid)} · ${openPayments.length} cases`} />
        <BoardCard title="Delivery capacity" value={`${groups.length} groups`} detail={`${courses.length} courses · ${trainers.length} trainers`} />
        <BoardCard title="Quality signal" value={pct(100 - attendanceRisk)} detail="Attendance stability score" />
        <BoardCard title="Compliance evidence" value={`${certificates.length}`} detail="Certificate registry records" />
      </section>
    </div>
  )
}

function PanelHeader({ title, subtitle, dark }: { title: string; subtitle: string; dark?: boolean }) {
  return <div style={{ marginBottom: 18 }}><h2 style={dark ? titleDark : titleStyle}>{title}</h2><p style={dark ? textDark : textStyle}>{subtitle}</p></div>
}
function Signal({ label, value }: { label: string; value: string }) { return <div style={signal}><strong>{value}</strong><span>{label}</span></div> }
function Metric({ title, value, sub, tone }: { title: string; value: any; sub: string; tone: string }) { return <div style={metric(tone)}><span>{title}</span><strong>{value}</strong><small>{sub}</small></div> }
function Quick({ href, label }: { href: string; label: string }) { return <Link href={href} style={quick}>↗ {label}</Link> }
function Pipe({ label, value, tone }: { label: string; value: any; tone: string }) { return <div style={pipe(tone)}><strong>{value}</strong><span>{label}</span></div> }
function BoardCard({ title, value, detail }: { title: string; value: string; detail: string }) { return <div style={boardCard}><span>{title}</span><strong>{value}</strong><small>{detail}</small></div> }

const page: React.CSSProperties = { display: 'grid', gap: 22 }
const hero: React.CSSProperties = { position: 'relative', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1.35fr .75fr', gap: 24, padding: 34, borderRadius: 34, color: '#fff', background: 'linear-gradient(135deg,#020617 0%,#0f172a 42%,#1d4ed8 100%)', boxShadow: '0 35px 90px rgba(2,6,23,.38)' }
const heroOverlay: React.CSSProperties = { position: 'absolute', inset: 0, background: 'radial-gradient(circle at 18% 20%,rgba(96,165,250,.35),transparent 32%),radial-gradient(circle at 80% 0%,rgba(16,185,129,.26),transparent 28%)' }
const heroLeft: React.CSSProperties = { position: 'relative', zIndex: 1, display: 'grid', gap: 14 }
const badge: React.CSSProperties = { width: 'fit-content', padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#bfdbfe', fontSize: 12, fontWeight: 950, letterSpacing: .8 }
const h1: React.CSSProperties = { margin: 0, fontSize: 52, lineHeight: 1, letterSpacing: -1.4, fontWeight: 1000, color: '#fff' }
const lead: React.CSSProperties = { margin: 0, maxWidth: 820, color: 'rgba(255,255,255,.86)', fontSize: 16, lineHeight: 1.7, fontWeight: 750 }
const heroActions: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }
const primaryAction: React.CSSProperties = { textDecoration: 'none', padding: '13px 18px', borderRadius: 16, background: '#fff', color: '#0f172a', fontWeight: 950 }
const secondaryAction: React.CSSProperties = { textDecoration: 'none', padding: '13px 18px', borderRadius: 16, background: 'rgba(255,255,255,.12)', color: '#fff', fontWeight: 900, border: '1px solid rgba(255,255,255,.2)' }
const missionPanel: React.CSSProperties = { position: 'relative', zIndex: 1, alignSelf: 'stretch', display: 'grid', gap: 16, padding: 20, borderRadius: 26, background: 'rgba(255,255,255,.09)', border: '1px solid rgba(255,255,255,.16)', backdropFilter: 'blur(12px)' }
const liveRow: React.CSSProperties = { display: 'flex', gap: 9, alignItems: 'center', color: '#86efac', fontSize: 12, fontWeight: 950, letterSpacing: .8 }
const pulse: React.CSSProperties = { width: 10, height: 10, borderRadius: 999, background: '#22c55e', boxShadow: '0 0 20px #22c55e' }
const missionGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }
const signal: React.CSSProperties = { padding: 14, borderRadius: 18, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.14)', display: 'grid', gap: 4 }
const executiveGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14 }
const metric = (tone: string): React.CSSProperties => ({ padding: 17, borderRadius: 21, background: '#fff', border: `1px solid ${tone}2E`, borderLeft: `5px solid ${tone}`, display: 'grid', gap: 7, color: '#0f172a', boxShadow: '0 16px 35px rgba(15,23,42,.06)' })
const mainGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 390px', gap: 18, alignItems: 'start' }
const panel: React.CSSProperties = { padding: 22, borderRadius: 28, background: '#fff', border: '1px solid #dbe3ee', boxShadow: '0 18px 45px rgba(15,23,42,.06)' }
const panelDark: React.CSSProperties = { padding: 22, borderRadius: 28, background: 'linear-gradient(180deg,#0f172a,#020617)', border: '1px solid #1e293b', boxShadow: '0 25px 60px rgba(2,6,23,.25)', color: '#fff' }
const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 24, fontWeight: 1000, letterSpacing: -.3 }
const textStyle: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 750, lineHeight: 1.55 }
const titleDark: React.CSSProperties = { ...titleStyle, color: '#fff' }
const textDark: React.CSSProperties = { ...textStyle, color: '#cbd5e1' }
const moduleGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }
const moduleCard = (tone: string): React.CSSProperties => ({ display: 'grid', gap: 12, minHeight: 172, padding: 18, borderRadius: 24, textDecoration: 'none', color: '#0f172a', background: `linear-gradient(180deg,#ffffff,${tone}0D)`, border: `1px solid ${tone}33`, boxShadow: '0 12px 30px rgba(15,23,42,.05)' })
const moduleTop: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }
const moduleIcon = (tone: string): React.CSSProperties => ({ width: 46, height: 46, display: 'grid', placeItems: 'center', borderRadius: 17, background: `${tone}18`, border: `1px solid ${tone}44`, fontSize: 22 })
const moduleAction: React.CSSProperties = { padding: '6px 9px', borderRadius: 999, background: '#f1f5f9', color: '#334155', fontSize: 11, fontWeight: 950 }
const moduleTitle: React.CSSProperties = { fontSize: 17, fontWeight: 1000 }
const moduleDesc: React.CSSProperties = { margin: 0, color: '#64748b', fontSize: 13, lineHeight: 1.5, fontWeight: 750 }
const openLink: React.CSSProperties = { marginTop: 'auto', color: '#1d4ed8', fontWeight: 950, fontSize: 13 }
const sideStack: React.CSSProperties = { display: 'grid', gap: 18 }
const priorityList: React.CSSProperties = { display: 'grid', gap: 10 }
const priority = (tone: string): React.CSSProperties => ({ display: 'flex', gap: 12, alignItems: 'center', padding: 13, borderRadius: 18, textDecoration: 'none', background: `${tone}20`, border: `1px solid ${tone}55`, color: '#fff' })
const priorityRank: React.CSSProperties = { width: 34, height: 34, borderRadius: 12, background: 'rgba(255,255,255,.12)', display: 'grid', placeItems: 'center', fontWeight: 1000 }
const emptyDark: React.CSSProperties = { padding: 14, borderRadius: 18, background: 'rgba(255,255,255,.08)', color: '#cbd5e1', fontWeight: 800 }
const quickGrid: React.CSSProperties = { display: 'grid', gap: 9 }
const quick: React.CSSProperties = { padding: 12, borderRadius: 15, background: '#f8fafc', border: '1px solid #dbe3ee', textDecoration: 'none', color: '#0f172a', fontWeight: 950 }
const bottomGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 18 }
const pipeline: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 10 }
const pipe = (tone: string): React.CSSProperties => ({ padding: 16, borderRadius: 18, background: `${tone}12`, border: `1px solid ${tone}44`, display: 'grid', gap: 5, color: '#0f172a' })
const commandGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }
const commandCard: React.CSSProperties = { padding: 15, borderRadius: 18, background: 'linear-gradient(180deg,#f8fafc,#eef2ff)', border: '1px solid #dbe3ee', textDecoration: 'none', color: '#0f172a', display: 'grid', gap: 6 }
const boardGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }
const boardCard: React.CSSProperties = { padding: 19, borderRadius: 24, background: '#0f172a', color: '#fff', display: 'grid', gap: 7, boxShadow: '0 20px 50px rgba(15,23,42,.18)' }
