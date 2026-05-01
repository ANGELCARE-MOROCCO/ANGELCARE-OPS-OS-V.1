import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { EventCard, EmptyState, Kpi, Panel, ActionLink } from '../_components/SystemActivationPrimitives'
import { runSystemActivation } from './actions'

export default async function SystemActivationPage() {
  const supabase = await createClient()

  const [{ data: runs }, { data: events }, { data: followups }, { data: insights }, { data: tasks }] = await Promise.all([
    supabase.from('bd_activation_runs').select('*').order('created_at', { ascending: false }).limit(10),
    supabase.from('bd_activation_events').select('*').order('created_at', { ascending: false }).limit(20),
    supabase.from('bd_followups').select('*').eq('status', 'pending'),
    supabase.from('bd_decision_insights').select('*').eq('status', 'open'),
    supabase.from('bd_tasks').select('*').neq('status', 'completed'),
  ])

  const latest = (runs || [])[0]

  return (
    <AppShell
      title="System Activation Layer"
      subtitle="Runs enforcement loops: missing next actions, overdue tasks, meeting outcome leakage, follow-ups, insights, and escalations."
      breadcrumbs={[{ label: 'Revenue Command', href: '/revenue-command-center' }, { label: 'System Activation' }]}
      actions={<><PageAction href="/revenue-command-center/control-tower" variant="light">Control Tower</PageAction><PageAction href="/revenue-command-center/follow-ups">Follow-ups</PageAction></>}
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <section style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>SYSTEM ACTIVATION LAYER</div>
            <h1 style={heroTitleStyle}>Turn the Revenue OS from passive to self-enforcing.</h1>
            <p style={heroTextStyle}>This page activates automatic repair loops across prospects, tasks, meetings, follow-ups, and management insights.</p>
          </div>
          <form action={runSystemActivation}>
            <button type="submit" style={heroButtonStyle}>Run Activation Now</button>
          </form>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 12 }}>
          <Kpi title="Pending Follow-ups" value={(followups || []).length} sub="created / waiting" tone="#d97706" />
          <Kpi title="Open Insights" value={(insights || []).length} sub="manager decisions" tone="#dc2626" />
          <Kpi title="Open Tasks" value={(tasks || []).length} sub="execution load" tone="#2563eb" />
          <Kpi title="Last Tasks Created" value={latest?.tasks_created || 0} sub="latest run" tone="#16a34a" />
          <Kpi title="Last Escalations" value={latest?.escalations_created || 0} sub="latest run" tone="#dc2626" />
          <Kpi title="Last Insights" value={latest?.insights_created || 0} sub="latest run" tone="#7c3aed" />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '.9fr 1.1fr', gap: 18, alignItems: 'start' }}>
          <Panel title="Latest Activation Runs" subtitle="Audit trail of system enforcement runs.">
            <div style={{ display: 'grid', gap: 10 }}>
              {(runs || []).length ? (runs || []).map((run: any) => (
                <article key={run.id} style={runRowStyle}>
                  <strong>{run.run_type} • {run.status}</strong>
                  <span>Prospects {run.prospects_scanned} • Tasks {run.tasks_scanned} • Appointments {run.appointments_scanned}</span>
                  <span>Created: {run.tasks_created} tasks • {run.followups_created} follow-ups • {run.insights_created} insights • {run.escalations_created} escalations</span>
                </article>
              )) : <EmptyState title="No activation runs" text="Run the activation loop to generate the first enforcement audit." />}
            </div>
          </Panel>

          <Panel title="Recent Activation Events" subtitle="System-detected gaps and actions taken.">
            <div style={{ display: 'grid', gap: 12 }}>
              {(events || []).length ? (events || []).map((event: any) => <EventCard key={event.id} event={event} />) : <EmptyState title="No activation events" text="Events will appear after the activation loop runs." />}
            </div>
          </Panel>
        </section>

        <Panel title="Operational Repair Shortcuts" subtitle="Use these workspaces to resolve what the activation layer creates.">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <ActionLink href="/revenue-command-center/control-tower">Control Tower</ActionLink>
            <ActionLink href="/revenue-command-center/follow-ups" variant="light">Follow-ups</ActionLink>
            <ActionLink href="/revenue-command-center/prospects/pipeline" variant="light">Pipeline Board</ActionLink>
            <ActionLink href="/revenue-command-center/tasks/board" variant="light">Task Board</ActionLink>
            <ActionLink href="/revenue-command-center/daily-desk" variant="light">Agent Daily Desk</ActionLink>
          </div>
        </Panel>
      </div>
    </AppShell>
  )
}

const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, padding: 30, borderRadius: 32, color: '#fff', background: 'radial-gradient(circle at top left,#0f172a,#020617 68%)', boxShadow: '0 28px 70px rgba(15,23,42,.22)' }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#dbeafe', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 38, fontWeight: 950 }
const heroTextStyle: React.CSSProperties = { margin: '10px 0 0', color: '#dbeafe', fontWeight: 750, maxWidth: 780, lineHeight: 1.6 }
const heroButtonStyle: React.CSSProperties = { border: '1px solid rgba(255,255,255,.24)', borderRadius: 16, padding: '14px 18px', background: 'rgba(255,255,255,.12)', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const runRowStyle: React.CSSProperties = { display: 'grid', gap: 5, padding: 14, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }
