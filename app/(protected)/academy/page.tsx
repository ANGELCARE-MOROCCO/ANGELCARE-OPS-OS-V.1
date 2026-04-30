import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { requireAccess } from '@/lib/auth/requireAccess'
import { BoardHero, CommandPanel, ExecutiveKpi, MasterNavigation, QuickActions, RiskRadar, page } from './_components/AcademyBoardUI'

const modules = [
  { title: 'Trainees', href: '/academy/trainees', icon: '👥', priority: 'critical' as const, description: 'Permanent folders, serial numbers, lifecycle and compliance profile.', signal: 'Control identity, status and dossier readiness.', actions: [{ label: 'Create', href: '/academy/trainees' }, { label: 'Dossier', href: '/academy/trainees/dossier' }] },
  { title: 'Eligibility', href: '/academy/eligibility', icon: '✅', priority: 'critical' as const, description: 'Scoring, approval, rejection and missing information control gate.', signal: 'No enrollment before eligibility validation.' },
  { title: 'Enrollments', href: '/academy/enrollments', icon: '📥', priority: 'critical' as const, description: 'Convert eligible trainees into course/group enrollment records.', signal: 'Pipeline conversion engine.' },
  { title: 'Payments', href: '/academy/payments', icon: '💰', priority: 'critical' as const, description: 'Payment ledger, validation, unpaid balance and aging control.', signal: 'Revenue protection and cash follow-up.' },
  { title: 'Locations & Groups', href: '/academy/locations-groups', icon: '📍', priority: 'high' as const, description: 'Capacity, city dispatch, trainer/location/course assignment.', signal: 'Operational capacity control.' },
  { title: 'Trainers', href: '/academy/trainers', icon: '👩‍🏫', priority: 'high' as const, description: 'Trainer specialties, workload, assignment and quality signals.', signal: 'Workforce allocation visibility.' },
  { title: 'Courses', href: '/academy/courses', icon: '📚', priority: 'strategic' as const, description: 'Course catalog, pricing, level, duration and certification path.', signal: 'Academy product engine.' },
  { title: 'Calendar', href: '/academy/calendar', icon: '📅', priority: 'normal' as const, description: 'Sessions, deadlines, group schedule and operational timeline.', signal: 'Scheduling visibility.' },
  { title: 'Attendance', href: '/academy/attendance', icon: '📊', priority: 'critical' as const, description: 'Presence, absence, lateness, discipline and dropout risk.', signal: 'Quality and completion protection.' },
  { title: 'Certificates', href: '/academy/certificates', icon: '📜', priority: 'critical' as const, description: 'Certificate registry, authenticity, readiness and export route.', signal: 'Compliance output control.' },
  { title: 'Graduation', href: '/academy/graduation', icon: '🎓', priority: 'strategic' as const, description: 'Graduate readiness, placement, upsell and post-training outcome.', signal: 'Outcome engine.' },
  { title: 'Partners', href: '/academy/partners', icon: '🤝', priority: 'strategic' as const, description: 'Schools, nurseries, employers and partner dispatch opportunities.', signal: 'B2B growth engine.' },
  { title: 'Alerts & Sales', href: '/academy/alerts-sales', icon: '🚨', priority: 'high' as const, description: 'Follow-up, reminders, sales opportunities and escalations.', signal: 'Manager action queue.' },
  { title: 'Reports', href: '/academy/reports', icon: '📈', priority: 'strategic' as const, description: 'Board-ready reporting, audit evidence and print-ready documents.', signal: 'Executive documentation center.' },
  { title: 'Command Center', href: '/academy/command-center', icon: '🧠', priority: 'critical' as const, description: 'Control layer, exceptions, workflow gates and priority actions.', signal: 'Decision cockpit.' },
  { title: 'Workbench', href: '/academy/workbench', icon: '🏛️', priority: 'strategic' as const, description: 'Enterprise hardening, governance and integration readiness.', signal: 'Scale and quality system.' },
]

