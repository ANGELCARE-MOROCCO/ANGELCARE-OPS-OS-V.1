import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { notFound } from 'next/navigation'
import { getAcademyData } from '../../../_data'
import { updateAcademyRecord, deleteAcademyRecord, createAcademyAuditNote } from '../../../_actions'
import { PageHeader, Card, DataTable, Field, Input, Textarea, Submit, LinkButton, ActionStrip, MiniCard, SectionTitle, DangerButton, PanelList, page, grid2, grid3, formGrid } from '../../../_components/AcademyUI'

export default async function AcademyDetailPage({ params }: { params: { id: string } }) {
 const data = await getAcademyData()
 const record = (data as any)['certificates'].find((x:any)=>x.id===params.id)
 if(!record) notFound()
 const title = record?.certificate_number || record?.name || record?.title || record?.id
 const path = '/academy/certificates/' + params.id + '/edit'
 return <AppShell title="Certificate Edit & Execute" subtitle="Deep Academy execution workspace" breadcrumbs={[{label:'Academy',href:'/academy'},{label:'Certificates',href:'/academy/certificates'},{label:String(title)}]} actions={<PageAction href="/academy/certificates">Back</PageAction>}>
 <div style={page}>
  <PageHeader title={String(title)} subtitle="Production management folder for execution, control, follow-up, audit and cross-module operations." actions={<ActionStrip><LinkButton href="/academy/certificates">All records</LinkButton><LinkButton href={`/academy/certificates/${params.id}/edit`}>Edit folder</LinkButton><LinkButton href="/academy/trainees">Trainees</LinkButton><LinkButton href="/academy/courses">Courses</LinkButton><LinkButton href="/academy/graduation">Graduation</LinkButton><LinkButton href="/academy/documents">Documents</LinkButton><LinkButton href="/academy/reports">Reports</LinkButton></ActionStrip>} />
  <div style={grid3}><MiniCard title="Record status" value={record.status || record.eligibility_status || 'active'} sub="Operational state"/><MiniCard title="Created" value={record.created_at ? String(record.created_at).slice(0,10) : '—'} sub="System timeline"/><MiniCard title="Owner ID" value={String(record.id).slice(0,8)} sub="Permanent reference"/></div>
  <div style={grid2}>
   <Card><SectionTitle title="Executive Snapshot" subtitle="All key fields currently saved for this Academy object."/><DataTable headers={['Field','Value']} rows={Object.entries(record).filter(([k])=>!['updated_at'].includes(k)).slice(0,28).map(([k,v]:any)=>[k,<span>{String(v ?? '—')}</span>])} /></Card>
   <Card><SectionTitle title="Execution Control Panels" subtitle="Use this folder to decide the next operational step."/><PanelList items={['Validate commercial readiness and missing data','Check linked trainee/course/group/payment dependencies','Add manager note for audit continuity','Route record to the correct Academy submodule','Escalate blocked items to governance or alerts']}/><form action={createAcademyAuditNote} style={{display:'grid',gap:10,marginTop:14}}><input type="hidden" name="entity" value="academy_certificates"/><input type="hidden" name="entity_id" value={record.id}/><input type="hidden" name="path" value={path}/><Textarea name="note" placeholder="Manager note, decision, risk, next action..."/><Submit>Add audit note</Submit></form></Card>
  </div>
  <Card><SectionTitle title="Edit Production Fields" subtitle="Update the operational data without leaving the folder."/><form action={updateAcademyRecord} style={formGrid}><input type="hidden" name="table" value="academy_certificates"/><input type="hidden" name="id" value={record.id}/><input type="hidden" name="path" value={path}/><Field label="Trainee Id"><Input name="trainee_id" defaultValue={record?.trainee_id || ''} /></Field><Field label="Course Id"><Input name="course_id" defaultValue={record?.course_id || ''} /></Field><Field label="Certificate Number"><Input name="certificate_number" defaultValue={record?.certificate_number || ''} /></Field><Field label="Serial Number"><Input name="serial_number" defaultValue={record?.serial_number || ''} /></Field><Field label="Verification Hash"><Input name="verification_hash" defaultValue={record?.verification_hash || ''} /></Field><Field label="Status"><Input name="status" defaultValue={record?.status || ''} /></Field><Submit>Save production update</Submit></form></Card>
  <div style={grid2}>
   <Card><SectionTitle title="Cross-module execution" subtitle="Jump to the Academy panels that normally act on this record."/><ActionStrip><LinkButton href="/academy/trainees">Trainees</LinkButton><LinkButton href="/academy/courses">Courses</LinkButton><LinkButton href="/academy/graduation">Graduation</LinkButton><LinkButton href="/academy/documents">Documents</LinkButton><LinkButton href="/academy/reports">Reports</LinkButton></ActionStrip></Card>
   <Card><SectionTitle title="Danger zone" subtitle="Only use after confirming this record is duplicate or wrong."/><form action={deleteAcademyRecord}><input type="hidden" name="table" value="academy_certificates"/><input type="hidden" name="id" value={record.id}/><input type="hidden" name="path" value="/academy/certificates"/><DangerButton>Delete record</DangerButton></form></Card>
  </div>
 </div></AppShell>
}
