import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRPhase13Data } from '@/lib/hr-unified/max-phase13-data'
import { createHRAdoptionItemPhase13 } from '@/lib/hr-unified/max-phase13-actions'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric, HRInput, HRSelect, HRTextarea, HRSubmit } from '../_components/HRMaxUI'

export default async function HRAdoptionTrackerPage() {
  const data = await getHRPhase13Data()

  return (
    <AppShell title="HR Adoption Tracker" subtitle="Operator adoption and rollout tracking." breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Adoption Tracker' }]} actions={<PageAction href="/hr/launch-center" variant="light">Launch Center</PageAction>}>
      <HRHero title="HR Adoption Tracker" subtitle="Track HR team adoption, rollout stages, usage expectations and success metrics." />
      <HRGrid min={210}>{data.metrics.slice(1, 5).map((m: any) => <HRMetric key={m.label} {...m} />)}</HRGrid>
      <div style={{ height: 22 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 420px', gap: 20 }}>
        <HRPanel title="Adoption queue" subtitle="Rollout and usage adoption records.">
          {data.adoption.map((item: any) => (
            <HRRow key={item.id} title={item.title} meta={`${item.audience || 'hr'} • ${item.adoption_stage || 'planned'} • ${item.success_metric || 'no metric'}`} status={item.status || 'open'} />
          ))}
        </HRPanel>
        <HRPanel title="Create adoption item" subtitle="Add rollout/adoption tracking.">
          <form action={createHRAdoptionItemPhase13} style={{ display: 'grid', gap: 12 }}>
            <HRInput name="title" label="Title" required />
            <HRSelect name="audience" label="Audience" options={['hr_admin', 'hr_ops', 'managers', 'executive', 'caregiver_ops']} />
            <HRSelect name="adoption_stage" label="Stage" options={['planned', 'training', 'pilot', 'active', 'optimized']} />
            <HRInput name="success_metric" label="Success metric" />
            <HRTextarea name="notes" label="Notes" />
            <HRSubmit>Create adoption item</HRSubmit>
          </form>
        </HRPanel>
      </div>
    </AppShell>
  )
}
