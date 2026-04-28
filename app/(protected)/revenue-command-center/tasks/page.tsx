import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { CockpitHero, EmptyState, MetricCard, Panel, TaskRow } from '../_components/ExecutionPrimitives'

export default async function RevenueTasksPage({ searchParams }: { searchParams?: Promise<{ status?: string; priority?: string; assignee?: string }> }) {
  await requireRole(['ceo', 'manager', 'agent'])
  const filters = (await searchParams) || {}
  const supabase = await createClient()

  let query = supabase.from('bd_tasks').select('*').eq('is_archived', false).order('end_at', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false })
  if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status)
  if (filters.priority && filters.priority !== 'all') query = query.eq('priority', filters.priority)
  if (filters.assignee && filters.assignee !== 'all') query = filters.assignee === 'none' ? query.is('assigned_to', null) : query.eq('assigned_to', filters.assignee)

  const [{ data: tasks }, { data: users }] = await Promise.all([
    query,
    supabase.from('app_users').select('id, full_name, username, role, status').order('full_name'),
  ])

  const allTasks = tasks || []
  const userMap = new Map((users || []).map((u: any) => [u.id, u.full_name || u.username]))
  const now = Date.now()
  const overdue = allTasks.filter((t: any) => t.end_at && new Date(t.end_at).getTime() < now && t.status !== 'completed')
  const open = allTasks.filter((t: any) => t.status === 'open')
  const active = allTasks.filter((t: any) => t.status === 'in_progress')
  const waiting = allTasks.filter((t: any) => t.status === 'waiting')
  const noOwner = allTasks.filter((t: any) => !t.assigned_to)

  return (
    <AppShell
      title="Revenue Task Command"
      subtitle="Centre unifié des actions business development, sales, follow-up, campagnes, prospects et partenariats."
      breadcrumbs={[{ label: 'Revenue', href: '/revenue-command-center' }, { label: 'Tasks' }]}
      actions={<><PageAction href="/revenue-command-center/cockpit" variant="light">Cockpit</PageAction><PageAction href="/revenue-command-center/tasks/new">Créer tâche</PageAction></>}
    >
      <div style={pageStyle}>
        <CockpitHero title="Backoffice Execution Board" subtitle="Toutes les tâches assignées aux équipes BD/Sales sont visibles ici, avec statut, propriétaire, timing, urgence et lien direct vers les objets business." />

        <section style={metricsStyle}>
          <MetricCard label="Tâches filtrées" value={allTasks.length} sub="total actuel" tone="blue" />
          <MetricCard label="Open" value={open.length} sub="à lancer" tone="purple" />
          <MetricCard label="In progress" value={active.length} sub="en traitement" tone="green" />
          <MetricCard label="Waiting" value={waiting.length} sub="bloquées / attente" tone="amber" />
          <MetricCard label="Overdue" value={overdue.length} sub="à rattraper" tone="red" />
          <MetricCard label="Sans owner" value={noOwner.length} sub="à assigner" tone="slate" />
        </section>

        <form style={filterStyle}>
          <strong>Filtres cockpit</strong>
          <select name="status" defaultValue={filters.status || 'all'} style={inputStyle}><option value="all">Tous statuts</option><option value="open">Open</option><option value="waiting">Waiting</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
          <select name="priority" defaultValue={filters.priority || 'all'} style={inputStyle}><option value="all">Toutes priorités</option><option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
          <select name="assignee" defaultValue={filters.assignee || 'all'} style={inputStyle}><option value="all">Tous owners</option><option value="none">Sans owner</option>{(users || []).map((u: any) => <option key={u.id} value={u.id}>{u.full_name || u.username}</option>)}</select>
          <button style={buttonStyle}>Filtrer</button>
        </form>

        <section style={kanbanStyle}>
          <Panel title="Open" subtitle="À lancer aujourd’hui"><Column tasks={open} userMap={userMap} /></Panel>
          <Panel title="In progress" subtitle="En traitement réel"><Column tasks={active} userMap={userMap} /></Panel>
          <Panel title="Waiting" subtitle="Bloqué / attente réponse"><Column tasks={waiting} userMap={userMap} /></Panel>
          <Panel title="Overdue" subtitle="Danger de suivi"><Column tasks={overdue} userMap={userMap} /></Panel>
        </section>
      </div>
    </AppShell>
  )
}

function Column({ tasks, userMap }: { tasks: any[]; userMap: Map<any, any> }) {
  if (!tasks.length) return <EmptyState text="Aucune tâche dans cette colonne." />
  return <div style={{ display: 'grid', gap: 10 }}>{tasks.slice(0, 20).map((task) => <TaskRow key={task.id} task={task} assigneeName={userMap.get(task.assigned_to)} />)}</div>
}

const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const metricsStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14 }
const filterStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 190px 190px 230px auto', gap: 12, alignItems: 'center', background: '#fff', border: '1px solid #dbe3ee', borderRadius: 24, padding: 16 }
const inputStyle: React.CSSProperties = { padding: '12px 13px', borderRadius: 13, border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 800 }
const buttonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, padding: '13px 18px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const kanbanStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 16, alignItems: 'start' }
