import AppShell from '@/app/components/erp/AppShell'
import Link from 'next/link'
import { getRosterCommandData } from '@/lib/hr-production/roster-enterprise'
import { RosterHero, RosterMetric, RosterPanel, RosterShell, RosterTable } from '../../_components/RosterEnterpriseUI'

export default async function Page() {
  const { rosters, staff, conflicts, covered } = await getRosterCommandData()
  const incomplete = rosters.filter((x:any)=>!x.staff_id || !x.work_date || !x.start_time || !x.end_time)
  const score = rosters.length ? Math.round(((rosters.length - incomplete.length - conflicts.length) / rosters.length) * 100) : 0
  return <AppShell><RosterShell><RosterHero title="Roster Production Readiness" subtitle="Quality control for synchronization, incomplete shifts, conflicts and coverage." score={score} /><section className="grid gap-4 md:grid-cols-5"><RosterMetric title="Shifts" value={rosters.length} /><RosterMetric title="Covered" value={covered.length} /><RosterMetric title="Conflicts" value={conflicts.length} /><RosterMetric title="Incomplete" value={incomplete.length} /><RosterMetric title="Staff pool" value={staff.length} /></section><RosterPanel title="Incomplete shifts" subtitle="Records missing staff, date, start or end time."><RosterTable headers={['Shift','Date','Staff','Start','End','Open']} rows={incomplete.map((x:any)=>[x.title || 'Shift', x.work_date || 'missing', x.staff_name || x.staff_id || 'missing', x.start_time || 'missing', x.end_time || 'missing', <Link className="font-black underline" href={`/hr/rosters/${x.id}`}>Open</Link>])} /></RosterPanel></RosterShell></AppShell>
}
