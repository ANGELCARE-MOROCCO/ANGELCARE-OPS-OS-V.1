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

export default async function SyncMapPage() {
  const data = await getOpsosExecutionData()
  return (
    <AppShell title="Execution Sync Map" subtitle="Cross-module event propagation" breadcrumbs={[{ label: 'Execution Engine', href: '/execution-engine' }, { label: 'Sync Map' }]} actions={<PageAction href="/execution-engine" variant="light">Engine</PageAction>}>
      <ExecShell>
        <ExecNav items={nav} />
        <ExecHero eyebrow="Sync Event Map" title="Cross-Module Synchronization Map" subtitle="Visualize how workflows, command actions and escalations create sync events between modules." tone="cyan" stats={[{ label: 'Events', value: data.syncEvents.length }, { label: 'Workflows', value: data.workflows.length }, { label: 'Actions', value: data.actions.length }]} />
        <ExecPanel title="Sync Event Stream" subtitle="Recorded cross-module execution signals." tone="cyan">
          {data.syncEvents.map((event: any) => <ExecRow key={event.id} title={event.event_type || 'sync_event'} meta={`${event.source_module || 'global'} → ${event.target_module || 'global'} · ${event.summary || ''}`} status={event.status || 'ok'} tone="cyan" />)}
        </ExecPanel>
      </ExecShell>
    </AppShell>
  )
}
