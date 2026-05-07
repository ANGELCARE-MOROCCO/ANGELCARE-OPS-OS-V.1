import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { notFound } from 'next/navigation'
import { getAcademyData } from '../../_data'
import { updateAcademyRecord, deleteAcademyRecord, createAcademyAuditNote } from '../../_actions'
import { PageHeader, Card, DataTable, Field, Input, Textarea, Submit, LinkButton, ActionStrip, MiniCard, SectionTitle, DangerButton, PanelList, page, grid2, grid3, formGrid } from '../../_components/AcademyUI'

export default async function AcademyDetailPage({ params }: { params: { id: string } }) {
 const data = await getAcademyData()
 const record = (data as any)['graduation_followups'].find((x:any)=>x.id===params.id)
 if(!record) notFound()
 const title = record?.opportunity_type || record?.name || record?.title || record?.id
 const path = '/academy/graduation/' + params.id
 return <AppShell title="Graduation Follow-up Command Folder" subtitle="Deep Academy execution workspace" breadcrumbs={[{label:'Academy',href:'/academy'},{label:'Graduation Follow-ups',href:'/academy/graduation'},{label:String(title)}]} actions={<PageAction href="/academy/graduation">Back</PageAction>}>
 <div style={page}>
  <PageHeader title={String(title)} subtitle="Production management folder for execution, control, follow-up, audit and cross-module operations." actions={<ActionStrip><LinkButton href="/academy/graduation">All records</LinkButton><LinkButton href={`/academy/graduation/${params.id}/edit`}>Edit folder</LinkButton><LinkButton href="/academy/trainees">Trainees</LinkButton><LinkButton href="/academy/certificates">Certificates</LinkButton><LinkButton href="/academy/partners">Partners</LinkButton><LinkButton href="/academy/placement-intelligence">Placement Intelligence</LinkButton></ActionStrip>} />
  <div style={grid3}><MiniCard title="Record status" value={record.status || record.eligibility_status || 'active'} sub="Operational state"/><MiniCard title="Created" value={record.created_at ? String(record.created_at).slice(0,10) : '—'} sub="System timeline"/><MiniCard title="Owner ID" value={String(record.id).slice(0,8)} sub="Permanent reference"/></div>
  <div style={grid2}>
   <Card><SectionTitle title="Executive Snapshot" subtitle="All key fields currently saved for this Academy object."/><DataTable headers={['Field','Value']} rows={Object.entries(record).filter(([k])=>!['updated_at'].includes(k)).slice(0,28).map(([k,v]:any)=>[k,<span>{String(v ?? '—')}</span>])} /></Card>
   <Card><SectionTitle title="Execution Control Panels" subtitle="Use this folder to decide the next operational step."/><PanelList items={['Validate commercial readiness and missing data','Check linked trainee/course/group/payment dependencies','Add manager note for audit continuity','Route record to the correct Academy submodule','Escalate blocked items to governance or alerts']}/><form action={createAcademyAuditNote} style={{display:'grid',gap:10,marginTop:14}}><input type="hidden" name="entity" value="academy_graduation_followups"/><input type="hidden" name="entity_id" value={record.id}/><input type="hidden" name="path" value={path}/><Textarea name="note" placeholder="Manager note, decision, risk, next action..."/><Submit>Add audit note</Submit></form></Card>
  </div>
  <Card><SectionTitle title="Quick Production Update" subtitle="Update the operational data without leaving the folder."/><form action={updateAcademyRecord} style={formGrid}><input type="hidden" name="table" value="academy_graduation_followups"/><input type="hidden" name="id" value={record.id}/><input type="hidden" name="path" value={path}/><Field label="Trainee Id"><Input name="trainee_id" defaultValue={record?.trainee_id || ''} /></Field><Field label="Certificate Id"><Input name="certificate_id" defaultValue={record?.certificate_id || ''} /></Field><Field label="Partner Id"><Input name="partner_id" defaultValue={record?.partner_id || ''} /></Field><Field label="Opportunity Type"><Input name="opportunity_type" defaultValue={record?.opportunity_type || ''} /></Field><Field label="Status"><Input name="status" defaultValue={record?.status || ''} /></Field><Field label="Next Action"><Input name="next_action" defaultValue={record?.next_action || ''} /></Field><Field label="Next Action At"><Input name="next_action_at" defaultValue={record?.next_action_at || ''} /></Field><Field label="Notes"><Input name="notes" defaultValue={record?.notes || ''} /></Field><Submit>Save production update</Submit></form></Card>
  <div style={grid2}>
   <Card><SectionTitle title="Cross-module execution" subtitle="Jump to the Academy panels that normally act on this record."/><ActionStrip><LinkButton href="/academy/trainees">Trainees</LinkButton><LinkButton href="/academy/certificates">Certificates</LinkButton><LinkButton href="/academy/partners">Partners</LinkButton><LinkButton href="/academy/placement-intelligence">Placement Intelligence</LinkButton></ActionStrip></Card>
   <Card><SectionTitle title="Danger zone" subtitle="Only use after confirming this record is duplicate or wrong."/><form action={deleteAcademyRecord}><input type="hidden" name="table" value="academy_graduation_followups"/><input type="hidden" name="id" value={record.id}/><input type="hidden" name="path" value="/academy/graduation"/><DangerButton>Delete record</DangerButton></form></Card>
  </div>
 </div></AppShell>
}
