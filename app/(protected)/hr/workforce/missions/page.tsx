import AppShell from '@/app/components/erp/AppShell'
import { getHRDashboardData } from '@/lib/hr-production/repository'
import { HRCard, HRSection, HRStatusPill, HRTable } from '../../_components/HRProductionUI'

export default async function Page() {
  const data = await getHRDashboardData()
  const rows = data.rosters.filter((x:any)=>x.mission_ref)
  return <AppShell title="Workforce Mission Sync" subtitle="Mission coverage view from rosters linked with mission_ref." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Workforce Mission Sync'}]}>
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3"><HRCard title="Records" value={rows.length} /><HRCard title="Staff" value={data.staff.length} /><HRCard title="Open tasks" value={data.tasks.filter((x:any)=>String(x.status||'open')!=='done').length} /></div>
      <HRSection title="Workforce Mission Sync" subtitle="Mission coverage view from rosters linked with mission_ref.">
        <HRTable headers={['Mission','Context','Status']} rows={rows.map((x:any)=>[x.mission_ref, x.staff_name || "Staff", <HRStatusPill value={x.status || "planned"} />])} />
      </HRSection>
    </div>
  </AppShell>
}
