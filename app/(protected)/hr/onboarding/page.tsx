import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRRestoreLists } from '@/lib/hr-unified/route-restore-data'
import { HRHero, HRPanel, HRRow, HRButton } from '../_components/HRMaxUI'

export default async function Page() {
  const data = await getHRRestoreLists()

  const rows = data.onboarding
  return <AppShell title="Onboarding" subtitle="Onboarding steps, readiness and integration control." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Onboarding'}]} actions={<><PageAction href="/hr">HR Dashboard</PageAction><PageAction href="/hr/onboarding/checklists" variant="light">Checklists</PageAction></>}>
    <HRHero title="Onboarding" subtitle="Onboarding steps, readiness and integration control." actions={<><HRButton href="/hr/onboarding/checklists" variant="blue">Checklists</HRButton><HRButton href="/hr/tasks" variant="light">Tasks</HRButton></>} />
    <HRPanel title="Onboarding records" subtitle="Restored base route. These records are synced with Supabase.">
      {rows.slice(0,60).map((x:any,i:number)=><HRRow key={x.id || i} title={x.title} meta={`${x.category || 'general'} • due ${x.due_at || 'none'}`} status={x.status || x.stage || 'active'} href={x.id && "/hr/onboarding/" ? `{detail_base}${x.id}` : undefined} />)}
    </HRPanel>
  </AppShell>
}
