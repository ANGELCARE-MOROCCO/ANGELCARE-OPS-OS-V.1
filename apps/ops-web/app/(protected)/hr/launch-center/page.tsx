import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRPhase13Data } from '@/lib/hr-unified/max-phase13-data'
import { createHRLaunchCheckPhase13, updateHRLaunchCheckPhase13 } from '@/lib/hr-unified/max-phase13-actions'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric, HRInput, HRSelect, HRTextarea, HRSubmit, HRButton } from '../_components/HRMaxUI'

export default async function HRLaunchCenterPage() {
  const data = await getHRPhase13Data()

  return (
    <AppShell title="HR Launch Center" subtitle="Post-final launch readiness and adoption control." breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Launch Center' }]} actions={<PageAction href="/hr/final-qa" variant="light">Final QA</PageAction>}>
      <HRHero title="HR MAX Launch Center" subtitle="Phase 13 launch polish: production launch checks, adoption readiness, documentation and operator training." actions={<><HRButton href="/hr/adoption-tracker" variant="blue">Adoption Tracker</HRButton><HRButton href="/hr/documentation" variant="light">Documentation</HRButton><HRButton href="/hr/operator-training" variant="light">Training</HRButton></>} />
      <HRGrid min={210}>{data.metrics.map((m: any) => <HRMetric key={m.label} {...m} />)}</HRGrid>
      <div style={{ height: 22 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 420px', gap: 20 }}>
        <HRPanel title="Launch checklist" subtitle="Validate launch readiness item by item.">
          {data.launch.map((item: any) => (
            <div key={item.id} style={{ borderBottom: '1px solid #f1f5f9', padding: '12px 0' }}>
              <HRRow title={item.title} meta={`${item.area || 'general'} • ${item.owner || 'HR'} • ${item.priority || 'medium'}`} status={item.status || 'open'} />
              <form action={updateHRLaunchCheckPhase13} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input type="hidden" name="id" value={item.id} />
                <select name="status" defaultValue={item.status || 'open'} style={{ height: 34, borderRadius: 10, border: '1px solid #cbd5e1', fontWeight: 800 }}>
                  {['open', 'in_progress', 'ready', 'completed', 'blocked'].map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <HRSubmit>Update</HRSubmit>
              </form>
            </div>
          ))}
        </HRPanel>
        <HRPanel title="Create launch check" subtitle="Add a final launch validation item.">
          <form action={createHRLaunchCheckPhase13} style={{ display: 'grid', gap: 12 }}>
            <HRInput name="title" label="Title" required />
            <HRSelect name="area" label="Area" options={['routes', 'build', 'sql', 'ux', 'training', 'permissions', 'deployment']} />
            <HRSelect name="priority" label="Priority" options={['low', 'medium', 'high', 'critical']} />
            <HRInput name="owner" label="Owner" />
            <HRTextarea name="evidence" label="Evidence" />
            <HRTextarea name="notes" label="Notes" />
            <HRSubmit>Create launch check</HRSubmit>
          </form>
        </HRPanel>
      </div>
    </AppShell>
  )
}
