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

const routes = ['/execution-engine','/execution-engine/workflows','/execution-engine/workflows/new','/execution-engine/command-actions','/execution-engine/escalations','/execution-engine/sync-map','/execution-engine/final-qa']

export default async function FinalQAPage() {
  const data = await getOpsosExecutionData()
  return (
    <AppShell title="Execution Engine Final QA" subtitle="Deployment and route smoke-test" breadcrumbs={[{ label: 'Execution Engine', href: '/execution-engine' }, { label: 'Final QA' }]} actions={<PageAction href="/execution-engine" variant="light">Engine</PageAction>}>
      <ExecShell>
        <ExecNav items={nav} />
        <ExecHero eyebrow="Execution Engine QA" title="Final QA and Smoke Test" subtitle="Validate routes, workflows, command actions, escalations and sync event surfaces before deployment." tone="green" stats={[{ label: 'Routes', value: routes.length }, { label: 'Workflows', value: data.workflows.length }, { label: 'Actions', value: data.actions.length }, { label: 'Escalations', value: data.escalations.length }]} />
        <div style={execGrid}>{data.metrics.map((m) => <ExecMetric key={m.label} {...m} />)}</div>
        <div style={{ height: 22 }} />
        <ExecPanel title="Smoke-test routes" subtitle="Open each route after build/deployment." tone="green">
          {routes.map((route) => <ExecRow key={route} title={route} meta="Execution Engine route" status="open" href={route} tone="green" />)}
        </ExecPanel>
      </ExecShell>
    </AppShell>
  )
}
