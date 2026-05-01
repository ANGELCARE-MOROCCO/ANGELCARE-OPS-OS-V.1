import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  ActionButton, Badge, EmptyState, Field, Kpi, Panel, TimelineRow,
  formatCurrency, formatDate, prospectSignal,
} from '../../_components/ProspectActionRoomPrimitives'
import {
  addProspectRoomNote, createProspectAppointment, createProspectRoomTask,
  logProspectRoomAction, updateProspectNextAction,
} from '../actions'

export default async function ProspectActionRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: prospect }, { data: users }, { data: tasks }, { data: notes },
    { data: actions }, { data: appointments }, { data: logs },
  ] = await Promise.all([
    supabase.from('bd_prospects').select('*').eq('id', id).maybeSingle(),
    supabase.from('app_users').select('id, full_name, username, role').order('full_name'),
    supabase.from('bd_tasks').select('*').eq('related_type', 'prospect').eq('related_id', id).order('created_at', { ascending: false }),
    supabase.from('bd_prospect_notes').select('*').eq('prospect_id', id).order('created_at', { ascending: false }),
    supabase.from('bd_prospect_actions').select('*').eq('prospect_id', id).order('created_at', { ascending: false }),
    supabase.from('bd_appointments').select('*').eq('related_type', 'prospect').eq('related_id', id).order('scheduled_at', { ascending: true }),
    supabase.from('bd_activity_logs').select('*').eq('entity_type', 'prospect').eq('entity_id', id).order('created_at', { ascending: false }).limit(20),
  ])

  if (!prospect) notFound()

  const signal = prospectSignal(prospect)
  const openTasks = (tasks || []).filter((task: any) => task.status !== 'completed')
  const upcomingAppointments = (appointments || []).filter((a: any) => a.scheduled_at && a.scheduled_at >= new Date().toISOString())
  const owner = (users || []).find((u: any) => u.id === prospect.owner_id)

  const timeline = [
    ...(actions || []).map((a: any) => ({ id: `a-${a.id}`, icon: actionIcon(a.action_type), title: actionLabel(a.action_type), text: a.outcome || a.next_action || 'Action logged', date: a.created_at })),
    ...(notes || []).map((n: any) => ({ id: `n-${n.id}`, icon: '📝', title: `Note — ${n.note_type || 'general'}`, text: n.content, date: n.created_at })),
    ...(logs || []).map((l: any) => ({ id: `l-${l.id}`, icon: '🧾', title: l.action || 'activity', text: l.note || 'System activity', date: l.created_at })),
  ].sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())

  return (
    <AppShell
      title={`${prospect.name || 'Prospect'} — Action Room`}
      subtitle="One-screen operating room for qualification, follow-up, notes, tasks, appointments, and timeline."
      breadcrumbs={[{ label: 'Revenue Command', href: '/revenue-command-center' }, { label: 'Prospects', href: '/revenue-command-center/prospects' }, { label: prospect.name || 'Action Room' }]}
      actions={<><PageAction href="/revenue-command-center/prospects" variant="light">Back</PageAction><PageAction href="/revenue-command-center/tasks/new">Create Task</PageAction></>}
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <section style={heroStyle}>
          <div>
            <div style={badgeRowStyle}>
              <Badge tone={signal.color}>{signal.icon} {signal.label}</Badge>
              <Badge tone="#7c3aed">{prospect.stage || 'prospecting'}</Badge>
              <Badge tone="#2563eb">{prospect.segment || 'No segment'}</Badge>
              <Badge tone="#d97706">{prospect.priority || 'medium'}</Badge>
            </div>
            <h1 style={heroTitleStyle}>{prospect.name || 'Unnamed prospect'}</h1>
            <p style={heroTextStyle}>{signal.reason}</p>
          </div>
          <div style={heroPanelStyle}>
            <small>Next Action</small>
            <strong>{prospect.next_action || 'Missing next action'}</strong>
            <span>{formatDate(prospect.next_action_at)}</span>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 12 }}>
          <Kpi title="Value" value={formatCurrency(prospect.estimated_value)} sub="estimated" tone="#16a34a" />
          <Kpi title="Probability" value={`${prospect.probability || 0}%`} sub="conversion probability" tone="#2563eb" />
          <Kpi title="Strategic" value={prospect.strategic_value || 0} sub="strategic score" tone="#7c3aed" />
          <Kpi title="Open Tasks" value={openTasks.length} sub="active execution" tone="#d97706" />
          <Kpi title="Meetings" value={upcomingAppointments.length} sub="upcoming" tone="#0f172a" />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 18, alignItems: 'start' }}>
          <Panel title="Prospect Intelligence" subtitle="Core CRM context needed before taking action.">
            <div style={infoGridStyle}>
              <Field label="Owner" value={owner?.full_name || owner?.username || 'Unassigned'} />
              <Field label="Status" value={prospect.status || 'new'} />
              <Field label="Stage" value={prospect.stage || 'prospecting'} />
              <Field label="City" value={prospect.city || '—'} />
              <Field label="Phone" value={prospect.phone || '—'} />
              <Field label="Email" value={prospect.email || '—'} />
            </div>
            <div style={contactActionStyle}>
              {prospect.phone ? <ActionButton href={`tel:${prospect.phone}`}>Call</ActionButton> : <ActionButton variant="light">No phone</ActionButton>}
              {prospect.phone ? <ActionButton href={`https://wa.me/${String(prospect.phone).replace(/[^0-9]/g, '')}`} variant="success">WhatsApp</ActionButton> : <ActionButton variant="light">No WhatsApp</ActionButton>}
              {prospect.email ? <ActionButton href={`mailto:${prospect.email}`} variant="light">Email</ActionButton> : <ActionButton variant="light">No email</ActionButton>}
            </div>
          </Panel>

          <Panel title="Set Next Action" subtitle="No prospect should exist without a next action.">
            <form action={updateProspectNextAction} style={formStyle}>
              <input type="hidden" name="prospect_id" value={prospect.id} />
              <input name="next_action" defaultValue={prospect.next_action || ''} placeholder="Example: Call decision maker and confirm need" style={inputStyle} />
              <input name="next_action_at" type="datetime-local" style={inputStyle} />
              <button type="submit" style={buttonStyle}>Update Next Action</button>
            </form>
          </Panel>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18, alignItems: 'start' }}>
          <Panel title="Create Task" subtitle="Turn prospect intent into accountable execution.">
            <form action={createProspectRoomTask} style={formStyle}>
              <input type="hidden" name="prospect_id" value={prospect.id} />
              <input type="hidden" name="owner_id" value={prospect.owner_id || ''} />
              <input name="title" required placeholder="Task title" style={inputStyle} />
              <textarea name="description" rows={3} placeholder="Instructions / expected outcome" style={inputStyle} />
              <select name="priority" defaultValue="medium" style={inputStyle}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select>
              <input name="due_at" type="datetime-local" style={inputStyle} />
              <button type="submit" style={buttonStyle}>Create Linked Task</button>
            </form>
          </Panel>

          <Panel title="Log Interaction" subtitle="Call, WhatsApp, email, objection, decision, or follow-up.">
            <form action={logProspectRoomAction} style={formStyle}>
              <input type="hidden" name="prospect_id" value={prospect.id} />
              <select name="action_type" defaultValue="call" style={inputStyle}><option value="call">Call</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="objection">Objection</option><option value="decision">Decision</option><option value="follow_up">Follow-up</option></select>
              <textarea name="outcome" rows={3} placeholder="What happened?" style={inputStyle} />
              <input name="next_action" placeholder="Optional next action" style={inputStyle} />
              <input name="next_action_at" type="datetime-local" style={inputStyle} />
              <button type="submit" style={buttonStyle}>Log Action</button>
            </form>
          </Panel>

          <Panel title="Schedule Appointment" subtitle="Create meeting and automatically update next action.">
            <form action={createProspectAppointment} style={formStyle}>
              <input type="hidden" name="prospect_id" value={prospect.id} />
              <input type="hidden" name="owner_id" value={prospect.owner_id || ''} />
              <input name="title" placeholder="Meeting title" style={inputStyle} />
              <input name="scheduled_at" type="datetime-local" required style={inputStyle} />
              <textarea name="notes" rows={3} placeholder="Meeting objective / prep notes" style={inputStyle} />
              <button type="submit" style={buttonStyle}>Schedule Meeting</button>
            </form>
          </Panel>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
          <Panel title="Prospect Notes" subtitle="Add qualitative context: objection, decision-maker insight, pricing sensitivity, family context.">
            <form action={addProspectRoomNote} style={formStyle}>
              <input type="hidden" name="prospect_id" value={prospect.id} />
              <select name="note_type" defaultValue="general" style={inputStyle}><option value="general">General</option><option value="objection">Objection</option><option value="decision_maker">Decision maker</option><option value="pricing">Pricing</option><option value="family_context">Family context</option><option value="partnership_context">Partnership context</option></select>
              <textarea name="content" rows={4} required placeholder="Write operational note..." style={inputStyle} />
              <button type="submit" style={buttonStyle}>Add Note</button>
            </form>
            <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
              {(notes || []).length ? (notes || []).slice(0, 6).map((note: any) => <TimelineRow key={note.id} icon="📝" title={note.note_type || 'Note'} text={note.content} date={note.created_at} />) : <EmptyState title="No notes" text="Add the first prospect note." />}
            </div>
          </Panel>

          <Panel title="Linked Tasks" subtitle="Execution objects connected to this prospect.">
            <div style={{ display: 'grid', gap: 10 }}>
              {(tasks || []).length ? (tasks || []).slice(0, 8).map((task: any) => (
                <a key={task.id} href={`/revenue-command-center/tasks/${task.id}`} style={taskRowStyle}>
                  <div><strong>{task.title || 'Untitled task'}</strong><p>{task.description || 'No description.'}</p></div>
                  <Badge tone={task.status === 'completed' ? '#16a34a' : '#2563eb'}>{task.status || 'open'}</Badge>
                </a>
              )) : <EmptyState title="No linked tasks" text="Create tasks from this action room to make the prospect operational." />}
            </div>
          </Panel>
        </section>

        <Panel title="Full Prospect Timeline" subtitle="Everything that happened around this prospect: actions, notes, system logs.">
          {timeline.length ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }}>{timeline.slice(0, 24).map((item: any) => <TimelineRow key={item.id} icon={item.icon} title={item.title} text={item.text} date={item.date} />)}</div> : <EmptyState title="No activity yet" text="Activity will appear as agents work this prospect." />}
        </Panel>
      </div>
    </AppShell>
  )
}

