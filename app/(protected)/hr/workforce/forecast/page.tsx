import AppShell from '@/app/components/erp/AppShell'
import { getHRDashboardData } from '@/lib/hr-production/repository'
import { HRCard, HRSection, HRStatusPill, HRTable } from '../../_components/HRProductionUI'

export default async function Page() {
  const data = await getHRDashboardData()
  const rows = data.openings
  return <AppShell title="Workforce Forecast" subtitle="Capacity and hiring signals based on staff, openings and rosters." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Workforce Forecast'}]}>
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3"><HRCard title="Records" value={rows.length} /><HRCard title="Staff" value={data.staff.length} /><HRCard title="Open tasks" value={data.tasks.filter((x:any)=>String(x.status||'open')!=='done').length} /></div>
      <HRSection title="Workforce Forecast" subtitle="Capacity and hiring signals based on staff, openings and rosters.">
        <HRTable headers={['Opening','Context','Status']} rows={rows.map((x:any)=>[x.title, x.department || x.city || "Scope", <HRStatusPill value={x.status || "open"} />])} />
      </HRSection>
    </div>
  </AppShell>
}
