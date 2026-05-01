import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { EmptyState, Kpi, Panel, ProspectScoreCard, formatDate, scoreTone } from '../_components/AIScoringPrimitives'
import { runAIScoring } from './actions'

export default async function AIScoringPage() {
  const supabase = await createClient()

  const [{ data: prospectsRaw }, { data: runsRaw }, { data: profile }] = await Promise.all([
    supabase.from('bd_prospects').select('*').eq('is_archived', false).order('ai_score', { ascending: false }),
    supabase.from('bd_scoring_runs').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('bd_scoring_profiles').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const prospects = prospectsRaw || []
  const runs = runsRaw || []
  const latest = runs[0]

  const scored = prospects.filter((p: any) => Number(p.ai_score || 0) > 0)
  const highPriority = prospects.filter((p: any) => Number(p.ai_score || 0) >= 75 || Number(p.ai_urgency_score || 0) >= 75)
  const highRisk = prospects.filter((p: any) => Number(p.ai_risk_score || 0) >= 65)
  const avgScore = scored.length ? Math.round(scored.reduce((sum: number, p: any) => sum + Number(p.ai_score || 0), 0) / scored.length) : 0
  const topRevenue = [...prospects].sort((a: any, b: any) => Number(b.ai_revenue_score || 0) - Number(a.ai_revenue_score || 0)).slice(0, 8)
  const topRisk = [...prospects].sort((a: any, b: any) => Number(b.ai_risk_score || 0) - Number(a.ai_risk_score || 0)).slice(0, 8)

  return (
    <AppShell
      title="AI Scoring Engine"
      subtitle="Tier 2 revenue intelligence: prospect score, fit score, urgency, risk, revenue quality, and next-best-action."
      breadcrumbs={[{ label: 'Revenue Command', href: '/revenue-command-center' }, { label: 'AI Scoring' }]}
      actions={<><PageAction href="/revenue-command-center/control-tower" variant="light">Control Tower</PageAction><PageAction href="/revenue-command-center/prospects/pipeline">Pipeline</PageAction></>}
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <section style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>TIER 2 — AI SCORING ENGINE</div>
            <h1 style={heroTitleStyle}>Rank prospects by revenue value, urgency, risk, and fit.</h1>
            <p style={heroTextStyle}>This layer gives managers and agents a scoring model that turns raw pipeline data into action priority.</p>
          </div>
          <form action={runAIScoring}>
            <button type="submit" style={heroButtonStyle}>Run AI Scoring</button>
          </form>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 12 }}>
          <Kpi title="Prospects" value={prospects.length} sub="active records" tone="#2563eb" />
          <Kpi title="Scored" value={scored.length} sub="with AI score" tone="#16a34a" />
          <Kpi title="Average" value={`${avgScore}%`} sub="AI score" tone={scoreTone(avgScore)} />
          <Kpi title="High Priority" value={highPriority.length} sub="score/urgency" tone="#7c3aed" />
          <Kpi title="High Risk" value={highRisk.length} sub="risk score 65+" tone="#dc2626" />
          <Kpi title="Last Run" value={latest ? formatDate(latest.created_at) : '—'} sub={profile?.name || 'default'} tone="#0f172a" />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
          <Panel title="Top Priority Prospects" subtitle="Highest total score or urgency.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
              {highPriority.length ? highPriority.slice(0, 8).map((p: any) => <ProspectScoreCard key={p.id} prospect={p} />) : <EmptyState title="No high-priority scores yet" text="Run AI scoring to generate priority prospects." />}
            </div>
          </Panel>

          <Panel title="Highest Risk Prospects" subtitle="Prospects likely to stall, leak, or need manager recovery.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
              {topRisk.length ? topRisk.map((p: any) => <ProspectScoreCard key={p.id} prospect={p} />) : <EmptyState title="No risk scores yet" text="Run AI scoring to detect high-risk prospects." />}
            </div>
          </Panel>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr .75fr', gap: 18, alignItems: 'start' }}>
          <Panel title="Revenue Quality Ranking" subtitle="Prospects ranked by revenue potential and conversion value.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 }}>
              {topRevenue.length ? topRevenue.map((p: any) => <ProspectScoreCard key={p.id} prospect={p} />) : <EmptyState title="No revenue ranking yet" text="Run AI scoring to rank revenue quality." />}
            </div>
          </Panel>

          <Panel title="Scoring Runs" subtitle="Audit trail of scoring executions.">
            <div style={{ display: 'grid', gap: 10 }}>
              {runs.length ? runs.map((run: any) => (
                <article key={run.id} style={runRowStyle}>
                  <strong>{formatDate(run.created_at)}</strong>
                  <span>Scored {run.prospects_scored} prospects</span>
                  <span>Average {run.avg_score}% • Priority {run.high_priority_count} • Risk {run.high_risk_count}</span>
                </article>
              )) : <EmptyState title="No scoring runs" text="Run AI scoring to create the first scoring audit." />}
            </div>
          </Panel>
        </section>
      </div>
    </AppShell>
  )
}

const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, padding: 30, borderRadius: 32, color: '#fff', background: 'radial-gradient(circle at top left,#7c3aed,#020617 68%)', boxShadow: '0 28px 70px rgba(15,23,42,.22)' }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#ede9fe', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 38, fontWeight: 950 }
const heroTextStyle: React.CSSProperties = { margin: '10px 0 0', color: '#ede9fe', fontWeight: 750, maxWidth: 820, lineHeight: 1.6 }
const heroButtonStyle: React.CSSProperties = { border: '1px solid rgba(255,255,255,.24)', borderRadius: 16, padding: '14px 18px', background: 'rgba(255,255,255,.12)', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const runRowStyle: React.CSSProperties = { display: 'grid', gap: 5, padding: 14, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }
