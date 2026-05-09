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

const inputStyle: React.CSSProperties = { height: 38, borderRadius: 12, border: '1px solid #cbd5e1', padding: '0 10px', fontWeight: 750 }
export default async function CommandActionsPage() {
  const data = await getOpsosExecutionData()
  return (
    <AppShell title="Command Actions" subtitle="Create and track operational actions" breadcrumbs={[{ label: 'Execution Engine', href: '/execution-engine' }, { label: 'Command Actions' }]} actions={<PageAction href="/execution-engine" variant="light">Engine</PageAction>}>
      <ExecShell>
        <ExecNav items={nav} />
        <ExecHero eyebrow="Command Queue" title="Operational Command Actions" subtitle="Actions are the execution units that turn dashboards into real operating tasks." tone="amber" stats={[{ label: 'Actions', value: data.actions.length }, { label: 'Open', value: data.openActions.length }]} />
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 420px', gap: 20 }}>
          <ExecPanel title="Action Queue" subtitle="Pending and historical command actions." tone="amber">
            {data.actions.map((a) => <ExecRow key={a.id} title={a.title} meta={`${a.module_key} · ${a.action_type} · ${a.route}`} status={a.status} href={a.route} tone={a.priority === 'high' ? 'red' : 'amber'} />)}
          </ExecPanel>
          <ExecPanel title="Create Action" subtitle="Add an operational command item." tone="green">
            <form action={createOpsosCommandAction} style={{ display: 'grid', gap: 10 }}>
              <input name="title" placeholder="Action title" required style={inputStyle} />
              <select name="module_key" defaultValue="global" style={inputStyle}>{['global','hr','staff','revenue','market','academy','operations'].map((x) => <option key={x} value={x}>{x}</option>)}</select>
              <select name="action_type" defaultValue="execute" style={inputStyle}>{['execute','review','approve','assign','escalate','sync','publish','validate'].map((x) => <option key={x} value={x}>{x}</option>)}</select>
              <select name="priority" defaultValue="medium" style={inputStyle}>{['low','medium','high','critical'].map((x) => <option key={x} value={x}>{x}</option>)}</select>
              <input name="route" defaultValue="/enterprise-command" style={inputStyle} />
              <textarea name="notes" rows={5} placeholder="Notes" style={{ borderRadius: 12, border: '1px solid #cbd5e1', padding: 10 }} />
              <button type="submit" style={{ border: '1px solid #047857', background: '#059669', color: 'white', borderRadius: 999, padding: '10px 14px', fontWeight: 950 }}>Create action</button>
            </form>
          </ExecPanel>
        </div>
      </ExecShell>
    </AppShell>
  )
}
