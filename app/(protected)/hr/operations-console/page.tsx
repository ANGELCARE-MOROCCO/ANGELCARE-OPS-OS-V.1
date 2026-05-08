import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRPhase7Data } from '@/lib/hr-unified/max-phase7-data'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric, HRButton } from '../_components/HRMaxUI'

export default async function HROperationsConsolePage() {
  const data = await getHRPhase7Data()
  const commandItems = [...data.tasks.slice(0, 8), ...data.approvals.slice(0, 8), ...data.dailyOps.slice(0, 8)]

  const shortcuts = [
    ['/hr/quick-actions', 'Quick Actions', 'Fast operational shortcuts.'],
    ['/hr/command-queue', 'Command Queue', 'Tasks, approvals and daily ops.'],
    ['/hr/risk-center', 'Risk Center', 'Roster, attendance and document risks.'],
    ['/hr/daily-ops', 'Daily Ops', 'Daily HR operating log.'],
    ['/hr/navigation', 'Navigation Hub', 'Full HR route board.'],
    ['/hr/system-health', 'System Health', 'Route health and consistency.'],
  ]

  return (
    <AppShell
      title="HR Operations Console"
      subtitle="Phase 7 unified daily operations console."
      breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Operations Console' }]}
      actions={<PageAction href="/hr/navigation" variant="light">Navigation</PageAction>}
    >
      <HRHero
        title="HR Operations Console"
        subtitle="Daily operating console for HR agents: command queue, quick actions, risk center, route shortcuts and daily execution log."
        actions={<><HRButton href="/hr/quick-actions" variant="light">Quick Actions</HRButton><HRButton href="/hr/command-queue" variant="blue">Command Queue</HRButton><HRButton href="/hr/daily-ops" variant="light">Daily Ops</HRButton></>}
      />
      <HRGrid min={210}>{data.metrics.map((m: any) => <HRMetric key={m.label} {...m} />)}</HRGrid>
      <div style={{ height: 22 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 420px', gap: 20 }}>
        <HRPanel title="Live command stream" subtitle="Tasks, approvals and daily operating records.">
          {commandItems.map((item: any) => (
            <HRRow key={`${item.id}-${item.title}`} title={item.title || 'Command item'} meta={`${item.task_type || item.approval_type || item.ops_type || 'HR'} • ${item.priority || 'medium'}`} status={item.status || 'open'} />
          ))}
        </HRPanel>
        <HRPanel title="Console shortcuts" subtitle="Jump to the right HR workspace without 404-prone guesswork.">
          <div style={{ display: 'grid', gap: 10 }}>
            {shortcuts.map(([href, title, description]) => (
              <a key={href} href={href} style={{ display: 'block', padding: 14, border: '1px solid #e2e8f0', borderRadius: 16, background: '#f8fafc', textDecoration: 'none', color: '#0f172a' }}>
                <strong>{title}</strong>
                <p style={{ margin: '5px 0 0', color: '#64748b', fontWeight: 700 }}>{description}</p>
              </a>
            ))}
          </div>
        </HRPanel>
      </div>
    </AppShell>
  )
}
