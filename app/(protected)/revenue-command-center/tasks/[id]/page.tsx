import React from 'react'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'

function clean(v: FormDataEntryValue | null) {
  const value = String(v || '').trim()
  return value || null
}

function formatDate(value?: string | null) {
  if (!value) return 'No date'
  try {
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function statusTone(status?: string | null) {
  const value = String(status || 'open').toLowerCase()
  if (['completed', 'done', 'closed'].includes(value)) return '#16a34a'
  if (['in_progress', 'progress', 'active'].includes(value)) return '#2563eb'
  if (['waiting', 'blocked', 'paused'].includes(value)) return '#d97706'
  if (['cancelled', 'canceled'].includes(value)) return '#dc2626'
  return '#64748b'
}

function priorityTone(priority?: string | null) {
  const value = String(priority || 'normal').toLowerCase()
  if (['critical', 'urgent'].includes(value)) return '#dc2626'
  if (value === 'high') return '#f97316'
  if (['medium', 'normal'].includes(value)) return '#2563eb'
  return '#64748b'
}

async function updateTask(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const id = clean(formData.get('id'))

  if (!id) throw new Error('Task id is required')

  const payload = {
    title: clean(formData.get('title')) || 'Untitled task',
    description: clean(formData.get('description')),
    status: clean(formData.get('status')) || 'open',
    priority: clean(formData.get('priority')) || 'normal',
    assigned_to: clean(formData.get('assigned_to')),
    related_type: clean(formData.get('related_type')),
    related_id: clean(formData.get('related_id')),
    linked_type: clean(formData.get('linked_type')),
    linked_id: clean(formData.get('linked_id')),
    due_at: clean(formData.get('due_at')),
  }

  const { error } = await supabase.from('bd_tasks').update(payload).eq('id', id)
  if (error) throw new Error(error.message)

  await supabase.from('bd_activity_logs').insert({
    entity_type: 'task',
    entity_id: id,
    action: 'task_updated',
    note: `Task updated: ${payload.status} / ${payload.priority}`,
  })

  revalidatePath(`/revenue-command-center/tasks/${id}`)
}

async function quickStatus(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const id = clean(formData.get('id'))
  const status = clean(formData.get('status'))

  if (!id) throw new Error('Task id is required')
  if (!status) throw new Error('Status is required')

  const { error } = await supabase.from('bd_tasks').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)

  await supabase.from('bd_activity_logs').insert({
    entity_type: 'task',
    entity_id: id,
    action: 'status_updated',
    note: status,
  })

  revalidatePath(`/revenue-command-center/tasks/${id}`)
}

async function addChecklistItem(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const task_id = clean(formData.get('task_id'))
  const title = clean(formData.get('title'))

  if (!task_id) throw new Error('Task id is required')
  if (!title) throw new Error('Checklist title is required')

  const { error } = await supabase.from('bd_task_checklist_items').insert({
    task_id,
    title,
    status: 'open',
  })

  if (error) throw new Error(error.message)

  await supabase.from('bd_activity_logs').insert({
    entity_type: 'task',
    entity_id: task_id,
    action: 'checklist_added',
    note: title,
  })

  revalidatePath(`/revenue-command-center/tasks/${task_id}`)
}

async function toggleChecklistItem(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const task_id = clean(formData.get('task_id'))
  const item_id = clean(formData.get('item_id'))
  const status = clean(formData.get('status')) || 'done'

  if (!task_id) throw new Error('Task id is required')
  if (!item_id) throw new Error('Checklist item id is required')

  const { error } = await supabase
    .from('bd_task_checklist_items')
    .update({ status })
    .eq('id', item_id)

  if (error) throw new Error(error.message)

  await supabase.from('bd_activity_logs').insert({
    entity_type: 'task',
    entity_id: task_id,
    action: 'checklist_updated',
    note: `Checklist item ${status}`,
  })

  revalidatePath(`/revenue-command-center/tasks/${task_id}`)
}

async function addComment(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const task_id = clean(formData.get('task_id'))
  const comment = clean(formData.get('comment'))

  if (!task_id) throw new Error('Task id is required')
  if (!comment) throw new Error('Comment is required')

  const { error } = await supabase.from('bd_task_comments').insert({
    task_id,
    comment,
  })

  if (error) throw new Error(error.message)

  await supabase.from('bd_activity_logs').insert({
    entity_type: 'task',
    entity_id: task_id,
    action: 'comment_added',
    note: comment,
  })

  revalidatePath(`/revenue-command-center/tasks/${task_id}`)
}

export default async function RevenueTaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: task },
    { data: users },
    { data: checklist },
    { data: comments },
    { data: logs },
  ] = await Promise.all([
    supabase.from('bd_tasks').select('*').eq('id', id).maybeSingle(),
    supabase.from('app_users').select('id, full_name, username, role').order('full_name'),
    supabase.from('bd_task_checklist_items').select('*').eq('task_id', id).order('created_at', { ascending: true }),
    supabase.from('bd_task_comments').select('*').eq('task_id', id).order('created_at', { ascending: false }),
    supabase.from('bd_activity_logs').select('*').eq('entity_type', 'task').eq('entity_id', id).order('created_at', { ascending: false }).limit(50),
  ])

  if (!task) notFound()

  const owner = (users || []).find((u: any) => u.id === task.assigned_to || u.id === task.owner_id)
  const doneItems = (checklist || []).filter((i: any) => ['done', 'completed'].includes(String(i.status || '').toLowerCase()))
  const checklistRate = checklist?.length ? Math.round((doneItems.length / checklist.length) * 100) : 0

  return (
    <AppShell
      title={`${task.title || 'Task'} — Execution Room`}
      subtitle="Editable task command page with controls, checklist, comments, and timeline."
      breadcrumbs={[
        { label: 'Revenue Command', href: '/revenue-command-center' },
        { label: 'Tasks', href: '/revenue-command-center/tasks' },
        { label: task.title || 'Task' },
      ]}
      actions={
        <>
          <PageAction href="/revenue-command-center/tasks" variant="light">Back</PageAction>
          <PageAction href="/revenue-command-center/tasks/new">New Task</PageAction>
        </>
      }
    >
      <div style={pageStyle}>
        <section style={heroStyle}>
          <div style={{ minWidth: 0 }}>
            <div style={badgeRowStyle}>
              <span style={{ ...heroPillStyle, color: '#16a34a', background: '#dcfce7' }}>{task.status || 'open'}</span>
              <span style={{ ...heroPillStyle, color: priorityTone(task.priority), background: '#fff7ed' }}>{task.priority || 'normal'}</span>
              <span style={{ ...heroPillStyle, color: '#dbeafe', background: 'rgba(255,255,255,.14)', borderColor: 'rgba(255,255,255,.22)' }}>
                Owner: {owner?.full_name || owner?.username || 'Unassigned'}
              </span>
            </div>

            <h1 style={heroTitleStyle}>{task.title || 'Untitled task'}</h1>
            <p style={heroTextStyle}>{task.description || 'No description yet. Add execution instructions below.'}</p>

            <div style={heroMetaGridStyle}>
              <span>Due: {formatDate(task.due_at)}</span>
              <span>Linked: {task.linked_type || task.related_type || 'none'}</span>
              <span>ID: {String(task.id).slice(0, 8)}…</span>
            </div>
          </div>

          <div style={heroPanelStyle}>
            <small style={{ color: '#94a3b8', fontWeight: 900 }}>CHECKLIST PROGRESS</small>
            <strong style={{ color: '#fff', fontSize: 44, fontWeight: 950 }}>{checklistRate}%</strong>
            <div style={progressTrackStyle}>
              <div style={{ ...progressFillStyle, width: `${checklistRate}%` }} />
            </div>
            <span style={{ color: '#e2e8f0', fontWeight: 800 }}>{doneItems.length}/{checklist?.length || 0} completed</span>
          </div>
        </section>

        <section style={statusGridStyle}>
          {['open', 'in_progress', 'waiting', 'completed'].map((status) => (
            <form key={status} action={quickStatus}>
              <input type="hidden" name="id" value={task.id} />
              <input type="hidden" name="status" value={status} />
              <button
                type="submit"
                style={{
                  ...statusButtonStyle,
                  borderColor: statusTone(status),
                  color: statusTone(status),
                }}
              >
                Set {status.replaceAll('_', ' ')}
              </button>
            </form>
          ))}
        </section>

        <section style={mainGridStyle}>
          <Panel title="Editable Task Configuration" subtitle="Update ownership, status, priority, timing, and linked context.">
            <form action={updateTask} style={formGridStyle}>
              <input type="hidden" name="id" value={task.id} />

              <input name="title" defaultValue={task.title || ''} required style={inputStyle} />
              <textarea name="description" defaultValue={task.description || ''} rows={6} style={textareaStyle} />

              <div style={twoColStyle}>
                <select name="status" defaultValue={task.status || 'open'} style={inputStyle}>
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="waiting">Waiting</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select name="priority" defaultValue={task.priority || 'normal'} style={inputStyle}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div style={twoColStyle}>
                <input name="assigned_to" defaultValue={task.assigned_to || task.owner_id || ''} placeholder="Assigned user UUID" style={inputStyle} />
                <input name="due_at" type="datetime-local" defaultValue={task.due_at ? String(task.due_at).slice(0, 16) : ''} style={inputStyle} />
              </div>

              <div style={twoColStyle}>
                <input name="linked_type" defaultValue={task.linked_type || task.related_type || ''} placeholder="linked type" style={inputStyle} />
                <input name="linked_id" defaultValue={task.linked_id || task.related_id || ''} placeholder="linked id" style={inputStyle} />
              </div>

              <input type="hidden" name="related_type" value={task.related_type || task.linked_type || ''} />
              <input type="hidden" name="related_id" value={task.related_id || task.linked_id || ''} />

              <button type="submit" style={primaryButtonStyle}>Save Task Configuration</button>
            </form>
          </Panel>

          <div style={sideStackStyle}>
            <Panel title="Checklist / Subtasks" subtitle="Break work into execution steps.">
              <form action={addChecklistItem} style={inlineFormStyle}>
                <input type="hidden" name="task_id" value={task.id} />
                <input name="title" placeholder="Add checklist item..." style={inputStyle} />
                <button type="submit" style={compactButtonStyle}>Add</button>
              </form>

              <div style={checklistStyle}>
                {(checklist || []).length ? (checklist || []).map((item: any) => {
                  const done = ['done', 'completed'].includes(String(item.status || '').toLowerCase())
                  return (
                    <div key={item.id} style={checkItemStyle}>
                      <form action={toggleChecklistItem}>
                        <input type="hidden" name="task_id" value={task.id} />
                        <input type="hidden" name="item_id" value={item.id} />
                        <input type="hidden" name="status" value={done ? 'open' : 'done'} />
                        <button type="submit" style={checkboxButtonStyle}>{done ? '✅' : '⬜'}</button>
                      </form>
                      <span style={{ color: '#0f172a', fontWeight: 850, textDecoration: done ? 'line-through' : 'none' }}>{item.title}</span>
                    </div>
                  )
                }) : <EmptyState title="No checklist" text="Add the first execution step." />}
              </div>
            </Panel>

            <Panel title="Task Intelligence" subtitle="Current operational context.">
              <div style={infoGridStyle}>
                <Info label="Created" value={formatDate(task.created_at)} />
                <Info label="Due" value={formatDate(task.due_at)} />
                <Info label="Owner" value={owner?.full_name || owner?.username || 'Unassigned'} />
                <Info label="Linked" value={`${task.linked_type || task.related_type || 'none'}`} />
              </div>
            </Panel>
          </div>
        </section>

        <section style={mainGridStyle}>
          <Panel title="Advanced Comments & Agent Logs" subtitle="Add blockers, decisions, updates, and next actions.">
            <form action={addComment} style={formGridStyle}>
              <input type="hidden" name="task_id" value={task.id} />
              <textarea name="comment" rows={4} required placeholder="Write comment..." style={textareaStyle} />
              <button type="submit" style={primaryButtonStyle}>Add Comment</button>
            </form>

            <div style={commentListStyle}>
              {(comments || []).length ? (comments || []).map((c: any) => (
                <div key={c.id} style={commentStyle}>
                  <p style={{ margin: 0, color: '#0f172a', fontWeight: 750 }}>{c.comment}</p>
                  <small style={{ color: '#64748b', fontWeight: 800 }}>{formatDate(c.created_at)}</small>
                </div>
              )) : <EmptyState title="No comments" text="Comments will appear here." />}
            </div>
          </Panel>

          <Panel title="Task Event Timeline" subtitle="System and user events.">
            <div style={timelineStyle}>
              {(logs || []).length ? (logs || []).map((log: any) => (
                <div key={log.id} style={timelineRowStyle}>
                  <span style={timelineDotStyle}>●</span>
                  <div>
                    <strong style={{ color: '#0f172a' }}>{log.action || 'Task event'}</strong>
                    <p style={{ margin: '4px 0', color: '#475569', fontWeight: 700 }}>{log.note || log.message || 'No details recorded.'}</p>
                    <small style={{ color: '#64748b', fontWeight: 800 }}>{formatDate(log.created_at)}</small>
                  </div>
                </div>
              )) : <EmptyState title="No events" text="Events appear after updates." />}
            </div>
          </Panel>
        </section>
      </div>
    </AppShell>
  )
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section style={panelStyle}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={panelTitleStyle}>{title}</h2>
        {subtitle ? <p style={panelSubtitleStyle}>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  )
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div style={infoStyle}>
      <span>{label}</span>
      <strong>{value || '—'}</strong>
    </div>
  )
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div style={emptyStyle}>
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  )
}

