import AppShell from '@/app/components/erp/AppShell'
import Link from 'next/link'
import { getAttendanceEnterpriseData } from '@/lib/hr-production/attendance-enterprise'
import { AttendanceEnterpriseShell, AttendanceTopbar, Panel, MetricCard, MiniTable } from '../../_components/AttendanceEnterpriseUI'

export default async function Page() {
  const data = await getAttendanceEnterpriseData()
  return (
    <AppShell><AttendanceEnterpriseShell><AttendanceTopbar/><main className="space-y-5 p-6">
      <Panel title="Attendance Production Readiness" subtitle="Shows why data is or is not professional: mapping, punches, exceptions, payroll readiness.">
        <section className="grid gap-4 md:grid-cols-5"><MetricCard tone="green" label="Score" value={`${data.score}%`}/><MetricCard tone="purple" label="Records" value={data.records.length}/><MetricCard tone="red" label="Unmapped" value={data.unmapped.length}/><MetricCard tone="amber" label="Exceptions" value={data.exceptions.length}/><MetricCard tone="blue" label="Raw punches" value={data.logs.length}/></section>
      </Panel>
      <Panel title="Unmapped attendance records" subtitle="These rows cannot show real names until staff_id/user_id matches staff profiles.">
        <MiniTable headers={['Date','Staff ID','User ID','Status','Fix']} rows={data.unmapped.slice(0,120).map(r=>[r.work_date,r.identity.staff_id || 'missing',r.identity.user_id || 'missing',r.status,<Link key="fix" href="/hr/staff" className="font-black text-cyan-300 underline">Map staff</Link>])}/>
      </Panel>
    </main></AttendanceEnterpriseShell></AppShell>
  )
}
