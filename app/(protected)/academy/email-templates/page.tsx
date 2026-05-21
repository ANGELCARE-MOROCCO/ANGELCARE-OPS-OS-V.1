import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getAcademyData, nameOf } from '../_data'
import { PageHeader, Card, DataTable, Kpi, LinkButton, Badge, page, grid3 } from '../_components/AcademyUI'

export default async function AcademyEmailTemplatesPage() {
  const data = await getAcademyData()
  const templates=[['Enrollment confirmation','After eligible trainee is enrolled','Email OS'],['Payment reminder','Before/after due date when unpaid','Email OS + Revenue'],['Attendance warning','When absence is marked','Email OS + Staff'],['Certificate ready','When certificate is issued','Email OS'],['Partner graduate pitch','When graduate is ready for placement','Market OS + Partner Ops']]
  return <AppShell title="Academy Email Templates" subtitle="Template control before connecting to Email OS." breadcrumbs={[{label:'Academy',href:'/academy'},{label:'Email Templates'}]} actions={<PageAction href="/academy/notifications">Notifications</PageAction>}>
    <div style={page}><PageHeader title="Academy communication templates" subtitle="Standardize all Academy communication before live delivery through Email OS."/>
    <Card><h2>Production template map</h2><DataTable headers={['Template','Trigger','Connected module']} rows={templates.map((t)=>[t[0],t[1],<Badge>{t[2]}</Badge>])}/></Card></div>
  </AppShell>
}
