import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createHrRecord } from '../_lib/actions'
import { HR_TABLES, getHRDashboardData } from '@/lib/hr-production/repository'
import { HRAction, HRCard, HRSection, HRStatusPill, HRTable } from '../_components/HRProductionUI'

export default async function Page() {
  const data = await getHRDashboardData()
  return <AppShell title="Roster Planner" subtitle="Shift planning, mission coverage and conflict control." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Rosters'}]} actions={<><PageAction href="/hr/rosters/planner" variant="light">Planner</PageAction><PageAction href="/hr/rosters/conflicts" variant="light">Conflicts</PageAction></>}>
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4"><HRCard title="Shifts" value={data.rosters.length} /><HRCard title="Conflicts" value={data.rosters.filter((x:any)=>String(x.conflict_status||'clear')!=='clear').length} /><HRCard title="Confirmed" value={data.rosters.filter((x:any)=>String(x.status||'')==='confirmed').length} /><HRCard title="Planned" value={data.rosters.filter((x:any)=>String(x.status||'planned')==='planned').length} /></div>
      <HRSection title="Create shift" subtitle="Creates a shift linked to staff and optionally mission reference.">
        <form action={createHrRecord} className="grid gap-3 md:grid-cols-4">
          <input type="hidden" name="_table" value={HR_TABLES.rosters} /><input type="hidden" name="_redirect" value="/hr/rosters" />
          <select name="staff_id" className="rounded-2xl border p-3"><option value="">Select staff</option>{data.staff.map((s:any)=><option key={s.id} value={s.id}>{s.full_name}</option>)}</select>
          <input name="staff_name" placeholder="Staff name fallback" className="rounded-2xl border p-3" />
          <input name="shift_date" type="date" required className="rounded-2xl border p-3" />
          <input name="start_time" type="time" className="rounded-2xl border p-3" />
          <input name="end_time" type="time" className="rounded-2xl border p-3" />
          <input name="location" placeholder="Location" className="rounded-2xl border p-3" />
          <input name="mission_ref" placeholder="Mission ref" className="rounded-2xl border p-3" />
          <button className="rounded-2xl bg-slate-950 p-3 font-black text-white">Create shift</button>
        </form>
      </HRSection>
      <HRSection title="Roster ledger" action={<HRAction href="/hr/rosters/conflicts">Conflict center</HRAction>}>
        <HRTable headers={['Staff','Date','Time','Location','Status']} rows={data.rosters.map((x:any)=>[
          x.staff_name || data.staff.find((s:any)=>s.id===x.staff_id)?.full_name || 'Staff', x.shift_date, `${x.start_time || '-'} → ${x.end_time || '-'}`, x.location || x.area || '-', <div className="flex gap-2"><HRStatusPill value={x.status || 'planned'} /><HRStatusPill value={x.conflict_status || 'clear'} /></div>
        ])} />
      </HRSection>
    </div>
  </AppShell>
}
