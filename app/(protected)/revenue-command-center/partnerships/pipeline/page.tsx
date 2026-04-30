import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { Badge, BoardCard, EmptyState, Kpi, Panel } from '../../_components/GrowthPhase4Primitives'

const STAGES = ['prospecting', 'contacted', 'negotiation', 'pilot', 'active', 'lost']

export default async function PartnershipPipelinePage() {
  const supabase = await createClient()
  const { data } = await supabase.from('bd_partnerships').select('*').order('created_at', { ascending: false })
  const partnerships = data || []
  const totalValue = partnerships.reduce((sum: number, p: any) => sum + Number(p.estimated_value || 0), 0)
  const strategic = partnerships.filter((p: any) => Number(p.strategic_value || 0) >= 75)

  return (
    <AppShell
      title="Partnership Pipeline"
      subtitle="B2B and institutional partnership pipeline with stage control, strategic value, and next-action pressure."
      breadcrumbs={[{ label: 'Revenue Command', href: '/revenue-command-center' }, { label: 'Partnerships', href: '/revenue-command-center/partnerships' }, { label: 'Pipeline' }]}
      actions={<PageAction href="/revenue-command-center/tasks/new">Create Partnership Task</PageAction>}
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }}>
          <Kpi title="Partnerships" value={partnerships.length} sub="total accounts" />
          <Kpi title="Strategic" value={strategic.length} sub="high strategic value" tone="#7c3aed" />
          <Kpi title="Pipeline Value" value={`${totalValue.toLocaleString('fr-FR')} MAD`} sub="estimated potential" tone="#16a34a" />
        </section>

        <div style={boardStyle}>
          {STAGES.map((stage) => {
            const items = partnerships.filter((p: any) => (p.stage || 'prospecting') === stage)
            return (
              <Panel key={stage} title={`${stage.toUpperCase()} (${items.length})`}>
                <div style={{ display: 'grid', gap: 12 }}>
                  {items.length ? items.map((p: any) => (
                    <BoardCard key={p.id} href="/revenue-command-center/partnerships" title={p.name || 'Unnamed partnership'} subtitle={`${p.organization_type || 'organization'} • ${p.city || 'No city'} • Next: ${p.next_action || 'missing'}`} badge={<Badge tone={Number(p.strategic_value || 0) >= 75 ? '#7c3aed' : '#2563eb'}>{stage}</Badge>} value={`${Number(p.estimated_value || 0).toLocaleString('fr-FR')} MAD`} />
                  )) : <EmptyState title="Empty lane" text="No partnerships in this stage." />}
                </div>
              </Panel>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}

const boardStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(280px,1fr))', gap: 16, alignItems: 'start', overflowX: 'auto' }
