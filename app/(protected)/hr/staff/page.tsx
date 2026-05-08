import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRRestoreLists } from '@/lib/hr-unified/route-restore-data'
import { HRHero, HRPanel, HRRow, HRButton } from '../_components/HRMaxUI'

export default async function Page() {
  const data = await getHRRestoreLists()

  const rows = data.staff
  return <AppShell title="Staff 360" subtitle="Staff profile workspace and employee/caregiver control." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Staff 360'}]} actions={<><PageAction href="/hr">HR Dashboard</PageAction><PageAction href="/hr/staff/new" variant="light">New staff</PageAction></>}>
    <HRHero title="Staff 360" subtitle="Staff profile workspace and employee/caregiver control." actions={<><HRButton href="/hr/staff/new" variant="blue">New staff</HRButton><HRButton href="/hr/tasks" variant="light">Tasks</HRButton></>} />
    <HRPanel title="Staff 360 records" subtitle="Restored base route. These records are synced with Supabase.">
      {rows.slice(0,60).map((x:any,i:number)=><HRRow key={x.id || i} title={x.full_name || x.name} meta={`${x.department || 'Department'} • ${x.position || x.job_title || 'Position'}`} status={x.status || x.stage || 'active'} href={x.id && "/hr/staff/" ? `{detail_base}${x.id}` : undefined} />)}
    </HRPanel>
  </AppShell>
}
