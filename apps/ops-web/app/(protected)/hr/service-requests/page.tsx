import AppShell from '@/app/components/erp/AppShell'
import { getHRPhase8Data } from '@/lib/hr-unified/max-phase8-data'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric } from '../_components/HRMaxUI'

export default async function ServiceRequestsPage() {
  const data = await getHRPhase8Data()

  return (
    <AppShell title="HR Service Requests" subtitle="Unified HR internal request center." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Service Requests'}]}>
      <HRHero title="HR Service Requests" subtitle="Track HR internal support, staffing, payroll and operational requests." />
      <HRGrid min={210}>{data.metrics.slice(0,4).map((m:any)=><HRMetric key={m.label} {...m} />)}</HRGrid>
      <div style={{height:22}} />
      <HRPanel title="Request queue" subtitle="Operational service requests.">
        {data.requests.map((x:any)=><HRRow key={x.id} title={x.title || 'Request'} meta={`${x.request_type || 'general'} • ${x.owner || 'HR'}`} status={x.status || 'open'} />)}
      </HRPanel>
    </AppShell>
  )
}
