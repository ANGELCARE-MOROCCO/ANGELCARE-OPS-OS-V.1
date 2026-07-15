import AppShell from '@/app/components/erp/AppShell'
import { getHRPhase8Data } from '@/lib/hr-unified/max-phase8-data'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric } from '../_components/HRMaxUI'

export default async function SLACenterPage() {
  const data = await getHRPhase8Data()

  return (
    <AppShell title="HR SLA Center" subtitle="SLA tracking and breach monitoring." breadcrumbs={[{label:'HR',href:'/hr'},{label:'SLA Center'}]}>
      <HRHero title="HR SLA Center" subtitle="Track operational SLA delays, escalations and response pressure." />
      <HRGrid min={210}>{data.metrics.map((m:any)=><HRMetric key={m.label} {...m} />)}</HRGrid>
      <div style={{height:22}} />
      <HRPanel title="SLA tracking" subtitle="Healthy, warning and breached SLAs.">
        {data.sla.map((x:any)=><HRRow key={x.id} title={x.title || 'SLA item'} meta={`${x.sla_type || 'general'} • due ${x.due_at || 'n/a'}`} status={x.status || 'healthy'} />)}
      </HRPanel>
    </AppShell>
  )
}
