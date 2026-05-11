import AppShell from '@/app/components/erp/AppShell'
import { getHRDashboardData } from '@/lib/hr-production/repository'
import { HRAction, HRCard, HRSection, HRTable } from '../_components/HRProductionUI'

export default async function Page() {
  const data = await getHRDashboardData()
  const reports = [
    ['Staff register', data.staff.length, '/api/hr/export?type=staff'],
    ['Recruitment pipeline', data.candidates.length, '/api/hr/export?type=candidates'],
    ['Attendance ledger', data.attendance.length, '/api/hr/export?type=attendance'],
    ['Roster ledger', data.rosters.length, '/api/hr/export?type=rosters'],
    ['Document compliance', data.docs.length, '/api/hr/export?type=documents'],
    ['Task execution', data.tasks.length, '/api/hr/export?type=tasks'],
    ['Approval requests', data.approvals.length, '/api/hr/export?type=approvals'],
  ]
  return <AppShell title="HR Reports" subtitle="Export-ready operational HR reporting." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Reports'}]}>
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4"><HRCard title="Reports" value={reports.length} /><HRCard title="Staff" value={data.staff.length} /><HRCard title="Attendance" value={data.attendance.length} /><HRCard title="Documents" value={data.docs.length} /></div>
      <HRSection title="Export center" subtitle="Download CSV reports directly from the HR production repository." action={<HRAction href="/hr/reports/export">Report hub</HRAction>}>
        <HRTable headers={['Report','Records','Download']} rows={reports.map(([name,count,href]:any)=>[name, String(count), <a className="font-black underline" href={href}>Download CSV</a>])} />
      </HRSection>
    </div>
  </AppShell>
}
