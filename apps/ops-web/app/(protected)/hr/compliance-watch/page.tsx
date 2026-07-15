import AppShell from '@/app/components/erp/AppShell'
import { getHRPhase8Data } from '@/lib/hr-unified/max-phase8-data'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric } from '../_components/HRMaxUI'

export default async function ComplianceWatchPage() {
  const data = await getHRPhase8Data()

  return (
    <AppShell title="Compliance Watch" subtitle="Compliance surveillance and risks." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Compliance Watch'}]}>
      <HRHero title="Compliance Watch" subtitle="Monitor expiring, missing or risky compliance elements." />
      <HRGrid min={210}>{data.metrics.slice(1,5).map((m:any)=><HRMetric key={m.label} {...m} />)}</HRGrid>
      <div style={{height:22}} />
      <HRPanel title="Compliance risks" subtitle="Open compliance watch records.">
        {data.compliance.map((x:any)=><HRRow key={x.id} title={x.title || 'Compliance issue'} meta={`${x.risk_type || 'general'} • ${x.owner || 'HR'}`} status={x.status || 'open'} />)}
      </HRPanel>
    </AppShell>
  )
}
