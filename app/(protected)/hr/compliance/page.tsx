import AppShell from '@/app/components/erp/AppShell'
import { getHRDashboardData } from '@/lib/hr-production/repository'
import { HRCard, HRSection, HRStatusPill, HRTable } from '../_components/HRProductionUI'

export default async function Page() {
  const data = await getHRDashboardData()
  const rows = data.docs
  return <AppShell title="HR Compliance" subtitle="Document expiry, staff compliance and data-quality issues." breadcrumbs={[{label:'HR',href:'/hr'},{label:'HR Compliance'}]}>
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3"><HRCard title="Records" value={rows.length} /><HRCard title="Staff" value={data.staff.length} /><HRCard title="Open tasks" value={data.tasks.filter((x:any)=>String(x.status||'open')!=='done').length} /></div>
      <HRSection title="HR Compliance" subtitle="Document expiry, staff compliance and data-quality issues.">
        <HRTable headers={['Document','Context','Status']} rows={rows.map((x:any)=>[x.title || x.document_type, x.expiry_date || "No expiry", <HRStatusPill value={x.status || "missing"} />])} />
      </HRSection>
    </div>
  </AppShell>
}
