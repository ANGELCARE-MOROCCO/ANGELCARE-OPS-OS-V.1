import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { ActionLink, EmptyState, Kpi, Panel, WorkRow, formatCurrency, formatDate, prioritySignal, todayRange } from '../_components/AgentDailyDeskPrimitives'
import { saveDailyFocus, submitAgentCheckin } from './actions'

export default async function AgentDailyDeskPage() {
  const user = await getCurrentUser()
  const supabase = await createClient()
  const { start, end } = todayRange()
  const today = new Date().toISOString().slice(0, 10)
  const now = new Date().toISOString()

  const [{ data: tasksRaw }, { data: prospectsRaw }, { data: appointmentsRaw }, { data: dailyNote }, { data: checkinsRaw }] = await Promise.all([
    supabase.from('bd_tasks').select('*').eq('assigned_to', user?.id || '').order('due_at', { ascending: true }),
    supabase.from('bd_prospects').select('*').eq('owner_id', user?.id || '').eq('is_archived', false).order('estimated_value', { ascending: false }),
    supabase.from('bd_appointments').select('*').eq('owner_id', user?.id || '').order('scheduled_at', { ascending: true }),
    supabase.from('bd_agent_daily_notes').select('*').eq('user_id', user?.id || '').eq('note_date', today).maybeSingle(),
    supabase.from('bd_agent_checkins').select('*').eq('user_id', user?.id || '').order('created_at', { ascending: false }).limit(5),
  ])

  const tasks = tasksRaw || []
  const prospects = prospectsRaw || []
  const appointments = appointmentsRaw || []
  const checkins = checkinsRaw || []

  const openTasks = tasks.filter((t: any) => t.status !== 'completed')
  const overdueTasks = openTasks.filter((t: any) => (t.due_at || t.planned_end_at) && (t.due_at || t.planned_end_at) < now)
  const todayTasks = openTasks.filter((t: any) => {
    const due = t.due_at || t.planned_end_at
    return due && due >= start && due < end
  })
  const missingNext = prospects.filter((p: any) => !p.next_action && !p.next_action_at)
  const hotProspects = prospects.filter((p: any) => Number(p.estimated_value || 0) >= 5000 || Number(p.strategic_value || 0) >= 75).slice(0, 8)
  const todayAppointments = appointments.filter((a: any) => a.scheduled_at && a.scheduled_at >= start && a.scheduled_at < end)
  const upcomingAppointments = appointments.filter((a: any) => a.scheduled_at && a.scheduled_at >= now).slice(0, 8)

  const priorityQueue = [
    ...overdueTasks.map((x: any) => ({ kind: 'task', weight: 100, item: x })),
    ...missingNext.map((x: any) => ({ kind: 'prospect', weight: 90 + Number(x.estimated_value || 0) / 1000, item: x })),
    ...todayTasks.map((x: any) => ({ kind: 'task', weight: 70, item: x })),
    ...hotProspects.map((x: any) => ({ kind: 'prospect', weight: 60 + Number(x.estimated_value || 0) / 1000, item: x })),
    ...todayAppointments.map((x: any) => ({ kind: 'appointment', weight: 55, item: x })),
  ].sort((a: any, b: any) => b.weight - a.weight).slice(0, 12)

  const pipelineValue = prospects.reduce((sum: number, p: any) => sum + Number(p.estimated_value || 0), 0)

  return (
    <AppShell
      title="Agent Daily Desk"
      subtitle="Daily operating desk for revenue agents: priorities, follow-ups, meetings, hot prospects, and execution focus."
      breadcrumbs={[{ label: 'Revenue Command', href: '/revenue-command-center' }, { label: 'Daily Desk' }]}
      actions={<><PageAction href="/revenue-command-center/tasks/new">Create Task</PageAction><PageAction href="/revenue-command-center/my-work" variant="light">My Work</PageAction></>}
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <section style={heroStyle}>
          <div><div style={eyebrowStyle}>DAILY EXECUTION DESK</div><h1 style={heroTitleStyle}>Good morning, {user?.full_name || user?.username || 'Agent'}.</h1><p style={heroTextStyle}>Your day is ranked by revenue urgency, deadlines, missing next actions, and meetings.</p></div>
          <div style={heroPanelStyle}><strong>{overdueTasks.length ? 'ACTION REQUIRED' : 'DAY UNDER CONTROL'}</strong><span>{overdueTasks.length} overdue • {missingNext.length} missing next action</span></div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 12 }}>
          <Kpi title="Open Tasks" value={openTasks.length} sub="assigned" tone="#2563eb" />
          <Kpi title="Overdue" value={overdueTasks.length} sub="must resolve" tone="#dc2626" />
          <Kpi title="Today" value={todayTasks.length} sub="due today" tone="#d97706" />
          <Kpi title="Hot Prospects" value={hotProspects.length} sub="value / strategic" tone="#7c3aed" />
          <Kpi title="Meetings" value={todayAppointments.length} sub="today" tone="#16a34a" />
          <Kpi title="Pipeline" value={formatCurrency(pipelineValue)} sub="owned value" />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1.15fr .85fr', gap: 18, alignItems: 'start' }}>
          <Panel title="Priority Queue" subtitle="What this agent should do first.">
            <div style={{ display: 'grid', gap: 10 }}>
              {priorityQueue.length ? priorityQueue.map((q: any, index: number) => {
                const item = q.item
                const signal = prioritySignal(item, q.kind)
                const href = q.kind === 'task' ? `/revenue-command-center/tasks/${item.id}` : q.kind === 'prospect' ? `/revenue-command-center/prospects/${item.id}` : `/revenue-command-center/appointments/command`
                const title = q.kind === 'task' ? item.title || 'Untitled task' : q.kind === 'prospect' ? item.name || 'Unnamed prospect' : item.title || 'Appointment'
                const text = q.kind === 'task' ? item.description || signal.label : q.kind === 'prospect' ? `${item.segment || 'No segment'} • ${formatCurrency(item.estimated_value)} • Next: ${item.next_action || 'missing'}` : `${formatDate(item.scheduled_at)} • ${item.notes || 'No notes'}`
                return <WorkRow key={`${q.kind}-${item.id}-${index}`} href={href} title={title} text={text} signal={signal} meta={q.kind.toUpperCase()} />
              }) : <EmptyState title="No priority items" text="No urgent work detected." />}
            </div>
          </Panel>

          <Panel title="Daily Focus" subtitle="Set your execution intention and blocker for today.">
            <form action={saveDailyFocus} style={formStyle}>
              <textarea name="focus" rows={4} defaultValue={dailyNote?.focus || ''} placeholder="Today I must close / call / complete..." style={inputStyle} />
              <textarea name="blocker" rows={3} defaultValue={dailyNote?.blocker || ''} placeholder="Current blocker..." style={inputStyle} />
              <textarea name="manager_note" rows={3} defaultValue={dailyNote?.manager_note || ''} placeholder="Manager note / escalation request..." style={inputStyle} />
              <button type="submit" style={buttonStyle}>Save Daily Focus</button>
            </form>
          </Panel>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18, alignItems: 'start' }}>
          <Panel title="Overdue Tasks"><div style={{ display: 'grid', gap: 10 }}>{overdueTasks.length ? overdueTasks.slice(0, 8).map((task: any) => <WorkRow key={task.id} href={`/revenue-command-center/tasks/${task.id}`} title={task.title || 'Untitled task'} text={task.description || `Due ${formatDate(task.due_at || task.planned_end_at)}`} signal={prioritySignal(task, 'task')} />) : <EmptyState title="No overdue tasks" text="No late assigned tasks." />}</div></Panel>
          <Panel title="Missing Next Actions"><div style={{ display: 'grid', gap: 10 }}>{missingNext.length ? missingNext.slice(0, 8).map((p: any) => <WorkRow key={p.id} href={`/revenue-command-center/prospects/${p.id}`} title={p.name || 'Unnamed prospect'} text={`${p.city || 'No city'} • ${formatCurrency(p.estimated_value)}`} signal={prioritySignal(p, 'prospect')} />) : <EmptyState title="Pipeline clean" text="All prospects have next actions." />}</div></Panel>
          <Panel title="Meetings"><div style={{ display: 'grid', gap: 10 }}>{upcomingAppointments.length ? upcomingAppointments.map((a: any) => <WorkRow key={a.id} href="/revenue-command-center/appointments/command" title={a.title || 'Appointment'} text={`${formatDate(a.scheduled_at)} • ${a.notes || 'No notes'}`} signal={prioritySignal(a, 'appointment')} />) : <EmptyState title="No meetings" text="No upcoming appointments." />}</div></Panel>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '.85fr 1.15fr', gap: 18, alignItems: 'start' }}>
          <Panel title="Check-in" subtitle="Quick operational check-in for manager visibility.">
            <form action={submitAgentCheckin} style={formStyle}>
              <select name="checkin_type" defaultValue="daily_start" style={inputStyle}><option value="daily_start">Daily start</option><option value="midday_update">Midday update</option><option value="end_of_day">End of day</option></select>
              <select name="mood" defaultValue="focused" style={inputStyle}><option value="focused">Focused</option><option value="blocked">Blocked</option><option value="overloaded">Overloaded</option><option value="ready">Ready</option></select>
              <select name="workload_level" defaultValue="normal" style={inputStyle}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="critical">Critical</option></select>
              <textarea name="note" rows={3} placeholder="Short update..." style={inputStyle} />
              <button type="submit" style={buttonStyle}>Submit Check-in</button>
            </form>
          </Panel>

          <Panel title="Fast Actions" subtitle="Jump directly into work surfaces.">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <ActionLink href="/revenue-command-center/tasks/new">New Task</ActionLink>
              <ActionLink href="/revenue-command-center/prospects" variant="light">Prospects</ActionLink>
              <ActionLink href="/revenue-command-center/prospects/pipeline" variant="light">Pipeline</ActionLink>
              <ActionLink href="/revenue-command-center/follow-ups" variant="light">Follow-ups</ActionLink>
              <ActionLink href="/revenue-command-center/appointments/command" variant="light">Appointments</ActionLink>
              <ActionLink href="/revenue-command-center/tasks/board" variant="light">Task Board</ActionLink>
            </div>
            <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
              {checkins.length ? checkins.map((c: any) => <div key={c.id} style={checkinRowStyle}><strong>{c.checkin_type || 'check-in'} • {c.mood || '—'}</strong><span>{c.note || 'No note'} • {formatDate(c.created_at)}</span></div>) : <EmptyState title="No check-ins" text="Submit your first check-in." />}
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
const heroTextStyle: React.CSSProperties = { margin: '10px 0 0', color: '#ede9fe', fontWeight: 750, maxWidth: 760, lineHeight: 1.6 }
const heroPanelStyle: React.CSSProperties = { minWidth: 300, display: 'grid', gap: 7, padding: 20, borderRadius: 24, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)' }
const formStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: 13, borderRadius: 13, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontWeight: 750 }
const buttonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, padding: '13px 16px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const checkinRowStyle: React.CSSProperties = { display: 'grid', gap: 4, padding: 12, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }
