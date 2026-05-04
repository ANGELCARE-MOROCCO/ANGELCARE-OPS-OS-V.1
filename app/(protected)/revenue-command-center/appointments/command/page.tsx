import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/*
  AngelCare Revenue Command Center — Appointments Command
  Drop-in file:
  app/(protected)/revenue-command-center/appointments/command/page.tsx

  Safe design choices:
  - No external primitive imports, so no path/export errors.
  - No schema changes required.
  - Reads appointments/prospects/users/tasks with select('*').
  - Actions only update common appointment fields: status, notes, updated_at.
*/

type AnyRow = Record<string, any>

type Appointment = AnyRow & {
  id: string
  title?: string | null
  status?: string | null
  linked_type?: string | null
  related_type?: string | null
  linked_id?: string | null
  related_id?: string | null
  prospect_id?: string | null
  owner_id?: string | null
  assigned_to?: string | null
  starts_at?: string | null
  scheduled_at?: string | null
  ends_at?: string | null
  location?: string | null
  notes?: string | null
  created_at?: string | null
}

function appointmentTime(a: Appointment) {
  return a.starts_at || a.scheduled_at || a.start_at || a.date || a.created_at || null
}

function appointmentOwner(a: Appointment) {
  return a.owner_id || a.assigned_to || a.user_id || null
}

function appointmentLinkedId(a: Appointment) {
  return a.linked_id || a.related_id || a.prospect_id || null
}

function normalizeStatus(status?: string | null) {
  return String(status || 'scheduled').toLowerCase()
}

function isDone(a: Appointment) {
  const s = normalizeStatus(a.status)
  return ['done', 'completed', 'closed', 'finished'].includes(s)
}

function isCancelled(a: Appointment) {
  const s = normalizeStatus(a.status)
  return ['cancelled', 'canceled', 'lost', 'no_show'].includes(s)
}

function isUpcoming(a: Appointment) {
  const t = appointmentTime(a)
  if (!t || isDone(a) || isCancelled(a)) return false
  return new Date(t).getTime() >= Date.now()
}

function isOverdue(a: Appointment) {
  const t = appointmentTime(a)
  if (!t || isDone(a) || isCancelled(a)) return false
  return new Date(t).getTime() < Date.now()
}

