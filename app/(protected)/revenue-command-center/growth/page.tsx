import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { ActionLink, Kpi, Panel } from '../_components/GrowthPhase4Primitives'

export default async function GrowthWorkspacePage() {
  const supabase = await createClient()
  const [{ data: campaigns }, { data: appointments }, { data: partnerships }, { data: markets }] = await Promise.all([
    supabase.from('bd_campaigns').select('*'),
    supabase.from('bd_appointments').select('*'),
    supabase.from('bd_partnerships').select('*'),
    supabase.from('bd_market_segments').select('*'),
  ])

  return (
    <AppShell
      title="Growth Workspaces"
      subtitle="Expansion cockpit for campaigns, appointments, partnerships, and market mapping."
      breadcrumbs={[{ label: 'Revenue Command', href: '/revenue-command-center' }, { label: 'Growth' }]}
      actions={<PageAction href="/revenue-command-center/campaigns/board">Campaign Board</PageAction>}
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <section style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>PHASE 4 — GROWTH WORKSPACES</div>
            <h1 style={heroTitleStyle}>Turn business development into market expansion execution.</h1>
            <p style={heroTextStyle}>Manage campaigns, meetings, partnerships, and market segments from one revenue growth layer.</p>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }}>
          <Kpi title="Campaigns" value={(campaigns || []).length} sub="growth operations" tone="#2563eb" />
          <Kpi title="Appointments" value={(appointments || []).length} sub="scheduled touchpoints" tone="#7c3aed" />
          <Kpi title="Partnerships" value={(partnerships || []).length} sub="B2B pipeline" tone="#16a34a" />
          <Kpi title="Market Segments" value={(markets || []).length} sub="territory intelligence" tone="#d97706" />
        </section>

        <Panel title="Workspace Navigation" subtitle="Each workspace acts as a dedicated operational board.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }}>
            <ActionLink href="/revenue-command-center/campaigns/board">Campaign Execution</ActionLink>
            <ActionLink href="/revenue-command-center/appointments/command" variant="light">Appointments Command</ActionLink>
            <ActionLink href="/revenue-command-center/partnerships/pipeline" variant="light">Partnership Pipeline</ActionLink>
            <ActionLink href="/revenue-command-center/market-mapping/coverage" variant="light">Market Coverage</ActionLink>
          </div>
        </Panel>
      </div>
    </AppShell>
  )
}

const heroStyle: React.CSSProperties = { padding: 30, borderRadius: 32, color: '#fff', background: 'radial-gradient(circle at top left,#16a34a,#020617 68%)', boxShadow: '0 28px 70px rgba(15,23,42,.22)' }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#dcfce7', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 38, fontWeight: 950 }
const heroTextStyle: React.CSSProperties = { margin: '10px 0 0', color: '#dcfce7', fontWeight: 750, maxWidth: 820, lineHeight: 1.6 }
