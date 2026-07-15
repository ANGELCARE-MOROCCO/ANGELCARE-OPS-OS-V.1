import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRRestoreLists } from '@/lib/hr-unified/route-restore-data'
import { HRHero, HRPanel, HRRow, HRButton } from '../_components/HRMaxUI'

export default async function Page() {
  const data = await getHRRestoreLists()

  const rows = data.positions
  return <AppShell title="Positions" subtitle="Role catalog, skills and salary band control." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Positions'}]} actions={<><PageAction href="/hr">HR Dashboard</PageAction><PageAction href="/hr/settings" variant="light">Settings</PageAction></>}>
    <HRHero title="Positions" subtitle="Role catalog, skills and salary band control." actions={<><HRButton href="/hr/settings" variant="blue">Settings</HRButton><HRButton href="/hr/tasks" variant="light">Tasks</HRButton></>} />
    <HRPanel title="Positions records" subtitle="Restored base route. These records are synced with Supabase.">
      {rows.slice(0,60).map((x:any,i:number)=><HRRow key={x.id || i} title={x.title} meta={`${x.department || 'Department'} • ${x.level || 'standard'}`} status={x.status || x.stage || 'active'} href={x.id && "/hr/positions/" ? `{detail_base}${x.id}` : undefined} />)}
    </HRPanel>
  </AppShell>
}
