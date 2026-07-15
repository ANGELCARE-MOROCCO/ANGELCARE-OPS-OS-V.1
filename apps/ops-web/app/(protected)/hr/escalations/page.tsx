import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRPhase5 } from '@/lib/hr-unified/max-phase5-data'
import { createEscalationPhase5 } from '@/lib/hr-unified/max-phase5-actions'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric, HRButton, HRInput, HRSelect, HRTextarea, HRSubmit } from '../_components/HRMaxUI'

export default async function Page() {
  const data = await getHRPhase5()
  const rows = data.escalations
  return <AppShell title="HR Escalations" subtitle="Critical HR issue tracking and resolution command." breadcrumbs={[{label:'HR',href:'/hr'},{label:'HR Escalations'}]} actions={<><PageAction href="/hr">HR Dashboard</PageAction><PageAction href="/hr/control-room" variant="light">Control Room</PageAction></>}>
    <HRHero title="HR Escalations" subtitle="Critical HR issue tracking and resolution command." actions={<><HRButton href="/hr/control-room" variant="blue">Control Room</HRButton><HRButton href="/hr/search" variant="light">Search</HRButton></>} />
    <HRGrid min={210}>{data.metrics.slice(0,4).map((m:any)=><HRMetric key={m.label} {...m} />)}</HRGrid>
    <div style={{height:22}} />
    <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 420px',gap:20}}>
      <HRPanel title="Operational records" subtitle="Phase 5 command expansion records.">
        {rows.slice(0,70).map((x:any,i:number)=><HRRow key={x.id || i} title={x.title} meta={`${x.escalation_type || 'operational'} • ${x.severity || 'medium'} • ${x.owner || 'HR'}`} status={x.status || x.stage || 'active'} />)}
      </HRPanel>
      <HRPanel title="Create / configure" subtitle="Actionable Phase 5 form.">
        <form action={createEscalationPhase5} style={{display:'grid',gap:12}}>
          <HRInput name="title" label="Escalation title" required />
          <HRSelect name="escalation_type" label="Type" options={['operational','recruitment','attendance','roster','documents','performance','compliance']} />
          <HRSelect name="severity" label="Severity" options={['low','medium','high','critical']} />
          <HRInput name="owner" label="Owner" />
          <HRTextarea name="issue" label="Issue" />
          <HRTextarea name="resolution_plan" label="Resolution plan" />
          <HRTextarea name="notes" label="Notes" />
          <HRSubmit>Create escalation</HRSubmit>
        </form>
      </HRPanel>
    </div>
  </AppShell>
}
