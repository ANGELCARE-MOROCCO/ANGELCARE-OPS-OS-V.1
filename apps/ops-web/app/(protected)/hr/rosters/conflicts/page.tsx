import AppShell from '@/app/components/erp/AppShell'
import { getRosterCommandData } from '@/lib/hr-production/roster-enterprise'
import { RosterHero, RosterMetric, RosterPanel, RosterShell, RosterTable } from '../../_components/RosterEnterpriseUI'

export default async function Page() {
  const { conflicts, rosters } = await getRosterCommandData()
  return <AppShell><RosterShell><RosterHero title="Roster Conflict Center" subtitle="Detect uncovered, overlapping, missing and risky schedule records." score={rosters.length ? Math.max(0, Math.round(((rosters.length-conflicts.length)/rosters.length)*100)) : 100} /><section className="grid gap-4 md:grid-cols-3"><RosterMetric title="Conflicts" value={conflicts.length} /><RosterMetric title="Roster records" value={rosters.length} /><RosterMetric title="Clean records" value={Math.max(0, rosters.length-conflicts.length)} /></section><RosterPanel title="Detected conflicts" subtitle="Operational conflicts requiring HR action."><RosterTable headers={['Shift','Date','Staff','Status','Type']} rows={conflicts.map((x:any)=>[x.title || 'Shift', x.work_date || '—', x.staff_name || x.staff_id || 'Unassigned', x.status || 'conflict', x.conflict_type || x.type || 'review'])} /></RosterPanel></RosterShell></AppShell>
}
