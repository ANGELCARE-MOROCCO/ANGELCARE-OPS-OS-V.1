import AppShell from '@/app/components/erp/AppShell'
import { createAttendanceAction, getAttendanceEnterpriseData } from '@/lib/hr-production/attendance-enterprise'
import { AttendanceEnterpriseShell, AttendanceTopbar, Panel, MetricCard, StatusBadge, MiniTable } from '../../_components/AttendanceEnterpriseUI'

export default async function Page() {
  const data = await getAttendanceEnterpriseData()
  return (
    <AppShell><AttendanceEnterpriseShell><AttendanceTopbar/><main className="space-y-5 p-6">
      <Panel title="Attendance Execution Actions" subtitle="Create and control HR attendance actions.">
        <form action={createAttendanceAction} className="grid gap-3 md:grid-cols-2">
          <select name="action_type" className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white"><option value="validate">Validate attendance</option><option value="correct_punch">Correct punch</option><option value="investigate">Investigate anomaly</option><option value="payroll_review">Payroll review</option></select>
          <select name="priority" className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white"><option>normal</option><option>high</option><option>critical</option></select>
          <input name="staff_id" placeholder="Staff ID" className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white"/>
          <input name="attendance_id" placeholder="Attendance ID" className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white"/>
          <textarea name="notes" placeholder="Notes" className="min-h-24 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white md:col-span-2"/>
          <button className="rounded-xl bg-white px-4 py-3 text-xs font-black text-slate-950 md:col-span-2">Create action</button>
        </form>
      </Panel>
      <section className="grid gap-4 md:grid-cols-4"><MetricCard label="Exceptions" value={data.exceptions.length}/><MetricCard tone="red" label="Unmapped" value={data.unmapped.length}/><MetricCard tone="amber" label="Late" value={data.late.length}/><MetricCard tone="green" label="Present" value={data.present.length}/></section>
      <Panel title="Suggested Actions"><MiniTable headers={['Staff','Status','Suggested']} rows={data.exceptions.slice(0,80).map(r=>[r.identity.name,<StatusBadge key="s" value={r.status}/>,'Review / approve / correct'])}/></Panel>
    </main></AttendanceEnterpriseShell></AppShell>
  )
}
