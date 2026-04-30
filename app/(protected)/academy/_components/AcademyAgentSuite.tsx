import Link from 'next/link'
import type React from 'react'

type ModuleConfig = {
  title: string
  mission: string
  primary: string
  controls: string[]
  tools: { label: string; href: string; tone: string }[]
  indicators: Array<{ label: string; value: (data: any) => string | number; sub: string; tone: string }>
  risks: string[]
  playbook: string[]
}

const money = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} MAD`
const paid = (data: any) => (data?.payments || []).filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
const pendingPay = (data: any) => (data?.payments || []).filter((p: any) => p.status !== 'paid')
const openAlerts = (data: any) => (data?.alerts || []).filter((a: any) => a.status !== 'closed')
const eligible = (data: any) => (data?.trainees || []).filter((t: any) => t.eligibility_status === 'approved' || t.status === 'eligible')
const certified = (data: any) => (data?.trainees || []).filter((t: any) => t.status === 'certified')

const commonTools = [
  { label: 'Command Center', href: '/academy', tone: '#0f172a' },
  { label: 'Enrollments', href: '/academy/enrollments', tone: '#2563eb' },
  { label: 'Payments', href: '/academy/payments', tone: '#16a34a' },
  { label: 'Attendance', href: '/academy/attendance', tone: '#f59e0b' },
  { label: 'Certificates', href: '/academy/certificates', tone: '#7c3aed' },
]

const CONFIG: Record<string, ModuleConfig> = {
  administration: {
    title: 'Academy Administration Control Room',
    mission: 'Governance, operating standards, compliance routines and executive supervision for the full Academy lifecycle.',
    primary: 'Keep the Academy operating model disciplined, auditable and ready for scale.',
    controls: ['Governance cadence', 'Compliance checkpoints', 'Operational ownership', 'Exception escalation'],
    tools: commonTools,
    indicators: [
      { label: 'Active trainees', value: d => d?.trainees?.length || 0, sub: 'All permanent folders', tone: '#2563eb' },
      { label: 'Open alerts', value: d => openAlerts(d).length, sub: 'Manager attention required', tone: '#ef4444' },
      { label: 'Audit density', value: d => d?.auditLogs?.length || 0, sub: 'Traceability entries', tone: '#0f172a' },
    ],
    risks: ['Unclear ownership', 'Weak compliance trail', 'Operational drift'],
    playbook: ['Review open exceptions', 'Validate daily operating owner', 'Check unlogged critical decisions'],
  },
  enrollments: {
    title: 'Enrollment Conversion Cockpit',
    mission: 'Convert approved candidates into controlled enrollments with course, group and revenue linkage.',
    primary: 'Move candidates from eligibility to monetized training cohorts without missing data.',
    controls: ['Eligibility gate', 'Course/group linkage', 'Conversion tracking', 'Missing-data detection'],
    tools: commonTools,
    indicators: [
      { label: 'Eligible pool', value: d => eligible(d).length, sub: 'Ready to enroll', tone: '#2563eb' },
      { label: 'Enrollments', value: d => d?.enrollments?.length || 0, sub: 'Total records', tone: '#16a34a' },
      { label: 'Groups available', value: d => d?.groups?.length || 0, sub: 'Cohort capacity', tone: '#7c3aed' },
    ],
    risks: ['Approved trainee not enrolled', 'Enrollment without payment follow-up', 'Group assignment missing'],
    playbook: ['Enroll approved candidates', 'Attach course and group', 'Send payment follow-up'],
  },
  eligibility: {
    title: 'Eligibility Gate & Scoring Desk',
    mission: 'Protect training quality by validating fit, readiness, documentation and interview evidence before enrollment.',
    primary: 'Approve only candidates who meet Academy readiness standards.',
    controls: ['Score candidate', 'Approve/reject/request info', 'Block invalid progression', 'Manager notes'],
    tools: commonTools,
    indicators: [
      { label: 'Pending decisions', value: d => (d?.trainees || []).filter((t:any)=>!t.eligibility_status || t.eligibility_status==='pending').length, sub: 'Approval backlog', tone: '#f59e0b' },
      { label: 'Approved', value: d => eligible(d).length, sub: 'Ready for enrollment', tone: '#16a34a' },
      { label: 'Rejected', value: d => (d?.trainees || []).filter((t:any)=>t.eligibility_status==='rejected').length, sub: 'Not fit / incomplete', tone: '#ef4444' },
    ],
    risks: ['Enrollment before approval', 'Low score accepted', 'Missing notes for rejection'],
    playbook: ['Review pending list', 'Score candidate', 'Record decision rationale'],
  },
  payments: {
    title: 'Academy Financial Control Tower',
    mission: 'Monitor collection, unpaid balances, payment risks and revenue integrity across all cohorts.',
    primary: 'Turn training operations into controlled revenue with clear follow-up obligations.',
    controls: ['Register payment', 'Validate payment', 'Track aging', 'Trigger follow-up'],
    tools: commonTools,
    indicators: [
      { label: 'Collected', value: d => money(paid(d)), sub: 'Paid payment records', tone: '#16a34a' },
      { label: 'Open payments', value: d => pendingPay(d).length, sub: 'Collection workload', tone: '#ef4444' },
      { label: 'Ledger lines', value: d => d?.payments?.length || 0, sub: 'Payment records', tone: '#2563eb' },
    ],
    risks: ['Unpaid trainee active in group', 'Missing reference', 'Overdue balance not followed'],
    playbook: ['Review unpaid list', 'Validate references', 'Create follow-up alert'],
  },
  'locations-groups': {
    title: 'Cohort Dispatch & Capacity Planner',
    mission: 'Control locations, cohorts, trainers, capacity, city dispatch and group readiness.',
    primary: 'Make sure every trainee is dispatched into a viable cohort with trainer/location capacity.',
    controls: ['Create location', 'Create group', 'Assign trainer/course/location', 'Monitor capacity'],
    tools: commonTools,
    indicators: [
      { label: 'Locations', value: d => d?.locations?.length || 0, sub: 'Training sites', tone: '#2563eb' },
      { label: 'Groups', value: d => d?.groups?.length || 0, sub: 'Training cohorts', tone: '#7c3aed' },
      { label: 'Trainers', value: d => d?.trainers?.length || 0, sub: 'Workforce pool', tone: '#16a34a' },
    ],
    risks: ['Group without trainer', 'Group without location', 'Capacity mismatch'],
    playbook: ['Create missing locations', 'Attach trainers', 'Balance city demand'],
  },
  trainers: {
    title: 'Trainer Workforce Command',
    mission: 'Manage trainer availability, specialty, workload, quality signals and assignment readiness.',
    primary: 'Keep training delivery reliable with the right trainer in the right cohort.',
    controls: ['Create trainer', 'Define specialty', 'Assign to groups', 'Monitor workload'],
    tools: commonTools,
    indicators: [
      { label: 'Trainers', value: d => d?.trainers?.length || 0, sub: 'Registered pool', tone: '#2563eb' },
      { label: 'Groups', value: d => d?.groups?.length || 0, sub: 'Potential assignments', tone: '#7c3aed' },
      { label: 'Courses', value: d => d?.courses?.length || 0, sub: 'Curriculum demand', tone: '#16a34a' },
    ],
    risks: ['Trainer overload', 'Specialty mismatch', 'No backup trainer'],
    playbook: ['Review open groups', 'Match specialty to course', 'Maintain backup pool'],
  },
  courses: {
    title: 'Course Product & Curriculum Engine',
    mission: 'Control Academy products, pricing, levels, duration and certification paths.',
    primary: 'Maintain a scalable training catalog that supports revenue and certification outcomes.',
    controls: ['Create course', 'Define price/duration', 'Set level', 'Manage status'],
    tools: commonTools,
    indicators: [
      { label: 'Courses', value: d => d?.courses?.length || 0, sub: 'Catalog size', tone: '#2563eb' },
      { label: 'Active groups', value: d => d?.groups?.length || 0, sub: 'Course demand', tone: '#7c3aed' },
      { label: 'Certificates', value: d => d?.certificates?.length || 0, sub: 'Certification output', tone: '#16a34a' },
    ],
    risks: ['Course without price', 'Course without certification path', 'Inactive course still sold'],
    playbook: ['Validate catalog', 'Check pricing discipline', 'Review certificate linkage'],
  },
  calendar: {
    title: 'Training Calendar & Session Control',
    mission: 'Coordinate upcoming sessions, timelines, cohort rhythm and operational deadlines.',
    primary: 'Make the Academy predictable for trainers, trainees and managers.',
    controls: ['Track group dates', 'Detect upcoming sessions', 'Spot scheduling gaps', 'Plan deadlines'],
    tools: commonTools,
    indicators: [
      { label: 'Scheduled groups', value: d => (d?.groups || []).filter((g:any)=>g.start_date).length, sub: 'Groups with dates', tone: '#2563eb' },
      { label: 'Locations', value: d => d?.locations?.length || 0, sub: 'Available sites', tone: '#16a34a' },
      { label: 'Open alerts', value: d => openAlerts(d).length, sub: 'Timing issues', tone: '#ef4444' },
    ],
    risks: ['No start date', 'Trainer/location conflict', 'No reminder before session'],
    playbook: ['Review upcoming groups', 'Confirm trainer/location', 'Create reminder alerts'],
  },
  attendance: {
    title: 'Attendance Quality & Dropout Risk Control',
    mission: 'Track presence, absence, lateness and completion risk with manager intervention signals.',
    primary: 'Protect training outcomes through disciplined attendance monitoring.',
    controls: ['Mark present/absent/late', 'Add discipline note', 'Detect risk', 'Escalate absence'],
    tools: commonTools,
    indicators: [
      { label: 'Attendance logs', value: d => d?.attendance?.length || 0, sub: 'Recorded sessions', tone: '#2563eb' },
      { label: 'Absences', value: d => (d?.attendance || []).filter((a:any)=>a.status==='absent').length, sub: 'Risk signals', tone: '#ef4444' },
      { label: 'Late records', value: d => (d?.attendance || []).filter((a:any)=>a.status==='late').length, sub: 'Discipline trend', tone: '#f59e0b' },
    ],
    risks: ['Repeated absence', 'Low completion probability', 'No attendance evidence'],
    playbook: ['Mark session daily', 'Review absence cluster', 'Escalate high-risk trainee'],
  },
  trainees: {
    title: 'Permanent Trainee Dossier Command',
    mission: 'Manage lifelong trainee folders, serial numbers, status, classification and cross-module history.',
    primary: 'Build a reliable permanent record for every Academy participant.',
    controls: ['Create trainee', 'Auto serial', 'Classify status', 'Jump to related actions'],
    tools: [...commonTools, { label: 'Dossier', href: '/academy/trainees/dossier', tone: '#0ea5e9' }],
    indicators: [
      { label: 'Trainees', value: d => d?.trainees?.length || 0, sub: 'Permanent folders', tone: '#2563eb' },
      { label: 'Eligible', value: d => eligible(d).length, sub: 'Validated candidates', tone: '#16a34a' },
      { label: 'Certified', value: d => certified(d).length, sub: 'Graduation output', tone: '#7c3aed' },
    ],
    risks: ['Missing serial', 'No eligibility decision', 'No next action'],
    playbook: ['Create/clean records', 'Validate eligibility', 'Move to enrollment'],
  },
  certificates: {
    title: 'Certificate Authenticity Factory',
    mission: 'Issue controlled certificates with numbers, verification hashes and readiness discipline.',
    primary: 'Protect AngelCare certification credibility and traceability.',
    controls: ['Check readiness', 'Issue certificate', 'Generate number/hash', 'Track registry'],
    tools: [...commonTools, { label: 'Certificate Export', href: '/academy/certificates/export', tone: '#7c3aed' }],
    indicators: [
      { label: 'Certificates', value: d => d?.certificates?.length || 0, sub: 'Issued records', tone: '#7c3aed' },
      { label: 'Certified trainees', value: d => certified(d).length, sub: 'Lifecycle status', tone: '#16a34a' },
      { label: 'Attendance logs', value: d => d?.attendance?.length || 0, sub: 'Evidence base', tone: '#2563eb' },
    ],
    risks: ['Certificate before payment', 'Certificate before attendance evidence', 'Missing verification hash'],
    playbook: ['Review readiness', 'Issue certificate', 'Archive evidence'],
  },
  graduation: {
    title: 'Graduation Outcomes & Upsell Engine',
    mission: 'Convert certification into placement, partner opportunities, upsell and follow-up value.',
    primary: 'Make graduation a business outcome, not an endpoint.',
    controls: ['Create follow-up', 'Assign partner', 'Set opportunity type', 'Track status'],
    tools: commonTools,
    indicators: [
      { label: 'Graduation follow-ups', value: d => d?.graduationFollowups?.length || 0, sub: 'Outcome pipeline', tone: '#2563eb' },
      { label: 'Partners', value: d => d?.partners?.length || 0, sub: 'Placement network', tone: '#16a34a' },
      { label: 'Certificates', value: d => d?.certificates?.length || 0, sub: 'Eligible outputs', tone: '#7c3aed' },
    ],
    risks: ['Certified trainee without next path', 'Partner opportunity not followed', 'Lost upsell'],
    playbook: ['Review certified list', 'Create follow-up', 'Match partner or upsell'],
  },
  partners: {
    title: 'Academy Partner & Placement Network',
    mission: 'Manage schools, nurseries, professional partners and dispatch opportunities.',
    primary: 'Turn training supply into B2B placement and strategic partnerships.',
    controls: ['Create partner', 'Classify type/city', 'Track status', 'Link to graduation follow-ups'],
    tools: commonTools,
    indicators: [
      { label: 'Partners', value: d => d?.partners?.length || 0, sub: 'Network size', tone: '#16a34a' },
      { label: 'Certified pool', value: d => certified(d).length, sub: 'Placement supply', tone: '#7c3aed' },
      { label: 'Follow-ups', value: d => d?.graduationFollowups?.length || 0, sub: 'Opportunity pipeline', tone: '#2563eb' },
    ],
    risks: ['No city match', 'Inactive partner', 'No follow-up owner'],
    playbook: ['Create/qualify partners', 'Match certified trainees', 'Track placement status'],
  },
  'alerts-sales': {
    title: 'Alerts, Sales & After-Sales Command',
    mission: 'Run reminders, commercial follow-up, conversion actions and exception closure.',
    primary: 'Make every issue and opportunity actionable until closed.',
    controls: ['Create alert', 'Assign trainee', 'Track severity/status', 'Follow sales stage'],
    tools: commonTools,
    indicators: [
      { label: 'Open alerts', value: d => openAlerts(d).length, sub: 'Exception workload', tone: '#ef4444' },
      { label: 'Sales records', value: d => d?.salesPipeline?.length || 0, sub: 'Commercial pipeline', tone: '#2563eb' },
      { label: 'Pending payments', value: d => pendingPay(d).length, sub: 'Collection actions', tone: '#f59e0b' },
    ],
    risks: ['Alert not closed', 'Payment follow-up missed', 'Opportunity lost without reason'],
    playbook: ['Review open alerts', 'Call priority trainees', 'Close or escalate each item'],
  },
  reports: {
    title: 'Reporting & Board Documentation Hub',
    mission: 'Convert Academy activity into board-ready metrics, audit evidence and PDF-ready documentation.',
    primary: 'Give management a credible reading of revenue, outcomes, quality and exceptions.',
    controls: ['Generate reports', 'Review audit trail', 'Export dossiers', 'Track documentation quality'],
    tools: [...commonTools, { label: 'Audit', href: '/academy/audit', tone: '#0f172a' }, { label: 'Documents', href: '/academy/documents', tone: '#2563eb' }],
    indicators: [
      { label: 'Trainees', value: d => d?.trainees?.length || 0, sub: 'Population', tone: '#2563eb' },
      { label: 'Collected', value: d => money(paid(d)), sub: 'Revenue evidence', tone: '#16a34a' },
      { label: 'Audit logs', value: d => d?.auditLogs?.length || 0, sub: 'Traceability', tone: '#0f172a' },
    ],
    risks: ['Missing audit evidence', 'Weak documentation trail', 'No export control'],
    playbook: ['Select report period', 'Review exceptions', 'Print/export controlled report'],
  },
}

export function AcademyAgentSuite({ moduleKey, data }: { moduleKey: string; data: any }) {
  const cfg = CONFIG[moduleKey] || CONFIG.administration
  return (
    <section style={shell}>
      <div style={topBand}>
        <div>
          <div style={badge}>MANAGER OPERATING SUITE</div>
          <h2 style={title}>{cfg.title}</h2>
          <p style={text}>{cfg.mission}</p>
        </div>
        <div style={primaryBox}>
          <span>Primary operating question</span>
          <strong>{cfg.primary}</strong>
        </div>
      </div>

      <div style={kpiGrid}>
        {cfg.indicators.map((x) => <div key={x.label} style={{ ...metric, borderLeftColor: x.tone }}><span>{x.label}</span><strong>{x.value(data)}</strong><small>{x.sub}</small></div>)}
      </div>

      <div style={grid}>
        <div style={panel}>
          <h3 style={h3}>Agent tools</h3>
          <div style={toolGrid}>{cfg.tools.map((t) => <Link key={`${t.href}-${t.label}`} href={t.href} style={{ ...tool, background: t.tone }}>{t.label} →</Link>)}</div>
        </div>
        <div style={panel}>
          <h3 style={h3}>Control points</h3>
          <div style={chips}>{cfg.controls.map((c) => <span key={c} style={chip}>{c}</span>)}</div>
        </div>
        <div style={panel}>
          <h3 style={h3}>Exception radar</h3>
          <ul style={list}>{cfg.risks.map((r) => <li key={r}>{r}</li>)}</ul>
        </div>
      </div>

      <div style={playbook}>
        <strong>Today’s manager playbook</strong>
        <div style={steps}>{cfg.playbook.map((p, i) => <span key={p}>{i + 1}. {p}</span>)}</div>
      </div>
    </section>
  )
}

const shell: React.CSSProperties = { display: 'grid', gap: 14, padding: 18, borderRadius: 28, background: 'linear-gradient(135deg,#020617,#0f172a 42%,#1d4ed8)', color: '#fff', boxShadow: '0 32px 80px rgba(2,6,23,.34)', border: '1px solid rgba(255,255,255,.14)' }
const topBand: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 360px', gap: 18, alignItems: 'stretch' }
const badge: React.CSSProperties = { display: 'inline-flex', padding: '7px 11px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#bfdbfe', fontSize: 11, fontWeight: 1000, letterSpacing: 1 }
const title: React.CSSProperties = { margin: '12px 0 6px', fontSize: 30, fontWeight: 1000, letterSpacing: -.5 }
const text: React.CSSProperties = { margin: 0, color: 'rgba(255,255,255,.82)', fontWeight: 750, lineHeight: 1.55, maxWidth: 820 }
const primaryBox: React.CSSProperties = { display: 'grid', gap: 8, padding: 18, borderRadius: 22, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.16)' }
const kpiGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }
const metric: React.CSSProperties = { display: 'grid', gap: 6, padding: 16, borderRadius: 20, background: '#fff', color: '#0f172a', borderLeft: '6px solid #2563eb' }
const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.05fr 1fr 1fr', gap: 12 }
const panel: React.CSSProperties = { padding: 16, borderRadius: 22, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.14)' }
const h3: React.CSSProperties = { margin: '0 0 12px', fontSize: 16, fontWeight: 1000 }
const toolGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }
const tool: React.CSSProperties = { padding: '11px 12px', borderRadius: 14, color: '#fff', textDecoration: 'none', fontWeight: 950, boxShadow: '0 12px 26px rgba(0,0,0,.18)' }
const chips: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 }
const chip: React.CSSProperties = { padding: '8px 10px', borderRadius: 999, background: 'rgba(255,255,255,.14)', fontSize: 12, fontWeight: 900 }
const list: React.CSSProperties = { margin: 0, paddingLeft: 18, display: 'grid', gap: 7, color: 'rgba(255,255,255,.86)', fontWeight: 750 }
const playbook: React.CSSProperties = { display: 'grid', gap: 10, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.95)', color: '#0f172a' }
const steps: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, fontWeight: 850, color: '#334155' }
