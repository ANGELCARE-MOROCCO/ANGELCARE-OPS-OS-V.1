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
  twoColumn,
} from '../_components/HRPremiumCommandUI'

export default async function HRBoardroomPremiumPage() {
  const data = await getHRUXPack1Data()

  const stabilityIndex = Math.max(0, 100 - (data.rosterRisks.length * 6 + data.attendanceRisks.length * 4 + data.pendingDocs.length * 2))
  const recruitmentEfficiency = Math.max(0, Math.min(100, 100 - data.activeOpenings.length * 4 + data.activeCandidates.length))
  const complianceReadiness = Math.max(0, 100 - data.pendingDocs.length * 3)

  const boardAgenda = [
    ...data.kpis.slice(0, 6).map((x: any) => ({ ...x, title: x.title || 'KPI', meta: `${x.metric_area || 'HR'} • ${x.current_value || 0}/${x.target_value || 0}`, tone: 'blue' as const })),
    ...data.qualityRisks.slice(0, 5).map((x: any) => ({ ...x, title: x.title || 'Quality risk', meta: `${x.check_type || 'quality'} • ${x.severity || 'medium'}`, tone: 'amber' as const })),
    ...((data as any).escalations || []).slice(0, 5).map((x: any) => ({ ...x, title: x.title || 'Escalation', meta: `${x.escalation_type || 'risk'} • ${x.severity || 'medium'}`, tone: 'red' as const })),
  ]

  return (
    <AppShell
      title="HR Boardroom"
      subtitle="CEO / COO / HR Director cockpit"
      breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Boardroom' }]}
      actions={<PageAction href="/hr/enterprise-dashboard" variant="light">Enterprise Dashboard</PageAction>}
    >
      <PremiumShell>
        <SectionTabs items={[
          { label: 'Enterprise Dashboard', href: '/hr/enterprise-dashboard' },
          { label: 'KPI Drilldowns', href: '/hr/kpi-drilldowns' },
          { label: 'Executive Automation', href: '/hr/executive-automation' },
          { label: 'Risk Center', href: '/hr/risk-center' },
          { label: 'Final QA', href: '/hr/final-qa' },
        ]} />

        <PremiumHero
          eyebrow="Executive Boardroom Intelligence"
          title="HR Boardroom — Strategic Workforce Cockpit"
          subtitle="A leadership-grade surface for workforce stability, recruitment efficiency, compliance readiness, operating risks, decision backlog, and strategic HR pressure."
          stats={[
            { label: 'Stability index', value: `${stabilityIndex}%` },
            { label: 'Recruitment efficiency', value: `${recruitmentEfficiency}%` },
            { label: 'Compliance readiness', value: `${complianceReadiness}%` },
            { label: 'Board agenda', value: boardAgenda.length },
          ]}
          actions={
            <>
              <CommandButton href="/hr/kpi-drilldowns" tone="blue">KPI Drilldowns</CommandButton>
              <CommandButton href="/hr/risk-center" tone="red">Risk Center</CommandButton>
              <CommandButton href="/hr/approvals" tone="purple">Decision Queue</CommandButton>
            </>
          }
        />

        <div style={threeColumn}>
          <PulseMetric label="Workforce Stability Index" value={`${stabilityIndex}%`} detail="risk-adjusted operational score" tone={stabilityIndex < 70 ? 'red' : stabilityIndex < 86 ? 'amber' : 'green'} progress={stabilityIndex} />
          <PulseMetric label="Recruitment Efficiency" value={`${recruitmentEfficiency}%`} detail="pipeline strength vs open roles" tone={recruitmentEfficiency < 70 ? 'red' : 'blue'} progress={recruitmentEfficiency} />
          <PulseMetric label="Compliance Readiness" value={`${complianceReadiness}%`} detail="document readiness index" tone={complianceReadiness < 80 ? 'red' : 'green'} progress={complianceReadiness} />
          <PulseMetric label="Decision Load" value={data.pendingApprovals.length} detail="approvals awaiting leadership" tone={data.pendingApprovals.length ? 'purple' : 'green'} progress={Math.min(100, data.pendingApprovals.length * 8)} />
        </div>

        <div style={{ height: 22 }} />

        <div style={twoColumn}>
          <div style={{ display: 'grid', gap: 20 }}>
            <PremiumPanel title="Boardroom Agenda" subtitle="KPIs, risks and decisions for executive review." accent="purple">
              {boardAgenda.slice(0, 14).map((item: any) => (
                <WorkQueueRow key={`${item.id}-${item.title}`} title={item.title} meta={item.meta} status={item.status || item.severity || 'review'} tone={item.tone} />
              ))}
            </PremiumPanel>

            <PremiumPanel title="Executive Scenario Center" subtitle="Frontend strategic simulation blocks." accent="blue">
              <div style={threeColumn}>
                <HeatTile label="If roster risk continues" value="High" tone={data.rosterRisks.length ? 'red' : 'green'} detail="operational pressure projection" />
                <HeatTile label="If hiring improves" value="+12%" tone="green" detail="projected staffing stabilization" />
                <HeatTile label="If docs stay pending" value="Risk" tone={data.pendingDocs.length ? 'amber' : 'green'} detail="compliance exposure projection" />
              </div>
            </PremiumPanel>
          </div>

          <div style={{ display: 'grid', gap: 20 }}>
            <PremiumPanel title="Strategic Pressure" subtitle="Leadership control indicators." accent="red">
              <WorkQueueRow title="Budget pressure proxy" meta={`${data.activeOpenings.length} open roles creating hiring cost pressure`} status={data.activeOpenings.length ? 'active' : 'low'} tone={data.activeOpenings.length ? 'amber' : 'green'} />
              <WorkQueueRow title="Operational bottleneck" meta={`${data.activeTasks.length} execution tasks open`} status={data.activeTasks.length ? 'active' : 'clear'} tone={data.activeTasks.length ? 'blue' : 'green'} />
              <WorkQueueRow title="Regional pressure proxy" meta={`${data.rosterRisks.length} roster conflicts`} status={data.rosterRisks.length ? 'risk' : 'stable'} tone={data.rosterRisks.length ? 'red' : 'green'} />
              <WorkQueueRow title="Training deficit proxy" meta={`${data.onboardingBacklog.length} onboarding backlog`} status={data.onboardingBacklog.length ? 'review' : 'stable'} tone={data.onboardingBacklog.length ? 'amber' : 'green'} />
            </PremiumPanel>

            <PremiumPanel title="Leadership Feed" subtitle="Recent executive-relevant events." accent="slate">
              {data.timeline.slice(0, 8).map((item: any) => (
                <WorkQueueRow key={item.id} title={item.title || 'Timeline event'} meta={`${item.event_type || 'event'} • ${item.event_at || item.created_at || ''}`} status={item.severity || item.status || 'active'} tone={item.severity === 'critical' ? 'red' : 'slate'} />
              ))}
            </PremiumPanel>
          </div>
        </div>
      </PremiumShell>
    </AppShell>
  )
}
