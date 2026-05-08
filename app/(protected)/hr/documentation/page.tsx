import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRPhase13Data } from '@/lib/hr-unified/max-phase13-data'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric } from '../_components/HRMaxUI'

export default async function HRDocumentationPage() {
  const data = await getHRPhase13Data()

  return (
    <AppShell title="HR Documentation Hub" subtitle="Operating documentation and module guides." breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Documentation' }]} actions={<PageAction href="/hr/launch-center" variant="light">Launch Center</PageAction>}>
      <HRHero title="HR Documentation Hub" subtitle="Documentation references for HR MAX modules, operator routines, dashboards and deployment validation." />
      <HRGrid min={210}>{data.metrics.slice(2, 5).map((m: any) => <HRMetric key={m.label} {...m} />)}</HRGrid>
      <div style={{ height: 22 }} />
      <HRPanel title="Documentation items" subtitle="Operating docs and launch references.">
        {data.docs.map((item: any) => (
          <HRRow key={item.id} title={item.title} meta={`${item.doc_type || 'guide'} • ${item.route || '/hr'} • ${item.owner || 'HR'}`} status={item.status || 'active'} href={item.route || '/hr'} />
        ))}
      </HRPanel>
    </AppShell>
  )
}
