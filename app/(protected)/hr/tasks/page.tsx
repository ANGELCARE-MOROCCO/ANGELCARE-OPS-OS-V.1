import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRMaxPhase1Snapshot } from '@/lib/hr-unified/max-phase1-data'
import { createHRTaskMax, updateHRTaskStatusMax } from '@/lib/hr-unified/max-phase1-actions'
import { HRHero, HRMetric, HRGrid, HRPanel, HRRow, HRInput, HRSelect, HRTextarea, HRSubmit } from '../_components/HRMaxUI'

export default async function HRTasksPage() {
  const snap = await getHRMaxPhase1Snapshot()
  return (
    <AppShell title="HR Task Engine" subtitle="Create, manage and complete HR operational tasks." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Tasks'}]} actions={<PageAction href="/hr">HR Dashboard</PageAction>}>
      <HRHero title="HR Execution Task Engine" subtitle="A central execution layer for recruitment, onboarding, staff, attendance, documents and approvals." />
      <HRGrid min={210}>{snap.metrics.slice(0,4).map((m:any)=><HRMetric key={m.label} {...m}/>)}</HRGrid>
      <div style={{height:22}} />
      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 430px',gap:20}}>
        <HRPanel title="Task queue" subtitle="Status update controls are actionable.">
          {snap.tasks.slice(0,40).map((t:any)=>(
            <div key={t.id} style={{borderBottom:'1px solid #f1f5f9',padding:'12px 0'}}>
              <HRRow title={t.title} meta={`${t.task_type || 'general'} • ${t.priority || 'medium'} • ${t.due_at || 'no due date'}`} status={t.status || t.stage} />
              <form action={updateHRTaskStatusMax} style={{display:'flex',gap:8,marginTop:8}}>
                <input type="hidden" name="id" value={t.id} />
                <select name="status" defaultValue={t.status || 'open'} style={{height:34,borderRadius:10,border:'1px solid #cbd5e1',fontWeight:800}}>
                  {['open','in_progress','blocked','completed','cancelled'].map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <HRSubmit>Update</HRSubmit>
              </form>
            </div>
          ))}
        </HRPanel>
        <HRPanel title="Create HR task" subtitle="Actionable task creation form.">
          <form action={createHRTaskMax} style={{display:'grid',gap:13}}>
            <HRInput name="title" label="Task title" required />
            <HRSelect name="task_type" label="Task type" options={['recruitment_pipeline','candidate_screening','interview_followup','onboarding_documents','staff_profile_update','attendance_control','roster_planning','approval_followup','document_compliance','performance_review']} />
            <HRSelect name="module_area" label="Area" options={['recruitment','onboarding','staff','attendance','rosters','approvals','documents','executive']} />
            <HRSelect name="priority" label="Priority" options={['low','medium','high','urgent','critical']} />
            <HRInput name="due_at" label="Due date/time" type="datetime-local" />
            <HRTextarea name="description" label="Execution details" />
            <HRSubmit>Create task</HRSubmit>
          </form>
        </HRPanel>
      </div>
    </AppShell>
  )
}
