import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getAcademyData, nameOf } from '../_data'
import { PageHeader, Card, DataTable, Kpi, LinkButton, Badge, page, grid3 } from '../_components/AcademyUI'

export default async function AcademyRevenueSyncPage() {
  const data = await getAcademyData()
  const paid=data.payments.filter((p:any)=>p.status==='paid').reduce((s:number,p:any)=>s+Number(p.amount||0),0)
  const unpaid=data.payments.filter((p:any)=>p.status!=='paid').reduce((s:number,p:any)=>s+Number(p.amount||0),0)
  return <AppShell title="Academy Revenue Sync" subtitle="Live Academy cash collection and Revenue Command Center sync readiness." breadcrumbs={[{label:'Academy',href:'/academy'},{label:'Revenue Sync'}]} actions={<PageAction href="/academy/payments">Payments</PageAction>}>
    <div style={page}><PageHeader title="Revenue command sync" subtitle="Every enrollment and payment should become visible to revenue management without duplicate manual work."/>
    <div style={grid3}><Kpi label="Collected" value={`${paid.toLocaleString()} MAD`} tone="#16a34a"/><Kpi label="Unpaid" value={`${unpaid.toLocaleString()} MAD`} tone="#f97316"/><Kpi label="Payment rows" value={data.payments.length}/></div>
    <Card><h2>Payment ledger sync status</h2><DataTable headers={['Trainee','Amount','Status','Due/Paid','Reference']} rows={data.payments.map((p:any)=>[nameOf(data.trainees,p.trainee_id),`${Number(p.amount||0).toLocaleString()} MAD`,<Badge tone={p.status==='paid'?'#16a34a':'#f97316'}>{p.status}</Badge>,p.paid_at||p.due_at||'—',p.reference||'—'])}/></Card></div>
  </AppShell>
}
