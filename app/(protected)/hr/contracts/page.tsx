import AppShell from '@/app/components/erp/AppShell'
import { getHRDashboardData } from '@/lib/hr-production/repository'
import { HRCard, HRSection, HRStatusPill, HRTable } from '../_components/HRProductionUI'

export default async function Page() {
  const data = await getHRDashboardData()
  const rows = data.staff
  return <AppShell title="HR Contracts" subtitle="Contract preparation and staff contract status." breadcrumbs={[{label:'HR',href:'/hr'},{label:'HR Contracts'}]}>
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3"><HRCard title="Records" value={rows.length} /><HRCard title="Staff" value={data.staff.length} /><HRCard title="Open tasks" value={data.tasks.filter((x:any)=>String(x.status||'open')!=='done').length} /></div>
      <HRSection title="HR Contracts" subtitle="Contract preparation and staff contract status.">
        <HRTable headers={['Staff','Context','Status']} rows={rows.map((x:any)=>[x.full_name, x.contract_type || "No contract type", <HRStatusPill value={x.employment_status || "active"} />])} />
      </HRSection>
    </div>
  </AppShell>
}
