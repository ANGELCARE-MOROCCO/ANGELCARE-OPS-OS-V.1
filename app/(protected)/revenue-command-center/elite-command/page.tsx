import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { ActionLink, Badge, CommandButton, EmptyState, Kpi, Panel, SignalRow, TerminalDisplay, formatDate } from '../_components/ElitePhase7Primitives'

export default async function EliteCommandPage() {
  const supabase = await createClient()

  const [
    { data: tasksRaw },
    { data: prospectsRaw },
    { data: campaignsRaw },
    { data: appointmentsRaw },
    { data: partnershipsRaw },
    { data: usersRaw },
    { data: statusRaw },
    { data: eventsRaw },
  ] = await Promise.all([
    supabase.from('bd_tasks').select('*').order('created_at', { ascending: false }),
    supabase.from('bd_prospects').select('*').order('created_at', { ascending: false }),
    supabase.from('bd_campaigns').select('*').order('created_at', { ascending: false }),
    supabase.from('bd_appointments').select('*').order('scheduled_at', { ascending: true }),
    supabase.from('bd_partnerships').select('*').order('created_at', { ascending: false }),
    supabase.from('app_users').select('*').order('full_name'),
    supabase.from('bd_system_status_checks').select('*').order('checked_at', { ascending: false }),
    supabase.from('bd_command_events').select('*').eq('is_resolved', false).order('created_at', { ascending: false }).limit(10),
  ])

  const tasks = tasksRaw || []
  const prospects = prospectsRaw || []
  const campaigns = campaignsRaw || []
  const appointments = appointmentsRaw || []
  const partnerships = partnershipsRaw || []
  const users = usersRaw || []
  const statuses = statusRaw || []
  const events = eventsRaw || []

  const now = new Date().toISOString()
  const overdue = tasks.filter((t: any) => t.status !== 'completed' && (t.due_at || t.planned_end_at) && (t.due_at || t.planned_end_at) < now)
  const openTasks = tasks.filter((t: any) => t.status !== 'completed')
  const missingNext = prospects.filter((p: any) => !p.is_archived && !p.next_action && !p.next_action_at)
  const activeCampaigns = campaigns.filter((c: any) => c.status === 'active')
  const upcomingMeetings = appointments.filter((a: any) => a.scheduled_at && a.scheduled_at >= now)
  const strategicPartnerships = partnerships.filter((p: any) => Number(p.strategic_value || 0) >= 75)

  const terminalLines = [
    `REVENUE OS: ${overdue.length ? 'ACTION REQUIRED' : 'STABLE'}`,
    `OPEN TASKS: ${openTasks.length}`,
    `OVERDUE: ${overdue.length}`,
    `PIPELINE GAPS: ${missingNext.length}`,
    `CAMPAIGNS ACTIVE: ${activeCampaigns.length}`,
    `CONNECTIVITY: ${statuses.length ? 'SYSTEM PANEL ONLINE' : 'WAITING STATUS DATA'}`,
  ]

  return (
    <AppShell
      title="Elite Revenue Command Cockpit"
      subtitle="Final Phase 7 cockpit: compressed command, intelligence, workload, growth, and system status in one operating surface."
      breadcrumbs={[{ label: 'Revenue Command', href: '/revenue-command-center' }, { label: 'Elite Command' }]}
      actions={
        <>
          <PageAction href="/revenue-command-center/my-work">My Work</PageAction>
          <PageAction href="/revenue-command-center/master-command" variant="light">Master Command</PageAction>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 16 }}>
        <section style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>PHASE 7 — ELITE COMMAND COCKPIT</div>
            <h1 style={heroTitleStyle}>One screen to command revenue execution.</h1>
            <p style={heroTextStyle}>Tasks, pipeline gaps, campaigns, meetings, partnerships, users, and system state are compressed into one executive operating layer.</p>
          </div>
          <TerminalDisplay lines={terminalLines} />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 10 }}>
          <Kpi title="Open Work" value={openTasks.length} sub="non-completed tasks" tone="#2563eb" />
          <Kpi title="Overdue" value={overdue.length} sub="intervention queue" tone="#dc2626" />
          <Kpi title="No Next Action" value={missingNext.length} sub="pipeline discipline" tone="#d97706" />
          <Kpi title="Campaigns Active" value={activeCampaigns.length} sub="growth pressure" tone="#16a34a" />
          <Kpi title="Meetings" value={upcomingMeetings.length} sub="upcoming" tone="#7c3aed" />
          <Kpi title="Strategic B2B" value={strategicPartnerships.length} sub="partnerships" tone="#0f172a" />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1.15fr .85fr', gap: 16, alignItems: 'start' }}>
          <Panel title="Command Grid" subtitle="Compressed navigation into every operational surface." dense>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 }}>
              <CommandButton icon="🎯" title="My Work" subtitle="Personal AI-priority queue." href="/revenue-command-center/my-work" tone="#dc2626" />
              <CommandButton icon="📋" title="Task Board" subtitle="Kanban task execution." href="/revenue-command-center/tasks/board" />
              <CommandButton icon="📈" title="Pipeline" subtitle="Prospect stage command." href="/revenue-command-center/prospects/pipeline" tone="#7c3aed" />
              <CommandButton icon="🔁" title="Follow-ups" subtitle="Dead-pipeline prevention." href="/revenue-command-center/follow-ups" tone="#d97706" />
              <CommandButton icon="🧭" title="Management" subtitle="Workload and reassignment." href="/revenue-command-center/management" tone="#0f172a" />
              <CommandButton icon="🔥" title="Heatmap" subtitle="Overdue pressure map." href="/revenue-command-center/overdue-heatmap" tone="#dc2626" />
              <CommandButton icon="🚀" title="Growth" subtitle="Campaigns and expansion." href="/revenue-command-center/growth" tone="#16a34a" />
              <CommandButton icon="🤝" title="Partners" subtitle="B2B pipeline." href="/revenue-command-center/partnerships/pipeline" tone="#7c3aed" />
            </div>
          </Panel>

          <Panel title="Live System Indicators" subtitle="Operational status strip for connected systems." dense>
            <div style={{ display: 'grid', gap: 10 }}>
              {statuses.length ? statuses.slice(0, 6).map((s: any) => (
                <SignalRow
                  key={s.id}
                  title={s.system_name || 'System'}
                  subtitle={`${s.status || 'unknown'} • ${s.message || 'No message'} • ${formatDate(s.checked_at)}`}
                  severity={s.status === 'online' ? 'success' : s.status === 'error' ? 'critical' : 'warning'}
                />
              )) : <EmptyState title="No status checks" text="System status rows will appear after SQL seed or live integration." />}
            </div>
          </Panel>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, alignItems: 'start' }}>
          <Panel title="Critical Tasks" subtitle="Immediate execution risk." dense action={<ActionLink href="/revenue-command-center/overdue-heatmap" variant="light">Open Heatmap</ActionLink>}>
            <div style={{ display: 'grid', gap: 9 }}>
              {overdue.length ? overdue.slice(0, 7).map((t: any) => (
                <SignalRow key={t.id} title={t.title || 'Untitled task'} subtitle={`Due ${formatDate(t.due_at || t.planned_end_at)}`} severity="critical" href={`/revenue-command-center/tasks/${t.id}`} />
              )) : <EmptyState title="No overdue tasks" text="Execution pressure is currently clean." />}
            </div>
          </Panel>

          <Panel title="Pipeline Gaps" subtitle="Prospects missing next action." dense action={<ActionLink href="/revenue-command-center/follow-ups" variant="light">Follow-ups</ActionLink>}>
            <div style={{ display: 'grid', gap: 9 }}>
              {missingNext.length ? missingNext.slice(0, 7).map((p: any) => (
                <SignalRow key={p.id} title={p.name || 'Unnamed prospect'} subtitle={`${p.segment || 'No segment'} • ${p.city || 'No city'}`} severity="warning" href={`/revenue-command-center/prospects/${p.id}`} />
              )) : <EmptyState title="No pipeline gaps" text="All prospects have next-action visibility." />}
            </div>
          </Panel>

          <Panel title="Command Events" subtitle="Unresolved alerts and system events." dense>
            <div style={{ display: 'grid', gap: 9 }}>
              {events.length ? events.map((e: any) => (
                <SignalRow key={e.id} title={e.title || e.event_type || 'Event'} subtitle={e.message || 'No message'} severity={e.severity || 'info'} />
              )) : <EmptyState title="No events" text="No unresolved command events at the moment." />}
            </div>
          </Panel>
        </section>

        <Panel title="Executive Quick Actions" subtitle="Fast creation and operational jumps without navigating through menus." dense>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <ActionLink href="/revenue-command-center/tasks/new">Create Task</ActionLink>
            <ActionLink href="/revenue-command-center/prospects/new" variant="light">New Prospect</ActionLink>
            <ActionLink href="/revenue-command-center/automation" variant="light">Run Automation</ActionLink>
            <ActionLink href="/revenue-command-center/team-performance" variant="light">Team Performance</ActionLink>
            <ActionLink href="/revenue-command-center/campaigns/board" variant="light">Campaign Board</ActionLink>
            <ActionLink href="/revenue-command-center/market-mapping/coverage" variant="light">Market Coverage</ActionLink>
          </div>
        </Panel>
      </div>
    </AppShell>
  )
}

const heroStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 18, alignItems: 'center', padding: 28, borderRadius: 34, color: '#fff', background: 'radial-gradient(circle at top left,#2563eb,#020617 70%)', boxShadow: '0 28px 70px rgba(15,23,42,.22)' }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#dbeafe', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 40, fontWeight: 950 }
const heroTextStyle: React.CSSProperties = { margin: '10px 0 0', color: '#dbeafe', fontWeight: 750, maxWidth: 900, lineHeight: 1.55 }