function isToday(a: Appointment) {
  const t = appointmentTime(a)
  if (!t) return false
  const d = new Date(t)
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

function isNext7Days(a: Appointment) {
  const t = appointmentTime(a)
  if (!t || !isUpcoming(a)) return false
  const ts = new Date(t).getTime()
  const max = Date.now() + 7 * 24 * 60 * 60 * 1000
  return ts <= max
}

function fmtDate(value?: string | null) {
  if (!value) return 'No date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Invalid date'
  return date.toLocaleString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function shortDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function getMeetingType(a: Appointment) {
  const text = `${a.title || ''} ${a.notes || ''}`.toLowerCase()
  if (text.includes('offer') || text.includes('proposal')) return 'Offer Discussion'
  if (text.includes('partner') || text.includes('clinic') || text.includes('hospital')) return 'Partnership'
  if (text.includes('closing') || text.includes('close')) return 'Closing'
  if (text.includes('follow')) return 'Follow-up'
  if (text.includes('qualification') || text.includes('qualify')) return 'Qualification'
  return 'Appointment'
}

function getChannel(a: Appointment) {
  const text = `${a.title || ''} ${a.location || ''} ${a.notes || ''}`.toLowerCase()
  if (text.includes('whatsapp')) return 'WhatsApp'
  if (text.includes('phone') || text.includes('call')) return 'Call'
  if (text.includes('video') || text.includes('meet') || text.includes('zoom')) return 'Video'
  if (text.includes('office') || text.includes('home') || text.includes('clinic')) return 'Physical'
  return 'To confirm'
}

function prepScore(a: Appointment) {
  let score = 0
  if (a.title) score += 20
  if (appointmentTime(a)) score += 20
  if (appointmentOwner(a)) score += 20
  if (appointmentLinkedId(a)) score += 20
  if (a.notes && String(a.notes).length > 20) score += 20
  return score
}

function toneForStatus(a: Appointment) {
  if (isDone(a)) return { bg: '#dcfce7', fg: '#166534', label: 'Done' }
  if (isCancelled(a)) return { bg: '#fee2e2', fg: '#991b1b', label: 'Cancelled' }
  if (isOverdue(a)) return { bg: '#ffedd5', fg: '#9a3412', label: 'Needs review' }
  if (isToday(a)) return { bg: '#dbeafe', fg: '#1d4ed8', label: 'Today' }
  return { bg: '#f1f5f9', fg: '#334155', label: normalizeStatus(a.status) }
}

async function markAppointmentDone(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const id = String(formData.get('appointment_id') || '')
  const currentNotes = String(formData.get('current_notes') || '')
  const outcome = String(formData.get('outcome') || 'Marked done from Appointments Command')
  if (!id) throw new Error('Appointment id missing')

  const stamped = `[${new Date().toISOString()}] OUTCOME: ${outcome}`
  const notes = currentNotes ? `${currentNotes}\n\n${stamped}` : stamped

  const { error } = await supabase
    .from('bd_appointments')
    .update({ status: 'completed', notes, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/revenue-command-center/appointments/command')
}

async function cancelAppointment(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const id = String(formData.get('appointment_id') || '')
  const currentNotes = String(formData.get('current_notes') || '')
  const reason = String(formData.get('reason') || 'Cancelled from Appointments Command')
  if (!id) throw new Error('Appointment id missing')

  const stamped = `[${new Date().toISOString()}] CANCELLED: ${reason}`
  const notes = currentNotes ? `${currentNotes}\n\n${stamped}` : stamped

  const { error } = await supabase
    .from('bd_appointments')
    .update({ status: 'cancelled', notes, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/revenue-command-center/appointments/command')
}

async function logAppointmentOutcome(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const id = String(formData.get('appointment_id') || '')
  const currentNotes = String(formData.get('current_notes') || '')
  const outcome = String(formData.get('outcome') || '').trim()
  const nextStep = String(formData.get('next_step') || '').trim()
  if (!id) throw new Error('Appointment id missing')
  if (!outcome) throw new Error('Outcome is required')

  const stamped = `[${new Date().toISOString()}] OUTCOME: ${outcome}${nextStep ? ` | NEXT STEP: ${nextStep}` : ''}`
  const notes = currentNotes ? `${currentNotes}\n\n${stamped}` : stamped

  const { error } = await supabase
    .from('bd_appointments')
    .update({ notes, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/revenue-command-center/appointments/command')
}

async function createFollowUpTask(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const appointmentId = String(formData.get('appointment_id') || '')
  const title = String(formData.get('title') || '').trim()
  const dueAt = String(formData.get('due_at') || '') || null
  const description = String(formData.get('description') || '')
  const ownerId = String(formData.get('owner_id') || '') || null

  if (!appointmentId) throw new Error('Appointment id missing')
  if (!title) throw new Error('Follow-up task title is required')

  const { error } = await supabase.from('bd_tasks').insert([{
    title,
    description,
    status: 'open',
    priority: 'high',
    assigned_to: ownerId,
    linked_type: 'appointment',
    linked_id: appointmentId,
    related_type: 'appointment',
    related_id: appointmentId,
    due_at: dueAt,
  }])

  if (error) throw new Error(error.message)
  revalidatePath('/revenue-command-center/appointments/command')
}

export default async function AppointmentsCommandPage() {
  const supabase = await createClient()

  const [appointmentsRes, prospectsRes, usersRes, tasksRes] = await Promise.all([
    supabase.from('bd_appointments').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('bd_prospects').select('*').limit(500),
    supabase.from('app_users').select('id, full_name, username, role').limit(200),
    supabase.from('bd_tasks').select('*').order('created_at', { ascending: false }).limit(300),
  ])

  const appointments = (appointmentsRes.data || []) as Appointment[]
  const prospects = (prospectsRes.data || []) as AnyRow[]
  const users = (usersRes.data || []) as AnyRow[]
  const tasks = (tasksRes.data || []) as AnyRow[]

  const today = appointments.filter(isToday).sort(sortByTimeAsc)
  const overdue = appointments.filter(isOverdue).sort(sortByTimeAsc)
  const upcoming7 = appointments.filter(isNext7Days).sort(sortByTimeAsc)
  const active = appointments.filter((a) => !isDone(a) && !isCancelled(a))
  const completed = appointments.filter(isDone)
  const weakPrep = active.filter((a) => prepScore(a) < 60)
  const noOwner = active.filter((a) => !appointmentOwner(a))
  const needsOutcome = overdue.filter((a) => !String(a.notes || '').toLowerCase().includes('outcome'))

  const ownerLoad = users.map((u) => {
    const count = active.filter((a) => appointmentOwner(a) === u.id).length
    return { user: u, count }
  }).filter((x) => x.count > 0).sort((a, b) => b.count - a.count).slice(0, 6)

  const focus = needsOutcome[0] || overdue[0] || today[0] || upcoming7[0] || active[0]

  return (
    <AppShell
      title="Appointments Command"
      subtitle="Supervisor operating board for appointments, preparation quality, execution follow-up, and agent control."
      breadcrumbs={[
        { label: 'Revenue Command', href: '/revenue-command-center' },
        { label: 'Appointments', href: '/revenue-command-center/appointments' },
        { label: 'Command' },
      ]}
      actions={
        <>
          <PageAction href="/revenue-command-center/appointments" variant="light">Appointments</PageAction>
          <PageAction href="/revenue-command-center/tasks/new">New Task</PageAction>
        </>
      }
    >
      <div style={pageStyle}>
        <section style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>ANGELCARE BUSINESS DEVELOPMENT</div>
            <h1 style={heroTitleStyle}>Smart Appointments Supervisor Command</h1>
            <p style={heroTextStyle}>Control today’s meetings, detect missed outcomes, protect follow-up discipline, and keep agents focused on the next executable action.</p>
          </div>
          <div style={focusBoxStyle}>
            <span style={smallLabelStyle}>Command focus</span>
            <strong style={{ fontSize: 20 }}>{focus?.title || 'No active appointment'}</strong>
            <span>{focus ? fmtDate(appointmentTime(focus)) : 'Everything is clear'}</span>
            <span style={{ opacity: .82 }}>{focus ? getMeetingType(focus) : 'No attention required'}</span>
          </div>
        </section>

        <section style={kpiGridStyle}>
          <KpiCard title="Today" value={today.length} sub="appointments" tone="#2563eb" />
          <KpiCard title="Needs Review" value={overdue.length} sub="missed or overdue" tone="#d97706" />
          <KpiCard title="Next 7 Days" value={upcoming7.length} sub="upcoming" tone="#7c3aed" />
          <KpiCard title="Weak Prep" value={weakPrep.length} sub="score below 60" tone="#dc2626" />
          <KpiCard title="Completed" value={completed.length} sub="closed meetings" tone="#16a34a" />
        </section>

        <section style={mainGridStyle}>
          <Panel title="Today Execution Board" subtitle="Every appointment that must be supervised today.">
            <List appointments={today} users={users} prospects={prospects} tasks={tasks} empty="No appointments scheduled today." compact={false} />
          </Panel>

          <div style={{ display: 'grid', gap: 16 }}>
            <Panel title="Attention Center" subtitle="Supervisor alerts that need action before the day ends.">
              <Alert label="Overdue appointments" value={overdue.length} tone="#f97316" />
              <Alert label="Missing outcome log" value={needsOutcome.length} tone="#dc2626" />
              <Alert label="Unassigned appointments" value={noOwner.length} tone="#7c3aed" />
              <Alert label="Weak preparation" value={weakPrep.length} tone="#0f172a" />
            </Panel>

            <Panel title="Agent Load" subtitle="Active appointment ownership by agent.">
              {ownerLoad.length ? ownerLoad.map((item) => (
                <div key={item.user.id} style={loadRowStyle}>
                  <span>{item.user.full_name || item.user.username || 'User'}</span>
                  <strong>{item.count}</strong>
                </div>
              )) : <EmptyLine text="No active assigned appointments." />}
            </Panel>
          </div>
        </section>

        <section style={twoColStyle}>
          <Panel title="Needs Outcome Logging" subtitle="Past appointments without a clear recorded decision or next step.">
            <List appointments={needsOutcome.slice(0, 10)} users={users} prospects={prospects} tasks={tasks} empty="No missing outcomes detected." compact />
          </Panel>

          <Panel title="Next 7 Days Agenda" subtitle="Upcoming meetings that need preparation and ownership.">
            <List appointments={upcoming7.slice(0, 12)} users={users} prospects={prospects} tasks={tasks} empty="No upcoming appointments in the next 7 days." compact />
          </Panel>
        </section>

        <Panel title="All Active Appointment Cards" subtitle="Corporate command view: type, channel, preparation, linked prospect, owner, and supervisor actions.">
          <div style={cardsGridStyle}>
            {active.length ? active.slice(0, 36).map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} users={users} prospects={prospects} tasks={tasks} />
            )) : <EmptyLine text="No active appointments." />}
          </div>
        </Panel>
      </div>
    </AppShell>
  )
}

function sortByTimeAsc(a: Appointment, b: Appointment) {
  return new Date(appointmentTime(a) || 0).getTime() - new Date(appointmentTime(b) || 0).getTime()
}

function findOwner(appointment: Appointment, users: AnyRow[]) {
  const ownerId = appointmentOwner(appointment)
  return users.find((u) => u.id === ownerId)
}

function findProspect(appointment: Appointment, prospects: AnyRow[]) {
  const id = appointmentLinkedId(appointment)
  return prospects.find((p) => p.id === id)
}

function linkedTasksCount(appointment: Appointment, tasks: AnyRow[]) {
  return tasks.filter((t) => t.linked_id === appointment.id || t.related_id === appointment.id).length
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section style={panelStyle}>
      <div style={{ marginBottom: 14 }}>
        <h2 style={panelTitleStyle}>{title}</h2>
        {subtitle ? <p style={panelSubStyle}>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  )
}

function KpiCard({ title, value, sub, tone }: { title: string; value: number | string; sub: string; tone: string }) {
  return (
    <div style={kpiCardStyle}>
      <span style={{ ...kpiDotStyle, background: tone }} />
      <div style={kpiTitleStyle}>{title}</div>
      <strong style={kpiValueStyle}>{value}</strong>
      <small style={kpiSubStyle}>{sub}</small>
    </div>
  )
}

function Badge({ children, tone = '#334155' }: { children: React.ReactNode; tone?: string }) {
  return <span style={{ ...badgeStyle, background: `${tone}18`, color: tone }}>{children}</span>
}

function Alert({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div style={alertStyle}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><i style={{ ...alertDotStyle, background: tone }} />{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function EmptyLine({ text }: { text: string }) {
  return <div style={emptyStyle}>{text}</div>
}

function List({ appointments, users, prospects, tasks, empty, compact }: { appointments: Appointment[]; users: AnyRow[]; prospects: AnyRow[]; tasks: AnyRow[]; empty: string; compact?: boolean }) {
  if (!appointments.length) return <EmptyLine text={empty} />
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {appointments.map((appointment) => (
        <MiniAppointment key={appointment.id} appointment={appointment} users={users} prospects={prospects} tasks={tasks} compact={compact} />
      ))}
    </div>
  )
}

function MiniAppointment({ appointment, users, prospects, tasks, compact }: { appointment: Appointment; users: AnyRow[]; prospects: AnyRow[]; tasks: AnyRow[]; compact?: boolean }) {
  const owner = findOwner(appointment, users)
  const prospect = findProspect(appointment, prospects)
  const tone = toneForStatus(appointment)
  return (
    <a href={`/revenue-command-center/appointments/${appointment.id}`} style={miniCardStyle}>
      <div>
        <strong>{appointment.title || 'Untitled appointment'}</strong>
        <p style={miniTextStyle}>{fmtDate(appointmentTime(appointment))} · {getMeetingType(appointment)} · {getChannel(appointment)}</p>
        {!compact ? <p style={miniTextStyle}>{prospect?.name || prospect?.company_name || 'No linked prospect'} · {owner?.full_name || owner?.username || 'Unassigned'} · {linkedTasksCount(appointment, tasks)} task(s)</p> : null}
      </div>
      <Badge tone={tone.fg}>{tone.label}</Badge>
    </a>
  )
}

function AppointmentCard({ appointment, users, prospects, tasks }: { appointment: Appointment; users: AnyRow[]; prospects: AnyRow[]; tasks: AnyRow[] }) {
  const owner = findOwner(appointment, users)
  const prospect = findProspect(appointment, prospects)
  const tone = toneForStatus(appointment)
  const score = prepScore(appointment)
  const linkedTaskCount = linkedTasksCount(appointment, tasks)
  const linkedId = appointmentLinkedId(appointment)

  return (
    <article style={appointmentCardStyle}>
      <div style={cardTopStyle}>
        <Badge tone={tone.fg}>{tone.label}</Badge>
        <Badge tone={score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626'}>Prep {score}%</Badge>
      </div>

      <h3 style={cardTitleStyle}>{appointment.title || 'Untitled appointment'}</h3>
      <p style={cardMetaStyle}>{fmtDate(appointmentTime(appointment))}</p>

      <div style={badgeRowStyle}>
        <Badge tone="#2563eb">{getMeetingType(appointment)}</Badge>
        <Badge tone="#7c3aed">{getChannel(appointment)}</Badge>
        <Badge tone="#0f172a">{linkedTaskCount} task(s)</Badge>
      </div>

      <div style={detailGridStyle}>
        <Info label="Owner" value={owner?.full_name || owner?.username || 'Unassigned'} />
        <Info label="Prospect" value={prospect?.name || prospect?.company_name || 'Not linked'} />
        <Info label="Location" value={appointment.location || 'To confirm'} />
        <Info label="Created" value={shortDate(appointment.created_at)} />
      </div>

      {appointment.notes ? <p style={notesStyle}>{String(appointment.notes).slice(0, 180)}</p> : <p style={notesStyle}>No preparation notes yet. Supervisor should require objective, expected outcome, and next step.</p>}

      <div style={actionsGridStyle}>
        <a href={`/revenue-command-center/appointments/${appointment.id}`} style={lightButtonStyle}>Open</a>
        {linkedId ? <a href={`/revenue-command-center/prospects/${linkedId}`} style={lightButtonStyle}>Prospect</a> : <span style={disabledButtonStyle}>No Prospect</span>}
      </div>

      <form action={logAppointmentOutcome} style={formStyle}>
        <input type="hidden" name="appointment_id" value={appointment.id} />
        <input type="hidden" name="current_notes" value={appointment.notes || ''} />
        <input name="outcome" placeholder="Outcome / decision" style={inputStyle} />
        <input name="next_step" placeholder="Next step" style={inputStyle} />
        <button type="submit" style={buttonStyle}>Log Outcome</button>
      </form>

      <form action={createFollowUpTask} style={formStyle}>
        <input type="hidden" name="appointment_id" value={appointment.id} />
        <input type="hidden" name="owner_id" value={appointmentOwner(appointment) || ''} />
        <input name="title" placeholder="Follow-up task title" style={inputStyle} />
        <input name="due_at" type="datetime-local" style={inputStyle} />
        <textarea name="description" rows={2} placeholder="Task instructions" style={inputStyle} />
        <button type="submit" style={secondaryButtonStyle}>Create Follow-up Task</button>
      </form>

      <div style={actionsGridStyle}>
        <form action={markAppointmentDone}>
          <input type="hidden" name="appointment_id" value={appointment.id} />
          <input type="hidden" name="current_notes" value={appointment.notes || ''} />
          <input type="hidden" name="outcome" value="Marked completed by supervisor." />
          <button type="submit" style={successButtonStyle}>Mark Done</button>
        </form>
        <form action={cancelAppointment}>
          <input type="hidden" name="appointment_id" value={appointment.id} />
          <input type="hidden" name="current_notes" value={appointment.notes || ''} />
          <input type="hidden" name="reason" value="Cancelled by supervisor." />
          <button type="submit" style={dangerButtonStyle}>Cancel</button>
        </form>
      </div>
    </article>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoBoxStyle}>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  )
}

const pageStyle: React.CSSProperties = { display: 'grid', gap: 18 }
const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 22, padding: 32, borderRadius: 34, color: '#fff', background: 'radial-gradient(circle at top left,#2563eb,#020617 72%)', boxShadow: '0 30px 80px rgba(15,23,42,.24)' }
const eyebrowStyle: React.CSSProperties = { fontSize: 12, letterSpacing: 2, fontWeight: 950, color: '#bfdbfe' }
const heroTitleStyle: React.CSSProperties = { margin: '8px 0 8px', fontSize: 38, lineHeight: 1.05, fontWeight: 950 }
const heroTextStyle: React.CSSProperties = { margin: 0, color: '#dbeafe', fontWeight: 750, maxWidth: 780, lineHeight: 1.6 }
const focusBoxStyle: React.CSSProperties = { minWidth: 290, display: 'grid', gap: 7, padding: 20, borderRadius: 24, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)' }
const smallLabelStyle: React.CSSProperties = { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, color: '#bfdbfe', fontWeight: 900 }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 12 }
const kpiCardStyle: React.CSSProperties = { position: 'relative', overflow: 'hidden', padding: 18, borderRadius: 24, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 14px 35px rgba(15,23,42,.06)' }
const kpiDotStyle: React.CSSProperties = { position: 'absolute', top: 0, left: 0, right: 0, height: 4 }
const kpiTitleStyle: React.CSSProperties = { fontSize: 12, textTransform: 'uppercase', color: '#64748b', fontWeight: 950, letterSpacing: 1 }
const kpiValueStyle: React.CSSProperties = { display: 'block', marginTop: 8, fontSize: 34, color: '#0f172a' }
const kpiSubStyle: React.CSSProperties = { color: '#64748b', fontWeight: 800 }
const mainGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.4fr .8fr', gap: 18, alignItems: 'start' }
const twoColStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }
const panelStyle: React.CSSProperties = { padding: 18, borderRadius: 28, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 14px 35px rgba(15,23,42,.06)' }
const panelTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 18, fontWeight: 950 }
const panelSubStyle: React.CSSProperties = { margin: '5px 0 0', color: '#64748b', fontWeight: 700, lineHeight: 1.5 }
const alertStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 900, marginBottom: 8 }
const alertDotStyle: React.CSSProperties = { width: 10, height: 10, borderRadius: 999 }
const loadRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: 12, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 850, marginBottom: 8 }
const emptyStyle: React.CSSProperties = { padding: 18, borderRadius: 18, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 800 }
const miniCardStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: 14, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0', textDecoration: 'none', color: '#0f172a' }
const miniTextStyle: React.CSSProperties = { margin: '4px 0 0', color: '#64748b', fontWeight: 750, fontSize: 13 }
const cardsGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }
const appointmentCardStyle: React.CSSProperties = { display: 'grid', gap: 12, padding: 16, borderRadius: 24, background: '#f8fafc', border: '1px solid #e2e8f0' }
const cardTopStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }
const cardTitleStyle: React.CSSProperties = { margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 950 }
const cardMetaStyle: React.CSSProperties = { margin: 0, color: '#475569', fontWeight: 850 }
const badgeRowStyle: React.CSSProperties = { display: 'flex', gap: 7, flexWrap: 'wrap' }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', width: 'fit-content', padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 950 }
const detailGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }
const infoBoxStyle: React.CSSProperties = { padding: 10, borderRadius: 14, background: '#fff', border: '1px solid #e2e8f0', display: 'grid', gap: 4, color: '#0f172a' }
const notesStyle: React.CSSProperties = { margin: 0, padding: 12, borderRadius: 16, background: '#fff', border: '1px solid #e2e8f0', color: '#475569', fontWeight: 700, lineHeight: 1.5 }
const formStyle: React.CSSProperties = { display: 'grid', gap: 8 }
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: 11, borderRadius: 12, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 750 }
const buttonStyle: React.CSSProperties = { border: 'none', borderRadius: 13, padding: '12px 14px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const secondaryButtonStyle: React.CSSProperties = { ...buttonStyle, background: '#2563eb' }
const successButtonStyle: React.CSSProperties = { ...buttonStyle, width: '100%', background: '#16a34a' }
const dangerButtonStyle: React.CSSProperties = { ...buttonStyle, width: '100%', background: '#dc2626' }
const lightButtonStyle: React.CSSProperties = { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '11px 12px', borderRadius: 13, background: '#fff', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 950, textDecoration: 'none' }
const disabledButtonStyle: React.CSSProperties = { ...lightButtonStyle, color: '#94a3b8' }
const actionsGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }