import AppShell from '@/app/components/erp/AppShell'
import Link from 'next/link'
import { getWorkforceOpsData } from '@/lib/hr-production/workforce-ops'
import { WorkforceOpsShell, WorkforceOpsHero, WorkforceMetric, WorkforcePanel, WorkforceTable } from '../../_components/WorkforceOpsUI'

export default async function Page() {
  const data = await getWorkforceOpsData()
  const unmappedAttendance = data.attendance.filter((x:any)=>x.identity?.name === 'Unmapped staff')
  const unmappedRosters = data.rosters.filter((x:any)=>x.identity?.name === 'Unmapped staff')
  return <AppShell><WorkforceOpsShell>
    <WorkforceOpsHero title="Workforce Production Readiness" subtitle="Quality control for staff mapping, roster coverage, attendance validation and operational synchronization." score={data.readiness} />
    <section className="grid gap-4 md:grid-cols-5"><WorkforceMetric title="Readiness" value={`${data.readiness}%`} /><WorkforceMetric title="Unmapped attendance" value={unmappedAttendance.length} /><WorkforceMetric title="Unmapped rosters" value={unmappedRosters.length} /><WorkforceMetric title="Exceptions" value={data.exceptions.length} /><WorkforceMetric title="Conflicts" value={data.conflicts.length} /></section>
    <WorkforcePanel title="Critical mapping issues" subtitle="Records that cannot resolve to real staff identity."><WorkforceTable headers={['Source','Date','Staff ID','Problem','Open']} rows={[...unmappedAttendance.slice(0,80).map((x:any)=>['Attendance', x.work_date || '—', x.staff_id || x.user_id || 'missing', 'Missing staff identity mapping', <Link className="font-black underline" href="/hr/attendance">Open</Link>]), ...unmappedRosters.slice(0,80).map((x:any)=>['Roster', x.work_date || '—', x.staff_id || 'missing', 'Missing staff identity mapping', <Link className="font-black underline" href="/hr/rosters">Open</Link>])]} /></WorkforcePanel>
    <WorkforcePanel title="Production launch links" subtitle="Operational destinations."><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{[['/hr/workforce-ops','Workforce Ops'],['/hr/attendance','Attendance Monitor'],['/hr/rosters','Roster Scheduler'],['/hr/workforce-ops/actions','Execution Actions'],['/hr/workforce-ops/readiness','Readiness Control'],['/hr/staff','Staff Command'],['/hr/reports','Reports'],['/hr/sync-center','Sync Center']].map(([href,label])=><Link key={href} href={href} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-black text-slate-900 shadow-sm hover:bg-slate-50">{label}</Link>)}</div></WorkforcePanel>
  </WorkforceOpsShell></AppShell>
}