function actionIcon(type?: string) {
  if (type === 'call') return '☎️'
  if (type === 'whatsapp') return '💬'
  if (type === 'email') return '✉️'
  if (type === 'appointment_created') return '📅'
  if (type === 'task_created') return '✅'
  if (type === 'objection') return '⚠️'
  if (type === 'decision') return '🎯'
  return '🧾'
}

function actionLabel(type?: string) {
  return String(type || 'interaction').replaceAll('_', ' ').toUpperCase()
}

const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, padding: 30, borderRadius: 32, color: '#fff', background: 'radial-gradient(circle at top left,#2563eb,#020617 68%)', boxShadow: '0 28px 70px rgba(15,23,42,.22)' }
const badgeRowStyle: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 38, fontWeight: 950 }
const heroTextStyle: React.CSSProperties = { margin: '10px 0 0', color: '#dbeafe', fontWeight: 750, maxWidth: 760, lineHeight: 1.6 }
const heroPanelStyle: React.CSSProperties = { minWidth: 280, display: 'grid', gap: 7, padding: 20, borderRadius: 24, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)' }
const infoGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }
const contactActionStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }
const formStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: 13, borderRadius: 13, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontWeight: 750 }
const buttonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, padding: '13px 16px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const taskRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', textDecoration: 'none' }
