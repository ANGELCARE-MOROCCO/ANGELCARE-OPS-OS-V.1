import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRMaxPhase1Snapshot } from '@/lib/hr-unified/max-phase1-data'
import { createApprovalMax, decideApprovalMax } from '@/lib/hr-unified/max-phase1-actions'
import { HRHero, HRMetric, HRGrid, HRPanel, HRRow, HRInput, HRSelect, HRTextarea, HRSubmit } from '../_components/HRMaxUI'

export default async function ApprovalsPage() {
  const snap = await getHRMaxPhase1Snapshot()
  return (
    <AppShell title="HR Approvals Center" subtitle="Approve or reject HR exceptions and decisions." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Approvals'}]} actions={<PageAction href="/hr">HR Dashboard</PageAction>}>
      <HRHero title="HR Approvals Center" subtitle="Decision control for recruitment, attendance, onboarding, documents and workforce exceptions." />
      <HRGrid min={210}>{snap.metrics.slice(0,4).map((m:any)=><HRMetric key={m.label} {...m}/>)}</HRGrid>
      <div style={{height:22}} />
      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 420px',gap:20}}>
        <HRPanel title="Approval queue" subtitle="Approve/reject actions are real Supabase updates.">
          {snap.approvals.slice(0,40).map((a:any)=>(
            <div key={a.id} style={{borderBottom:'1px solid #f1f5f9',padding:'12px 0'}}>
              <HRRow title={a.title} meta={`${a.approval_type || 'general'} • ${a.requested_reason || 'No reason'}`} status={a.status} />
              <form action={decideApprovalMax} style={{display:'flex',gap:8,marginTop:8,flexWrap:'wrap'}}>
                <input type="hidden" name="id" value={a.id} />
                <select name="status" defaultValue={a.status || 'pending'} style={{height:34,borderRadius:10,border:'1px solid #cbd5e1',fontWeight:800}}>
                  {['pending','approved','rejected','needs_more_info'].map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <input name="decision_notes" placeholder="Decision notes" style={{height:34,borderRadius:10,border:'1px solid #cbd5e1',padding:'0 10px',fontWeight:700,flex:1}} />
                <HRSubmit>Decide</HRSubmit>
              </form>
            </div>
          ))}
        </HRPanel>
        <HRPanel title="Create approval request" subtitle="Add a management decision request.">
          <form action={createApprovalMax} style={{display:'grid',gap:13}}>
            <HRInput name="title" label="Approval title" required />
            <HRSelect name="approval_type" label="Type" options={['recruitment_decision','attendance_correction','onboarding_exception','document_validation','staff_change','roster_exception','performance_action']} />
            <HRSelect name="priority" label="Priority" options={['low','medium','high','urgent','critical']} />
            <HRInput name="entity_type" label="Entity type" defaultValue="hr" />
            <HRTextarea name="requested_reason" label="Reason" />
            <HRTextarea name="notes" label="Notes" />
            <HRSubmit>Create approval</HRSubmit>
          </form>
        </HRPanel>
      </div>
    </AppShell>
  )
}
