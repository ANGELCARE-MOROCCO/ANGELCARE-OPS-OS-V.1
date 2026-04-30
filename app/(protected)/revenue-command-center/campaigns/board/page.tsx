import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { Badge, BoardCard, EmptyState, Kpi, Panel } from '../../_components/GrowthPhase4Primitives'

const STATUSES = ['draft', 'active', 'paused', 'completed']

export default async function CampaignBoardPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('bd_campaigns').select('*').order('created_at', { ascending: false })
  const campaigns = data || []
  const active = campaigns.filter((c: any) => c.status === 'active')
  const totalBudget = campaigns.reduce((sum: number, c: any) => sum + Number(c.budget || 0), 0)

  return (
    <AppShell
      title="Campaign Execution Board"
      subtitle="Operational board for B2B/B2C campaigns, ownership, objectives, budget, and execution status."
      breadcrumbs={[{ label: 'Revenue Command', href: '/revenue-command-center' }, { label: 'Campaigns', href: '/revenue-command-center/campaigns' }, { label: 'Board' }]}
      actions={<PageAction href="/revenue-command-center/tasks/new">Create Campaign Task</PageAction>}
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }}>
          <Kpi title="Campaigns" value={campaigns.length} sub="total campaigns" />
          <Kpi title="Active" value={active.length} sub="currently running" tone="#16a34a" />
          <Kpi title="Budget" value={`${totalBudget.toLocaleString('fr-FR')} MAD`} sub="declared spend" tone="#2563eb" />
        </section>

        <div style={boardStyle}>
          {STATUSES.map((status) => {
            const items = campaigns.filter((c: any) => (c.status || 'draft') === status)
            return (
              <Panel key={status} title={`${status.toUpperCase()} (${items.length})`}>
                <div style={{ display: 'grid', gap: 12 }}>
                  {items.length ? items.map((c: any) => (
                    <BoardCard
                      key={c.id}
                      href={`/revenue-command-center/campaigns`}
                      title={c.name || 'Unnamed campaign'}
                      subtitle={c.objective || c.target_segment || 'No objective defined.'}
                      badge={<Badge tone={status === 'active' ? '#16a34a' : status === 'paused' ? '#d97706' : '#2563eb'}>{status}</Badge>}
                      value={`${Number(c.budget || 0).toLocaleString('fr-FR')} MAD`}
                    />
                  )) : <EmptyState title="Empty lane" text="No campaigns here." />}
                </div>
              </Panel>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}

const boardStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(280px,1fr))', gap: 16, alignItems: 'start', overflowX: 'auto' }
