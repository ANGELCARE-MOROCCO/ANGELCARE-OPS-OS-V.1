import AppShell from '@/app/components/erp/AppShell'
import { getHRDashboardData } from '@/lib/hr-production/repository'
import { HRCard, HRSection, HRStatusPill, HRTable } from '../../_components/HRProductionUI'

export default async function Page() {
  const data = await getHRDashboardData()
  const rows = [...data.staff, ...data.candidates, ...data.attendance]
  return <AppShell title="HR Export Center" subtitle="Export-ready report views. Use this page to validate records before CSV/PDF automation." breadcrumbs={[{label:'HR',href:'/hr'},{label:'HR Export Center'}]}>
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3"><HRCard title="Records" value={rows.length} /><HRCard title="Staff" value={data.staff.length} /><HRCard title="Open tasks" value={data.tasks.filter((x:any)=>String(x.status||'open')!=='done').length} /></div>
      <HRSection title="HR Export Center" subtitle="Export-ready report views. Use this page to validate records before CSV/PDF automation.">
        <HRTable headers={['Record','Context','Status']} rows={rows.map((x:any)=>[x.full_name || x.staff_name || x.title || "Record", x.department || x.attendance_date || x.source || "HR", <HRStatusPill value={x.status || x.employment_status || x.pipeline_stage || "active"} />])} />
      </HRSection>
    </div>
  </AppShell>
}
