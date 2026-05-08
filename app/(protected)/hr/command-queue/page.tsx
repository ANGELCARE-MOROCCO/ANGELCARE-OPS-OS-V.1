import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRPhase7Data } from '@/lib/hr-unified/max-phase7-data'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric } from '../_components/HRMaxUI'

export default async function HRCommandQueuePage() {
  const data = await getHRPhase7Data()
  const rows = [...data.tasks, ...data.approvals, ...data.dailyOps].sort((a: any, b: any) => String(b.created_at || '').localeCompare(String(a.created_at || '')))

  return (
    <AppShell title="HR Command Queue" subtitle="Unified queue of tasks, approvals and daily ops." breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Command Queue' }]} actions={<PageAction href="/hr/operations-console" variant="light">Console</PageAction>}>
      <HRHero title="HR Command Queue" subtitle="Central queue for execution tasks, approvals and daily operating records." />
      <HRGrid min={210}>{data.metrics.slice(0, 4).map((m: any) => <HRMetric key={m.label} {...m} />)}</HRGrid>
      <div style={{ height: 22 }} />
      <HRPanel title="Unified command queue" subtitle="Sorted by latest created records.">
        {rows.slice(0, 80).map((item: any) => (
          <HRRow key={`${item.id}-${item.title}`} title={item.title || 'Command item'} meta={`${item.task_type || item.approval_type || item.ops_type || 'HR'} • ${item.priority || 'medium'}`} status={item.status || 'open'} />
        ))}
      </HRPanel>
    </AppShell>
  )
}
