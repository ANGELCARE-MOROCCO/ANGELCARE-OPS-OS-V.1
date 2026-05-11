import AppShell from '@/app/components/erp/AppShell'
import { getHRDashboardData } from '@/lib/hr-production/repository'
import { HRCard, HRSection, HRStatusPill, HRTable } from '../../_components/HRProductionUI'

export default async function Page() {
  const data = await getHRDashboardData()
  const rows = data.rosters.filter((x:any)=>String(x.conflict_status||"clear")!=="clear")
  return <AppShell title="Roster Conflict Center" subtitle="Roster conflicts and coverage issues needing correction." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Roster Conflict Center'}]}>
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3"><HRCard title="Records" value={rows.length} /><HRCard title="Staff" value={data.staff.length} /><HRCard title="Open tasks" value={data.tasks.filter((x:any)=>String(x.status||'open')!=='done').length} /></div>
      <HRSection title="Roster Conflict Center" subtitle="Roster conflicts and coverage issues needing correction.">
        <HRTable headers={['Staff','Context','Status']} rows={rows.map((x:any)=>[x.staff_name || "Staff", x.shift_date, <HRStatusPill value={x.conflict_status || "clear"} />])} />
      </HRSection>
    </div>
  </AppShell>
}
