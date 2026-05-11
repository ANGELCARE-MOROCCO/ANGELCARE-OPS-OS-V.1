import AppShell from '@/app/components/erp/AppShell'
import { getHRDashboardData } from '@/lib/hr-production/repository'
import { HRCard, HRSection, HRStatusPill, HRTable } from '../../_components/HRProductionUI'

export default async function Page() {
  const data = await getHRDashboardData()
  const rows = data.candidates
  return <AppShell title="Recruitment Sources" subtitle="Source performance based on candidate source fields." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Recruitment Sources'}]}>
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3"><HRCard title="Records" value={rows.length} /><HRCard title="Staff" value={data.staff.length} /><HRCard title="Open tasks" value={data.tasks.filter((x:any)=>String(x.status||'open')!=='done').length} /></div>
      <HRSection title="Recruitment Sources" subtitle="Source performance based on candidate source fields.">
        <HRTable headers={['Candidate','Context','Status']} rows={rows.map((x:any)=>[x.full_name, x.source || "manual", <HRStatusPill value={x.pipeline_stage || "new"} />])} />
      </HRSection>
    </div>
  </AppShell>
}
