import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { HRHero, HRPanel, HRGrid, HRButton } from '../_components/HRMaxUI'

export default function HRQuickActionsPage() {
  const actions = [
    ['/hr/openings/new', 'Create Opening', 'Create a new job opening.'],
    ['/hr/recruitment/candidates', 'Add Candidate', 'Open candidate intake.'],
    ['/hr/staff/new', 'Create Staff', 'Create staff profile.'],
    ['/hr/rosters/planner', 'Plan Roster', 'Create roster assignment.'],
    ['/hr/attendance/corrections', 'Attendance Correction', 'Create correction request.'],
    ['/hr/onboarding/board', 'Onboarding Board', 'Move onboarding steps.'],
    ['/hr/documents', 'Verify Documents', 'Control compliance documents.'],
    ['/hr/approvals', 'Approvals', 'Review decision queue.'],
    ['/hr/tasks', 'Tasks', 'Create and update HR tasks.'],
    ['/hr/escalations', 'Escalate Issue', 'Open escalation center.'],
  ]

  return (
    <AppShell title="HR Quick Actions" subtitle="Fast operational action launcher." breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Quick Actions' }]} actions={<PageAction href="/hr/operations-console" variant="light">Console</PageAction>}>
      <HRHero title="HR Quick Actions" subtitle="A strict shortcut board for the most common HR actions. Each button points to an existing operational route." />
      <HRGrid min={260}>
        {actions.map(([href, title, description]) => (
          <HRPanel key={href} title={title} subtitle={description} right={<HRButton href={href} variant="blue">Open</HRButton>}>
            <div style={{ color: '#64748b', fontWeight: 800 }}>{href}</div>
          </HRPanel>
        ))}
      </HRGrid>
    </AppShell>
  )
}
