import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRPhase5 } from '@/lib/hr-unified/max-phase5-data'
import { createCalendarEventPhase5 } from '@/lib/hr-unified/max-phase5-actions'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric, HRButton, HRInput, HRSelect, HRTextarea, HRSubmit } from '../_components/HRMaxUI'

export default async function Page() {
  const data = await getHRPhase5()
  const rows = data.calendar
  return <AppShell title="HR Calendar" subtitle="Planning calendar for interviews, onboarding, reviews and HR events." breadcrumbs={[{label:'HR',href:'/hr'},{label:'HR Calendar'}]} actions={<><PageAction href="/hr">HR Dashboard</PageAction><PageAction href="/hr/control-room" variant="light">Control Room</PageAction></>}>
    <HRHero title="HR Calendar" subtitle="Planning calendar for interviews, onboarding, reviews and HR events." actions={<><HRButton href="/hr/control-room" variant="blue">Control Room</HRButton><HRButton href="/hr/search" variant="light">Search</HRButton></>} />
    <HRGrid min={210}>{data.metrics.slice(0,4).map((m:any)=><HRMetric key={m.label} {...m} />)}</HRGrid>
    <div style={{height:22}} />
    <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 420px',gap:20}}>
      <HRPanel title="Operational records" subtitle="Phase 5 command expansion records.">
        {rows.slice(0,70).map((x:any,i:number)=><HRRow key={x.id || i} title={x.title} meta={`${x.event_type || 'event'} • ${x.event_at || 'no date'} • ${x.owner || 'HR'}`} status={x.status || x.stage || 'active'} />)}
      </HRPanel>
      <HRPanel title="Create / configure" subtitle="Actionable Phase 5 form.">
        <form action={createCalendarEventPhase5} style={{display:'grid',gap:12}}>
          <HRInput name="title" label="Event title" required />
          <HRSelect name="event_type" label="Type" options={['interview','onboarding','training','review','payroll','compliance','hr_event']} />
          <HRInput name="event_at" label="Event date/time" type="datetime-local" />
          <HRInput name="owner" label="Owner" />
          <HRInput name="location" label="Location" />
          <HRTextarea name="notes" label="Notes" />
          <HRSubmit>Create event</HRSubmit>
        </form>
      </HRPanel>
    </div>
  </AppShell>
}
