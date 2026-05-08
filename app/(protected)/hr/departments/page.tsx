import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRRestoreLists } from '@/lib/hr-unified/route-restore-data'
import { HRHero, HRPanel, HRRow, HRButton } from '../_components/HRMaxUI'

export default async function Page() {
  const data = await getHRRestoreLists()

  const rows = data.departments
  return <AppShell title="Departments" subtitle="Department structure, owners and headcount control." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Departments'}]} actions={<><PageAction href="/hr">HR Dashboard</PageAction><PageAction href="/hr/settings" variant="light">Settings</PageAction></>}>
    <HRHero title="Departments" subtitle="Department structure, owners and headcount control." actions={<><HRButton href="/hr/settings" variant="blue">Settings</HRButton><HRButton href="/hr/tasks" variant="light">Tasks</HRButton></>} />
    <HRPanel title="Departments records" subtitle="Restored base route. These records are synced with Supabase.">
      {rows.slice(0,60).map((x:any,i:number)=><HRRow key={x.id || i} title={x.name} meta={`${x.code || 'DEP'} • ${x.owner || 'Owner'} • target ${x.headcount_target || 0}`} status={x.status || x.stage || 'active'} href={x.id && "/hr/departments/" ? `{detail_base}${x.id}` : undefined} />)}
    </HRPanel>
  </AppShell>
}
