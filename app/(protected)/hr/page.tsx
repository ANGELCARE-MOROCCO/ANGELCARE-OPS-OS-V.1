import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRUXPack1Data } from '@/lib/hr-unified/ux-pack1-data'
import {
  CommandButton,
  CommandRail,
  HeatTile,
  PremiumHero,
  PremiumPanel,
  PremiumShell,
  PulseMetric,
  SectionTabs,
  WorkQueueRow,
  threeColumn,
  twoColumn,
} from './_components/HRPremiumCommandUI'

export default async function HRPremiumDashboard() {
  const data = await getHRUXPack1Data()

  const tabs = [
    { label: 'Operations Console', href: '/hr/operations-console' },
    { label: 'Boardroom', href: '/hr/boardroom' },
    { label: 'Recruitment', href: '/hr/recruitment' },
    { label: 'Staff 360', href: '/hr/staff' },
    { label: 'Risk Center', href: '/hr/risk-center' },
    { label: 'Final QA', href: '/hr/final-qa' },
  ]

  const commandItems = [
    { label: 'Create Staff', href: '/hr/staff/new', tone: 'green' as const, detail: 'Add caregiver or office profile' },
    { label: 'Open Position', href: '/hr/openings/new', tone: 'blue' as const, detail: 'Launch a hiring demand' },
    { label: 'Roster Intervention', href: '/hr/rosters/conflicts', tone: 'red' as const, detail: 'Resolve coverage risk' },
    { label: 'Verify Documents', href: '/hr/documents', tone: 'amber' as const, detail: 'Reduce compliance exposure' },
    { label: 'Decision Queue', href: '/hr/approvals', tone: 'purple' as const, detail: 'Approve or reject requests' },
  ]

  const liveQueue = [
    ...((data as any).escalations || []).slice(0, 5).map((x: any) => ({ ...x, tone: 'red' as const, title: x.title || x.escalation_type || 'Escalation', meta: `${x.severity || 'medium'} • ${x.owner || 'HR'}` })),
    ...data.activeTasks.slice(0, 5).map((x: any) => ({ ...x, tone: 'amber' as const, title: x.title || 'Task', meta: `${x.task_type || 'task'} • ${x.priority || 'medium'}` })),
    ...data.pendingApprovals.slice(0, 5).map((x: any) => ({ ...x, tone: 'purple' as const, title: x.title || 'Approval', meta: `${x.approval_type || 'approval'} • ${x.priority || 'medium'}` })),
  ]

  return (
    <AppShell
      title="HR MAX"
      subtitle="Executive HR operating system"
      breadcrumbs={[{ label: 'HR', href: '/hr' }]}
      actions={<PageAction href="/hr/navigation" variant="light">Navigation</PageAction>}
    >
      <PremiumShell>
        <SectionTabs items={tabs} />

        <PremiumHero
          eyebrow="Executive HR Command"
          title="AngelCare HR MAX — Workforce Command Center"
          subtitle="A premium command surface for recruitment pressure, workforce health, attendance risks, roster coverage, document exposure, decisions, and daily HR operations."
          stats={[
            { label: 'Staff records', value: data.staff.length },
            { label: 'Active candidates', value: data.activeCandidates.length },
            { label: 'Open approvals', value: data.pendingApprovals.length },
            { label: 'Risk exposure', value: data.pendingDocs.length + data.rosterRisks.length + data.attendanceRisks.length },
          ]}
          actions={
            <>
              <CommandButton href="/hr/operations-console" tone="blue">Open Operations Console</CommandButton>
              <CommandButton href="/hr/boardroom" tone="purple">Boardroom View</CommandButton>
              <CommandButton href="/hr/quick-actions" tone="green">Quick Actions</CommandButton>
            </>
          }
        />

        <div style={threeColumn}>
          {data.executivePulse.map((m: any) => (
            <PulseMetric key={m.label} {...m} />
          ))}
        </div>

        <div style={{ height: 22 }} />

        <div style={twoColumn}>
          <div style={{ display: 'grid', gap: 20 }}>
            <PremiumPanel title="Live Operations Grid" subtitle="Specialized HR operating widgets, not generic cards." accent="blue">
              <div style={threeColumn}>
                <HeatTile label="Recruitment Pipeline" value={data.activeCandidates.length} tone="purple" detail="active candidates" />
                <HeatTile label="Open Jobs" value={data.activeOpenings.length} tone="blue" detail="hiring demand" />
                <HeatTile label="Onboarding Backlog" value={data.onboardingBacklog.length} tone="amber" detail="integration steps" />
                <HeatTile label="Pending Documents" value={data.pendingDocs.length} tone="red" detail="verification exposure" />
                <HeatTile label="Roster Risks" value={data.rosterRisks.length} tone="red" detail="planning conflicts" />
                <HeatTile label="Attendance Issues" value={data.attendanceRisks.length} tone="amber" detail="correction queue" />
              </div>
            </PremiumPanel>

            <PremiumPanel title="Priority Command Stream" subtitle="Escalations, tasks and approvals requiring leadership attention." accent="red">
              {liveQueue.slice(0, 12).map((item: any) => (
                <WorkQueueRow key={`${item.id}-${item.title}`} title={item.title} meta={item.meta} status={item.status || item.stage || 'open'} tone={item.tone} />
              ))}
            </PremiumPanel>

            <PremiumPanel title="Intelligence Timeline" subtitle="Recent HR milestones, KPI signals and leadership events." accent="purple">
              {[...data.timeline.slice(0, 6), ...data.kpis.slice(0, 4)].map((item: any) => (
                <WorkQueueRow
                  key={`${item.id}-${item.title}`}
                  title={item.title || 'Timeline event'}
                  meta={`${item.event_type || item.metric_area || 'HR intelligence'} • ${item.event_at || item.metric_key || ''}`}
                  status={item.severity || item.status || 'active'}
                  tone={item.severity === 'critical' ? 'red' : item.severity === 'warning' ? 'amber' : 'purple'}
                />
              ))}
            </PremiumPanel>
          </div>

          <div style={{ display: 'grid', gap: 20 }}>
            <CommandRail items={commandItems} />

            <PremiumPanel title="Workforce Pulse" subtitle="CEO-level snapshot." accent="green">
              <WorkQueueRow title="Coverage posture" meta={`${data.rosterRisks.length} active roster risks`} status={data.rosterRisks.length ? 'attention' : 'stable'} tone={data.rosterRisks.length ? 'red' : 'green'} href="/hr/rosters/conflicts" />
              <WorkQueueRow title="Compliance posture" meta={`${data.pendingDocs.length} pending document checks`} status={data.pendingDocs.length ? 'review' : 'clear'} tone={data.pendingDocs.length ? 'amber' : 'green'} href="/hr/documents" />
              <WorkQueueRow title="Decision posture" meta={`${data.pendingApprovals.length} approvals waiting`} status={data.pendingApprovals.length ? 'pending' : 'clear'} tone={data.pendingApprovals.length ? 'purple' : 'green'} href="/hr/approvals" />
              <WorkQueueRow title="Hiring posture" meta={`${data.activeOpenings.length} active openings`} status={data.activeOpenings.length ? 'active' : 'calm'} tone="blue" href="/hr/openings" />
            </PremiumPanel>
          </div>
        </div>
      </PremiumShell>
    </AppShell>
  )
}
