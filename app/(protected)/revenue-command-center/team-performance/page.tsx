import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { EmptyState, Kpi, Panel, StatusBadge, UserWorkloadCard } from '../_components/ManagementPhase3Primitives'

export default async function TeamPerformancePage() {
  const supabase = await createClient()

  const [{ data: usersRaw }, { data: tasksRaw }, { data: logsRaw }] = await Promise.all([
    supabase.from('app_users').select('*').order('full_name'),
    supabase.from('bd_tasks').select('*').order('created_at', { ascending: false }),
    supabase.from('bd_activity_logs').select('*').order('created_at', { ascending: false }).limit(200),
  ])

  const users = usersRaw || []
  const tasks = tasksRaw || []
  const logs = logsRaw || []
  const now = new Date().toISOString()

  const userStats = users.map((user: any) => {
    const owned = tasks.filter((t: any) => t.assigned_to === user.id)
    const completed = owned.filter((t: any) => t.status === 'completed').length
    const overdue = owned.filter((t: any) => t.status !== 'completed' && (t.due_at || t.planned_end_at) && (t.due_at || t.planned_end_at) < now).length
    const open = owned.filter((t: any) => t.status === 'open').length
    const progress = owned.filter((t: any) => t.status === 'in_progress').length
    const completionRate = owned.length ? Math.round((completed / owned.length) * 100) : 0
    const pressureScore = overdue * 25 + open * 5 + progress * 10 - completed * 4
    return { user, stats: { open, progress, completed, overdue, completionRate, pressureScore } }
  }).sort((a: any, b: any) => b.stats.pressureScore - a.stats.pressureScore)

  const totalCompleted = tasks.filter((t: any) => t.status === 'completed').length
  const totalOverdue = tasks.filter((t: any) => t.status !== 'completed' && (t.due_at || t.planned_end_at) && (t.due_at || t.planned_end_at) < now).length
  const completionRate = tasks.length ? Math.round((totalCompleted / tasks.length) * 100) : 0

  return (
    <AppShell
      title="Team Performance"
      subtitle="Execution scoring, workload pressure, completion rate, and activity visibility."
      breadcrumbs={[{ label: 'Revenue Command', href: '/revenue-command-center' }, { label: 'Team Performance' }]}
      actions={<PageAction href="/revenue-command-center/management" variant="light">Management Control</PageAction>}
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }}>
          <Kpi title="Team Completion" value={`${completionRate}%`} sub="all revenue tasks" tone="#16a34a" />
          <Kpi title="Overdue Load" value={totalOverdue} sub="team pressure" tone="#dc2626" />
          <Kpi title="Activity Logs" value={logs.length} sub="recent tracked actions" tone="#2563eb" />
          <Kpi title="Users Tracked" value={users.length} sub="performance coverage" tone="#7c3aed" />
        </section>

        <Panel title="Performance Matrix" subtitle="Sorted by pressure score: users needing the most management attention appear first.">
          {userStats.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
              {userStats.map(({ user, stats }: any) => <UserWorkloadCard key={user.id} user={user} stats={stats} />)}
            </div>
          ) : <EmptyState title="No users found" text="No user data available." />}
        </Panel>

        <Panel title="Recent Execution Activity" subtitle="Latest action memory from the revenue execution system.">
          {logs.length ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {logs.slice(0, 20).map((log: any) => (
                <div key={log.id} style={logStyle}>
                  <div>
                    <strong>{log.action || 'activity'}</strong>
                    <p>{log.note || '—'}</p>
                  </div>
                  <StatusBadge level="stable" label={log.entity_type || 'LOG'} />
                </div>
              ))}
            </div>
          ) : <EmptyState title="No activity logs" text="Activity will appear as users execute tasks and updates." />}
        </Panel>
      </div>
    </AppShell>
  )
}

const logStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: 14, borderRadius: 16, border: '1px solid #e2e8f0', background: '#f8fafc' }
