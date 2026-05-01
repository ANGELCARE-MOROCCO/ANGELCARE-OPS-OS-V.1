import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { computeRevenueSignals } from '@/lib/revenueDecisionEngine'
import { ActionLink, EmptyState, Kpi, Panel, SeverityCard, formatCurrency } from '../_components/ControlTowerPrimitives'
import { closeInsight, closeTowerAction, createTowerAction, generateControlTowerInsights } from './actions'

export default async function RevenueControlTowerPage() {
  const supabase = await createClient()

  const [
    { data: prospectsRaw },
    { data: tasksRaw },
    { data: appointmentsRaw },
    { data: insightsRaw },
    { data: actionsRaw },
    { data: forecastsRaw },
  ] = await Promise.all([
    supabase.from('bd_prospects').select('*'),
    supabase.from('bd_tasks').select('*'),
    supabase.from('bd_appointments').select('*'),
    supabase.from('bd_decision_insights').select('*').eq('status', 'open').order('created_at', { ascending: false }),
    supabase.from('bd_control_tower_actions').select('*').neq('status', 'completed').order('created_at', { ascending: false }),
    supabase.from('bd_revenue_forecasts').select('*').order('created_at', { ascending: false }).limit(5),
  ])

  const prospects = prospectsRaw || []
  const tasks = tasksRaw || []
  const appointments = appointmentsRaw || []
  const insights = insightsRaw || []
  const towerActions = actionsRaw || []
  const forecasts = forecastsRaw || []
  const signals = computeRevenueSignals({ prospects, tasks, appointments })

  return (
    <AppShell
      title="Revenue Control Tower"
      subtitle="AI-style decision layer for revenue risk, execution pressure, pipeline discipline, and manager action."
      breadcrumbs={[{ label: 'Revenue Command', href: '/revenue-command-center' }, { label: 'Control Tower' }]}
      actions={
        <>
          <PageAction href="/revenue-command-center/elite-command" variant="light">Elite Command</PageAction>
          <PageAction href="/revenue-command-center/daily-desk">Daily Desk</PageAction>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <section style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>AI DECISION LAYER</div>
            <h1 style={heroTitleStyle}>Control the revenue machine by exception.</h1>
            <p style={heroTextStyle}>This tower compresses pipeline value, execution delay, missing next actions, meeting leakage, and confidence into manager-level priorities.</p>
          </div>
          <form action={generateControlTowerInsights}>
            <button type="submit" style={heroButtonStyle}>Generate Insights</button>
          </form>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 12 }}>
          <Kpi title="Gross Pipeline" value={formatCurrency(signals.grossPipeline)} sub="active prospects" tone="#16a34a" />
          <Kpi title="Weighted" value={formatCurrency(signals.weightedPipeline)} sub="probability adjusted" tone="#7c3aed" />
          <Kpi title="Confidence" value={`${signals.confidenceScore}%`} sub="system quality" tone={signals.confidenceScore < 50 ? '#dc2626' : '#2563eb'} />
          <Kpi title="Overdue" value={signals.overdueTasks} sub="execution delay" tone="#dc2626" />
          <Kpi title="No Next Action" value={signals.missingNextActions} sub="pipeline discipline" tone="#d97706" />
          <Kpi title="Meeting Leakage" value={signals.pastAppointmentsWithoutOutcome} sub="outcome missing" tone="#0f172a" />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr .9fr', gap: 18, alignItems: 'start' }}>
          <Panel title="Open Decision Insights" subtitle="Generated risks and recommendations requiring manager attention.">
            <div style={{ display: 'grid', gap: 12 }}>
              {insights.length ? insights.map((insight: any) => (
                <SeverityCard key={insight.id} item={insight}>
                  <form action={closeInsight}>
                    <input type="hidden" name="id" value={insight.id} />
                    <button type="submit" style={smallButtonStyle}>Close Insight</button>
                  </form>
                </SeverityCard>
              )) : <EmptyState title="No open insights" text="Generate insights to create a fresh decision register." />}
            </div>
          </Panel>

          <Panel title="Create Control Action" subtitle="Convert a management decision into an accountable control action.">
            <form action={createTowerAction} style={formStyle}>
              <input name="title" required placeholder="Action title" style={inputStyle} />
              <textarea name="description" rows={4} placeholder="Decision / instruction / expected result..." style={inputStyle} />
              <select name="severity" defaultValue="medium" style={inputStyle}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
              <input name="due_at" type="datetime-local" style={inputStyle} />
              <button type="submit" style={buttonStyle}>Create Control Action</button>
            </form>
          </Panel>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
          <Panel title="Open Control Actions" subtitle="Management actions created from tower diagnosis.">
            <div style={{ display: 'grid', gap: 12 }}>
              {towerActions.length ? towerActions.map((action: any) => (
                <SeverityCard key={action.id} item={action}>
                  <form action={closeTowerAction}>
                    <input type="hidden" name="id" value={action.id} />
                    <button type="submit" style={smallButtonStyle}>Complete</button>
                  </form>
                </SeverityCard>
              )) : <EmptyState title="No control actions" text="Create actions when a risk requires manager execution." />}
            </div>
          </Panel>

          <Panel title="Forecast Snapshots" subtitle="Stored snapshots from generated control-tower runs.">
            <div style={{ display: 'grid', gap: 10 }}>
              {forecasts.length ? forecasts.map((f: any) => (
                <article key={f.id} style={forecastRowStyle}>
                  <strong>{f.forecast_date}</strong>
                  <span>Gross {formatCurrency(f.gross_pipeline)} • Weighted {formatCurrency(f.weighted_pipeline)}</span>
                  <span>Overdue {f.overdue_tasks} • No Next {f.missing_next_actions} • Confidence {f.confidence_score}%</span>
                </article>
              )) : <EmptyState title="No snapshots yet" text="Generate insights to store your first revenue forecast snapshot." />}
            </div>
          </Panel>
        </section>

        <Panel title="Control Tower Shortcuts" subtitle="Jump into the operating surfaces that repair detected issues.">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <ActionLink href="/revenue-command-center/prospects/pipeline">Pipeline Board</ActionLink>
            <ActionLink href="/revenue-command-center/follow-ups" variant="light">Follow-ups</ActionLink>
            <ActionLink href="/revenue-command-center/tasks/board" variant="light">Task Board</ActionLink>
            <ActionLink href="/revenue-command-center/overdue-heatmap" variant="light">Overdue Heatmap</ActionLink>
            <ActionLink href="/revenue-command-center/daily-desk" variant="light">Agent Daily Desk</ActionLink>
          </div>
        </Panel>
      </div>
    </AppShell>
  )
}

const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, padding: 30, borderRadius: 32, color: '#fff', background: 'radial-gradient(circle at top left,#dc2626,#020617 68%)', boxShadow: '0 28px 70px rgba(15,23,42,.22)' }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#fee2e2', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 38, fontWeight: 950 }
const heroTextStyle: React.CSSProperties = { margin: '10px 0 0', color: '#fee2e2', fontWeight: 750, maxWidth: 780, lineHeight: 1.6 }
const heroButtonStyle: React.CSSProperties = { border: '1px solid rgba(255,255,255,.24)', borderRadius: 16, padding: '14px 18px', background: 'rgba(255,255,255,.12)', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const formStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: 13, borderRadius: 13, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontWeight: 750 }
const buttonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, padding: '13px 16px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const smallButtonStyle: React.CSSProperties = { border: 'none', borderRadius: 12, padding: '10px 12px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const forecastRowStyle: React.CSSProperties = { display: 'grid', gap: 5, padding: 14, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }
