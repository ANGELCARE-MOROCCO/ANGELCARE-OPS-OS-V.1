import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getAcademyData, nameOf } from '../_data'
import { PageHeader, Card, DataTable, Kpi, LinkButton, Badge, page, grid3 } from '../_components/AcademyUI'

export default async function AcademyControlTicketsPage() {
  const data = await getAcademyData()
  const open = data.alerts.filter((a:any)=>a.status!=='closed')
  return <AppShell title="Academy Control Tickets" subtitle="Manager escalation layer." breadcrumbs={[{label:'Academy',href:'/academy'},{label:'Control Tickets'}]} actions={<PageAction href="/academy/alerts-sales">Alerts</PageAction>}>
    <div style={page}><PageHeader title="Control tickets and escalations" subtitle="No Academy risk should stay hidden: payments, absences, eligibility blockers and partner follow-ups are controlled here."/>
    <div style={grid3}><Kpi label="Open tickets" value={open.length} tone="#f97316"/><Kpi label="Critical alerts" value={data.alerts.filter((a:any)=>a.severity==='critical').length} tone="#dc2626"/><Kpi label="Audit logs" value={data.audit.length}/></div>
    <Card><h2>Open control workload</h2><DataTable headers={['Title','Severity','Status','Owner','Due']} rows={open.map((a:any)=>[a.title||'Alert',<Badge>{a.severity||'medium'}</Badge>,<Badge>{a.status}</Badge>,a.owner_name||'Unassigned',a.due_at?new Date(a.due_at).toLocaleDateString():'—'])}/></Card></div>
  </AppShell>
}
