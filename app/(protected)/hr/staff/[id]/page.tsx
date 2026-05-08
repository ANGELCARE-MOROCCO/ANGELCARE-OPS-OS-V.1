import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getStaffRestore } from '@/lib/hr-unified/route-restore-data'
import { HRHero, HRButton, HRPanel, HRRow, HRGrid, HRMetric } from '../../_components/HRMaxUI'

export default async function StaffPage({ params }: any) {
  const data = await getStaffRestore(params.id)
  const staff = data.staff
  if (!staff) return <AppShell title="Staff not found" subtitle="Missing staff." breadcrumbs={[{label:'HR',href:'/hr'}]}><div>Staff not found.</div></AppShell>
  const metrics = [
    {label:'Documents',value:data.docs.length,detail:'Staff files',tone:'#2563eb'},
    {label:'Attendance',value:data.attendance.length,detail:'Attendance records',tone:'#0891b2'},
    {label:'Reviews',value:data.reviews.length,detail:'Performance reviews',tone:'#7c3aed'},
    {label:'Rosters',value:data.rosters.length,detail:'Planning records',tone:'#059669'},
  ]
  return <AppShell title={staff.full_name || staff.name || 'Staff'} subtitle="Staff 360 restored page." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Staff',href:'/hr/staff'},{label:staff.full_name || 'Staff'}]} actions={<PageAction href="/hr/staff" variant="light">Back</PageAction>}>
    <HRHero title={staff.full_name || staff.name || 'Staff'} subtitle={`${staff.department || 'Department'} • ${staff.position || staff.job_title || 'Position'} • ${staff.status || 'active'}`} actions={<><HRButton href={`/hr/staff/${staff.id}/documents`} variant="light">Documents</HRButton><HRButton href={`/hr/staff/${staff.id}/attendance`} variant="light">Attendance</HRButton><HRButton href={`/hr/staff/${staff.id}/performance`} variant="blue">Performance</HRButton><HRButton href={`/hr/staff/${staff.id}/roster`} variant="light">Roster</HRButton></>} />
    <HRGrid min={210}>{metrics.map((m:any)=><HRMetric key={m.label} {...m}/>)}</HRGrid>
    <div style={{height:22}} />
    <HRPanel title="Staff related actions" subtitle="Tasks and onboarding records.">
      {[...data.tasks, ...data.onboarding].slice(0,30).map((x:any)=><HRRow key={x.id} title={x.title || x.task_type || 'Staff action'} meta={`${x.category || x.task_type || 'HR'} • ${x.due_at || 'no due date'}`} status={x.status || x.stage}/>)}
    </HRPanel>
  </AppShell>
}
