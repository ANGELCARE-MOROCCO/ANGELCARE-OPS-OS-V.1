import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRPhase5 } from '@/lib/hr-unified/max-phase5-data'
import { createPlaybookPhase5 } from '@/lib/hr-unified/max-phase5-actions'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric, HRButton, HRInput, HRSelect, HRTextarea, HRSubmit } from '../_components/HRMaxUI'

export default async function Page() {
  const data = await getHRPhase5()
  const rows = data.playbooks
  return <AppShell title="HR Playbooks" subtitle="Operating procedures, SOPs and repeatable HR execution guides." breadcrumbs={[{label:'HR',href:'/hr'},{label:'HR Playbooks'}]} actions={<><PageAction href="/hr">HR Dashboard</PageAction><PageAction href="/hr/control-room" variant="light">Control Room</PageAction></>}>
    <HRHero title="HR Playbooks" subtitle="Operating procedures, SOPs and repeatable HR execution guides." actions={<><HRButton href="/hr/control-room" variant="blue">Control Room</HRButton><HRButton href="/hr/search" variant="light">Search</HRButton></>} />
    <HRGrid min={210}>{data.metrics.slice(0,4).map((m:any)=><HRMetric key={m.label} {...m} />)}</HRGrid>
    <div style={{height:22}} />
    <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 420px',gap:20}}>
      <HRPanel title="Operational records" subtitle="Phase 5 command expansion records.">
        {rows.slice(0,70).map((x:any,i:number)=><HRRow key={x.id || i} title={x.title} meta={`${x.category || 'general'} • owner ${x.owner || 'HR'}`} status={x.status || x.stage || 'active'} />)}
      </HRPanel>
      <HRPanel title="Create / configure" subtitle="Actionable Phase 5 form.">
        <form action={createPlaybookPhase5} style={{display:'grid',gap:12}}>
          <HRInput name="title" label="Playbook title" required />
          <HRSelect name="category" label="Category" options={['recruitment','onboarding','attendance','roster','documents','performance','compliance','general']} />
          <HRInput name="owner" label="Owner" />
          <HRSelect name="priority" label="Priority" options={['low','medium','high','urgent']} />
          <HRTextarea name="summary" label="Summary" />
          <HRTextarea name="steps" label="Steps" />
          <HRTextarea name="notes" label="Notes" />
          <HRSubmit>Create playbook</HRSubmit>
        </form>
      </HRPanel>
    </div>
  </AppShell>
}
