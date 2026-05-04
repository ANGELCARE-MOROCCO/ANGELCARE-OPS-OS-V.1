import React from 'react'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'

function statusTone(status?: string | null) {
  const value = String(status || 'open').toLowerCase()
  if (['completed', 'done', 'closed'].includes(value)) return '#16a34a'
  if (['in_progress', 'progress', 'active'].includes(value)) return '#2563eb'
  if (['waiting', 'blocked', 'paused'].includes(value)) return '#d97706'
  if (['cancelled', 'canceled', 'failed'].includes(value)) return '#dc2626'
  return '#64748b'
}

function priorityTone(priority?: string | null) {
  const value = String(priority || 'normal').toLowerCase()
  if (['critical', 'urgent'].includes(value)) return '#dc2626'
  if (value === 'high') return '#f97316'
  if (['medium', 'normal'].includes(value)) return '#2563eb'
  return '#64748b'
}

function formatDate(value?: string | null) {
  if (!value) return 'No date'
  try {
    return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  } catch {
    return value
  }
}

function isDone(task: any) {
  return ['completed', 'done', 'closed'].includes(String(task.status || '').toLowerCase())
}

function isOverdue(task: any) {
  if (!task?.due_at || isDone(task)) return false
  return new Date(task.due_at).getTime() < Date.now()
}

function isToday(task: any) {
  if (!task?.due_at) return false
  const d = new Date(task.due_at)
  const n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
}

function pct(n: number, d: number) {
  return d ? Math.round((n / d) * 100) : 0
}

