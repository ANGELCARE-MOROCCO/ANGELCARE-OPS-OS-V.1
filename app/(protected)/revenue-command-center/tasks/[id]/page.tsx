import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Badge, Field, Panel, Select, TextArea, WorkspaceHero, dateTime, isOverdue, statusTone } from '../../_components/BDV3Primitives'

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: task } = await supabase.from('bd_tasks').select('*').eq('id', id).maybeSingle()
  if (!task) notFound()
  const { data: comments } = await supabase.from('bd_task_comments').select('*').eq('task_id', id).order('created_at', { ascending: false })

  async function updateTask(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const status = String(formData.get('status') || task.status)
    const payload: any = {
      title: String(formData.get('title') || ''), description: String(formData.get('description') || ''), status,
      priority: String(formData.get('priority') || 'normal'), assigned_to: String(formData.get('assigned_to') || '') || null,
      linked_type: String(formData.get('linked_type') || '') || null, linked_id: String(formData.get('linked_id') || '') || null,
      start_at: String(formData.get('start_at') || '') || null, due_at: String(formData.get('due_at') || '') || null,
      completed_at: status === 'completed' ? new Date().toISOString() : null, updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('bd_tasks').update(payload).eq('id', id)
    if (error) throw new Error(error.message)
    redirect(`/revenue-command-center/tasks/${id}`)
  }
  async function addComment(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const comment = String(formData.get('comment') || '').trim()
    if (comment) await supabase.from('bd_task_comments').insert([{ task_id: id, comment }])
    redirect(`/revenue-command-center/tasks/${id}`)
  }

  return <AppShell title={task.title} subtitle="Task detail, comments, timing, ownership and linked context." breadcrumbs={[{ label: 'Tasks', href: '/revenue-command-center/tasks' }, { label: task.title }]} actions={<PageAction href="/revenue-command-center/tasks" variant="light">Back to board</PageAction>}>
    <div style={{ display: 'grid', gap: 20 }}>
      <WorkspaceHero title={task.title} subtitle={`${task.linked_type || 'General task'} • ${task.priority} priority • due ${dateTime(task.due_at)}`} actions={<Badge tone={isOverdue(task.due_at) && task.status !== 'completed' ? '#dc2626' : statusTone[task.status] || '#2563eb'}>{isOverdue(task.due_at) && task.status !== 'completed' ? 'OVERDUE' : task.status}</Badge>} />
      <form action={updateTask} style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 18 }}>
        <Panel title="Task control panel" subtitle="Edit workflow data and operational ownership."><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}><Field name="title" label="Title" defaultValue={task.title} /><Select name="status" label="Status" defaultValue={task.status} options={[{value:'open',label:'Open'},{value:'waiting',label:'Waiting'},{value:'in_progress',label:'In progress'},{value:'completed',label:'Completed'}]} /><Select name="priority" label="Priority" defaultValue={task.priority} options={[{value:'low',label:'Low'},{value:'normal',label:'Normal'},{value:'high',label:'High'},{value:'critical',label:'Critical'}]} /><Field name="assigned_to" label="Assigned user UUID" defaultValue={task.assigned_to} /><Field name="start_at" label="Start" type="datetime-local" defaultValue={task.start_at ? task.start_at.slice(0,16) : ''} /><Field name="due_at" label="End / due" type="datetime-local" defaultValue={task.due_at ? task.due_at.slice(0,16) : ''} /><Select name="linked_type" label="Linked type" defaultValue={task.linked_type || ''} options={[{value:'',label:'None'},{value:'prospect',label:'Prospect'},{value:'lead',label:'Lead'},{value:'family',label:'Family'},{value:'campaign',label:'Campaign'},{value:'appointment',label:'Appointment'},{value:'partnership',label:'Partnership'}]} /><Field name="linked_id" label="Linked ID" defaultValue={task.linked_id} /><div style={{ gridColumn: '1 / -1' }}><TextArea name="description" label="Description" defaultValue={task.description} /></div></div></Panel>
        <Panel title="Timer monitor" subtitle="Operational state."><div style={{ display: 'grid', gap: 12 }}><Badge tone={isOverdue(task.due_at) && task.status !== 'completed' ? '#dc2626' : '#16a34a'}>{isOverdue(task.due_at) && task.status !== 'completed' ? 'Overdue / flag user' : 'Inside timing window'}</Badge><div><strong>Start:</strong> {dateTime(task.start_at)}</div><div><strong>Due:</strong> {dateTime(task.due_at)}</div><div><strong>Completed:</strong> {dateTime(task.completed_at)}</div><button style={{ border: 'none', borderRadius: 14, background: '#0f172a', color: '#fff', padding: 14, fontWeight: 950 }}>Save changes</button></div></Panel>
      </form>
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <Panel title="Comments" subtitle="Manager and agent discussion."><form action={addComment} style={{ display: 'grid', gap: 10, marginBottom: 16 }}><TextArea name="comment" label="Add comment" /><button style={{ border: 'none', borderRadius: 14, background: '#0f172a', color: '#fff', padding: 12, fontWeight: 950 }}>Post comment</button></form><div style={{ display: 'grid', gap: 10 }}>{(comments || []).map((c:any) => <div key={c.id} style={{ padding: 14, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }}><strong>{dateTime(c.created_at)}</strong><p>{c.comment}</p></div>)}</div></Panel>
        <Panel title="Linked context" subtitle="Connect this task to the business object it supports."><div><strong>Type:</strong> {task.linked_type || '—'}</div><div><strong>ID:</strong> {task.linked_id || '—'}</div></Panel>
      </section>
    </div>
  </AppShell>
}
