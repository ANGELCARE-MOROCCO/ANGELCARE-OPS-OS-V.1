import AppShell from '@/app/components/erp/AppShell'
import { getHRDashboardData } from '@/lib/hr-production/repository'
import { HRCard, HRSection, HRStatusPill, HRTable } from '../../_components/HRProductionUI'

export default async function Page() {
  const data = await getHRDashboardData()
  const rows = data.candidates.filter((x:any)=>x.interview_date)
  return <AppShell title="Interview Center" subtitle="Upcoming interviews pulled from candidate records with interview_date." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Interview Center'}]}>
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3"><HRCard title="Records" value={rows.length} /><HRCard title="Staff" value={data.staff.length} /><HRCard title="Open tasks" value={data.tasks.filter((x:any)=>String(x.status||'open')!=='done').length} /></div>
      <HRSection title="Interview Center" subtitle="Upcoming interviews pulled from candidate records with interview_date.">
        <HRTable headers={['Candidate','Context','Status']} rows={rows.map((x:any)=>[x.full_name, x.interview_date || "No date", <HRStatusPill value={x.pipeline_stage || "interview"} />])} />
      </HRSection>
    </div>
  </AppShell>
}
