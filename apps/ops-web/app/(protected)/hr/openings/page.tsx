import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRRestoreLists } from '@/lib/hr-unified/route-restore-data'
import { HRHero, HRPanel, HRRow, HRButton } from '../_components/HRMaxUI'

export default async function Page() {
  const data = await getHRRestoreLists()

  const rows = data.openings
  return <AppShell title="Opening Jobs" subtitle="Manage hiring demand, headcount and role readiness." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Opening Jobs'}]} actions={<><PageAction href="/hr">HR Dashboard</PageAction><PageAction href="/hr/openings/new" variant="light">New opening</PageAction></>}>
    <HRHero title="Opening Jobs" subtitle="Manage hiring demand, headcount and role readiness." actions={<><HRButton href="/hr/openings/new" variant="blue">New opening</HRButton><HRButton href="/hr/tasks" variant="light">Tasks</HRButton></>} />
    <HRPanel title="Opening Jobs records" subtitle="Restored base route. These records are synced with Supabase.">
      {rows.slice(0,60).map((x:any,i:number)=><HRRow key={x.id || i} title={x.title} meta={`${x.department || 'Department'} • ${x.priority || 'medium'} • HC ${x.headcount || 1}`} status={x.status || x.stage || 'active'} href={x.id && "/hr/openings/" ? `{detail_base}${x.id}` : undefined} />)}
    </HRPanel>
  </AppShell>
}