export default async function AcademyCommandDashboard() {
  await requireAccess('academy.view')
  const supabase = await createClient()
  const [trainees, payments, enrollments, attendance, certificates, alerts, groups] = await Promise.all([
    supabase.from('academy_trainees').select('id,status,eligibility_status,city,created_at'),
    supabase.from('academy_payments').select('amount,status,due_at,created_at'),
    supabase.from('academy_enrollments').select('id,status,created_at'),
    supabase.from('academy_attendance').select('id,status,session_date'),
    supabase.from('academy_certificates').select('id,status,created_at'),
    supabase.from('academy_alerts').select('id,status,severity,due_at'),
    supabase.from('academy_groups').select('id,status,max_capacity'),
  ])

  const traineeRows = trainees.data || []
  const paymentRows = payments.data || []
  const enrollmentRows = enrollments.data || []
  const attendanceRows = attendance.data || []
  const certificateRows = certificates.data || []
  const alertRows = alerts.data || []
  const groupRows = groups.data || []
  const paid = paymentRows.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
  const unpaid = paymentRows.filter((p: any) => p.status !== 'paid').reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
  const pendingEligibility = traineeRows.filter((t: any) => (t.eligibility_status || 'pending') === 'pending').length
  const openAlerts = alertRows.filter((a: any) => a.status !== 'closed').length
  const absences = attendanceRows.filter((a: any) => a.status === 'absent').length

  return (
    <AppShell title="Academy Command Center" subtitle="Executive Academy operating cockpit: manage, control, decide and scale." breadcrumbs={[{ label: 'Academy' }]} actions={<><PageAction href="/academy/trainees">Create Trainee</PageAction><PageAction href="/academy/command-center" variant="light">Control Center</PageAction></>}>
      <div style={page}>
        <BoardHero title="Academy Operating System" subtitle="A centralized board-grade control tower for training intake, eligibility, enrollment, payments, cohorts, attendance, certification, graduation, partners, risks and executive reporting." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14 }}>
          <ExecutiveKpi label="Trainees" value={traineeRows.length} sub="Permanent folders" tone="#2563eb" />
          <ExecutiveKpi label="Enrollments" value={enrollmentRows.length} sub="Conversion records" tone="#7c3aed" />
          <ExecutiveKpi label="Collected" value={`${paid.toLocaleString()} MAD`} sub="Validated revenue" tone="#16a34a" />
          <ExecutiveKpi label="Unpaid" value={`${unpaid.toLocaleString()} MAD`} sub="Collection workload" tone="#ea580c" />
          <ExecutiveKpi label="Certificates" value={certificateRows.length} sub="Issued records" tone="#0891b2" />
          <ExecutiveKpi label="Alerts" value={openAlerts} sub="Open manager actions" tone="#dc2626" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.25fr .75fr', gap: 18 }}>
          <CommandPanel items={[{ title: 'Validate pending eligibility', detail: `${pendingEligibility} trainee(s) need admission decision.`, href: '/academy/eligibility', tone: '#f97316' }, { title: 'Follow unpaid balances', detail: `${unpaid.toLocaleString()} MAD to control.`, href: '/academy/payments', tone: '#ef4444' }, { title: 'Control attendance risk', detail: `${absences} absence record(s) detected.`, href: '/academy/attendance', tone: '#8b5cf6' }, { title: 'Review group capacity', detail: `${groupRows.length} active/planned group record(s).`, href: '/academy/locations-groups', tone: '#06b6d4' }]} />
          <RiskRadar rows={[{ label: 'Eligibility backlog', value: pendingEligibility, status: pendingEligibility ? 'Action required' : 'Stable', tone: pendingEligibility ? '#f97316' : '#22c55e' }, { label: 'Open alerts', value: openAlerts, status: openAlerts ? 'Manager queue' : 'Clear', tone: openAlerts ? '#ef4444' : '#22c55e' }, { label: 'Attendance absences', value: absences, status: absences ? 'Quality risk' : 'Normal', tone: absences ? '#8b5cf6' : '#22c55e' }]} />
        </div>
        <QuickActions actions={[{ label: 'New Trainee', href: '/academy/trainees', tone: '#2563eb' }, { label: 'Validate Eligibility', href: '/academy/eligibility', tone: '#f97316' }, { label: 'Enroll Candidate', href: '/academy/enrollments', tone: '#7c3aed' }, { label: 'Add Payment', href: '/academy/payments', tone: '#16a34a' }, { label: 'Issue Certificate', href: '/academy/certificates', tone: '#0891b2' }]} />
        <MasterNavigation modules={modules} />
      </div>
    </AppShell>
  )
}
