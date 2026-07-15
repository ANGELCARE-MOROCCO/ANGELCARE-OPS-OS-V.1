import AppShell from '@/app/components/erp/AppShell'
import { getAttendanceEnterpriseData } from '@/lib/hr-production/attendance-enterprise'
import { AttendanceEnterpriseShell, AttendanceTopbar, Panel, MetricCard, MiniTable } from '../../_components/AttendanceEnterpriseUI'

export default async function Page() {
  const data = await getAttendanceEnterpriseData()

  return (
    <AppShell>
      <AttendanceEnterpriseShell>
        <AttendanceTopbar />
        <main className="space-y-5 p-6">
          <Panel title="Attendance Unified Data Sources" subtitle="Shows which tables are feeding the HR attendance monitor, including user profile attendance sources.">
            <section className="grid gap-4 md:grid-cols-5">
              <MetricCard tone="purple" label="Unified records" value={data.records.length} detail="deduped signals" />
              <MetricCard tone="green" label="Mapped" value={data.mapped.length} detail="staff resolved" />
              <MetricCard tone="blue" label="Sources" value={data.sourceBreakdown.length} detail="active source tables" />
              <MetricCard tone="amber" label="Exceptions" value={data.exceptions.length} detail="needs control" />
              <MetricCard tone="red" label="Unmapped" value={data.unmapped.length} detail="identity gaps" />
            </section>
          </Panel>

          <Panel title="Active source breakdown" subtitle="If user profile attendance exists, it should appear here.">
            <MiniTable headers={['Source table','Records']} rows={data.sourceBreakdown.map((x:any)=>[x.table, x.count])} />
          </Panel>

          <Panel title="Unmapped rows" subtitle="Rows that still cannot resolve to staff after bridge + profile merge.">
            <MiniTable headers={['Source','Date','Identity','Status']} rows={data.unmapped.slice(0,100).map((r:any)=>[r.source_table, r.work_date, r.identity.name, r.status])} />
          </Panel>
        </main>
      </AttendanceEnterpriseShell>
    </AppShell>
  )
}
