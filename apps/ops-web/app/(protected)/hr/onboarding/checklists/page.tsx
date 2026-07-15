import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRRestoreLists } from '@/lib/hr-unified/route-restore-data'
import { HRHero, HRPanel, HRRow } from '../../_components/HRMaxUI'

export default async function ChecklistsPage() {
  const data = await getHRRestoreLists()
  return <AppShell title="Onboarding Checklists" subtitle="Restored checklist library." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Onboarding',href:'/hr/onboarding'},{label:'Checklists'}]} actions={<PageAction href="/hr/onboarding" variant="light">Onboarding</PageAction>}>
    <HRHero title="Onboarding Checklists" subtitle="Reusable templates and onboarding control." />
    <HRPanel title="Checklist library" subtitle="Synced checklist records.">
      {data.checklists.map((x:any)=><HRRow key={x.id} title={x.name} meta={`${x.role_key || 'all roles'} • ${Array.isArray(x.checklist)?x.checklist.length:0} steps`} status={x.status}/>)}
    </HRPanel>
  </AppShell>
}
