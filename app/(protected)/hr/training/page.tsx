import AppShell from '@/app/components/erp/AppShell'
import { getHRDashboardData } from '@/lib/hr-production/repository'
import { HRCard, HRSection, HRStatusPill, HRTable } from '../_components/HRProductionUI'

export default async function Page() {
  const data = await getHRDashboardData()
  const rows = data.onboarding
  return <AppShell title="Training Compliance" subtitle="Training readiness derived from onboarding, documents and staff compliance." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Training Compliance'}]}>
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3"><HRCard title="Records" value={rows.length} /><HRCard title="Staff" value={data.staff.length} /><HRCard title="Open tasks" value={data.tasks.filter((x:any)=>String(x.status||'open')!=='done').length} /></div>
      <HRSection title="Training Compliance" subtitle="Training readiness derived from onboarding, documents and staff compliance.">
        <HRTable headers={['Person','Context','Status']} rows={rows.map((x:any)=>[x.full_name || x.role || "Onboarding", x.department || "Department", <HRStatusPill value={x.status || "planned"} />])} />
      </HRSection>
    </div>
  </AppShell>
}
