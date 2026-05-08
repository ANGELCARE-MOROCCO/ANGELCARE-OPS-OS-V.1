import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRPhase11Data } from '@/lib/hr-unified/max-phase11-data'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric, HRButton } from '../_components/HRMaxUI'

export default async function HRBoardroomPage() {
  const data = await getHRPhase11Data()
  const boardItems = [
    ...data.kpis.slice(0, 6),
    ...data.risks.slice(0, 6),
    ...data.approvals.slice(0, 6),
  ]

  return (
    <AppShell title="HR Boardroom" subtitle="Board-level HR control surface." breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Boardroom' }]} actions={<PageAction href="/hr/enterprise-dashboard" variant="light">Enterprise</PageAction>}>
      <HRHero
        title="HR Boardroom"
        subtitle="A board-level operating surface for leadership: KPIs, decisions, risks, workforce pressure and strategic action."
        actions={<><HRButton href="/hr/kpi-drilldowns" variant="blue">KPI Drilldowns</HRButton><HRButton href="/hr/risk-center" variant="light">Risk Center</HRButton><HRButton href="/hr/approvals" variant="light">Approvals</HRButton></>}
      />
      <HRGrid min={210}>{data.metrics.map((m: any) => <HRMetric key={m.label} {...m} />)}</HRGrid>
      <div style={{ height: 22 }} />
      <HRPanel title="Boardroom agenda" subtitle="KPIs, risks and decisions for executive review.">
        {boardItems.map((item: any) => (
          <HRRow
            key={`${item.id}-${item.title}`}
            title={item.title || 'Board item'}
            meta={`${item.metric_area || item.check_type || item.approval_type || 'HR'} • ${item.priority || item.severity || 'medium'}`}
            status={item.status || 'review'}
          />
        ))}
      </HRPanel>
    </AppShell>
  )
}
