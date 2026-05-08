import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRRestoreLists } from '@/lib/hr-unified/route-restore-data'
import { HRHero, HRPanel, HRRow, HRButton } from '../_components/HRMaxUI'

export default async function Page() {
  const data = await getHRRestoreLists()
  const reportRows = [{title:'Staff',meta:`${data.staff.length} profiles`},{title:'Openings',meta:`${data.openings.length} openings`},{title:'Candidates',meta:`${data.candidates.length} candidates`},{title:'Tasks',meta:`${data.tasks.length} tasks`},{title:'Approvals',meta:`${data.approvals.length} approvals`},{title:'Documents',meta:`${data.docs.length} documents`}]

  const rows = reportRows
  return <AppShell title="HR Reports" subtitle="Executive HR reporting and operational visibility." breadcrumbs={[{label:'HR',href:'/hr'},{label:'HR Reports'}]} actions={<><PageAction href="/hr">HR Dashboard</PageAction><PageAction href="/hr/reports/export" variant="light">Export</PageAction></>}>
    <HRHero title="HR Reports" subtitle="Executive HR reporting and operational visibility." actions={<><HRButton href="/hr/reports/export" variant="blue">Export</HRButton><HRButton href="/hr/tasks" variant="light">Tasks</HRButton></>} />
    <HRPanel title="HR Reports records" subtitle="Restored base route. These records are synced with Supabase.">
      {rows.slice(0,60).map((x:any,i:number)=><HRRow key={x.id || i} title={x.title} meta={x.meta} status={x.status || x.stage || 'active'} href={x.id && "" ? `{detail_base}${x.id}` : undefined} />)}
    </HRPanel>
  </AppShell>
}
