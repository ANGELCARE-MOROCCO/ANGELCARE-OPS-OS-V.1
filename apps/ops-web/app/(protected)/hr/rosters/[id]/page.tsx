import AppShell from '@/app/components/erp/AppShell'
import { getHRRecord } from '@/lib/hr-production/repository'
import { ROSTER_TABLES, deleteRosterShiftAction } from '@/lib/hr-production/roster-enterprise'
import { RosterButton, RosterHero, RosterMetric, RosterPanel, RosterShell, RosterStatus } from '../../_components/RosterEnterpriseUI'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const shift: any = await getHRRecord(ROSTER_TABLES.assignments, id)
  const del = deleteRosterShiftAction.bind(null, id)
  if (!shift) return <AppShell><div className="rounded-3xl border border-slate-200 bg-white p-8 font-black text-slate-900">Shift not found.</div></AppShell>
  return <AppShell><RosterShell><RosterHero title={shift.title || 'Shift'} subtitle={`${shift.work_date || 'No date'} · ${shift.start_time || '—'} → ${shift.end_time || '—'}`} actions={<><RosterButton href={`/hr/rosters/${id}/edit`}>Edit shift</RosterButton><RosterButton href="/hr/rosters" variant="light">Back</RosterButton></>} /><section className="grid gap-4 md:grid-cols-4"><RosterMetric title="Status" value={<RosterStatus value={shift.status} />} /><RosterMetric title="Staff" value={shift.staff_name || shift.staff_id || 'Unassigned'} /><RosterMetric title="Type" value={shift.shift_type || 'standard'} /><RosterMetric title="Repeat" value={shift.repeat_rule || 'none'} /></section><RosterPanel title="Shift execution controls" subtitle="Inspect and delete/archive shift."><div className="grid gap-3 md:grid-cols-2">{Object.entries(shift).slice(0,24).map(([k,v]) => <div key={k} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm"><b>{k}</b><div className="mt-1 text-slate-600">{String(v ?? '—')}</div></div>)}</div><form action={del} className="mt-5"><button className="rounded-full bg-rose-600 px-5 py-3 text-xs font-black text-white">Delete / archive shift</button></form></RosterPanel></RosterShell></AppShell>
}