const pageStyle: React.CSSProperties = { display: 'grid', gap: 22, color: '#0f172a' }
const heroStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0,1fr) 330px',
  gap: 22,
  padding: 30,
  borderRadius: 30,
  color: '#fff',
  background: 'radial-gradient(circle at top left,#3b82f6 0,#1d4ed8 35%,#020617 82%)',
  boxShadow: '0 28px 70px rgba(15,23,42,.24)',
  border: '1px solid rgba(255,255,255,.12)',
}
const badgeRowStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }
const heroPillStyle: React.CSSProperties = {
  border: '1px solid transparent',
  borderRadius: 999,
  padding: '6px 11px',
  fontWeight: 950,
  fontSize: 12,
}
const heroTitleStyle: React.CSSProperties = {
  margin: 0,
  color: '#ffffff',
  fontSize: 38,
  fontWeight: 950,
  lineHeight: 1.08,
  letterSpacing: '-.04em',
  textShadow: '0 2px 18px rgba(0,0,0,.28)',
}
const heroTextStyle: React.CSSProperties = {
  margin: '12px 0 0',
  color: '#eff6ff',
  fontWeight: 850,
  lineHeight: 1.6,
  maxWidth: 900,
}
const heroMetaGridStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  marginTop: 18,
  color: '#dbeafe',
  fontWeight: 850,
  fontSize: 13,
}
const heroPanelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  padding: 20,
  borderRadius: 24,
  background: 'rgba(15,23,42,.62)',
  border: '1px solid rgba(255,255,255,.18)',
  boxShadow: 'inset 0 0 30px rgba(255,255,255,.05)',
}
const progressTrackStyle: React.CSSProperties = { height: 12, borderRadius: 999, background: 'rgba(255,255,255,.20)', overflow: 'hidden' }
const progressFillStyle: React.CSSProperties = { height: '100%', background: 'linear-gradient(90deg,#22c55e,#86efac)', borderRadius: 999 }
const statusGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 }
const statusButtonStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid',
  borderRadius: 16,
  padding: 14,
  background: '#fff',
  fontWeight: 950,
  cursor: 'pointer',
  boxShadow: '0 12px 28px rgba(15,23,42,.05)',
}
const mainGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }
const panelStyle: React.CSSProperties = {
  borderRadius: 26,
  padding: 22,
  background: 'rgba(255,255,255,.92)',
  border: '1px solid #e2e8f0',
  boxShadow: '0 20px 46px rgba(15,23,42,.08)',
}
const panelTitleStyle: React.CSSProperties = { margin: 0, fontSize: 20, fontWeight: 950, color: '#0f172a', letterSpacing: '-.02em' }
const panelSubtitleStyle: React.CSSProperties = { margin: '6px 0 0', color: '#64748b', fontWeight: 750, lineHeight: 1.5 }
const formGridStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 14,
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  background: '#f8fafc',
  color: '#0f172a',
  fontWeight: 850,
  outline: 'none',
}
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: 'vertical', minHeight: 120 }
const twoColStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
const primaryButtonStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: 15,
  padding: '14px 16px',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 950,
  cursor: 'pointer',
  boxShadow: '0 16px 28px rgba(15,23,42,.18)',
}
const compactButtonStyle: React.CSSProperties = { ...primaryButtonStyle, padding: '0 18px' }
const sideStackStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const inlineFormStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }
const checklistStyle: React.CSSProperties = { display: 'grid', gap: 9, marginTop: 14 }
const checkItemStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '38px 1fr',
  gap: 8,
  alignItems: 'center',
  padding: 12,
  borderRadius: 15,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
}
const checkboxButtonStyle: React.CSSProperties = { border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer' }
const infoGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }
const infoStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
  padding: 13,
  borderRadius: 16,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
}
const commentListStyle: React.CSSProperties = { display: 'grid', gap: 10, marginTop: 14 }
const commentStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 14, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }
const timelineStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const timelineRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '20px 1fr',
  gap: 10,
  padding: 14,
  borderRadius: 16,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
}
const timelineDotStyle: React.CSSProperties = { color: '#2563eb', fontSize: 18 }
const emptyStyle: React.CSSProperties = {
  display: 'grid',
  gap: 5,
  padding: 18,
  borderRadius: 16,
  background: '#f8fafc',
  border: '1px dashed #cbd5e1',
  color: '#64748b',
}