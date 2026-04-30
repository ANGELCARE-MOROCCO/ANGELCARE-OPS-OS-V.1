import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { calculateProspectSignal } from '../../_lib/executionIntelligence'
import { EmptyState, Panel, WorkCard } from '../../_components/ExecutionPhase2Primitives'

const STAGES = ['prospecting', 'contacted', 'qualified', 'appointment', 'proposal', 'negotiation', 'won', 'lost']

export default async function ProspectPipelinePage() {
  const supabase = await createClient()
  const { data } = await supabase.from('bd_prospects').select('*').eq('is_archived', false).order('created_at', { ascending: false })
  const prospects = (data || []).map((p: any) => ({ ...p, signal: calculateProspectSignal(p) }))

  return (
    <AppShell title="Prospect Pipeline" subtitle="Pipeline board with explicit execution signals and next-action enforcement." breadcrumbs={[{ label: 'Revenue Command', href: '/revenue-command-center' }, { label: 'Prospects', href: '/revenue-command-center/prospects' }, { label: 'Pipeline' }]} actions={<PageAction href="/revenue-command-center/prospects/new">New Prospect</PageAction>}>
      <div style={boardStyle}>{STAGES.map((stage) => { const items = prospects.filter((p: any) => (p.stage || 'prospecting') === stage); return <Panel key={stage} title={`${stage.toUpperCase()} (${items.length})`}><div style={{ display: 'grid', gap: 12 }}>{items.length ? items.map((p: any) => <WorkCard key={p.id} title={p.name || 'Unnamed prospect'} description={p.signal.reason} level={p.signal.level} score={p.signal.score} href={`/revenue-command-center/prospects/${p.id}`} meta={p.signal.action} />) : <EmptyState title="Empty stage" text="No prospects in this stage." />}</div></Panel> })}</div>
    </AppShell>
  )
}
const boardStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(8,minmax(280px,1fr))', gap: 16, alignItems: 'start', overflowX: 'auto' }
