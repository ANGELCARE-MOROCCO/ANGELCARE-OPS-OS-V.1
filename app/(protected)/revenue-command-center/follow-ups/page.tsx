import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { calculateProspectSignal } from '../_lib/executionIntelligence'
import { EmptyState, Kpi, Panel, WorkCard } from '../_components/ExecutionPhase2Primitives'

export default async function FollowUpsPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('bd_prospects').select('*').eq('is_archived', false).order('created_at', { ascending: false })
  const prospects = (data || []).map((p: any) => ({ ...p, signal: calculateProspectSignal(p) }))
  const queue = prospects.filter((p: any) => p.signal.level !== 'on_track').sort((a: any, b: any) => b.signal.score - a.signal.score)

  return (
    <AppShell title="Follow-up Engine" subtitle="Forgotten prospects, missing next actions, and inactive high-value opportunities are surfaced here." breadcrumbs={[{ label: 'Revenue Command', href: '/revenue-command-center' }, { label: 'Follow-ups' }]} actions={<PageAction href="/revenue-command-center/prospects/pipeline" variant="light">Pipeline</PageAction>}>
      <div style={{ display: 'grid', gap: 18 }}>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }}>
          <Kpi title="Follow-ups Required" value={queue.length} sub="not on track" tone="#dc2626" />
          <Kpi title="Critical" value={queue.filter((x: any) => x.signal.level === 'critical').length} sub="act now" tone="#dc2626" />
          <Kpi title="At Risk" value={queue.filter((x: any) => x.signal.level === 'at_risk').length} sub="resolve soon" tone="#d97706" />
        </section>
        <Panel title="Follow-up Queue" subtitle="Prioritized by value, inactivity, and missing next action.">{queue.length ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }}>{queue.map((p: any) => <WorkCard key={p.id} title={p.name || 'Unnamed prospect'} description={p.signal.reason} level={p.signal.level} score={p.signal.score} href={`/revenue-command-center/prospects/${p.id}`} meta={p.signal.action} />)}</div> : <EmptyState title="No follow-ups required" text="All prospects are currently on track." />}</Panel>
      </div>
    </AppShell>
  )
}
