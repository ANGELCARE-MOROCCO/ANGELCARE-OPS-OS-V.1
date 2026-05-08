import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRRestoreLists } from '@/lib/hr-unified/route-restore-data'
import { HRHero, HRPanel, HRRow, HRButton } from '../_components/HRMaxUI'

export default async function Page() {
  const data = await getHRRestoreLists()

  const rows = data.attendance
  return <AppShell title="Attendance" subtitle="Attendance records, clocking and correction control." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Attendance'}]} actions={<><PageAction href="/hr">HR Dashboard</PageAction><PageAction href="/hr/attendance/corrections" variant="light">Corrections</PageAction></>}>
    <HRHero title="Attendance" subtitle="Attendance records, clocking and correction control." actions={<><HRButton href="/hr/attendance/corrections" variant="blue">Corrections</HRButton><HRButton href="/hr/tasks" variant="light">Tasks</HRButton></>} />
    <HRPanel title="Attendance records" subtitle="Restored base route. These records are synced with Supabase.">
      {rows.slice(0,60).map((x:any,i:number)=><HRRow key={x.id || i} title={x.staff_name || x.staff_id || 'Attendance'} meta={`${x.attendance_date || 'no date'} • ${x.clock_in || ''}-${x.clock_out || ''}`} status={x.status || x.stage || 'active'} href={x.id && "" ? `{detail_base}${x.id}` : undefined} />)}
    </HRPanel>
  </AppShell>
}
