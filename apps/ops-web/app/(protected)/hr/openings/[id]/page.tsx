import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRRecord } from '@/lib/hr-unified/route-restore-data'
import { updateRestore } from '@/lib/hr-unified/route-restore-actions'
import { HRHero, HRPanel, HRInput, HRSelect, HRTextarea, HRSubmit } from '../../_components/HRMaxUI'

export default async function DetailPage({ params }: any) {
  const row = await getHRRecord('hr_job_openings', params.id)
  if (!row) return <AppShell title="Not found" subtitle="Missing record." breadcrumbs={[{label:'HR',href:'/hr'}]}><div>Not found.</div></AppShell>
  return <AppShell title={row.title || 'Record'} subtitle="Restored operational detail page." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Openings',href:'/hr/openings'},{label:row.title || 'Record'}]} actions={<PageAction href="/hr/openings" variant="light">Back</PageAction>}>
    <HRHero title={row.title || 'Record'} subtitle={`Status: ${row.status || 'active'} • Stage: ${row.stage || 'active'}`} />
    <HRPanel title="Edit main status" subtitle="Safe quick update.">
      <form action={updateRestore} style={{display:'grid',gap:12}}>
        <input type="hidden" name="table" value="hr_job_openings" />
        <input type="hidden" name="id" value={row.id} />
        <input type="hidden" name="returnPath" value="/hr/openings" />
        <HRSelect name="status" label="Status" defaultValue={row.status || 'active'} options={['active','open','pending','planned','completed','paused','closed','cancelled','rejected']} />
        <HRSelect name="stage" label="Stage" defaultValue={row.stage || 'active'} options={['active','open','new','screening','interview','trial','offer','hired','pending','planned','completed','closed']} />
        <HRTextarea name="notes" label="Notes" defaultValue={row.notes || ''} />
        <HRSubmit>Save status</HRSubmit>
      </form>
    </HRPanel>
  </AppShell>
}
