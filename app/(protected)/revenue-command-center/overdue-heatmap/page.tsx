import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { EmptyState, Kpi, Panel, StatusBadge, formatDate } from '../_components/ManagementPhase3Primitives'

export default async function OverdueHeatmapPage() {
  const supabase = await createClient()
  const [{ data: tasksRaw }, { data: usersRaw }] = await Promise.all([
    supabase.from('bd_tasks').select('*').order('due_at', { ascending: true }),
    supabase.from('app_users').select('id, full_name, username, role').order('full_name'),
  ])

  const tasks = tasksRaw || []
  const users = usersRaw || []
  const now = Date.now()

  const overdue = tasks
    .filter((t: any) => t.status !== 'completed' && (t.due_at || t.planned_end_at) && new Date(t.due_at || t.planned_end_at).getTime() < now)
    .map((t: any) => ({ ...t, hoursLate: Math.round((now - new Date(t.due_at || t.planned_end_at).getTime()) / 36e5) }))

  const severe = overdue.filter((t: any) => t.hoursLate >= 72)
  const medium = overdue.filter((t: any) => t.hoursLate >= 24 && t.hoursLate < 72)
  const light = overdue.filter((t: any) => t.hoursLate < 24)

  function ownerName(id?: string) {
    const user = users.find((u: any) => u.id === id)
    return user?.full_name || user?.username || 'Unassigned'
  }

  return (
    <AppShell
      title="Overdue Heatmap"
      subtitle="Visual pressure map for overdue revenue work: severity, ownership, and response priority."
      breadcrumbs={[{ label: 'Revenue Command', href: '/revenue-command-center' }, { label: 'Overdue Heatmap' }]}
      actions={<PageAction href="/revenue-command-center/management" variant="light">Management Control</PageAction>}
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }}>
          <Kpi title="Total Overdue" value={overdue.length} sub="all late tasks" tone="#dc2626" />
          <Kpi title="Severe +72h" value={severe.length} sub="executive pressure" tone="#991b1b" />
          <Kpi title="24h–72h" value={medium.length} sub="manager intervention" tone="#d97706" />
          <Kpi title="<24h" value={light.length} sub="recoverable" tone="#2563eb" />
        </section>

        <Panel title="Heatmap Queue" subtitle="Sorted by hours late.">
          {overdue.length ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {overdue.sort((a: any, b: any) => b.hoursLate - a.hoursLate).map((task: any) => {
                const level = task.hoursLate >= 72 ? 'critical' : task.hoursLate >= 24 ? 'risk' : 'stable'
                return (
                  <a key={task.id} href={`/revenue-command-center/tasks/${task.id}`} style={rowStyle}>
                    <div>
                      <strong>{task.title || 'Untitled task'}</strong>
                      <p>{ownerName(task.assigned_to)} • Due {formatDate(task.due_at || task.planned_end_at)}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={hoursStyle}>{task.hoursLate}h late</span>
                      <StatusBadge level={level as any} label={level === 'critical' ? 'SEVERE' : level === 'risk' ? 'RISK' : 'LIGHT'} />
                    </div>
                  </a>
                )
              })}
            </div>
          ) : <EmptyState title="No overdue work" text="The heatmap is clean." />}
        </Panel>
      </div>
    </AppShell>
  )
}

const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: 16, borderRadius: 18, border: '1px solid #e2e8f0', background: '#f8fafc', textDecoration: 'none', color: '#0f172a' }
const hoursStyle: React.CSSProperties = { fontWeight: 950, color: '#dc2626' }
