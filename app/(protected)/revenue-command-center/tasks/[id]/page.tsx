import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge, EmptyState, Kpi, Panel, TimelineRow, formatDate, taskSignal } from '../../_components/TaskExecutionEnginePrimitives'
import { addTaskChecklistItem, addTaskComment, escalateTask, toggleTaskChecklistItem, updateTaskStatus } from '../actions'

export default async function TaskExecutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: task }, { data: checklist }, { data: comments }, { data: logs }] = await Promise.all([
    supabase.from('bd_tasks').select('*').eq('id', id).maybeSingle(),
    supabase.from('bd_task_checklists').select('*').eq('task_id', id).order('created_at'),
    supabase.from('bd_task_comments').select('*').eq('task_id', id).order('created_at', { ascending: false }),
    supabase.from('bd_activity_logs').select('*').eq('entity_type', 'task').eq('entity_id', id).order('created_at', { ascending: false }).limit(25),
  ])

  if (!task) notFound()

  const signal = taskSignal(task)
  const done = (checklist || []).filter((x: any) => x.is_done).length
  const total = (checklist || []).length
  const progress = total ? Math.round((done / total) * 100) : 0

  return (
    <AppShell
      title={`${task.title || 'Task'} — Execution Engine`}
      subtitle="Operational task room: status, checklist, comments, escalation, and activity timeline."
      breadcrumbs={[{ label: 'Revenue Command', href: '/revenue-command-center' }, { label: 'Tasks', href: '/revenue-command-center/tasks' }, { label: task.title || 'Task' }]}
      actions={<><PageAction href="/revenue-command-center/tasks" variant="light">Back</PageAction><PageAction href="/revenue-command-center/tasks/board">Board</PageAction></>}
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <section style={heroStyle}>
          <div>
            <div style={badgeRowStyle}><Badge tone={signal.color}>{signal.icon} {signal.label}</Badge><Badge>{task.status || 'open'}</Badge><Badge tone="#d97706">{task.priority || 'medium'}</Badge></div>
            <h1 style={heroTitleStyle}>{task.title || 'Untitled task'}</h1>
            <p style={heroTextStyle}>{task.description || signal.reason}</p>
          </div>
          <div style={heroPanelStyle}><small>Due</small><strong>{formatDate(task.due_at || task.planned_end_at)}</strong><span>{signal.reason}</span></div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 }}>
          <Kpi title="Checklist" value={`${progress}%`} sub={`${done}/${total} complete`} tone="#16a34a" />
          <Kpi title="Status" value={task.status || 'open'} sub="execution state" tone="#2563eb" />
          <Kpi title="Priority" value={task.priority || 'medium'} sub="work pressure" tone="#d97706" />
          <Kpi title="Escalation" value={task.escalation_level || 0} sub="manager pressure" tone="#dc2626" />
        </section>

        <Panel title="Status Controls" subtitle="Move task through execution lifecycle.">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {['open', 'waiting', 'in_progress', 'completed'].map((status) => (
              <form key={status} action={updateTaskStatus}>
                <input type="hidden" name="task_id" value={task.id} />
                <input type="hidden" name="status" value={status} />
                <button type="submit" style={statusButtonStyle}>{status.replaceAll('_', ' ').toUpperCase()}</button>
              </form>
            ))}
          </div>
        </Panel>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
          <Panel title="Execution Checklist" subtitle="Proof-of-work steps for the task.">
            <form action={addTaskChecklistItem} style={formRowStyle}>
              <input type="hidden" name="task_id" value={task.id} />
              <input name="title" required placeholder="Add checklist item..." style={inputStyle} />
              <button type="submit" style={buttonStyle}>Add</button>
            </form>
            <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
              {(checklist || []).length ? (checklist || []).map((item: any) => (
                <form key={item.id} action={toggleTaskChecklistItem} style={checkItemStyle}>
                  <input type="hidden" name="task_id" value={task.id} />
                  <input type="hidden" name="item_id" value={item.id} />
                  <input type="hidden" name="is_done" value={String(item.is_done)} />
                  <button type="submit" style={checkButtonStyle}>{item.is_done ? '✅' : '⬜'}</button>
                  <span style={{ textDecoration: item.is_done ? 'line-through' : 'none' }}>{item.title}</span>
                </form>
              )) : <EmptyState title="No checklist" text="Add concrete execution steps." />}
            </div>
          </Panel>

          <Panel title="Comments & Escalation" subtitle="Log updates or escalate blocked work.">
            <form action={addTaskComment} style={formStyle}>
              <input type="hidden" name="task_id" value={task.id} />
              <textarea name="comment" rows={4} required placeholder="Add operational comment..." style={inputStyle} />
              <button type="submit" style={buttonStyle}>Add Comment</button>
            </form>
            <div style={{ height: 12 }} />
            <form action={escalateTask} style={formStyle}>
              <input type="hidden" name="task_id" value={task.id} />
              <textarea name="blocker" rows={3} placeholder="Why is this blocked / escalated?" style={inputStyle} />
              <button type="submit" style={dangerButtonStyle}>Escalate Task</button>
            </form>
          </Panel>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
          <Panel title="Recent Comments">
            <div style={{ display: 'grid', gap: 10 }}>
              {(comments || []).length ? (comments || []).slice(0, 8).map((c: any) => <TimelineRow key={c.id} icon="💬" title="Comment" text={c.comment} date={c.created_at} />) : <EmptyState title="No comments" text="No task comments yet." />}
            </div>
          </Panel>

          <Panel title="Activity Timeline">
            <div style={{ display: 'grid', gap: 10 }}>
              {(logs || []).length ? (logs || []).map((log: any) => <TimelineRow key={log.id} icon="🧾" title={log.action || 'activity'} text={log.note || '—'} date={log.created_at} />) : <EmptyState title="No activity yet" text="Actions on this task will appear here." />}
            </div>
          </Panel>
        </section>
      </div>
    </AppShell>
  )
}

const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, padding: 30, borderRadius: 32, color: '#fff', background: 'radial-gradient(circle at top left,#0f172a,#020617 68%)', boxShadow: '0 28px 70px rgba(15,23,42,.22)' }
const badgeRowStyle: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 38, fontWeight: 950 }
const heroTextStyle: React.CSSProperties = { margin: '10px 0 0', color: '#cbd5e1', fontWeight: 750, maxWidth: 760, lineHeight: 1.6 }
const heroPanelStyle: React.CSSProperties = { minWidth: 280, display: 'grid', gap: 7, padding: 20, borderRadius: 24, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)' }
const formStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const formRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: 13, borderRadius: 13, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontWeight: 750 }
const buttonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, padding: '13px 16px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const dangerButtonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, padding: '13px 16px', background: '#dc2626', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const statusButtonStyle: React.CSSProperties = { border: '1px solid #dbe3ee', borderRadius: 14, padding: '12px 14px', background: '#fff', color: '#0f172a', fontWeight: 950, cursor: 'pointer' }
const checkItemStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 850 }
const checkButtonStyle: React.CSSProperties = { border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }
