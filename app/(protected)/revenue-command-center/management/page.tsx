import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { ActionLink, EmptyState, Kpi, Panel, StatusBadge, UserWorkloadCard, formatDate } from '../_components/ManagementPhase3Primitives'
import { reassignTask, pushPriority } from './actions'

export default async function ManagementControlPage() {
  const supabase = await createClient()

  const [{ data: usersRaw }, { data: tasksRaw }, { data: prospectsRaw }] = await Promise.all([
    supabase.from('app_users').select('*').order('full_name'),
    supabase.from('bd_tasks').select('*').order('created_at', { ascending: false }),
    supabase.from('bd_prospects').select('*').eq('is_archived', false).order('created_at', { ascending: false }),
  ])

  const users = usersRaw || []
  const tasks = tasksRaw || []
  const prospects = prospectsRaw || []
  const now = new Date().toISOString()

  const overdue = tasks.filter((t: any) => t.status !== 'completed' && (t.due_at || t.planned_end_at) && (t.due_at || t.planned_end_at) < now)
  const open = tasks.filter((t: any) => t.status === 'open')
  const progress = tasks.filter((t: any) => t.status === 'in_progress')
  const missingNext = prospects.filter((p: any) => !p.next_action && !p.next_action_at)

  const userStats = users.map((user: any) => {
    const owned = tasks.filter((t: any) => t.assigned_to === user.id)
    return {
      user,
      stats: {
        open: owned.filter((t: any) => t.status === 'open').length,
        progress: owned.filter((t: any) => t.status === 'in_progress').length,
        completed: owned.filter((t: any) => t.status === 'completed').length,
        overdue: owned.filter((t: any) => t.status !== 'completed' && (t.due_at || t.planned_end_at) && (t.due_at || t.planned_end_at) < now).length,
      },
    }
  })

  return (
    <AppShell
      title="Revenue Management Control"
      subtitle="Manager control tower for workload, overdue pressure, reassignment, and priority pushes."
      breadcrumbs={[{ label: 'Revenue Command', href: '/revenue-command-center' }, { label: 'Management' }]}
      actions={
        <>
          <PageAction href="/revenue-command-center/team-performance">Team Performance</PageAction>
          <PageAction href="/revenue-command-center/tasks/new" variant="light">Create Task</PageAction>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <section style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>MANAGEMENT CONTROL LAYER</div>
            <h1 style={heroTitleStyle}>Control workload, pressure, and execution discipline.</h1>
            <p style={heroTextStyle}>This page is built for managers to detect overload, reassign tasks, push priorities, and prevent dead pipeline.</p>
          </div>
          <div style={heroPanelStyle}>
            <StatusBadge level={overdue.length ? 'critical' : 'stable'} label={overdue.length ? 'INTERVENTION' : 'STABLE'} />
            <strong>{overdue.length} overdue tasks</strong>
            <span>{missingNext.length} prospects missing next action</span>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 14 }}>
          <Kpi title="Open" value={open.length} sub="waiting execution" />
          <Kpi title="In Progress" value={progress.length} sub="active work" tone="#2563eb" />
          <Kpi title="Overdue" value={overdue.length} sub="needs manager action" tone="#dc2626" />
          <Kpi title="Missing Next Action" value={missingNext.length} sub="pipeline discipline gap" tone="#d97706" />
          <Kpi title="Team Users" value={users.length} sub="manageable workforce" tone="#7c3aed" />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 18, alignItems: 'start' }}>
          <Panel title="Team Workload Matrix" subtitle="Click a user to open their execution dashboard.">
            {userStats.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
                {userStats.map(({ user, stats }: any) => <UserWorkloadCard key={user.id} user={user} stats={stats} />)}
              </div>
            ) : <EmptyState title="No users found" text="No staff users available for workload analysis." />}
          </Panel>

          <Panel title="Priority Push" subtitle="Send a management priority signal to a user or object.">
            <form action={pushPriority} style={{ display: 'grid', gap: 12 }}>
              <input name="title" required placeholder="Priority title" style={inputStyle} />
              <textarea name="message" rows={4} placeholder="Manager instruction / context" style={inputStyle} />
              <select name="priority" defaultValue="high" style={inputStyle}>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <select name="target_user_id" defaultValue="" style={inputStyle}>
                <option value="">Target user optional</option>
                {users.map((u: any) => <option key={u.id} value={u.id}>{u.full_name || u.username}</option>)}
              </select>
              <button type="submit" style={darkButtonStyle}>Push Priority</button>
            </form>
          </Panel>
        </section>

        <Panel title="Overdue Intervention Queue" subtitle="Managers can reassign overdue work immediately.">
          {overdue.length ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {overdue.slice(0, 12).map((task: any) => (
                <div key={task.id} style={taskRowStyle}>
                  <div>
                    <strong>{task.title || 'Untitled task'}</strong>
                    <p>{task.description || 'No description.'}</p>
                    <small>Due: {formatDate(task.due_at || task.planned_end_at)}</small>
                  </div>
                  <form action={reassignTask} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="hidden" name="task_id" value={task.id} />
                    <select name="assigned_to" defaultValue={task.assigned_to || ''} style={selectStyle}>
                      <option value="">Unassigned</option>
                      {users.map((u: any) => <option key={u.id} value={u.id}>{u.full_name || u.username}</option>)}
                    </select>
                    <button type="submit" style={smallButtonStyle}>Reassign</button>
                    <ActionLink href={`/revenue-command-center/tasks/${task.id}`} variant="light">Open</ActionLink>
                  </form>
                </div>
              ))}
            </div>
          ) : <EmptyState title="No overdue tasks" text="No immediate intervention required." />}
        </Panel>
      </div>
    </AppShell>
  )
}

const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 22, padding: 30, borderRadius: 32, color: '#fff', background: 'radial-gradient(circle at top left,#7c3aed,#020617 68%)', boxShadow: '0 28px 70px rgba(15,23,42,.22)' }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#ede9fe', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 36, fontWeight: 950 }
const heroTextStyle: React.CSSProperties = { margin: '10px 0 0', color: '#ede9fe', fontWeight: 750, maxWidth: 760, lineHeight: 1.6 }
const heroPanelStyle: React.CSSProperties = { minWidth: 270, display: 'grid', gap: 8, padding: 20, borderRadius: 24, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)' }
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: 13, borderRadius: 13, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontWeight: 750 }
const darkButtonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, padding: '13px 16px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const taskRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', padding: 16, borderRadius: 18, border: '1px solid #e2e8f0', background: '#f8fafc' }
const selectStyle: React.CSSProperties = { padding: '11px 12px', borderRadius: 12, border: '1px solid #cbd5e1', background: '#fff' }
const smallButtonStyle: React.CSSProperties = { border: 'none', borderRadius: 12, padding: '11px 13px', background: '#0f172a', color: '#fff', fontWeight: 900, cursor: 'pointer' }
