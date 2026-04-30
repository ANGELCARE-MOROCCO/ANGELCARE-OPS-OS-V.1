import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { addChecklistItem, addDeepComment, addWatcher, toggleChecklistItem } from '../../../depth/actions'
import { Badge, EmptyState, Panel, TimelineItem, formatDate } from '../../../_components/DepthPhase6Primitives'

export default async function TaskDepthPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: task }, { data: checklist }, { data: watchers }, { data: comments }, { data: logs }, { data: users }] = await Promise.all([
    supabase.from('bd_tasks').select('*').eq('id', id).maybeSingle(),
    supabase.from('bd_task_checklists').select('*').eq('task_id', id).order('created_at'),
    supabase.from('bd_task_watchers').select('*').eq('task_id', id),
    supabase.from('bd_task_comments').select('*').eq('task_id', id).order('created_at', { ascending: false }),
    supabase.from('bd_activity_logs').select('*').eq('entity_type', 'task').eq('entity_id', id).order('created_at', { ascending: false }).limit(25),
    supabase.from('app_users').select('id, full_name, username, role').order('full_name'),
  ])

  if (!task) notFound()

  const done = (checklist || []).filter((x: any) => x.is_done).length
  const total = (checklist || []).length
  const progress = total ? Math.round((done / total) * 100) : 0

  return (
    <AppShell
      title={`${task.title || 'Task'} — Execution Depth`}
      subtitle="Checklist, watchers, comments, and full activity timeline for serious operational follow-through."
      breadcrumbs={[{ label: 'Revenue Command', href: '/revenue-command-center' }, { label: 'Tasks', href: '/revenue-command-center/tasks' }, { label: 'Depth' }]}
      actions={<><PageAction href={`/revenue-command-center/tasks/${task.id}`} variant="light">Back Task</PageAction><PageAction href="/revenue-command-center/master-command">Master Command</PageAction></>}
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <section style={heroStyle}>
          <div>
            <div style={badgeRowStyle}><Badge>{task.status || 'open'}</Badge><Badge tone="#7c3aed">{task.priority || 'medium'}</Badge><Badge tone="#16a34a">{progress}% checklist</Badge></div>
            <h1 style={heroTitleStyle}>{task.title}</h1>
            <p style={heroTextStyle}>{task.description || 'No description.'}</p>
          </div>
          <div style={heroPanelStyle}><strong>Due</strong><span>{formatDate(task.due_at || task.planned_end_at)}</span></div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
          <Panel title="Execution Checklist" subtitle="Break the task into concrete proof-of-work steps.">
            <form action={addChecklistItem} style={formRowStyle}>
              <input type="hidden" name="task_id" value={task.id} />
              <input name="title" required placeholder="Add checklist item..." style={inputStyle} />
              <button type="submit" style={buttonStyle}>Add</button>
            </form>

            <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
              {(checklist || []).length ? (checklist || []).map((item: any) => (
                <form key={item.id} action={toggleChecklistItem} style={checkItemStyle}>
                  <input type="hidden" name="task_id" value={task.id} />
                  <input type="hidden" name="item_id" value={item.id} />
                  <input type="hidden" name="is_done" value={String(item.is_done)} />
                  <button type="submit" style={checkButtonStyle}>{item.is_done ? '✅' : '⬜'}</button>
                  <span style={{ textDecoration: item.is_done ? 'line-through' : 'none' }}>{item.title}</span>
                </form>
              )) : <EmptyState title="No checklist yet" text="Add execution steps to make this task operationally measurable." />}
            </div>
          </Panel>

          <Panel title="Watchers" subtitle="Add users who should supervise or stay informed.">
            <form action={addWatcher} style={formRowStyle}>
              <input type="hidden" name="task_id" value={task.id} />
              <select name="user_id" required style={inputStyle}>
                <option value="">Select watcher</option>
                {(users || []).map((u: any) => <option key={u.id} value={u.id}>{u.full_name || u.username} — {u.role}</option>)}
              </select>
              <button type="submit" style={buttonStyle}>Add</button>
            </form>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
              {(watchers || []).length ? (watchers || []).map((w: any) => <Badge key={w.id} tone="#2563eb">{w.user_id}</Badge>) : <Badge tone="#64748b">No watchers</Badge>}
            </div>
          </Panel>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
          <Panel title="Operational Comments" subtitle="Manager notes, blockers, proof of completion, and execution updates.">
            <form action={addDeepComment} style={{ display: 'grid', gap: 10 }}>
              <input type="hidden" name="task_id" value={task.id} />
              <textarea name="comment" required rows={4} placeholder="Add comment, blocker, decision, proof..." style={inputStyle} />
              <button type="submit" style={buttonStyle}>Add Comment</button>
            </form>

            <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
              {(comments || []).length ? (comments || []).map((c: any) => (
                <div key={c.id} style={commentStyle}><strong>{formatDate(c.created_at)}</strong><span>{c.comment}</span></div>
              )) : <EmptyState title="No comments" text="No operational updates have been logged yet." />}
            </div>
          </Panel>

          <Panel title="Full Activity Timeline" subtitle="Permanent task memory and traceability.">
            {(logs || []).length ? <div>{(logs || []).map((log: any) => <TimelineItem key={log.id} action={log.action} note={log.note} date={log.created_at} />)}</div> : <EmptyState title="No activity" text="Activity will appear as users interact with the task." />}
          </Panel>
        </section>
      </div>
    </AppShell>
  )
}

const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, padding: 30, borderRadius: 32, color: '#fff', background: 'radial-gradient(circle at top left,#0f172a,#020617 68%)', boxShadow: '0 28px 70px rgba(15,23,42,.22)' }
const badgeRowStyle: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 36, fontWeight: 950 }
const heroTextStyle: React.CSSProperties = { margin: '10px 0 0', color: '#cbd5e1', fontWeight: 750, maxWidth: 800, lineHeight: 1.6 }
const heroPanelStyle: React.CSSProperties = { minWidth: 220, display: 'grid', gap: 8, padding: 20, borderRadius: 24, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)' }
const formRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: 13, borderRadius: 13, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontWeight: 750 }
const buttonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, padding: '13px 16px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const checkItemStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0', fontWeight: 850 }
const checkButtonStyle: React.CSSProperties = { border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }
const commentStyle: React.CSSProperties = { display: 'grid', gap: 5, padding: 14, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }
