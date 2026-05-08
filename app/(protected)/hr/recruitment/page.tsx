import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRRestoreLists } from '@/lib/hr-unified/route-restore-data'
import { HRHero, HRPanel, HRRow, HRButton } from '../_components/HRMaxUI'

export default async function Page() {
  const data = await getHRRestoreLists()

  const rows = data.candidates
  return <AppShell title="Recruitment" subtitle="Pipeline, candidates, stages and hiring execution." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Recruitment'}]} actions={<><PageAction href="/hr">HR Dashboard</PageAction><PageAction href="/hr/recruitment/candidates" variant="light">Candidates</PageAction></>}>
    <HRHero title="Recruitment" subtitle="Pipeline, candidates, stages and hiring execution." actions={<><HRButton href="/hr/recruitment/candidates" variant="blue">Candidates</HRButton><HRButton href="/hr/tasks" variant="light">Tasks</HRButton></>} />
    <HRPanel title="Recruitment records" subtitle="Restored base route. These records are synced with Supabase.">
      {rows.slice(0,60).map((x:any,i:number)=><HRRow key={x.id || i} title={x.full_name} meta={`${x.source || 'manual'} • ${x.city || 'Morocco'} • ${x.stage || 'new'}`} status={x.status || x.stage || 'active'} href={x.id && "/hr/recruitment/candidates/" ? `{detail_base}${x.id}` : undefined} />)}
    </HRPanel>
  </AppShell>
}
