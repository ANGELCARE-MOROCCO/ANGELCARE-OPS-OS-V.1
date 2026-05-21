import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getAcademyData, nameOf } from '../_data'
import { PageHeader, Card, DataTable, Kpi, LinkButton, Badge, page, grid3 } from '../_components/AcademyUI'

export default async function AcademyNotificationsPage() {
  const data = await getAcademyData()
  const queued = data.audit.length
  return <AppShell title="Academy Notifications" subtitle="Notification queue and manager action visibility." breadcrumbs={[{label:'Academy',href:'/academy'},{label:'Notifications'}]} actions={<PageAction href="/academy">Academy</PageAction>}>
    <div style={page}><PageHeader title="Live notification command" subtitle="Every important Academy event should create a queued notification for staff, trainees, partners or managers."/>
    <div style={grid3}><Kpi label="Audit signals" value={data.audit.length}/><Kpi label="Open alerts" value={data.alerts.filter((a:any)=>a.status!=='closed').length} tone="#f97316"/><Kpi label="Trainees" value={data.trainees.length} tone="#2563eb"/></div>
    <Card><h2>Notification source queue</h2><DataTable headers={['Event','Entity','Note','Created']} rows={data.audit.map((a:any)=>[a.action,a.entity,a.note||'—',a.created_at?new Date(a.created_at).toLocaleString():'—'])}/></Card></div>
  </AppShell>
}
