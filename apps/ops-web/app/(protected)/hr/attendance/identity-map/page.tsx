import AppShell from '@/app/components/erp/AppShell'
import { getAttendanceEnterpriseData, getIdentityLinks, mapIdentityToStaffAction } from '@/lib/hr-production/attendance-enterprise'
import { AttendanceEnterpriseShell, AttendanceTopbar, Panel, MetricCard, StatusBadge, MiniTable } from '../../_components/AttendanceEnterpriseUI'

export default async function Page() {
  const data = await getAttendanceEnterpriseData()
  const links = await getIdentityLinks()
  const staff = data.staff || []

  return (
    <AppShell>
      <AttendanceEnterpriseShell>
        <AttendanceTopbar />
        <main className="space-y-5 p-6">
          <Panel title="Attendance Identity Map" subtitle="Map disconnected overhead-panel identities to real HR staff profiles. Once mapped, attendance live monitor shows real names.">
            <section className="grid gap-4 md:grid-cols-4">
              <MetricCard tone="purple" label="Identity links" value={links.length} detail="overhead identities" />
              <MetricCard tone="green" label="Mapped" value={links.filter((x:any)=>x.staff_id).length} detail="real staff linked" />
              <MetricCard tone="red" label="Unmapped" value={links.filter((x:any)=>!x.staff_id).length} detail="needs mapping" />
              <MetricCard tone="blue" label="Staff profiles" value={staff.length} detail="available HR staff" />
            </section>
          </Panel>

          <Panel title="Map overhead identities" subtitle="Choose a real staff profile for each overhead identity.">
            <div className="grid gap-3">
              {links.map((link:any)=>(
                <form key={link.id} action={mapIdentityToStaffAction} className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 md:grid-cols-[1fr_1fr_180px]">
                  <input type="hidden" name="link_id" value={link.id} />
                  <div>
                    <div className="text-xs font-black uppercase tracking-[.18em] text-slate-500">Overhead identity</div>
                    <div className="mt-1 font-black text-white">{link.label || link.source_user_id}</div>
                    <div className="mt-1 text-xs text-slate-500">{link.source_user_id}</div>
                    <div className="mt-2"><StatusBadge value={link.status || 'unmapped'} /></div>
                  </div>
                  <label>
                    <div className="text-xs font-black uppercase tracking-[.18em] text-slate-500">Map to staff</div>
                    <select name="staff_id" defaultValue={link.staff_id || ''} className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white">
                      <option value="">Select staff...</option>
                      {staff.map((s:any)=><option key={s.id} value={s.id}>{s.full_name || s.name || s.email || s.id}</option>)}
                    </select>
                  </label>
                  <button className="self-end rounded-xl bg-emerald-500 px-4 py-3 text-xs font-black text-slate-950">Save mapping</button>
                </form>
              ))}
            </div>
          </Panel>

          <Panel title="Current unresolved attendance" subtitle="Rows still not attached to real staff.">
            <MiniTable headers={['Date','Identity','Status','Source']} rows={data.unmapped.slice(0,80).map((r:any)=>[r.work_date, r.identity.name, <StatusBadge key="s" value={r.status}/>, r.source])} />
          </Panel>
        </main>
      </AttendanceEnterpriseShell>
    </AppShell>
  )
}
