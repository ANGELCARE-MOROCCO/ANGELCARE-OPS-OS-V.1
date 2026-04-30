import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { Badge, BoardCard, EmptyState, Kpi, Panel, scoreTone } from '../../_components/GrowthPhase4Primitives'

export default async function MarketCoveragePage() {
  const supabase = await createClient()
  const { data } = await supabase.from('bd_market_segments').select('*').order('potential_score', { ascending: false })
  const segments = data || []
  const highPotential = segments.filter((s: any) => Number(s.potential_score || 0) >= 75)
  const hardMarkets = segments.filter((s: any) => Number(s.difficulty_score || 0) >= 75)

  const byCity = segments.reduce((acc: Record<string, any[]>, seg: any) => {
    const city = seg.city || 'Unknown'
    acc[city] = acc[city] || []
    acc[city].push(seg)
    return acc
  }, {})

  return (
    <AppShell
      title="Market Coverage"
      subtitle="Market mapping board for city clusters, segment opportunities, and expansion difficulty."
      breadcrumbs={[{ label: 'Revenue Command', href: '/revenue-command-center' }, { label: 'Market Mapping', href: '/revenue-command-center/market-mapping' }, { label: 'Coverage' }]}
      actions={<PageAction href="/revenue-command-center/tasks/new">Create Market Task</PageAction>}
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }}>
          <Kpi title="Segments" value={segments.length} sub="market records" />
          <Kpi title="High Potential" value={highPotential.length} sub="priority zones" tone="#16a34a" />
          <Kpi title="High Difficulty" value={hardMarkets.length} sub="requires strategy" tone="#dc2626" />
        </section>

        {Object.keys(byCity).length ? Object.entries(byCity).map(([city, items]) => (
          <Panel key={city} title={city} subtitle={`${items.length} market segments mapped`}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }}>
              {items.map((seg: any) => {
                const tone = scoreTone(Number(seg.potential_score || 0))
                return <BoardCard key={seg.id} href="/revenue-command-center/market-mapping" title={seg.name || 'Unnamed segment'} subtitle={`${seg.category || 'category'} • Difficulty ${seg.difficulty_score || 0}/100`} badge={<Badge tone={tone.color}>{tone.icon} {tone.label}</Badge>} value={`${seg.potential_score || 0}/100`} />
              })}
            </div>
          </Panel>
        )) : <Panel><EmptyState title="No market segments" text="Add market segments to activate coverage intelligence." /></Panel>}
      </div>
    </AppShell>
  )
}
