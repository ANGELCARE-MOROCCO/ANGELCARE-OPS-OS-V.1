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

export default async function ExecutionEnginePage() {
  const data = await getOpsosExecutionData()
  return (
    <AppShell title="OPSOS Execution Engine" subtitle="Workflow, actions and escalation command" breadcrumbs={[{ label: 'OPS OS', href: '/enterprise-command' }, { label: 'Execution Engine' }]} actions={<PageAction href="/execution-engine/workflows/new" variant="light">New Workflow</PageAction>}>
      <ExecShell>
        <ExecNav items={nav} />
        <ExecHero
          eyebrow="Enterprise Execution Engineering"
          title="OPSOS Execution Engine"
          subtitle="This is the missing foundation between dashboards and real enterprise operations: workflows, command actions, escalations and cross-module sync events."
          tone="blue"
          stats={[
            { label: 'Open workflows', value: data.openWorkflows.length },
            { label: 'Command actions', value: data.openActions.length },
            { label: 'Escalations', value: data.openEscalations.length },
            { label: 'Sync events', value: data.syncEvents.length },
          ]}
          actions={<><ExecButton href="/execution-engine/workflows/new" tone="green">Create Workflow</ExecButton><ExecButton href="/execution-engine/command-actions" tone="amber">Command Actions</ExecButton><ExecButton href="/execution-engine/escalations" tone="red">Escalations</ExecButton></>}
        />
        <div style={execGrid}>{data.metrics.map((m) => <ExecMetric key={m.label} {...m} />)}</div>
        <div style={{ height: 22 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 420px', gap: 20 }}>
          <ExecPanel title="Active Workflow Chains" subtitle="Lifecycle execution chains across HR, revenue, market and academy." tone="purple">
            {data.openWorkflows.map((w) => <ExecRow key={w.id} title={w.title} meta={`${w.module_key} · ${w.workflow_type} · step: ${w.current_step || 'created'} · ${w.progress}%`} status={w.status} href={w.target_route || '/execution-engine/workflows'} tone={w.priority === 'high' ? 'amber' : 'purple'} />)}
          </ExecPanel>
          <ExecPanel title="Command Queue" subtitle="Pending operational command actions." tone="amber">
            {data.openActions.slice(0, 12).map((a) => <ExecRow key={a.id} title={a.title} meta={`${a.module_key} · ${a.action_type} · ${a.route}`} status={a.priority} href={a.route} tone={a.priority === 'high' ? 'red' : 'amber'} />)}
          </ExecPanel>
        </div>
      </ExecShell>
    </AppShell>
  )
}
