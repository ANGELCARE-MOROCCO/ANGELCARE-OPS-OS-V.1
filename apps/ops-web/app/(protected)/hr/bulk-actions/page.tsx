import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRPhase5 } from '@/lib/hr-unified/max-phase5-data'
import { createBulkActionPhase5 } from '@/lib/hr-unified/max-phase5-actions'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric, HRButton, HRInput, HRSelect, HRTextarea, HRSubmit } from '../_components/HRMaxUI'

export default async function Page() {
  const data = await getHRPhase5()
  const rows = data.bulkActions
  return <AppShell title="HR Bulk Actions" subtitle="Batch execution queue for grouped HR operations." breadcrumbs={[{label:'HR',href:'/hr'},{label:'HR Bulk Actions'}]} actions={<><PageAction href="/hr">HR Dashboard</PageAction><PageAction href="/hr/control-room" variant="light">Control Room</PageAction></>}>
    <HRHero title="HR Bulk Actions" subtitle="Batch execution queue for grouped HR operations." actions={<><HRButton href="/hr/control-room" variant="blue">Control Room</HRButton><HRButton href="/hr/search" variant="light">Search</HRButton></>} />
    <HRGrid min={210}>{data.metrics.slice(0,4).map((m:any)=><HRMetric key={m.label} {...m} />)}</HRGrid>
    <div style={{height:22}} />
    <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 420px',gap:20}}>
      <HRPanel title="Operational records" subtitle="Phase 5 command expansion records.">
        {rows.slice(0,70).map((x:any,i:number)=><HRRow key={x.id || i} title={x.title} meta={`${x.action_type || 'action'} • ${x.target_area || 'hr'} • ${x.priority || 'medium'}`} status={x.status || x.stage || 'active'} />)}
      </HRPanel>
      <HRPanel title="Create / configure" subtitle="Actionable Phase 5 form.">
        <form action={createBulkActionPhase5} style={{display:'grid',gap:12}}>
          <HRInput name="title" label="Bulk action title" required />
          <HRSelect name="action_type" label="Action type" options={['review','update_status','request_documents','schedule_interviews','assign_tasks','audit_records','notify_people']} />
          <HRSelect name="target_area" label="Target area" options={['staff','candidates','openings','documents','attendance','rosters','onboarding']} />
          <HRSelect name="priority" label="Priority" options={['low','medium','high','urgent']} />
          <HRTextarea name="criteria" label="Criteria" />
          <HRTextarea name="notes" label="Notes" />
          <HRSubmit>Create bulk action</HRSubmit>
        </form>
      </HRPanel>
    </div>
  </AppShell>
}
