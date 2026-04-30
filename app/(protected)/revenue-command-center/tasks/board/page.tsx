import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { calculateTaskSignal } from '../../_lib/executionIntelligence'
import { EmptyState, Panel, WorkCard } from '../../_components/ExecutionPhase2Primitives'

const COLUMNS = [{ key: 'open', label: 'Open' }, { key: 'waiting', label: 'Waiting' }, { key: 'in_progress', label: 'In Progress' }, { key: 'completed', label: 'Completed' }]

export default async function TasksBoardPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('bd_tasks').select('*').order('created_at', { ascending: false })
  const tasks = (data || []).map((task: any) => ({ ...task, signal: calculateTaskSignal(task) }))

  return (
    <AppShell title="Tasks Board" subtitle="Flexible task board with hard activation signals on every card." breadcrumbs={[{ label: 'Revenue Command', href: '/revenue-command-center' }, { label: 'Tasks', href: '/revenue-command-center/tasks' }, { label: 'Board' }]} actions={<PageAction href="/revenue-command-center/tasks/new">Create Task</PageAction>}>
      <div style={boardStyle}>{COLUMNS.map((column) => { const items = tasks.filter((t: any) => (t.status || 'open') === column.key); return <Panel key={column.key} title={`${column.label} (${items.length})`}><div style={{ display: 'grid', gap: 12 }}>{items.length ? items.map((task: any) => <WorkCard key={task.id} title={task.title || 'Untitled task'} description={task.signal.reason} level={task.signal.level} score={task.signal.score} href={`/revenue-command-center/tasks/${task.id}`} meta={task.signal.action} />) : <EmptyState title="Empty lane" text="No tasks in this status." />}</div></Panel> })}</div>
    </AppShell>
  )
}
const boardStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(280px,1fr))', gap: 16, alignItems: 'start', overflowX: 'auto' }
