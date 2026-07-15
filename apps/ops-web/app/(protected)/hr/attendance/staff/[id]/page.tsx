import AppShell from '@/app/components/erp/AppShell'
import Link from 'next/link'
import { approveAttendanceAction, getAttendanceEnterpriseData, markReviewAttendanceAction } from '@/lib/hr-production/attendance-enterprise'
import { AttendanceEnterpriseShell, AttendanceTopbar, Panel, MetricCard, StatusBadge, MiniTable } from '../../../_components/AttendanceEnterpriseUI'

function time(v:any){ return v ? String(v).slice(11,16) : '—' }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const decoded = decodeURIComponent(id)
  const data = await getAttendanceEnterpriseData()
  const records = data.records.filter(r=>[r.identity.staff_id,r.identity.user_id,r.identity.name].map(String).includes(decoded))
  const first = records[0]
  if (!first) return <AppShell><AttendanceEnterpriseShell><AttendanceTopbar/><main className="p-6"><Panel title="Attendance profile not found" subtitle="No mapped attendance records for this identifier."><Link href="/hr/attendance" className="font-black text-cyan-300">Back to monitor</Link></Panel></main></AttendanceEnterpriseShell></AppShell>
  return (
    <AppShell>
      <AttendanceEnterpriseShell>
        <AttendanceTopbar/>
        <main className="space-y-5 p-6">
          <Panel title={first.identity.name} subtitle={`${first.identity.role} · ${first.identity.department} · ${first.identity.location}`}>
            <div className="grid gap-4 md:grid-cols-4">
              <MetricCard tone="purple" label="Records" value={records.length} detail="attendance rows"/>
              <MetricCard tone="green" label="Validated" value={records.filter(r=>/valid|auto|complete|present/i.test(r.status)).length} detail="ready"/>
              <MetricCard tone="amber" label="Open" value={records.filter(r=>/pending|open|review/i.test(r.status)).length} detail="to review"/>
              <MetricCard tone="red" label="Risks" value={records.filter(r=>/late|missing|absent|review/i.test(r.status)).length} detail="exceptions"/>
            </div>
          </Panel>
          <Panel title="Individual Attendance History" subtitle="Approve or review every attendance row.">
            <MiniTable headers={['Date','In','Out','Status','Payroll','Actions']} rows={records.map(r=>[r.work_date,time(r.punch_in_at),time(r.punch_out_at),<StatusBadge key="s" value={r.status}/>,r.payroll_status || 'not_ready',<div key="a" className="flex gap-2"><form action={approveAttendanceAction.bind(null,r.id)}><button className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-slate-950">Approve</button></form><form action={markReviewAttendanceAction.bind(null,r.id)}><button className="rounded-full border border-amber-400/40 px-3 py-1 text-xs font-black text-amber-300">Review</button></form></div>])}/>
          </Panel>
          <Panel title="Navigation">
            <div className="flex flex-wrap gap-2"><Link href="/hr/attendance" className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-950">Back</Link>{first.identity.staff_id ? <Link href={`/hr/staff/${first.identity.staff_id}`} className="rounded-full border border-slate-700 px-4 py-2 text-xs font-black text-white">Staff 360</Link> : null}<Link href="/hr/rosters" className="rounded-full border border-slate-700 px-4 py-2 text-xs font-black text-white">Rosters</Link></div>
          </Panel>
        </main>
      </AttendanceEnterpriseShell>
    </AppShell>
  )
}
