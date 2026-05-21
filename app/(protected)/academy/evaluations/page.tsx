import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getAcademyData, nameOf } from '../_data'
import { PageHeader, Card, DataTable, Kpi, LinkButton, Badge, page, grid3 } from '../_components/AcademyUI'

export default async function AcademyEvaluationsPage() {
  const data = await getAcademyData()
  const present = data.attendance.filter((a:any)=>a.status==='present').length
  const absent = data.attendance.filter((a:any)=>a.status==='absent').length
  return <AppShell title="Academy Evaluations" subtitle="Evaluation readiness before certificate and placement." breadcrumbs={[{label:'Academy',href:'/academy'},{label:'Evaluations'}]} actions={<PageAction href="/academy/certificates">Certificates</PageAction>}>
    <div style={page}><PageHeader title="Evaluation and completion readiness" subtitle="Connect attendance, course completion, trainer review and certificate release decisions in one place."/>
    <div style={grid3}><Kpi label="Present records" value={present} tone="#16a34a"/><Kpi label="Absence risk" value={absent} tone="#f97316"/><Kpi label="Certificates" value={data.certificates.length} tone="#0891b2"/></div>
    <Card><h2>Trainee completion evidence</h2><DataTable headers={['Trainee','Attendance','Enrollment','Certificate','Next Action']} rows={data.trainees.map((t:any)=>{ const attendance=data.attendance.filter((a:any)=>a.trainee_id===t.id); const enrollment=data.enrollments.find((e:any)=>e.trainee_id===t.id); const cert=data.certificates.find((c:any)=>c.trainee_id===t.id); return [t.full_name,`${attendance.length} session(s)`,enrollment?.status||'Not enrolled',cert?.status||'Not issued',cert?'Placement follow-up':'Trainer evaluation required']})}/></Card></div>
  </AppShell>
}
