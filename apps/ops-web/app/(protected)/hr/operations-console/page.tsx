import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRUXPack1Data } from '@/lib/hr-unified/ux-pack1-data'
import {
  CommandButton,
  HeatTile,
  PremiumHero,
  PremiumPanel,
  PremiumShell,
  PulseMetric,
  SectionTabs,
  WorkQueueRow,
  threeColumn,
} from '../_components/HRPremiumCommandUI'

export default async function HROperationsConsolePremiumPage() {
  const data = await getHRUXPack1Data()

  const interventions = [
    ...data.rosterRisks.slice(0, 8).map((x: any) => ({ ...x, title: x.conflict_type || 'Roster conflict', meta: `${x.severity || 'medium'} • staff ${x.staff_id || '—'}`, tone: 'red' as const, href: '/hr/rosters/conflicts' })),
    ...data.attendanceRisks.slice(0, 8).map((x: any) => ({ ...x, title: x.correction_type || 'Attendance correction', meta: x.reason || 'attendance correction request', tone: 'amber' as const, href: '/hr/attendance/corrections' })),
    ...data.dailyOps.slice(0, 8).map((x: any) => ({ ...x, title: x.title || 'Daily op', meta: `${x.ops_type || 'daily'} • ${x.owner || 'HR'}`, tone: 'blue' as const, href: '/hr/daily-ops' })),
  ]

  return (
    <AppShell
      title="HR Operations Console"
      subtitle="Daily HR command desk"
      breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Operations Console' }]}
      actions={<PageAction href="/hr/quick-actions" variant="light">Quick Actions</PageAction>}
    >
      <PremiumShell>
        <SectionTabs items={[
          { label: 'Daily Ops', href: '/hr/daily-ops' },
          { label: 'Command Queue', href: '/hr/command-queue' },
          { label: 'Risk Center', href: '/hr/risk-center' },
          { label: 'Rosters', href: '/hr/rosters/planner' },
          { label: 'Attendance', href: '/hr/attendance/corrections' },
        ]} />

        <PremiumHero
          eyebrow="Daily Operations War Room"
          title="Daily HR Operations Console"
          subtitle="Run the HR day from a real operational surface: staffing pressure, coverage gaps, SLA exposure, correction queues, urgent replacements, and command interventions."
          stats={[
            { label: 'Roster risks', value: data.rosterRisks.length },
            { label: 'Attendance exceptions', value: data.attendanceRisks.length },
            { label: 'Daily ops', value: data.dailyOps.length },
            { label: 'Escalations', value: ((data as any).escalations || []).length },
          ]}
          actions={
            <>
              <CommandButton href="/hr/daily-ops" tone="blue">Create Daily Op</CommandButton>
              <CommandButton href="/hr/rosters/conflicts" tone="red">Resolve Roster Risk</CommandButton>
              <CommandButton href="/hr/attendance/corrections" tone="amber">Attendance Exceptions</CommandButton>
            </>
          }
        />

        <div style={threeColumn}>
          <PulseMetric label="Shift Coverage Pressure" value={data.rosterRisks.length} detail="active planning conflicts" tone={data.rosterRisks.length ? 'red' : 'green'} progress={Math.min(100, data.rosterRisks.length * 12)} />
          <PulseMetric label="Attendance Control" value={data.attendanceRisks.length} detail="corrections and exceptions" tone={data.attendanceRisks.length ? 'amber' : 'green'} progress={Math.min(100, data.attendanceRisks.length * 10)} />
          <PulseMetric label="SLA Command Queue" value={data.pendingApprovals.length + data.activeTasks.length} detail="tasks and decisions pending" tone="purple" progress={Math.min(100, data.pendingApprovals.length + data.activeTasks.length)} />
          <PulseMetric label="Compliance Exposure" value={data.pendingDocs.length} detail="documents pending verification" tone={data.pendingDocs.length ? 'red' : 'green'} progress={Math.min(100, data.pendingDocs.length * 5)} />
        </div>

        <div style={{ height: 22 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0,1fr) 360px', gap: 20 }}>
          <PremiumPanel title="Staffing Heatmap" subtitle="Operational pressure zones." accent="red">
            <div style={{ display: 'grid', gap: 10 }}>
              <HeatTile label="Coverage Gaps" value={data.rosterRisks.length} tone="red" detail="needs intervention" />
              <HeatTile label="Replacement Queue" value={((data as any).escalations || []).length} tone="amber" detail="open escalations" />
              <HeatTile label="Ready Staff Base" value={data.staff.length} tone="green" detail="available profile pool" />
              <HeatTile label="Onboarding Pending" value={data.onboardingBacklog.length} tone="purple" detail="activation backlog" />
            </div>
          </PremiumPanel>

          <PremiumPanel title="Active Intervention Queue" subtitle="Operational rows designed for action, not passive reading." accent="amber">
            {interventions.slice(0, 16).map((item: any) => (
              <WorkQueueRow key={`${item.id}-${item.title}`} title={item.title} meta={item.meta} status={item.status || item.stage || 'open'} tone={item.tone} href={item.href} />
            ))}
          </PremiumPanel>

          <PremiumPanel title="SLA Control" subtitle="Daily watchlist." accent="purple">
            <WorkQueueRow title="Approvals SLA" meta={`${data.pendingApprovals.length} decisions waiting`} status={data.pendingApprovals.length ? 'pending' : 'clear'} tone={data.pendingApprovals.length ? 'purple' : 'green'} href="/hr/approvals" />
            <WorkQueueRow title="Document SLA" meta={`${data.pendingDocs.length} records to verify`} status={data.pendingDocs.length ? 'review' : 'clear'} tone={data.pendingDocs.length ? 'red' : 'green'} href="/hr/documents" />
            <WorkQueueRow title="Onboarding SLA" meta={`${data.onboardingBacklog.length} integration items`} status={data.onboardingBacklog.length ? 'active' : 'clear'} tone={data.onboardingBacklog.length ? 'amber' : 'green'} href="/hr/onboarding" />
            <WorkQueueRow title="Quality SLA" meta={`${data.qualityRisks.length} quality checks open`} status={data.qualityRisks.length ? 'review' : 'ok'} tone={data.qualityRisks.length ? 'amber' : 'green'} href="/hr/data-quality" />
          </PremiumPanel>
        </div>
      </PremiumShell>
    </AppShell>
  )
}
