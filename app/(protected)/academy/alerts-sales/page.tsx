import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { requireAccess } from '@/lib/auth/requireAccess'

const academyModules = [
  { key: 'administration', title: 'Administration', href: '/academy/administration', icon: '🏛️', tone: '#2563eb', desc: 'Governance, permissions, academy settings, operational rules and compliance backbone.' },
  { key: 'enrollments', title: 'Enrollments', href: '/academy/enrollments', icon: '📝', tone: '#7c3aed', desc: 'Candidate intake, lead-to-trainee conversion, enrollment pipeline and document readiness.' },
  { key: 'eligibility', title: 'Eligibility', href: '/academy/eligibility', icon: '✅', tone: '#16a34a', desc: 'Qualification scoring, admission decision, interview status and risk screening.' },
  { key: 'payments', title: 'Payments', href: '/academy/payments', icon: '💳', tone: '#059669', desc: 'Tuition tracking, deposits, payment plans, unpaid balances and finance alerts.' },
  { key: 'locations-groups', title: 'Locations & Groups', href: '/academy/locations-groups', icon: '📍', tone: '#ea580c', desc: 'Training sites, cohorts, dispatch, capacity, room planning and group logistics.' },
  { key: 'trainers', title: 'Trainers Management', href: '/academy/trainers', icon: '👩‍🏫', tone: '#db2777', desc: 'Trainer allocation, performance, availability, specialization and session coverage.' },
  { key: 'courses', title: 'Training Courses', href: '/academy/courses', icon: '📚', tone: '#0891b2', desc: 'Curriculum architecture, modular courses, skills blocks, assessments and standards.' },
  { key: 'calendar', title: 'Calendar', href: '/academy/calendar', icon: '🗓️', tone: '#4f46e5', desc: 'Sessions, rooms, trainer slots, exams, attendance deadlines and reminders.' },
  { key: 'attendance', title: 'Attendance', href: '/academy/attendance', icon: '📡', tone: '#ca8a04', desc: 'Presence, lateness, absence justification, session completion and field readiness.' },
  { key: 'trainees', title: 'Trainee Permanent Folder', href: '/academy/trainees', icon: '🧬', tone: '#0f766e', desc: 'Unique serial profile, documents, progression, compliance and lifetime training history.' },
  { key: 'certificates', title: 'Certificates & Attestations', href: '/academy/certificates', icon: '🎓', tone: '#9333ea', desc: 'Authenticity serial number, certificate generation, validation and audit trail.' },
  { key: 'graduation', title: 'Graduation & Upsell', href: '/academy/graduation', icon: '🚀', tone: '#e11d48', desc: 'Graduation board, placement readiness, AngelCare duty integration and upsell offers.' },
  { key: 'partners', title: 'Academy Partners', href: '/academy/partners', icon: '🤝', tone: '#1d4ed8', desc: 'Schools, nurseries, professional partners, B2B assignments and partner performance.' },
  { key: 'alerts-sales', title: 'Alerts, Sales & After-Sales', href: '/academy/alerts-sales', icon: '🔔', tone: '#b45309', desc: 'Reminders, commercial follow-up, after-sales, renewals and escalation triggers.' },
]

const lifecycle = ['Lead', 'Eligible', 'Enrolled', 'Paid', 'Dispatched', 'Training', 'Attendance', 'Assessment', 'Certified', 'Graduated', 'Placed / Upsell']

function ModuleNav({ current }: { current?: string }) {
  return <section style={navPanelStyle}>{academyModules.map((m) => <a key={m.key} href={m.href} style={navItemStyle(m.tone, current === m.key)}><span>{m.icon}</span><strong>{m.title}</strong><small>{m.desc}</small></a>)}</section>
}

function Kpi({ title, value, sub, tone }: { title: string; value: string; sub: string; tone: string }) {
  return <div style={kpiStyle(tone)}><span>{title}</span><strong>{value}</strong><small>{sub}</small></div>
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <section style={panelStyle}><div style={{ marginBottom: 18 }}><h2 style={sectionTitleStyle}>{title}</h2><p style={sectionTextStyle}>{subtitle}</p></div>{children}</section>
}

function OperationalCard({ title, detail, tag, tone }: { title: string; detail: string; tag: string; tone: string }) {
  return <div style={opCardStyle(tone)}><div style={tagStyle(tone)}>{tag}</div><h3>{title}</h3><p>{detail}</p></div>
}

function Pipeline() {
  return <div style={pipelineStyle}>{lifecycle.map((x, i) => <div key={x} style={pipeStepStyle(i)}><strong>{i + 1}</strong><span>{x}</span></div>)}</div>
}

