import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getStaffRestore } from '@/lib/hr-unified/route-restore-data'
import { HRHero, HRPanel, HRRow } from '../../../_components/HRMaxUI'

export default async function StaffSubPage({ params }: any) {
  const data = await getStaffRestore(params.id)
  const staff = data.staff
  if (!staff) return <AppShell title="Staff not found" subtitle="Missing staff." breadcrumbs={[{label:'HR',href:'/hr'}]}><div>Staff not found.</div></AppShell>
  const rows = data.rosters
  return <AppShell title="Staff Roster" subtitle="Staff Roster records." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Staff',href:'/hr/staff'},{label:staff.full_name || 'Staff',href:`/hr/staff/${staff.id}`},{label:'Staff Roster'}]} actions={<PageAction href={`/hr/staff/${staff.id}`} variant="light">Staff 360</PageAction>}>
    <HRHero title="Staff Roster" subtitle={`${staff.full_name || staff.name || 'Staff'} • restored subpage`} />
    <HRPanel title="Records" subtitle="Staff synced records.">
      {rows.slice(0,60).map((x:any)=><HRRow key={x.id} title={x.title || x.document_type || x.attendance_date || x.shift_date || 'Record'} meta={`${x.status || x.stage || 'active'} • ${x.created_at || ''}`} status={x.status || x.stage} />)}
    </HRPanel>
  </AppShell>
}
