import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRPhase5 } from '@/lib/hr-unified/max-phase5-data'
import { createTemplatePhase5 } from '@/lib/hr-unified/max-phase5-actions'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric, HRButton, HRInput, HRSelect, HRTextarea, HRSubmit } from '../_components/HRMaxUI'

export default async function Page() {
  const data = await getHRPhase5()
  const rows = data.templates
  return <AppShell title="HR Templates" subtitle="Reusable messages, checklists and forms for HR operations." breadcrumbs={[{label:'HR',href:'/hr'},{label:'HR Templates'}]} actions={<><PageAction href="/hr">HR Dashboard</PageAction><PageAction href="/hr/control-room" variant="light">Control Room</PageAction></>}>
    <HRHero title="HR Templates" subtitle="Reusable messages, checklists and forms for HR operations." actions={<><HRButton href="/hr/control-room" variant="blue">Control Room</HRButton><HRButton href="/hr/search" variant="light">Search</HRButton></>} />
    <HRGrid min={210}>{data.metrics.slice(0,4).map((m:any)=><HRMetric key={m.label} {...m} />)}</HRGrid>
    <div style={{height:22}} />
    <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 420px',gap:20}}>
      <HRPanel title="Operational records" subtitle="Phase 5 command expansion records.">
        {rows.slice(0,70).map((x:any,i:number)=><HRRow key={x.id || i} title={x.title} meta={`${x.template_type || 'template'} • ${x.audience || 'hr'}`} status={x.status || x.stage || 'active'} />)}
      </HRPanel>
      <HRPanel title="Create / configure" subtitle="Actionable Phase 5 form.">
        <form action={createTemplatePhase5} style={{display:'grid',gap:12}}>
          <HRInput name="title" label="Template title" required />
          <HRSelect name="template_type" label="Type" options={['message','email','whatsapp','checklist','form','policy','contract_note']} />
          <HRSelect name="audience" label="Audience" options={['hr','candidates','staff','caregivers','managers','families']} />
          <HRTextarea name="body" label="Template body" />
          <HRTextarea name="notes" label="Notes" />
          <HRSubmit>Create template</HRSubmit>
        </form>
      </HRPanel>
    </div>
  </AppShell>
}
