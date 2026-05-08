import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRPhase11Data } from '@/lib/hr-unified/max-phase11-data'
import { createHRKPIDrilldownPhase11 } from '@/lib/hr-unified/max-phase11-actions'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric, HRInput, HRSelect, HRTextarea, HRSubmit } from '../_components/HRMaxUI'

export default async function HRKPIDrilldownsPage() {
  const data = await getHRPhase11Data()

  return (
    <AppShell title="HR KPI Drilldowns" subtitle="KPI insight and action plans." breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'KPI Drilldowns' }]} actions={<PageAction href="/hr/enterprise-dashboard" variant="light">Enterprise</PageAction>}>
      <HRHero title="KPI Drilldowns" subtitle="Create management KPI drilldowns with target values, insights and action plans." />
      <HRGrid min={210}>{data.metrics.slice(0, 4).map((m: any) => <HRMetric key={m.label} {...m} />)}</HRGrid>
      <div style={{ height: 22 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 430px', gap: 20 }}>
        <HRPanel title="KPI records" subtitle="Management indicators and action plans.">
          {data.kpis.map((kpi: any) => (
            <HRRow key={kpi.id} title={kpi.title} meta={`${kpi.metric_area || 'operations'} • ${kpi.current_value || 0}/${kpi.target_value || 0} • ${kpi.metric_key || ''}`} status={kpi.status || 'active'} />
          ))}
        </HRPanel>
        <HRPanel title="Create KPI drilldown" subtitle="Add a KPI insight and action plan.">
          <form action={createHRKPIDrilldownPhase11} style={{ display: 'grid', gap: 12 }}>
            <HRInput name="title" label="Title" required />
            <HRInput name="metric_key" label="Metric key" required />
            <HRSelect name="metric_area" label="Area" options={['recruitment', 'staff', 'attendance', 'rosters', 'compliance', 'operations', 'finance']} />
            <HRInput name="current_value" label="Current value" type="number" />
            <HRInput name="target_value" label="Target value" type="number" />
            <HRTextarea name="insight" label="Insight" />
            <HRTextarea name="action_plan" label="Action plan" />
            <HRSubmit>Create KPI</HRSubmit>
          </form>
        </HRPanel>
      </div>
    </AppShell>
  )
}
