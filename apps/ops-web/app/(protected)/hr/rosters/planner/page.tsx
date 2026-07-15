import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRRestoreLists } from '@/lib/hr-unified/route-restore-data'
import { createRosterRestore } from '@/lib/hr-unified/route-restore-actions'
import { HRHero, HRPanel, HRRow, HRInput, HRSelect, HRTextarea, HRSubmit } from '../../_components/HRMaxUI'

export default async function PlannerPage() {
  const data = await getHRRestoreLists()
  return <AppShell title="Roster Planner" subtitle="Restored roster creation page." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Rosters',href:'/hr/rosters'},{label:'Planner'}]} actions={<PageAction href="/hr/rosters" variant="light">Rosters</PageAction>}>
    <HRHero title="Roster Planner" subtitle="Operational shift creation and planning control." />
    <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 420px',gap:20}}>
      <HRPanel title="Roster records" subtitle="Recent planning records.">
        {data.rosters.slice(0,50).map((x:any)=><HRRow key={x.id} title={x.staff_name || x.role || 'Roster'} meta={`${x.shift_date || 'no date'} • ${x.start_time || ''}-${x.end_time || ''}`} status={x.status || x.stage}/>)}
      </HRPanel>
      <HRPanel title="Create roster" subtitle="Add planning record.">
        <form action={createRosterRestore} style={{display:'grid',gap:12}}>
          <HRInput name="staff_id" label="Staff ID optional" />
          <HRInput name="staff_name" label="Staff name" />
          <HRInput name="shift_date" label="Shift date" type="date" />
          <HRInput name="start_time" label="Start time" />
          <HRInput name="end_time" label="End time" />
          <HRInput name="area" label="Area" />
          <HRInput name="role" label="Role" />
          <HRSelect name="status" label="Status" options={['planned','confirmed','in_progress','completed','cancelled']} />
          <HRTextarea name="notes" label="Notes" />
          <HRSubmit>Create roster</HRSubmit>
        </form>
      </HRPanel>
    </div>
  </AppShell>
}
