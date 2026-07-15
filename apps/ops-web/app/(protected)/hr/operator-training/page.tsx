import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRPhase13Data } from '@/lib/hr-unified/max-phase13-data'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric } from '../_components/HRMaxUI'

export default async function HROperatorTrainingPage() {
  const data = await getHRPhase13Data()

  return (
    <AppShell title="HR Operator Training" subtitle="Training checklist for HR MAX operators." breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Operator Training' }]} actions={<PageAction href="/hr/launch-center" variant="light">Launch Center</PageAction>}>
      <HRHero title="HR Operator Training" subtitle="Training map for HR users: recruitment, staff, rosters, attendance, approvals, sync center and final QA." />
      <HRGrid min={210}>{data.metrics.map((m: any) => <HRMetric key={m.label} {...m} />)}</HRGrid>
      <div style={{ height: 22 }} />
      <HRPanel title="Training items" subtitle="Operator enablement checklist.">
        {data.training.map((item: any) => (
          <HRRow key={item.id} title={item.title} meta={`${item.training_type || 'module'} • ${item.audience || 'hr'} • ${item.route || '/hr'}`} status={item.status || 'pending'} href={item.route || '/hr'} />
        ))}
      </HRPanel>
    </AppShell>
  )
}
