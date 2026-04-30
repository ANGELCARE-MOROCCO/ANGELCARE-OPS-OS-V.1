import AppShell from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Field, Panel, Select, TextArea, WorkspaceHero } from '../../_components/BDV3Primitives'

export default async function NewTaskPage() {
  async function createTask(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const payload = {
      title: String(formData.get('title') || ''),
      description: String(formData.get('description') || ''),
      status: String(formData.get('status') || 'open'),
      priority: String(formData.get('priority') || 'normal'),
      assigned_to: String(formData.get('assigned_to') || '') || null,
      linked_type: String(formData.get('linked_type') || '') || null,
      linked_id: String(formData.get('linked_id') || '') || null,
      start_at: String(formData.get('start_at') || '') || null,
      due_at: String(formData.get('due_at') || '') || null,
    }
    const { data, error } = await supabase.from('bd_tasks').insert([payload]).select('id').single()
    if (error) throw new Error(error.message)
    redirect(`/revenue-command-center/tasks/${data.id}`)
  }
  return <AppShell title="Create BD Task" subtitle="Assign real work with time, status, owner and linked business context." breadcrumbs={[{ label: 'Tasks', href: '/revenue-command-center/tasks' }, { label: 'New' }]}>
    <form action={createTask} style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18 }}>
      <Panel title="Task definition" subtitle="Make it specific enough for tomorrow morning execution."><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}><Field name="title" label="Task title" required /><Select name="status" label="Status" options={[{value:'open',label:'Open'},{value:'waiting',label:'Waiting'},{value:'in_progress',label:'In progress'},{value:'completed',label:'Completed'}]} /><Select name="priority" label="Priority" options={[{value:'low',label:'Low'},{value:'normal',label:'Normal'},{value:'high',label:'High'},{value:'critical',label:'Critical'}]} /><Field name="assigned_to" label="Assigned user UUID (optional)" /><Field name="start_at" label="Start date/time" type="datetime-local" /><Field name="due_at" label="End/due date/time" type="datetime-local" /><Select name="linked_type" label="Linked to" options={[{value:'',label:'None'},{value:'prospect',label:'Prospect'},{value:'lead',label:'Lead'},{value:'family',label:'Family'},{value:'campaign',label:'Campaign'},{value:'appointment',label:'Appointment'},{value:'partnership',label:'Partnership'}]} /><Field name="linked_id" label="Linked record ID" /><div style={{ gridColumn: '1 / -1' }}><TextArea name="description" label="Description" /></div></div></Panel>
      <Panel title="Manager control" subtitle="This task will appear in Revenue tasks and user task dashboards."><button style={{ border: 'none', borderRadius: 14, background: '#0f172a', color: '#fff', padding: 14, fontWeight: 950, width: '100%' }}>Create task</button></Panel>
    </form>
  </AppShell>
}