const pageStyle: React.CSSProperties = { display: 'grid', gap: 22 }
const heroStyle: React.CSSProperties = { position: 'relative', overflow: 'hidden', padding: 34, borderRadius: 36, color: '#fff', background: 'radial-gradient(circle at top left,#7c3aed,#020617 62%)', boxShadow: '0 35px 90px rgba(2,6,23,.40)', border: '1px solid rgba(255,255,255,.10)' }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 46, fontWeight: 1000, letterSpacing: -1 }
const heroTextStyle: React.CSSProperties = { maxWidth: 880, color: 'rgba(255,255,255,.88)', fontWeight: 800, lineHeight: 1.65 }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', width: 'fit-content', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.14)', color: '#ede9fe', fontSize: 12, fontWeight: 950, letterSpacing: 1, marginBottom: 12 }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 14 }
const kpiStyle = (tone: string): React.CSSProperties => ({ background: '#fff', border: `1px solid ${tone}33`, borderLeft: `5px solid ${tone}`, borderRadius: 22, padding: 18, display: 'grid', gap: 7, boxShadow: '0 18px 38px rgba(15,23,42,.05)', color: '#0f172a' })
const navPanelStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }
const navItemStyle = (tone: string, active?: boolean): React.CSSProperties => ({ textDecoration: 'none', display: 'grid', gap: 8, padding: 18, borderRadius: 24, background: active ? `linear-gradient(135deg,${tone},#020617)` : '#fff', border: `1px solid ${tone}33`, color: active ? '#fff' : '#0f172a', boxShadow: '0 18px 38px rgba(15,23,42,.06)' })
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 28, padding: 24, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const sectionTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 24, fontWeight: 950 }
const sectionTextStyle: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 750, lineHeight: 1.55 }
const grid3Style: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }
const grid2Style: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }
const opCardStyle = (tone: string): React.CSSProperties => ({ padding: 18, borderRadius: 22, background: `linear-gradient(180deg,#ffffff,${tone}10)`, border: `1px solid ${tone}33`, color: '#0f172a' })
const tagStyle = (tone: string): React.CSSProperties => ({ display: 'inline-flex', padding: '6px 10px', borderRadius: 999, background: `${tone}18`, border: `1px solid ${tone}44`, color: '#0f172a', fontSize: 11, fontWeight: 950 })
const pipelineStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(11,minmax(100px,1fr))', gap: 10, overflowX: 'auto' }
const pipeStepStyle = (i: number): React.CSSProperties => ({ padding: 14, borderRadius: 18, background: i % 2 ? '#f8fafc' : '#eef2ff', border: '1px solid #dbe3ee', display: 'grid', gap: 6, minHeight: 82, color: '#0f172a' })

export default async function AcademySubmodulePage() {
  await requireAccess('academy.view')
  return <AppShell title="Academy • Alerts, Reminders, Sales & After-Sales" subtitle="Reminders, commercial follow-up, renewals, escalations and after-sales." breadcrumbs={[{ label: 'Academy', href: '/academy' }, { label: 'Alerts, Reminders, Sales & After-Sales' }]} actions={<><PageAction href="/academy" variant="light">Academy Hub</PageAction><PageAction href="/academy/certificates">Certificates</PageAction></>}><div style={pageStyle}><section style={heroStyle}><div style={badgeStyle}>ACADEMY SUBMODULE • ALERTS-SALES</div><h1 style={heroTitleStyle}>Alerts, Reminders, Sales & After-Sales</h1><p style={heroTextStyle}>Reminders, commercial follow-up, renewals, escalations and after-sales. This workspace is structured for high-control training operations, documentation quality, ISO-style traceability and future database activation.</p></section><section style={kpiGridStyle}><Kpi title="Operational readiness" value="92%" sub="process configured" tone="#7c3aed"/><Kpi title="Records controlled" value="Active" sub="traceability mode" tone="#2563eb"/><Kpi title="Alerts" value="3" sub="manager attention" tone="#ea580c"/><Kpi title="Quality level" value="Premium" sub="AngelCare standard" tone="#16a34a"/><Kpi title="Integration" value="Ready" sub="OpsOS connected" tone="#db2777"/></section><Section title="Submodule command functions" subtitle="Dedicated controls for this Academy domain."><div style={grid3Style}><OperationalCard title="Alert center" detail="Manage alert center with structured status, ownership, documentation, alerts and action history." tag="Control" tone="#7c3aed" /><OperationalCard title="Payment reminders" detail="Manage payment reminders with structured status, ownership, documentation, alerts and action history." tag="Control" tone="#7c3aed" /><OperationalCard title="Absence reminders" detail="Manage absence reminders with structured status, ownership, documentation, alerts and action history." tag="Control" tone="#7c3aed" /><OperationalCard title="Sales pipeline" detail="Manage sales pipeline with structured status, ownership, documentation, alerts and action history." tag="Control" tone="#7c3aed" /><OperationalCard title="After-sales tasks" detail="Manage after-sales tasks with structured status, ownership, documentation, alerts and action history." tag="Control" tone="#7c3aed" /><OperationalCard title="Escalation board" detail="Manage escalation board with structured status, ownership, documentation, alerts and action history." tag="Control" tone="#7c3aed" /></div></Section><Section title="Related Academy navigation" subtitle="Return to hub or move laterally across Academy operations."><ModuleNav current="alerts-sales" /></Section><section style={grid2Style}><OperationalCard title="Smart manager diagnosis" detail="This area should surface missing data, risk, delay, conversion blockers and next best action for Academy managers." tag="AI-ready" tone="#2563eb"/><OperationalCard title="Compliance documentation" detail="Every action is designed to be connected later to logs, certificates, trainee folders and audit-ready documentation." tag="ISO" tone="#16a34a"/></section></div></AppShell>
}
