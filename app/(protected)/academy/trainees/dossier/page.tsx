import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getAcademyData, nameOf } from '../../_data'
import { PageHeader, Card, DataTable, Kpi, LinkButton, Badge, page, grid3 } from '../../_components/AcademyUI'

export default async function TraineeDossierPage() {
  const data = await getAcademyData()
  const missing = data.trainees.filter((t:any)=>!t.phone || !t.city || !t.eligibility_status)
  return <AppShell title="Academy Trainee Dossiers" subtitle="Production dossier readiness: identity, eligibility, enrollment, payment, attendance and certificate evidence." breadcrumbs={[{label:'Academy',href:'/academy'},{label:'Trainee Dossiers'}]} actions={<PageAction href="/academy/trainees">Back to Trainees</PageAction>}>
    <div style={page}>
      <PageHeader title="Permanent trainee dossier command" subtitle="Use this page as the zero-demo control panel for complete trainee folders before enrollment, certification and placement." />
      <div style={grid3}><Kpi label="Total dossiers" value={data.trainees.length}/><Kpi label="Needs completion" value={missing.length} tone="#f97316"/><Kpi label="Certificates" value={data.certificates.length} tone="#0891b2"/></div>
      <Card><h2>Dossier readiness matrix</h2><DataTable headers={['Trainee','Identity','Eligibility','Enrollment','Payment','Certificate','Action']} rows={data.trainees.map((t:any)=>{ const enrollment=data.enrollments.find((e:any)=>e.trainee_id===t.id); const payment=data.payments.find((p:any)=>p.trainee_id===t.id); const cert=data.certificates.find((c:any)=>c.trainee_id===t.id); return [<><strong>{t.full_name}</strong><br/><small>{t.serial_number || 'No serial'} · {t.city || 'No city'}</small></>, t.phone||t.email?<Badge tone="#16a34a">Ready</Badge>:<Badge tone="#f97316">Missing</Badge>, <Badge>{t.eligibility_status||'pending'}</Badge>, enrollment?<Badge tone="#16a34a">{enrollment.status}</Badge>:<Badge tone="#f97316">Not enrolled</Badge>, payment?<Badge tone={payment.status==='paid'?'#16a34a':'#f97316'}>{payment.status}</Badge>:<Badge tone="#f97316">No payment</Badge>, cert?<Badge tone="#0891b2">{cert.status}</Badge>:<Badge>Not issued</Badge>, <LinkButton href={`/academy/trainees/${t.id}`}>Open folder</LinkButton>]})}/></Card>
    </div>
  </AppShell>
}
