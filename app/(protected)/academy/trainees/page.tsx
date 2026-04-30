import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getAcademyData } from '../_data'
import { createTrainee, updateTraineeStatus } from '../_actions'
import { PageHeader, Card, DataTable, Field, Input, Select, Textarea, Submit, Badge, LinkButton, page, formGrid } from '../_components/AcademyUI'
import { TRAINEE_STATUSES } from '../_lib/academyWorkflow'

export default async function TraineesPage(){
 const data=await getAcademyData()
 return <AppShell title="Trainees" subtitle="Permanent folders with serial numbers, lifecycle status and cross-module jumps." breadcrumbs={[{label:'Academy',href:'/academy'},{label:'Trainees'}]} actions={<PageAction href="/academy">Command Center</PageAction>}>
 <div style={page}><PageHeader title="Permanent Trainee Folder System" subtitle="Create and classify Academy trainees. Each trainee receives a unique compliance serial automatically." />
 <Card><h2>Create trainee</h2><form action={createTrainee} style={formGrid}><Field label="Full name"><Input name="full_name" required /></Field><Field label="Phone"><Input name="phone" /></Field><Field label="Email"><Input name="email" /></Field><Field label="City"><Input name="city" /></Field><Field label="Source"><Input name="source" placeholder="Facebook, referral, school..." /></Field><Field label="Status"><Select name="status">{TRAINEE_STATUSES.map(s=><option key={s}>{s}</option>)}</Select></Field><Field label="Notes"><Textarea name="notes" /></Field><Submit>Create trainee</Submit></form></Card>
 <Card><h2>Saved trainees</h2><DataTable headers={['Trainee','Serial','Status','Eligibility','Controls']} rows={data.trainees.map((t:any)=>[<><strong>{t.full_name}</strong><br/><small>{t.city||'—'} · {t.phone||'—'}</small></>,t.serial_number||'—',<Badge>{t.status}</Badge>,<Badge>{t.eligibility_status}</Badge>,<div style={{display:'grid',gap:8}}><form action={updateTraineeStatus} style={{display:'flex',gap:6}}><input type="hidden" name="trainee_id" value={t.id}/><select name="status">{TRAINEE_STATUSES.map(s=><option key={s} selected={s===t.status}>{s}</option>)}</select><button>Update</button></form><div style={{display:'flex',gap:6,flexWrap:'wrap'}}><LinkButton href="/academy/eligibility">Eligibility</LinkButton><LinkButton href="/academy/enrollments">Enroll</LinkButton><LinkButton href="/academy/payments">Payment</LinkButton><LinkButton href="/academy/attendance">Attendance</LinkButton><LinkButton href="/academy/certificates">Certificate</LinkButton></div></div>])}/></Card></div></AppShell>
}
