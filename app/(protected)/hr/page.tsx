import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRMaxPhase1Snapshot } from '@/lib/hr-unified/max-phase1-data'
import { createHRTaskMax } from '@/lib/hr-unified/max-phase1-actions'
import { HRHero, HRButton, HRMetric, HRGrid, HRPanel, HRRow, HRInput, HRSelect, HRTextarea, HRSubmit, formGrid } from './_components/HRMaxUI'

export default async function HRMaxPhase1Dashboard() {
  const snap = await getHRMaxPhase1Snapshot()
  const modules = [
    ['/hr/recruitment','Recruitment Command','Pipeline, candidates, stages and follow-up.'],
    ['/hr/recruitment/kanban','Recruitment Kanban','Move candidates through live hiring stages.'],
    ['/hr/tasks','HR Tasks','Execution engine for HR operators.'],
    ['/hr/approvals','Approvals Center','Management decisions and exceptions.'],
    ['/hr/executive','Executive Cockpit','Board-level HR risk and workload visibility.'],
    ['/hr/openings','Openings','Existing V1 openings workspace.'],
    ['/hr/staff','Staff 360','Existing staff profile workspace.'],
    ['/hr/attendance','Attendance','Existing attendance control.'],
    ['/hr/rosters','Rosters','Existing roster planning.'],
  ]

  return (
    <AppShell title="HR MAX Command Center" subtitle="Heavy operational HR command layer for AngelCare." breadcrumbs={[{label:'HR'}]} actions={<><PageAction href="/hr/recruitment/candidates">New Candidate</PageAction><PageAction href="/hr/tasks" variant="light">Tasks</PageAction></>}>
      <HRHero title="AngelCare HR MAX — Operational Command Layer" subtitle="This Phase 1 pack upgrades HR into a stronger operational workspace: recruitment command, candidate Kanban, task engine, approvals center, executive cockpit and premium dashboard components." actions={<><HRButton href="/hr/recruitment/candidates" variant="light">+ Candidate</HRButton><HRButton href="/hr/recruitment/kanban" variant="blue">Kanban</HRButton><HRButton href="/hr/tasks" variant="light">Task Engine</HRButton><HRButton href="/hr/approvals" variant="light">Approvals</HRButton></>} />
      <HRGrid min={210}>{snap.metrics.map((m:any)=><HRMetric key={m.label} {...m}/>)}</HRGrid>

      <div style={{height:22}} />
      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.25fr) 420px',gap:20}}>
        <HRPanel title="Live HR command queue" subtitle="Open tasks, approvals, recruitment moves and risks.">
          {[...snap.tasks.slice(0,8), ...snap.approvals.slice(0,5), ...snap.candidates.slice(0,5)].slice(0,16).map((x:any)=><HRRow key={x.id} title={x.title || x.full_name || 'HR action'} meta={`${x.task_type || x.approval_type || x.source || 'HR'} • ${x.priority || x.stage || 'normal'}`} status={x.status || x.stage} href={x.full_name ? `/hr/recruitment/candidates/${x.id}` : undefined}/>)}
        </HRPanel>

        <HRPanel title="Create HR execution task" subtitle="A real synchronized HR task written to hr_execution_tasks.">
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

      <div style={{height:22}} />
      <HRPanel title="HR MAX module map" subtitle="Phase 1 connects the new heavy execution layer to your existing working V1/V2 HR base.">
        <HRGrid min={260}>{modules.map(([href,title,desc])=><a key={href} href={href} style={{display:'block',padding:18,border:'1px solid #e2e8f0',borderRadius:22,background:'#f8fafc',textDecoration:'none',color:'#0f172a'}}>
          <h3 style={{margin:'0 0 6px',fontSize:19}}>{title}</h3>
          <p style={{margin:0,color:'#64748b',fontWeight:700,lineHeight:1.5}}>{desc}</p>
        </a>)}</HRGrid>
      </HRPanel>
    </AppShell>
  )
}
