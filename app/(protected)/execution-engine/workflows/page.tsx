import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getOpsosExecutionData } from '@/lib/opsos-execution/data'
import { createOpsosWorkflow, createOpsosCommandAction, createOpsosEscalation, updateOpsosWorkflowStatus } from '@/lib/opsos-execution/actions'
import { ExecButton, ExecHero, ExecMetric, ExecNav, ExecPanel, ExecRow, ExecShell, execGrid } from '@/components/angelcare-enterprise/ExecutionEngineUI'

const nav = [
  { label: 'Engine', href: '/execution-engine', tone: 'blue' as const },
  { label: 'Workflows', href: '/execution-engine/workflows', tone: 'purple' as const },
  { label: 'New Workflow', href: '/execution-engine/workflows/new', tone: 'green' as const },
  { label: 'Command Actions', href: '/execution-engine/command-actions', tone: 'amber' as const },
  { label: 'Escalations', href: '/execution-engine/escalations', tone: 'red' as const },
  { label: 'Sync Map', href: '/execution-engine/sync-map', tone: 'cyan' as const },
  { label: 'Final QA', href: '/execution-engine/final-qa', tone: 'slate' as const },
]

export default async function WorkflowsPage() {
  const data = await getOpsosExecutionData()
  return (
    <AppShell title="Execution Workflows" subtitle="Lifecycle workflow chains" breadcrumbs={[{ label: 'Execution Engine', href: '/execution-engine' }, { label: 'Workflows' }]} actions={<PageAction href="/execution-engine/workflows/new" variant="light">New Workflow</PageAction>}>
      <ExecShell>
        <ExecNav items={nav} />
        <ExecHero eyebrow="Workflow Command" title="Lifecycle Workflows" subtitle="Track and progress cross-module workflows from creation to execution." tone="purple" stats={[{ label: 'Total', value: data.workflows.length }, { label: 'Open', value: data.openWorkflows.length }]} />
        <ExecPanel title="Workflow Queue" subtitle="Update workflow progress and state." tone="purple">
          {data.workflows.map((w) => (
            <div key={w.id} style={{ borderBottom: '1px solid #f1f5f9', padding: '13px 0' }}>
              <ExecRow title={w.title} meta={`${w.module_key} · ${w.workflow_type} · ${w.current_step || 'created'} · ${w.progress}%`} status={w.status} href={w.target_route || '/execution-engine'} tone={w.priority === 'high' ? 'amber' : 'purple'} />
              <form action={updateOpsosWorkflowStatus} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 120px auto', gap: 8, alignItems: 'end', marginTop: 8 }}>
                <input type="hidden" name="workflow_id" value={w.id} />
                <select name="status" defaultValue={w.status} style={{ height: 36, borderRadius: 10, border: '1px solid #cbd5e1' }}>{['open','in_progress','waiting','blocked','completed','cancelled'].map((x) => <option key={x} value={x}>{x}</option>)}</select>
                <input name="current_step" defaultValue={w.current_step || ''} placeholder="Current step" style={{ height: 36, borderRadius: 10, border: '1px solid #cbd5e1', padding: '0 10px' }} />
                <input name="progress" defaultValue={w.progress} type="number" min="0" max="100" style={{ height: 36, borderRadius: 10, border: '1px solid #cbd5e1', padding: '0 10px' }} />
                <button type="submit" style={{ height: 36, borderRadius: 999, border: '1px solid #1d4ed8', background: '#2563eb', color: 'white', fontWeight: 950, padding: '0 12px' }}>Update</button>
              </form>
            </div>
          ))}
        </ExecPanel>
      </ExecShell>
    </AppShell>
  )
}
