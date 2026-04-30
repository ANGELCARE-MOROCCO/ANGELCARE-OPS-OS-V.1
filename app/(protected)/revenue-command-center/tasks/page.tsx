import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { Badge, Kpi, Panel, RowLink, WorkspaceHero, dateTime, isOverdue, statusTone } from '../_components/BDV3Primitives'

export default async function TasksBoard({ searchParams }: { searchParams?: Promise<{ status?: string }> }) {
  const filters = await searchParams
  const status = filters?.status || 'all'
  const supabase = await createClient()
  let q = supabase.from('bd_tasks').select('*').order('due_at', { ascending: true })
  if (status !== 'all') q = q.eq('status', status)
  const { data: tasks } = await q
  const list = tasks || []
  const overdue = list.filter((t: any) => t.status !== 'completed' && isOverdue(t.due_at)).length

  return <AppShell title="Task Command Board" subtitle="Centralized execution board for BD and sales actions." breadcrumbs={[{ label: 'Revenue', href: '/revenue-command-center' }, { label: 'Tasks' }]} actions={<PageAction href="/revenue-command-center/tasks/new">Create task</PageAction>}>
    <div style={{ display: 'grid', gap: 20 }}>
      <WorkspaceHero title="Action Execution Engine" subtitle="Assign staff, set due dates, link tasks to prospects/leads/families/campaigns, comment and monitor overdue work." />
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 14 }}>
        <Kpi title="Visible tasks" value={String(list.length)} />
        <Kpi title="Overdue" value={String(overdue)} tone="#dc2626" />
        <Kpi title="Open" value={String(list.filter((t:any)=>t.status==='open').length)} tone="#2563eb" />
        <Kpi title="In progress" value={String(list.filter((t:any)=>t.status==='in_progress').length)} tone="#7c3aed" />
        <Kpi title="Completed" value={String(list.filter((t:any)=>t.status==='completed').length)} tone="#16a34a" />
      </section>
      <Panel title="Task filters" subtitle="Switch status without changing data."><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{['all','open','waiting','in_progress','completed'].map((s) => <a key={s} href={`/revenue-command-center/tasks?status=${s}`} style={{ padding: '10px 13px', borderRadius: 14, background: status === s ? '#0f172a' : '#fff', color: status === s ? '#fff' : '#0f172a', border: '1px solid #dbe3ee', textDecoration: 'none', fontWeight: 900 }}>{s}</a>)}</div></Panel>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }}>
        {['open','waiting','in_progress','completed'].map((col) => <Panel key={col} title={col.replace('_',' ').toUpperCase()} subtitle="Drag later; click now."><div style={{ display: 'grid', gap: 10 }}>{list.filter((t:any)=>t.status===col).map((t:any) => <RowLink key={t.id} href={`/revenue-command-center/tasks/${t.id}`}><strong>{t.title}</strong><span>{t.linked_type || 'general'} • {dateTime(t.due_at)}</span><Badge tone={isOverdue(t.due_at) && t.status !== 'completed' ? '#dc2626' : statusTone[t.status] || '#2563eb'}>{isOverdue(t.due_at) && t.status !== 'completed' ? 'OVERDUE' : t.priority}</Badge></RowLink>)}</div></Panel>)}
      </section>
    </div>
  </AppShell>
}
