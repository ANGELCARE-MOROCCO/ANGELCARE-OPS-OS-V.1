import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getAcademyData, nameOf } from '../_data'
import { PageHeader, Card, DataTable, Kpi, LinkButton, Badge, page, grid3 } from '../_components/AcademyUI'

export default async function AcademyImportExportPage() {
  const data = await getAcademyData()
  const exports=[['Trainee dossier export',data.trainees.length,'/academy/trainees/dossier'],['Payment ledger export',data.payments.length,'/academy/payments'],['Attendance register export',data.attendance.length,'/academy/attendance'],['Certificate registry export',data.certificates.length,'/academy/certificates'],['Partner placement export',data.partners.length,'/academy/partners']]
  return <AppShell title="Academy Import / Export" subtitle="Operational data movement control." breadcrumbs={[{label:'Academy',href:'/academy'},{label:'Import Export'}]} actions={<PageAction href="/academy/documents/export">Document Export</PageAction>}>
    <div style={page}><PageHeader title="Academy import/export command" subtitle="Prepare clean operational exports and controlled future imports without touching production data manually."/>
    <Card><h2>Available controlled exports</h2><DataTable headers={['Dataset','Rows','Open source']} rows={exports.map((e:any)=>[e[0],e[1],<LinkButton href={e[2]}>Open</LinkButton>])}/></Card></div>
  </AppShell>
}