export default async function RevenueTasksCommandPage() {
  const supabase = await createClient()

  const [tasksRes, usersRes, logsRes] = await Promise.all([
    supabase.from('bd_tasks').select('*').order('created_at', { ascending: false }).limit(250),
    supabase.from('app_users').select('id, full_name, username, role').order('full_name'),
    supabase.from('bd_activity_logs').select('*').eq('entity_type', 'task').order('created_at', { ascending: false }).limit(40),
  ])

  const tasks = tasksRes.data || []
  const users = usersRes.data || []
  const logs = logsRes.data || []
  const done = tasks.filter(isDone)
  const progress = tasks.filter((t: any) => ['in_progress', 'progress', 'active'].includes(String(t.status || '').toLowerCase()))
  const overdue = tasks.filter(isOverdue)
  const today = tasks.filter(isToday)
  const unassigned = tasks.filter((t: any) => !t.assigned_to && !t.owner_id)
  const critical = tasks.filter((t: any) => ['critical', 'urgent', 'high'].includes(String(t.priority || '').toLowerCase()))
  const completion = pct(done.length, tasks.length)
  const health = Math.max(0, 100 - Math.min(100, overdue.length * 12 + unassigned.length * 7 + critical.length * 3))

  const bars = [
    ['Open', tasks.filter((t: any) => String(t.status || 'open').toLowerCase() === 'open').length, '#64748b'],
    ['Progress', progress.length, '#2563eb'],
    ['Done', done.length, '#16a34a'],
    ['Late', overdue.length, '#dc2626'],
    ['Critical', critical.length, '#f97316'],
    ['Unassigned', unassigned.length, '#7c3aed'],
  ] as const

  const max = Math.max(1, ...bars.map((b) => b[1]))

  const lanes = [
    ['📅 Today Execution', today, '#2563eb', 'Tasks requiring action today'],
    ['🚨 Overdue Rescue', overdue, '#dc2626', 'Late work requiring recovery'],
    ['⚙️ In Progress', progress, '#16a34a', 'Active execution currently moving'],
    ['🎯 Unassigned', unassigned, '#7c3aed', 'Tasks needing ownership'],
  ] as const

  const owners = users
    .map((u: any) => {
      const owned = tasks.filter((t: any) => t.assigned_to === u.id || t.owner_id === u.id)
      return { ...u, total: owned.length, done: owned.filter(isDone).length, open: owned.filter((t: any) => !isDone(t)).length }
    })
    .filter((u: any) => u.total > 0)
    .slice(0, 8)

  return (
    <AppShell
      title="Tasks Command"
      subtitle="Revenue execution board for Business Development agents."
      breadcrumbs={[
        { label: 'Revenue Command', href: '/revenue-command-center' },
        { label: 'Tasks Command' },
      ]}
      actions={
        <>
          <PageAction href="/revenue-command-center/tasks/new">Create Task</PageAction>
          <PageAction href="/revenue-command-center/prospects" variant="light">Prospects</PageAction>
          <PageAction href="/revenue-command-center/appointments" variant="light">Appointments</PageAction>
          <PageAction href="/revenue-command-center/automation" variant="light">Automation</PageAction>
        </>
      }
    >
      <div style={pageStyle}>
        <section style={heroStyle}>
          <div style={{ minWidth: 0 }}>
            <div style={heroKickerStyle}>ANGELCARE REVENUE EXECUTION OPERATING SYSTEM</div>
            <h1 style={heroTitleStyle}>Task Force Control Room</h1>
            <p style={heroTextStyle}>
              Manage commercial execution, B2B/B2C follow-ups, campaigns, appointments, partner actions, and agent workload from one synchronized command surface.
            </p>
            <div style={heroNavigationStyle}>
              <a href="/revenue-command-center/tasks/new" style={heroNavPrimaryStyle}>⚡ Create tactical task</a>
              <a href="/revenue-command-center/prospects" style={heroNavStyle}>📞 Prospect queue</a>
              <a href="/revenue-command-center/appointments" style={heroNavStyle}>📅 Meetings</a>
              <a href="/revenue-command-center/automation" style={heroNavStyle}>🤖 Automation</a>
            </div>
          </div>

          <div style={diagnosticCardStyle}>
            <div style={diagnosticTopStyle}>
              <span>EXECUTION HEALTH</span>
              <strong>{health}%</strong>
            </div>
            <div style={signalBoxStyle}>
              <div style={signalLineStyle} />
              <pre style={terminalTextStyle}>{`> tasks_loaded: ${tasks.length}\n> due_today: ${today.length}\n> overdue: ${overdue.length}\n> unassigned: ${unassigned.length}\n> completion: ${completion}%\n> status: ${health < 65 ? 'ATTENTION REQUIRED' : 'OPERATIONAL'}`}</pre>
            </div>
          </div>
        </section>

        <section style={kpiGridStyle}>
          <Kpi title="Total" value={tasks.length} sub="tasks loaded" tone="#0f172a" />
          <Kpi title="Today" value={today.length} sub="must execute" tone="#2563eb" />
          <Kpi title="Overdue" value={overdue.length} sub="rescue required" tone="#dc2626" />
          <Kpi title="Completion" value={`${completion}%`} sub="execution ratio" tone="#16a34a" />
          <Kpi title="Unassigned" value={unassigned.length} sub="needs owner" tone="#7c3aed" />
          <Kpi title="Critical" value={critical.length} sub="high pressure" tone="#f97316" />
        </section>

        <section style={controlGridStyle}>
          <Control title="Create tactical task" icon="⚡" href="/revenue-command-center/tasks/new" tone="#2563eb" text="Open the new task factory with templates." />
          <Control title="Rescue overdue" icon="🚨" href="#lane-1" tone="#dc2626" text={`${overdue.length} overdue task(s).`} />
          <Control title="Assign ownership" icon="🎯" href="#lane-3" tone="#7c3aed" text={`${unassigned.length} unassigned task(s).`} />
          <Control title="Prospect actions" icon="📞" href="/revenue-command-center/prospects" tone="#16a34a" text="Connect tasks to prospects." />
          <Control title="Automation brain" icon="🤖" href="/revenue-command-center/automation" tone="#0f766e" text="Trigger rules and follow-ups." />
        </section>

        <section style={dashboardGridStyle}>
          <Panel title="Command Dashboard — Flow Performance" subtitle="Six execution indicators for queue health.">
            <div style={barGraphStyle}>
              {bars.map(([label, value, tone]) => (
                <div key={label} style={barRowStyle}>
                  <span style={barLabelStyle}>{label}</span>
                  <div style={barTrackStyle}><div style={{ ...barFillStyle, width: `${Math.max(6, (value / max) * 100)}%`, background: tone }} /></div>
                  <strong style={barValueStyle}>{value}</strong>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Command Dashboard — Agent Load" subtitle="Workload distribution by assigned user.">
            <div style={agentGridStyle}>
              {owners.length ? owners.map((owner: any) => (
                <div key={owner.id} style={agentCardStyle}>
                  <div style={agentTopStyle}><strong>{owner.full_name || owner.username}</strong><span>{owner.total} tasks</span></div>
                  <div style={miniProgressTrackStyle}><div style={{ ...miniProgressFillStyle, width: `${pct(owner.done, owner.total)}%` }} /></div>
                  <small style={agentSmallStyle}>Open {owner.open} · Done {owner.done} · {pct(owner.done, owner.total)}%</small>
                </div>
              )) : <Empty title="No assigned workload yet" text="Assign tasks to agents to activate workload intelligence." />}
            </div>
          </Panel>
        </section>

        <section style={laneGridStyle}>
          {lanes.map((lane: any, index: number) => (
            <div key={lane[0]} id={`lane-${index}`} style={laneStyle}>
              <div style={laneHeaderStyle}>
                <div><strong style={{ color: '#0f172a' }}>{lane[0]}</strong><p style={laneSubtitleStyle}>{lane[3]}</p></div>
                <span style={{ ...pillStyle, color: lane[2], borderColor: lane[2] }}>{lane[1].length}</span>
              </div>
              <div style={taskListStyle}>
                {lane[1].length ? lane[1].slice(0, 12).map((task: any) => <TaskCard key={task.id} task={task} />) : <Empty title="Clear" text="No tasks in this lane." />}
              </div>
            </div>
          ))}
        </section>

        <section style={dashboardGridStyle}>
          <Panel title="All Tasks Registry" subtitle="Full operational queue with direct access to execution rooms.">
            <div style={registryStyle}>{tasks.length ? tasks.map((task: any) => <TaskRow key={task.id} task={task} />) : <Empty title="No tasks" text="Create the first task." />}</div>
          </Panel>

          <Panel title="Recent Task Timeline" subtitle="Latest task activity logs.">
            <div style={timelineStyle}>
              {logs.length ? logs.map((log: any) => (
                <div key={log.id} style={timelineRowStyle}>
                  <span style={timelineDotStyle}>●</span>
                  <div><strong style={{ color: '#0f172a' }}>{log.action || 'Task activity'}</strong><p style={timelineTextStyle}>{log.note || log.message || 'No details recorded.'}</p><small style={timelineSmallStyle}>{formatDate(log.created_at)}</small></div>
                </div>
              )) : <Empty title="No logs" text="Timeline activates as agents work." />}
            </div>
          </Panel>
        </section>
      </div>
    </AppShell>
  )
}

function Kpi({ title, value, sub, tone }: { title: string; value: any; sub: string; tone: string }) {
  return <div style={{ ...kpiStyle, borderTopColor: tone }}><span style={kpiLabelStyle}>{title}</span><strong style={kpiValueStyle}>{value}</strong><small style={kpiSubStyle}>{sub}</small></div>
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return <section style={panelStyle}><div style={panelHeaderStyle}><h2 style={panelTitleStyle}>{title}</h2>{subtitle ? <p style={panelSubtitleStyle}>{subtitle}</p> : null}</div>{children}</section>
}

function Control({ title, icon, href, tone, text }: { title: string; icon: string; href: string; tone: string; text: string }) {
  return <a href={href} style={{ ...controlCardStyle, borderLeftColor: tone }}><div style={{ ...controlIconStyle, background: `${tone}18`, color: tone }}>{icon}</div><div><strong style={{ color: '#0f172a' }}>{title}</strong><p style={controlTextStyle}>{text}</p></div></a>
}

function TaskCard({ task }: { task: any }) {
  return <a href={`/revenue-command-center/tasks/${task.id}`} style={taskCardStyle}><div style={taskTopStyle}><strong style={{ color: '#0f172a' }}>{task.title || 'Untitled task'}</strong><span style={{ ...pillStyle, color: priorityTone(task.priority), borderColor: priorityTone(task.priority) }}>{task.priority || 'normal'}</span></div><p style={taskDescriptionStyle}>{task.description || 'No description.'}</p><small style={taskSmallStyle}>● {task.status || 'open'} · Due {formatDate(task.due_at)}</small></a>
}

function TaskRow({ task }: { task: any }) {
  return <a href={`/revenue-command-center/tasks/${task.id}`} style={taskRowStyle}><div style={{ minWidth: 0 }}><strong style={{ color: '#0f172a' }}>{task.title || 'Untitled task'}</strong><p style={taskDescriptionStyle}>{task.description || 'No description.'}</p></div><div style={rowBadgesStyle}><span style={{ ...pillStyle, color: statusTone(task.status), borderColor: statusTone(task.status) }}>{task.status || 'open'}</span><span style={{ ...pillStyle, color: priorityTone(task.priority), borderColor: priorityTone(task.priority) }}>{task.priority || 'normal'}</span></div></a>
}

function Empty({ title, text }: { title: string; text: string }) {
  return <div style={emptyStyle}><strong>{title}</strong><span>{text}</span></div>
}

const pageStyle: React.CSSProperties = { display: 'grid', gap: 22, color: '#0f172a' }
const heroStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 24, padding: 32, borderRadius: 34, color: '#ffffff', background: 'radial-gradient(circle at top left,#3b82f6 0,#1d4ed8 34%,#020617 82%)', boxShadow: '0 30px 80px rgba(15,23,42,.24)', border: '1px solid rgba(255,255,255,.14)', overflow: 'hidden' }
const heroKickerStyle: React.CSSProperties = { color: '#bfdbfe', fontSize: 12, fontWeight: 950, letterSpacing: 2.2, textTransform: 'uppercase' }
const heroTitleStyle: React.CSSProperties = { margin: '10px 0 0', color: '#ffffff', fontSize: 44, lineHeight: 1.02, fontWeight: 950, letterSpacing: '-.045em', textShadow: '0 2px 18px rgba(0,0,0,.35)' }
const heroTextStyle: React.CSSProperties = { margin: '14px 0 0', color: '#eff6ff', lineHeight: 1.65, fontWeight: 850, maxWidth: 960 }
const heroNavigationStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }
const heroNavStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, padding: '10px 13px', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.18)', color: '#ffffff', textDecoration: 'none', fontWeight: 900 }
const heroNavPrimaryStyle: React.CSSProperties = { ...heroNavStyle, background: '#ffffff', color: '#0f172a', border: '1px solid #ffffff' }
const diagnosticCardStyle: React.CSSProperties = { display: 'grid', gap: 12, padding: 18, borderRadius: 26, background: 'rgba(2,6,23,.68)', border: '1px solid rgba(255,255,255,.18)', boxShadow: 'inset 0 0 35px rgba(255,255,255,.04)' }
const diagnosticTopStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', color: '#86efac', fontWeight: 950 }
const signalBoxStyle: React.CSSProperties = { position: 'relative', minHeight: 210, overflow: 'hidden', borderRadius: 18, background: 'repeating-linear-gradient(0deg,#001b0d,#001b0d 9px,#002711 10px)', border: '1px solid rgba(134,239,172,.25)' }
const signalLineStyle: React.CSSProperties = { position: 'absolute', left: -70, top: '45%', width: '145%', height: 2, background: 'linear-gradient(90deg,transparent,#22c55e,transparent)', boxShadow: '0 0 20px #22c55e' }
const terminalTextStyle: React.CSSProperties = { position: 'absolute', inset: 14, margin: 0, color: '#86efac', fontSize: 12, lineHeight: 1.7, fontWeight: 800, whiteSpace: 'pre-wrap' }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14 }
const kpiStyle: React.CSSProperties = { borderTop: '5px solid', borderRadius: 24, padding: 20, background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 18px 40px rgba(15,23,42,.08)' }
const kpiLabelStyle: React.CSSProperties = { display: 'block', color: '#64748b', fontSize: 12, fontWeight: 950, textTransform: 'uppercase' }
const kpiValueStyle: React.CSSProperties = { display: 'block', color: '#0f172a', fontSize: 36, fontWeight: 950, marginTop: 6 }
const kpiSubStyle: React.CSSProperties = { color: '#64748b', fontWeight: 800 }
const controlGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 14 }
const controlCardStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '46px 1fr', gap: 12, alignItems: 'center', padding: 17, borderRadius: 24, background: '#fff', border: '1px solid #e2e8f0', borderLeft: '5px solid', textDecoration: 'none', color: '#0f172a', boxShadow: '0 15px 34px rgba(15,23,42,.07)' }
const controlIconStyle: React.CSSProperties = { width: 46, height: 46, borderRadius: 17, display: 'grid', placeItems: 'center', fontSize: 22 }
const controlTextStyle: React.CSSProperties = { margin: '5px 0 0', color: '#64748b', fontWeight: 750, lineHeight: 1.4 }
const dashboardGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }
const panelStyle: React.CSSProperties = { borderRadius: 28, padding: 22, background: 'rgba(255,255,255,.94)', border: '1px solid #e2e8f0', boxShadow: '0 20px 46px rgba(15,23,42,.08)' }
const panelHeaderStyle: React.CSSProperties = { marginBottom: 16 }
const panelTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 20, fontWeight: 950, letterSpacing: '-.02em' }
const panelSubtitleStyle: React.CSSProperties = { margin: '6px 0 0', color: '#64748b', fontWeight: 750, lineHeight: 1.5 }
const barGraphStyle: React.CSSProperties = { display: 'grid', gap: 13 }
const barRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '90px 1fr 42px', gap: 10, alignItems: 'center' }
const barLabelStyle: React.CSSProperties = { fontWeight: 850, color: '#475569' }
const barTrackStyle: React.CSSProperties = { height: 16, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }
const barFillStyle: React.CSSProperties = { height: '100%', borderRadius: 999 }
const barValueStyle: React.CSSProperties = { textAlign: 'right', color: '#0f172a' }
const agentGridStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const agentCardStyle: React.CSSProperties = { padding: 14, borderRadius: 17, background: '#f8fafc', border: '1px solid #e2e8f0' }
const agentTopStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10, color: '#0f172a' }
const miniProgressTrackStyle: React.CSSProperties = { height: 8, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden', marginTop: 8 }
const miniProgressFillStyle: React.CSSProperties = { height: '100%', background: '#16a34a', borderRadius: 999 }
const agentSmallStyle: React.CSSProperties = { display: 'block', color: '#64748b', fontWeight: 800, marginTop: 8 }
const laneGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14, alignItems: 'start' }
const laneStyle: React.CSSProperties = { borderRadius: 26, padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }
const laneHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 13 }
const laneSubtitleStyle: React.CSSProperties = { margin: '5px 0 0', color: '#64748b', fontWeight: 700, fontSize: 12 }
const pillStyle: React.CSSProperties = { border: '1px solid', borderRadius: 999, padding: '5px 9px', fontWeight: 950, fontSize: 11, whiteSpace: 'nowrap', background: '#fff' }
const taskListStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const taskCardStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 15, borderRadius: 18, background: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a', textDecoration: 'none', boxShadow: '0 8px 22px rgba(15,23,42,.04)' }
const taskTopStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10 }
const taskDescriptionStyle: React.CSSProperties = { margin: 0, color: '#64748b', fontWeight: 700, lineHeight: 1.45, overflow: 'hidden' }
const taskSmallStyle: React.CSSProperties = { color: '#475569', fontWeight: 850 }
const registryStyle: React.CSSProperties = { display: 'grid', gap: 10, maxHeight: 720, overflow: 'auto', paddingRight: 4 }
const taskRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', padding: 15, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', textDecoration: 'none' }
const rowBadgesStyle: React.CSSProperties = { display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'flex-end' }
const timelineStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const timelineRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '20px 1fr', gap: 10, padding: 14, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }
const timelineDotStyle: React.CSSProperties = { color: '#2563eb', fontSize: 18 }
const timelineTextStyle: React.CSSProperties = { margin: '4px 0', color: '#475569', fontWeight: 700 }
const timelineSmallStyle: React.CSSProperties = { color: '#64748b', fontWeight: 800 }
const emptyStyle: React.CSSProperties = { display: 'grid', gap: 5, padding: 18, borderRadius: 16, background: '#fff', border: '1px dashed #cbd5e1', color: '#64748b' }
