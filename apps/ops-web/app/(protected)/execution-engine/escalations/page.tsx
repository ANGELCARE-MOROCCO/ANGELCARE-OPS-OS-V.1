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
export default async function EscalationsPage() {
  const data = await getOpsosExecutionData()
  return (
    <AppShell title="Execution Escalations" subtitle="Cross-module risk escalation" breadcrumbs={[{ label: 'Execution Engine', href: '/execution-engine' }, { label: 'Escalations' }]} actions={<PageAction href="/execution-engine" variant="light">Engine</PageAction>}>
      <ExecShell>
        <ExecNav items={nav} />
        <ExecHero eyebrow="Escalation Command" title="Cross-Module Escalations" subtitle="Create and monitor risks that must move between departments, managers and executive command surfaces." tone="red" stats={[{ label: 'Escalations', value: data.escalations.length }, { label: 'Open', value: data.openEscalations.length }]} />
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 420px', gap: 20 }}>
          <ExecPanel title="Escalation Queue" subtitle="Risk items requiring follow-up." tone="red">
            {data.escalations.map((e: any) => <ExecRow key={e.id} title={e.title || 'Escalation'} meta={`${e.source_module || 'global'} → ${e.target_module || 'executive'} · ${e.summary || ''}`} status={e.severity || e.status || 'open'} href={e.route || '/execution-engine/escalations'} tone={(e.severity === 'critical' || e.severity === 'high') ? 'red' : 'amber'} />)}
          </ExecPanel>
          <ExecPanel title="Create Escalation" subtitle="Push a cross-module risk." tone="red">
            <form action={createOpsosEscalation} style={{ display: 'grid', gap: 10 }}>
              <input name="title" placeholder="Escalation title" required style={inputStyle} />
              <select name="source_module" defaultValue="global" style={inputStyle}>{['global','hr','staff','revenue','market','academy','operations'].map((x) => <option key={x} value={x}>{x}</option>)}</select>
              <select name="target_module" defaultValue="executive" style={inputStyle}>{['executive','hr','staff','revenue','market','academy','operations'].map((x) => <option key={x} value={x}>{x}</option>)}</select>
              <select name="severity" defaultValue="medium" style={inputStyle}>{['low','medium','high','critical'].map((x) => <option key={x} value={x}>{x}</option>)}</select>
              <input name="route" defaultValue="/execution-engine/escalations" style={inputStyle} />
              <textarea name="summary" rows={5} placeholder="Summary" style={{ borderRadius: 12, border: '1px solid #cbd5e1', padding: 10 }} />
              <button type="submit" style={{ border: '1px solid #b91c1c', background: '#dc2626', color: 'white', borderRadius: 999, padding: '10px 14px', fontWeight: 950 }}>Create escalation</button>
            </form>
          </ExecPanel>
        </div>
      </ExecShell>
    </AppShell>
  )
}
