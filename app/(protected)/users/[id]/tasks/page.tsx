import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { CockpitHero, EmptyState, MetricCard, Panel, TaskRow } from '../../../revenue-command-center/_components/ExecutionPrimitives'

export default async function UserTasksDashboard({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['ceo', 'manager', 'agent'])
  const { id } = await params
  const supabase = await createClient()

  const [{ data: user }, { data: tasks }, { data: users }] = await Promise.all([
    supabase.from('app_users').select('*').eq('id', id).maybeSingle(),
    supabase.from('bd_tasks').select('*').eq('assigned_to', id).eq('is_archived', false).order('end_at', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false }),
    supabase.from('app_users').select('id, full_name, username'),
  ])

  if (!user) notFound()
  const rows = tasks || []
  const userMap = new Map((users || []).map((u: any) => [u.id, u.full_name || u.username]))
  const overdue = rows.filter((t: any) => t.end_at && new Date(t.end_at).getTime() < Date.now() && t.status !== 'completed')
  const open = rows.filter((t: any) => t.status === 'open')
  const progress = rows.filter((t: any) => t.status === 'in_progress')
  const completed = rows.filter((t: any) => t.status === 'completed')

  return (
    <AppShell
      title={`Tasks — ${user.full_name}`}
      subtitle="Tableau personnel des actions, deadlines, suivis et responsabilités revenue."
      breadcrumbs={[{ label: 'Users', href: '/users' }, { label: user.full_name, href: `/users/${user.id}` }, { label: 'Tasks' }]}
      actions={<><PageAction href={`/users/${user.id}`} variant="light">Retour profil</PageAction><PageAction href={`/revenue-command-center/tasks/new?assigned_to=${user.id}`}>Créer tâche</PageAction></>}
    >
      <div style={pageStyle}>
        <CockpitHero title="Staff Action Dashboard" subtitle="Chaque agent doit pouvoir voir son portefeuille de tâches, ses urgences et ses actions terminées depuis son profil." />
        <section style={metricsGrid}>
          <MetricCard label="Total" value={rows.length} sub="assignées" tone="blue" />
          <MetricCard label="Open" value={open.length} sub="à lancer" tone="purple" />
          <MetricCard label="In progress" value={progress.length} sub="en cours" tone="green" />
          <MetricCard label="Overdue" value={overdue.length} sub="retard" tone="red" />
          <MetricCard label="Completed" value={completed.length} sub="terminées" tone="slate" />
        </section>
        <Panel title="Task portfolio" subtitle="Toutes les tâches sont cliquables et ouvrent le workspace de tâche.">
          <div style={{ display: 'grid', gap: 10 }}>
            {rows.map((task: any) => <TaskRow key={task.id} task={task} assigneeName={userMap.get(task.assigned_to)} />)}
            {!rows.length ? <EmptyState text="Aucune tâche assignée à cet utilisateur." /> : null}
          </div>
        </Panel>
      </div>
    </AppShell>
  )
}

const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const metricsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 14 }
