import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Badge, Field, Kpi, Panel, RowLink, Select, TextArea, WorkspaceHero, dateTime, money, statusTone } from '../../_components/BDV3Primitives'

export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: prospect } = await supabase.from('bd_prospects').select('*').eq('id', id).maybeSingle()
  if (!prospect) notFound()
  const [{ data: tasks }, { data: logs }] = await Promise.all([
    supabase.from('bd_tasks').select('*').eq('linked_type', 'prospect').eq('linked_id', id).order('due_at', { ascending: true }),
    supabase.from('bd_activity_logs').select('*').eq('entity_type', 'prospect').eq('entity_id', id).order('created_at', { ascending: false }).limit(20),
  ])
  async function updateProspect(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const payload = { company_name: String(formData.get('company_name')||''), contact_name: String(formData.get('contact_name')||''), phone: String(formData.get('phone')||''), email: String(formData.get('email')||''), city: String(formData.get('city')||''), segment: String(formData.get('segment')||''), channel: String(formData.get('channel')||''), status: String(formData.get('status')||'new'), priority: String(formData.get('priority')||'normal'), estimated_value: Number(formData.get('estimated_value')||0), next_action: String(formData.get('next_action')||''), next_action_at: String(formData.get('next_action_at')||'') || null, notes: String(formData.get('notes')||''), updated_at: new Date().toISOString() }
    const { error } = await supabase.from('bd_prospects').update(payload).eq('id', id)
    if (error) throw new Error(error.message)
    await supabase.from('bd_activity_logs').insert([{ entity_type: 'prospect', entity_id: id, action: 'update_prospect', details: payload }])
    redirect(`/revenue-command-center/prospects/${id}`)
  }
  async function addTask(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const title = String(formData.get('title')||'').trim()
    if (title) await supabase.from('bd_tasks').insert([{ title, description: String(formData.get('description')||''), priority: String(formData.get('priority')||'normal'), status: 'open', linked_type: 'prospect', linked_id: id, due_at: String(formData.get('due_at')||'') || null }])
    redirect(`/revenue-command-center/prospects/${id}`)
  }
  return <AppShell title={prospect.company_name || prospect.contact_name || 'Prospect'} subtitle="Full CRM profile with tasks, status, value, next actions and activity history." breadcrumbs={[{ label: 'Prospects', href: '/revenue-command-center/prospects' }, { label: prospect.company_name || 'Prospect' }]} actions={<><PageAction href="/revenue-command-center/tasks/new">New Task</PageAction><PageAction href="/revenue-command-center/prospects" variant="light">Back</PageAction></>}>
    <div style={{ display: 'grid', gap: 20 }}>
      <WorkspaceHero title={prospect.company_name || prospect.contact_name || 'Prospect'} subtitle={`${prospect.segment || 'No segment'} • ${prospect.city || 'No city'} • ${money(prospect.estimated_value)}`} actions={<Badge tone={statusTone[prospect.status] || '#2563eb'}>{prospect.status}</Badge>} />
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }}><Kpi title="Value" value={money(prospect.estimated_value)} tone="#16a34a" /><Kpi title="Tasks" value={String(tasks?.length || 0)} tone="#7c3aed" /><Kpi title="Priority" value={prospect.priority || 'normal'} tone="#f59e0b" /><Kpi title="Next action" value={prospect.next_action || '—'} /></section>
      <form action={updateProspect} style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 18 }}><Panel title="CRM Profile" subtitle="Keep this profile operational, not static."><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}><Field name="company_name" label="Company" defaultValue={prospect.company_name} /><Field name="contact_name" label="Contact" defaultValue={prospect.contact_name} /><Field name="phone" label="Phone" defaultValue={prospect.phone} /><Field name="email" label="Email" defaultValue={prospect.email} /><Field name="city" label="City" defaultValue={prospect.city} /><Field name="segment" label="Segment" defaultValue={prospect.segment} /><Field name="channel" label="Channel" defaultValue={prospect.channel} /><Field name="estimated_value" label="Estimated value" type="number" defaultValue={prospect.estimated_value} /><Select name="status" label="Status" defaultValue={prospect.status} options={[{value:'new',label:'New'},{value:'contacted',label:'Contacted'},{value:'qualified',label:'Qualified'},{value:'proposal',label:'Proposal'},{value:'won',label:'Won'},{value:'lost',label:'Lost'}]} /><Select name="priority" label="Priority" defaultValue={prospect.priority} options={[{value:'low',label:'Low'},{value:'normal',label:'Normal'},{value:'high',label:'High'},{value:'critical',label:'Critical'}]} /><Field name="next_action" label="Next action" defaultValue={prospect.next_action} /><Field name="next_action_at" label="Next action date" type="datetime-local" defaultValue={prospect.next_action_at ? prospect.next_action_at.slice(0,16) : ''} /><div style={{ gridColumn: '1 / -1' }}><TextArea name="notes" label="Notes" defaultValue={prospect.notes} /></div></div></Panel><Panel title="Save CRM changes" subtitle="Updates are logged to the activity feed."><button style={{ border: 'none', borderRadius: 14, background: '#0f172a', color: '#fff', padding: 14, fontWeight: 950, width: '100%' }}>Save profile</button></Panel></form>
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}><Panel title="Linked tasks" subtitle="Create and monitor work for this prospect."><form action={addTask} style={{ display: 'grid', gap: 10, marginBottom: 16 }}><Field name="title" label="Quick task title" /><Field name="due_at" label="Due" type="datetime-local" /><Select name="priority" label="Priority" options={[{value:'normal',label:'Normal'},{value:'high',label:'High'},{value:'critical',label:'Critical'}]} /><TextArea name="description" label="Description" /><button style={{ border: 'none', borderRadius: 14, background: '#0f172a', color: '#fff', padding: 12, fontWeight: 950 }}>Add prospect task</button></form><div style={{ display: 'grid', gap: 10 }}>{(tasks || []).map((t:any) => <RowLink key={t.id} href={`/revenue-command-center/tasks/${t.id}`}><strong>{t.title}</strong><span>{dateTime(t.due_at)} • {t.status}</span></RowLink>)}</div></Panel><Panel title="Activity history" subtitle="CRM actions and logs."><div style={{ display: 'grid', gap: 10 }}>{(logs || []).map((l:any) => <div key={l.id} style={{ padding: 14, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }}><strong>{l.action}</strong><p>{dateTime(l.created_at)}</p></div>)}</div></Panel></section>
    </div>
  </AppShell>
}
