import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRRestoreLists } from '@/lib/hr-unified/route-restore-data'
import { HRHero, HRPanel, HRRow, HRButton } from '../_components/HRMaxUI'

export default async function Page() {
  const data = await getHRRestoreLists()

  const rows = data.rosters
  return <AppShell title="Rosters" subtitle="Planning, shift assignments and roster operations." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Rosters'}]} actions={<><PageAction href="/hr">HR Dashboard</PageAction><PageAction href="/hr/rosters/planner" variant="light">Planner</PageAction></>}>
    <HRHero title="Rosters" subtitle="Planning, shift assignments and roster operations." actions={<><HRButton href="/hr/rosters/planner" variant="blue">Planner</HRButton><HRButton href="/hr/tasks" variant="light">Tasks</HRButton></>} />
    <HRPanel title="Rosters records" subtitle="Restored base route. These records are synced with Supabase.">
      {rows.slice(0,60).map((x:any,i:number)=><HRRow key={x.id || i} title={x.staff_name || x.role || 'Roster'} meta={`${x.shift_date || 'no date'} • ${x.start_time || ''}-${x.end_time || ''}`} status={x.status || x.stage || 'active'} href={x.id && "" ? `{detail_base}${x.id}` : undefined} />)}
    </HRPanel>
  </AppShell>
}
