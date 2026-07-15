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

const inputStyle: React.CSSProperties = { height: 42, borderRadius: 14, border: '1px solid #cbd5e1', padding: '0 12px', fontWeight: 750 }
const labelStyle: React.CSSProperties = { display: 'grid', gap: 7, color: '#334155', fontWeight: 900 }

export default function NewWorkflowPage() {
  return (
    <AppShell title="New Execution Workflow" subtitle="Create a cross-module workflow chain" breadcrumbs={[{ label: 'Execution Engine', href: '/execution-engine' }, { label: 'New Workflow' }]} actions={<PageAction href="/execution-engine/workflows" variant="light">Workflows</PageAction>}>
      <ExecShell>
        <ExecNav items={nav} />
        <ExecHero eyebrow="Create Workflow" title="New Execution Workflow" subtitle="Create a workflow chain connecting modules, actions and execution targets." tone="green" />
        <ExecPanel title="Workflow Setup" subtitle="Define the execution chain." tone="green">
          <form action={createOpsosWorkflow} style={{ display: 'grid', gap: 14, maxWidth: 900 }}>
            <label style={labelStyle}>Title<input name="title" required style={inputStyle} /></label>
            <label style={labelStyle}>Module<select name="module_key" defaultValue="global" style={inputStyle}>{['global','hr','staff','revenue','market','academy','operations'].map((x) => <option key={x} value={x}>{x}</option>)}</select></label>
            <label style={labelStyle}>Workflow type<select name="workflow_type" defaultValue="lifecycle" style={inputStyle}>{['lifecycle','approval','commercial','growth','training','risk','sync'].map((x) => <option key={x} value={x}>{x}</option>)}</select></label>
            <label style={labelStyle}>Priority<select name="priority" defaultValue="medium" style={inputStyle}>{['low','medium','high','critical'].map((x) => <option key={x} value={x}>{x}</option>)}</select></label>
            <label style={labelStyle}>Current step<input name="current_step" defaultValue="created" style={inputStyle} /></label>
            <label style={labelStyle}>Source route<input name="source_route" defaultValue="/enterprise-command" style={inputStyle} /></label>
            <label style={labelStyle}>Target route<input name="target_route" defaultValue="/execution-engine" style={inputStyle} /></label>
            <label style={labelStyle}>Notes<textarea name="notes" rows={5} style={{ ...inputStyle, height: 120, padding: 12 }} /></label>
            <button type="submit" style={{ justifySelf: 'start', border: '1px solid #047857', background: '#059669', color: 'white', borderRadius: 999, padding: '11px 16px', fontWeight: 950 }}>Create workflow</button>
          </form>
        </ExecPanel>
      </ExecShell>
    </AppShell>
  )
}
