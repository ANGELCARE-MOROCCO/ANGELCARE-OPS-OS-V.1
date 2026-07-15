import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRPhase7Data } from '@/lib/hr-unified/max-phase7-data'
import { createDailyOperationPhase7, updateDailyOperationStatusPhase7 } from '@/lib/hr-unified/max-phase7-actions'
import { HRHero, HRPanel, HRRow, HRInput, HRSelect, HRTextarea, HRSubmit } from '../_components/HRMaxUI'

export default async function HRDailyOpsPage() {
  const data = await getHRPhase7Data()

  return (
    <AppShell title="HR Daily Ops" subtitle="Daily HR operating rhythm log." breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Daily Ops' }]} actions={<PageAction href="/hr/operations-console" variant="light">Console</PageAction>}>
      <HRHero title="HR Daily Operations Log" subtitle="Create and track daily HR operating actions, follow-ups and execution notes." />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 420px', gap: 20 }}>
        <HRPanel title="Daily operations queue" subtitle="Update status directly.">
          {data.dailyOps.map((item: any) => (
            <div key={item.id} style={{ borderBottom: '1px solid #f1f5f9', padding: '12px 0' }}>
              <HRRow title={item.title} meta={`${item.ops_type || 'daily_review'} • ${item.owner || 'HR'} • ${item.due_at || 'no due date'}`} status={item.status} />
              <form action={updateDailyOperationStatusPhase7} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input type="hidden" name="id" value={item.id} />
                <select name="status" defaultValue={item.status || 'open'} style={{ height: 34, borderRadius: 10, border: '1px solid #cbd5e1', fontWeight: 800 }}>
                  {['open', 'in_progress', 'blocked', 'completed', 'cancelled'].map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <HRSubmit>Update</HRSubmit>
              </form>
            </div>
          ))}
        </HRPanel>
        <HRPanel title="Create daily operation" subtitle="Add today’s HR operating action.">
          <form action={createDailyOperationPhase7} style={{ display: 'grid', gap: 12 }}>
            <HRInput name="title" label="Title" required />
            <HRSelect name="ops_type" label="Type" options={['daily_review', 'recruitment_followup', 'attendance_review', 'roster_review', 'document_review', 'onboarding_followup', 'approval_followup']} />
            <HRSelect name="priority" label="Priority" options={['low', 'medium', 'high', 'urgent']} />
            <HRInput name="owner" label="Owner" />
            <HRInput name="related_route" label="Related route" defaultValue="/hr" />
            <HRInput name="due_at" label="Due date/time" type="datetime-local" />
            <HRTextarea name="summary" label="Summary" />
            <HRTextarea name="next_action" label="Next action" />
            <HRTextarea name="notes" label="Notes" />
            <HRSubmit>Create daily op</HRSubmit>
          </form>
        </HRPanel>
      </div>
    </AppShell>
  )
}
